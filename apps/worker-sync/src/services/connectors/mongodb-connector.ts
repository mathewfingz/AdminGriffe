import { MongoClient, Db, Collection } from 'mongodb';
import { DatabaseConnector, CdcEvent, DatabaseSource } from '../../types';
import { logger } from '../../utils/logger';

export class MongoDBConnector implements DatabaseConnector {
  public readonly source: DatabaseSource = 'mongodb';
  private client: MongoClient;
  private db: Db | null = null;

  constructor(private connectionString: string) {
    this.client = new MongoClient(this.connectionString, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db();
      await this.db.admin().ping();
      logger.info('✅ MongoDB connection established');
    } catch (error) {
      logger.error('💥 Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.close();
      logger.info('✅ MongoDB connection closed');
    } catch (error) {
      logger.error('💥 Error closing MongoDB connection:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.db) return false;
      await this.db.admin().ping();
      return true;
    } catch (error) {
      logger.error('❌ MongoDB health check failed:', error);
      return false;
    }
  }

  async applyChange(event: CdcEvent): Promise<void> {
    if (!this.db) {
      throw new Error('MongoDB not connected');
    }

    const collection = this.db.collection(event.table);

    try {
      switch (event.operation) {
        case 'INSERT':
          await this.handleInsert(collection, event);
          break;
        case 'UPDATE':
          await this.handleUpdate(collection, event);
          break;
        case 'DELETE':
          await this.handleDelete(collection, event);
          break;
        default:
          throw new Error(`Unsupported operation: ${event.operation}`);
      }

      logger.debug(`✅ Applied ${event.operation} to ${event.table}`);

    } catch (error) {
      logger.error(`❌ Failed to apply change to ${event.table}:`, error);
      throw error;
    }
  }

  private async handleInsert(collection: Collection, event: CdcEvent): Promise<void> {
    if (!event.newData) {
      throw new Error('No new data for INSERT operation');
    }

    // Convert primary key to MongoDB _id if needed
    const document = { ...event.newData };
    if (event.primaryKey && Object.keys(event.primaryKey).length === 1) {
      const pkField = Object.keys(event.primaryKey)[0];
      if (pkField !== '_id') {
        document._id = event.primaryKey[pkField];
      }
    }

    try {
      await collection.insertOne(document);
    } catch (error: any) {
      // Ignore duplicate key errors
      if (error.code !== 11000) {
        throw error;
      }
    }
  }

  private async handleUpdate(collection: Collection, event: CdcEvent): Promise<void> {
    if (!event.newData || !event.primaryKey) {
      throw new Error('Missing data for UPDATE operation');
    }

    const filter = this.buildFilter(event.primaryKey);
    const update = { $set: event.newData };

    await collection.updateOne(filter, update, { upsert: true });
  }

  private async handleDelete(collection: Collection, event: CdcEvent): Promise<void> {
    if (!event.primaryKey) {
      throw new Error('Missing primary key for DELETE operation');
    }

    const filter = this.buildFilter(event.primaryKey);
    await collection.deleteOne(filter);
  }

  private buildFilter(primaryKey: Record<string, any>): Record<string, any> {
    // Convert primary key to MongoDB filter
    if (Object.keys(primaryKey).length === 1) {
      const pkField = Object.keys(primaryKey)[0];
      if (pkField === 'id' || pkField.endsWith('_id')) {
        return { _id: primaryKey[pkField] };
      }
    }
    return primaryKey;
  }

  async getLastSyncTimestamp(): Promise<Date | null> {
    try {
      if (!this.db) return null;
      
      const collection = this.db.collection('sync_metadata');
      const doc = await collection.findOne({ source: 'mongodb' });
      
      return doc?.last_sync_timestamp || null;
    } catch (error) {
      logger.error('❌ Failed to get last sync timestamp:', error);
      return null;
    }
  }

  async setLastSyncTimestamp(timestamp: Date): Promise<void> {
    try {
      if (!this.db) throw new Error('MongoDB not connected');
      
      const collection = this.db.collection('sync_metadata');
      await collection.updateOne(
        { source: 'mongodb' },
        { $set: { source: 'mongodb', last_sync_timestamp: timestamp } },
        { upsert: true }
      );
    } catch (error) {
      logger.error('❌ Failed to set last sync timestamp:', error);
      throw error;
    }
  }
}