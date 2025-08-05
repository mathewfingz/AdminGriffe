import { db } from './database';
import { rabbitmq } from './rabbitmq';
import { logger } from './logger';

// Define Operation enum to match Prisma schema
export enum Operation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export interface AuditLogEntry {
  tenantId: string;
  tableName: string;
  operation: Operation;
  recordId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

export interface ChangeEvent {
  tenantId: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  before?: Record<string, any>;
  after?: Record<string, any>;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

class AuditService {
  private static instance: AuditService;

  private constructor() {}

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Log audit entry to database
   */
  public async logAuditEntry(entry: AuditLogEntry): Promise<void> {
    try {
      // Store in audit log table using the correct model name
      const auditLog = await db.prisma.auditLog.create({
        data: {
          tenantId: entry.tenantId,
          tableName: entry.tableName,
          operation: entry.operation,
          recordId: entry.recordId,
          oldValues: entry.oldValues || undefined,
          newValues: entry.newValues || undefined,
          userId: entry.userId || null,
          userEmail: entry.userEmail || null,
          ipAddress: entry.ipAddress || null,
          userAgent: entry.userAgent || null,
        },
      });

      // Publish audit event to message queue
      await rabbitmq.publishEvent(
        'audit_logged',
        'audit',
        `${entry.tableName}-${entry.recordId}`,
        auditLog,
        entry.tenantId,
        entry.userId
      );

      logger.info('Audit entry logged', {
        tenantId: entry.tenantId,
        table: entry.tableName,
        operation: entry.operation,
        recordId: entry.recordId,
      });
    } catch (error) {
      logger.error('Failed to log audit entry', { error, entry });
      throw error;
    }
  }

  /**
   * Process change event from CDC
   */
  public async processChangeEvent(event: ChangeEvent): Promise<void> {
    const recordId = this.extractRecordId(event.after || event.before || {});
    
    const auditEntry: AuditLogEntry = {
      tenantId: event.tenantId,
      tableName: event.table,
      operation: this.mapOperation(event.operation),
      recordId,
      oldValues: event.before,
      newValues: event.after,
      userId: event.userId,
      userEmail: event.userEmail,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    };

    await this.logAuditEntry(auditEntry);
  }

  /**
   * Map operation string to Operation enum
   */
  private mapOperation(operation: string): Operation {
    switch (operation.toUpperCase()) {
      case 'INSERT':
        return Operation.CREATE;
      case 'UPDATE':
        return Operation.UPDATE;
      case 'DELETE':
        return Operation.DELETE;
      default:
        return Operation.UPDATE;
    }
  }

  /**
   * Extract record ID from record
   */
  private extractRecordId(record: Record<string, any>): string {
    // Common primary key fields
    const pkFields = ['id', 'uuid', 'pk'];
    
    for (const field of pkFields) {
      if (record[field] !== undefined) {
        return String(record[field]);
      }
    }

    // If no standard PK found, create a hash of the record
    return Buffer.from(JSON.stringify(record)).toString('base64').substring(0, 16);
  }

