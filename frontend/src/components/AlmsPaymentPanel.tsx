// src/components/AlmsPaymentPanel.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CreditCard, ArrowRight, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export const AlmsPaymentPanel: React.FC = () => {
  const { userId, institutionId } = useAuth();
  const [amount, setAmount] = useState<number>(1000);
  const [currency, setCurrency] = useState<'ETB' | 'USD'>('ETB');
  const [provider, setProvider] = useState<'TELEBIRR' | 'CBE_BIRR' | 'STRIPE'>('TELEBIRR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  // Auto-switch provider options based on currency
  useEffect(() => {
    if (currency === 'ETB') {
      setProvider('TELEBIRR');
    } else {
      setProvider('STRIPE');
    }
  }, [currency]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      // Use the logged-in user's real institution ID from auth context
      const res = await api.post('/fintech/unified/transactions/initiate', {
        institutionId,
        userId: userId || undefined,
        amount,
        currency,
        provider
      });
      const resData = res.data.data || res.data;
      setResult(resData);
      if (resData.gatewayUrl) {
        window.open(resData.gatewayUrl, '_blank');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Initiation failed. Check credentials or mock setup.');
    } finally {
      setLoading(false);
    }
  };

  // EOTC Canonical Split Calculator (80% Parish / 15% Diocese / 5% Patriarchate)
  const parishShare = amount * 0.8;
  const dioceseShare = amount * 0.15;
  const patriarchateShare = amount * 0.05;

  return (
    <div className="rounded-xl border p-6 shadow-md" style={{ backgroundColor: 'var(--eotc-surface)', borderColor: 'var(--eotc-border)' }}>
      
      <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--eotc-border)' }}>
        <h3 className="font-serif font-extrabold text-lg flex items-center gap-2" style={{ color: 'var(--eotc-gold)' }}>
          <CreditCard className="w-5 h-5" />
          Submit Parish Tithe & Alms — ዐሥራት ወ ምጽዋት
        </h3>
        <p className="text-xs opacity-70 mt-1">
          Each offering is atomically split across the ecclesiastical hierarchy per Qale Awadi charter.
        </p>
      </div>

      <form onSubmit={handlePay} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Amount input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">Amount / መጠን</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-2.5 border rounded-lg text-sm bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
              style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
              required
            />
          </div>

          {/* Currency selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">Currency / ምንዛሬ</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'ETB' | 'USD')}
              className="w-full px-4 py-2.5 border rounded-lg text-sm bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none cursor-pointer"
              style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
            >
              <option value="ETB" style={{ backgroundColor: 'var(--eotc-surface)' }}>ETB (Ethiopian Birr)</option>
              <option value="USD" style={{ backgroundColor: 'var(--eotc-surface)' }}>USD (United States Dollar)</option>
            </select>
          </div>
        </div>

        {/* Provider selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">Payment Method / የክፍያ ዘዴ</label>
          <div className="flex gap-4">
            {currency === 'ETB' ? (
              <>
                <button
                  type="button"
                  onClick={() => setProvider('TELEBIRR')}
                  className={`flex-1 py-3 rounded-lg border text-sm font-bold transition ${provider === 'TELEBIRR' ? 'border-[var(--eotc-gold)] bg-white/5' : 'opacity-65'}`}
                  style={{ borderColor: provider === 'TELEBIRR' ? 'var(--eotc-gold)' : 'var(--eotc-border)', color: provider === 'TELEBIRR' ? 'var(--eotc-gold)' : '#F2EEEE' }}
                >
                  📱 Telebirr
                </button>
                <button
                  type="button"
                  onClick={() => setProvider('CBE_BIRR')}
                  className={`flex-1 py-3 rounded-lg border text-sm font-bold transition ${provider === 'CBE_BIRR' ? 'border-[var(--eotc-gold)] bg-white/5' : 'opacity-65'}`}
                  style={{ borderColor: provider === 'CBE_BIRR' ? 'var(--eotc-gold)' : 'var(--eotc-border)', color: provider === 'CBE_BIRR' ? 'var(--eotc-gold)' : '#F2EEEE' }}
                >
                  🏦 CBE Birr
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setProvider('STRIPE')}
                className="flex-1 py-3 rounded-lg border text-sm font-bold border-[var(--eotc-gold)] bg-white/5"
                style={{ color: 'var(--eotc-gold)' }}
              >
                💳 Stripe (Credit Card)
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Split Preview Card */}
        <div className="p-4 rounded-xl border bg-black/20" style={{ borderColor: 'var(--eotc-border)' }}>
          <h4 className="text-xs uppercase tracking-widest font-black mb-3" style={{ color: 'var(--eotc-gold)' }}>
            EOTC Hierarchy Ledger Split Preview
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 border rounded bg-black/10" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <p className="opacity-60 text-[9px] uppercase">Parish (80%)</p>
              <p className="font-extrabold text-sm text-white">{parishShare.toFixed(2)} {currency}</p>
            </div>
            <div className="p-2 border rounded bg-black/10" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <p className="opacity-60 text-[9px] uppercase">Diocese (15%)</p>
              <p className="font-extrabold text-sm" style={{ color: 'var(--eotc-gold)' }}>{dioceseShare.toFixed(2)} {currency}</p>
            </div>
            <div className="p-2 border rounded bg-black/10" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <p className="opacity-60 text-[9px] uppercase">Synod (5%)</p>
              <p className="font-extrabold text-sm text-emerald-400">{patriarchateShare.toFixed(2)} {currency}</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading || amount <= 0}
          className="w-full py-3 rounded-lg text-sm font-bold shadow-md cursor-pointer transition transform hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--eotc-gold)', color: '#0a0809' }}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Initiating Transaction...
            </>
          ) : (
            <>
              <ArrowRight className="w-4 h-4" />
              Pay Now via {provider.replace('_', ' ')}
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="p-3 rounded-lg border flex items-center gap-2 text-xs mt-4" style={{ backgroundColor: 'rgba(231,76,60,0.08)', borderColor: 'rgba(231,76,60,0.3)', color: '#e74c3c' }}>
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Gateway panel */}
      {result && (
        <div className="p-4 rounded-xl border mt-5 text-sm space-y-4 animate-fadeIn" style={{ backgroundColor: 'rgba(46,204,113,0.08)', borderColor: 'rgba(46,204,113,0.3)', color: '#2ecc71' }}>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="font-bold">Payment Initiated Successfully</span>
          </div>
          <div className="text-xs space-y-2">
            <p>
              <strong>Provider Reference: </strong> 
              <span className="font-mono bg-black/45 px-2 py-0.5 rounded border border-white/10" style={{ color: 'var(--eotc-gold)' }}>
                {result.providerRef}
              </span>
            </p>
            <p className="pt-2">
              <a 
                href={result.gatewayUrl || '#'} 
                target="_blank" 
                rel="noreferrer"
                className="inline-block px-4 py-2 border rounded-lg font-bold text-xs hover:bg-emerald-600 hover:text-white transition"
                style={{ borderColor: 'var(--eotc-gold)', color: 'var(--eotc-gold)' }}
              >
                Go to Payment Gateway ➔
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
