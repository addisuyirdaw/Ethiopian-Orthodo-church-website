import { randomUUID } from 'crypto';
import { PaymentProvider, PaymentStatus, Transaction } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { NotFoundError } from '../middleware/error-handler.middleware';
import { merchantConfigRepository, CreateMerchantConfigData, UpdateMerchantConfigData } from '../repositories/merchant-config.repository';
import { transactionRepository, CreateTransactionData } from '../repositories/transaction.repository';
import { institutionRepository } from '../repositories/institution.repository';
import { paymentGatewayFactory } from './payment/payment-gateway.factory';

export class UnifiedPaymentsService {
  async configureMerchant(
    institutionId: string,
    data: { provider: PaymentProvider; isActive?: boolean; configPayload: any }
  ) {
    const institution = await institutionRepository.findById(institutionId);
    if (!institution) {
      throw new NotFoundError(`Institution with ID ${institutionId} not found.`);
    }

    const existing = await merchantConfigRepository.findByInstitutionId(institutionId);
    if (existing) {
      const updateData: UpdateMerchantConfigData = {
        provider: data.provider,
        isActive: data.isActive,
        configPayload: data.configPayload,
      };
      return merchantConfigRepository.update(institutionId, updateData);
    } else {
      const createData: CreateMerchantConfigData = {
        institutionId,
        provider: data.provider,
        isActive: data.isActive ?? true,
        configPayload: data.configPayload,
      };
      return merchantConfigRepository.create(createData);
    }
  }

  async getMerchantConfig(institutionId: string) {
    const config = await merchantConfigRepository.findByInstitutionId(institutionId);
    if (!config) {
      throw new NotFoundError(`Merchant configuration not found for institution ${institutionId}.`);
    }
    return config;
  }

  async initiatePayment(
    userId: string | null,
    institutionId: string,
    data: { amount: number; currency: string; provider: PaymentProvider }
  ) {
    const institution = await institutionRepository.findById(institutionId);
    if (!institution) {
      throw new NotFoundError(`Institution with ID ${institutionId} not found.`);
    }

    const activeConfig = await merchantConfigRepository.findActiveByInstitutionId(institutionId);
    if (!activeConfig || activeConfig.provider !== data.provider) {
      throw new NotFoundError(`No active merchant configuration found for provider ${data.provider} on institution ${institutionId}.`);
    }

    const providerRef = `UP-TXN-${randomUUID()}`;

    // Resolve payment strategy (bridge to the existing strategy by casting provider string)
    const strategy = paymentGatewayFactory.resolveByGateway(data.provider as any);
    const result = await strategy.initiatePayment(data.amount, data.currency, providerRef);

    const transactionData: CreateTransactionData = {
      institutionId,
      userId,
      amount: data.amount,
      currency: data.currency,
      provider: data.provider,
      providerRef,
      status: 'PENDING',
      metadata: result.rawResponse as any,
    };

    const transaction = await transactionRepository.create(transactionData);

    return {
      transactionId: transaction.id,
      providerRef: transaction.providerRef,
      gatewayUrl: result.gatewayUrl,
    };
  }

  async settleWebhook(providerRef: string, gatewayStatus: 'SUCCESS' | 'FAILED' | 'PENDING'): Promise<Transaction> {
    const transaction = await transactionRepository.findByProviderRef(providerRef);
    if (!transaction) {
      throw new NotFoundError(`Transaction with reference ${providerRef} not found.`);
    }

    let status: PaymentStatus = 'PENDING';
    if (gatewayStatus === 'SUCCESS') {
      status = 'SUCCESSFUL';
    } else if (gatewayStatus === 'FAILED') {
      status = 'FAILED';
    }

    return transactionRepository.updateStatus(transaction.id, status);
  }

  async getTransactionHistory(institutionId: string): Promise<Transaction[]> {
    const institution = await institutionRepository.findById(institutionId);
    if (!institution) {
      throw new NotFoundError(`Institution with ID ${institutionId} not found.`);
    }
    return transactionRepository.findManyForInstitution(institutionId);
  }
}

export const unifiedPaymentsService = new UnifiedPaymentsService();
