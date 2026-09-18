import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentEvents } from '@/hooks/usePaymentEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Search,
  ExternalLink,
  Copy,
  Bot,
  BarChart3,
  Plus,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  CopyPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import SiteContainer from '@/components/SiteContainer';
import LoadingSpinner from '@/components/LoadingSpinner';
import LoadingSkeleton from '@/design-system/components/LoadingSkeleton';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import { fmtCurrency } from '@/lib/format';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTransactionStatus } from '@/lib/transactions';
import { StatusBadge, type StatusType } from '@/components/StatusBadge';

interface Transaction {
  id: number;
  transaction_type: string;
  external_id: string;
  xendit_id: string;
  amount: number;
  currency: string;
  status: string;
  approval_status?: string;
  rejection_reason?: string;
  approved_by?: string;
  description: string;
  customer_name: string;
  customer_email: string;
  payment_url: string;
  qr_code_url: string;
  telegram_chat_id: string;
  created_at: string;
  updated_at: string;
}

const typeLabels: Record<string, string> = {
  invoice: 'Invoice',
  qr_code: 'QR Code',
  payment_link: 'Payment Link',
  bank_deposit: 'Bank Deposit',
  qrph_payment: 'QR Payment',
  ewallet: 'E-wallet',
};

const statusLabels: Record<string, string> = {
  paid: 'Success',
  completed: 'Success',
  executed: 'Success',
  pending: 'Processing',
  processing: 'Processing',
  expired: 'Failed',
  cancelled: 'Failed',
  failed: 'Failed',
};

function getDisplayStatus(transaction: Transaction) {
  return getTransactionStatus(transaction);
}

