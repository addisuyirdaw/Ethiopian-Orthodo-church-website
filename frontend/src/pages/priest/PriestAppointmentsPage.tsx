// frontend/src/pages/priest/PriestAppointmentsPage.tsx
// Phase 3 — የቀጠሮ ጥያቄዎች — Priest queue: approve, reject, or reschedule appointments
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import {
  CalendarDays, CheckCircle, XCircle, RotateCcw, Clock,
  Search, ChevronDown, ChevronUp, Users,
} from 'lucide-react';
import axios from 'axios';

interface Appointment {
  id: string;
  status: string;
  appointmentType: string;
  requestedDate: string;
  confirmedDate?: string | null;
  followerNote?: string | null;
  priestNote?: string | null;
  createdAt: string;
  follower: {
    id: string;
    fullName: string;
    nameAm?: string | null;
    email: string;
  };
}

interface Stats {
  PENDING: number;
  APPROVED: number;
  COMPLETED: number;
  REJECTED: number;
  RESCHEDULED: number;
  CANCELLED: number;
}

const TYPE_LABELS: Record<string, string> = {
  CONFESSION: 'ንስሐ', COUNSELING: 'ምክር', ASRAT_REVIEW: 'ዐሥራትና ስጦታ', GENERAL: 'ጠቅላላ', EMERGENCY: 'ድንገተኛ',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const months = ['ጃን', 'ፌብ', 'ማር', 'ኤፕ', 'ሜይ', 'ጁን', 'ጁላ', 'ኦገ', 'ሴፕ', 'ኦክ', 'ኖቭ', 'ዲሴ'];
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${time}`;
}

// Minimum date = today
function minDate() {
  return new Date().toISOString().split('T')[0];
}

type FilterTab = 'PENDING' | 'APPROVED' | 'RESCHEDULED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export const PriestAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Partial<Stats>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>('PENDING');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  // Reschedule form state per appointment
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('09:00');
  const [priestNote, setPriestNote] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [qRes, sRes] = await Promise.all([
        api.get('/appointments/priest'),
        api.get('/appointments/priest/stats'),
      ]);
      setAppointments(qRes.data?.data ?? qRes.data ?? []);
      setStats(sRes.data?.data ?? sRes.data ?? {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const decide = async (id: string, decision: 'APPROVE' | 'REJECT' | 'RESCHEDULE' | 'COMPLETE') => {
    let confirmedDate: string | undefined;
    if (decision === 'RESCHEDULE') {
      if (!rescheduleDate) { showToast('⚠️ አዲስ ቀን ይምረጡ'); return; }
      confirmedDate = new Date(`${rescheduleDate}T${rescheduleTime}:00`).toISOString();
    }

    setActing(id);
    try {
      await api.post(`/appointments/${id}/decide`, {
        decision,
        confirmedDate,
        priestNote: priestNote || undefined,
      });
      const labels: Record<string, string> = {
        APPROVE: 'ቀጠሮ ተቀብሏል ✓',
        REJECT: 'ቀጠሮ ውድቅ ተደርጓል',
        RESCHEDULE: 'ቀጠሮ እንደገና ተይዟል',
        COMPLETE: 'ቀጠሮ ተጠናቋል ✓',
      };
      showToast(labels[decision]);
      setExpanded(null);
      setRescheduleDate('');
      setPriestNote('');
      await load();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? 'ስህተት' : 'ስህተት';
      showToast(`⚠️ ${msg}`);
    } finally { setActing(null); }
  };

  const filtered = useMemo(() =>
    appointments.filter(a =>
      a.status === tab &&
      a.follower.fullName.toLowerCase().includes(search.toLowerCase())
    ), [appointments, tab, search]
  );

  const STAT_CARDS = [
    { key: 'PENDING', label: 'በመጠባበቅ', icon: Clock, color: '#D4AF37' },
    { key: 'APPROVED', label: 'ተቀብሏል', icon: CheckCircle, color: '#4ade80' },
    { key: 'COMPLETED', label: 'ተጠናቋል', icon: CheckCircle, color: '#86efac' },
    { key: 'REJECTED', label: 'ውድቅ', icon: XCircle, color: '#fca5a5' },
  ];

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'PENDING', label: 'በመጠባበቅ' },
    { key: 'APPROVED', label: 'ተቀባይነት' },
    { key: 'RESCHEDULED', label: 'ተቀይሯል' },
    { key: 'COMPLETED', label: 'ተጠናቋል' },
    { key: 'REJECTED', label: 'ውድቅ' },
    { key: 'CANCELLED', label: 'ተሰርዟል' },
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

      {/* Header + stats */}
      <div className="py-10 px-4 text-white" style={{ background: 'linear-gradient(135deg, #1A0F0A, #800020)' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#D4AF37', fontFamily: 'Inter' }}>
            ☩ ካህን ፖርታል
          </p>
          <h1 className="text-3xl font-extrabold mb-5">የቀጠሮ ጥያቄዎች</h1>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
                <Icon className="w-5 h-5 mb-1" style={{ color }} />
                <p className="text-2xl font-extrabold" style={{ fontFamily: 'Inter' }}>
                  {(stats as any)[key] ?? 0}
                </p>
                <p className="text-xs opacity-70 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {TABS.map(({ key, label }) => {
              const count = appointments.filter(a => a.status === key).length;
              return (
                <button key={key} onClick={() => setTab(key)}
                  className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold border-2 transition cursor-pointer whitespace-nowrap"
                  style={{
                    backgroundColor: tab === key ? '#800020' : 'transparent',
                    borderColor: tab === key ? '#800020' : '#E8E0D0',
                    color: tab === key ? '#fff' : '#4B3A2A',
                  }}>
                  {label} <span style={{ fontFamily: 'Inter' }}>({count})</span>
                </button>
              );
            })}
          </div>
          <div className="relative sm:w-56 ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9B8E7A' }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ምዕምን ፈልግ..."
              className="w-full rounded-xl pl-9 pr-4 py-2.5 border text-sm outline-none"
              style={{ borderColor: '#E8E0D0', backgroundColor: '#fff', color: '#1A1209', fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-t-[#800020] border-[#E8E0D0] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border" style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: '#E8E0D0' }} />
            <p className="font-bold" style={{ color: '#1A1209' }}>ቀጠሮ የለም</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(appt => {
              const isExpanded = expanded === appt.id;
              const isActing = acting === appt.id;

              return (
                <article key={appt.id} className="rounded-2xl border overflow-hidden"
                  style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
                  {/* Header row — click to expand */}
                  <button onClick={() => setExpanded(isExpanded ? null : appt.id)}
                    className="w-full flex items-center gap-4 p-5 text-left cursor-pointer">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
                      style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: '#800020', border: '2px solid rgba(128,0,32,0.12)' }}>
                      {appt.follower.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: '#1A1209' }}>
                        {appt.follower.fullName}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>
                        {TYPE_LABELS[appt.appointmentType] ?? appt.appointmentType} · {formatDate(appt.requestedDate)}
                      </p>
                    </div>
                    {/* Type badge */}
                    <span className="shrink-0 text-xs px-2.5 py-1 rounded-full font-bold"
                      style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: '#800020' }}>
                      {TYPE_LABELS[appt.appointmentType] ?? appt.appointmentType}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: '#9B8E7A' }} />
                                : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: '#9B8E7A' }} />}
                  </button>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t flex flex-col gap-4" style={{ borderColor: '#F0EBE0' }}>
                      {/* Details grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                        <div className="rounded-xl p-3" style={{ backgroundColor: '#F5F0E8' }}>
                          <p className="text-[10px] font-bold uppercase" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>
                            ኢሜይል
                          </p>
                          <p className="text-sm font-medium mt-1 break-all" style={{ color: '#1A1209', fontFamily: 'Inter' }}>
                            {appt.follower.email}
                          </p>
                        </div>
                        <div className="rounded-xl p-3" style={{ backgroundColor: '#F5F0E8' }}>
                          <p className="text-[10px] font-bold uppercase" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>
                            የተጠየቀ ቀን
                          </p>
                          <p className="text-sm font-bold mt-1" style={{ color: '#1A1209', fontFamily: 'Inter' }}>
                            {formatDate(appt.requestedDate)}
                          </p>
                        </div>
                      </div>

                      {appt.followerNote && (
                        <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: '#FDFAF5', border: '1px solid #E8E0D0', color: '#4B3A2A' }}>
                          <p className="text-[10px] font-bold uppercase mb-1" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>
                            ምዕምኑ ማስታወሻ
                          </p>
                          {appt.followerNote}
                        </div>
                      )}

                      {/* Action panel — only for PENDING */}
                      {appt.status === 'PENDING' && (
                        <>
                          {/* Priest note */}
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>
                              ምላሽ / ማስታወሻ (አማራጭ)
                            </label>
                            <textarea value={priestNote} onChange={e => setPriestNote(e.target.value)}
                              placeholder="ለምዕምኑ ምላሽ..."
                              rows={2}
                              className="w-full rounded-xl px-4 py-2.5 border text-sm outline-none resize-none"
                              style={{ borderColor: '#E8E0D0', backgroundColor: '#FDFAF5', color: '#1A1209', fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                            />
                          </div>

                          {/* Reschedule date picker */}
                          <div className="flex gap-3">
                            <div className="flex-1 flex flex-col gap-1">
                              <label className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>
                                አዲስ ቀን (ለ እንደገና ያዝ)
                              </label>
                              <div className="flex gap-2">
                                <input type="date" min={minDate()} value={rescheduleDate}
                                  onChange={e => setRescheduleDate(e.target.value)}
                                  className="flex-1 rounded-xl px-3 py-2 border text-sm outline-none"
                                  style={{ borderColor: '#E8E0D0', backgroundColor: '#FDFAF5', color: '#1A1209', fontFamily: 'Inter' }}
                                />
                                <input type="time" value={rescheduleTime}
                                  onChange={e => setRescheduleTime(e.target.value)}
                                  className="w-24 rounded-xl px-3 py-2 border text-sm outline-none"
                                  style={{ borderColor: '#E8E0D0', backgroundColor: '#FDFAF5', color: '#1A1209', fontFamily: 'Inter' }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Buttons */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button onClick={() => decide(appt.id, 'APPROVE')} disabled={isActing}
                              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm cursor-pointer"
                              style={{ backgroundColor: isActing ? '#C8BFA8' : '#2d7a4e', color: '#fff' }}>
                              <CheckCircle className="w-4 h-4" /> ተቀበል
                            </button>
                            <button onClick={() => decide(appt.id, 'RESCHEDULE')} disabled={isActing}
                              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm cursor-pointer border-2"
                              style={{ borderColor: '#93510f', color: '#93510f', backgroundColor: 'transparent' }}>
                              <RotateCcw className="w-4 h-4" /> እንደገና ያዝ
                            </button>
                            <button onClick={() => decide(appt.id, 'REJECT')} disabled={isActing}
                              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm cursor-pointer border-2"
                              style={{ borderColor: '#800020', color: '#800020', backgroundColor: 'transparent' }}>
                              <XCircle className="w-4 h-4" /> ውድቅ አድርግ
                            </button>
                          </div>
                        </>
                      )}

                      {/* Mark complete — only for APPROVED */}
                      {appt.status === 'APPROVED' && (
                        <button onClick={() => decide(appt.id, 'COMPLETE')} disabled={isActing}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm cursor-pointer"
                          style={{ backgroundColor: isActing ? '#C8BFA8' : '#2d7a4e', color: '#fff' }}>
                          <CheckCircle className="w-4 h-4" /> ቀጠሮ ተጠናቋል
                        </button>
                      )}

                      {/* Rescheduled info */}
                      {appt.status === 'RESCHEDULED' && appt.confirmedDate && (
                        <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: 'rgba(147,81,15,0.07)', border: '1px solid rgba(147,81,15,0.2)' }}>
                          <p className="text-[10px] font-bold uppercase mb-1" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>
                            አዲስ ቀን
                          </p>
                          <p className="font-bold" style={{ color: '#93510f', fontFamily: 'Inter' }}>
                            {formatDate(appt.confirmedDate)}
                          </p>
                        </div>
                      )}

                      {appt.priestNote && (
                        <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: 'rgba(128,0,32,0.05)', border: '1px solid rgba(128,0,32,0.15)', color: '#4B3A2A' }}>
                          <p className="text-[10px] font-bold uppercase mb-1" style={{ color: '#800020', fontFamily: 'Inter' }}>
                            ምላሽዎ
                          </p>
                          {appt.priestNote}
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
