// frontend/src/pages/member/BookAppointmentPage.tsx
// Phase 3 — ቀጠሮ ጠይቅ — Member requests a new appointment with their spiritual father
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { CalendarDays, Clock, MessageSquare, ChevronRight, CheckCircle } from 'lucide-react';
import axios from 'axios';

interface Priest {
  id: string;
  fullName: string;
  nameAm?: string | null;
  institution?: { nameAm?: string | null; nameEn?: string | null } | null;
}

const TYPE_LABELS: Record<string, string> = {
  CONFESSION: 'ንስሐ',
  COUNSELING: 'ምክር',
  ASRAT_REVIEW: 'ዐሥራትና ስጦታ',
  GENERAL: 'ጠቅላላ',
  EMERGENCY: 'ድንገተኛ',
};

const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
];

// Minimum date = tomorrow
function minDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export const BookAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [priest, setPriest] = useState<Priest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    appointmentType: 'GENERAL',
    date: '',
    time: '09:00',
    followerNote: '',
  });

  useEffect(() => {
    // Load spiritual father info to auto-fill priestId
    api.get('/members/profile').then(r => {
      const sf = r.data?.spiritualFather;
      if (sf) {
        setPriest(sf);
      } else {
        // Try from the assignment status
        api.get('/members/assignment/status').then(s => {
          if (s.data?.priest) setPriest(s.data.priest);
        }).catch(() => {});
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!priest) { setError('የንስሐ አባት አልተወሰነም። ቀጠሮ ሊያስያዙ አይችሉም።'); return; }
    if (!form.date) { setError('ቀን ይምረጡ'); return; }

    setSubmitting(true);
    setError('');
    try {
      // Combine date + time into ISO string
      const requestedDate = new Date(`${form.date}T${form.time}:00`).toISOString();

      await api.post('/appointments', {
        priestId: priest.id,
        appointmentType: form.appointmentType,
        requestedDate,
        followerNote: form.followerNote || undefined,
      });

      setSuccess(true);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? err.response?.data?.message ?? 'ስህተት ተፈጥሯል'
        : 'ስህተት ተፈጥሯል';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pub-bg font-ethiopic flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-t-[#800020] border-[#E8E0D0] animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen pub-bg font-ethiopic flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-3xl border p-10 flex flex-col items-center text-center gap-6"
          style={{ backgroundColor: '#fff', borderColor: 'rgba(45,122,78,0.3)', boxShadow: '0 8px 40px rgba(45,122,78,0.1)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(45,122,78,0.1)', border: '3px solid rgba(45,122,78,0.3)' }}>
            <CheckCircle className="w-10 h-10" style={{ color: '#2d7a4e' }} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold mb-2" style={{ color: '#1A1209' }}>ቀጠሮ ተልኳል! 📅</h1>
            <p className="text-base leading-relaxed" style={{ color: '#4B3A2A' }}>
              ቀጠሮዎ ወደ {priest?.fullName} ተልኳል።<br />
              ካህኑ ሲፈቅዱ ወይም ሲቀይሩ ማሳወቂያ ይደርስዎታል።
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <button onClick={() => navigate('/member/my-appointments')}
              className="w-full py-3 rounded-xl font-bold text-base"
              style={{ backgroundColor: '#800020', color: '#fff' }}>
              የኔ ቀጠሮዎች
            </button>
            <Link to="/member/profile" className="w-full py-3 rounded-xl font-bold text-base text-center border-2"
              style={{ borderColor: '#800020', color: '#800020' }}>
              ወደ ዳሽቦርዴ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pub-bg font-ethiopic">
      {/* Header */}
      <div className="py-12 px-4 text-white" style={{ background: 'linear-gradient(135deg, #1A0F0A, #800020)' }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#D4AF37', fontFamily: 'Inter' }}>
            ☩ Phase 3
          </p>
          <h1 className="text-3xl font-extrabold">ቀጠሮ ጠይቅ</h1>
          <p className="text-sm mt-2 opacity-75">ከንስሐ አባትዎ ጋር ቀጠሮ ለማዘጋጀት</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 pb-16 flex flex-col gap-5">

        {/* No spiritual father warning */}
        {!priest && (
          <div className="rounded-2xl border p-6 text-center" style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
            <p className="text-4xl mb-3">⚠️</p>
            <p className="font-bold mb-2" style={{ color: '#1A1209' }}>የንስሐ አባት አልተወሰነም</p>
            <p className="text-sm mb-4" style={{ color: '#6B5E45' }}>
              ቀጠሮ ለማስያዝ አስቀድሞ የንስሐ አባት ሊኖርዎ ይገባዋል
            </p>
            <Link to="/member/priests"
              className="inline-block px-6 py-2 rounded-xl font-bold text-sm"
              style={{ backgroundColor: '#800020', color: '#fff' }}>
              የንስሐ አባት ፈልግ
            </Link>
          </div>
        )}

        {/* Priest info card */}
        {priest && (
          <div className="rounded-2xl border p-5 flex items-center gap-4"
            style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
              style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: '#800020', border: '2px solid rgba(128,0,32,0.15)' }}>
              {priest.fullName.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>
                የንስሐ አባት
              </p>
              <p className="font-bold" style={{ color: '#1A1209' }}>{priest.fullName}</p>
              {priest.institution && (
                <p className="text-xs mt-0.5" style={{ color: '#6B5E45' }}>
                  {priest.institution.nameAm ?? priest.institution.nameEn}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Form card */}
        {priest && (
          <div className="rounded-2xl border p-6 flex flex-col gap-6"
            style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>

            {/* Appointment type */}
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 font-bold text-sm" style={{ color: '#1A1209' }}>
                <MessageSquare className="w-4 h-4" style={{ color: '#800020' }} />
                የቀጠሮ ዓይነት
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <button key={key} type="button" onClick={() => set('appointmentType', key)}
                    className="py-2.5 px-3 rounded-xl text-sm font-bold border-2 transition cursor-pointer"
                    style={{
                      borderColor: form.appointmentType === key ? '#800020' : '#E8E0D0',
                      backgroundColor: form.appointmentType === key ? 'rgba(128,0,32,0.07)' : 'transparent',
                      color: form.appointmentType === key ? '#800020' : '#4B3A2A',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 font-bold text-sm" style={{ color: '#1A1209' }}>
                <CalendarDays className="w-4 h-4" style={{ color: '#800020' }} />
                ቀን *
              </label>
              <input type="date" value={form.date} min={minDate()}
                onChange={e => set('date', e.target.value)}
                className="w-full rounded-xl px-4 py-3 border text-base outline-none"
                style={{ borderColor: '#E8E0D0', backgroundColor: '#FDFAF5', color: '#1A1209', fontFamily: 'Inter' }}
              />
            </div>

            {/* Time */}
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 font-bold text-sm" style={{ color: '#1A1209' }}>
                <Clock className="w-4 h-4" style={{ color: '#800020' }} />
                ሰዓት (የፈለጉት)
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {TIME_SLOTS.map(t => (
                  <button key={t} type="button" onClick={() => set('time', t)}
                    className="py-2 rounded-xl text-xs font-bold border-2 transition cursor-pointer"
                    style={{
                      borderColor: form.time === t ? '#800020' : '#E8E0D0',
                      backgroundColor: form.time === t ? 'rgba(128,0,32,0.07)' : 'transparent',
                      color: form.time === t ? '#800020' : '#4B3A2A',
                      fontFamily: 'Inter',
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-sm" style={{ color: '#1A1209' }}>ማስታወሻ (አማራጭ)</label>
              <textarea
                value={form.followerNote}
                onChange={e => set('followerNote', e.target.value)}
                placeholder="ለምን ቀጠሮ እንደሚጠይቁ ያስፈልጋቸዋል..."
                rows={4}
                className="w-full rounded-xl px-4 py-3 border text-sm outline-none resize-none"
                style={{ borderColor: '#E8E0D0', backgroundColor: '#FDFAF5', color: '#1A1209', fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm px-4 py-3 rounded-xl"
                style={{ backgroundColor: 'rgba(128,0,32,0.07)', color: '#800020', border: '1px solid rgba(128,0,32,0.2)' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button type="button" onClick={submit} disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base cursor-pointer"
              style={{ backgroundColor: submitting ? '#C8BFA8' : '#800020', color: '#fff' }}>
              {submitting
                ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> ቀጠሮ በመላክ...</>
                : <><CalendarDays className="w-5 h-5" /> ቀጠሮ ላክ <ChevronRight className="w-4 h-4" /></>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
