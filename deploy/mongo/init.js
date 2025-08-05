// MongoDB Initialization Script for Audit System
// AdminGriffe - Sistema de Auditoría Integral

// Switch to audit database
db = db.getSiblingDB('audit_mongo');

// Create collections with validation schemas
db.createCollection('audit_log', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['tenantId', 'dbEngine', 'tableName', 'operation', 'executedAt'],
      properties: {
        tenantId: {
          bsonType: 'string',
          description: 'Tenant identifier for multi-tenancy'
        },
        dbEngine: {
          bsonType: 'string',
          enum: ['mongodb', 'postgres', 'mysql'],
          description: 'Source database engine'
        },
        schemaName: {
          bsonType: 'string',
          description: 'Database schema name'
        },
        tableName: {
          bsonType: 'string',
          description: 'Table/Collection name'
        },
        operation: {
          bsonType: 'string',
          enum: ['insert', 'update', 'delete', 'replace', 'drop', 'invalidate'],
          description: 'Type of operation performed'
        },
        primaryKey: {
          bsonType: 'object',
          description: 'Primary key of the affected document'
        },
        diffOld: {
          bsonType: 'object',
          description: 'Document state before change'
        },
        diffNew: {
          bsonType: 'object',
          description: 'Document state after change'
        },
        executedBy: {
          bsonType: 'string',
          description: 'User who executed the operation'
        },
        clientIp: {
          bsonType: 'string',
          description: 'Client IP address'
        },
        userAgent: {
          bsonType: 'string',
          description: 'Client user agent'
        },
        sessionId: {
          bsonType: 'string',
          description: 'Session identifier'
        },
        transactionId: {
          bsonType: 'string',
          description: 'Transaction identifier'
        },
        executedAt: {
          bsonType: 'date',
          description: 'Timestamp when operation was executed'
        },
        signature: {
          bsonType: 'binData',
          description: 'Digital signature for immutability'
        },
        metadata: {
          bsonType: 'object',
          description: 'Additional metadata'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Audit record creation timestamp'
        }
      }
    }
  }
});

// Create indexes for audit_log
db.audit_log.createIndex({ tenantId: 1, tableName: 1, executedAt: -1 });
db.audit_log.createIndex({ tableName: 1, operation: 1 });
db.audit_log.createIndex({ executedAt: -1 });
db.audit_log.createIndex({ executedBy: 1 });
db.audit_log.createIndex({ 'primaryKey._id': 1 });
db.audit_log.createIndex({ tenantId: 1, executedAt: -1 });

// Create sync_status collection
db.createCollection('sync_status', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['sourceEngine', 'targetEngine', 'status'],
      properties: {
        sourceEngine: {
          bsonType: 'string',
          description: 'Source database engine'
        },
        targetEngine: {
          bsonType: 'string',
          description: 'Target database engine'
        },
        lastSyncAt: {
          bsonType: 'date',
          description: 'Last successful sync timestamp'
        },
        lastSyncPosition: {
          bsonType: 'object',
          description: 'Last sync position/offset'
        },
        syncLagMs: {
          bsonType: 'int',
          minimum: 0,
          description: 'Sync lag in milliseconds'
        },
        status: {
          bsonType: 'string',
          enum: ['active', 'paused', 'error', 'stopped'],
          description: 'Sync status'
        },
        errorMessage: {
          bsonType: 'string',
          description: 'Error message if status is error'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Record creation timestamp'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Record last update timestamp'
        }
      }
    }
  }
});

db.sync_status.createIndex({ sourceEngine: 1, targetEngine: 1 }, { unique: true });
db.sync_status.createIndex({ status: 1 });

