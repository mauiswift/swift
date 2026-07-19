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
    <div style={{ background: '#fff', border: '1px solid #e9e9e9', borderRadius: 12, padding: '20px 24px' }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#191919', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 700, color: '#191919', margin: '10px 0 4px' }}>
        {loading ? <span style={{ display: 'inline-block', width: 90, height: 26, background: '#f0f0f0', borderRadius: 6 }} /> : value}
      </p>
      <p style={{ fontSize: 13, color: '#8a8a8a', margin: 0 }}>{sub}</p>
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
          <h1 style={{ fontSize: 28, fontWeight: 600, color: '#191919', margin: 0 }}>{orgName}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="relative w-full sm:w-72">
              <Search size={16} color="#a3a6ad" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search by payment ID, ref no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
                style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #e9e9e9', borderRadius: 8, fontSize: 14, color: '#191919', fontFamily: 'inherit', outline: 'none' }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e9e9e9', borderRadius: 8, width: 36, height: 36, cursor: 'pointer' }}
              >
                <MoreVertical size={18} color="#535353" />
              </button>

              {showMenuDropdown && (
                <>
                  <div onClick={() => setShowMenuDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: '#fff', border: '1px solid #e9e9e9', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: 210, zIndex: 20, overflow: 'hidden' }}>
                    <button
                      onClick={() => { setShowMenuDropdown(false); fetchData(range); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: '#fff', border: 'none', padding: '12px 16px', fontSize: 14, color: '#191919', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <RefreshCw size={16} color="#535353" />
                      Refresh data
                    </button>
                    <button
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: '#fff', border: 'none', padding: '12px 16px', fontSize: 14, color: '#191919', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <Download size={16} color="#535353" />
                      Export data
                    </button>
                    <button
                      onClick={() => { setShowMenuDropdown(false); navigate('/payments'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: '#fff', border: 'none', padding: '12px 16px', fontSize: 14, color: '#191919', cursor: 'pointer', fontFamily: 'inherit' }}
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
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              onClick={() => setShowRangeDropdown(!showRangeDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e9e9e9', borderRadius: 8, padding: '8px 14px', fontSize: 14, color: '#535353', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <span>Range: <strong>{rangeLabels[range]}</strong></span>
              <ChevronDown size={16} color="#a3a6ad" />
            </button>

            {showRangeDropdown && (
              <>
                <div onClick={() => setShowRangeDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, background: '#fff', border: '1px solid #e9e9e9', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: 180, zIndex: 20, overflow: 'hidden' }}>
                  {([7, 30, 90] as RangeKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setRange(key); setShowRangeDropdown(false); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left', background: range === key ? '#f5f5f5' : '#fff', border: 'none', padding: '10px 16px', fontSize: 14, color: '#191919', cursor: 'pointer', fontFamily: 'inherit' }}
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
            <p style={{ fontSize: 15, fontWeight: 600, color: '#191919', margin: '0 0 8px' }}>Payment Method Distribution</p>
            {stats.payment_methods.length > 0 ? (
              <>
                <div style={{ flex: 1, minHeight: 200 }}>
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginTop: 8 }}>
                  {stats.payment_methods.map((m, i) => (
                    <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#535353' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#191919', margin: 0 }}>Transaction Volume</p>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#535353' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2dd4bf' }} />
                  Payments
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#535353' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1e3a5f' }} />
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
        <div style={{ background: '#fff', border: '1px solid #e9e9e9', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #e9e9e9' }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#191919', margin: 0 }}>Transactions</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#a3a6ad', letterSpacing: '0.5px' }}>STATUS</th>
                <th style={{ textAlign: 'right', padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#a3a6ad', letterSpacing: '0.5px' }}>PAYMENTS</th>
                <th style={{ textAlign: 'right', padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#a3a6ad', letterSpacing: '0.5px' }}>DISBURSEMENTS</th>
              </tr>
            </thead>
            <tbody>
              {stats.status_breakdown.map((row) => {
                const style = statusStyles[row.status] || statusStyles.Expired;
                const hasDisb = row.disbursement_amount !== null && row.disbursement_count !== null;
                return (
                  <tr key={row.status} style={{ borderTop: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: style.bg, color: style.text, borderRadius: 999, padding: '4px 12px', fontSize: 13, fontWeight: 500 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: style.dot }} />
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#191919' }}>{fmt(row.payment_amount)}</div>
                      <div style={{ fontSize: 12, color: '#a3a6ad', marginTop: 2 }}>{row.payment_count} transactions</div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      {hasDisb ? (
                        <>
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#191919' }}>{fmt(row.disbursement_amount as number)}</div>
                          <div style={{ fontSize: 12, color: '#a3a6ad', marginTop: 2 }}>{row.disbursement_count} transactions</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#191919' }}>–</div>
                          <div style={{ fontSize: 12, color: '#a3a6ad', marginTop: 2 }}>N/A</div>
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
