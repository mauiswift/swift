import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  CreditCard,
  Link2,
  Radio,
  Send,
  ShieldCheck,
} from 'lucide-react';
import type { ReactNode } from 'react';
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
import {
  demoPaymentMethods,
  demoVolume,
  formatDemoDate,
  formatPeso,
  type DemoOrder,
} from './demoData';

const cardData = [
  { label: 'Transaction volume', value: '₱1.54M', change: '+12.8%', icon: CircleDollarSign, accent: 'text-emerald-300 bg-emerald-300/10' },
  { label: 'Disbursements', value: '₱476.2K', change: '+8.2%', icon: Send, accent: 'text-sky-300 bg-sky-300/10' },
  { label: 'Payment links', value: '148', change: '+16.4%', icon: Link2, accent: 'text-violet-300 bg-violet-300/10' },
  { label: 'OTC activity', value: '86', change: '+4.6%', icon: Banknote, accent: 'text-amber-300 bg-amber-300/10' },
  { label: 'Transactions', value: '2,481', change: '+10.1%', icon: CreditCard, accent: 'text-teal-300 bg-teal-300/10' },
  { label: 'Success rate', value: '98.42%', change: '+0.7%', icon: ShieldCheck, accent: 'text-lime-300 bg-lime-300/10' },
  { label: 'API availability', value: '99.98%', change: 'All systems go', icon: Activity, accent: 'text-cyan-300 bg-cyan-300/10' },
  { label: 'Webhook delivery', value: '99.7%', change: '24ms avg. latency', icon: Radio, accent: 'text-green-300 bg-green-300/10' },
];

const healthServices = [
  { name: 'Payments API', detail: 'Operational', latency: '42 ms' },
  { name: 'Webhook delivery', detail: 'Operational', latency: '24 ms' },
  { name: 'Xendit gateway', detail: 'Operational', latency: '118 ms' },
  { name: 'PayMongo gateway', detail: 'Operational', latency: '96 ms' },
];

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-white/[0.07] bg-[#0d1b16] ${className}`}>{children}</section>;
}

export default function DemoDashboard({
  orders,
  operatorName,
  onTransactions,
}: {
  orders: DemoOrder[];
  operatorName: string;
  onTransactions: () => void;
}) {
  const recentOrders = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.19em] text-emerald-300">Overview / Philippines</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Good morning, {operatorName.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-slate-400">Here&apos;s what&apos;s happening across your payment operations.</p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-slate-300 sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Live overview <span className="text-slate-600">·</span> Last 7 days
        </div>
      </header>

      <section aria-label="Key performance indicators" className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        {cardData.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-2xl border border-white/[0.07] bg-[#0d1b16] p-4 transition hover:border-emerald-300/20">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-400">{card.label}</p>
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.accent}`}><Icon size={16} /></span>
              </div>
              <p className="mt-5 text-2xl font-semibold tracking-tight text-white">{card.value}</p>
              <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-emerald-300"><ArrowUpRight size={13} />{card.change}<span className="ml-1 font-normal text-slate-500">vs last week</span></p>
            </article>
          );
        })}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <Panel className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">7-day transaction volume</h2>
              <p className="mt-1 text-xs text-slate-500">Payments and disbursements · PHP</p>
            </div>
            <div className="flex gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-300" /> Payments</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-teal-700" /> Disbursements</span>
            </div>
          </div>
          <div className="mt-5 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demoVolume} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#82918a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#82918a', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) => `₱${Math.round(value / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{ background: '#12231c', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#f8fafc', fontSize: 12 }}
                  formatter={(value: number) => [formatPeso(value), '']}
                  labelStyle={{ color: '#a7b5ad', marginBottom: 4 }}
                />
                <Line type="monotone" dataKey="payments" name="Payments" stroke="#54e2a1" strokeWidth={2.5} dot={{ r: 3, fill: '#54e2a1', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="disbursements" name="Disbursements" stroke="#15805e" strokeWidth={2} dot={{ r: 2.5, fill: '#15805e', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-sm font-semibold text-white">Payment method mix</h2>
          <p className="mt-1 text-xs text-slate-500">Share of successful payments</p>
          <div className="relative mt-2 h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={demoPaymentMethods} dataKey="value" nameKey="name" innerRadius={56} outerRadius={82} paddingAngle={3} stroke="none">
                  {demoPaymentMethods.map((method) => <Cell key={method.name} fill={method.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#12231c', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#f8fafc', fontSize: 12 }}
                  formatter={(value: number) => [`${value}%`, 'Volume share']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-semibold text-white">5</span>
              <span className="text-[10px] text-slate-500">methods</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {demoPaymentMethods.map((method) => (
              <div key={method.name} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="flex min-w-0 items-center gap-2 text-slate-400"><i className="h-2 w-2 shrink-0 rounded-full" style={{ background: method.color }} />{method.name}</span>
                <span className="font-medium text-slate-200">{method.value}%</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Recent transactions</h2>
              <p className="mt-1 text-xs text-slate-500">Latest activity across your merchants</p>
            </div>
            <button type="button" onClick={onTransactions} className="text-xs font-semibold text-emerald-300 hover:text-emerald-200">View all →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-slate-500">
                <tr>{['Order', 'Merchant', 'Method', 'Amount', 'Status'].map((heading) => <th key={heading} className="px-5 py-3 font-medium">{heading}</th>)}</tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-t border-white/[0.05]">
                    <td className="px-5 py-3"><span className="block font-medium text-slate-200">{order.id}</span><span className="mt-1 block text-[10px] text-slate-500">{formatDemoDate(order.createdAt)}</span></td>
                    <td className="px-5 py-3 text-slate-300">{order.merchant}</td>
                    <td className="px-5 py-3 text-slate-400">{order.method}</td>
                    <td className="px-5 py-3 font-medium text-white">{formatPeso(order.amount)}</td>
                    <td className="px-5 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${order.status === 'Paid' ? 'bg-emerald-300/10 text-emerald-300' : order.status === 'Pending' ? 'bg-amber-300/10 text-amber-200' : 'bg-rose-300/10 text-rose-300'}`}>{order.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">System health</h2>
              <p className="mt-1 text-xs text-slate-500">Core services · demo telemetry</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> All operational</span>
          </div>
          <div className="mt-4 space-y-1">
            {healthServices.map((service) => (
              <div key={service.name} className="flex items-center justify-between gap-3 border-t border-white/[0.05] py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
                  <div className="min-w-0"><p className="truncate text-xs font-medium text-slate-200">{service.name}</p><p className="mt-0.5 text-[10px] text-emerald-300/75">{service.detail}</p></div>
                </div>
                <span className="shrink-0 text-[10px] text-slate-500">{service.latency}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[10px]">
            <span className="text-slate-400">API uptime, last 30 days</span>
            <span className="font-semibold text-emerald-300">99.98%</span>
          </div>
        </Panel>
      </div>
      <p className="flex items-center gap-2 text-[10px] text-slate-600"><ArrowDownLeft size={12} /> Metrics shown are illustrative sample data for this demo workspace.</p>
    </div>
  );
}