// Create sync_conflicts collection
db.createCollection('sync_conflicts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['tenantId', 'sourceEngine', 'targetEngine', 'tableName', 'primaryKey', 'conflictType'],
      properties: {
        tenantId: {
          bsonType: 'string',
          description: 'Tenant identifier'
        },
        sourceEngine: {
          bsonType: 'string',
          description: 'Source database engine'
        },
        targetEngine: {
          bsonType: 'string',
          description: 'Target database engine'
        },
        tableName: {
          bsonType: 'string',
          description: 'Table/Collection name'
        },
        primaryKey: {
          bsonType: 'object',
          description: 'Primary key of conflicted record'
        },
        sourceData: {
          bsonType: 'object',
          description: 'Data from source system'
        },
        targetData: {
          bsonType: 'object',
          description: 'Data from target system'
        },
        conflictType: {
          bsonType: 'string',
          enum: ['update_conflict', 'delete_conflict', 'insert_conflict', 'schema_conflict'],
          description: 'Type of conflict'
        },
        resolutionStrategy: {
          bsonType: 'string',
          enum: ['source_wins', 'target_wins', 'merge', 'manual', 'timestamp_based'],
          description: 'Strategy used to resolve conflict'
        },
        resolvedData: {
          bsonType: 'object',
          description: 'Final resolved data'
        },
        status: {
          bsonType: 'string',
          enum: ['pending', 'resolved', 'manual', 'failed'],
          description: 'Conflict resolution status'
        },
        resolvedBy: {
          bsonType: 'string',
          description: 'User who resolved the conflict'
        },
        resolvedAt: {
          bsonType: 'date',
          description: 'Conflict resolution timestamp'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Conflict creation timestamp'
        },
        metadata: {
          bsonType: 'object',
          description: 'Additional metadata'
        }
      }
    }
  }
});

db.sync_conflicts.createIndex({ tenantId: 1, status: 1 });
db.sync_conflicts.createIndex({ tableName: 1, conflictType: 1 });
db.sync_conflicts.createIndex({ createdAt: -1 });

// Create business collections for testing
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['tenantId', 'name', 'email'],
      properties: {
        tenantId: {
          bsonType: 'string',
          description: 'Tenant identifier'
        },
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 100,
          description: 'User full name'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'User email address'
        },
        passwordHash: {
          bsonType: 'string',
          description: 'Hashed password'
        },
        role: {
          bsonType: 'string',
          enum: ['admin', 'manager', 'user', 'guest'],
          description: 'User role'
        },
        isActive: {
          bsonType: 'bool',
          description: 'User active status'
        },
        lastLoginAt: {
          bsonType: 'date',
          description: 'Last login timestamp'
        },
        profile: {
          bsonType: 'object',
          properties: {
            firstName: { bsonType: 'string' },
            lastName: { bsonType: 'string' },
            phone: { bsonType: 'string' },
            address: {
              bsonType: 'object',
              properties: {
                street: { bsonType: 'string' },
                city: { bsonType: 'string' },
                state: { bsonType: 'string' },
                zipCode: { bsonType: 'string' },
                country: { bsonType: 'string' }
              }
            }
          }
        },
        preferences: {
          bsonType: 'object',
          description: 'User preferences'
        },
        createdAt: {
          bsonType: 'date',
          description: 'User creation timestamp'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'User last update timestamp'
        }
      }
    }
  }
});

db.users.createIndex({ tenantId: 1, email: 1 }, { unique: true });
db.users.createIndex({ tenantId: 1, role: 1 });
db.users.createIndex({ isActive: 1 });

db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['tenantId', 'name', 'price'],
      properties: {
        tenantId: {
          bsonType: 'string',
          description: 'Tenant identifier'
        },
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 200,
          description: 'Product name'
        },
        description: {
          bsonType: 'string',
          description: 'Product description'
        },
        price: {
          bsonType: 'decimal',
          minimum: 0,
          description: 'Product price'
        },
        category: {
          bsonType: 'string',
          description: 'Product category'
        },
        tags: {
          bsonType: 'array',
          items: { bsonType: 'string' },
          description: 'Product tags'
        },
        stock: {
          bsonType: 'int',
          minimum: 0,
          description: 'Available stock'
        },
        isActive: {
          bsonType: 'bool',
          description: 'Product active status'
        },
        specifications: {
          bsonType: 'object',
          description: 'Product specifications'
        },
        images: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              url: { bsonType: 'string' },
              alt: { bsonType: 'string' },
              isPrimary: { bsonType: 'bool' }
            }
          }
        },
        createdAt: {
          bsonType: 'date',
          description: 'Product creation timestamp'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Product last update timestamp'
        }
      }
    }
  }
});

