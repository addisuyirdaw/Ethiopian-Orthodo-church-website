import { ParishLedgerCategory, ParishPaymentMethod } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { parishLedgerService, WebhookIngestionInput } from '../../src/services/parish-ledger.service';
import { parishLedgerRepository } from '../../src/repositories/parish-ledger.repository';

// ── Mock the repository so tests run entirely offline ──────────────────────────
jest.mock('../../src/repositories/parish-ledger.repository', () => ({
  parishLedgerRepository: {
    existsByReferenceNumber: jest.fn(),
    create: jest.fn(),
    findByUserId: jest.fn(),
    findAllForInstitution: jest.fn(),
    findFollowersByPriestId: jest.fn(),
  },
}));

// Cast once using jest.mocked so TypeScript accepts all .mockResolvedValueOnce calls
const repo = jest.mocked(parishLedgerRepository);

describe('ParishLedgerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── ingestWebhookPayment ───────────────────────────────────────────────────
  describe('ingestWebhookPayment', () => {
    const mockInput: WebhookIngestionInput = {
      userId: 'user-123',
      category: ParishLedgerCategory.ASRAT,
      amount: '150.00',
      currency: 'ETB',
      method: ParishPaymentMethod.TELEBIRR,
      referenceNumber: 'REF-XYZ123',
      targetPriestId: 'priest-456',
      rawPayload: { gateway: 'telebirr', transaction: '123' },
    };

    it('returns alreadyExists:true when reference number already processed (idempotency)', async () => {
      (repo.existsByReferenceNumber as jest.Mock).mockResolvedValueOnce(true);

      const result = await parishLedgerService.ingestWebhookPayment(mockInput);

      expect(repo.existsByReferenceNumber).toHaveBeenCalledWith('REF-XYZ123');
      expect(repo.create).not.toHaveBeenCalled();
      expect(result).toEqual({ alreadyExists: true });
    });

    it('creates a new ledger entry when reference number is unique', async () => {
      const createdEntry = {
        id: 'ledger-abc',
        userId: 'user-123',
        category: ParishLedgerCategory.ASRAT,
        amount: new Decimal('150.00'),
        currency: 'ETB',
        method: ParishPaymentMethod.TELEBIRR,
        referenceNumber: 'REF-XYZ123',
        targetPriestId: 'priest-456',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (repo.existsByReferenceNumber as jest.Mock).mockResolvedValueOnce(false);
      (repo.create as jest.Mock).mockResolvedValueOnce(createdEntry);

      const result = await parishLedgerService.ingestWebhookPayment(mockInput);

      expect(repo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        category: ParishLedgerCategory.ASRAT,
        amount: '150.00',
        currency: 'ETB',
        method: ParishPaymentMethod.TELEBIRR,
        referenceNumber: 'REF-XYZ123',
        targetPriestId: 'priest-456',
        rawPayload: mockInput.rawPayload,
      });
      expect(result).toEqual({ alreadyExists: false, entry: createdEntry });
    });
  });

  // ── getFollowerHistory ─────────────────────────────────────────────────────
  describe('getFollowerHistory', () => {
    it('maps and formats contribution records correctly', async () => {
      const mockDate = new Date('2026-07-01T12:00:00Z');
      (repo.findByUserId as jest.Mock).mockResolvedValueOnce([
        {
          id: 'log-1',
          category: ParishLedgerCategory.ASRAT,
          amount: new Decimal('500.00'),
          currency: 'ETB',
          method: ParishPaymentMethod.CBE_BIRR,
          referenceNumber: 'REF-CBE-1',
          targetPriest: { id: 'p-1', fullName: 'Abba Qozman' },
          createdAt: mockDate,
        },
      ]);

      const result = await parishLedgerService.getFollowerHistory('user-123');

      expect(repo.findByUserId).toHaveBeenCalledWith('user-123');
      expect(result).toEqual([
        {
          id: 'log-1',
          category: ParishLedgerCategory.ASRAT,
          amount: '500',
          currency: 'ETB',
          method: ParishPaymentMethod.CBE_BIRR,
          referenceNumber: 'REF-CBE-1',
          targetPriest: { id: 'p-1', fullName: 'Abba Qozman' },
          createdAt: mockDate.toISOString(),
        },
      ]);
    });
  });

  // ── getTreasuryLedger ──────────────────────────────────────────────────────
  describe('getTreasuryLedger', () => {
    it('maps and formats treasury ledger records correctly', async () => {
      const mockDate = new Date('2026-07-02T10:00:00Z');
      (repo.findAllForInstitution as jest.Mock).mockResolvedValueOnce([
        {
          id: 'rec-1',
          user: {
            id: 'user-999',
            fullName: 'Abebe Kebede',
            email: 'abebe@example.com',
            ecclesiasticalRole: 'LAITY',
          },
          category: ParishLedgerCategory.GENERAL_DONATION,
          amount: new Decimal('1000.00'),
          currency: 'ETB',
          method: ParishPaymentMethod.BANK_TRANSFER,
          referenceNumber: 'REF-BANK-77',
          targetPriest: null,
          createdAt: mockDate,
        },
      ]);

      const result = await parishLedgerService.getTreasuryLedger('inst-parish-1');

      expect(repo.findAllForInstitution).toHaveBeenCalledWith('inst-parish-1');
      expect(result).toEqual([
        {
          id: 'rec-1',
          user: {
            id: 'user-999',
            fullName: 'Abebe Kebede',
            email: 'abebe@example.com',
            role: 'LAITY',
          },
          category: ParishLedgerCategory.GENERAL_DONATION,
          amount: '1000',
          currency: 'ETB',
          method: ParishPaymentMethod.BANK_TRANSFER,
          referenceNumber: 'REF-BANK-77',
          targetPriest: null,
          createdAt: mockDate.toISOString(),
        },
      ]);
    });
  });

  // ── getPriestFollowers ─────────────────────────────────────────────────────
  describe('getPriestFollowers', () => {
    const baseFollower = {
      id: 'fol-1',
      fullName: 'Kassa Belay',
      email: 'kassa@example.com',
      nameAm: 'ካሳ በላይ',
      nameGez: null,
      sex: 'MALE',
      location: 'Addis Ababa',
      institutionId: 'inst-1',
      ecclesiasticalRole: 'LAITY',
    };

    it('injects paymentStatus DELAYED for followers who never paid ASRAT', async () => {
      (repo.findFollowersByPriestId as jest.Mock).mockResolvedValueOnce([
        { ...baseFollower, parishLedgerEntries: [] },
      ]);

      const result = await parishLedgerService.getPriestFollowers('priest-123');

      expect(repo.findFollowersByPriestId).toHaveBeenCalledWith('priest-123');
      expect(result[0].paymentStatus).toBe('DELAYED');
      expect(result[0].lastAsratDate).toBeNull();
    });

    it('injects paymentStatus DELAYED when last ASRAT was >30 days ago', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 45); // 45 days ago

      (repo.findFollowersByPriestId as jest.Mock).mockResolvedValueOnce([
        {
          ...baseFollower,
          parishLedgerEntries: [
            { createdAt: oldDate, amount: new Decimal('200.00'), referenceNumber: 'REF-OLD' },
          ],
        },
      ]);

      const result = await parishLedgerService.getPriestFollowers('priest-123');

      expect(result[0].paymentStatus).toBe('DELAYED');
      expect(result[0].lastAsratDate).toBe(oldDate.toISOString());
    });

    it('does NOT inject DELAYED badge when follower paid within 30 days', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5); // 5 days ago

      (repo.findFollowersByPriestId as jest.Mock).mockResolvedValueOnce([
        {
          ...baseFollower,
          parishLedgerEntries: [
            { createdAt: recentDate, amount: new Decimal('100.00'), referenceNumber: 'REF-RECENT' },
          ],
        },
      ]);

      const result = await parishLedgerService.getPriestFollowers('priest-123');

      expect(result[0].paymentStatus).toBeUndefined();
      expect(result[0].lastAsratDate).toBe(recentDate.toISOString());
    });
  });
});
