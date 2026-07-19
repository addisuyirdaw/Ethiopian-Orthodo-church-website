// frontend/src/components/common/NotificationBell.tsx
// Phase 3 — In-app notification bell with popover for any page
import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { api } from '../../api/client';

interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'አሁን';
  if (mins < 60) return `${mins} ደቂቃ ጫ`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ሰ ጫ`;
  const days = Math.floor(hrs / 24);
  return `${days} ቀን ጫ`;
}

export const NotificationBell: React.FC = () => {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter(n => !n.isRead).length;

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/notifications');
      setNotifs(r.data ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { /* ignore */ }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(v => !v); if (!open) load(); }}
        className="relative w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer"
        style={{ backgroundColor: open ? 'rgba(128,0,32,0.12)' : 'transparent' }}
        aria-label="ማሳወቂያዎች"
      >
        <Bell className="w-5 h-5" style={{ color: '#4B3A2A' }} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold"
            style={{ backgroundColor: '#800020', color: '#fff', fontFamily: 'Inter' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border z-50 overflow-hidden"
          style={{ backgroundColor: '#fff', borderColor: '#E8E0D0', top: '100%' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#F0EBE0' }}>
            <p className="font-bold text-sm" style={{ color: '#1A1209' }}>ማሳወቂያዎች</p>
            {unreadCount > 0 && (
              <button
                onClick={() => notifs.filter(n => !n.isRead).forEach(n => markRead(n.id))}
                className="text-xs flex items-center gap-1 cursor-pointer"
                style={{ color: '#800020' }}
              >
                <CheckCheck className="w-3.5 h-3.5" /> ሁሉንም አንብብ
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-t-[#800020] border-[#E8E0D0] animate-spin" />
              </div>
            ) : notifs.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: '#E8E0D0' }} />
                <p className="text-sm" style={{ color: '#9B8E7A' }}>ምንም ማሳወቂያ የለም</p>
              </div>
            ) : (
              notifs.map(n => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className="w-full text-left px-4 py-3 border-b flex flex-col gap-1 transition hover:bg-[#FDFAF5] cursor-pointer"
                  style={{
                    borderColor: '#F5F0E8',
                    backgroundColor: n.isRead ? '#fff' : 'rgba(128,0,32,0.03)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold" style={{ color: n.isRead ? '#6B5E45' : '#1A1209' }}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: '#800020' }} />
                    )}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: '#9B8E7A' }}>{n.body}</p>
                  <p className="text-[10px]" style={{ color: '#C8BFA8', fontFamily: 'Inter' }}>{timeAgo(n.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
