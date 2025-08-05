/**
 * PostgreSQL Connector with CDC Support
 * AdminGriffe - Sistema de Auditoría Integral
 */

import { Client } from 'pg';
import { logger } from '../../services/logger.js';
import { IDatabaseConnector, DatabaseConfig, CDCEvent, DatabaseEngine } from './connector.factory.js';

export class PostgresConnector implements IDatabaseConnector {
  private client: Client;
  private config: DatabaseConfig;
  private cdcClient?: Client;
  private isConnected = false;
  private cdcActive = false;
  private cdcCallback?: (event: CDCEvent) => void;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.client = new Client({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      ...config.options
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.isConnected = true;
      
      logger.info('PostgreSQL connector established', {
        host: this.config.host,
        database: this.config.database
      });

      // Setup logical replication slot for CDC
      await this.setupCDCInfrastructure();
    } catch (error) {
      logger.error('Failed to connect to PostgreSQL', { error, config: this.config });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.cdcActive) {
        await this.stopCDC();
      }

      if (this.cdcClient) {
        await this.cdcClient.end();
      }

      if (this.isConnected) {
        await this.client.end();
        this.isConnected = false;
      }

      logger.info('PostgreSQL connector disconnected', {
        host: this.config.host,
        database: this.config.database
      });
    } catch (error) {
      logger.error('Error disconnecting PostgreSQL', { error });
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.query('SELECT 1 as health');
      return result.rows.length > 0 && result.rows[0].health === 1;
    } catch (error) {
      logger.error('PostgreSQL health check failed', { error });
      return false;
    }
  }

  async executeQuery(query: string, params: any[] = []): Promise<any> {
    try {
      const result = await this.client.query(query, params);
      logger.debug('PostgreSQL query executed', { 
        query: query.substring(0, 100),
        rowCount: result.rowCount 
      });
      return result;
    } catch (error) {
      logger.error('PostgreSQL query failed', { error, query: query.substring(0, 100) });
      throw error;
    }
  }

  async startCDC(callback: (event: CDCEvent) => void): Promise<void> {
    try {
      this.cdcCallback = callback;
      
      // Create separate connection for CDC
      this.cdcClient = new Client({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
        ...this.config.options
      });

      await this.cdcClient.connect();

      // Start logical replication
      await this.startLogicalReplication();
      
      this.cdcActive = true;
      logger.info('PostgreSQL CDC started', { database: this.config.database });
    } catch (error) {
      logger.error('Failed to start PostgreSQL CDC', { error });
      throw error;
    }
  }

  async stopCDC(): Promise<void> {
    try {
      this.cdcActive = false;
      
      if (this.cdcClient) {
        await this.cdcClient.end();
        this.cdcClient = undefined;
      }

      logger.info('PostgreSQL CDC stopped', { database: this.config.database });
    } catch (error) {
      logger.error('Error stopping PostgreSQL CDC', { error });
    }
  }

  getEngine(): DatabaseEngine {
    return 'postgres';
  }

  getConnectionInfo(): DatabaseConfig {
    return { ...this.config };
  }

  /**
   * Setup CDC infrastructure (replication slot, publication)
   */
  private async setupCDCInfrastructure(): Promise<void> {
    try {
      const slotName = `admingriffe_slot_${this.config.database}`;
      const publicationName = `admingriffe_pub_${this.config.database}`;

      // Check if replication slot exists
      const slotResult = await this.client.query(
        'SELECT slot_name FROM pg_replication_slots WHERE slot_name = $1',
        [slotName]
      );

      if (slotResult.rows.length === 0) {
        // Create replication slot
        await this.client.query(
          `SELECT pg_create_logical_replication_slot('${slotName}', 'wal2json')`
        );
        logger.info('Created logical replication slot', { slotName });
      }

      // Check if publication exists
      const pubResult = await this.client.query(
        'SELECT pubname FROM pg_publication WHERE pubname = $1',
        [publicationName]
      );

      if (pubResult.rows.length === 0) {
        // Create publication for all tables
        await this.client.query(
          `CREATE PUBLICATION ${publicationName} FOR ALL TABLES`
        );
        logger.info('Created publication', { publicationName });
      }

    } catch (error) {
      logger.warn('CDC infrastructure setup failed (may already exist)', { error });
    }
  }

  /**
   * Start logical replication and process changes
   */
  private async startLogicalReplication(): Promise<void> {
    const slotName = `admingriffe_slot_${this.config.database}`;
    
    try {
      // Start replication
      const query = `START_REPLICATION SLOT ${slotName} LOGICAL 0/0`;
      
      // This would typically use a streaming replication protocol
      // For simplicity, we'll poll the slot periodically
      this.pollReplicationSlot(slotName);
      
    } catch (error) {
      logger.error('Failed to start logical replication', { error });
      throw error;
    }
  }

  /**
   * Poll replication slot for changes
   */
  private async pollReplicationSlot(slotName: string): Promise<void> {
    const pollInterval = 1000; // 1 second

    const poll = async () => {
      if (!this.cdcActive || !this.cdcClient) {
        return;
      }

      try {
        // Get changes from replication slot
        const result = await this.cdcClient.query(
          `SELECT lsn, data FROM pg_logical_slot_get_changes('${slotName}', NULL, NULL)`
        );

        for (const row of result.rows) {
          await this.processWALRecord(row.data);
        }

        // Schedule next poll
        setTimeout(poll, pollInterval);
      } catch (error) {
        logger.error('Error polling replication slot', { error });
        // Retry after delay
        setTimeout(poll, pollInterval * 2);
      }
    };

    // Start polling
    setTimeout(poll, pollInterval);
  }

  /**
   * Process WAL record and convert to CDC event
   */
  private async processWALRecord(walData: string): Promise<void> {
    try {
      const change = JSON.parse(walData);
      
      if (!change.change || !Array.isArray(change.change)) {
        return;
      }

      for (const changeRecord of change.change) {
        const event: CDCEvent = {
          id: `pg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          database: this.config.database,
          schema: changeRecord.schema,
          table: changeRecord.table,
          operation: changeRecord.kind === 'insert' ? 'INSERT' : 
                    changeRecord.kind === 'update' ? 'UPDATE' : 'DELETE',
          before: changeRecord.oldkeys ? this.convertColumnData(changeRecord.oldkeys) : undefined,
          after: changeRecord.columnvalues ? this.convertColumnData(changeRecord.columnvalues) : undefined,
          primaryKey: this.extractPrimaryKey(changeRecord),
          metadata: {
            lsn: change.nextlsn,
            timestamp: change.timestamp,
            schema: changeRecord.schema
          }
        };

        if (this.cdcCallback) {
          await this.cdcCallback(event);
        }
      }
    } catch (error) {
      logger.error('Error processing WAL record', { error, walData });
    }
  }

  /**
   * Convert column data from WAL format
   */
  private convertColumnData(columns: any[]): Record<string, any> {
    const data: Record<string, any> = {};
    
    for (const column of columns) {
      data[column.name] = column.value;
    }
    
    return data;
  }

  /**
   * Extract primary key from change record
   */
  private extractPrimaryKey(changeRecord: any): Record<string, any> {
    const pk: Record<string, any> = {};
    
    // Try to get from oldkeys (for UPDATE/DELETE)
    if (changeRecord.oldkeys) {
      for (const key of changeRecord.oldkeys) {
        if (key.name.includes('id') || key.name.includes('pk')) {
          pk[key.name] = key.value;
        }
      }
    }
    
    // Try to get from columnvalues (for INSERT/UPDATE)
    if (changeRecord.columnvalues && Object.keys(pk).length === 0) {
      for (const column of changeRecord.columnvalues) {
        if (column.name.includes('id') || column.name.includes('pk')) {
          pk[column.name] = column.value;
        }
      }
    }
    
    return pk;
  }

  /**
   * Get CDC status
   */
  async getCDCStatus(): Promise<{
    active: boolean;
    slotName: string;
    lag: number;
    lastActivity?: Date;
  }> {
    try {
      const slotName = `admingriffe_slot_${this.config.database}`;
      
      const result = await this.client.query(`
        SELECT 
          active,
          restart_lsn,
          confirmed_flush_lsn,
          EXTRACT(EPOCH FROM (now() - last_msg_send_time)) as lag_seconds
        FROM pg_replication_slots 
        WHERE slot_name = $1
      `, [slotName]);

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          active: this.cdcActive && row.active,
          slotName,
          lag: row.lag_seconds || 0,
          lastActivity: row.last_msg_send_time ? new Date(row.last_msg_send_time) : undefined
        };
      }

      return {
        active: false,
        slotName,
        lag: 0
      };
    } catch (error) {
      logger.error('Error getting CDC status', { error });
      return {
        active: false,
        slotName: `admingriffe_slot_${this.config.database}`,
        lag: 0
      };
    }
  }
}