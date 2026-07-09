import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { EcclesiasticalRole } from '@prisma/client';
import { AuthenticatedUser, JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET ?? 'development-secret';

export function authenticateJwt(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header.',
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (
      !decoded.sub ||
      !decoded.institution_id ||
      !decoded.hierarchy_path ||
      !decoded.ecclesiastical_role
    ) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token payload is incomplete.',
      });
      return;
    }

    if (!Object.values(EcclesiasticalRole).includes(decoded.ecclesiastical_role)) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid ecclesiastical role in token.',
      });
      return;
    }

    req.user = {
      id: decoded.sub,
      institutionId: decoded.institution_id,
      hierarchyPath: decoded.hierarchy_path,
      ecclesiasticalRole: decoded.ecclesiastical_role,
    } satisfies AuthenticatedUser;

    next();
  } catch {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token.',
    });
  }
}

export { JWT_SECRET };
