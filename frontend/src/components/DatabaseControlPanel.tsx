// src/components/DatabaseControlPanel.tsx
import React, { useState } from 'react';
import { api } from '../api/client';
import { Database, Play, AlertTriangle, CheckCircle, Terminal } from 'lucide-react';

export const DatabaseControlPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleInitDb = async () => {
    if (!confirm('This will run prisma db push --accept-data-loss and re-seed the database. Continue?')) return;
    setLoading(true);
    setError('');
    setOutput(['🔄 Initiating database push and seed...']);

    try {
      const res = await api.get('/dev/init-db');
      const data = res.data;
      const lines: string[] = [];
      lines.push('✅ Database initialized and seeded successfully.');
      if (data.details?.push) {
        lines.push('');
        lines.push('--- Prisma DB Push ---');
        lines.push(...data.details.push.split('\n').filter(Boolean));
      }
      if (data.details?.seed) {
        lines.push('');
        lines.push('--- Seed Output ---');
        lines.push(...data.details.seed.split('\n').filter(Boolean));
      }
      setOutput(lines);
    } catch (err: any) {
      const errData = err.response?.data;
      setError(errData?.message || 'Database initialization failed.');
      const lines: string[] = ['❌ Error occurred during DB initialization:'];
      if (errData?.error) lines.push(errData.error);
      if (errData?.stdout) lines.push(...errData.stdout.split('\n').filter(Boolean));
      if (errData?.stderr) lines.push(...errData.stderr.split('\n').filter(Boolean));
      setOutput(lines);
    } finally {
      setLoading(false);
    }
  };

  const clearConsole = () => setOutput([]);

  return (
    <div className="rounded-xl border p-6 shadow-md" style={{ backgroundColor: 'var(--eotc-surface)', borderColor: 'var(--eotc-border)' }}>
      <div className="flex justify-between items-center border-b pb-4 mb-6" style={{ borderColor: 'var(--eotc-border)' }}>
        <div>
          <h3 className="font-serif font-extrabold text-lg flex items-center gap-2" style={{ color: 'var(--eotc-gold)' }}>
            <Database className="w-5 h-5" />
            Database Control — ዳታቤዝ ዝግጅት
          </h3>
          <span className="inline-block px-2 py-0.5 rounded border text-[9px] font-bold uppercase mt-1" style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.35)', color: '#f59e0b' }}>
            Development Mode Only
          </span>
        </div>
      </div>

      <p className="text-xs opacity-70 mb-6 leading-relaxed">
        Initializes the complete PostgreSQL schema via Prisma and seeds canonical hierarchy data, parishioners, and institutional users. Use this to reset and restore a development database to a known good state.
      </p>

      <div className="flex gap-3 mb-6">
        <button
          onClick={handleInitDb}
          disabled={loading}
          className="px-5 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition transform hover:-translate-y-0.5 shadow-md flex items-center gap-2"
          style={{ backgroundColor: 'var(--eotc-gold)', color: '#0a0809' }}
        >
          <Play className="w-4 h-4" />
          {loading ? 'Running Init...' : '🔄 Initialize & Seed Database'}
        </button>
        {output.length > 0 && (
          <button
            onClick={clearConsole}
            className="px-4 py-2.5 rounded-lg text-xs font-bold border cursor-pointer hover:bg-white/5 transition"
            style={{ borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
          >
            Clear Console
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg border flex items-center gap-2 text-xs mb-4" style={{ backgroundColor: 'rgba(231,76,60,0.08)', borderColor: 'rgba(231,76,60,0.3)', color: '#e74c3c' }}>
          <AlertTriangle className="w-4 h-4" /><span>{error}</span>
        </div>
      )}

      {/* Console Output */}
      {output.length > 0 && (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'rgba(212,175,55,0.15)' }}>
          <div className="flex justify-between items-center px-4 py-2 border-b" style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderColor: 'rgba(212,175,55,0.1)' }}>
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" style={{ color: 'var(--eotc-gold)' }} />
              <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--eotc-gold)' }}>Database Console Output</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            </div>
          </div>
          <div className="p-4 font-mono text-xs max-h-72 overflow-y-auto space-y-0.5" style={{ backgroundColor: 'rgba(6,4,5,0.92)', color: '#00e865' }}>
            {output.map((line, i) => (
              <div key={i} className={line.startsWith('---') ? 'text-amber-400 font-bold mt-2' : line.startsWith('✅') ? 'text-green-400 font-bold' : line.startsWith('❌') ? 'text-red-400 font-bold' : ''}>
                {line || '\u00A0'}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-1.5 text-amber-400">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Processing...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
