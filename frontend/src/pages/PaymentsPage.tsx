import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, MoreVertical, Search, Check, RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import { client } from '@/lib/api';
import { fmtCurrency } from '@/lib/format';
import LoadingSkeleton from '@/design-system/components/LoadingSkeleton';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import { PaymentStatusBadge } from '@/components/PaymentStatusBadge';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTransactionStatus, type TransactionStatus } from '@/lib/transactions';
import { getPaymentDateRangeBounds, type PaymentDateRange } from '@/lib/paymentDateRanges';

type DateRange = PaymentDateRange;
type Status = 'all' | TransactionStatus;
const PAYMENT_PAGE_SIZE = 2000;

interface PaymentApiRecord {
  id: number | string;
  transaction_type?: string | null;
  amount?: number | null;
  currency?: string | null;
  status: string;
  approval_status?: string | null;
  payment_status?: string | null;
  paid_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  title?: string | null;
  order_no?: string | null;
  external_id?: string | null;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  method: string;
  provider: string;
  reference: string;
  createdAt: string;
  createdTimestamp: number | null;
  executedAt: string | null;
  status: TransactionStatus;
  approvalStatus?: string | null;
  paymentStatus?: string | null;
  paidAt?: string | null;
}

const dateRangeLabels: Record<DateRange, string> = {
  all: 'All dates',
  last7: 'Last 7 days',
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This week',
  lastWeek: 'Last week',
  thisMonth: 'This month',
  lastMonth: 'Last month',
  custom: 'Custom range',
};

const statusLabels: Record<Status, string> = {
  all: 'All',
  pending: 'Pending',
  paid: 'Paid',
  processing: 'Processing',
  failed: 'Failed',
  rejected: 'Rejected',
  expired: 'Expired',
  cancelled: 'Cancelled',
  inactive: 'Unknown',
};

const koreanDateRangeLabels: Record<DateRange, string> = {
  all: '전체 기간',
  last7: '최근 7일',
  today: '오늘',
  yesterday: '어제',
  thisWeek: '이번 주',
  lastWeek: '지난주',
  thisMonth: '이번 달',
  lastMonth: '지난달',
  custom: '사용자 지정 기간',
};

const koreanStatusLabels: Record<Status, string> = {
  all: '전체',
  pending: '대기 중',
  paid: '결제 완료',
  processing: '처리 중',
  failed: '실패',
  rejected: '거부됨',
  expired: '만료됨',
  cancelled: '취소됨',
  inactive: '알 수 없음',
};

