// frontend/src/pages/member/PriestsListPage.tsx
// Phase 2 — የንስሐ አባቶች — Browse priests and send spiritual father request
import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Link } from 'react-router-dom';
import { Search, MapPin, Church, CheckCircle, Send, Calendar } from 'lucide-react';
import axios from 'axios';

interface Priest {
  id: string;
  fullName: string;
  email: string;
  location?: string | null;
  photoUrl?: string | null;
  biography?: string | null;
  serviceStartDate?: string | null;
  currentStatus?: string | null;
  institution?: { nameAm?: string | null; nameEn?: string | null } | null;
}

export const PriestsListPage: React.FC = () => {
  const [priests, setPriests] = useState<Priest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/members/priests')
      .then(r => setPriests(r.data ?? []))
      .catch(() => setPriests([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = priests.filter(p =>
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (p.location ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const sendRequest = async (priestId: string) => {
    setSending(priestId);
    setError('');
    setSuccess('');
    try {
      await api.post('/members/assignment/request', { priestId });
      setSent(prev => new Set([...prev, priestId]));
      setSuccess('ጥያቄዎ ወደ ካህኑ ተልኳል!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? 'ስህተት ተፈጥሯል'
        : 'ስህተት ተፈጥሯል';
      setError(msg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="min-h-screen pub-bg font-ethiopic">
      {/* Header */}
      <div className="py-12 px-4 text-white" style={{ background: 'linear-gradient(135deg, #1A0F0A, #4A154B, #800020)' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#D4AF37', fontFamily: 'Inter' }}>
            ☩ ምዝገባ
          </p>
          <h1 className="text-3xl font-extrabold mb-2">የንስሐ አባቶች</h1>
          <p className="text-sm opacity-75">
            ካህናቱ ዝርዝር — "የንስሐ አባት አድርግ" ቁልፍ ጫኑ ጥያቄዎን ለመላክ
          </p>
        </div>
      </div>

      {/* Alerts */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        {success && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4 text-sm"
            style={{ backgroundColor: 'rgba(45,122,78,0.1)', color: '#2d7a4e', border: '1px solid rgba(45,122,78,0.25)' }}>
            <CheckCircle className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4 text-sm"
            style={{ backgroundColor: 'rgba(128,0,32,0.07)', color: '#800020', border: '1px solid rgba(128,0,32,0.2)' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="max-w-4xl mx-auto px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#9B8E7A' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ካህን ፈልግ..."
            className="w-full rounded-xl pl-11 pr-4 py-3 border text-base outline-none"
            style={{ borderColor: '#E8E0D0', backgroundColor: '#fff', color: '#1A1209', fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
          />
        </div>
      </div>

      {/* List */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-t-[#800020] border-[#E8E0D0] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">👤</p>
            <p className="font-bold" style={{ color: '#1A1209' }}>ካህን አልተገኘም</p>
            <p className="text-sm mt-1" style={{ color: '#9B8E7A' }}>
              {search ? 'ፍለጋዎን ይለዋጡ' : 'ካህናት ለዚህ ቤተ ክርስቲያን አልተመዘገቡም'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {filtered.map(priest => {
              const isSent = sent.has(priest.id);
              const isLoading = sending === priest.id;
              return (
                <article key={priest.id}
                  className="card-lift rounded-2xl border p-5 flex flex-col gap-4"
                  style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
                  {/* Avatar + name */}
                  <div className="flex items-center gap-4">
                    {priest.photoUrl ? (
                      <img src={priest.photoUrl} alt={priest.fullName}
                        className="w-14 h-14 rounded-full object-cover border-2"
                        style={{ borderColor: 'rgba(128,0,32,0.2)' }} />
                    ) : (
                      <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold border-2 shrink-0"
                        style={{ backgroundColor: 'rgba(128,0,32,0.08)', borderColor: 'rgba(128,0,32,0.2)', color: '#800020' }}>
                        {priest.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: '#800020' }}>
                          ካህን
                        </span>
                      </div>
                      <p className="font-bold text-base mt-1 truncate" style={{ color: '#1A1209' }}>
                        {priest.fullName}
                      </p>
                      <p className="text-xs truncate" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>{priest.email}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-col gap-2">
                    {priest.institution && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#6B5E45' }}>
                        <Church className="w-3.5 h-3.5 shrink-0" style={{ color: '#800020' }} />
                        <strong>አጥቢያ:</strong> {priest.institution.nameAm ?? priest.institution.nameEn ?? '—'}
                      </div>
                    )}
                    {priest.serviceStartDate && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#6B5E45', fontFamily: 'Inter' }}>
                        <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: '#800020' }} />
                        <span className="font-bold font-ethiopic">የአገልግሎት ዘመን መጀመሪያ:</span> {new Date(priest.serviceStartDate).toLocaleDateString('en-US')}
                      </div>
                    )}
                    {priest.currentStatus && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#6B5E45' }}>
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: priest.currentStatus === 'ACTIVE' ? '#2d7a4e' : '#800020' }} />
                        <strong>የአገልግሎት ሁኔታ:</strong> <span style={{ color: priest.currentStatus === 'ACTIVE' ? '#2d7a4e' : '#800020', fontWeight: 'bold' }}>{priest.currentStatus === 'ACTIVE' ? 'በአገልግሎት ላይ' : priest.currentStatus}</span>
                      </div>
                    )}
                    {priest.biography && (
                      <div className="mt-2 text-xs leading-relaxed p-3 rounded-xl border border-dashed"
                        style={{ backgroundColor: '#FDFAF5', borderColor: '#E8E0D0', color: '#4B3A2A' }}>
                        <p className="font-bold text-[10px] uppercase mb-1" style={{ color: '#9B8E7A' }}>የሕይወት ታሪክ & አስተምህሮ</p>
                        {priest.biography}
                      </div>
                    )}
                  </div>


                  {/* CTA */}
                  <button
                    onClick={() => !isSent && sendRequest(priest.id)}
                    disabled={isSent || isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition cursor-pointer"
                    style={{
                      backgroundColor: isSent ? 'rgba(45,122,78,0.1)' : isLoading ? '#C8BFA8' : '#800020',
                      color: isSent ? '#2d7a4e' : '#fff',
                    }}
                  >
                    {isSent ? (
                      <><CheckCircle className="w-4 h-4" /> ጥያቄ ተልኳል</>
                    ) : isLoading ? (
                      <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> ...</>
                    ) : (
                      <><Send className="w-4 h-4" /> የንስሐ አባት አድርግ</>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs mt-8" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>
          {filtered.length} ካህናት ← <Link to="/member/profile" style={{ color: '#800020' }}>ወደ ዳሽቦርዴ</Link>
        </p>
      </div>
    </div>
  );
};
