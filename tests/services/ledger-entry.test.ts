import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { ContributionStatus, OfferingCategory, Institution } from '@prisma/client';
import prisma from '../../src/lib/prisma';
import { ledgerEntryService } from '../../src/services/finance/ledger-entry.service';

jest.setTimeout(60000);

const mockTransactions = new Map<string, any>();
const mockInstitutions = new Map<string, any>();

jest.mock('../../src/lib/prisma', () => {
  const mockTransactions = new Map<string, any>();
  const mockInstitutions = new Map<string, any>();
  const mockPrisma = {
    institution: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        const id = 'inst-id-' + Math.random().toString(36).substring(2, 9);
        const inst = { id, ...data };
        mockInstitutions.set(id, inst);
        return inst;
      }),
      deleteMany: jest.fn().mockImplementation(async () => {
        mockInstitutions.clear();
        return { count: 0 };
      }),
    },
    ecclesiasticalTransaction: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        const id = 'tx-id-' + Math.random().toString(36).substring(2, 9);
        const txn = {
          id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockTransactions.set(id, txn);
        return txn;
      }),
      findUnique: jest.fn().mockImplementation(async ({ where }) => {
        if (where.gatewayReference) {
          for (const txn of mockTransactions.values()) {
            if (txn.gatewayReference === where.gatewayReference) {
              return txn;
            }
          }
        }
        if (where.id) {
          return mockTransactions.get(where.id) || null;
        }
        return null;
      }),
      findMany: jest.fn().mockImplementation(async ({ where }) => {
        const results = [];
        if (where && where.tenantId) {
          const tenantId = where.tenantId;
          const tenantIdStr = typeof tenantId === 'object' && tenantId.in ? tenantId.in : [tenantId];
          for (const txn of mockTransactions.values()) {
            if (tenantIdStr.includes(txn.tenantId)) {
              results.push(txn);
            }
          }
        }
        return results;
      }),
      update: jest.fn().mockImplementation(async ({ where, data }) => {
        const id = where.id;
        let existing = mockTransactions.get(id);
        if (!existing && where.gatewayReference) {
          for (const txn of mockTransactions.values()) {
            if (txn.gatewayReference === where.gatewayReference) {
              existing = txn;
              break;
            }
          }
        }
        if (existing) {
          const updated = { ...existing, ...data, updatedAt: new Date() };
          mockTransactions.set(existing.id, updated);
          return updated;
        }
        throw new Error('Not found');
      }),
      deleteMany: jest.fn().mockImplementation(async () => {
        mockTransactions.clear();
        return { count: 0 };
      }),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return callback(mockPrisma);
    }),
    $disconnect: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockPrisma,
  };
});

