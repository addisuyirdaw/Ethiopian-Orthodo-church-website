import { Prisma, SacramentalRecord, SacramentalType } from '@prisma/client';
import prisma from '../lib/prisma';

export interface ListSacramentsFilter {
  institutionId: string;
  type?: SacramentalType;
  page: number;
  limit: number;
}

export class SacramentalRecordRepository {
  async create(
    data: Prisma.SacramentalRecordCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<SacramentalRecord> {
    const client = tx ?? prisma;
    return client.sacramentalRecord.create({ data });
  }

  async findMany(filter: ListSacramentsFilter): Promise<{
    records: SacramentalRecord[];
    total: number;
  }> {
    const where: Prisma.SacramentalRecordWhereInput = {
      institutionId: filter.institutionId,
      deletedAt: null,
      ...(filter.type ? { type: filter.type } : {}),
    };

    const [records, total] = await prisma.$transaction([
      prisma.sacramentalRecord.findMany({
        where,
        orderBy: { eventDateUtc: 'desc' },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        include: {
          celebrantPriest: {
            select: { id: true, fullName: true, ecclesiasticalRole: true },
          },
          targetUser: {
            select: { id: true, fullName: true },
          },
        },
      }),
      prisma.sacramentalRecord.count({ where }),
    ]);

    return { records, total };
  }

  async findById(id: string): Promise<SacramentalRecord | null> {
    return prisma.sacramentalRecord.findFirst({
      where: { id, deletedAt: null },
    });
  }
}

export const sacramentalRecordRepository = new SacramentalRecordRepository();
