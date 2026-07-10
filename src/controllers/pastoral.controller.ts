import { Request, Response } from 'express';
import { pastoralCrmService } from '../services/pastoral/pastoral-crm.service';
import {
  addSpiritualChildSchema,
  logCounselingSessionSchema,
  advanceCatechumenSchema,
  listCatechumensSchema,
} from '../validators/pastoral.validator';
import { ForbiddenError } from '../middleware/error-handler.middleware';
import { EcclesiasticalRole } from '@prisma/client';

// ─── Roles that may act as spiritual fathers ──────────────────────────────────

const CLERGY_ROLES: readonly EcclesiasticalRole[] = [
  EcclesiasticalRole.PATRIARCH,
  EcclesiasticalRole.ARCHBISHOP,
  EcclesiasticalRole.METROPOLITAN,
  EcclesiasticalRole.BISHOP,
  EcclesiasticalRole.PRIEST,
];

function assertClergyRole(role: EcclesiasticalRole, message: string): void {
  if (!(CLERGY_ROLES as readonly string[]).includes(role)) {
    throw new ForbiddenError(message);
  }
}

export class PastoralController {
  /**
   * POST /api/v1/pastoral/roster
   *
   * Creates a new SpiritualRoster mapping between a priest and a spiritual
   * child. The calling user must hold a clergy-level ecclesiastical role.
   *
   * The tenantId is always resolved from the authenticated user's institution
   * to prevent cross-tenant roster creation.
   */
  async addSpiritualChild(req: Request, res: Response): Promise<void> {
    const user = req.user!;

    // Gate: caller must be clergy
    assertClergyRole(
      user.ecclesiasticalRole,
      'ይህ አካሄድ ለካህናት ብቻ ተፈቅዷል። ዲቁና ወይም ምእምናን ዝርዝሮችን ማስገባት አይፈቀዳቸውም።',
    );

    const input = addSpiritualChildSchema.parse(req.body);
    const tenantId = user.institutionId;

    const roster = await pastoralCrmService.addSpiritualChild(
      tenantId,
      input.priestUserId,
      input.spiritualChildUserId,
    );

    res.status(201).json({
      data: roster,
      message: 'የመንፈሳዊ አባትነት ዝርዝር በተሳካ ሁኔታ ተፈጥሯል።',
    });
  }

  /**
   * POST /api/v1/pastoral/counseling-logs
   *
   * Appends a pastoral counseling session log to a SpiritualRoster.
   * The calling user must be the specific assigned spiritual father for that
   * roster — the service layer enforces this via strict ID comparison.
   */
  async logCounselingSession(req: Request, res: Response): Promise<void> {
    const user = req.user!;

    // Gate: only clergy may log counseling sessions
    assertClergyRole(
      user.ecclesiasticalRole,
      'የምክር ዝርዝሮችን ለማስገባት ካህን ወይም ዲቁና ሚና ያስፈልጋል።',
    );

    const input = logCounselingSessionSchema.parse(req.body);

    const log = await pastoralCrmService.logCounselingSession(user.id, {
      rosterId:           input.rosterId,
      date:               input.date,
      type:               input.type,
      isCanonFulfilled:   input.isCanonFulfilled,
      encryptedNextSteps: input.encryptedNextSteps,
    });

    res.status(201).json({
      data: log,
      message: 'የምክር ዝርዝር በተሳካ ሁኔታ ተመዝግቧል።',
    });
  }

  /**
   * PATCH /api/v1/pastoral/catechumens/:recordId/status
   *
   * Advances a CatechumenRecord through the linear catechism state machine.
   * Tenancy is enforced from the authenticated user's institutionId.
   */
  async advanceCatechumen(req: Request, res: Response): Promise<void> {
    const user = req.user!;

    assertClergyRole(
      user.ecclesiasticalRole,
      'ምርቃና ሁኔታን ለማሻሻል ካህን ሚና ያስፈልጋል።',
    );

    const { recordId } = req.params;
    const input = advanceCatechumenSchema.parse(req.body);

    const record = await pastoralCrmService.advanceCatechumen(
      user.institutionId,
      recordId,
      input.targetStatus,
    );

    res.status(200).json({
      data: record,
      message: `የምርቃናዊ ሁኔታ ወደ "${input.targetStatus}" ተቀይሯል።`,
    });
  }

  /**
   * GET /api/v1/pastoral/roster
   *
   * Returns all SpiritualRoster entries for the authenticated priest within
   * their institution.
   */
  async listRoster(req: Request, res: Response): Promise<void> {
    const user = req.user!;

    assertClergyRole(
      user.ecclesiasticalRole,
      'ዝርዝሮቹን ለማየት ካህን ወይም ዲቁና ሚና ያስፈልጋል።',
    );

    const rosters = await pastoralCrmService.listRosterByPriest(
      user.institutionId,
      user.id,
    );

    res.status(200).json({ data: rosters });
  }

  /**
   * GET /api/v1/pastoral/catechumens
   *
   * Lists all CatechumenRecord entries for the caller's institution.
   * Supports optional `?status=` query filter.
   */
  async listCatechumens(req: Request, res: Response): Promise<void> {
    const user = req.user!;

    assertClergyRole(
      user.ecclesiasticalRole,
      'የምርቃናዊ ዝርዝሮችን ለማየት ካህን ወይም ዲቁና ሚና ያስፈልጋል።',
    );

    const query = listCatechumensSchema.parse(req.query);
    const catechumens = await pastoralCrmService.listCatechumens(
      user.institutionId,
      query.status,
    );

    res.status(200).json({ data: catechumens });
  }
}

export const pastoralController = new PastoralController();
