import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AuthenticatedRequest, JWTPayload, AuthenticationError, AuthorizationError } from '../types/index.js';

/**
 * Middleware to verify JWT token and extract user information
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    
    req.user = decoded;
    req.tenantId = decoded.tenantId;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (roles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      const userRole = req.user.role;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(userRole)) {
        throw new AuthorizationError(`Required role: ${allowedRoles.join(' or ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Middleware to check if user is admin or manager
 */
export const requireManager = requireRole(['ADMIN', 'MANAGER']);

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
      req.user = decoded;
      req.tenantId = decoded.tenantId;
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

/**
 * Generate JWT token for user
 */
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as string,
  });
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.JWT_SECRET) as JWTPayload;
};