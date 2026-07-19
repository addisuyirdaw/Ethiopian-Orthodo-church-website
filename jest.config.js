/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
  coverageDirectory: 'coverage',
  clearMocks: true,
  // Provide an in-memory Prisma mock before any test module loads so that
  // route-level tests never open a real PostgreSQL connection.
  setupFiles: ['<rootDir>/tests/setup/prisma.mock.ts'],
  // Prevent open Prisma connection pools from blocking Jest exit
  forceExit: true,
  // Give supertest route tests enough headroom (default 5 s is too tight)
  testTimeout: 15000,
};
