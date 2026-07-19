/**
 * Ethiopian ↔ Gregorian calendar conversion utilities.
 * Handles 13th month (Pagume) and leap years.
 */

/**
 * Convert Ethiopian date (day, month 1-13, year) to a JavaScript Date (UTC).
 * Returns a Date object representing the equivalent Gregorian date.
 */
export function ethiopianToGregorian(day: number, month: number, year: number): Date {
  if (month < 1 || month > 13) throw new Error('Ethiopian month must be 1-13');
  const maxDay = month === 13 ? (isEthiopianLeapYear(year) ? 6 : 5) : 30;
  if (day < 1 || day > maxDay) throw new Error('Invalid day for the given Ethiopian month');

  // Algorithm: convert Ethiopian date to Julian Day Number, then to Gregorian.
  const jdn =
    1723856 + // JDN for 1/1/1 Gregorian
    365 * (year - 1) +
    Math.floor(year / 4) +
    30 * (month - 1) +
    day -
    1;

  // Conversion from JDN to Gregorian date (Meeus' algorithm)
  const r = jdn + 68569;
  const n = Math.floor((4 * r) / 146097);
  const r2 = r - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (r2 + 1)) / 1461001);
  const r3 = r2 - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * r3) / 2447);
  const dayG = r3 - Math.floor((2447 * j) / 80);
  const r4 = Math.floor(j / 11);
  const monthG = j + 2 - 12 * r4;
  const yearG = 100 * (n - 49) + i + r4;

  return new Date(Date.UTC(yearG, monthG - 1, dayG));
}

/**
 * Convert a Gregorian Date to an Ethiopian date string "DD/MM/YYYY".
 */
export function gregorianToEthiopian(date: Date): string {
  const yearG = date.getUTCFullYear();
  const monthG = date.getUTCMonth() + 1; // 1‑based
  const dayG = date.getUTCDate();

  // Determine Ethiopian year.
  const ethiopianYear = monthG < 9 || (monthG === 9 && dayG < 11) ? yearG - 8 : yearG - 7;

  // Start of Ethiopian year in Gregorian calendar (Sept 11 or 12).
  const startGregorian = new Date(Date.UTC(ethiopianYear + 7, 8, 11)); // 11 Sep
  const diffDays = Math.floor((date.getTime() - startGregorian.getTime()) / 86400000);
  const monthE = Math.floor(diffDays / 30) + 1;
  const dayE = (diffDays % 30) + 1;

  return `${dayE.toString().padStart(2, '0')}/${monthE
    .toString()
    .padStart(2, '0')}/${ethiopianYear}`;
}

/**
 * Determine if an Ethiopian year is a leap year.
 * Leap year every 4 years without exception.
 */
export function isEthiopianLeapYear(year: number): boolean {
  return year % 4 === 3; // Ethiopian calendar: year before Gregorian leap year
}
