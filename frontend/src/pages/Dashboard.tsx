import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentEvents } from '@/hooks/usePaymentEvents';
import Layout from '@/components/Layout';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import {
  Search, MoreVertical, ChevronDown, Check, FileText, RefreshCw, Download,
} from 'lucide-react';

interface DashboardStats {
  days: number;
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
const rangeLabels: Record<RangeKey, string> = { 7: 'Last 7 days', 30: 'Last 30 days', 90: 'Last 90 days' };

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  Executed: { bg: '#ccfbf1', text: '#0d9488', dot: '#14b8a6' },
  Pending:  { bg: '#dbeafe', text: '#2563eb', dot: '#3b82f6' },
  Rejected: { bg: '#fce7f3', text: '#db2777', dot: '#ec4899' },
  Expired:  { bg: '#f3f4f6', text: '#4b5563', dot: '#9ca3af' },
};

const DONUT_COLORS = ['#6366f1', '#c7d2fe', '#a5b4fc', '#818cf8'];

const fmt = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function StatCard({ label, value, sub, loading }: { label: string; value: string; sub: string; loading: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <p className="text-sm font-semibold text-foreground m-0">{label}</p>
      <p className="text-2xl md:text-3xl font-bold text-foreground my-2">
        {loading ? <span className="inline-block w-24 h-6 bg-slate-100 rounded-md" /> : value}
      </p>
      <p className="text-sm text-muted-foreground m-0">{sub}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>(7);
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async (days: RangeKey) => {
    if (!user) return;
    try {
      const res = await client.apiCall.invoke({
        url: `/api/v1/xend/dashboard-stats?days=${days}`,
        method: 'GET',
        data: {},
      });
      if (res?.data) setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  }, [user]);

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

  const orgName = (user as { organization_name?: string; name?: string } | null)?.organization_name
    || (user as { name?: string } | null)?.name
    || 'Dashboard';

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/payments?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <Layout connected={connected}>
      <div className="p-4 sm:p-6 lg:p-10">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground m-0">{orgName}</h1>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
            <Search size={16} color="#a3a6ad" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by payment ID, ref no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
              className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-foreground outline-none"
              />
            </div>

          <div className="relative">
              <button
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              className="bg-white border border-slate-200 rounded-md w-9 h-9 flex items-center justify-center"
              >
                <MoreVertical size={18} color="#535353" />
              </button>

              {showMenuDropdown && (
                <>
                <div onClick={() => setShowMenuDropdown(false)} className="fixed inset-0 z-10" />
                <div className="absolute top-full mt-1 right-0 bg-white border border-slate-200 rounded-lg shadow-md min-w-[210px] z-20 overflow-hidden">
                    <button
                      onClick={() => { setShowMenuDropdown(false); fetchData(range); }}
                    className="flex items-center gap-2 w-full text-left bg-white p-3 text-sm text-foreground hover:bg-slate-50"
                    >
                      <RefreshCw size={16} color="#535353" />
                      Refresh data
                    </button>
                    <button
                    className="flex items-center gap-2 w-full text-left bg-white p-3 text-sm text-foreground hover:bg-slate-50"
                    >
                      <Download size={16} color="#535353" />
                      Export data
                    </button>
                    <button
                      onClick={() => { setShowMenuDropdown(false); navigate('/payments'); }}
                    className="flex items-center gap-2 w-full text-left bg-white p-3 text-sm text-foreground hover:bg-slate-50"
                    >
                      <FileText size={16} color="#535353" />
                      Find by Payment Proof
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Range picker ───────────────────────────────────────── */}
        <div className="mb-6">
        <div className="relative inline-block">
            <button
              onClick={() => setShowRangeDropdown(!showRangeDropdown)}
            className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600"
            >
              <span>Range: <strong>{rangeLabels[range]}</strong></span>
              <ChevronDown size={16} color="#a3a6ad" />
            </button>

            {showRangeDropdown && (
              <>
              <div onClick={() => setShowRangeDropdown(false)} className="fixed inset-0 z-10" />
              <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-md min-w-[180px] z-20 overflow-hidden">
                  {([7, 30, 90] as RangeKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setRange(key); setShowRangeDropdown(false); }}
                    className={`flex items-center justify-between w-full text-left ${range === key ? 'bg-slate-50' : 'bg-white'} p-3 text-sm text-foreground`}
                    >
                      {rangeLabels[key]}
                      {range === key && <Check size={16} color="#0ea5e9" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Stat cards + charts grid ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div>
            <StatCard
              label="Payments"
              value={fmt(stats.payments.total_amount)}
              sub={`${stats.payments.total_count} Transactions`}
              loading={loading}
            />
          </div>
          <div>
            <StatCard
              label="Disbursements"
              value={fmt(stats.disbursements.total_amount)}
              sub={`${stats.disbursements.total_count} Transactions`}
              loading={loading}
            />
          </div>

          {/* Payment Method Distribution */}
          <div className="bg-white border rounded-lg p-5 flex flex-col lg:col-span-1">
            <p className="text-sm font-semibold text-foreground mb-2">Payment Method Distribution</p>
            {stats.payment_methods.length > 0 ? (
              <>
                <div className="flex-1 min-h-[200px]">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={stats.payment_methods}
                        dataKey="amount"
                        nameKey="name"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={2}
                      >
                        {stats.payment_methods.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => fmt(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-4 justify-center mt-2">
                  {stats.payment_methods.map((m, i) => (
                    <div key={m.name} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="w-2 h-2 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      {m.name}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: '#a3a6ad', fontSize: 14 }}>
                No data yet
              </div>
            )}
          </div>

          {/* Transaction Volume */}
          <div className="bg-white border rounded-lg p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground m-0">Transaction Volume</p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#2dd4bf' }} />
                  Payments
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#1e3a5f' }} />
                  Disbursements
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stats.daily_volumes} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#8a8a8a' }} axisLine={{ stroke: '#e9e9e9' }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#8a8a8a' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  width={80}
                />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Line type="monotone" dataKey="payments" stroke="#2dd4bf" strokeWidth={2} dot={false} name="Payments" />
                <Line type="monotone" dataKey="disbursements" stroke="#1e3a5f" strokeWidth={2} dot={false} name="Disbursements" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Transactions table ─────────────────────────────────── */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <p className="text-base font-semibold text-foreground m-0">Transactions</p>
          </div>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">STATUS</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">PAYMENTS</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">DISBURSEMENTS</th>
              </tr>
            </thead>
            <tbody>
              {stats.status_breakdown.map((row) => {
                const style = statusStyles[row.status] || statusStyles.Expired;
                const hasDisb = row.disbursement_amount !== null && row.disbursement_count !== null;
                return (
                  <tr key={row.status} className="border-t border-slate-100">
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium" style={{ background: style.bg, color: style.text }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: style.dot }} />
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="text-lg font-semibold text-foreground">{fmt(row.payment_amount)}</div>
                      <div className="text-xs text-muted-foreground mt-1">{row.payment_count} transactions</div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {hasDisb ? (
                        <>
                          <div className="text-lg font-semibold text-foreground">{fmt(row.disbursement_amount as number)}</div>
                          <div className="text-xs text-muted-foreground mt-1">{row.disbursement_count} transactions</div>
                        </>
                      ) : (
                        <>
                          <div className="text-lg font-semibold text-foreground">–</div>
                          <div className="text-xs text-muted-foreground mt-1">N/A</div>
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
    </Layout>
  );
}