db.products.createIndex({ tenantId: 1, category: 1 });
db.products.createIndex({ tenantId: 1, name: 'text', description: 'text' });
db.products.createIndex({ isActive: 1, price: 1 });

db.createCollection('orders', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['tenantId', 'userId', 'total', 'status'],
      properties: {
        tenantId: {
          bsonType: 'string',
          description: 'Tenant identifier'
        },
        userId: {
          bsonType: 'objectId',
          description: 'User who placed the order'
        },
        items: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['productId', 'quantity', 'unitPrice'],
            properties: {
              productId: { bsonType: 'objectId' },
              productName: { bsonType: 'string' },
              quantity: { bsonType: 'int', minimum: 1 },
              unitPrice: { bsonType: 'decimal', minimum: 0 },
              totalPrice: { bsonType: 'decimal', minimum: 0 }
            }
          }
        },
        total: {
          bsonType: 'decimal',
          minimum: 0,
          description: 'Order total amount'
        },
        status: {
          bsonType: 'string',
          enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
          description: 'Order status'
        },
        shippingAddress: {
          bsonType: 'object',
          properties: {
            street: { bsonType: 'string' },
            city: { bsonType: 'string' },
            state: { bsonType: 'string' },
            zipCode: { bsonType: 'string' },
            country: { bsonType: 'string' }
          }
        },
        paymentMethod: {
          bsonType: 'string',
          enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash'],
          description: 'Payment method'
        },
        orderDate: {
          bsonType: 'date',
          description: 'Order placement date'
        },
        shippedAt: {
          bsonType: 'date',
          description: 'Order shipment date'
        },
        deliveredAt: {
          bsonType: 'date',
          description: 'Order delivery date'
        },
        notes: {
          bsonType: 'string',
          description: 'Order notes'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Order creation timestamp'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Order last update timestamp'
        }
      }
    }
  }
});

db.orders.createIndex({ tenantId: 1, userId: 1 });
db.orders.createIndex({ tenantId: 1, status: 1 });
db.orders.createIndex({ orderDate: -1 });

// Insert sample data
const now = new Date();

// Sample users
db.users.insertMany([
  {
    tenantId: 'default',
    name: 'Admin User',
    email: 'admin@test.com',
    passwordHash: 'hashed_password_admin',
    role: 'admin',
    isActive: true,
    profile: {
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890'
    },
    createdAt: now,
    updatedAt: now
  },
  {
    tenantId: 'default',
    name: 'John Doe',
    email: 'john@test.com',
    passwordHash: 'hashed_password_john',
    role: 'user',
    isActive: true,
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567891',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      }
    },
    preferences: {
      notifications: true,
      newsletter: false
    },
    createdAt: now,
    updatedAt: now
  },
  {
    tenantId: 'default',
    name: 'Jane Smith',
    email: 'jane@test.com',
    passwordHash: 'hashed_password_jane',
    role: 'manager',
    isActive: true,
    profile: {
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1234567892'
    },
    createdAt: now,
    updatedAt: now
  }
]);

