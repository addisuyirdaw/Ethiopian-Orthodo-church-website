import { MerchantConfiguration, PaymentProvider, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

export interface CreateMerchantConfigData {
  institutionId: string;
  provider: PaymentProvider;
  isActive?: boolean;
  configPayload: Prisma.InputJsonValue;
}

export interface UpdateMerchantConfigData {
  provider?: PaymentProvider;
  isActive?: boolean;
  configPayload?: Prisma.InputJsonValue;
}

export class MerchantConfigRepository {
  async create(data: CreateMerchantConfigData): Promise<MerchantConfiguration> {
    return prisma.merchantConfiguration.create({
      data: {
        institutionId: data.institutionId,
        provider: data.provider,
        isActive: data.isActive ?? true,
        configPayload: data.configPayload,
      },
    });
  }

  async update(institutionId: string, data: UpdateMerchantConfigData): Promise<MerchantConfiguration> {
    return prisma.merchantConfiguration.update({
      where: { institutionId },
      data,
    });
  }

  async findByInstitutionId(institutionId: string): Promise<MerchantConfiguration | null> {
    return prisma.merchantConfiguration.findUnique({
      where: { institutionId },
    });
  }

  async findActiveByInstitutionId(institutionId: string): Promise<MerchantConfiguration | null> {
    return prisma.merchantConfiguration.findFirst({
      where: {
        institutionId,
        isActive: true,
      },
    });
  }
}

export const merchantConfigRepository = new MerchantConfigRepository();
