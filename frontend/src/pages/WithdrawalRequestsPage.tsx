import { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import { getStoredToken } from '@/lib/auth';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import { CheckCircle, XCircle, Clock, Eye, RefreshCw, Building2, DollarSign, Search } from 'lucide-react';
import LoadingSkeleton from '@/design-system/components/LoadingSkeleton';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { fmtCurrency } from '@/lib/format';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import { useLanguage } from '@/contexts/LanguageContext';

interface WithdrawalRequest {
  id: number;
  user_id: string;
  amount: number;
  processing_fee?: number;
  total_debit?: number;
  currency: string;
  status: string;
  bank_code?: string;
  account_number?: string;
  account_name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  usdt_address?: string;
  usdt_platform?: string;
  failure_reason?: string;
}

const getStatusConfig = (isKrwFlow: boolean): Record<string, { color: string; dot: string; icon: React.ReactNode }> => ({
  pending:     { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',       dot: 'bg-amber-400',   icon: <Clock className="h-3.5 w-3.5" /> },
  transferring: { color: 'bg-violet-500/20 text-violet-400 border-violet-500/30',     dot: 'bg-violet-400', icon: <RefreshCw className="h-3.5 w-3.5" /> },
  processing:  { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',         dot: 'bg-blue-400',   icon: <RefreshCw className="h-3.5 w-3.5" /> },
  completed:   { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  cancelled:   { color: 'bg-red-500/20 text-red-400 border-red-500/30',             dot: 'bg-red-400',     icon: <XCircle className="h-3.5 w-3.5" /> },
  failed:      { color: 'bg-red-500/20 text-red-400 border-red-500/30',             dot: 'bg-red-400',     icon: <XCircle className="h-3.5 w-3.5" /> },
});

const fmt_time = (s?: string | null) => s ? new Date(s).toLocaleString() : '—';
const normalizeCurrency = (currency: string) => currency.toUpperCase() === 'USD' ? 'USDT' : currency;
const fmt_amount = (amt: number, cur: string) => fmtCurrency(amt, normalizeCurrency(cur));

export default function WithdrawalRequestsPage() {
  const { collectionCurrency } = useCollectionCurrency();
  const { language } = useLanguage();
  const { isSuperAdmin } = useAuth();
  const isKrwFlow = collectionCurrency === 'KRW' && !isSuperAdmin;
  const isKorean = language === 'ko';
  const tx = (en: string, ko: string) => (isKorean ? ko : en);
  const statusConfig = getStatusConfig(isKrwFlow);
  const uiText = {
    heading: tx('Withdrawal Requests', '출금 요청'),
    description: tx('Review and approve user withdrawal requests (PHP, KRW and USDT).', 'KRW 출금 요청을 검토하고 승인하세요.'),
    refresh: tx('Refresh', '새로 고침'),
    review: tx('Review', '검토'),
    cancel: tx('Cancel', '취소'),
    empty: tx('No withdrawal requests', '출금 요청이 없습니다'),
    requestPrefix: tx('Request #', '출금 요청 #'),
  } as const;
  const filterLabels: Record<string, string> = {
    pending: tx('Pending', '대기 중'),
    transferring: tx('Transferring', '이체 진행 중'),
    processing: tx('Processing', '처리 중'),
    completed: tx('Completed', '완료됨'),
    cancelled: tx('Cancelled', '취소됨'),
    failed: tx('Failed', '실패'),
    '': tx('All', '전체'),
  };
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter && filter !== 'all' 
        ? `/api/v1/wallet/admin/withdrawals?status=${filter}` 
        : `/api/v1/wallet/admin/withdrawals`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) { 
        const d = await res.json(); 
        setRequests(d.items || []); 
      }
    } catch (e) { 
      console.error(e); 
      setError(isKrwFlow ? '출금 요청을 불러오지 못했습니다.' : 'Failed to load withdrawal requests');
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchRequests();
    const id = setInterval(fetchRequests, 30000);
    return () => clearInterval(id);
  }, [fetchRequests]);

  if (loading && !requests.length) return (
    <Layout>
      <LoadingSkeleton variant="page" />
    </Layout>
  );

  const pending_count = requests.filter(r => ['pending', 'processing', 'transferring'].includes(r.status)).length;
  const visibleRequests = requests.filter(req => {
    const query = search.trim().toLowerCase();
    return !query || [req.user_id, req.account_number, req.account_name, req.bank_code, req.usdt_address, String(req.id)]
      .some(value => value?.toLowerCase().includes(query));
  });
  const toggleSelected = (id: number) => setSelectedIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  const runBulk = async (action: 'approve' | 'cancel') => {
    for (const id of selectedIds) await doAction(id, action);
    setSelectedIds([]);
  };

  const reconcileWithdrawal = async (id: number) => {
    setActionLoading(id);
    setError('');
    try {
      const res = await fetch(`/api/v1/wallet/admin/withdrawals/${id}/reconcile`, {
        method: 'POST',
        credentials: 'include',
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = result.detail || 'Failed to refresh SwiftPay withdrawal status';
        setError(message);
        toast.error(message);
        return;
      }
      toast.success(result.message || 'SwiftPay withdrawal status refreshed');
      await fetchRequests();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Network error. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const doAction = async (id: number, action: 'approve' | 'cancel') => {
    setActionLoading(id);
    setError('');
    try {
      const endpoint = action === 'approve'
        ? `/api/v1/wallet/admin/withdrawals/${id}/approve`
        : `/api/v1/wallet/admin/withdrawals/${id}/reject`;

      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...(action === 'cancel' && { body: JSON.stringify({ reason: notes[id] || 'Rejected by admin' }) }),
      });

      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        setNotes(prev => { const n = { ...prev }; delete n[id]; return n; });
        setActiveId(null);
        toast.success(action === 'approve'
          ? (result.message || (isKrwFlow ? '출금이 처리되어 이체되었습니다.' : 'Withdrawal processed successfully'))
          : (result.message || (isKrwFlow ? '출금이 거절되었습니다.' : 'Withdrawal rejected')));
        fetchRequests();
      } else {
        const message = result.detail || (isKrwFlow
          ? `출금 ${action === 'approve' ? '승인' : '거절'}에 실패했습니다.`
          : `Failed to ${action} withdrawal`);
        setError(message);
        toast.error(message);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : (isKrwFlow ? '네트워크 오류가 발생했습니다. 다시 시도해주세요.' : 'Network error. Please try again.');
      setError(message);
      toast.error(message);
    }
    setActionLoading(null);
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2 flex-wrap">
              {uiText.heading}
              {pending_count > 0 && (
                <span className="bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">{pending_count}</span>
              )}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">{uiText.description}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tx('Search user, bank, account, address, or request ID', '사용자, 은행, 계좌, 주소 또는 요청 ID 검색')} className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-blue-500" />
            </div>
            {selectedIds.length > 0 && ['pending', 'processing'].includes(filter) && <div className="flex gap-2"><button type="button" onClick={() => runBulk('approve')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">{tx('Approve', '승인')} {selectedIds.length}</button><button type="button" onClick={() => runBulk('cancel')} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white">{tx('Reject', '거절')} {selectedIds.length}</button></div>}
          </div>
          <button onClick={fetchRequests}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm border border-border px-3 py-1.5 rounded-lg transition-colors shrink-0">
            <RefreshCw className="h-3.5 w-3.5" /> {uiText.refresh}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="overflow-x-auto [overflow-scrolling:touch]">
          <div className="flex gap-2 min-w-max">
            {['pending', 'processing', 'completed', 'cancelled', 'failed', ''].map((s) => (
              <button key={s || 'all'} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === s ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground hover:text-white'
                }`}>
                {filterLabels[s || ''] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : tx('All', '전체'))}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">{error}</p>}

        {visibleRequests.length === 0 ? (
          <div className="bg-background border border-border/40 rounded-2xl p-12 flex flex-col items-center text-center">
            <div className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center mb-3">
              <DollarSign className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">{uiText.empty}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleRequests.map(req => {
              const sc = statusConfig[req.status] || statusConfig.pending;
              const isActive = activeId === req.id;
              const currency = normalizeCurrency(req.currency || 'PHP');
              const isPHP = currency !== 'USDT' || !!req.bank_code;
              const brand = isPHP ? (req.bank_code || 'Bank transfer') : 'USDT';
              
              return (
                <div key={req.id} className="bg-background border border-border/40 rounded-2xl overflow-hidden">
                  <div className="p-4 flex items-start gap-4">
                    {['pending', 'processing'].includes(req.status) && <input type="checkbox" checked={selectedIds.includes(req.id)} onChange={() => toggleSelected(req.id)} className="mt-3 h-4 w-4 rounded border-border" aria-label={`Select request ${req.id}`} />}
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <PaymentBrandLogo brand={brand} size="sm" className="h-9 w-9 border-0 bg-transparent p-0 shadow-none" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-foreground font-semibold">
                          {req.user_id}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${sc.color}`}>
                          {sc.icon} {req.status}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm mt-0.5">
                        <span className="text-blue-400 font-semibold">{fmt_amount(req.amount, currency)}</span>
                        {Boolean(req.processing_fee) && (
                          <span className="text-muted-foreground text-xs">
                            {' + fee '}{fmt_amount(req.processing_fee || 0, req.currency)}
                          </span>
                        )}
                        {isPHP ? (
                          <>
                            {' via '}
                            <span className="text-foreground font-semibold">{req.bank_code || 'Bank Transfer'}</span>
                            {' · '}
                            <span className="text-muted-foreground font-mono text-xs">{req.account_number}</span>
                            {' · '}
                            <span className="text-foreground font-semibold">{req.account_name}</span>
                          </>
                        ) : (
                          <>
                            {' to '}
                            <span className="text-foreground font-semibold">{req.usdt_platform}</span>
                            {' · '}
                            <span className="text-muted-foreground font-mono text-xs">{req.usdt_address?.slice(0, 20)}...</span>
                          </>
                        )}
                        {' · '}{uiText.requestPrefix}{req.id}
                        {' · '}{fmt_time(req.created_at)}
                      </p>
                      {(req.description || req.failure_reason) && (
                        <p className="text-muted-foreground text-xs mt-1">
                          {req.failure_reason ? `Reason: ${req.failure_reason}` : `Note: ${req.description}`}
                        </p>
                      )}
                    </div>
                    {req.status === 'transferring' && currency === 'PHP' && (
                      <button
                        onClick={() => reconcileWithdrawal(req.id)}
                        disabled={actionLoading === req.id}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-blue-500/40 text-blue-300 hover:border-blue-400 disabled:opacity-50 transition-colors shrink-0"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${actionLoading === req.id ? 'animate-spin' : ''}`} />
                        Refresh status
                      </button>
                    )}
                    {['pending', 'processing'].includes(req.status) && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setActiveId(isActive ? null : req.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-slate-400 transition-colors">
                          {isActive ? uiText.cancel : uiText.review}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action panel */}
                  {isActive && ['pending', 'processing'].includes(req.status) && (
                    <div className="px-4 pb-4 border-t border-border/40 pt-3">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 mb-3 text-xs text-blue-300">
                        ✅ Approving will process <strong>{fmt_amount(req.amount, req.currency)} {req.currency}</strong> to the user
                      </div>
                      <p className="text-muted-foreground text-xs mb-2">Add a note (optional):</p>
                      <input
                        value={notes[req.id] || ''} onChange={e => setNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                        placeholder="e.g., Processing initiated, expected completion in 1-2 business days"
                        className="w-full bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 mb-3"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => doAction(req.id, 'approve')}
                          disabled={actionLoading === req.id}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2 rounded-xl transition-colors text-sm">
                          {actionLoading === req.id ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          Approve & Process
                        </button>
                        <button onClick={() => doAction(req.id, 'cancel')}
                          disabled={actionLoading === req.id}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2 rounded-xl transition-colors text-sm">
                          <XCircle className="h-4 w-4" /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
