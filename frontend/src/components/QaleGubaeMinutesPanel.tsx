// src/components/QaleGubaeMinutesPanel.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, RefreshCw, AlertTriangle, CheckCircle, Hash } from 'lucide-react';

export const QaleGubaeMinutesPanel: React.FC = () => {
  const { userId } = useAuth();
  // Sample parish institution ID matching db seed
  const institutionId = '006747ed-825d-422d-a2bc-785beab20bb6';
  
  const [minutes, setMinutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [minuteNumber, setMinuteNumber] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [topic, setTopic] = useState('');
  const [resolutions, setResolutions] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveResult, setSaveResult] = useState('');
  const [hashPreview, setHashPreview] = useState('');
  const [validationErr, setValidationErr] = useState('');

  const fetchMinutes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/governance/qale-gubae/minutes/${institutionId}`);
      setMinutes(res.data.data || res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not fetch council minutes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMinutes();
  }, []);

  // Update real-time SHA-256 signature preview on field inputs
  useEffect(() => {
    const generateHash = async () => {
      if (!minuteNumber || !meetingDate || !topic || !resolutions || !userId) {
        setHashPreview('');
        return;
      }
      try {
        const message = `${minuteNumber}|${new Date(meetingDate).toISOString()}|${topic}|${resolutions}|${userId}`;
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setHashPreview(hashHex);
      } catch (e) {
        setHashPreview('');
      }
    };
    generateHash();
  }, [minuteNumber, meetingDate, topic, resolutions, userId]);

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErr('');
    setSaveResult('');

    // Strict Qale Gubae Minutes Format check
    const formatRegex = /^OC\/[A-Za-z0-9_-]+\/\d{4}\/[A-Za-z0-9_-]+$/;
    if (!formatRegex.test(minuteNumber)) {
      setValidationErr('Minute number must match format: OC/ParishCode/Year/MinuteIndex (e.g., OC/MDB/2026/001)');
      return;
    }

    setSaveLoading(true);
    try {
      await api.post('/governance/qale-gubae/minutes', {
        institutionId,
        minuteNumber,
        meetingDate: new Date(meetingDate).toISOString(),
        discussionTopic: topic,
        resolutionsPassed: resolutions
      });
      setSaveResult('Minutes recorded successfully.');
      setMinuteNumber('');
      setTopic('');
      setResolutions('');
      fetchMinutes();
    } catch (err: any) {
      setValidationErr(err.response?.data?.message || 'Could not record minutes.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="rounded-xl border p-6 shadow-md" style={{ backgroundColor: 'var(--eotc-surface)', borderColor: 'var(--eotc-border)' }}>
      
      <div className="flex justify-between items-center border-b pb-4 mb-6" style={{ borderColor: 'var(--eotc-border)' }}>
        <h3 className="font-serif font-extrabold text-lg flex items-center gap-2" style={{ color: 'var(--eotc-gold)' }}>
          <FileText className="w-5 h-5" />
          Council Minutes Registry — ቃለ ጉባኤ መዝገብ
        </h3>
        <button
          onClick={fetchMinutes}
          className="p-2 border rounded-lg hover:bg-white/5 transition cursor-pointer"
          style={{ borderColor: 'var(--eotc-border)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--eotc-gold)' }} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Record New minutes Form */}
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--eotc-gold)' }}>
            Record Meeting Resolutions — ቃለ ጉባኤ መዝግብ
          </h4>
          
          <form onSubmit={handleRecord} className="space-y-4 text-xs">
            {validationErr && (
              <div className="p-2.5 rounded-lg border flex items-center gap-2" style={{ backgroundColor: 'rgba(231,76,60,0.08)', borderColor: 'rgba(231,76,60,0.3)', color: '#e74c3c' }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{validationErr}</span>
              </div>
            )}
            {saveResult && (
              <div className="p-2.5 rounded-lg border flex items-center gap-2" style={{ backgroundColor: 'rgba(46,204,113,0.08)', borderColor: 'rgba(46,204,113,0.3)', color: '#2ecc71' }}>
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{saveResult}</span>
              </div>
            )}

            <div>
              <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">Minute Number (e.g., OC/MDB/2026/04)</label>
              <input
                type="text"
                placeholder="OC/MDB/2026/04"
                value={minuteNumber}
                onChange={(e) => setMinuteNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
                style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                required
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">Meeting Date</label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
                style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                required
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">Discussion Topic</label>
              <input
                type="text"
                placeholder="e.g., Preparing for Debre Berhan Feast"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none"
                style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                required
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">Resolutions Passed</label>
              <textarea
                placeholder="Detail resolutions..."
                value={resolutions}
                onChange={(e) => setResolutions(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-black/35 focus:ring-1 focus:ring-[var(--eotc-gold)] outline-none min-h-[85px] resize-y"
                style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                required
              />
            </div>

            {/* Cryptographic SHA-256 Preview Card */}
            {hashPreview && (
              <div className="p-3 rounded-lg border bg-black/35 space-y-1" style={{ borderColor: 'var(--eotc-border)' }}>
                <p className="text-[9px] uppercase tracking-wider opacity-60 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-amber-500" />
                  Canonical Seal Hash Preview
                </p>
                <p className="font-mono text-[9px] select-all break-all" style={{ color: 'var(--eotc-gold)' }}>
                  {hashPreview}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={saveLoading}
              className="w-full py-2.5 rounded-lg font-bold shadow-md cursor-pointer transition transform hover:-translate-y-0.5 flex items-center justify-center gap-1.5 text-xs"
              style={{ backgroundColor: 'var(--eotc-gold)', color: '#0a0809' }}
            >
              <Plus className="w-3.5 h-3.5" />
              {saveLoading ? 'Recording...' : 'Record Minutes'}
            </button>
          </form>
        </div>

        {/* Minutes historical ledger list */}
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--eotc-gold)' }}>
            Minutes History Ledger — ያለፉ ቃለ ጉባኤዎች
          </h4>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-60">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--eotc-gold)', borderTopColor: 'transparent' }} />
              <span className="text-[10px]">Loading ledger...</span>
            </div>
          ) : minutes.length === 0 ? (
            <p className="text-xs opacity-50 py-4 text-center">No council minutes saved in registry yet.</p>
          ) : (
            <div className="overflow-x-auto max-h-[350px]">
              <table className="w-full text-[11px] text-left">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--eotc-border)' }}>
                    <th className="pb-2 text-gray-500 font-bold">Number</th>
                    <th className="pb-2 text-gray-500 font-bold">Date</th>
                    <th className="pb-2 text-gray-500 font-bold">Topic</th>
                    <th className="pb-2 text-gray-500 font-bold">Seal Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {minutes.map((m: any) => (
                    <tr key={m.id}>
                      <td className="py-2.5 font-bold text-white pr-2">{m.minuteNumber}</td>
                      <td className="py-2.5 whitespace-nowrap pr-2">{new Date(m.meetingDate).toLocaleDateString()}</td>
                      <td className="py-2.5 pr-2 truncate max-w-[120px]" title={m.discussionTopic}>{m.discussionTopic}</td>
                      <td className="py-2.5 font-mono text-[9px]" style={{ color: 'var(--eotc-gold)' }} title={m.signatureHash}>
                        {m.signatureHash ? `${m.signatureHash.slice(0, 10)}...` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
