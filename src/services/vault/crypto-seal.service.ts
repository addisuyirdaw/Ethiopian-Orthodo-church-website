import { createHash, createSign, createVerify, KeyObject, createPrivateKey, createPublicKey, constants } from 'node:crypto';
import prisma from '../../lib/prisma';
import { ConflictError, NotFoundError } from '../../middleware/error-handler.middleware';
import { formatIsoDate, getEthiopicDate, parseIsoDate } from '../../lib/calendar-utils';

// ── Key Loading ─────────────────────────────────────────────────────────────

function loadPrivateKey(): KeyObject {
  const b64 = process.env.SEAL_PRIVATE_KEY_B64;
  if (!b64) {
    throw new Error('SEAL_PRIVATE_KEY_B64 environment variable is not configured.');
  }
  const pem = Buffer.from(b64, 'base64').toString('utf8');
  return createPrivateKey({ key: pem, format: 'pem' });
}

function loadPublicKey(): KeyObject {
  const b64 = process.env.SEAL_PUBLIC_KEY_B64;
  if (!b64) {
    throw new Error('SEAL_PUBLIC_KEY_B64 environment variable is not configured.');
  }
  const pem = Buffer.from(b64, 'base64').toString('utf8');
  return createPublicKey({ key: pem, format: 'pem' });
}

// ── Payload Normalization ────────────────────────────────────────────────────

/**
 * Builds the deterministic, pipe-delimited canonical payload string.
 * Field order is fixed and must never change; altering any field will
 * produce a different hash and invalidate existing signatures.
 *
 * Format:
 *   RecordID|InstitutionName|ChristianName|SacramentType|EventDateISO(YYYY-MM-DD)|EthiopicDateISO
 */
export function buildNormalizedPayload(record: {
  id: string;
  christianName: string;
  type: string;
  eventDateUtc: Date;
  institution: { name: string };
}): string {
  const gregorianIso = record.eventDateUtc.toISOString().slice(0, 10);
  const eventDate = parseIsoDate(gregorianIso);
  const ethiopic = getEthiopicDate(eventDate);
  const ethiopicIso = formatIsoDate(ethiopic.year, ethiopic.month, ethiopic.day);

  return [
    record.id,
    record.institution.name,
    record.christianName,
    record.type,
    gregorianIso,
    ethiopicIso,
  ].join('|');
}

// ── Hash ────────────────────────────────────────────────────────────────────

