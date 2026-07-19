import { Transaction, PaymentProvider, PaymentStatus, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../lib/prisma';

export interface CreateTransactionData {
  institutionId: string;
  userId?: string | null;
  amount: Decimal | string | number;
  currency?: string;
  provider: PaymentProvider;
  providerRef: string;
  status?: PaymentStatus;
  metadata?: Prisma.InputJsonValue | null;
}

export class TransactionRepository {
  async create(data: CreateTransactionData): Promise<Transaction> {
    return prisma.transaction.create({
      data: {
        institutionId: data.institutionId,
        userId: data.userId ?? null,
        amount: new Decimal(String(data.amount)),
        currency: data.currency ?? 'ETB',
        provider: data.provider,
        providerRef: data.providerRef,
        status: data.status ?? 'PENDING',
        metadata: (data.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<Transaction> {
    return prisma.transaction.update({
      where: { id },
      data: { status },
    });
  }

  async findById(id: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({
      where: { id },
    });
  }

  async findByProviderRef(providerRef: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({
      where: { providerRef },
    });
  }

  async findManyForInstitution(institutionId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const transactionRepository = new TransactionRepository();
