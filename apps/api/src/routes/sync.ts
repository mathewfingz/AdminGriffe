import { Router } from 'express';
import { z } from 'zod';
import { SyncService } from '../services/sync.js';
import { CdcService } from '../services/cdc.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { logger } from '../services/logger.js';

const router = Router();
const syncService = SyncService.getInstance();
const cdcService = CdcService.getInstance();

// Validation schemas
const syncStatusSchema = z.object({
  sourceDb: z.string().optional(),
  targetDb: z.string().optional(),
  tableName: z.string().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

const replaySchema = z.object({
  eventId: z.string(),
  targetDbs: z.array(z.string()).optional(),
  force: z.boolean().default(false),
});

const cdcConfigSchema = z.object({
  database: z.enum(['postgresql', 'mysql', 'mongodb']),
  enabled: z.boolean(),
  config: z.object({
    host: z.string().optional(),
    port: z.number().optional(),
    database: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    tables: z.array(z.string()).optional(),
    collections: z.array(z.string()).optional(),
  }).optional(),
});

const conflictResolutionSchema = z.object({
  conflictId: z.string(),
  resolution: z.enum(['source_wins', 'target_wins', 'merge', 'manual']),
  mergeData: z.record(z.any()).optional(),
});

/**
 * GET /sync/status - Get synchronization status
 */
router.get('/status',
  authenticateToken,
  validate({ query: syncStatusSchema }),
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const query = req.query as z.infer<typeof syncStatusSchema>;

      const status = await syncService.getSyncStatus(tenantId, {
        sourceDb: query.sourceDb,
        targetDb: query.targetDb,
        tableName: query.tableName,
        status: query.status,
        limit: query.limit,
        offset: query.offset,
      });

      res.json({
        data: status,
        meta: {
          tenantId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error fetching sync status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /sync/health - Get sync service health
 */
router.get('/health',
  authenticateToken,
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      
      const health = await syncService.getHealthStatus(tenantId);

      res.json({
        data: health,
        status: health.overall === 'healthy' ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error fetching sync health:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /sync/replay - Replay a sync operation
 */
router.post('/replay',
  authenticateToken,
  validate({ body: replaySchema }),
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const { eventId, targetDbs, force } = req.body;

      const result = await syncService.replaySyncEvent(tenantId, eventId, {
        targetDbs,
        force,
      });

      res.json({
        data: result,
        message: 'Sync replay initiated successfully',
      });
    } catch (error) {
      logger.error('Error replaying sync event:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /sync/conflicts - Get sync conflicts
 */
router.get('/conflicts',
  authenticateToken,
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const { status, limit = 20, offset = 0 } = req.query;

      const conflicts = await syncService.getSyncConflicts(tenantId, {
        status: status as string,
        limit: Number(limit),
        offset: Number(offset),
      });

      res.json({
        data: conflicts,
        meta: {
          tenantId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error fetching sync conflicts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /sync/conflicts/resolve - Resolve a sync conflict
 */
router.post('/conflicts/resolve',
  authenticateToken,
  validate({ body: conflictResolutionSchema }),
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const { conflictId, resolution, mergeData } = req.body;

      const result = await syncService.resolveConflict(tenantId, conflictId, {
        resolution,
        mergeData,
        resolvedBy: req.user!.id,
      });

      res.json({
        data: result,
        message: 'Conflict resolved successfully',
      });
    } catch (error) {
      logger.error('Error resolving sync conflict:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /sync/metrics - Get sync metrics
 */
router.get('/metrics',
  authenticateToken,
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const { startDate, endDate, granularity = 'hour' } = req.query;

      const timeRange = {
        start: startDate ? new Date(startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: endDate ? new Date(endDate as string) : new Date(),
      };

      const metrics = await syncService.getSyncMetrics(tenantId, timeRange, granularity as string);

      res.json({
        data: metrics,
        timeRange,
        granularity,
      });
    } catch (error) {
      logger.error('Error fetching sync metrics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /sync/cdc/configure - Configure CDC for a database
 */
router.post('/cdc/configure',
  authenticateToken,
  validate({ body: cdcConfigSchema }),
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const { database, enabled, config } = req.body;

      const result = await cdcService.configureCdc(tenantId, database, {
        enabled,
        config,
      });

      res.json({
        data: result,
        message: `CDC configuration updated for ${database}`,
      });
    } catch (error) {
      logger.error('Error configuring CDC:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /sync/cdc/status - Get CDC status for all databases
 */
router.get('/cdc/status',
  authenticateToken,
  async (req, res) => {
    try {
      const { tenantId } = req.user!;

      const status = await cdcService.getCdcStatus(tenantId);

      res.json({
        data: status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error fetching CDC status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /sync/cdc/start - Start CDC monitoring
 */
router.post('/cdc/start',
  authenticateToken,
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const { databases } = req.body;

      const result = await cdcService.startCdcMonitoring(tenantId, databases);

      res.json({
        data: result,
        message: 'CDC monitoring started',
      });
    } catch (error) {
      logger.error('Error starting CDC monitoring:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /sync/cdc/stop - Stop CDC monitoring
 */
router.post('/cdc/stop',
  authenticateToken,
  async (req, res) => {
    try {
      const { tenantId } = req.user!;
      const { databases } = req.body;

      const result = await cdcService.stopCdcMonitoring(tenantId, databases);

      res.json({
        data: result,
        message: 'CDC monitoring stopped',
      });
    } catch (error) {
      logger.error('Error stopping CDC monitoring:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /sync/lag - Get synchronization lag metrics
 */
router.get('/lag',
  authenticateToken,
  async (req, res) => {
    try {
      const { tenantId } = req.user!;

      const lagMetrics = await syncService.getSyncLagMetrics(tenantId);

      res.json({
        data: lagMetrics,
        timestamp: new Date().toISOString(),
        thresholds: {
          warning: 100, // ms
          critical: 500, // ms
        },
      });
    } catch (error) {
      logger.error('Error fetching sync lag metrics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;