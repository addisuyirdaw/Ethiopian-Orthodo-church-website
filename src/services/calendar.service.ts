import { CalendarTradition, FastingTier, LiturgicalColor } from '@prisma/client';
import {
  calculateOrthodoxPascha,
  calculatePaschalOffset,
  formatIsoDate,
  getEthiopicDate,
  getJulianDate,
  parseIsoDate,
} from '../lib/calendar-utils';
import { NotFoundError } from '../middleware/error-handler.middleware';
import { institutionRepository } from '../repositories/institution.repository';
import { liturgicalDayRepository } from '../repositories/liturgical-day.repository';
import {
  DailyLiturgicalContext,
  LocalizedReadings,
  ReadingsI18n,
  TitleI18n,
} from '../types/liturgical';

const DEFAULT_LOCALE = 'en';

const DEFAULT_CONTEXT: Omit<DailyLiturgicalContext, 'calendars' | 'meta'> = {
  fasting: {
    tier: FastingTier.NONE,
    title: 'Ordinary Time',
  },
  liturgical: {
    color: LiturgicalColor.WHITE,
    readings: {
      epistle: '',
      gospel: '',
    },
  },
};

function resolveLocale(acceptLanguageHeader?: string): string {
  if (!acceptLanguageHeader) {
    return DEFAULT_LOCALE;
  }

  const primary = acceptLanguageHeader.split(',')[0]?.trim().toLowerCase() ?? DEFAULT_LOCALE;
  const languageCode = primary.split('-')[0] ?? DEFAULT_LOCALE;
  return languageCode || DEFAULT_LOCALE;
}

function resolveLocalizedTitle(titleI18n: TitleI18n, locale: string): string {
  return (
    titleI18n[locale] ??
    titleI18n[DEFAULT_LOCALE] ??
    Object.values(titleI18n)[0] ??
    DEFAULT_CONTEXT.fasting.title
  );
}

function resolveLocalizedReadings(readingsI18n: ReadingsI18n, locale: string): LocalizedReadings {
  const localized =
    readingsI18n[locale] ??
    readingsI18n[DEFAULT_LOCALE] ??
    Object.values(readingsI18n)[0];

  return localized ?? DEFAULT_CONTEXT.liturgical.readings;
}

function resolveSolarMarkers(
  calendarTradition: CalendarTradition,
  gregorianDate: Date,
): { solarMonth: number; solarDay: number } {
  if (calendarTradition === CalendarTradition.ETHIOPIAN_TEWAHEDO) {
    const ethiopic = getEthiopicDate(gregorianDate);
    return { solarMonth: ethiopic.month, solarDay: ethiopic.day };
  }

  const julian = getJulianDate(gregorianDate);
  return { solarMonth: julian.month, solarDay: julian.day };
}

export class CalendarService {
  async getDailyLiturgicalContext(
    institutionId: string,
    targetDateIso: string,
    acceptLanguageHeader?: string,
  ): Promise<DailyLiturgicalContext> {
    const institution = await institutionRepository.findById(institutionId);
    if (!institution) {
      throw new NotFoundError('Institution not found.');
    }

    const locale = resolveLocale(acceptLanguageHeader);
    const targetDate = parseIsoDate(targetDateIso);
    const gregorianYear = targetDate.getUTCFullYear();
    const paschaDate = calculateOrthodoxPascha(gregorianYear);
    const paschalOffset = calculatePaschalOffset(targetDate, paschaDate);
    const { solarMonth, solarDay } = resolveSolarMarkers(
      institution.calendarTradition,
      targetDate,
    );

    const liturgicalDay =
      (await liturgicalDayRepository.findByPaschalOffset(
        institution.calendarTradition,
        paschalOffset,
      )) ??
      (await liturgicalDayRepository.findBySolarMarker(
        institution.calendarTradition,
        solarMonth,
        solarDay,
      ));

    const ethiopic = getEthiopicDate(targetDate);
    const julian = getJulianDate(targetDate);

    const calendars: DailyLiturgicalContext['calendars'] = {
      gregorian: formatIsoDate(
        gregorianYear,
        targetDate.getUTCMonth() + 1,
        targetDate.getUTCDate(),
      ),
      ethiopic: formatIsoDate(ethiopic.year, ethiopic.month, ethiopic.day),
    };

    if (institution.calendarTradition !== CalendarTradition.ETHIOPIAN_TEWAHEDO) {
      calendars.julian = formatIsoDate(julian.year, julian.month, julian.day);
    }

    if (!liturgicalDay) {
      return {
        calendars,
        fasting: {
          ...DEFAULT_CONTEXT.fasting,
          title: resolveLocalizedTitle(
            { en: DEFAULT_CONTEXT.fasting.title },
            locale,
          ),
        },
        liturgical: DEFAULT_CONTEXT.liturgical,
        meta: {
          institutionId,
          calendarTradition: institution.calendarTradition,
          paschalOffset,
          locale,
        },
      };
    }

    const titleI18n = liturgicalDay.titleI18n as TitleI18n;
    const readingsI18n = liturgicalDay.readingsI18n as ReadingsI18n;

    return {
      calendars,
      fasting: {
        tier: liturgicalDay.fastingTier,
        title: resolveLocalizedTitle(titleI18n, locale),
      },
      liturgical: {
        color: liturgicalDay.liturgicalColor,
        readings: resolveLocalizedReadings(readingsI18n, locale),
      },
      meta: {
        institutionId,
        calendarTradition: institution.calendarTradition,
        paschalOffset,
        locale,
      },
    };
  }
}

export const calendarService = new CalendarService();
