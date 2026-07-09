import { Request, Response } from 'express';
import { institutionService } from '../services/institution.service';

export class InstitutionController {
  async getHierarchy(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const tree = await institutionService.getHierarchyTree(
      user.institutionId,
      user.hierarchyPath,
    );

    res.status(200).json({ data: tree });
  }
}

export const institutionController = new InstitutionController();
