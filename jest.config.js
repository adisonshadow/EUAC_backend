module.exports = {
  testEnvironment: 'node',
  globalSetup: './test/setup.js',
  globalTeardown: './test/teardown.js',
  testMatch: ['**/test/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/test/init-db.test.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
}; 