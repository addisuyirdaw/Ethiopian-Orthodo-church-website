// src/components/DualAuthApprovalPanel.tsx
//
// Dual-Authorization Approval Queue — ሁለት ፊርማ ጥያቄ ቦርድ
//
// Per the Ethiopian Orthodox Tewahedo Church Administrative Constitution (2009 E.C.),
// sensitive financial and governance actions (bank withdrawals, asset disposals,
// budget modifications) require approval from BOTH the:
//   • CHAIRPERSON  (ሊቀ ምንበር — Liqe Menber)
//   • DEPUTY_CHAIRPERSON (ምክትል ሊቀ ምንበር — Mek Liqe Menber)
//
// This panel allows clergy in those roles to view pending requests and approve/reject them.

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DualAuthRequest {
  id: string;
  institutionId: string;
  requestedById?: string;
  payloadType: string;
  payloadJson: Record<string, any>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PARTIALLY_APPROVED';
  chairApproved?: boolean | null;
  deputyApproved?: boolean | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  PENDING: { color: '#f39c12', label: 'Pending Both', icon: <Clock className="w-3.5 h-3.5" /> },
  PARTIALLY_APPROVED: { color: '#3498db', label: 'Partially Approved', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  APPROVED: { color: '#2ecc71', label: 'Fully Approved', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  REJECTED: { color: '#e74c3c', label: 'Rejected', icon: <XCircle className="w-3.5 h-3.5" /> },
};

const PAYLOAD_TYPE_LABEL: Record<string, string> = {
  BANK_WITHDRAWAL: '🏦 Bank Withdrawal',
  ASSET_DISPOSAL: '🏛️ Asset Disposal',
  BUDGET_MODIFICATION: '📋 Budget Modification',
  LARGE_PURCHASE: '🛒 Large Purchase',
  STAFF_APPOINTMENT: '👤 Staff Appointment',
};

// ─── Sub-Components ──────────────────────────────────────────────────────────

function ApprovalSignatureBar({ chairApproved, deputyApproved }: { chairApproved?: boolean | null; deputyApproved?: boolean | null }) {
  const dots = [
    { label: 'Chair (ሊቀ ምንበር)', approved: chairApproved },
    { label: 'Deputy (ምክትል ሊቀ ምንበር)', approved: deputyApproved },
  ];
  return (
    <div className="flex gap-3 flex-wrap">
      {dots.map(({ label, approved }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border"
          style={{
            color: approved === true ? '#2ecc71' : approved === false ? '#e74c3c' : '#94a3b8',
            borderColor: approved === true ? '#2ecc7144' : approved === false ? '#e74c3c44' : '#94a3b844',
            backgroundColor: approved === true ? '#2ecc7112' : approved === false ? '#e74c3c12' : '#94a3b812',
          }}
        >
          {approved === true ? <CheckCircle className="w-3 h-3" /> : approved === false ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
          {label}
        </span>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const DualAuthApprovalPanel: React.FC = () => {
  const { institutionId } = useAuth();
  const [requests, setRequests] = useState<DualAuthRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectionReasonMap, setRejectionReasonMap] = useState<Record<string, string>>({});

  const fetchRequests = useCallback(async () => {
    if (!institutionId) return;
    setLoading(true);
    setError('');
    try {
      // Fetch pending dual-auth requests for this institution
      const res = await api.get(`/v1/governance/dual-auth/pending/${institutionId}`);
      setRequests(res.data.data ?? res.data ?? []);
    } catch (err: any) {
      // Gracefully degrade — endpoint may not exist yet in all environments
      const msg = err.response?.data?.message ?? err.message ?? 'Could not load approval queue.';
      // 404 means endpoint stub not yet wired — show empty state instead of error
      if (err.response?.status === 404) {
        setRequests([]);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleDecision = async (requestId: string, approve: boolean) => {
    setActionLoading(requestId);
    setError('');
    setSuccessMsg('');
    try {
      await api.post('/v1/governance/approve-action', {
        requestId,
        approve,
        rejectionReason: approve ? undefined : (rejectionReasonMap[requestId] || 'Rejected by approver'),
      });
      setSuccessMsg(approve ? 'Request approved successfully.' : 'Request rejected.');
      setExpandedId(null);
      await fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Action failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING' || r.status === 'PARTIALLY_APPROVED').length;

  return (
    <div className="rounded-xl border p-6 shadow-md" style={{ backgroundColor: 'var(--eotc-surface)', borderColor: 'var(--eotc-border)' }}>

      {/* Header */}
      <div className="flex justify-between items-start border-b pb-4 mb-6" style={{ borderColor: 'var(--eotc-border)' }}>
        <div>
          <h3 className="font-serif font-extrabold text-lg flex items-center gap-2" style={{ color: 'var(--eotc-gold)' }}>
            <ShieldCheck className="w-5 h-5" />
            Dual-Authorization Queue — ሁለት ፊርማ ጥያቄ
          </h3>
          <p className="text-xs opacity-60 mt-0.5">
            Per EOTC Administrative Constitution — sensitive actions require two-signature approval
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-black"
              style={{ backgroundColor: 'rgba(243,156,18,0.15)', color: '#f39c12', border: '1px solid rgba(243,156,18,0.3)' }}
            >
              {pendingCount} Pending
            </span>
          )}
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="p-2 border rounded-lg hover:bg-white/5 transition cursor-pointer disabled:opacity-50"
            style={{ borderColor: 'var(--eotc-border)' }}
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--eotc-gold)' }} />
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 rounded-lg border flex items-center gap-2 text-xs mb-4" style={{ backgroundColor: 'rgba(231,76,60,0.08)', borderColor: 'rgba(231,76,60,0.3)', color: '#e74c3c' }}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-lg border flex items-center gap-2 text-xs mb-4" style={{ backgroundColor: 'rgba(46,204,113,0.08)', borderColor: 'rgba(46,204,113,0.3)', color: '#2ecc71' }}>
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--eotc-gold)', borderTopColor: 'transparent' }} />
          <span className="text-xs opacity-60">Loading approval queue…</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--eotc-gold)' }} />
          <p className="text-sm font-bold opacity-50">No pending approvals</p>
          <p className="text-xs opacity-40 mt-1">All dual-authorization requests have been resolved.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const isExpanded = expandedId === req.id;
            const statusCfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG['PENDING'];
            const canAct = req.status === 'PENDING' || req.status === 'PARTIALLY_APPROVED';

            return (
              <div
                key={req.id}
                className="rounded-xl border overflow-hidden transition"
                style={{ borderColor: isExpanded ? 'var(--eotc-gold)' : 'var(--eotc-border)', backgroundColor: 'rgba(0,0,0,0.2)' }}
              >
                {/* Request header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="w-full flex items-center justify-between px-4 py-4 text-left cursor-pointer hover:bg-white/[0.02] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(212,175,55,0.1)', color: 'var(--eotc-gold)' }}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {PAYLOAD_TYPE_LABEL[req.payloadType] ?? req.payloadType}
                      </p>
                      <p className="text-[10px] opacity-50 mt-0.5">
                        {new Date(req.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border"
                      style={{
                        color: statusCfg.color,
                        borderColor: statusCfg.color + '44',
                        backgroundColor: statusCfg.color + '12',
                      }}
                    >
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
                  </div>
                </button>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className="border-t px-4 py-4 space-y-4" style={{ borderColor: 'var(--eotc-border)' }}>

                    {/* Signature status */}
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black opacity-50 mb-2">Signature Status</p>
                      <ApprovalSignatureBar
                        chairApproved={req.chairApproved}
                        deputyApproved={req.deputyApproved}
                      />
                    </div>

                    {/* Payload details */}
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black opacity-50 mb-2">Request Details</p>
                      <pre
                        className="text-[10px] p-3 rounded-lg overflow-x-auto font-mono leading-relaxed"
                        style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: '#94a3b8', border: '1px solid var(--eotc-border)' }}
                      >
                        {JSON.stringify(req.payloadJson, null, 2)}
                      </pre>
                    </div>

                    {/* Rejection reason input (only when rejecting) */}
                    {canAct && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-black opacity-50 mb-2">
                          Rejection Reason (optional)
                        </p>
                        <textarea
                          rows={2}
                          placeholder="Enter reason if rejecting this request…"
                          value={rejectionReasonMap[req.id] ?? ''}
                          onChange={e => setRejectionReasonMap(prev => ({ ...prev, [req.id]: e.target.value }))}
                          className="w-full px-3 py-2 text-xs border rounded-lg resize-none outline-none focus:ring-1 focus:ring-[var(--eotc-gold)]"
                          style={{ backgroundColor: 'rgba(0,0,0,0.35)', borderColor: 'var(--eotc-border)', color: '#F2EEEE' }}
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    {canAct && (
                      <div className="flex gap-3 pt-1">
                        <button
                          id={`approve-btn-${req.id}`}
                          onClick={() => handleDecision(req.id, true)}
                          disabled={!!actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer disabled:opacity-50"
                          style={{ backgroundColor: 'rgba(46,204,113,0.15)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.35)' }}
                        >
                          {actionLoading === req.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Approve ✓
                        </button>
                        <button
                          id={`reject-btn-${req.id}`}
                          onClick={() => handleDecision(req.id, false)}
                          disabled={!!actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer disabled:opacity-50"
                          style={{ backgroundColor: 'rgba(231,76,60,0.12)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.35)' }}
                        >
                          <XCircle className="w-4 h-4" />
                          Reject ✗
                        </button>
                      </div>
                    )}

                    {/* Rejection reason display */}
                    {req.status === 'REJECTED' && req.rejectionReason && (
                      <div className="text-xs p-3 rounded-lg" style={{ backgroundColor: 'rgba(231,76,60,0.08)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.2)' }}>
                        <strong>Rejection Reason:</strong> {req.rejectionReason}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DualAuthApprovalPanel;
