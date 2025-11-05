export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
    '<rootDir>/config/**/*.test.js',
    '<rootDir>/controllers/**/*.test.js',
    '<rootDir>/middlewares/**/*.test.js',
    '<rootDir>/helpers/**/*.test.js',
    '<rootDir>/models/**/*.test.js',
    '<rootDir>/routes/**/*.test.js',
  ],
  verbose: true,
  silent: true,
  // TODO: Check this
  // collectCoverage: false,
  // collectCoverageFrom: [
  //   'controllers/**/*.js',
  //   'middlewares/**/*.js',
  //   'helpers/**/*.js',
  //   'config/**/*.js',
  //   'models/**/*.js',
  //   '!client/**',
  // ],
  // coveragePathIgnorePatterns: ['/node_modules/', '/client/'],
  // coverageThreshold: {
  //   global: {
  //     lines: 100,
  //     functions: 100,
  //   },
  // },
};
