/**
 * Global Jest setup: provides an in-memory mock of the PrismaClient so that
 * tests can run without a live PostgreSQL connection.
 *
 * Route-level tests import `createApp()`, which transitively loads
 * `src/lib/prisma.ts`.  Without this mock the real PrismaClient connects to
 * the database, leaves open connection pools, and causes all subsequent test
 * suites to time out.
 *
 * This file is referenced by `jest.config.js` → `setupFiles`.
 */

const makeMockDelegate = () =>
  new Proxy(
    {},
    {
      get(_target, prop) {
        // Return a jest.fn() for any model method (findFirst, findMany, create …)
        return jest.fn().mockResolvedValue(null);
      },
    },
  );

const mockPrismaClient = {
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  $transaction: jest.fn().mockImplementation((fn: (tx: any) => Promise<any>) =>
    fn(mockPrismaClient),
  ),
  user: makeMockDelegate(),
  institution: makeMockDelegate(),
  parishLedger: makeMockDelegate(),
  financeTransaction: makeMockDelegate(),
  liturgicalEvent: makeMockDelegate(),
  clergy: makeMockDelegate(),
  monasterialEstate: makeMockDelegate(),
  sealVaultEntry: makeMockDelegate(),
};

// Override the module so any file importing 'src/lib/prisma' gets the mock
jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: mockPrismaClient,
  prisma: mockPrismaClient,
}));
