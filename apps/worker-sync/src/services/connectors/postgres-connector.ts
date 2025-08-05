import { Pool, PoolClient } from 'pg';
import { DatabaseConnector, CdcEvent, DatabaseSource } from '../../types';
import { logger } from '../../utils/logger';

export class PostgresConnector implements DatabaseConnector {
  public readonly source: DatabaseSource = 'postgres';
  private pool: Pool;

  constructor(private connectionString: string) {
    this.pool = new Pool({
      connectionString: this.connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      logger.info('✅ PostgreSQL connection established');
    } catch (error) {
      logger.error('💥 Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('✅ PostgreSQL connection closed');
    } catch (error) {
      logger.error('💥 Error closing PostgreSQL connection:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      logger.error('❌ PostgreSQL health check failed:', error);
      return false;
    }
  }

  async applyChange(event: CdcEvent): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      switch (event.operation) {
        case 'INSERT':
          await this.handleInsert(client, event);
          break;
        case 'UPDATE':
          await this.handleUpdate(client, event);
          break;
        case 'DELETE':
          await this.handleDelete(client, event);
          break;
        default:
          throw new Error(`Unsupported operation: ${event.operation}`);
      }

      await client.query('COMMIT');
      logger.debug(`✅ Applied ${event.operation} to ${event.table}`);

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`❌ Failed to apply change to ${event.table}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async handleInsert(client: PoolClient, event: CdcEvent): Promise<void> {
    if (!event.newData) {
      throw new Error('No new data for INSERT operation');
    }

    const columns = Object.keys(event.newData);
    const values = Object.values(event.newData);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const query = `
      INSERT INTO ${event.schema ? `${event.schema}.` : ''}${event.table} 
      (${columns.join(', ')}) 
      VALUES (${placeholders})
      ON CONFLICT DO NOTHING
    `;

    await client.query(query, values);
  }

  private async handleUpdate(client: PoolClient, event: CdcEvent): Promise<void> {
    if (!event.newData || !event.primaryKey) {
      throw new Error('Missing data for UPDATE operation');
    }

    const setClause = Object.keys(event.newData)
      .map((col, index) => `${col} = $${index + 1}`)
      .join(', ');

    const whereClause = Object.keys(event.primaryKey)
      .map((col, index) => `${col} = $${Object.keys(event.newData).length + index + 1}`)
      .join(' AND ');

    const query = `
      UPDATE ${event.schema ? `${event.schema}.` : ''}${event.table} 
      SET ${setClause}
      WHERE ${whereClause}
    `;

    const values = [...Object.values(event.newData), ...Object.values(event.primaryKey)];
    await client.query(query, values);
  }

  private async handleDelete(client: PoolClient, event: CdcEvent): Promise<void> {
    if (!event.primaryKey) {
      throw new Error('Missing primary key for DELETE operation');
    }

    const whereClause = Object.keys(event.primaryKey)
      .map((col, index) => `${col} = $${index + 1}`)
      .join(' AND ');

    const query = `
      DELETE FROM ${event.schema ? `${event.schema}.` : ''}${event.table} 
      WHERE ${whereClause}
    `;

    const values = Object.values(event.primaryKey);
    await client.query(query, values);
  }

  async getLastSyncTimestamp(): Promise<Date | null> {
    try {
      const client = await this.pool.connect();
      const result = await client.query(
        'SELECT last_sync_timestamp FROM sync_metadata WHERE source = $1',
        ['postgres']
      );
      client.release();

      return result.rows[0]?.last_sync_timestamp || null;
    } catch (error) {
      logger.error('❌ Failed to get last sync timestamp:', error);
      return null;
    }
  }

  async setLastSyncTimestamp(timestamp: Date): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query(`
        INSERT INTO sync_metadata (source, last_sync_timestamp) 
        VALUES ($1, $2)
        ON CONFLICT (source) 
        DO UPDATE SET last_sync_timestamp = $2
      `, ['postgres', timestamp]);
      client.release();
    } catch (error) {
      logger.error('❌ Failed to set last sync timestamp:', error);
      throw error;
    }
  }
}