// src/components/public/FeastCountdown.tsx
import React, { useEffect, useState } from 'react';
import type { Feast } from '../../data/feasts';

interface FeastCountdownProps {
  feast: Feast;
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const feast = new Date(dateStr);
  feast.setHours(0, 0, 0, 0);
  const diff = feast.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export const FeastCountdown: React.FC<FeastCountdownProps> = ({ feast }) => {
  const [days, setDays] = useState(() => getDaysUntil(feast.gregorianDate));

  useEffect(() => {
    setDays(getDaysUntil(feast.gregorianDate));
  }, [feast.gregorianDate]);

  const isPast = days < 0;
  const isToday = days === 0;

  return (
    <div
      className="card-lift rounded-2xl border p-5 flex flex-col gap-3 font-ethiopic"
      style={{
        backgroundColor: feast.isMajor ? 'rgba(128,0,32,0.04)' : '#FFFFFF',
        borderColor: feast.isMajor ? 'rgba(212,175,55,0.4)' : '#E8E0D0',
        boxShadow: feast.isMajor ? '0 4px 20px rgba(212,175,55,0.1)' : 'none',
      }}
    >
      {/* Icon + name */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{feast.icon}</span>
        <div>
          {feast.isMajor && (
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-1 inline-block"
              style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: '#A88A1E' }}
            >
              ዋና በዓል
            </span>
          )}
          <h3 className="font-bold text-base leading-tight" style={{ color: '#1A1209' }}>
            {feast.nameAm}
          </h3>
        </div>
      </div>

      {/* Ethiopian date */}
      <div
        className="flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-lg"
        style={{ backgroundColor: '#F5F0E8', color: '#800020' }}
      >
        <span>📅</span>
        <span>{feast.ethiopicDate}</span>
      </div>

      {/* Countdown badge */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs leading-relaxed" style={{ color: '#6B5E45' }}>
          {feast.descriptionAm}
        </p>
        <div
          className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 font-bold"
          style={{
            borderColor: isToday ? '#D4AF37' : isPast ? '#E8E0D0' : '#800020',
            backgroundColor: isToday ? 'rgba(212,175,55,0.12)' : isPast ? '#F5F0E8' : 'rgba(128,0,32,0.07)',
          }}
        >
          <span
            className="text-lg leading-none"
            style={{ color: isToday ? '#A88A1E' : isPast ? '#9B8E7A' : '#800020', fontFamily: 'Inter, sans-serif' }}
          >
            {isToday ? '☩' : Math.abs(days)}
          </span>
          <span
            className="text-[9px] leading-none mt-0.5"
            style={{ color: '#9B8E7A', fontFamily: 'Inter, sans-serif' }}
          >
            {isToday ? 'ዛሬ!' : isPast ? 'አለፈ' : 'ቀናት'}
          </span>
        </div>
      </div>
    </div>
  );
};
