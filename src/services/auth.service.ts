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
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        ecclesiastical_role: user.ecclesiasticalRole,
        institution_id: user.institutionId,
      },
    };
  }
}

export const authService = new AuthService();
