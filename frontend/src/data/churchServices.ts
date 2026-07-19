// src/data/churchServices.ts
// Static service definitions for Phase 1 public website

export interface ServiceDocument {
  name: string;
  required: boolean;
}

export interface ChurchService {
  id: string;
  icon: string;
  titleAm: string;
  titleEn: string;
  descriptionAm: string;
  whoCanRequestAm: string;
  documents: ServiceDocument[];
  officeAm: string;
  officeHoursAm: string;
  processingTimeAm: string;
  color: string;
}

export const CHURCH_SERVICES: ChurchService[] = [
  {
    id: 'baptism',
    icon: '✝️',
    titleAm: 'ጥምቀት',
    titleEn: 'Baptism',
    descriptionAm: 'ጥምቀት የክርስቲያን ሕይወት ጅማሮ ነው። አዲስ የተወለደ ሕፃን ወደ ቤተ ክርስቲያን ለመቀበል የሚከናወን ቅዱስ ምስጢር ነው።',
    whoCanRequestAm: 'ወላጆቻቸው ኦርቶዶክስ ክርስቲያን የሆኑ ሕፃናት ወይም አዲስ አማኞች',
    documents: [
      { name: 'የልደት ምስክር ወረቀት', required: true },
      { name: 'የወላጆች መታወቂያ', required: true },
      { name: 'የቤተ ክርስቲያን አባልነት ማረጋገጫ', required: false },
      { name: 'ካዝናፍሬ (አምሳ ብር)', required: true },
    ],
    officeAm: 'የካህናት ጽ/ቤት',
    officeHoursAm: 'ሰኞ – ቅዳሜ: ከ3:00 – 11:00 (ኢትዮጵያ ሰዓት)',
    processingTimeAm: 'ከ2–3 ቀናት',
    color: '#1a6b9e',
  },
  {
    id: 'marriage',
    icon: '💍',
    titleAm: 'ቅዱስ ጋብቻ',
    titleEn: 'Marriage',
    descriptionAm: 'ቅዱስ ጋብቻ በቤተ ክርስቲያን ፊት የሚፈጸም ቅዱስ ምስጢር ሲሆን ሁለቱ ተጋቢዎች በፍቅርና በእምነት ሕይወታቸውን ያዋህዳሉ።',
    whoCanRequestAm: 'ሁለቱም ኦርቶዶክስ ክርስቲያን የሆኑ ወጣቶች (ወንድ ከ20 ዓ.ዕ. ሴት ከ18 ዓ.ዕ. በላይ)',
    documents: [
      { name: 'የጥምቀት ምስክር ወረቀት (ለሁለቱም)', required: true },
      { name: 'ኦርጅናል መታወቂያ', required: true },
      { name: 'ካዝናፍሬ', required: true },
      { name: 'ሁለት ፎቶ ግራፍ', required: true },
      { name: 'ከቀደምት ጋብቻ ነፃ መሆናቸውን የሚያረጋግጥ ሰነድ', required: false },
    ],
    officeAm: 'የካህናት ጽ/ቤት',
    officeHoursAm: 'ሰኞ – ቅዳሜ: ከ3:00 – 11:00 (ኢትዮጵያ ሰዓት)',
    processingTimeAm: 'ቀጠሮ ቢያንስ ከ1 ወር አስቀድሞ',
    color: '#8b2252',
  },
  {
    id: 'funeral',
    icon: '🕊️',
    titleAm: 'የቀብር ሥርዓት',
    titleEn: 'Funeral',
    descriptionAm: 'ቤተ ክርስቲያን ለህልፈቱ ምዕመን የቀብር ጸሎትና ሥርዓት ታደርጋለች። ነፍሱ ዕረፍት ይሁን።',
    whoCanRequestAm: 'የህልፈቱ ምዕምን ቤተሰቦች',
    documents: [
      { name: 'የሞት ምስክር ወረቀት', required: true },
      { name: 'የቤተ ክርስቲያን አባልነት ማረጋገጫ', required: false },
    ],
    officeAm: 'የካህናት ጽ/ቤት — አስቸኳይ',
    officeHoursAm: '24 ሰዓት ዝግጁ ነን። ለድንገተኛ ደውሉ።',
    processingTimeAm: 'ወዲያውኑ — ከ24 ሰዓት ውስጥ',
    color: '#4a4a4a',
  },
  {
    id: 'confession',
    icon: '🙏',
    titleAm: 'ኑዛዜ',
    titleEn: 'Confession',
    descriptionAm: 'ኑዛዜ (ካህናት ዘንድ ምስጢር መናዘዝ) ለምዕምናን ከኃጢአት ሸካፊ የሆነ ቅዱስ ምስጢር ነው።',
    whoCanRequestAm: 'ሁሉም ኦርቶዶክስ ምዕምናን',
    documents: [],
    officeAm: 'ሊቀ ካህናት ጽ/ቤት',
    officeHoursAm: 'ቅዳሜ: ከ11:00 – 5:00 (ኢ.ሰ.) | ቀደምት ቀን: ከ9:00 – 11:00',
    processingTimeAm: 'ቀጠሮ ሳያስፈልግ',
    color: '#5a3e82',
  },
  {
    id: 'communion',
    icon: '🍷',
    titleAm: 'ቅዱስ ቁርባን',
    titleEn: 'Holy Communion',
    descriptionAm: 'ቅዱስ ቁርባን (ቁርባን) ወደ ጌታ አካልና ደም የሚቀርብ የክርስቲያናት ዋነኛ ምስጢር ነው።',
    whoCanRequestAm: 'ኑዛዜ የፈጸሙ ሁሉም ኦርቶዶክስ ምዕምናን',
    documents: [],
    officeAm: 'ቅዳሴ ጊዜ (ቤተ ክርስቲያን ውስጥ)',
    officeHoursAm: 'እሁድ: ከ2:00 – 3:00 (ኢ.ሰ.) | ዋዜማ: ከ6:00 – 4:00',
    processingTimeAm: 'ምንም ሰነድ አያስፈልግም — ቅዳሴ ላይ ቅረቡ',
    color: '#800020',
  },
  {
    id: 'sunday-school',
    icon: '📖',
    titleAm: 'ሰንበት ትምህርት ቤት',
    titleEn: 'Sunday School',
    descriptionAm: 'ሰንበት ትምህርት ቤት ለሕፃናት እና ወጣቶች የሃይማኖት፣ ሥርዓት፣ እና ዜማ ትምህርት የሚሰጥበት ቦታ ነው።',
    whoCanRequestAm: 'ዕድሜያቸው 5–18 ዓ.ዕ. ያሉ ልጆች',
    documents: [
      { name: 'የልደት ምስክር ወረቀት', required: false },
      { name: 'ወላጅ/አሳዳጊ ስምምነት ቅጽ', required: true },
    ],
    officeAm: 'ሰ/ት ቤት ጽ/ቤት',
    officeHoursAm: 'እሁድ: ከ5:00 – 11:00 (ኢ.ሰ.)',
    processingTimeAm: 'ወዲያውኑ ይቀበሉዎታል',
    color: '#2d7a4e',
  },
  {
    id: 'youth-fellowship',
    icon: '✨',
    titleAm: 'የወጣቶች ኅብረት',
    titleEn: 'Youth Fellowship',
    descriptionAm: 'የወጣቶች ኅብረት ወጣቶችን ያሰባስባል — ጸሎት፣ ጥናት፣ አገልግሎት፣ ወዳጅነት።',
    whoCanRequestAm: 'ዕድሜያቸው 15–35 ዓ.ዕ. ያሉ ወጣቶች',
    documents: [
      { name: 'የጥምቀት ምስክር ወረቀት', required: false },
    ],
    officeAm: 'የወጣቶች ኅብረት ጽ/ቤት',
    officeHoursAm: 'ቅዳሜ: ከ5:00 – 11:00 (ኢ.ሰ.)',
    processingTimeAm: 'ወዲያውኑ ይቀበሉዎታል',
    color: '#c47a1e',
  },
];
