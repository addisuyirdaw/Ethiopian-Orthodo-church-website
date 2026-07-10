import { Request, Response } from 'express';
import { institutionService } from '../services/institution.service';
import { resolvePolyglotPayload } from '../utils/polyglot-resolver';

export class InstitutionController {
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

