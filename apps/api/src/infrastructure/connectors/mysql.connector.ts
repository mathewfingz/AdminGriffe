/**
 * MySQL Connector with CDC Support (Binlog)
 * AdminGriffe - Sistema de Auditoría Integral
 */

import mysql from 'mysql2/promise';
import { logger } from '../../services/logger.js';
import { IDatabaseConnector, DatabaseConfig, CDCEvent, DatabaseEngine } from './connector.factory.js';

export class MySQLConnector implements IDatabaseConnector {
  private connection!: mysql.Connection;
  private config: DatabaseConfig;
  private cdcConnection?: mysql.Connection;
  private isConnected = false;
  private cdcActive = false;
  private cdcCallback?: (event: CDCEvent) => void;
  private binlogPosition?: { file: string; position: number };

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      this.connection = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl as mysql.SslOptions | undefined ? {} : false,
        ...this.config.options
      });

      this.isConnected = true;
      
      logger.info('MySQL connector established', {
        host: this.config.host,
        database: this.config.database
      });

      // Setup binlog for CDC
      await this.setupCDCInfrastructure();
    } catch (error) {
      logger.error('Failed to connect to MySQL', { error, config: this.config });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.cdcActive) {
        await this.stopCDC();
      }

      if (this.cdcConnection) {
        await this.cdcConnection.end();
      }

      if (this.isConnected) {
        await this.connection.end();
        this.isConnected = false;
      }

      logger.info('MySQL connector disconnected', {
        host: this.config.host,
        database: this.config.database
      });
    } catch (error) {
      logger.error('Error disconnecting MySQL', { error });
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const [rows] = await this.connection.execute('SELECT 1 as health');
      return Array.isArray(rows) && rows.length > 0;
    } catch (error) {
      logger.error('MySQL health check failed', { error });
      return false;
    }
  }

  async executeQuery(query: string, params: any[] = []): Promise<any> {
    try {
      const [rows, fields] = await this.connection.execute(query, params);
      logger.debug('MySQL query executed', { 
        query: query.substring(0, 100),
        rowCount: Array.isArray(rows) ? rows.length : 0
      });
      return { rows, fields };
    } catch (error) {
      logger.error('MySQL query failed', { error, query: query.substring(0, 100) });
      throw error;
    }
  }

  async startCDC(callback: (event: CDCEvent) => void): Promise<void> {
    try {
      this.cdcCallback = callback;
      
      // Create separate connection for CDC
      this.cdcConnection = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl ? {} : false,
        ...this.config.options
      });

      // Get current binlog position
      await this.getCurrentBinlogPosition();

      // Start binlog monitoring
      await this.startBinlogMonitoring();
      
      this.cdcActive = true;
      logger.info('MySQL CDC started', { database: this.config.database });
    } catch (error) {
      logger.error('Failed to start MySQL CDC', { error });
      throw error;
    }
  }

  async stopCDC(): Promise<void> {
    try {
      this.cdcActive = false;
      
      if (this.cdcConnection) {
        await this.cdcConnection.end();
        this.cdcConnection = undefined;
      }

      logger.info('MySQL CDC stopped', { database: this.config.database });
    } catch (error) {
      logger.error('Error stopping MySQL CDC', { error });
    }
  }

  getEngine(): DatabaseEngine {
    return 'mysql';
  }

  getConnectionInfo(): DatabaseConfig {
    return { ...this.config };
  }

  /**
   * Setup CDC infrastructure (binlog configuration)
   */
  private async setupCDCInfrastructure(): Promise<void> {
    try {
      // Check if binlog is enabled
      const [rows] = await this.connection.execute(
        "SHOW VARIABLES LIKE 'log_bin'"
      ) as any;

      if (rows.length === 0 || rows[0].Value !== 'ON') {
        logger.warn('MySQL binlog is not enabled. CDC may not work properly.');
      }

      // Check binlog format
      const [formatRows] = await this.connection.execute(
        "SHOW VARIABLES LIKE 'binlog_format'"
      ) as any;

      if (formatRows.length > 0 && formatRows[0].Value !== 'ROW') {
        logger.warn('MySQL binlog format is not ROW. CDC may not capture all changes.');
      }

      logger.info('MySQL CDC infrastructure checked', {
        binlogEnabled: rows.length > 0 && rows[0].Value === 'ON',
        binlogFormat: formatRows.length > 0 ? formatRows[0].Value : 'unknown'
      });

    } catch (error) {
      logger.warn('CDC infrastructure setup failed', { error });
    }
  }

  /**
   * Get current binlog position
   */
  private async getCurrentBinlogPosition(): Promise<void> {
    try {
      const [rows] = await this.connection.execute('SHOW MASTER STATUS') as any;
      
      if (rows.length > 0) {
        this.binlogPosition = {
          file: rows[0].File,
          position: rows[0].Position
        };
        
        logger.info('Current binlog position', this.binlogPosition);
      }
    } catch (error) {
      logger.error('Failed to get binlog position', { error });
    }
  }

  /**
   * Start binlog monitoring (simplified implementation)
   * Note: In production, you would use mysql-binlog-connector-java or similar
   */
  private async startBinlogMonitoring(): Promise<void> {
    // This is a simplified implementation
    // In production, you would use a proper binlog reader
    this.pollBinlogChanges();
  }

  /**
   * Poll for binlog changes (simplified approach)
   */
  private async pollBinlogChanges(): Promise<void> {
    const pollInterval = 2000; // 2 seconds

    const poll = async () => {
      if (!this.cdcActive || !this.cdcConnection) {
        return;
      }

      try {
        // Get recent changes from information_schema
        // This is a fallback approach - real implementation would read binlog directly
        await this.checkRecentChanges();

        // Schedule next poll
        setTimeout(poll, pollInterval);
      } catch (error) {
        logger.error('Error polling binlog changes', { error });
        // Retry after delay
        setTimeout(poll, pollInterval * 2);
      }
    };

    // Start polling
    setTimeout(poll, pollInterval);
  }

  /**
   * Check for recent changes using information_schema
   * This is a fallback approach for demonstration
   */
  private async checkRecentChanges(): Promise<void> {
    try {
      // Get tables that have been modified recently
      const [tables] = await this.cdcConnection!.execute(`
        SELECT 
          table_name,
          update_time,
          table_rows
        FROM information_schema.tables 
        WHERE table_schema = ? 
        AND update_time > DATE_SUB(NOW(), INTERVAL 5 SECOND)
      `, [this.config.database]) as any;

      for (const table of tables) {
        // This is a simplified approach - in reality you'd parse actual binlog events
        await this.simulateCDCEvent(table.table_name);
      }
    } catch (error) {
      logger.debug('Error checking recent changes', { error });
    }
  }

  /**
   * Simulate CDC event (for demonstration)
   * In production, this would parse actual binlog events
   */
  private async simulateCDCEvent(tableName: string): Promise<void> {
    try {
      // Get recent records (this is just for demonstration)
      const [rows] = await this.cdcConnection!.execute(
        `SELECT * FROM ${tableName} ORDER BY id DESC LIMIT 1`
      ) as any;

      if (rows.length > 0) {
        const record = rows[0];
        
        const event: CDCEvent = {
          id: `mysql_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          database: this.config.database,
          table: tableName,
          operation: 'UPDATE', // Simplified - would determine from binlog
          after: record,
          primaryKey: { id: record.id },
          metadata: {
            binlogFile: this.binlogPosition?.file,
            binlogPosition: this.binlogPosition?.position,
            timestamp: new Date().toISOString()
          }
        };

        if (this.cdcCallback) {
          await this.cdcCallback(event);
        }
      }
    } catch (error) {
      logger.debug('Error simulating CDC event', { error, tableName });
    }
  }

  /**
   * Get CDC status
   */
  async getCDCStatus(): Promise<{
    active: boolean;
    binlogEnabled: boolean;
    binlogFormat: string;
    currentPosition?: { file: string; position: number };
    lag: number;
  }> {
    try {
      // Check binlog status
      const [binlogRows] = await this.connection.execute(
        "SHOW VARIABLES LIKE 'log_bin'"
      ) as any;

      const [formatRows] = await this.connection.execute(
        "SHOW VARIABLES LIKE 'binlog_format'"
      ) as any;

      // Get current position
      const [positionRows] = await this.connection.execute(
        'SHOW MASTER STATUS'
      ) as any;

      let currentPosition;
      if (positionRows.length > 0) {
        currentPosition = {
          file: positionRows[0].File,
          position: positionRows[0].Position
        };
      }

      return {
        active: this.cdcActive,
        binlogEnabled: binlogRows.length > 0 && binlogRows[0].Value === 'ON',
        binlogFormat: formatRows.length > 0 ? formatRows[0].Value : 'unknown',
        currentPosition,
        lag: 0 // Would calculate based on binlog position difference
      };
    } catch (error) {
      logger.error('Error getting CDC status', { error });
      return {
        active: false,
        binlogEnabled: false,
        binlogFormat: 'unknown',
        lag: 0
      };
    }
  }

  /**
   * Execute batch operations
   */
  async executeBatch(queries: Array<{ query: string; params?: any[] }>): Promise<any[]> {
    const results = [];
    
    try {
      await this.connection.beginTransaction();
      
      for (const { query, params = [] } of queries) {
        const result = await this.connection.execute(query, params);
        results.push(result);
      }
      
      await this.connection.commit();
      
      logger.debug('MySQL batch executed successfully', { 
        queryCount: queries.length 
      });
      
      return results;
    } catch (error) {
      await this.connection.rollback();
      logger.error('MySQL batch execution failed', { error });
      throw error;
    }
  }

  /**
   * Get table schema information
   */
  async getTableSchema(tableName: string): Promise<any> {
    try {
      const [columns] = await this.connection.execute(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          column_key,
          extra
        FROM information_schema.columns 
        WHERE table_schema = ? AND table_name = ?
        ORDER BY ordinal_position
      `, [this.config.database, tableName]) as any;

      return columns;
    } catch (error) {
      logger.error('Error getting table schema', { error, tableName });
      throw error;
    }
  }
}