// src/data/feasts.ts
// Ethiopian Orthodox Tewahedo Church feast calendar
// Dates are approximate Gregorian equivalents for 2016–2017 EE

export interface Feast {
  id: string;
  nameAm: string;
  nameEn: string;
  ethiopicDate: string; // e.g. "ጥር 11"
  gregorianDate: string; // ISO date
  descriptionAm: string;
  isMajor: boolean;
  icon: string;
}

export const UPCOMING_FEASTS: Feast[] = [
  {
    id: 'kidus-mikael-july',
    nameAm: 'ቅዱስ ሚካኤል',
    nameEn: 'St. Michael (Archangel)',
    ethiopicDate: 'ሐምሌ 12',
    gregorianDate: '2026-07-19',
    descriptionAm: 'ለአልተከብሮ ቅዱስ ሚካኤል ዓ/ም በዓሉ ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን ይካወናላል።',
    isMajor: false,
    icon: '😇',
  },
  {
    id: 'neakuto-leab',
    nameAm: 'ቅዱስ ነአኩቶ ለዓብ',
    nameEn: 'Neakuto Le\'ab',
    ethiopicDate: 'ሐምሌ 23',
    gregorianDate: '2026-07-30',
    descriptionAm: 'ቅዱስ ነአኩቶ ለዓብ መታሰቢያ ቀን።',
    isMajor: false,
    icon: '✝️',
  },
  {
    id: 'buhe',
    nameAm: 'ቡሄ (ደብረ ታቦር)',
    nameEn: 'Buhe (Transfiguration)',
    ethiopicDate: 'ነሐሴ 13',
    gregorianDate: '2026-08-19',
    descriptionAm:
      'ጌታ ኢየሱስ ክርስቶስ በደብረ ታቦር ተራራ ላይ መለወጡን ለማስታወስ የሚከበር ዓ/ም በዓል ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን ይከበራል።',
    isMajor: true,
    icon: '⛰️',
  },
  {
    id: 'lideta',
    nameAm: 'ልደታ ለማርያም',
    nameEn: 'Birth of St. Mary',
    ethiopicDate: 'ነሐሴ 1',
    gregorianDate: '2026-09-07',
    descriptionAm:
      'እናታችን ቅድስት ድንግል ማርያም ልደቷ ታስቦ የሚከበር ታላቅ የቤተ ክርስቲያን በዓል ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን ይከበራል።',
    isMajor: true,
    icon: '👑',
  },
  {
    id: 'meskel',
    nameAm: 'መስቀል',
    nameEn: 'Finding of the True Cross',
    ethiopicDate: 'መስከረም 17',
    gregorianDate: '2026-09-27',
    descriptionAm:
      'ንግሥት ሕሌኒ ቅዱሱን መስቀል ያገኘችበት ቀን። ትልቅ ሀገር አቀፍ በዓል ሲሆን ደመራ ይቃጠልበታል በደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን ይከበራል።',
    isMajor: true,
    icon: '🔥',
  },
  {
    id: 'kidus-mikael-oct',
    nameAm: 'ቅዱስ ሚካኤል',
    nameEn: 'St. Michael (Archangel)',
    ethiopicDate: 'ጥቅምት 12',
    gregorianDate: '2026-10-22',
    descriptionAm: 'ለአልተከብሮ ቅዱስ ሚካኤል ወር በዓሉ ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን ይካወናላል።',
    isMajor: false,
    icon: '😇',
  },
];

// Weekly schedule
export interface DailySchedule {
  dayAm: string;
  dayEn: string;
  services: { timeAm: string; nameAm: string }[];
}

export const WEEKLY_SCHEDULE: DailySchedule[] = [
  {
    dayAm: 'ሰኞ',
    dayEn: 'Monday',
    services: [
      { timeAm: '2:00 – 4:00 (ኢ.ሰ.)', nameAm: 'ጠዋት ጸሎት' },
      { timeAm: '11:00 – 1:00 (ኢ.ሰ.)', nameAm: 'ቀን ጸሎት' },
    ],
  },
  {
    dayAm: 'ማክሰኞ',
    dayEn: 'Tuesday',
    services: [
      { timeAm: '2:00 – 4:00 (ኢ.ሰ.)', nameAm: 'ጠዋት ጸሎት' },
    ],
  },
  {
    dayAm: 'ረቡዕ',
    dayEn: 'Wednesday',
    services: [
      { timeAm: '2:00 – 4:00 (ኢ.ሰ.)', nameAm: 'ጠዋት ጸሎት' },
      { timeAm: '4:00 – 6:00 (ኢ.ሰ.)', nameAm: 'ጾምና ጸሎት' },
    ],
  },
  {
    dayAm: 'ሐሙስ',
    dayEn: 'Thursday',
    services: [
      { timeAm: '2:00 – 4:00 (ኢ.ሰ.)', nameAm: 'ጠዋት ጸሎት' },
    ],
  },
  {
    dayAm: 'ዓርብ',
    dayEn: 'Friday',
    services: [
      { timeAm: '2:00 – 6:00 (ኢ.ሰ.)', nameAm: 'ጸሎተ ሰዓታት' },
    ],
  },
  {
    dayAm: 'ቅዳሜ',
    dayEn: 'Saturday',
    services: [
      { timeAm: '12:00 ሌሊት', nameAm: 'ሰርክ ጸሎት' },
      { timeAm: '1:00 – 5:00 (ኢ.ሰ.)', nameAm: 'ሌሊት ጸሎት / ቅዳሴ' },
      { timeAm: '5:00 – 11:00 (ኢ.ሰ.)', nameAm: 'ሰ/ት ቤት' },
    ],
  },
  {
    dayAm: 'እሑድ',
    dayEn: 'Sunday',
    services: [
      { timeAm: '12:00 ሌሊት', nameAm: 'ሰርክ ጸሎት' },
      { timeAm: '1:00 – 6:00 (ኢ.ሰ.)', nameAm: 'ቅዳሴ' },
      { timeAm: '4:00 – 6:00 (ኢ.ሰ.)', nameAm: 'ቀን ጸሎት' },
      { timeAm: '6:00 – 11:00 (ኢ.ሰ.)', nameAm: 'ሰ/ት ቤት' },
    ],
  },
];

