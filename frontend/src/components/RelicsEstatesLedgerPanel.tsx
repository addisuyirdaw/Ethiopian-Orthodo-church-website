// src/components/RelicsEstatesLedgerPanel.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Map, Plus, RefreshCw, AlertTriangle, Eye, ShieldAlert } from 'lucide-react';

const CATEGORY_MAP = {
  'MANUSCRIPT': 'የብራና መጽሐፍ (Manuscript)',
  'CROSS': 'መስቀል (Cross)',
  'VESTMENT': 'አልባሳት (Vestment)',
  'LITURGICAL_VESSEL': 'የቀደሳ ንዋይ (Liturgical Vessel)'
};

const CONDITION_MAP = {
  'EXCELLENT': 'EXCELLENT — በጣም ጥሩ',
  'GOOD': 'GOOD — ጥሩ',
  'NEEDS_RESTORATION': 'NEEDS RESTORATION — ጥገና የሚያስፈልገው',
  'CRITICAL': 'CRITICAL — አስጊ ሁኔታ ላይ ያለ'
};

export const RelicsEstatesLedgerPanel: React.FC = () => {
  const { ecclesiasticalRole } = useAuth();
  
  // Ecclesiastical Role Access Gates
  const CLERGY_ROLES = ['PATRIARCH', 'ARCHBISHOP', 'METROPOLITAN', 'BISHOP', 'PRIEST'];
  const EPISCOPAL_ROLES = ['PATRIARCH', 'ARCHBISHOP', 'METROPOLITAN', 'BISHOP'];
  
  const isClergy = CLERGY_ROLES.includes(ecclesiasticalRole || '');
  const isEpiscopal = EPISCOPAL_ROLES.includes(ecclesiasticalRole || '');

  const [activeSubTab, setActiveSubTab] = useState<'ARTIFACTS' | 'ESTATES'>('ARTIFACTS');
  
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [estates, setEstates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states - Artifacts
  const [artNameEn, setArtNameEn] = useState('');
  const [artNameAm, setArtNameAm] = useState('');
  const [artNameGez, setArtNameGez] = useState('');
  const [artCat, setArtCat] = useState('MANUSCRIPT');
  const [artCond, setArtCond] = useState('GOOD');
  const [artAge, setArtAge] = useState<number>(100);
  const [artLoc, setArtLoc] = useState('');
  
  // Form states - Estates
  const [estName, setEstName] = useState('');
  const [estHectares, setEstHectares] = useState<number>(5.5);
  const [estLat, setEstLat] = useState<number>(14.3725);
  const [estLon, setEstLon] = useState<number>(39.2814);
  const [estDeed, setEstDeed] = useState('REGISTERED');
  const [estUtil, setEstUtil] = useState('Agricultural / Sanctuary');

  const [saveLoading, setSaveLoading] = useState(false);

  const fetchArtifacts = async () => {
    if (!isClergy) return;
    setLoading(true);
    try {
      const res = await api.get('/logistics/artifacts');
      setArtifacts(res.data.data || res.data || []);
    } catch (e) {
      // Ignored / fallback empty list in local dev
      setArtifacts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/logistics/estates');
      setEstates(res.data.data || res.data || []);
    } catch (e) {
      setEstates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'ARTIFACTS') {
      fetchArtifacts();
    } else {
      fetchEstates();
    }
  }, [activeSubTab]);

  const handleRegisterArtifact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isClergy) return;
    setSaveLoading(true);
    setError('');
    try {
      await api.post('/logistics/artifacts', {
        nameEn: artNameEn,
        nameAm: artNameAm || undefined,
        nameGez: artNameGez || undefined,
        category: artCat,
        structuralCondition: artCond,
        estimatedAge: artAge || undefined,
        storageLocation: artLoc
      });
      alert('Historical Relic registered successfully.');
      setArtNameEn('');
      setArtNameAm('');
      setArtNameGez('');
      setArtLoc('');
      fetchArtifacts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not register artifact.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRegisterEstate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEpiscopal) return;
    setSaveLoading(true);
    setError('');
    try {
      await api.post('/logistics/estates', {
        estateName: estName,
        landAreaHectares: estHectares || undefined,
        gpsLatitude: estLat || undefined,
        gpsLongitude: estLon || undefined,
        legalDeedStatus: estDeed,
        currentUtilization: estUtil
      });
      alert('Monastic Land chart registered successfully.');
      setEstName('');
      fetchEstates();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not register estate.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleInspect = async (id: string) => {
    if (!isClergy) return;
    const cond = prompt("Log inspection structural condition (EXCELLENT, GOOD, NEEDS_RESTORATION, CRITICAL):", "GOOD");
    if (!cond) return;
    const notes = prompt("Enter inspection observation notes:", "Routine physical audit.");
    if (notes === null) return;

    try {
      await api.post(`/logistics/artifacts/${id}/inspect`, {
        conditionAtInspection: cond.toUpperCase().trim(),
        inspectionNotes: notes,
        inspectedAt: new Date().toISOString()
      });
      alert('Inspection logged successfully.');
      fetchArtifacts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not log inspection.');
    }
  };

  return (
    <div className="rounded-xl border p-6 shadow-md" style={{ backgroundColor: 'var(--eotc-surface)', borderColor: 'var(--eotc-border)' }}>
      
      {/* Tab select header */}
      <div className="flex justify-between items-center border-b pb-4 mb-6" style={{ borderColor: 'var(--eotc-border)' }}>
        <div className="flex gap-4">
          <button
            onClick={() => setActiveSubTab('ARTIFACTS')}
            className={`font-serif font-extrabold text-lg flex items-center gap-2 pb-2 border-b-2 transition cursor-pointer ${activeSubTab === 'ARTIFACTS' ? 'border-[var(--eotc-gold)] text-[var(--eotc-gold)]' : 'border-transparent opacity-60'}`}
          >
            <BookOpen className="w-5 h-5" />
            Historical Relics & Sacred Artifacts — ንዋያተ ቅድሳት
          </button>
          <button
            onClick={() => setActiveSubTab('ESTATES')}
            className={`font-serif font-extrabold text-lg flex items-center gap-2 pb-2 border-b-2 transition cursor-pointer ${activeSubTab === 'ESTATES' ? 'border-[var(--eotc-gold)] text-[var(--eotc-gold)]' : 'border-transparent opacity-60'}`}
          >
            <Map className="w-5 h-5" />
            Monastic Land & Estates — የርስት መሬቶች
          </button>
        </div>
        <button
          onClick={activeSubTab === 'ARTIFACTS' ? fetchArtifacts : fetchEstates}
          className="p-2 border rounded-lg hover:bg-white/5 transition cursor-pointer"
          style={{ borderColor: 'var(--eotc-border)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--eotc-gold)' }} />
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg border flex items-center gap-2 text-xs mb-4" style={{ backgroundColor: 'rgba(231,76,60,0.08)', borderColor: 'rgba(231,76,60,0.3)', color: '#e74c3c' }}>
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* ARTIFACTS PANEL */}
      {activeSubTab === 'ARTIFACTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
          
          {/* Register Form */}
          <div className="relative">
            {!isClergy && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6 rounded-xl border border-white/5">
                <ShieldAlert className="w-12 h-12 text-red-500 mb-2" />
                <h5 className="font-bold text-sm text-white">Clergy Authorization Required</h5>
                <p className="text-[10px] opacity-75 mt-1 max-w-[280px]">
                  Registering sacred relics requires ordained Priest authority level or higher.
                </p>
              </div>
            )}
            
            <h4 className="font-bold text-xs uppercase tracking-wider text-white mb-4">
              Register Sacred Relic — ጥንታዊ ቅርስ መዝግብ
            </h4>

            <form onSubmit={handleRegisterArtifact} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">Name (English)</label>
                  <input
                    type="text"
                    value={artNameEn}
                    onChange={(e) => setArtNameEn(e.target.value)}
                    placeholder="e.g., Ge'ez Parchment Bible"
                    className="w-full px-3 py-2 border rounded-lg bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
                    style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">Name (Amharic / ጌዕዝ)</label>
                  <input
                    type="text"
                    value={artNameAm}
                    onChange={(e) => setArtNameAm(e.target.value)}
                    placeholder="ምሳሌ፦ የብራና መጽሐፍ ቅዱስ"
                    className="w-full px-3 py-2 border rounded-lg bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
                    style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">Category</label>
                  <select
                    value={artCat}
                    onChange={(e) => setArtCat(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-black/35 cursor-pointer outline-none"
                    style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                  >
                    {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                      <option key={k} value={k} style={{ backgroundColor: 'var(--eotc-surface)' }}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">Condition</label>
                  <select
                    value={artCond}
                    onChange={(e) => setArtCond(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-black/35 cursor-pointer outline-none"
                    style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                  >
                    {Object.entries(CONDITION_MAP).map(([k, v]) => (
                      <option key={k} value={k} style={{ backgroundColor: 'var(--eotc-surface)' }}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">Estimated Age (Years)</label>
                  <input
                    type="number"
                    value={artAge}
                    onChange={(e) => setArtAge(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
                    style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">Storage Room / Box Location</label>
                  <input
                    type="text"
                    value={artLoc}
                    onChange={(e) => setArtLoc(e.target.value)}
                    placeholder="e.g., Vault Box A-02"
                    className="w-full px-3 py-2 border rounded-lg bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
                    style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saveLoading}
                className="w-full py-2.5 rounded-lg font-bold shadow-md cursor-pointer transition transform hover:-translate-y-0.5 flex items-center justify-center gap-1.5"
                style={{ backgroundColor: 'var(--eotc-gold)', color: '#0a0809' }}
              >
                <Plus className="w-3.5 h-3.5" />
                {saveLoading ? 'Registering...' : 'Register Relic'}
              </button>
            </form>
          </div>

          {/* List display */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-white">
              Registered Artifacts Register — የንዋያተ ቅድሳት መዝገብ
            </h4>
            
            {loading ? (
              <div className="text-center py-6">Loading register...</div>
            ) : artifacts.length === 0 ? (
              <p className="text-xs opacity-50 py-4 text-center">No holy relics registered yet.</p>
            ) : (
              <div className="overflow-x-auto max-h-[350px]">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--eotc-border)' }}>
                      <th className="pb-2 text-gray-500 font-bold">Relic Name</th>
                      <th className="pb-2 text-gray-500 font-bold">Category</th>
                      <th className="pb-2 text-gray-500 font-bold">Condition</th>
                      <th className="pb-2 text-gray-500 font-bold">Age (Yrs)</th>
                      <th className="pb-2 text-gray-500 font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {artifacts.map((a: any) => (
                      <tr key={a.id}>
                        <td className="py-2.5 font-bold text-white pr-2">
                          {a.nameAm || a.nameEn || '—'}
                          <span className="block font-normal text-[9px] opacity-60 mt-0.5">{a.nameEn}</span>
                        </td>
                        <td className="py-2.5 pr-2">
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-white/5 border border-white/10 text-gray-300">
                            {a.category}
                          </span>
                        </td>
                        <td className="py-2.5 pr-2">
                          <span className="font-bold" style={{ color: a.structuralCondition === 'CRITICAL' ? '#ef4444' : 'var(--eotc-gold)' }}>
                            {a.structuralCondition}
                          </span>
                        </td>
                        <td className="py-2.5 pr-2">{a.estimatedAge ?? '—'}</td>
                        <td className="py-2.5">
                          <button
                            onClick={() => handleInspect(a.id)}
                            className="px-2 py-1 border rounded font-bold text-[9px] hover:bg-white/5 cursor-pointer flex items-center gap-1"
                            style={{ borderColor: 'var(--eotc-gold)', color: 'var(--eotc-gold)' }}
                          >
                            <Eye className="w-2.5 h-2.5" /> Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ESTATES PANEL */}
      {activeSubTab === 'ESTATES' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
          
          {/* Register Form */}
          <div className="relative">
            {!isEpiscopal && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6 rounded-xl border border-white/5">
                <ShieldAlert className="w-12 h-12 text-amber-500 mb-2" />
                <h5 className="font-bold text-sm text-white">Episcopal Authorization Required</h5>
                <p className="text-[10px] opacity-75 mt-1 max-w-[280px]">
                  Monastic land registrations and deed updates require at least Bishop level ecclesiastical authority.
                </p>
              </div>
            )}
            
            <h4 className="font-bold text-xs uppercase tracking-wider text-white mb-4">
              Register Monastic Land Chart — የርስት መሬት መዝግብ
            </h4>

            <form onSubmit={handleRegisterEstate} className="space-y-4">
              <div>
                <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">Parish Estate / Land Name</label>
                <input
                  type="text"
                  value={estName}
                  onChange={(e) => setEstName(e.target.value)}
                  placeholder="e.g., Debre Libanos Sanctuary Land"
                  className="w-full px-3 py-2 border rounded-lg bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
                  style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">Area (Hectares)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={estHectares}
                    onChange={(e) => setEstHectares(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
                    style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">GPS Lat</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={estLat}
                    onChange={(e) => setEstLat(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
                    style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">GPS Lon</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={estLon}
                    onChange={(e) => setEstLon(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
                    style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">Legal Deed Cartography Status</label>
                  <select
                    value={estDeed}
                    onChange={(e) => setEstDeed(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-black/35 cursor-pointer outline-none"
                    style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                  >
                    <option value="REGISTERED" style={{ backgroundColor: 'var(--eotc-surface)' }}>REGISTERED — ህጋዊ ደብዳቤ ያለው</option>
                    <option value="UNREGISTERED" style={{ backgroundColor: 'var(--eotc-surface)' }}>PENDING — ያልተመዘገበ</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">Utilization Purpose</label>
                  <input
                    type="text"
                    value={estUtil}
                    onChange={(e) => setEstUtil(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
                    style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saveLoading}
                className="w-full py-2.5 rounded-lg font-bold shadow-md cursor-pointer transition transform hover:-translate-y-0.5 flex items-center justify-center gap-1.5"
                style={{ backgroundColor: 'var(--eotc-gold)', color: '#0a0809' }}
              >
                <Plus className="w-3.5 h-3.5" />
                {saveLoading ? 'Registering...' : 'Register Land Chart'}
              </button>
            </form>
          </div>

          {/* List display */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-white">
              Land estates Index — የርስት መሬቶች ማህደር
            </h4>
            
            {loading ? (
              <div className="text-center py-6">Loading index...</div>
            ) : estates.length === 0 ? (
              <p className="text-xs opacity-50 py-4 text-center">No land estates registered yet.</p>
            ) : (
              <div className="overflow-x-auto max-h-[350px]">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--eotc-border)' }}>
                      <th className="pb-2 text-gray-500 font-bold">Estate Name</th>
                      <th className="pb-2 text-gray-500 font-bold">Area (Hectares)</th>
                      <th className="pb-2 text-gray-500 font-bold">GPS Coordinate</th>
                      <th className="pb-2 text-gray-500 font-bold">Deed Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {estates.map((e: any) => (
                      <tr key={e.id}>
                        <td className="py-2.5 font-bold text-white pr-2" style={{ color: 'var(--eotc-gold)' }}>{e.estateName}</td>
                        <td className="py-2.5 pr-2">{e.landAreaHectares} ha</td>
                        <td className="py-2.5 font-mono text-[9.5px] pr-2">
                          {e.gpsLatitude ? `${e.gpsLatitude.toFixed(4)}, ${e.gpsLongitude.toFixed(4)}` : '—'}
                        </td>
                        <td className="py-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-green-500/10 text-green-400 border border-green-500/25">
                            {e.legalDeedStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
