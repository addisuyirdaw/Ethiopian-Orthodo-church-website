import { EcclesiasticalRole, InstitutionType } from '@prisma/client';
import prisma from '../lib/prisma';

export interface UserWithInstitution {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  ecclesiasticalRole: EcclesiasticalRole;
  institutionId: string;
  institution: {
    id: string;
    hierarchyPath: string;
    type: InstitutionType;
    deletedAt: Date | null;
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
        ecclesiasticalRole: true,
        institutionId: true,
        institution: {
          select: {
            id: true,
            hierarchyPath: true,
            type: true,
            deletedAt: true,
          },
        },
      },
    });
  }
}

export const userRepository = new UserRepository();
