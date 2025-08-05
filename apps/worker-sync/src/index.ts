import 'dotenv/config';
import { SyncWorker } from './worker';
import { logger } from './utils/logger';
import { config } from './config';

async function bootstrap() {
  try {
    logger.info('🚀 Starting AdminGriffe Sync Worker...');
    
    // Validate configuration
    const validatedConfig = config.parse(process.env);
    logger.info('✅ Configuration validated');

    // Initialize worker
    const worker = new SyncWorker(validatedConfig);
    
    // Start worker
    await worker.start();
    
    logger.info('🎯 Sync Worker started successfully');
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('📤 Received SIGTERM, shutting down gracefully...');
      await worker.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('📤 Received SIGINT, shutting down gracefully...');
      await worker.stop();
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('💥 Failed to start Sync Worker:', error);
    process.exit(1);
  }
}

// Health check endpoint for Docker
import express from 'express';
const app = express();
const port = process.env.HEALTH_PORT || 3003;

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'sync-worker',
    version: '1.0.0'
  });
});

app.listen(port, () => {
  logger.info(`🏥 Health check server running on port ${port}`);
});

bootstrap();