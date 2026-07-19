// src/pages/public/ContactPage.tsx
import React from 'react';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';
import { Phone, Mail, MapPin, Clock, ExternalLink } from 'lucide-react';

const OFFICE_HOURS = [
  { day: 'ሰኞ', time: '3:00 – 11:00 (ኢ.ሰ.)', note: '' },
  { day: 'ማክሰኞ', time: '3:00 – 11:00 (ኢ.ሰ.)', note: '' },
  { day: 'ረቡዕ', time: '3:00 – 11:00 (ኢ.ሰ.)', note: 'ጾም ቀን' },
  { day: 'ሐሙስ', time: 'ዝግ (6:00–9:00 ሰዓት)', note: 'ዝግ ቀን' },
  { day: 'ዓርብ', time: '3:00 – 10:00 (ኢ.ሰ.)', note: 'ዐቢይ ጾም' },
  { day: 'ቅዳሜ', time: '3:00 – 1:00 (ኢ.ሰ.)', note: 'ሰ/ት ቤት ቀን' },
  { day: 'እሑድ', time: 'ቅዳሴ ወቅት ብቻ', note: 'ዋናው ቀን' },
];

const CONTACTS = [
  { icon: <Phone className="w-6 h-6" />, label: 'ዋና ስልክ', value: '+251 11 234 5678', href: 'tel:+251112345678', color: '#1a6b9e' },
  { icon: <Phone className="w-6 h-6" />, label: 'ሞባይል', value: '+251 91 234 5678', href: 'tel:+251912345678', color: '#2d7a4e' },
  { icon: <Mail className="w-6 h-6" />, label: 'ኢሜይል', value: 'info@kidusmikaeel.et', href: 'mailto:info@kidusmikaeel.et', color: '#800020' },
];

const SOCIAL = [
  { name: 'Telegram', icon: 'T', href: 'https://t.me', color: '#0088cc' },
  { name: 'Facebook', icon: 'f', href: 'https://facebook.com', color: '#1877f2' },
  { name: 'YouTube', icon: '▶', href: 'https://youtube.com', color: '#ff0000' },
];

export const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen pub-bg font-ethiopic">
      <PublicNavbar />

      {/* Page Hero */}
      <section
        className="py-20 px-4 sm:px-8 text-center text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1A0F0A 0%, #1a6b9e 50%, #1A0F0A 100%)' }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #D4AF37 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#D4AF37', fontFamily: 'Inter, sans-serif' }}>
            ☩ ደውሉልን
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">አድራሻ</h1>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            ካህናቱ፣ ጽ/ቤቱ፣ ወይም ሞባይል — ዝግጁ ናቸው
          </p>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-14 grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Left column: contacts + social */}
        <div className="flex flex-col gap-6">
          {/* Phone & Email cards */}
          {CONTACTS.map(({ icon, label, value, href, color }) => (
            <a
              key={label}
              href={href}
              className="card-lift flex items-center gap-4 rounded-2xl border p-5 group"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D0' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors group-hover:opacity-80"
                style={{ backgroundColor: `${color}12`, color, border: `2px solid ${color}25` }}
              >
                {icon}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: '#9B8E7A', fontFamily: 'Inter, sans-serif' }}>
                  {label}
                </p>
                <p className="font-bold text-base" style={{ color: '#1A1209', fontFamily: 'Inter, sans-serif' }}>
                  {value}
                </p>
              </div>
            </a>
          ))}

          {/* Social media */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D0' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: '#9B8E7A', fontFamily: 'Inter, sans-serif' }}>
              ሶሻል ሚዲያ
            </p>
            <div className="flex items-center gap-3">
              {SOCIAL.map(({ name, icon, href, color }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base transition-transform hover:scale-110"
                  style={{ backgroundColor: `${color}15`, color, border: `2px solid ${color}25` }}
                  aria-label={name}
                  title={name}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: address + hours */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Physical Address */}
          <div className="rounded-2xl border p-6" style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D0' }}>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5" style={{ color: '#800020' }} />
              <h2 className="font-bold text-lg" style={{ color: '#1A1209' }}>አድራሻ ፍለጋ</h2>
            </div>
            <div className="flex flex-col gap-3">
              <div className="rounded-xl p-4" style={{ backgroundColor: '#F5F0E8', border: '1px solid #E8E0D0' }}>
                <p className="font-bold text-sm mb-1" style={{ color: '#1A1209' }}>ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን</p>
                <p className="text-sm" style={{ color: '#4B3A2A' }}>ቦሌ ክ/ከተማ፣ ወረዳ 07</p>
                <p className="text-sm" style={{ color: '#4B3A2A' }}>አዲስ አበባ፣ ኢትዮጵያ</p>
                <p className="text-xs mt-1" style={{ color: '#9B8E7A', fontFamily: 'Inter, sans-serif' }}>
                  ከቦሌ ዓለም አቀፍ አየር ማረፊያ 2.5 ኪ.ሜ
                </p>
              </div>
              <a
                href="https://maps.google.com/?q=Addis+Ababa+Bole"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 transition-all hover:bg-[#800020] hover:text-white hover:border-[#800020]"
                style={{ borderColor: '#800020', color: '#800020' }}
              >
                <ExternalLink className="w-4 h-4" />
                Google Maps ላይ ይፈልጉ
              </a>
            </div>
          </div>

          {/* Map embed placeholder */}
          <div
            className="rounded-2xl overflow-hidden border"
            style={{ borderColor: '#E8E0D0', height: '220px', backgroundColor: '#F5F0E8' }}
          >
            <iframe
              title="ቤተ ክርስቲያን አድራሻ"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.5383637073!2d38.7926!3d8.9806!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOMKwNTgnNTAuMiJOIDM4wrA0NyozMy42IkU!5e0!3m2!1sen!2set!4v1620000000000!5m2!1sen!2set"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Office Hours */}
          <div className="rounded-2xl border p-6" style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D0' }}>
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-5 h-5" style={{ color: '#800020' }} />
              <h2 className="font-bold text-lg" style={{ color: '#1A1209' }}>የጽ/ቤት ሰዓታት</h2>
            </div>
            <div className="flex flex-col divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
              {OFFICE_HOURS.map(({ day, time, note }) => {
                const isClosed = time.includes('ዝግ');
                const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) ===
                  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
                  ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'].indexOf(day)
                  ];

                return (
                  <div
                    key={day}
                    className="flex items-center justify-between py-3 gap-3"
                    style={{ borderColor: '#F0EBE0' }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="font-bold text-sm min-w-[4rem]"
                        style={{ color: isToday ? '#800020' : '#1A1209' }}
                      >
                        {day}
                      </span>
                      {isToday && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{ backgroundColor: 'rgba(128,0,32,0.1)', color: '#800020' }}
                        >
                          ዛሬ
                        </span>
                      )}
                      {note && !isToday && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F5F0E8', color: '#9B8E7A' }}>
                          {note}
                        </span>
                      )}
                    </div>
                    <span
                      className="text-sm font-medium text-right"
                      style={{ color: isClosed ? '#9B8E7A' : '#4B3A2A', fontFamily: 'Inter, sans-serif' }}
                    >
                      {time}
                    </span>
                  </div>
                );
              })}
            </div>
            <div
              className="mt-4 flex items-start gap-2 text-xs rounded-xl px-4 py-3"
              style={{ backgroundColor: 'rgba(128,0,32,0.06)', color: '#800020' }}
            >
              📞 ለድንገተኛ ጉዳዮች (ቀብር ወዘተ) 24/7 ደውሉ: <strong>+251 91 234 5678</strong>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};

