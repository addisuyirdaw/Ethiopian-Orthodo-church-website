import { MelodicMode, HymnCategory } from '@prisma/client';
import prisma from '../../lib/prisma';
import { ConflictError, CanonicalValidationError } from '../../middleware/error-handler.middleware';
import { calendarService } from '../calendar.service';

export interface CreateCompositionInput {
  titleAmharic: string;
  titleEnglish?: string;
  lyricsGeez: string;
  mode: MelodicMode;
  category: HymnCategory;
  audioUrl?: string;
  notationUrl?: string;
  associatedFeast?: string;
}

export interface RegisterChoirMemberInput {
  userId: string;
  choirPart: string;
  role?: string;
}

export class HymnArchiveService {
  /**
   * Creates a new SacredComposition in the archive.
   * Validates that titleAmharic and lyricsGeez are present and non-empty.
   */
  async createComposition(data: CreateCompositionInput) {
    if (!data.titleAmharic || data.titleAmharic.trim() === '') {
      throw new CanonicalValidationError('Amharic title is required.');
    }
    if (!data.lyricsGeez || data.lyricsGeez.trim() === '') {
      throw new CanonicalValidationError('Ge\'ez lyrics are required.');
    }

    return prisma.sacredComposition.create({
      data: {
        titleAmharic: data.titleAmharic,
        titleEnglish: data.titleEnglish ?? null,
        lyricsGeez: data.lyricsGeez,
        mode: data.mode,
        category: data.category,
        audioUrl: data.audioUrl ?? null,
        notationUrl: data.notationUrl ?? null,
        associatedFeast: data.associatedFeast ?? null,
      },
    });
  }

  /**
   * Registers a user to a parish choir roster.
   * Prevates duplicate registration for the same user in the same parish/tenant.
   */
  async registerChoirMember(tenantId: string, data: RegisterChoirMemberInput) {
    const existing = await prisma.choirRoster.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: data.userId,
        },
      },
    });

    if (existing) {
      throw new ConflictError('User is already registered in this parish choir roster.');
    }

    return prisma.choirRoster.create({
      data: {
        tenantId,
        userId: data.userId,
        choirPart: data.choirPart,
        role: data.role ?? 'MEMBER',
      },
      include: {
        member: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Suggests hymns based on the daily liturgical season/feast of an institution.
   * Resolves the first active institution if none is explicitly present to query context.
   */
  async getSuggestedHymnsForSeason(dateStr: string) {
    // Resolve any active institution to fetch the calendar context (multi-tenant safe fallback)
    const institution = await prisma.institution.findFirst({
      where: { deletedAt: null },
    });

    if (!institution) {
      // Fallback: if no institutions exist in database yet, return empty suggestions or query by date
      return [];
    }

    const context = await calendarService.getDailyLiturgicalContext(
      institution.id,
      dateStr
    );

    const activeFeast = context.fasting.title;
    const activeTier = context.fasting.tier;

    // Filter compositions whose associatedFeast matching criteria match active feast or tier
    return prisma.sacredComposition.findMany({
      where: {
        OR: [
          { associatedFeast: { equals: activeFeast, mode: 'insensitive' } },
          { associatedFeast: { equals: activeTier, mode: 'insensitive' } },
        ],
      },
    });
  }
}

export const hymnArchiveService = new HymnArchiveService();
