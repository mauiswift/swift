import { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import { CheckCircle, XCircle, Clock, RefreshCw, ClipboardList, ChevronDown, ChevronUp, Copy, Check, KeyRound, X, AlertTriangle } from 'lucide-react';
import LoadingSkeleton from '@/design-system/components/LoadingSkeleton';

interface KybRegistration {
  id: number;
  chat_id: string;
  telegram_username: string | null;
  step: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  bank_address: string | null;
  usdt_wallet_address: string | null;
  settlement_type: string | null;
  settlement_currency: string | null;
  id_photo_file_id: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  pending_review: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',   icon: <Clock className="h-3.5 w-3.5" /> },
  in_progress:    { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',      icon: <Clock className="h-3.5 w-3.5" /> },
  approved:       { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  rejected:       { color: 'bg-red-500/20 text-red-400 border-red-500/30',         icon: <XCircle className="h-3.5 w-3.5" /> },
};

const fmt_time = (s: string | null) => s ? new Date(s).toLocaleString() : '—';

interface IssuedCredentials {
  email: string;
  password: string;
  test_access_key: string;
  live_access_key: string;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };
  return (
    <div>
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <div className="flex items-center gap-2 bg-muted/60 border border-border/40 rounded-xl px-3 py-2">
        <code className="flex-1 min-w-0 truncate text-foreground text-sm font-mono">{value}</code>
        <button
          onClick={copy}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function CredentialsModal({ creds, onClose }: { creds: IssuedCredentials; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <KeyRound className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-foreground font-semibold">Merchant Access Granted</h2>
              <p className="text-muted-foreground text-xs">{creds.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-300 text-xs leading-relaxed">
            These credentials are shown only once and are not stored in plaintext. Copy and share them with the
            merchant securely now.
          </p>
        </div>

        <div className="space-y-3">
          <CopyField label="Dashboard Login Password" value={creds.password} />
          <CopyField label="SwiftPay Access Key — TEST" value={creds.test_access_key} />
          <CopyField label="SwiftPay Access Key — LIVE" value={creds.live_access_key} />
        </div>

        <button
          onClick={onClose}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export default function KybRegistrationsPage() {
  const [registrations, setRegistrations] = useState<KybRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending_review');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectMode, setRejectMode] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const netbankDefaults = {
    bank_name: 'Netbank',
    bank_account_number: '041-105-00037-6',
    bank_account_name: 'Swift Technology Ventures Inc.',
    bank_address: '',
  };
  const [approvalForm, setApprovalForm] = useState({
    vip_gold: false,
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    bank_address: '',
    usdt_wallet_address: '',
    settlement_type: 'Bank Transfer',
    settlement_currency: 'PHP',
  });
  const [issuedCredentials, setIssuedCredentials] = useState<IssuedCredentials | null>(null);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = filter ? `/api/v1/kyb?status=${filter}` : '/api/v1/kyb';
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setRegistrations(d.items || []);
      } else {
        setError('Failed to load KYB registrations. Please try again.');
      }
    } catch (e) {
      console.error(e);
      setError('Network error while loading KYB registrations.');
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchRegistrations();
    const id = setInterval(fetchRegistrations, 30000);
    return () => clearInterval(id);
  }, [fetchRegistrations]);

  useEffect(() => {
    // Handle hash-based navigation to auto-expand a registration
    const hash = window.location.hash.slice(1);
    if (hash) {
      const registrationId = parseInt(hash, 10);
      if (!isNaN(registrationId)) {
        setExpandedId(registrationId);
      }
    }
  }, []);

  if (loading) return (
    <Layout>
      <LoadingSkeleton variant="page" />
    </Layout>
  );

  const doAction = async (id: number, action: 'approve' | 'reject') => {
    setActionLoading(id);
    setError('');
    setSuccessMessage('');
    try {
      const body = action === 'approve'
        ? {
            note: '',
          vip_gold: approvalForm.vip_gold,
            bank_name: approvalForm.bank_name,
            bank_account_number: approvalForm.bank_account_number,
            bank_account_name: approvalForm.bank_account_name,
            bank_address: approvalForm.bank_address,
            usdt_wallet_address: approvalForm.usdt_wallet_address,
            settlement_type: approvalForm.settlement_type,
            settlement_currency: approvalForm.settlement_currency,
          }
        : { reason: rejectReason || 'Rejected by admin.' };
      const res = await fetch(`/api/v1/kyb/${id}/${action}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const d = await res.json();
        const successText = action === 'approve'
          ? 'KYB registration approved successfully.'
          : 'KYB registration rejected successfully.';
        setSuccessMessage(successText);
        if (action === 'approve' && d.credentials) {
          setIssuedCredentials(d.credentials);
        }
        setRejectReason('');
        setActiveId(null);
        setRejectMode(false);
        fetchRegistrations();
      } else {
        const d = await res.json();
        setError(d.detail || `Failed to ${action}`);
      }
    } catch (e: any) { setError(e.message); }
    setActionLoading(null);
  };

  const pending_count = registrations.filter(r => r.status === 'pending_review').length;
  const filters = [
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'in_progress', label: 'In Progress' },
    { value: '', label: 'All' },
  ];

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2 flex-wrap">
              KYB Registrations
              {pending_count > 0 && (
                <span className="bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">{pending_count}</span>
              )}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Review and approve Know Your Business registration applications</p>
          </div>
          <button
            onClick={fetchRegistrations}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm border border-border px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="overflow-x-auto [overflow-scrolling:touch]">
          <div className="flex gap-2 min-w-max">
            {filters.map(({ value, label }) => (
              <button
                key={value || 'all'}
                onClick={() => setFilter(value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === value ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">{error}</p>
        )}

        {successMessage && (
          <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-4 py-3">{successMessage}</p>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-background border border-border/40 rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-muted/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 bg-muted/50 rounded" />
                    <div className="h-3 w-56 bg-muted/30 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : registrations.length === 0 ? (
          <div className="bg-background border border-border/40 rounded-2xl p-12 flex flex-col items-center text-center">
            <div className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center mb-3">
              <ClipboardList className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">
              No {(filters.find(f => f.value === filter)?.label ?? filter).toLowerCase()} registrations
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {registrations.map(reg => {
              const sc = statusConfig[reg.status] || statusConfig.pending_review;
              const isActive = activeId === reg.id;
              const isExpanded = expandedId === reg.id;

              return (
                <div key={reg.id} className="bg-background border border-border/40 rounded-2xl overflow-hidden">
                  <div className="p-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <ClipboardList className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-foreground font-semibold break-words">
                            {reg.full_name || (reg.telegram_username ? `@${reg.telegram_username}` : reg.chat_id)}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${sc.color}`}>
                            {sc.icon} {reg.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm mt-0.5 break-words">
                          {reg.telegram_username ? `@${reg.telegram_username}` : `ID: ${reg.chat_id}`}
                          {' · '}Application #{reg.id}
                          {' · '}{fmt_time(reg.created_at)}
                        </p>
                        {reg.rejection_reason && (
                          <p className="text-red-400 text-xs mt-1 break-words">Rejection reason: {reg.rejection_reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0 border-t border-border/30 pt-3 md:flex-row md:items-center md:border-t-0 md:pt-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : reg.id)}
                        className="flex min-h-[44px] w-full items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-slate-400 md:min-h-[36px] md:w-auto md:py-1.5"
                      >
                        Details {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                      {reg.status === 'pending_review' && (
                        <button
                          onClick={() => {
                            setActiveId(isActive ? null : reg.id);
                            setRejectMode(false);
                            setRejectReason('');
                            setError('');
                            setSuccessMessage('');
                            if (!isActive) {
                              setApprovalForm({
                                vip_gold: false,
                                bank_name: reg.bank_name || netbankDefaults.bank_name,
                                bank_account_number: reg.bank_account_number || netbankDefaults.bank_account_number,
                                bank_account_name: reg.bank_account_name || netbankDefaults.bank_account_name,
                                bank_address: reg.bank_address || netbankDefaults.bank_address,
                                usdt_wallet_address: reg.usdt_wallet_address || '',
                                settlement_type: reg.settlement_type || 'Bank Transfer',
                                settlement_currency: reg.settlement_currency || 'PHP',
                              });
                            }
                          }}
                          className="min-h-[44px] w-full rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-slate-400 md:min-h-[36px] md:w-auto md:py-1.5"
                        >
                          {isActive ? 'Cancel' : 'Review'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* KYB Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border/40 pt-4 md:px-6">
                      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">Full Name</p>
                          <p className="text-foreground">{reg.full_name || '—'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">Email</p>
                          <p className="text-foreground">{reg.email || '—'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">Phone</p>
                          <p className="text-foreground">{reg.phone || '—'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">Address</p>
                          <p className="text-foreground">{reg.address || '—'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">
                            {reg.chat_id?.startsWith('web-') ? 'Business Name' : 'Bank Name'}
                          </p>
                          <p className="text-foreground">{reg.bank_name || '—'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">Telegram Chat ID</p>
                          <p className="text-foreground font-mono text-xs">{reg.chat_id}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">ID Photo</p>
                          <p className={`text-xs font-medium ${reg.id_photo_file_id ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {reg.id_photo_file_id ? '📎 Uploaded' : '⚠️ Not uploaded'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action panel */}
                  {isActive && reg.status === 'pending_review' && (
                    <div className="mx-auto w-full max-w-4xl border-t border-border/40 px-4 pb-5 pt-4 md:px-6">
                      {rejectMode ? (
                        <>
                          <p className="text-muted-foreground text-xs mb-2">Rejection reason:</p>
                          <input
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="e.g. Invalid ID photo, incomplete information"
                            className="w-full bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 mb-3"
                          />
                          <div className="flex flex-col gap-2 md:flex-row">
                            <button
                              onClick={() => setRejectMode(false)}
                              className="min-h-[44px] flex-1 rounded-xl border border-border py-2 text-sm text-muted-foreground transition-colors hover:border-slate-400"
                            >
                              Back
                            </button>
                            <button
                              onClick={() => doAction(reg.id, 'reject')}
                              disabled={actionLoading === reg.id}
                              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600/80 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                            >
                              {actionLoading === reg.id ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <XCircle className="h-4 w-4" />}
                              Confirm Reject
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                            <label className="flex cursor-pointer items-center gap-2 md:col-span-2">
                              <input
                                type="checkbox"
                                checked={approvalForm.vip_gold}
                                onChange={(e) => setApprovalForm((prev) => ({ ...prev, vip_gold: e.target.checked }))}
                                className="h-4 w-4 rounded border-border bg-muted accent-amber-500"
                              />
                              <span className="text-foreground text-sm font-medium">VIP Gold</span>
                            </label>
                            <label className="space-y-1">
                              <span className="text-muted-foreground text-xs">Bank Name</span>
                              <input
                                value={approvalForm.bank_name}
                                onChange={(e) => setApprovalForm((prev) => ({ ...prev, bank_name: e.target.value }))}
                                className="w-full bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
                                placeholder="BDO, GCash, Maya, etc."
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="text-muted-foreground text-xs">Account Number</span>
                              <input
                                value={approvalForm.bank_account_number}
                                onChange={(e) => setApprovalForm((prev) => ({ ...prev, bank_account_number: e.target.value }))}
                                className="w-full bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
                                placeholder="001234567890"
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="text-muted-foreground text-xs">Account Holder Name</span>
                              <input
                                value={approvalForm.bank_account_name}
                                onChange={(e) => setApprovalForm((prev) => ({ ...prev, bank_account_name: e.target.value }))}
                                className="w-full bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
                                placeholder="Juan dela Cruz"
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="text-muted-foreground text-xs">Settlement Currency</span>
                              <select
                                value={approvalForm.settlement_currency}
                                onChange={(e) => setApprovalForm((prev) => ({ ...prev, settlement_currency: e.target.value }))}
                                className="w-full bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-blue-500/50"
                              >
                                <option value="PHP">PHP</option>
                                <option value="USDT">USDT</option>
                              </select>
                            </label>
                            <label className="space-y-1 md:col-span-2">
                              <span className="text-muted-foreground text-xs">USDT Wallet Address</span>
                              <input
                                value={approvalForm.usdt_wallet_address}
                                onChange={(e) => setApprovalForm((prev) => ({ ...prev, usdt_wallet_address: e.target.value }))}
                                className="w-full bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
                                placeholder="T..."
                              />
                            </label>
                            <label className="space-y-1 md:col-span-2">
                              <span className="text-muted-foreground text-xs">Settlement Type / Notes</span>
                              <input
                                value={approvalForm.settlement_type}
                                onChange={(e) => setApprovalForm((prev) => ({ ...prev, settlement_type: e.target.value }))}
                                className="w-full bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
                                placeholder="Bank Transfer"
                              />
                            </label>
                            <label className="space-y-1 sm:col-span-2">
                              <span className="text-muted-foreground text-xs">Bank Address</span>
                              <input
                                value={approvalForm.bank_address}
                                onChange={(e) => setApprovalForm((prev) => ({ ...prev, bank_address: e.target.value }))}
                                className="w-full bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
                                placeholder="Bank branch / e-wallet notes"
                              />
                            </label>
                          </div>
                          <div className="flex flex-col gap-2 pt-1 md:flex-row">
                            <button
                              onClick={() => doAction(reg.id, 'approve')}
                              disabled={actionLoading === reg.id}
                              title="Approve registration and grant dashboard access"
                              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                            >
                              {actionLoading === reg.id ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectMode(true)}
                              disabled={actionLoading === reg.id}
                              title="Reject registration"
                              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600/80 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" /> Reject
                            </button>
                          </div>
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
      {issuedCredentials && (
        <CredentialsModal creds={issuedCredentials} onClose={() => setIssuedCredentials(null)} />
      )}
    </Layout>
  );
}
