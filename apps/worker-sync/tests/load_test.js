import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const syncLatency = new Trend('sync_latency');
const syncErrors = new Rate('sync_errors');
const syncThroughput = new Counter('sync_throughput');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 200 },   // Stay at 200 users
    { duration: '2m', target: 500 },   // Ramp up to 500 users
    { duration: '10m', target: 500 },  // Stay at 500 users for 10 minutes
    { duration: '2m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% of requests must complete below 100ms
    http_req_failed: ['rate<0.01'],   // Error rate must be below 1%
    sync_latency: ['p(95)<500'],      // 95% of sync operations below 500ms
    sync_errors: ['rate<0.01'],       // Sync error rate below 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const HEALTH_URL = __ENV.HEALTH_URL || 'http://localhost:3003';

// Test data generators
function generateUser() {
  const userId = Math.random().toString(36).substring(7);
  return {
    id: userId,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    status: 'active',
    metadata: {
      role: 'user',
      preferences: {
        theme: Math.random() > 0.5 ? 'dark' : 'light'
      }
    }
  };
}

function generateProduct() {
  const productId = Math.random().toString(36).substring(7);
  const categories = ['Electronics', 'Books', 'Clothing', 'Home', 'Sports'];
  return {
    id: productId,
    name: `Product ${productId}`,
    description: `Description for product ${productId}`,
    price: Math.floor(Math.random() * 1000) + 10,
    category: categories[Math.floor(Math.random() * categories.length)],
    tags: [`tag${Math.floor(Math.random() * 10)}`, `tag${Math.floor(Math.random() * 10)}`],
    is_active: true
  };
}

function generateOrder(userId) {
  const orderId = Math.random().toString(36).substring(7);
  return {
    id: orderId,
    user_id: userId,
    total_amount: Math.floor(Math.random() * 500) + 50,
    status: 'pending',
    order_data: {
      items: [
        { product_id: Math.random().toString(36).substring(7), quantity: Math.floor(Math.random() * 5) + 1 }
      ]
    }
  };
}

// Test scenarios
export default function () {
  const scenario = Math.random();
  
  if (scenario < 0.4) {
    // 40% - Test sync operations
    testSyncOperations();
  } else if (scenario < 0.7) {
    // 30% - Test health endpoints
    testHealthEndpoints();
  } else if (scenario < 0.9) {
    // 20% - Test metrics endpoints
    testMetricsEndpoints();
  } else {
    // 10% - Test conflict resolution
    testConflictResolution();
  }
  
  sleep(Math.random() * 2 + 1); // Random sleep between 1-3 seconds
}

function testSyncOperations() {
  const startTime = Date.now();
  
  // Simulate database operations that trigger sync
  const operations = [
    () => simulateInsert('users', generateUser()),
    () => simulateInsert('products', generateProduct()),
    () => simulateUpdate('users', generateUser()),
    () => simulateUpdate('products', generateProduct()),
    () => simulateDelete('users', Math.random().toString(36).substring(7)),
  ];
  
  const operation = operations[Math.floor(Math.random() * operations.length)];
  const result = operation();
  
  const latency = Date.now() - startTime;
  syncLatency.add(latency);
  syncThroughput.add(1);
  
  if (!result.success) {
    syncErrors.add(1);
  }
}

function simulateInsert(table, data) {
  const response = http.post(`${BASE_URL}/sync/simulate/${table}/insert`, JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '30s',
  });
  
  const success = check(response, {
    'insert operation successful': (r) => r.status === 201 || r.status === 200,
    'insert response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  return { success, response };
}

function simulateUpdate(table, data) {
  const response = http.put(`${BASE_URL}/sync/simulate/${table}/update`, JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '30s',
  });
  
  const success = check(response, {
    'update operation successful': (r) => r.status === 200,
    'update response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  return { success, response };
}

function simulateDelete(table, id) {
  const response = http.del(`${BASE_URL}/sync/simulate/${table}/delete/${id}`, null, {
    timeout: '30s',
  });
  
  const success = check(response, {
    'delete operation successful': (r) => r.status === 200 || r.status === 204,
    'delete response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  return { success, response };
}

function testHealthEndpoints() {
  const healthResponse = http.get(`${HEALTH_URL}/health`, { timeout: '10s' });
  
  check(healthResponse, {
    'health check successful': (r) => r.status === 200,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
    'health check returns valid JSON': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
  });
  
  const readyResponse = http.get(`${HEALTH_URL}/health/ready`, { timeout: '10s' });
  
  check(readyResponse, {
    'ready check successful': (r) => r.status === 200,
    'ready check response time < 500ms': (r) => r.timings.duration < 500,
  });
}

function testMetricsEndpoints() {
  const metricsResponse = http.get(`${HEALTH_URL}/metrics`, { timeout: '10s' });
  
  check(metricsResponse, {
    'metrics endpoint successful': (r) => r.status === 200,
    'metrics response time < 1000ms': (r) => r.timings.duration < 1000,
    'metrics contains prometheus format': (r) => r.body.includes('# HELP'),
  });
  
  const statusResponse = http.get(`${BASE_URL}/sync/status`, { timeout: '10s' });
  
  check(statusResponse, {
    'sync status successful': (r) => r.status === 200,
    'sync status response time < 500ms': (r) => r.timings.duration < 500,
  });
}

function testConflictResolution() {
  // Simulate concurrent updates that might cause conflicts
  const user = generateUser();
  const userId = user.id;
  
  // Create user first
  const createResponse = http.post(`${BASE_URL}/sync/simulate/users/insert`, JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '30s',
  });
  
  if (createResponse.status === 200 || createResponse.status === 201) {
    // Simulate concurrent updates
    const update1 = { ...user, name: 'Updated Name 1', updated_at: new Date().toISOString() };
    const update2 = { ...user, name: 'Updated Name 2', updated_at: new Date().toISOString() };
    
    const responses = http.batch([
      ['PUT', `${BASE_URL}/sync/simulate/users/update`, JSON.stringify(update1), {
        headers: { 'Content-Type': 'application/json' },
        timeout: '30s',
      }],
      ['PUT', `${BASE_URL}/sync/simulate/users/update`, JSON.stringify(update2), {
        headers: { 'Content-Type': 'application/json' },
        timeout: '30s',
      }],
    ]);
    
    check(responses, {
      'concurrent updates handled': (r) => r.every(res => res.status === 200 || res.status === 409),
      'conflict resolution triggered': (r) => r.some(res => res.status === 409),
    });
    
    // Check conflict resolution status
    const conflictResponse = http.get(`${BASE_URL}/sync/conflicts?table=users&primary_key=${userId}`, {
      timeout: '10s',
    });
    
    check(conflictResponse, {
      'conflict status check successful': (r) => r.status === 200,
    });
  }
}

// Setup function - runs once before all VUs
export function setup() {
  console.log('Starting load test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Health URL: ${HEALTH_URL}`);
  
  // Verify services are running
  const healthCheck = http.get(`${HEALTH_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`Service not ready. Health check failed with status: ${healthCheck.status}`);
  }
  
  console.log('Services are ready. Starting load test...');
  return { timestamp: Date.now() };
}

// Teardown function - runs once after all VUs
export function teardown(data) {
  console.log(`Load test completed. Duration: ${(Date.now() - data.timestamp) / 1000}s`);
}