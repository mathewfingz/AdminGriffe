import { z } from 'zod';

export const config = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Health check
  HEALTH_PORT: z.string().transform(Number).default(3003),
  
  // Database URLs
  DATABASE_URL: z.string().url(),
  MYSQL_URL: z.string().url().optional(),
  MONGODB_URL: z.string().url().optional(),
  
  // Message Queue
  REDIS_URL: z.string().url(),
  RABBITMQ_URL: z.string().url(),
  
  // Kafka
  KAFKA_BROKERS: z.string().default('localhost:9092'),
  KAFKA_CLIENT_ID: z.string().default('sync-worker'),
  KAFKA_GROUP_ID: z.string().default('sync-worker-group'),
  
  // Sync Configuration
  SYNC_BATCH_SIZE: z.string().transform(Number).default(100),
  SYNC_RETRY_ATTEMPTS: z.string().transform(Number).default(3),
  SYNC_RETRY_DELAY: z.string().transform(Number).default(1000),
  SYNC_CONFLICT_STRATEGY: z.enum(['timestamp', 'priority', 'manual']).default('timestamp'),
  
  // Performance
  MAX_CONCURRENT_JOBS: z.string().transform(Number).default(10),
  QUEUE_CONCURRENCY: z.string().transform(Number).default(5),
  
  // Monitoring
  METRICS_ENABLED: z.string().transform(val => val === 'true').default(true),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Security
  ENCRYPTION_KEY: z.string().min(32),
  
  // CDC Configuration
  CDC_ENABLED: z.string().transform(val => val === 'true').default(true),
  CDC_POLL_INTERVAL: z.string().transform(Number).default(5000),
  
  // Source priorities for conflict resolution
  SOURCE_PRIORITIES: z.string().default('postgres:1,mysql:2,mongodb:3'),
});

export type Config = z.infer<typeof config>;