import { CaseType, CanonicalStanding, EcclesiasticalRole } from '@prisma/client';
import { canonicalCourtService, encryptField, decryptField } from '../../src/services/canonical/court.service';
import prisma from '../../src/lib/prisma';
import {
  ForbiddenError,
  NotFoundError,
} from '../../src/middleware/error-handler.middleware';

// ─── Environment Setup ────────────────────────────────────────────────────────
// Provide a deterministic 32-byte AES-256 key for tests.
// Buffer.from('testtesttesttesttesttesttesttest') is exactly 32 bytes.
const TEST_KEY_B64 = Buffer.from('testtesttesttesttesttesttesttest').toString('base64');
process.env.FIELD_ENCRYPTION_KEY_B64 = TEST_KEY_B64;

// ─── Mock Prisma Client ───────────────────────────────────────────────────────

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    user: { findFirst: jest.fn() },
    institution: { findFirst: jest.fn() },
    canonicalCase: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    canonicalStatusLog: {
      upsert: jest.fn(),
    },
    auditLog: { create: jest.fn() },
  },
}));

// ─── Typed Mock Helpers ───────────────────────────────────────────────────────

const mockUserFindFirst = prisma.user.findFirst as jest.Mock;
const mockInstFindFirst = prisma.institution.findFirst as jest.Mock;
const mockCaseFindMany = prisma.canonicalCase.findMany as jest.Mock;
const mockCaseCreate = prisma.canonicalCase.create as jest.Mock;
const mockCaseCount = prisma.canonicalCase.count as jest.Mock;
const mockStatusLogUpsert = prisma.canonicalStatusLog.upsert as jest.Mock;
const mockAuditLogCreate = prisma.auditLog.create as jest.Mock;
const mockTransaction = prisma.$transaction as jest.Mock;

// ─── Field Encryption Unit Tests ─────────────────────────────────────────────

describe('Field-Level Encryption (AES-256-GCM)', () => {
  it('produces ciphertext that is NOT equal to the plaintext input', () => {
    const plaintext = 'AbebeBekele:MereretHaile:MATRIMONIAL_DISPUTE';
    const ciphertext = encryptField(plaintext);
    expect(ciphertext).not.toEqual(plaintext);
  });

  it('produces the colon-delimited iv:tag:data envelope format', () => {
    const ciphertext = encryptField('test-payload');
    const parts = ciphertext.split(':');
    expect(parts).toHaveLength(3);
    // iv is 12 bytes = 24 hex chars
    expect(parts[0]).toHaveLength(24);
    // auth tag is 16 bytes = 32 hex chars
    expect(parts[1]).toHaveLength(32);
    // data part should have nonzero length
    expect(parts[2].length).toBeGreaterThan(0);
  });

  it('decryptField correctly recovers the original plaintext', () => {
    const plaintext = 'Sensitive party information: Priest X vs Institution Y';
    const ciphertext = encryptField(plaintext);
    const recovered = decryptField(ciphertext);
    expect(recovered).toBe(plaintext);
  });

  it('generates different ciphertext for the same plaintext (non-deterministic via random IV)', () => {
    const plaintext = 'same-plaintext';
    const ct1 = encryptField(plaintext);
    const ct2 = encryptField(plaintext);
    // IV is random, so ciphertexts must differ
    expect(ct1).not.toBe(ct2);
    // But both must decrypt to the same value
    expect(decryptField(ct1)).toBe(plaintext);
    expect(decryptField(ct2)).toBe(plaintext);
  });

  it('throws when ciphertext is tampered', () => {
    const ct = encryptField('payload');
    const parts = ct.split(':');
    // Corrupt the ciphertext part
    parts[2] = 'deadbeef'.repeat(4);
    expect(() => decryptField(parts.join(':'))).toThrow();
  });
});

// ─── CanonicalCourtService Tests ──────────────────────────────────────────────

