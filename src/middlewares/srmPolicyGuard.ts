import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../middleware/error-handler.middleware';
import { Role } from '../constants/roles.enum';

/**
 * Guard for SRM (Spiritual Records Management) endpoints.
 * Allows only the specified ecclesiastical roles to access the route.
 *
 * Roles:
 *  - WANA_TSEHAFI: can create families and assign fathers.
 *  - KAHEN: can create and read confession records.
 */
export const srmPolicyGuard = (allowedRoles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.ecclesiasticalRole as Role | undefined;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return next(new ForbiddenError('Insufficient role for SRM operation'));
    }
    next();
  };
