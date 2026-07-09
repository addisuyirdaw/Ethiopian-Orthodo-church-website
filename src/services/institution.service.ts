import { Institution } from '@prisma/client';
import { institutionRepository } from '../repositories/institution.repository';
import { NotFoundError } from '../middleware/error-handler.middleware';
import { HierarchyNode } from '../types';

export class InstitutionService {
  /**
   * Builds a recursive JSON tree of institutions below the requesting user's level.
   */
  async getHierarchyTree(userInstitutionId: string, userHierarchyPath: string): Promise<HierarchyNode> {
    const root = await institutionRepository.findById(userInstitutionId);
    if (!root) {
      throw new NotFoundError('User institution not found.');
    }

    const descendants = await institutionRepository.findByHierarchyPathPrefix(userHierarchyPath);
    return this.buildTree(root, descendants);
  }

  private buildTree(root: Institution, allNodes: Institution[]): HierarchyNode {
    const nodeMap = new Map<string, HierarchyNode>();

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
}

export const institutionService = new InstitutionService();
