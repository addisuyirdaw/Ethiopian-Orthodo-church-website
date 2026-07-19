// src/components/PriestAppointmentsPanel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import {
  Calendar, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, MessageSquare
} from 'lucide-react';

interface Follower {
  id: string;
  fullName: string;
  email: string;
}

interface Appointment {
  id: string;
  appointmentType: string;
  status: string;
  requestedDate: string;
  confirmedDate?: string;
  followerNote?: string;
  priestNote?: string;
  follower: Follower;
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
  RESCHEDULED: { label: 'Rescheduled — ተቀይሯል',   color: '#3b82f6', icon: <Calendar className="w-3.5 h-3.5" /> },
  COMPLETED:   { label: 'Completed — ተጠናቅቋል',    color: '#a78bfa', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  CANCELLED:   { label: 'Cancelled — ተሰርዟል',     color: '#6b7280', icon: <XCircle className="w-3.5 h-3.5" /> },
};

export const PriestAppointmentsPanel: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({ PENDING: 0, APPROVED: 0, COMPLETED: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Decision state
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT' | 'RESCHEDULE' | 'COMPLETE'>('APPROVE');
  const [confirmedDate, setConfirmedDate] = useState('');
  const [priestNote, setPriestNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = statusFilter ? `?status=${statusFilter}` : '';
      const [apptRes, statsRes] = await Promise.all([
        api.get(`/appointments/priest${query}`),
        api.get('/appointments/priest/stats')
      ]);
      setAppointments(apptRes.data.data || []);
      setStats(statsRes.data.data || {});
    } catch (err: any) {
      setError(err.response?.data?.message || 'Access denied. Requires PRIEST role.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/appointments/${selectedAppt.id}/decide`, {
        decision,
        confirmedDate: decision === 'RESCHEDULE' ? new Date(confirmedDate).toISOString() : undefined,
        priestNote: priestNote || undefined
      });
      setSuccess('ቀጠሮው ተዘምኗል! Appointment decision saved.');
      setSelectedAppt(null);
      setPriestNote('');
      setConfirmedDate('');
      fetchAppointments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl p-5 shadow-md" style={{ background: 'linear-gradient(135deg,#800020,#4A154B)', borderBottom: '2px solid #D4AF37' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2" style={{ fontFamily: "'Playfair Display',serif" }}>
              <Calendar className="w-5 h-5" style={{ color: '#D4AF37' }} />
              ቀጠሮዎች አስተዳደር — Confession Queue
            </h2>
            <p className="text-sm text-purple-200 mt-1">Manage and track spiritual children appointments</p>
          </div>
          <button onClick={fetchAppointments} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-white font-bold text-sm transition-all">
            <RefreshCw className="w-4 h-4" /> Refresh Queue
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border flex flex-col items-center" style={{ backgroundColor: '#140c14', borderColor: '#3d2040' }}>
          <span className="text-2xl font-black" style={{ color: '#D4AF37' }}>{stats.PENDING || 0}</span>
          <span className="text-xs opacity-75 mt-1 font-bold">Pending — በጥበቃ ላይ</span>
        </div>
        <div className="p-4 rounded-xl border flex flex-col items-center" style={{ backgroundColor: '#140c14', borderColor: '#3d2040' }}>
          <span className="text-2xl font-black text-green-400">{stats.APPROVED || 0}</span>
          <span className="text-xs opacity-75 mt-1 font-bold">Approved — የተፈቀዱ</span>
        </div>
        <div className="p-4 rounded-xl border flex flex-col items-center" style={{ backgroundColor: '#140c14', borderColor: '#3d2040' }}>
          <span className="text-2xl font-black text-purple-400">{stats.COMPLETED || 0}</span>
          <span className="text-xs opacity-75 mt-1 font-bold">Completed — ያለቁ</span>
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

      {/* Filter Options */}
      <div className="flex gap-2">
        <button onClick={() => setStatusFilter('')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === '' ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}>All</button>
        <button onClick={() => setStatusFilter('PENDING')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'PENDING' ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}>Pending</button>
        <button onClick={() => setStatusFilter('APPROVED')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'APPROVED' ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}>Approved</button>
        <button onClick={() => setStatusFilter('COMPLETED')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'COMPLETED' ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}>Completed</button>
      </div>

      {/* Decision Modal / Form */}
      {selectedAppt && (
        <form onSubmit={handleDecision} className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: '#1a0f1a', borderColor: '#3d2040' }}>
          <h3 className="font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: '#D4AF37' }} />
            Update Appointment: {selectedAppt.follower.fullName}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: '#D4AF37' }}>Decision</label>
              <select value={decision} onChange={e => setDecision(e.target.value as any)}
                className="w-full rounded-lg p-2 text-sm border focus:outline-none"
                style={{ backgroundColor: '#120b12', borderColor: '#4a1a4a', color: '#f2eeee' }}>
                <option value="APPROVE">Approve Appointment</option>
                <option value="REJECT">Reject Appointment</option>
                <option value="RESCHEDULE">Reschedule Appointment</option>
                <option value="COMPLETE">Mark Completed</option>
              </select>
            </div>

