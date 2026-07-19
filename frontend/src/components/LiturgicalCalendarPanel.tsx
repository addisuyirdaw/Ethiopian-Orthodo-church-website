// src/components/LiturgicalCalendarPanel.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Calendar as CalendarIcon, BookOpen, RefreshCw, AlertTriangle } from 'lucide-react';

const ETHIOPIAN_MONTHS = {
  am: ['መስከረም', 'ጥቅምት', 'ሕዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን'],
  en: ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Ter', 'Yekatit', 'Megabit', 'Miyazya', 'Genbot', 'Sene', 'Hamle', 'Nehase', 'Pagumen']
};

const FASTING_CONFIG = {
  NONE: { icon: '🍽️', title: 'Ordinary Time / ተራ ጊዜ', badgeClass: 'bg-green-500/20 text-green-400 border-green-500/30' },
  STRICT: { icon: '🥖', title: 'Strict Fast / ጥብቅ ጾም', badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30' },
  MODERATE: { icon: '🥗', title: 'Moderate Fast / መካከለኛ ጾም', badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  WINE_OIL: { icon: '🍷', title: 'Wine & Oil Permitted / ወይን እና ዘይት', badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  FISH_ALLOWED: { icon: '🐟', title: 'Fish Allowed / ዓሣ ይፈቀዳል', badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
};

const LITURGICAL_COLOR_MAP: Record<string, string> = {
  WHITE: '#ffffff',
  RED: '#ef4444',
  GOLD: '#D4AF37',
  GREEN: '#2ecc71',
  PURPLE: '#a855f7',
  BLUE: '#3b82f6',
  DARK: '#374151'
};

export const LiturgicalCalendarPanel: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [calData, setCalData] = useState<any>(null);

  const fetchCalendar = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/calendar/today?date=${selectedDate}`);
      setCalData(res.data.data || res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not fetch liturgical schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [selectedDate]);

  const getEthDateString = (ethDateStr: string) => {
    if (!ethDateStr) return '—';
    const parts = ethDateStr.split('-');
    if (parts.length < 3) return ethDateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const monthNameAm = ETHIOPIAN_MONTHS.am[month - 1] || '';
    const monthNameEn = ETHIOPIAN_MONTHS.en[month - 1] || '';
    return `${monthNameAm} ${day} ቀን ${year} ዓ.ም. (${monthNameEn} ${day}, ${year})`;
  };

  const fasting = calData?.fasting?.tier || 'NONE';
  const fConfig = FASTING_CONFIG[fasting as keyof typeof FASTING_CONFIG] || FASTING_CONFIG.NONE;

  return (
    <div className="rounded-xl border p-6 shadow-md" style={{ backgroundColor: 'var(--eotc-surface)', borderColor: 'var(--eotc-border)' }}>
      <div className="flex justify-between items-center border-b pb-4 mb-6" style={{ borderColor: 'var(--eotc-border)' }}>
        <h3 className="font-serif font-extrabold text-lg flex items-center gap-2" style={{ color: 'var(--eotc-gold)' }}>
          <CalendarIcon className="w-5 h-5" />
          Liturgical Calendar & Converter — ዕለታዊ ቅዳሴ ቀን
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-xs bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
            style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
          />
          <button
            onClick={fetchCalendar}
            className="p-2 border rounded-lg hover:bg-white/5 transition cursor-pointer"
            style={{ borderColor: 'var(--eotc-border)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--eotc-gold)' }} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border flex items-center gap-2 text-xs mb-4" style={{ backgroundColor: 'rgba(231,76,60,0.08)', borderColor: 'rgba(231,76,60,0.3)', color: '#e74c3c' }}>
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--eotc-gold)', borderTopColor: 'transparent' }} />
          <span className="text-xs opacity-60">Querying Holy Synod Calendar...</span>
        </div>
      ) : calData ? (
        <div className="space-y-6">
          {/* Fasting Banner */}
          <div className="p-4 rounded-xl border flex items-center gap-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'var(--eotc-border)' }}>
            <span className="text-3xl">{fConfig.icon}</span>
            <div>
              <div className="text-[9px] uppercase tracking-wider opacity-60">Current Fasting Tier</div>
              <h4 className="text-base font-bold font-serif text-white">{calData.fasting?.title || fConfig.title}</h4>
              <span className={`inline-block border px-2 py-0.5 rounded text-[10px] font-bold mt-1 uppercase ${fConfig.badgeClass}`}>
                {fasting}
              </span>
            </div>
          </div>

          {/* Date Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-black/20" style={{ borderColor: 'var(--eotc-border)' }}>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Gregorian Calendar</span>
              <span className="text-sm font-bold text-white">{calData.calendars?.gregorian || '—'}</span>
            </div>
            <div className="p-4 rounded-lg border bg-black/20" style={{ borderColor: 'var(--eotc-border)' }}>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Ethiopic Calendar (ዘመን)</span>
              <span className="text-sm font-bold font-serif" style={{ color: 'var(--eotc-gold)' }}>
                {getEthDateString(calData.calendars?.ethiopic)}
              </span>
            </div>
            <div className="p-4 rounded-lg border bg-black/20" style={{ borderColor: 'var(--eotc-border)' }}>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Julian Calendar</span>
              <span className="text-sm font-bold text-white">{calData.calendars?.julian || '—'}</span>
            </div>
          </div>

          {/* Readings and Liturgical details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Readings */}
            <div className="p-5 rounded-xl border bg-black/15 space-y-4" style={{ borderColor: 'var(--eotc-border)' }}>
              <h4 className="text-xs uppercase tracking-widest font-black flex items-center gap-1.5" style={{ color: 'var(--eotc-gold)' }}>
                <BookOpen className="w-3.5 h-3.5" />
                ✦ Daily Appointed Readings — ዕለታዊ ምንባባት
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold opacity-60 block mb-0.5">Epistle (የሐዋርያት መልእክት)</span>
                  <span className="text-white bg-black/30 p-2 rounded block border" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    {calData.liturgical?.readings?.epistle || '—'}
                  </span>
                </div>
                <div>
                  <span className="font-bold opacity-60 block mb-0.5">Gospel (ቅዱስ ወንጌል)</span>
                  <span className="text-white bg-black/30 p-2 rounded block border" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    {calData.liturgical?.readings?.gospel || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Liturgical Colors & Accents */}
            <div className="p-5 rounded-xl border bg-black/15 flex flex-col justify-between" style={{ borderColor: 'var(--eotc-border)' }}>
              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-widest font-black" style={{ color: 'var(--eotc-gold)' }}>
                  Liturgical Color & Vestments
                </h4>
                <div className="flex items-center gap-2">
                  <span 
                    className="w-4 h-4 rounded-full border shadow-md inline-block" 
                    style={{ 
                      backgroundColor: LITURGICAL_COLOR_MAP[calData.liturgical?.color || 'WHITE'], 
                      borderColor: 'rgba(212,175,55,0.4)',
                      boxShadow: `0 0 10px ${LITURGICAL_COLOR_MAP[calData.liturgical?.color || 'WHITE']}` 
                    }} 
                  />
                  <span className="text-xs font-bold">
                    Appointed Color: <span style={{ color: 'var(--eotc-gold)' }}>{calData.liturgical?.color || 'WHITE'}</span>
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed opacity-70">
                  Vestments matching the canonical color scheme should be prepared and used during the Divine Liturgy (ቅዳሴ) and services for this day.
                </p>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <p className="text-xs opacity-60 text-center py-6">Select a date to fetch canonical calendar details.</p>
      )}
    </div>
  );
};
