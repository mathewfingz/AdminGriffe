import { CdcEvent, ConflictResolution, DatabaseSource } from '../types';
import { logger } from '../utils/logger';
import { config } from '../config';

export class ConflictResolver {
  private sourcePriorities: Map<DatabaseSource, number> = new Map();

  constructor() {
    // Initialize source priorities from config
    this.sourcePriorities.set('postgres', config.sync.sourcePriorities.postgres);
    this.sourcePriorities.set('mysql', config.sync.sourcePriorities.mysql);
    this.sourcePriorities.set('mongodb', config.sync.sourcePriorities.mongodb);
  }

  async resolveConflict(events: CdcEvent[]): Promise<ConflictResolution> {
    if (events.length < 2) {
      throw new Error('At least 2 events required for conflict resolution');
    }

    logger.info(`🔄 Resolving conflict between ${events.length} events`);

    // Sort events by timestamp for analysis
    const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Determine resolution strategy
    const strategy = this.determineStrategy(sortedEvents);
    
    let resolution: ConflictResolution;
    
    switch (strategy) {
      case 'timestamp':
        resolution = await this.resolveByTimestamp(sortedEvents);
        break;
      case 'priority':
        resolution = await this.resolveByPriority(sortedEvents);
        break;
      case 'manual':
        resolution = await this.requireManualResolution(sortedEvents);
        break;
      default:
        throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
    }

    logger.info(`✅ Conflict resolved using ${strategy} strategy`);
    return resolution;
  }

  private determineStrategy(events: CdcEvent[]): 'timestamp' | 'priority' | 'manual' {
    // Use configured strategy
    const configStrategy = config.sync.conflictStrategy;
    
    if (configStrategy !== 'auto') {
      return configStrategy;
    }

    // Auto-determine strategy based on event characteristics
    const timeDifference = this.getMaxTimeDifference(events);
    
    // If events are very close in time (< 1 second), use priority
    if (timeDifference < 1000) {
      return 'priority';
    }
    
    // If events have significant time difference, use timestamp
    if (timeDifference > 5000) {
      return 'timestamp';
    }
    
    // For edge cases, require manual resolution
    return 'manual';
  }

  private async resolveByTimestamp(events: CdcEvent[]): Promise<ConflictResolution> {
    // Latest timestamp wins
    const winner = events.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    );
    
    const losers = events.filter(event => event.id !== winner.id);
    
    return {
      strategy: 'timestamp',
      winner,
      loser: losers[0], // For simplicity, just track first loser
      resolution: 'auto',
      resolvedAt: new Date(),
      resolvedBy: 'system'
    };
  }

  private async resolveByPriority(events: CdcEvent[]): Promise<ConflictResolution> {
    // Highest priority source wins
    const winner = events.reduce((highest, current) => {
      const currentPriority = this.sourcePriorities.get(current.source) || 0;
      const highestPriority = this.sourcePriorities.get(highest.source) || 0;
      
      return currentPriority > highestPriority ? current : highest;
    });
    
    const losers = events.filter(event => event.id !== winner.id);
    
    return {
      strategy: 'priority',
      winner,
      loser: losers[0],
      resolution: 'auto',
      resolvedAt: new Date(),
      resolvedBy: 'system'
    };
  }

  private async requireManualResolution(events: CdcEvent[]): Promise<ConflictResolution> {
    // Log conflict details for manual review
    logger.warn('⚠️ Manual conflict resolution required:', {
      eventCount: events.length,
      events: events.map(e => ({
        id: e.id,
        source: e.source,
        table: e.table,
        operation: e.operation,
        timestamp: e.timestamp,
        primaryKey: e.primaryKey
      }))
    });

    return {
      strategy: 'manual',
      resolution: 'manual',
      resolvedAt: new Date(),
      resolvedBy: 'pending'
    };
  }

  private getMaxTimeDifference(events: CdcEvent[]): number {
    if (events.length < 2) return 0;
    
    const timestamps = events.map(e => e.timestamp.getTime());
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    
    return max - min;
  }

  detectConflict(newEvent: CdcEvent, existingEvents: CdcEvent[]): boolean {
    // Check for conflicts based on primary key and table
    const conflicts = existingEvents.filter(existing => 
      existing.table === newEvent.table &&
      this.hasSamePrimaryKey(existing.primaryKey, newEvent.primaryKey) &&
      existing.id !== newEvent.id
    );

    if (conflicts.length === 0) {
      return false;
    }

    // Check if events are close enough in time to be considered conflicting
    const timeDifference = Math.abs(
      newEvent.timestamp.getTime() - conflicts[0].timestamp.getTime()
    );

    // Consider events conflicting if they're within the conflict window
    const conflictWindow = config.sync.conflictWindowMs || 5000; // 5 seconds default
    
    return timeDifference <= conflictWindow;
  }

  private hasSamePrimaryKey(pk1: Record<string, any>, pk2: Record<string, any>): boolean {
    const keys1 = Object.keys(pk1).sort();
    const keys2 = Object.keys(pk2).sort();
    
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    return keys1.every(key => 
      keys2.includes(key) && pk1[key] === pk2[key]
    );
  }

  async applyResolution(resolution: ConflictResolution): Promise<void> {
    if (!resolution.winner) {
      throw new Error('Cannot apply resolution without a winner');
    }

    if (resolution.resolution === 'manual') {
      logger.info('📋 Manual resolution required - queuing for human review');
      // In a real implementation, this would queue the conflict for manual review
      return;
    }

    logger.info(`🎯 Applying conflict resolution: ${resolution.strategy}`);
    
    // The winning event should be processed normally
    // The losing events should be marked as resolved/ignored
    
    // This would typically involve:
    // 1. Processing the winning event
    // 2. Logging the losing events as conflicts
    // 3. Updating conflict metrics
  }

  getConflictStats(): any {
    return {
      sourcePriorities: Object.fromEntries(this.sourcePriorities),
      conflictWindow: config.sync.conflictWindowMs,
      strategy: config.sync.conflictStrategy
    };
  }

  updateSourcePriority(source: DatabaseSource, priority: number): void {
    this.sourcePriorities.set(source, priority);
    logger.info(`🔧 Updated priority for ${source}: ${priority}`);
  }
}