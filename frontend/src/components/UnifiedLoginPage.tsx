// src/components/UnifiedLoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  LogIn,
  Lock,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';

// Demo credentials that MATCH the seed file (prisma/seed.ts)
// Password for all seed accounts: orthodox123
const DEMO_PROFILES = [
  {
    label: 'Patriarch',
    email: 'patriarch@orthodoxconnect.org',
    password: 'orthodox123',
    role: 'PATRIARCH',
    badge: '☩',
  },
  {
    label: 'Archbishop',
    email: 'archbishop@orthodoxconnect.org',
    password: 'orthodox123',
    role: 'ARCHBISHOP',
    badge: '✝',
  },
  {
    label: 'Bishop',
    email: 'bishop@orthodoxconnect.org',
    password: 'orthodox123',
    role: 'BISHOP',
    badge: '✝',
  },
  {
    label: 'Priest — Holy Trinity',
    email: 'priest.aa@orthodoxconnect.org',
    password: 'orthodox123',
    role: 'PRIEST',
    badge: '⛪',
  },
  {
    label: 'Priest — Debre Berhan',
    email: 'priest.db@orthodoxconnect.org',
    password: 'orthodox123',
    role: 'PRIEST',
    badge: '⛪',
  },
  {
    label: 'Follower / Parish Member',
    email: 'member@orthodoxconnect.org',
    password: 'orthodox123',
    role: 'LAITY',
    badge: '👤',
  },
];

