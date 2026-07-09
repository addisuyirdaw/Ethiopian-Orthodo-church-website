import {
  calculateOrthodoxPascha,
  calculatePaschalOffset,
  formatIsoDate,
  getEthiopicDate,
  getJulianDate,
  parseIsoDate,
} from '../../src/lib/calendar-utils';

describe('calendar-utils', () => {
  describe('getEthiopicDate', () => {
    it('converts 2026-07-09 to Ethiopic 2018-11-02', () => {
      const result = getEthiopicDate(parseIsoDate('2026-07-09'));

      expect(result.year).toBe(2018);
      expect(result.month).toBe(11);
      expect(result.day).toBe(2);
      expect(result.monthNameAmharic).toBe('ሐምሌ');
    });

    it('handles Pagumēn in a leap Ethiopian year', () => {
      const result = getEthiopicDate(parseIsoDate('2023-09-10'));

      expect(result.year).toBe(2015);
      expect(result.month).toBe(13);
      expect(result.day).toBe(5);
    });
  });

  describe('getJulianDate', () => {
    it('shifts Gregorian date back by 13 days', () => {
      const result = getJulianDate(parseIsoDate('2026-07-09'));

      expect(formatIsoDate(result.year, result.month, result.day)).toBe('2026-06-26');
    });
  });

  describe('calculateOrthodoxPascha', () => {
    it('returns a valid Gregorian pascha date for 2026', () => {
      const pascha = calculateOrthodoxPascha(2026);

      expect(pascha.getUTCFullYear()).toBe(2026);
      expect(pascha.getUTCMonth()).toBeGreaterThanOrEqual(3);
      expect(pascha.getUTCMonth()).toBeLessThanOrEqual(4);
    });
  });

  describe('calculatePaschalOffset', () => {
    it('returns zero on pascha and positive values after pascha', () => {
      const pascha = calculateOrthodoxPascha(2026);
      const offsetOnPascha = calculatePaschalOffset(pascha, pascha);

      expect(offsetOnPascha).toBe(0);

      const dayAfter = new Date(
        Date.UTC(
          pascha.getUTCFullYear(),
          pascha.getUTCMonth(),
          pascha.getUTCDate() + 1,
        ),
      );
      expect(calculatePaschalOffset(dayAfter, pascha)).toBe(1);
    });
  });
});
