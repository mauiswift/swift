import { useCallback, useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowUpRight, Building2, CircleCheck, CircleX, CreditCard, Filter, QrCode, RefreshCw, Search } from 'lucide-react';

import { client } from '@/lib/api';
import { fmtCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentStatusBadge } from '@/components/PaymentStatusBadge';

type WalletBalanceSnapshot = {
  currency: string;
  balance: number;
  available_balance: number;
  pending_balance: number;
};

type DashboardStats = {
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
};

type UiStrings = Record<string, string>;

type Props = {
  stats: DashboardStats;
  balances: Record<string, WalletBalanceSnapshot>;
  connected: boolean;
  loading: boolean;
  dataError: boolean;
  ui: UiStrings;
  rangeDays: number;
};

type DeploymentData = {
  status?: string;
  services?: {
    magpie?: { configured?: boolean; healthy?: boolean; status?: string };
  };
};

type PaymentApiRecord = {
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
  external_id?: string | null;
  order_no?: string | null;
  payment_method?: string | null;
  method?: string | null;
  provider?: string | null;
};

type LedgerRow = {
  id: string;
  amount: number;
  currency: string;
  method: string;
  provider: string;
  reference: string;
  createdAt: string;
  createdTs: number;
  status: string;
  approvalStatus?: string | null;
  paymentStatus?: string | null;
  paidAt?: string | null;
};

type HealthState = 'operational' | 'degraded' | 'down' | 'unknown';

function hashToIndex(value: string, mod: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % mod;
}

