import {
  CalendarTradition,
  FastingTier,
  InstitutionType,
  LiturgicalColor,
} from '@prisma/client';
import { CalendarService } from '../../src/services/calendar.service';
import { institutionRepository } from '../../src/repositories/institution.repository';
import { liturgicalDayRepository } from '../../src/repositories/liturgical-day.repository';

jest.mock('../../src/repositories/institution.repository', () => ({
  institutionRepository: {
    findById: jest.fn(),
  },
}));

jest.mock('../../src/repositories/liturgical-day.repository', () => ({
  liturgicalDayRepository: {
    findByPaschalOffset: jest.fn(),
    findBySolarMarker: jest.fn(),
  },
}));

const mockInstitutionFindById = institutionRepository.findById as jest.Mock;
const mockFindByPaschalOffset = liturgicalDayRepository.findByPaschalOffset as jest.Mock;
const mockFindBySolarMarker = liturgicalDayRepository.findBySolarMarker as jest.Mock;

describe('CalendarService', () => {
  let service: CalendarService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CalendarService();
  });

  it('returns localized liturgical context for Ethiopian parishes', async () => {
    mockInstitutionFindById.mockResolvedValue({
      id: 'inst-parish-aa',
      type: InstitutionType.PARISH,
      calendarTradition: CalendarTradition.ETHIOPIAN_TEWAHEDO,
      hierarchyPath: '/inst-patriarchate/inst-archdiocese/inst-parish-aa/',
    });
    mockFindByPaschalOffset.mockResolvedValue(null);
    mockFindBySolarMarker.mockResolvedValue({
      fastingTier: FastingTier.STRICT,
      liturgicalColor: LiturgicalColor.GOLD,
      titleI18n: {
        en: "Apostles' Fast",
        am: 'የሐዋርያት ጾም',
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
      },
    });

    const result = await service.getDailyLiturgicalContext(
      'inst-parish-aa',
      '2026-07-09',
      'am-ET,am;q=0.9,en;q=0.8',
    );

    expect(result.calendars.gregorian).toBe('2026-07-09');
    expect(result.calendars.ethiopic).toBe('2018-11-02');
    expect(result.calendars.julian).toBeUndefined();
    expect(result.fasting.tier).toBe(FastingTier.STRICT);
    expect(result.fasting.title).toBe('የሐዋርያት ጾም');
    expect(result.liturgical.color).toBe(LiturgicalColor.GOLD);
    expect(result.liturgical.readings.gospel).toBe('ማቴዎስ 10:16-22');
    expect(result.meta.calendarTradition).toBe(CalendarTradition.ETHIOPIAN_TEWAHEDO);
    expect(result.meta.locale).toBe('am');

    expect(mockFindBySolarMarker).toHaveBeenCalledWith(
      CalendarTradition.ETHIOPIAN_TEWAHEDO,
      11,
      2,
    );
  });

  it('returns Ge\'ez localized liturgical context when accept-language is gez', async () => {
    mockInstitutionFindById.mockResolvedValue({
      id: 'inst-parish-aa',
      type: InstitutionType.PARISH,
      calendarTradition: CalendarTradition.ETHIOPIAN_TEWAHEDO,
      hierarchyPath: '/inst-patriarchate/inst-archdiocese/inst-parish-aa/',
    });
    mockFindByPaschalOffset.mockResolvedValue(null);
    mockFindBySolarMarker.mockResolvedValue({
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
        gez: {
          epistle: 'ሮሜ 8:28-39',
          gospel: 'ማቴዎስ 10:16-22',
        },
      },
    });

    const result = await service.getDailyLiturgicalContext(
      'inst-parish-aa',
      '2026-07-09',
      'gez',
    );

    expect(result.calendars.gregorian).toBe('2026-07-09');
    expect(result.calendars.ethiopic).toBe('2018-11-02');
    expect(result.fasting.title).toBe('ጾመ ሐዋርያት');
    expect(result.liturgical.readings.gospel).toBe('ማቴዎስ 10:16-22');
    expect(result.meta.locale).toBe('gez');
  });

  it('prefers paschal offset matches over solar markers', async () => {
    mockInstitutionFindById.mockResolvedValue({
      id: 'inst-parish',
      calendarTradition: CalendarTradition.JULIAN_ORTHODOX,
    });
    mockFindByPaschalOffset.mockResolvedValue({
      fastingTier: FastingTier.MODERATE,
      liturgicalColor: LiturgicalColor.PURPLE,
      titleI18n: { en: 'Bright Week' },
      readingsI18n: {
        en: { epistle: 'Acts 1:1-8', gospel: 'John 20:19-31' },
      },
    });

    const result = await service.getDailyLiturgicalContext(
      'inst-parish',
      '2026-07-09',
      'en-US',
    );

    expect(result.fasting.title).toBe('Bright Week');
    expect(result.calendars.julian).toBe('2026-06-26');
    expect(mockFindBySolarMarker).not.toHaveBeenCalled();
  });

  it('falls back to English defaults when no liturgical day is found', async () => {
    mockInstitutionFindById.mockResolvedValue({
      id: 'inst-parish',
      calendarTradition: CalendarTradition.REVISED_JULIAN,
    });
    mockFindByPaschalOffset.mockResolvedValue(null);
    mockFindBySolarMarker.mockResolvedValue(null);

    const result = await service.getDailyLiturgicalContext(
      'inst-parish',
      '2026-07-09',
    );

    expect(result.fasting.tier).toBe(FastingTier.NONE);
    expect(result.fasting.title).toBe('Ordinary Time');
    expect(result.liturgical.color).toBe(LiturgicalColor.WHITE);
    expect(result.liturgical.readings.epistle).toBe('');
  });
});
