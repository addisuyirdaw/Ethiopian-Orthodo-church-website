import { z } from 'zod';
import { SupplyType, TransferStatus } from '@prisma/client';

// ─── Supply Batch Validators ──────────────────────────────────────────────────

export const createSupplyBatchSchema = z.object({
  supplyType: z.nativeEnum(SupplyType, {
    errorMap: () => ({ message: 'ያልተፈቀደ የቁሳቁስ አይነት: አቅርቦቱ ካልታወቁ ዓይነቶች አንዱ መሆን አለበት።' }),
  }),
  batchCode: z
    .string()
    .min(4, 'የቡድን ኮዱ ቢያንስ 4 ፊደሎች ሊኖሩት ይገባል።')
    .max(64, 'የቡድን ኮዱ ከ64 ፊደሎች ማለፍ የለበትም።')
    .regex(/^[A-Z0-9-]+$/, 'የቡድን ኮዱ ፊደሎቹ ትልቅ ፊደሎች፣ ቁጥሮች ወይም ሰረዝ (-) ብቻ ሊሆኑ ይችላሉ።'),
  quantity: z.number().int().positive('ቁጥሩ ከዜሮ በላይ መሆን አለበት።'),
  unitOfMeasure: z.string().min(1, 'የልኬት አሃዱ ሊሰጥ ይገባል።'),
  institutionId: z.string().uuid().optional(),
  blessedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

export type CreateSupplyBatchInput = z.infer<typeof createSupplyBatchSchema>;

// ─── Supply Transfer Validators ───────────────────────────────────────────────

export const createSupplyTransferSchema = z.object({
  batchId: z.string().uuid('ትክክለኛ የቡድን መለያ (UUID) ሊሰጥ ይገባል።'),
  toInstitutionId: z.string().uuid('ትክክለኛ የተቀባዩ ቤተክርስቲያን መለያ (UUID) ሊሰጥ ይገባል።'),
  quantityTransferred: z.number().int().positive('የሚተላለፈው ቁጥር ከዜሮ በላይ መሆን አለበት።'),
  transferNote: z.string().max(1000).optional(),
});

export type CreateSupplyTransferInput = z.infer<typeof createSupplyTransferSchema>;

export const updateTransferStatusSchema = z.object({
  status: z.nativeEnum(TransferStatus, {
    errorMap: () => ({ message: 'ያልተፈቀደ የዝውውር ሁኔታ: REQUESTED, IN_TRANSIT, DELIVERED, ወይም CANCELLED ሊሆን ይችላል።' }),
  }),
  receiverUserId: z.string().uuid().optional(),
  transferNote: z.string().max(1000).optional(),
});

export type UpdateTransferStatusInput = z.infer<typeof updateTransferStatusSchema>;
