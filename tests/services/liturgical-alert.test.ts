import {
  AlertFastingThreshold,
  CalendarTradition,
  FastingTier,
  LiturgicalColor,
} from '@prisma/client';
import {
  alertEngineService,
  alertFastingFilter,
  AlertEngineService,
} from '../../src/services/liturgical/alert-engine.service';
import { liturgicalDayRepository } from '../../src/repositories/liturgical-day.repository';
import { institutionRepository } from '../../src/repositories/institution.repository';
import prisma from '../../src/lib/prisma';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    liturgicalAlertSubscription: {
      upsert: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../src/repositories/liturgical-day.repository', () => ({
  liturgicalDayRepository: {
    findByPaschalOffset: jest.fn(),
    findBySolarMarker: jest.fn(),
  },
}));

jest.mock('../../src/repositories/institution.repository', () => ({
  institutionRepository: {
    findById: jest.fn(),
  },
}));

// ─── Typed mock helpers ───────────────────────────────────────────────────────

const mockFindById = institutionRepository.findById as jest.Mock;
const mockFindByPaschalOffset = liturgicalDayRepository.findByPaschalOffset as jest.Mock;
const mockFindBySolarMarker = liturgicalDayRepository.findBySolarMarker as jest.Mock;
const mockUpsert = prisma.liturgicalAlertSubscription.upsert as jest.Mock;
const mockUpdate = prisma.liturgicalAlertSubscription.update as jest.Mock;

// ─── Fixture builders ─────────────────────────────────────────────────────────

const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

function makeInstitution(tradition: CalendarTradition = CalendarTradition.ETHIOPIAN_TEWAHEDO) {
  return {
    id: TENANT_ID,
    calendarTradition: tradition,
    hierarchyPath: `/${TENANT_ID}`,
    deletedAt: null,
  };
}

