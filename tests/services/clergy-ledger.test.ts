import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { CanonicalStatus, OrdinationRank } from '@prisma/client';
import prisma from '../../src/lib/prisma';
import { ClergyLedgerService } from '../../src/services/clergy/clergy-ledger.service';
import { CanonicalStatusException } from '../../src/middleware/error-handler.middleware';

jest.setTimeout(60000);

const mockUsers = new Map<string, any>();
const mockProfiles = new Map<string, any>();

jest.mock('../../src/lib/prisma', () => {
  const mockUsers = new Map<string, any>();
  const mockProfiles = new Map<string, any>();
  return {
    __esModule: true,
    default: {
      user: {
        upsert: jest.fn().mockImplementation(async ({ where, create }) => {
          const user = { id: where.id, ...create };
          mockUsers.set(where.id, user);
          return user;
        }),
        deleteMany: jest.fn().mockImplementation(async () => {
          mockUsers.clear();
          return { count: 0 };
        }),
      },
      clergyProfile: {
        deleteMany: jest.fn().mockImplementation(async () => {
          mockProfiles.clear();
          return { count: 0 };
        }),
        createMany: jest.fn().mockImplementation(async ({ data }) => {
          for (const item of data) {
            const id = 'profile-id-' + Math.random().toString(36).substring(2, 9);
            mockProfiles.set(id, { id, ...item });
          }
          return { count: data.length };
        }),
        findFirst: jest.fn().mockImplementation(async ({ where }) => {
          if (where && where.OR) {
            const conditions = where.OR;
            const idCond = conditions.find((c: any) => c.id !== undefined)?.id;
            const userIdCond = conditions.find((c: any) => c.userId !== undefined)?.userId;
            
            for (const profile of mockProfiles.values()) {
              if ((idCond && profile.id === idCond) || (userIdCond && profile.userId === userIdCond)) {
                return profile;
              }
            }
          }
          if (where && where.userId) {
            const userId = where.userId;
            for (const profile of mockProfiles.values()) {
              if (profile.userId === userId || (typeof userId === 'object' && userId.in && userId.in.includes(profile.userId))) {
                return profile;
              }
            }
          }
          return null;
        }),
      },
      institution: {
        findFirst: jest.fn().mockResolvedValue({ id: 'parish-id-123', type: 'PARISH' }),
      },
      $disconnect: jest.fn(),
    },
  };
});

// ─────────────────────────────────────────────────────────────────────────────
//  Integration test: Clergy Ledger Service — verifyClergySacramentalAuthority
//
//  Creates isolated ClergyProfile rows for each status under a synthetic user
//  UUID, runs the validation, and confirms the correct Amharic exception is
//  thrown for every non-active canonical status.
// ─────────────────────────────────────────────────────────────────────────────

const TEST_USER_IDS = {
  active:    'aaaaaaaa-aaaa-aaaa-aaaa-000000000001',
  suspended: 'aaaaaaaa-aaaa-aaaa-aaaa-000000000002',
  retired:   'aaaaaaaa-aaaa-aaaa-aaaa-000000000003',
  laicized:  'aaaaaaaa-aaaa-aaaa-aaaa-000000000004',
  missing:   'aaaaaaaa-aaaa-aaaa-aaaa-000000000099',
};

let service: ClergyLedgerService;

beforeAll(async () => {
  service = new ClergyLedgerService();

  // Ensure test users exist (upsert pattern)
  for (const [key, userId] of Object.entries(TEST_USER_IDS)) {
    if (key === 'missing') continue;
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `test.clergy.${key}@orthodoxconnect.org`,
        passwordHash: 'test-hash',
        fullName: 'Test Clergy',
        ecclesiasticalRole: 'PRIEST',
        institutionId: (await prisma.institution.findFirst({ where: { type: 'PARISH' } }))?.id
          ?? (() => { throw new Error('No PARISH institution found in seed data'); })(),
      },
    });
  }

  // Delete any previously seeded test profiles
  await prisma.clergyProfile.deleteMany({
    where: { userId: { in: Object.values(TEST_USER_IDS).filter(id => id !== TEST_USER_IDS.missing) } },
  });

  const ordinationDate = new Date('2010-01-01');

  // Seed one ClergyProfile per status
  await prisma.clergyProfile.createMany({
    data: [
      { userId: TEST_USER_IDS.active,    ordinationRank: OrdinationRank.PRIEST,  canonicalStatus: CanonicalStatus.ACTIVE_GOOD_STANDING, ordinationDate },
      { userId: TEST_USER_IDS.suspended, ordinationRank: OrdinationRank.PRIEST,  canonicalStatus: CanonicalStatus.SUSPENDED,             ordinationDate },
      { userId: TEST_USER_IDS.retired,   ordinationRank: OrdinationRank.PRIEST,  canonicalStatus: CanonicalStatus.RETIRED,               ordinationDate },
      { userId: TEST_USER_IDS.laicized,  ordinationRank: OrdinationRank.DEACON,  canonicalStatus: CanonicalStatus.LAICIZED,              ordinationDate },
    ],
  });
});

