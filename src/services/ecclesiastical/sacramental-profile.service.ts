import crypto from 'crypto';
import { CanonicalProfileStatus, Prisma } from '@prisma/client';
import prisma from '../../lib/prisma';

// ── Canonical Error ────────────────────────────────────────────────────────────

/**
 * Thrown when a marriage registration is attempted but one or both parties
 * are canonically ineligible (already MARRIED or MONASTIC).
 *
 * Maps to HTTP 400 via the global error handler (AppError subclass pattern).
 */
export class CanonicalError extends Error {
  public readonly statusCode = 400;
  public readonly code = 'CanonicalError';

  constructor(message = 'Canonical barrier detected: Individual is not free to marry within the Church canons.') {
    super(message);
    this.name = 'CanonicalError';
  }
}

// ── Eligible statuses for marriage ────────────────────────────────────────────

const MARRIAGE_ELIGIBLE_STATUSES: CanonicalProfileStatus[] = [
  CanonicalProfileStatus.SINGLE,
  CanonicalProfileStatus.WIDOWED,
];

// ── ID Generation ─────────────────────────────────────────────────────────────

/**
 * Generates a deterministic, collision-resistant canonical registration ID.
 *
 * Format: `OC-REG-<YEAR>-<HEX8>`
 * Example: `OC-REG-2025-A3F7C12B`
 *
 * The 8-character hex suffix is derived from 4 cryptographically random bytes,
 * giving 4,294,967,296 possible values per calendar year before collision risk.
 */
function generateSacramentalId(): string {
  const year = new Date().getFullYear();
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `OC-REG-${year}-${randomHex}`;
}

// ── Input types ───────────────────────────────────────────────────────────────

export interface RegisterBaptismInput {
  firstName: string;
  lastName: string;
  firstNameAm?: string;
  lastNameAm?: string;
  firstNameGez?: string;
  lastNameGez?: string;
  christianName: string;
  baptismDate: string; // ISO 8601
  baptizingPriestId: string;
  parishId: string;
}

export interface RegisterMarriageInput {
  marriageDate: string; // ISO 8601
  officiatingPriestId: string;
  parishId: string;
  witnessNames: string[];
}

// ── Service ───────────────────────────────────────────────────────────────────

class SacramentalProfileService {
  /**
   * Registers a new baptism profile.
   *
   * Generates a unique `sacramentalId` (OC-REG-YEAR-HEX8) and persists
   * the profile with a default `canonicalStatus` of SINGLE.
   *
   * @param data  Validated baptism registration payload.
   * @returns     The newly created SacramentalProfile record.
   */
  async registerBaptism(data: RegisterBaptismInput) {
    const sacramentalId = generateSacramentalId();

    return prisma.sacramentalProfile.create({
      data: {
        sacramentalId,
        firstName: data.firstName,
        lastName: data.lastName,
        firstNameAm: data.firstNameAm ?? null,
        lastNameAm: data.lastNameAm ?? null,
        firstNameGez: data.firstNameGez ?? null,
        lastNameGez: data.lastNameGez ?? null,
        christianName: data.christianName,
        baptismDate: new Date(data.baptismDate),
        baptizingPriestId: data.baptizingPriestId,
        parishId: data.parishId,
        canonicalStatus: CanonicalProfileStatus.SINGLE,
      },
    });
  }

  /**
   * Verifies canonical eligibility and atomically registers a marriage.
   *
   * Lookup is done by `sacramentalId` (the cross-parish canonical token),
   * not by internal UUID, so the caller does not need direct DB access to
   * either party's home parish.
   *
   * Guard logic (both must pass):
   *   - Both profiles must exist; 404 if either is missing.
   *   - Both profiles must have `canonicalStatus` of SINGLE or WIDOWED.
   *     → MARRIED or MONASTIC triggers a `CanonicalError` (→ HTTP 400).
   *   - CLERGY is also ineligible (canonical vow of celibacy).
   *
   * Atomic write (Serializable isolation):
   *   1. Create the `MarriageRegistry` record.
   *   2. Update husband's `canonicalStatus` to MARRIED.
   *   3. Update wife's `canonicalStatus` to MARRIED.
   *
   * @param husbandIdStr  `sacramentalId` of the groom profile.
   * @param wifeIdStr     `sacramentalId` of the bride profile.
   * @param metadata      Marriage ceremony details.
   * @returns             The created MarriageRegistry with both profiles included.
   */
  async verifyAndRegisterMarriage(
    husbandIdStr: string,
    wifeIdStr: string,
    metadata: RegisterMarriageInput,
  ) {
    // ── 1. Fetch both profiles by canonical token ──────────────────────────────
    const [husband, wife] = await Promise.all([
      prisma.sacramentalProfile.findUnique({ where: { sacramentalId: husbandIdStr } }),
      prisma.sacramentalProfile.findUnique({ where: { sacramentalId: wifeIdStr } }),
    ]);

    if (!husband) {
      const err = new Error(`Sacramental profile not found: ${husbandIdStr}`);
      err.name = 'NotFoundError';
      throw err;
    }
    if (!wife) {
      const err = new Error(`Sacramental profile not found: ${wifeIdStr}`);
      err.name = 'NotFoundError';
      throw err;
    }

    // ── 2. Canonical eligibility guard ─────────────────────────────────────────
    if (!MARRIAGE_ELIGIBLE_STATUSES.includes(husband.canonicalStatus)) {
      throw new CanonicalError(
        `Canonical barrier detected: Individual is not free to marry within the Church canons. ` +
        `Husband profile ${husbandIdStr} has status: ${husband.canonicalStatus}.`,
      );
    }
    if (!MARRIAGE_ELIGIBLE_STATUSES.includes(wife.canonicalStatus)) {
      throw new CanonicalError(
        `Canonical barrier detected: Individual is not free to marry within the Church canons. ` +
        `Wife profile ${wifeIdStr} has status: ${wife.canonicalStatus}.`,
      );
    }

    // ── 3. Atomic marriage write ───────────────────────────────────────────────
    return prisma.$transaction(
      async (tx) => {
        const registry = await tx.marriageRegistry.create({
          data: {
            husbandProfileId: husband.id,
            wifeProfileId: wife.id,
            marriageDate: new Date(metadata.marriageDate),
            officiatingPriestId: metadata.officiatingPriestId,
            parishId: metadata.parishId,
            witnessNames: metadata.witnessNames,
          },
          include: {
            husbandProfile: true,
            wifeProfile: true,
          },
        });

        await tx.sacramentalProfile.update({
          where: { id: husband.id },
          data: { canonicalStatus: CanonicalProfileStatus.MARRIED },
        });

        await tx.sacramentalProfile.update({
          where: { id: wife.id },
          data: { canonicalStatus: CanonicalProfileStatus.MARRIED },
        });

        return registry;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}

export const sacramentalService = new SacramentalProfileService();