export default function Transactions() {
  const { user } = useAuth();
  const { collectionCurrency } = useCollectionCurrency();
  const { language } = useLanguage();
  const isKorean = language === 'ko';
  const ui = isKorean ? {
    title: '거래 내역', description: '결제 활동, 상태 및 고객 정보를 실시간으로 확인하세요.',
    live: '실시간 업데이트', offline: '오프라인 업데이트', newPayment: '새 결제',
    search: 'ID, 설명, 고객 검색...', status: '상태', allStatus: '모든 상태',
    allTypes: '모든 유형', noTransactions: '거래 내역이 없습니다',
    type: '유형', id: 'ID', descriptionHeader: '설명', customer: '고객', amount: '금액', date: '날짜', actions: '작업',
    success: '성공', processing: '처리 중', failed: '실패', noResultsHint: '필터를 변경하거나 새 결제를 만들어 보세요.',
  } : {
    title: 'Transactions', description: 'Track payment activity, statuses, and customer details in real time.',
    live: 'Live updates', offline: 'Offline updates', newPayment: 'New Payment',
    search: 'Search by ID, description, customer...', status: 'Status', allStatus: 'All Status',
    allTypes: 'All Types', noTransactions: 'No transactions found',
    type: 'Type', id: 'ID', descriptionHeader: 'Description', customer: 'Customer', amount: 'Amount', date: 'Date', actions: 'Actions',
    success: 'Success', processing: 'Processing', failed: 'Failed', noResultsHint: 'Try changing filters or create a new payment to get started.',
  };
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [updatedTxnIds, setUpdatedTxnIds] = useState<Set<number>>(new Set());
  const [loadError, setLoadError] = useState('');
  const limit = 10;

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoadError('');
    try {
      const query: Record<string, string> = {};
      query.currency = collectionCurrency.toUpperCase();
      if (statusFilter !== 'all') query.status = statusFilter;
      if (typeFilter !== 'all') query.transaction_type = typeFilter;

      const res = await Promise.race([
        client.entities.transactions.query({
          query,
          sort: '-created_at',
          limit,
          skip: page * limit,
        }),
        new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('Transaction request timed out')), 10000)),
      ]);
      if (!res.ok) throw new Error(res.data?.detail || 'Unable to load transactions');
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      setTransactions(items);
      setTotal(Number(res.data?.total) || 0);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setTransactions([]);
      setTotal(0);
      setLoadError(err instanceof Error ? err.message : 'Unable to load transactions');
    } finally {
      setLoading(false);
    }
  }, [user, page, statusFilter, typeFilter, collectionCurrency]);

  // Real-time payment events
  const onStatusChangeCallback = useCallback((event) => {
    // Refresh the transaction list
    fetchTransactions();
    // Highlight the updated row
    if (event.transaction_id) {
      setUpdatedTxnIds((prev) => new Set(prev).add(event.transaction_id!));
      setTimeout(() => {
        setUpdatedTxnIds((prev) => {
          const next = new Set(prev);
          next.delete(event.transaction_id!);
          return next;
        });
      }, 3000);
    }
  }, [fetchTransactions]);

  const paymentEventsOptions = useMemo(
    () => ({
      enabled: !!user,
      onStatusChange: onStatusChangeCallback,
      pollInterval: 5000,
    }),
    [user, onStatusChangeCallback]
  );

  const { connected } = usePaymentEvents(paymentEventsOptions);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchTransactions();
    };
    load();
  }, [fetchTransactions]);

  useEffect(() => {
    setPage(0);
  }, [collectionCurrency]);

  if (loading) return (
    <Layout connected={connected}>
      <LoadingSkeleton variant="page" />
    </Layout>
  );

  const filteredTxns = searchTerm
    ? transactions.filter(
        (t) =>
          t.external_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : transactions;

  const totalPages = Math.ceil(total / limit);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const cloneTransaction = (txn: Transaction) => {
    const params = new URLSearchParams();
    params.set('type', txn.transaction_type);
    params.set('amount', String(txn.amount));
    if (txn.description) params.set('description', txn.description);
    if (txn.customer_name) params.set('customer_name', txn.customer_name);
    if (txn.customer_email) params.set('customer_email', txn.customer_email);
    navigate(`/pay-by-link/new?${params.toString()}`);
  };

  return (
    <Layout connected={connected}>
      <SiteContainer className="!max-w-none !px-2 py-5 space-y-4 sm:!px-6 sm:py-10 sm:space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-5 shadow-sm relative overflow-hidden animate-fade-in-up">
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-blue-200/30 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-cyan-200/30 blur-2xl" />
        <div className="relative z-10 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">{ui.title}</h1>
            <p className="text-sm text-slate-500 mt-1">{ui.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white/90 px-2.5 py-1.5 text-xs text-slate-600">
              {connected ? <Wifi className="h-3.5 w-3.5 text-emerald-500" /> : <WifiOff className="h-3.5 w-3.5 text-red-500" />}
              {connected ? ui.live : ui.offline}
            </div>
            <Link to="/pay-by-link/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 btn-hover-lift transition-smooth">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{ui.newPayment}</span>
              </Button>
            </Link>
          </div>
        </div>
        </div>

        {/* Filters */}
        <Card className="bg-white border border-slate-200 mb-6 shadow-sm animate-fade-in-up animate-stagger-1">
          <div className="h-1 w-full bg-gradient-to-r from-blue-400/70 to-cyan-200/20" />
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={ui.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                <SelectTrigger className="w-full sm:w-[140px] bg-slate-50 border-slate-200 text-foreground">
                  <SelectValue placeholder={ui.status} />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="all" className="text-foreground">{ui.allStatus}</SelectItem>
                  <SelectItem value="paid" className="text-emerald-400">Paid</SelectItem>
                  <SelectItem value="completed" className="text-emerald-400">Completed</SelectItem>
                  <SelectItem value="pending" className="text-amber-400">Pending</SelectItem>
                  <SelectItem value="expired" className="text-red-400">Expired</SelectItem>
                  <SelectItem value="failed" className="text-red-400">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(0); }}>
                <SelectTrigger className="w-full sm:w-[160px] bg-slate-50 border-slate-200 text-foreground">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="all" className="text-foreground">{ui.allTypes}</SelectItem>
                  <SelectItem value="invoice" className="text-blue-400">Invoice</SelectItem>
                  <SelectItem value="qr_code" className="text-purple-400">QR Code</SelectItem>
                  <SelectItem value="payment_link" className="text-cyan-400">Payment Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transaction List */}
        <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden animate-fade-in-up animate-stagger-2">
          <div className="h-1 w-full bg-gradient-to-r from-slate-300/80 to-blue-100/30" />
          <CardContent className="p-0">
            {loading ? (
              <LoadingSpinner message="Fetching records" />
            ) : loadError ? (
              <div className="px-6 py-16 text-center">
                <p className="font-medium text-slate-700">Unable to load transactions</p>
                <p className="mt-1 text-sm text-slate-500">{loadError}</p>
                <Button type="button" variant="outline" className="mt-4" onClick={() => { setLoading(true); void fetchTransactions(); }}>
                  Try again
                </Button>
              </div>
            ) : filteredTxns.length === 0 ? (
              <div className="text-center py-16 px-6 animate-fade-in-up">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-7 w-7" />
                </div>
                <p className="text-slate-700 font-medium">{ui.noTransactions}</p>
                <p className="text-sm text-slate-500 mt-1">{ui.noResultsHint}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70">
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 md:px-6 py-3">{ui.type}</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 md:px-6 py-3">{ui.id}</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 md:px-6 py-3 hidden md:table-cell">{ui.descriptionHeader}</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 md:px-6 py-3 hidden md:table-cell">{ui.customer}</th>
                      <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 md:px-6 py-3">{ui.amount}</th>
                      <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 md:px-6 py-3">{ui.status}</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 md:px-4 py-3 hidden lg:table-cell">{ui.date}</th>
                      <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 md:px-6 py-3">{ui.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTxns.map((txn) => {
                      const displayStatus = getDisplayStatus(txn);
                      const statusType: StatusType = ['paid', 'completed', 'executed', 'pending', 'failed', 'processing', 'expired', 'cancelled'].includes(displayStatus)
                        ? displayStatus as StatusType
                        : 'inactive';
                      const isUpdated = updatedTxnIds.has(txn.id);
                      return (
                        <tr
                          key={txn.id}
                          onClick={() => navigate(`/payments/${txn.id}`)}
                          className={`border-b border-border/30 transition-all duration-500 ${
                            isUpdated
                              ? 'bg-blue-500/10 ring-1 ring-inset ring-blue-500/30'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <td className="px-3 md:px-6 py-3 md:py-4">
                            <div className="flex items-center space-x-2">
                              <PaymentBrandLogo brand={txn.transaction_type} size="sm" className="h-7 min-w-12 max-w-16" />
                              <span className="text-sm text-muted-foreground">{typeLabels[txn.transaction_type] || txn.transaction_type}</span>
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4">
                            <div className="flex items-center space-x-1">
                              <code className="text-xs text-muted-foreground font-mono">{txn.external_id || `#${txn.id}`}</code>
                              {txn.external_id && (
                                <button type="button" aria-label="Copy external transaction ID" title="Copy external transaction ID" onClick={() => copyToClipboard(txn.external_id)} className="text-muted-foreground hover:text-foreground">
                                  <Copy className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 hidden md:table-cell">
                            <span className="text-sm text-foreground">{txn.description || '-'}</span>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 hidden md:table-cell">
                            <div>
                              <span className="text-sm text-foreground">{txn.customer_name || '-'}</span>
                              {txn.customer_email && (
                                <p className="text-xs text-muted-foreground">{txn.customer_email}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-right">
                            <span className="text-sm font-mono font-medium text-foreground">
                              {fmtCurrency(
                                typeof txn.amount === 'number' ? txn.amount : Number(txn.amount || 0),
                                txn.currency || 'PHP',
                              )}
                            </span>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-center">
                            <StatusBadge
                              status={statusType}
                              label={isKorean
                                ? (['paid', 'completed', 'executed'].includes(displayStatus)
                                  ? ui.success
                                  : ['pending', 'processing'].includes(displayStatus)
                                    ? ui.processing
                                    : ui.failed)
                                : statusLabels[displayStatus] || undefined}
                              size="sm"
                              showDot={false}
                              className={isUpdated ? 'animate-pulse ring-2 ring-current scale-110' : undefined}
                            />
                          </td>
                          <td className="px-3 md:px-4 py-3 md:py-4 hidden lg:table-cell">
                            {txn.created_at ? (
                              <>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(txn.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                  {new Date(txn.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-muted-foreground">—</div>
                            )}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {txn.payment_url && (
                                <a href={txn.payment_url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 h-8 w-8 p-0">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Button>
                                </a>
                              )}
                              {txn.payment_url && (
                                <button onClick={() => copyToClipboard(txn.payment_url)} className="text-muted-foreground hover:text-foreground p-1">
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => cloneTransaction(txn)}
                                title="Clone transaction"
                                className="text-muted-foreground hover:text-foreground p-1"
                              >
                                <CopyPlus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {page * limit + 1}-{Math.min((page + 1) * limit, total)} of {total}
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
     </SiteContainer>
    </Layout>
  );
}
