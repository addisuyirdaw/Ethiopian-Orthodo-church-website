import { PaymentProvider, PaymentStatus } from '@prisma/client';
import { unifiedPaymentsService } from '../../src/services/unified-payments.service';
import { merchantConfigRepository } from '../../src/repositories/merchant-config.repository';
import { transactionRepository } from '../../src/repositories/transaction.repository';
import { institutionRepository } from '../../src/repositories/institution.repository';
import { paymentGatewayFactory } from '../../src/services/payment/payment-gateway.factory';

jest.mock('../../src/repositories/merchant-config.repository', () => ({
  merchantConfigRepository: {
    create: jest.fn(),
    update: jest.fn(),
    findByInstitutionId: jest.fn(),
    findActiveByInstitutionId: jest.fn(),
  },
}));

jest.mock('../../src/repositories/transaction.repository', () => ({
  transactionRepository: {
    create: jest.fn(),
    updateStatus: jest.fn(),
    findById: jest.fn(),
    findByProviderRef: jest.fn(),
    findManyForInstitution: jest.fn(),
  },
}));

jest.mock('../../src/repositories/institution.repository', () => ({
  institutionRepository: {
    findById: jest.fn(),
  },
}));

jest.mock('../../src/services/payment/payment-gateway.factory', () => ({
  paymentGatewayFactory: {
    resolveByGateway: jest.fn(),
  },
}));

const mockMerchantConfigCreate = merchantConfigRepository.create as jest.Mock;
const mockMerchantConfigUpdate = merchantConfigRepository.update as jest.Mock;
const mockMerchantConfigFindByInstitutionId = merchantConfigRepository.findByInstitutionId as jest.Mock;
const mockMerchantConfigFindActiveByInstitutionId = merchantConfigRepository.findActiveByInstitutionId as jest.Mock;

const mockTransactionCreate = transactionRepository.create as jest.Mock;
const mockTransactionUpdateStatus = transactionRepository.updateStatus as jest.Mock;
const mockTransactionFindByProviderRef = transactionRepository.findByProviderRef as jest.Mock;
const mockTransactionFindManyForInstitution = transactionRepository.findManyForInstitution as jest.Mock;

const mockInstitutionFindById = institutionRepository.findById as jest.Mock;
const mockResolveByGateway = paymentGatewayFactory.resolveByGateway as jest.Mock;

