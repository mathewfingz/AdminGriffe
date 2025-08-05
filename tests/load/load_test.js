import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const syncLag = new Trend('sync_lag_ms');
const auditThroughput = new Counter('audit_operations');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 500 },   // Stay at 500 users
    { duration: '2m', target: 1000 },  // Ramp up to 1000 users
    { duration: '10m', target: 1000 }, // Stay at 1000 users for 10 minutes
    { duration: '2m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% of requests must complete below 100ms
    http_req_failed: ['rate<0.01'],   // Error rate must be below 1%
    errors: ['rate<0.01'],
    sync_lag_ms: ['p(95)<100'],       // 95% of sync operations must complete below 100ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const WS_URL = __ENV.WS_URL || 'ws://localhost:3000';

// Test data
const testUsers = [
  { email: 'test1@example.com', password: 'password123' },
  { email: 'test2@example.com', password: 'password123' },
  { email: 'test3@example.com', password: 'password123' },
];

const testProducts = [
  { name: 'Product A', price: 100, category: 'Electronics' },
  { name: 'Product B', price: 200, category: 'Clothing' },
  { name: 'Product C', price: 300, category: 'Books' },
];

let authToken = '';

export function setup() {
  // Login to get auth token
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
    email: 'admin@example.com',
    password: 'admin123'
  });
  
  if (loginResponse.status === 200) {
    const body = JSON.parse(loginResponse.body);
    authToken = body.token;
    console.log('Setup completed with auth token');
  }
  
  return { authToken };
}

export default function(data) {
  const token = data.authToken || authToken;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Test scenario selection based on VU ID
  const scenario = __VU % 4;
  
  switch(scenario) {
    case 0:
      testAuditOperations(headers);
      break;
    case 1:
      testSyncOperations(headers);
      break;
    case 2:
      testWebSocketStreaming(token);
      break;
    case 3:
      testCRUDOperations(headers);
      break;
  }
  
  sleep(1);
}

function testAuditOperations(headers) {
  // Get audit logs
  const auditResponse = http.get(`${BASE_URL}/api/audit/logs?limit=100`, { headers });
  
  check(auditResponse, {
    'audit logs status is 200': (r) => r.status === 200,
    'audit logs response time < 100ms': (r) => r.timings.duration < 100,
  }) || errorRate.add(1);
  
  auditThroughput.add(1);
  
  // Get audit statistics
  const statsResponse = http.get(`${BASE_URL}/api/audit/stats`, { headers });
  
  check(statsResponse, {
    'audit stats status is 200': (r) => r.status === 200,
    'audit stats response time < 50ms': (r) => r.timings.duration < 50,
  }) || errorRate.add(1);
  
  // Test audit search
  const searchResponse = http.get(`${BASE_URL}/api/audit/search?table=products&operation=UPDATE`, { headers });
  
  check(searchResponse, {
    'audit search status is 200': (r) => r.status === 200,
    'audit search response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);
}

function testSyncOperations(headers) {
  // Get sync status
  const statusResponse = http.get(`${BASE_URL}/api/sync/status`, { headers });
  
  check(statusResponse, {
    'sync status is 200': (r) => r.status === 200,
    'sync status response time < 50ms': (r) => r.timings.duration < 50,
  }) || errorRate.add(1);
  
  if (statusResponse.status === 200) {
    const body = JSON.parse(statusResponse.body);
    if (body.lag_ms) {
      syncLag.add(body.lag_ms);
    }
  }
  
  // Get sync metrics
  const metricsResponse = http.get(`${BASE_URL}/api/sync/metrics`, { headers });
  
  check(metricsResponse, {
    'sync metrics status is 200': (r) => r.status === 200,
    'sync metrics response time < 100ms': (r) => r.timings.duration < 100,
  }) || errorRate.add(1);
  
  // Test conflict resolution
  const conflictsResponse = http.get(`${BASE_URL}/api/sync/conflicts`, { headers });
  
  check(conflictsResponse, {
    'sync conflicts status is 200': (r) => r.status === 200,
    'sync conflicts response time < 150ms': (r) => r.timings.duration < 150,
  }) || errorRate.add(1);
}

function testWebSocketStreaming(token) {
  const url = `${WS_URL}/socket.io/?EIO=4&transport=websocket&token=${token}`;
  
  const response = ws.connect(url, {}, function (socket) {
    socket.on('open', function open() {
      console.log('WebSocket connection opened');
      
      // Subscribe to audit events
      socket.send(JSON.stringify({
        type: 'subscribe',
        channel: 'audit_events'
      }));
      
      // Subscribe to sync events
      socket.send(JSON.stringify({
        type: 'subscribe',
        channel: 'sync_events'
      }));
    });
    
    socket.on('message', function (message) {
      try {
        const data = JSON.parse(message);
        if (data.type === 'audit_event' && data.timestamp) {
          const lag = Date.now() - new Date(data.timestamp).getTime();
          syncLag.add(lag);
        }
      } catch (e) {
        // Ignore parsing errors for non-JSON messages
      }
    });
    
    socket.on('error', function (e) {
      console.log('WebSocket error:', e);
      errorRate.add(1);
    });
    
    // Keep connection open for 5 seconds
    sleep(5);
  });
  
  check(response, {
    'websocket connection successful': (r) => r && r.status === 101,
  }) || errorRate.add(1);
}

function testCRUDOperations(headers) {
  // Create a product (triggers audit)
  const productData = testProducts[Math.floor(Math.random() * testProducts.length)];
  const createResponse = http.post(`${BASE_URL}/api/products`, JSON.stringify({
    ...productData,
    name: `${productData.name} ${Date.now()}` // Make it unique
  }), { headers });
  
  check(createResponse, {
    'product creation status is 201': (r) => r.status === 201,
    'product creation response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);
  
  if (createResponse.status === 201) {
    const product = JSON.parse(createResponse.body);
    auditThroughput.add(1);
    
    // Update the product (triggers audit)
    const updateResponse = http.put(`${BASE_URL}/api/products/${product.id}`, JSON.stringify({
      ...product,
      price: product.price + 10
    }), { headers });
    
    check(updateResponse, {
      'product update status is 200': (r) => r.status === 200,
      'product update response time < 200ms': (r) => r.timings.duration < 200,
    }) || errorRate.add(1);
    
    if (updateResponse.status === 200) {
      auditThroughput.add(1);
    }
    
    // Delete the product (triggers audit)
    const deleteResponse = http.del(`${BASE_URL}/api/products/${product.id}`, null, { headers });
    
    check(deleteResponse, {
      'product deletion status is 200': (r) => r.status === 200,
      'product deletion response time < 100ms': (r) => r.timings.duration < 100,
    }) || errorRate.add(1);
    
    if (deleteResponse.status === 200) {
      auditThroughput.add(1);
    }
  }
}

export function teardown(data) {
  console.log('Load test completed');
  console.log(`Total audit operations: ${auditThroughput.count}`);
}