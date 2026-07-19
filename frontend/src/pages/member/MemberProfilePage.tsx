// frontend/src/pages/member/MemberProfilePage.tsx
// Phase 2 — የኔ መረጃ — Member dashboard and profile management
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { User, Phone, MapPin, CheckCircle, Clock, Edit3, Save, X } from 'lucide-react';
import { NotificationBell } from '../../components/common/NotificationBell';
import axios from 'axios';

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  christianName?: string | null;
  birthDate?: string | null;
  phoneNumber?: string | null;
  region?: string | null;
  city?: string | null;
  address?: string | null;
  baptismStatus?: string | null;
  photoUrl?: string | null;
  sex?: string | null;
  age?: number | null;
  spiritualFatherId?: string | null;
  spiritualFather?: { id: string; fullName: string; email: string } | null;
  institution?: { id: string; nameAm?: string | null; nameEn?: string | null } | null;
}

type RequestStatus = { status: 'NONE' } | {
  id: string; status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string; notes?: string | null;
  priest: { id: string; fullName: string; email: string };
};

const STATUS_COLORS = {
  PENDING: { bg: 'rgba(26,107,158,0.1)', text: '#1a6b9e', label: 'መጠባበቅ ላይ' },
  APPROVED: { bg: 'rgba(45,122,78,0.1)', text: '#2d7a4e', label: 'ተቀብሏል' },
  REJECTED: { bg: 'rgba(128,0,32,0.1)', text: '#800020', label: 'ውድቅ ተደርጓል' },
};

function profileCompletion(profile: UserProfile): number {
  const fields: (keyof UserProfile)[] = ['fullName', 'email', 'christianName', 'phoneNumber', 'region', 'city', 'baptismStatus', 'sex'];
  const filled = fields.filter(f => profile[f]);
  return Math.round((filled.length / fields.length) * 100);
}

