import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';

class DatabaseService {
  private static instance: DatabaseService;
  public prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: config.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      datasources: {
        db: {
          url: config.DATABASE_URL,
        },
      },
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Set tenant context for Row Level Security
   */
  public async setTenantContext(context: { tenantId: string; userId?: string; userEmail?: string; ipAddress?: string; userAgent?: string }): Promise<void> {
    await this.prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${context.tenantId}, true)`;
    
    if (context.userId) {
      await this.prisma.$executeRaw`SELECT set_config('app.current_user_id', ${context.userId}, true)`;
    }
    
    if (context.userEmail) {
      await this.prisma.$executeRaw`SELECT set_config('app.current_user_email', ${context.userEmail}, true)`;
    }

    if (context.ipAddress) {
      await this.prisma.$executeRaw`SELECT set_config('app.client_ip', ${context.ipAddress}, true)`;
    }
    
    if (context.userAgent) {
      await this.prisma.$executeRaw`SELECT set_config('app.user_agent', ${context.userAgent}, true)`;
    }
  }

  /**
   * Set client context for audit logging
   */
  public async setClientContext(ipAddress?: string, userAgent?: string): Promise<void> {
    if (ipAddress) {
      await this.prisma.$executeRaw`SELECT set_config('app.client_ip', ${ipAddress}, true)`;
    }
    
    if (userAgent) {
      await this.prisma.$executeRaw`SELECT set_config('app.user_agent', ${userAgent}, true)`;
    }
  }

  /**
   * Clear all session context
   */
  public async clearContext(): Promise<void> {
    await this.prisma.$executeRaw`SELECT set_config('app.current_tenant_id', '', true)`;
    await this.prisma.$executeRaw`SELECT set_config('app.current_user_id', '', true)`;
    await this.prisma.$executeRaw`SELECT set_config('app.current_user_email', '', true)`;
    await this.prisma.$executeRaw`SELECT set_config('app.client_ip', '', true)`;
    await this.prisma.$executeRaw`SELECT set_config('app.user_agent', '', true)`;
  }

  /**
   * Get a tenant-scoped Prisma client
   */
  public async getTenantClient(tenantId: string, userId?: string, userEmail?: string): Promise<PrismaClient> {
    await this.setTenantContext({ tenantId, userId, userEmail });
    return this.prisma;
  }

  /**
   * Connect to database
   */
  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Health check for database connection
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Graceful shutdown
   */
  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export { DatabaseService };
export const db = DatabaseService.getInstance();