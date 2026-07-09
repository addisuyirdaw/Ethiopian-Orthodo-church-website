export interface EthiopicDate {
  year: number;
  month: number;
  day: number;
  monthNameAmharic: string;
}

export interface JulianDate {
  year: number;
  month: number;
  day: number;
}

const ETHIOPIAN_MONTHS_AMHARIC = [
  'መስከረም',
  'ጥቅምት',
  'ኅዳር',
  'ታኅሣሥ',
  'ጥር',
  'የካቲት',
  'መጋቢት',
  'ሚያዝያ',
  'ግንቦት',
  'ሰኔ',
  'ሐምሌ',
  'ነሐሴ',
  'ጳጉሜን',
] as const;

const MS_PER_DAY = 86_400_000;

export function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function isEthiopianLeapYear(year: number): boolean {
  return year % 4 === 3;
}

function ethiopianNewYearGregorian(ethiopianYear: number): Date {
  const gregorianYear = ethiopianYear + 7;
  const day = isGregorianLeapYear(gregorianYear) ? 12 : 11;
  return new Date(Date.UTC(gregorianYear, 8, day));
}

function daysBetweenUtc(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY);
}

function padTwo(value: number): string {
  return value.toString().padStart(2, '0');
}

export function formatIsoDate(year: number, month: number, day: number): string {
  return `${year}-${padTwo(month)}-${padTwo(day)}`;
}

export function getEthiopicDate(gregorianDate: Date): EthiopicDate {
  const gYear = gregorianDate.getUTCFullYear();
  const gMonth = gregorianDate.getUTCMonth() + 1;
  const gDay = gregorianDate.getUTCDate();
  const newYearDay = isGregorianLeapYear(gYear) ? 12 : 11;

  const ethiopianYear =
    gMonth > 9 || (gMonth === 9 && gDay >= newYearDay) ? gYear - 7 : gYear - 8;

  const newYearDate = ethiopianNewYearGregorian(ethiopianYear);
  const targetDate = new Date(Date.UTC(gYear, gMonth - 1, gDay));
  const dayOfYear = daysBetweenUtc(newYearDate, targetDate) + 1;

  let month: number;
  let day: number;

  if (dayOfYear <= 360) {
    month = Math.ceil(dayOfYear / 30);
    day = ((dayOfYear - 1) % 30) + 1;
  } else {
    month = 13;
    day = dayOfYear - 360;
    const maxPagumen = isEthiopianLeapYear(ethiopianYear) ? 6 : 5;
    if (day > maxPagumen) {
      throw new Error('Invalid Ethiopic date: Pagumēn overflow.');
    }
  }

  return {
    year: ethiopianYear,
    month,
    day,
    monthNameAmharic: ETHIOPIAN_MONTHS_AMHARIC[month - 1],
  };
}

export function getJulianDate(gregorianDate: Date): JulianDate {
  const shifted = new Date(
    Date.UTC(
      gregorianDate.getUTCFullYear(),
      gregorianDate.getUTCMonth(),
      gregorianDate.getUTCDate() - 13,
    ),
  );

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/**
 * Meeus Julian Easter algorithm, converted to Gregorian by adding the
 * 20th/21st-century +13 day gap used across Orthodox jurisdictions.
 */
export function calculateOrthodoxPascha(year: number): Date {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const julianMonth = Math.floor((d + e + 114) / 31);
  const julianDay = ((d + e + 114) % 31) + 1;

  const pascha = new Date(Date.UTC(year, julianMonth - 1, julianDay + 13));
  return pascha;
}

export function calculatePaschalOffset(targetDate: Date, paschaDate: Date): number {
  const normalizedTarget = new Date(
    Date.UTC(
      targetDate.getUTCFullYear(),
      targetDate.getUTCMonth(),
      targetDate.getUTCDate(),
    ),
  );
  const normalizedPascha = new Date(
    Date.UTC(
      paschaDate.getUTCFullYear(),
      paschaDate.getUTCMonth(),
      paschaDate.getUTCDate(),
    ),
  );

  return daysBetweenUtc(normalizedPascha, normalizedTarget);
}

export function parseIsoDate(isoDate: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    throw new Error(`Invalid ISO date format: ${isoDate}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return new Date(Date.UTC(year, month - 1, day));
}