afterAll(async () => {
  await prisma.clergyProfile.deleteMany({
    where: { userId: { in: Object.values(TEST_USER_IDS).filter(id => id !== TEST_USER_IDS.missing) } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: Object.values(TEST_USER_IDS).filter(id => id !== TEST_USER_IDS.missing) } },
  });
  await prisma.$disconnect();
});

// ─────────────────────────────────────────────────────────────────────────────
//  Test: Active Good Standing — should resolve without exception
// ─────────────────────────────────────────────────────────────────────────────
describe('ClergyLedgerService.verifyClergySacramentalAuthority', () => {
  it('returns true for a clergy member in ACTIVE_GOOD_STANDING', async () => {
    const result = await service.verifyClergySacramentalAuthority(TEST_USER_IDS.active);
    expect(result).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  //  Test: Missing Profile — Amharic "not found" error
  // ───────────────────────────────────────────────────────────────────────────
  it('throws CanonicalStatusException with Amharic "not found" message for unknown ID', async () => {
    await expect(
      service.verifyClergySacramentalAuthority(TEST_USER_IDS.missing),
    ).rejects.toMatchObject({
      name: 'CanonicalStatusException',
      statusCode: 422,
      message: 'ይህ የክህነት መታወቂያ በስርዓቱ ውስጥ አልተገኘም፤ እባክዎ እንደገና ያረጋግጡ።',
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  //  Test: SUSPENDED — Amharic canonical prohibition error
  // ───────────────────────────────────────────────────────────────────────────
  it('throws CanonicalStatusException with Amharic SUSPENDED message', async () => {
    await expect(
      service.verifyClergySacramentalAuthority(TEST_USER_IDS.suspended),
    ).rejects.toMatchObject({
      name: 'CanonicalStatusException',
      statusCode: 422,
      message: 'ቀኖናዊ ክልከላ፡ ይህ አገልጋይ ዕገዳ ያለበት በመሆኑ ምስጢራትን የመፈጸም መንፈሳዊ ሥልጣን የለውም።',
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  //  Test: RETIRED — Amharic retirement authority error
  // ───────────────────────────────────────────────────────────────────────────
  it('throws CanonicalStatusException with Amharic RETIRED message', async () => {
    await expect(
      service.verifyClergySacramentalAuthority(TEST_USER_IDS.retired),
    ).rejects.toMatchObject({
      name: 'CanonicalStatusException',
      statusCode: 422,
      message: 'ይህ አገልጋይ በዕድሜ ወይም በጤና ምክንያት የአገልግሎት ጡረታ የወጣ በመሆኑ ምስጢራትን የመፈጸም ሥልጣኑ ንቁ አይደለም።',
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  //  Test: LAICIZED — Amharic laicization authority error
  // ───────────────────────────────────────────────────────────────────────────
  it('throws CanonicalStatusException with Amharic LAICIZED message', async () => {
    await expect(
      service.verifyClergySacramentalAuthority(TEST_USER_IDS.laicized),
    ).rejects.toMatchObject({
      name: 'CanonicalStatusException',
      statusCode: 422,
      message: 'ቀኖናዊ እገዳ፡ ይህ አገልጋይ ከክህነት ማዕረጉ የወረደ (የተሻረ) በመሆኑ ምስጢራትን የመፈጸም መንፈሳዊ ሥልጣን የለውም።',
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  //  Test: Lookup by ClergyProfile.id (not userId)
  // ───────────────────────────────────────────────────────────────────────────
  it('resolves correctly when queried by ClergyProfile UUID instead of userId', async () => {
    const profile = await prisma.clergyProfile.findFirst({
      where: { userId: TEST_USER_IDS.active },
    });
    expect(profile).not.toBeNull();
    const result = await service.verifyClergySacramentalAuthority(profile!.id);
    expect(result).toBe(true);
  });
});