function formatCompactNumber(value: number) {
  if (!Number.isFinite(value)) return '0';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}b`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return Math.round(value).toLocaleString();
}

function HealthDot({ state }: { state: HealthState }) {
  const cls = state === 'operational'
    ? 'bg-emerald-400'
    : state === 'degraded'
      ? 'bg-amber-400'
      : state === 'down'
        ? 'bg-red-400'
        : 'bg-slate-500';
  return <span className={cn('h-2 w-2 rounded-full', cls)} />;
}

function healthLabel(state: HealthState) {
  if (state === 'operational') return 'Operational';
  if (state === 'degraded') return 'Degraded';
  if (state === 'down') return 'Down';
  return 'Unknown';
}

function normalizeProvider(value: string) {
  const v = value.toLowerCase();
  if (v.includes('magpie')) return 'Magpie.im';
  if (v.includes('hitpay')) return 'HitPay';
  return 'SwiftPay';
}

function toLedgerRow(item: PaymentApiRecord): LedgerRow {
  const currency = String(item.currency || 'PHP');
  const amount = Number(item.amount || 0);
  const createdAt = item.created_at || item.updated_at || item.paid_at || new Date().toISOString();
  const createdTs = Number.isFinite(Date.parse(createdAt)) ? Date.parse(createdAt) : Date.now();
  const provider = String(item.provider || 'SwiftPay');
  const method = String(item.payment_method || item.method || 'qrph');
  const reference = String(item.external_id || item.order_no || item.title || item.id);
  return {
    id: String(item.id),
    amount,
    currency,
    provider,
    method,
    reference,
    createdAt,
    createdTs,
    status: String(item.status || 'pending'),
    approvalStatus: item.approval_status ?? null,
    paymentStatus: item.payment_status ?? null,
    paidAt: item.paid_at ?? null,
  };
}

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

export default function PhilippinesMerchantDashboard({
  stats,
  balances,
  connected,
  loading,
  dataError,
  ui,
  rangeDays,
}: Props) {
  const [deployment, setDeployment] = useState<DeploymentData | null>(null);
  const [hitpayHealth, setHitpayHealth] = useState<HealthState>('unknown');
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [ledgerQuery, setLedgerQuery] = useState('');
  const [ledgerStatus, setLedgerStatus] = useState<'all' | string>('all');
  const [ledgerSort, setLedgerSort] = useState<'created_desc' | 'created_asc' | 'amount_desc' | 'amount_asc'>('created_desc');
  const [qrOpen, setQrOpen] = useState(false);
  const [qrTerminal, setQrTerminal] = useState('POS-01');
  const [qrTitle, setQrTitle] = useState('QRPH Sale');
  const [qrReference, setQrReference] = useState('');
  const [qrAmount, setQrAmount] = useState('');
  const [qrBusy, setQrBusy] = useState(false);
  const [qrValue, setQrValue] = useState<string | null>(null);

  const refreshHealth = useCallback(async () => {
    try {
      const res = await client.get('/api/v1/health/deployment');
      if (res.ok) setDeployment(res.data as DeploymentData);
    } catch {
      // ignore
    }

    try {
      const res = await client.get('/api/v1/health/hitpay');
      if (!res.ok) {
        setHitpayHealth('unknown');
        return;
      }
      const status = String((res.data as any)?.status || 'unknown').toLowerCase();
      setHitpayHealth(status === 'healthy' || status === 'ok' ? 'operational' : status === 'degraded' ? 'degraded' : status === 'down' ? 'down' : 'unknown');
    } catch {
      setHitpayHealth('unknown');
    }
  }, []);

  const refreshLedger = useCallback(async () => {
    setLedgerLoading(true);
    try {
      const res = await client.entities.transactions.query({
        query: { transaction_type: 'payment' },
        sort: '-created_at',
        limit: 200,
      });
      const items = (res.data as any)?.items as PaymentApiRecord[] | undefined;
      if (!res.ok || !Array.isArray(items)) {
        setLedger([]);
        return;
      }
      setLedger(items.map(toLedgerRow));
    } catch {
      setLedger([]);
    } finally {
      setLedgerLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshHealth();
    const id = window.setInterval(() => void refreshHealth(), 30_000);
    return () => window.clearInterval(id);
  }, [refreshHealth]);

  useEffect(() => {
    void refreshLedger();
    const id = window.setInterval(() => void refreshLedger(), 15_000);
    return () => window.clearInterval(id);
  }, [refreshLedger]);

  const swiftpayHealth: HealthState = dataError ? 'degraded' : connected ? 'operational' : 'degraded';
  const magpieConfigured = Boolean(deployment?.services?.magpie?.configured);
  const magpieHealth: HealthState = magpieConfigured ? 'operational' : 'unknown';

  const kpiSuccessRate = useMemo(() => {
    const rows = Array.isArray(stats.status_breakdown) ? stats.status_breakdown : [];
    const total = rows.reduce((sum, r) => sum + (Number(r.payment_count) || 0), 0);
    const executed = rows.find((r) => String(r.status).toLowerCase() === 'executed')?.payment_count ?? 0;
    if (!total) return 0;
    return (Number(executed) / total) * 100;
  }, [stats.status_breakdown]);

  const avgTicket = useMemo(() => {
    const amount = Number(stats.payments?.total_amount ?? 0);
    const count = Number(stats.payments?.total_count ?? 0);
    if (!count) return 0;
    return amount / count;
  }, [stats.payments?.total_amount, stats.payments?.total_count]);

  const liquidity = useMemo(() => {
    const get = (code: string) => balances?.[code] || { balance: 0, available_balance: 0, pending_balance: 0, currency: code };
    return [
      { code: 'PHP', label: 'PHP liquidity', snap: get('PHP') },
      { code: 'USDT', label: 'USDT (TRC-20)', snap: get('USDT') },
      { code: 'KRW', label: 'KRW liquidity', snap: get('KRW') },
    ] as const;
  }, [balances]);

  const filteredLedger = useMemo(() => {
    const q = ledgerQuery.trim().toLowerCase();
    const status = ledgerStatus;
    let rows = ledger;

    if (q) {
      rows = rows.filter((row) =>
        row.id.toLowerCase().includes(q)
        || row.reference.toLowerCase().includes(q)
        || row.provider.toLowerCase().includes(q)
        || row.method.toLowerCase().includes(q)
      );
    }

    if (status !== 'all') {
      rows = rows.filter((row) => row.status === status);
    }

    const sortFn = (a: LedgerRow, b: LedgerRow) => {
      if (ledgerSort === 'created_desc') return b.createdTs - a.createdTs;
      if (ledgerSort === 'created_asc') return a.createdTs - b.createdTs;
      if (ledgerSort === 'amount_desc') return b.amount - a.amount;
      return a.amount - b.amount;
    };

    return [...rows].sort(sortFn);
  }, [ledger, ledgerQuery, ledgerSort, ledgerStatus]);

  const ledgerStatuses = useMemo(() => {
    const set = new Set<string>();
    ledger.forEach((row) => set.add(row.status));
    return Array.from(set).sort();
  }, [ledger]);

  const hourlySeries = useMemo(() => {
    const now = Date.now();
    const start = now - 24 * 60 * 60 * 1000;
    const buckets = Array.from({ length: 24 }, (_, i) => {
      const hourStart = start + i * 60 * 60 * 1000;
      const label = new Date(hourStart).toLocaleTimeString(undefined, { hour: '2-digit' });
      return { hour: label, value: 0 };
    });

    filteredLedger.forEach((row) => {
      if (row.createdTs < start || row.createdTs > now) return;
      const idx = Math.min(23, Math.max(0, Math.floor((row.createdTs - start) / (60 * 60 * 1000))));
      buckets[idx].value += row.amount;
    });

    return buckets;
  }, [filteredLedger]);

  const channelSeries = useMemo(() => {
    const map = new Map<string, number>();
    filteredLedger.forEach((row) => {
      const channel = normalizeProvider(row.provider);
      map.set(channel, (map.get(channel) || 0) + row.amount);
    });
    const items = Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    const top = items.sort((a, b) => b.value - a.value).slice(0, 3);
    const total = top.reduce((sum, it) => sum + it.value, 0) || 1;
    return top.map((it) => ({ ...it, pct: (it.value / total) * 100 }));
  }, [filteredLedger]);

  const terminals = useMemo(() => {
    const list = Array.from({ length: 8 }, (_, i) => `POS-${String(i + 1).padStart(2, '0')}`);
    const latestByTerminal: Record<string, LedgerRow | null> = Object.fromEntries(list.map((t) => [t, null]));
    filteredLedger.forEach((row) => {
      const t = list[hashToIndex(row.id, list.length)];
      const current = latestByTerminal[t];
      if (!current || row.createdTs > current.createdTs) latestByTerminal[t] = row;
    });
    return list.map((terminalId) => {
      const last = latestByTerminal[terminalId];
      const online = last ? (Date.now() - last.createdTs) < 10 * 60 * 1000 : false;
      return { terminalId, last, online };
    });
  }, [filteredLedger]);

  const handleOpenQr = useCallback((terminalId?: string) => {
    setQrValue(null);
    setQrReference('');
    setQrAmount('');
    setQrTitle('QRPH Sale');
    setQrTerminal(terminalId || 'POS-01');
    setQrOpen(true);
  }, []);

  const handleCreateQr = useCallback(async () => {
    const amount = Number(qrAmount);
    if (!qrTitle.trim() || !qrReference.trim() || (!Number.isFinite(amount) || amount <= 0)) return;

    setQrBusy(true);
    try {
      const res = await client.apiCall.invoke({
        url: '/api/v1/xend/create-qr-code',
        method: 'POST',
        data: {
          amount,
          description: `${qrTitle.trim()} · ${qrTerminal}`,
          external_id: qrReference.trim(),
          merchant_name: 'SwiftPay Philippines',
          payment_methods: ['qrph'],
        },
      });

      const value = String((res.data as any)?.qr_code_url || (res.data as any)?.qr_code || (res.data as any)?.data || qrReference.trim());
      setQrValue(value);
    } catch {
      setQrValue(null);
    } finally {
      setQrBusy(false);
    }
  }, [qrAmount, qrReference, qrTerminal, qrTitle]);

  return (
    <section className="mb-8 space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">SwiftPay Philippines · Merchant dashboard</p>
            <p className="mt-1 text-[15px] font-semibold tracking-tight text-white">
              Real-time KPIs · Hourly GTV · POS terminals · QRPH dynamic codes
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-200">PCI-DSS 4.0</Badge>
              <Badge className="border border-sky-500/30 bg-sky-500/10 text-sky-200">BSP compliant</Badge>
              <Badge className="border border-slate-600 bg-slate-800 text-slate-200">NPC aligned</Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-300">
                <HealthDot state={swiftpayHealth} />
                SwiftPay
              </div>
              <div className="mt-1 text-[11px] text-slate-400">{healthLabel(swiftpayHealth)}</div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-300">
                <HealthDot state={magpieHealth} />
                Magpie.im
              </div>
              <div className="mt-1 text-[11px] text-slate-400">{healthLabel(magpieHealth)}</div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-300">
                <HealthDot state={hitpayHealth} />
                HitPay
              </div>
              <div className="mt-1 text-[11px] text-slate-400">{healthLabel(hitpayHealth)}</div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Gross volume (range)</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{fmtCurrency(Number(stats.payments?.total_amount ?? 0), stats.currency || 'PHP')}</p>
            <p className="mt-1 text-[11px] text-slate-400">{Number(stats.payments?.total_count ?? 0)} payments · {rangeDays} days</p>
          </div>
          <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Success rate</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{kpiSuccessRate.toFixed(1)}%</p>
            <p className="mt-1 text-[11px] text-slate-400">Executed / total</p>
          </div>
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Avg ticket</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{fmtCurrency(avgTicket, stats.currency || 'PHP')}</p>
            <p className="mt-1 text-[11px] text-slate-400">Payments only</p>
          </div>
          <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">QRPH</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-white">Dynamic code</p>
              </div>
              <Button type="button" onClick={() => handleOpenQr()} className="h-10 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                <QrCode className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">Per-terminal reference ID support</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Hourly GTV (last 24h)</p>
              <p className="mt-1 text-[15px] font-semibold text-slate-900">Area chart</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-500">{ledgerLoading ? 'Refreshing…' : 'Live'}</p>
              <p className="text-[11px] font-semibold text-slate-700">{connected ? ui.connected || 'Connected' : ui.disconnected || 'Disconnected'}</p>
            </div>
          </div>

          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlySeries} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gtvFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Tooltip
                  formatter={(value: any) => fmtCurrency(Number(value || 0), stats.currency || 'PHP')}
                  labelFormatter={(label: any) => `Hour ${label}`}
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="value" stroke="#2563eb" fill="url(#gtvFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Channel volume (last 24h)</p>
              <p className="mt-1 text-[15px] font-semibold text-slate-900">Radial</p>
            </div>
          </div>

          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="30%" outerRadius="92%" data={channelSeries} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <Tooltip
                  formatter={(value: any, _name: any, ctx: any) => {
                    const pct = Number(value || 0);
                    const raw = Number(ctx?.payload?.value || 0);
                    return [`${pct.toFixed(1)}% · ${formatCompactNumber(raw)}`, 'Share'];
                  }}
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
                />
                <RadialBar background dataKey="pct" cornerRadius={12} fill="#10b981" />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 space-y-2">
            {channelSeries.length === 0 ? (
              <p className="text-xs text-slate-500">No recent volume.</p>
            ) : channelSeries.map((ch) => (
              <div key={ch.name} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-xs font-semibold text-slate-700">{ch.name}</span>
                <span className="text-xs font-semibold text-slate-900">{fmtCurrency(ch.value, stats.currency || 'PHP')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Transaction ledger</p>
              <p className="mt-1 text-[15px] font-semibold text-slate-900">Latest 12 · filter/sort</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={ledgerQuery} onChange={(e) => setLedgerQuery(e.target.value)} placeholder="Search id/ref/provider…" className="h-10 w-[240px] rounded-xl pl-9" />
              </div>
              <Select value={ledgerStatus} onValueChange={(v) => setLedgerStatus(v)}>
                <SelectTrigger className="h-10 w-[150px] rounded-xl">
                  <Filter className="mr-2 h-4 w-4 text-slate-500" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {ledgerStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={ledgerSort} onValueChange={(v) => setLedgerSort(v as any)}>
                <SelectTrigger className="h-10 w-[170px] rounded-xl">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_desc">Newest</SelectItem>
                  <SelectItem value="created_asc">Oldest</SelectItem>
                  <SelectItem value="amount_desc">Amount (high)</SelectItem>
                  <SelectItem value="amount_asc">Amount (low)</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-10 rounded-xl" onClick={() => void refreshLedger()} disabled={ledgerLoading}>
                <RefreshCw className={cn('mr-2 h-4 w-4', ledgerLoading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Payment</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Reference</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Time</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(ledgerLoading ? [] : filteredLedger).slice(0, 12).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{fmtCurrency(row.amount, row.currency)}</p>
                          <p className="truncate text-[11px] text-slate-500">{normalizeProvider(row.provider)} · {row.method}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="truncate text-xs font-semibold text-slate-700">{row.reference}</p>
                      <p className="truncate text-[11px] text-slate-400">#{row.id}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{formatTime(row.createdTs)}</td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge
                        transaction={{
                          status: row.status as any,
                          approval_status: row.approvalStatus,
                          payment_status: row.paymentStatus,
                          paid_at: row.paidAt,
                        }}
                        size="sm"
                        showDot
                      />
                    </td>
                  </tr>
                ))}
                {!ledgerLoading && filteredLedger.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">No transactions found.</td>
                  </tr>
                )}
                {ledgerLoading && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">Refreshing ledger…</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Showing 12 rows · Use Payments for full history.</p>
            <a href="/payments" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
              Open payments <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Multi-currency liquidity</p>
            <p className="mt-1 text-[15px] font-semibold text-slate-900">PHP · USDT (TRC-20) · KRW</p>

            <div className="mt-4 space-y-2">
              {liquidity.map((item) => (
                <div key={item.code} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-700">{item.label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{fmtCurrency(item.snap.available_balance ?? item.snap.balance, item.code)}</p>
                    </div>
                    <Badge variant="outline" className="rounded-full">{item.code}</Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Total: <span className="font-semibold text-slate-700">{fmtCurrency(item.snap.balance, item.code)}</span></span>
                    <span>Pending: <span className="font-semibold text-slate-700">{fmtCurrency(item.snap.pending_balance || 0, item.code)}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">POS terminals</p>
                <p className="mt-1 text-[15px] font-semibold text-slate-900">8-terminal grid</p>
              </div>
              <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => handleOpenQr()}>
                <QrCode className="mr-2 h-4 w-4" />
                QRPH
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {terminals.map((t) => (
                <button
                  key={t.terminalId}
                  type="button"
                  onClick={() => handleOpenQr(t.terminalId)}
                  className={cn(
                    'rounded-2xl border p-3 text-left transition-colors',
                    t.online ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-50/70' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800">{t.terminalId}</p>
                    {t.online ? <CircleCheck className="h-4 w-4 text-emerald-600" /> : <CircleX className="h-4 w-4 text-slate-400" />}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{t.online ? 'Online' : 'Offline'}</p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Last: <span className="font-semibold text-slate-700">{t.last ? formatTime(t.last.createdTs) : '—'}</span>
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-emerald-600" />
              QRPH dynamic code generator
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Terminal</Label>
                <Select value={qrTerminal} onValueChange={setQrTerminal}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select terminal" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 8 }, (_, i) => `POS-${String(i + 1).padStart(2, '0')}`).map((id) => (
                      <SelectItem key={id} value={id}>{id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount (PHP)</Label>
                <Input value={qrAmount} onChange={(e) => setQrAmount(e.target.value)} inputMode="decimal" placeholder="0.00" className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={qrTitle} onChange={(e) => setQrTitle(e.target.value)} className="h-11 rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label>Reference ID</Label>
              <Input value={qrReference} onChange={(e) => setQrReference(e.target.value)} placeholder="e.g. OR-2026-000123" className="h-11 rounded-xl" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800">Preview</p>
                  <p className="mt-1 text-[11px] text-slate-500">Code renders after successful creation.</p>
                </div>
                <div className="rounded-xl bg-white p-3 shadow-sm">
                  <QRCodeSVG value={qrValue || qrReference || 'swiftpay-qrph'} size={120} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="truncate">SwiftPay Philippines · {qrTerminal}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQrOpen(false)} className="h-11 rounded-xl">Close</Button>
            <Button onClick={() => void handleCreateQr()} className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700" disabled={qrBusy || !qrTitle.trim() || !qrReference.trim() || !(Number(qrAmount) > 0)}>
              {qrBusy ? 'Creating…' : 'Create QRPH'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
