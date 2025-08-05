import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    tenantId: req.headers['x-tenant-id'],
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
    });
  });

  next();
};