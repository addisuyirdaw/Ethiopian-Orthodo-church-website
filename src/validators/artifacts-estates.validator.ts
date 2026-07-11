import { z } from 'zod';
import { ArtifactCategory, StructuralCondition } from '@prisma/client';

// ─── Artifact Validators ───────────────────────────────────────────────────────

export const createArtifactSchema = z.object({
  nameEn: z
    .string()
    .min(2, 'The artifact name in English must be at least 2 characters.')
    .max(200, 'The artifact name in English must not exceed 200 characters.'),
  nameAm: z
    .string()
    .min(2, 'የቅርሱ ስም በአማርኛ ቢያንስ 2 ፊደሎች ሊኖሩት ይገባል።')
    .max(200, 'የቅርሱ ስም በአማርኛ ከ200 ፊደሎች ማለፍ የለበትም።'),
  nameGez: z
    .string()
    .min(2, 'የቅርሱ ስም በግዕዝ ቢያንስ 2 ፊደሎች ሊኖሩት ይገባል።')
    .max(200, 'የቅርሱ ስም በግዕዝ ከ200 ፊደሎች ማለፍ የለበትም።')
    .optional(),
  category: z.nativeEnum(ArtifactCategory, {
    errorMap: () => ({
      message:
        'ያልተፈቀደ የቅርስ ምድብ: MANUSCRIPT፣ CROSS፣ VESTMENT ወይም LITURGICAL_VESSEL ሊሆን ይችላል።',
    }),
  }),
  structuralCondition: z.nativeEnum(StructuralCondition, {
    errorMap: () => ({
      message:
        'ያልተፈቀደ የቅርስ ሁኔታ: EXCELLENT፣ GOOD፣ NEEDS_RESTORATION ወይም CRITICAL ሊሆን ይችላል።',
    }),
  }),
  estimatedAge: z
    .number()
    .int('የቅርሱ ዕድሜ ሙሉ ቁጥር መሆን አለበት።')
    .min(0, 'የቅርሱ ዕድሜ ከዜሮ ያነሰ ሊሆን አይችልም።')
    .optional(),
  storageLocation: z
    .string()
    .min(2, 'የማከማቻ ቦታ ቢያንስ 2 ፊደሎች ሊኖሩት ይገባል።')
    .max(500, 'የማከማቻ ቦታ ከ500 ፊደሎች ማለፍ የለበትም።'),
  institutionId: z.string().uuid('ትክክለኛ የተቋሙ መለያ (UUID) ሊሰጥ ይገባል።').optional(),
});

export type CreateArtifactInput = z.infer<typeof createArtifactSchema>;

// ─── Monastic Estate Validators ───────────────────────────────────────────────

export const createMonasticEstateSchema = z.object({
  estateName: z
    .string()
    .min(2, 'የርስቱ ስም ቢያንስ 2 ፊደሎች ሊኖሩት ይገባል።')
    .max(300, 'የርስቱ ስም ከ300 ፊደሎች ማለፍ የለበትም።'),
  landAreaHectares: z
    .number()
    .positive('የመሬቱ ስፋት ከዜሮ በላይ መሆን አለበት።')
    .max(1_000_000, 'የመሬቱ ስፋት ከ1,000,000 ሄክታር ማለፍ የለበትም።'),
  gpsLatitude: z
    .number()
    .min(-90, 'የጂፒኤስ ኬክሮስ ቁጥሩ ከ -90 ያነሰ ሊሆን አይችልም።')
    .max(90, 'የጂፒኤስ ኬክሮስ ቁጥሩ ከ 90 ሊያልፍ አይችልም።'),
  gpsLongitude: z
    .number()
    .min(-180, 'የጂፒኤስ ቁመታዊ ቁጥሩ ከ -180 ያነሰ ሊሆን አይችልም።')
    .max(180, 'የጂፒኤስ ቁመታዊ ቁጥሩ ከ 180 ሊያልፍ አይችልም።'),
  legalDeedStatus: z
    .string()
    .min(2, 'የሕጋዊ ሰነድ ሁኔታ ቢያንስ 2 ፊደሎች ሊኖሩት ይገባል።')
    .max(300, 'የሕጋዊ ሰነድ ሁኔታ ከ300 ፊደሎች ማለፍ የለበትም።'),
  currentUtilization: z
    .string()
    .min(2, 'የአሁናዊ አጠቃቀም መረጃ ቢያንስ 2 ፊደሎች ሊኖሩት ይገባል።'),
  institutionId: z.string().uuid('ትክክለኛ የተቋሙ መለያ (UUID) ሊሰጥ ይገባል።').optional(),
});

export type CreateMonasticEstateInput = z.infer<typeof createMonasticEstateSchema>;

// ─── Artifact Inspection Validators ──────────────────────────────────────────

export const createArtifactInspectionSchema = z.object({
  conditionAtInspection: z.nativeEnum(StructuralCondition, {
    errorMap: () => ({
      message:
        'ያልተፈቀደ የፍተሻ ሁኔታ: EXCELLENT፣ GOOD፣ NEEDS_RESTORATION ወይም CRITICAL ሊሆን ይችላል።',
    }),
  }),
  inspectionNotes: z
    .string()
    .max(5000, 'የፍተሻ ማስታወሻ ከ5000 ፊደሎች ማለፍ የለበትም።')
    .optional(),
  inspectedAt: z
    .string()
    .datetime({ message: 'ትክክለኛ የፍተሻ ቀን እና ሰዓት (ISO 8601) ሊሰጥ ይገባል።' }),
});

export type CreateArtifactInspectionInput = z.infer<typeof createArtifactInspectionSchema>;
