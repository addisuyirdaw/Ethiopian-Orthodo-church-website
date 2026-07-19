// frontend/src/pages/public/RegistrationPage.tsx
// Phase 2 — ምዝገባ — Full registration form for new members (Debre Berhan Medhanealem, single-church)
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, ArrowRight, ArrowLeft, User, MapPin, Lock } from 'lucide-react';
import { api } from '../../api/client';

// ─── Step labels ──────────────────────────────────────────────────────────────
const STEPS = {
  account:  'መለያ',
  personal: 'ግለ-መረጃ',
  location: 'አድራሻ',
  done:     'ተጠናቋል',
};

type Step = keyof typeof STEPS;
const STEP_ORDER: Step[] = ['account', 'personal', 'location'];

// ─── Ethiopian Regions ────────────────────────────────────────────────────────
const REGIONS = [
  'አዲስ አበባ', 'አፋር', 'አማራ', 'ቤኒሻንጉል-ጉምዝ', 'ድሬዳዋ', 'ጋምቤላ',
  'ሐረሪ', 'ኦሮሚያ', 'ሶማሌ', 'ደቡብ ብሔሮች ብሔረሰቦችና ሕዝቦች', 'ሲዳማ', 'ትግራይ',
  'ምዕራብ ኢትዮጵያ ሕዝቦች', 'ማዕከላዊ ኢትዮጵያ', 'ደቡብ ምዕራብ ኢትዮጵያ',
];

// ─── Baptism status ───────────────────────────────────────────────────────────
const BAPTISM_OPTIONS = [
  'ተጠምቄአለሁ',
  'አልተጠመቅሁም',
  'አላውቅም',
];

// ─── Form state ───────────────────────────────────────────────────────────────
interface FormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  sex: 'ወንድ' | 'ሴት' | '';
  christianName: string;
  birthDate: string;
  phoneNumber: string;
  baptismStatus: string;
  region: string;
  city: string;
  address: string;
}

