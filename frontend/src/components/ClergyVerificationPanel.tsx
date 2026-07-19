// src/components/ClergyVerificationPanel.tsx
import React, { useState } from 'react';
import { api } from '../api/client';
import { Shield, Search, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export const ClergyVerificationPanel: React.FC = () => {
  const [clergyId, setClergyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clergyId.trim()) return;
    setLoading(false);
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.get(`/clergy/verify/${clergyId.trim()}`);
      setResult(res.data.data || res.data);
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 400) {
        setResult({ verified: false, message: err.response.data?.message || 'Verification failed. Canonical standing revoked.' });
      } else {
        setError(err.response?.data?.message || 'Could not verify clergy standing.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border p-6 shadow-md" style={{ backgroundColor: 'var(--eotc-surface)', borderColor: 'var(--eotc-border)' }}>
      <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--eotc-border)' }}>
        <h3 className="font-serif font-extrabold text-lg flex items-center gap-2" style={{ color: 'var(--eotc-gold)' }}>
          <Shield className="w-5 h-5" />
          Clergy Standing Verification — የካህናት ቀኖናዊ ሁኔታ መዝገብ
        </h3>
        <p className="text-xs opacity-70 mt-1">
          Verify the ecclesiastical authority of any clergy member to perform sacramental rites.
        </p>
      </div>

      <form onSubmit={handleVerify} className="flex gap-3 items-end">
        <div className="flex-grow">
          <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">Clergy / User UUID</label>
          <input
            type="text"
            value={clergyId}
            onChange={(e) => setClergyId(e.target.value)}
            placeholder="e.g., 006747ed-825d-422d-a2bc-785beab20bb6"
            className="w-full px-4 py-2.5 border rounded-lg text-sm bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
            style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading || !clergyId.trim()}
          className="px-6 py-3 rounded-lg text-sm font-bold shadow-md cursor-pointer transition transform hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2"
          style={{ backgroundColor: 'var(--eotc-gold)', color: '#0a0809' }}
        >
          <Search className="w-4 h-4" />
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      {error && (
        <div className="p-3 rounded-lg border flex items-center gap-2 text-xs mt-4" style={{ backgroundColor: 'rgba(231,76,60,0.08)', borderColor: 'rgba(231,76,60,0.3)', color: '#e74c3c' }}>
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-6 animate-fadeIn">
          {result.verified ? (
            <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'rgba(46,204,113,0.08)', borderColor: 'rgba(46,204,113,0.3)', color: '#2ecc71' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="font-bold">ይህ አገልጋይ ምስጢራትን ለመፈጸም ሥልጣን አለው። (Verified Good Standing)</span>
              </div>
              <div className="text-xs space-y-1 text-white">
                <p><strong>Clergy ID:</strong> {clergyId}</p>
                <p><strong>Status:</strong> <span className="text-green-400">ACTIVE_GOOD_STANDING</span></p>
                {result.message && <p className="opacity-70 mt-1">{result.message}</p>}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}>
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="font-bold">ቀኖናዊ ክልከላ — Canonical Authority Denied</span>
              </div>
              <div className="text-xs space-y-1 text-white">
                <p><strong>Clergy ID:</strong> {clergyId}</p>
                <p><strong>Status:</strong> <span className="text-red-400">REVOKED_OR_INACTIVE</span></p>
                {result.message && <p className="text-red-300 font-serif text-sm mt-1">{result.message}</p>}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
