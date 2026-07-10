/**
 * Integration Tests: PastoralCrmService
 *
 * Strategy: pure unit-test with jest.mock() — no real DB calls.
 * All Prisma interactions are intercepted so tests run offline and fast.
 *
 * Covered scenarios:
 *  1. addSpiritualChild — happy path creates a roster
 *  2. addSpiritualChild — throws NotFoundError when priest is missing
 *  3. addSpiritualChild — throws CanonicalValidationError when caller is LAITY
 *  4. addSpiritualChild — throws ConflictError on duplicate mapping
 *  5. logCounselingSession — happy path persists log
 *  6. logCounselingSession — throws ForbiddenError when caller != roster priest (cross-priest security)
 *  7. logCounselingSession — throws NotFoundError when roster doesn't exist
 *  8. advanceCatechumen — happy path transitions ENROLLED → INSTRUCTION
 *  9. advanceCatechumen — throws CanonicalValidationError for invalid transition
 * 10. advanceCatechumen — BAPTIZED transition uses $transaction (serializable)
 */

import { EcclesiasticalRole, CounselingType, CatechismStatus } from '@prisma/client';
import { PastoralCrmService } from '../../src/services/pastoral/pastoral-crm.service';
import prisma from '../../src/lib/prisma';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  CanonicalValidationError,
} from '../../src/middleware/error-handler.middleware';

// ─── Mock Prisma ───────────────────────────────────────────────────────────────

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    $transaction:           jest.fn(),
    user:                   { findFirst: jest.fn() },
    spiritualRoster:        { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    pastoralCounselingLog:  { create: jest.fn() },
    catechumenRecord:       { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  },
}));

// ─── Typed mock helpers ────────────────────────────────────────────────────────

const mockUserFindFirst      = prisma.user.findFirst                as jest.Mock;
const mockRosterFindUnique   = prisma.spiritualRoster.findUnique    as jest.Mock;
const mockRosterCreate       = prisma.spiritualRoster.create        as jest.Mock;
const mockLogCreate          = prisma.pastoralCounselingLog.create  as jest.Mock;
const mockCatechumenFindFirst= prisma.catechumenRecord.findFirst    as jest.Mock;
const mockCatechumenUpdate   = prisma.catechumenRecord.update       as jest.Mock;
const mockTransaction        = prisma.$transaction                   as jest.Mock;

// ─── Shared fixtures ───────────────────────────────────────────────────────────

const TENANT_ID   = 'tenant-parish-001';
const PRIEST_ID   = 'priest-user-001';
const CHILD_ID    = 'child-user-002';
const ROSTER_ID   = 'roster-001';
const RECORD_ID   = 'catechumen-record-001';

const priestUser = {
  id: PRIEST_ID,
  fullName: 'አባ ጳውሎስ',
  ecclesiasticalRole: EcclesiasticalRole.PRIEST,
  deletedAt: null,
};

const childUser = {
  id: CHILD_ID,
  fullName: 'አበበ ቦጋለ',
  ecclesiasticalRole: EcclesiasticalRole.LAITY,
  deletedAt: null,
};

const laityUser = {
  id: 'laity-001',
  fullName: 'ምእምን ሰው',
  ecclesiasticalRole: EcclesiasticalRole.LAITY,
  deletedAt: null,
};

const rosterRecord = {
  id: ROSTER_ID,
  tenantId: TENANT_ID,
  priestUserId: PRIEST_ID,
  spiritualChildUserId: CHILD_ID,
  establishedAt: new Date(),
};

// ─── Test Suite ────────────────────────────────────────────────────────────────

