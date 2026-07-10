/**
 * Tests for src/services/vault/crypto-seal.service.ts
 *
 * All crypto operations are tested against a freshly generated test key pair
 * so tests are hermetic and do not depend on the .env keys. The Prisma client
 * is fully mocked to isolate business logic.
 */
import {
  generateKeyPairSync,
  createSign,
  createHash,
  KeyObject,
  createPrivateKey,
  createPublicKey,
  constants,
} from 'node:crypto';
import {
  buildNormalizedPayload,
  hashPayload,
  generateSacramentSeal,
  verifyExternalSeal,
  SealResult,
} from '../../src/services/vault/crypto-seal.service';

// ── Generate an ephemeral test key pair ────────────────────────────────────
const { privateKey: TEST_PRIV_KEY, publicKey: TEST_PUB_KEY } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// Inject the test keys into process.env before any import resolves
process.env.SEAL_PRIVATE_KEY_B64 = Buffer.from(TEST_PRIV_KEY as string).toString('base64');
process.env.SEAL_PUBLIC_KEY_B64 = Buffer.from(TEST_PUB_KEY as string).toString('base64');

// ── Mock Prisma ─────────────────────────────────────────────────────────────
const mockFindFirst = jest.fn();
const mockFindUnique = jest.fn();
const mockCreate = jest.fn();

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    sacramentalRecord: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    sacramentSeal: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────
const RECORD_ID = 'aaaaaaaa-0000-4000-8000-000000000001';
const INSTITUTION_NAME = 'Holy Trinity Cathedral (Addis Ababa)';
const CHRISTIAN_NAME = 'Yohannes Tesfaye';
const EVENT_DATE = new Date('2026-07-09T10:00:00.000Z');

const baseRecord = {
  id: RECORD_ID,
  institution: { name: INSTITUTION_NAME },
  christianName: CHRISTIAN_NAME,
  type: 'BAPTISM',
  eventDateUtc: EVENT_DATE,
  deletedAt: null,
  seal: null,
};

const AUTHORIZER_ID = 'bbbbbbbb-0000-4000-8000-000000000002';

// Pre-compute what the correct payload and hash look like for assertions
const EXPECTED_PAYLOAD = buildNormalizedPayload(baseRecord);
const EXPECTED_HASH = hashPayload(EXPECTED_PAYLOAD);

