import { Request } from 'express';

// ===== AUTH TYPES =====
export interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  tenantId?: string;
}

// ===== TENANT TYPES =====
export interface TenantContext {
  tenantId: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

// ===== API RESPONSE TYPES =====
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===== QUERY TYPES =====
export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface SortQuery {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterQuery {
  search?: string;
  isActive?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface BaseQuery extends PaginationQuery, SortQuery, FilterQuery {}

// ===== WEBSOCKET TYPES =====
export interface SocketUser {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

export interface SocketMessage {
  type: string;
  tenantId: string;
  data: any;
  timestamp: string;
}

// ===== EVENT TYPES =====
export interface BaseEvent {
  tenantId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
}

export interface ProductEvent extends BaseEvent {
  entityType: 'product';
  eventType: 'created' | 'updated' | 'deleted';
  data: {
    id: string;
    name: string;
    price: number;
    stock: number;
    categoryId?: string;
  };
}

export interface OrderEvent extends BaseEvent {
  entityType: 'order';
  eventType: 'created' | 'updated' | 'cancelled' | 'completed';
  data: {
    id: string;
    userId: string;
    status: string;
    total: number;
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>;
  };
}

export interface UserEvent extends BaseEvent {
  entityType: 'user';
  eventType: 'created' | 'updated' | 'deleted';
  data: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}

// ===== ERROR TYPES =====
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

export class TenantError extends AppError {
  constructor(message: string = 'Tenant not found or inactive') {
    super(message, 404);
  }
}