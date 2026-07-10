import { MelodicMode, HymnCategory, FastingTier } from '@prisma/client';
import { HymnArchiveService } from '../../src/services/hymnology/hymn-archive.service';
import prisma from '../../src/lib/prisma';
import { calendarService } from '../../src/services/calendar.service';
import {
  ConflictError,
  CanonicalValidationError,
} from '../../src/middleware/error-handler.middleware';

// ─── Mock Prisma and Calendar Service ──────────────────────────────────────────

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    institution: { findFirst: jest.fn() },
    sacredComposition: { create: jest.fn(), findMany: jest.fn() },
    choirRoster: { findUnique: jest.fn(), create: jest.fn() },
  },
}));

jest.mock('../../src/services/calendar.service', () => ({
  calendarService: {
    getDailyLiturgicalContext: jest.fn(),
  },
}));

// ─── Typed Mock Helpers ────────────────────────────────────────────────────────

const mockInstFindFirst = prisma.institution.findFirst as jest.Mock;
const mockCompCreate = prisma.sacredComposition.create as jest.Mock;
const mockCompFindMany = prisma.sacredComposition.findMany as jest.Mock;
const mockChoirFindUnique = prisma.choirRoster.findUnique as jest.Mock;
const mockChoirCreate = prisma.choirRoster.create as jest.Mock;
const mockGetDailyLiturgicalContext = calendarService.getDailyLiturgicalContext as jest.Mock;

describe('HymnArchiveService', () => {
  let service: HymnArchiveService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HymnArchiveService();
  });

  // ─── createComposition ───────────────────────────────────────────────────────

  describe('createComposition', () => {
    it('creates a composition when input is valid', async () => {
      const input = {
        titleAmharic: 'አቡነ ዘበሰማያት',
        titleEnglish: 'Our Father in Heaven',
        lyricsGeez: 'አቡነ ዘበሰማያት ይትቀደስ ስምከ...',
        mode: MelodicMode.GEEZ,
        category: HymnCategory.KEDASSE,
        associatedFeast: 'Pascha',
      };

      mockCompCreate.mockResolvedValue({
        id: 'comp-uuid-123',
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createComposition(input);

      expect(result.id).toBe('comp-uuid-123');
      expect(mockCompCreate).toHaveBeenCalledTimes(1);
      expect(mockCompCreate).toHaveBeenCalledWith({
        data: {
          titleAmharic: input.titleAmharic,
          titleEnglish: input.titleEnglish,
          lyricsGeez: input.lyricsGeez,
          mode: input.mode,
          category: input.category,
          audioUrl: null,
          notationUrl: null,
          associatedFeast: input.associatedFeast,
        },
      });
    });

    it('throws CanonicalValidationError when titleAmharic is empty', async () => {
      const input = {
        titleAmharic: '',
        lyricsGeez: 'ይትቀደስ ስምከ...',
        mode: MelodicMode.GEEZ,
        category: HymnCategory.KEDASSE,
      };

      await expect(service.createComposition(input)).rejects.toThrow(
        new CanonicalValidationError('Amharic title is required.')
      );
      expect(mockCompCreate).not.toHaveBeenCalled();
    });

    it('throws CanonicalValidationError when lyricsGeez is empty', async () => {
      const input = {
        titleAmharic: 'የእግዚአብሔር ስም',
        lyricsGeez: '  ',
        mode: MelodicMode.GEEZ,
        category: HymnCategory.MAHLET,
      };

      await expect(service.createComposition(input)).rejects.toThrow(
        new CanonicalValidationError("Ge'ez lyrics are required.")
      );
      expect(mockCompCreate).not.toHaveBeenCalled();
    });
  });

  // ─── registerChoirMember ─────────────────────────────────────────────────────

  describe('registerChoirMember', () => {
    const tenantId = 'parish-tenant-1';
    const userId = 'user-uuid-88';
    const choirInput = {
      userId,
      choirPart: 'Tenor',
      role: 'LEADER',
    };

    it('successfully registers choir member if not already registered', async () => {
      mockChoirFindUnique.mockResolvedValue(null);
      mockChoirCreate.mockResolvedValue({
        id: 'roster-uuid-99',
        tenantId,
        userId,
        choirPart: 'Tenor',
        role: 'LEADER',
        joinedAt: new Date(),
        member: { id: userId, fullName: 'Test Member', email: 'test@ortho.org' },
      });

      const result = await service.registerChoirMember(tenantId, choirInput);

      expect(result.id).toBe('roster-uuid-99');
      expect(mockChoirFindUnique).toHaveBeenCalledWith({
        where: {
          tenantId_userId: { tenantId, userId },
        },
      });
      expect(mockChoirCreate).toHaveBeenCalledWith({
        data: {
          tenantId,
          userId,
          choirPart: 'Tenor',
          role: 'LEADER',
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
    });

    it('throws ConflictError if user is already registered in the same choir roster', async () => {
      mockChoirFindUnique.mockResolvedValue({
        id: 'existing-roster-uuid',
        tenantId,
        userId,
      });

      await expect(service.registerChoirMember(tenantId, choirInput)).rejects.toThrow(
        new ConflictError('User is already registered in this parish choir roster.')
      );
      expect(mockChoirCreate).not.toHaveBeenCalled();
    });
  });

  // ─── getSuggestedHymnsForSeason ──────────────────────────────────────────────

  describe('getSuggestedHymnsForSeason', () => {
    const dateStr = '2026-07-10';
    const mockInst = { id: 'inst-123', deletedAt: null };

    it('returns empty list if no institutions are configured', async () => {
      mockInstFindFirst.mockResolvedValue(null);

      const result = await service.getSuggestedHymnsForSeason(dateStr);
      expect(result).toEqual([]);
      expect(mockGetDailyLiturgicalContext).not.toHaveBeenCalled();
    });

    it('returns suggested hymns matching simulated liturgical context', async () => {
      mockInstFindFirst.mockResolvedValue(mockInst);
      
      // Simulate liturgical context returning Apostles' Fast and STRICT fasting
      mockGetDailyLiturgicalContext.mockResolvedValue({
        fasting: {
          title: "Apostles' Fast",
          tier: FastingTier.STRICT,
        },
      });

      const suggestedHymn = {
        id: 'composition-1',
        titleAmharic: 'የሐዋርያት መዝሙር',
        lyricsGeez: 'ሐዋርያት ዘብሩህ...',
        mode: MelodicMode.ARARAY,
        category: HymnCategory.WEREB,
        associatedFeast: "Apostles' Fast",
      };

      mockCompFindMany.mockResolvedValue([suggestedHymn]);

      const result = await service.getSuggestedHymnsForSeason(dateStr);

      expect(result).toEqual([suggestedHymn]);
      expect(mockGetDailyLiturgicalContext).toHaveBeenCalledWith(mockInst.id, dateStr);
      expect(mockCompFindMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { associatedFeast: { equals: "Apostles' Fast", mode: 'insensitive' } },
            { associatedFeast: { equals: FastingTier.STRICT, mode: 'insensitive' } },
          ],
        },
      });
    });
  });
});
