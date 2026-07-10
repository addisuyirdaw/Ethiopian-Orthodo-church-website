import { z } from 'zod';

export const getDiocesanMetricsSchema = z.object({
  dioceseId: z.string().uuid('ትክክለኛ የሀገረ ስብከት መለያ (UUID) ያስፈልጋል።'),
});

export const executeClergyTransferSchema = z.object({
  clergyId: z.string().uuid('ትክክለኛ የአገልጋይ መለያ (UUID) ያስፈልጋል።'),
  toInstitutionId: z.string().uuid('ትክክለኛ የተቀባይ ተቋም መለያ (UUID) ያስፈልጋል።'),
});
