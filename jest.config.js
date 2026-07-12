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
  // Prevent open Prisma connection pools from blocking Jest exit
  forceExit: true,
  // Give supertest route tests enough headroom (default 5 s is too tight)
  testTimeout: 15000,
};
