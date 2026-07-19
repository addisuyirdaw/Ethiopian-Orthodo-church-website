import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRole, EcclesiasticalRole } from '@prisma/client';
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

    if (decoded.auth_role && !Object.values(AuthRole).includes(decoded.auth_role)) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid auth role in token.',
      });
      return;
    }

    req.user = {
      id: decoded.sub,
      institutionId: decoded.institution_id,
      hierarchyPath: decoded.hierarchy_path,
      ecclesiasticalRole: decoded.ecclesiastical_role,
      authRole: decoded.auth_role,
      isSuperAdmin: decoded.isSuperAdmin || decoded.ecclesiastical_role === 'PATRIARCH' || decoded.auth_role === AuthRole.SYSTEM_ADMIN,
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

export function requireEpiscopalRole(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const user = req.user;

  if (!user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
    return;
  }

  const isEpiscopal = (
    [
      EcclesiasticalRole.BISHOP,
      EcclesiasticalRole.METROPOLITAN,
      EcclesiasticalRole.ARCHBISHOP,
      EcclesiasticalRole.PATRIARCH,
    ] as EcclesiasticalRole[]
  ).includes(user.ecclesiasticalRole);

  if (!isEpiscopal) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Canonical jurisdiction violation: Access denied.',
    });
    return;
  }

  next();
}

// ── Parish CRM Role Guards (appended — no existing code modified) ─────────────

/**
 * Generic role gate. Pass one or more EcclesiasticalRole values that are
 * permitted to access the route. PATRIARCH is always allowed as super-admin.
 *
 * Usage:
 *   router.get('/route', authenticateJwt, requireRole('PRIEST', 'BISHOP'), handler)
 */
export function requireRole(
  ...allowedRoles: EcclesiasticalRole[]
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
      return;
    }

    const permitted =
      user.ecclesiasticalRole === EcclesiasticalRole.PATRIARCH ||
      (allowedRoles as EcclesiasticalRole[]).includes(user.ecclesiasticalRole);

    if (!permitted) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access restricted. Required role(s): ${allowedRoles.join(', ')}.`,
      });
      return;
    }

    next();
  };
}

/**
 * Convenience middleware — restricts access to TREASURER (Gimja Bet) role.
 * PATRIARCH is always permitted as super-admin.
 */
export function requireTreasurerRole(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  requireRole(EcclesiasticalRole.TREASURER)(req, res, next);
}

/**
 * Convenience middleware — allows any ordained priest or higher:
 * PRIEST, ARCHPRIEST, DEACON, BISHOP, METROPOLITAN, ARCHBISHOP, PATRIARCH.
 * This is used for routes that manage spiritual children and appointments.
 */
export function requirePriestRole(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  requireRole(
    EcclesiasticalRole.PRIEST,
    EcclesiasticalRole.ARCHPRIEST,
    EcclesiasticalRole.DEACON,
    EcclesiasticalRole.BISHOP,
    EcclesiasticalRole.METROPOLITAN,
    EcclesiasticalRole.ARCHBISHOP,
  )(req, res, next);
}
