// Test setup and configuration
require('dotenv').config(); // load backend/.env so TEST_DATABASE_URL is honored regardless of shell state
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_testing_only';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/findit_test';
process.env.PGSSL = 'disable'; // local test DB has no SSL

// Suppress console noise during tests.
global.console.log = jest.fn();
global.console.warn = jest.fn();
global.console.error = jest.fn();
