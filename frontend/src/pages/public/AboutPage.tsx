// src/pages/public/AboutPage.tsx
import React from 'react';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';

const LEADERSHIP = [
  { title: 'ሊቀ ካህናት', name: 'ቀሲስ ሳሙኤል ወ/ሚካኤል', role: 'ዋና ፓስተር', icon: '✝️' },
  { title: 'ዲያቆን', name: 'ዲ/ን ዮሐንስ ታደሰ', role: 'ምክትል', icon: '🕊️' },
  { title: 'ጸሐፊ', name: 'ወ/ሮ ሙሉዓለም ሀይሌ', role: 'ጽ/ቤት', icon: '📋' },
  { title: 'ዝምሪ', name: 'አቶ ዳዊት ሰለሞን', role: 'የዜማ ኃላፊ', icon: '🎵' },
];

const DEPARTMENTS = [
  { icon: '📖', name: 'ሰንበት ትምህርት ቤት', desc: 'ለሕፃናትና ወጣቶች ሃይማኖታዊ ትምህርት' },
  { icon: '✨', name: 'የወጣቶች ኅብረት', desc: 'ወጣቶችን አሰባስቦ ከቤተ ክርስቲያን ጋር ያስተሳሳራል' },
  { icon: '🎵', name: 'ዘማሪያን ኅብረት', desc: 'የቅዳሴ ዜማ እና ሙዚቃ አገልግሎት' },
  { icon: '🤲', name: 'ምጽዋት ኮሚቴ', desc: 'ለምሕረት ሥራዎች ድጋፍ' },
  { icon: '👩‍👧', name: 'የሴቶች ማኅበር', desc: 'ሴቶችን ያጠናክራል' },
  { icon: '🏥', name: 'ጤና ኮሚቴ', desc: 'ለምዕምናን ጤና ድጋፍ' },
];

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen pub-bg font-ethiopic">
      <PublicNavbar />

      {/* Page Hero */}
      <section
        className="py-20 px-4 sm:px-8 text-center text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1A0F0A 0%, #800020 60%, #4A154B 100%)' }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #D4AF37 0%, transparent 60%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#D4AF37', fontFamily: 'Inter, sans-serif' }}>
            ☩ ቤተ ክርስቲያናችን
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">ስለ ቤተ ክርስቲያናችን</h1>
          <p className="text-base text-purple-200 leading-relaxed">
            ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን — ታሪክ፣ ራዕይ፣ ተልዕኮ፣ እና ሕይወት
          </p>
        </div>
      </section>

      {/* History */}
      <section className="py-16 px-4 sm:px-8 max-w-4xl mx-auto" id="history" aria-label="ታሪካችን">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-10 rounded-full" style={{ backgroundColor: '#D4AF37' }} />
          <h2 className="text-2xl font-bold" style={{ color: '#1A1209' }}>ታሪካችን</h2>
        </div>
        <div className="prose max-w-none text-base leading-relaxed space-y-4" style={{ color: '#4B3A2A' }}>
          <p>
            ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን ለብዙ ዘመናት ምዕምናንን አስተባብራ ስትቆም ቆይታለች። ቤተ ክርስቲያናችን
            የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን ሥርዓትን ተከትሎ የምትሠራ ሲሆን፣ ሕዝቡን
            ከጥምቀት ጀምሮ እስከ ቀብር ድረስ አብሮ ታስኬዳለች።
          </p>
          <p>
            ቤተ ክርስቲያናችን በቦሌ ክፍለ ከተማ ዋና ደብር ሆና ሲቆም፣ ሰንበት ትምህርት ቤት፣ የወጣቶች ኅብረት፣
            ዘማሪያን ኅብረት እና ሌሎች ጸጋ ቤሔሮች ቤተ ክርስቲያናችን ኅብረት ያጠናክሩ ዘንድ ያገለግላሉ።
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-16 px-4 sm:px-8" style={{ backgroundColor: '#F5F0E8' }} aria-label="ራዕይ እና ተልዕኮ">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Vision */}
          <div
            className="rounded-2xl p-8 border"
            style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(212,175,55,0.3)', boxShadow: '0 4px 24px rgba(212,175,55,0.07)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5"
              style={{ backgroundColor: 'rgba(212,175,55,0.1)', border: '2px solid rgba(212,175,55,0.25)' }}
            >
              👁️
            </div>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#1A1209' }}>ራዕያችን</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#4B3A2A' }}>
              ምዕምናኑ ሁሉ ቅዱስ ጥምቀት ተቀብለው፣ በሃይማኖት ጠንክረው፣ ለቤተ ክርስቲያን አስተዋጽዖ
              አድርገው፣ ሕይወቱን ክርስቲያናዊ ሠምረው ጨለፍ እንዲሆን — ቤተ ክርስቲያናችን ትፈልጋለች።
            </p>
          </div>

          {/* Mission */}
          <div
            className="rounded-2xl p-8 border"
            style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(128,0,32,0.2)', boxShadow: '0 4px 24px rgba(128,0,32,0.05)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5"
              style={{ backgroundColor: 'rgba(128,0,32,0.08)', border: '2px solid rgba(128,0,32,0.2)' }}
            >
              🎯
            </div>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#1A1209' }}>ተልዕኮዋ</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#4B3A2A' }}>
              ቤተ ክርስቲያናችን ለሁሉም ምዕምናን ቅዱሳን ምስጢራትን ማቅረብ፣ ሃይማኖታዊ ትምህርት ማሰጠት፣
              ምዕምናኑን ማጠናከርና ማስተዳደር — ፍቅር፣ ሰላም፣ ተስፋ ለሕዝቡ ማጎናፀፍ ናት።
            </p>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-16 px-4 sm:px-8 max-w-5xl mx-auto" id="leadership" aria-label="አመራር">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-10 rounded-full" style={{ backgroundColor: '#D4AF37' }} />
          <h2 className="text-2xl font-bold" style={{ color: '#1A1209' }}>የቤተ ክርስቲያን አመራር</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {LEADERSHIP.map(leader => (
            <div
              key={leader.name}
              className="card-lift rounded-2xl border p-6 flex flex-col items-center text-center gap-3"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D0' }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{ backgroundColor: 'rgba(128,0,32,0.07)', border: '2px solid rgba(128,0,32,0.15)' }}
              >
                {leader.icon}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#D4AF37', fontFamily: 'Inter, sans-serif' }}>
                  {leader.title}
                </p>
                <p className="font-bold text-sm" style={{ color: '#1A1209' }}>{leader.name}</p>
                <p className="text-xs mt-1" style={{ color: '#9B8E7A' }}>{leader.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Departments */}
      <section className="py-16 px-4 sm:px-8" style={{ backgroundColor: '#F5F0E8' }} id="departments" aria-label="መምሪያዎች">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-10 rounded-full" style={{ backgroundColor: '#D4AF37' }} />
            <h2 className="text-2xl font-bold" style={{ color: '#1A1209' }}>ዋና መምሪያዎች</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {DEPARTMENTS.map(dept => (
              <div
                key={dept.name}
                className="card-lift rounded-2xl border p-5 flex items-start gap-4"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D0' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: 'rgba(212,175,55,0.1)' }}
                >
                  {dept.icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: '#1A1209' }}>{dept.name}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#6B5E45' }}>{dept.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

