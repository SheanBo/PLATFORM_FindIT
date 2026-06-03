// Test setup and configuration
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_testing_only';
process.env.DB_PATH = ':memory:';

// Suppress console logs during testing
global.console.log = jest.fn();
global.console.warn = jest.fn();
global.console.error = jest.fn();
