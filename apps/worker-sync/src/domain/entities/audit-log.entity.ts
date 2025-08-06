import { DatabaseEngine, AuditOperation } from '../../config/audit-config.js';

export interface AuditLogEntity {
  id: string;
  dbEngine: DatabaseEngine;
  schemaName?: string;
  tableName: string;
  operation: AuditOperation;
  primaryKey: Record<string, any>;
  diffOld?: Record<string, any>;
  diffNew?: Record<string, any>;
  executedBy?: string;
  clientIp?: string;
  executedAt: Date;
  signature?: Buffer;
  metadata?: Record<string, any>;
  version: number;
  checksum: string;
}

export interface AuditLogCreateInput {
  dbEngine: DatabaseEngine;
  schemaName?: string;
  tableName: string;
  operation: AuditOperation;
  primaryKey: Record<string, any>;
  diffOld?: Record<string, any>;
  diffNew?: Record<string, any>;
  executedBy?: string;
  clientIp?: string;
  metadata?: Record<string, any>;
}

export interface AuditLogFilter {
  dbEngine?: DatabaseEngine;
  schemaName?: string;
  tableName?: string;
  operation?: AuditOperation;
  executedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export class AuditLog implements AuditLogEntity {
  id: string;
  dbEngine: DatabaseEngine;
  schemaName?: string;
  tableName: string;
  operation: AuditOperation;
  primaryKey: Record<string, any>;
  diffOld?: Record<string, any>;
  diffNew?: Record<string, any>;
  executedBy?: string;
  clientIp?: string;
  executedAt: Date;
  signature?: Buffer;
  metadata?: Record<string, any>;
  version: number;
  checksum: string;

  constructor(data: AuditLogEntity) {
    this.id = data.id;
    this.dbEngine = data.dbEngine;
    this.schemaName = data.schemaName;
    this.tableName = data.tableName;
    this.operation = data.operation;
    this.primaryKey = data.primaryKey;
    this.diffOld = data.diffOld;
    this.diffNew = data.diffNew;
    this.executedBy = data.executedBy;
    this.clientIp = data.clientIp;
    this.executedAt = data.executedAt;
    this.signature = data.signature;
    this.metadata = data.metadata;
    this.version = data.version;
    this.checksum = data.checksum;
  }

  // Generate checksum for integrity verification
  generateChecksum(): string {
    const data = {
      dbEngine: this.dbEngine,
      tableName: this.tableName,
      operation: this.operation,
      primaryKey: this.primaryKey,
      diffOld: this.diffOld,
      diffNew: this.diffNew,
      executedAt: this.executedAt.toISOString(),
    };
    
    // Simple checksum implementation (in production, use crypto.createHash)
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  // Verify integrity
  verifyIntegrity(): boolean {
    return this.checksum === this.generateChecksum();
  }

  // Get affected fields
  getAffectedFields(): string[] {
    if (this.operation === AuditOperation.INSERT) {
      return Object.keys(this.diffNew || {});
    } else if (this.operation === AuditOperation.DELETE) {
      return Object.keys(this.diffOld || {});
    } else if (this.operation === AuditOperation.UPDATE) {
      const oldKeys = Object.keys(this.diffOld || {});
      const newKeys = Object.keys(this.diffNew || {});
      return [...new Set([...oldKeys, ...newKeys])];
    }
    return [];
  }

  // Check if contains sensitive data
  containsSensitiveData(): boolean {
    const sensitiveFields = ['password', 'ssn', 'credit_card', 'token', 'secret'];
    const affectedFields = this.getAffectedFields();
    
    return affectedFields.some(field => 
      sensitiveFields.some(sensitive => 
        field.toLowerCase().includes(sensitive)
      )
    );
  }

  // Export for compliance reporting
  toComplianceFormat(): Record<string, any> {
    return {
      audit_id: this.id,
      database_engine: this.dbEngine,
      schema_name: this.schemaName,
      table_name: this.tableName,
      operation_type: this.operation,
      primary_key: this.primaryKey,
      executed_by: this.executedBy,
      executed_at: this.executedAt.toISOString(),
      client_ip: this.clientIp,
      affected_fields: this.getAffectedFields(),
      contains_sensitive_data: this.containsSensitiveData(),
      version: this.version,
      checksum: this.checksum,
    };
  }
}