            {decision === 'RESCHEDULE' && (
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#D4AF37' }}>New Confirmed Date</label>
                <input type="datetime-local" value={confirmedDate} onChange={e => setConfirmedDate(e.target.value)} required
                  className="w-full rounded-lg p-2 text-sm border focus:outline-none"
                  style={{ backgroundColor: '#120b12', borderColor: '#4a1a4a', color: '#f2eeee' }} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: '#D4AF37' }}>
              <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
              Reply Note (sent to follower)
            </label>
            <textarea rows={3} value={priestNote} onChange={e => setPriestNote(e.target.value)} placeholder="Type instructions or reason..."
              className="w-full rounded-lg p-2 text-sm border focus:outline-none resize-none"
              style={{ backgroundColor: '#120b12', borderColor: '#4a1a4a', color: '#f2eeee' }} />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-lg font-bold text-sm transition-all hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: '#D4AF37', color: '#1a0a1a' }}>
              {submitting ? 'Saving…' : 'Save Decision'}
            </button>
            <button type="button" onClick={() => setSelectedAppt(null)}
              className="px-4 py-2.5 rounded-lg text-sm border transition-all hover:opacity-70"
              style={{ borderColor: '#4a1a4a', color: '#a0a0a0' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Appointment Queue List */}
      <div className="space-y-3">
        {loading && <div className="text-center py-8 opacity-50 text-sm">Loading queue…</div>}
        {!loading && appointments.length === 0 && (
          <div className="text-center py-12 rounded-xl border border-dashed" style={{ borderColor: '#3d2040' }}>
            <Clock className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: '#D4AF37' }} />
            <p className="text-sm opacity-60">No appointments in this category.</p>
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
                    <span className="text-xs opacity-50 font-medium">Type: {TYPE_LABELS[appt.appointmentType] || appt.appointmentType}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{appt.follower.fullName}</h4>
                  <p className="text-xs opacity-55">{appt.follower.email}</p>
                  <p className="text-xs mt-2 opacity-75">
                    Requested Date: {new Date(appt.requestedDate).toLocaleString()}
                  </p>
                  {appt.confirmedDate && (
                    <p className="text-xs text-green-400 font-bold">
                      Confirmed: {new Date(appt.confirmedDate).toLocaleString()}
                    </p>
                  )}
                  {appt.followerNote && (
                    <p className="text-xs mt-2 p-2 rounded bg-slate-800/40 italic">
                      " {appt.followerNote} "
                    </p>
                  )}
                  {appt.priestNote && (
                    <p className="text-xs mt-1 text-amber-300">
                      Your response: {appt.priestNote}
                    </p>
                  )}
                </div>

                {appt.status !== 'COMPLETED' && appt.status !== 'REJECTED' && (
                  <button onClick={() => { setSelectedAppt(appt); setDecision(appt.status === 'PENDING' ? 'APPROVE' : 'COMPLETE'); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-80 transition-all border"
                    style={{ borderColor: '#D4AF37', color: '#D4AF37' }}>
                    Action
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