// Sample products
db.products.insertMany([
  {
    tenantId: 'default',
    name: 'MacBook Pro 16"',
    description: 'High-performance laptop for professionals',
    price: NumberDecimal('2499.99'),
    category: 'Electronics',
    tags: ['laptop', 'apple', 'professional'],
    stock: 25,
    isActive: true,
    specifications: {
      processor: 'M2 Pro',
      memory: '16GB',
      storage: '512GB SSD',
      display: '16-inch Liquid Retina XDR'
    },
    images: [
      { url: '/images/macbook-pro-1.jpg', alt: 'MacBook Pro front view', isPrimary: true },
      { url: '/images/macbook-pro-2.jpg', alt: 'MacBook Pro side view', isPrimary: false }
    ],
    createdAt: now,
    updatedAt: now
  },
  {
    tenantId: 'default',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with precision tracking',
    price: NumberDecimal('79.99'),
    category: 'Electronics',
    tags: ['mouse', 'wireless', 'ergonomic'],
    stock: 150,
    isActive: true,
    specifications: {
      connectivity: 'Bluetooth 5.0',
      battery: 'Rechargeable Li-ion',
      dpi: '4000 DPI'
    },
    createdAt: now,
    updatedAt: now
  },
  {
    tenantId: 'default',
    name: 'Office Chair',
    description: 'Comfortable ergonomic office chair with lumbar support',
    price: NumberDecimal('399.99'),
    category: 'Furniture',
    tags: ['chair', 'office', 'ergonomic'],
    stock: 40,
    isActive: true,
    specifications: {
      material: 'Mesh and fabric',
      adjustable: 'Height, armrests, lumbar',
      weight_capacity: '300 lbs'
    },
    createdAt: now,
    updatedAt: now
  }
]);

// Get user and product IDs for orders
const adminUser = db.users.findOne({ email: 'admin@test.com' });
const johnUser = db.users.findOne({ email: 'john@test.com' });
const macbook = db.products.findOne({ name: 'MacBook Pro 16"' });
const mouse = db.products.findOne({ name: 'Wireless Mouse' });

// Sample orders
if (adminUser && johnUser && macbook && mouse) {
  db.orders.insertMany([
    {
      tenantId: 'default',
      userId: johnUser._id,
      items: [
        {
          productId: macbook._id,
          productName: macbook.name,
          quantity: 1,
          unitPrice: macbook.price,
          totalPrice: macbook.price
        },
        {
          productId: mouse._id,
          productName: mouse.name,
          quantity: 2,
          unitPrice: mouse.price,
          totalPrice: NumberDecimal('159.98')
        }
      ],
      total: NumberDecimal('2659.97'),
      status: 'confirmed',
      shippingAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      paymentMethod: 'credit_card',
      orderDate: now,
      createdAt: now,
      updatedAt: now
    }
  ]);
}

// Create views (aggregation pipelines)
db.createView('audit_summary', 'audit_log', [
  {
    $match: {
      executedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  },
  {
    $group: {
      _id: {
        tenantId: '$tenantId',
        tableName: '$tableName',
        operation: '$operation',
        hour: {
          $dateToString: {
            format: '%Y-%m-%d %H:00:00',
            date: '$executedAt'
          }
        }
      },
      operationCount: { $sum: 1 }
    }
  },
  {
    $sort: { '_id.hour': -1 }
  }
]);

db.createView('sync_health', 'sync_status', [
  {
    $addFields: {
      healthStatus: {
        $switch: {
          branches: [
            {
              case: { $lt: ['$lastSyncAt', new Date(Date.now() - 5 * 60 * 1000)] },
              then: 'stale'
            },
            {
              case: { $gt: ['$syncLagMs', 1000] },
              then: 'lagging'
            },
            {
              case: { $eq: ['$status', 'error'] },
              then: 'error'
            }
          ],
          default: 'healthy'
        }
      }
    }
  }
]);

// Create user for application
db.createUser({
  user: 'audit_user',
  pwd: 'audit_password',
  roles: [
    { role: 'readWrite', db: 'audit_mongo' },
    { role: 'dbAdmin', db: 'audit_mongo' }
  ]
});

// Enable change streams (requires replica set)
// This will be handled by the application when connecting

print('MongoDB audit database initialized successfully');
print('Collections created: audit_log, sync_status, sync_conflicts, users, products, orders');
print('Sample data inserted for testing');
print('Views created: audit_summary, sync_health');
print('User created: audit_user with readWrite permissions');