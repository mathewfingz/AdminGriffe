import { createServer } from 'http';
import app from './app';
import { config } from './config';
import { db } from './services/database';
import { redis } from './services/redis';
import { rabbitmq } from './services/rabbitmq';
import { logger } from './services/logger';
import { initializeWebSocket } from './routes/websocket';

const PORT = config.PORT || 3001;

async function startServer() {
  try {
    // Initialize database connection
    await db.connect();
    logger.info('Database connected successfully');

    // Initialize Redis connection
    await redis.connect();
    logger.info('Redis connected successfully');

    // Initialize RabbitMQ connection
    await rabbitmq.connect();
    logger.info('RabbitMQ connected successfully');

    // Create HTTP server
    const server = createServer(app);

    // Initialize WebSocket
    const webSocketService = initializeWebSocket(server);
    logger.info('WebSocket service initialized');

    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`, {
        environment: config.NODE_ENV,
        port: PORT,
        timestamp: new Date().toISOString(),
        features: ['HTTP API', 'WebSocket', 'CDC', 'Audit', 'Sync']
      });
    });

    // Handle server errors
    server.on('error', (error: Error) => {
      logger.error('Server error:', error);
      process.exit(1);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      try {
        // Close WebSocket connections
        await webSocketService.shutdown();
        logger.info('WebSocket service closed');

        // Close HTTP server
        server.close(() => {
          logger.info('HTTP server closed');
        });

        // Close database connections
        await db.disconnect();
        logger.info('Database connections closed');

        // Close Redis connection
        await redis.disconnect();
        logger.info('Redis connection closed');

        // Close RabbitMQ connection
        await rabbitmq.disconnect();
        logger.info('RabbitMQ connection closed');

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown', { error: (error as Error).message });
        process.exit(1);
      }
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  logger.error('Unhandled error during server startup:', error);
  process.exit(1);
});