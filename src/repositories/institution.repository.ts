import { Institution, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

export class InstitutionRepository {
  async findById(id: string): Promise<Institution | null> {
    return prisma.institution.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByHierarchyPathPrefix(prefix: string): Promise<Institution[]> {
    return prisma.institution.findMany({
      where: {
        hierarchyPath: { startsWith: prefix },
        deletedAt: null,
      },
      orderBy: { hierarchyPath: 'asc' },
    });
  }

  async findDirectChildren(parentId: string): Promise<Institution[]> {
    return prisma.institution.findMany({
      where: {
        parentId: parentId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: Prisma.InstitutionCreateInput): Promise<Institution> {
    return prisma.institution.create({ data });
  }

  async updateHierarchyPath(id: string, hierarchyPath: string): Promise<Institution> {
    return prisma.institution.update({
      where: { id },
      data: { hierarchyPath },
    });
  }

  /**
   * Returns all non-deleted institutions ordered by hierarchy path.
   * Used by the public tenant listing endpoint to populate the
   * lay-donation parish/monastery dropdown.
   */
  async findAll(): Promise<Institution[]> {
    return prisma.institution.findMany({
      where: { deletedAt: null },
      orderBy: { hierarchyPath: 'asc' },
    });
  }
}

export const institutionRepository = new InstitutionRepository();
