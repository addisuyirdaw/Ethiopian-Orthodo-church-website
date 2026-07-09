import { EcclesiasticalRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  institution_id: string;
  hierarchy_path: string;
  ecclesiastical_role: EcclesiasticalRole;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  institutionId: string;
  hierarchyPath: string;
  ecclesiasticalRole: EcclesiasticalRole;
}

export interface CalendarMetadata {
  gregorian?: string;
  julian?: string;
  ethiopic?: string;
  feastOrFast?: string;
  liturgicalNotes?: string;
}

export interface HierarchyNode {
  id: string;
  name: string;
  type: string;
  hierarchyPath: string;
  children: HierarchyNode[];
}

export const ADMINISTRATIVE_ROLES: readonly EcclesiasticalRole[] = [
  EcclesiasticalRole.PATRIARCH,
  EcclesiasticalRole.ARCHBISHOP,
  EcclesiasticalRole.METROPOLITAN,
  EcclesiasticalRole.BISHOP,
] as const;

export function isAdministrativeRole(role: EcclesiasticalRole): boolean {
  return (ADMINISTRATIVE_ROLES as readonly string[]).includes(role);
}

export function isDownstreamInstitution(
  actorHierarchyPath: string,
  targetHierarchyPath: string,
): boolean {
  return (
    targetHierarchyPath.startsWith(actorHierarchyPath) &&
    targetHierarchyPath !== actorHierarchyPath
  );
}

export function isSameOrDownstreamInstitution(
  actorHierarchyPath: string,
  targetHierarchyPath: string,
): boolean {
  return targetHierarchyPath.startsWith(actorHierarchyPath);
}
