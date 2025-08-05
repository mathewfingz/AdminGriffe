import { z } from 'zod';

const configSchema = z.object({
  // Server
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis
  REDIS_URL: z.string().url(),
  
  // RabbitMQ
  RABBITMQ_URL: z.string().url(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

function loadConfig() {
  try {
    return configSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment configuration:', error);
    process.exit(1);
  }
}

export const config = loadConfig();

export type Config = z.infer<typeof configSchema>;