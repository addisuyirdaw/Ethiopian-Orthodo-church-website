import { Request, Response } from 'express';
import { hymnArchiveService } from '../services/hymnology/hymn-archive.service';
import {
  createCompositionSchema,
  registerChoirMemberSchema,
  suggestedHymnsSchema,
} from '../validators/hymnology.validator';
import { ForbiddenError } from '../middleware/error-handler.middleware';
import { EcclesiasticalRole } from '@prisma/client';
import prisma from '../lib/prisma';

const CLERICAL_ROLES: readonly EcclesiasticalRole[] = [
  EcclesiasticalRole.PATRIARCH,
  EcclesiasticalRole.ARCHBISHOP,
  EcclesiasticalRole.METROPOLITAN,
  EcclesiasticalRole.BISHOP,
  EcclesiasticalRole.PRIEST,
  EcclesiasticalRole.DEACON,
];

export class HymnologyController {
  /**
   * POST /api/v1/hymnology/compositions
   * Creates a new sacred composition/chant.
   * Gated to authenticated users with clerical or director roles.
   */
  async createComposition(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const input = createCompositionSchema.parse(req.body);

    // Verify clerical or director role:
    const isClergy = CLERICAL_ROLES.includes(user.ecclesiasticalRole);
    
    // Check if user is a choir director/leader in their institution
    const choirRoster = await prisma.choirRoster.findUnique({
      where: {
        tenantId_userId: {
          tenantId: user.institutionId,
          userId: user.id,
        },
      },
    });
    
    const isDirector = choirRoster && (
      choirRoster.role.toUpperCase() === 'DIRECTOR' || 
      choirRoster.role.toUpperCase() === 'LEADER' ||
      choirRoster.role.toUpperCase() === 'CHOIR_DIRECTOR'
    );

    if (!isClergy && !isDirector) {
      throw new ForbiddenError(
        'የመዝሙር ማህደር ለመፍጠር የክህነት ማዕረግ ወይም የኮሮ መሪ (Director) መሆን ያስፈልጋል።'
      );
    }

    const composition = await hymnArchiveService.createComposition(input);

    res.status(201).json({
      data: composition,
      message: 'ስርዓተ መዝሙር በተሳካ ሁኔታ ተመዝግቧል።',
    });
  }

  /**
   * POST /api/v1/hymnology/choir/register
   * Registers a user to the choir roster under the caller's institution/tenant.
   * Only allows registering to the caller's own institution (tenant isolation).
   */
  async registerChoirMember(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const input = registerChoirMemberSchema.parse(req.body);

    // Multi-tenant check: Registering choir member to the user's institution
    const roster = await hymnArchiveService.registerChoirMember(user.institutionId, {
      userId: input.userId,
      choirPart: input.choirPart,
      role: input.role,
    });

    res.status(201).json({
      data: roster,
      message: 'የኮሮ አባል በተሳካ ሁኔታ ተመዝግቧል።',
    });
  }

  /**
   * GET /api/v1/hymnology/compositions/suggested
   * Suggests hymns based on liturgical context/fasting tier for a given date.
   * Public lookup.
   */
  async getSuggestedHymns(req: Request, res: Response): Promise<void> {
    // Validate date parameter from query
    const input = suggestedHymnsSchema.parse({ date: req.query.date });

    const suggestions = await hymnArchiveService.getSuggestedHymnsForSeason(input.date);

    res.status(200).json({
      data: suggestions,
    });
  }
}

export const hymnologyController = new HymnologyController();
