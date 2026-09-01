import { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import { getStoredToken } from '@/lib/auth';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import { CheckCircle, XCircle, Clock, Eye, RefreshCw, Building2, DollarSign } from 'lucide-react';
import LoadingSkeleton from '@/design-system/components/LoadingSkeleton';
import { toast } from 'sonner';

interface WithdrawalRequest {
  id: number;
  user_id: string;
  amount: number;
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
}

const getStatusConfig = (isKrwFlow: boolean): Record<string, { color: string; dot: string; icon: React.ReactNode }> => ({
  pending:     { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',       dot: 'bg-amber-400',   icon: <Clock className="h-3.5 w-3.5" /> },
  transfering: { color: 'bg-violet-500/20 text-violet-400 border-violet-500/30',     dot: 'bg-violet-400', icon: <RefreshCw className="h-3.5 w-3.5" /> },
  transferring:{ color: 'bg-violet-500/20 text-violet-400 border-violet-500/30',     dot: 'bg-violet-400', icon: <RefreshCw className="h-3.5 w-3.5" /> },
  completed:   { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  cancelled:   { color: 'bg-red-500/20 text-red-400 border-red-500/30',             dot: 'bg-red-400',     icon: <XCircle className="h-3.5 w-3.5" /> },
  failed:      { color: 'bg-red-500/20 text-red-400 border-red-500/30',             dot: 'bg-red-400',     icon: <XCircle className="h-3.5 w-3.5" /> },
});

const fmt_time = (s: string | null) => s ? new Date(s).toLocaleString() : '—';
const fmt_amount = (amt: number, cur: string) => 
  cur === 'USDT' ? `$${amt.toFixed(2)}` : `₱${amt.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

export default function WithdrawalRequestsPage() {
  const { collectionCurrency } = useCollectionCurrency();
  const isKrwFlow = collectionCurrency === 'KRW';
  const statusConfig = getStatusConfig(isKrwFlow);
  const uiText = {
    heading: isKrwFlow ? '출금 요청' : 'Withdrawal Requests',
    description: isKrwFlow ? '사용자 출금 요청을 검토하고 승인하세요 (PHP 은행 및 USDT)' : 'Review and approve user withdrawal requests (PHP bank and USDT)',
    refresh: isKrwFlow ? '새로 고침' : 'Refresh',
    review: isKrwFlow ? '검토' : 'Review',
    cancel: isKrwFlow ? '취소' : 'Cancel',
    empty: isKrwFlow ? '출금 요청이 없습니다' : 'No withdrawal requests',
    requestPrefix: isKrwFlow ? '출금 요청 #' : 'Request #',
  } as const;
  const filterLabels: Record<string, string> = {
    pending: isKrwFlow ? '대기 중' : 'Pending',
    transfering: isKrwFlow ? '이체 진행 중' : 'Transfering',
    transferring: isKrwFlow ? '이체 진행 중' : 'Transferring',
    completed: isKrwFlow ? '완료됨' : 'Completed',
    cancelled: isKrwFlow ? '취소됨' : 'Cancelled',
    failed: isKrwFlow ? '실패' : 'Failed',
    '': isKrwFlow ? '전체' : 'All',
  };
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState('');

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
      setError('Failed to load withdrawal requests');
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

  const pending_count = requests.filter(r => r.status === 'pending').length;

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
        ...(action === 'cancel' && { body: JSON.stringify({ reason: note || 'Rejected by admin' }) }),
      });
      
      if (res.ok) {
        setNote('');
        setActiveId(null);
        toast.success(action === 'approve'
          ? (isKrwFlow ? '출금이 처리되어 이체되었습니다.' : 'Withdrawal processed successfully')
          : (isKrwFlow ? '출금이 거절되었습니다.' : 'Withdrawal rejected'));
        fetchRequests();
      } else {
        const d = await res.json();
        setError(d.detail || `Failed to ${action} withdrawal`);
        toast.error(d.detail || `Failed to ${action} withdrawal`);
      }
    } catch (e: any) { 
      setError(e.message);
      toast.error('Network error');
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
          <button onClick={fetchRequests}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm border border-border px-3 py-1.5 rounded-lg transition-colors shrink-0">
            <RefreshCw className="h-3.5 w-3.5" /> {uiText.refresh}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="overflow-x-auto [overflow-scrolling:touch]">
          <div className="flex gap-2 min-w-max">
            {['pending', 'transfering', 'completed', 'cancelled', 'failed', ''].map((s) => (
              <button key={s || 'all'} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === s ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground hover:text-white'
                }`}>
                {filterLabels[s || ''] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : (isKrwFlow ? '전체' : 'All'))}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">{error}</p>}

        {requests.length === 0 ? (
          <div className="bg-background border border-border/40 rounded-2xl p-12 flex flex-col items-center text-center">
            <div className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center mb-3">
              <DollarSign className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">{uiText.empty}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => {
              const sc = statusConfig[req.status] || statusConfig.pending;
              const isActive = activeId === req.id;
              const isPHP = req.currency === 'PHP' || !!req.bank_code;
              const icon = isPHP ? '🏦' : '💎';
              
              return (
                <div key={req.id} className="bg-background border border-border/40 rounded-2xl overflow-hidden">
                  <div className="p-4 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-xl">
                      {icon}
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
                        <span className="text-blue-400 font-semibold">{fmt_amount(req.amount, req.currency)}</span>
                        {isPHP ? (
                          <>
                            {' via '}
                            <span className="text-foreground font-semibold">{req.bank_code || 'Bank'}</span>
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
                      {req.description && <p className="text-muted-foreground text-xs mt-1">Note: {req.description}</p>}
                    </div>
                    {req.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setActiveId(isActive ? null : req.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-slate-400 transition-colors">
                          {isActive ? uiText.cancel : uiText.review}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action panel */}
                  {isActive && req.status === 'pending' && (
                    <div className="px-4 pb-4 border-t border-border/40 pt-3">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 mb-3 text-xs text-blue-300">
                        ✅ Approving will process <strong>{fmt_amount(req.amount, req.currency)} {req.currency}</strong> to the user
                      </div>
                      <p className="text-muted-foreground text-xs mb-2">Add a note (optional):</p>
                      <input
                        value={note} onChange={e => setNote(e.target.value)}
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
