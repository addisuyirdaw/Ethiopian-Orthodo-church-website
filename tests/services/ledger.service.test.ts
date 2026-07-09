import {
  EcclesiasticalRole,
  InstitutionType,
  PaymentGateway,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { LedgerService } from '../../src/services/ledger.service';
import {
  calculateHierarchicalSplits,
  validateSplitBalance,
} from '../../src/services/ledger-split.util';
import { institutionRepository } from '../../src/repositories/institution.repository';
import { financialTransactionRepository } from '../../src/repositories/financial-transaction.repository';
import { auditLogRepository } from '../../src/repositories/audit-log.repository';
import prisma from '../../src/lib/prisma';
import { AuthenticatedUser } from '../../src/types';
import { SPLIT_PERCENTAGES } from '../../src/lib/decimal';

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
  },
}));

jest.mock('../../src/repositories/institution.repository', () => ({
  institutionRepository: {
    findById: jest.fn(),
  },
}));

jest.mock('../../src/repositories/financial-transaction.repository', () => ({
  financialTransactionRepository: {
    findByReferenceId: jest.fn(),
    create: jest.fn(),
    createLedgerSplit: jest.fn(),
    findMany: jest.fn(),
  },
}));

jest.mock('../../src/repositories/audit-log.repository', () => ({
  auditLogRepository: {
    create: jest.fn(),
  },
}));

const mockTransaction = prisma.$transaction as jest.Mock;
const mockInstitutionFindById = institutionRepository.findById as jest.Mock;
const mockFindByReferenceId = financialTransactionRepository.findByReferenceId as jest.Mock;
const mockCreateTransaction = financialTransactionRepository.create as jest.Mock;
const mockCreateLedgerSplit = financialTransactionRepository.createLedgerSplit as jest.Mock;
const mockAuditCreate = auditLogRepository.create as jest.Mock;
const mockFindMany = financialTransactionRepository.findMany as jest.Mock;

const SEEDED_HIERARCHY = {
  patriarchate: {
    id: 'inst-patriarchate',
    type: InstitutionType.PATRIARCHATE,
    hierarchyPath: '/inst-patriarchate/',
  },
  archdiocese: {
    id: 'inst-archdiocese',
    type: InstitutionType.ARCHDIOCESE,
    hierarchyPath: '/inst-patriarchate/inst-archdiocese/',
  },
  diocese: {
    id: 'inst-diocese',
    type: InstitutionType.DIOCESE,
    hierarchyPath: '/inst-patriarchate/inst-archdiocese/inst-diocese/',
  },
  parishAa: {
    id: 'inst-parish-aa',
    type: InstitutionType.PARISH,
    hierarchyPath: '/inst-patriarchate/inst-archdiocese/inst-parish-aa/',
  },
  parishDb: {
    id: 'inst-parish-db',
    type: InstitutionType.PARISH,
    hierarchyPath: '/inst-patriarchate/inst-archdiocese/inst-diocese/inst-parish-db/',
  },
} as const;

const CONTRIBUTION_AMOUNT = 1000;

function allocationFor(
  allocations: ReturnType<typeof calculateHierarchicalSplits>,
  institutionId: string,
): Decimal {
  const match = allocations.find((allocation) => allocation.institutionId === institutionId);
  if (!match) {
    throw new Error(`No allocation found for institution ${institutionId}`);
  }
  return match.amount;
}

function percentageFor(
  allocations: ReturnType<typeof calculateHierarchicalSplits>,
  institutionId: string,
): Decimal {
  const match = allocations.find((allocation) => allocation.institutionId === institutionId);
  if (!match) {
    throw new Error(`No allocation found for institution ${institutionId}`);
  }
  return match.percentageApplied;
}

