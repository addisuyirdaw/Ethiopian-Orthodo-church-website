/**
 * tests/fintech/clearinghouse.test.ts
 *
 * Module 14 — Centralized Tithe, Sacramental & Alms Split-Fee Clearinghouse
 *
 * Test coverage:
 *  1. HMAC-SHA256 signature verification (pass / tampered-payload / missing header)
 *  2. Four-way split precision — parish 70%, diocese 24%, patriarchate 5%, platform 1%
 *  3. Remainder-based platform fee guarantees total == sum of all four shares
 *  4. Concurrent serializable-isolation duplicate-reference rejection (409 Conflict)
 *  5. Invalid body field rejection (400 Bad Request)
 *  6. Happy-path response shape
 */

import crypto from 'crypto';
import request from 'supertest';
import { Decimal } from '@prisma/client/runtime/library';

jest.setTimeout(60000);

// ── Prisma mock ────────────────────────────────────────────────────────────────
// mockTransaction wraps the fn call; for the duplicate-reference test we make
// $transaction itself throw the Prisma P2002 error before the callback runs.
const mockCreate = jest.fn();
const mockTransaction = jest.fn(
  async (
    fn: (tx: { financialClearingLog: { create: typeof mockCreate } }) => Promise<unknown>,
  ) => fn({ financialClearingLog: { create: mockCreate } }),
);

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: { $transaction: mockTransaction },
}));

// ── App import (must come after mock is established) ──────────────────────────
import { createApp } from '../../src/app';

const app = createApp();

// ── Helpers ────────────────────────────────────────────────────────────────────
const WEBHOOK_SECRET = 'development-clearing-secret';
const WEBHOOK_PATH = '/api/v1/fintech/clearing/webhook';

/**
 * Compute the HMAC-SHA256 signature exactly as express.json verify callback
 * sees the bytes: the raw UTF-8 of JSON.stringify(body).
 */
function makeSignature(body: object): string {
  const raw = JSON.stringify(body);
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
}

function validPayload() {
  return {
    reference: `TXN-${Date.now()}`,
    amount: 1000,
    currency: 'ETB',
    tenantId: 'tenant-uuid-123',
    gateway: 'CHAPA',
  };
}

