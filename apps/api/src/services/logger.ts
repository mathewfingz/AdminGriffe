import { config } from '../config';

// Simple logger implementation
class Logger {
  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  info(message: string, meta?: any): void {
    console.log(this.formatMessage('info', message, meta));
  }

  error(message: string, meta?: any): void {
    console.error(this.formatMessage('error', message, meta));
  }

  warn(message: string, meta?: any): void {
    console.warn(this.formatMessage('warn', message, meta));
  }

  debug(message: string, meta?: any): void {
    if (config.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }

  http(message: string, meta?: any): void {
    if (config.NODE_ENV !== 'production') {
      console.log(this.formatMessage('http', message, meta));
    }
  }
}

export const logger = new Logger();

// Create a stream object for Morgan
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};