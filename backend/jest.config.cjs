module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/**/__mocks__/**'],
  moduleNameMapper: {
    '^../src/models/User$': '<rootDir>/src/models/__mocks__/Users.js'
  }
};