function makeLiturgicalDay(
  fastingTier: FastingTier,
  liturgicalColor = LiturgicalColor.GOLD,
) {
  return {
    id: 'ld-001',
    calendarTradition: CalendarTradition.ETHIOPIAN_TEWAHEDO,
    paschalOffset: 0,
    solarMonth: null,
    solarDay: null,
    fastingTier,
    liturgicalColor,
    titleI18n: { en: 'Feast of the Holy Trinity', am: 'የቅድስት ሥላሴ ቀን' },
    readingsI18n: { en: { epistle: 'Romans 1:1', gospel: 'John 1:1' } },
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeSubscription(
  overrides: Partial<{
    lookAheadDays: number;
    fastingThreshold: AlertFastingThreshold;
    isEnabled: boolean;
  }> = {},
) {
  return {
    id: 'sub-001',
    tenantId: TENANT_ID,
    lookAheadDays: 7,
    fastingThreshold: AlertFastingThreshold.ANY,
    isEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ─── alertFastingFilter (pure function) ───────────────────────────────────────

describe('alertFastingFilter (pure)', () => {
  it('returns rank 1 for ANY — includes all non-NONE tiers', () => {
    expect(alertFastingFilter(AlertFastingThreshold.ANY)).toBe(1);
  });

  it('returns rank 3 for MODERATE_AND_ABOVE — excludes WINE_OIL and FISH_ALLOWED', () => {
    expect(alertFastingFilter(AlertFastingThreshold.MODERATE_AND_ABOVE)).toBe(3);
  });

  it('returns rank 4 for STRICT_ONLY — only the highest severity', () => {
    expect(alertFastingFilter(AlertFastingThreshold.STRICT_ONLY)).toBe(4);
  });
});

// ─── getOrCreateSubscription ──────────────────────────────────────────────────

describe('AlertEngineService.getOrCreateSubscription', () => {
  beforeEach(() => jest.clearAllMocks());

  it('upserts a default subscription when none exists', async () => {
    const sub = makeSubscription();
    mockUpsert.mockResolvedValue(sub);

    const result = await alertEngineService.getOrCreateSubscription(TENANT_ID);

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { tenantId: TENANT_ID },
      update: {},
      create: {
        tenantId: TENANT_ID,
        lookAheadDays: 7,
        fastingThreshold: AlertFastingThreshold.ANY,
        isEnabled: true,
      },
    });
    expect(result.tenantId).toBe(TENANT_ID);
    expect(result.lookAheadDays).toBe(7);
  });
});

// ─── updateSubscription ───────────────────────────────────────────────────────

describe('AlertEngineService.updateSubscription', () => {
  beforeEach(() => jest.clearAllMocks());

  it('upserts then updates with the provided patch', async () => {
    const sub = makeSubscription();
    const updated = makeSubscription({ lookAheadDays: 14, isEnabled: false });
    mockUpsert.mockResolvedValue(sub);
    mockUpdate.mockResolvedValue(updated);

    const result = await alertEngineService.updateSubscription(TENANT_ID, {
      lookAheadDays: 14,
      isEnabled: false,
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { tenantId: TENANT_ID },
      data: { lookAheadDays: 14, isEnabled: false },
    });
    expect(result.lookAheadDays).toBe(14);
    expect(result.isEnabled).toBe(false);
  });
});

// ─── getUpcomingFeastDays ─────────────────────────────────────────────────────

describe('AlertEngineService.getUpcomingFeastDays', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns feast days found within the look-ahead window', async () => {
    mockFindById.mockResolvedValue(makeInstitution());
    // Day 0 — has a STRICT fast; day 1 — null (no record)
    mockFindByPaschalOffset
      .mockResolvedValueOnce(makeLiturgicalDay(FastingTier.STRICT))
      .mockResolvedValue(null);
    mockFindBySolarMarker.mockResolvedValue(null);

    const fromDate = new Date(Date.UTC(2026, 0, 6)); // Timket period
    const results = await alertEngineService.getUpcomingFeastDays(
      TENANT_ID,
      fromDate,
      3,
    );

    // Only day 0 should appear (days 1 and 2 returned null)
    expect(results).toHaveLength(1);
    expect(results[0].fastingTier).toBe(FastingTier.STRICT);
    expect(results[0].gregorianDate).toBe('2026-01-06');
  });

  it('skips days with FastingTier.NONE', async () => {
    mockFindById.mockResolvedValue(makeInstitution());
    mockFindByPaschalOffset.mockResolvedValue(makeLiturgicalDay(FastingTier.NONE));
    mockFindBySolarMarker.mockResolvedValue(null);

    const results = await alertEngineService.getUpcomingFeastDays(
      TENANT_ID,
      new Date(Date.UTC(2026, 0, 10)),
      1,
    );
    expect(results).toHaveLength(0);
  });

  it('falls back to solar marker lookup when paschal offset returns null', async () => {
    mockFindById.mockResolvedValue(makeInstitution());
    mockFindByPaschalOffset.mockResolvedValue(null);
    mockFindBySolarMarker.mockResolvedValue(makeLiturgicalDay(FastingTier.MODERATE));

    const results = await alertEngineService.getUpcomingFeastDays(
      TENANT_ID,
      new Date(Date.UTC(2026, 3, 1)),
      1,
    );
    expect(results).toHaveLength(1);
    expect(results[0].fastingTier).toBe(FastingTier.MODERATE);
  });

  it('throws NotFoundError when the institution does not exist', async () => {
    mockFindById.mockResolvedValue(null);
    await expect(
      alertEngineService.getUpcomingFeastDays('non-existent-id', new Date(), 7),
    ).rejects.toMatchObject({ name: 'NotFoundError' });
  });

  it('returns an empty array when no feast days exist in the window', async () => {
    mockFindById.mockResolvedValue(makeInstitution());
    mockFindByPaschalOffset.mockResolvedValue(null);
    mockFindBySolarMarker.mockResolvedValue(null);

    const results = await alertEngineService.getUpcomingFeastDays(
      TENANT_ID,
      new Date(Date.UTC(2026, 6, 1)),
      5,
    );
    expect(results).toHaveLength(0);
  });

  it('includes julianDate only for non-ETHIOPIAN_TEWAHEDO traditions', async () => {
    mockFindById.mockResolvedValue(makeInstitution(CalendarTradition.JULIAN_ORTHODOX));
    mockFindByPaschalOffset.mockResolvedValue(makeLiturgicalDay(FastingTier.STRICT));

    const results = await alertEngineService.getUpcomingFeastDays(
      TENANT_ID,
      new Date(Date.UTC(2026, 0, 6)),
      1,
    );
    expect(results[0].julianDate).toBeDefined();
  });
});

