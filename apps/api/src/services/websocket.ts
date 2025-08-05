import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { SocketUser, SocketMessage, JWTPayload } from '../types/index.js';

class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, SocketUser> = new Map();

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Initialize WebSocket server
   */
  public initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.CORS_ORIGIN,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    console.log('WebSocket server initialized');
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    if (!this.io) return;

    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
        
        socket.data.user = {
          userId: decoded.userId,
          tenantId: decoded.tenantId,
          email: decoded.email,
          role: decoded.role,
        };

        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      const user: SocketUser = socket.data.user;
      
      console.log(`User connected: ${user.email} (${user.userId})`);
      
      // Store connected user
      this.connectedUsers.set(socket.id, user);

      // Join tenant room
      socket.join(`tenant:${user.tenantId}`);

      // Join user-specific room
      socket.join(`user:${user.userId}`);

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Handle subscription to specific events
      socket.on('subscribe', (data: { events: string[] }) => {
        if (Array.isArray(data.events)) {
          data.events.forEach(event => {
            socket.join(`${user.tenantId}:${event}`);
          });
          socket.emit('subscribed', { events: data.events });
        }
      });

      // Handle unsubscription
      socket.on('unsubscribe', (data: { events: string[] }) => {
        if (Array.isArray(data.events)) {
          data.events.forEach(event => {
            socket.leave(`${user.tenantId}:${event}`);
          });
          socket.emit('unsubscribed', { events: data.events });
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${user.email} (${reason})`);
        this.connectedUsers.delete(socket.id);
      });
    });
  }

  /**
   * Broadcast message to all users in a tenant
   */
  public broadcastToTenant(tenantId: string, message: SocketMessage): void {
    if (!this.io) return;
    
    this.io.to(`tenant:${tenantId}`).emit('message', message);
  }

  /**
   * Send message to specific user
   */
  public sendToUser(userId: string, message: SocketMessage): void {
    if (!this.io) return;
    
    this.io.to(`user:${userId}`).emit('message', message);
  }

  /**
   * Broadcast to users subscribed to specific event type
   */
  public broadcastEvent(tenantId: string, eventType: string, data: any): void {
    if (!this.io) return;

    const message: SocketMessage = {
      type: eventType,
      tenantId,
      data,
      timestamp: new Date().toISOString(),
    };

    this.io.to(`${tenantId}:${eventType}`).emit('event', message);
  }

  /**
   * Get connected users count for a tenant
   */
  public getTenantUsersCount(tenantId: string): number {
    if (!this.io) return 0;
    
    const room = this.io.sockets.adapter.rooms.get(`tenant:${tenantId}`);
    return room ? room.size : 0;
  }

  /**
   * Get all connected users
   */
  public getConnectedUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  /**
   * Check if user is connected
   */
  public isUserConnected(userId: string): boolean {
    return Array.from(this.connectedUsers.values()).some(user => user.userId === userId);
  }

  /**
   * Disconnect all users (for graceful shutdown)
   */
  public disconnectAll(): void {
    if (!this.io) return;
    
    this.io.disconnectSockets();
    this.connectedUsers.clear();
  }

  /**
   * Get server instance
   */
  public getServer(): SocketIOServer | null {
    return this.io;
  }
}

export { WebSocketService };