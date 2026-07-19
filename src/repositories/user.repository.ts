import { AuthRole, EcclesiasticalRole, InstitutionType, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

export interface UserWithInstitution {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  titleEn: string | null;
  titleAm: string | null;
  titleGez: string | null;
  nameEn: string | null;
  nameAm: string | null;
  nameGez: string | null;
  ecclesiasticalRole: EcclesiasticalRole;
  authRole: AuthRole;
  institutionId: string;
  age?: number | null;
  spiritualFatherId?: string | null;
  sex?: string | null;
  location?: string | null;
  christianName?: string | null;
  birthDate?: Date | null;
  phoneNumber?: string | null;
  region?: string | null;
  city?: string | null;
  address?: string | null;
  baptismStatus?: string | null;
  photoUrl?: string | null;
  deletedAt?: Date | null;
  institution: {
    id: string;
    hierarchyPath: string;
    type: InstitutionType;
    deletedAt: Date | null;
    nameEn: string | null;
    nameAm: string | null;
    nameGez: string | null;
  };
}

export class UserRepository {
  async findByEmail(email: string): Promise<UserWithInstitution | null> {
    return prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        fullName: true,
        titleEn: true,
        titleAm: true,
        titleGez: true,
        nameEn: true,
        nameAm: true,
        nameGez: true,
        ecclesiasticalRole: true,
        authRole: true,
        institutionId: true,
        age: true,
        spiritualFatherId: true,
        sex: true,
        location: true,
        christianName: true,
        birthDate: true,
        phoneNumber: true,
        region: true,
        city: true,
        address: true,
        baptismStatus: true,
        photoUrl: true,
        deletedAt: true,
        institution: {
          select: {
            id: true,
            hierarchyPath: true,
            type: true,
            deletedAt: true,
            nameEn: true,
            nameAm: true,
            nameGez: true,
          },
        },
      },
    }) as Promise<UserWithInstitution | null>;
  }

  async findById(id: string): Promise<UserWithInstitution | null> {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        fullName: true,
        titleEn: true,
        titleAm: true,
        titleGez: true,
        nameEn: true,
        nameAm: true,
        nameGez: true,
        ecclesiasticalRole: true,
        authRole: true,
        institutionId: true,
        age: true,
        spiritualFatherId: true,
        sex: true,
        location: true,
        christianName: true,
        birthDate: true,
        phoneNumber: true,
        region: true,
        city: true,
        address: true,
        baptismStatus: true,
        photoUrl: true,
        deletedAt: true,
        institution: {
          select: {
            id: true,
            hierarchyPath: true,
            type: true,
            deletedAt: true,
            nameEn: true,
            nameAm: true,
            nameGez: true,
          },
        },
      },
    }) as Promise<UserWithInstitution | null>;
  }

  async createUser(data: Prisma.UserCreateInput): Promise<UserWithInstitution> {
    return prisma.user.create({
      data,
      include: {
        institution: {
          select: {
            id: true,
            hierarchyPath: true,
            type: true,
            deletedAt: true,
            nameEn: true,
            nameAm: true,
            nameGez: true,
          },
        },
      },
    }) as Promise<UserWithInstitution>;
  }

  async updateById(id: string, data: Prisma.UserUpdateInput): Promise<UserWithInstitution> {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        institution: {
          select: {
            id: true,
            hierarchyPath: true,
            type: true,
            deletedAt: true,
            nameEn: true,
            nameAm: true,
            nameGez: true,
          },
        },
      },
    }) as Promise<UserWithInstitution>;
  }

  async softDelete(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findPriestsByInstitution(institutionId: string) {
    return prisma.user.findMany({
      where: {
        institutionId,
        ecclesiasticalRole: EcclesiasticalRole.PRIEST,
        deletedAt: null,
      },
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        titleEn: true,
        titleAm: true,
        titleGez: true,
        sex: true,
        location: true,
      },
    });
  }
}

export const userRepository = new UserRepository();
