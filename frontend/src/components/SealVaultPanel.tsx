// src/components/SealVaultPanel.tsx
import React, { useState } from 'react';
import { api } from '../api/client';
import { ShieldCheck, Lock, CheckCircle, XCircle, AlertTriangle, Key } from 'lucide-react';

export const SealVaultPanel: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'SEAL' | 'VERIFY'>('SEAL');

  // Seal states
  const [sealRecordId, setSealRecordId] = useState('');
  const [sealLoading, setSealLoading] = useState(false);
  const [sealResult, setSealResult] = useState('');
  const [sealError, setSealError] = useState('');

  // Verify states
  const [verifyRecordId, setVerifyRecordId] = useState('');
  const [verifySignature, setVerifySignature] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyError, setVerifyError] = useState('');

  const handleSeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sealRecordId.trim()) return;
    setSealLoading(true);
    setSealResult('');
    setSealError('');

    try {
      const res = await api.post(`/vault/seal/${sealRecordId.trim()}`);
      const data = res.data.data || res.data;
      setSealResult(data.cryptographicSeal || data.signature || JSON.stringify(data));
    } catch (err: any) {
      setSealError(err.response?.data?.message || err.response?.data?.error?.message || 'Could not generate cryptographic seal.');
    } finally {
      setSealLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyRecordId.trim() || !verifySignature.trim()) return;
    setVerifyLoading(true);
    setVerifyResult(null);
    setVerifyError('');

    try {
      const res = await api.post('/vault/verify-seal', {
        recordId: verifyRecordId.trim(),
        signature: verifySignature.trim()
      });
      setVerifyResult(res.data.data || res.data);
    } catch (err: any) {
      setVerifyError(err.response?.data?.message || 'Could not execute public seal check.');
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="rounded-xl border p-6 shadow-md" style={{ backgroundColor: 'var(--eotc-surface)', borderColor: 'var(--eotc-border)' }}>
      
      {/* Tab Select Header */}
      <div className="flex gap-4 border-b pb-4 mb-6" style={{ borderColor: 'var(--eotc-border)' }}>
        <button
          onClick={() => setActiveMode('SEAL')}
          className={`font-serif font-extrabold text-lg flex items-center gap-2 pb-2 border-b-2 transition cursor-pointer ${activeMode === 'SEAL' ? 'border-[var(--eotc-gold)] text-[var(--eotc-gold)]' : 'border-transparent opacity-60'}`}
        >
          <Lock className="w-5 h-5" />
          Generate Cryptographic Seal — ክሪፕቶ ማህተም ፍጠር
        </button>
        <button
          onClick={() => setActiveMode('VERIFY')}
          className={`font-serif font-extrabold text-lg flex items-center gap-2 pb-2 border-b-2 transition cursor-pointer ${activeMode === 'VERIFY' ? 'border-[var(--eotc-gold)] text-[var(--eotc-gold)]' : 'border-transparent opacity-60'}`}
        >
          <ShieldCheck className="w-5 h-5" />
          Verify Public Seal — ማህተም ትክክለኛነት አረጋግጥ
        </button>
      </div>

      {/* GENERATE SEAL */}
      {activeMode === 'SEAL' && (
        <form onSubmit={handleSeal} className="space-y-4 text-xs">
          <p className="opacity-70 leading-relaxed mb-4">
            Secures a Sacramental Record by sealing it with an RSA-PSS-SHA256 cryptographic Synod signature. The record will be permanently locked after creation.
          </p>

          {sealError && (
            <div className="p-3 rounded-lg border flex items-center gap-2" style={{ backgroundColor: 'rgba(231,76,60,0.08)', borderColor: 'rgba(231,76,60,0.3)', color: '#e74c3c' }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{sealError}</span>
            </div>
          )}

          <div>
            <label className="block font-bold uppercase tracking-wider mb-2 opacity-80">Sacramental Record ID (UUID)</label>
            <input
              type="text"
              placeholder="e.g., 006747ed-825d-422d-a2bc-785beab20bb6"
              value={sealRecordId}
              onChange={(e) => setSealRecordId(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-lg text-sm bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
              style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={sealLoading || !sealRecordId.trim()}
            className="w-full py-3 rounded-lg text-sm font-bold shadow-md cursor-pointer transition transform hover:-translate-y-0.5 flex items-center justify-center gap-1.5"
            style={{ backgroundColor: 'var(--eotc-gold)', color: '#0a0809' }}
          >
            <Key className="w-4 h-4" />
            {sealLoading ? 'Sealing...' : 'Generate Cryptographic Seal'}
          </button>

          {sealResult && (
            <div className="p-4 rounded-xl border bg-black/35 mt-6 space-y-3 animate-fadeIn" style={{ borderColor: 'var(--eotc-border)' }}>
              <h5 className="font-extrabold uppercase tracking-widest text-[9.5px]" style={{ color: 'var(--eotc-gold)' }}>
                ✓ RSA-PSS-SHA256 Cryptographic Seal Generated
              </h5>
              <div className="space-y-2">
                <div>
                  <span className="opacity-60 text-[9px] block">Seal Signature Hash (Save this safely):</span>
                  <p className="font-mono bg-black/45 p-2 rounded border border-white/5 select-all break-all" style={{ color: 'var(--eotc-gold)' }}>
                    {sealResult}
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      )}

      {/* VERIFY PUBLIC SEAL */}
      {activeMode === 'VERIFY' && (
        <form onSubmit={handleVerify} className="space-y-4 text-xs">
          <p className="opacity-70 leading-relaxed mb-4">
            Verify the canonical integrity of any sacramental certificate certificate record. This is a public search validation gateway.
          </p>

          {verifyError && (
            <div className="p-3 rounded-lg border flex items-center gap-2" style={{ backgroundColor: 'rgba(231,76,60,0.08)', borderColor: 'rgba(231,76,60,0.3)', color: '#e74c3c' }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{verifyError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider mb-2 opacity-80">Sacramental Record ID (UUID)</label>
              <input
                type="text"
                placeholder="e.g., 006747ed-825d-422d-a2bc-785beab20bb6"
                value={verifyRecordId}
                onChange={(e) => setVerifyRecordId(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg text-sm bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
                style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                required
              />
            </div>
            <div>
              <label className="block font-bold uppercase tracking-wider mb-2 opacity-80">Cryptographic Signature</label>
              <input
                type="text"
                placeholder="Enter RSA signature..."
                value={verifySignature}
                onChange={(e) => setVerifySignature(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg text-sm bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
                style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={verifyLoading || !verifyRecordId.trim() || !verifySignature.trim()}
            className="w-full py-3 rounded-lg text-sm font-bold shadow-md cursor-pointer transition transform hover:-translate-y-0.5 flex items-center justify-center gap-1.5"
            style={{ backgroundColor: 'var(--eotc-gold)', color: '#0a0809' }}
          >
            <ShieldCheck className="w-4 h-4" />
            {verifyLoading ? 'Verifying Seal...' : 'Verify Cryptographic Integrity'}
          </button>

          {verifyResult && (
            <div className="mt-6 animate-fadeIn">
              {verifyResult.verified ? (
                <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'rgba(46,204,113,0.08)', borderColor: 'rgba(46,204,113,0.3)', color: '#2ecc71' }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="font-bold">Seal Verified — Canonical Integrity Confirmed</span>
                  </div>
                  <div className="text-[10px] space-y-1 text-white">
                    <p><strong>Record ID:</strong> {verifyRecordId}</p>
                    <p><strong>Algorithm:</strong> RSA-PSS-SHA256</p>
                    <p><strong>Synod Seal Status:</strong> <span className="text-green-400 font-bold">APPROVED & SECURED</span></p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="font-bold">Seal Invalid — Integrity Check Failed</span>
                  </div>
                  <p className="text-xs text-red-300">
                    The provided signature is invalid or did not originate from the church cryptographic key.
                  </p>
                </div>
              )}
            </div>
          )}
        </form>
      )}

    </div>
  );
};
