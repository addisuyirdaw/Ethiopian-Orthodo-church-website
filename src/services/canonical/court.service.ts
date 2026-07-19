import { CanonicalStanding, EcclesiasticalRole, CaseType } from '@prisma/client';
import prisma from '../../lib/prisma';
import {
  ForbiddenError,
  NotFoundError,
} from '../../middleware/error-handler.middleware';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// ── Symmetric Field-Level Encryption ────────────────────────────────────────
// AES-256-GCM: 32-byte key, 12-byte IV, 16-byte auth tag.

function getEncryptionKey(): Buffer {
  const b64 = process.env.FIELD_ENCRYPTION_KEY_B64;
  if (!b64) {
    throw new Error('FIELD_ENCRYPTION_KEY_B64 environment variable is not configured.');
  }
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) {
    throw new Error('FIELD_ENCRYPTION_KEY_B64 must decode to exactly 32 bytes (AES-256).');
  }
  return key;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a colon-delimited string: `iv:authTag:ciphertext` (all hex-encoded).
 */
export function encryptField(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

/**
 * Decrypts a field produced by `encryptField`.
 * Returns the original plaintext string.
 */
export function decryptField(ciphertext: string): string {
  const key = getEncryptionKey();
  const [ivHex, tagHex, dataHex] = ciphertext.split(':');
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error('Malformed ciphertext envelope.');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

// ── Role Constants ────────────────────────────────────────────────────────────

/** Roles authorized to file or manage canonical cases. */
const JUDICIAL_FILING_ROLES: string[] = [
  EcclesiasticalRole.PRIEST,
  'DIOCESAN_ADMIN',
  EcclesiasticalRole.BISHOP,
  EcclesiasticalRole.METROPOLITAN,
  EcclesiasticalRole.ARCHBISHOP,
  EcclesiasticalRole.PATRIARCH,
];

/** Roles authorized to mutate clergy canonical standing. */
const EPISCOPAL_ROLES: string[] = [
  EcclesiasticalRole.BISHOP,
  EcclesiasticalRole.METROPOLITAN,
  EcclesiasticalRole.ARCHBISHOP,
  EcclesiasticalRole.PATRIARCH,
];

// ── Service Class ─────────────────────────────────────────────────────────────

export interface CreateCasePayload {
  caseType: CaseType;
  partiesInvolved: string;
  assignedMediatorUserId?: string;
}

export interface MutateStandingPayload {
  targetUserId: string;
  newStanding: CanonicalStanding;
  reason: string;
}

export class CanonicalCourtService {
  /**
   * Files a new canonical case on behalf of an authorized user.
   *
   * Only PARISH_PRIEST (mapped to `PRIEST`) and `DIOCESAN_ADMIN` (and higher
   * roles that include BISHOP, METROPOLITAN, etc.) may create cases.
   *
   * Sensitive party details are encrypted with AES-256-GCM before persistence.
   */
  async createCanonicalCase(
    userId: string,
    activeTenantId: string,
    payload: CreateCasePayload,
  ) {
    // 1. Fetch the requesting user and verify role.
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundError('Requesting user not found.');
    }

    const role = user.ecclesiasticalRole as string;

    if (!JUDICIAL_FILING_ROLES.includes(role)) {
      throw new ForbiddenError(
        'Canonical jurisdiction violation: Insufficient role to file a canonical case.',
      );
    }

    // 2. Validate that the tenant institution exists.
    const tenant = await prisma.institution.findFirst({
      where: { id: activeTenantId, deletedAt: null },
    });

    if (!tenant) {
      throw new NotFoundError('Active tenant institution not found.');
    }

    // 3. Encrypt sensitive party information before storing.
    const partiesInvolvedEncrypted = encryptField(payload.partiesInvolved);

    // 4. Generate a canonical, sequential case number.
    const caseCount = await prisma.canonicalCase.count({
      where: { tenantId: activeTenantId },
    });
    const caseNumber = `CC-${activeTenantId.slice(0, 8).toUpperCase()}-${String(caseCount + 1).padStart(5, '0')}`;

    // 5. Persist the record.
    const newCase = await prisma.canonicalCase.create({
      data: {
        tenantId: activeTenantId,
        caseNumber,
        caseType: payload.caseType,
        partiesInvolvedEncrypted,
        assignedMediatorUserId: payload.assignedMediatorUserId ?? null,
      },
    });

    // 6. Return safe, non-sensitive output (never leak the encrypted blob).
    return {
      id: newCase.id,
      caseNumber: newCase.caseNumber,
      caseType: newCase.caseType,
      currentStatus: newCase.currentStatus,
      tenantId: newCase.tenantId,
      assignedMediatorUserId: newCase.assignedMediatorUserId,
      createdAt: newCase.createdAt,
    };
  }

  /**
   * Lists all canonical cases for the requesting user's tenant.
   *
   * Only users with structural judicial clearance (any role above LAITY/DEACON)
   * may view the case index. The encrypted party details are NEVER returned.
   */
  async listCasesForTenant(
    userId: string,
    tenantId: string,
    filters?: { caseType?: CaseType; currentStatus?: string },
  ) {
    // 1. Validate the requesting user has judicial clearance.
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundError('Requesting user not found.');
    }

    const role = user.ecclesiasticalRole as string;

    if (!JUDICIAL_FILING_ROLES.includes(role)) {
      throw new ForbiddenError(
        'Canonical jurisdiction violation: Insufficient clearance to access the case index.',
      );
    }

    // 2. Query with optional filters.
    const cases = await prisma.canonicalCase.findMany({
      where: {
        tenantId,
        ...(filters?.caseType ? { caseType: filters.caseType } : {}),
      },
      select: {
        id: true,
        caseNumber: true,
        caseType: true,
        currentStatus: true,
        tenantId: true,
        assignedMediatorUserId: true,
        createdAt: true,
        updatedAt: true,
        // Explicitly EXCLUDE partiesInvolvedEncrypted from this surface.
      },
      orderBy: { createdAt: 'desc' },
    });

    return cases;
  }

  /**
   * Mutates the canonical standing of an ecclesiastical person.
   *
   * Exclusively gated to episcopal roles (BISHOP and above).
   * Executes inside an atomic transaction:
   *   1. Validates the authorizer is a bishop.
   *   2. Upserts the target user's CanonicalStatusLog record.
   *   3. Writes an irreversible entry to the AuditLog table.
   */
  async mutateClergyStanding(
    bishopUserId: string,
    payload: MutateStandingPayload,
  ) {
    return prisma.$transaction(
      async (tx) => {
        // 1. Verify authorizer has an episcopal role.
        const bishop = await tx.user.findFirst({
          where: { id: bishopUserId, deletedAt: null },
        });

        if (!bishop) {
          throw new NotFoundError('Authorizing bishop user not found.');
        }

        const role = bishop.ecclesiasticalRole as string;
        if (!EPISCOPAL_ROLES.includes(role)) {
          throw new ForbiddenError(
            'Canonical jurisdiction violation: Only bishops may mutate clergy standing.',
          );
        }

        // 2. Verify the target clergy user exists.
        const targetUser = await tx.user.findFirst({
          where: { id: payload.targetUserId, deletedAt: null },
        });

        if (!targetUser) {
          throw new NotFoundError('Target clergy user not found.');
        }

        // 3. Upsert the CanonicalStatusLog (unique on targetUserId).
        const statusLog = await tx.canonicalStatusLog.upsert({
          where: { targetUserId: payload.targetUserId },
          create: {
            targetUserId: payload.targetUserId,
            standingType: payload.newStanding,
            canonicalReason: payload.reason,
            authorizedByUserId: bishopUserId,
          },
          update: {
            standingType: payload.newStanding,
            canonicalReason: payload.reason,
            authorizedByUserId: bishopUserId,
          },
        });

        // 4. Write immutable audit trail entry.
        await tx.auditLog.create({
          data: {
            userId: bishopUserId,
            parishId: bishop.institutionId,
            action: 'MUTATE_CLERGY_STANDING',
            tableAffected: 'canonical_status_logs',
            recordId: statusLog.id,
            newState: {
              targetUserId: payload.targetUserId,
              newStanding: payload.newStanding,
              reason: payload.reason,
            },
          } as any,
        });

        return {
          statusLogId: statusLog.id,
          targetUserId: statusLog.targetUserId,
          standingType: statusLog.standingType,
          canonicalReason: statusLog.canonicalReason,
          authorizedByUserId: statusLog.authorizedByUserId,
          updatedAt: statusLog.updatedAt,
        };
      },
      { isolationLevel: 'Serializable' },
    );
  }
}

export const canonicalCourtService = new CanonicalCourtService();
