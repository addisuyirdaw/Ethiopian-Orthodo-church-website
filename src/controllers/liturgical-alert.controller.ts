import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { alertEngineService } from '../services/liturgical/alert-engine.service';
import {
  updateSubscriptionSchema,
  institutionIdQuerySchema,
} from '../validators/liturgical-alert.validator';

// ─── GET /liturgical/alerts/subscription ─────────────────────────────────────

/**
 * Returns the requesting tenant's current alert subscription settings.
 * If no subscription exists yet a default record is created transparently.
 */
export const getSubscription = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.resolvedInstitutionId ?? req.user!.institutionId;
  const subscription = await alertEngineService.getOrCreateSubscription(tenantId);
  res.status(200).json({ success: true, data: subscription });
});

// ─── PATCH /liturgical/alerts/subscription ───────────────────────────────────

/**
 * Partially updates the tenant's alert subscription.
 * Accepts any subset of: lookAheadDays, fastingThreshold, isEnabled.
 */
export const patchSubscription = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.resolvedInstitutionId ?? req.user!.institutionId;
    const patch = updateSubscriptionSchema.parse(req.body);
    const updated = await alertEngineService.updateSubscription(tenantId, patch);
    res.status(200).json({ success: true, data: updated });
  },
);

// ─── GET /liturgical/alerts/upcoming ─────────────────────────────────────────

/**
 * Returns the upcoming feast / fasting days for the tenant's calendar tradition
 * within the institution's configured look-ahead window.
 * Accepts optional `institution_id` query param for administrative drill-down.
 */
export const getUpcoming = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { institution_id } = institutionIdQuerySchema.parse(req.query);
  const institutionId =
    institution_id ?? req.resolvedInstitutionId ?? req.user!.institutionId;

  const subscription = await alertEngineService.getOrCreateSubscription(institutionId);
  const feastDays = await alertEngineService.getUpcomingFeastDays(
    institutionId,
    new Date(),
    subscription.lookAheadDays,
  );

  res.status(200).json({
    success: true,
    data: {
      institutionId,
      lookAheadDays: subscription.lookAheadDays,
      count: feastDays.length,
      feastDays,
    },
  });
});

// ─── POST /liturgical/alerts/trigger ─────────────────────────────────────────

/**
 * Builds and returns the full alert digest payload for the tenant.
 * Simulates what would be dispatched to a push notification gateway.
 * Restricted to episcopal-role users.
 */
export const triggerAlertDigest = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const institutionId = req.resolvedInstitutionId ?? req.user!.institutionId;
    const digest = await alertEngineService.buildAlertDigest(institutionId);
    res.status(200).json({ success: true, data: digest });
  },
);