export function hashPayload(payload: string): string {
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

// ── Sign ────────────────────────────────────────────────────────────────────

function signHash(hexHash: string): string {
  const privateKey = loadPrivateKey();
  const signer = createSign('SHA256');
  // We sign the raw hash bytes (decoded from hex), not the hex string.
  // This is standard practice: hash the message, then sign the digest.
  signer.update(Buffer.from(hexHash, 'hex'));
  signer.end();
  return signer.sign({ key: privateKey, padding: constants.RSA_PKCS1_PSS_PADDING }).toString('hex');
}

// ── Verify ───────────────────────────────────────────────────────────────────

function verifySignatureRaw(hexHash: string, hexSignature: string): boolean {
  try {
    const publicKey = loadPublicKey();
    const verifier = createVerify('SHA256');
    verifier.update(Buffer.from(hexHash, 'hex'));
    verifier.end();
    return verifier.verify(
      { key: publicKey, padding: constants.RSA_PKCS1_PSS_PADDING },
      Buffer.from(hexSignature, 'hex'),
    );
  } catch {
    // Any key/format error means the signature is invalid
    return false;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface SealResult {
  sealId: string;
  recordId: string;
  payloadHash: string;
  signature: string;
  algorithm: string;
  sealedAt: Date;
  canonicalPayload: string;
}

export interface PublicVerificationResult {
  verified: boolean;
  recordId: string;
  christianName: string;
  sacramentType: string;
  institutionName: string;
  eventDateGregorian: string;
  eventDateEthiopic: string;
  payloadHash: string;
  sealedAt: Date;
}

/**
 * Generates an RSA-PSS-SHA256 cryptographic proof seal for a sacramental
 * record, persists the SacramentSeal row, and returns the seal result.
 *
 * Throws ConflictError if the record is already sealed.
 * Throws NotFoundError if the record does not exist.
 */
export async function generateSacramentSeal(
  recordId: string,
  authorizerId: string,
): Promise<SealResult> {
  // 1. Fetch the full record with institution name required for the payload
  const record = await prisma.sacramentalRecord.findFirst({
    where: { id: recordId, deletedAt: null },
    include: {
      institution: { select: { name: true } },
      seal: true,
    },
  });

  if (!record) {
    throw new NotFoundError(`Sacramental record ${recordId} not found.`);
  }

  // 2. Guard: block if already sealed
  if (record.seal) {
    throw new ConflictError(
      `Record ${recordId} is already sealed. Seals are immutable and cannot be replaced.`,
    );
  }

  // 3. Build deterministic payload and compute SHA-256 hash
  const canonicalPayload = buildNormalizedPayload(record);
  const payloadHash = hashPayload(canonicalPayload);

  // 4. Sign the hash digest bytes with the server's RSA private key
  const signature = signHash(payloadHash);

  // 5. Persist the SacramentSeal row atomically
  const seal = await prisma.sacramentSeal.create({
    data: {
      sacramentalRecordId: recordId,
      payloadHash,
      signature,
      algorithm: 'RSA-PSS-SHA256',
      authorizedById: authorizerId,
    },
  });

  return {
    sealId: seal.id,
    recordId,
    payloadHash,
    signature,
    algorithm: seal.algorithm,
    sealedAt: seal.sealedAt,
    canonicalPayload,
  };
}

/**
 * Public (unauthenticated) verification gateway.
 *
 * Re-fetches the record, re-builds the canonical payload, re-hashes it,
 * then verifies the stored RSA-PSS signature using the server's public key.
 * Also cross-checks that the provided hexSignature matches the stored one.
 *
 * Returns a PublicVerificationResult — verified=true only if ALL checks pass.
 */
export async function verifyExternalSeal(
  recordId: string,
  hexSignature: string,
): Promise<PublicVerificationResult> {
  // Fetch record with seal
  const record = await prisma.sacramentalRecord.findFirst({
    where: { id: recordId, deletedAt: null },
    include: {
      institution: { select: { name: true } },
      seal: true,
    },
  });

  if (!record) {
    throw new NotFoundError(`Sacramental record ${recordId} not found.`);
  }

  if (!record.seal) {
    throw new NotFoundError(`No cryptographic seal exists for record ${recordId}.`);
  }

  // Re-derive the canonical payload and hash from live record data
  const canonicalPayload = buildNormalizedPayload(record);
  const recomputedHash = hashPayload(canonicalPayload);

  // Verification must pass ALL three checks:
  // (a) recomputed hash matches stored hash — record was not tampered
  const hashIntact = recomputedHash === record.seal.payloadHash;
  // (b) provided signature matches stored signature — caller has correct proof
  const sigMatches = hexSignature === record.seal.signature;
  // (c) stored signature verifies under server public key — seal is authentic
  const cryptoValid = verifySignatureRaw(record.seal.payloadHash, record.seal.signature);

  const verified = hashIntact && sigMatches && cryptoValid;

  const gregorianIso = record.eventDateUtc.toISOString().slice(0, 10);
  const eventDate = parseIsoDate(gregorianIso);
  const ethiopic = getEthiopicDate(eventDate);
  const ethiopicIso = formatIsoDate(ethiopic.year, ethiopic.month, ethiopic.day);

  return {
    verified,
    recordId,
    christianName: record.christianName,
    sacramentType: record.type,
    institutionName: record.institution.name,
    eventDateGregorian: gregorianIso,
    eventDateEthiopic: ethiopicIso,
    payloadHash: record.seal.payloadHash,
    sealedAt: record.seal.sealedAt,
  };
}
