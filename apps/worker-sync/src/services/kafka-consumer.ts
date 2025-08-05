import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { CdcEvent, DatabaseSource } from '../types';
import { Config } from '../config';
import { logger } from '../utils/logger';

export class KafkaConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private isRunning = false;

  constructor(
    private config: Config,
    private eventHandler: (event: CdcEvent) => Promise<void>
  ) {
    this.kafka = new Kafka({
      clientId: 'sync-worker',
      brokers: this.config.KAFKA_BROKERS.split(','),
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.consumer = this.kafka.consumer({
      groupId: 'sync-worker-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });
  }

  async start(): Promise<void> {
    try {
      logger.info('🚀 Starting Kafka consumer...');

      await this.consumer.connect();
      
      // Subscribe to CDC topics
      const topics = this.getCdcTopics();
      for (const topic of topics) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
        logger.info(`📡 Subscribed to topic: ${topic}`);
      }

      await this.consumer.run({
        eachMessage: this.handleMessage.bind(this)
      });

      this.isRunning = true;
      logger.info('✅ Kafka consumer started successfully');

    } catch (error) {
      logger.error('💥 Failed to start Kafka consumer:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      logger.info('🛑 Stopping Kafka consumer...');
      this.isRunning = false;

      await this.consumer.disconnect();
      logger.info('✅ Kafka consumer stopped successfully');

    } catch (error) {
      logger.error('💥 Error stopping Kafka consumer:', error);
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    
    try {
      if (!message.value) {
        logger.warn(`⚠️ Received empty message from ${topic}:${partition}`);
        return;
      }

      const rawEvent = JSON.parse(message.value.toString());
      const cdcEvent = this.transformToCdcEvent(rawEvent, topic);

      logger.debug(`📥 Processing CDC event: ${cdcEvent.id} from ${cdcEvent.source}`);

      await this.eventHandler(cdcEvent);

      logger.debug(`✅ CDC event processed: ${cdcEvent.id}`);

    } catch (error) {
      logger.error(`💥 Error processing message from ${topic}:${partition}:`, error);
      // Don't throw - let Kafka handle retries
    }
  }

  private transformToCdcEvent(rawEvent: any, topic: string): CdcEvent {
    // Determine source from topic name
    const source = this.getSourceFromTopic(topic);
    
    // Transform based on source format
    switch (source) {
      case 'postgres':
        return this.transformPostgresCdcEvent(rawEvent);
      case 'mysql':
        return this.transformMysqlCdcEvent(rawEvent);
      case 'mongodb':
        return this.transformMongoCdcEvent(rawEvent);
      default:
        throw new Error(`Unknown source: ${source}`);
    }
  }

  private transformPostgresCdcEvent(rawEvent: any): CdcEvent {
    // Handle wal2json format
    const change = rawEvent.change?.[0] || rawEvent;
    
    return {
      id: `pg-${change.xid || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: 'postgres',
      schema: change.schema || 'public',
      table: change.table,
      operation: this.mapOperation(change.kind),
      timestamp: new Date(change.timestamp || Date.now()),
      oldData: change.oldkeys ? this.transformColumnData(change.oldkeys) : undefined,
      newData: change.columnvalues ? this.transformColumnData(change.columnvalues) : undefined,
      primaryKey: this.extractPrimaryKey(change),
      transactionId: change.xid?.toString(),
      vectorClock: {
        sourceId: 'postgres',
        timestamp: Date.now(),
        version: change.lsn
      },
      metadata: {
        lsn: change.lsn,
        commitTime: change.timestamp
      }
    };
  }

  private transformMysqlCdcEvent(rawEvent: any): CdcEvent {
    // Handle Debezium MySQL format
    const payload = rawEvent.payload;
    
    return {
      id: `mysql-${payload.ts_ms}-${Math.random().toString(36).substr(2, 9)}`,
      source: 'mysql',
      schema: payload.source.db,
      table: payload.source.table,
      operation: this.mapOperation(payload.op),
      timestamp: new Date(payload.ts_ms),
      oldData: payload.before,
      newData: payload.after,
      primaryKey: this.extractMysqlPrimaryKey(payload),
      transactionId: payload.transaction?.id,
      vectorClock: {
        sourceId: 'mysql',
        timestamp: payload.ts_ms,
        version: payload.source.pos
      },
      metadata: {
        binlogFile: payload.source.file,
        binlogPos: payload.source.pos,
        gtid: payload.source.gtid
      }
    };
  }

  private transformMongoCdcEvent(rawEvent: any): CdcEvent {
    // Handle MongoDB Change Stream format
    const fullDocument = rawEvent.fullDocument;
    const documentKey = rawEvent.documentKey;
    
    return {
      id: `mongo-${rawEvent._id._data}`,
      source: 'mongodb',
      schema: rawEvent.ns.db,
      table: rawEvent.ns.coll,
      operation: this.mapOperation(rawEvent.operationType),
      timestamp: new Date(rawEvent.clusterTime.getHighBits() * 1000),
      oldData: rawEvent.fullDocumentBeforeChange,
      newData: fullDocument,
      primaryKey: documentKey,
      transactionId: rawEvent.txnNumber?.toString(),
      vectorClock: {
        sourceId: 'mongodb',
        timestamp: rawEvent.clusterTime.getHighBits() * 1000,
        version: rawEvent._id._data
      },
      metadata: {
        resumeToken: rawEvent._id,
        clusterTime: rawEvent.clusterTime
      }
    };
  }

  private mapOperation(op: string): 'INSERT' | 'UPDATE' | 'DELETE' {
    switch (op?.toLowerCase()) {
      case 'insert':
      case 'i':
      case 'c':
        return 'INSERT';
      case 'update':
      case 'u':
        return 'UPDATE';
      case 'delete':
      case 'd':
        return 'DELETE';
      default:
        throw new Error(`Unknown operation: ${op}`);
    }
  }

  private transformColumnData(columns: any[]): Record<string, any> {
    const data: Record<string, any> = {};
    
    for (const col of columns) {
      data[col.name] = col.value;
    }
    
    return data;
  }

  private extractPrimaryKey(change: any): Record<string, any> {
    if (change.oldkeys) {
      return this.transformColumnData(change.oldkeys);
    }
    
    if (change.columnvalues) {
      // Try to find primary key columns (this is simplified)
      const pkColumns = change.columnvalues.filter((col: any) => 
        col.name === 'id' || col.name.endsWith('_id')
      );
      return this.transformColumnData(pkColumns);
    }
    
    return {};
  }

  private extractMysqlPrimaryKey(payload: any): Record<string, any> {
    const data = payload.after || payload.before;
    if (!data) return {};
    
    // Simplified - assume 'id' is primary key
    // In production, you'd get this from schema metadata
    const pk: Record<string, any> = {};
    if (data.id !== undefined) {
      pk.id = data.id;
    }
    
    return pk;
  }

  private getSourceFromTopic(topic: string): DatabaseSource {
    if (topic.includes('postgres') || topic.includes('pg')) {
      return 'postgres';
    }
    if (topic.includes('mysql')) {
      return 'mysql';
    }
    if (topic.includes('mongo')) {
      return 'mongodb';
    }
    
    // Default fallback based on topic prefix
    if (topic.startsWith('dbz.')) {
      return 'mysql'; // Debezium default
    }
    
    throw new Error(`Cannot determine source from topic: ${topic}`);
  }

  private getCdcTopics(): string[] {
    const topics: string[] = [];
    
    // Add configured topics
    if (this.config.KAFKA_POSTGRES_TOPIC) {
      topics.push(this.config.KAFKA_POSTGRES_TOPIC);
    }
    
    if (this.config.KAFKA_MYSQL_TOPIC) {
      topics.push(this.config.KAFKA_MYSQL_TOPIC);
    }
    
    if (this.config.KAFKA_MONGODB_TOPIC) {
      topics.push(this.config.KAFKA_MONGODB_TOPIC);
    }
    
    // Default topics if none configured
    if (topics.length === 0) {
      topics.push('cdc.postgres', 'cdc.mysql', 'cdc.mongodb');
    }
    
    return topics;
  }

  getStatus(): { isRunning: boolean; topics: string[] } {
    return {
      isRunning: this.isRunning,
      topics: this.getCdcTopics()
    };
  }
}