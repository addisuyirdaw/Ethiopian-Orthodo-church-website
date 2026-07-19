// src/pages/public/AnnouncementsPage.tsx
import React, { useState } from 'react';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';
import { AnnouncementCard } from '../../components/public/AnnouncementCard';
import { ANNOUNCEMENTS, type AnnouncementCategory } from '../../data/announcements';
import { Filter } from 'lucide-react';

const ALL_CATEGORIES: ('ሁሉም' | AnnouncementCategory)[] = [
  'ሁሉም', 'ዜና', 'ዝግጅቶች', 'የበዓል ቀን', 'ወጣቶች', 'ሰ/ት ቤት', 'ፍቃደኛ',
];

export const AnnouncementsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'ሁሉም' | AnnouncementCategory>('ሁሉም');

  const sorted = [...ANNOUNCEMENTS]
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const filtered = activeCategory === 'ሁሉም'
    ? sorted
    : sorted.filter(a => a.category === activeCategory);

  return (
    <div className="min-h-screen pub-bg font-ethiopic">
      <PublicNavbar />

      {/* Page Hero */}
      <section
        className="py-20 px-4 sm:px-8 text-center text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1A0F0A 0%, #2d7a4e 50%, #1A0F0A 100%)' }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #D4AF37 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#D4AF37', fontFamily: 'Inter, sans-serif' }}>
            ☩ ዜናዎች
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">ማስታወቂያዎች</h1>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            የቤተ ክርስቲያን ዜና፣ ዝግጅቶች፣ የበዓል ቀናት፣ እና ወቅታዊ ዝርዝሮች
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="sticky top-16 z-40 px-4 sm:px-8 py-4 border-b" style={{ backgroundColor: 'rgba(253,250,245,0.95)', borderColor: '#E8E0D0', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4" style={{ color: '#9B8E7A' }} />
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9B8E7A', fontFamily: 'Inter, sans-serif' }}>
              ምድብ
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-4 py-2 rounded-full text-sm font-bold transition-all cursor-pointer border"
                style={{
                  backgroundColor: activeCategory === cat ? '#800020' : 'transparent',
                  color: activeCategory === cat ? '#FFFFFF' : '#4B3A2A',
                  borderColor: activeCategory === cat ? '#800020' : '#E8E0D0',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Announcements Grid */}
      <section className="py-10 px-4 sm:px-8 max-w-5xl mx-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: '#9B8E7A' }}>
            <p className="text-4xl mb-3">📭</p>
            <p className="text-lg font-bold">ምንም ማስታወቂያ የለም</p>
            <p className="text-sm mt-1">ሌሎች ምድቦችን ይሞክሩ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(ann => (
              <AnnouncementCard key={ann.id} announcement={ann} />
            ))}
          </div>
        )}

        {/* Count */}
        <p className="mt-8 text-center text-xs" style={{ color: '#9B8E7A', fontFamily: 'Inter, sans-serif' }}>
          {filtered.length} ማስታወቂያዎች
        </p>
      </section>

      <PublicFooter />
    </div>
  );
};