describe('calculateHierarchicalSplits', () => {
  it('splits parish contributions 90% / 7% / 3% across parish, diocese, and patriarchate', () => {
    const allocations = calculateHierarchicalSplits(
      SEEDED_HIERARCHY.parishDb,
      CONTRIBUTION_AMOUNT,
    );

    expect(percentageFor(allocations, SEEDED_HIERARCHY.parishDb.id)).toEqual(
      SPLIT_PERCENTAGES.TARGET_LEAF,
    );
    expect(percentageFor(allocations, SEEDED_HIERARCHY.diocese.id)).toEqual(
      SPLIT_PERCENTAGES.IMMEDIATE_PARENT,
    );
    expect(percentageFor(allocations, SEEDED_HIERARCHY.patriarchate.id)).toEqual(
      SPLIT_PERCENTAGES.PATRIARCHATE,
    );

    expect(allocationFor(allocations, SEEDED_HIERARCHY.parishDb.id).toNumber()).toBe(900);
    expect(allocationFor(allocations, SEEDED_HIERARCHY.diocese.id).toNumber()).toBe(70);
    expect(allocationFor(allocations, SEEDED_HIERARCHY.patriarchate.id).toNumber()).toBe(30);
    expect(validateSplitBalance(new Decimal(CONTRIBUTION_AMOUNT), allocations)).toBe(true);
  });

  it('splits parish-under-archdiocese contributions 90% / 7% / 3%', () => {
    const allocations = calculateHierarchicalSplits(
      SEEDED_HIERARCHY.parishAa,
      CONTRIBUTION_AMOUNT,
    );

    expect(allocationFor(allocations, SEEDED_HIERARCHY.parishAa.id).toNumber()).toBe(900);
    expect(allocationFor(allocations, SEEDED_HIERARCHY.archdiocese.id).toNumber()).toBe(70);
    expect(allocationFor(allocations, SEEDED_HIERARCHY.patriarchate.id).toNumber()).toBe(30);
    expect(validateSplitBalance(new Decimal(CONTRIBUTION_AMOUNT), allocations)).toBe(true);
  });

  it('retains 97% for a diocese direct gift and sends 3% to the patriarchate', () => {
    const allocations = calculateHierarchicalSplits(
      SEEDED_HIERARCHY.diocese,
      CONTRIBUTION_AMOUNT,
    );

    expect(percentageFor(allocations, SEEDED_HIERARCHY.diocese.id)).toEqual(
      SPLIT_PERCENTAGES.TARGET_REGIONAL,
    );
    expect(percentageFor(allocations, SEEDED_HIERARCHY.patriarchate.id)).toEqual(
      SPLIT_PERCENTAGES.PATRIARCHATE,
    );

    expect(allocationFor(allocations, SEEDED_HIERARCHY.diocese.id).toNumber()).toBe(970);
    expect(allocationFor(allocations, SEEDED_HIERARCHY.patriarchate.id).toNumber()).toBe(30);
    expect(allocations).toHaveLength(2);
    expect(validateSplitBalance(new Decimal(CONTRIBUTION_AMOUNT), allocations)).toBe(true);
  });

  it('retains 100% for patriarchate-level contributions', () => {
    const allocations = calculateHierarchicalSplits(
      SEEDED_HIERARCHY.patriarchate,
      CONTRIBUTION_AMOUNT,
    );

    expect(allocationFor(allocations, SEEDED_HIERARCHY.patriarchate.id).toNumber()).toBe(1000);
    expect(percentageFor(allocations, SEEDED_HIERARCHY.patriarchate.id)).toEqual(
      SPLIT_PERCENTAGES.FULL,
    );
    expect(allocations).toHaveLength(1);
    expect(validateSplitBalance(new Decimal(CONTRIBUTION_AMOUNT), allocations)).toBe(true);
  });
});