export const UnifiedLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [sex, setSex] = useState<'MALE' | 'FEMALE'>('MALE');
  const [age, setAge] = useState<number>(25);
  const [institutionId, setInstitutionId] = useState('');
  const [parishes, setParishes] = useState<any[]>([]);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoPanel, setShowDemoPanel] = useState(false);

  // Fetch parishes when toggling to signup
  React.useEffect(() => {
    if (!isLogin && parishes.length === 0) {
      api.get('/institutions')
        .then(res => {
          const list = res.data?.data || [];
          setParishes(list);
          if (list.length > 0) setInstitutionId(list[0].id);
        })
        .catch(() => {
          setError('Failed to fetch parishes. Please verify backend.');
        });
    }
  }, [isLogin, parishes.length]);

  const applyDemoProfile = (profile: typeof DEMO_PROFILES[0]) => {
    setIsLogin(true);
    setEmail(profile.email);
    setPassword(profile.password);
    setError('');
    setShowDemoPanel(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      if (!email.trim() || !password.trim()) {
        setError('Email and password are required.');
        return;
      }
      setLoading(true);
      try {
        const res = await api.post('/auth/login', { email: email.trim(), password });
        const { token, user } = res.data.data ?? res.data;
        setAuth({
          userId: user.id,
          token,
          ecclesiasticalRole: user.ecclesiastical_role,
          authRole: user.auth_role ?? 'MIMEN',
          institutionId: user.institution_id,
          fullName: user.fullName ?? user.nameEn ?? email,
          institution: user.institution ?? null,
        });
        navigate('/app/dashboard', { replace: true });
      } catch (err: any) {
        const msg = err.response?.data?.message ?? err.response?.data?.error;
        if (err.response?.status === 401) {
          setError('Incorrect email or password. Please try again.');
        } else {
          setError(msg ?? 'Login failed. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    } else {
      if (!email.trim() || !password.trim() || !fullName.trim() || !institutionId) {
        setError('All fields marked * are required.');
        return;
      }
      setLoading(true);
      try {
        const res = await api.post('/auth/signup', {
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          sex,
          age: Number(age),
          institutionId,
        });
        const { token, user } = res.data.data ?? res.data;
        setAuth({
          userId: user.id,
          token,
          ecclesiasticalRole: user.ecclesiastical_role,
          authRole: user.auth_role ?? 'MIMEN',
          institutionId: user.institution_id,
          fullName: user.fullName ?? user.nameEn ?? email,
          institution: user.institution ?? null,
        });
        navigate('/app/dashboard', { replace: true });
      } catch (err: any) {
        setError(err.response?.data?.message ?? 'Account creation failed. Email might already exist.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--eotc-canvas)', color: 'var(--eotc-text)' }}
    >
      {/* Back to home */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-semibold opacity-60 hover:opacity-100 transition cursor-pointer"
        style={{ color: 'var(--eotc-gold)' }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Home
      </button>

      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border-2"
            style={{
              backgroundColor: 'rgba(212,175,55,0.12)',
              borderColor: 'rgba(212,175,55,0.4)',
            }}
          >
            ☩
          </div>
          <h1
            className="text-2xl font-extrabold tracking-wide"
            style={{ fontFamily: "'Playfair Display', serif", color: 'var(--eotc-text)' }}
          >
            ደብረ ብርሃን መድኃኔዓለም
          </h1>
          <p className="text-xs mt-1 font-semibold tracking-widest uppercase" style={{ color: 'var(--eotc-gold)' }}>
            ቤተ ክርስቲያን — OrthodoxConnect
          </p>
        </div>

        {/* Login/Signup card */}
        <div
          className="rounded-2xl border p-8 shadow-xl"
          style={{ backgroundColor: 'var(--eotc-card)', borderColor: 'var(--eotc-border)' }}
        >
          <div className="flex items-center justify-between mb-6 border-b pb-3" style={{ borderColor: 'var(--eotc-border)' }}>
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`text-sm font-bold uppercase pb-1 border-b-2 transition ${isLogin ? 'border-[var(--eotc-gold)] text-[var(--eotc-gold)]' : 'border-transparent opacity-65 hover:opacity-100'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`text-sm font-bold uppercase pb-1 border-b-2 transition ${!isLogin ? 'border-[var(--eotc-gold)] text-[var(--eotc-gold)]' : 'border-transparent opacity-65 hover:opacity-100'}`}
            >
              Register Account
            </button>
          </div>

          {error && (
            <div
              className="flex items-start gap-2 rounded-lg p-3 mb-5 text-xs border"
              style={{
                backgroundColor: 'rgba(220,38,38,0.1)',
                borderColor: 'rgba(220,38,38,0.3)',
                color: '#f87171',
              }}
            >
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 opacity-70">
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="E.g. Samuel Abebe Kassa"
                    disabled={loading}
                    className="w-full px-3 py-2 rounded-lg text-xs border outline-none"
                    style={{
                      backgroundColor: 'rgba(212,175,55,0.05)',
                      borderColor: 'var(--eotc-border)',
                      color: 'var(--eotc-text)',
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Sex */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 opacity-70">
                      Gender *
                    </label>
                    <select
                      value={sex}
                      onChange={e => setSex(e.target.value as any)}
                      disabled={loading}
                      className="w-full px-3 py-2 rounded-lg text-xs border outline-none cursor-pointer"
                      style={{
                        backgroundColor: 'rgba(212,175,55,0.05)',
                        borderColor: 'var(--eotc-border)',
                        color: 'var(--eotc-text)',
                      }}
                    >
                      <option value="MALE">Male / ወንድ</option>
                      <option value="FEMALE">Female / ሴት</option>
                    </select>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 opacity-70">
                      Age *
                    </label>
                    <input
                      required
                      type="number"
                      min={1}
                      max={120}
                      value={age}
                      onChange={e => setAge(Number(e.target.value))}
                      disabled={loading}
                      className="w-full px-3 py-2 rounded-lg text-xs border outline-none"
                      style={{
                        backgroundColor: 'rgba(212,175,55,0.05)',
                        borderColor: 'var(--eotc-border)',
                        color: 'var(--eotc-text)',
                      }}
                    />
                  </div>
                </div>

                {/* Parish dropdown */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 opacity-70">
                    Your Local Parish (Church) *
                  </label>
                  <select
                    value={institutionId}
                    onChange={e => setInstitutionId(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 rounded-lg text-xs border outline-none cursor-pointer"
                    style={{
                      backgroundColor: 'rgba(212,175,55,0.05)',
                      borderColor: 'var(--eotc-border)',
                      color: 'var(--eotc-text)',
                    }}
                  >
                    {parishes.map(p => (
                      <option key={p.id} value={p.id}>{p.nameEn || p.name || 'Parish'}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 opacity-70">
                Email Address *
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="your@email.org"
                disabled={loading}
                className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition focus:ring-1"
                style={{
                  backgroundColor: 'rgba(212,175,55,0.05)',
                  borderColor: 'var(--eotc-border)',
                  color: 'var(--eotc-text)',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.6)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--eotc-border)')}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 opacity-70">
                Password *
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm border outline-none transition"
                  style={{
                    backgroundColor: 'rgba(212,175,55,0.05)',
                    borderColor: 'var(--eotc-border)',
                    color: 'var(--eotc-text)',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.6)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--eotc-border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
              style={{ backgroundColor: 'var(--eotc-burgundy)', color: '#fff' }}
              onMouseEnter={e => !loading && ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--eotc-burgundy-2)')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--eotc-burgundy)')}
            >
              {loading ? (
                <span
                  className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"
                />
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <LogIn className="w-3.5 h-3.5" />
                  {isLogin ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo credentials panel */}
        <div className="mt-4">
          <button
            onClick={() => setShowDemoPanel(s => !s)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer"
            style={{
              borderColor: 'var(--eotc-border)',
              color: 'var(--eotc-text-muted)',
              backgroundColor: 'transparent',
            }}
          >
            <span>Demo Accounts (Development)</span>
            <ChevronDown
              className="w-3.5 h-3.5 transition-transform"
              style={{ transform: showDemoPanel ? 'rotate(180deg)' : 'none' }}
            />
          </button>

          {showDemoPanel && (
            <div
              className="mt-2 rounded-xl border overflow-hidden"
              style={{ borderColor: 'var(--eotc-border)', backgroundColor: 'var(--eotc-card)' }}
            >
              {DEMO_PROFILES.map(p => (
                <button
                  key={p.email}
                  onClick={() => applyDemoProfile(p)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs border-b last:border-0 hover:opacity-90 transition cursor-pointer"
                  style={{ borderColor: 'var(--eotc-border)' }}
                >
                  <span className="text-base">{p.badge}</span>
                  <div>
                    <p className="font-bold" style={{ color: 'var(--eotc-text)' }}>{p.label}</p>
                    <p className="opacity-50" style={{ fontSize: '10px' }}>{p.email}</p>
                  </div>
                  <span
                    className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                    style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: 'var(--eotc-gold)' }}
                  >
                    {p.role}
                  </span>
                </button>
              ))}
              <div className="px-4 py-2 text-center" style={{ backgroundColor: 'rgba(212,175,55,0.05)' }}>
                <p className="text-[10px] opacity-50">All demo accounts use password: <code className="font-mono">orthodox123</code></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
