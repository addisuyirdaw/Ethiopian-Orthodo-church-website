// src/pages/public/PrayerRequestPage.tsx
import React, { useState } from 'react';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';
import { CheckCircle, Send, Lock, Phone, User, MessageSquare } from 'lucide-react';
import axios from 'axios';

type FormState = 'idle' | 'loading' | 'success' | 'error';

interface FormData {
  fullName: string;
  phoneNumber: string;
  requestText: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const PrayerRequestPage: React.FC = () => {
  const [form, setForm] = useState<FormData>({ fullName: '', phoneNumber: '', requestText: '' });
  const [state, setState] = useState<FormState>('idle');
  const [error, setError] = useState<string>('');
  const [submittedId, setSubmittedId] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      setError('ሙሉ ስምዎን ያስገቡ (ቢያንስ 2 ፊደሎች)');
      return;
    }
    if (!form.requestText.trim() || form.requestText.trim().length < 10) {
      setError('የጸሎት ጥያቄዎን ያስገቡ (ቢያንስ 10 ፊደሎች)');
      return;
    }

    setState('loading');
    try {
      const res = await axios.post(`${API_BASE}/api/v1/website/prayer-request`, {
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        requestText: form.requestText.trim(),
      });
      setSubmittedId(res.data.id ?? '');
      setState('success');
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error ?? 'ስህተት ተፈጥሯል'
        : 'ስህተት ተፈጥሯል';
      setError(message);
      setState('error');
    }
  };

  return (
    <div className="min-h-screen pub-bg font-ethiopic">
      <PublicNavbar />

      {/* Page Hero */}
      <section
        className="py-20 px-4 sm:px-8 text-center text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1A0F0A 0%, #4A154B 60%, #800020 100%)' }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 80%, #D4AF37 0%, transparent 60%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#D4AF37', fontFamily: 'Inter, sans-serif' }}>
            ☩ ጸሎት
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">የጸሎት ጥያቄ</h1>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            ካህናቱ ጸሎትዎን ተቀብለው ያስቀምጣሉ — ሚስጥሩ ይጠበቃል
          </p>
        </div>
      </section>

      {/* Main area */}
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-14">

        {/* Privacy note */}
        <div
          className="flex items-start gap-3 rounded-2xl p-4 mb-8 border"
          style={{ backgroundColor: 'rgba(74,21,75,0.05)', borderColor: 'rgba(74,21,75,0.2)' }}
        >
          <Lock className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#4A154B' }} />
          <div>
            <p className="font-bold text-sm" style={{ color: '#1A1209' }}>ሚስጥርዎ ይጠበቃል</p>
            <p className="text-xs leading-relaxed mt-0.5" style={{ color: '#6B5E45' }}>
              ጸሎትዎ ለካህናቱ ብቻ ይደርሳል። ለሌሎች አይዳረስም።
            </p>
          </div>
        </div>

        {/* Success State */}
        {state === 'success' ? (
          <div
            className="rounded-3xl border p-10 flex flex-col items-center text-center gap-5"
            style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(45,122,78,0.3)', boxShadow: '0 8px 40px rgba(45,122,78,0.1)' }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(45,122,78,0.1)', border: '3px solid rgba(45,122,78,0.3)' }}
            >
              <CheckCircle className="w-10 h-10" style={{ color: '#2d7a4e' }} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold mb-2" style={{ color: '#1A1209' }}>
                ጸሎቱ ደርሷል!
              </h2>
              <p className="text-base leading-relaxed" style={{ color: '#4B3A2A' }}>
                ካህናቱ ጸሎትዎን ተቀብለዋል።
                <br />
                ምናለ ጌታ ይመልስ ለናንተ። 🙏
              </p>
            </div>
            {submittedId && (
              <div
                className="text-xs px-4 py-2 rounded-lg"
                style={{ backgroundColor: '#F5F0E8', color: '#6B5E45', fontFamily: 'Inter, monospace' }}
              >
                ቁጥር: {submittedId}
              </div>
            )}
            <button
              onClick={() => { setState('idle'); setForm({ fullName: '', phoneNumber: '', requestText: '' }); }}
              className="mt-2 px-8 py-3 rounded-full font-bold text-sm border-2 transition cursor-pointer"
              style={{ borderColor: '#800020', color: '#800020', backgroundColor: 'transparent' }}
            >
              ሌላ ጸሎት ላክ
            </button>
          </div>
        ) : (
          /* Form */
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border p-8 sm:p-10 flex flex-col gap-6"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D0', boxShadow: '0 4px 32px rgba(0,0,0,0.05)' }}
            noValidate
          >
            {/* Full Name */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="prayer-fullName"
                className="flex items-center gap-2 text-sm font-bold"
                style={{ color: '#1A1209' }}
              >
                <User className="w-4 h-4" style={{ color: '#800020' }} />
                ሙሉ ስምዎ
                <span style={{ color: '#800020' }}>*</span>
              </label>
              <input
                id="prayer-fullName"
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange}
                placeholder="ለምሳሌ: ሰለሞን ታደሰ"
                required
                className="w-full rounded-xl px-4 py-3 text-base border transition outline-none"
                style={{
                  borderColor: '#E8E0D0',
                  backgroundColor: '#FDFAF5',
                  color: '#1A1209',
                  fontFamily: "'Noto Sans Ethiopic', sans-serif",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#800020'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(128,0,32,0.08)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8E0D0'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Phone (optional) */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="prayer-phone"
                className="flex items-center gap-2 text-sm font-bold"
                style={{ color: '#1A1209' }}
              >
                <Phone className="w-4 h-4" style={{ color: '#800020' }} />
                ስልክ ቁጥር
                <span className="text-xs font-normal" style={{ color: '#9B8E7A' }}>(አማራጭ)</span>
              </label>
              <input
                id="prayer-phone"
                name="phoneNumber"
                type="tel"
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder="ለምሳሌ: 0911234567"
                className="w-full rounded-xl px-4 py-3 text-base border transition outline-none"
                style={{
                  borderColor: '#E8E0D0',
                  backgroundColor: '#FDFAF5',
                  color: '#1A1209',
                  fontFamily: 'Inter, sans-serif',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#800020'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(128,0,32,0.08)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8E0D0'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Prayer Request */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="prayer-request"
                className="flex items-center gap-2 text-sm font-bold"
                style={{ color: '#1A1209' }}
              >
                <MessageSquare className="w-4 h-4" style={{ color: '#800020' }} />
                የጸሎት ጥያቄዎ
                <span style={{ color: '#800020' }}>*</span>
              </label>
              <textarea
                id="prayer-request"
                name="requestText"
                rows={6}
                value={form.requestText}
                onChange={handleChange}
                placeholder="ጸሎትዎን እዚህ ይጻፉ... ካህናቱ ብቻ ያነባሉ።"
                required
                className="w-full rounded-xl px-4 py-3 text-base border transition outline-none resize-y"
                style={{
                  borderColor: '#E8E0D0',
                  backgroundColor: '#FDFAF5',
                  color: '#1A1209',
                  fontFamily: "'Noto Sans Ethiopic', sans-serif",
                  lineHeight: '1.7',
                  minHeight: '140px',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#800020'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(128,0,32,0.08)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8E0D0'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <p className="text-xs text-right" style={{ color: '#9B8E7A', fontFamily: 'Inter, sans-serif' }}>
                {form.requestText.length} ፊደሎች
              </p>
            </div>

            {/* Error */}
            {(state === 'error' || error) && (
              <div
                className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm border"
                style={{ backgroundColor: 'rgba(128,0,32,0.07)', borderColor: 'rgba(128,0,32,0.2)', color: '#800020' }}
              >
                ⚠️ {error || 'ስህተት ተፈጥሯል። እንደገና ይሞክሩ።'}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={state === 'loading'}
              className="flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-base transition-all cursor-pointer"
              style={{
                backgroundColor: state === 'loading' ? '#C8BFA8' : '#800020',
                color: '#FFFFFF',
                boxShadow: state === 'loading' ? 'none' : '0 4px 20px rgba(128,0,32,0.3)',
              }}
            >
              {state === 'loading' ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  በማስቀመጥ ላይ...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  ጸሎቴን ላክ
                </>
              )}
            </button>
          </form>
        )}

        {/* Status legend */}
        <div className="mt-8 rounded-2xl border p-5" style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D0' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9B8E7A', fontFamily: 'Inter, sans-serif' }}>
            የጸሎት ጥያቄ ሁኔታ
          </p>
          <div className="flex flex-col gap-3">
            {[
              { status: 'ተቀብሏል', color: '#1a6b9e', desc: 'ጸሎቱ ደርሷል — ካህናቱ ያዩታል' },
              { status: 'ጸሎት ተጀምሯል', color: '#2d7a4e', desc: 'ካህናቱ ጸሎቱን ጀምረዋል' },
              { status: 'ጸሎት ተፈጽሟል', color: '#800020', desc: 'ጸሎቱ ተፈጽሟል' },
            ].map(({ status, color, desc }) => (
              <div key={status} className="flex items-center gap-3">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold shrink-0"
                  style={{ backgroundColor: `${color}14`, color, border: `1px solid ${color}30` }}
                >
                  {status}
                </span>
                <span className="text-xs" style={{ color: '#6B5E45' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};
