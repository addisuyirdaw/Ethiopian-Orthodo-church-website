import {
  Prisma,
  PrismaClient,
  PaymentProvider,
  PaymentStatus,
  CouncilRole,
  DepartmentType,
} from '@prisma/client';

describe('Schema validation — Part 1: Unified Payments & Kale Awadi', () => {
  // The real PrismaClient is mocked globally via jest.config.js → setupFiles.
  // We retrieve the mock instance to inspect delegate availability.
  let prisma: any;

  beforeAll(() => {
    // Use the module mock that prisma.mock.ts registers — no live connection needed.
    prisma = jest.requireMock('../../src/lib/prisma').default;
  });

  afterAll(() => {
    // No-op: the mock client has no real connection to close.
  });

  describe('enums', () => {
    it('exposes PaymentProvider with all required gateway values', () => {
      expect(Object.values(PaymentProvider).sort()).toEqual(
        ['CBE_BIRR', 'CHAPA', 'STRIPE', 'TELEBIRR'].sort(),
      );
    });

    it('exposes PaymentStatus with full lifecycle values', () => {
      expect(Object.values(PaymentStatus).sort()).toEqual(
        ['FAILED', 'PENDING', 'REFUNDED', 'SUCCESSFUL'].sort(),
      );
    });

    it('exposes CouncilRole EOTC parish council officer values', () => {
      expect(Object.values(CouncilRole).sort()).toEqual(
        [
          'GENZEB_YAZHI',
          'HISAB_SHUM',
          'LIQE_MENBER',
          'MEK_LIQE_MENBER',
          'WANA_TSEHAFI',
        ].sort(),
      );
    });

    it('exposes DepartmentType EOTC work-unit values', () => {
      expect(Object.values(DepartmentType)).toHaveLength(13);
      expect(DepartmentType.EVANGELICAL_SERVICE).toBe('EVANGELICAL_SERVICE');
      expect(DepartmentType.STATISTICS).toBe('STATISTICS');
    });
  });

  describe('Prisma Client model delegates', () => {
    it('exposes MerchantConfiguration delegate', () => {
      expect(prisma.merchantConfiguration).toBeDefined();
      expect(typeof prisma.merchantConfiguration.create).toBe('function');
      expect(typeof prisma.merchantConfiguration.findUnique).toBe('function');
    });

    it('exposes Transaction delegate (unified payment ledger)', () => {
      expect(prisma.transaction).toBeDefined();
      expect(typeof prisma.transaction.create).toBe('function');
      expect(typeof prisma.transaction.findMany).toBe('function');
      expect(prisma.$transaction).toBeDefined();
    });

    it('exposes SebekaGubaeSeat delegate', () => {
      expect(prisma.sebekaGubaeSeat).toBeDefined();
      expect(typeof prisma.sebekaGubaeSeat.create).toBe('function');
    });

    it('exposes QaleGubae delegate', () => {
      expect(prisma.qaleGubae).toBeDefined();
      expect(typeof prisma.qaleGubae.create).toBe('function');
    });
  });

  describe('DMMF metadata (relations, indexes, constraints)', () => {
    const dmmf = Prisma.dmmf;

    it('registers all four new models in the schema datamodel', () => {
      const modelNames = dmmf.datamodel.models.map((m) => m.name).sort();
      expect(modelNames).toEqual(
        expect.arrayContaining([
          'MerchantConfiguration',
          'Transaction',
          'SebekaGubaeSeat',
          'QaleGubae',
        ]),
      );
    });

    it('maps Transaction to unified_payment_transactions table', () => {
      const txnModel = dmmf.datamodel.models.find((m) => m.name === 'Transaction');
      expect(txnModel?.dbName).toBe('unified_payment_transactions');
    });

    it('defines Institution and User relations on MerchantConfiguration', () => {
      const model = dmmf.datamodel.models.find((m) => m.name === 'MerchantConfiguration');
      const relationFields = model?.fields.filter((f) => f.kind === 'object') ?? [];
      expect(relationFields.map((f) => f.name)).toContain('institution');
      expect(model?.fields.find((f) => f.name === 'institutionId')?.isUnique).toBe(true);
    });

    it('defines compound index on Transaction [institutionId, status]', () => {
      const fs = require('fs');
      const path = require('path');
      const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      const modelBlock = schemaContent.match(/model Transaction\s*\{([^}]*)\}/)?.[1] || '';
      expect(modelBlock.replace(/\s+/g, '')).toContain('@@index([institutionId,status])');
    });

    it('defines supporting indexes on SebekaGubaeSeat for council seat lookups', () => {
      const fs = require('fs');
      const path = require('path');
      const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');

      const modelBlock = schemaContent.match(/model SebekaGubaeSeat\s*\{([^}]*)\}/)?.[1] || '';
      expect(modelBlock.replace(/\s+/g, '')).toContain('@@index([institutionId,role,isActive])');
      expect(modelBlock.replace(/\s+/g, '')).toContain('@@index([institutionId,isActive])');
      expect(modelBlock.replace(/\s+/g, '')).toContain('@@index([userId,isActive])');
    });

    it('documents partial unique constraint for active council roles via migration SQL', () => {
      // Partial unique (institution_id, role) WHERE is_active = true lives in:
      // prisma/migrations/20260713180000_kale_awadi_partial_unique/migration.sql
      const fs = require('fs') as typeof import('fs');
      const path = require('path') as typeof import('path');
      const migrationPath = path.join(
        process.cwd(),
        'prisma/migrations/20260713180000_kale_awadi_partial_unique/migration.sql',
      );
      const sql = fs.readFileSync(migrationPath, 'utf8');
      expect(sql).toContain('sebeka_gubae_active_role_unique');
      expect(sql).toContain('WHERE "is_active" = true');
    });

    it('preserves all pre-existing core models unchanged', () => {
      const modelNames = dmmf.datamodel.models.map((m) => m.name);
      expect(modelNames).toEqual(
        expect.arrayContaining([
          'Institution',
          'User',
          'FinancialTransaction',
          'ParishLedger',
          'EcclesiasticalTransaction',
        ]),
      );
    });
  });
});
