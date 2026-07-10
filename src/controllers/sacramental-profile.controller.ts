import { Request, Response, NextFunction } from 'express';
import {
  sacramentalService,
  CanonicalError,
} from '../services/ecclesiastical/sacramental-profile.service';
import {
  registerBaptismSchema,
  verifyAndRegisterMarriageSchema,
} from '../validators/sacramental-profile.validator';

class SacramentalProfileController {
  /**
   * POST /api/v1/sacramental-profiles/baptism
   *
   * Registers a new baptism profile, generating a deterministic
   * canonical ID in the format `OC-REG-<YEAR>-<HEX8>`.
   *
   * Protected: requires JWT + tenantRbac (same institution write).
   */
  async registerBaptism(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = registerBaptismSchema.parse(req.body);
      const profile = await sacramentalService.registerBaptism(input);

      res.status(201).json({
        success: true,
        data: profile,
        message: 'Baptism registered and canonical profile created successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/sacramental-profiles/marriage/verify-and-register
   *
   * Verifies canonical eligibility (SINGLE or WIDOWED) of both parties,
   * then atomically seals the marriage — creating the MarriageRegistry
   * record and updating both profiles to MARRIED in a Serializable transaction.
   *
   * Responds 400 if either party is MARRIED, MONASTIC, or CLERGY.
   *
   * Protected: requires JWT + tenantRbac.
   */
  async verifyAndRegisterMarriage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = verifyAndRegisterMarriageSchema.parse(req.body);

      const registry = await sacramentalService.verifyAndRegisterMarriage(
        input.husbandSacramentalId,
        input.wifeSacramentalId,
        {
          marriageDate: input.marriageDate,
          officiatingPriestId: input.officiatingPriestId,
          parishId: input.parishId,
          witnessNames: input.witnessNames,
        },
      );

      res.status(201).json({
        success: true,
        data: registry,
        message: 'Marriage sealed and canonical profiles updated to MARRIED status.',
      });
    } catch (err) {
      // CanonicalError is a domain exception → HTTP 400
      if (err instanceof CanonicalError) {
        res.status(400).json({
          error: 'CanonicalError',
          message: err.message,
        });
        return;
      }

      // NotFoundError (profile lookup failure) → HTTP 404
      if (err instanceof Error && err.name === 'NotFoundError') {
        res.status(404).json({
          error: 'NotFound',
          message: err.message,
        });
        return;
      }

      next(err);
    }
  }
}

export const sacramentalProfileController = new SacramentalProfileController();
