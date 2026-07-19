// src/components/FollowerCrmPanel.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Users, Plus, RefreshCw, AlertTriangle, Pencil, Trash2, CheckCircle } from 'lucide-react';

interface Follower {
  id: string;
  nameAm?: string;
  fullName?: string;
  sex?: string;
  location?: string;
  lastAsratDate?: string;
  paymentStatus?: string;
}

export const FollowerCrmPanel: React.FC = () => {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [delayedCount, setDelayedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('orthodox123');
  const [newFullName, setNewFullName] = useState('');
  const [newSex, setNewSex] = useState('MALE');
  const [newLocation, setNewLocation] = useState('');
  const [createResult, setCreateResult] = useState('');

  const fetchFollowers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/priest/my-followers');
      setFollowers(res.data.data || []);
      setDelayedCount(res.data.delayedCount || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Access denied. Requires PRIEST role.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFollowers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateResult('');
    try {
      await api.post('/priest/followers', {
        email: newEmail,
        password: newPassword,
        fullName: newFullName,
        sex: newSex || null,
        location: newLocation || null,
      });
      setCreateResult('Follower created successfully.');
      setNewEmail(''); setNewFullName(''); setNewLocation('');
      setShowCreate(false);
      fetchFollowers();
    } catch (err: any) {
      setCreateResult(err.response?.data?.message || 'Could not create follower.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async (f: Follower) => {
    const email = prompt('Email (leave blank to keep):', '');
    const fullName = prompt('Full name (leave blank to keep):', f.fullName || f.nameAm || '');
    const password = prompt('New password (leave blank to keep):', '');
    const sex = prompt('Sex MALE/FEMALE (leave blank to keep):', f.sex || '');
    const location = prompt('Location (leave blank to keep):', f.location || '');
    const payload: Record<string, string> = {};
    if (email) payload.email = email;
    if (fullName) payload.fullName = fullName;
    if (password) payload.password = password;
    if (sex) payload.sex = sex;
    if (location) payload.location = location;
    if (!Object.keys(payload).length) return;
    try {
      await api.put(`/priest/followers/${f.id}`, payload);
      fetchFollowers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Update failed.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this follower from your spiritual care?')) return;
    try {
      await api.delete(`/priest/followers/${id}`);
      fetchFollowers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Deletion failed.');
    }
  };

  return (
    <div className="rounded-xl border p-6 shadow-md" style={{ backgroundColor: 'var(--eotc-surface)', borderColor: 'var(--eotc-border)' }}>
      <div className="flex justify-between items-center border-b pb-4 mb-6" style={{ borderColor: 'var(--eotc-border)' }}>
        <div>
          <h3 className="font-serif font-extrabold text-lg flex items-center gap-2" style={{ color: 'var(--eotc-gold)' }}>
            <Users className="w-5 h-5" />
            Spiritual Children Registry — ምእምናን ዝርዝር
          </h3>
          {delayedCount > 0 && (
            <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
              ⚠ {delayedCount} follower(s) with delayed Asrat payments
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-3 py-1.5 border rounded-lg text-xs font-bold cursor-pointer transition hover:bg-white/5 flex items-center gap-1"
            style={{ borderColor: 'var(--eotc-gold)', color: 'var(--eotc-gold)' }}
          >
            <Plus className="w-3.5 h-3.5" /> Add Follower
          </button>
          <button onClick={fetchFollowers} className="p-2 border rounded-lg hover:bg-white/5 transition cursor-pointer" style={{ borderColor: 'var(--eotc-border)' }}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--eotc-gold)' }} />
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="p-4 rounded-xl border mb-6 space-y-3 text-xs" style={{ backgroundColor: 'rgba(212,175,55,0.04)', borderColor: 'var(--eotc-border)' }}>
          <h4 className="font-bold uppercase tracking-wider" style={{ color: 'var(--eotc-gold)' }}>Register New Spiritual Child</h4>
          {createResult && (
            <div className="p-2 rounded border flex items-center gap-1" style={{ backgroundColor: createResult.includes('success') ? 'rgba(46,204,113,0.08)' : 'rgba(231,76,60,0.08)', borderColor: createResult.includes('success') ? 'rgba(46,204,113,0.3)' : 'rgba(231,76,60,0.3)', color: createResult.includes('success') ? '#2ecc71' : '#ef4444' }}>
              {createResult.includes('success') ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>{createResult}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block font-bold uppercase tracking-wider mb-1 opacity-70">Full Name</label>
              <input required value={newFullName} onChange={e => setNewFullName(e.target.value)} placeholder="Hailemariam Tekle" className="w-full px-3 py-2 border rounded-lg bg-black/35 outline-none focus:ring-1 focus:ring-[var(--eotc-gold)]" style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }} /></div>
            <div><label className="block font-bold uppercase tracking-wider mb-1 opacity-70">Email</label>
              <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@parish.et" className="w-full px-3 py-2 border rounded-lg bg-black/35 outline-none focus:ring-1 focus:ring-[var(--eotc-gold)]" style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }} /></div>
            <div><label className="block font-bold uppercase tracking-wider mb-1 opacity-70">Sex</label>
              <select value={newSex} onChange={e => setNewSex(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-black/35 outline-none cursor-pointer" style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}>
                <option value="MALE" style={{ background: 'var(--eotc-surface)' }}>MALE</option>
                <option value="FEMALE" style={{ background: 'var(--eotc-surface)' }}>FEMALE</option>
              </select></div>
            <div><label className="block font-bold uppercase tracking-wider mb-1 opacity-70">Location (Optional)</label>
              <input value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="Addis Ababa" className="w-full px-3 py-2 border rounded-lg bg-black/35 outline-none focus:ring-1 focus:ring-[var(--eotc-gold)]" style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }} /></div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={createLoading} className="px-4 py-2 rounded-lg font-bold cursor-pointer flex items-center gap-1" style={{ backgroundColor: 'var(--eotc-gold)', color: '#0a0809' }}>
              <Plus className="w-3.5 h-3.5" />{createLoading ? 'Creating...' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg font-bold border cursor-pointer" style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}>Cancel</button>
          </div>
        </form>
      )}

      {error && (
        <div className="p-3 rounded-lg border flex items-center gap-2 text-xs mb-4" style={{ backgroundColor: 'rgba(231,76,60,0.08)', borderColor: 'rgba(231,76,60,0.3)', color: '#e74c3c' }}>
          <AlertTriangle className="w-4 h-4" /><span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--eotc-gold)', borderTopColor: 'transparent' }} />
          <span className="text-xs opacity-60">Loading spiritual children...</span>
        </div>
      ) : followers.length === 0 ? (
        <p className="text-xs opacity-50 text-center py-8">No spiritual children assigned yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--eotc-border)' }}>
                {['Full Name', 'Sex', 'Location', 'Last Asrat', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-2.5 font-bold" style={{ color: 'var(--eotc-gold)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {followers.map(f => {
                const isDelayed = f.paymentStatus === 'DELAYED';
                return (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--eotc-border)', backgroundColor: isDelayed ? 'rgba(231,76,60,0.04)' : 'transparent' }}>
                    <td className="px-3 py-2.5 font-bold text-white font-serif">{f.nameAm || f.fullName || '—'}</td>
                    <td className="px-3 py-2.5">{f.sex || '—'}</td>
                    <td className="px-3 py-2.5">{f.location || '—'}</td>
                    <td className="px-3 py-2.5 font-mono">{f.lastAsratDate ? new Date(f.lastAsratDate).toLocaleDateString() : '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${isDelayed ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                        {isDelayed ? '🔴 DELAYED' : '✅ OK'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 flex gap-2">
                      <button onClick={() => handleEdit(f)} className="p-1.5 border rounded hover:bg-white/5 cursor-pointer" style={{ borderColor: 'var(--eotc-border)', color: 'var(--eotc-gold)' }} title="Edit"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => handleDelete(f.id)} className="p-1.5 border rounded hover:bg-red-500/10 cursor-pointer text-red-400 border-red-500/20" title="Remove"><Trash2 className="w-3 h-3" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
