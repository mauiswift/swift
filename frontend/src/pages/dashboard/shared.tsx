import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePaymentEvents } from '@/hooks/usePaymentEvents';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import { fmtCurrency } from '@/lib/format';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import React from 'react';
import { ArrowUpRight, CreditCard, FileBarChart, Landmark, Send, type LucideIcon } from 'lucide-react';
import { hasPermission, type PermissionKey } from '@/lib/permissions';

export interface DashboardStats {
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

export const defaultStats: DashboardStats = {
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

export type RangeKey = 7 | 30 | 90;

export const rangeLabelsByLanguage = {
  en: { 7: 'Last 7 days', 30: 'Last 30 days', 90: 'Last 90 days' },
  ko: { 7: '최근 7일', 30: '최근 30일', 90: '최근 90일' },
} as const;

export const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  Executed: { bg: '#F0FDFA', text: '#0D9488', dot: '#10B981' },
  Pending:  { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' },
  Rejected: { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
  Expired:  { bg: '#F9FAFB', text: '#6B7280', dot: '#9CA3AF' },
};

export function DashboardPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[26px] border border-slate-200/80 bg-white/90 shadow-[0_12px_32px_rgba(15,23,42,0.06)] ${className}`}>
      {children}
    </section>
  );
}

export function DashboardStatCard({
  label,
  value,
  sub,
  loading,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  loading: boolean;
  icon: LucideIcon;
}) {
  return (
    <div className="card-3d group relative h-full overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)] sm:p-5">
      <div className="card-3d-inner flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
            <p className="mt-4 break-words text-[clamp(1.5rem,7vw,1.75rem)] font-semibold leading-none tracking-[-0.04em] text-slate-900 sm:mt-5">
              {loading ? <span className="inline-block h-8 w-24 rounded-lg skeleton-shimmer" /> : value}
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

export interface DashboardAction {
  label: string;
  description: string;
  href: string;
  permission: PermissionKey;
  icon: LucideIcon;
  tone: string;
}

export const dashboardActions: DashboardAction[] = [
  { label: 'Payments', description: 'Review incoming payments', href: '/payments', permission: 'can_manage_payments', icon: CreditCard, tone: 'bg-blue-50 text-blue-600' },
  { label: 'Disbursements', description: 'Send and track payouts', href: '/disbursements', permission: 'can_manage_disbursements', icon: Send, tone: 'bg-amber-50 text-amber-600' },
  { label: 'Wallet', description: 'Manage currency balances', href: '/wallet', permission: 'can_manage_wallet', icon: Landmark, tone: 'bg-emerald-50 text-emerald-600' },
  { label: 'Reports', description: 'Analyze business performance', href: '/reports', permission: 'can_view_reports', icon: FileBarChart, tone: 'bg-violet-50 text-violet-600' },
];

export function getDashboardActions(permissions: Parameters<typeof hasPermission>[0], isSuperAdmin = false) {
  return dashboardActions.filter(action => isSuperAdmin || hasPermission(permissions, action.permission));
}

export interface WalletBalanceSnapshot {
  currency: string;
  balance: number;
  available_balance: number;
  pending_balance: number;
}

export function useDashboardData() {
  const { user, loading: authLoading, isSuperAdmin, permissions } = useAuth();
  const { language } = useLanguage();
  const { collectionCurrency } = useCollectionCurrency();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>(7);
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [balances, setBalances] = useState<Record<string, WalletBalanceSnapshot>>({});

  const fetchData = useCallback(async (days: RangeKey) => {
    if (!user) return;
    try {
      const [statsRes, phpRes, usdtRes, krwRes, cnyRes] = await Promise.all([
        client.apiCall.invoke({
          url: `/api/v1/xend/dashboard-stats?days=${days}&currency=${collectionCurrency}`,
          method: 'GET',
          data: {},
        }),
        client.apiCall.invoke({ url: '/api/v1/wallet/balance?currency=PHP', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/balance?currency=USDT', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/balance?currency=KRW', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/balance?currency=CNY', method: 'GET', data: {} }),
      ]);

      if (statsRes.ok && statsRes.data && statsRes.data.payments) {
        const dailyVolumes = Array.isArray(statsRes.data.daily_volumes)
          ? statsRes.data.daily_volumes.map((day: DashboardStats['daily_volumes'][number]) => ({
              ...day,
              payments: Number.isFinite(Number(day.payments)) ? Number(day.payments) : 0,
              disbursements: Number.isFinite(Number(day.disbursements)) ? Number(day.disbursements) : 0,
            }))
          : [];
        setStats({ ...defaultStats, ...statsRes.data, daily_volumes: dailyVolumes });
      } else {
        setStats(defaultStats);
      }

      const balanceMap: Record<string, WalletBalanceSnapshot> = {};
      const addBal = (curr: string, res: any) => {
        if (res.ok && res.data) {
          balanceMap[curr] = {
            currency: curr,
            balance: Number(res.data.balance || 0),
            available_balance: Number(res.data.available_balance ?? res.data.balance ?? 0),
            pending_balance: Number(res.data.pending_balance || 0),
          };
        } else {
          balanceMap[curr] = { currency: curr, balance: 0, available_balance: 0, pending_balance: 0 };
        }
      };
      addBal('PHP', phpRes);
      addBal('USDT', usdtRes);
      addBal('KRW', krwRes);
      addBal('CNY', cnyRes);
      setBalances(balanceMap);
    } catch (err) {
      setStats(defaultStats);
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

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim() && (isSuperAdmin || hasPermission(permissions, 'can_manage_payments'))) {
      navigate(`/payments?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

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

  return {
    authLoading,
    user,
    isSuperAdmin,
    permissions,
    dashboardActions: getDashboardActions(permissions, isSuperAdmin),
    stats,
    balances,
    loading,
    range,
    showRangeDropdown,
    searchTerm,
    connected,
    handleSearch,
    setSearchTerm,
    setRange,
    setShowRangeDropdown,
    fetchData,
    ui,
    rangeLabels,
    formatAmount,
    statusLabels,
    orgName,
    hasAnyTransactions,
    paymentVolume,
    disbursementVolume,
    totalVolume,
    paymentShare,
  };
}

export function DashboardLoadingFallback() {
  return <AppLoadingScreen />;
}
