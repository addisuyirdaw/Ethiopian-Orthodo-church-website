import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { institutionRepository } from '../repositories/institution.repository';
import { institutionService } from '../services/institution.service';
import { resolvePolyglotPayload } from '../utils/polyglot-resolver';

export class InstitutionController {
  async listDioceses(req: Request, res: Response): Promise<void> {
    const dioceses = await prisma.institution.findMany({
      where: {
        type: { in: ['ARCHDIOCESE', 'DIOCESE'] },
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        nameAm: true,
        nameEn: true,
        type: true,
      },
      orderBy: { nameAm: 'asc' },
    });
    res.status(200).json({ data: dioceses });
  }

  async listParishesByDiocese(req: Request, res: Response): Promise<void> {
    const { dioceseId } = req.params;
    const parishes = await prisma.institution.findMany({
      where: {
        parentId: dioceseId,
        type: 'PARISH',
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        nameAm: true,
        nameEn: true,
        type: true,
        address: true,
        phone: true,
        email: true,
        description: true,
        logo: true,
      },
      orderBy: { nameAm: 'asc' },
    });
    res.status(200).json({ data: parishes });
  }

  async listPublicInstitutions(req: Request, res: Response): Promise<void> {
    const allInstitutions = await institutionRepository.findAll();
    const tenants = allInstitutions
      .filter((inst) => (inst.type === 'PARISH' || inst.type === 'MONASTERY') && inst.isActive !== false)
      .map((inst) => ({
        id: inst.id,
        name: inst.name,
        nameEn: inst.nameEn,
        nameAm: inst.nameAm,
        nameGez: inst.nameGez,
        type: inst.type,
        address: inst.address,
        phone: inst.phone,
        email: inst.email,
        description: inst.description,
        logo: inst.logo,
      }));

    res.status(200).json({ data: tenants });
  }


  async listInstitutionPriests(req: Request, res: Response): Promise<void> {
    const institutionId = req.params.institutionId;
    const priests = await institutionService.getPriestsForInstitution(institutionId);
    res.status(200).json({ data: priests });
  }

  async getHierarchy(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const tree = await institutionService.getHierarchyTree(
      user.institutionId,
      user.hierarchyPath,
    );

    const resolved = resolvePolyglotPayload(tree, req.locale ?? 'en');

    res.status(200).json({ data: resolved });
  }
}

export const institutionController = new InstitutionController();

