import amqp from 'amqplib';
import { config } from '../config/index.js';

export interface EventMessage {
  tenantId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  data: any;
  timestamp: string;
  userId?: string;
  userEmail?: string;
}

class RabbitMQService {
  private static instance: RabbitMQService;
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): RabbitMQService {
    if (!RabbitMQService.instance) {
      RabbitMQService.instance = new RabbitMQService();
    }
    return RabbitMQService.instance;
  }

  public async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(config.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      
      // Setup exchange and queues
      await this.setupExchangesAndQueues();
      
      this.connection.on('error', (err) => {
        console.error('RabbitMQ Connection Error:', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        console.log('❌ RabbitMQ connection closed');
        this.isConnected = false;
      });

      console.log('✅ RabbitMQ connected');
      this.isConnected = true;
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  private async setupExchangesAndQueues(): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    // Main events exchange
    await this.channel.assertExchange('griffe.events', 'topic', { durable: true });
    
    // Dead letter exchange for failed messages
    await this.channel.assertExchange('griffe.dlx', 'direct', { durable: true });
    
    // Queues for different event types
    const queues = [
      'griffe.products',
      'griffe.orders', 
      'griffe.users',
      'griffe.notifications',
      'griffe.audit'
    ];

    for (const queueName of queues) {
      await this.channel.assertQueue(queueName, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'griffe.dlx',
          'x-dead-letter-routing-key': `${queueName}.failed`,
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      // Dead letter queue
      await this.channel.assertQueue(`${queueName}.failed`, { durable: true });
      await this.channel.bindQueue(`${queueName}.failed`, 'griffe.dlx', `${queueName}.failed`);
    }

    // Bind queues to exchange with routing patterns
    await this.channel.bindQueue('griffe.products', 'griffe.events', 'product.*');
    await this.channel.bindQueue('griffe.orders', 'griffe.events', 'order.*');
    await this.channel.bindQueue('griffe.users', 'griffe.events', 'user.*');
    await this.channel.bindQueue('griffe.notifications', 'griffe.events', '*.created');
    await this.channel.bindQueue('griffe.notifications', 'griffe.events', '*.updated');
    await this.channel.bindQueue('griffe.audit', 'griffe.events', '*.*');
  }

  /**
   * Publish an event to the exchange
   */
  public async publishEvent(
    eventType: string,
    entityType: string,
    entityId: string,
    data: any,
    tenantId: string,
    userId?: string,
    userEmail?: string
  ): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    const message: EventMessage = {
      tenantId,
      eventType,
      entityType,
      entityId,
      data,
      timestamp: new Date().toISOString(),
      userId,
      userEmail,
    };

    const routingKey = `${entityType}.${eventType}`;
    
    await this.channel.publish(
      'griffe.events',
      routingKey,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
        messageId: `${tenantId}-${entityType}-${entityId}-${Date.now()}`,
        timestamp: Date.now(),
        headers: {
          tenantId,
          eventType,
          entityType,
        },
      }
    );

    console.log(`📤 Event published: ${routingKey}`, { tenantId, entityId });
  }

  /**
   * Subscribe to events with a consumer function
   */
  public async subscribeToEvents(
    queueName: string,
    consumer: (message: EventMessage) => Promise<void>
  ): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    await this.channel.consume(queueName, async (msg: amqp.ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const message: EventMessage = JSON.parse(msg.content.toString());
        await consumer(message);
        this.channel!.ack(msg);
        console.log(`✅ Event processed: ${message.eventType}`, { 
          tenantId: message.tenantId, 
          entityId: message.entityId 
        });
      } catch (error) {
        console.error('Error processing message:', error);
        this.channel!.nack(msg, false, false); // Send to DLQ
      }
    });

    console.log(`🔄 Subscribed to queue: ${queueName}`);
  }

  /**
   * Publish product events
   */
  public async publishProductEvent(
    eventType: 'created' | 'updated' | 'deleted',
    productId: string,
    productData: any,
    tenantId: string,
    userId?: string,
    userEmail?: string
  ): Promise<void> {
    await this.publishEvent(eventType, 'product', productId, productData, tenantId, userId, userEmail);
  }

  /**
   * Publish order events
   */
  public async publishOrderEvent(
    eventType: 'created' | 'updated' | 'cancelled' | 'completed',
    orderId: string,
    orderData: any,
    tenantId: string,
    userId?: string,
    userEmail?: string
  ): Promise<void> {
    await this.publishEvent(eventType, 'order', orderId, orderData, tenantId, userId, userEmail);
  }

  /**
   * Publish user events
   */
  public async publishUserEvent(event: {
    tenantId: string;
    eventType: 'created' | 'updated' | 'deleted' | 'login';
    entityType: string;
    entityId: string;
    timestamp: string;
    userId?: string;
    userEmail?: string;
    data: any;
  }): Promise<void> {
    await this.publishEvent(
      event.eventType, 
      event.entityType, 
      event.entityId, 
      event.data, 
      event.tenantId, 
      event.userId, 
      event.userEmail
    );
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    return this.isConnected && this.connection !== null && this.channel !== null;
  }

  /**
   * Graceful shutdown
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      console.log('🔌 RabbitMQ disconnected');
    } catch (error) {
      console.error('Error disconnecting from RabbitMQ:', error);
    }
  }
}

export { RabbitMQService };
export const rabbitmq = RabbitMQService.getInstance();