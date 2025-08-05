import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * Password utilities
 */
export const passwordUtils = {
  /**
   * Hash password using bcrypt
   */
  async hash(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  },

  /**
   * Compare password with hash
   */
  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  /**
   * Generate random password
   */
  generate(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  },
};

/**
 * Pagination utilities
 */
export const paginationUtils = {
  /**
   * Calculate pagination metadata
   */
  calculatePagination: (page: number, limit: number, total: number) => {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    };
  },

  /**
   * Get pagination metadata
   */
  getMetadata: (page: number, limit: number, total: number) => {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    };
  },

  /**
   * Get Prisma pagination parameters
   */
  getPrismaParams: (page: number, limit: number) => {
    const skip = (page - 1) * limit;
    return {
      skip,
      take: limit,
    };
  },
};

/**
 * String utilities
 */
export const stringUtils = {
  /**
   * Generate random string
   */
  random(length: number = 10): string {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
  },

  /**
   * Generate UUID v4
   */
  uuid(): string {
    return crypto.randomUUID();
  },

  /**
   * Slugify string
   */
  slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  /**
   * Capitalize first letter
   */
  capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  /**
   * Truncate text
   */
  truncate(text: string, length: number = 100): string {
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
  },
};

/**
 * Date utilities
 */
export const dateUtils = {
  /**
   * Format date to ISO string
   */
  toISOString(date: Date | string): string {
    return new Date(date).toISOString();
  },

  /**
   * Check if date is valid
   */
  isValid(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  },

  /**
   * Get date range for queries
   */
  getDateRange(from?: string | Date, to?: string | Date) {
    const range: any = {};
    
    if (from) {
      range.gte = new Date(from);
    }
    
    if (to) {
      range.lte = new Date(to);
    }
    
    return Object.keys(range).length > 0 ? range : undefined;
  },

  /**
   * Add days to date
   */
  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  /**
   * Get start of day
   */
  startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  /**
   * Get end of day
   */
  endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  },
};

/**
 * Validation utilities
 */
export const validationUtils = {
  /**
   * Check if email is valid
   */
  isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Check if UUID is valid
   */
  isUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  /**
   * Check if URL is valid
   */
  isURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Sanitize HTML
   */
  sanitizeHTML(html: string): string {
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },
};

/**
 * Response utilities
 */
export const responseUtils = {
  /**
   * Create success response
   */
  success<T>(data?: T, message?: string) {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Create error response
   */
  error(message: string, error?: string) {
    return {
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Create paginated response
   */
  paginated<T>(data: T[], pagination: any) {
    return {
      success: true,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    };
  },
};

/**
 * Crypto utilities
 */
export const cryptoUtils = {
  /**
   * Generate secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  },

  /**
   * Hash data using SHA-256
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  },

  /**
   * Create HMAC signature
   */
  createSignature(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  },

  /**
   * Verify HMAC signature
   */
  verifySignature(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.createSignature(data, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  },
};