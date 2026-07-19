// src/components/PaymentHistoryPanel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CreditCard, RefreshCw, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  SUCCESSFUL: {
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    color: '#2ecc71',
    label: 'Successful',
  },
  PENDING: {
    icon: <Clock className="w-3.5 h-3.5" />,
    color: '#f39c12',
    label: 'Pending',
  },
  FAILED: {
    icon: <XCircle className="w-3.5 h-3.5" />,
    color: '#e74c3c',
    label: 'Failed',
  },
};

const PROVIDER_LABEL: Record<string, string> = {
  TELEBIRR: '📱 Telebirr',
  CBE_BIRR: '🏦 CBE Birr',
  STRIPE: '💳 Stripe',
  CHAPA: '💰 Chapa',
};

export const PaymentHistoryPanel: React.FC = () => {
  const { institutionId } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    if (!institutionId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/v1/fintech/unified/transactions/history/${institutionId}`);
      setHistory(res.data.data || res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load your payment history.');
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="rounded-xl border p-6 shadow-md" style={{ backgroundColor: 'var(--eotc-surface)', borderColor: 'var(--eotc-border)' }}>
      <div className="flex justify-between items-center border-b pb-4 mb-6" style={{ borderColor: 'var(--eotc-border)' }}>
        <h3 className="font-serif font-extrabold text-lg flex items-center gap-2" style={{ color: 'var(--eotc-gold)' }}>
          <CreditCard className="w-5 h-5" />
          Payment History — የክፍያ ታሪክ
        </h3>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="p-2 border rounded-lg hover:bg-white/5 transition cursor-pointer disabled:opacity-50"
          style={{ borderColor: 'var(--eotc-border)' }}
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--eotc-gold)' }} />
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg border flex items-center gap-2 text-xs mb-4" style={{ backgroundColor: 'rgba(231,76,60,0.08)', borderColor: 'rgba(231,76,60,0.3)', color: '#e74c3c' }}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--eotc-gold)', borderTopColor: 'transparent' }} />
          <span className="text-xs opacity-60">Fetching contribution ledger…</span>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--eotc-gold)' }} />
          <p className="text-sm font-bold opacity-50">No contributions yet</p>
          <p className="text-xs opacity-40 mt-1">Your tithe and alms payments will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr style={{ backgroundColor: 'rgba(212,175,55,0.04)', borderBottom: '1px solid var(--eotc-border)' }}>
                <th className="px-4 py-3 font-bold uppercase tracking-wider" style={{ color: 'var(--eotc-gold)' }}>Date</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider" style={{ color: 'var(--eotc-gold)' }}>Reference</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider" style={{ color: 'var(--eotc-gold)' }}>Amount</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider" style={{ color: 'var(--eotc-gold)' }}>Provider</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider" style={{ color: 'var(--eotc-gold)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((tx: any) => {
                const statusCfg = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG['PENDING'];
                return (
                  <tr key={tx.id} className="transition hover:bg-white/[0.02]" style={{ borderBottom: '1px solid var(--eotc-border)' }}>
                    <td className="px-4 py-3 whitespace-nowrap opacity-80">
                      {tx.createdAt
                        ? new Date(tx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px]" style={{ color: 'var(--eotc-gold)' }}>
                      {tx.providerRef || '—'}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-white">
                      {parseFloat(tx.amount ?? 0).toFixed(2)}{' '}
                      <span className="opacity-60 font-normal">{tx.currency || 'ETB'}</span>
                    </td>
                    <td className="px-4 py-3 opacity-80">
                      {PROVIDER_LABEL[tx.provider] ?? tx.provider ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold border"
                        style={{
                          color: statusCfg.color,
                          borderColor: statusCfg.color + '44',
                          backgroundColor: statusCfg.color + '12',
                        }}
                      >
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-[10px] opacity-40 text-right mt-3">
            {history.length} transaction{history.length !== 1 ? 's' : ''} found
          </p>
        </div>
      )}
    </div>
  );
};