describe('CanonicalCourtService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createCanonicalCase ───────────────────────────────────────────────────

  describe('createCanonicalCase', () => {
    const filingUserId = 'priest-user-1';
    const tenantId = 'institution-1';
    const payload = {
      caseType: CaseType.MATRIMONIAL_DISPUTE,
      partiesInvolved: 'Yonas Tesfaye vs Miriam Solomon',
    };

    it('throws ForbiddenError when a LAITY user attempts to file a case', async () => {
      mockUserFindFirst.mockResolvedValue({
        id: 'laity-user-1',
        ecclesiasticalRole: EcclesiasticalRole.LAITY,
      });

      await expect(
        canonicalCourtService.createCanonicalCase('laity-user-1', tenantId, payload),
      ).rejects.toThrow(ForbiddenError);

      expect(mockInstFindFirst).not.toHaveBeenCalled();
    });

    it('throws ForbiddenError when a DEACON user attempts to file a case', async () => {
      mockUserFindFirst.mockResolvedValue({
        id: 'deacon-user-1',
        ecclesiasticalRole: EcclesiasticalRole.DEACON,
      });

      await expect(
        canonicalCourtService.createCanonicalCase('deacon-user-1', tenantId, payload),
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws NotFoundError when the tenant institution does not exist', async () => {
      mockUserFindFirst.mockResolvedValue({
        id: filingUserId,
        ecclesiasticalRole: EcclesiasticalRole.PRIEST,
      });
      mockInstFindFirst.mockResolvedValue(null);

      await expect(
        canonicalCourtService.createCanonicalCase(filingUserId, tenantId, payload),
      ).rejects.toThrow(new NotFoundError('Active tenant institution not found.'));
    });

    it('persists a new case with encrypted parties and returns a safe, non-sensitive response', async () => {
      mockUserFindFirst.mockResolvedValue({
        id: filingUserId,
        ecclesiasticalRole: EcclesiasticalRole.PRIEST,
      });
      mockInstFindFirst.mockResolvedValue({ id: tenantId });
      mockCaseCount.mockResolvedValue(4); // 4 existing cases → new case number ends in 00005

      const mockCreatedCase = {
        id: 'case-uuid-1',
        caseNumber: `CC-${tenantId.slice(0, 8).toUpperCase()}-00005`,
        caseType: CaseType.MATRIMONIAL_DISPUTE,
        currentStatus: 'FILED',
        tenantId,
        assignedMediatorUserId: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };

      mockCaseCreate.mockResolvedValue(mockCreatedCase);

      const result = await canonicalCourtService.createCanonicalCase(
        filingUserId,
        tenantId,
        payload,
      );

      // Verify the result never contains the encrypted blob
      expect(result).not.toHaveProperty('partiesInvolvedEncrypted');

      expect(result).toMatchObject({
        id: mockCreatedCase.id,
        caseNumber: mockCreatedCase.caseNumber,
        caseType: CaseType.MATRIMONIAL_DISPUTE,
        currentStatus: 'FILED',
      });

      // Verify the database write used an encrypted field (not plaintext)
      const createCallArgs = mockCaseCreate.mock.calls[0][0];
      expect(createCallArgs.data.partiesInvolvedEncrypted).toBeDefined();
      expect(createCallArgs.data.partiesInvolvedEncrypted).not.toEqual(
        payload.partiesInvolved,
      );

      // Verify the stored blob is a valid AES-GCM ciphertext envelope
      const envelope = createCallArgs.data.partiesInvolvedEncrypted;
      const parts: string[] = envelope.split(':');
      expect(parts).toHaveLength(3);
    });

    it('allows a DIOCESAN_ADMIN to successfully file a case', async () => {
      mockUserFindFirst.mockResolvedValue({
        id: 'admin-user-1',
        ecclesiasticalRole: 'DIOCESAN_ADMIN' as unknown as EcclesiasticalRole,
      });
      mockInstFindFirst.mockResolvedValue({ id: tenantId });
      mockCaseCount.mockResolvedValue(0);
      mockCaseCreate.mockResolvedValue({
        id: 'case-uuid-2',
        caseNumber: 'CC-INST0001-00001',
        caseType: CaseType.CLERGY_DISCIPLINARY,
        currentStatus: 'FILED',
        tenantId,
        assignedMediatorUserId: null,
        createdAt: new Date(),
      });

      const result = await canonicalCourtService.createCanonicalCase(
        'admin-user-1',
        tenantId,
        { caseType: CaseType.CLERGY_DISCIPLINARY, partiesInvolved: 'Fr. Girma vs Parish Council' },
      );

      expect(result.caseType).toBe(CaseType.CLERGY_DISCIPLINARY);
      expect(mockCaseCreate).toHaveBeenCalledTimes(1);
    });
  });

  // ── listCasesForTenant ────────────────────────────────────────────────────

  describe('listCasesForTenant', () => {
    const tenantId = 'institution-1';

    it('throws ForbiddenError (403) for LAITY attempting to access the case index', async () => {
      mockUserFindFirst.mockResolvedValue({
        id: 'laity-user-1',
        ecclesiasticalRole: EcclesiasticalRole.LAITY,
      });

      await expect(
        canonicalCourtService.listCasesForTenant('laity-user-1', tenantId),
      ).rejects.toThrow(ForbiddenError);

      expect(mockCaseFindMany).not.toHaveBeenCalled();
    });

    it('throws ForbiddenError (403) for DEACON attempting to access the case index', async () => {
      mockUserFindFirst.mockResolvedValue({
        id: 'deacon-user-1',
        ecclesiasticalRole: EcclesiasticalRole.DEACON,
      });

      await expect(
        canonicalCourtService.listCasesForTenant('deacon-user-1', tenantId),
      ).rejects.toThrow(ForbiddenError);
    });

    it('returns case list WITHOUT encrypted fields for authorized judges', async () => {
      mockUserFindFirst.mockResolvedValue({
        id: 'bishop-user-1',
        ecclesiasticalRole: EcclesiasticalRole.BISHOP,
      });

      const expectedCases = [
        {
          id: 'case-1',
          caseNumber: 'CC-ABCD1234-00001',
          caseType: CaseType.MATRIMONIAL_DISPUTE,
          currentStatus: 'FILED',
          tenantId,
          assignedMediatorUserId: null,
          createdAt: new Date('2026-01-10T00:00:00Z'),
          updatedAt: new Date('2026-01-10T00:00:00Z'),
        },
      ];

      mockCaseFindMany.mockResolvedValue(expectedCases);

      const result = await canonicalCourtService.listCasesForTenant(
        'bishop-user-1',
        tenantId,
      );

      expect(result).toEqual(expectedCases);
      // Verify the encrypted field was excluded from the query's select
      const queryArgs = mockCaseFindMany.mock.calls[0][0];
      expect(queryArgs.select).toBeDefined();
      expect(queryArgs.select).not.toHaveProperty('partiesInvolvedEncrypted');
    });
  });

  // ── mutateClergyStanding ──────────────────────────────────────────────────

  describe('mutateClergyStanding', () => {
    const bishopUserId = 'bishop-user-1';
    const targetUserId = 'priest-under-investigation-1';

    const mutationPayload = {
      targetUserId,
      newStanding: CanonicalStanding.SUSPENDED_TEMPORARY,
      reason: 'Canonical misconduct investigation opened per diocesan decree #42.',
    };

    it('throws ForbiddenError when a PRIEST attempts to mutate clergy standing', async () => {
      mockTransaction.mockImplementation(async (callback: Function) => {
        const tx = {
          user: {
            findFirst: jest.fn().mockResolvedValue({
              id: 'priest-user-1',
              ecclesiasticalRole: EcclesiasticalRole.PRIEST,
              institutionId: 'inst-1',
            }),
          },
        };
        return callback(tx);
      });

      await expect(
        canonicalCourtService.mutateClergyStanding('priest-user-1', mutationPayload),
      ).rejects.toThrow(ForbiddenError);

      expect(mockStatusLogUpsert).not.toHaveBeenCalled();
    });

    it('throws ForbiddenError when a DIOCESAN_ADMIN attempts to mutate clergy standing', async () => {
      mockTransaction.mockImplementation(async (callback: Function) => {
        const tx = {
          user: {
            findFirst: jest.fn().mockResolvedValue({
              id: 'admin-user-1',
              ecclesiasticalRole: 'DIOCESAN_ADMIN' as unknown as EcclesiasticalRole,
              institutionId: 'inst-1',
            }),
          },
        };
        return callback(tx);
      });

      await expect(
        canonicalCourtService.mutateClergyStanding('admin-user-1', mutationPayload),
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws NotFoundError if the target clergy user does not exist', async () => {
      mockTransaction.mockImplementation(async (callback: Function) => {
        const tx = {
          user: {
            findFirst: jest
              .fn()
              // First call: bishop found
              .mockResolvedValueOnce({
                id: bishopUserId,
                ecclesiasticalRole: EcclesiasticalRole.BISHOP,
                institutionId: 'inst-1',
              })
              // Second call: target not found
              .mockResolvedValueOnce(null),
          },
          canonicalStatusLog: { upsert: jest.fn() },
          auditLog: { create: jest.fn() },
        };
        return callback(tx);
      });

      await expect(
        canonicalCourtService.mutateClergyStanding(bishopUserId, mutationPayload),
      ).rejects.toThrow(new NotFoundError('Target clergy user not found.'));
    });

    it('successfully upserts standing log and writes an audit entry inside a transaction', async () => {
      const mockStatusLog = {
        id: 'status-log-uuid-1',
        targetUserId,
        standingType: CanonicalStanding.SUSPENDED_TEMPORARY,
        canonicalReason: mutationPayload.reason,
        authorizedByUserId: bishopUserId,
        updatedAt: new Date('2026-07-10T00:00:00Z'),
      };

      mockTransaction.mockImplementation(async (callback: Function) => {
        const tx = {
          user: {
            findFirst: jest
              .fn()
              .mockResolvedValueOnce({
                id: bishopUserId,
                ecclesiasticalRole: EcclesiasticalRole.BISHOP,
                institutionId: 'inst-diocese-1',
              })
              .mockResolvedValueOnce({
                id: targetUserId,
                ecclesiasticalRole: EcclesiasticalRole.PRIEST,
              }),
          },
          canonicalStatusLog: {
            upsert: jest.fn().mockResolvedValue(mockStatusLog),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
          },
        };
        return callback(tx);
      });

      const result = await canonicalCourtService.mutateClergyStanding(
        bishopUserId,
        mutationPayload,
      );

      // Verify correct result shape
      expect(result).toMatchObject({
        statusLogId: mockStatusLog.id,
        targetUserId,
        standingType: CanonicalStanding.SUSPENDED_TEMPORARY,
        canonicalReason: mutationPayload.reason,
        authorizedByUserId: bishopUserId,
      });

      // Verify transaction was used
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it('correctly upserts standing from SUSPENDED to LAICIZED in a subsequent mutation', async () => {
      const laicizePayload = {
        targetUserId,
        newStanding: CanonicalStanding.LAICIZED,
        reason: 'Permanent laicization per patriarchal decree following investigation closure.',
      };

      const mockLaicizedLog = {
        id: 'status-log-uuid-2',
        targetUserId,
        standingType: CanonicalStanding.LAICIZED,
        canonicalReason: laicizePayload.reason,
        authorizedByUserId: bishopUserId,
        updatedAt: new Date('2026-07-11T00:00:00Z'),
      };

      mockTransaction.mockImplementation(async (callback: Function) => {
        const tx = {
          user: {
            findFirst: jest
              .fn()
              .mockResolvedValueOnce({
                id: bishopUserId,
                ecclesiasticalRole: EcclesiasticalRole.PATRIARCH,
                institutionId: 'inst-patriarchate',
              })
              .mockResolvedValueOnce({ id: targetUserId }),
          },
          canonicalStatusLog: {
            upsert: jest.fn().mockResolvedValue(mockLaicizedLog),
          },
          auditLog: { create: jest.fn() },
        };
        return callback(tx);
      });

      const result = await canonicalCourtService.mutateClergyStanding(
        bishopUserId,
        laicizePayload,
      );

      expect(result.standingType).toBe(CanonicalStanding.LAICIZED);
    });
  });
});
