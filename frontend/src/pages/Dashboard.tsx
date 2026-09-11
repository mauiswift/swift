import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePaymentEvents } from '@/hooks/usePaymentEvents';
import Layout from '@/components/Layout';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import LoadingSkeleton from '@/design-system/components/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import {
  Search,
  MoreVertical,
  ChevronDown,
  Check,
  RefreshCw,
  TrendingUp,
  WalletCards,
  Landmark,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';
import { fmtCurrency } from '@/lib/format';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';

interface DashboardStats {
  days: number;
  currency: string;
  payments: { total_amount: number; total_count: number };
  disbursements: { total_amount: number; total_count: number };
  daily_volumes: { date: string; day: string; payments: number; disbursements: number }[];
  payment_methods: { name: string; count: number; amount: number }[];
  status_breakdown: {
    status: string;
    payment_amount: number;
    payment_count: number;
    disbursement_amount: number | null;
    disbursement_count: number | null;
  }[];
}

const defaultStats: DashboardStats = {
  days: 7,
  currency: 'PHP',
  payments: { total_amount: 0, total_count: 0 },
  disbursements: { total_amount: 0, total_count: 0 },
  daily_volumes: [],
  payment_methods: [],
  status_breakdown: [
    { status: 'Executed', payment_amount: 0, payment_count: 0, disbursement_amount: 0, disbursement_count: 0 },
    { status: 'Pending', payment_amount: 0, payment_count: 0, disbursement_amount: 0, disbursement_count: 0 },
    { status: 'Rejected', payment_amount: 0, payment_count: 0, disbursement_amount: 0, disbursement_count: 0 },
    { status: 'Expired', payment_amount: 0, payment_count: 0, disbursement_amount: null, disbursement_count: null },
  ],
};

type RangeKey = 7 | 30 | 90;

