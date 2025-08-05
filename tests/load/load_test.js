/**
 * K6 Load Test for Audit System
 * AdminGriffe - Sistema de Auditoría Integral
 * 
 * Test Requirements:
 * - 10,000+ TPS without loss
 * - < 100ms sync lag
 * - 99% automatic conflict resolution
 * - 99.99% uptime
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend, Gauge } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const auditWriteRate = new Counter('audit_writes');
const syncLagTrend = new Trend('sync_lag_ms');
const conflictResolutionRate = new Rate('conflict_resolution_success');
const uptimeGauge = new Gauge('uptime_percentage');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 500 },   // Ramp up to 500 users
    { duration: '10m', target: 1000 }, // Ramp up to 1000 users (target 10k TPS)
    { duration: '10m', target: 1000 }, // Stay at 1000 users
    { duration: '5m', target: 500 },   // Ramp down to 500 users
    { duration: '2m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% of requests under 100ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
    errors: ['rate<0.01'],            // Custom error rate under 1%
    sync_lag_ms: ['p(95)<100'],       // 95% of sync operations under 100ms
    conflict_resolution_success: ['rate>0.99'], // 99% conflict resolution success
  },
};

// Base URL configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3002';
const WS_URL = __ENV.WS_URL || 'ws://localhost:3002';

// Test data generators
function generateUser() {
  return {
    name: `User ${Math.random().toString(36).substring(7)}`,
    email: `user${Math.random().toString(36).substring(7)}@test.com`,
    role: Math.random() > 0.5 ? 'admin' : 'user',
    tenantId: `tenant_${Math.floor(Math.random() * 10) + 1}`
  };
}

function generateProduct() {
  return {
    name: `Product ${Math.random().toString(36).substring(7)}`,
    price: Math.floor(Math.random() * 1000) + 10,
    category: `Category ${Math.floor(Math.random() * 5) + 1}`,
    stock: Math.floor(Math.random() * 100) + 1,
    tenantId: `tenant_${Math.floor(Math.random() * 10) + 1}`
  };
}

function generateOrder() {
  return {
    userId: Math.floor(Math.random() * 1000) + 1,
    items: [
      {
        productId: Math.floor(Math.random() * 1000) + 1,
        quantity: Math.floor(Math.random() * 5) + 1,
        price: Math.floor(Math.random() * 100) + 10
      }
    ],
    total: Math.floor(Math.random() * 500) + 50,
    status: 'pending',
    tenantId: `tenant_${Math.floor(Math.random() * 10) + 1}`
  };
}

// Authentication helper
function authenticate() {
  const loginPayload = {
    email: 'admin@test.com',
    password: 'admin123'
  };

  const response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(loginPayload), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(response, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => r.json('token') !== undefined,
  });

  return response.json('token');
}

// Main test scenario
export default function () {
  const token = authenticate();
  
  if (!token) {
    errorRate.add(1);
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': `tenant_${Math.floor(Math.random() * 10) + 1}`
  };

  // Test scenario selection (weighted)
  const scenario = Math.random();
  
  if (scenario < 0.4) {
    // 40% - CRUD operations (high audit volume)
    testCRUDOperations(headers);
  } else if (scenario < 0.7) {
    // 30% - Audit log queries
    testAuditQueries(headers);
  } else if (scenario < 0.9) {
    // 20% - Sync operations
    testSyncOperations(headers);
  } else {
    // 10% - WebSocket real-time audit
    testWebSocketAudit(headers);
  }

  sleep(Math.random() * 2 + 1); // Random sleep 1-3 seconds
}

function testCRUDOperations(headers) {
  const operations = ['create', 'update', 'delete'];
  const entities = ['users', 'products', 'orders'];
  
  const operation = operations[Math.floor(Math.random() * operations.length)];
  const entity = entities[Math.floor(Math.random() * entities.length)];
  
  let response;
  const startTime = Date.now();
  
  switch (operation) {
    case 'create':
      response = createEntity(entity, headers);
      break;
    case 'update':
      response = updateEntity(entity, headers);
      break;
    case 'delete':
      response = deleteEntity(entity, headers);
      break;
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Record audit write
  auditWriteRate.add(1);
  
  // Check response
  const success = check(response, {
    [`${operation} ${entity} successful`]: (r) => r.status >= 200 && r.status < 300,
    'response time acceptable': () => duration < 1000,
  });
  
  if (!success) {
    errorRate.add(1);
  }
}

function createEntity(entity, headers) {
  let payload;
  
  switch (entity) {
    case 'users':
      payload = generateUser();
      break;
    case 'products':
      payload = generateProduct();
      break;
    case 'orders':
      payload = generateOrder();
      break;
  }
  
  return http.post(`${BASE_URL}/api/${entity}`, JSON.stringify(payload), { headers });
}

function updateEntity(entity, headers) {
  const id = Math.floor(Math.random() * 100) + 1;
  let payload;
  
  switch (entity) {
    case 'users':
      payload = { name: `Updated User ${Date.now()}` };
      break;
    case 'products':
      payload = { price: Math.floor(Math.random() * 1000) + 10 };
      break;
    case 'orders':
      payload = { status: 'completed' };
      break;
  }
  
  return http.put(`${BASE_URL}/api/${entity}/${id}`, JSON.stringify(payload), { headers });
}

function deleteEntity(entity, headers) {
  const id = Math.floor(Math.random() * 100) + 1;
  return http.del(`${BASE_URL}/api/${entity}/${id}`, null, { headers });
}

function testAuditQueries(headers) {
  const queries = [
    '/api/audit/logs?limit=50',
    '/api/audit/logs?table=users&limit=20',
    '/api/audit/logs?operation=UPDATE&limit=30',
    '/api/audit/logs?startDate=2024-01-01&endDate=2024-12-31',
    '/api/audit/statistics',
    '/api/audit/trail/users/1'
  ];
  
  const query = queries[Math.floor(Math.random() * queries.length)];
  const startTime = Date.now();
  
  const response = http.get(`${BASE_URL}${query}`, { headers });
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const success = check(response, {
    'audit query successful': (r) => r.status === 200,
    'audit query fast': () => duration < 500,
    'audit data returned': (r) => r.json() !== undefined,
  });
  
  if (!success) {
    errorRate.add(1);
  }
}

function testSyncOperations(headers) {
  const syncEndpoints = [
    '/api/sync/status',
    '/api/sync/conflicts',
    '/api/sync/metrics',
    '/api/sync/health'
  ];
  
  const endpoint = syncEndpoints[Math.floor(Math.random() * syncEndpoints.length)];
  const startTime = Date.now();
  
  const response = http.get(`${BASE_URL}${endpoint}`, { headers });
  
  const endTime = Date.now();
  const syncLag = endTime - startTime;
  
  // Record sync lag
  syncLagTrend.add(syncLag);
  
  const success = check(response, {
    'sync operation successful': (r) => r.status === 200,
    'sync lag acceptable': () => syncLag < 100, // Target < 100ms
  });
  
  if (!success) {
    errorRate.add(1);
  }
  
  // Test conflict resolution if applicable
  if (endpoint === '/api/sync/conflicts') {
    const conflicts = response.json('conflicts') || [];
    if (conflicts.length > 0) {
      const resolved = conflicts.filter(c => c.status === 'resolved').length;
      const resolutionRate = resolved / conflicts.length;
      conflictResolutionRate.add(resolutionRate > 0.99 ? 1 : 0);
    }
  }
}

function testWebSocketAudit(headers) {
  const url = `${WS_URL}/audit/stream`;
  
  const response = ws.connect(url, {
    headers: {
      'Authorization': headers.Authorization,
      'X-Tenant-ID': headers['X-Tenant-ID']
    }
  }, function (socket) {
    socket.on('open', () => {
      // Subscribe to audit events
      socket.send(JSON.stringify({
        type: 'subscribe',
        filters: {
          tables: ['users', 'products', 'orders'],
          operations: ['INSERT', 'UPDATE', 'DELETE']
        }
      }));
    });
    
    socket.on('message', (data) => {
      const event = JSON.parse(data);
      
      check(event, {
        'audit event received': (e) => e.type === 'audit_event',
        'audit event has required fields': (e) => 
          e.table && e.operation && e.timestamp && e.data,
      });
      
      // Calculate sync lag
      const eventTime = new Date(event.timestamp).getTime();
      const currentTime = Date.now();
      const lag = currentTime - eventTime;
      
      syncLagTrend.add(lag);
    });
    
    socket.on('error', (e) => {
      errorRate.add(1);
      console.error('WebSocket error:', e);
    });
    
    // Keep connection open for 10 seconds
    sleep(10);
  });
  
  check(response, {
    'websocket connection successful': (r) => r && r.status === 101,
  });
}

// Setup function - runs once per VU
export function setup() {
  console.log('Starting load test setup...');
  
  // Health check
  const healthResponse = http.get(`${BASE_URL}/api/health`);
  
  check(healthResponse, {
    'service is healthy': (r) => r.status === 200,
  });
  
  if (healthResponse.status !== 200) {
    throw new Error('Service is not healthy, aborting test');
  }
  
  console.log('Load test setup completed');
  return { baseUrl: BASE_URL };
}

// Teardown function - runs once after all VUs finish
export function teardown(data) {
  console.log('Load test completed');
  
  // Final health check
  const healthResponse = http.get(`${data.baseUrl}/api/health`);
  const isHealthy = healthResponse.status === 200;
  
  uptimeGauge.add(isHealthy ? 100 : 0);
  
  console.log(`Final health status: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
}

// Handle summary - custom summary output
export function handleSummary(data) {
  const summary = {
    test_duration: data.state.testRunDurationMs,
    total_requests: data.metrics.http_reqs.values.count,
    request_rate: data.metrics.http_reqs.values.rate,
    error_rate: data.metrics.errors ? data.metrics.errors.values.rate : 0,
    avg_response_time: data.metrics.http_req_duration.values.avg,
    p95_response_time: data.metrics.http_req_duration.values['p(95)'],
    sync_lag_avg: data.metrics.sync_lag_ms ? data.metrics.sync_lag_ms.values.avg : 0,
    sync_lag_p95: data.metrics.sync_lag_ms ? data.metrics.sync_lag_ms.values['p(95)'] : 0,
    audit_writes: data.metrics.audit_writes ? data.metrics.audit_writes.values.count : 0,
    conflict_resolution_rate: data.metrics.conflict_resolution_success ? 
      data.metrics.conflict_resolution_success.values.rate : 0,
    uptime_percentage: data.metrics.uptime_percentage ? 
      data.metrics.uptime_percentage.values.value : 0,
  };
  
  // Validate requirements
  const requirements = {
    tps_target: summary.request_rate >= 10000,
    sync_lag_target: summary.sync_lag_p95 <= 100,
    conflict_resolution_target: summary.conflict_resolution_rate >= 0.99,
    uptime_target: summary.uptime_percentage >= 99.99,
    error_rate_target: summary.error_rate <= 0.01
  };
  
  const allRequirementsMet = Object.values(requirements).every(Boolean);
  
  return {
    'stdout': JSON.stringify({
      summary,
      requirements,
      test_passed: allRequirementsMet
    }, null, 2),
    'load_test_results.json': JSON.stringify({
      timestamp: new Date().toISOString(),
      summary,
      requirements,
      test_passed: allRequirementsMet,
      raw_data: data
    }, null, 2)
  };
}