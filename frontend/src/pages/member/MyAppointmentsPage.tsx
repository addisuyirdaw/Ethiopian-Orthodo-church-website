// frontend/src/pages/member/MyAppointmentsPage.tsx
// Phase 3 — የኔ ቀጠሮዎች — Member views and manages their own appointments
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { CalendarDays, Clock, CheckCircle, XCircle, RotateCcw, Trash2, AlertCircle } from 'lucide-react';
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
  priest: {
    id: string;
    fullName: string;
    nameAm?: string | null;
  };
}

const STATUS_MAP: Record<string, { label: string; icon: React.ElementType; bg: string; text: string; border: string }> = {
  PENDING: {
    label: 'በመጠባበቅ',
    icon: Clock,
    bg: 'rgba(26,107,158,0.08)',
    text: '#1a6b9e',
    border: 'rgba(26,107,158,0.2)',
  },
  APPROVED: {
    label: 'ተቀባይነት አግኝቷል',
    icon: CheckCircle,
    bg: 'rgba(45,122,78,0.08)',
    text: '#2d7a4e',
    border: 'rgba(45,122,78,0.2)',
  },
  REJECTED: {
    label: 'ውድቅ ተደርጓል',
    icon: XCircle,
    bg: 'rgba(128,0,32,0.08)',
    text: '#800020',
    border: 'rgba(128,0,32,0.2)',
  },
  RESCHEDULED: {
    label: 'እንደገና ተይዟል',
    icon: RotateCcw,
    bg: 'rgba(147,81,15,0.08)',
    text: '#93510f',
    border: 'rgba(147,81,15,0.2)',
  },
  COMPLETED: {
    label: 'ተጠናቋል',
    icon: CheckCircle,
    bg: 'rgba(45,122,78,0.15)',
    text: '#2d7a4e',
    border: 'rgba(45,122,78,0.3)',
  },
  CANCELLED: {
    label: 'ተሰርዟል',
    icon: Trash2,
    bg: 'rgba(100,100,100,0.08)',
    text: '#6B5E45',
    border: 'rgba(100,100,100,0.15)',
  },
};

