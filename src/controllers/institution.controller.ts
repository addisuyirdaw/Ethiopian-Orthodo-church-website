import { Request, Response } from 'express';
import { institutionRepository } from '../repositories/institution.repository';
import { institutionService } from '../services/institution.service';
import { resolvePolyglotPayload } from '../utils/polyglot-resolver';

export class InstitutionController {
  async listPublicInstitutions(req: Request, res: Response): Promise<void> {
    const allInstitutions = await institutionRepository.findAll();
    const tenants = allInstitutions
      .filter((inst) => inst.type === 'PARISH' || inst.type === 'MONASTERY')
      .map((inst) => ({
        id: inst.id,
        name: inst.name,
        nameEn: inst.nameEn,
        nameAm: inst.nameAm,
        nameGez: inst.nameGez,
        type: inst.type,
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

