// src/components/SebekaGubaeSeatsPanel.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Users, Plus, RefreshCw, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

const roleMap = {
  'LIQE_MENBER': 'Chairperson (ሊቀ መንበር)',
  'MEK_LIQE_MENBER': 'Vice Chairperson (ምክትል ሊቀ መንበር)',
  'WANA_TSEHAFI': 'Secretary (ዋና ጸሐፊ)',
  'GENZEB_YAZHI': 'Treasurer (ገንዘብ ያዥ)',
  'HISAB_SHUM': 'Accountant (ሒሳብ ሹም)'
};

export const SebekaGubaeSeatsPanel: React.FC = () => {
  // Sample parish institution ID matching db seed
  const institutionId = '006747ed-825d-422d-a2bc-785beab20bb6';

  const [seats, setSeats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('LIQE_MENBER');
  const [termStart, setTermStart] = useState(new Date().toISOString().split('T')[0]);
  const [termEnd, setTermEnd] = useState(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveResult, setSaveResult] = useState('');

  const fetchSeats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/governance/sebeka-gubae/seats/${institutionId}`);
      setSeats(res.data.data || res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not fetch council seats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeats();
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;
    setSaveLoading(true);
    setSaveResult('');
    setError('');

    try {
      await api.post('/governance/sebeka-gubae/seats', {
        institutionId,
        userId: userId.trim(),
        role,
        termStart: new Date(termStart).toISOString(),
        termEnd: new Date(termEnd).toISOString(),
      });
      setSaveResult('Seat assigned successfully.');
      setUserId('');
      fetchSeats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not assign seat.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeactivate = async (seatId: string) => {
    if (!confirm('Are you sure you want to deactivate this council seat assignment?')) return;
    try {
      await api.delete(`/governance/sebeka-gubae/seats/${seatId}`);
      alert('Seat assignment deactivated successfully.');
      fetchSeats();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Deactivation failed.');
    }
  };

  return (
    <div className="rounded-xl border p-6 shadow-md" style={{ backgroundColor: 'var(--eotc-surface)', borderColor: 'var(--eotc-border)' }}>
      <div className="flex justify-between items-center border-b pb-4 mb-6" style={{ borderColor: 'var(--eotc-border)' }}>
        <h3 className="font-serif font-extrabold text-lg flex items-center gap-2" style={{ color: 'var(--eotc-gold)' }}>
          <Users className="w-5 h-5" />
          Sebeka Gubae Council Seats — ሰበካ ጉባኤ አባላት
        </h3>
        <button
          onClick={fetchSeats}
          className="p-2 border rounded-lg hover:bg-white/5 transition cursor-pointer"
          style={{ borderColor: 'var(--eotc-border)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--eotc-gold)' }} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
        
        {/* Assign Form */}
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-white">
            Assign Council Seat — የሰበካ ጉባኤ አባል መድብ
          </h4>

          <form onSubmit={handleAssign} className="space-y-4">
            {saveResult && (
              <div className="p-2.5 rounded-lg border flex items-center gap-2" style={{ backgroundColor: 'rgba(46,204,113,0.08)', borderColor: 'rgba(46,204,113,0.3)', color: '#2ecc71' }}>
                <CheckCircle className="w-4 h-4" />
                <span>{saveResult}</span>
              </div>
            )}
            {error && (
              <div className="p-2.5 rounded-lg border flex items-center gap-2" style={{ backgroundColor: 'rgba(231,76,60,0.08)', borderColor: 'rgba(231,76,60,0.3)', color: '#e74c3c' }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">User UUID / ምእመን መለያ</label>
              <input
                type="text"
                placeholder="e.g., 006747ed-825d-422d-a2bc-785beab20bb6"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
                style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                required
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">Council Role / የሰበካ ኃላፊነት</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none cursor-pointer"
                style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
              >
                {Object.entries(roleMap).map(([k, v]) => (
                  <option key={k} value={k} style={{ backgroundColor: 'var(--eotc-surface)' }}>{v}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">Term Start</label>
                <input
                  type="date"
                  value={termStart}
                  onChange={(e) => setTermStart(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
                  style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                  required
                />
              </div>
              <div>
                <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">Term End</label>
                <input
                  type="date"
                  value={termEnd}
                  onChange={(e) => setTermEnd(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
                  style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saveLoading || !userId.trim()}
              className="w-full py-2.5 rounded-lg font-bold shadow-md cursor-pointer transition transform hover:-translate-y-0.5 flex items-center justify-center gap-1.5"
              style={{ backgroundColor: 'var(--eotc-gold)', color: '#0a0809' }}
            >
              <Plus className="w-3.5 h-3.5" />
              {saveLoading ? 'Assigning...' : 'Assign Seat'}
            </button>
          </form>
        </div>

        {/* Seats List */}
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-white">
            Active Council Seat Assignments — የተመደቡ ኃላፊዎች
          </h4>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-60">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--eotc-gold)', borderTopColor: 'transparent' }} />
              <span className="text-[10px]">Loading seats...</span>
            </div>
          ) : seats.length === 0 ? (
            <p className="text-xs opacity-50 py-4 text-center">No active Sebeka seats assigned.</p>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {seats.map((seat: any) => (
                <div key={seat.id} className="p-3.5 rounded-xl border flex justify-between items-center bg-black/10" style={{ borderColor: 'var(--eotc-border)' }}>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold" style={{ color: 'var(--eotc-gold)' }}>
                      {roleMap[seat.role as keyof typeof roleMap] || seat.role}
                    </span>
                    <h5 className="font-bold text-white text-xs mt-0.5">{seat.user?.fullName || seat.userId}</h5>
                    <p className="text-[10px] opacity-65 mt-0.5">
                      Term: {new Date(seat.termStart).toLocaleDateString()} - {new Date(seat.termEnd).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeactivate(seat.id)}
                    className="p-2 border rounded-lg hover:bg-red-500/10 hover:border-red-500/30 transition cursor-pointer text-red-400"
                    title="Deactivate assignment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
