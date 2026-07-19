// frontend/src/pages/member/RequestStatusPage.tsx
// Phase 2 — የጥያቄ ሁኔታ — Track the status of the spiritual father request
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

type RequestStatus =
  | { status: 'NONE' }
  | {
      id: string;
      status: 'PENDING' | 'APPROVED' | 'REJECTED';
      createdAt: string;
      notes?: string | null;
      priest: {
        id: string; fullName: string; email: string;
        photoUrl?: string | null; location?: string | null;
        institution?: { nameAm?: string | null; nameEn?: string | null } | null;
      };
    };

function formatDate(iso: string) {
  const d = new Date(iso);
  const months = ['ጃን','ፌብ','ማር','ኤፕ','ሜይ','ጁን','ጁላ','ኦገ','ሴፕ','ኦክ','ኖቭ','ዲሴ'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const STATUS_CONFIG = {
  PENDING: {
    label: 'መጠባበቅ ላይ',
    desc: 'ካህኑ ጥያቄዎን ሳይፈቱ ናቸው። ትዕግሥት ይኑርዎ።',
    icon: Clock,
    bg: 'rgba(26,107,158,0.08)',
    text: '#1a6b9e',
    border: 'rgba(26,107,158,0.25)',
  },
  APPROVED: {
    label: 'ተቀብሏል ✓',
    desc: 'ካህኑ ጥያቄዎን ተቀብለዋል። ግንኙነቱ ተፈጥሯል!',
    icon: CheckCircle,
    bg: 'rgba(45,122,78,0.08)',
    text: '#2d7a4e',
    border: 'rgba(45,122,78,0.25)',
  },
  REJECTED: {
    label: 'ውድቅ ተደርጓል',
    desc: 'ካህኑ ጥያቄዎን ውድቅ አድርገዋል። ሌላ ካህን ሊጠይቁ ይችላሉ።',
    icon: XCircle,
    bg: 'rgba(128,0,32,0.08)',
    text: '#800020',
    border: 'rgba(128,0,32,0.25)',
  },
};

export const RequestStatusPage: React.FC = () => {
  const [data, setData] = useState<RequestStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    try {
      const r = await api.get('/members/assignment/status');
      setData(r.data);
    } catch {
      setData({ status: 'NONE' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen pub-bg font-ethiopic flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-t-[#800020] border-[#E8E0D0] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pub-bg font-ethiopic">
      {/* Header */}
      <div className="py-12 px-4 text-white" style={{ background: 'linear-gradient(135deg, #1A0F0A, #800020)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#D4AF37', fontFamily: 'Inter' }}>
              ☩ ጥያቄ ሁኔታ
            </p>
            <h1 className="text-3xl font-extrabold">የጥያቄ ሁኔታ</h1>
          </div>
          <button onClick={() => load(false)} disabled={refreshing}
            className="w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer"
            style={{ borderColor: 'rgba(212,175,55,0.4)', backgroundColor: 'rgba(212,175,55,0.08)' }}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} style={{ color: '#D4AF37' }} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* NONE state */}
        {(!data || data.status === 'NONE') && (
          <div className="rounded-3xl border p-10 flex flex-col items-center text-center gap-5"
            style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
            <span className="text-5xl">📋</span>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#1A1209' }}>ጥያቄ አልተላከም</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#6B5E45' }}>
                እስካሁን የንስሐ አባት ጥያቄ አልላኩም።
                <br />ካህናቱን ፈልገው ጥያቄ ያቅርቡ።
              </p>
            </div>
            <Link to="/member/priests"
              className="px-8 py-3 rounded-full font-bold text-sm"
              style={{ backgroundColor: '#800020', color: '#fff' }}>
              ካህናት ፈልግ
            </Link>
          </div>
        )}

        {/* Request card */}
        {data && data.status !== 'NONE' && (() => {
          const cfg = STATUS_CONFIG[data.status];
          const Icon = cfg.icon;
          const priest = data.priest;

          return (
            <div className="flex flex-col gap-5">
              {/* Status banner */}
              <div className="rounded-2xl border p-6 flex items-start gap-4"
                style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}>
                <Icon className="w-8 h-8 shrink-0 mt-0.5" style={{ color: cfg.text }} />
                <div>
                  <p className="font-extrabold text-lg" style={{ color: cfg.text }}>{cfg.label}</p>
                  <p className="text-sm leading-relaxed mt-1" style={{ color: '#4B3A2A' }}>{cfg.desc}</p>
                </div>
              </div>

              {/* Priest card */}
              <div className="rounded-2xl border p-6" style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>
                  ጥያቄ ለዚህ ካህን
                </p>
                <div className="flex items-center gap-4">
                  {priest.photoUrl ? (
                    <img src={priest.photoUrl} alt={priest.fullName}
                      className="w-14 h-14 rounded-full object-cover border-2"
                      style={{ borderColor: 'rgba(128,0,32,0.2)' }} />
                  ) : (
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold border-2 shrink-0"
                      style={{ backgroundColor: 'rgba(128,0,32,0.08)', borderColor: 'rgba(128,0,32,0.2)', color: '#800020' }}>
                      {priest.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-base" style={{ color: '#1A1209' }}>{priest.fullName}</p>
                    <p className="text-xs" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>{priest.email}</p>
                    {priest.institution && (
                      <p className="text-xs mt-1" style={{ color: '#6B5E45' }}>
                        {priest.institution.nameAm ?? priest.institution.nameEn}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-2xl border p-5" style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>
                  የሂደት ዝርዝር
                </p>
                {[
                  { label: 'ጥያቄ ተልኳል', date: formatDate(data.createdAt), done: true },
                  { label: 'ካህኑ ይገምግሙ', date: data.status !== 'PENDING' ? formatDate(data.createdAt) : null, done: data.status !== 'PENDING' },
                  { label: data.status === 'APPROVED' ? 'ጥያቄ ተቀብሏል ✓' : data.status === 'REJECTED' ? 'ጥያቄ ውድቅ ✗' : 'ውሳኔ ሲጠብቅ...', date: null, done: data.status === 'APPROVED' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 mb-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold"
                      style={{ backgroundColor: step.done ? 'rgba(45,122,78,0.15)' : '#F5F0E8', color: step.done ? '#2d7a4e' : '#9B8E7A' }}>
                      {step.done ? '✓' : (i + 1)}
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: step.done ? '#1A1209' : '#9B8E7A' }}>{step.label}</p>
                      {step.date && <p className="text-xs mt-0.5" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>{step.date}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {data.status === 'REJECTED' && (
                <Link to="/member/priests"
                  className="w-full text-center py-3 rounded-xl font-bold text-sm"
                  style={{ backgroundColor: '#800020', color: '#fff', display: 'block' }}>
                  ሌላ ካህን ፈልግ
                </Link>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
