import { config } from './config';
import { logger } from './utils/logger';
import { SyncWorker } from './worker';

/**
 * Main entry point for the Sync Worker
 * Initializes and starts the synchronization worker with proper error handling
 */
async function bootstrap() {
  const worker = new SyncWorker(config);
  
  // Handle graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`);
    
    try {
      await worker.stop();
      logger.info('Worker stopped successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Register signal handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });

  try {
    logger.info('Starting Sync Worker...');
    logger.info(`Environment: ${config.environment}`);
    logger.info(`Health check port: ${config.healthPort}`);
    
    await worker.start();
    
    logger.info('Sync Worker started successfully');
    logger.info(`Health endpoint available at: http://localhost:${config.healthPort}/health`);
    logger.info(`Metrics endpoint available at: http://localhost:${config.healthPort}/metrics`);
    
  } catch (error) {
    logger.error('Failed to start Sync Worker:', error);
    process.exit(1);
  }
}

// Start the application
bootstrap().catch((error) => {
  logger.error('Bootstrap failed:', error);
  process.exit(1);
});