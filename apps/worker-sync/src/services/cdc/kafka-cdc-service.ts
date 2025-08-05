import { Kafka, Consumer, KafkaMessage } from 'kafkajs';
import { CdcEvent, DatabaseSource } from '../../types';
import { logger } from '../../utils/logger';
import { config } from '../../config';

export class KafkaCdcService {
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected = false;
  private eventHandlers: Map<string, (event: CdcEvent) => Promise<void>> = new Map();

  constructor() {
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8
      },
      connectionTimeout: 3000,
      requestTimeout: 30000
    });

    this.consumer = this.kafka.consumer({
      groupId: config.kafka.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxWaitTimeInMs: 5000,
      allowAutoTopicCreation: false
    });
  }

  async connect(): Promise<void> {
    try {
      await this.consumer.connect();
      this.isConnected = true;
      logger.info('🔗 Kafka CDC Service connected');
    } catch (error) {
      logger.error('❌ Failed to connect to Kafka:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.consumer.disconnect();
        this.isConnected = false;
        logger.info('🔌 Kafka CDC Service disconnected');
      }
    } catch (error) {
      logger.error('❌ Failed to disconnect from Kafka:', error);
      throw error;
    }
  }

  async subscribe(topics: string[]): Promise<void> {
    try {
      for (const topic of topics) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
        logger.info(`📡 Subscribed to Kafka topic: ${topic}`);
      }
    } catch (error) {
      logger.error('❌ Failed to subscribe to Kafka topics:', error);
      throw error;
    }
  }

  async startConsuming(): Promise<void> {
    try {
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            await this.processMessage(topic, partition, message);
          } catch (error) {
            logger.error(`❌ Error processing message from topic ${topic}:`, error);
            // Don't throw here to avoid stopping the consumer
          }
        }
      });
      logger.info('🚀 Kafka CDC consumer started');
    } catch (error) {
      logger.error('❌ Failed to start Kafka consumer:', error);
      throw error;
    }
  }

  private async processMessage(topic: string, partition: number, message: KafkaMessage): Promise<void> {
    if (!message.value) {
      logger.warn(`⚠️ Received empty message from topic ${topic}`);
      return;
    }

    try {
      const rawData = message.value.toString();
      const cdcEvent = this.parseMessage(rawData, topic);
      
      if (!cdcEvent) {
        logger.warn(`⚠️ Failed to parse message from topic ${topic}`);
        return;
      }

      // Add metadata
      cdcEvent.metadata = {
        ...cdcEvent.metadata,
        kafka: {
          topic,
          partition,
          offset: message.offset,
          timestamp: message.timestamp
        }
      };

      // Route to appropriate handler
      const handler = this.eventHandlers.get(cdcEvent.source);
      if (handler) {
        await handler(cdcEvent);
      } else {
        logger.warn(`⚠️ No handler registered for source: ${cdcEvent.source}`);
      }

    } catch (error) {
      logger.error(`❌ Error processing Kafka message:`, error);
      throw error;
    }
  }

  private parseMessage(rawData: string, topic: string): CdcEvent | null {
    try {
      const data = JSON.parse(rawData);
      
      // Handle Debezium format
      if (data.payload && data.schema) {
        return this.parseDebeziumMessage(data, topic);
      }
      
      // Handle custom format
      if (data.operation && data.table) {
        return this.parseCustomMessage(data, topic);
      }

      logger.warn(`⚠️ Unknown message format from topic ${topic}`);
      return null;
    } catch (error) {
      logger.error(`❌ Failed to parse JSON message:`, error);
      return null;
    }
  }

  private parseDebeziumMessage(data: any, topic: string): CdcEvent | null {
    try {
      const payload = data.payload;
      const source = payload.source;
      
      let operation: 'INSERT' | 'UPDATE' | 'DELETE';
      switch (payload.op) {
        case 'c': operation = 'INSERT'; break;
        case 'u': operation = 'UPDATE'; break;
        case 'd': operation = 'DELETE'; break;
        default:
          logger.warn(`⚠️ Unknown Debezium operation: ${payload.op}`);
          return null;
      }

      const cdcEvent: CdcEvent = {
        id: `${source.db}-${source.table}-${source.ts_ms}-${Math.random()}`,
        source: this.mapSourceToDatabase(source.db, topic),
        schema: source.db,
        table: source.table,
        operation,
        timestamp: new Date(source.ts_ms),
        oldData: payload.before || undefined,
        newData: payload.after || undefined,
        primaryKey: this.extractPrimaryKey(payload.after || payload.before),
        vectorClock: {
          sourceId: source.server_id || source.name,
          timestamp: source.ts_ms,
          version: source.pos || source.lsn || 1
        },
        metadata: {
          debezium: {
            version: data.schema?.version,
            connector: source.connector,
            snapshot: source.snapshot === 'true'
          }
        }
      };

      return cdcEvent;
    } catch (error) {
      logger.error(`❌ Failed to parse Debezium message:`, error);
      return null;
    }
  }

  private parseCustomMessage(data: any, topic: string): CdcEvent | null {
    try {
      const cdcEvent: CdcEvent = {
        id: data.id || `${data.table}-${Date.now()}-${Math.random()}`,
        source: data.source || this.inferSourceFromTopic(topic),
        schema: data.schema || 'public',
        table: data.table,
        operation: data.operation,
        timestamp: new Date(data.timestamp || Date.now()),
        oldData: data.oldData,
        newData: data.newData,
        primaryKey: data.primaryKey || this.extractPrimaryKey(data.newData || data.oldData),
        vectorClock: data.vectorClock || {
          sourceId: data.source || 'unknown',
          timestamp: Date.now(),
          version: 1
        },
        metadata: data.metadata || {}
      };

      return cdcEvent;
    } catch (error) {
      logger.error(`❌ Failed to parse custom message:`, error);
      return null;
    }
  }

  private mapSourceToDatabase(dbName: string, topic: string): DatabaseSource {
    // Map database names to source types
    if (topic.includes('postgres') || topic.includes('pg')) return 'postgres';
    if (topic.includes('mysql')) return 'mysql';
    if (topic.includes('mongo')) return 'mongodb';
    
    // Fallback based on common database naming patterns
    if (dbName.includes('pg') || dbName.includes('postgres')) return 'postgres';
    if (dbName.includes('mysql') || dbName.includes('maria')) return 'mysql';
    if (dbName.includes('mongo')) return 'mongodb';
    
    return 'postgres'; // Default fallback
  }

  private inferSourceFromTopic(topic: string): DatabaseSource {
    if (topic.includes('postgres') || topic.includes('pg')) return 'postgres';
    if (topic.includes('mysql')) return 'mysql';
    if (topic.includes('mongo')) return 'mongodb';
    return 'postgres'; // Default fallback
  }

  private extractPrimaryKey(data: Record<string, any> | undefined): Record<string, any> {
    if (!data) return {};
    
    // Common primary key field names
    const pkFields = ['id', '_id', 'uuid', 'pk'];
    
    for (const field of pkFields) {
      if (data[field] !== undefined) {
        return { [field]: data[field] };
      }
    }
    
    return {};
  }

  registerEventHandler(source: DatabaseSource, handler: (event: CdcEvent) => Promise<void>): void {
    this.eventHandlers.set(source, handler);
    logger.info(`📝 Registered CDC event handler for source: ${source}`);
  }

  async getHealth(): Promise<{ status: string; details: any }> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();
      
      const metadata = await admin.fetchTopicMetadata();
      await admin.disconnect();
      
      return {
        status: this.isConnected ? 'healthy' : 'unhealthy',
        details: {
          connected: this.isConnected,
          topics: metadata.topics.length,
          brokers: config.kafka.brokers.length
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}