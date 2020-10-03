const path  = require('path');
const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig');
const baseConfig = require('../../jest.config');

module.exports = {
  ...baseConfig,
  modulePathIgnorePatterns: [
    'dist',
  ],
  projects: [ '<rootDir>/src'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, { prefix: __dirname + path.sep }),
};