// src/components/DirectoryDashboard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Parishioner, CommunionStatus } from '../types/models';
import { StatusBadge } from './StatusBadge';
import { OnboardingWizard } from './OnboardingWizard';
import {
  Search as SearchIcon,
  Users,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  UserCheck,
  AlertCircle,
  ArrowLeft,
  PlusCircle
} from 'lucide-react';

const statusOptions: { value: CommunionStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses â€” áˆáˆ‰áŠ•áˆ áˆáŠ”á‰³' },
  { value: 'ACTIVE', label: 'âœ… Active â€” áŠ•á‰' },
  { value: 'IRREGULAR', label: 'âš ï¸ Irregular â€” áˆ˜á‹°á‰ áŠ› á‹«áˆáˆ†áŠ' },
  { value: 'NONE', label: 'â›” None â€” á‹¨áˆˆáˆ' },
];

const genderOptions = [
  { value: '', label: 'All Genders â€” áˆáˆ‰áŠ•áˆ áŒ¾á‰³' },
  { value: 'MALE', label: 'Male â€” á‹ˆáŠ•á‹µ' },
  { value: 'FEMALE', label: 'Female â€” áˆ´á‰µ' },
];

type SortKey = 'lastNameEn' | 'firstNameEn' | 'id' | 'communionStatus';

const DirectoryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [parishioners, setParishioners] = useState<Parishioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CommunionStatus | ''>('');
  const [genderFilter, setGenderFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('lastNameEn');
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<Parishioner | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  const fetchParishioners = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (search) params.q = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/parishioners', { params });
      setParishioners(res.data);
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 500) {
        setParishioners([]);
        setError('Parish registry is not yet seeded. Run the database seed to populate records.');
      } else {
        setParishioners([]);
        setError('Could not connect to the canonical registry. Check the backend server.');
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const delay = setTimeout(fetchParishioners, 350); // debounce search
    return () => clearTimeout(delay);
  }, [fetchParishioners]);

  const displayed = [...parishioners]
    .filter(p => !genderFilter || p.gender === genderFilter)
    .sort((a, b) => {
      const av = (a as any)[sortKey] ?? '';
      const bv = (b as any)[sortKey] ?? '';
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? (sortAsc ? <ChevronUp className="w-3.5 h-3.5 inline ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 inline ml-0.5" />)
      : null;

  const activeCount = parishioners.filter(p => p.communionStatus === 'ACTIVE').length;
  const irregularCount = parishioners.filter(p => p.communionStatus === 'IRREGULAR').length;

  return (
    <div className="min-h-screen text-[#F2EEEE] transition-colors duration-300" style={{ backgroundColor: 'var(--eotc-canvas)', fontFamily: "'Outfit', sans-serif" }}>

      {/* Page Header */}
      <div
        className="px-6 py-6 border-b shadow-sm relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--eotc-burgundy) 0%, var(--eotc-burgundy-2) 100%)', borderColor: 'var(--eotc-gold)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2.5 rounded-lg border hover:bg-white/5 transition flex items-center justify-center cursor-pointer"
              style={{ borderColor: 'var(--eotc-border)' }}
            >
              <ArrowLeft className="w-4 h-4" style={{ color: 'var(--eotc-gold)' }} />
            </button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'var(--eotc-gold)' }}>
                â˜© Qale Awadi Canonical Registry
              </p>
              <h1 className="text-2xl font-extrabold font-serif text-white leading-tight">
                Parishioner Directory â€” á‹¨áˆáŠ¥áˆ˜áŠ“áŠ• áˆ˜á‹áŒˆá‰¥
              </h1>
              <p className="text-xs opacity-75 mt-0.5">
                Holy Synod Approved Parish Register &bull; ደብረ ብርሃን መድኃኔዓለም ቤተ ክርስቲያን
              </p>
            </div>
          </div>

          {/* Stat Pills */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'var(--eotc-border)', color: 'white' }}>
              <Users className="w-4 h-4" style={{ color: 'var(--eotc-gold)' }} />
              <span>{parishioners.length} Total Members</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold"
              style={{ backgroundColor: 'rgba(46,204,113,0.1)', borderColor: 'rgba(46,204,113,0.3)', color: '#2ecc71' }}>
              <UserCheck className="w-4 h-4" />
              <span>{activeCount} Active</span>
            </div>
            {irregularCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold"
                style={{ backgroundColor: 'rgba(217,119,6,0.1)', borderColor: 'rgba(217,119,6,0.3)', color: '#fcd34d' }}>
                <AlertCircle className="w-4 h-4" />
                <span>{irregularCount} Irregular</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Filter Bar */}
        <div
          className="p-5 rounded-xl border shadow-md flex flex-wrap gap-4 items-center"
          style={{ backgroundColor: 'var(--eotc-surface)', borderColor: 'var(--eotc-border)' }}
        >
          {/* Search */}
          <div className="relative flex-grow min-w-[280px]">
            <SearchIcon className="absolute left-3.5 top-3 w-4 h-4 opacity-60" style={{ color: 'var(--eotc-gold)' }} />
            <input
              type="text"
              placeholder="Search by English name, Amharic name, or membership ID..."
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm transition focus:outline-none focus:ring-1 bg-black/30 placeholder-gray-500"
              style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            className="border rounded-lg px-4 py-2.5 text-sm focus:outline-none transition cursor-pointer bg-black/30"
            style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as CommunionStatus)}
          >
            {statusOptions.map(o => (
              <option key={o.value} value={o.value} style={{ backgroundColor: 'var(--eotc-surface)' }}>{o.label}</option>
            ))}
          </select>

          {/* Gender Filter */}
          <select
            className="border rounded-lg px-4 py-2.5 text-sm focus:outline-none transition cursor-pointer bg-black/30"
            style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
            value={genderFilter}
            onChange={e => setGenderFilter(e.target.value)}
          >
            {genderOptions.map(o => (
              <option key={o.value} value={o.value} style={{ backgroundColor: 'var(--eotc-surface)' }}>{o.label}</option>
            ))}
          </select>

          {/* Refresh */}
          <button
            onClick={fetchParishioners}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-bold shadow-md cursor-pointer transition transform hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--eotc-gold)', color: '#0a0809', borderColor: 'var(--eotc-gold)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* Register Member */}
          <button
            onClick={() => setShowRegisterForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold shadow-md cursor-pointer transition transform hover:-translate-y-0.5 text-white"
            style={{ backgroundColor: 'var(--eotc-burgundy)', borderColor: 'var(--eotc-border)', borderWidth: 1 }}
          >
            <PlusCircle className="w-3.5 h-3.5" style={{ color: 'var(--eotc-gold)' }} />
            Register Member â€” áˆáŠ¥áˆ˜áŠ• áˆ˜á‹áŒá‰¥
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            className="p-4 rounded-xl border flex items-start gap-3 text-sm shadow-md"
            style={{ backgroundColor: 'rgba(231,76,60,0.08)', borderColor: 'rgba(231,76,60,0.3)', color: '#e74c3c' }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Registry Notice</p>
              <p className="mt-0.5 opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Table / Loading / Empty */}
        <div
          className="rounded-xl border overflow-hidden shadow-md"
          style={{ backgroundColor: 'var(--eotc-surface)', borderColor: 'var(--eotc-border)' }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--eotc-gold)', borderTopColor: 'transparent' }} />
              <p className="text-sm font-bold" style={{ color: 'var(--eotc-gold)' }}>Loading canonical registry...</p>
            </div>
          ) : displayed.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-60">
              <Users className="w-12 h-12" />
              <p className="text-sm font-semibold">No parishioners match your search filters.</p>
              <button
                onClick={() => { setSearch(''); setStatusFilter(''); setGenderFilter(''); }}
                className="text-xs font-bold underline cursor-pointer"
                style={{ color: 'var(--eotc-gold)' }}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'rgba(212,175,55,0.04)', borderBottom: '1px solid var(--eotc-border)' }}>
                    {[
                      { key: 'lastNameEn' as SortKey, label: 'Full Name (English)' },
                      { key: 'firstNameAm' as SortKey, label: 'áˆ™áˆ‰ áˆµáˆ (áŠ áˆ›áˆ­áŠ›)' },
                      { key: 'id' as SortKey, label: 'Membership ID' },
                    ].map(col => (
                      <th
                        key={col.key}
                        className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer select-none hover:opacity-80 transition"
                        style={{ color: 'var(--eotc-gold)' }}
                        onClick={() => toggleSort(col.key)}
                      >
                        {col.label} <SortIcon k={col.key} />
                      </th>
                    ))}
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--eotc-gold)' }}>
                      Baptismal Name
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--eotc-gold)' }}>
                      Spiritual Father ID
                    </th>
                    <th
                      className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer select-none hover:opacity-80 transition"
                      style={{ color: 'var(--eotc-gold)' }}
                      onClick={() => toggleSort('communionStatus')}
                    >
                      Communion Status <SortIcon k="communionStatus" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((p, i) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelected(selected?.id === p.id ? null : p)}
                      className="cursor-pointer transition-colors"
                      style={{
                        backgroundColor: selected?.id === p.id
                          ? 'rgba(212,175,55,0.06)'
                          : i % 2 === 0 ? 'var(--eotc-card)' : 'rgba(255,255,255,0.01)',
                        borderBottom: '1px solid var(--eotc-border)',
                      }}
                      onMouseEnter={e => { if (selected?.id !== p.id) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(212,175,55,0.03)'; }}
                      onMouseLeave={e => { if (selected?.id !== p.id) (e.currentTarget as HTMLElement).style.backgroundColor = i % 2 === 0 ? 'var(--eotc-card)' : 'rgba(255,255,255,0.01)'; }}
                    >
                      {/* Full Name EN */}
                      <td className="px-5 py-4 font-semibold text-white">
                        {p.firstNameEn} {p.middleNameEn ?? ''} {p.lastNameEn}
                      </td>
                      {/* Full Name AM */}
                      <td className="px-5 py-4 font-semibold font-serif" style={{ color: 'var(--eotc-gold)' }}>
                        {p.firstNameAm} {p.middleNameAm ?? ''} {p.lastNameAm}
                      </td>
                      {/* Membership ID */}
                      <td className="px-5 py-4">
                        <span
                          className="font-mono text-xs font-bold px-2 py-0.5 rounded border"
                          style={{ backgroundColor: 'rgba(212,175,55,0.05)', color: 'var(--eotc-gold)', borderColor: 'var(--eotc-border)' }}
                        >
                          {p.id}
                        </span>
                      </td>
                      {/* Baptismal Name */}
                      <td className="px-5 py-4 font-serif opacity-90">
                        {p.baptismalName ?? <span className="opacity-40">â€”</span>}
                      </td>
                      {/* Spiritual Father */}
                      <td className="px-5 py-4 font-mono text-xs opacity-75">
                        {p.spiritualFatherId ?? <span className="opacity-40">â€”</span>}
                      </td>
                      {/* Communion Status */}
                      <td className="px-5 py-4">
                        <StatusBadge status={p.communionStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer count */}
              <div
                className="px-5 py-4 border-t text-xs font-semibold opacity-60"
                style={{ borderColor: 'var(--eotc-border)', backgroundColor: 'rgba(0,0,0,0.1)' }}
              >
                Showing {displayed.length} of {parishioners.length} canonical records
                {(search || statusFilter || genderFilter) && ' (filtered)'}
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel â€” shown when a row is selected */}
        {selected && (
          <div
            className="rounded-xl border p-6 shadow-lg animate-pulse-once"
            style={{ backgroundColor: 'var(--eotc-surface)', borderColor: 'var(--eotc-gold)', borderWidth: 1 }}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 font-mono" style={{ color: 'var(--eotc-gold)' }}>
                  Selected Parishioner Profile
                </p>
                <h3 className="text-xl font-extrabold font-serif text-white">
                  {selected.firstNameEn} {selected.middleNameEn ?? ''} {selected.lastNameEn}
                </h3>
                <p className="text-sm mt-0.5 font-serif" style={{ color: 'var(--eotc-gold)' }}>
                  {selected.firstNameAm} {selected.middleNameAm ?? ''} {selected.lastNameAm}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer hover:bg-white/5 transition"
                style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
              >
                âœ• Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {[
                { label: 'Membership ID', value: selected.id },
                { label: 'Baptismal Name / á‹¨áŠ­áˆ­áˆµá‰µáŠ“ áˆµáˆ', value: selected.baptismalName ?? 'â€”' },
                { label: 'Spiritual Father ID', value: selected.spiritualFatherId ?? 'â€”' },
                { label: 'Gender', value: selected.gender },
                { label: 'Date of Birth (Gregorian)', value: selected.dateOfBirthGregorian },
                { label: 'Date of Birth (Ethiopic)', value: selected.dateOfBirthEthiopian },
                { label: 'Phone', value: selected.phone },
                { label: 'Email', value: selected.email ?? 'â€”' },
                { label: 'Subcity', value: selected.address?.subcity ?? 'â€”' },
                { label: 'Woreda', value: selected.address?.woreda ?? 'â€”' },
                { label: 'Kebele', value: selected.address?.kebele ?? 'â€”' },
                { label: 'Communion Status', value: selected.communionStatus },
              ].map(field => (
                <div key={field.label} className="p-3.5 rounded-lg border" style={{ borderColor: 'var(--eotc-border)', backgroundColor: 'rgba(0,0,0,0.15)' }}>
                  <p className="font-bold uppercase tracking-wide mb-1 opacity-55" style={{ fontSize: '9px' }}>
                    {field.label}
                  </p>
                  <p className="font-semibold text-white">{field.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Registration Modal Overlay */}
        {showRegisterForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="rounded-2xl border p-6 max-w-lg w-full shadow-2xl relative" style={{ backgroundColor: 'var(--eotc-surface)', borderColor: 'var(--eotc-gold)', borderWidth: 1 }}>
              <div className="flex justify-between items-center mb-4 pb-2 border-b" style={{ borderColor: 'var(--eotc-border)' }}>
                <h3 className="text-base font-bold font-serif text-white flex items-center gap-2">
                  â›ª Register New Parishioner â€” áˆáŠ¥áˆ˜áŠ• áˆ˜á‹áŒá‰¥
                </h3>
                <button
                  onClick={() => setShowRegisterForm(false)}
                  className="text-sm font-bold px-2 py-1 rounded hover:bg-white/10 text-gray-400 cursor-pointer"
                >
                  âœ•
                </button>
              </div>
              <OnboardingWizard
                onSuccess={() => {
                  setShowRegisterForm(false);
                  fetchParishioners();
                }}
                onCancel={() => setShowRegisterForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectoryDashboard;

