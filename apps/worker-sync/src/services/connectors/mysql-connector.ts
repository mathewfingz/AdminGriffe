import mysql from 'mysql2/promise';
import { DatabaseConnector, CdcEvent, DatabaseSource } from '../../types';
import { logger } from '../../utils/logger';

export class MySQLConnector implements DatabaseConnector {
  public readonly source: DatabaseSource = 'mysql';
  private pool: mysql.Pool;

  constructor(private connectionString: string) {
    this.pool = mysql.createPool({
      uri: this.connectionString,
      connectionLimit: 20,
      acquireTimeout: 60000,
      timeout: 60000,
    });
  }

  async connect(): Promise<void> {
    try {
      const connection = await this.pool.getConnection();
      await connection.execute('SELECT 1');
      connection.release();
      logger.info('✅ MySQL connection established');
    } catch (error) {
      logger.error('💥 Failed to connect to MySQL:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('✅ MySQL connection closed');
    } catch (error) {
      logger.error('💥 Error closing MySQL connection:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const connection = await this.pool.getConnection();
      await connection.execute('SELECT 1');
      connection.release();
      return true;
    } catch (error) {
      logger.error('❌ MySQL health check failed:', error);
      return false;
    }
  }

  async applyChange(event: CdcEvent): Promise<void> {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();

      switch (event.operation) {
        case 'INSERT':
          await this.handleInsert(connection, event);
          break;
        case 'UPDATE':
          await this.handleUpdate(connection, event);
          break;
        case 'DELETE':
          await this.handleDelete(connection, event);
          break;
        default:
          throw new Error(`Unsupported operation: ${event.operation}`);
      }

      await connection.commit();
      logger.debug(`✅ Applied ${event.operation} to ${event.table}`);

    } catch (error) {
      await connection.rollback();
      logger.error(`❌ Failed to apply change to ${event.table}:`, error);
      throw error;
    } finally {
      connection.release();
    }
  }

  private async handleInsert(connection: mysql.PoolConnection, event: CdcEvent): Promise<void> {
    if (!event.newData) {
      throw new Error('No new data for INSERT operation');
    }

    const columns = Object.keys(event.newData);
    const values = Object.values(event.newData);
    const placeholders = values.map(() => '?').join(', ');

    const query = `
      INSERT IGNORE INTO ${event.schema ? `${event.schema}.` : ''}${event.table} 
      (${columns.join(', ')}) 
      VALUES (${placeholders})
    `;

    await connection.execute(query, values);
  }

  private async handleUpdate(connection: mysql.PoolConnection, event: CdcEvent): Promise<void> {
    if (!event.newData || !event.primaryKey) {
      throw new Error('Missing data for UPDATE operation');
    }

    const setClause = Object.keys(event.newData)
      .map(col => `${col} = ?`)
      .join(', ');

    const whereClause = Object.keys(event.primaryKey)
      .map(col => `${col} = ?`)
      .join(' AND ');

    const query = `
      UPDATE ${event.schema ? `${event.schema}.` : ''}${event.table} 
      SET ${setClause}
      WHERE ${whereClause}
    `;

    const values = [...Object.values(event.newData), ...Object.values(event.primaryKey)];
    await connection.execute(query, values);
  }

  private async handleDelete(connection: mysql.PoolConnection, event: CdcEvent): Promise<void> {
    if (!event.primaryKey) {
      throw new Error('Missing primary key for DELETE operation');
    }

    const whereClause = Object.keys(event.primaryKey)
      .map(col => `${col} = ?`)
      .join(' AND ');

    const query = `
      DELETE FROM ${event.schema ? `${event.schema}.` : ''}${event.table} 
      WHERE ${whereClause}
    `;

    const values = Object.values(event.primaryKey);
    await connection.execute(query, values);
  }

  async getLastSyncTimestamp(): Promise<Date | null> {
    try {
      const connection = await this.pool.getConnection();
      const [rows] = await connection.execute(
        'SELECT last_sync_timestamp FROM sync_metadata WHERE source = ?',
        ['mysql']
      ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];
      connection.release();

      return rows[0]?.last_sync_timestamp || null;
    } catch (error) {
      logger.error('❌ Failed to get last sync timestamp:', error);
      return null;
    }
  }

  async setLastSyncTimestamp(timestamp: Date): Promise<void> {
    try {
      const connection = await this.pool.getConnection();
      await connection.execute(`
        INSERT INTO sync_metadata (source, last_sync_timestamp) 
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE last_sync_timestamp = ?
      `, ['mysql', timestamp, timestamp]);
      connection.release();
    } catch (error) {
      logger.error('❌ Failed to set last sync timestamp:', error);
      throw error;
    }
  }
}