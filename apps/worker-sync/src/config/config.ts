import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables
config();

// Configuration schema validation
const configSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Database connections
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_DB: z.string().default('sync_db'),
  POSTGRES_USER: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string().default('postgres_password'),
  POSTGRES_SSL: z.coerce.boolean().default(false),

  MYSQL_HOST: z.string().default('localhost'),
  MYSQL_PORT: z.coerce.number().default(3306),
  MYSQL_DB: z.string().default('sync_db'),
  MYSQL_USER: z.string().default('root'),
  MYSQL_PASSWORD: z.string().default('mysql_password'),
  MYSQL_SSL: z.coerce.boolean().default(false),

  MONGODB_URI: z.string().default('mongodb://localhost:27017/sync_db'),
  MONGODB_USER: z.string().optional(),
  MONGODB_PASSWORD: z.string().optional(),

  // Message Queue & Streaming
  KAFKA_BROKERS: z.string().default('localhost:9092'),
  KAFKA_CLIENT_ID: z.string().default('sync-worker'),
  KAFKA_GROUP_ID: z.string().default('sync-worker-group'),
  KAFKA_TOPICS: z.string().default('dbz.postgres.public,dbz.mysql.sync_db,mongo.sync_db'),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),

  RABBITMQ_URL: z.string().default('amqp://guest:guest@localhost:5672'),

  // Queue Configuration
  QUEUE_CONCURRENCY: z.coerce.number().default(10),
  QUEUE_MAX_ATTEMPTS: z.coerce.number().default(5),
  QUEUE_BACKOFF_DELAY: z.coerce.number().default(1000),
  QUEUE_REMOVE_ON_COMPLETE: z.coerce.number().default(100),
  QUEUE_REMOVE_ON_FAIL: z.coerce.number().default(50),

  // Sync Configuration
  SYNC_BATCH_SIZE: z.coerce.number().default(100),
  SYNC_TIMEOUT_MS: z.coerce.number().default(30000),
  SYNC_RETRY_ATTEMPTS: z.coerce.number().default(3),
  SYNC_CONFLICT_STRATEGY: z.enum(['timestamp', 'source_priority', 'manual']).default('timestamp'),
  SYNC_ENABLE_METRICS: z.coerce.boolean().default(true),

  // Security
  JWT_SECRET: z.string().default('your-super-secret-jwt-key'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  ENCRYPTION_KEY: z.string().min(32).default('your-32-character-encryption-key'),

  // Monitoring & Metrics
  PROMETHEUS_PORT: z.coerce.number().default(9090),
  METRICS_ENABLED: z.coerce.boolean().default(true),
  HEALTH_CHECK_INTERVAL: z.coerce.number().default(30000),

  // Circuit Breaker
  CIRCUIT_BREAKER_THRESHOLD: z.coerce.number().default(5),
  CIRCUIT_BREAKER_TIMEOUT: z.coerce.number().default(60000),
  CIRCUIT_BREAKER_RESET_TIMEOUT: z.coerce.number().default(30000),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(1000),

  // Logging
  LOG_FILE_PATH: z.string().default('./logs/sync-worker.log'),
  LOG_MAX_SIZE: z.string().default('10m'),
  LOG_MAX_FILES: z.coerce.number().default(5),
  LOG_DATE_PATTERN: z.string().default('YYYY-MM-DD'),

  // Development
  DEBUG: z.string().optional(),
  ENABLE_CORS: z.coerce.boolean().default(true),
  TRUST_PROXY: z.coerce.boolean().default(false),
});

// Parse and validate configuration
const parsedConfig = configSchema.parse(process.env);