describe('LedgerService', () => {
  let service: LedgerService;

  const actorId = 'actor-user-1';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LedgerService();
  });

  describe('processIncomingContribution', () => {
    it('persists a completed transaction, ledger splits, and audit log for parish tithes', async () => {
      mockInstitutionFindById.mockResolvedValue({
        id: SEEDED_HIERARCHY.parishDb.id,
        type: SEEDED_HIERARCHY.parishDb.type,
        hierarchyPath: SEEDED_HIERARCHY.parishDb.hierarchyPath,
      });
      mockFindByReferenceId.mockResolvedValue(null);

      const createdTransaction = {
        id: 'txn-1',
        institutionId: SEEDED_HIERARCHY.parishDb.id,
        amount: new Decimal(CONTRIBUTION_AMOUNT),
        currency: 'ETB',
        type: TransactionType.TITHE,
        gateway: PaymentGateway.TELEBIRR,
        referenceId: 'REF-001',
        status: TransactionStatus.COMPLETED,
      };

      const createdSplits = [
        {
          id: 'split-1',
          destinationInstitutionId: SEEDED_HIERARCHY.patriarchate.id,
          splitAmount: new Decimal(30),
          percentageApplied: SPLIT_PERCENTAGES.PATRIARCHATE,
        },
        {
          id: 'split-2',
          destinationInstitutionId: SEEDED_HIERARCHY.diocese.id,
          splitAmount: new Decimal(70),
          percentageApplied: SPLIT_PERCENTAGES.IMMEDIATE_PARENT,
        },
        {
          id: 'split-3',
          destinationInstitutionId: SEEDED_HIERARCHY.parishDb.id,
          splitAmount: new Decimal(900),
          percentageApplied: SPLIT_PERCENTAGES.TARGET_LEAF,
        },
      ];

      mockTransaction.mockImplementation(async (callback) => {
        mockCreateTransaction.mockResolvedValue(createdTransaction);
        mockCreateLedgerSplit
          .mockResolvedValueOnce(createdSplits[0])
          .mockResolvedValueOnce(createdSplits[1])
          .mockResolvedValueOnce(createdSplits[2]);
        mockAuditCreate.mockResolvedValue({ id: 'audit-1' });
        return callback(prisma);
      });

      const result = await service.processIncomingContribution({
        institutionId: SEEDED_HIERARCHY.parishDb.id,
        amount: CONTRIBUTION_AMOUNT,
        currency: 'ETB',
        type: TransactionType.TITHE,
        gateway: PaymentGateway.TELEBIRR,
        referenceId: 'REF-001',
        actorId,
      });

      expect(mockCreateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          institutionId: SEEDED_HIERARCHY.parishDb.id,
          status: TransactionStatus.COMPLETED,
          amount: expect.any(Decimal),
        }),
        prisma,
      );
      expect(mockCreateLedgerSplit).toHaveBeenCalledTimes(3);
      expect(mockAuditCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId,
          action: 'FINANCIAL_CONTRIBUTION',
          tableName: 'financial_transactions',
          recordId: 'txn-1',
        }),
        prisma,
      );

      expect(result.transaction.amount).toBe('1000');
      expect(result.splits).toHaveLength(3);
      expect(result.splits.map((split) => split.splitAmount)).toEqual(['30', '70', '900']);
      expect(result.payment.gatewayUrl).toContain('telebirr');
    });
  });

  describe('listLedger', () => {
    const priestUser: AuthenticatedUser = {
      id: 'priest-1',
      institutionId: SEEDED_HIERARCHY.parishDb.id,
      hierarchyPath: SEEDED_HIERARCHY.parishDb.hierarchyPath,
      ecclesiasticalRole: EcclesiasticalRole.PRIEST,
    };

    const bishopUser: AuthenticatedUser = {
      id: 'bishop-1',
      institutionId: SEEDED_HIERARCHY.diocese.id,
      hierarchyPath: SEEDED_HIERARCHY.diocese.hierarchyPath,
      ecclesiasticalRole: EcclesiasticalRole.BISHOP,
    };

    it('scopes parish priests to their own institution transactions', async () => {
      mockFindMany.mockResolvedValue({ transactions: [], total: 0 });

      await service.listLedger(priestUser, { page: 1, limit: 20 });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          institutionId: SEEDED_HIERARCHY.parishDb.id,
        }),
      );
    });

    it('scopes bishops to their sub-tree via hierarchy_path prefix', async () => {
      mockInstitutionFindById.mockResolvedValue({
        id: SEEDED_HIERARCHY.diocese.id,
        hierarchyPath: SEEDED_HIERARCHY.diocese.hierarchyPath,
      });
      mockFindMany.mockResolvedValue({ transactions: [], total: 0 });

      await service.listLedger(bishopUser, { page: 1, limit: 20 });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          hierarchyPathPrefix: SEEDED_HIERARCHY.diocese.hierarchyPath,
        }),
      );
    });
  });
});
