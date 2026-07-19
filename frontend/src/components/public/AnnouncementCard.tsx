// src/components/public/AnnouncementCard.tsx
import React from 'react';
import { Pin } from 'lucide-react';
import type { Announcement, AnnouncementCategory } from '../../data/announcements';

const CATEGORY_COLORS: Record<AnnouncementCategory, { bg: string; text: string; border: string }> = {
  'ዜና':       { bg: 'rgba(26,107,158,0.12)', text: '#1a6b9e',  border: 'rgba(26,107,158,0.3)' },
  'ዝግጅቶች':  { bg: 'rgba(139,34,82,0.12)',  text: '#8b2252',  border: 'rgba(139,34,82,0.3)' },
  'የበዓል ቀን': { bg: 'rgba(212,175,55,0.12)', text: '#A88A1E',  border: 'rgba(212,175,55,0.35)' },
  'ወጣቶች':   { bg: 'rgba(45,122,78,0.12)',  text: '#2d7a4e',  border: 'rgba(45,122,78,0.3)' },
  'ሰ/ት ቤት': { bg: 'rgba(90,62,130,0.12)',  text: '#5a3e82',  border: 'rgba(90,62,130,0.3)' },
  'ፍቃደኛ':   { bg: 'rgba(196,122,30,0.12)', text: '#c47a1e',  border: 'rgba(196,122,30,0.3)' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = [
    'ጃን', 'ፌብ', 'ማር', 'ኤፕ', 'ሜይ', 'ጁን',
    'ጁላ', 'ኦገ', 'ሴፕ', 'ኦክ', 'ኖቭ', 'ዲሴ',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

interface AnnouncementCardProps {
  announcement: Announcement;
  compact?: boolean;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement, compact }) => {
  const col = CATEGORY_COLORS[announcement.category];
  const clipped = compact && announcement.bodyAm.length > 120
    ? announcement.bodyAm.slice(0, 120) + '…'
    : announcement.bodyAm;

  return (
    <article
      className="card-lift rounded-2xl border p-5 flex flex-col gap-3 relative font-ethiopic"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: announcement.isPinned ? 'rgba(212,175,55,0.5)' : '#E8E0D0',
        boxShadow: announcement.isPinned ? '0 2px 16px rgba(212,175,55,0.1)' : 'none',
      }}
    >
      {/* Pinned badge */}
      {announcement.isPinned && (
        <div
          className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: '#A88A1E' }}
        >
          <Pin className="w-3 h-3" />
          ቋሚ
        </div>
      )}

      {/* Category + date */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border"
          style={{ backgroundColor: col.bg, color: col.text, borderColor: col.border }}
        >
          {announcement.category}
        </span>
        <time
          className="text-xs"
          style={{ color: '#9B8E7A', fontFamily: 'Inter, sans-serif' }}
          dateTime={announcement.date}
        >
          {formatDate(announcement.date)}
        </time>
      </div>

      {/* Title */}
      <h3 className="font-bold text-base leading-snug" style={{ color: '#1A1209' }}>
        {announcement.titleAm}
      </h3>

      {/* Body */}
      <p className="text-sm leading-relaxed" style={{ color: '#4B3A2A' }}>
        {clipped}
      </p>
    </article>
  );
};
