import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { RefreshCw, ArrowDownToLine, ArrowUpRight, BarChart3, ChevronRight, CircleDollarSign, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fmtCurrency } from '@/lib/format';
import Layout from '@/components/Layout';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import { DashboardPanel, DashboardStatCard, DashboardWorkspaceActions, LiveExchangeRatesPool, type DashboardAction } from './shared';

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

type RangeKey = 7 | 30 | 90;

type DashboardMobileProps = {
  range: RangeKey;
  stats: DashboardStats;
  balances: Record<string, { balance: number; available_balance: number }>;
  loading: boolean;
  initialLoading: boolean;
  fetchData: (range: RangeKey) => void;
  setRange: (range: RangeKey) => void;
  connected: boolean;
  user: any;
  orgName: string;
  currencyNames: Record<string, string>;
  ui: Record<string, string>;
  rangeLabels: Record<number, string>;
  formatAmount: (amount: number) => string;
  statusLabels: Record<string, string>;
  hasAnyTransactions: boolean;
  paymentVolume: number;
  disbursementVolume: number;
  totalVolume: number;
  paymentShare: number;
  dashboardActions: DashboardAction[];
  dataError: boolean;
  retryFetchData: () => void;
};

const currencyList = [
  { code: 'KRW', flag: '🇰🇷' },
  { code: 'PHP', flag: '🇵🇭' },
  { code: 'CNY', flag: '🇨🇳' },
  { code: 'USDT', flag: '🪙' },
];

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  Executed: { bg: '#ECFDF5', text: '#047857', dot: '#10B981' },
  Pending: { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' },
  Rejected: { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
  Expired: { bg: '#F8FAFC', text: '#64748B', dot: '#94A3B8' },
};

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-bold tracking-tight text-slate-900">{children}</h2>
      {action}
    </div>
  );
}

