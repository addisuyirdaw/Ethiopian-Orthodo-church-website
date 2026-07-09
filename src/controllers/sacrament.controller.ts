import { Request, Response } from 'express';
import { sacramentalRecordService } from '../services/sacramental-record.service';
import { sacramentVerificationService } from '../services/sacrament-verification.service';
import {
  createSacramentSchema,
  listSacramentsQuerySchema,
} from '../validators/sacrament.validator';

export class SacramentController {
  async create(req: Request, res: Response): Promise<void> {
    const input = createSacramentSchema.parse(req.body);
    const record = await sacramentalRecordService.create(req.user!, input);

    res.status(201).json({
      data: record,
      message: 'Sacramental record created successfully.',
    });
  }

  async list(req: Request, res: Response): Promise<void> {
    const query = listSacramentsQuerySchema.parse(req.query);
    const { records, total } = await sacramentalRecordService.list(req.user!, query);

    res.status(200).json({
      data: records,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  }

  async verify(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const result = await sacramentVerificationService.verify(id);

    res.status(200).json({ data: result });
  }
}

export const sacramentController = new SacramentController();

