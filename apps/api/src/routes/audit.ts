import { Router } from 'express';
import { z } from 'zod';
import { AuditService } from '../services/audit.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { logger } from '../services/logger.js';

const router = Router();
const auditService = AuditService.getInstance();

// Validation schemas
const auditQuerySchema = z.object({
  tableName: z.string().optional(),
  recordId: z.string().optional(),
  operation: z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(1000).default(50),
  offset: z.coerce.number().min(0).default(0),
});

const auditTrailSchema = z.object({
  tableName: z.string(),
  recordId: z.string(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const auditStatsSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(['hour', 'day', 'week', 'month']).default('day'),
});

/**
 * GET /audit/logs - Get audit logs with filtering
 */
router.get('/logs', 
  authenticateToken,
  validate({ query: auditQuerySchema }),
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const query = req.query as z.infer<typeof auditQuerySchema>;

      const where: any = { tenantId };

      // Apply filters
      if (query.tableName) where.tableName = query.tableName;
      if (query.recordId) where.recordId = query.recordId;
      if (query.operation) where.operation = query.operation;
      if (query.userId) where.userId = query.userId;

      if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate) where.createdAt.gte = new Date(query.startDate);
        if (query.endDate) where.createdAt.lte = new Date(query.endDate);
      }

      const [logs, total] = await Promise.all([
        auditService.getAuditLogs(where, {
          limit: query.limit,
          offset: query.offset,
        }),
        auditService.getAuditLogsCount(where),
      ]);

      res.json({
        data: logs,
        pagination: {
          total,
          limit: query.limit,
          offset: query.offset,
          pages: Math.ceil(total / query.limit),
        },
      });
    } catch (error) {
      logger.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /audit/trail/:tableName/:recordId - Get audit trail for specific entity
 */
router.get('/trail/:tableName/:recordId',
  authenticateToken,
  validate({ query: auditTrailSchema }),
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const { tableName, recordId } = req.params;
      const query = req.query as z.infer<typeof auditTrailSchema>;

      const options = {
        limit: query.limit,
        offset: query.offset,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      };

      const trail = await auditService.getAuditTrail(
        tenantId,
        tableName,
        recordId,
        options
      );

      res.json({
        data: trail,
        meta: {
          tableName,
          recordId,
          count: trail.length,
        },
      });
    } catch (error) {
      logger.error('Error fetching audit trail:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /audit/stats - Get audit statistics
 */
router.get('/stats',
  authenticateToken,
  validate({ query: auditStatsSchema }),
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const query = req.query as z.infer<typeof auditStatsSchema>;

      const timeRange = {
        start: new Date(query.startDate),
        end: new Date(query.endDate),
      };

      const stats = await auditService.getAuditStats(tenantId, timeRange);

      res.json({
        data: stats,
        timeRange,
        groupBy: query.groupBy,
      });
    } catch (error) {
      logger.error('Error fetching audit stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /audit/verify - Verify audit log integrity
 */
router.post('/verify',
  authenticateToken,
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const { startDate, endDate } = req.body;

      const verification = await auditService.verifyAuditIntegrity(
        tenantId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      res.json({
        data: verification,
        verified: verification.isValid,
        message: verification.isValid 
          ? 'Audit log integrity verified' 
          : 'Audit log integrity compromised',
      });
    } catch (error) {
      logger.error('Error verifying audit integrity:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /audit/export - Export audit logs
 */
router.get('/export',
  authenticateToken,
  validate({ query: auditQuerySchema }),
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const query = req.query as z.infer<typeof auditQuerySchema>;

      const where: any = { tenantId };

      // Apply filters (same as /logs endpoint)
      if (query.tableName) where.tableName = query.tableName;
      if (query.recordId) where.recordId = query.recordId;
      if (query.operation) where.operation = query.operation;
      if (query.userId) where.userId = query.userId;

      if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate) where.createdAt.gte = new Date(query.startDate);
        if (query.endDate) where.createdAt.lte = new Date(query.endDate);
      }

      const logs = await auditService.getAuditLogs(where, {
        limit: 10000, // Max export limit
        offset: 0,
      });

      // Convert to CSV format
      const csvData = auditService.exportToCsv(logs);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      res.send(csvData);
    } catch (error) {
      logger.error('Error exporting audit logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /audit/compliance/:standard - Get compliance report
 */
router.get('/compliance/:standard',
  authenticateToken,
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const { standard } = req.params;
      const { startDate, endDate } = req.query;

      if (!['SOX', 'GDPR', 'HIPAA', 'PCI'].includes(standard.toUpperCase())) {
        return res.status(400).json({ error: 'Invalid compliance standard' });
      }

      const timeRange = {
        start: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate ? new Date(endDate as string) : new Date(),
      };

      const report = await auditService.generateComplianceReport(
        tenantId,
        standard.toUpperCase() as 'SOX' | 'GDPR' | 'HIPAA' | 'PCI',
        timeRange
      );

      res.json({
        data: report,
        standard: standard.toUpperCase(),
        timeRange,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error generating compliance report:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;