// ── Helper: produce a valid RSA-PSS signature over a hash using test keys ───
function signWithTestKey(hexHash: string): string {
  const privKey = createPrivateKey({ key: TEST_PRIV_KEY as string, format: 'pem' });
  const signer = createSign('SHA256');
  signer.update(Buffer.from(hexHash, 'hex'));
  signer.end();
  return signer.sign({ key: privKey, padding: constants.RSA_PKCS1_PSS_PADDING }).toString('hex');
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('crypto-seal.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe('buildNormalizedPayload', () => {
    it('produces a deterministic pipe-delimited string with 6 fields', () => {
      const payload = buildNormalizedPayload(baseRecord);
      const parts = payload.split('|');
      expect(parts).toHaveLength(6);
      expect(parts[0]).toBe(RECORD_ID);
      expect(parts[1]).toBe(INSTITUTION_NAME);
      expect(parts[2]).toBe(CHRISTIAN_NAME);
      expect(parts[3]).toBe('BAPTISM');
      expect(parts[4]).toBe('2026-07-09'); // Gregorian
      expect(parts[5]).toMatch(/^\d{4}-\d{2}-\d{2}$/); // Ethiopic ISO
    });

    it('produces a different payload when any field changes', () => {
      const tampered = buildNormalizedPayload({
        ...baseRecord,
        christianName: 'Tampered Name',
      });
      expect(tampered).not.toBe(EXPECTED_PAYLOAD);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe('hashPayload', () => {
    it('produces a 64-character lowercase hex SHA-256 digest', () => {
      const hash = hashPayload('hello|world');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('is deterministic — same input produces same hash', () => {
      expect(hashPayload(EXPECTED_PAYLOAD)).toBe(hashPayload(EXPECTED_PAYLOAD));
    });

    it('is sensitive — tampered payload produces different hash', () => {
      const tamperedPayload = EXPECTED_PAYLOAD.replace(CHRISTIAN_NAME, 'Fake Name');
      expect(hashPayload(tamperedPayload)).not.toBe(EXPECTED_HASH);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe('generateSacramentSeal', () => {
    it('creates a seal row and returns a valid RSA-PSS signature', async () => {
      mockFindFirst.mockResolvedValue(baseRecord);
      mockCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'seal-uuid-001',
        ...data,
        sealedAt: new Date('2026-07-10T00:00:00.000Z'),
      }));

      const result: SealResult = await generateSacramentSeal(RECORD_ID, AUTHORIZER_ID);

      expect(result.recordId).toBe(RECORD_ID);
      expect(result.payloadHash).toBe(EXPECTED_HASH);
      expect(result.algorithm).toBe('RSA-PSS-SHA256');

      // Verify the signature using the test public key
      const { createVerify } = await import('node:crypto');
      const pubKey = createPublicKey({ key: TEST_PUB_KEY as string, format: 'pem' });
      const verifier = createVerify('SHA256');
      verifier.update(Buffer.from(result.payloadHash, 'hex'));
      verifier.end();
      const valid = verifier.verify({ key: pubKey, padding: constants.RSA_PKCS1_PSS_PADDING }, Buffer.from(result.signature, 'hex'));
      expect(valid).toBe(true);
    });

    it('throws ConflictError when record is already sealed', async () => {
      mockFindFirst.mockResolvedValue({
        ...baseRecord,
        seal: { id: 'existing-seal-id' },
      });

      await expect(generateSacramentSeal(RECORD_ID, AUTHORIZER_ID)).rejects.toMatchObject({
        name: 'ConflictError',
        statusCode: 409,
      });
    });

    it('throws NotFoundError when record does not exist', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(generateSacramentSeal(RECORD_ID, AUTHORIZER_ID)).rejects.toMatchObject({
        name: 'NotFoundError',
        statusCode: 404,
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe('verifyExternalSeal — tamper resistance', () => {
    async function makeVerifyMocks(overrides: Partial<typeof baseRecord> = {}) {
      const record = { ...baseRecord, ...overrides };
      const payload = buildNormalizedPayload(record);
      const hash = hashPayload(payload);
      const signature = signWithTestKey(hash);
      const sealRow = { payloadHash: hash, signature, sealedAt: new Date() };
      return { record, hash, signature, sealRow };
    }

    it('returns verified=true for an authentic record + correct signature', async () => {
      const { record, signature, sealRow } = await makeVerifyMocks();
      mockFindFirst.mockResolvedValue({ ...record, seal: sealRow });

      const result = await verifyExternalSeal(RECORD_ID, signature);

      expect(result.verified).toBe(true);
      expect(result.christianName).toBe(CHRISTIAN_NAME);
      expect(result.sacramentType).toBe('BAPTISM');
    });

    it('returns verified=false when the signature string is wrong (tampered proof)', async () => {
      const { record, sealRow } = await makeVerifyMocks();
      mockFindFirst.mockResolvedValue({ ...record, seal: sealRow });

      // Provide a completely wrong signature
      const wrongSignature = 'deadbeef'.repeat(64);
      const result = await verifyExternalSeal(RECORD_ID, wrongSignature);

      expect(result.verified).toBe(false);
    });

    it('returns verified=false when stored payloadHash does not match recomputed hash (tampered DB record)', async () => {
      const { record, signature } = await makeVerifyMocks();
      // Simulate a tampered DB record: the christianName in the live record
      // differs from what was hashed when the seal was created
      const tamperedRecord = { ...record, christianName: 'Tampered Name' };
      // The seal still has the original (correct) hash
      const originalPayload = buildNormalizedPayload(record);
      const originalHash = hashPayload(originalPayload);
      const sealRow = { payloadHash: originalHash, signature, sealedAt: new Date() };
      mockFindFirst.mockResolvedValue({ ...tamperedRecord, seal: sealRow });

      const result = await verifyExternalSeal(RECORD_ID, signature);

      // hash mismatch: recomputed hash of tampered record ≠ stored hash
      expect(result.verified).toBe(false);
    });

    it('returns verified=false when stored signature has been tampered in the DB', async () => {
      const { record, sealRow } = await makeVerifyMocks();
      const tamperedSeal = { ...sealRow, signature: 'cafebabe'.repeat(64) };
      mockFindFirst.mockResolvedValue({ ...record, seal: tamperedSeal });

      const result = await verifyExternalSeal(RECORD_ID, tamperedSeal.signature);

      // crypto.verify will reject a corrupted RSA signature
      expect(result.verified).toBe(false);
    });

    it('throws NotFoundError when record has no seal', async () => {
      mockFindFirst.mockResolvedValue({ ...baseRecord, seal: null });

      await expect(verifyExternalSeal(RECORD_ID, 'aabbccdd')).rejects.toMatchObject({
        name: 'NotFoundError',
        statusCode: 404,
      });
    });

    it('throws NotFoundError when record does not exist', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(verifyExternalSeal(RECORD_ID, 'aabbccdd')).rejects.toMatchObject({
        name: 'NotFoundError',
        statusCode: 404,
      });
    });
  });
});
