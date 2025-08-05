#!/usr/bin/env node
/**
 * Audit integrity verification script
 * Verifies the integrity of audit logs and detects tampering
 */

import { Pool } from 'pg';
import crypto from 'crypto';

interface AuditRecord {
  id: string;
  db_engine: string;
  schema_name: string;
  table_name: string;
  operation: string;
  primary_key: any;
  diff_old: any;
  diff_new: any;
  executed_by: string;
  client_ip: string;
  executed_at: Date;
  signature: Buffer | null;
}

interface VerificationResult {
  totalRecords: number;
  validSignatures: number;
  invalidSignatures: number;
  missingSignatures: number;
  errors: string[];
}

class AuditVerifier {
  private pool: Pool;
  private signatureKey: string;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.signatureKey = process.env.AUDIT_SIGNATURE_KEY || 'default-key';
  }

  private generateSignature(record: Omit<AuditRecord, 'signature'>): string {
    const data = JSON.stringify({
      id: record.id,
      db_engine: record.db_engine,
      schema_name: record.schema_name,
      table_name: record.table_name,
      operation: record.operation,
      primary_key: record.primary_key,
      diff_old: record.diff_old,
      diff_new: record.diff_new,
      executed_by: record.executed_by,
      client_ip: record.client_ip,
      executed_at: record.executed_at.toISOString(),
    });

    return crypto
      .createHmac('sha256', this.signatureKey)
      .update(data)
      .digest('hex');
  }

  private verifySignature(record: AuditRecord): boolean {
    if (!record.signature) {
      return false;
    }

    const expectedSignature = this.generateSignature(record);
    const actualSignature = record.signature.toString('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(actualSignature, 'hex')
    );
  }

  async verifyAuditIntegrity(
    startDate?: Date,
    endDate?: Date,
    limit = 1000
  ): Promise<VerificationResult> {
    const result: VerificationResult = {
      totalRecords: 0,
      validSignatures: 0,
      invalidSignatures: 0,
      missingSignatures: 0,
      errors: [],
    };

    try {
      let query = `
        SELECT id, db_engine, schema_name, table_name, operation,
               primary_key, diff_old, diff_new, executed_by, client_ip,
               executed_at, signature
        FROM audit_log
      `;
      
      const params: any[] = [];
      const conditions: string[] = [];

      if (startDate) {
        conditions.push(`executed_at >= $${params.length + 1}`);
        params.push(startDate);
      }

      if (endDate) {
        conditions.push(`executed_at <= $${params.length + 1}`);
        params.push(endDate);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY executed_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const { rows } = await this.pool.query(query, params);
      result.totalRecords = rows.length;

      for (const row of rows) {
        try {
          const record: AuditRecord = {
            id: row.id,
            db_engine: row.db_engine,
            schema_name: row.schema_name,
            table_name: row.table_name,
            operation: row.operation,
            primary_key: row.primary_key,
            diff_old: row.diff_old,
            diff_new: row.diff_new,
            executed_by: row.executed_by,
            client_ip: row.client_ip,
            executed_at: new Date(row.executed_at),
            signature: row.signature,
          };

          if (!record.signature) {
            result.missingSignatures++;
          } else if (this.verifySignature(record)) {
            result.validSignatures++;
          } else {
            result.invalidSignatures++;
            result.errors.push(
              `Invalid signature for record ID: ${record.id} at ${record.executed_at}`
            );
          }
        } catch (error) {
          result.errors.push(
            `Error processing record ${row.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    } catch (error) {
      result.errors.push(
        `Database query error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return result;
  }

  async getAuditStatistics(): Promise<{
    totalRecords: number;
    recordsByEngine: Record<string, number>;
    recordsByOperation: Record<string, number>;
    oldestRecord: Date | null;
    newestRecord: Date | null;
  }> {
    try {
      const [totalResult, engineResult, operationResult, dateResult] = await Promise.all([
        this.pool.query('SELECT COUNT(*) as total FROM audit_log'),
        this.pool.query(`
          SELECT db_engine, COUNT(*) as count 
          FROM audit_log 
          GROUP BY db_engine
        `),
        this.pool.query(`
          SELECT operation, COUNT(*) as count 
          FROM audit_log 
          GROUP BY operation
        `),
        this.pool.query(`
          SELECT MIN(executed_at) as oldest, MAX(executed_at) as newest 
          FROM audit_log
        `),
      ]);

      const recordsByEngine: Record<string, number> = {};
      for (const row of engineResult.rows) {
        recordsByEngine[row.db_engine] = parseInt(row.count);
      }

      const recordsByOperation: Record<string, number> = {};
      for (const row of operationResult.rows) {
        recordsByOperation[row.operation] = parseInt(row.count);
      }

      return {
        totalRecords: parseInt(totalResult.rows[0].total),
        recordsByEngine,
        recordsByOperation,
        oldestRecord: dateResult.rows[0].oldest ? new Date(dateResult.rows[0].oldest) : null,
        newestRecord: dateResult.rows[0].newest ? new Date(dateResult.rows[0].newest) : null,
      };
    } catch (error) {
      throw new Error(`Failed to get audit statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

async function main() {
  const verifier = new AuditVerifier();
  
  try {
    console.log('🔍 Starting audit integrity verification...\n');
    
    // Get general statistics
    console.log('📊 Audit Statistics:');
    const stats = await verifier.getAuditStatistics();
    console.log(`  Total Records: ${stats.totalRecords.toLocaleString()}`);
    console.log(`  Oldest Record: ${stats.oldestRecord?.toISOString() || 'N/A'}`);
    console.log(`  Newest Record: ${stats.newestRecord?.toISOString() || 'N/A'}`);
    
    console.log('\n  Records by Engine:');
    for (const [engine, count] of Object.entries(stats.recordsByEngine)) {
      console.log(`    ${engine}: ${count.toLocaleString()}`);
    }
    
    console.log('\n  Records by Operation:');
    for (const [operation, count] of Object.entries(stats.recordsByOperation)) {
      console.log(`    ${operation}: ${count.toLocaleString()}`);
    }
    
    // Verify integrity of recent records
    console.log('\n🔐 Verifying signature integrity (last 1000 records)...');
    const result = await verifier.verifyAuditIntegrity();
    
    console.log(`\n📋 Verification Results:`);
    console.log(`  Total Records Checked: ${result.totalRecords}`);
    console.log(`  Valid Signatures: ${result.validSignatures} ✅`);
    console.log(`  Invalid Signatures: ${result.invalidSignatures} ${result.invalidSignatures > 0 ? '❌' : '✅'}`);
    console.log(`  Missing Signatures: ${result.missingSignatures} ${result.missingSignatures > 0 ? '⚠️' : '✅'}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors found:');
      for (const error of result.errors) {
        console.log(`  - ${error}`);
      }
    }
    
    const integrityScore = result.totalRecords > 0 
      ? (result.validSignatures / result.totalRecords) * 100 
      : 100;
    
    console.log(`\n🎯 Integrity Score: ${integrityScore.toFixed(2)}%`);
    
    if (integrityScore === 100) {
      console.log('✅ Audit integrity verification passed!');
      process.exit(0);
    } else if (integrityScore >= 95) {
      console.log('⚠️  Audit integrity verification passed with warnings');
      process.exit(0);
    } else {
      console.log('❌ Audit integrity verification failed!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Audit verification failed:', error);
    process.exit(1);
  } finally {
    await verifier.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}