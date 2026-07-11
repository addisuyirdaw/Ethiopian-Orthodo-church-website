import prisma from '../lib/prisma';

export class MimenRepository {
  async findByPhone(phone: string) {
    return prisma.mimen.findUnique({
      where: { phone },
      include: {
        tenant: true,
        assignedPriest: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.mimen.findUnique({
      where: { id },
      include: {
        tenant: true,
        assignedPriest: true,
      },
    });
  }

  async create(data: {
    phone: string;
    fullName: string;
    christianName?: string;
    passwordHash: string;
    tenantId: string;
    assignedPriestId?: string | null;
  }) {
    return prisma.mimen.create({
      data: {
        phone: data.phone,
        fullName: data.fullName,
        christianName: data.christianName || null,
        passwordHash: data.passwordHash,
        tenantId: data.tenantId,
        assignedPriestId: data.assignedPriestId || null,
      },
      include: {
        tenant: true,
        assignedPriest: true,
      },
    });
  }

  async findByPriestId(priestId: string) {
    return prisma.mimen.findMany({
      where: {
        assignedPriestId: priestId,
      },
      include: {
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }
}

export const mimenRepository = new MimenRepository();
