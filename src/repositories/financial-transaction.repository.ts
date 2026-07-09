import {
  FinancialTransaction,
  LedgerSplitRecord,
  PaymentGateway,
  Prisma,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../lib/prisma';

export interface CreateFinancialTransactionInput {
  institutionId: string;
  amount: Decimal;
  currency: string;
  type: TransactionType;
  gateway: PaymentGateway;
  referenceId: string;
  status: TransactionStatus;
}

export interface CreateLedgerSplitInput {
  financialTransactionId: string;
  destinationInstitutionId: string;
  splitAmount: Decimal;
  percentageApplied: Decimal;
}

export interface LedgerListFilter {
  hierarchyPathPrefix?: string;
  institutionId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  page: number;
  limit: number;
}

export type FinancialTransactionWithSplits = FinancialTransaction & {
  ledgerSplits: (LedgerSplitRecord & {
    destinationInstitution: {
      id: string;
      name: string;
      type: string;
      hierarchyPath: string;
    };
  })[];
  institution: {
    id: string;
    name: string;
    type: string;
    hierarchyPath: string;
  };
};

export class FinancialTransactionRepository {
  async create(
    data: CreateFinancialTransactionInput,
    tx?: Prisma.TransactionClient,
  ): Promise<FinancialTransaction> {
    const client = tx ?? prisma;
    return client.financialTransaction.create({
      data: {
        institutionId: data.institutionId,
        amount: data.amount,
        currency: data.currency,
        type: data.type,
        gateway: data.gateway,
        referenceId: data.referenceId,
        status: data.status,
      },
    });
  }

  async createLedgerSplit(
    data: CreateLedgerSplitInput,
    tx?: Prisma.TransactionClient,
  ): Promise<LedgerSplitRecord> {
    const client = tx ?? prisma;
    return client.ledgerSplitRecord.create({
      data: {
        financialTransactionId: data.financialTransactionId,
        destinationInstitutionId: data.destinationInstitutionId,
        splitAmount: data.splitAmount,
        percentageApplied: data.percentageApplied,
      },
    });
  }

  async findMany(filter: LedgerListFilter): Promise<{
    transactions: FinancialTransactionWithSplits[];
    total: number;
  }> {
    const where: Prisma.FinancialTransactionWhereInput = {
      deletedAt: null,
      ...(filter.type ? { type: filter.type } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.institutionId
        ? { institutionId: filter.institutionId }
        : filter.hierarchyPathPrefix
          ? {
              institution: {
                hierarchyPath: { startsWith: filter.hierarchyPathPrefix },
                deletedAt: null,
              },
            }
          : {}),
    };

    const [transactions, total] = await prisma.$transaction([
      prisma.financialTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        include: {
          institution: {
            select: {
              id: true,
              name: true,
              type: true,
              hierarchyPath: true,
            },
          },
          ledgerSplits: {
            include: {
              destinationInstitution: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  hierarchyPath: true,
                },
              },
            },
          },
        },
      }),
      prisma.financialTransaction.count({ where }),
    ]);

    return { transactions, total };
  }

  async findByReferenceId(referenceId: string): Promise<FinancialTransaction | null> {
    return prisma.financialTransaction.findFirst({
      where: { referenceId, deletedAt: null },
    });
  }
}

export const financialTransactionRepository = new FinancialTransactionRepository();
