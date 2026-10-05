import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Banknote,
  CreditCard,
  Link2,
  RefreshCw,
  Send,
  ShieldCheck,
  Store,
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Layout from '@/components/Layout';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import { usePaymentEvents } from '@/hooks/usePaymentEvents';
import { client } from '@/lib/api';
import { fmtCurrency } from '@/lib/format';
import {
  formatTransactionDate,
  getTransactionStatus,
  getTransactionStatusLabel,
  type TransactionRecord,
} from '@/lib/transactions';
import { StatusPill } from './StatusPill';

interface StatsResponse {
  payments: { total_amount: number; total_count: number };
  disbursements: { total_amount: number; total_count: number };
  payment_links: { total_count: number };
  otc_activity: { total_count: number };
  daily_volumes: { date: string; day: string; payments: number; disbursements: number }[];
  payment_methods: { name: string; count: number; amount: number }[];
  status_breakdown: { status: string; payment_count: number; payment_amount: number }[];
}

type RangeDays = 7 | 30 | 90;
type HealthState = { ok: boolean; latencyMs: number | null } | null;

const PIE_COLORS = ['#34d399', '#2dd4bf', '#38bdf8', '#a78bfa', '#fbbf24'];

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-white/[0.07] bg-[#0d1b16] ${className}`}>{children}</section>;
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function LiveDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { collectionCurrency } = useCollectionCurrency();
  const [days, setDays] = useState<RangeDays>(7);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [recent, setRecent] = useState<TransactionRecord[]>([]);
  const [health, setHealth] = useState<HealthState>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setError('');
    try {
      const recentParams = new URLSearchParams({
        currency: collectionCurrency.toUpperCase(),
        limit: '8',
        skip: '0',
        sort: '-created_at',
      });
      const [statsRes, txRes] = await Promise.all([
        client.apiCall.invoke({
          url: `/api/v1/xend/dashboard-stats?days=${days}&currency=${collectionCurrency}`,
          method: 'GET',
          data: {},
        }),
        client.get(`/api/v1/xend/transactions?${recentParams.toString()}`),
      ]);
      if (!statsRes.ok || !statsRes.data?.payments) {
        throw new Error(statsRes.data?.detail || 'Unable to load dashboard statistics');
      }
      const recentBody = txRes.data && typeof txRes.data === 'object'
        ? txRes.data as { items?: unknown; detail?: string }
        : {};
      if (!txRes.ok) throw new Error(recentBody.detail || 'Unable to load recent transactions');
      if (!Array.isArray(recentBody.items)) throw new Error('The recent transactions response is invalid');
      setStats(statsRes.data as StatsResponse);
      setRecent(recentBody.items as TransactionRecord[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [user, days, collectionCurrency]);

  const checkHealth = useCallback(async () => {
    const started = performance.now();
    try {
      const res = await fetch('/api/v1/health', { cache: 'no-store' });
      if (!res.ok) {
        setHealth({ ok: false, latencyMs: Math.round(performance.now() - started) });
        return;
      }
      const body = await res.json() as { status?: string };
      setHealth({ ok: body.status === 'healthy', latencyMs: Math.round(performance.now() - started) });
    } catch {
      setHealth({ ok: false, latencyMs: null });
    }
  }, []);

  const { connected } = usePaymentEvents({
    enabled: !!user,
    onStatusChange: load,
    onWalletUpdate: load,
    pollInterval: 15000,
  });

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void checkHealth();
    const timer = window.setInterval(() => void checkHealth(), 30000);
    return () => window.clearInterval(timer);
  }, [checkHealth]);

  const money = useCallback((value: number) => fmtCurrency(value, collectionCurrency), [collectionCurrency]);

  const kpis = useMemo(() => {
    const bucket = (name: string) => stats?.status_breakdown.find((row) => row.status === name);
    const executed = toNumber(bucket('Executed')?.payment_count);
    const totalCount = toNumber(stats?.payments.total_count);
    const successRate = totalCount > 0 ? (executed / totalCount) * 100 : 0;
    return [
      { label: 'Transaction volume', value: money(toNumber(stats?.payments.total_amount)), sub: `${totalCount} payments`, icon: Banknote, accent: 'text-emerald-300 bg-emerald-300/10' },
      { label: 'Disbursements', value: money(toNumber(stats?.disbursements.total_amount)), sub: `${toNumber(stats?.disbursements.total_count)} payouts`, icon: Send, accent: 'text-sky-300 bg-sky-300/10' },
      { label: 'Payment links', value: String(toNumber(stats?.payment_links?.total_count)), sub: `Last ${days} days`, icon: Link2, accent: 'text-violet-300 bg-violet-300/10' },
      { label: 'OTC activity', value: String(toNumber(stats?.otc_activity?.total_count)), sub: 'Cash and over-the-counter orders', icon: Store, accent: 'text-amber-300 bg-amber-300/10' },
      { label: 'Transactions', value: String(totalCount), sub: `Last ${days} days`, icon: CreditCard, accent: 'text-teal-300 bg-teal-300/10' },
      { label: 'Success rate', value: totalCount > 0 ? `${successRate.toFixed(1)}%` : '—', sub: `Last ${days} days`, icon: ShieldCheck, accent: 'text-lime-300 bg-lime-300/10' },
      {
        label: 'API health',
        value: health ? (health.ok ? 'Operational' : 'Degraded') : 'Checking…',
        sub: health?.latencyMs != null ? `${health.latencyMs} ms response` : 'No response',
        icon: Activity,
        accent: health && !health.ok ? 'text-rose-300 bg-rose-300/10' : 'text-cyan-300 bg-cyan-300/10',
      },
      { label: 'Payment events', value: connected ? 'Connected' : 'Polling', sub: 'Realtime event stream', icon: Activity, accent: 'text-green-300 bg-green-300/10' },
    ];
  }, [stats, health, connected, days, money]);

  if (authLoading) return <AppLoadingScreen />;
  if (!user) return <Navigate to="/home" replace />;

  const operator = (user as { name?: string; email?: string }).name || (user as { email?: string }).email || 'there';
  const chartData = (stats?.daily_volumes ?? []).map((row) => ({
    ...row,
    payments: toNumber(row.payments),
    disbursements: toNumber(row.disbursements),
  }));
  const methods = stats?.payment_methods ?? [];

  return (
    <Layout connected={connected}>
      <div className="space-y-6 rounded-3xl bg-[#08120e] p-4 text-slate-100 sm:p-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.19em] text-emerald-300">Overview / {collectionCurrency}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Welcome, {operator.split(' ')[0]}</h1>
            <p className="mt-1 text-sm text-slate-400">Live figures from your payment operations.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {([7, 30, 90] as RangeDays[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDays(value)}
                aria-pressed={days === value}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${days === value ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-200' : 'border-white/[0.08] text-slate-400 hover:text-white'}`}
              >
                {value}d
              </button>
            ))}
            <button
              type="button"
              onClick={() => { void load(); void checkHealth(); }}
              aria-label="Refresh"
              className="rounded-lg border border-white/[0.08] p-2 text-slate-300 hover:text-white"
            >
              <RefreshCw size={14} />
            </button>
            <Link to="/dashboard/classic" className="text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline">Classic view</Link>
          </div>
        </header>

        {error && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            <span>{error}</span>
            <button type="button" onClick={() => void load()} className="font-semibold underline">Retry</button>
          </div>
        )}

        <section aria-label="Key performance indicators" className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
          {kpis.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.label} className="rounded-2xl border border-white/[0.07] bg-[#0d1b16] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-400">{card.label}</p>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.accent}`}><Icon size={16} /></span>
                </div>
                <p className="mt-5 break-words text-2xl font-semibold tracking-tight text-white">
                  {loading ? <span className="inline-block h-7 w-24 animate-pulse rounded bg-white/10" /> : card.value}
                </p>
                <p className="mt-2 text-[11px] text-slate-500">{card.sub}</p>
              </article>
            );
          })}
        </section>

        <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
          <Panel className="p-5">
            <h2 className="text-sm font-semibold text-white">7-day transaction volume</h2>
            <p className="mt-1 text-xs text-slate-500">Payments and disbursements · {collectionCurrency}</p>
            <div className="mt-5 h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#82918a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#82918a', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#12231c', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#f8fafc', fontSize: 12 }}
                    formatter={(value: number) => money(value)}
                  />
                  <Line type="monotone" dataKey="payments" name="Payments" stroke="#6ee7b7" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="disbursements" name="Disbursements" stroke="#0f766e" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel className="p-5">
            <h2 className="text-sm font-semibold text-white">Payment methods</h2>
            <p className="mt-1 text-xs text-slate-500">Share of payments, last {days} days</p>
            {methods.length === 0 ? (
              <p className="mt-16 text-center text-sm text-slate-500">No payments in this period.</p>
            ) : (
              <>
                <div className="mt-3 h-[190px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={methods} dataKey="count" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={3} stroke="none">
                        {methods.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#12231c', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#f8fafc', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-2 space-y-2 text-xs">
                  {methods.map((entry, index) => (
                    <li key={entry.name} className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />{entry.name}</span>
                      <span className="text-slate-500">{entry.count} · {money(entry.amount)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>
        </div>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent transactions</h2>
            <Link to="/transactions" className="flex items-center gap-1 text-xs font-medium text-emerald-300 hover:text-emerald-200">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="pb-2 font-medium">Reference</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {recent.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-500">{loading ? 'Loading…' : 'No transactions yet.'}</td></tr>
                )}
                {recent.map((tx) => {
                  const status = getTransactionStatus(tx);
                  return (
                    <tr key={tx.id} className="text-slate-300">
                      <td className="py-2.5 font-mono text-xs">{tx.external_id || `#${tx.id}`}</td>
                      <td className="py-2.5">{tx.customer_name || tx.customer_email || '—'}</td>
                      <td className="py-2.5 font-medium text-white">{fmtCurrency(toNumber(tx.amount), tx.currency || collectionCurrency)}</td>
                      <td className="py-2.5"><StatusPill status={status} label={getTransactionStatusLabel(status)} /></td>
                      <td className="py-2.5 text-xs text-slate-500">{formatTransactionDate(tx.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </Layout>
  );
}
