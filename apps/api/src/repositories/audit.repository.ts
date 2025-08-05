/**
 * Audit Repository Implementation
 * AdminGriffe - Sistema de Auditoría Integral
 */

import { BaseRepository } from './base.repository.js';
import { DatabaseService } from '../services/database.js';
import { logger } from '../services/logger.js';

export interface AuditLog {
  id: string;
  dbEngine: string;
  schemaName?: string;
  tableName: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  primaryKey: any;
  diffOld?: any;
  diffNew?: any;
  executedBy?: string;
  clientIp?: string;
  executedAt: Date;
  signature?: Buffer;
  tenantId?: string;
}

export interface AuditQueryFilter {
  dbEngine?: string;
  tableName?: string;
  operation?: string;
  executedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  tenantId?: string;
}

/**
 * Repository for audit log operations
 */
export class AuditRepository extends BaseRepository<AuditLog> {
  constructor(db: DatabaseService, options: any = {}) {
    super(db, 'audit_log', options);
  }

  protected getModel() {
    // Use raw SQL for audit_log table since it's not in Prisma schema
    return {
      findUnique: async (params: any) => {
        const result = await this.db.prisma.$queryRaw`
          SELECT * FROM audit_log WHERE id = ${params.where.id}
        `;
        return Array.isArray(result) && result.length > 0 ? result[0] : null;
      },
      findMany: async (params: any) => {
        let query = 'SELECT * FROM audit_log';
        const conditions = [];
        const values = [];

        if (params.where) {
          if (params.where.tenantId) {
            conditions.push(`tenant_id = $${values.length + 1}`);
            values.push(params.where.tenantId);
          }
          if (params.where.tableName) {
            conditions.push(`table_name = $${values.length + 1}`);
            values.push(params.where.tableName);
          }
          if (params.where.operation) {
            conditions.push(`operation = $${values.length + 1}`);
            values.push(params.where.operation);
          }
        }

        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY executed_at DESC';

        if (params.take) {
          query += ` LIMIT ${params.take}`;
        }
        if (params.skip) {
          query += ` OFFSET ${params.skip}`;
        }

        return await this.db.prisma.$queryRawUnsafe(query, ...values);
      },
      create: async (params: any) => {
        const data = params.data;
        const result = await this.db.prisma.$queryRaw`
          INSERT INTO audit_log (
            db_engine, schema_name, table_name, operation,
            primary_key, diff_old, diff_new, executed_by,
            client_ip, tenant_id
          ) VALUES (
            ${data.dbEngine}, ${data.schemaName}, ${data.tableName},
            ${data.operation}, ${JSON.stringify(data.primaryKey)},
            ${data.diffOld ? JSON.stringify(data.diffOld) : null},
            ${data.diffNew ? JSON.stringify(data.diffNew) : null},
            ${data.executedBy}, ${data.clientIp}, ${data.tenantId}
          ) RETURNING *
        `;
        return Array.isArray(result) && result.length > 0 ? result[0] : null;
      },
      update: async () => {
        throw new Error('Audit logs are immutable and cannot be updated');
      },
      delete: async () => {
        throw new Error('Audit logs are immutable and cannot be deleted');
      },
      count: async (params: any) => {
        let query = 'SELECT COUNT(*) as count FROM audit_log';
        const conditions = [];
        const values = [];

        if (params.where) {
          if (params.where.tenantId) {
            conditions.push(`tenant_id = $${values.length + 1}`);
            values.push(params.where.tenantId);
          }
        }

        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }

        const result = await this.db.prisma.$queryRawUnsafe(query, ...values);
        return Array.isArray(result) && result.length > 0 ? Number(result[0].count) : 0;
      },
      createMany: async (params: any) => {
        const items = params.data;
        let count = 0;
        
        for (const item of items) {
          await this.db.prisma.$queryRaw`
            INSERT INTO audit_log (
              db_engine, schema_name, table_name, operation,
              primary_key, diff_old, diff_new, executed_by,
              client_ip, tenant_id
            ) VALUES (
              ${item.dbEngine}, ${item.schemaName}, ${item.tableName},
              ${item.operation}, ${JSON.stringify(item.primaryKey)},
              ${item.diffOld ? JSON.stringify(item.diffOld) : null},
              ${item.diffNew ? JSON.stringify(item.diffNew) : null},
              ${item.executedBy}, ${item.clientIp}, ${item.tenantId}
            )
          `;
          count++;
        }
        
        return { count };
      }
    };
  }

  /**
   * Find audit logs with advanced filtering
   */
  async findWithFilter(filter: AuditQueryFilter): Promise<AuditLog[]> {
    try {
      let query = `
        SELECT 
          id, db_engine, schema_name, table_name, operation,
          primary_key, diff_old, diff_new, executed_by,
          client_ip, executed_at, signature, tenant_id
        FROM audit_log
      `;
      
      const conditions = [];
      const values = [];

      if (filter.tenantId) {
        conditions.push(`tenant_id = $${values.length + 1}`);
        values.push(filter.tenantId);
      }

      if (filter.dbEngine) {
        conditions.push(`db_engine = $${values.length + 1}`);
        values.push(filter.dbEngine);
      }

      if (filter.tableName) {
        conditions.push(`table_name = $${values.length + 1}`);
        values.push(filter.tableName);
      }

      if (filter.operation) {
        conditions.push(`operation = $${values.length + 1}`);
        values.push(filter.operation);
      }

      if (filter.executedBy) {
        conditions.push(`executed_by = $${values.length + 1}`);
        values.push(filter.executedBy);
      }

      if (filter.dateFrom) {
        conditions.push(`executed_at >= $${values.length + 1}`);
        values.push(filter.dateFrom);
      }

      if (filter.dateTo) {
        conditions.push(`executed_at <= $${values.length + 1}`);
        values.push(filter.dateTo);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY executed_at DESC LIMIT 1000';

      const results = await this.db.prisma.$queryRawUnsafe(query, ...values);
      
      logger.debug('AuditRepository.findWithFilter', {
        filter,
        resultCount: Array.isArray(results) ? results.length : 0
      });

      return Array.isArray(results) ? results : [];
    } catch (error) {
      logger.error('AuditRepository.findWithFilter failed', { error, filter });
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async getStatistics(tenantId?: string): Promise<any> {
    try {
      let query = `
        SELECT 
          db_engine,
          table_name,
          operation,
          COUNT(*) as count,
          DATE_TRUNC('day', executed_at) as date
        FROM audit_log
      `;

      const values = [];
      if (tenantId) {
        query += ` WHERE tenant_id = $${values.length + 1}`;
        values.push(tenantId);
      }

      query += `
        GROUP BY db_engine, table_name, operation, DATE_TRUNC('day', executed_at)
        ORDER BY date DESC, count DESC
        LIMIT 100
      `;

      const results = await this.db.prisma.$queryRawUnsafe(query, ...values);
      
      logger.debug('AuditRepository.getStatistics', {
        tenantId,
        resultCount: Array.isArray(results) ? results.length : 0
      });

      return Array.isArray(results) ? results : [];
    } catch (error) {
      logger.error('AuditRepository.getStatistics failed', { error, tenantId });
      throw error;
    }
  }

  /**
   * Verify audit integrity using digital signatures
   */
  async verifyIntegrity(id: string): Promise<boolean> {
    try {
      const result = await this.db.prisma.$queryRaw`
        SELECT verify_audit_integrity(${id}) as is_valid
      `;
      
      const isValid = Array.isArray(result) && result.length > 0 ? result[0].is_valid : false;
      
      logger.debug('AuditRepository.verifyIntegrity', { id, isValid });
      return isValid;
    } catch (error) {
      logger.error('AuditRepository.verifyIntegrity failed', { error, id });
      return false;
    }
  }

  /**
   * Get audit trail for a specific record
   */
  async getRecordTrail(
    tableName: string, 
    primaryKey: any, 
    tenantId?: string
  ): Promise<AuditLog[]> {
    try {
      let query = `
        SELECT * FROM audit_log 
        WHERE table_name = $1 AND primary_key = $2
      `;
      const values = [tableName, JSON.stringify(primaryKey)];

      if (tenantId) {
        query += ` AND tenant_id = $${values.length + 1}`;
        values.push(tenantId);
      }

      query += ' ORDER BY executed_at ASC';

      const results = await this.db.prisma.$queryRawUnsafe(query, ...values);
      
      logger.debug('AuditRepository.getRecordTrail', {
        tableName,
        primaryKey,
        tenantId,
        resultCount: Array.isArray(results) ? results.length : 0
      });

      return Array.isArray(results) ? results : [];
    } catch (error) {
      logger.error('AuditRepository.getRecordTrail failed', {
        error,
        tableName,
        primaryKey,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Export audit logs for compliance
   */
  async exportForCompliance(
    filter: AuditQueryFilter,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const logs = await this.findWithFilter(filter);
      
      if (format === 'csv') {
        const headers = [
          'ID', 'DB Engine', 'Schema', 'Table', 'Operation',
          'Primary Key', 'Old Values', 'New Values', 'Executed By',
          'Client IP', 'Executed At', 'Tenant ID'
        ];
        
        const csvRows = [headers.join(',')];
        
        for (const log of logs) {
          const row = [
            log.id,
            log.dbEngine,
            log.schemaName || '',
            log.tableName,
            log.operation,
            JSON.stringify(log.primaryKey),
            log.diffOld ? JSON.stringify(log.diffOld) : '',
            log.diffNew ? JSON.stringify(log.diffNew) : '',
            log.executedBy || '',
            log.clientIp || '',
            log.executedAt.toISOString(),
            log.tenantId || ''
          ].map(field => `"${String(field).replace(/"/g, '""')}"`);
          
          csvRows.push(row.join(','));
        }
        
        return csvRows.join('\n');
      }
      
      return JSON.stringify(logs, null, 2);
    } catch (error) {
      logger.error('AuditRepository.exportForCompliance failed', { error, filter, format });
      throw error;
    }
  }
}