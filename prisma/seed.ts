import {
  PrismaClient,
  InstitutionType,
  EcclesiasticalRole,
  AuthRole,
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

interface SeedInstitutionSpec {
  key: string;
  name: string;
  nameAm: string;
  nameEn: string;
  type: InstitutionType;
  parentKey: string | null;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
}

const INSTITUTIONS: SeedInstitutionSpec[] = [
  {
    key: 'patriarchate',
    name: 'Holy Synod of the Ethiopian Orthodox Tewahedo Church',
    nameAm: 'የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን ቅዱስ ሲኖዶስ',
    nameEn: 'Holy Synod of the Ethiopian Orthodox Tewahedo Church',
    type: InstitutionType.PATRIARCHATE,
    parentKey: null,
  },
  {
    key: 'dioc_ns',
    name: 'Diocese of North Shewa',
    nameAm: 'ሰሜን ሸዋ ሀገረ ስብከት',
    nameEn: 'Diocese of North Shewa',
    type: InstitutionType.DIOCESE,
    parentKey: 'patriarchate',
  },
  {
    key: 'parish_db_medhanealem',
    name: 'Debre Berhan Medhane Alem Church',
    nameAm: 'ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን',
    nameEn: 'Debre Berhan Medhane Alem Church',
    type: InstitutionType.PARISH,
    parentKey: 'dioc_ns',
    address: 'ደብረ ብርሃን ከተማ',
    phone: '0114234570',
    email: 'dbmedhanealem@orthodoxconnect.org',
    description: 'በደብረ ብርሃን ከተማ የሚገኝ ታላቅና ታዋቂ መድኃኔዓለም ቤተ ክርስቲያን',
  },
];

interface SeedPriestSpec {
  email: string;
  fullName: string;
  christianName: string;
  parishKey: string;
  biography: string;
  serviceStartDate: string;
}

const PRIESTS: SeedPriestSpec[] = [
  {
    email: 'aba.weldemariam@orthodoxconnect.org',
    fullName: 'አባ ወልደማርያም ገብረኢየሱስ',
    christianName: 'ወልደማርያም',
    parishKey: 'parish_db_medhanealem',
    biography: 'ለ30 ዓመታት በደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን በቅዳሴና በስብከተ ወንጌል ያገለገሉ ታማኝ አባት።',
    serviceStartDate: '1995-09-11',
  },
  {
    email: 'aba.hailemariam@orthodoxconnect.org',
    fullName: 'መልአከ ብርሃን ኃይለማርያም ወልደሰንበት',
    christianName: 'ኃይለማርያም',
    parishKey: 'parish_db_medhanealem',
    biography: 'በደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን በአቋቋምና በዜማ ትምህርት የታወቁ፣ በርካታ መንፈሳዊ ልጆችን ያፈሩ መምህር።',
    serviceStartDate: '2002-09-11',
  },
  {
    email: 'aba.teklehaimanot@orthodoxconnect.org',
    fullName: 'ሊቀ ካህናት ተክለሃይማኖት ካሳ',
    christianName: 'ተክለሃይማኖት',
    parishKey: 'parish_db_medhanealem',
    biography: 'በደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን ለ15 ዓመታት በመልካም አገልግሎት ላይ የሚገኙ።',
    serviceStartDate: '2009-09-11',
  },
  {
    email: 'aba.kidane@orthodoxconnect.org',
    fullName: 'አባ ኪዳነማርያም ዘውዴ',
    christianName: 'ኪዳነማርያም',
    parishKey: 'parish_db_medhanealem',
    biography: 'የቀድሞ ገዳማዊ ሕይወት የነበራቸው፣ በአሁኑ ሰዓት በደብረ ብርሃን መድኃኔዓለም በምክር አገልግሎት ላይ የተሰማሩ አባት።',
    serviceStartDate: '2012-05-01',
  },
  {
    email: 'aba.gebregiorgis@orthodoxconnect.org',
    fullName: 'አባ ገብረጊዮርጊስ ተሰማ',
    christianName: 'ገብረጊዮርጊስ',
    parishKey: 'parish_db_medhanealem',
    biography: 'በደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን የንስሐ አባትና መጽሐፍ መምህር።',
    serviceStartDate: '1988-09-11',
  },
  {
    email: 'aba.weldetsadik@orthodoxconnect.org',
    fullName: 'አባ ወልደጻድቅ በቀለ',
    christianName: 'ወልደጻድቅ',
    parishKey: 'parish_db_medhanealem',
    biography: 'በሰሜን ሸዋ ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን የረጅም ዘመን መጋቢና አስተማሪ።',
    serviceStartDate: '1990-09-11',
  },
];

async function clearDatabase(): Promise<void> {
  console.log('Clearing existing records in reverse dependency order...');

  await prisma.notification.deleteMany();
  await prisma.appointmentHistory.deleteMany();
  await prisma.spiritualAppointment.deleteMany();
  await prisma.priestAssignmentRequest.deleteMany();

  await prisma.clergyAssignment.deleteMany();
  await prisma.clergyProfile.deleteMany();

  await prisma.user.deleteMany();

  let remaining = await prisma.institution.count();
  while (remaining > 0) {
    const deleted = await prisma.institution.deleteMany({
      where: {
        children: { none: {} },
      },
    });
    if (deleted.count === 0) {
      throw new Error('Unable to clear institution hierarchy.');
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
      nameAm: spec.nameAm,
      nameEn: spec.nameEn,
      type: spec.type,
      institutionType: spec.type,
      parentId: parentId,
      hierarchyPath: '/pending/',
      address: spec.address ?? null,
      phone: spec.phone ?? null,
      email: spec.email ?? null,
      description: spec.description ?? null,
      isActive: true,
    },
  });

  await assignHierarchyPath(institution.id, parentId, prisma);
  institutionIds.set(spec.key, institution.id);

  console.log(`  Created ${spec.type}: ${spec.nameAm}`);
}

