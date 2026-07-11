import {
  PrismaClient,
  InstitutionType,
  EcclesiasticalRole,
  CalendarTradition,
  FastingTier,
  LiturgicalColor,
  OrdinationRank,
  CanonicalStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';
import { assignHierarchyPath } from '../src/lib/hierarchy';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'orthodox123';

interface SeedUserSpec {
  email: string;
  fullName: string;
  role: EcclesiasticalRole;
  institutionKey: string;
}

interface SeedInstitutionSpec {
  key: string;
  name: string;
  type: InstitutionType;
  parentKey: string | null;
}

const INSTITUTIONS: SeedInstitutionSpec[] = [
  {
    key: 'patriarchate',
    name: 'Holy Synod of the Ethiopian Orthodox Tewahedo Church',
    type: InstitutionType.PATRIARCHATE,
    parentKey: null,
  },
  {
    key: 'archdiocese',
    name: 'Archdiocese of Addis Ababa',
    type: InstitutionType.ARCHDIOCESE,
    parentKey: 'patriarchate',
  },
  {
    key: 'diocese',
    name: 'Diocese of Debre Birhan',
    type: InstitutionType.DIOCESE,
    parentKey: 'archdiocese',
  },
  {
    key: 'parish_aa',
    name: 'Holy Trinity Cathedral (Addis Ababa)',
    type: InstitutionType.PARISH,
    parentKey: 'archdiocese',
  },
  {
    key: 'parish_db',
    name: 'Debre Berhan Selassie Church',
    type: InstitutionType.PARISH,
    parentKey: 'diocese',
  },
];

const USERS: SeedUserSpec[] = [
  {
    email: 'patriarch@orthodoxconnect.org',
    fullName: 'His Holiness Patriarch (Seed)',
    role: EcclesiasticalRole.PATRIARCH,
    institutionKey: 'patriarchate',
  },
  {
    email: 'archbishop@orthodoxconnect.org',
    fullName: 'Archbishop of Addis Ababa (Seed)',
    role: EcclesiasticalRole.ARCHBISHOP,
    institutionKey: 'archdiocese',
  },
  {
    email: 'bishop@orthodoxconnect.org',
    fullName: 'Bishop of Debre Birhan (Seed)',
    role: EcclesiasticalRole.BISHOP,
    institutionKey: 'diocese',
  },
  {
    email: 'priest.aa@orthodoxconnect.org',
    fullName: 'Priest of Holy Trinity Cathedral (Seed)',
    role: EcclesiasticalRole.PRIEST,
    institutionKey: 'parish_aa',
  },
  {
    email: 'priest.db@orthodoxconnect.org',
    fullName: 'Priest of Debre Berhan Selassie (Seed)',
    role: EcclesiasticalRole.PRIEST,
    institutionKey: 'parish_db',
  },
];

async function clearDatabase(): Promise<void> {
  console.log('Clearing existing records in reverse dependency order...');

  await prisma.marriageRegistry.deleteMany();
  await prisma.sacramentalProfile.deleteMany();
  await prisma.financialClearingLog.deleteMany();
  await prisma.ledgerSplitRecord.deleteMany();
  await prisma.financialTransaction.deleteMany();
  await prisma.liturgicalDay.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.clergyAssignmentHistory.deleteMany();
  await prisma.clergyAssignment.deleteMany();
  await prisma.clergyProfile.deleteMany();
  await prisma.sacramentalRecord.deleteMany();
  await prisma.user.deleteMany();

  let remaining = await prisma.institution.count();
  while (remaining > 0) {
    const deleted = await prisma.institution.deleteMany({
      where: {
        children: { none: {} },
      },
    });

    if (deleted.count === 0) {
      throw new Error('Unable to clear institution hierarchy; orphaned nodes may exist.');
    }

    remaining = await prisma.institution.count();
  }

  console.log('Database cleared.');
}

async function createInstitution(
  spec: SeedInstitutionSpec,
  institutionIds: Map<string, string>,
): Promise<void> {
  const parentId = spec.parentKey ? institutionIds.get(spec.parentKey) ?? null : null;

  const institution = await prisma.institution.create({
    data: {
      name: spec.name,
      type: spec.type,
      institutionType: spec.type,
      parentId: parentId,
      hierarchyPath: '/pending/',
    },
  });

  await assignHierarchyPath(institution.id, parentId, prisma);
  institutionIds.set(spec.key, institution.id);

  console.log(`  Created ${spec.type}: ${spec.name}`);
}

async function seedInstitutions(): Promise<Map<string, string>> {
  console.log('Seeding canonical institution hierarchy...');
  const institutionIds = new Map<string, string>();

  for (const spec of INSTITUTIONS) {
    await createInstitution(spec, institutionIds);
  }

  return institutionIds;
}

async function seedUsers(institutionIds: Map<string, string>): Promise<void> {
  console.log('Seeding ecclesiastical users...');
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);

  for (const spec of USERS) {
    const institutionId = institutionIds.get(spec.institutionKey);
    if (!institutionId) {
      throw new Error(`Institution key not found for user ${spec.email}: ${spec.institutionKey}`);
    }

    const user = await prisma.user.create({
      data: {
        email: spec.email,
        passwordHash,
        fullName: spec.fullName,
        ecclesiasticalRole: spec.role,
        institutionId,
      },
    });

    let rank: OrdinationRank | null = null;
    if (spec.role === EcclesiasticalRole.PATRIARCH) rank = OrdinationRank.PATRIARCH;
    else if (spec.role === EcclesiasticalRole.ARCHBISHOP) rank = OrdinationRank.METROPOLITAN;
    else if (spec.role === EcclesiasticalRole.BISHOP) rank = OrdinationRank.BISHOP;
    else if (spec.role === EcclesiasticalRole.PRIEST) rank = OrdinationRank.PRIEST;
    else if (spec.role === EcclesiasticalRole.DEACON) rank = OrdinationRank.DEACON;

    if (rank) {
      await prisma.clergyProfile.create({
        data: {
          userId: user.id,
          ordinationRank: rank,
          canonicalStatus: CanonicalStatus.ACTIVE_GOOD_STANDING,
          ordinationDate: new Date('2018-09-11T00:00:00Z'),
          currentAssignmentId: institutionId,
        },
      });

      await prisma.clergyAssignment.create({
        data: {
          userId: user.id,
          institutionId: institutionId,
          roleTitle: spec.role.toString(),
          decreeNumber: `DEC-SEED-${user.id.slice(0, 8).toUpperCase()}`,
          assignedAt: new Date('2018-09-11T00:00:00Z'),
        },
      });
    }

    console.log(`  Created ${spec.role}: ${spec.email}`);
  }
}

