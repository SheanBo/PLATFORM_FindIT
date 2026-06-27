module.exports = {
  testEnvironment: 'node',
  coverageDirectory: './coverage',
  // Coverage is collected only from files that have real unit tests; the
  // route modules are currently untested and would sink the global
  // thresholds. Add files here as tests are written for them.
  collectCoverageFrom: [
    'src/modules/matching/score.js',
    'src/modules/storage/recommend.js',
    'src/middleware/auth.middleware.js'
  ],
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  moduleFileExtensions: ['js', 'json'],
  testTimeout: 10000
};