export default function PaymentsPage() {
  const { collectionCurrency } = useCollectionCurrency();
  const { language } = useLanguage();
  const isKorean = language === 'ko';
  const ui = isKorean ? {
    title: '결제', search: '검색...', refresh: '결제 새로고침', actions: '결제 작업',
    refreshData: '데이터 새로고침', viewTransactions: '거래 내역 보기', createdOn: '생성일:',
    status: '상태:', clearFilters: '필터 초기화', startDate: '시작일', endDate: '종료일',
    transactions: '거래', totalAmount: '총 금액',
    averageAmount: '평균 금액', history: '거래 내역', payment: '결제',
    reference: '참조 번호', date: '날짜', paymentStatus: '결제 상태',
    noTransactions: '거래 내역이 없습니다', loadError: '결제를 불러오지 못했습니다.',
    retry: '다시 시도', created: '생성:', executed: '실행:',
  } : {
    title: 'Payments', search: 'Search...', refresh: 'Refresh payments', actions: 'Open payment actions',
    refreshData: 'Refresh data', viewTransactions: 'View transactions', createdOn: 'Created on:',
    status: 'Status:', clearFilters: 'Clear filters', startDate: 'Start date', endDate: 'End date',
    transactions: 'Transactions', totalAmount: 'Total amount',
    averageAmount: 'Average amount', history: 'Transactions history', payment: 'PAYMENT',
    reference: 'REFERENCE NO', date: 'DATE', paymentStatus: 'PAYMENT STATUS',
    noTransactions: 'No transactions found', loadError: 'Unable to load payments.',
    retry: 'Try again', created: 'Created:', executed: 'Executed:',
  };
  const activeCurrency = String(collectionCurrency || 'PHP').trim().toUpperCase();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const querySearchTerm = searchParams.get('search') || '';
  const [dateRange, setDateRange] = useState<DateRange>(querySearchTerm ? 'all' : 'last7');
  const today = new Date();
  const todayInput = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [customStart, setCustomStart] = useState(todayInput);
  const [customEnd, setCustomEnd] = useState(todayInput);
  const [status, setStatus] = useState<Status>('all');
  const [searchTerm, setSearchTerm] = useState(querySearchTerm);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const fetchAllPages = async (query: Record<string, string | null>) => {
        const items: PaymentApiRecord[] = [];
        let total = Number.POSITIVE_INFINITY;
        while (items.length < total) {
          const res = await client.entities.transactions.query({
            query,
            sort: '-created_at',
            limit: PAYMENT_PAGE_SIZE,
            skip: items.length,
          });
          if (!res.ok || !res.data || !Array.isArray(res.data.items)) {
            throw new Error(res.data?.detail || 'Unable to load payment history.');
          }
          const batch = res.data.items as PaymentApiRecord[];
          total = Number(res.data.total);
          if (!Number.isFinite(total) || total < 0) {
            throw new Error('The payment history response has an invalid transaction count.');
          }
          items.push(...batch);
          if (batch.length === 0 && items.length < total) {
            throw new Error('Payment history changed while loading. Refresh to try again.');
          }
        }
        return items;
      };
      const rawItems = await fetchAllPages({ currency: activeCurrency });
      if (activeCurrency === 'PHP') {
        rawItems.push(...await fetchAllPages({ currency: null }));
      }
      const locale = language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-PH' : 'ko-KR';
      const mapped: Payment[] = rawItems.map((item) => {
        const createdDate = item.created_at ? new Date(item.created_at) : null;
        const paidDate = item.paid_at || item.updated_at;
        const executedDate = getTransactionStatus(item) === 'paid' && paidDate ? new Date(paidDate) : null;
        return {
          id: String(item.id),
          amount: Number(item.amount) || 0,
          currency: String(item.currency || 'PHP').trim().toUpperCase(),
          method: item.transaction_type || 'Transfer',
          provider: item.title || 'SwiftPay',
          reference: item.order_no || item.external_id || 'N/A',
          createdAt: createdDate && !Number.isNaN(createdDate.getTime())
            ? createdDate.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
            : 'N/A',
          executedAt: executedDate && !Number.isNaN(executedDate.getTime())
            ? executedDate.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
            : null,
          createdTimestamp: createdDate && !Number.isNaN(createdDate.getTime()) ? createdDate.getTime() : null,
          status: getTransactionStatus(item),
          approvalStatus: item.approval_status || null,
          paymentStatus: item.payment_status || null,
          paidAt: item.paid_at || null,
        };
      });
      setPayments(mapped);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setLoadError(err instanceof Error ? err.message : 'Unable to load payment history.');
    } finally {
      setLoading(false);
    }
  }, [activeCurrency, language]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    setSearchTerm(querySearchTerm);
    if (querySearchTerm) setDateRange('all');
  }, [querySearchTerm]);

  const filteredPayments = useMemo(() => {
    const bounds = getPaymentDateRangeBounds(dateRange, customStart, customEnd);
    return payments.filter(p => {
      if (p.currency !== activeCurrency) return false;
      if (dateRange === 'custom' && !bounds) return false;
      if (bounds && (p.createdTimestamp === null || p.createdTimestamp < bounds.start.getTime() || p.createdTimestamp >= bounds.end.getTime())) return false;
      if (status !== 'all' && p.status !== status) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return p.id.toLowerCase().includes(term) ||
               p.reference.toLowerCase().includes(term) ||
               p.provider.toLowerCase().includes(term) ||
               p.method.toLowerCase().includes(term);
      }
      return true;
    });
  }, [payments, activeCurrency, dateRange, customStart, customEnd, status, searchTerm]);

  const transactionsCount = filteredPayments.length;
  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const avgAmount = transactionsCount > 0 ? totalAmount / transactionsCount : 0;

  if (loading) return (
    <Layout>
      <LoadingSkeleton variant="page" />
    </Layout>
  );

  if (loadError) return (
    <Layout>
      <div role="alert" className="mx-auto max-w-xl py-20 text-center">
        <p className="text-lg font-semibold text-slate-900">{ui.loadError}</p>
        <p className="mt-2 text-sm text-slate-500">{loadError}</p>
        <button
          type="button"
          onClick={() => void fetchPayments()}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={15} /> {ui.retry}
        </button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="page-enter">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">{ui.title}</h1>

          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-nowrap md:gap-3">
            <div className="relative min-w-0 w-full md:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={ui.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
              />
            </div>
            <button
              onClick={() => fetchPayments()}
              type="button"
              aria-label={ui.refresh}
              title={ui.refresh}
              className="app-touch-target h-10 w-10 shrink-0 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 shadow-sm"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              type="button"
              aria-label={ui.actions}
              title={ui.actions}
              className="app-touch-target h-10 w-10 shrink-0 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 shadow-sm"
            >
              <MoreVertical size={18} />
            </button>
            {showMenuDropdown && (
              <div className="absolute right-0 top-11 z-30 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => { setShowMenuDropdown(false); fetchPayments(); }}
                  className="block w-full px-3 py-2 text-left text-[12px] font-medium text-slate-700 hover:bg-slate-50"
                >
                  {ui.refreshData}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowMenuDropdown(false); navigate('/transactions'); }}
                  className="block w-full px-3 py-2 text-left text-[12px] font-medium text-slate-700 hover:bg-slate-50"
                >
                  {ui.viewTransactions}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-nowrap items-center gap-2 mb-8 overflow-x-auto pb-1">
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex min-w-max items-center gap-2 h-10 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:border-slate-300"
            >
              <span className="text-slate-400">{ui.createdOn}</span>
              <span className="text-slate-900 font-semibold">{isKorean ? koreanDateRangeLabels[dateRange] : dateRangeLabels[dateRange]}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {showDateDropdown && (
              <>
                <div onClick={() => setShowDateDropdown(false)} className="fixed inset-0 z-10" />
                <div className="absolute left-0 top-full mt-2 w-[200px] bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden page-enter">
                  {(Object.keys(dateRangeLabels) as DateRange[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setDateRange(key); setShowDateDropdown(false); }}
                      className={`flex w-full items-center justify-between px-4 py-3 text-[13px] font-semibold ${dateRange === key ? 'bg-slate-50 text-[#FF6B00]' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {isKorean ? koreanDateRangeLabels[key] : dateRangeLabels[key]}
                      {dateRange === key && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex min-w-max items-center gap-2 h-10 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:border-slate-300"
            >
              <span className="text-slate-400">{ui.status}</span>
              <span className="text-slate-900 font-semibold">{isKorean ? koreanStatusLabels[status] : statusLabels[status]}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {showStatusDropdown && (
              <>
                <div onClick={() => setShowStatusDropdown(false)} className="fixed inset-0 z-10" />
                <div className="absolute left-0 top-full mt-2 w-[180px] bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden page-enter">
                  {(Object.keys(statusLabels) as Status[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setStatus(key); setShowStatusDropdown(false); }}
                      className={`flex w-full items-center justify-between px-4 py-3 text-[13px] font-semibold ${status === key ? 'bg-slate-50 text-[#FF6B00]' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {isKorean ? koreanStatusLabels[key] : statusLabels[key]}
                      {status === key && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setDateRange('all');
              setCustomStart(todayInput);
              setCustomEnd(todayInput);
              setStatus('all');
              setSearchTerm('');
              navigate('/payments', { replace: true });
            }}
            className="flex min-w-max items-center gap-2 h-10 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            {ui.clearFilters}
          </button>
        </div>

        {dateRange === 'custom' && (
          <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              {ui.startDate}
              <input
                type="date"
                value={customStart}
                max={customEnd}
                onChange={(event) => setCustomStart(event.target.value)}
                className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900"
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              {ui.endDate}
              <input
                type="date"
                value={customEnd}
                min={customStart}
                onChange={(event) => setCustomEnd(event.target.value)}
                className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900"
              />
            </label>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
            <p className="text-[14px] font-semibold text-slate-900 mb-6">{ui.transactions}</p>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">{transactionsCount}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
            <p className="text-[14px] font-semibold text-slate-900 mb-6">{ui.totalAmount}</p>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">{fmtCurrency(totalAmount, activeCurrency)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
            <p className="text-[14px] font-semibold text-slate-900 mb-6">{ui.averageAmount}</p>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">{fmtCurrency(avgAmount, activeCurrency)}</p>
          </div>
        </div>

        {/* Table */}
        <h2 className="text-[18px] font-semibold text-slate-900 mb-6">{ui.history}</h2>
        <div className="app-table-scroll bg-white border border-slate-200 rounded-xl shadow-sm">
          <table className="w-full min-w-[680px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{ui.payment}</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{ui.reference}</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{ui.date}</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{ui.paymentStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center">
                    <RefreshCw size={24} className="animate-spin mx-auto text-slate-300" />
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                    {ui.noTransactions}
                  </td>
                </tr>
              ) : filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    onClick={() => navigate(`/payments/${payment.id}`)}
                    className="cursor-pointer hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <PaymentBrandLogo brand={payment.method} size="sm" className="border-0 bg-transparent p-0 shadow-none" />
                        <div>
                          <p className="text-[14px] font-semibold text-slate-900">{fmtCurrency(payment.amount, payment.currency)}</p>
                          <p className="text-[11px] text-slate-500">{payment.provider} • {payment.method}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-slate-600 font-medium">{payment.reference}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] text-slate-500">{ui.created} {payment.createdAt}</p>
                      {payment.executedAt && <p className="text-[11px] text-slate-500">{ui.executed} {payment.executedAt}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <PaymentStatusBadge
                        transaction={{
                          status: payment.status,
                          approval_status: payment.approvalStatus,
                          payment_status: payment.paymentStatus,
                          paid_at: payment.paidAt,
                        }}
                        size="sm"
                        showDot
                      />
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