describe('Unified Payments Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('configureMerchant', () => {
    const institutionId = 'inst-123';
    const configData = {
      provider: PaymentProvider.TELEBIRR,
      isActive: true,
      configPayload: { appId: '123', appKey: 'secret' },
    };

    it('should throw NotFoundError if institution does not exist', async () => {
      mockInstitutionFindById.mockResolvedValue(null);

      await expect(unifiedPaymentsService.configureMerchant(institutionId, configData)).rejects.toThrow(
        `Institution with ID ${institutionId} not found.`
      );
    });

    it('should update existing merchant configuration if it exists', async () => {
      mockInstitutionFindById.mockResolvedValue({ id: institutionId });
      mockMerchantConfigFindByInstitutionId.mockResolvedValue({ id: 'config-1', institutionId });
      mockMerchantConfigUpdate.mockResolvedValue({ id: 'config-1', ...configData });

      const result = await unifiedPaymentsService.configureMerchant(institutionId, configData);

      expect(mockMerchantConfigFindByInstitutionId).toHaveBeenCalledWith(institutionId);
      expect(mockMerchantConfigUpdate).toHaveBeenCalledWith(institutionId, configData);
      expect(result).toBeDefined();
    });

    it('should create new merchant configuration if none exists', async () => {
      mockInstitutionFindById.mockResolvedValue({ id: institutionId });
      mockMerchantConfigFindByInstitutionId.mockResolvedValue(null);
      mockMerchantConfigCreate.mockResolvedValue({ id: 'config-new', ...configData });

      const result = await unifiedPaymentsService.configureMerchant(institutionId, configData);

      expect(mockMerchantConfigFindByInstitutionId).toHaveBeenCalledWith(institutionId);
      expect(mockMerchantConfigCreate).toHaveBeenCalledWith({
        institutionId,
        provider: configData.provider,
        isActive: configData.isActive,
        configPayload: configData.configPayload,
      });
      expect(result).toBeDefined();
    });
  });

  describe('getMerchantConfig', () => {
    const institutionId = 'inst-123';

    it('should throw NotFoundError if configuration does not exist', async () => {
      mockMerchantConfigFindByInstitutionId.mockResolvedValue(null);

      await expect(unifiedPaymentsService.getMerchantConfig(institutionId)).rejects.toThrow(
        `Merchant configuration not found for institution ${institutionId}.`
      );
    });

    it('should return configuration if it exists', async () => {
      const mockConfig = { id: 'config-1', institutionId, provider: PaymentProvider.TELEBIRR };
      mockMerchantConfigFindByInstitutionId.mockResolvedValue(mockConfig);

      const result = await unifiedPaymentsService.getMerchantConfig(institutionId);

      expect(result).toEqual(mockConfig);
    });
  });

  describe('initiatePayment', () => {
    const userId = 'user-123';
    const institutionId = 'inst-123';
    const paymentInput = {
      amount: 500,
      currency: 'ETB',
      provider: PaymentProvider.TELEBIRR,
    };

    it('should throw NotFoundError if institution does not exist', async () => {
      mockInstitutionFindById.mockResolvedValue(null);

      await expect(unifiedPaymentsService.initiatePayment(userId, institutionId, paymentInput)).rejects.toThrow(
        `Institution with ID ${institutionId} not found.`
      );
    });

    it('should throw NotFoundError if no active merchant config is found', async () => {
      mockInstitutionFindById.mockResolvedValue({ id: institutionId });
      mockMerchantConfigFindActiveByInstitutionId.mockResolvedValue(null);

      await expect(unifiedPaymentsService.initiatePayment(userId, institutionId, paymentInput)).rejects.toThrow(
        `No active merchant configuration found for provider ${paymentInput.provider} on institution ${institutionId}.`
      );
    });

    it('should throw NotFoundError if active merchant config provider mismatch', async () => {
      mockInstitutionFindById.mockResolvedValue({ id: institutionId });
      mockMerchantConfigFindActiveByInstitutionId.mockResolvedValue({
        id: 'config-1',
        provider: PaymentProvider.CHAPA, // Mismatch
      });

      await expect(unifiedPaymentsService.initiatePayment(userId, institutionId, paymentInput)).rejects.toThrow(
        `No active merchant configuration found for provider ${paymentInput.provider} on institution ${institutionId}.`
      );
    });

    it('should successfully initiate payment and create transaction', async () => {
      mockInstitutionFindById.mockResolvedValue({ id: institutionId });
      mockMerchantConfigFindActiveByInstitutionId.mockResolvedValue({
        id: 'config-1',
        provider: PaymentProvider.TELEBIRR,
      });

      const mockStrategy = {
        initiatePayment: jest.fn().mockResolvedValue({
          gatewayUrl: 'https://telebirr.example.com/pay',
          rawResponse: { code: '200' },
        }),
      };
      mockResolveByGateway.mockReturnValue(mockStrategy);

      const mockTransaction = {
        id: 'txn-123',
        providerRef: 'UP-TXN-mock-uuid',
      };
      mockTransactionCreate.mockResolvedValue(mockTransaction);

      const result = await unifiedPaymentsService.initiatePayment(userId, institutionId, paymentInput);

      expect(mockResolveByGateway).toHaveBeenCalledWith(paymentInput.provider);
      expect(mockStrategy.initiatePayment).toHaveBeenCalled();
      expect(mockTransactionCreate).toHaveBeenCalled();
      expect(result.transactionId).toBe(mockTransaction.id);
      expect(result.gatewayUrl).toBe('https://telebirr.example.com/pay');
    });
  });

  describe('settleWebhook', () => {
    const providerRef = 'UP-TXN-mock-uuid';

    it('should throw NotFoundError if transaction is not found', async () => {
      mockTransactionFindByProviderRef.mockResolvedValue(null);

      await expect(unifiedPaymentsService.settleWebhook(providerRef, 'SUCCESS')).rejects.toThrow(
        `Transaction with reference ${providerRef} not found.`
      );
    });

    it('should update status to SUCCESSFUL on SUCCESS callback', async () => {
      mockTransactionFindByProviderRef.mockResolvedValue({ id: 'txn-123', status: 'PENDING' });
      mockTransactionUpdateStatus.mockResolvedValue({ id: 'txn-123', status: 'SUCCESSFUL' });

      const result = await unifiedPaymentsService.settleWebhook(providerRef, 'SUCCESS');

      expect(mockTransactionUpdateStatus).toHaveBeenCalledWith('txn-123', 'SUCCESSFUL');
      expect(result.status).toBe('SUCCESSFUL');
    });

    it('should update status to FAILED on FAILED callback', async () => {
      mockTransactionFindByProviderRef.mockResolvedValue({ id: 'txn-123', status: 'PENDING' });
      mockTransactionUpdateStatus.mockResolvedValue({ id: 'txn-123', status: 'FAILED' });

      const result = await unifiedPaymentsService.settleWebhook(providerRef, 'FAILED');

      expect(mockTransactionUpdateStatus).toHaveBeenCalledWith('txn-123', 'FAILED');
      expect(result.status).toBe('FAILED');
    });
  });

  describe('getTransactionHistory', () => {
    const institutionId = 'inst-123';

    it('should throw NotFoundError if institution does not exist', async () => {
      mockInstitutionFindById.mockResolvedValue(null);

      await expect(unifiedPaymentsService.getTransactionHistory(institutionId)).rejects.toThrow(
        `Institution with ID ${institutionId} not found.`
      );
    });

    it('should return transactions list', async () => {
      mockInstitutionFindById.mockResolvedValue({ id: institutionId });
      const mockHistory = [{ id: 'txn-1' }, { id: 'txn-2' }];
      mockTransactionFindManyForInstitution.mockResolvedValue(mockHistory);

      const result = await unifiedPaymentsService.getTransactionHistory(institutionId);

      expect(mockTransactionFindManyForInstitution).toHaveBeenCalledWith(institutionId);
      expect(result).toEqual(mockHistory);
    });
  });
});