const INITIAL_FORM: FormState = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  sex: '',
  christianName: '',
  birthDate: '',
  phoneNumber: '',
  baptismStatus: '',
  region: '',
  city: '',
  address: '',
};

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(step: Step, form: FormState): string {
  if (step === 'account') {
    if (!form.fullName.trim()) return 'ሙሉ ስም ያስፈልጋል';
    if (!form.email.trim() || !form.email.includes('@')) return 'ትክክለኛ ኢሜይል ያስፈልጋል';
    if (form.password.length < 6) return 'የይለፍ ቃሉ ቢያንስ 6 ቁምፊዎች ሊሆን ይገባል';
    if (form.password !== form.confirmPassword) return 'የይለፍ ቃሎቹ አይዛመዱም';
    if (!form.sex) return 'ፆታ ያስፈልጋል';
  }
  if (step === 'personal') {
    if (!form.baptismStatus) return 'የጥምቀት ሁኔታ ያስፈልጋል';
  }
  if (step === 'location') {
    if (!form.region) return 'ክልል ያስፈልጋል';
    if (!form.city.trim()) return 'ከተማ ያስፈልጋል';
  }
  return '';
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function registerUser(form: FormState): Promise<{ token: string; user: Record<string, unknown> }> {
  const payload = {
    fullName: form.fullName.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password,
    sex: form.sex === 'ወንድ' ? 'MALE' : 'FEMALE',
    christianName: form.christianName.trim() || undefined,
    birthDate: form.birthDate || undefined,
    phoneNumber: form.phoneNumber.trim() || undefined,
    baptismStatus: form.baptismStatus || undefined,
    region: form.region || undefined,
    city: form.city.trim() || undefined,
    address: form.address.trim() || undefined,
    // institutionId intentionally omitted — backend auto-assigns to Debre Berhan Medhanealem
  };

  const res = await api.post('/auth/register', payload);
  const data = res.data.data ?? res.data;
  return data;
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: Step }) {
  const icons = [
    <Lock className="w-4 h-4" key="account" />,
    <User className="w-4 h-4" key="personal" />,
    <MapPin className="w-4 h-4" key="location" />,
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEP_ORDER.map((step, i) => {
        const isActive  = step === current;
        const isDone    = STEP_ORDER.indexOf(current) > i;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300"
                style={{
                  backgroundColor: isDone ? '#D4AF37' : isActive ? '#800020' : 'transparent',
                  borderColor: isDone || isActive ? '#D4AF37' : 'rgba(212,175,55,0.3)',
                  color: isDone ? '#0a0809' : isActive ? '#D4AF37' : 'rgba(212,175,55,0.5)',
                }}
              >
                {isDone ? <CheckCircle className="w-4 h-4" /> : icons[i]}
              </div>
              <span className="text-[10px] font-bold tracking-wider"
                style={{ color: isActive ? '#D4AF37' : isDone ? '#D4AF37' : 'rgba(242,238,238,0.4)' }}>
                {STEPS[step]}
              </span>
            </div>
            {i < STEP_ORDER.length - 1 && (
              <div className="w-12 h-[2px] mb-5 transition-all duration-300"
                style={{ backgroundColor: isDone ? '#D4AF37' : 'rgba(212,175,55,0.2)' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('account');
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(f => ({ ...f, [field]: e.target.value }));

  const goNext = () => {
    const err = validate(step, form);
    if (err) { setError(err); return; }
    setError('');
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[idx + 1]);
    }
  };

  const goBack = () => {
    setError('');
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(step, form);
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      const result = await registerUser(form);
      // Save token to localStorage using same key as AuthContext
      localStorage.setItem('orthodoxconnect_auth', JSON.stringify({
        token: result.token,
        user: result.user,
      }));
      setDone(true);
      setTimeout(() => navigate('/app/dashboard'), 2500);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.response?.data?.error ?? err.message ?? 'ምዝገባ አልተሳካም';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Input style ──────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 1rem',
    backgroundColor: 'rgba(0,0,0,0.35)',
    border: '1px solid rgba(212,175,55,0.25)',
    borderRadius: '0.5rem',
    color: '#F2EEEE',
    fontSize: '0.875rem',
    outline: 'none',
    fontFamily: "'Noto Serif Ethiopic', serif",
  };
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(212,175,55,0.8)',
    marginBottom: '0.35rem',
  };

  // ── Success screen ────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#0a0809' }}>
        <div className="text-center space-y-4 p-8 animate-pulse">
          <CheckCircle className="w-16 h-16 mx-auto" style={{ color: '#D4AF37' }} />
          <h2 className="text-2xl font-extrabold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            ምዝገባ ተሳካ!
          </h2>
          <p className="text-sm" style={{ color: '#D4AF37' }}>
            ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን እንኳን ደህና መጡ
          </p>
          <p className="text-xs opacity-60 text-white">ወደ ፖርታሉ እየተዛወሩ ነው...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0a0809', color: '#F2EEEE' }}>
      {/* Header */}
      <div
        className="py-6 px-4 text-center"
        style={{ background: 'linear-gradient(135deg,#800020 0%,#4A154B 100%)', borderBottom: '3px solid #D4AF37' }}
      >
        <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#D4AF37' }}>
          ☩ Phase 2
        </p>
        <h1 className="text-2xl font-extrabold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
          ምዝገባ
        </h1>
        <p className="text-sm text-purple-200 mt-1">
          ለ ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን — ምዕምናን ተጨምሮ አዲስ መለያ ይፍጠሩ
        </p>
      </div>

      {/* Form card */}
      <div className="flex-grow flex items-start justify-center px-4 py-10">
        <div
          className="w-full max-w-lg rounded-2xl border p-8 shadow-xl"
          style={{ backgroundColor: 'rgba(26,10,10,0.85)', borderColor: 'rgba(212,175,55,0.25)' }}
        >
          <StepIndicator current={step} />

          <form onSubmit={step === 'location' ? handleSubmit : (e) => { e.preventDefault(); goNext(); }}>

            {/* ── STEP 1: Account ── */}
            {step === 'account' && (
              <div className="space-y-4">
                <h2 className="text-base font-bold mb-4" style={{ color: '#D4AF37' }}>
                  የመለያ መረጃ አስገቡ
                </h2>

                <div>
                  <label style={labelStyle}>ሙሉ ስም *</label>
                  <input
                    style={inputStyle}
                    value={form.fullName}
                    onChange={set('fullName')}
                    placeholder="ለምሳሌ: ሰለሞን ታደሰ"
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>ኢሜይል *</label>
                  <input
                    style={inputStyle}
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    placeholder="ስም@ኢሜይል.com"
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>የይለፍ ቃል *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{ ...inputStyle, paddingRight: '2.5rem' }}
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      placeholder="ቢያንስ 6 ቁምፊዎች"
                      required
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#D4AF37', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>የይለፍ ቃሉን አረጋግጡ *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{ ...inputStyle, paddingRight: '2.5rem' }}
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={set('confirmPassword')}
                      placeholder="•••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#D4AF37', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>ፆታ *</label>
                  <div className="flex gap-3">
                    {(['ወንድ', 'ሴት'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, sex: s }))}
                        className="flex-1 py-2 rounded-lg border text-sm font-bold transition"
                        style={{
                          borderColor: form.sex === s ? '#D4AF37' : 'rgba(212,175,55,0.25)',
                          backgroundColor: form.sex === s ? 'rgba(212,175,55,0.15)' : 'transparent',
                          color: form.sex === s ? '#D4AF37' : '#F2EEEE',
                          fontFamily: "'Noto Serif Ethiopic', serif",
                        }}
                      >
                        {s === 'ወንድ' ? '♂ ወንድ' : '♀ ሴት'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Personal ── */}
            {step === 'personal' && (
              <div className="space-y-4">
                <h2 className="text-base font-bold mb-4" style={{ color: '#D4AF37' }}>
                  ግለ-መረጃ
                </h2>

                <div>
                  <label style={labelStyle}>ክርስቲያናዊ ስም (የጥምቀት ስም)</label>
                  <input
                    style={inputStyle}
                    value={form.christianName}
                    onChange={set('christianName')}
                    placeholder="ለምሳሌ: ሚካኤል, ማርያም..."
                  />
                </div>

                <div>
                  <label style={labelStyle}>የልደት ቀን</label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={form.birthDate}
                    onChange={set('birthDate')}
                  />
                </div>

                <div>
                  <label style={labelStyle}>ስልክ ቁጥር</label>
                  <input
                    style={inputStyle}
                    type="tel"
                    value={form.phoneNumber}
                    onChange={set('phoneNumber')}
                    placeholder="+251 9..."
                  />
                </div>

                <div>
                  <label style={labelStyle}>የጥምቀት ሁኔታ *</label>
                  <select
                    style={inputStyle}
                    value={form.baptismStatus}
                    onChange={set('baptismStatus')}
                    required
                  >
                    <option value="">ይምረጡ...</option>
                    {BAPTISM_OPTIONS.map(o => (
                      <option key={o} value={o} style={{ backgroundColor: '#1a0a0a' }}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ── STEP 3: Location ── */}
            {step === 'location' && (
              <div className="space-y-4">
                <h2 className="text-base font-bold mb-4" style={{ color: '#D4AF37' }}>
                  አድራሻ
                </h2>

                <div>
                  <label style={labelStyle}>ክልል *</label>
                  <select
                    style={inputStyle}
                    value={form.region}
                    onChange={set('region')}
                    required
                  >
                    <option value="">ክልል ይምረጡ...</option>
                    {REGIONS.map(r => (
                      <option key={r} value={r} style={{ backgroundColor: '#1a0a0a' }}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>ከተማ *</label>
                  <input
                    style={inputStyle}
                    value={form.city}
                    onChange={set('city')}
                    placeholder="ለምሳሌ: ደብረ ብርሃን"
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>ዝርዝር አድራሻ</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                    value={form.address}
                    onChange={set('address')}
                    placeholder="ሰፈር / ቤት ቁጥር..."
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 p-3 rounded-lg border text-xs"
                style={{ backgroundColor: 'rgba(231,76,60,0.08)', borderColor: 'rgba(231,76,60,0.35)', color: '#e74c3c' }}>
                ⚠ {error}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-6">
              {step !== 'account' && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-bold transition cursor-pointer"
                  style={{ borderColor: 'rgba(212,175,55,0.35)', color: '#D4AF37', backgroundColor: 'transparent' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  ተመለስ
                </button>
              )}

              {step !== 'location' ? (
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer"
                  style={{ backgroundColor: '#800020', color: '#F2EEEE' }}
                >
                  ቀጥል
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer"
                  style={{ backgroundColor: '#D4AF37', color: '#0a0809' }}
                >
                  {loading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin inline-block"
                      style={{ borderColor: '#0a0809', borderTopColor: 'transparent' }} />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {loading ? 'እየተመዘገቡ...' : 'ምዝገባ አጠናቅ'}
                </button>
              )}
            </div>
          </form>

          {/* Login link */}
          <p className="text-center text-xs mt-6 opacity-60">
            መለያ አለዎት?{' '}
            <Link to="/login" style={{ color: '#D4AF37', fontWeight: 700 }}>
              ይግቡ
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs py-4 opacity-40">
        ☩ ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን — OrthodoxConnect
      </footer>
    </div>
  );
};
