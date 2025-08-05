// MongoDB initialization script for Sync Worker
// This script sets up the necessary collections and configurations for CDC

// Switch to sync database
db = db.getSiblingDB('sync_db');

// Create collections with validation schemas
db.createCollection('sync_metadata', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['source_db', 'table_name'],
      properties: {
        _id: { bsonType: 'objectId' },
        source_db: { bsonType: 'string', maxLength: 50 },
        table_name: { bsonType: 'string', maxLength: 100 },
        last_sync_timestamp: { bsonType: 'date' },
        sync_status: { 
          bsonType: 'string', 
          enum: ['active', 'inactive', 'error'],
          description: 'must be one of the enum values'
        },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('sync_conflicts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['table_name', 'primary_key', 'conflict_events'],
      properties: {
        _id: { bsonType: 'objectId' },
        table_name: { bsonType: 'string', maxLength: 100 },
        primary_key: { bsonType: 'object' },
        conflict_events: { bsonType: 'array' },
        resolution_strategy: { 
          bsonType: 'string',
          enum: ['timestamp', 'source_priority', 'manual'],
          description: 'must be one of the enum values'
        },
        winner_event_id: { bsonType: 'string' },
        status: { 
          bsonType: 'string',
          enum: ['pending', 'resolved', 'failed'],
          description: 'must be one of the enum values'
        },
        resolved_at: { bsonType: 'date' },
        resolved_by: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' }
      }
    }
  }
});

// Create sample collections for testing
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'name'],
      properties: {
        _id: { bsonType: 'objectId' },
        id: { bsonType: 'string' },
        email: { 
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
          description: 'must be a valid email address'
        },
        name: { bsonType: 'string', maxLength: 255 },
        status: { 
          bsonType: 'string',
          enum: ['active', 'inactive', 'suspended'],
          description: 'must be one of the enum values'
        },
        metadata: { bsonType: 'object' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name'],
      properties: {
        _id: { bsonType: 'objectId' },
        id: { bsonType: 'string' },
        name: { bsonType: 'string', maxLength: 255 },
        description: { bsonType: 'string' },
        price: { bsonType: 'number', minimum: 0 },
        category: { bsonType: 'string', maxLength: 100 },
        tags: { 
          bsonType: 'array',
          items: { bsonType: 'string' }
        },
        is_active: { bsonType: 'bool' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('orders', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      properties: {
        _id: { bsonType: 'objectId' },
        id: { bsonType: 'string' },
        user_id: { bsonType: 'string' },
        total_amount: { bsonType: 'number', minimum: 0 },
        status: { 
          bsonType: 'string',
          enum: ['pending', 'processing', 'completed', 'cancelled'],
          description: 'must be one of the enum values'
        },
        order_data: { bsonType: 'object' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' }
      }
    }
  }
});

// Create audit log collection for change tracking
db.createCollection('audit_log', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['table_name', 'operation', 'primary_key', 'timestamp'],
      properties: {
        _id: { bsonType: 'objectId' },
        table_name: { bsonType: 'string', maxLength: 100 },
        operation: { 
          bsonType: 'string',
          enum: ['INSERT', 'UPDATE', 'DELETE'],
          description: 'must be one of the enum values'
        },
        primary_key: { bsonType: 'object' },
        old_data: { bsonType: 'object' },
        new_data: { bsonType: 'object' },
        timestamp: { bsonType: 'date' },
        transaction_id: { bsonType: 'string' },
        user: { bsonType: 'string' },
        source: { bsonType: 'string' }
      }
    }
  }
});

// Create indexes for performance
db.sync_metadata.createIndex({ 'source_db': 1, 'table_name': 1 }, { unique: true });
db.sync_metadata.createIndex({ 'sync_status': 1 });

db.sync_conflicts.createIndex({ 'status': 1 });
db.sync_conflicts.createIndex({ 'table_name': 1 });
db.sync_conflicts.createIndex({ 'created_at': 1 });

db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'id': 1 }, { unique: true, sparse: true });
db.users.createIndex({ 'status': 1 });

db.products.createIndex({ 'id': 1 }, { unique: true, sparse: true });
db.products.createIndex({ 'category': 1 });
db.products.createIndex({ 'is_active': 1 });
db.products.createIndex({ 'name': 'text', 'description': 'text' });

db.orders.createIndex({ 'id': 1 }, { unique: true, sparse: true });
db.orders.createIndex({ 'user_id': 1 });
db.orders.createIndex({ 'status': 1 });
db.orders.createIndex({ 'created_at': 1 });

db.audit_log.createIndex({ 'table_name': 1, 'timestamp': 1 });
db.audit_log.createIndex({ 'operation': 1 });
db.audit_log.createIndex({ 'timestamp': 1 });

