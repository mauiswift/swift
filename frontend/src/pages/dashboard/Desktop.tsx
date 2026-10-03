import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePaymentEvents } from '@/hooks/usePaymentEvents';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import {
  Search,
  ChevronDown,
  Check,
  RefreshCw,
  TrendingUp,
  WalletCards,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import { fmtCurrency } from '@/lib/format';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import { DashboardPanel, DashboardStatCard, DashboardWorkspaceActions, DailyVolumeChart, LiveExchangeRatesPool } from './shared';
import PhilippinesMerchantDashboard from './merchant/PhilippinesMerchantDashboard';

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

export default function DashboardDesktop({ handleSearch, searchTerm, setSearchTerm, range, setRange, setShowRangeDropdown, showRangeDropdown, stats, balances, loading, initialLoading, fetchData, connected, user, orgName, ui, currencyNames, rangeLabels, formatAmount, statusLabels, hasAnyTransactions, paymentVolume, disbursementVolume, totalVolume, paymentShare, dashboardActions, dataError, retryFetchData }: any) {
  if (!user) return <Navigate to="/home" replace />;

  const paymentMethods = stats.payment_methods || [];
  const methodCount = paymentMethods.reduce((total: number, method: { count: number }) => total + method.count, 0);
  const methodColors = ['#6366f1', '#06b6d4', '#f97316', '#10b981', '#e11d48'];
  let methodOffset = 0;
  const methodSegments = paymentMethods.map((method: { count: number }, index: number) => {
    const start = methodOffset;
    methodOffset += methodCount ? (method.count / methodCount) * 100 : 0;
    return `${methodColors[index % methodColors.length]} ${start}% ${methodOffset}%`;
  });

  const desktopCurrencies = [
    { code: 'KRW', flag: '🇰🇷', bg: 'bg-amber-500/10 text-amber-600', border: 'border-amber-200' },
    { code: 'PHP', flag: '🇵🇭', bg: 'bg-blue-500/10 text-blue-600', border: 'border-blue-200' },
    { code: 'USDT', flag: '🪙', bg: 'bg-emerald-500/10 text-emerald-600', border: 'border-emerald-200' },
  ];

  return (
    <Layout connected={connected}>
      <div className="mx-auto max-w-[1065px]">
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

        {dataError && (
          <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span>{ui.dataLoadError}</span>
            <Button type="button" variant="outline" size="sm" onClick={retryFetchData} disabled={loading}>{ui.retry}</Button>
          </div>
        )}

        <div className="mb-6">
          <LiveExchangeRatesPool />
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
                <div className="absolute left-0 top-full z-20 mt-2 min-w-[180px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
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

        {/* Wallet overview */}
        <div className="mb-8 hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {desktopCurrencies.map(({ code, flag, bg, border }) => {
            const snap = balances?.[code] || { balance: 0, available_balance: 0 };
            return (
              <div
                key={code}
                className="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.1)]"
              >
                <div className={`absolute inset-x-0 top-0 h-1 ${code === 'KRW' ? 'bg-amber-400' : code === 'PHP' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {code === 'USDT' ? (
                      <PaymentBrandLogo brand="USDT" size="sm" className="h-6 w-6 border-0 bg-transparent p-0 shadow-none" />
                    ) : (
                      <span className="text-xl">{flag}</span>
                    )}
                    <span className="text-xs font-semibold text-slate-700">{currencyNames[code]}</span>
                  </div>
                  <span className={`inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[10px] font-bold ${bg} ${border}`}>
                    {code}
                  </span>
                </div>

                <div className="rounded-2xl bg-slate-50/90 p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{ui.availableBalance}</p>
                  <p className="mt-1 text-[clamp(1.2rem,2vw,1.45rem)] font-bold font-mono tracking-tight text-slate-900">
                    {initialLoading ? <span className="inline-block w-24 h-6 rounded bg-slate-100" /> : fmtCurrency(snap.available_balance ?? snap.balance, code)}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {ui.total}: <span className="font-semibold text-slate-700">{fmtCurrency(snap.balance, code)}</span>
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">{ui.wallet}</span>
                  <a
                    href="/wallet"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B63FF] transition-colors hover:text-blue-700"
                  >
                    {ui.viewWallet} <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <DashboardWorkspaceActions actions={dashboardActions} />

        <PhilippinesMerchantDashboard
          stats={stats}
          balances={balances}
          connected={connected}
          loading={loading || initialLoading}
          dataError={dataError}
          ui={ui}
          rangeDays={range}
        />

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr_1.25fr]">
          <div>
            <DashboardStatCard
              label={ui.payments}
              value={formatAmount(stats?.payments?.total_amount ?? 0)}
              sub={`${stats?.payments?.total_count ?? 0} ${ui.transactions}`}
              loading={initialLoading}
              icon={TrendingUp}
            />
          </div>
          <div>
            <DashboardStatCard
              label={ui.disbursements}
              value={formatAmount(stats?.disbursements?.total_amount ?? 0)}
              sub={`${stats?.disbursements?.total_count ?? 0} ${ui.transactions}`}
              loading={initialLoading}
              icon={WalletCards}
            />
          </div>
          <div className="rounded-[26px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            <h2 className="text-[15px] font-semibold text-slate-900">{ui.paymentMethodDistribution}</h2>
            <div className="mt-3 flex items-center justify-center">
              {methodCount > 0 ? (
                <div
                  role="img"
                  aria-label={paymentMethods.map((method: { name: string; count: number }) => `${method.name}: ${method.count}`).join(', ')}
                  className="relative h-[150px] w-[150px] rounded-full"
                  style={{ background: `conic-gradient(${methodSegments.join(', ')})` }}
                >
                  <div className="absolute inset-[27px] rounded-full bg-white" />
                </div>
              ) : <p className="py-12 text-center text-xs text-slate-500">{ui.noPaymentMethods}</p>}
            </div>
            {methodCount > 0 && (
              <ul className="mt-3 space-y-1.5">
                {paymentMethods.map((method: { name: string; count: number }, index: number) => (
                  <li key={method.name} className="flex items-center justify-between gap-2 text-[11px] text-slate-600">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: methodColors[index % methodColors.length] }} />
                      <span className="truncate">{method.name}</span>
                    </span>
                    <span className="shrink-0 font-medium">{method.count} {ui.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DashboardPanel className="mb-8 p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600"><Activity size={16} /></div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">{ui.transactionVolume}</h2>
              <p className="text-[11px] text-slate-500">{ui.dailyActivity}</p>
            </div>
          </div>
          <DailyVolumeChart dailyVolumes={stats.daily_volumes} />
        </DashboardPanel>

        {!dataError && !initialLoading && !hasAnyTransactions ? (
          <div className="mb-8 flex flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-16 text-center shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
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
        ) : dataError ? null : (
          <div className="mb-8 rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
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

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
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
                {(stats?.status_breakdown || []).map((row: any) => {
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
                          <div className="text-[15px] font-semibold leading-none text-slate-400">—</div>
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
