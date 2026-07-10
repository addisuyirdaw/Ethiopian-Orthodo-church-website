import { EcclesiasticalRole, InstitutionType } from '@prisma/client';
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
  institutionId: string;
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
        institutionId: true,
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
}

export const userRepository = new UserRepository();
