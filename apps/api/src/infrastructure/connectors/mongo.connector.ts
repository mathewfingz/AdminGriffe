import { MongoClient, Db, ChangeStream, ChangeStreamDocument } from 'mongodb';
import { IDatabaseConnector, DatabaseConfig, CDCEvent } from './connector.factory';

export class MongoConnector implements IDatabaseConnector {
  private client!: MongoClient;
  private db!: Db;
  private config: DatabaseConfig;
  private isConnected = false;
  private cdcActive = false;
  private cdcCallback?: (event: CDCEvent) => void;
  private changeStream?: ChangeStream;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      const uri = `mongodb://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}/${this.config.database}`;
      
      this.client = new MongoClient(uri, {
        ssl: this.config.ssl as boolean,
        ...this.config.options
      });

      await this.client.connect();
      this.db = this.client.db(this.config.database);
      this.isConnected = true;
      
      console.log(`MongoDB connected to ${this.config.host}:${this.config.port}`);
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.changeStream) {
        await this.changeStream.close();
      }
      
      if (this.client) {
        await this.client.close();
      }
      
      this.isConnected = false;
      this.cdcActive = false;
      console.log('MongoDB disconnected');
    } catch (error) {
      console.error('MongoDB disconnect error:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }
      
      await this.client.db('admin').command({ ping: 1 });
      return true;
    } catch (error) {
      console.error('MongoDB health check failed:', error);
      return false;
    }
  }

  async executeQuery(query: string, params?: any[]): Promise<any> {
    if (!this.isConnected || !this.db) {
      throw new Error('MongoDB not connected');
    }

    try {
      // MongoDB no usa SQL, pero podemos simular operaciones básicas
      const [operation, ...rest] = query.split(' ');
      const collection = rest[1] || 'default';
      
      switch (operation.toUpperCase()) {
        case 'FIND':
          return await this.db.collection(collection).find(params?.[0] || {}).toArray();
        case 'INSERT':
          return await this.db.collection(collection).insertOne(params?.[0] || {});
        case 'UPDATE':
          return await this.db.collection(collection).updateOne(
            params?.[0] || {}, 
            { $set: params?.[1] || {} }
          );
        case 'DELETE':
          return await this.db.collection(collection).deleteOne(params?.[0] || {});
        default:
          throw new Error(`Unsupported MongoDB operation: ${operation}`);
      }
    } catch (error) {
      console.error('MongoDB query error:', error);
      throw error;
    }
  }

  async startCDC(callback: (event: CDCEvent) => void): Promise<void> {
    if (!this.isConnected || !this.db) {
      throw new Error('MongoDB not connected');
    }

    if (this.cdcActive) {
      console.log('MongoDB CDC already active');
      return;
    }

    try {
      this.cdcCallback = callback;
      
      // Configurar Change Stream para toda la base de datos
      this.changeStream = this.db.watch([], {
        fullDocument: 'updateLookup',
        fullDocumentBeforeChange: 'whenAvailable'
      });

      this.changeStream.on('change', (change: ChangeStreamDocument) => {
        this.processChangeEvent(change);
      });

      this.changeStream.on('error', (error) => {
        console.error('MongoDB Change Stream error:', error);
        this.cdcActive = false;
      });

      this.cdcActive = true;
      console.log('MongoDB CDC started successfully');
    } catch (error) {
      console.error('Failed to start MongoDB CDC:', error);
      throw error;
    }
  }

  async stopCDC(): Promise<void> {
    try {
      if (this.changeStream) {
        await this.changeStream.close();
        this.changeStream = undefined;
      }
      
      this.cdcActive = false;
      this.cdcCallback = undefined;
      console.log('MongoDB CDC stopped');
    } catch (error) {
      console.error('Failed to stop MongoDB CDC:', error);
      throw error;
    }
  }

  getEngine(): 'mongodb' {
    return 'mongodb';
  }

  getConnectionInfo(): DatabaseConfig {
    return this.config;
  }

  getCDCStatus(): any {
    return {
      active: this.cdcActive,
      connected: this.isConnected,
      hasChangeStream: !!this.changeStream,
      resumeToken: this.changeStream?.resumeToken
    };
  }

  private processChangeEvent(change: ChangeStreamDocument): void {
    if (!this.cdcCallback) return;

    try {
      // Type guard para diferentes tipos de change events
      if (change.operationType === 'invalidate' || change.operationType === 'drop') {
        return; // Skip estos eventos por ahora
      }

      const event: CDCEvent = {
        id: String(change._id),
        timestamp: new Date(),
        database: this.config.database!,
        table: (change as any).ns?.coll || 'unknown',
        operation: this.mapOperationType(change.operationType),
        before: (change as any).fullDocumentBeforeChange || undefined,
        after: (change as any).fullDocument || undefined,
        primaryKey: (change as any).documentKey || {},
        metadata: {
          resumeToken: change._id,
          clusterTime: (change as any).clusterTime,
          txnNumber: (change as any).txnNumber,
          lsid: (change as any).lsid,
          updateDescription: (change as any).updateDescription
        }
      };

      this.cdcCallback(event);
    } catch (error) {
      console.error('Error processing MongoDB change event:', error);
    }
  }

  private mapOperationType(operationType: string): 'INSERT' | 'UPDATE' | 'DELETE' {
    switch (operationType) {
      case 'insert':
        return 'INSERT';
      case 'update':
      case 'replace':
        return 'UPDATE';
      case 'delete':
        return 'DELETE';
      default:
        return 'UPDATE'; // fallback
    }
  }

  async setupCDCInfrastructure(): Promise<void> {
    if (!this.isConnected || !this.db) {
      throw new Error('MongoDB not connected');
    }

    try {
      // Verificar que la replica set esté configurada (requerido para Change Streams)
      const status = await this.client.db('admin').command({ replSetGetStatus: 1 });
      
      if (!status.ok) {
        console.warn('MongoDB replica set not configured. Change Streams require replica set.');
        return;
      }

      // Crear índices para optimizar Change Streams si es necesario
      const collections = await this.db.listCollections().toArray();
      
      for (const collection of collections) {
        const coll = this.db.collection(collection.name);
        
        // Crear índice en _id si no existe (debería existir por defecto)
        const indexes = await coll.indexes();
        const hasIdIndex = indexes.some(idx => idx.name === '_id_');
        
        if (!hasIdIndex) {
          await coll.createIndex({ _id: 1 });
        }
      }

      console.log('MongoDB CDC infrastructure setup completed');
    } catch (error) {
      console.error('Failed to setup MongoDB CDC infrastructure:', error);
      // No lanzar error ya que Change Streams pueden funcionar sin configuración adicional
    }
  }
}