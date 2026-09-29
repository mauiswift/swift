import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePaymentEvents } from '@/hooks/usePaymentEvents';
import { fmtCurrency } from '@/lib/format';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import React from 'react';
import { ArrowUpRight, BarChart3, Bot, CheckSquare, CreditCard, Crown, FileCheck2, FileSpreadsheet, Landmark, Link2, RefreshCw, Send, Settings, type LucideIcon } from 'lucide-react';
import { hasPermission, hasSuperAdminAccess, type PermissionKey } from '@/lib/permissions';

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

const LIVE_RATE_CURRENCIES = [
  { code: 'KRW', label: 'South Korean Won' },
  { code: 'USDT', label: 'Tether' },
] as const;

export function LiveExchangeRatesPool() {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [systemFeePercent, setSystemFeePercent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRates = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/v1/app-settings/public-exchange-rates');
      if (!response.ok) throw new Error('Unable to load exchange rates');
      const data = await response.json();
      setRates(data.rates || {});
      setUpdatedAt(data.updated_at || null);
      setSystemFeePercent(Number(data.system_fee_percent) || 0);
    } catch {
      // Keep the last successful quote visible when a refresh temporarily fails.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadRates();
    const refreshTimer = window.setInterval(() => void loadRates(), 60_000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const formatRate = (value: number) => value >= 100
    ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 text-white shadow-sm" aria-labelledby="dashboard-live-rates-heading">
      <div className="p-3 sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Live market rates
            </div>
            <h2 id="dashboard-live-rates-heading" className="text-base font-semibold tracking-tight sm:text-lg">Exchange rates</h2>
          </div>
          <div className="flex min-w-0 items-center gap-2 text-[10px] text-white/55">
            <span>{updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Loading rates'}</span>
            <button
              type="button"
              onClick={() => void loadRates()}
              disabled={refreshing}
              className="app-touch-target inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 text-white/70 transition hover:bg-white/10 disabled:opacity-50"
              aria-label="Refresh exchange rates"
              title="Refresh exchange rates"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:gap-3">
          {LIVE_RATE_CURRENCIES.map(currency => (
            <div key={currency.code} className="min-w-0 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 sm:px-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold tracking-[0.1em] text-white/75">{currency.code}</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-300">Live</span>
              </div>
              <p className="mt-3 truncate text-base font-semibold leading-tight tabular-nums text-white sm:text-lg">
                {loading
                  ? '—'
                  : Number.isFinite(rates[currency.code])
                    ? `₱${formatRate(rates[currency.code])}`
                    : 'Unavailable'}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-white/45">
                1 {currency.code} · {systemFeePercent === null ? currency.label : `${systemFeePercent.toFixed(2)}% system fee`}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-white/40">
          Indicative rates · converted to PHP after the system conversion fee · refreshes every minute
        </p>
      </div>
    </section>
  );
}

export function DashboardPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`dashboard-surface rounded-[26px] border border-slate-200/80 shadow-[0_12px_32px_rgba(15,23,42,0.06)] ${className}`}>
      {children}
    </section>
  );
}

export function DailyVolumeChart({
  dailyVolumes,
  compact = false,
}: {
  dailyVolumes: DashboardStats['daily_volumes'];
  compact?: boolean;
}) {
  const { language } = useLanguage();
  const isKorean = language === 'ko';
  const weekdayLabels: Record<string, string> = isKorean
    ? { Mon: '월', Tue: '화', Wed: '수', Thu: '목', Fri: '금', Sat: '토', Sun: '일' }
    : {};
  const fallback = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
    day,
    payments: 0,
    disbursements: 0,
  }));
  const points = (dailyVolumes.length ? dailyVolumes : fallback).slice(-7);
  const width = 700;
  const height = compact ? 120 : 170;
  const left = 42;
  const right = width - 18;
  const top = 14;
  const bottom = height - 28;
  const maxValue = Math.max(...points.flatMap(point => [point.payments, point.disbursements]), 1);
  const xStep = points.length > 1 ? (right - left) / (points.length - 1) : 0;
  const toPoint = (value: number, index: number) => ({
    x: left + index * xStep,
    y: bottom - (Math.max(0, value) / maxValue) * (bottom - top),
  });
  const paymentPoints = points.map((point, index) => toPoint(point.payments, index));
  const disbursementPoints = points.map((point, index) => toPoint(point.disbursements, index));
  const toPolyline = (line: { x: number; y: number }[]) => line.map(point => `${point.x},${point.y}`).join(' ');
  const formatValue = (value: number) => value >= 1000000
    ? `${(value / 1000000).toFixed(1)}m`
    : value >= 1000
      ? `${(value / 1000).toFixed(1)}k`
      : Math.round(value).toString();

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-4 text-[10px] font-medium text-slate-500">
          <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-cyan-500" />{isKorean ? '결제' : 'Payments'}</span>
          <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-sky-800" />{isKorean ? '출금' : 'Disbursements'}</span>
        </div>
        <span className="text-[10px] text-slate-400">{isKorean ? '최고' : 'Peak'} {formatValue(maxValue)}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className={`h-full w-full ${compact ? 'min-h-[110px]' : 'min-h-[150px]'}`} role="img" aria-labelledby="daily-volume-chart-title daily-volume-chart-description">
        <title id="daily-volume-chart-title">{isKorean ? '일별 결제 및 출금 거래량' : 'Daily payment and disbursement volume'}</title>
        <desc id="daily-volume-chart-description">{isKorean ? '7일간 결제 및 출금 금액 비교' : 'A seven-day comparison of payment and disbursement amounts.'}</desc>
        <g stroke="#e2e8f0" strokeWidth="1">
          {[0, 0.5, 1].map((ratio) => {
            const y = bottom - ratio * (bottom - top);
            return <line key={ratio} x1={left} x2={right} y1={y} y2={y} />;
          })}
        </g>
        <g fill="#94a3b8" fontSize="9" textAnchor="end">
          <text x={left - 6} y={top + 3}>{formatValue(maxValue)}</text>
          <text x={left - 6} y={bottom + 3}>0</text>
        </g>
        <polyline fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={toPolyline(paymentPoints)} />
        <polyline fill="none" stroke="#075985" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={toPolyline(disbursementPoints)} />
        <g fill="#06b6d4">{paymentPoints.map((point, index) => <circle key={`payment-${index}`} cx={point.x} cy={point.y} r="3" />)}</g>
        <g fill="#075985">{disbursementPoints.map((point, index) => <circle key={`disbursement-${index}`} cx={point.x} cy={point.y} r="2.5" />)}</g>
        <g fill="#64748b" fontSize="9" textAnchor="middle">
          {points.map((point, index) => <text key={`${point.day}-${index}`} x={left + index * xStep} y={height - 8}>{weekdayLabels[point.day] || point.day}</text>)}
        </g>
      </svg>
    </div>
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
  const { language } = useLanguage();
  return (
    <div className="card-3d dashboard-surface group relative h-full overflow-hidden rounded-[26px] border border-slate-200/80 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)] sm:p-5">
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
            {language === 'ko' ? '실시간' : 'Live'}
          </span>
        </div>
      </div>
    </div>
  );
}

