// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  preset: 'ts-jest',
  modulePathIgnorePatterns: [
    'packages/.*/dist'
  ],
  projects: [ '<rootDir>/packages/*/jest.config.js']
};