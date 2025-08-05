import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Increase timeout for integration tests
  jest.setTimeout(30000);
});

afterAll(async () => {
  // Cleanup after all tests
  await new Promise(resolve => setTimeout(resolve, 100));
});

// Mock console methods in test environment
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};