  /**
   * Get audit trail for specific entity
   */
  public async getAuditTrail(
    tenantId: string,
    tableName: string,
    recordId: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const { limit = 50, offset = 0, startDate, endDate } = options;

    const where: any = {
      tenantId,
      tableName,
      recordId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    return await db.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get audit statistics
   */
  public async getAuditStats(
    tenantId: string,
    timeRange: { start: Date; end: Date }
  ) {
    const where = {
      tenantId,
      createdAt: {
        gte: timeRange.start,
        lte: timeRange.end,
      },
    };

    const [
      totalOperations,
      operationsByType,
      operationsByTable,
      operationsByUser,
    ] = await Promise.all([
      db.prisma.auditLog.count({ where }),
      db.prisma.auditLog.groupBy({
        by: ['operation'],
        where,
        _count: { operation: true },
      }),
      db.prisma.auditLog.groupBy({
        by: ['tableName'],
        where,
        _count: { tableName: true },
      }),
      db.prisma.auditLog.groupBy({
        by: ['userId'],
        where: { ...where, userId: { not: null } },
        _count: { userId: true },
      }),
    ]);

    return {
      totalOperations,
      operationsByType: Object.fromEntries(
        operationsByType.map((item: any) => [item.operation, item._count.operation])
      ),
      operationsByTable: Object.fromEntries(
        operationsByTable.map((item: any) => [item.tableName, item._count.tableName])
      ),
      operationsByUser: Object.fromEntries(
        operationsByUser.map((item: any) => [item.userId || 'unknown', item._count.userId])
      ),
    };
  }

  /**
   * Create audit log for entity changes
   */
  public async auditEntityChange(
    tenantId: string,
    tableName: string,
    operation: Operation,
    recordId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    userId?: string,
    userEmail?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAuditEntry({
      tenantId,
      tableName,
      operation,
      recordId,
      oldValues,
      newValues,
      userId,
      userEmail,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Get audit logs with filtering and pagination
   */
  public async getAuditLogs(
    where: any,
    options: { limit: number; offset: number }
  ): Promise<any[]> {
    return db.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit,
      skip: options.offset,
    });
  }

  /**
   * Get audit logs count
   */
  public async getAuditLogsCount(where: any): Promise<number> {
    return db.prisma.auditLog.count({ where });
  }

  /**
   * Export audit logs to CSV
   */
  public exportToCsv(logs: any[]): string {
    const headers = [
      'ID',
      'Tenant ID',
      'Table Name',
      'Operation',
      'Record ID',
      'Old Values',
      'New Values',
      'User ID',
      'User Email',
      'IP Address',
      'User Agent',
      'Created At',
    ];

    const csvRows = [headers.join(',')];

    for (const log of logs) {
      const row = [
        log.id,
        log.tenantId,
        log.tableName,
        log.operation,
        log.recordId,
        JSON.stringify(log.oldValues || '').replace(/"/g, '""'),
        JSON.stringify(log.newValues || '').replace(/"/g, '""'),
        log.userId || '',
        log.userEmail || '',
        log.ipAddress || '',
        log.userAgent || '',
        log.createdAt.toISOString(),
      ];
      csvRows.push(row.map(field => `"${field}"`).join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Generate compliance report
   */
  public async generateComplianceReport(
    tenantId: string,
    standard: 'SOX' | 'GDPR' | 'HIPAA' | 'PCI',
    timeRange: { start: Date; end: Date }
  ): Promise<any> {
    const where = {
      tenantId,
      createdAt: {
        gte: timeRange.start,
        lte: timeRange.end,
      },
    };

    const [totalLogs, operationStats, userStats, tableStats] = await Promise.all([
      db.prisma.auditLog.count({ where }),
      db.prisma.auditLog.groupBy({
        by: ['operation'],
        where,
        _count: { operation: true },
      }),
      db.prisma.auditLog.groupBy({
        by: ['userId'],
        where: { ...where, userId: { not: null } },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
      db.prisma.auditLog.groupBy({
        by: ['tableName'],
        where,
        _count: { tableName: true },
        orderBy: { _count: { tableName: 'desc' } },
        take: 10,
      }),
    ]);

    // Compliance-specific checks
    const complianceChecks = this.getComplianceChecks(standard, {
      totalLogs,
      operationStats,
      userStats,
      tableStats,
      timeRange,
    });

    return {
      standard,
      timeRange,
      summary: {
        totalLogs,
        totalOperations: operationStats.reduce((sum: any, stat: any) => sum + stat._count.operation, 0),
        uniqueUsers: userStats.length,
        uniqueTables: tableStats.length,
      },
      operationBreakdown: operationStats,
      topUsers: userStats,
      topTables: tableStats,
      complianceChecks,
      generatedAt: new Date(),
    };
  }

  /**
   * Get compliance checks based on standard
   */
  private getComplianceChecks(standard: string, data: any): any[] {
    const checks = [];

    switch (standard) {
      case 'SOX':
        checks.push({
          name: 'Financial Data Access Logging',
          status: data.totalLogs > 0 ? 'PASS' : 'FAIL',
          description: 'All financial data access must be logged',
        });
        checks.push({
          name: 'User Activity Tracking',
          status: data.uniqueUsers > 0 ? 'PASS' : 'FAIL',
          description: 'User activities must be tracked and auditable',
        });
        break;

      case 'GDPR':
        checks.push({
          name: 'Data Processing Logging',
          status: data.totalLogs > 0 ? 'PASS' : 'FAIL',
          description: 'All personal data processing must be logged',
        });
        checks.push({
          name: 'Data Subject Rights',
          status: 'MANUAL_REVIEW',
          description: 'Verify data subject rights requests are properly logged',
        });
        break;

      case 'HIPAA':
        checks.push({
          name: 'PHI Access Logging',
          status: data.totalLogs > 0 ? 'PASS' : 'FAIL',
          description: 'All PHI access must be logged and auditable',
        });
        checks.push({
          name: 'Minimum Necessary Standard',
          status: 'MANUAL_REVIEW',
          description: 'Verify minimum necessary access principle compliance',
        });
        break;

      case 'PCI':
        checks.push({
          name: 'Cardholder Data Access',
          status: data.totalLogs > 0 ? 'PASS' : 'FAIL',
          description: 'All cardholder data access must be logged',
        });
        checks.push({
          name: 'Security Event Logging',
          status: 'MANUAL_REVIEW',
          description: 'Verify security events are properly logged',
        });
        break;
    }

    return checks;
  }
}

export { AuditService };
export const auditService = AuditService.getInstance();