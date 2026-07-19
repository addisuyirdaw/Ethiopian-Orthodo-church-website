// src/components/PublicLandingPage.tsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from './common/ThemeProvider';
import { 
  Shield, 
  Users, 
  Calendar, 
  CreditCard, 
  BookOpen, 
  ChevronDown, 
  Moon, 
  Sun, 
  Globe 
} from 'lucide-react';

export const PublicLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const [lang, setLang] = useState<'am' | 'en'>('am');

  const content = {
    am: {
      app_title: 'áŠ¦áˆ­á‰¶á‹¶áŠ­áˆµ áŠ®áŠ”áŠ­á‰µ',
      app_subtitle: 'á‹¨á‰€áŠ–áŠ“á‹Š áŠ áˆµá‰°á‹³á‹°áˆ­ áŠ¥áŠ“ á‹¨á‹á‹­áŠ“áŠ•áˆµ áˆá‹áŒˆá‰£',
      btn_login: 'áŒá‰£',
      btn_explore: 'áˆµáˆ­á‹“á‰±áŠ• á‹³áˆµáˆ±',
      btn_learn_more: 'á‰°áŒ¨áˆ›áˆª á‹­á‹ˆá‰',
      hero_eyebrow: 'á‹¨áŠ¢á‰µá‹®áŒµá‹« áŠ¦áˆ­á‰¶á‹¶áŠ­áˆµ á‰°á‹‹áˆ•á‹¶ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ• áˆµáˆ­á‹“á‰µ',
      hero_headline: 'á‰€áŠ–áŠ“á‹Š áŠ áˆµá‰°á‹³á‹°áˆ­ áˆˆá‹²áŒ‚á‰³áˆ‰ á‹˜áˆ˜áŠ•',
      hero_tagline: 'á‰ á‹“áˆˆáˆ á‹™áˆªá‹« á‹«áˆˆá‹áŠ• á‹¨áŠ¢á‰µá‹®áŒµá‹« áŠ¦áˆ­á‰¶á‹¶áŠ­áˆµ á‰°á‹‹áˆ•á‹¶ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ• á‹¨á‹¥áˆ­ áŠ áˆµá‰°á‹³á‹°áˆ­á£ áˆá‹‹áˆ­á‹«á‹Š áˆáˆ¥áŒ¢áˆ«á‰µ áŠ¥áŠ“ á‹á‹­áŠ“áŠ•áˆµ áˆ¥áˆ­á‹“á‰¶á‰¹áŠ• á‹¨áˆšá‹«á‹‹áˆ…á‹°á‹ áŠ¨áá‰°áŠ› á‹°áˆ¨áŒƒ á‹«áˆˆá‹ áˆµáˆ­á‹“á‰µá¢',
      stat_tiers: 'á‰€áŠ–áŠ“á‹Š á‹°áˆ¨áŒƒá‹Žá‰½',
      stat_seal: 'áŠ­áˆªá•á‰¶ áˆ›áˆ…á‰°áˆ',
      stat_langs: 'á‰…á‹±áˆ³áŠ• á‰‹áŠ•á‰‹á‹Žá‰½',
      stat_fintech: 'á‹á‹­áŠ“áŠ•áˆµ áŠ­áááˆ',
      feat_sac_title: 'áˆá‹‹áˆ­á‹«á‹Š áˆá‹áŒˆá‰£',
      feat_sac_desc: 'á‹¨áˆáˆ‰áˆ á‰€áŠ–áŠ“á‹Š áˆ¥áˆ­á‹“á‰¶á‰½ (áŒ¥áˆá‰€á‰µá£ áŠ­áˆ­áˆµá‰µáŠ“á£ áŒ‹á‰¥á‰») á‹¨áˆ›á‹­á‹á‰… á‹²áŒ‚á‰³áˆ áˆ˜á‹áŒˆá‰¥á¢',
      feat_fin_title: 'á‹á‹­áŠ“áŠ•áˆµ áˆ¥áˆ­á‹“á‰µ',
      feat_fin_desc: 'áˆˆá‹áˆ¥áˆ«á‰¶á‰½áŠ“ áˆ˜áˆµá‹‹á‹•á‰¶á‰½ á‰ á‰ƒáˆˆ á‹“á‹‹á‹² áˆ•áŒ áˆ˜áˆ áˆ¨á‰µ á‰…áŒ½á‰ á‰³á‹Š áŠ­áááˆá¢',
      feat_cal_title: 'á‰…á‹³áˆ´ á‰€áŠ•',
      feat_cal_desc: 'áˆáˆ­áŠ•áŒƒá‹Š á‰€áŠ• á‹ˆá‹° áŠ¢á‰µá‹®áŒµá‹« á‹˜áˆ˜áŠ• áˆ˜á‰€á‹¨áˆªá‹« áŠ¥áŠ“ á‹¨áŒ¾áˆ á‹ˆá‰…á‰¶á‰½ áˆ˜áˆˆá‹«á¢',
      about_title: 'á‹¨áˆ¥áˆáŒ£áŠ• á‹°áˆ¨áŒƒá‹Žá‰½ áŠ¥áŠ“ á‰€áŠ–áŠ“á‹Š áŠ á‹ˆá‰ƒá‰€áˆ­',
      about_desc: 'áŠ¦áˆ­á‰¶á‹¶áŠ­áˆµ áŠ®áŠ”áŠ­á‰µ á‹¨áŠ¢á‰µá‹®áŒµá‹« áŠ¦áˆ­á‰¶á‹¶áŠ­áˆµ á‰°á‹‹áˆ•á‹¶ á‰¤á‰° áŠ­áˆ­áˆµá‰²á‹«áŠ•áŠ• áŠ áˆáˆµá‰µ á‹‹áŠ“ á‰€áŠ–áŠ“á‹Š á‹°áˆ¨áŒƒá‹Žá‰½ á‹ˆá‹° á‹°áˆ…áŠ•áŠá‰± á‹¨á‰°áŒ á‰ á‰€ á‹²áŒ‚á‰³áˆ áˆµáˆ­á‹“á‰µ á‹«áˆ¸áŒ‹áŒ‹áˆ«áˆá¢',
      t1: 'á‰…á‹±áˆµ áˆ²áŠ–á‹¶áˆµ â€” á“á‰µáˆ­á‹«áˆ­áŠ«á‹Š áŒ½/á‰¤á‰µ',
      t2: 'áˆŠá‰€ áŒ³áŒ³áˆµ áˆ€áŒˆáˆ¨ áˆµá‰¥áŠ¨á‰µ',
      t3: 'áˆ€áŒˆáˆ¨ áˆµá‰¥áŠ¨á‰µ',
      t4: 'á‹°á‰¥áˆ­ áŠ¥áŠ“ áŠ«áˆ…áŠ“á‰µ',
      nav_home: 'áˆ˜áŠáˆ»',
      nav_about: 'áˆµáˆˆ áŠ¥áŠ›',
      nav_directory: 'á‹¨áˆáŠ¥áˆ˜áŠ“áŠ• áˆ˜á‹áŒˆá‰¥',
      nav_simulation: 'áˆ›áˆµáˆ˜áˆ°á‹« á–áˆ­á‰³áˆ'
    },
    en: {
      app_title: 'ደብረ ብርሃን መድኃኔዓለም',
      app_subtitle: 'Canonical Governance & Financial Registry',
      btn_login: 'Sign In',
      btn_explore: 'Explore Portal',
      btn_learn_more: 'Learn More',
      hero_eyebrow: 'Ethiopian Orthodox Tewahedo Church Jurisdiction',
      hero_headline: 'Canonical Governance for the Digital Age',
      hero_tagline: 'The unified canonical governance platform for the Ethiopian Orthodox Tewahedo Church â€” administering parishes, sacramental records, and alms management under the Qale Awadi constitution.',
      stat_tiers: 'Canonical Tiers',
      stat_seal: 'SHA-256 Seal',
      stat_langs: 'Holy Languages',
      stat_fintech: 'Tithe Ledger',
      feat_sac_title: 'Sacramental Registry',
      feat_sac_desc: 'Immutable, cryptographically sealed records of all canonical rites.',
      feat_fin_title: 'Parish Alms Ledger',
      feat_fin_desc: 'Transparent, audited tithe and offering splits across the hierarchy.',
      feat_cal_title: 'Liturgical Calendar',
      feat_cal_desc: 'Gregorian-to-Ethiopic date conversion and fasting classification.',
      about_title: 'Jurisdictional Hierarchy & Canonical Alignment',
      about_desc: 'ደብረ ብርሃን መድኃኔዓለም encodes the full canonical authority structure of the global EOTC into a secure, auditable digital backbone.',
      t1: 'Holy Synod â€” Patriarchate Office',
      t2: 'Archdiocese (Metropolitan)',
      t3: 'Diocese (Episcopal Regional)',
      t4: 'Parish Priest & Clergy',
      nav_home: 'Home',
      nav_about: 'About',
      nav_directory: 'Parishioner Directory',
      nav_simulation: 'Interactive Simulator'
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen text-[#F2EEEE] transition-colors duration-300" style={{ backgroundColor: 'var(--eotc-canvas)', fontFamily: "'Outfit', sans-serif" }}>
      
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ borderColor: 'var(--eotc-border)', backgroundColor: 'rgba(10,8,9,0.85)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center border text-lg shadow-inner" style={{ borderColor: 'var(--eotc-gold)', backgroundColor: 'rgba(212,175,55,0.1)' }}>
              â›ª
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block font-serif" style={{ color: 'var(--eotc-gold)' }}>
                {t.app_title}
              </span>
              <span className="text-[9px] uppercase tracking-wider block opacity-70">
                {t.app_subtitle}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <a href="#hero" className="hover:text-[var(--eotc-gold)] transition-colors">{t.nav_home}</a>
            <a href="#about" className="hover:text-[var(--eotc-gold)] transition-colors">{t.nav_about}</a>
            <button onClick={() => navigate('/directory')} className="hover:text-[var(--eotc-gold)] transition-colors cursor-pointer">{t.nav_directory}</button>
            <button onClick={() => navigate('/simulation')} className="hover:text-[var(--eotc-gold)] transition-colors cursor-pointer">{t.nav_simulation}</button>
          </nav>

          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button 
              onClick={() => setLang(l => l === 'am' ? 'en' : 'am')}
              className="p-2 rounded-lg border hover:bg-white/5 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              style={{ borderColor: 'var(--eotc-border)' }}
            >
              <Globe className="w-3.5 h-3.5" style={{ color: 'var(--eotc-gold)' }} />
              {lang === 'am' ? 'EN' : 'áŠ áˆ›'}
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg border hover:bg-white/5 transition cursor-pointer"
              style={{ borderColor: 'var(--eotc-border)' }}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
            </button>

            {/* Portal Action button */}
            <button 
              onClick={() => navigate('/login')}
              className="px-5 py-2 rounded-lg text-sm font-bold shadow-md cursor-pointer transition transform hover:-translate-y-0.5 hover:shadow-lg"
              style={{ backgroundColor: 'var(--eotc-gold)', color: '#0a0809' }}
            >
              {t.btn_login}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative py-20 lg:py-32 overflow-hidden flex flex-col justify-center items-center text-center px-4">
        {/* Subtle blur background rings */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full mix-blend-screen opacity-10 filter blur-3xl" style={{ backgroundColor: 'var(--eotc-burgundy-2)' }} />
        
        <div className="max-w-4xl mx-auto z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest mb-6" style={{ borderColor: 'var(--eotc-border)', backgroundColor: 'rgba(212,175,55,0.05)', color: 'var(--eotc-gold)' }}>
            â˜© {t.hero_eyebrow}
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 font-serif leading-tight">
            {t.hero_headline}
          </h1>

          <p className="text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed opacity-85" style={{ color: 'var(--eotc-text-muted)' }}>
            {t.hero_tagline}
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4">
            <button 
              onClick={() => navigate('/simulation')}
              className="px-8 py-3 rounded-full text-base font-bold shadow-lg cursor-pointer transition transform hover:-translate-y-1 hover:shadow-xl"
              style={{ backgroundColor: 'var(--eotc-gold)', color: '#0a0809' }}
            >
              {t.btn_explore}
            </button>
            <a 
              href="#about"
              className="px-8 py-3 rounded-full text-base font-bold border transition cursor-pointer hover:bg-white/5"
              style={{ borderColor: 'var(--eotc-gold)', color: 'var(--eotc-gold)' }}
            >
              {t.btn_learn_more}
            </a>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
            {[
              { num: '5', label: t.stat_tiers },
              { num: 'SHA-256', label: t.stat_seal },
              { num: '3', label: t.stat_langs },
              { num: '90/10', label: t.stat_fintech }
            ].map((stat, i) => (
              <div key={i} className="text-center p-3 rounded-xl border" style={{ borderColor: 'var(--eotc-border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <div className="text-2xl font-bold font-serif" style={{ color: 'var(--eotc-gold)' }}>{stat.num}</div>
                <div className="text-[10px] uppercase tracking-wider mt-1 opacity-70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-t max-w-7xl mx-auto" style={{ borderColor: 'var(--eotc-border)' }} />

      {/* About Section */}
      <section id="about" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs uppercase tracking-widest font-black mb-3" style={{ color: 'var(--eotc-gold)' }}>
              â˜© QALE AWADI FRAMEWORK
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-serif mb-6 leading-tight">
              {t.about_title}
            </h2>
            <p className="text-sm leading-relaxed mb-8 opacity-80" style={{ color: 'var(--eotc-text-muted)' }}>
              {t.about_desc}
            </p>

            {/* 3 Key Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: <BookOpen className="w-6 h-6" />, title: t.feat_sac_title, desc: t.feat_sac_desc },
                { icon: <CreditCard className="w-6 h-6" />, title: t.feat_fin_title, desc: t.feat_fin_desc },
                { icon: <Calendar className="w-6 h-6" />, title: t.feat_cal_title, desc: t.feat_cal_desc }
              ].map((feat, i) => (
                <div key={i} className="p-5 rounded-xl border hover:border-[var(--eotc-gold)] transition duration-200" style={{ borderColor: 'var(--eotc-border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(212,175,55,0.1)', color: 'var(--eotc-gold)' }}>
                    {feat.icon}
                  </div>
                  <h3 className="font-bold text-xs mb-1">{feat.title}</h3>
                  <p className="text-[10px] leading-relaxed opacity-70" style={{ color: 'var(--eotc-text-muted)' }}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Jurisdictional Tree */}
          <div className="rounded-2xl p-6 border shadow-xl flex flex-col gap-4" style={{ borderColor: 'var(--eotc-border)', backgroundColor: 'rgba(25,22,25,0.3)' }}>
            <h3 className="font-serif font-extrabold text-sm mb-2" style={{ color: 'var(--eotc-gold)' }}>
              EOTC Canonical Hierarchy
            </h3>
            {[
              { tier: 'I', name: t.t1, icon: 'ðŸ‘‘' },
              { tier: 'II', name: t.t2, icon: 'â›ª' },
              { tier: 'III', name: t.t3, icon: 'ðŸ›¡ï¸' },
              { tier: 'IV', name: t.t4, icon: 'ðŸ•Šï¸' }
            ].map((node, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border transition hover:translate-x-1" style={{ borderColor: 'var(--eotc-border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <span className="text-xl">{node.icon}</span>
                <div>
                  <div className="text-[8px] uppercase tracking-wider opacity-60">Tier {node.tier} Authority</div>
                  <div className="font-bold text-xs" style={{ color: 'var(--eotc-gold)' }}>{node.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs opacity-60" style={{ borderColor: 'var(--eotc-border)' }}>
        â˜© ደብረ ብርሃን መድኃኔዓለም &bull; Qale Awadi Platform &bull; Ethiopian Orthodox Tewahedo Church
      </footer>
    </div>
  );
};

export default PublicLandingPage;

