/**
 * tests/routes/liturgical-alert.test.ts
 *
 * Module 16 — Canonical Feast Day Notification & Liturgical Alert Engine
 *
 * Integration tests covering:
 *  1. GET  /api/v1/liturgical/alerts/subscription  — returns or creates subscription
 *  2. PATCH /api/v1/liturgical/alerts/subscription — validates and persists patch
 *  3. GET  /api/v1/liturgical/alerts/upcoming      — returns feast day feed
 *  4. POST /api/v1/liturgical/alerts/trigger       — episcopal-only digest endpoint
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import {
  AlertFastingThreshold,
  CalendarTradition,
  EcclesiasticalRole,
  FastingTier,
  LiturgicalColor,
} from '@prisma/client';
import { JWT_SECRET } from '../../src/middleware/auth.middleware';
import { JwtPayload } from '../../src/types';

// ── Prisma mock ───────────────────────────────────────────────────────────────
// Must be declared before any module under test imports prisma.

const mockUpsert = jest.fn();
const mockUpdate = jest.fn();
const mockInstFindFirst = jest.fn();

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    liturgicalAlertSubscription: {
      upsert: mockUpsert,
      update: mockUpdate,
    },
    institution: {
      findFirst: mockInstFindFirst,
    },
  },
}));

// ── Repository mocks ──────────────────────────────────────────────────────────

const mockFindByPaschalOffset = jest.fn();
const mockFindBySolarMarker = jest.fn();

jest.mock('../../src/repositories/liturgical-day.repository', () => ({
  liturgicalDayRepository: {
    findByPaschalOffset: mockFindByPaschalOffset,
    findBySolarMarker: mockFindBySolarMarker,
  },
}));

jest.mock('../../src/repositories/institution.repository', () => ({
  institutionRepository: {
    findById: jest.fn().mockImplementation(() =>
      Promise.resolve({
        id: PARISH_ID,
        calendarTradition: CalendarTradition.ETHIOPIAN_TEWAHEDO,
        hierarchyPath: `/${PARISH_ID}`,
        deletedAt: null,
      }),
    ),
  },
}));

// ── App (imported AFTER mocks are hoisted) ────────────────────────────────────

import { createApp } from '../../src/app';

const app = createApp();

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PARISH_ID = '550e8400-e29b-41d4-a716-446655440000';
const ALERT_BASE = '/api/v1/liturgical/alerts';

/** Creates a signed JWT for the given role / institution. */
function makeToken(
  role: EcclesiasticalRole,
  institutionId = PARISH_ID,
): string {
  return jwt.sign(
    {
      sub: `user-${role.toLowerCase()}`,
      institution_id: institutionId,
      hierarchy_path: `/${institutionId}`,
      ecclesiastical_role: role,
    } satisfies JwtPayload,
    JWT_SECRET,
    { expiresIn: '1h' },
  );
}

const priestToken = makeToken(EcclesiasticalRole.PRIEST);
const bishopToken = makeToken(EcclesiasticalRole.BISHOP);

