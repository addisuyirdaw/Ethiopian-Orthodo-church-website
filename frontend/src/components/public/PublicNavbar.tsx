// src/components/public/PublicNavbar.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogIn } from 'lucide-react';

interface NavLink {
  to: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { to: '/',              label: 'ዋና ገጽ' },
  { to: '/about',         label: 'ስለ እኛ' },
  { to: '/services',      label: 'አገልግሎቶች' },
  { to: '/announcements', label: 'ማስታወቂያዎች' },
  { to: '/prayer-request',label: 'የጸሎት ጥያቄ' },
  { to: '/contact',       label: 'አድራሻ' },
  { to: '/register',      label: 'ይመዝገቡ' },
];

export const PublicNavbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300 font-ethiopic"
      style={{
        backgroundColor: scrolled ? 'rgba(253,250,245,0.97)' : 'rgba(253,250,245,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid #E8E0D0' : '1px solid transparent',
        boxShadow: scrolled ? '0 2px 20px rgba(212,175,55,0.08)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group" aria-label="ዋና ገጽ">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner border-2 transition-transform group-hover:scale-105"
            style={{ borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.1)' }}
          >
            ☩
          </div>
          <div>
            <p
              className="font-bold text-base leading-none font-ethiopic"
              style={{ color: '#1A1209' }}
            >
              ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን
            </p>
            <p className="text-[10px] leading-none mt-0.5" style={{ color: '#D4AF37', fontFamily: 'Inter, sans-serif' }}>
              Ethiopian Orthodox Tewahedo Church
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="ዋና ናቪጌሽን">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 font-ethiopic"
              style={{
                color: isActive(link.to) ? '#800020' : '#4B3A2A',
                backgroundColor: isActive(link.to) ? 'rgba(128,0,32,0.07)' : 'transparent',
                fontWeight: isActive(link.to) ? 700 : 500,
              }}
              onMouseEnter={e => {
                if (!isActive(link.to)) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(212,175,55,0.1)';
                  (e.currentTarget as HTMLElement).style.color = '#800020';
                }
              }}
              onMouseLeave={e => {
                if (!isActive(link.to)) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = '#4B3A2A';
                }
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA: Portal login */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            to="/login"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all duration-150 cursor-pointer"
            style={{ borderColor: '#D4AF37', color: '#800020', backgroundColor: 'transparent' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#D4AF37';
              (e.currentTarget as HTMLElement).style.color = '#1A1209';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLElement).style.color = '#800020';
            }}
          >
            <LogIn className="w-4 h-4" />
            <span className="font-ethiopic">ፖርታል ግባ</span>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 rounded-lg transition"
          style={{ color: '#1A1209' }}
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'ምናሌ ዝጋ' : 'ምናሌ ክፈት'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="lg:hidden border-t px-4 py-4 flex flex-col gap-1"
          style={{ borderColor: '#E8E0D0', backgroundColor: 'rgba(253,250,245,0.99)' }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-4 py-3 rounded-xl text-base font-medium font-ethiopic transition"
              style={{
                color: isActive(link.to) ? '#800020' : '#1A1209',
                backgroundColor: isActive(link.to) ? 'rgba(128,0,32,0.07)' : 'transparent',
                fontWeight: isActive(link.to) ? 700 : 500,
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/login"
            className="mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold font-ethiopic"
            style={{ backgroundColor: '#D4AF37', color: '#1A1209' }}
          >
            <LogIn className="w-4 h-4" />
            ፖርታል ግባ
          </Link>
        </div>
      )}
    </header>
  );
};