// Export typed configuration
export const appConfig = {
  env: parsedConfig.NODE_ENV,
  port: parsedConfig.PORT,
  logLevel: parsedConfig.LOG_LEVEL,

  databases: {
    postgres: {
      host: parsedConfig.POSTGRES_HOST,
      port: parsedConfig.POSTGRES_PORT,
      database: parsedConfig.POSTGRES_DB,
      username: parsedConfig.POSTGRES_USER,
      password: parsedConfig.POSTGRES_PASSWORD,
      ssl: parsedConfig.POSTGRES_SSL,
    },
    mysql: {
      host: parsedConfig.MYSQL_HOST,
      port: parsedConfig.MYSQL_PORT,
      database: parsedConfig.MYSQL_DB,
      user: parsedConfig.MYSQL_USER,
      password: parsedConfig.MYSQL_PASSWORD,
      ssl: parsedConfig.MYSQL_SSL,
    },
    mongodb: {
      uri: parsedConfig.MONGODB_URI,
      user: parsedConfig.MONGODB_USER,
      password: parsedConfig.MONGODB_PASSWORD,
    },
  },

  messaging: {
    kafka: {
      brokers: parsedConfig.KAFKA_BROKERS.split(','),
      clientId: parsedConfig.KAFKA_CLIENT_ID,
      groupId: parsedConfig.KAFKA_GROUP_ID,
      topics: parsedConfig.KAFKA_TOPICS.split(','),
    },
    redis: {
      host: parsedConfig.REDIS_HOST,
      port: parsedConfig.REDIS_PORT,
      password: parsedConfig.REDIS_PASSWORD,
      db: parsedConfig.REDIS_DB,
    },
    rabbitmq: {
      url: parsedConfig.RABBITMQ_URL,
    },
  },

  queue: {
    concurrency: parsedConfig.QUEUE_CONCURRENCY,
    maxAttempts: parsedConfig.QUEUE_MAX_ATTEMPTS,
    backoffDelay: parsedConfig.QUEUE_BACKOFF_DELAY,
    removeOnComplete: parsedConfig.QUEUE_REMOVE_ON_COMPLETE,
    removeOnFail: parsedConfig.QUEUE_REMOVE_ON_FAIL,
  },

  sync: {
    batchSize: parsedConfig.SYNC_BATCH_SIZE,
    timeoutMs: parsedConfig.SYNC_TIMEOUT_MS,
    retryAttempts: parsedConfig.SYNC_RETRY_ATTEMPTS,
    conflictStrategy: parsedConfig.SYNC_CONFLICT_STRATEGY,
    enableMetrics: parsedConfig.SYNC_ENABLE_METRICS,
  },

  security: {
    jwtSecret: parsedConfig.JWT_SECRET,
    jwtExpiresIn: parsedConfig.JWT_EXPIRES_IN,
    encryptionKey: parsedConfig.ENCRYPTION_KEY,
  },

  monitoring: {
    prometheusPort: parsedConfig.PROMETHEUS_PORT,
    metricsEnabled: parsedConfig.METRICS_ENABLED,
    healthCheckInterval: parsedConfig.HEALTH_CHECK_INTERVAL,
  },

  circuitBreaker: {
    threshold: parsedConfig.CIRCUIT_BREAKER_THRESHOLD,
    timeout: parsedConfig.CIRCUIT_BREAKER_TIMEOUT,
    resetTimeout: parsedConfig.CIRCUIT_BREAKER_RESET_TIMEOUT,
  },

  rateLimit: {
    windowMs: parsedConfig.RATE_LIMIT_WINDOW_MS,
    maxRequests: parsedConfig.RATE_LIMIT_MAX_REQUESTS,
  },

  logging: {
    filePath: parsedConfig.LOG_FILE_PATH,
    maxSize: parsedConfig.LOG_MAX_SIZE,
    maxFiles: parsedConfig.LOG_MAX_FILES,
    datePattern: parsedConfig.LOG_DATE_PATTERN,
  },

  development: {
    debug: parsedConfig.DEBUG,
    enableCors: parsedConfig.ENABLE_CORS,
    trustProxy: parsedConfig.TRUST_PROXY,
  },
};

export type AppConfig = typeof appConfig;