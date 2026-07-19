// src/components/AppointmentBookingPanel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays, Clock, MessageSquare, Plus, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, ChevronRight, User
} from 'lucide-react';

interface Priest {
  id: string;
  fullName: string;
  nameAm?: string;
}

interface Appointment {
  id: string;
  appointmentType: string;
  status: string;
  requestedDate: string;
  confirmedDate?: string;
  followerNote?: string;
  priestNote?: string;
  priest: { id: string; fullName: string; nameAm?: string };
}

const TYPE_LABELS: Record<string, string> = {
  CONFESSION:   'ኑዛዜ (Confession)',
  COUNSELING:   'ምክር (Counseling)',
  ASRAT_REVIEW: 'ዐሥራት ግምገማ (Tithe Review)',
  GENERAL:      'ጠቅላላ ቀጠሮ (General)',
  EMERGENCY:    'አስቸኳይ (Emergency)',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:     { label: 'Pending — በጥበቃ ላይ',    color: '#D4AF37', icon: <Clock className="w-3.5 h-3.5" /> },
  APPROVED:    { label: 'Approved — ፈቅዷል',       color: '#22c55e', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  REJECTED:    { label: 'Rejected — ተቀባይነት የለም', color: '#ef4444', icon: <XCircle className="w-3.5 h-3.5" /> },
  RESCHEDULED: { label: 'Rescheduled — ተቀይሯል',   color: '#3b82f6', icon: <CalendarDays className="w-3.5 h-3.5" /> },
  COMPLETED:   { label: 'Completed — ተጠናቅቋል',    color: '#a78bfa', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  CANCELLED:   { label: 'Cancelled — ተሰርዟል',     color: '#6b7280', icon: <XCircle className="w-3.5 h-3.5" /> },
};

export const AppointmentBookingPanel: React.FC = () => {
  const { institutionId } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [priests, setPriests] = useState<Priest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  // Form state
  const [priestId, setPriestId] = useState('');
  const [apptType, setApptType] = useState('GENERAL');
  const [reqDate, setReqDate] = useState('');
  const [note, setNote] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const apptRes = await api.get('/appointments/my');
      setAppointments(apptRes.data.data || []);

      // Fetch priests for this follower's institution
      if (institutionId) {
        try {
          const priestRes = await api.get(`/institutions/${institutionId}/priests`);
          setPriests(priestRes.data?.data || []);
        } catch {
          setPriests([]);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to load appointments.');
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priestId || !reqDate) { setError('Please select a priest and a date.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/appointments', {
        priestId,
        appointmentType: apptType,
        requestedDate: new Date(reqDate).toISOString(),
        followerNote: note || undefined,
      });
      setSuccess('ቀጠሮዎ ተልኳል! Your appointment request has been sent.');
      setShowForm(false);
      setPriestId(''); setReqDate(''); setNote('');
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send appointment request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl p-5 shadow-md" style={{ background: 'linear-gradient(135deg,#4A154B,#800020)', borderBottom: '2px solid #D4AF37' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2" style={{ fontFamily: "'Playfair Display',serif" }}>
              <CalendarDays className="w-5 h-5" style={{ color: '#D4AF37' }} />
              ቀጠሮ — Book Appointment
            </h2>
            <p className="text-sm text-purple-200 mt-1">Request a meeting with your spiritual father</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setSuccess(''); setError(''); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all hover:opacity-80"
            style={{ backgroundColor: '#D4AF37', color: '#1a0a1a' }}
          >
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-green-900/30 border border-green-700/50 text-green-300">
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-900/30 border border-red-700/50 text-red-300">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Booking Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: '#1a0f1a', borderColor: '#3d2040' }}>
          <h3 className="font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4" style={{ color: '#D4AF37' }} />
            New Appointment Request
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: '#D4AF37' }}>Appointment Type</label>
              <select value={apptType} onChange={e => setApptType(e.target.value)}
                className="w-full rounded-lg p-2 text-sm border focus:outline-none"
                style={{ backgroundColor: '#120b12', borderColor: '#4a1a4a', color: '#f2eeee' }}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: '#D4AF37' }}>Preferred Date *</label>
              <input type="datetime-local" value={reqDate} onChange={e => setReqDate(e.target.value)} required
                className="w-full rounded-lg p-2 text-sm border focus:outline-none"
                style={{ backgroundColor: '#120b12', borderColor: '#4a1a4a', color: '#f2eeee' }} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: '#D4AF37' }}>Spiritual Father (Priest) *</label>
            {priests.length > 0 ? (
              <select value={priestId} onChange={e => setPriestId(e.target.value)} required
                className="w-full rounded-lg p-2 text-sm border focus:outline-none"
                style={{ backgroundColor: '#120b12', borderColor: '#4a1a4a', color: '#f2eeee' }}>
                <option value="">— Select your spiritual father —</option>
                {priests.map(p => <option key={p.id} value={p.id}>{p.nameAm || p.fullName}</option>)}
              </select>
            ) : (
              <input placeholder="Enter priest user ID" value={priestId} onChange={e => setPriestId(e.target.value)} required
                className="w-full rounded-lg p-2 text-sm border focus:outline-none"
                style={{ backgroundColor: '#120b12', borderColor: '#4a1a4a', color: '#f2eeee' }} />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: '#D4AF37' }}>
              <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
              Your Message (optional)
            </label>
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Briefly describe the reason for your appointment..."
              className="w-full rounded-lg p-2 text-sm border focus:outline-none resize-none"
              style={{ backgroundColor: '#120b12', borderColor: '#4a1a4a', color: '#f2eeee' }} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-lg font-bold text-sm transition-all hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: '#D4AF37', color: '#1a0a1a' }}>
              {submitting ? 'Sending…' : 'Send Appointment Request — ቀጠሮ ላክ'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-lg text-sm border transition-all hover:opacity-70"
              style={{ borderColor: '#4a1a4a', color: '#a0a0a0' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Appointment List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold" style={{ color: '#D4AF37' }}>My Appointments ({appointments.length})</h3>
          <button onClick={fetchData} className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {loading && <div className="text-center py-8 opacity-50 text-sm">Loading…</div>}
        {!loading && appointments.length === 0 && (
          <div className="text-center py-12 rounded-xl border border-dashed" style={{ borderColor: '#3d2040' }}>
            <CalendarDays className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: '#D4AF37' }} />
            <p className="text-sm opacity-60">No appointments yet. Click "New Request" to book one.</p>
          </div>
        )}

        {appointments.map(appt => {
          const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.PENDING;
          return (
            <div key={appt.id} className="rounded-xl border p-4 transition-all hover:border-purple-600/50"
              style={{ backgroundColor: '#1a0f1a', borderColor: '#3d2040' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: cfg.color + '22', color: cfg.color, border: `1px solid ${cfg.color}44` }}>
                      {cfg.icon} <span className="ml-1">{cfg.label}</span>
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">{TYPE_LABELS[appt.appointmentType] || appt.appointmentType}</p>
                  <p className="text-xs mt-1 opacity-60 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {appt.priest?.nameAm || appt.priest?.fullName}
                  </p>
                  <p className="text-xs mt-0.5 opacity-50 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    Requested: {new Date(appt.requestedDate).toLocaleDateString('en-ET', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  {appt.confirmedDate && (
                    <p className="text-xs mt-0.5 text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Confirmed: {new Date(appt.confirmedDate).toLocaleDateString()}
                    </p>
                  )}
                  {appt.followerNote && <p className="text-xs mt-2 italic opacity-60">Your note: {appt.followerNote}</p>}
                  {appt.priestNote && (
                    <p className="text-xs mt-1 p-2 rounded-lg" style={{ backgroundColor: '#D4AF3722', color: '#D4AF37' }}>
                      Father's reply: {appt.priestNote}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 opacity-30" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