export default function DashboardMobile({
  range, stats, balances, loading, initialLoading, fetchData, setRange, connected, user, orgName, currencyNames, ui, rangeLabels,
  formatAmount, statusLabels, hasAnyTransactions, paymentVolume, disbursementVolume,
  totalVolume, paymentShare, dashboardActions, dataError, retryFetchData,
}: DashboardMobileProps) {
  const weekdayLabels = ui.weekdays.split(',');
  const weekdayIndexes: Record<string, number> = {
    Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6,
    월: 0, 화: 1, 수: 2, 목: 3, 금: 4, 토: 5, 일: 6,
  };
  const chartPoints = useMemo(() => {
    const values = (stats?.daily_volumes || []).slice(-7).map(day => day.payments + day.disbursements);
    const source = values.length ? values : [0, 0, 0, 0, 0, 0, 0];
    const max = Math.max(...source, 1);
    return source.map((value, index) => `${30 + index * 50},${78 - (value / max) * 58}`).join(' ');
  }, [stats?.daily_volumes]);
  const chartDays = (stats?.daily_volumes?.length
    ? stats.daily_volumes.slice(-7)
    : weekdayLabels.map((day) => ({ day })))
    .map((day, index) => ({ ...day, day: weekdayLabels[weekdayIndexes[day.day] ?? index] || day.day }));

  if (!user) return <Navigate to="/home" replace />;

  return (
    <Layout connected={connected}>
      <div className="mx-auto w-full max-w-2xl space-y-5 py-1 sm:py-4">
        <section className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{ui.dashboardTitle}</p>
            <h1 className="truncate text-xl font-bold tracking-tight text-slate-950">{orgName}</h1>
            <p className="mt-1 text-xs text-slate-500">{rangeLabels[range]}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchData(range)}
            disabled={loading}
            className="app-touch-target h-11 w-11 shrink-0 rounded-xl border-slate-200 bg-white p-0 text-slate-600 shadow-sm hover:bg-slate-50"
            aria-label={ui.refresh}
            title={ui.refresh}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
        </section>

        {dataError && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span>{ui.dataLoadError}</span>
            <Button type="button" variant="outline" size="sm" onClick={retryFetchData} disabled={loading}>{ui.retry}</Button>
          </div>
        )}

        <LiveExchangeRatesPool />

        <section aria-label={ui.range} className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <div className="grid grid-cols-3 gap-1" role="group">
            {([7, 30, 90] as RangeKey[]).map((option) => {
              const selected = range === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  disabled={loading}
                  onClick={() => {
                    if (!selected) setRange(option);
                  }}
                  className={`app-touch-target min-h-10 rounded-xl px-2 text-xs font-bold transition-colors ${
                    selected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {rangeLabels[option]}
                </button>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#172554] to-[#0F172A] p-5 text-white shadow-lg shadow-slate-900/10">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/15 text-blue-300">
                <WalletCards size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{ui.walletOverview}</p>
                <p className="mt-0.5 text-xs text-slate-300">{ui.allWalletBalances}</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">{connected ? ui.connected : ui.disconnected}</span>
          </div>
          <div className="divide-y divide-white/10">
            {currencyList.map(({ code, flag }) => {
              const snap = balances?.[code] || { balance: 0, available_balance: 0 };
              return (
                <div key={code} className="flex min-h-[58px] items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-center gap-2.5">
                    {code === 'USDT' ? <PaymentBrandLogo brand="USDT" size="sm" className="h-7 w-7 border-0 bg-transparent p-0 shadow-none" /> : <span className="text-lg" aria-hidden="true">{flag}</span>}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200">{currencyNames[code]} <span className="text-[10px] font-normal text-slate-500">({code})</span></p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">{ui.availableBalance} {fmtCurrency(snap.available_balance ?? snap.balance, code)}</p>
                    </div>
                  </div>
                  <p className="shrink-0 text-right font-mono text-sm font-bold text-white">
                    {initialLoading ? <span className="inline-block h-4 w-16 rounded bg-white/10" /> : fmtCurrency(snap.balance, code)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <DashboardWorkspaceActions actions={dashboardActions} />

        <section>
          <SectionTitle>{ui.performance}</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><ArrowDownToLine size={17} /></div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{ui.payments}</p>
              <p className="mt-1 truncate text-lg font-bold text-slate-900">{initialLoading ? '—' : formatAmount(stats?.payments?.total_amount ?? 0)}</p>
              <p className="mt-1 text-[11px] text-slate-500">{stats?.payments?.total_count ?? 0} {ui.transactions}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-500"><ArrowUpRight size={17} /></div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{ui.disbursements}</p>
              <p className="mt-1 truncate text-lg font-bold text-slate-900">{initialLoading ? '—' : formatAmount(stats?.disbursements?.total_amount ?? 0)}</p>
              <p className="mt-1 text-[11px] text-slate-500">{stats?.disbursements?.total_count ?? 0} {ui.transactions}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle action={<BarChart3 size={17} className="text-blue-500" />}>{ui.volumeOverview}</SectionTitle>
          <svg viewBox="0 0 360 100" className="h-24 w-full" role="img" aria-label={ui.transactionVolume}>
            <g stroke="#E2E8F0" strokeWidth="0.6"><line x1="20" x2="340" y1="20" y2="20" /><line x1="20" x2="340" y1="50" y2="50" /><line x1="20" x2="340" y1="80" y2="80" /></g>
            <polyline fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={chartPoints} />
            <g fill="#94A3B8" fontSize="8" textAnchor="middle">
              {chartDays.map((day, index) => <text key={`${day.day}-${index}`} x={30 + index * 50} y="96">{day.day}</text>)}
            </g>
          </svg>
        </section>

        {!dataError && !initialLoading && !hasAnyTransactions ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
            <CircleDollarSign className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-800">{ui.noTransactions}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{ui.noTransactionsBody}</p>
          </section>
        ) : dataError ? null : (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle>{ui.transactionShare}</SectionTitle>
            <div className="flex items-center gap-5">
              <div className="relative h-28 w-28 shrink-0 rounded-full" style={{ background: `conic-gradient(#f97316 0 ${Math.min(100, Math.max(0, paymentShare))}%, #0ea5e9 ${Math.min(100, Math.max(0, paymentShare))}% 100%)` }}>
                <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white"><span className="text-[9px] font-semibold text-slate-400">{ui.total}</span><span className="mt-1 text-xs font-bold text-slate-900">{formatAmount(totalVolume)}</span></div>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2 rounded-xl bg-orange-50 px-3 py-2"><span className="flex items-center gap-2 text-xs font-semibold text-slate-600"><span className="h-2 w-2 rounded-full bg-orange-500" />{ui.payments}</span><span className="truncate text-xs font-bold text-slate-900">{formatAmount(paymentVolume)}</span></div>
                <div className="flex items-center justify-between gap-2 rounded-xl bg-sky-50 px-3 py-2"><span className="flex items-center gap-2 text-xs font-semibold text-slate-600"><span className="h-2 w-2 rounded-full bg-sky-500" />{ui.disbursements}</span><span className="truncate text-xs font-bold text-slate-900">{formatAmount(disbursementVolume)}</span></div>
              </div>
            </div>
          </section>
        )}

        <section>
          <SectionTitle>{ui.status}</SectionTitle>
          <div className="space-y-2">
            {(stats?.status_breakdown || []).map((row) => {
              const style = statusStyles[row.status] || statusStyles.Expired;
              return (
                <div key={row.status} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: style.bg, color: style.text }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: style.dot }} />
                      {statusLabels[row.status] || row.status}
                    </span>
                    <ChevronRight size={15} className="text-slate-300" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500">{ui.payments} · {row.payment_count} {ui.transactions}</p>
                      <p className="mt-1 font-bold text-slate-900">{formatAmount(row.payment_amount)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">{ui.disbursements} · {row.disbursement_count ?? '—'} {row.disbursement_count === null ? '' : ui.transactions}</p>
                      <p className="mt-1 font-bold text-slate-900">{row.disbursement_amount === null ? '—' : formatAmount(row.disbursement_amount)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </Layout>
  );
}
