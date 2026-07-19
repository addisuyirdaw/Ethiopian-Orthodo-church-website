// src/pages/public/HomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, ChevronRight } from 'lucide-react';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';
import { AnnouncementCard } from '../../components/public/AnnouncementCard';
import { FeastCountdown } from '../../components/public/FeastCountdown';
import { ANNOUNCEMENTS } from '../../data/announcements';
import { UPCOMING_FEASTS, WEEKLY_SCHEDULE } from '../../data/feasts';

// Today's day index (0=Sunday)
function getTodaySchedule() {
  const day = new Date().getDay(); // 0=Sun
  const map = [6, 0, 1, 2, 3, 4, 5]; // map JS getDay to WEEKLY_SCHEDULE index
  return WEEKLY_SCHEDULE[map[day]];
}

const QUICK_SERVICES = [
  { icon: '✝️', label: 'ጥምቀት', to: '/services#baptism' },
  { icon: '💍', label: 'ቅዱስ ጋብቻ', to: '/services#marriage' },
  { icon: '🕊️', label: 'የቀብር ሥርዓት', to: '/services#funeral' },
  { icon: '🙏', label: 'ኑዛዜ', to: '/services#confession' },
  { icon: '📖', label: 'ሰ/ት ቤት', to: '/services#sunday-school' },
  { icon: '✨', label: 'የወጣቶች ኅብረት', to: '/services#youth-fellowship' },
];

