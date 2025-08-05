/**
 * Kafka Configuration
 * AdminGriffe - Sistema de Auditoría Integral
 */

import { KafkaConfig } from '../infrastructure/kafka/kafka.service';

export const kafkaConfig: KafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || 'audit-system',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  ssl: process.env.KAFKA_SSL === 'true',
  sasl: process.env.KAFKA_USERNAME ? {
    mechanism: 'plain',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD || ''
  } : undefined,
  connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT || '3000'),
  requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT || '30000'),
  retry: {
    initialRetryTime: parseInt(process.env.KAFKA_INITIAL_RETRY_TIME || '100'),
    retries: parseInt(process.env.KAFKA_RETRIES || '8')
  }
};

// Topic configurations for audit system
export const auditTopics = [
  {
    topic: 'audit.postgres.changes',
    numPartitions: 6,
    replicationFactor: 1
  },
  {
    topic: 'audit.mysql.changes',
    numPartitions: 6,
    replicationFactor: 1
  },
  {
    topic: 'audit.mongo.changes',
    numPartitions: 6,
    replicationFactor: 1
  },
  {
    topic: 'sync.conflicts',
    numPartitions: 3,
    replicationFactor: 1
  },
  {
    topic: 'sync.deadletter',
    numPartitions: 3,
    replicationFactor: 1
  },
  {
    topic: 'audit.compliance.export',
    numPartitions: 2,
    replicationFactor: 1
  }
];

// Consumer configurations
export const consumerConfigs = {
  auditProcessor: {
    groupId: 'audit-processor',
    topics: ['audit.postgres.changes', 'audit.mysql.changes', 'audit.mongo.changes'],
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
    autoCommit: true,
    fromBeginning: false
  },
  syncProcessor: {
    groupId: 'sync-processor',
    topics: ['audit.postgres.changes', 'audit.mysql.changes', 'audit.mongo.changes'],
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
    autoCommit: false, // Manual commit for exactly-once processing
    fromBeginning: false
  },
  conflictResolver: {
    groupId: 'conflict-resolver',
    topics: ['sync.conflicts'],
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
    autoCommit: true,
    fromBeginning: false
  }
};