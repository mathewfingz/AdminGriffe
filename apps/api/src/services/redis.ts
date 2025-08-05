import { createClient, RedisClientType } from 'redis';
import { config } from '../config/index.js';

class RedisService {
  private static instance: RedisService;
  private client: RedisClientType;
  private isConnected: boolean = false;

  private constructor() {
    this.client = createClient({
      url: config.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
      },
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('❌ Redis disconnected');
      this.isConnected = false;
    });
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  /**
   * Cache operations with tenant scoping
   */
  public async set(key: string, value: any, tenantId?: string, ttl?: number): Promise<void> {
    const scopedKey = tenantId ? `tenant:${tenantId}:${key}` : key;
    const serializedValue = JSON.stringify(value);
    
    if (ttl) {
      await this.client.setEx(scopedKey, ttl, serializedValue);
    } else {
      await this.client.set(scopedKey, serializedValue);
    }
  }

  public async get<T = any>(key: string, tenantId?: string): Promise<T | null> {
    const scopedKey = tenantId ? `tenant:${tenantId}:${key}` : key;
    const value = await this.client.get(scopedKey);
    
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  public async del(key: string, tenantId?: string): Promise<void> {
    const scopedKey = tenantId ? `tenant:${tenantId}:${key}` : key;
    await this.client.del(scopedKey);
  }

  public async exists(key: string, tenantId?: string): Promise<boolean> {
    const scopedKey = tenantId ? `tenant:${tenantId}:${key}` : key;
    const result = await this.client.exists(scopedKey);
    return result === 1;
  }

  /**
   * Pub/Sub operations with tenant scoping
   */
  public async publish(channel: string, message: any, tenantId?: string): Promise<void> {
    const scopedChannel = tenantId ? `tenant:${tenantId}:${channel}` : channel;
    await this.client.publish(scopedChannel, JSON.stringify(message));
  }

  public async subscribe(channel: string, callback: (message: any) => void, tenantId?: string): Promise<void> {
    const scopedChannel = tenantId ? `tenant:${tenantId}:${channel}` : channel;
    const subscriber = this.client.duplicate();
    await subscriber.connect();
    
    await subscriber.subscribe(scopedChannel, (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        callback(parsedMessage);
      } catch {
        callback(message);
      }
    });
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  /**
   * Graceful shutdown
   */
  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }
}

export { RedisService };
export const redis = RedisService.getInstance();