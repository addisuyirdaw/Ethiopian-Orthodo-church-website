// frontend/src/pages/priest/PriestAssignmentPanel.tsx
// Phase 2 — የንስሐ አባት መቆጣጠሪያ — Priest portal for managing spiritual child requests
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../api/client';
import { CheckCircle, XCircle, Users, Clock, Search, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

interface Member {
  id: string; fullName: string; email: string;
  christianName?: string | null; phoneNumber?: string | null;
  sex?: string | null; age?: number | null; region?: string | null;
  city?: string | null; baptismStatus?: string | null; photoUrl?: string | null;
}

interface AssignmentRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  notes?: string | null;
  member: Member;
}

interface Stats { pendingCount: number; approvedCount: number; rejectedCount: number; }

type ActiveTab = 'PENDING' | 'APPROVED' | 'REJECTED';

function formatDate(iso: string) {
  const d = new Date(iso);
  const months = ['ጃን','ፌብ','ማር','ኤፕ','ሜይ','ጁን','ጁላ','ኦገ','ሴፕ','ኦክ','ኖቭ','ዲሴ'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export const PriestAssignmentPanel: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [requests, setRequests] = useState<AssignmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ActiveTab>('PENDING');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([
        api.get('/priest-assignments/dashboard'),
        api.get('/priest-assignments/requests'),
      ]);
      setStats(sRes.data);
      setRequests(rRes.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleDecision = async (id: string, action: 'approve' | 'reject') => {
    setActing(id);
    try {
      await api.post(`/priest-assignments/requests/${id}/${action}`);
      showToast(action === 'approve' ? 'ጥያቄ ተቀብሏል ✓' : 'ጥያቄ ውድቅ ተደርጓል');
      await loadAll();
      setExpanded(null);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? 'ስህተት' : 'ስህተት';
      showToast(`⚠️ ${msg}`);
    } finally {
      setActing(null);
    }
  };

  const filtered = useMemo(() =>
    requests.filter(r =>
      r.status === tab &&
      (r.member.fullName.toLowerCase().includes(search.toLowerCase()) ||
       (r.member.city ?? '').toLowerCase().includes(search.toLowerCase()))
    ), [requests, tab, search]
  );

  if (loading) {
    return (
      <div className="min-h-screen pub-bg font-ethiopic flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-t-[#800020] border-[#E8E0D0] animate-spin" />
      </div>
    );
  }

  const TABS: { key: ActiveTab; label: string; count: number }[] = [
    { key: 'PENDING',  label: 'መጠባበቅ ላይ',    count: stats?.pendingCount  ?? 0 },
    { key: 'APPROVED', label: 'ተቀባይነት አግኝቷል', count: stats?.approvedCount ?? 0 },
    { key: 'REJECTED', label: 'ውድቅ ተደርጓል',   count: stats?.rejectedCount ?? 0 },
  ];

  return (
    <div className="min-h-screen pub-bg font-ethiopic">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl font-bold text-sm shadow-2xl"
          style={{ backgroundColor: toast.startsWith('⚠️') ? '#800020' : '#2d7a4e', color: '#fff' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="py-10 px-4 text-white" style={{ background: 'linear-gradient(135deg, #1A0F0A, #800020)' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#D4AF37', fontFamily: 'Inter' }}>
            ☩ ካህን ፖርታል
          </p>
          <h1 className="text-3xl font-extrabold mb-4">የንስሐ አባት መቆጣጠሪያ</h1>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'መጠባበቅ ላይ', value: stats?.pendingCount ?? 0, icon: Clock, color: '#D4AF37' },
              { label: 'ተቀብሏል', value: stats?.approvedCount ?? 0, icon: CheckCircle, color: '#4ade80' },
              { label: 'ውድቅ', value: stats?.rejectedCount ?? 0, icon: XCircle, color: '#fca5a5' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl p-4 flex flex-col gap-1"
                style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
                <Icon className="w-5 h-5" style={{ color }} />
                <p className="text-2xl font-extrabold" style={{ color: '#fff', fontFamily: 'Inter' }}>{value}</p>
                <p className="text-xs opacity-70">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs + search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            {TABS.map(({ key, label, count }) => (
              <button key={key} onClick={() => setTab(key)}
                className="px-4 py-2 rounded-xl text-sm font-bold border-2 transition cursor-pointer"
                style={{
                  backgroundColor: tab === key ? '#800020' : 'transparent',
                  borderColor: tab === key ? '#800020' : '#E8E0D0',
                  color: tab === key ? '#fff' : '#4B3A2A',
                }}>
                {label} <span style={{ fontFamily: 'Inter' }}>({count})</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 sm:max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9B8E7A' }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ምዕምን ፈልግ..."
              className="w-full rounded-xl pl-9 pr-4 py-2.5 border text-sm outline-none"
              style={{ borderColor: '#E8E0D0', backgroundColor: '#fff', color: '#1A1209', fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
            />
          </div>
        </div>

        {/* Requests list */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border" style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: '#E8E0D0' }} />
            <p className="font-bold" style={{ color: '#1A1209' }}>
              {tab === 'PENDING' ? 'ጠባቂ ጥያቄ የለም' : tab === 'APPROVED' ? 'ምዕምናን የለም' : 'ውድቅ ጥያቄ የለም'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(req => {
              const isExpanded = expanded === req.id;
              const isActing = acting === req.id;
              const m = req.member;

              return (
                <article key={req.id} className="rounded-2xl border overflow-hidden"
                  style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
                  {/* Header row */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : req.id)}
                    className="w-full flex items-center gap-4 p-5 text-left cursor-pointer"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
                      style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: '#800020', border: '2px solid rgba(128,0,32,0.15)' }}>
                      {m.fullName.charAt(0)}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base truncate" style={{ color: '#1A1209' }}>{m.fullName}</p>
                      <p className="text-xs" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>
                        {m.christianName ? `የክርስትና ስም: ${m.christianName} · ` : ''}
                        {formatDate(req.createdAt)}
                      </p>
                    </div>
                    {/* Chevron */}
                    {isExpanded ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: '#9B8E7A' }} />
                                : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: '#9B8E7A' }} />}
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t flex flex-col gap-4" style={{ borderColor: '#F0EBE0' }}>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                        {[
                          { label: 'ፆታ', value: m.sex === 'MALE' ? 'ወንድ' : m.sex === 'FEMALE' ? 'ሴት' : '—' },
                          { label: 'ዕድሜ', value: m.age ? `${m.age} ዓ` : '—' },
                          { label: 'ከተማ', value: m.city ?? '—' },
                          { label: 'ጥምቀት', value: m.baptismStatus ?? '—' },
                        ].map(({ label, value }) => (
                          <div key={label} className="rounded-xl p-3" style={{ backgroundColor: '#F5F0E8' }}>
                            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>{label}</p>
                            <p className="text-sm font-bold" style={{ color: '#1A1209' }}>{value}</p>
                          </div>
                        ))}
                      </div>

                      {m.phoneNumber && (
                        <p className="text-sm" style={{ color: '#4B3A2A' }}>📞 {m.phoneNumber}</p>
                      )}
                      {req.notes && (
                        <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: '#FDF8F0', border: '1px solid #E8E0D0', color: '#4B3A2A' }}>
                          <p className="text-xs font-bold mb-1 uppercase" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>ማስታወሻ</p>
                          {req.notes}
                        </div>
                      )}

                      {/* Approve / Reject */}
                      {req.status === 'PENDING' && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleDecision(req.id, 'approve')}
                            disabled={isActing}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm cursor-pointer"
                            style={{ backgroundColor: isActing ? '#C8BFA8' : '#2d7a4e', color: '#fff' }}>
                            {isActing ? '...' : <><CheckCircle className="w-4 h-4" /> ተቀበል</>}
                          </button>
                          <button
                            onClick={() => handleDecision(req.id, 'reject')}
                            disabled={isActing}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm cursor-pointer border-2"
                            style={{ borderColor: '#800020', color: '#800020', backgroundColor: 'transparent' }}>
                            {isActing ? '...' : <><XCircle className="w-4 h-4" /> ውድቅ አድርግ</>}
                          </button>
                        </div>
                      )}

                      {req.status === 'APPROVED' && (
                        <div className="text-sm px-4 py-3 rounded-xl" style={{ backgroundColor: 'rgba(45,122,78,0.08)', color: '#2d7a4e' }}>
                          ✓ ተቀብሏል — ምዕምኑ ስብካዊ ልጅዎ ናቸው
                        </div>
                      )}
                      {req.status === 'REJECTED' && (
                        <div className="text-sm px-4 py-3 rounded-xl" style={{ backgroundColor: 'rgba(128,0,32,0.07)', color: '#800020' }}>
                          ✗ ውድቅ ተደርጓል
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
