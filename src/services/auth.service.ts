import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRole } from '@prisma/client';
import { ConflictError, NotFoundError, UnauthorizedError } from '../middleware/error-handler.middleware';
import { JWT_SECRET } from '../middleware/auth.middleware';
import { userRepository } from '../repositories/user.repository';
import { institutionRepository } from '../repositories/institution.repository';
import { JwtPayload } from '../types';

const JWT_EXPIRY = '24h';

export interface LoginResult {
  token: string;
  user: {
    id: string;
    email: string;
    ecclesiastical_role: string;
    auth_role: string;
    institution_id: string;
    fullName: string;
    isSuperAdmin?: boolean;
    titleEn?: string | null;
    titleAm?: string | null;
    titleGez?: string | null;
    nameEn?: string | null;
    nameAm?: string | null;
    nameGez?: string | null;
    institution?: {
      id: string;
      hierarchyPath: string;
      type: string;
      nameEn?: string | null;
      nameAm?: string | null;
      nameGez?: string | null;
    };
  };
}

export class AuthService {
  async login(email: string, password: string): Promise<LoginResult> {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedError();
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedError();
    }

    if (!user.institution || user.institution.deletedAt !== null) {
      throw new UnauthorizedError('Assigned institution is inactive or unavailable.');
    }

    return this.issueToken(user);
  }

  async signup(email: string, password: string, fullName: string, sex: 'MALE' | 'FEMALE', age: number, institutionId: string): Promise<LoginResult> {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('A user with that email already exists.');
    }

    const institution = await institutionRepository.findById(institutionId);
    if (!institution || institution.deletedAt !== null) {
      throw new NotFoundError('Selected institution is unavailable.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await userRepository.createUser({
      email,
      passwordHash,
      fullName,
      ecclesiasticalRole: 'LAITY',
      authRole: AuthRole.MIMEN,
      age,
      nameEn: fullName,
      nameAm: null,
      nameGez: null,
      sex,
      location: null,
      institution: {
        connect: { id: institutionId },
      },
    });

    return this.issueToken(created as any);
  }

  private issueToken(user: { id: string; institutionId: string; ecclesiasticalRole: string; authRole?: string; institution: { hierarchyPath: string; id: string; type: string; nameEn?: string | null; nameAm?: string | null; nameGez?: string | null } }) {
    const payload: JwtPayload = {
      sub: user.id,
      institution_id: user.institutionId,
      hierarchy_path: user.institution.hierarchyPath,
      ecclesiastical_role: user.ecclesiasticalRole as any,
      auth_role: user.authRole as any,
      isSuperAdmin: user.ecclesiasticalRole === 'PATRIARCH',
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    return {
      token,
      user: {
        id: user.id,
        email: (user as any).email,
        ecclesiastical_role: user.ecclesiasticalRole,
        auth_role: user.authRole ?? 'MIMEN',
        institution_id: user.institutionId,
        fullName: (user as any).fullName,
        isSuperAdmin: user.ecclesiasticalRole === 'PATRIARCH',
        titleEn: (user as any).titleEn,
        titleAm: (user as any).titleAm,
        titleGez: (user as any).titleGez,
        nameEn: (user as any).nameEn,
        nameAm: (user as any).nameAm,
        nameGez: (user as any).nameGez,
        institution: {
          id: user.institution.id,
          hierarchyPath: user.institution.hierarchyPath,
          type: user.institution.type,
          nameEn: user.institution.nameEn,
          nameAm: user.institution.nameAm,
          nameGez: user.institution.nameGez,
        },
      },
    };
  }
}

export const authService = new AuthService();