const rangeLabelsByLanguage = {
  en: { 7: 'Last 7 days', 30: 'Last 30 days', 90: 'Last 90 days' },
  ko: { 7: '최근 7일', 30: '최근 30일', 90: '최근 90일' },
} as const;

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  Executed: { bg: '#F0FDFA', text: '#0D9488', dot: '#10B981' },
  Pending:  { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' },
  Rejected: { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
  Expired:  { bg: '#F9FAFB', text: '#6B7280', dot: '#9CA3AF' },
};

function StatCard({ label, value, sub, loading, icon: Icon, accentClass }: { label: string; value: string; sub: string; loading: boolean; icon: LucideIcon; accentClass: string; }) {
  return (
    <div className="card-3d group relative h-full overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)] sm:p-5">
      <div className={`absolute inset-x-0 top-0 h-1 ${accentClass}`} />
      <div className="card-3d-inner flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
            <p className="mt-4 break-words text-[clamp(1.5rem,7vw,1.75rem)] font-semibold leading-none tracking-[-0.04em] text-slate-900 sm:mt-5">
              {loading ? <span className="inline-block w-24 h-8 skeleton-shimmer rounded-lg" /> : value}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 shadow-inner">
            <Icon size={20} className="transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-[12px] font-semibold text-slate-500">{sub}</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            <ArrowUpRight size={11} />
            Live
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { collectionCurrency } = useCollectionCurrency();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>(7);
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async (days: RangeKey) => {
    if (!user) return;
    try {
      const res = await client.apiCall.invoke({
        url: `/api/v1/xend/dashboard-stats?days=${days}&currency=${collectionCurrency}`,
        method: 'GET',
        data: {},
      });
      if (res.ok && res.data && res.data.payments) {
        const dailyVolumes = Array.isArray(res.data.daily_volumes)
          ? res.data.daily_volumes.map((day: DashboardStats['daily_volumes'][number]) => ({
              ...day,
              payments: Number.isFinite(Number(day.payments)) ? Number(day.payments) : 0,
              disbursements: Number.isFinite(Number(day.disbursements)) ? Number(day.disbursements) : 0,
            }))
          : [];
        setStats({ ...defaultStats, ...res.data, daily_volumes: dailyVolumes });
      } else {
        setStats(defaultStats);
        console.error('Incomplete or failed dashboard stats:', res);
      }
    } catch (err) {
      setStats(defaultStats);
      console.error('Failed to fetch dashboard stats:', err);
    }
  }, [user, collectionCurrency]);

  const { connected } = usePaymentEvents({
    enabled: !!user,
    onStatusChange: useCallback(() => { fetchData(range); }, [fetchData, range]),
    onWalletUpdate: useCallback(() => { fetchData(range); }, [fetchData, range]),
    pollInterval: 10000,
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => { setLoading(true); await fetchData(range); setLoading(false); };
    load();
  }, [user, range, fetchData]);

  if (authLoading) return <AppLoadingScreen />;
  if (!user) return <Navigate to="/home" replace />;

  if (loading) {
    return (
      <Layout connected={connected}>
        <LoadingSkeleton variant="page" />
      </Layout>
    );
  }

  const ui = language === 'ko'
    ? {
        overview: '개요',
        refresh: '새로고침',
        range: '기간',
        payments: '결제',
        disbursements: '출금',
        performance: '실적',
        volumeOverview: '거래량 개요',
        healthyFlow: '정상 거래',
        noActivity: '거래 없음',
        noTransactions: '선택한 기간에 거래가 없습니다',
        noTransactionsBody: '다른 기간을 선택해 보거나 잠시 후 다시 확인해 주세요.',
        dailyVolume: '일별 거래량',
        days: '일',
        transactions: '건',
        status: '상태',
        buckets: '버킷',
        searchPlaceholder: '결제 ID, 참조 번호로 검색…',
      }
    : {
        overview: 'Overview',
        refresh: 'Refresh',
        range: 'Range',
        payments: 'Payments',
        disbursements: 'Disbursements',
        performance: 'Performance',
        volumeOverview: 'Volume overview',
        healthyFlow: 'Healthy flow',
        noActivity: 'No activity',
        noTransactions: 'No transactions in this period',
        noTransactionsBody: 'No transactions found for the selected date range. Try a different period or check back later.',
        dailyVolume: 'Daily volume',
        days: 'days',
        transactions: 'transactions',
        status: 'Status',
        buckets: 'buckets',
        searchPlaceholder: 'Search by payment ID, ref. no...',
      };

  const rangeLabels = rangeLabelsByLanguage[language === 'ko' ? 'ko' : 'en'];
  const formatAmount = (amount: number) => fmtCurrency(amount, collectionCurrency);
  const statusLabels = language === 'ko'
    ? { Executed: '실행됨', Pending: '대기 중', Rejected: '거부됨', Expired: '만료됨' }
    : { Executed: 'Executed', Pending: 'Pending', Rejected: 'Rejected', Expired: 'Expired' };

  const orgName = (user as { organization_name?: string; name?: string } | null)?.organization_name
    || (user as { name?: string } | null)?.name
    || 'DRL Solutions';

  const hasAnyTransactions = stats.payments.total_count > 0
    || stats.disbursements.total_count > 0
    || stats.daily_volumes.some((day) => day.payments > 0 || day.disbursements > 0)
    || stats.status_breakdown.some((row) => (row.payment_count ?? 0) > 0 || (row.disbursement_count ?? 0) > 0);

  const paymentVolume = Number(stats.payments?.total_amount ?? 0);
  const disbursementVolume = Number(stats.disbursements?.total_amount ?? 0);
  const totalVolume = paymentVolume + disbursementVolume;
  const paymentShare = totalVolume > 0 ? (paymentVolume / totalVolume) * 100 : 50;

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/payments?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <Layout connected={connected}>
      <div className="page-enter mx-auto max-w-[1065px]">
        <div className="mb-6 flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="m-0 break-words text-[22px] font-semibold leading-tight tracking-[-0.04em] text-slate-900">{orgName}</h1>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="group relative w-full min-w-0 sm:w-[320px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={ui.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full rounded-xl border border-slate-200 bg-white/90 py-2.5 pl-10 pr-11 text-[13px] text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-slate-300 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <div className="mr-3 h-4 w-px bg-slate-200" />
                <IconButton
                  label="More dashboard actions"
                  type="button"
                  variant="outline"
                  className="h-8 w-8 border-transparent bg-white text-slate-400 shadow-none hover:border-slate-200 hover:bg-slate-50 hover:text-slate-600"
                >
                  <MoreVertical size={16} />
                </IconButton>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchData(range)}
              className="h-10 w-10 shrink-0 border-slate-200 bg-white p-0 text-slate-500 shadow-sm hover:bg-slate-50"
              aria-label={ui.refresh}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <div className="relative inline-block">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRangeDropdown(!showRangeDropdown)}
              className="h-10 border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              <span className="text-slate-400">{ui.range}:</span>
              <span className="font-semibold text-slate-900">{rangeLabels[range]}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </Button>

            {showRangeDropdown && (
              <>
                <div onClick={() => setShowRangeDropdown(false)} className="fixed inset-0 z-10" />
                <div className="absolute left-0 top-full z-20 mt-2 min-w-[180px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.12)] page-enter">
                  {([7, 30, 90] as RangeKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setRange(key); setShowRangeDropdown(false); }}
                      className={`flex w-full items-center justify-between bg-white p-3 text-left text-[13px] font-semibold transition-colors ${range === key ? 'text-[#FF6B00]' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {rangeLabels[key]}
                      {range === key && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr_1.25fr]">
          <div className="stagger-item">
            <StatCard
              label={ui.payments}
              value={formatAmount(stats?.payments?.total_amount ?? 0)}
              sub={`${stats?.payments?.total_count ?? 0} ${ui.transactions}`}
              loading={loading}
              icon={TrendingUp}
              accentClass="bg-transparent"
            />
          </div>
          <div className="stagger-item">
            <StatCard
              label={ui.disbursements}
              value={formatAmount(stats?.disbursements?.total_amount ?? 0)}
              sub={`${stats?.disbursements?.total_count ?? 0} ${ui.transactions}`}
              loading={loading}
              icon={WalletCards}
              accentClass="bg-transparent"
            />
          </div>
          <div className="rounded-[26px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            <h2 className="text-[15px] font-semibold text-slate-900">Payment Method Distribution</h2>
            <div className="mt-3 flex items-center justify-center">
              <div className="relative h-[150px] w-[150px] rounded-full" style={{ background: `conic-gradient(#6366f1 0 100%)` }}>
                <div className="absolute inset-[27px] rounded-full bg-white" />
              </div>
            </div>
            <p className="mt-2 text-center text-[11px] font-medium text-slate-500">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-indigo-500" />{stats.payment_methods[0]?.name || 'QRPH P2M'}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-slate-900">Transaction Volume</h2>
            <div className="flex gap-4 text-[10px] text-slate-500"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-cyan-400" />Payments</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-800" />Disbursements</span></div>
          </div>
          <svg viewBox="0 0 700 150" className="h-[150px] w-full" role="img" aria-label="Transaction volume chart">
            <g stroke="#dbeafe" strokeWidth="1">
              {[20, 48, 76, 104, 132].map((y) => <line key={y} x1="45" x2="680" y1={y} y2={y} />)}
              {[45, 150, 255, 360, 465, 570, 680].map((x) => <line key={x} x1={x} x2={x} y1="20" y2="132" />)}
            </g>
            <polyline fill="none" stroke="#0f5f8f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points="45,132 150,82 255,83 360,20 465,132 570,132 680,132" />
            <polyline fill="none" stroke="#22d3b6" strokeWidth="2" points="45,132 680,132" />
            <g fill="#64748b" fontSize="10" textAnchor="middle">{(stats.daily_volumes.length ? stats.daily_volumes : [{ day: 'Wed' }, { day: 'Thu' }, { day: 'Fri' }, { day: 'Sat' }, { day: 'Sun' }, { day: 'Mon' }, { day: 'Tue' }]).slice(0, 7).map((d, i) => <text key={i} x={[45, 150, 255, 360, 465, 570, 680][i]} y="147">{d.day}</text>)}</g>
          </svg>
        </div>

        {!loading && !hasAnyTransactions ? (
          <div className="mb-8 flex flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-16 text-center shadow-[0_18px_40px_rgba(15,23,42,0.04)] stagger-item">
             <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300 shadow-inner">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                  <polyline points="22 7 13.5 16 8.5 11 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
             </div>
             <h3 className="mb-2 text-[15px] font-semibold text-slate-900">{ui.noTransactions}</h3>
             <p className="max-w-[360px] text-[14px] font-medium leading-relaxed text-slate-500">
               {ui.noTransactionsBody}
             </p>
          </div>
        ) : (
          <div className="mb-8 rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)] stagger-item">
            <div className="flex flex-col items-center gap-8 py-4 sm:flex-row sm:justify-center sm:gap-16 sm:py-8">
              <div
                className="relative flex aspect-square w-full max-w-[220px] items-center justify-center rounded-full shadow-inner"
                style={{ background: `conic-gradient(#f97316 0 ${paymentShare}%, #0ea5e9 ${paymentShare}% 100%)` }}
                role="img"
                aria-label={`${ui.payments}: ${formatAmount(paymentVolume)}. ${ui.disbursements}: ${formatAmount(disbursementVolume)}.`}
              >
                <div className="flex aspect-square w-[68%] flex-col items-center justify-center rounded-full bg-white px-3 text-center shadow-[0_6px_20px_rgba(15,23,42,0.08)]">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{ui.dailyVolume}</span>
                  <span className="mt-2 max-w-full truncate text-xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-2xl">{formatAmount(totalVolume)}</span>
                  <span className="mt-1 text-[10px] font-medium text-slate-400">{stats.daily_volumes.length} {ui.days}</span>
                </div>
              </div>

              <div className="grid w-full max-w-[260px] gap-4">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="h-3 w-3 shrink-0 rounded-full bg-orange-500" />
                    <span className="truncate text-sm font-semibold text-slate-700">{ui.payments}</span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-slate-900">{formatAmount(paymentVolume)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="h-3 w-3 shrink-0 rounded-full bg-sky-500" />
                    <span className="truncate text-sm font-semibold text-slate-700">{ui.disbursements}</span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-slate-900">{formatAmount(disbursementVolume)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.04)] stagger-item">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
            <p className="m-0 text-lg font-semibold tracking-[-0.04em] text-slate-900">{ui.payments}</p>
            <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {stats?.status_breakdown?.length ?? 0} {ui.buckets}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:px-8">{ui.status}</th>
                  <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:px-8">{ui.payments}</th>
                  <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:px-8">{ui.disbursements}</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.status_breakdown || []).map((row) => {
                  const style = statusStyles[row.status] || statusStyles.Expired;
                  const hasDisb = row.disbursement_amount !== null && row.disbursement_count !== null;
                  return (
                    <tr key={row.status} className="border-t border-slate-100 transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-5 sm:px-8">
                        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ backgroundColor: style.bg, color: style.text }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: style.dot }} />
                          {statusLabels[row.status as keyof typeof statusLabels] || row.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right sm:px-8">
                        <div className="text-[15px] font-semibold text-slate-900 leading-none">{formatAmount(row.payment_amount)}</div>
                        <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">{row.payment_count} {ui.transactions}</div>
                      </td>
                      <td className="px-6 py-5 text-right sm:px-8">
                        {hasDisb ? (
                          <>
                            <div className="text-[15px] font-semibold text-slate-900 leading-none">{formatAmount(row.disbursement_amount as number)}</div>
                            <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">{row.disbursement_count} {ui.transactions}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-[15px] font-semibold text-slate-900 leading-none">{formatAmount(0)}</div>
                            <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">0 {ui.transactions}</div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