const TYPE_LABELS: Record<string, string> = {
  CONFESSION: 'ንስሐ', COUNSELING: 'ምክር', ASRAT_REVIEW: 'ዐሥራትና ስጦታ', GENERAL: 'ጠቅላላ', EMERGENCY: 'ድንገተኛ',
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const months = ['ጃን', 'ፌብ', 'ማር', 'ኤፕ', 'ሜይ', 'ጁን', 'ጁላ', 'ኦገ', 'ሴፕ', 'ኦክ', 'ኖቭ', 'ዲሴ'];
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} — ${time}`;
}

type FilterTab = 'ALL' | 'PENDING' | 'APPROVED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

export const MyAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>('ALL');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/appointments/my');
      setAppointments(r.data?.data ?? r.data ?? []);
    } catch { setAppointments([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const cancel = async (id: string) => {
    if (!window.confirm('ቀጠሮውን ሊሰርዙ ይፈልጋሉ?')) return;
    setCancelling(id);
    try {
      await api.put(`/appointments/${id}/cancel`);
      showToast('ቀጠሮው ተሰርዟል');
      await load();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? 'ስህተት' : 'ስህተት';
      showToast(`⚠️ ${msg}`);
    } finally {
      setCancelling(null);
    }
  };

  const filtered = tab === 'ALL' ? appointments : appointments.filter(a => a.status === tab);

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'ALL', label: 'ሁሉም' },
    { key: 'PENDING', label: 'በመጠባበቅ' },
    { key: 'APPROVED', label: 'ተቀብሏል' },
    { key: 'RESCHEDULED', label: 'ተቀይሯል' },
    { key: 'COMPLETED', label: 'ተጠናቋል' },
    { key: 'REJECTED', label: 'ውድቅ' },
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
      <div className="py-12 px-4 text-white" style={{ background: 'linear-gradient(135deg, #1A0F0A, #800020)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#D4AF37', fontFamily: 'Inter' }}>
              ☩ ቀጠሮ
            </p>
            <h1 className="text-3xl font-extrabold">የኔ ቀጠሮዎች</h1>
          </div>
          <Link to="/member/book-appointment"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm"
            style={{ backgroundColor: '#D4AF37', color: '#1A0F0A' }}>
            <CalendarDays className="w-4 h-4" /> አዲስ ቀጠሮ
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {TABS.map(({ key, label }) => {
            const count = key === 'ALL' ? appointments.length : appointments.filter(a => a.status === key).length;
            return (
              <button key={key} onClick={() => setTab(key)}
                className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold border-2 transition cursor-pointer whitespace-nowrap"
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

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-t-[#800020] border-[#E8E0D0] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border" style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
            <CalendarDays className="w-10 h-10 mx-auto mb-3" style={{ color: '#E8E0D0' }} />
            <p className="font-bold mb-2" style={{ color: '#1A1209' }}>ቀጠሮ የለም</p>
            <Link to="/member/book-appointment"
              className="inline-block mt-3 px-6 py-2 rounded-xl font-bold text-sm"
              style={{ backgroundColor: '#800020', color: '#fff' }}>
              ቀጠሮ ጠይቅ
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(appt => {
              const cfg = STATUS_MAP[appt.status] ?? STATUS_MAP.PENDING;
              const Icon = cfg.icon;
              const isPending = appt.status === 'PENDING';

              return (
                <article key={appt.id} className="rounded-2xl border overflow-hidden"
                  style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
                  <div className="p-5 flex flex-col gap-4">
                    {/* Top row: type + status badge */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 shrink-0" style={{ color: '#800020' }} />
                        <span className="font-bold text-sm" style={{ color: '#1A1209' }}>
                          {TYPE_LABELS[appt.appointmentType] ?? appt.appointmentType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                        style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border }}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </div>
                    </div>

                    {/* Priest */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0"
                        style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: '#800020', border: '2px solid rgba(128,0,32,0.12)' }}>
                        {appt.priest.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>
                          የንስሐ አባት
                        </p>
                        <p className="font-bold text-sm" style={{ color: '#1A1209' }}>{appt.priest.fullName}</p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl p-3" style={{ backgroundColor: '#F5F0E8' }}>
                        <p className="text-[10px] font-bold uppercase" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>
                          የተጠየቀ ቀን
                        </p>
                        <p className="text-sm font-bold mt-1" style={{ color: '#1A1209', fontFamily: 'Inter' }}>
                          {formatDateTime(appt.requestedDate)}
                        </p>
                      </div>
                      {appt.confirmedDate && (
                        <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(45,122,78,0.07)' }}>
                          <p className="text-[10px] font-bold uppercase" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>
                            የተረጋገጠ ቀን
                          </p>
                          <p className="text-sm font-bold mt-1" style={{ color: '#2d7a4e', fontFamily: 'Inter' }}>
                            {formatDateTime(appt.confirmedDate)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {appt.followerNote && (
                      <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: '#FDFAF5', border: '1px solid #E8E0D0', color: '#4B3A2A' }}>
                        <p className="text-[10px] font-bold uppercase mb-1" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>
                          ማስታወሻዬ
                        </p>
                        {appt.followerNote}
                      </div>
                    )}
                    {appt.priestNote && (
                      <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: 'rgba(128,0,32,0.04)', border: '1px solid rgba(128,0,32,0.15)', color: '#4B3A2A' }}>
                        <div className="flex items-center gap-1 mb-1">
                          <AlertCircle className="w-3 h-3" style={{ color: '#800020' }} />
                          <p className="text-[10px] font-bold uppercase" style={{ color: '#800020', fontFamily: 'Inter' }}>
                            ካህኑ ምላሽ
                          </p>
                        </div>
                        {appt.priestNote}
                      </div>
                    )}

                    {/* Cancel button */}
                    {isPending && (
                      <button
                        onClick={() => cancel(appt.id)}
                        disabled={cancelling === appt.id}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm border-2 cursor-pointer transition"
                        style={{ borderColor: '#E8E0D0', color: '#6B5E45' }}>
                        {cancelling === appt.id
                          ? <div className="w-4 h-4 rounded-full border-2 border-[#9B8E7A] border-t-transparent animate-spin" />
                          : <><Trash2 className="w-4 h-4" /> ቀጠሮ ሰርዝ</>
                        }
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
