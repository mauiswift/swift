import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentEvents } from '@/hooks/usePaymentEvents';
import Layout from '@/components/Layout';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import {
  Search, MoreVertical, ChevronDown, Check, RefreshCw
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
  Executed: { bg: '#F0FDFA', text: '#0D9488', dot: '#10B981' },
  Pending:  { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' },
  Rejected: { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
  Expired:  { bg: '#F9FAFB', text: '#6B7280', dot: '#9CA3AF' },
};

const fmt = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function StatCard({ label, value, sub, loading }: { label: string; value: string; sub: string; loading: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 transition-all duration-300 h-full flex flex-col justify-between shadow-sm">
      <div>
        <p className="text-[14px] font-bold text-slate-900 mb-6">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
          {loading ? <span className="inline-block w-24 h-8 skeleton-shimmer" /> : value}
        </p>
      </div>
      <p className="text-[12px] text-slate-500 mt-2 font-bold">{sub}</p>
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
    || 'DRL Solutions';

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/payments?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <Layout connected={connected}>
      <div className="page-enter max-w-[1200px] mx-auto">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 mt-4">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900 m-0">{orgName}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-[320px] group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by payment ID, ref. no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 outline-none transition-all focus:border-slate-300"
              />
              <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3">
                <div className="h-4 w-px bg-slate-200 mr-3" />
                <button className="text-slate-400 hover:text-slate-600">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Range picker ───────────────────────────────────────── */}
        <div className="mb-10">
          <div className="relative inline-block">
            <button
              onClick={() => setShowRangeDropdown(!showRangeDropdown)}
              className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[12px] font-medium text-slate-600 shadow-sm hover:border-slate-300 transition-all h-9"
            >
              <span className="text-slate-400 font-medium">Range:</span>
              <span className="text-slate-900 font-bold">{rangeLabels[range]}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {showRangeDropdown && (
              <>
                <div onClick={() => setShowRangeDropdown(false)} className="fixed inset-0 z-10" />
                <div className="absolute top-full mt-2 left-0 bg-white border border-slate-200 rounded-xl shadow-xl min-w-[180px] z-20 overflow-hidden page-enter">
                  {( [7, 30, 90] as RangeKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setRange(key); setShowRangeDropdown(false); }}
                      className={`flex items-center justify-between w-full text-left ${range === key ? 'bg-slate-50 text-[#FF6B00]' : 'bg-transparent text-slate-600'} p-3 text-[13px] font-bold hover:bg-slate-50 transition-colors`}
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

        {/* ── Stat cards grid ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="stagger-item">
            <StatCard
              label="Payments"
              value={fmt(stats.payments.total_amount)}
              sub={`${stats.payments.total_count} Transactions`}
              loading={loading}
            />
          </div>
          <div className="stagger-item">
            <StatCard
              label="Disbursements"
              value={fmt(stats.disbursements.total_amount)}
              sub={`${stats.disbursements.total_count} Transactions`}
              loading={loading}
            />
          </div>
        </div>

        {/* ── Large Empty State Card ──────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-20 mb-10 flex flex-col items-center justify-center text-center shadow-sm stagger-item">
           <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                <polyline points="22 7 13.5 16 8.5 11 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
           </div>
           <h3 className="text-[15px] font-bold text-slate-900 mb-2">No transactions in this period</h3>
           <p className="text-[14px] text-slate-500 max-w-[320px] font-medium leading-relaxed">
             No transactions found for the selected date range. Try a different period or check back later.
           </p>
        </div>

        {/* ── Transactions table ─────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden stagger-item shadow-sm">
          <div className="px-8 py-6 border-b border-slate-100">
            <p className="text-lg font-bold tracking-tight text-slate-900 m-0">Transactions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="">
                  <th className="text-left px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">STATUS</th>
                  <th className="text-right px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">PAYMENTS</th>
                  <th className="text-right px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">DISBURSEMENTS</th>
                </tr>
              </thead>
              <tbody>
                {stats.status_breakdown.filter(r => r.status !== 'Expired').map((row) => {
                  const style = statusStyles[row.status] || statusStyles.Expired;
                  const hasDisb = row.disbursement_amount !== null && row.disbursement_count !== null;
                  return (
                    <tr key={row.status} className="border-t border-slate-50 hover:bg-slate-50/30 transition-colors">
                      <td className="py-6 px-8">
                        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ backgroundColor: style.bg, color: style.text }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.dot }} />
                          {row.status}
                        </span>
                      </td>
                      <td className="py-6 px-8 text-right">
                        <div className="text-[15px] font-bold text-slate-900 leading-none">{fmt(row.payment_amount)}</div>
                        <div className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wide">{row.payment_count} transactions</div>
                      </td>
                      <td className="py-6 px-8 text-right">
                        {hasDisb ? (
                          <>
                            <div className="text-[15px] font-bold text-slate-900 leading-none">{fmt(row.disbursement_amount as number)}</div>
                            <div className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wide">{row.disbursement_count} transactions</div>
                          </>
                        ) : (
                          <>
                            <div className="text-[15px] font-bold text-slate-900 leading-none">₱0.00</div>
                            <div className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wide">0 transactions</div>
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
      </div>
    </Layout>
  );
}
