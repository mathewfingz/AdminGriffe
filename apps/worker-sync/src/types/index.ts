export interface CdcEvent {
  id: string;
  source: DatabaseSource;
  schema: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  timestamp: Date;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  primaryKey: Record<string, any>;
  transactionId?: string;
  vectorClock?: VectorClock;
  metadata?: Record<string, any>;
}

export interface VectorClock {
  sourceId: string;
  timestamp: number;
  version?: number | string;
}

export type DatabaseSource = 'postgres' | 'mysql' | 'mongodb';

export interface SyncJob {
  id: string;
  event: CdcEvent;
  targetSources: DatabaseSource[];
  priority: number;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  scheduledAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'conflict';
}

export interface ConflictResolution {
  strategy: 'timestamp' | 'priority' | 'manual';
  winner?: CdcEvent;
  loser?: CdcEvent;
  resolution: 'auto' | 'manual';
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface SyncMetrics {
  totalEvents: number;
  successfulSyncs: number;
  failedSyncs: number;
  conflictsDetected: number;
  conflictsResolved: number;
  avgSyncLatency: number;
  lastSyncTimestamp: Date;
  queueDepth: number;
  errorRate: number;
  throughputPerSecond: number;
}

export interface DatabaseConnector {
  source: DatabaseSource;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;
  applyChange(event: CdcEvent): Promise<void>;
  getLastSyncTimestamp(): Promise<Date | null>;
  setLastSyncTimestamp(timestamp: Date): Promise<void>;
}

export interface SyncHandler {
  canHandle(source: DatabaseSource, target: DatabaseSource): boolean;
  handle(event: CdcEvent, target: DatabaseSource): Promise<void>;
  validateMapping(event: CdcEvent, target: DatabaseSource): boolean;
  transformData(data: Record<string, any>, source: DatabaseSource, target: DatabaseSource): Record<string, any>;
}

export interface QueueMessage {
  type: 'sync' | 'conflict' | 'retry';
  payload: SyncJob | ConflictResolution;
  metadata: {
    attempts: number;
    createdAt: Date;
    priority: number;
  };
}