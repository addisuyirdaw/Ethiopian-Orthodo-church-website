import {
  AlertFastingThreshold,
  CalendarTradition,
  FastingTier,
  LiturgicalColor,
} from '@prisma/client';
import prisma from '../../lib/prisma';
import {
  calculateOrthodoxPascha,
  calculatePaschalOffset,
  formatIsoDate,
  getEthiopicDate,
  getJulianDate,
} from '../../lib/calendar-utils';
import { liturgicalDayRepository } from '../../repositories/liturgical-day.repository';
import { institutionRepository } from '../../repositories/institution.repository';
import { NotFoundError } from '../../middleware/error-handler.middleware';
import { TitleI18n } from '../../types/liturgical';

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface UpcomingFeastDay {
  gregorianDate: string;
  ethiopicDate: string;
  julianDate?: string;
  fastingTier: FastingTier;
  liturgicalColor: LiturgicalColor;
  title: TitleI18n;
}

export interface AlertDigest {
  tenantId: string;
  generatedAt: string;
  lookAheadDays: number;
  fastingThreshold: AlertFastingThreshold;
  upcomingFeastDays: UpcomingFeastDay[];
}

export interface SubscriptionPatch {
  lookAheadDays?: number;
  fastingThreshold?: AlertFastingThreshold;
  isEnabled?: boolean;
}

// ─── Fasting tier ordering (most strict = highest number) ────────────────────

const FASTING_TIER_RANK: Record<FastingTier, number> = {
  [FastingTier.STRICT]:       4,
  [FastingTier.MODERATE]:     3,
  [FastingTier.WINE_OIL]:     2,
  [FastingTier.FISH_ALLOWED]: 1,
  [FastingTier.NONE]:         0,
};

/**
 * Returns the minimum FastingTier rank that must be met (inclusive) for a day
 * to be included in the alert digest given a tenant's configured threshold.
 */
export function alertFastingFilter(threshold: AlertFastingThreshold): number {
  switch (threshold) {
    case AlertFastingThreshold.STRICT_ONLY:
      return FASTING_TIER_RANK[FastingTier.STRICT];
    case AlertFastingThreshold.MODERATE_AND_ABOVE:
      return FASTING_TIER_RANK[FastingTier.MODERATE];
    case AlertFastingThreshold.ANY:
    default:
      // Include every day that has *any* fasting observance (rank ≥ 1).
      // NONE-tier days (rank 0) are ordinary days and are always excluded.
      return 1;
  }
}

// ─── Helper: add N calendar days to a UTC Date ───────────────────────────────

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

function toIsoDateString(date: Date): string {
  return formatIsoDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class AlertEngineService {
  /**
   * Returns every feast / fasting day that falls within the look-ahead window
   * beginning on `fromDate` (inclusive) for the given institution's calendar
   * tradition.  Days with FastingTier.NONE that have no special liturgical day
   * record are silently skipped.
   */
  async getUpcomingFeastDays(
    institutionId: string,
    fromDate: Date,
    lookAheadDays: number,
  ): Promise<UpcomingFeastDay[]> {
    const institution = await institutionRepository.findById(institutionId);
    if (!institution) {
      throw new NotFoundError('Institution not found.');
    }

    const tradition: CalendarTradition = institution.calendarTradition;
    const results: UpcomingFeastDay[] = [];

    for (let offset = 0; offset < lookAheadDays; offset++) {
      const date = addDays(fromDate, offset);
      const year = date.getUTCFullYear();
      const paschaDate = calculateOrthodoxPascha(year);
      const paschalOffset = calculatePaschalOffset(date, paschaDate);

      // Resolve solar markers according to calendar tradition
      let solarMonth: number;
      let solarDay: number;

      if (tradition === CalendarTradition.ETHIOPIAN_TEWAHEDO) {
        const ethDate = getEthiopicDate(date);
        solarMonth = ethDate.month;
        solarDay = ethDate.day;
      } else {
        const julDate = getJulianDate(date);
        solarMonth = julDate.month;
        solarDay = julDate.day;
      }

      const liturgicalDay =
        (await liturgicalDayRepository.findByPaschalOffset(tradition, paschalOffset)) ??
        (await liturgicalDayRepository.findBySolarMarker(tradition, solarMonth, solarDay));

      if (!liturgicalDay) continue;
      // Skip ordinary, non-fasting, non-feast days
      if (liturgicalDay.fastingTier === FastingTier.NONE) continue;

      const ethDate = getEthiopicDate(date);
      const julDate = getJulianDate(date);

      const entry: UpcomingFeastDay = {
        gregorianDate: toIsoDateString(date),
        ethiopicDate: formatIsoDate(ethDate.year, ethDate.month, ethDate.day),
        fastingTier: liturgicalDay.fastingTier,
        liturgicalColor: liturgicalDay.liturgicalColor,
        title: liturgicalDay.titleI18n as TitleI18n,
      };

      if (tradition !== CalendarTradition.ETHIOPIAN_TEWAHEDO) {
        entry.julianDate = formatIsoDate(julDate.year, julDate.month, julDate.day);
      }

      results.push(entry);
    }

    return results;
  }

  /**
   * Retrieves the tenant's existing alert subscription, or upserts a default
   * one (7-day look-ahead, ANY threshold, enabled) if none exists yet.
   */
  async getOrCreateSubscription(tenantId: string) {
    return prisma.liturgicalAlertSubscription.upsert({
      where: { tenantId },
      update: {},
      create: {
        tenantId,
        lookAheadDays: 7,
        fastingThreshold: AlertFastingThreshold.ANY,
        isEnabled: true,
      },
    });
  }

  /**
   * Partially updates the tenant's alert subscription settings.
   * Only the provided fields are changed; the rest remain unchanged.
   */
  async updateSubscription(tenantId: string, patch: SubscriptionPatch) {
    await this.getOrCreateSubscription(tenantId);
    return prisma.liturgicalAlertSubscription.update({
      where: { tenantId },
      data: patch,
    });
  }

  /**
   * Builds the full alert digest payload for a tenant using its persisted
   * subscription settings.  Filters the upcoming feast day list by the
   * tenant's configured fasting threshold before returning.
   */
  async buildAlertDigest(institutionId: string): Promise<AlertDigest> {
    const institution = await institutionRepository.findById(institutionId);
    if (!institution) {
      throw new NotFoundError('Institution not found.');
    }

    const subscription = await this.getOrCreateSubscription(institutionId);

    const allUpcoming = await this.getUpcomingFeastDays(
      institutionId,
      new Date(),
      subscription.lookAheadDays,
    );

    const minRank = alertFastingFilter(subscription.fastingThreshold);
    const filtered = allUpcoming.filter(
      (day) => FASTING_TIER_RANK[day.fastingTier] >= minRank,
    );

    return {
      tenantId: institutionId,
      generatedAt: new Date().toISOString(),
      lookAheadDays: subscription.lookAheadDays,
      fastingThreshold: subscription.fastingThreshold,
      upcomingFeastDays: filtered,
    };
  }
}

export const alertEngineService = new AlertEngineService();
