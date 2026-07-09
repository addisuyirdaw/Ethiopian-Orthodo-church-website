import { CalendarTradition, LiturgicalDay, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

export interface LiturgicalDayLookup {
  calendarTradition: CalendarTradition;
  paschalOffset?: number;
  solarMonth?: number;
  solarDay?: number;
}

export class LiturgicalDayRepository {
  async findByPaschalOffset(
    calendarTradition: CalendarTradition,
    paschalOffset: number,
  ): Promise<LiturgicalDay | null> {
    return prisma.liturgicalDay.findFirst({
      where: {
        calendarTradition,
        paschalOffset,
        deletedAt: null,
      },
    });
  }

  async findBySolarMarker(
    calendarTradition: CalendarTradition,
    solarMonth: number,
    solarDay: number,
  ): Promise<LiturgicalDay | null> {
    return prisma.liturgicalDay.findFirst({
      where: {
        calendarTradition,
        solarMonth,
        solarDay,
        deletedAt: null,
      },
    });
  }

  async create(data: Prisma.LiturgicalDayCreateInput): Promise<LiturgicalDay> {
    return prisma.liturgicalDay.create({ data });
  }
}

export const liturgicalDayRepository = new LiturgicalDayRepository();
