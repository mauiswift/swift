import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePaymentEvents } from '@/hooks/usePaymentEvents';
import Layout from '@/components/Layout';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export default function DashboardMobile({ handleSearch, range, stats, loading, fetchData, connected, user, orgName, ui, rangeLabels, formatAmount, statusLabels, hasAnyTransactions, paymentVolume, disbursementVolume, totalVolume, paymentShare }: any) {
  if (!user) return <Navigate to="/home" replace />;

  return (
    <Layout connected={connected}>
      <div className="page-enter px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-slate-900">{orgName}</h1>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchData(range)}
              className="h-9 w-9 p-0 border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50"
              aria-label={ui.refresh}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>

          <div className="text-xs text-slate-500">
            Period: {rangeLabels[range]}
          </div>
        </div>

        {/* Stat Cards - Stacked Vertically */}
        <div className="space-y-3 mb-6">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500 mb-2">{ui.payments}</p>
            <p className="text-xl font-semibold text-slate-900 mb-1">
              {loading ? <span className="inline-block w-20 h-6 skeleton-shimmer rounded" /> : formatAmount(stats?.payments?.total_amount ?? 0)}
            </p>
            <p className="text-xs text-slate-500">{stats?.payments?.total_count ?? 0} {ui.transactions}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500 mb-2">{ui.disbursements}</p>
            <p className="text-xl font-semibold text-slate-900 mb-1">
              {loading ? <span className="inline-block w-20 h-6 skeleton-shimmer rounded" /> : formatAmount(stats?.disbursements?.total_amount ?? 0)}
            </p>
            <p className="text-xs text-slate-500">{stats?.disbursements?.total_count ?? 0} {ui.transactions}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500 mb-3">Payment Method</p>
            <div className="flex justify-center">
              <div className="relative h-[100px] w-[100px] rounded-full" style={{ background: `conic-gradient(#6366f1 0 100%)` }}>
                <div className="absolute inset-[20px] rounded-full bg-white" />
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-slate-600">
              {stats.payment_methods[0]?.name || 'QRPH P2M'}
            </p>
          </div>
        </div>

        {/* Daily Volume Chart - Simplified */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900 mb-3">Transaction Volume</p>
          <svg viewBox="0 0 400 100" className="h-[80px] w-full" role="img" aria-label="Transaction volume chart">
            <g stroke="#dbeafe" strokeWidth="0.5">
              {[25, 50, 75].map((y) => <line key={y} x1="30" x2="380" y1={y} y2={y} />)}
            </g>
            <polyline fill="none" stroke="#0f5f8f" strokeWidth="2" strokeLinecap="round" points="30,75 80,40 130,45 180,15 230,75 280,75 330,75 380,75" />
            <g fill="#64748b" fontSize="8" textAnchor="middle">
              {(stats.daily_volumes.length ? stats.daily_volumes : [{ day: 'W' }, { day: 'T' }, { day: 'F' }, { day: 'S' }, { day: 'S' }, { day: 'M' }, { day: 'T' }]).slice(0, 7).map((d, i) => (
                <text key={i} x={30 + i * 50} y="95">{d.day}</text>
              ))}
            </g>
          </svg>
        </div>

        {/* Empty State or Volume Breakdown */}
        {!loading && !hasAnyTransactions ? (
          <div className="text-center py-8 px-4 rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-sm font-medium text-slate-900 mb-1">{ui.noTransactions}</p>
            <p className="text-xs text-slate-500">{ui.noTransactionsBody}</p>
          </div>
        ) : (
          <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900 mb-4">Volume Breakdown</p>

            <div className="flex justify-center mb-4">
              <div
                className="relative flex items-center justify-center rounded-full shadow-inner"
                style={{
                  width: '140px',
                  height: '140px',
                  background: `conic-gradient(#f97316 0 ${paymentShare}%, #0ea5e9 ${paymentShare}% 100%)`
                }}
              >
                <div className="flex flex-col items-center justify-center rounded-full bg-white" style={{ width: '95px', height: '95px' }}>
                  <span className="text-[10px] font-semibold text-slate-400">{ui.dailyVolume}</span>
                  <span className="mt-1 text-lg font-semibold text-slate-900">{formatAmount(totalVolume)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  {ui.payments}
                </span>
                <span className="text-xs font-semibold text-slate-900">{formatAmount(paymentVolume)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  {ui.disbursements}
                </span>
                <span className="text-xs font-semibold text-slate-900">{formatAmount(disbursementVolume)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Status Breakdown - Cards */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900 mb-3">{ui.status} Breakdown</p>
          {(stats?.status_breakdown || []).map((row: any) => {
            const style = statusStyles[row.status] || statusStyles.Expired;
            return (
              <div key={row.status} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold" style={{ backgroundColor: style.bg, color: style.text }}>
                    <span className="h-1 w-1 rounded-full" style={{ backgroundColor: style.dot }} />
                    {statusLabels[row.status as keyof typeof statusLabels] || row.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">{ui.payments}:</span>
                    <span className="font-semibold text-slate-900">{formatAmount(row.payment_amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">{row.payment_count} {ui.transactions}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
