import { Institution, PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma';

type InstitutionClient = Pick<PrismaClient, 'institution'>;

/**
 * Computes hierarchy_path for a new institution after insert.
 * Format: "/{rootId}/.../{id}/" for accelerated sub-tree queries.
 */
export async function assignHierarchyPath(
  institutionId: string,
  parentInstitutionId: string | null,
  client: InstitutionClient = prisma,
): Promise<string> {
  if (!parentInstitutionId) {
    const path = `/${institutionId}/`;
    await client.institution.update({
      where: { id: institutionId },
      data: { hierarchyPath: path },
    });
    return path;
  }

  const parent = await client.institution.findFirst({
    where: { id: parentInstitutionId, deletedAt: null },
  });

  if (!parent) {
    throw new Error('Parent institution not found.');
  }

  const path = `${parent.hierarchyPath}${institutionId}/`;
  await client.institution.update({
    where: { id: institutionId },
    data: { hierarchyPath: path },
  });

  return path;
}

export function buildHierarchyTreeFromFlat(
  root: Institution,
  allNodes: Institution[],
): import('../types').HierarchyNode {
  const nodeMap = new Map<string, import('../types').HierarchyNode>();

  for (const node of allNodes) {
    nodeMap.set(node.id, {
      id: node.id,
      name: node.name,
      type: node.type,
      hierarchyPath: node.hierarchyPath,
      children: [],
    });
  }

  const rootNode = nodeMap.get(root.id)!;

  for (const node of allNodes) {
    if (node.id === root.id) continue;
    const current = nodeMap.get(node.id)!;
    const parent = node.parentInstitutionId
      ? nodeMap.get(node.parentInstitutionId)
      : undefined;
    if (parent) {
      parent.children.push(current);
    }
  }

  return rootNode;
}
