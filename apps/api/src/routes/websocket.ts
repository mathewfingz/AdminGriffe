import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { auditService } from '../services/audit.js';
import { syncService } from '../services/sync.js';
import { redis } from '../services/redis.js';
import { logger } from '../services/logger.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  tenantId?: string;
  roles?: string[];
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedClients: Map<string, AuthenticatedSocket> = new Map();

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.CORS_ORIGIN || "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupRedisSubscriptions();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, config.JWT_SECRET) as any;
        
        socket.userId = decoded.userId;
        socket.tenantId = decoded.tenantId;
        socket.roles = decoded.roles || [];

        logger.info('WebSocket client authenticated', {
          userId: socket.userId,
          tenantId: socket.tenantId,
          socketId: socket.id
        });

        next();
      } catch (error) {
        logger.error('WebSocket authentication failed', { error: (error as Error).message });
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info('WebSocket client connected', {
        socketId: socket.id,
        userId: socket.userId,
        tenantId: socket.tenantId
      });

      this.connectedClients.set(socket.id, socket);

      // Join tenant-specific room
      if (socket.tenantId) {
        socket.join(`tenant:${socket.tenantId}`);
      }

      // Handle audit stream subscription
      socket.on('subscribe:audit', (data: { filters?: any }) => {
        this.handleAuditSubscription(socket, data);
      });

      // Handle sync stream subscription
      socket.on('subscribe:sync', (data: { filters?: any }) => {
        this.handleSyncSubscription(socket, data);
      });

      // Handle metrics subscription
      socket.on('subscribe:metrics', () => {
        this.handleMetricsSubscription(socket);
      });

      // Handle unsubscribe
      socket.on('unsubscribe', (data: { type: string }) => {
        this.handleUnsubscribe(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info('WebSocket client disconnected', {
          socketId: socket.id,
          userId: socket.userId,
          tenantId: socket.tenantId
        });
        this.connectedClients.delete(socket.id);
      });

      // Send initial connection status
      socket.emit('connected', {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
        tenantId: socket.tenantId
      });
    });
  }

  private handleAuditSubscription(socket: AuthenticatedSocket, data: { filters?: any }): void {
    if (!socket.tenantId) return;

    const room = `audit:${socket.tenantId}`;
    socket.join(room);

    logger.info('Client subscribed to audit stream', {
      socketId: socket.id,
      tenantId: socket.tenantId,
      filters: data.filters
    });

    socket.emit('subscribed', {
      type: 'audit',
      room,
      filters: data.filters
    });
  }

  private handleSyncSubscription(socket: AuthenticatedSocket, data: { filters?: any }): void {
    if (!socket.tenantId) return;

    const room = `sync:${socket.tenantId}`;
    socket.join(room);

    logger.info('Client subscribed to sync stream', {
      socketId: socket.id,
      tenantId: socket.tenantId,
      filters: data.filters
    });

    socket.emit('subscribed', {
      type: 'sync',
      room,
      filters: data.filters
    });
  }

  private handleMetricsSubscription(socket: AuthenticatedSocket): void {
    if (!socket.tenantId) return;

    const room = `metrics:${socket.tenantId}`;
    socket.join(room);

    logger.info('Client subscribed to metrics stream', {
      socketId: socket.id,
      tenantId: socket.tenantId
    });

    socket.emit('subscribed', {
      type: 'metrics',
      room
    });

    // Send initial metrics
    this.sendMetricsUpdate(socket.tenantId);
  }

  private handleUnsubscribe(socket: AuthenticatedSocket, data: { type: string }): void {
    if (!socket.tenantId) return;

    const room = `${data.type}:${socket.tenantId}`;
    socket.leave(room);

    logger.info('Client unsubscribed from stream', {
      socketId: socket.id,
      tenantId: socket.tenantId,
      type: data.type
    });

    socket.emit('unsubscribed', {
      type: data.type,
      room
    });
  }

  private setupRedisSubscriptions(): void {
    // Subscribe to audit events
    redis.subscribe('audit_events', (message) => {
      this.broadcastAuditEvent(message);
    }, undefined);

    // Subscribe to sync events
    redis.subscribe('sync_events', (message) => {
      this.broadcastSyncEvent(message);
    }, undefined);

    // Subscribe to metrics updates
    redis.subscribe('metrics_updates', (message) => {
      this.broadcastMetricsUpdate(message);
    }, undefined);
  }

  private broadcastAuditEvent(event: any): void {
    if (!event.tenantId) return;

    const room = `audit:${event.tenantId}`;
    this.io.to(room).emit('audit:event', {
      type: 'audit_log',
      data: event,
      timestamp: new Date().toISOString()
    });

    logger.debug('Broadcasted audit event', {
      tenantId: event.tenantId,
      operation: event.operation,
      tableName: event.tableName
    });
  }

  private broadcastSyncEvent(event: any): void {
    if (!event.tenantId) return;

    const room = `sync:${event.tenantId}`;
    this.io.to(room).emit('sync:event', {
      type: 'sync_operation',
      data: event,
      timestamp: new Date().toISOString()
    });

    logger.debug('Broadcasted sync event', {
      tenantId: event.tenantId,
      sourceDb: event.sourceDb,
      targetDb: event.targetDb,
      status: event.status
    });
  }

  private broadcastMetricsUpdate(metrics: any): void {
    if (!metrics.tenantId) return;

    const room = `metrics:${metrics.tenantId}`;
    this.io.to(room).emit('metrics:update', {
      type: 'metrics',
      data: metrics,
      timestamp: new Date().toISOString()
    });
  }

  public async sendMetricsUpdate(tenantId: string): Promise<void> {
    try {
      const [auditStats, syncMetrics, syncLag] = await Promise.all([
        auditService.getAuditStats(tenantId, {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          end: new Date()
        }),
        syncService.getSyncMetrics(tenantId, {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date()
        }),
        syncService.getSyncLagMetrics(tenantId)
      ]);

      const metrics = {
        tenantId,
        audit: auditStats,
        sync: syncMetrics,
        lag: syncLag,
        timestamp: new Date().toISOString()
      };

      const room = `metrics:${tenantId}`;
      this.io.to(room).emit('metrics:update', {
        type: 'metrics',
        data: metrics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to send metrics update', {
        tenantId,
        error: (error as Error).message
      });
    }
  }

  public async broadcastToTenant(tenantId: string, event: string, data: any): Promise<void> {
    const room = `tenant:${tenantId}`;
    this.io.to(room).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  public getConnectedClients(): number {
    return this.connectedClients.size;
  }

  public getClientsByTenant(tenantId: string): number {
    let count = 0;
    this.connectedClients.forEach(socket => {
      if (socket.tenantId === tenantId) {
        count++;
      }
    });
    return count;
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down WebSocket service');
    this.io.close();
  }
}

export let webSocketService: WebSocketService;

export function initializeWebSocket(server: HttpServer): WebSocketService {
  webSocketService = new WebSocketService(server);
  return webSocketService;
}