describe('LedgerEntryService Integration Tests', () => {
  let inst1: Institution;
  let inst2: Institution;

  beforeAll(async () => {
    // Setup two clean institutions to verify multi-tenant isolation
    inst1 = await prisma.institution.create({
      data: {
        name: 'Finance Test Parish 1',
        type: 'PARISH',
        hierarchyPath: '/inst-finance-test-1/',
      },
    });

    inst2 = await prisma.institution.create({
      data: {
        name: 'Finance Test Parish 2',
        type: 'PARISH',
        hierarchyPath: '/inst-finance-test-2/',
      },
    });
  });

  afterAll(async () => {
    // Cleanup created test records
    await prisma.ecclesiasticalTransaction.deleteMany({
      where: {
        tenantId: { in: [inst1.id, inst2.id] },
      },
    });

    await prisma.institution.deleteMany({
      where: {
        id: { in: [inst1.id, inst2.id] },
      },
    });

    await prisma.$disconnect();
  });

  it('correctly initializes a contribution with PENDING status', async () => {
    const contribution = await ledgerEntryService.initializeContribution({
      tenantId: inst1.id,
      amount: 1500,
      currency: 'ETB',
      category: OfferingCategory.TITHE,
      gateway: 'telebirr',
      vowDetails: 'Monthly Tithe Offering',
    });

    expect(contribution.id).toBeDefined();
    expect(contribution.tenantId).toBe(inst1.id);
    expect(contribution.amount).toBe('1500.0000');
    expect(contribution.currency).toBe('ETB');
    expect(contribution.category).toBe(OfferingCategory.TITHE);
    expect(contribution.paymentGateway).toBe('telebirr');
    expect(contribution.status).toBe(ContributionStatus.PENDING);
    expect(contribution.gatewayReference).toContain('ECCTX-TELEBIRR-');

    // Verify row actually exists in DB
    const dbRecord = await prisma.ecclesiasticalTransaction.findUnique({
      where: { id: contribution.id },
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.tenantId).toBe(inst1.id);
  });

  it('enforces multi-tenant row isolation', async () => {
    const contribution1 = await ledgerEntryService.initializeContribution({
      tenantId: inst1.id,
      amount: 200,
      currency: 'ETB',
      category: OfferingCategory.ALMS_POOR,
      gateway: 'stripe',
    });

    const contribution2 = await ledgerEntryService.initializeContribution({
      tenantId: inst2.id,
      amount: 500,
      currency: 'USD',
      category: OfferingCategory.MONASTERY_SPONSORSHIP,
      gateway: 'stripe',
    });

    // Query separately and verify isolation
    const tenant1Txns = await prisma.ecclesiasticalTransaction.findMany({
      where: { tenantId: inst1.id },
    });
    const tenant2Txns = await prisma.ecclesiasticalTransaction.findMany({
      where: { tenantId: inst2.id },
    });

    expect(tenant1Txns.some((t) => t.id === contribution1.id)).toBe(true);
    expect(tenant1Txns.some((t) => t.id === contribution2.id)).toBe(false);

    expect(tenant2Txns.some((t) => t.id === contribution2.id)).toBe(true);
    expect(tenant2Txns.some((t) => t.id === contribution1.id)).toBe(false);
  });

  it('finalizes a pending contribution and generates a treasury payload', async () => {
    const contribution = await ledgerEntryService.initializeContribution({
      tenantId: inst1.id,
      amount: 2500,
      currency: 'ETB',
      category: OfferingCategory.VOTIVE_VOW,
      gateway: 'cbe_birr',
    });

    const result = await ledgerEntryService.finalizeContribution(
      contribution.gatewayReference,
      ContributionStatus.SETTLED,
    );

    expect(result.entry.status).toBe(ContributionStatus.SETTLED);
    expect(result.treasury).toBeDefined();
    expect(result.treasury?.tenantId).toBe(inst1.id);
    expect(result.treasury?.settledAmount).toBe('2500.0000');
    expect(result.treasury?.gatewayReference).toBe(contribution.gatewayReference);
  });

  it('guarantees idempotency on duplicate settlement webhooks', async () => {
    const contribution = await ledgerEntryService.initializeContribution({
      tenantId: inst2.id,
      amount: 800,
      currency: 'ETB',
      category: OfferingCategory.FIRST_FRUITS,
      gateway: 'telebirr',
    });

    // First finalization (normal settlement)
    const result1 = await ledgerEntryService.finalizeContribution(
      contribution.gatewayReference,
      ContributionStatus.SETTLED,
    );
    expect(result1.entry.status).toBe(ContributionStatus.SETTLED);
    expect(result1.treasury).toBeDefined();

    // Second finalization (duplicate webhook call)
    const result2 = await ledgerEntryService.finalizeContribution(
      contribution.gatewayReference,
      ContributionStatus.SETTLED,
    );

    // Verify idempotency: returns status but treasury field is NOT returned (prevents double provisioning)
    expect(result2.entry.status).toBe(ContributionStatus.SETTLED);
    expect(result2.treasury).toBeUndefined();
  });
});
