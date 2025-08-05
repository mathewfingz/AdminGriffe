/**
 * Circuit Breaker Pattern Implementation
 * Provides fault tolerance and prevents cascading failures
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Circuit is open, calls fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service is back
}

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening
  recoveryTimeout: number;       // Time to wait before trying again (ms)
  monitoringPeriod: number;      // Time window for failure counting (ms)
  expectedErrorRate: number;     // Expected error rate (0-1)
  minimumThroughput: number;     // Minimum calls before calculating error rate
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalCalls: number;
  errorRate: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  stateChangedAt: Date;
}

export class CircuitBreaker<T = any> {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private totalCalls = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private stateChangedAt = new Date();
  private nextAttempt = 0;

  constructor(
    private readonly name: string,
    private readonly config: CircuitBreakerConfig,
    private readonly logger?: any
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<R>(fn: () => Promise<R>): Promise<R> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new CircuitBreakerOpenError(
          `Circuit breaker '${this.name}' is OPEN. Next attempt at ${new Date(this.nextAttempt)}`
        );
      }
      
      // Transition to HALF_OPEN for testing
      this.setState(CircuitState.HALF_OPEN);
    }

    this.totalCalls++;

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Execute with fallback function
   */
  async executeWithFallback<R>(
    fn: () => Promise<R>,
    fallback: (error: Error) => Promise<R>
  ): Promise<R> {
    try {
      return await this.execute(fn);
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        this.log('warn', 'Circuit breaker open, executing fallback', { error: error.message });
        return await fallback(error);
      }
      throw error;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalCalls: this.totalCalls,
      errorRate: this.calculateErrorRate(),
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      stateChangedAt: this.stateChangedAt
    };
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset(): void {
    this.setState(CircuitState.CLOSED);
    this.failureCount = 0;
    this.successCount = 0;
    this.totalCalls = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.nextAttempt = 0;
    
    this.log('info', 'Circuit breaker reset');
  }

  /**
   * Force circuit breaker to open state
   */
  forceOpen(): void {
    this.setState(CircuitState.OPEN);
    this.nextAttempt = Date.now() + this.config.recoveryTimeout;
    
    this.log('warn', 'Circuit breaker forced to OPEN state');
  }

  /**
   * Force circuit breaker to closed state
   */
  forceClosed(): void {
    this.setState(CircuitState.CLOSED);
    this.nextAttempt = 0;
    
    this.log('info', 'Circuit breaker forced to CLOSED state');
  }

  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      // Success in HALF_OPEN state, close the circuit
      this.setState(CircuitState.CLOSED);
      this.failureCount = 0;
      this.log('info', 'Circuit breaker closed after successful test');
    }

    // Reset failure count if we're in monitoring period
    if (this.isInMonitoringPeriod()) {
      this.resetCountersIfNeeded();
    }
  }

  private onFailure(error: Error): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    this.log('warn', 'Circuit breaker recorded failure', { 
      error: error.message,
      failureCount: this.failureCount 
    });

    if (this.state === CircuitState.HALF_OPEN) {
      // Failure in HALF_OPEN state, open the circuit again
      this.setState(CircuitState.OPEN);
      this.nextAttempt = Date.now() + this.config.recoveryTimeout;
      this.log('warn', 'Circuit breaker opened after failed test');
      return;
    }

    if (this.state === CircuitState.CLOSED && this.shouldOpen()) {
      this.setState(CircuitState.OPEN);
      this.nextAttempt = Date.now() + this.config.recoveryTimeout;
      this.log('error', 'Circuit breaker opened due to failure threshold');
    }
  }

  private shouldOpen(): boolean {
    // Check if we have minimum throughput
    if (this.totalCalls < this.config.minimumThroughput) {
      return false;
    }

    // Check failure threshold
    if (this.failureCount >= this.config.failureThreshold) {
      return true;
    }

    // Check error rate
    const errorRate = this.calculateErrorRate();
    return errorRate > this.config.expectedErrorRate;
  }

  private calculateErrorRate(): number {
    if (this.totalCalls === 0) return 0;
    return this.failureCount / this.totalCalls;
  }

  private isInMonitoringPeriod(): boolean {
    if (!this.lastFailureTime && !this.lastSuccessTime) return false;
    
    const lastActivity = Math.max(
      this.lastFailureTime?.getTime() || 0,
      this.lastSuccessTime?.getTime() || 0
    );
    
    return Date.now() - lastActivity < this.config.monitoringPeriod;
  }

  private resetCountersIfNeeded(): void {
    const now = Date.now();
    const monitoringStart = now - this.config.monitoringPeriod;
    
    // Reset counters if monitoring period has passed
    if (this.stateChangedAt.getTime() < monitoringStart) {
      this.failureCount = 0;
      this.successCount = 0;
      this.totalCalls = 0;
    }
  }

  private setState(newState: CircuitState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.stateChangedAt = new Date();
      
      this.log('info', 'Circuit breaker state changed', {
        from: oldState,
        to: newState,
        timestamp: this.stateChangedAt
      });
    }
  }

  private log(level: string, message: string, meta?: any): void {
    if (this.logger) {
      this.logger[level](`[CircuitBreaker:${this.name}] ${message}`, meta);
    }
  }
}

/**
 * Circuit Breaker Manager for managing multiple circuit breakers
 */
export class CircuitBreakerManager {
  private static breakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create a circuit breaker
   */
  static getBreaker(
    name: string, 
    config?: Partial<CircuitBreakerConfig>,
    logger?: any
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        recoveryTimeout: 30000, // 30 seconds
        monitoringPeriod: 60000, // 1 minute
        expectedErrorRate: 0.5,  // 50%
        minimumThroughput: 10
      };

      const finalConfig = { ...defaultConfig, ...config };
      const breaker = new CircuitBreaker(name, finalConfig, logger);
      this.breakers.set(name, breaker);
    }

    return this.breakers.get(name)!;
  }

  /**
   * Get all circuit breakers
   */
  static getAllBreakers(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  /**
   * Get metrics for all circuit breakers
   */
  static getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    
    for (const [name, breaker] of this.breakers) {
      metrics[name] = breaker.getMetrics();
    }
    
    return metrics;
  }

  /**
   * Reset all circuit breakers
   */
  static resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Remove a circuit breaker
   */
  static removeBreaker(name: string): boolean {
    return this.breakers.delete(name);
  }

  /**
   * Clear all circuit breakers
   */
  static clear(): void {
    this.breakers.clear();
  }
}

/**
 * Custom error for circuit breaker open state
 */
export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 * Decorator for automatic circuit breaker protection
 */
export function CircuitBreakerProtected(
  name: string,
  config?: Partial<CircuitBreakerConfig>
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const breaker = CircuitBreakerManager.getBreaker(name, config);
      return breaker.execute(() => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}