function buildSettlementResult(payload: ReturnType<typeof validPayload> & { amount: number }) {
  const total = new Decimal(payload.amount);
  const parish = total.mul(new Decimal('0.70'));
  const diocese = total.mul(new Decimal('0.24'));
  const patriarchate = total.mul(new Decimal('0.05'));
  const platform = total.sub(parish).sub(diocese).sub(patriarchate);

  return {
    id: 'log-uuid-abc',
    referenceNumber: payload.reference,
    totalAmount: total,
    parishShare: parish,
    dioceseShare: diocese,
    patriarchateShare: patriarchate,
    platformFee: platform,
    status: 'SETTLED',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Module 14 — Split-Fee Clearinghouse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default $transaction wraps the callback normally
    mockTransaction.mockImplementation(
      async (
        fn: (tx: { financialClearingLog: { create: typeof mockCreate } }) => Promise<unknown>,
      ) => fn({ financialClearingLog: { create: mockCreate } }),
    );
  });

  // ── 1. HMAC Signature Verification ──────────────────────────────────────────

  describe('HMAC Signature Security', () => {
    it('accepts a request with a valid HMAC-SHA256 signature', async () => {
      const body = validPayload();
      mockCreate.mockResolvedValueOnce(buildSettlementResult(body));

      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('x-signature', makeSignature(body))
        .send(JSON.stringify(body));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects a tampered payload with 401 Unauthorized', async () => {
      const body = validPayload();
      const validSig = makeSignature(body);

      // Tamper the amount after signing
      const tamperedBody = { ...body, amount: 9999 };

      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('x-signature', validSig)
        .send(JSON.stringify(tamperedBody));

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
      expect(res.body.message).toMatch(/signature verification failed/i);
    });

    it('rejects a request with a missing x-signature header with 401', async () => {
      const body = validPayload();

      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(body));

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
      expect(res.body.message).toMatch(/Missing x-signature/i);
    });

    it('rejects a request with an all-zeros (forged) signature with 401', async () => {
      const body = validPayload();
      const forgedSig = '0'.repeat(64);

      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('x-signature', forgedSig)
        .send(JSON.stringify(body));

      expect(res.status).toBe(401);
    });
  });

  // ── 2. Split Precision ───────────────────────────────────────────────────────

  describe('Four-Way Split Precision', () => {
    it('calculates exact 70/24/5/1 splits for a round amount (1000 ETB)', async () => {
      const body = validPayload(); // amount = 1000
      mockCreate.mockResolvedValueOnce(buildSettlementResult(body));

      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('x-signature', makeSignature(body))
        .send(JSON.stringify(body));

      expect(res.status).toBe(200);
      const { splits } = res.body.data;

      expect(splits.parish).toBe('700.0000');       // 70 %
      expect(splits.diocese).toBe('240.0000');      // 24 %
      expect(splits.patriarchate).toBe('50.0000');  //  5 %
      expect(splits.platform).toBe('10.0000');      //  1 %
    });

    it('verifies that the four shares always sum exactly to the total', async () => {
      // Non-round amount that would expose floating-point errors
      const body = { ...validPayload(), amount: 333.33 };
      mockCreate.mockResolvedValueOnce(buildSettlementResult(body));

      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('x-signature', makeSignature(body))
        .send(JSON.stringify(body));

      expect(res.status).toBe(200);
      const { totalAmount, splits } = res.body.data;

      const total = new Decimal(totalAmount);
      const sharesSum = new Decimal(splits.parish)
        .add(new Decimal(splits.diocese))
        .add(new Decimal(splits.patriarchate))
        .add(new Decimal(splits.platform));

      // Must be exactly equal — Decimal arithmetic, no floating-point drift
      expect(total.equals(sharesSum)).toBe(true);
    });

    it('produces a platform fee that is the exact remainder after the three canonical shares', () => {
      // Pure unit test of Decimal arithmetic — no HTTP needed
      const amount = new Decimal('999.99');
      const parish = amount.mul(new Decimal('0.70'));
      const diocese = amount.mul(new Decimal('0.24'));
      const patriarchate = amount.mul(new Decimal('0.05'));
      const platform = amount.sub(parish).sub(diocese).sub(patriarchate);

      const sum = parish.add(diocese).add(patriarchate).add(platform);
      expect(sum.equals(amount)).toBe(true);
    });
  });

  // ── 3. Duplicate Reference Rejection ────────────────────────────────────────

  describe('Concurrent Duplicate Reference Rejection', () => {
    it('returns 409 Conflict when a duplicate reference is submitted', async () => {
      const body = validPayload();

      // Make $transaction itself throw the Prisma unique-constraint error
      const duplicateError = Object.assign(new Error('Unique constraint failed'), {
        code: 'P2002',
      });
      mockTransaction.mockRejectedValueOnce(duplicateError);

      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('x-signature', makeSignature(body))
        .send(JSON.stringify(body));

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Conflict');
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  // ── 4. Input Validation ──────────────────────────────────────────────────────

  describe('Input Validation', () => {
    const cases = [
      { label: 'missing reference', override: { reference: '' } },
      { label: 'zero amount', override: { amount: 0 } },
      { label: 'negative amount', override: { amount: -500 } },
      { label: 'missing currency', override: { currency: '' } },
      { label: 'missing tenantId', override: { tenantId: '' } },
      { label: 'missing gateway', override: { gateway: '' } },
    ];

    test.each(cases)('returns 400 Bad Request when $label', async ({ override }) => {
      const body = { ...validPayload(), ...override };

      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('x-signature', makeSignature(body))
        .send(JSON.stringify(body));

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Bad Request');
    });
  });

  // ── 5. Happy-path Response Shape ────────────────────────────────────────────

  describe('Response Shape', () => {
    it('returns the expected response structure on a successful settlement', async () => {
      const body = validPayload();
      mockCreate.mockResolvedValueOnce(buildSettlementResult(body));

      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('x-signature', makeSignature(body))
        .send(JSON.stringify(body));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        data: {
          id: 'log-uuid-abc',
          referenceNumber: body.reference,
          status: 'SETTLED',
          splits: {
            parish: expect.stringMatching(/^\d+\.\d{4}$/),
            diocese: expect.stringMatching(/^\d+\.\d{4}$/),
            patriarchate: expect.stringMatching(/^\d+\.\d{4}$/),
            platform: expect.stringMatching(/^\d+\.\d{4}$/),
          },
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      });
    });

    it('serializes totalAmount and all splits as fixed-4 decimal strings', async () => {
      const body = { ...validPayload(), amount: 500 };
      mockCreate.mockResolvedValueOnce(buildSettlementResult(body));

      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('x-signature', makeSignature(body))
        .send(JSON.stringify(body));

      expect(res.body.data.totalAmount).toBe('500.0000');
      expect(res.body.data.splits.parish).toBe('350.0000');
      expect(res.body.data.splits.diocese).toBe('120.0000');
      expect(res.body.data.splits.patriarchate).toBe('25.0000');
      expect(res.body.data.splits.platform).toBe('5.0000');
    });
  });
});