export const MemberProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [requestStatus, setRequestStatus] = useState<RequestStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/members/profile'),
      api.get('/members/assignment/status'),
    ]).then(([pRes, rRes]) => {
      setProfile(pRes.data);
      setRequestStatus(rRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const startEdit = () => {
    if (!profile) return;
    setEditForm({
      fullName: profile.fullName,
      christianName: profile.christianName ?? '',
      phoneNumber: profile.phoneNumber ?? '',
      region: profile.region ?? '',
      city: profile.city ?? '',
      address: profile.address ?? '',
      baptismStatus: profile.baptismStatus ?? '',
      birthDate: profile.birthDate?.split('T')[0] ?? '',
    });
    setSaveError('');
    setSaveSuccess(false);
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const { data } = await api.put('/members/profile', editForm);
      setProfile(data.user ?? data);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? 'ስህተት ተፈጥሯል' : 'ስህተት ተፈጥሯል';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pub-bg font-ethiopic flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-t-[#800020] border-[#E8E0D0] animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen pub-bg font-ethiopic flex items-center justify-center text-center px-4">
        <div>
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-lg font-bold" style={{ color: '#1A1209' }}>መረጃ ሊጫን አልተቻለም</p>
          <Link to="/login" className="text-sm mt-2 block" style={{ color: '#800020' }}>ወደ መግቢያ ሂድ</Link>
        </div>
      </div>
    );
  }

  const completion = profileCompletion(profile);

  return (
    <div className="min-h-screen pub-bg font-ethiopic">
      {/* Header */}
      <div className="py-8 px-4 text-white" style={{ background: 'linear-gradient(135deg, #1A0F0A, #800020)' }}>
        <div className="max-w-4xl mx-auto flex items-center gap-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-2"
            style={{ backgroundColor: 'rgba(212,175,55,0.15)', borderColor: '#D4AF37', color: '#D4AF37' }}>
            {profile.fullName.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold">{profile.fullName}</h1>
            <p className="text-sm opacity-70" style={{ fontFamily: 'Inter' }}>{profile.email}</p>
            <p className="text-xs mt-1" style={{ color: '#D4AF37' }}>
              {profile.institution?.nameAm ?? profile.institution?.nameEn ?? '—'}
            </p>
          </div>
          {/* Phase 3: notification bell */}
          <div style={{ filter: 'invert(1)' }}>
            <NotificationBell />
          </div>
        </div>
      </div>


      <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-6">


        {/* ── Left: Profile info ── */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Completion */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-sm" style={{ color: '#1A1209' }}>የመረጃ ሙሉነት</p>
              <span className="font-bold text-sm" style={{ color: '#800020', fontFamily: 'Inter' }}>{completion}%</span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#F5F0E8' }}>
              <div className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${completion}%`, backgroundColor: completion >= 80 ? '#2d7a4e' : '#800020' }} />
            </div>
            {completion < 100 && (
              <p className="text-xs mt-2" style={{ color: '#9B8E7A' }}>
                ሁሉንም ሜዳዎች ሞልቱ — {100 - completion}% ቀርቷል
              </p>
            )}
          </div>

          {/* Profile form / display */}
          <div className="rounded-2xl border p-6" style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base" style={{ color: '#1A1209' }}>ግለ-ሰባዊ መረጃ</h2>
              {!editing
                ? <button onClick={startEdit} className="flex items-center gap-1 text-sm font-bold cursor-pointer" style={{ color: '#800020' }}>
                    <Edit3 className="w-3.5 h-3.5" /> አስተካክል
                  </button>
                : <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-sm font-bold cursor-pointer" style={{ color: '#9B8E7A' }}>
                      <X className="w-3.5 h-3.5" /> ሰርዝ
                    </button>
                    <button onClick={saveProfile} disabled={saving} className="flex items-center gap-1 text-sm font-bold cursor-pointer" style={{ color: '#2d7a4e' }}>
                      <Save className="w-3.5 h-3.5" /> {saving ? 'በማስቀመጥ...' : 'አስቀምጥ'}
                    </button>
                  </div>
              }
            </div>

            {saveError && (
              <div className="text-sm px-4 py-2 rounded-xl mb-4" style={{ backgroundColor: 'rgba(128,0,32,0.07)', color: '#800020' }}>
                ⚠️ {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="text-sm px-4 py-2 rounded-xl mb-4" style={{ backgroundColor: 'rgba(45,122,78,0.07)', color: '#2d7a4e' }}>
                ✓ መረጃዎ ተዘምኗል
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {editing ? (
                <>
                  {editField('ሙሉ ስም', editForm.fullName ?? '', v => setEditForm(f => ({ ...f, fullName: v })))}
                  {editField('የክርስትና ስም', editForm.christianName ?? '', v => setEditForm(f => ({ ...f, christianName: v })))}
                  {editField('ስልክ ቁጥር', editForm.phoneNumber ?? '', v => setEditForm(f => ({ ...f, phoneNumber: v })))}
                  {editField('ክልል', editForm.region ?? '', v => setEditForm(f => ({ ...f, region: v })))}
                  {editField('ከተማ', editForm.city ?? '', v => setEditForm(f => ({ ...f, city: v })))}
                  {editField('ዝርዝር አድራሻ', editForm.address ?? '', v => setEditForm(f => ({ ...f, address: v })))}
                </>
              ) : (
                <>
                  {infoRow(User, 'ሙሉ ስም', profile.fullName)}
                  {infoRow(User, 'የክርስትና ስም', profile.christianName ?? '—')}
                  {infoRow(Phone, 'ስልክ ቁጥር', profile.phoneNumber ?? '—')}
                  {infoRow(MapPin, 'ክልል', profile.region ?? '—')}
                  {infoRow(MapPin, 'ከተማ', profile.city ?? '—')}
                  {infoRow(MapPin, 'ዝርዝር አድራሻ', profile.address ?? '—')}
                  {infoRow(CheckCircle, 'ፆታ', profile.sex === 'MALE' ? 'ወንድ' : profile.sex === 'FEMALE' ? 'ሴት' : '—')}
                  {infoRow(CheckCircle, 'የጥምቀት ሁኔታ', profile.baptismStatus ?? '—')}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Spiritual Father + quick links ── */}
        <div className="flex flex-col gap-5">
          {/* Spiritual Father status card */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
            <h2 className="font-bold text-sm mb-4" style={{ color: '#1A1209' }}>የንስሐ አባት</h2>
            {profile.spiritualFather ? (
              <div className="flex flex-col gap-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: '#800020' }}>
                  {profile.spiritualFather.fullName.charAt(0)}
                </div>
                <p className="font-bold text-sm" style={{ color: '#1A1209' }}>{profile.spiritualFather.fullName}</p>
                <p className="text-xs" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>{profile.spiritualFather.email}</p>
                <div className="mt-1 px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ backgroundColor: 'rgba(45,122,78,0.1)', color: '#2d7a4e' }}>
                  ✓ ግንኙነቱ ተፈጥሯል
                </div>
              </div>
            ) : requestStatus && requestStatus.status !== 'NONE' ? (
              <div className="flex flex-col gap-2">
                <div className="px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ backgroundColor: STATUS_COLORS[requestStatus.status].bg, color: STATUS_COLORS[requestStatus.status].text }}>
                  {STATUS_COLORS[requestStatus.status].label}
                </div>
                {'priest' in requestStatus && (
                  <p className="text-xs" style={{ color: '#4B3A2A' }}>
                    ጥያቄ ለ {requestStatus.priest.fullName} ተልኳል
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs leading-relaxed" style={{ color: '#9B8E7A' }}>
                  እስካሁን የንስሐ አባት አልተመረጠም
                </p>
                <Link to="/member/priests"
                  className="py-2 rounded-xl text-xs font-bold text-center"
                  style={{ backgroundColor: '#800020', color: '#fff' }}>
                  የንስሐ አባት ፈልግ
                </Link>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="rounded-2xl border p-5 flex flex-col gap-3" style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
            <h2 className="font-bold text-sm mb-1" style={{ color: '#1A1209' }}>ፈጣን አገናኞች</h2>
            {[
              { to: '/member/book-appointment', label: '📅 ቀጠሮ ጠይቅ' },
              { to: '/member/my-appointments', label: '📋 የኔ ቀጠሮዎች' },
              { to: '/member/priests', label: '🔍 ካህናትን ፈልግ' },
              { to: '/member/request-status', label: '🤝 የጥያቄ ሁኔታ' },
              { to: '/announcements', label: '📢 ማስታወቂያዎች' },
              { to: '/prayer-request', label: '🙏 የጸሎት ጥያቄ' },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className="text-sm font-bold py-2.5 px-4 rounded-xl border transition hover:bg-[#F5F0E8]"
                style={{ borderColor: '#E8E0D0', color: '#4B3A2A' }}>
                {label}
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

function infoRow(Icon: React.ElementType, label: string, value: string) {
  return (
    <div className="flex items-start gap-3 py-2 border-b" style={{ borderColor: '#F0EBE0' }}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#800020' }} />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>{label}</p>
        <p className="text-sm font-medium mt-0.5" style={{ color: '#1A1209' }}>{value}</p>
      </div>
    </div>
  );
}

function editField(label: string, value: string, onChange: (v: string) => void) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9B8E7A', fontFamily: 'Inter' }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)}
        className="rounded-xl px-3 py-2 border text-sm outline-none"
        style={{ borderColor: '#E8E0D0', backgroundColor: '#FDFAF5', color: '#1A1209', fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
      />
    </div>
  );
}
