import { Request, Response, NextFunction } from 'express';
import { Role } from '../constants/roles.enum';


/**
 * RoleGuard middleware
 * @param allowedRoles - array of roles permitted to access the route
 */
export const roleGuard = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.ecclesiasticalRole as Role;
    if (!userRole) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
};
