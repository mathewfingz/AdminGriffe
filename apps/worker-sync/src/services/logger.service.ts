import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { appConfig } from '../config/config';

export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const { combine, timestamp, errors, json, printf, colorize } = winston.format;

    // Custom format for console output
    const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
      let log = `${timestamp} [${level}]: ${message}`;
      
      if (stack) {
        log += `\n${stack}`;
      }
      
      if (Object.keys(meta).length > 0) {
        log += `\n${JSON.stringify(meta, null, 2)}`;
      }
      
      return log;
    });

    // File transport with rotation
    const fileTransport = new DailyRotateFile({
      filename: appConfig.logging.filePath.replace('.log', '-%DATE%.log'),
      datePattern: appConfig.logging.datePattern,
      maxSize: appConfig.logging.maxSize,
      maxFiles: appConfig.logging.maxFiles,
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      ),
    });

    // Console transport
    const consoleTransport = new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat
      ),
    });

    return winston.createLogger({
      level: appConfig.logLevel,
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      ),
      defaultMeta: { service: 'sync-worker' },
      transports: [
        fileTransport,
        ...(appConfig.env !== 'production' ? [consoleTransport] : []),
      ],
      exceptionHandlers: [
        new DailyRotateFile({
          filename: appConfig.logging.filePath.replace('.log', '-exceptions-%DATE%.log'),
          datePattern: appConfig.logging.datePattern,
          maxSize: appConfig.logging.maxSize,
          maxFiles: appConfig.logging.maxFiles,
        }),
      ],
      rejectionHandlers: [
        new DailyRotateFile({
          filename: appConfig.logging.filePath.replace('.log', '-rejections-%DATE%.log'),
          datePattern: appConfig.logging.datePattern,
          maxSize: appConfig.logging.maxSize,
          maxFiles: appConfig.logging.maxFiles,
        }),
      ],
    });
  }

  error(message: string, error?: Error | any, meta?: any): void {
    this.logger.error(message, { error: error?.stack || error, ...meta });
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  // Structured logging methods for specific events
  logSyncEvent(event: {
    operation: string;
    source: string;
    target: string;
    recordId: string;
    duration?: number;
    success: boolean;
    error?: string;
  }): void {
    this.info('Sync event', {
      type: 'sync_event',
      ...event,
    });
  }

  logCdcEvent(event: {
    source: string;
    table: string;
    operation: string;
    recordId: string;
    timestamp: Date;
  }): void {
    this.info('CDC event received', {
      type: 'cdc_event',
      ...event,
    });
  }

  logConflictEvent(event: {
    source: string;
    target: string;
    recordId: string;
    conflictType: string;
    resolution: string;
  }): void {
    this.warn('Conflict detected', {
      type: 'conflict_event',
      ...event,
    });
  }

  logPerformanceMetric(metric: {
    operation: string;
    duration: number;
    recordsProcessed?: number;
    throughput?: number;
  }): void {
    this.info('Performance metric', {
      type: 'performance_metric',
      ...metric,
    });
  }

  logHealthCheck(status: {
    component: string;
    healthy: boolean;
    responseTime?: number;
    error?: string;
  }): void {
    const level = status.healthy ? 'info' : 'error';
    this.logger[level]('Health check', {
      type: 'health_check',
      ...status,
    });
  }

  // Create child logger with additional context
  child(meta: any): LoggerService {
    const childLogger = new LoggerService();
    childLogger.logger = this.logger.child(meta);
    return childLogger;
  }

  // Get the underlying Winston logger instance
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}

// Export singleton instance
export const logger = new LoggerService();