export const HomePage: React.FC = () => {
  const pinnedFirst = [...ANNOUNCEMENTS].sort((a, b) =>
    (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)
  ).slice(0, 3);

  const upcomingFeasts = UPCOMING_FEASTS.filter(f => {
    const d = new Date(f.gregorianDate);
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
  }).slice(0, 3);

  const todaySchedule = getTodaySchedule();

  return (
    <div className="min-h-screen pub-bg font-ethiopic">
      <PublicNavbar />

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #1A0F0A 0%, #800020 45%, #4A154B 100%)',
          minHeight: '92vh',
        }}
        aria-label="ዋና ቅስት"
      >
        {/* Decorative rings */}
        <div
          className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #800020, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 flex flex-col items-center justify-center text-center min-h-[92vh] gap-8 py-20">
          {/* Cross emblem */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl border-4 shadow-2xl"
            style={{ borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.12)' }}
          >
            ☩
          </div>

          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border text-xs font-bold uppercase tracking-widest"
            style={{ borderColor: 'rgba(212,175,55,0.4)', color: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.08)' }}
          >
            የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን
          </div>

          {/* Church Name */}
          <h1
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white font-ethiopic leading-tight"
            style={{ textShadow: '0 4px 32px rgba(0,0,0,0.4)' }}
          >
            ደብረ ብርሃን መድኃኔዓለም
            <br />
            <span className="text-gradient-gold">ቤተ ክርስቲያን</span>
          </h1>

          <p className="text-base sm:text-lg max-w-xl text-purple-200 leading-relaxed">
            ቤታችሁ ናት — ጸሎት፣ ምሥጢር፣ ፍቅር እና ሰላም ለሚፈልጉ ሁሉ
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/services"
              className="px-8 py-4 rounded-full font-bold text-base shadow-xl transition-transform hover:-translate-y-1"
              style={{ backgroundColor: '#D4AF37', color: '#1A0F0A' }}
            >
              አገልግሎቶቻችን
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 rounded-full font-bold text-base border-2 transition-all hover:bg-white/10"
              style={{ borderColor: 'rgba(212,175,55,0.5)', color: '#D4AF37' }}
            >
              አድራሻ
            </Link>
          </div>

          {/* Quick contact strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-2">
            {[
              { icon: <Phone className="w-4 h-4" />, text: '+251 11 234 5678' },
              { icon: <Clock className="w-4 h-4" />, text: 'ሰኞ–ቅዳሜ: 3:00–11:00 ኢ.ሰ.' },
              { icon: <MapPin className="w-4 h-4" />, text: 'ቦሌ፣ አዲስ አበባ' },
            ].map(({ icon, text }, i) => (
              <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                <span style={{ color: '#D4AF37' }}>{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #FDFAF5)' }}
        />
      </section>

      {/* ── TODAY'S SERVICES ── */}
      {todaySchedule && (
        <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto" aria-label="የዛሬ አገልግሎቶች">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#D4AF37', fontFamily: 'Inter, sans-serif' }}>
                ዛሬ · {todaySchedule.dayAm}
              </p>
              <h2 className="text-2xl font-bold" style={{ color: '#1A1209' }}>የዛሬ አገልግሎቶች</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {todaySchedule.services.map((svc, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 border flex flex-col gap-2"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D0' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: 'rgba(128,0,32,0.07)' }}
                >
                  ⛪
                </div>
                <p className="font-bold text-base" style={{ color: '#1A1209' }}>{svc.nameAm}</p>
                <p className="text-sm font-medium" style={{ color: '#800020', fontFamily: 'Inter, sans-serif' }}>
                  {svc.timeAm}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── UPCOMING FEASTS ── */}
      <section className="py-12 px-4 sm:px-8" style={{ backgroundColor: '#F5F0E8' }} aria-label="መጪ የበዓል ቀናት">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#D4AF37', fontFamily: 'Inter, sans-serif' }}>
                ቀን መቁጠሪያ
              </p>
              <h2 className="text-2xl font-bold" style={{ color: '#1A1209' }}>መጪ የበዓል ቀናት</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcomingFeasts.map(feast => (
              <FeastCountdown key={feast.id} feast={feast} />
            ))}
          </div>
        </div>
      </section>

      {/* ── QUICK SERVICES ── */}
      <section className="py-12 px-4 sm:px-8" aria-label="ፈጣን አገልግሎቶች">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#D4AF37', fontFamily: 'Inter, sans-serif' }}>
                አገልግሎቶቻችን
              </p>
              <h2 className="text-2xl font-bold" style={{ color: '#1A1209' }}>ምን አገልግሎቶች አለን?</h2>
            </div>
            <Link
              to="/services"
              className="hidden sm:flex items-center gap-1 text-sm font-bold transition hover:underline"
              style={{ color: '#800020' }}
            >
              ሁሉም አገልግሎቶች <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {QUICK_SERVICES.map(svc => (
              <Link
                key={svc.to}
                to={svc.to}
                className="card-lift rounded-2xl border p-4 flex flex-col items-center gap-3 text-center"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D0' }}
              >
                <span className="text-3xl">{svc.icon}</span>
                <span className="text-sm font-bold leading-tight" style={{ color: '#1A1209' }}>
                  {svc.label}
                </span>
              </Link>
            ))}
          </div>
          <Link
            to="/services"
            className="sm:hidden mt-4 flex items-center justify-center gap-1 text-sm font-bold"
            style={{ color: '#800020' }}
          >
            ሁሉም አገልግሎቶች <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── ANNOUNCEMENTS ── */}
      <section className="py-12 px-4 sm:px-8" style={{ backgroundColor: '#F5F0E8' }} aria-label="ማስታወቂያዎች">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#D4AF37', fontFamily: 'Inter, sans-serif' }}>
                ዜናዎች
              </p>
              <h2 className="text-2xl font-bold" style={{ color: '#1A1209' }}>ዘመናዊ ማስታወቂያዎች</h2>
            </div>
            <Link
              to="/announcements"
              className="hidden sm:flex items-center gap-1 text-sm font-bold transition hover:underline"
              style={{ color: '#800020' }}
            >
              ሁሉም ማስታወቂያዎች <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pinnedFirst.map(ann => (
              <AnnouncementCard key={ann.id} announcement={ann} compact />
            ))}
          </div>
          <Link
            to="/announcements"
            className="sm:hidden mt-4 flex items-center justify-center gap-1 text-sm font-bold"
            style={{ color: '#800020' }}
          >
            ሁሉም ማስታወቂያዎች <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── CONTACT STRIP ── */}
      <section
        className="py-14 px-4 sm:px-8"
        style={{ background: 'linear-gradient(135deg, #800020 0%, #4A154B 100%)' }}
        aria-label="አድራሻ"
      >
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">ጥያቄ አለዎ?</h2>
          <p className="text-purple-200 mb-8 text-sm sm:text-base">
            ጽ/ቤቱ ወይም ካህናቱ ዝግጁ ናቸው — ደውሉ ወይም ቢሮ ቀጥታ ቅረቡ
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { icon: <Phone className="w-5 h-5" />, label: 'ስልክ', value: '+251 11 234 5678', href: 'tel:+251112345678' },
              { icon: <Mail className="w-5 h-5" />, label: 'ኢሜይል', value: 'info@kidusmikaeel.et', href: 'mailto:info@kidusmikaeel.et' },
              { icon: <MapPin className="w-5 h-5" />, label: 'አድራሻ', value: 'ቦሌ፣ አዲስ አበባ', href: '/contact' },
            ].map(({ icon, label, value, href }) => (
              <a
                key={label}
                href={href}
                className="flex flex-col items-center gap-2 px-6 py-5 rounded-2xl border transition-all hover:scale-105"
                style={{ borderColor: 'rgba(212,175,55,0.3)', backgroundColor: 'rgba(255,255,255,0.07)', color: '#FFFFFF' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(212,175,55,0.2)', color: '#D4AF37' }}
                >
                  {icon}
                </div>
                <span className="text-xs uppercase tracking-wide opacity-70" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
                <span className="font-bold text-sm">{value}</span>
              </a>
            ))}
          </div>
          <Link
            to="/prayer-request"
            className="mt-8 inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-base shadow-lg transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: '#D4AF37', color: '#1A0F0A' }}
          >
            🙏 የጸሎት ጥያቄ ላክ
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

