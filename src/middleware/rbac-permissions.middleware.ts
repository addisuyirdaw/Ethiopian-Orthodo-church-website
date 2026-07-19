import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from './error-handler.middleware';
import { AuthRole, EcclesiasticalRole } from '@prisma/client';

/**
 * RBAC Permission Middleware
 * 
 * Fine-grained role-based access control for OrthodoxConnect.
 * Enforces specific operations to require specific roles.
 * 
 * Per Ethiopian Orthodox Tewahedo Church Administrative Constitution (2009 E.C. 4th Edition):
 * - Sensitive financial and governance actions require elevated roles
 * - Dual authorization required for bank withdrawals > 50,000 ETB
 * - Parish council seat assignments require administrative role
 * - Confession and pastoral records require clergy roles
 */

export enum OperationPermission {
  // Governance Operations
  REQUEST_DUAL_AUTH = 'REQUEST_DUAL_AUTH',              // CHAIRPERSON, DEPUTY_CHAIRPERSON, ACCOUNTANT
  APPROVE_DUAL_AUTH = 'APPROVE_DUAL_AUTH',              // CHAIRPERSON, DEPUTY_CHAIRPERSON only
  ASSIGN_COUNCIL_SEAT = 'ASSIGN_COUNCIL_SEAT',          // PARISH_ADMIN, SYSTEM_ADMIN
  RECORD_COUNCIL_MINUTES = 'RECORD_COUNCIL_MINUTES',    // SECRETARY, ADMIN
  
  // Financial Operations
  BANK_WITHDRAWAL_OVER_50K = 'BANK_WITHDRAWAL_OVER_50K', // CHAIRPERSON + DEPUTY (dual-auth)
  ASSET_DISPOSAL = 'ASSET_DISPOSAL',                    // CHAIRPERSON + DEPUTY (dual-auth)
  BUDGET_MODIFICATION = 'BUDGET_MODIFICATION',          // CHAIRPERSON + DEPUTY (dual-auth)
  
  // Pastoral Operations
  ASSIGN_SPIRITUAL_FATHER = 'ASSIGN_SPIRITUAL_FATHER',  // MIMEN (self), PRIEST (assignment)
  LOG_CONFESSION = 'LOG_CONFESSION',                    // PRIEST (self to own followers)
  LOG_COUNSELING = 'LOG_COUNSELING',                    // CLERGY
  MANAGE_CATECHUMEN = 'MANAGE_CATECHUMEN',              // CLERGY
}

/**
 * Role-to-permission mapping matrix
 * 
 * Defines which AuthRole + EcclesiasticalRole combinations can perform which operations.
 * 
 * AuthRole Hierarchy (functional roles):
 *   - MIMEN: Layperson member
 *   - PRIEST: Clergy member (special permissions)
 *   - PARISH_ADMIN: Parish administrative role
 *   - SYSTEM_ADMIN: System-wide administrator
 * 
 * EcclesiasticalRole Hierarchy (canonical roles):
 *   - PATRIARCH: Highest church authority
 *   - ARCHBISHOP, METROPOLITAN, BISHOP: Diocesan leadership
 *   - PRIEST: Clergy with pastoral authority
 *   - DEACON: Junior clergy
 *   - LAITY: Regular members
 * 
 * CouncilRole (Kale Awadi specific):
 *   - LIQE_MENBER: Chairperson
 *   - MEK_LIQE_MENBER: Deputy Chairperson
 *   - WANA_TSEHAFI: Treasurer
 *   - GENZEB_YAZHI: Accountant
 *   - HISAB_SHUM: Finance Officer
 */
const PERMISSION_MATRIX: Record<
  OperationPermission,
  { authRoles?: AuthRole[]; ecclesiasticalRoles?: EcclesiasticalRole[]; customCheck?: (req: Request) => boolean }
> = {
  [OperationPermission.REQUEST_DUAL_AUTH]: {
    authRoles: ['PARISH_ADMIN', 'SYSTEM_ADMIN'],
    // CouncilRole check happens in service layer (CHAIRPERSON, DEPUTY_CHAIRPERSON, ACCOUNTANT)
  },

  [OperationPermission.APPROVE_DUAL_AUTH]: {
    authRoles: ['PARISH_ADMIN', 'SYSTEM_ADMIN'],
    // CouncilRole check happens in service layer (CHAIRPERSON or DEPUTY_CHAIRPERSON only)
  },

  [OperationPermission.ASSIGN_COUNCIL_SEAT]: {
    authRoles: ['PARISH_ADMIN', 'SYSTEM_ADMIN'],
  },

  [OperationPermission.RECORD_COUNCIL_MINUTES]: {
    authRoles: ['PARISH_ADMIN', 'SYSTEM_ADMIN'],
  },

  [OperationPermission.BANK_WITHDRAWAL_OVER_50K]: {
    // Requires BOTH chairperson and deputy approval via dual-auth workflow
    customCheck: (req) => req.body?.dualAuthRequestId !== undefined,
  },

  [OperationPermission.ASSET_DISPOSAL]: {
    // Requires BOTH chairperson and deputy approval via dual-auth workflow
    customCheck: (req) => req.body?.dualAuthRequestId !== undefined,
  },

  [OperationPermission.BUDGET_MODIFICATION]: {
    // Requires BOTH chairperson and deputy approval via dual-auth workflow
    customCheck: (req) => req.body?.dualAuthRequestId !== undefined,
  },

  [OperationPermission.ASSIGN_SPIRITUAL_FATHER]: {
    authRoles: ['MIMEN', 'PRIEST'],
    ecclesiasticalRoles: ['PRIEST', 'LAITY'],
  },

  [OperationPermission.LOG_CONFESSION]: {
    authRoles: ['PRIEST'],
    ecclesiasticalRoles: ['PRIEST', 'DEACON'],
  },

  [OperationPermission.LOG_COUNSELING]: {
    ecclesiasticalRoles: ['PATRIARCH', 'ARCHBISHOP', 'METROPOLITAN', 'BISHOP', 'PRIEST', 'DEACON'],
  },

  [OperationPermission.MANAGE_CATECHUMEN]: {
    ecclesiasticalRoles: ['PATRIARCH', 'ARCHBISHOP', 'METROPOLITAN', 'BISHOP', 'PRIEST', 'DEACON'],
  },
};

