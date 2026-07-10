import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../middleware/error-handler.middleware';
import { JWT_SECRET } from '../middleware/auth.middleware';
import { userRepository } from '../repositories/user.repository';
import { JwtPayload } from '../types';

const JWT_EXPIRY = '24h';

export interface LoginResult {
  token: string;
  user: {
    id: string;
    email: string;
    ecclesiastical_role: string;
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

    const payload: JwtPayload = {
      sub: user.id,
      institution_id: user.institutionId,
      hierarchy_path: user.institution.hierarchyPath,
      ecclesiastical_role: user.ecclesiasticalRole,
      isSuperAdmin: user.ecclesiasticalRole === 'PATRIARCH',
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        ecclesiastical_role: user.ecclesiasticalRole,
        institution_id: user.institutionId,
        fullName: user.fullName,
        isSuperAdmin: user.ecclesiasticalRole === 'PATRIARCH',
        titleEn: user.titleEn,
        titleAm: user.titleAm,
        titleGez: user.titleGez,
        nameEn: user.nameEn,
        nameAm: user.nameAm,
        nameGez: user.nameGez,
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
