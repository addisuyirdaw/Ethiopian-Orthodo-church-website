// src/components/public/PublicFooter.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer
      className="border-t font-ethiopic"
      style={{ backgroundColor: '#1A0F0A', borderColor: 'rgba(212,175,55,0.2)' }}
    >
      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand column */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2"
              style={{ borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.1)' }}
            >
              ☩
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#F2EEEE' }}>
                ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን
              </p>
              <p className="text-[10px]" style={{ color: '#D4AF37', fontFamily: 'Inter' }}>
                Ethiopian Orthodox Tewahedo
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#9B8E7A' }}>
            ቤተ ክርስቲያናችን ለምዕምናን ሁሉ ክፍት ናት። ኑ ጸልዩ፣ ተማሩ፣ ኑሩ።
          </p>
          {/* Social links */}
          <div className="flex items-center gap-3 mt-5">
            <a
              href="https://t.me/+251"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full flex items-center justify-center border text-xs font-bold transition hover:scale-110"
              style={{ borderColor: 'rgba(212,175,55,0.3)', color: '#D4AF37' }}
              aria-label="Telegram"
            >
              T
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full flex items-center justify-center border text-xs font-bold transition hover:scale-110"
              style={{ borderColor: 'rgba(212,175,55,0.3)', color: '#D4AF37' }}
              aria-label="Facebook"
            >
              f
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full flex items-center justify-center border text-xs font-bold transition hover:scale-110"
              style={{ borderColor: 'rgba(212,175,55,0.3)', color: '#D4AF37' }}
              aria-label="YouTube"
            >
              ▶
            </a>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="font-bold text-sm mb-4" style={{ color: '#D4AF37' }}>ፈጣን አገልግሎቶች</h3>
          <ul className="space-y-2.5">
            {[
              { to: '/services', label: 'አገልግሎቶቻችን' },
              { to: '/announcements', label: 'ማስታወቂያዎች' },
              { to: '/prayer-request', label: 'የጸሎት ጥያቄ' },
              { to: '/about', label: 'ስለ ቤተ ክርስቲያናችን' },
              { to: '/contact', label: 'አድራሻ' },
            ].map(link => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm transition hover:text-[#D4AF37]"
                  style={{ color: '#9B8E7A' }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h3 className="font-bold text-sm mb-4" style={{ color: '#D4AF37' }}>አድራሻ</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#D4AF37' }} />
              <div>
                <p className="text-sm" style={{ color: '#F2EEEE' }}>+251 11 234 5678</p>
                <p className="text-xs" style={{ color: '#9B8E7A' }}>+251 91 234 5678</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#D4AF37' }} />
              <p className="text-sm" style={{ color: '#F2EEEE' }}>info@kidusmikaeel.et</p>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#D4AF37' }} />
              <p className="text-sm" style={{ color: '#F2EEEE' }}>አዲስ አበባ፣ ቦሌ ክ/ከተማ</p>
            </li>
          </ul>
        </div>

        {/* Office Hours */}
        <div>
          <h3 className="font-bold text-sm mb-4" style={{ color: '#D4AF37' }}>
            <Clock className="w-4 h-4 inline mr-1" />
            የጽ/ቤት ሰዓታት
          </h3>
          <ul className="space-y-2">
            {[
              { day: 'ሰኞ – ዓርብ', time: '3:00 – 11:00 (ኢ.ሰ.)' },
              { day: 'ቅዳሜ',       time: '3:00 – 1:00 (ኢ.ሰ.)' },
              { day: 'እሑድ',       time: 'ቅዳሴ ወቅት' },
            ].map(({ day, time }) => (
              <li key={day} className="flex justify-between text-xs gap-2">
                <span style={{ color: '#F2EEEE' }}>{day}</span>
                <span style={{ color: '#9B8E7A' }}>{time}</span>
              </li>
            ))}
          </ul>
          <div
            className="mt-4 px-3 py-2 rounded-lg text-xs"
            style={{ backgroundColor: 'rgba(128,0,32,0.2)', color: '#F0C0C0', border: '1px solid rgba(128,0,32,0.3)' }}
          >
            ✝ ሐሙስ ቀን ከ6–9 ኢ.ሰ. ጽ/ቤቱ ዝግ ነው
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="border-t px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
        style={{ borderColor: 'rgba(212,175,55,0.1)', color: '#6B5E45' }}
      >
        <p>© 2016 ዓ.ም. ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን · ሁሉም መብቶች የተጠበቁ ናቸው</p>
        <p style={{ fontFamily: 'Inter, sans-serif' }}>
          ☩ Ethiopian Orthodox Tewahedo Church
        </p>
      </div>
    </footer>
  );
};