// ─── buildAlertDigest ─────────────────────────────────────────────────────────

describe('AlertEngineService.buildAlertDigest', () => {
  let service: AlertEngineService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AlertEngineService();
  });

  it('applies STRICT_ONLY filter — excludes MODERATE and lower tiers', async () => {
    mockFindById.mockResolvedValue(makeInstitution());
    mockUpsert.mockResolvedValue(
      makeSubscription({ fastingThreshold: AlertFastingThreshold.STRICT_ONLY, lookAheadDays: 2 }),
    );

    // Day 0 → STRICT (rank 4 — should PASS); Day 1 → MODERATE (rank 3 — should FAIL)
    mockFindByPaschalOffset
      .mockResolvedValueOnce(makeLiturgicalDay(FastingTier.STRICT))
      .mockResolvedValueOnce(makeLiturgicalDay(FastingTier.MODERATE));

    const digest = await service.buildAlertDigest(TENANT_ID);

    expect(digest.upcomingFeastDays).toHaveLength(1);
    expect(digest.upcomingFeastDays[0].fastingTier).toBe(FastingTier.STRICT);
    expect(digest.fastingThreshold).toBe(AlertFastingThreshold.STRICT_ONLY);
  });

  it('applies MODERATE_AND_ABOVE filter — excludes FISH_ALLOWED and WINE_OIL', async () => {
    mockFindById.mockResolvedValue(makeInstitution());
    mockUpsert.mockResolvedValue(
      makeSubscription({
        fastingThreshold: AlertFastingThreshold.MODERATE_AND_ABOVE,
        lookAheadDays: 3,
      }),
    );

    mockFindByPaschalOffset
      .mockResolvedValueOnce(makeLiturgicalDay(FastingTier.FISH_ALLOWED)) // rank 1 — FAIL
      .mockResolvedValueOnce(makeLiturgicalDay(FastingTier.MODERATE))     // rank 3 — PASS
      .mockResolvedValueOnce(makeLiturgicalDay(FastingTier.STRICT));       // rank 4 — PASS

    const digest = await service.buildAlertDigest(TENANT_ID);

    expect(digest.upcomingFeastDays).toHaveLength(2);
    expect(
      digest.upcomingFeastDays.every(
        (d) => d.fastingTier === FastingTier.MODERATE || d.fastingTier === FastingTier.STRICT,
      ),
    ).toBe(true);
  });

  it('returns an empty digest when no feast days exist in the window', async () => {
    mockFindById.mockResolvedValue(makeInstitution());
    mockUpsert.mockResolvedValue(makeSubscription({ lookAheadDays: 1 }));
    mockFindByPaschalOffset.mockResolvedValue(null);
    mockFindBySolarMarker.mockResolvedValue(null);

    const digest = await service.buildAlertDigest(TENANT_ID);

    expect(digest.upcomingFeastDays).toHaveLength(0);
    expect(digest.tenantId).toBe(TENANT_ID);
    expect(typeof digest.generatedAt).toBe('string');
  });

  it('digest shape contains all required top-level fields', async () => {
    mockFindById.mockResolvedValue(makeInstitution());
    mockUpsert.mockResolvedValue(makeSubscription());
    mockFindByPaschalOffset.mockResolvedValue(null);
    mockFindBySolarMarker.mockResolvedValue(null);

    const digest = await service.buildAlertDigest(TENANT_ID);

    expect(digest).toMatchObject({
      tenantId: TENANT_ID,
      lookAheadDays: 7,
      fastingThreshold: AlertFastingThreshold.ANY,
      upcomingFeastDays: expect.any(Array),
      generatedAt: expect.any(String),
    });
  });
});