/** Canonical subscription fixture. */
function makeSubscription(overrides = {}) {
  return {
    id: 'sub-001',
    tenantId: PARISH_ID,
    lookAheadDays: 7,
    fastingThreshold: AlertFastingThreshold.ANY,
    isEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/** A minimal liturgical day fixture (STRICT fast, GOLD color). */
function makeFeastDay() {
  return {
    id: 'ld-001',
    calendarTradition: CalendarTradition.ETHIOPIAN_TEWAHEDO,
    paschalOffset: -56,
    solarMonth: null,
    solarDay: null,
    fastingTier: FastingTier.STRICT,
    liturgicalColor: LiturgicalColor.GOLD,
    titleI18n: { en: 'Great Lent', am: 'አብይ ጾም' },
    readingsI18n: { en: { epistle: 'Joel 2:1', gospel: 'Mark 1:15' } },
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// Suite
// ═════════════════════════════════════════════════════════════════════════════

describe('Module 16 — Canonical Feast Day Notification & Liturgical Alert Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: subscription exists and no feast days in window
    mockUpsert.mockResolvedValue(makeSubscription());
    mockUpdate.mockResolvedValue(makeSubscription());
    mockFindByPaschalOffset.mockResolvedValue(null);
    mockFindBySolarMarker.mockResolvedValue(null);
  });

  // ── 0. Auth guard ──────────────────────────────────────────────────────────

  describe('Auth guard', () => {
    it('returns 401 when Authorization header is absent', async () => {
      const res = await request(app).get(`${ALERT_BASE}/subscription`);
      expect(res.status).toBe(401);
    });

    it('returns 401 when token is malformed', async () => {
      const res = await request(app)
        .get(`${ALERT_BASE}/subscription`)
        .set('Authorization', 'Bearer bad.token.here');
      expect(res.status).toBe(401);
    });
  });

  // ── 1. GET /subscription ───────────────────────────────────────────────────

  describe('GET /alerts/subscription', () => {
    it('returns 200 with the current subscription settings', async () => {
      const sub = makeSubscription({ lookAheadDays: 14 });
      mockUpsert.mockResolvedValue(sub);

      const res = await request(app)
        .get(`${ALERT_BASE}/subscription`)
        .set('Authorization', `Bearer ${priestToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tenantId).toBe(PARISH_ID);
      expect(res.body.data.lookAheadDays).toBe(14);
    });

    it('upserts a default subscription if none exists (idempotent)', async () => {
      const res = await request(app)
        .get(`${ALERT_BASE}/subscription`)
        .set('Authorization', `Bearer ${priestToken}`);

      expect(res.status).toBe(200);
      expect(mockUpsert).toHaveBeenCalledTimes(1);
    });
  });

  // ── 2. PATCH /subscription ─────────────────────────────────────────────────

  describe('PATCH /alerts/subscription', () => {
    it('returns 200 and persists a valid patch', async () => {
      const updated = makeSubscription({
        lookAheadDays: 21,
        fastingThreshold: AlertFastingThreshold.STRICT_ONLY,
      });
      mockUpdate.mockResolvedValue(updated);

      const res = await request(app)
        .patch(`${ALERT_BASE}/subscription`)
        .set('Authorization', `Bearer ${priestToken}`)
        .send({ lookAheadDays: 21, fastingThreshold: 'STRICT_ONLY' });

      expect(res.status).toBe(200);
      expect(res.body.data.lookAheadDays).toBe(21);
      expect(res.body.data.fastingThreshold).toBe(AlertFastingThreshold.STRICT_ONLY);
    });

    it('returns 400 when lookAheadDays is out of range (> 30)', async () => {
      const res = await request(app)
        .patch(`${ALERT_BASE}/subscription`)
        .set('Authorization', `Bearer ${priestToken}`)
        .send({ lookAheadDays: 99 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationError');
    });

    it('returns 400 when lookAheadDays is below minimum (0)', async () => {
      const res = await request(app)
        .patch(`${ALERT_BASE}/subscription`)
        .set('Authorization', `Bearer ${priestToken}`)
        .send({ lookAheadDays: 0 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when fastingThreshold is an unknown value', async () => {
      const res = await request(app)
        .patch(`${ALERT_BASE}/subscription`)
        .set('Authorization', `Bearer ${priestToken}`)
        .send({ fastingThreshold: 'INVALID_TIER' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when body is empty (no fields provided)', async () => {
      const res = await request(app)
        .patch(`${ALERT_BASE}/subscription`)
        .set('Authorization', `Bearer ${priestToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 400 when an unknown field is sent (strict schema)', async () => {
      const res = await request(app)
        .patch(`${ALERT_BASE}/subscription`)
        .set('Authorization', `Bearer ${priestToken}`)
        .send({ unknownField: true, lookAheadDays: 7 });

      expect(res.status).toBe(400);
    });

    it('returns 200 when only isEnabled is patched', async () => {
      const updated = makeSubscription({ isEnabled: false });
      mockUpdate.mockResolvedValue(updated);

      const res = await request(app)
        .patch(`${ALERT_BASE}/subscription`)
        .set('Authorization', `Bearer ${priestToken}`)
        .send({ isEnabled: false });

      expect(res.status).toBe(200);
      expect(res.body.data.isEnabled).toBe(false);
    });
  });

  // ── 3. GET /upcoming ───────────────────────────────────────────────────────

  describe('GET /alerts/upcoming', () => {
    it('returns 200 with an empty feastDays array when no feast days exist', async () => {
      const res = await request(app)
        .get(`${ALERT_BASE}/upcoming`)
        .set('Authorization', `Bearer ${priestToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.feastDays)).toBe(true);
      expect(res.body.data.feastDays).toHaveLength(0);
    });

    it('returns 200 with feast days when liturgical records exist in the window', async () => {
      // Return a feast day on the first date in the window, null for the rest
      mockFindByPaschalOffset
        .mockResolvedValueOnce(makeFeastDay())
        .mockResolvedValue(null);

      const res = await request(app)
        .get(`${ALERT_BASE}/upcoming`)
        .set('Authorization', `Bearer ${priestToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.feastDays.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.feastDays[0].fastingTier).toBe(FastingTier.STRICT);
    });

    it('returns 200 with correct shape on the upcoming response', async () => {
      const res = await request(app)
        .get(`${ALERT_BASE}/upcoming`)
        .set('Authorization', `Bearer ${priestToken}`);

      expect(res.body.data).toMatchObject({
        institutionId: PARISH_ID,
        lookAheadDays: 7,
        count: expect.any(Number),
        feastDays: expect.any(Array),
      });
    });
  });

  // ── 4. POST /trigger ───────────────────────────────────────────────────────

  describe('POST /alerts/trigger', () => {
    it('returns 403 Forbidden when caller has PRIEST role', async () => {
      const res = await request(app)
        .post(`${ALERT_BASE}/trigger`)
        .set('Authorization', `Bearer ${priestToken}`)
        .send();

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('returns 403 Forbidden when caller has DEACON role', async () => {
      const deaconToken = makeToken(EcclesiasticalRole.DEACON);
      const res = await request(app)
        .post(`${ALERT_BASE}/trigger`)
        .set('Authorization', `Bearer ${deaconToken}`)
        .send();

      expect(res.status).toBe(403);
    });

    it('returns 200 with digest payload for BISHOP role', async () => {
      const res = await request(app)
        .post(`${ALERT_BASE}/trigger`)
        .set('Authorization', `Bearer ${bishopToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        tenantId: PARISH_ID,
        lookAheadDays: 7,
        fastingThreshold: AlertFastingThreshold.ANY,
        upcomingFeastDays: expect.any(Array),
        generatedAt: expect.any(String),
      });
    });

    it('returns 200 with a feast day in the digest when one exists', async () => {
      mockFindByPaschalOffset
        .mockResolvedValueOnce(makeFeastDay())
        .mockResolvedValue(null);

      const res = await request(app)
        .post(`${ALERT_BASE}/trigger`)
        .set('Authorization', `Bearer ${bishopToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.data.upcomingFeastDays.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.upcomingFeastDays[0]).toMatchObject({
        gregorianDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        ethiopicDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        fastingTier: FastingTier.STRICT,
        liturgicalColor: LiturgicalColor.GOLD,
      });
    });

    it('returns 200 with METROPOLITAN role (also episcopal)', async () => {
      const metropolitanToken = makeToken(EcclesiasticalRole.METROPOLITAN);
      const res = await request(app)
        .post(`${ALERT_BASE}/trigger`)
        .set('Authorization', `Bearer ${metropolitanToken}`)
        .send();

      expect(res.status).toBe(200);
    });

    it('digest generatedAt is a valid ISO 8601 timestamp string', async () => {
      const res = await request(app)
        .post(`${ALERT_BASE}/trigger`)
        .set('Authorization', `Bearer ${bishopToken}`)
        .send();

      const ts = res.body.data.generatedAt;
      expect(new Date(ts).toISOString()).toBe(ts);
    });
  });
});
