// Test setup and configuration
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_testing_only';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgres://postgres:sheanbo18@localhost:5432/findit_test';
process.env.PGSSL = 'disable'; // local test DB has no SSL

// Suppress console noise during tests.
global.console.log = jest.fn();
global.console.warn = jest.fn();
global.console.error = jest.fn();