/**
 * Higher-order middleware factory: Create an RBAC middleware for a specific operation.
 * 
 * Usage:
 * ```
 * router.post('/governance/request-action',
 *   authenticateJwt,
 *   rbacPermission(OperationPermission.REQUEST_DUAL_AUTH),
 *   asyncHandler(controller.requestAction)
 * );
 * ```
 * 
 * @param operation – The operation to check permission for
 * @param options – Additional options (e.g., requireInstitutionMatch)
 * @returns Express middleware function
 */
export function rbacPermission(
  operation: OperationPermission,
  options?: { requireSameInstitution?: boolean }
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    // Authentication check (should already be done by authenticateJwt middleware)
    if (!user) {
      throw new UnauthorizedError('Authentication required for this operation.');
    }

    const permissionSpec = PERMISSION_MATRIX[operation];
    if (!permissionSpec) {
      throw new Error(`Unknown operation: ${operation}`);
    }

    // Custom check (e.g., dual-auth payload validation)
    if (permissionSpec.customCheck) {
      if (!permissionSpec.customCheck(req)) {
        throw new ForbiddenError(
          `Custom permission check failed for operation: ${operation}`
        );
      }
    }

    // AuthRole check
    if (permissionSpec.authRoles) {
      const hasAuthRole = (permissionSpec.authRoles as string[]).includes(user.authRole as string);
      if (!hasAuthRole) {
        throw new ForbiddenError(
          `This operation requires one of the following roles: ${permissionSpec.authRoles.join(', ')}. You have: ${user.authRole}`
        );
      }
    }

    // EcclesiasticalRole check
    if (permissionSpec.ecclesiasticalRoles) {
      const hasEccRole = (permissionSpec.ecclesiasticalRoles as string[]).includes(
        user.ecclesiasticalRole
      );
      if (!hasEccRole) {
        throw new ForbiddenError(
          `This operation requires one of the following ecclesiastical roles: ${permissionSpec.ecclesiasticalRoles.join(', ')}. You have: ${user.ecclesiasticalRole}`
        );
      }
    }

    // Institution match check (if required)
    if (options?.requireSameInstitution) {
      const targetInstitutionId = req.params.institutionId || req.query.institutionId || req.body?.institutionId;
      if (targetInstitutionId && user.institutionId !== targetInstitutionId && user.authRole !== 'SYSTEM_ADMIN') {
        throw new ForbiddenError('You do not have permission to access this institution.');
      }
    }

    next();
  };
}

/**
 * Simpler middleware: Check if user has ADMIN authority.
 * Used for endpoints that require administrative privileges.
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = req.user;

  if (!user) {
    throw new UnauthorizedError('Authentication required.');
  }

  if (user.authRole !== 'PARISH_ADMIN' && user.authRole !== 'SYSTEM_ADMIN') {
    throw new ForbiddenError('Administrative privileges required.');
  }

  next();
}

/**
 * Check if user has CLERGY authority.
 * Used for endpoints that require clergy/pastoral roles.
 */
export function requireClergy(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = req.user;

  if (!user) {
    throw new UnauthorizedError('Authentication required.');
  }

  const clergyRoles = [
    EcclesiasticalRole.PATRIARCH,
    EcclesiasticalRole.ARCHBISHOP,
    EcclesiasticalRole.METROPOLITAN,
    EcclesiasticalRole.BISHOP,
    EcclesiasticalRole.PRIEST,
    EcclesiasticalRole.DEACON,
  ];

  if (!(clergyRoles as string[]).includes(user.ecclesiasticalRole)) {
    throw new ForbiddenError('Clergy role required for this operation.');
  }

  next();
}

/**
 * Check if user is a PRIEST.
 * Used for endpoints that require priest-specific authority.
 */
export function requirePriest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = req.user;

  if (!user) {
    throw new UnauthorizedError('Authentication required.');
  }

  if (user.ecclesiasticalRole !== EcclesiasticalRole.PRIEST) {
    throw new ForbiddenError('Priest role required for this operation.');
  }

  next();
}
