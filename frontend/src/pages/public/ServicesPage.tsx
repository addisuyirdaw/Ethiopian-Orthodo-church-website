// src/pages/public/ServicesPage.tsx
import React, { useState } from 'react';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';
import { ServiceCard } from '../../components/public/ServiceCard';
import { CHURCH_SERVICES } from '../../data/churchServices';
import { Link } from 'react-router-dom';

export const ServicesPage: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(
    // If hash present, open that service by default
    typeof window !== 'undefined' ? window.location.hash.replace('#', '') || null : null
  );

  return (
    <div className="min-h-screen pub-bg font-ethiopic">
      <PublicNavbar />

      {/* Page Hero */}
      <section
        className="py-20 px-4 sm:px-8 text-center text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1A0F0A 0%, #4A154B 60%, #800020 100%)' }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 60%, #D4AF37 0%, transparent 60%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#D4AF37', fontFamily: 'Inter, sans-serif' }}>
            ☩ ምን ያስፈልጋቸዋል?
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">አገልግሎቶቻችን</h1>
          <p className="text-base text-purple-200 leading-relaxed">
            ለእያንዳንዱ አገልግሎት — ዶክሜንቶቹ፣ ሰዓቱ፣ እና ሂደቱ ዝርዝር ናቸው
          </p>
        </div>
      </section>

      {/* Info banner */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-10">
        <div
          className="flex items-start gap-4 rounded-2xl p-5 border"
          style={{ backgroundColor: 'rgba(212,175,55,0.07)', borderColor: 'rgba(212,175,55,0.25)' }}
        >
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="font-bold text-sm mb-1" style={{ color: '#1A1209' }}>
              ቀጠሮ ሳያስፈልግ ቢሮ ቅረቡ
            </p>
            <p className="text-xs leading-relaxed" style={{ color: '#6B5E45' }}>
              ሁሉም አገልግሎቶች ቤተ ክርስቲያናችን ጽ/ቤት ሰኞ–ቅዳሜ ከ3:00–11:00 (ኢ.ሰ.) ይሰጣሉ።
              ለድንገተኛ ጉዳዮች (ቀብር ወዘተ) 24/7 ደውሉ: <strong>+251 11 234 5678</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Services list */}
      <section className="py-10 px-4 sm:px-8 max-w-4xl mx-auto" aria-label="አገልግሎቶች">
        <div className="flex flex-col gap-4">
          {CHURCH_SERVICES.map(service => (
            <div
              key={service.id}
              id={service.id}
            >
              <ServiceCard
                service={service}
                defaultOpen={openId === service.id}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Prayer CTA */}
      <section
        className="mx-4 sm:mx-8 mb-14 rounded-3xl py-12 px-8 text-center"
        style={{ background: 'linear-gradient(135deg, #800020 0%, #4A154B 100%)' }}
      >
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
          ዝርዝሩን ለማወቅ ወይም ለጸሎት
        </h2>
        <p className="text-purple-200 text-sm mb-6">
          ካህናቱ ዝግጁ ናቸው — ጸሎትዎን ዛሬ ያካፍሉ
        </p>
        <Link
          to="/prayer-request"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-base shadow-lg"
          style={{ backgroundColor: '#D4AF37', color: '#1A0F0A' }}
        >
          🙏 የጸሎት ጥያቄ ላክ
        </Link>
      </section>

      <PublicFooter />
    </div>
  );
};
