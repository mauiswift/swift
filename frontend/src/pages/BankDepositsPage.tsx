import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { client } from '@/lib/api';
import { CheckCircle, XCircle, Clock, Eye, RefreshCw, Building2, Search } from 'lucide-react';
import LoadingSkeleton from '@/design-system/components/LoadingSkeleton';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import { fmtCurrency } from '@/lib/format';
import { useLanguage } from '@/contexts/LanguageContext';

interface BankDepositRequest {
  id: number;
  chat_id: string;
  telegram_username: string | null;
  user_name?: string | null;
  channel: string;
  account_number: string;
  amount_php: number;
  currency: string;
  receipt_file_id: string | null;
  status: string;
  note: string | null;
  approved_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const statusConfig: Record<string, { color: string; dot: string; icon: React.ReactNode }> = {
  pending:  { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',       dot: 'bg-amber-400',   icon: <Clock className="h-3.5 w-3.5" /> },
  approved: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30',             dot: 'bg-red-400',     icon: <XCircle className="h-3.5 w-3.5" /> },
};

const fmt_time = (s: string | null) => s ? new Date(s).toLocaleString() : '—';

export default function BankDepositsPage() {
  const { language } = useLanguage();
  const tx = (en: string, ko: string, zh?: string) => (language === 'zh' ? (zh ?? en) : language === 'en' ? en : ko);
  const [requests, setRequests] = useState<BankDepositRequest[]>([]);
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
      const url = filter ? `/api/v1/bank-deposits?status=${filter}` : '/api/v1/bank-deposits';
      const { data, ok } = await client.get(url);
      if (ok) { setRequests(data?.items || []); }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchRequests();
    const id = setInterval(fetchRequests, 30000);
    return () => clearInterval(id);
  }, [fetchRequests]);

  if (loading) return (
    <Layout>
      <LoadingSkeleton variant="page" />
    </Layout>
  );

  const doAction = async (id: number, action: 'approve' | 'reject') => {
    setActionLoading(id); setError('');
    try {
      const { data, ok } = await client.request(`/api/v1/bank-deposits/${id}/${action}`, 'POST', {
        note: notes[id] || (action === 'approve' ? 'Approved' : 'Rejected by admin'),
      });
      if (ok) {
        if (action === 'approve') {
          toast.success(data?.message || 'Deposit approved and credited to the user wallet');
        } else {
          toast.success('Deposit rejected successfully');
        }
        setNotes(prev => { const n = { ...prev }; delete n[id]; return n; }); setActiveId(null);
        fetchRequests();
      } else {
        setError(data?.detail || `Failed to ${action}`);
      }
    } catch (e: any) { setError(e.message); }
    setActionLoading(null);
  };

  const openReceiptFile = async (fileId: string) => {
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      setError('Popup blocked. Please allow popups and try again.');
      return;
    }