describe('PastoralCrmService', () => {
  let service: PastoralCrmService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PastoralCrmService();
  });

  // ─── addSpiritualChild ───────────────────────────────────────────────────────

  describe('addSpiritualChild', () => {
    it('creates a SpiritualRoster when all guards pass', async () => {
      mockUserFindFirst
        .mockResolvedValueOnce(priestUser)  // priest lookup
        .mockResolvedValueOnce(childUser);  // child lookup
      mockRosterFindUnique.mockResolvedValue(null); // no existing mapping
      mockRosterCreate.mockResolvedValue({ ...rosterRecord, priest: priestUser, spiritualChild: childUser });

      const result = await service.addSpiritualChild(TENANT_ID, PRIEST_ID, CHILD_ID);

      expect(result.id).toBe(ROSTER_ID);
      expect(mockRosterCreate).toHaveBeenCalledTimes(1);
      expect(mockRosterCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { tenantId: TENANT_ID, priestUserId: PRIEST_ID, spiritualChildUserId: CHILD_ID },
        }),
      );
    });

    it('throws NotFoundError when priest user does not exist', async () => {
      mockUserFindFirst
        .mockResolvedValueOnce(null)    // priest missing
        .mockResolvedValueOnce(childUser);

      await expect(
        service.addSpiritualChild(TENANT_ID, PRIEST_ID, CHILD_ID),
      ).rejects.toMatchObject({ name: 'NotFoundError', statusCode: 404 });

      expect(mockRosterCreate).not.toHaveBeenCalled();
    });

    it('throws CanonicalValidationError when the "priest" is actually LAITY', async () => {
      mockUserFindFirst
        .mockResolvedValueOnce(laityUser)  // priest ID resolves to a laity user
        .mockResolvedValueOnce(childUser);
      mockRosterFindUnique.mockResolvedValue(null);

      await expect(
        service.addSpiritualChild(TENANT_ID, laityUser.id, CHILD_ID),
      ).rejects.toMatchObject({ name: 'CanonicalValidationError', statusCode: 422 });
    });

    it('throws ConflictError when the roster mapping already exists', async () => {
      mockUserFindFirst
        .mockResolvedValueOnce(priestUser)
        .mockResolvedValueOnce(childUser);
      mockRosterFindUnique.mockResolvedValue(rosterRecord); // duplicate found

      await expect(
        service.addSpiritualChild(TENANT_ID, PRIEST_ID, CHILD_ID),
      ).rejects.toMatchObject({ name: 'ConflictError', statusCode: 409 });

      expect(mockRosterCreate).not.toHaveBeenCalled();
    });
  });

  // ─── logCounselingSession ────────────────────────────────────────────────────

  describe('logCounselingSession', () => {
    const sessionData = {
      rosterId:         ROSTER_ID,
      date:             new Date('2026-07-10T08:00:00Z'),
      type:             CounselingType.REGULAR_CONFESSION,
      isCanonFulfilled: true,
    };

    const createdLog = {
      id:               'log-001',
      rosterId:         ROSTER_ID,
      date:             sessionData.date,
      type:             CounselingType.REGULAR_CONFESSION,
      isCanonFulfilled: true,
      encryptedNextSteps: null,
      createdAt:        new Date(),
      updatedAt:        new Date(),
    };

    it('persists the counseling log when the caller is the assigned priest', async () => {
      mockRosterFindUnique.mockResolvedValue({ id: ROSTER_ID, priestUserId: PRIEST_ID });
      mockLogCreate.mockResolvedValue(createdLog);

      const result = await service.logCounselingSession(PRIEST_ID, sessionData);

      expect(result.id).toBe('log-001');
      expect(mockLogCreate).toHaveBeenCalledTimes(1);
      expect(mockLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            rosterId:         ROSTER_ID,
            type:             CounselingType.REGULAR_CONFESSION,
            isCanonFulfilled: true,
          }),
        }),
      );
    });

    /**
     * SECURITY CRITICAL: A priest must NOT be able to log on a roster that
     * belongs to a different priest. This test verifies ForbiddenError is
     * thrown when priestId ≠ roster.priestUserId.
     */
    it('throws ForbiddenError when the caller is NOT the assigned spiritual father', async () => {
      const INTERLOPER_PRIEST_ID = 'priest-user-interloper-999';
      // Roster belongs to PRIEST_ID, but caller is INTERLOPER
      mockRosterFindUnique.mockResolvedValue({ id: ROSTER_ID, priestUserId: PRIEST_ID });

      await expect(
        service.logCounselingSession(INTERLOPER_PRIEST_ID, sessionData),
      ).rejects.toMatchObject({
        name:       'ForbiddenError',
        statusCode: 403,
      });

      // Confirm nothing was written to the DB
      expect(mockLogCreate).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when the roster does not exist', async () => {
      mockRosterFindUnique.mockResolvedValue(null);

      await expect(
        service.logCounselingSession(PRIEST_ID, sessionData),
      ).rejects.toMatchObject({ name: 'NotFoundError', statusCode: 404 });
    });
  });

  // ─── advanceCatechumen ───────────────────────────────────────────────────────

  describe('advanceCatechumen', () => {
    it('advances status from ENROLLED to INSTRUCTION', async () => {
      const enrolledRecord = { id: RECORD_ID, tenantId: TENANT_ID, status: CatechismStatus.ENROLLED };
      mockCatechumenFindFirst.mockResolvedValue(enrolledRecord);
      mockCatechumenUpdate.mockResolvedValue({ ...enrolledRecord, status: CatechismStatus.INSTRUCTION });

      const result = await service.advanceCatechumen(TENANT_ID, RECORD_ID, CatechismStatus.INSTRUCTION);

      expect(result.status).toBe(CatechismStatus.INSTRUCTION);
      expect(mockCatechumenUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: RECORD_ID },
          data:  { status: CatechismStatus.INSTRUCTION },
        }),
      );
    });

    it('throws CanonicalValidationError for a disallowed transition (ENROLLED → BAPTIZED)', async () => {
      const enrolledRecord = { id: RECORD_ID, tenantId: TENANT_ID, status: CatechismStatus.ENROLLED };
      mockCatechumenFindFirst.mockResolvedValue(enrolledRecord);

      await expect(
        service.advanceCatechumen(TENANT_ID, RECORD_ID, CatechismStatus.BAPTIZED),
      ).rejects.toMatchObject({ name: 'CanonicalValidationError', statusCode: 422 });

      expect(mockCatechumenUpdate).not.toHaveBeenCalled();
    });

    it('uses $transaction for the BAPTIZED transition', async () => {
      const readyRecord = { id: RECORD_ID, tenantId: TENANT_ID, status: CatechismStatus.READY_FOR_BAPTISM };
      mockCatechumenFindFirst.mockResolvedValue(readyRecord);

      // Simulate the serializable transaction executing its callback
      mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
        const txMock = {
          catechumenRecord: {
            findUnique: jest.fn().mockResolvedValue(readyRecord),
            update:     jest.fn().mockResolvedValue({ ...readyRecord, status: CatechismStatus.BAPTIZED }),
          },
        };
        return callback(txMock);
      });

      const result = await service.advanceCatechumen(TENANT_ID, RECORD_ID, CatechismStatus.BAPTIZED);

      expect(result.status).toBe(CatechismStatus.BAPTIZED);
      // Confirm it went through the transaction path, not the direct update
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockCatechumenUpdate).not.toHaveBeenCalled(); // top-level update bypassed
    });

    it('throws NotFoundError when record is not found in tenant', async () => {
      mockCatechumenFindFirst.mockResolvedValue(null);

      await expect(
        service.advanceCatechumen(TENANT_ID, RECORD_ID, CatechismStatus.INSTRUCTION),
      ).rejects.toMatchObject({ name: 'NotFoundError', statusCode: 404 });
    });
  });
});
