import { InstitutionType, PaymentGateway, TransactionStatus } from '@prisma/client';
import { initiatePublicDonation, settlePublicDonationWebhook } from '../../src/services/public-donation.service';
import { institutionRepository } from '../../src/repositories/institution.repository';
import { financialTransactionRepository } from '../../src/repositories/financial-transaction.repository';
import { paymentGatewayFactory } from '../../src/services/payment/payment-gateway.factory';
import prisma from '../../src/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    financialTransaction: {
      update: jest.fn(),
    },
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
  },
}));

jest.mock('../../src/services/payment/payment-gateway.factory', () => ({
  paymentGatewayFactory: {
    resolveByGateway: jest.fn(),
  },
}));

const mockTransaction = prisma.$transaction as jest.Mock;
const mockInstitutionFindById = institutionRepository.findById as jest.Mock;
const mockFindByReferenceId = financialTransactionRepository.findByReferenceId as jest.Mock;
const mockCreateTransaction = financialTransactionRepository.create as jest.Mock;
const mockCreateLedgerSplit = financialTransactionRepository.createLedgerSplit as jest.Mock;
const mockResolveByGateway = paymentGatewayFactory.resolveByGateway as jest.Mock;

describe('Public Donation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initiatePublicDonation', () => {
    const input = {
      amount: 100,
      currency: 'ETB',
      donorName: 'John Doe',
      donorPhone: '+251911223344',
      targetTenantId: 'tenant-123',
      contributionType: 'TITHE',
      gateway: 'CHAPA',
    };

    it('should throw NotFoundError if institution does not exist', async () => {
      mockInstitutionFindById.mockResolvedValue(null);

      await expect(initiatePublicDonation(input as any)).rejects.toThrow('Institution with ID tenant-123 was not found.');
    });

    it('should successfully initiate public donation and create splits', async () => {
      const mockInstitution = {
        id: 'tenant-123',
        name: 'St. Mary',
        type: InstitutionType.PARISH,
        hierarchyPath: '/inst-patriarchate/inst-archdiocese/inst-diocese/tenant-123/',
      };
      mockInstitutionFindById.mockResolvedValue(mockInstitution);

      const mockStrategy = {
        initiatePayment: jest.fn().mockResolvedValue({
          gatewayUrl: 'https://checkout.chapa.co/12345',
          rawResponse: {},
        }),
      };
      mockResolveByGateway.mockReturnValue(mockStrategy);

      const createdTxn = {
        id: 'txn-abc',
        amount: new Decimal('100.00'),
        currency: 'ETB',
        referenceId: 'OC-TXN-123',
      };
      const createdSplit = {
        id: 'split-abc',
        destinationInstitutionId: 'tenant-123',
        splitAmount: new Decimal('90.00'),
        percentageApplied: new Decimal('0.90'),
      };

      // Mock the transaction execution block
      mockTransaction.mockImplementation(async (callback) => {
        return callback(prisma);
      });

      mockCreateTransaction.mockResolvedValue(createdTxn);
      mockCreateLedgerSplit.mockResolvedValue(createdSplit);

      const result = await initiatePublicDonation(input as any);

      expect(result.txnReference).toContain('OC-TXN-');
      expect(result.gatewayUrl).toBe('https://checkout.chapa.co/12345');
      expect(result.institution.name).toBe('St. Mary');
      expect(mockResolveByGateway).toHaveBeenCalledWith(PaymentGateway.CHAPA);
      expect(mockCreateTransaction).toHaveBeenCalled();
      expect(mockCreateLedgerSplit).toHaveBeenCalled();
    });
  });

  describe('settlePublicDonationWebhook', () => {
    it('should throw NotFoundError if transaction is not found', async () => {
      mockFindByReferenceId.mockResolvedValue(null);

      await expect(settlePublicDonationWebhook('ref-123', 'SUCCESS')).rejects.toThrow('No donation record found for reference: ref-123');
    });

    it('should update transaction status and return 90/10 split summary on SUCCESS', async () => {
      const mockTxn = {
        id: 'txn-123',
        amount: new Decimal('1000.0000'),
        referenceId: 'OC-TXN-ref',
        status: TransactionStatus.PENDING,
      };
      mockFindByReferenceId.mockResolvedValue(mockTxn);

      const result = await settlePublicDonationWebhook('OC-TXN-ref', 'SUCCESS');

      expect(prisma.financialTransaction.update).toHaveBeenCalledWith({
        where: { id: 'txn-123' },
        data: { status: TransactionStatus.COMPLETED },
      });
      expect(result.parishShare).toBe('900.0000');
      expect(result.patriarchateShare).toBe('100.0000');
      expect(result.status).toBe(TransactionStatus.COMPLETED);
    });

    it('should update status to FAILED on webhook status FAILED', async () => {
      const mockTxn = {
        id: 'txn-123',
        amount: new Decimal('100.00'),
        referenceId: 'OC-TXN-ref',
        status: TransactionStatus.PENDING,
      };
      mockFindByReferenceId.mockResolvedValue(mockTxn);

      const result = await settlePublicDonationWebhook('OC-TXN-ref', 'FAILED');

      expect(prisma.financialTransaction.update).toHaveBeenCalledWith({
        where: { id: 'txn-123' },
        data: { status: TransactionStatus.FAILED },
      });
      expect(result.status).toBe(TransactionStatus.FAILED);
    });
  });
});
