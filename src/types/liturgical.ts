import { CalendarTradition, FastingTier, LiturgicalColor } from '@prisma/client';

export interface LocalizedReadings {
  epistle: string;
  gospel: string;
}

export interface DailyLiturgicalContext {
  calendars: {
    gregorian: string;
    ethiopic: string;
    julian?: string;
  };
  fasting: {
    tier: FastingTier;
    title: string;
  };
  liturgical: {
    color: LiturgicalColor;
    readings: LocalizedReadings;
  };
  meta: {
    institutionId: string;
    calendarTradition: CalendarTradition;
    paschalOffset: number;
    locale: string;
  };
}

export type TitleI18n = Partial<Record<string, string>>;
export type ReadingsI18n = Partial<Record<string, LocalizedReadings>>;