    newWindow.document.write('<p style="font-family: sans-serif; padding: 1rem;">Loading receipt...</p>');
    try {
      const res = await client.fetch(`/api/v1/telegram/file/${encodeURIComponent(fileId)}`);
      if (!res.ok) {
        throw new Error(`Failed to load receipt (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      newWindow.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err: any) {
      newWindow.close();
      setError(err?.message || 'Unable to open receipt.');
    }
  };

  const pending_count = requests.filter(r => r.status === 'pending').length;
  const visibleRequests = requests.filter(req => {
    const query = search.trim().toLowerCase();
    return !query || [req.user_name, req.telegram_username, req.chat_id, req.account_number, req.channel, String(req.id)]
      .some(value => value?.toLowerCase().includes(query));
  });
  const toggleSelected = (id: number) => setSelectedIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  const runBulk = async (action: 'approve' | 'reject') => {
    for (const id of selectedIds) await doAction(id, action);
    setSelectedIds([]);
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2 flex-wrap">
              {tx('Bank Deposit Requests', '은행 입금 요청')}
              {pending_count > 0 && (
                <span className="bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">{pending_count}</span>
              )}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">{tx('Review bank and e-wallet deposits waiting for confirmation', '확인을 기다리는 은행 및 전자지갑 입금을 검토하세요')}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tx('Search user, account, channel, or request ID', '사용자, 계좌, 채널 또는 요청 ID 검색')} className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-blue-500" />
            </div>
            {selectedIds.length > 0 && filter === 'pending' && <div className="flex gap-2"><button type="button" onClick={() => runBulk('approve')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">{tx('Approve', '승인')} {selectedIds.length}</button><button type="button" onClick={() => runBulk('reject')} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white">{tx('Reject', '거부')} {selectedIds.length}</button></div>}
          </div>
          <button onClick={fetchRequests}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm border border-border px-3 py-1.5 rounded-lg transition-colors shrink-0">
            <RefreshCw className="h-3.5 w-3.5" /> {tx('Refresh', '새로고침')}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="overflow-x-auto [overflow-scrolling:touch]">
          <div className="flex gap-2 min-w-max">
            {['pending', 'approved', 'rejected', ''].map((s) => (
              <button key={s || 'all'} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === s ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground hover:text-white'
                }`}>
                {s ? (language === 'ko' ? ({ pending: '대기 중', approved: '승인됨', rejected: '거부됨' } as Record<string, string>)[s] : s.charAt(0).toUpperCase() + s.slice(1)) : tx('All', '전체')}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">{error}</p>}

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-background border border-border/40 rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-muted/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-muted/50 rounded" />
                    <div className="h-3 w-48 bg-muted/30 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : visibleRequests.length === 0 ? (
          <div className="bg-background border border-border/40 rounded-2xl p-12 flex flex-col items-center text-center">
            <div className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center mb-3">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">{filter ? tx(`No ${filter} requests`, `${filter === 'pending' ? '대기 중인' : filter === 'approved' ? '승인된' : '거부된'} 입금 요청이 없습니다`) : tx('No bank deposit requests', '은행 입금 요청이 없습니다')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleRequests.map(req => {
              const sc = statusConfig[req.status] || statusConfig.pending;
              const isActive = activeId === req.id;
              const depositCurrency = req.currency || 'PHP';
              const amountFormatted = fmtCurrency(req.amount_php, depositCurrency);
              return (
                <div key={req.id} className="bg-background border border-border/40 rounded-2xl overflow-hidden">
                  <div className="p-4 flex items-start gap-4">
                    {req.status === 'pending' && <input type="checkbox" checked={selectedIds.includes(req.id)} onChange={() => toggleSelected(req.id)} className="mt-3 h-4 w-4 rounded border-border" aria-label={`Select request ${req.id}`} />}
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <PaymentBrandLogo brand={req.channel} size="sm" className="border-0 bg-transparent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-foreground font-semibold">
                          {req.user_name || (req.telegram_username ? `@${req.telegram_username}` : req.chat_id)}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${sc.color}`}>
                          {sc.icon} {req.status}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm mt-0.5">
                        <span className="text-blue-400 font-semibold">{amountFormatted}</span>
                        {' via '}
                        <span className="text-foreground font-semibold">{req.channel}</span>
                        {' · '}
                        <span className="text-muted-foreground font-mono text-xs">{req.account_number}</span>
                        {' · '}Request #{req.id}
                        {' · '}{fmt_time(req.created_at)}
                      </p>
                      {req.note && <p className="text-muted-foreground text-xs mt-1">Note: {req.note}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs ${req.receipt_file_id ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {req.receipt_file_id ? '📎 Receipt uploaded' : '⚠️ No receipt yet'}
                        </span>
                        {req.receipt_file_id && (
                          <button type="button" onClick={() => openReceiptFile(req.receipt_file_id!)}
                            className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors">
                            <Eye className="h-3 w-3" /> View
                          </button>
                        )}
                      </div>
                    </div>
                    {req.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setActiveId(isActive ? null : req.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-slate-400 transition-colors">
                          {isActive ? tx('Cancel', '취소') : tx('Review', '검토')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action panel */}
                  {isActive && req.status === 'pending' && (
                    <div className="px-4 pb-4 border-t border-border/40 pt-3">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 mb-3 text-xs text-blue-300">
                        ✅ {tx('Approving will credit', '승인하면')} <strong>{amountFormatted}</strong> {tx("to the user's wallet", '이용자 지갑에 충전됩니다')}
                      </div>
                      <p className="text-muted-foreground text-xs mb-2">{tx('Add a note (optional):', '메모 추가(선택 사항):')}</p>
                      <input
                        value={notes[req.id] || ''} onChange={e => setNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                        placeholder="e.g. Receipt verified, transfer confirmed"
                        className="w-full bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 mb-3"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => doAction(req.id, 'approve')}
                          disabled={actionLoading === req.id}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2 rounded-xl transition-colors text-sm">
                          {actionLoading === req.id ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          Approve & Credit {amountFormatted}
                        </button>
                        <button onClick={() => doAction(req.id, 'reject')}
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