async function seedLiturgicalDays(): Promise<void> {
  console.log('Seeding liturgical calendar CMS records...');

  await prisma.liturgicalDay.createMany({
    data: [
      {
        calendarTradition: CalendarTradition.ETHIOPIAN_TEWAHEDO,
        solarMonth: 11,
        solarDay: 2,
        fastingTier: FastingTier.STRICT,
        liturgicalColor: LiturgicalColor.GOLD,
        titleI18n: {
          en: "Apostles' Fast",
          am: 'የሐዋርያት ጾም',
          gez: 'ጾመ ሐዋርያት',
        },
        readingsI18n: {
          en: {
            epistle: 'Romans 8:28-39',
            gospel: 'Matthew 10:16-22',
          },
          am: {
            epistle: 'ሮሜ 8:28-39',
            gospel: 'ማቴዎስ 10:16-22',
          },
          gez: {
            epistle: 'ሮሜ 8:28-39',
            gospel: 'ማቴዎስ 10:16-22',
          },
        },
      },
      {
        calendarTradition: CalendarTradition.JULIAN_ORTHODOX,
        paschalOffset: 0,
        fastingTier: FastingTier.NONE,
        liturgicalColor: LiturgicalColor.GOLD,
        titleI18n: {
          en: 'Holy Pascha',
          el: 'Άγιο Πάσχα',
          gez: 'ብርሃነ ፋሲካ',
        },
        readingsI18n: {
          en: {
            epistle: 'Acts 1:1-8',
            gospel: 'John 1:1-17',
          },
          gez: {
            epistle: 'ግብረ ሐዋርያት 1:1-8',
            gospel: 'ዮሐንስ 1:1-17',
          },
        },
      },
      {
        calendarTradition: CalendarTradition.REVISED_JULIAN,
        paschalOffset: 7,
        fastingTier: FastingTier.WINE_OIL,
        liturgicalColor: LiturgicalColor.WHITE,
        titleI18n: {
          en: 'Bright Week',
          gez: 'ሰሙነ ትንሣኤ',
        },
        readingsI18n: {
          en: {
            epistle: 'Acts 2:14-21',
            gospel: 'John 20:19-31',
          },
          gez: {
            epistle: 'ግብረ ሐዋርያት 2:14-21',
            gospel: 'ዮሐንስ 20:19-31',
          },
        },
      },
    ],
  });

  console.log('  Created canonical liturgical day records.');
}

async function main(): Promise<void> {
  console.log('OrthodoxConnect canonical seed starting...\n');

  await clearDatabase();
  const institutionIds = await seedInstitutions();
  await seedUsers(institutionIds);
  await seedLiturgicalDays();

  console.log('\nSeed completed successfully.');
  console.log(`Default password for all seed users: ${DEFAULT_PASSWORD}`);
  console.log('\nSeed user accounts:');
  for (const user of USERS) {
    console.log(`  - ${user.email} (${user.role})`);
  }
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
