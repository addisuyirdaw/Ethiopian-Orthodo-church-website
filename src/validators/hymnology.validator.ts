import { z } from 'zod';
import { MelodicMode, HymnCategory } from '@prisma/client';

export const createCompositionSchema = z.object({
  titleAmharic: z.string().min(1, 'የመዝሙር ርዕስ (በአማርኛ) ያስፈልጋል።'),
  titleEnglish: z.string().optional(),
  lyricsGeez: z.string().min(1, 'የግዕዝ ግጥም ያስፈልጋል።'),
  mode: z.nativeEnum(MelodicMode, {
    errorMap: () => ({ message: 'ትክክለኛ የዜማ ስልት ያስገቡ (GEEZ, EZL, ARARAY, MULTIPLE)።' }),
  }),
  category: z.nativeEnum(HymnCategory, {
    errorMap: () => ({ message: 'ትክክለኛ የመዝሙር ዘርፍ ያስገቡ (MAHLET, WEREB, KEDASSE, SUNDAY_SCHOOL_HYMN)።' }),
  }),
  audioUrl: z.string().url('የድምፅ ፋይል አድራሻ (URL) ትክክለኛ መሆን አለበት።').optional().or(z.literal('')),
  notationUrl: z.string().url('የኖታ ፋይል አድራሻ (URL) ትክክለኛ መሆን አለበት።').optional().or(z.literal('')),
  associatedFeast: z.string().optional(),
});

export const registerChoirMemberSchema = z.object({
  userId: z.string().uuid('ትክክለኛ የተጠቃሚ መለያ (UUID) ያስፈልጋል።'),
  choirPart: z.string().min(1, 'የድምፅ ክፍል (Choir Part) ያስፈልጋል።'),
  role: z.string().optional(),
});

export const suggestedHymnsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'ቀኑ በYYYY-MM-DD ቅርጸት መሆን አለበት።'),
});
