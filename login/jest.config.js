module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  coverageDirectory: 'coverage',
  collectCoverage: true,
  collectCoverageFrom: [
    '**/controllers/**/*.js',
    '**/routes/**/*.js',
    '**/models/**/*.js',
    '!**/node_modules/**',
    '!**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};