async function main() {
  console.log('OrthodoxConnect Phase 2.2 seed starting...');

  await clearDatabase();

  // 1. Seed Institutions
  console.log('Seeding institution hierarchy...');
  const institutionIds = new Map<string, string>();
  for (const spec of INSTITUTIONS) {
    await createInstitution(spec, institutionIds);
  }

  // 2. Seed Priests
  console.log('Seeding priests...');
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);

  for (const priest of PRIESTS) {
    const instId = institutionIds.get(priest.parishKey);
    if (!instId) throw new Error(`Parish key ${priest.parishKey} not found`);

    const user = await prisma.user.create({
      data: {
        email: priest.email,
        passwordHash,
        fullName: priest.fullName,
        christianName: priest.christianName,
        ecclesiasticalRole: EcclesiasticalRole.PRIEST,
        authRole: AuthRole.PRIEST,
        institutionId: instId,
        biography: priest.biography,
        serviceStartDate: new Date(priest.serviceStartDate),
        currentStatus: 'ACTIVE',
      },
    });

    // Clergy profiles for internal verification logic
    await prisma.clergyProfile.create({
      data: {
        userId: user.id,
        ordinationRank: OrdinationRank.PRIEST,
        canonicalStatus: CanonicalStatus.ACTIVE_GOOD_STANDING,
        ordinationDate: new Date(priest.serviceStartDate),
        currentAssignmentId: instId,
        nameAm: priest.fullName,
        nameEn: priest.email.split('@')[0],
      },
    });

    await prisma.clergyAssignment.create({
      data: {
        userId: user.id,
        institutionId: instId,
        roleTitle: 'PRIEST',
        decreeNumber: `DEC-SEED-${user.id.slice(0, 8).toUpperCase()}`,
        assignedAt: new Date(priest.serviceStartDate),
      },
    });

    console.log(`  Created Priest: ${priest.fullName} at ${priest.parishKey}`);
  }

  // 3. Seed System Admin
  console.log('Seeding system admin...');
  const adminInstId = institutionIds.get('patriarchate')!;
  await prisma.user.create({
    data: {
      email: 'admin@orthodoxconnect.org',
      passwordHash,
      fullName: 'System Administrator (አስተዳዳሪ)',
      ecclesiasticalRole: EcclesiasticalRole.PATRIARCH,
      authRole: AuthRole.SYSTEM_ADMIN,
      institutionId: adminInstId,
      currentStatus: 'ACTIVE',
    },
  });
  console.log('  Created System Admin: admin@orthodoxconnect.org');

  // 4. Seed sample follower/members
  console.log('Seeding sample members...');
  const medhaneAlemInstId = institutionIds.get('parish_db_medhanealem')!;

  // Find priest id
  const dbPriest = await prisma.user.findFirst({
    where: { email: 'aba.weldemariam@orthodoxconnect.org' }
  });

  await prisma.user.create({
    data: {
      email: 'member1@orthodoxconnect.org',
      passwordHash,
      fullName: 'ዮናስ አሰፋ',
      christianName: 'ገብረማርያም',
      ecclesiasticalRole: EcclesiasticalRole.LAITY,
      authRole: AuthRole.MIMEN,
      institutionId: medhaneAlemInstId,
      sex: 'MALE',
      age: 28,
      phoneNumber: '0911000001',
      region: 'አማራ',
      city: 'ደብረ ብርሃን',
      baptismStatus: 'ተጠምቄአለሁ',
      spiritualFatherId: dbPriest?.id ?? null,
      currentStatus: 'ACTIVE',
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
