import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Consumer, KafkaMessage, EachMessagePayload, SASLOptions } from 'kafkajs';
import { logger } from '../../services/logger';
import { MetricsService } from '../observability/metrics.service';
import { CircuitBreakerManager } from '../common/circuit-breaker';

export interface KafkaConfig {
  clientId: string;
  brokers: string[];
  ssl?: boolean;
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
  connectionTimeout?: number;
  requestTimeout?: number;
  retry?: {
    initialRetryTime?: number;
    retries?: number;
  };
}

export interface ProducerMessage {
  topic: string;
  key?: string;
  value: string | Buffer;
  partition?: number;
  headers?: Record<string, string>;
  timestamp?: string;
}

export interface ConsumerConfig {
  groupId: string;
  topics: string[];
  fromBeginning?: boolean;
  autoCommit?: boolean;
  sessionTimeout?: number;
  heartbeatInterval?: number;
}

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumers = new Map<string, Consumer>();
  private isConnected = false;

  constructor(
    private readonly config: KafkaConfig,
    private readonly metricsService?: MetricsService
  ) {
    this.kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.brokers,
      ssl: this.config.ssl,
      sasl: this.config.sasl,
      connectionTimeout: this.config.connectionTimeout || 3000,
      requestTimeout: this.config.requestTimeout || 30000,
      retry: {
        initialRetryTime: this.config.retry?.initialRetryTime || 100,
        retries: this.config.retry?.retries || 8
      }
    });

    this.producer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000
    });
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  /**
   * Connect to Kafka
   */
  async connect(): Promise<void> {
    const circuitBreaker = CircuitBreakerManager.getBreaker('kafka-connection', {
      failureThreshold: 3,
      recoveryTimeout: 10000
    });

    try {
      await circuitBreaker.execute(async () => {
        await this.producer.connect();
        this.isConnected = true;
        logger.info('Kafka producer connected successfully');
      });
    } catch (error) {
      logger.error('Failed to connect to Kafka', { error });
      throw error;
    }
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    try {
      // Disconnect all consumers
      for (const [groupId, consumer] of this.consumers) {
        await consumer.disconnect();
        logger.info('Kafka consumer disconnected', { groupId });
      }
      this.consumers.clear();

      // Disconnect producer
      if (this.isConnected) {
        await this.producer.disconnect();
        this.isConnected = false;
        logger.info('Kafka producer disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting from Kafka', { error });
    }
  }

  /**
   * Send a single message
   */
  async sendMessage(message: ProducerMessage): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka producer is not connected');
    }

    const circuitBreaker = CircuitBreakerManager.getBreaker('kafka-producer', {
      failureThreshold: 5,
      recoveryTimeout: 5000
    });

    const startTime = Date.now();

    try {
      await circuitBreaker.execute(async () => {
        await this.producer.send({
          topic: message.topic,
          messages: [{
            key: message.key,
            value: message.value,
            partition: message.partition,
            headers: message.headers,
            timestamp: message.timestamp
          }]
        });
      });

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService?.recordPerformanceMetric('kafka_send_duration', duration, {
        topic: message.topic
      });

      logger.debug('Message sent to Kafka', { 
        topic: message.topic, 
        key: message.key,
        duration 
      });
    } catch (error) {
      this.metricsService?.recordError('kafka', 'send_message', error.constructor.name);
      logger.error('Failed to send message to Kafka', { 
        topic: message.topic, 
        error 
      });
      throw error;
    }
  }

  /**
   * Send multiple messages in batch
   */
  async sendBatch(messages: ProducerMessage[]): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka producer is not connected');
    }

    const circuitBreaker = CircuitBreakerManager.getBreaker('kafka-producer-batch', {
      failureThreshold: 3,
      recoveryTimeout: 10000
    });

    const startTime = Date.now();

    try {
      // Group messages by topic
      const messagesByTopic = messages.reduce((acc, message) => {
        if (!acc[message.topic]) {
          acc[message.topic] = [];
        }
        acc[message.topic].push({
          key: message.key,
          value: message.value,
          partition: message.partition,
          headers: message.headers,
          timestamp: message.timestamp
        });
        return acc;
      }, {} as Record<string, any[]>);

      await circuitBreaker.execute(async () => {
        const sendPromises = Object.entries(messagesByTopic).map(([topic, topicMessages]) =>
          this.producer.send({
            topic,
            messages: topicMessages
          })
        );

        await Promise.all(sendPromises);
      });

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService?.recordPerformanceMetric('kafka_batch_send_duration', duration, {
        message_count: messages.length.toString()
      });

      logger.info('Batch messages sent to Kafka', { 
        messageCount: messages.length,
        topics: Object.keys(messagesByTopic),
        duration 
      });
    } catch (error) {
      this.metricsService?.recordError('kafka', 'send_batch', error.constructor.name);
      logger.error('Failed to send batch messages to Kafka', { 
        messageCount: messages.length, 
        error 
      });
      throw error;
    }
  }

  /**
   * Create and start a consumer
   */
  async createConsumer(
    config: ConsumerConfig,
    messageHandler: (payload: EachMessagePayload) => Promise<void>
  ): Promise<void> {
    if (this.consumers.has(config.groupId)) {
      logger.warn('Consumer already exists for group', { groupId: config.groupId });
      return;
    }

    const consumer = this.kafka.consumer({
      groupId: config.groupId,
      sessionTimeout: config.sessionTimeout || 30000,
      heartbeatInterval: config.heartbeatInterval || 3000
    });

    const circuitBreaker = CircuitBreakerManager.getBreaker(`kafka-consumer-${config.groupId}`, {
      failureThreshold: 5,
      recoveryTimeout: 15000
    });

    try {
      await circuitBreaker.execute(async () => {
        await consumer.connect();
        await consumer.subscribe({ 
          topics: config.topics, 
          fromBeginning: config.fromBeginning || false 
        });

        await consumer.run({
          autoCommit: config.autoCommit !== false,
          eachMessage: async (payload: EachMessagePayload) => {
            const startTime = Date.now();
            
            try {
              await messageHandler(payload);
              
              const duration = (Date.now() - startTime) / 1000;
              this.metricsService?.recordPerformanceMetric('kafka_message_processing_duration', duration, {
                topic: payload.topic,
                partition: payload.partition.toString(),
                group_id: config.groupId
              });

              logger.info('Message processed successfully', {
                topic: payload.topic,
                partition: payload.partition,
                offset: payload.message.offset,
                groupId: config.groupId,
                duration
              });
            } catch (error) {
              this.metricsService?.recordError('kafka', 'message_processing', error.constructor.name);
              logger.error('Error processing Kafka message', {
                topic: payload.topic,
                partition: payload.partition,
                offset: payload.message.offset,
                groupId: config.groupId,
                error
              });
              throw error;
            }
          }
        });
      });

      this.consumers.set(config.groupId, consumer);
      logger.info('Kafka consumer created and started', { 
        groupId: config.groupId, 
        topics: config.topics 
      });
    } catch (error) {
      logger.error('Failed to create Kafka consumer', { 
        groupId: config.groupId, 
        error 
      });
      throw error;
    }
  }

  /**
   * Stop a consumer
   */
  async stopConsumer(groupId: string): Promise<void> {
    const consumer = this.consumers.get(groupId);
    if (!consumer) {
      logger.warn('Consumer not found', { groupId });
      return;
    }

    try {
      await consumer.stop();
      await consumer.disconnect();
      this.consumers.delete(groupId);
      logger.info('Kafka consumer stopped', { groupId });
    } catch (error) {
      logger.error('Failed to stop Kafka consumer', { groupId, error });
      throw error;
    }
  }

  /**
   * Get consumer status
   */
  getConsumerStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    for (const [groupId] of this.consumers) {
      status[groupId] = true; // Simplified - in real implementation, check actual status
    }
    return status;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      // Try to get metadata as a health check
      const admin = this.kafka.admin();
      await admin.connect();
      await admin.listTopics();
      await admin.disconnect();
      
      return true;
    } catch (error) {
      logger.error('Kafka health check failed', { error });
      return false;
    }
  }

  /**
   * Create topics if they don't exist
   */
  async createTopics(topics: Array<{ topic: string; numPartitions?: number; replicationFactor?: number }>): Promise<void> {
    const admin = this.kafka.admin();
    
    try {
      await admin.connect();
      
      const existingTopics = await admin.listTopics();
      const topicsToCreate = topics.filter(t => !existingTopics.includes(t.topic));
      
      if (topicsToCreate.length > 0) {
        await admin.createTopics({
          topics: topicsToCreate.map(t => ({
            topic: t.topic,
            numPartitions: t.numPartitions || 3,
            replicationFactor: t.replicationFactor || 1
          }))
        });
        
        logger.info('Kafka topics created', { 
          topics: topicsToCreate.map(t => t.topic) 
        });
      }
    } catch (error) {
      logger.error('Failed to create Kafka topics', { error });
      throw error;
    } finally {
      await admin.disconnect();
    }
  }

  /**
   * Get Kafka cluster metadata
   */
  async getMetadata(): Promise<any> {
    const admin = this.kafka.admin();
    
    try {
      await admin.connect();
      const metadata = await admin.fetchTopicMetadata();
      return metadata;
    } catch (error) {
      logger.error('Failed to fetch Kafka metadata', { error });
      throw error;
    } finally {
      await admin.disconnect();
    }
  }

  /**
   * Check if connected
   */
  isKafkaConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get active consumers count
   */
  getActiveConsumersCount(): number {
    return this.consumers.size;
  }
}