export function DashboardWorkspaceActions({ actions }: { actions: DashboardAction[] }) {
  const { language } = useLanguage();

  if (!actions.length) return null;

  return (
    <DashboardPanel className="mb-6 p-5">
      <div className="mb-4">
        <h2 className="text-[15px] font-semibold text-slate-900">
          {language === 'ko' ? '내 작업 공간' : 'Your workspace'}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {language === 'ko' ? '역할에 사용할 수 있는 기능' : 'Functions available for your role'}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={`${action.href}-${action.label}`}
              to={action.href}
              className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-sm"
            >
              <div className={`inline-flex rounded-xl p-2.5 ${action.tone}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">{action.label}</p>
              <p className="mt-1 text-xs text-slate-500">{action.description}</p>
            </Link>
          );
        })}
      </div>
    </DashboardPanel>
  );
}

export interface DashboardAction {
  label: string;
  description: string;
  href: string;
  permission?: PermissionKey;
  superAdminOrPermission?: PermissionKey;
  superAdminOnly?: boolean;
  icon: LucideIcon;
  tone: string;
}

export const dashboardActions: DashboardAction[] = [
  { label: 'Payments', description: 'Review incoming payments', href: '/payments', permission: 'can_manage_payments', icon: CreditCard, tone: 'bg-blue-50 text-blue-600' },
  { label: 'Payment links', description: 'Create and manage payment links', href: '/pay-by-link', permission: 'can_manage_payments', icon: Link2, tone: 'bg-cyan-50 text-cyan-600' },
  { label: 'Transactions', description: 'Search and review transaction history', href: '/transactions', permission: 'can_manage_transactions', icon: FileSpreadsheet, tone: 'bg-sky-50 text-sky-700' },
  { label: 'Disbursements', description: 'Send and track payouts', href: '/disbursements', permission: 'can_manage_disbursements', icon: Send, tone: 'bg-amber-50 text-amber-600' },
  { label: 'Wallet', description: 'Manage currency balances', href: '/wallet', permission: 'can_manage_wallet', icon: Landmark, tone: 'bg-emerald-50 text-emerald-600' },
  { label: 'Reports', description: 'Monitor payment and payout performance', href: '/reports', permission: 'can_view_reports', icon: BarChart3, tone: 'bg-indigo-50 text-indigo-600' },
  { label: 'Settings', description: 'Manage account and store settings', href: '/settings', icon: Settings, tone: 'bg-slate-100 text-slate-600' },
  { label: 'Bot settings', description: 'Configure Telegram bot operations', href: '/bot-settings', permission: 'can_manage_bot', icon: Bot, tone: 'bg-slate-100 text-slate-700' },
  { label: 'VIP', description: 'Manage your VIP network', href: '/downline-management', permission: 'can_manage_team', icon: Crown, tone: 'bg-violet-50 text-violet-600' },
  { label: 'Payment approvals', description: 'Approve or reject pending payments', href: '/payment-approvals', permission: 'can_approve_topups', icon: CheckSquare, tone: 'bg-emerald-50 text-emerald-600', superAdminOnly: true },
  { label: 'TOSS applications', description: 'Review virtual account applications', href: '/toss-account-approvals', permission: 'can_manage_wallet', icon: Landmark, tone: 'bg-orange-50 text-orange-600', superAdminOnly: true },
  { label: 'Finished contracts', description: 'Open completed payment records', href: '/payments', icon: FileCheck2, tone: 'bg-violet-50 text-violet-600', superAdminOnly: true },
];

export function getDashboardActions(permissions: Parameters<typeof hasPermission>[0], language: string = 'en') {
  const isPlatformSuperAdmin = hasSuperAdminAccess(permissions) && Boolean(permissions?.can_manage_team);
  return dashboardActions
    .filter(action => {
      const hasAccess = action.superAdminOrPermission
        ? isPlatformSuperAdmin || hasPermission(permissions, action.superAdminOrPermission)
        : (isPlatformSuperAdmin || !action.superAdminOnly)
          && (!action.permission || hasPermission(permissions, action.permission));
      return hasAccess;
    })
    .map(action => {
      if (language !== 'ko') return action;
      const localized: Record<string, { label: string; description: string }> = {
        Payments: { label: '결제', description: '입금 결제 검토' },
        'Payment links': { label: '결제 링크', description: '결제 링크 생성 및 관리' },
        Transactions: { label: '거래 내역', description: '거래 내역 검색 및 검토' },
        Disbursements: { label: '지급', description: '지급금 전송 및 추적' },
        Wallet: { label: '지갑', description: '통화 잔액 관리' },
        Reports: { label: '보고서', description: '결제 및 지급 성과 확인' },
        Settings: { label: '설정', description: '계정 및 상점 설정 관리' },
        'Bot settings': { label: '봇 설정', description: '텔레그램 봇 운영 설정' },
        VIP: { label: 'VIP', description: 'VIP 네트워크 관리' },
        'Payment approvals': { label: '결제 승인', description: '대기 중인 결제 승인 또는 거부' },
        'TOSS applications': { label: '토스 신청', description: '가상계좌 신청 검토' },
        'Finished contracts': { label: '완료 계약서', description: '완료된 결제 기록 열기' },
      };
      return { ...action, ...(localized[action.label] || {}) };
    });
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
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [range, setRange] = useState<RangeKey>(7);
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [balances, setBalances] = useState<Record<string, WalletBalanceSnapshot>>({});
  const [dataError, setDataError] = useState(false);

  const fetchData = useCallback(async (days: RangeKey) => {
    if (!user || isSuperAdmin) return false;
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

      const balanceResponses = [phpRes, usdtRes, krwRes, cnyRes];
      if (!statsRes.ok || !statsRes.data?.payments || balanceResponses.some((res) => !res.ok || !res.data)) {
        setDataError(true);
        return false;
      }

      const dailyVolumes = Array.isArray(statsRes.data.daily_volumes)
        ? statsRes.data.daily_volumes.map((day: DashboardStats['daily_volumes'][number]) => ({
            ...day,
            payments: Number.isFinite(Number(day.payments)) ? Number(day.payments) : 0,
            disbursements: Number.isFinite(Number(day.disbursements)) ? Number(day.disbursements) : 0,
          }))
        : [];
      setStats({ ...defaultStats, ...statsRes.data, daily_volumes: dailyVolumes });

      const balanceMap: Record<string, WalletBalanceSnapshot> = {};
      const addBal = (curr: string, res: { data: Record<string, number> }) => {
        balanceMap[curr] = {
          currency: curr,
          balance: Number(res.data.balance || 0),
          available_balance: Number(res.data.available_balance ?? res.data.balance ?? 0),
          pending_balance: Number(res.data.pending_balance || 0),
        };
      };
      addBal('PHP', phpRes);
      addBal('USDT', usdtRes);
      addBal('KRW', krwRes);
      addBal('CNY', cnyRes);
      setBalances(balanceMap);
      setDataError(false);
      return true;
    } catch (err) {
      console.error('Unable to refresh dashboard data', err);
      setDataError(true);
      return false;
    }
  }, [user, isSuperAdmin, collectionCurrency]);

  const { connected } = usePaymentEvents({
    enabled: !!user && !isSuperAdmin,
    onStatusChange: useCallback(() => { fetchData(range); }, [fetchData, range]),
    onWalletUpdate: useCallback(() => { fetchData(range); }, [fetchData, range]),
    pollInterval: 10000,
  });

  useEffect(() => {
    if (!user || isSuperAdmin) return;
    const load = async () => {
      setLoading(true);
      const loaded = await fetchData(range);
      if (loaded) setHasLoadedData(true);
      setLoading(false);
    };
    load();
  }, [user, isSuperAdmin, range, fetchData]);

  const retryFetchData = useCallback(async () => {
    setLoading(true);
    const loaded = await fetchData(range);
    if (loaded) setHasLoadedData(true);
    setLoading(false);
  }, [fetchData, range]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim() && hasPermission(permissions, 'can_manage_payments')) {
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
        dashboardTitle: '가맹점 요약',
        walletOverview: '통합 지갑',
        allWalletBalances: '모든 통화 잔액',
        availableBalance: '사용 가능 잔액',
        total: '합계',
        wallet: '지갑',
        viewWallet: '지갑 보기',
        connected: '연결됨',
        disconnected: '연결 끊김',
        paymentMethodDistribution: '결제 수단별 분포',
        noPaymentMethods: '표시할 결제 수단이 없습니다',
        transactionVolume: '거래량',
        dailyActivity: '선택한 기간의 일별 활동',
        dataLoadError: '대시보드 데이터를 불러오지 못했습니다. 다시 시도해 주세요.',
        retry: '다시 시도',
        paymentMethod: '결제 수단',
        count: '건',
        transactionShare: '거래 비중',
        weekdays: '월,화,수,목,금,토,일',
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
        dashboardTitle: 'Merchant overview',
        walletOverview: 'Wallet overview',
        allWalletBalances: 'Balances across currencies',
        availableBalance: 'Available balance',
        total: 'Total',
        wallet: 'Wallet',
        viewWallet: 'View wallet',
        connected: 'Connected',
        disconnected: 'Disconnected',
        paymentMethodDistribution: 'Payment method distribution',
        noPaymentMethods: 'No payment methods to display',
        transactionVolume: 'Transaction volume',
        dailyActivity: 'Daily activity across the selected period',
        dataLoadError: 'Unable to load dashboard data. Please try again.',
        retry: 'Retry',
        paymentMethod: 'Payment method',
        count: 'transactions',
        transactionShare: 'Transaction mix',
        weekdays: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
      };

  const rangeLabels = rangeLabelsByLanguage[language === 'zh' ? 'zh' : language === 'en' ? 'en' : 'ko'];
  const formatAmount = (amount: number) => fmtCurrency(amount, collectionCurrency);
  const statusLabels = language === 'ko'
    ? { Executed: '실행됨', Pending: '대기 중', Rejected: '거부됨', Expired: '만료됨' }
    : { Executed: 'Executed', Pending: 'Pending', Rejected: 'Rejected', Expired: 'Expired' };
  const currencyNames = language === 'ko'
    ? { KRW: '원화', PHP: '페소', CNY: '위안화', USDT: '테더' }
    : { KRW: 'KRW wallet', PHP: 'PHP wallet', CNY: 'CNY wallet', USDT: 'USDT wallet' };

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
    dashboardActions: getDashboardActions(permissions, language),
    stats,
    balances,
    loading,
    initialLoading: loading && !hasLoadedData,
    dataError,
    range,
    showRangeDropdown,
    searchTerm,
    connected,
    handleSearch,
    setSearchTerm,
    setRange,
    setShowRangeDropdown,
    fetchData,
    retryFetchData,
    ui,
    rangeLabels,
    formatAmount,
    statusLabels,
    currencyNames,
    orgName,
    hasAnyTransactions,
    hasLoadedData,
    paymentVolume,
    disbursementVolume,
    totalVolume,
    paymentShare,
  };
}
