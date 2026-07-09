import { Request, Response, NextFunction } from 'express';
import { isAdministrativeRole, isSameOrDownstreamInstitution } from '../types';
import { institutionRepository } from '../repositories/institution.repository';

export interface TenantAccessOptions {
  /** Institution ID from route params or body to authorize against */
  targetInstitutionId?: string;
  /** When true, only same-institution access is allowed (writes) */
  requireSameInstitution?: boolean;
}

export const FORBIDDEN_RESPONSE = {
  error: 'Forbidden',
  message: 'Canonical jurisdiction violation: Access denied.',
} as const;

/**
 * Resolves whether the authenticated user may access the target institution.
 */
export async function canAccessInstitution(
  user: NonNullable<Request['user']>,
  targetInstitutionId: string,
  requireSameInstitution = false,
): Promise<boolean> {
  if (user.institutionId === targetInstitutionId) {
    return true;
  }

  if (requireSameInstitution) {
    return false;
  }

  if (!isAdministrativeRole(user.ecclesiasticalRole)) {
    return false;
  }

  const target = await institutionRepository.findById(targetInstitutionId);
  if (!target || target.deletedAt) {
    return false;
  }

  return isSameOrDownstreamInstitution(user.hierarchyPath, target.hierarchyPath);
}

/**
 * Express middleware enforcing hierarchical multi-tenant RBAC.
 * Reads target institution from query `institution_id`, body `institutionId`, or params.
 */
export function tenantRbac(options: TenantAccessOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
      return;
    }

    const targetInstitutionId =
      options.targetInstitutionId ??
      (req.query.institution_id as string | undefined) ??
      (req.body?.institutionId as string | undefined) ??
      (req.params?.institutionId as string | undefined) ??
      user.institutionId;

    const allowed = await canAccessInstitution(
      user,
      targetInstitutionId,
      options.requireSameInstitution ?? false,
    );

    if (!allowed) {
      res.status(403).json(FORBIDDEN_RESPONSE);
      return;
    }

    req.resolvedInstitutionId = targetInstitutionId;
    next();
  };
}

declare global {
  namespace Express {
    interface Request {
      resolvedInstitutionId?: string;
    }
  }
}

/**
 * Validates institution access for service-layer calls (e.g., optional drill-down).
 */
export async function assertInstitutionAccess(
  user: NonNullable<Request['user']>,
  targetInstitutionId: string,
  requireSameInstitution = false,
): Promise<void> {
  const allowed = await canAccessInstitution(
    user,
    targetInstitutionId,
    requireSameInstitution,
  );

  if (!allowed) {
    const error = new Error('Canonical jurisdiction violation: Access denied.');
    error.name = 'ForbiddenError';
    throw error;
  }
}
