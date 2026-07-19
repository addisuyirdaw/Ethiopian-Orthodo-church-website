// frontend/src/pages/admin/ChurchManagementPage.tsx
// Phase 2.2 — የቤተክርስቲያን መቆጣጠሪያ — Admin Diocese & Parish Management Portal
import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { PlusCircle, Edit3, CheckCircle2, XCircle, Church, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface Diocese {
  id: string;
  name: string;
  nameAm: string;
  nameEn: string;
  type: string;
}

interface Parish {
  id: string;
  name: string;
  nameAm: string;
  nameEn: string;
  type: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  logo?: string | null;
  isActive: boolean;
  parentId?: string | null;
}

export const ChurchManagementPage: React.FC = () => {
  const [dioceses, setDioceses] = useState<Diocese[]>([]);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'parish' | 'diocese'>('parish');
  const [toast, setToast] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Forms
  const [selectedDioceseId, setSelectedDioceseId] = useState('');
  const [showDioceseForm, setShowDioceseForm] = useState(false);
  const [editingDiocese, setEditingDiocese] = useState<Diocese | null>(null);
  const [diocForm, setDiocForm] = useState({ name: '', nameAm: '', nameEn: '', type: 'DIOCESE' });

  const [showParishForm, setShowParishForm] = useState(false);
  const [editingParish, setEditingParish] = useState<Parish | null>(null);
  const [parishForm, setParishForm] = useState({
    name: '', nameAm: '', nameEn: '', parentId: '',
    address: '', phone: '', email: '', description: '', logo: ''
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const dRes = await api.get('/institutions/dioceses');
      setDioceses(dRes.data?.data ?? dRes.data ?? []);
      
      // Load all parishes publicly available
      const pRes = await api.get('/institutions');
      setParishes(pRes.data?.data ?? pRes.data ?? []);
    } catch (e) {
      console.error(e);
      showToast('⚠️ መረጃዎችን መጫን አልተቻለም።');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Diocese Submit
  const handleDioceseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diocForm.name || !diocForm.nameAm || !diocForm.nameEn) {
      showToast('⚠️ እባክዎ ሁሉንም መስኮች ይሙሉ');
      return;
    }
    setActionLoading(true);
    try {
      if (editingDiocese) {
        await api.put(`/admin/dioceses/${editingDiocese.id}`, diocForm);
        showToast('✓ ሀገረ ስብከቱ በተሳካ ሁኔታ ተስተካክሏል');
      } else {
        await api.post('/admin/dioceses', diocForm);
        showToast('✓ ሀገረ ስብከቱ በተሳካ ሁኔታ ተፈጥሯል');
      }
      setDiocForm({ name: '', nameAm: '', nameEn: '', type: 'DIOCESE' });
      setEditingDiocese(null);
      setShowDioceseForm(false);
      await loadData();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? 'ስህተት' : 'ስህተት';
      showToast(`⚠️ ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Parish Submit
  const handleParishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parishForm.name || !parishForm.nameAm || !parishForm.nameEn || !parishForm.parentId) {
      showToast('⚠️ እባክዎ ሁሉንም መስኮች ይሙሉ');
      return;
    }
    setActionLoading(true);
    try {
      if (editingParish) {
        await api.put(`/admin/institutions/${editingParish.id}`, parishForm);
        showToast('✓ ቤተ ክርስቲያኑ በተሳካ ሁኔታ ተስተካክሏል');
      } else {
        await api.post('/admin/institutions', parishForm);
        showToast('✓ ቤተ ክርስቲያኑ በተሳካ ሁኔታ ተፈጥሯል');
      }
      setParishForm({
        name: '', nameAm: '', nameEn: '', parentId: '',
        address: '', phone: '', email: '', description: '', logo: ''
      });
      setEditingParish(null);
      setShowParishForm(false);
      await loadData();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? 'ስህተት' : 'ስህተት';
      showToast(`⚠️ ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle status
  const toggleStatus = async (parish: Parish) => {
    setActionLoading(true);
    try {
      const action = parish.isActive ? 'deactivate' : 'activate';
      await api.post(`/admin/institutions/${parish.id}/${action}`);
      showToast(parish.isActive ? 'ቤተ ክርስቲያኑ አገልግሎት አቁሟል' : 'ቤተ ክርስቲያኑ ሥራ ጀምሯል');
      await loadData();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? 'ስህተት' : 'ስህተት';
      showToast(`⚠️ ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const startEditDiocese = (d: Diocese) => {
    setEditingDiocese(d);
    setDiocForm({ name: d.name, nameAm: d.nameAm, nameEn: d.nameEn, type: d.type });
    setShowDioceseForm(true);
  };

  const startEditParish = (p: Parish) => {
    setEditingParish(p);
    setParishForm({
      name: p.name,
      nameAm: p.nameAm,
      nameEn: p.nameEn,
      parentId: p.parentId ?? '',
      address: p.address ?? '',
      phone: p.phone ?? '',
      email: p.email ?? '',
      description: p.description ?? '',
      logo: p.logo ?? '',
    });
    setShowParishForm(true);
  };

  return (
    <div className="min-h-screen pub-bg font-ethiopic">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl font-bold text-sm shadow-2xl"
          style={{ backgroundColor: toast.startsWith('⚠️') ? '#800020' : '#2d7a4e', color: '#fff' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="py-10 px-4 text-white" style={{ background: 'linear-gradient(135deg, #1A0F0A, #800020)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#D4AF37', fontFamily: 'Inter' }}>
              ☩ Phase 2.2 · መቆጣጠሪያ
            </p>
            <h1 className="text-3xl font-extrabold">የቤተክርስቲያን መቆጣጠሪያ</h1>
            <p className="text-sm opacity-70 mt-1">ሀገረ ስብከቶችንና አድባራትን/ገዳማትን ያስተዳድሩ</p>
          </div>
          <button onClick={loadData} className="w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer transition hover:bg-white/10">
            <RefreshCw className="w-4 h-4 text-[#D4AF37]" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tab Selection */}
        <div className="flex gap-3 mb-6">
          <button onClick={() => setTab('parish')}
            className="px-5 py-2.5 rounded-xl font-bold text-sm border-2 transition cursor-pointer"
            style={{
              backgroundColor: tab === 'parish' ? '#800020' : 'transparent',
              borderColor: tab === 'parish' ? '#800020' : '#E8E0D0',
              color: tab === 'parish' ? '#fff' : '#4B3A2A',
            }}>
            ⛪ አድባራትና አብያተ ክርስቲያናት
          </button>
          <button onClick={() => setTab('diocese')}
            className="px-5 py-2.5 rounded-xl font-bold text-sm border-2 transition cursor-pointer"
            style={{
              backgroundColor: tab === 'diocese' ? '#800020' : 'transparent',
              borderColor: tab === 'diocese' ? '#800020' : '#E8E0D0',
              color: tab === 'diocese' ? '#fff' : '#4B3A2A',
            }}>
            🌐 አህጉረ ስብከት
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-t-[#800020] border-[#E8E0D0] animate-spin" />
          </div>
        ) : (
          <>
            {/* ===================== TAB: PARISHES ===================== */}
            {tab === 'parish' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-[#1A1209]">የአብያተ ክርስቲያናት ዝርዝር</h2>
                  <button onClick={() => { setEditingParish(null); setParishForm({ name: '', nameAm: '', nameEn: '', parentId: '', address: '', phone: '', email: '', description: '', logo: '' }); setShowParishForm(!showParishForm); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer text-white"
                    style={{ backgroundColor: '#2d7a4e' }}>
                    <PlusCircle className="w-4 h-4" /> አዲስ ቤተ ክርስቲያን
                  </button>
                </div>

                {/* Form to Add / Edit */}
                {showParishForm && (
                  <form onSubmit={handleParishSubmit} className="rounded-2xl border p-6 flex flex-col gap-4" style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
                    <h3 className="font-bold text-sm text-[#800020]">{editingParish ? 'ቤተ ክርስቲያኑን ያስተካክሉ' : 'አዲስ ቤተ ክርስቲያን ይጨምሩ'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {formField('የአማርኛ ስም *', parishForm.nameAm, v => setParishForm(f => ({ ...f, nameAm: v })), 'መንበረ ጸባኦት ቅድስት ሥላሴ')}
                      {formField('የእንግሊዘኛ ስም *', parishForm.nameEn, v => setParishForm(f => ({ ...f, nameEn: v })), 'Holy Trinity Cathedral')}
                      {formField('ስም (ለቁልፍ) *', parishForm.name, v => setParishForm(f => ({ ...f, name: v })), 'trinity_cathedral')}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-[#9B8E7A]">የሀገረ ስብከት ምርጫ *</label>
                        <select value={parishForm.parentId} onChange={e => setParishForm(f => ({ ...f, parentId: e.target.value }))}
                          className="rounded-xl px-3 py-2.5 border text-sm outline-none bg-[#FDFAF5]"
                          style={{ borderColor: '#E8E0D0' }}>
                          <option value="">— ሀገረ ስብከት ይምረጡ —</option>
                          {dioceses.map(d => <option key={d.id} value={d.id}>{d.nameAm}</option>)}
                        </select>
                      </div>
                      {formField('አድራሻ', parishForm.address, v => setParishForm(f => ({ ...f, address: v })), 'አዲስ አበባ')}
                      {formField('ስልክ', parishForm.phone, v => setParishForm(f => ({ ...f, phone: v })), '011...')}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {formField('ኢሜይል', parishForm.email, v => setParishForm(f => ({ ...f, email: v })), 'info@church.org')}
                      {formField('መግለጫ', parishForm.description, v => setParishForm(f => ({ ...f, description: v })), 'ታሪካዊ አድባር')}
                      {formField('ሎጎ (የምስል ዩአርኤል)', parishForm.logo, v => setParishForm(f => ({ ...f, logo: v })), 'https://...')}
                    </div>
                    <div className="flex gap-2 justify-end mt-2">
                      <button type="button" onClick={() => setShowParishForm(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-[#9B8E7A] cursor-pointer">ሰርዝ</button>
                      <button type="submit" disabled={actionLoading} className="px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer" style={{ backgroundColor: '#800020' }}>
                        {actionLoading ? 'በማስቀመጥ ላይ...' : 'አስቀምጥ'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Table list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {parishes.map(p => {
                    const parentDiocese = dioceses.find(d => d.id === p.parentId);
                    return (
                      <div key={p.id} className="rounded-2xl border p-5 flex flex-col justify-between gap-3" style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-[#F5F0E8] text-[#800020]">
                              ⛪ ቤተክርስቲያን
                            </span>
                            <span className="text-[10px] font-bold" style={{ color: p.isActive ? '#2d7a4e' : '#800020' }}>
                              {p.isActive ? '● በሥራ ላይ' : '● አገልግሎት ያቆመ'}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-base text-[#1A1209]">{p.nameAm}</h4>
                          <p className="text-xs text-[#9B8E7A]" style={{ fontFamily: 'Inter' }}>{p.nameEn}</p>
                          {parentDiocese && (
                            <p className="text-xs text-[#800020] mt-1">ሀገረ ስብከት: {parentDiocese.nameAm}</p>
                          )}
                          {(p.address || p.phone || p.email) && (
                            <div className="text-[11px] text-[#6B5E45] mt-2 flex flex-col gap-0.5">
                              {p.address && <span>📍 አድራሻ: {p.address}</span>}
                              {p.phone && <span>📞 ስልክ: {p.phone}</span>}
                              {p.email && <span>✉ ኢሜይል: {p.email}</span>}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-2 pt-3 border-t border-[#F0EBE0]">
                          <button onClick={() => startEditParish(p)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border border-[#E8E0D0] text-[#6B5E45] cursor-pointer">
                            <Edit3 className="w-3.5 h-3.5" /> አስተካክል
                          </button>
                          <button onClick={() => toggleStatus(p)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
                            style={{ backgroundColor: p.isActive ? '#800020' : '#2d7a4e' }}>
                            {p.isActive ? <><XCircle className="w-3.5 h-3.5" /> አቁም</> : <><CheckCircle2 className="w-3.5 h-3.5" /> ሥራ ጀምር</>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===================== TAB: DIOCESES ===================== */}
            {tab === 'diocese' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-[#1A1209]">የአህጉረ ስብከት ዝርዝር</h2>
                  <button onClick={() => { setEditingDiocese(null); setDiocForm({ name: '', nameAm: '', nameEn: '', type: 'DIOCESE' }); setShowDioceseForm(!showDioceseForm); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer text-white"
                    style={{ backgroundColor: '#2d7a4e' }}>
                    <PlusCircle className="w-4 h-4" /> አዲስ ሀገረ ስብከት
                  </button>
                </div>

                {/* Form to Add / Edit */}
                {showDioceseForm && (
                  <form onSubmit={handleDioceseSubmit} className="rounded-2xl border p-6 flex flex-col gap-4" style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
                    <h3 className="font-bold text-sm text-[#800020]">{editingDiocese ? 'ሀገረ ስብከቱን ያስተካክሉ' : 'አዲስ ሀገረ ስብከት ይጨምሩ'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {formField('የአማርኛ ስም *', diocForm.nameAm, v => setDiocForm(f => ({ ...f, nameAm: v })), 'አዲስ አበባ ሀገረ ስብከት')}
                      {formField('የእንግሊዘኛ ስም *', diocForm.nameEn, v => setDiocForm(f => ({ ...f, nameEn: v })), 'Archdiocese of Addis Ababa')}
                      {formField('ስም (ለቁልፍ) *', diocForm.name, v => setDiocForm(f => ({ ...f, name: v })), 'dioc_addis')}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-[#9B8E7A]">ደረጃ *</label>
                        <select value={diocForm.type} onChange={e => setDiocForm(f => ({ ...f, type: e.target.value }))}
                          className="rounded-xl px-3 py-2.5 border text-sm outline-none bg-[#FDFAF5]"
                          style={{ borderColor: '#E8E0D0' }}>
                          <option value="DIOCESE">ሀገረ ስብከት (Diocese)</option>
                          <option value="ARCHDIOCESE">ሊቀ ጳጳስ ሀገረ ስብከት (Archdiocese)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end mt-2">
                      <button type="button" onClick={() => setShowDioceseForm(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-[#9B8E7A] cursor-pointer">ሰርዝ</button>
                      <button type="submit" disabled={actionLoading} className="px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer" style={{ backgroundColor: '#800020' }}>
                        {actionLoading ? 'በማስቀመጥ ላይ...' : 'አስቀምጥ'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Table list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dioceses.map(d => (
                    <div key={d.id} className="rounded-2xl border p-5 flex flex-col justify-between gap-3" style={{ backgroundColor: '#fff', borderColor: '#E8E0D0' }}>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-[#F5F0E8] text-[#800020]">
                            🌐 {d.type === 'ARCHDIOCESE' ? 'ሊቀ ጳጳስ ሀገረ ስብከት' : 'ሀገረ ስብከት'}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-base text-[#1A1209]">{d.nameAm}</h4>
                        <p className="text-xs text-[#9B8E7A]" style={{ fontFamily: 'Inter' }}>{d.nameEn}</p>
                      </div>
                      <div className="flex gap-2 mt-2 pt-3 border-t border-[#F0EBE0]">
                        <button onClick={() => startEditDiocese(d)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border border-[#E8E0D0] text-[#6B5E45] cursor-pointer">
                          <Edit3 className="w-3.5 h-3.5" /> አስተካክል
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Form Field Input Helper
function formField(label: string, value: string, onChange: (v: string) => void, placeholder: string) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-[#9B8E7A]">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="rounded-xl px-3 py-2 border text-sm outline-none bg-[#FDFAF5]"
        style={{ borderColor: '#E8E0D0', color: '#1A1209', fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
      />
    </div>
  );
}
