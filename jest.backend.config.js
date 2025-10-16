export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // Path aliases for backend code
  moduleNameMapper: {
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@controllers/(.*)$': '<rootDir>/controllers/$1',
    '^@models/(.*)$': '<rootDir>/models/$1',
    '^@routes/(.*)$': '<rootDir>/routes/$1',
    '^@middlewares/(.*)$': '<rootDir>/middlewares/$1',
    '^@helpers/(.*)$': '<rootDir>/helpers/$1'
  },

  // which test to run
  testMatch: ['<rootDir>/tests/backend/**/*.test.js'],

  // TODO: Check this
  collectCoverage: true,
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middlewares/**/*.js',
    'helpers/**/*.js',
    '!client/**'
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/client/'],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