// Insert sample data with proper ObjectIds and timestamps
const now = new Date();

// Insert sync metadata
db.sync_metadata.insertMany([
  {
    source_db: 'postgres',
    table_name: 'users',
    last_sync_timestamp: now,
    sync_status: 'active',
    created_at: now,
    updated_at: now
  },
  {
    source_db: 'mysql',
    table_name: 'products',
    last_sync_timestamp: now,
    sync_status: 'active',
    created_at: now,
    updated_at: now
  }
]);

// Insert sample users
db.users.insertMany([
  {
    id: 'user-001',
    email: 'john.doe@example.com',
    name: 'John Doe',
    status: 'active',
    metadata: {
      role: 'admin',
      preferences: {
        theme: 'dark',
        notifications: true
      }
    },
    created_at: now,
    updated_at: now
  },
  {
    id: 'user-002',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    status: 'active',
    metadata: {
      role: 'user',
      preferences: {
        theme: 'light',
        notifications: false
      }
    },
    created_at: now,
    updated_at: now
  },
  {
    id: 'user-003',
    email: 'bob.wilson@example.com',
    name: 'Bob Wilson',
    status: 'inactive',
    metadata: {
      role: 'user',
      last_login: '2024-01-15T10:30:00Z'
    },
    created_at: now,
    updated_at: now
  }
]);

// Insert sample products
db.products.insertMany([
  {
    id: 'prod-001',
    name: 'Laptop Pro',
    description: 'High-performance laptop for professionals',
    price: 1299.99,
    category: 'Electronics',
    tags: ['laptop', 'computer', 'professional'],
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    id: 'prod-002',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse',
    price: 29.99,
    category: 'Electronics',
    tags: ['mouse', 'wireless', 'ergonomic'],
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    id: 'prod-003',
    name: 'Coffee Mug',
    description: 'Ceramic coffee mug with logo',
    price: 12.99,
    category: 'Office',
    tags: ['mug', 'coffee', 'ceramic'],
    is_active: true,
    created_at: now,
    updated_at: now
  }
]);

// Insert sample orders
db.orders.insertMany([
  {
    id: 'order-001',
    user_id: 'user-001',
    total_amount: 1329.98,
    status: 'completed',
    order_data: {
      items: [
        { product_id: 'prod-001', quantity: 1, price: 1299.99 },
        { product_id: 'prod-002', quantity: 1, price: 29.99 }
      ],
      shipping_address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001'
      }
    },
    created_at: now,
    updated_at: now
  },
  {
    id: 'order-002',
    user_id: 'user-002',
    total_amount: 12.99,
    status: 'pending',
    order_data: {
      items: [
        { product_id: 'prod-003', quantity: 1, price: 12.99 }
      ],
      shipping_address: {
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90210'
      }
    },
    created_at: now,
    updated_at: now
  }
]);

// Enable change streams for CDC
// Note: Change streams require replica set or sharded cluster
// For development, we'll create a simple trigger simulation

// Create a function to log changes (for development purposes)
function logChange(collection, operation, document, oldDocument) {
  db.audit_log.insertOne({
    table_name: collection,
    operation: operation,
    primary_key: { _id: document._id },
    old_data: oldDocument || null,
    new_data: document,
    timestamp: new Date(),
    transaction_id: new ObjectId().toString(),
    user: 'system',
    source: 'mongodb'
  });
}

// Create user for change stream access
db.createUser({
  user: 'sync_user',
  pwd: 'sync_password',
  roles: [
    { role: 'readWrite', db: 'sync_db' },
    { role: 'changeStreamPreAndPostImages', db: 'sync_db' }
  ]
});

// Print initialization complete message
print('MongoDB initialization completed successfully!');
print('Database: sync_db');
print('Collections created: sync_metadata, sync_conflicts, users, products, orders, audit_log');
print('Indexes created for performance optimization');
print('Sample data inserted');
print('User created: sync_user with readWrite permissions');
print('Ready for Change Data Capture (CDC) operations');

// Enable pre and post images for change streams (MongoDB 6.0+)
try {
  db.runCommand({
    collMod: 'users',
    changeStreamPreAndPostImages: { enabled: true }
  });
  
  db.runCommand({
    collMod: 'products',
    changeStreamPreAndPostImages: { enabled: true }
  });
  
  db.runCommand({
    collMod: 'orders',
    changeStreamPreAndPostImages: { enabled: true }
  });
  
  print('Change stream pre and post images enabled for all collections');
} catch (e) {
  print('Warning: Could not enable change stream pre and post images. This feature requires MongoDB 6.0+ and replica set.');
  print('Error: ' + e.message);
}