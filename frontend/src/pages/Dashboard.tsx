import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentEvents } from '@/hooks/usePaymentEvents';
import Layout from '@/components/Layout';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import {
  Search,
  MoreVertical,
  ChevronDown,
  Check,
  RefreshCw,
  TrendingUp,
  WalletCards,
  Landmark,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';
import { fmtCurrencyPhp as fmt } from '@/lib/format';

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

function StatCard({ label, value, sub, loading, icon: Icon, accentClass }: { label: string; value: string; sub: string; loading: boolean; icon: LucideIcon; accentClass: string; }) {
  return (
    <div className="card-3d group relative h-full overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
      <div className={`absolute inset-x-0 top-0 h-1 ${accentClass}`} />
      <div className="card-3d-inner flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
            <p className="mt-5 text-[28px] font-semibold tracking-[-0.04em] text-slate-900 leading-none">
              {loading ? <span className="inline-block w-24 h-8 skeleton-shimmer rounded-lg" /> : value}
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
            Live
          </span>
        </div>
      </div>
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
      if (res.ok && res.data && res.data.payments) {
        setStats(res.data);
      } else {
        console.error('Incomplete or failed dashboard stats:', res);
      }
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
      <div className="page-enter mx-auto max-w-[1200px]">
        <div className="mb-8 flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-700">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              Overview
            </span>
            <h1 className="m-0 text-[30px] font-semibold tracking-[-0.05em] text-slate-900">{orgName}</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchData(range)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:text-slate-900"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>

            <div className="relative w-full sm:w-[320px] group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by payment ID, ref. no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full rounded-xl border border-slate-200 bg-white/90 py-2.5 pl-10 pr-11 text-[13px] text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-slate-300 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <div className="mr-3 h-4 w-px bg-slate-200" />
                <button type="button" className="text-slate-400 transition-colors hover:text-slate-600">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="relative inline-block">
            <button
              onClick={() => setShowRangeDropdown(!showRangeDropdown)}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 text-[12px] font-medium text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:text-slate-900"
            >
              <span className="text-slate-400">Range:</span>
              <span className="font-semibold text-slate-900">{rangeLabels[range]}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {showRangeDropdown && (
              <>
                <div onClick={() => setShowRangeDropdown(false)} className="fixed inset-0 z-10" />
                <div className="absolute left-0 top-full z-20 mt-2 min-w-[180px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.12)] page-enter">
                  {([7, 30, 90] as RangeKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setRange(key); setShowRangeDropdown(false); }}
                      className={`flex w-full items-center justify-between p-3 text-left text-[13px] font-semibold transition-colors ${range === key ? 'bg-slate-50 text-[#FF6B00]' : 'bg-transparent text-slate-600 hover:bg-slate-50'}`}
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

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="stagger-item">
            <StatCard
              label="Payments"
              value={fmt(stats?.payments?.total_amount ?? 0)}
              sub={`${stats?.payments?.total_count ?? 0} Transactions`}
              loading={loading}
              icon={TrendingUp}
              accentClass="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300"
            />
          </div>
          <div className="stagger-item">
            <StatCard
              label="Disbursements"
              value={fmt(stats?.disbursements?.total_amount ?? 0)}
              sub={`${stats?.disbursements?.total_count ?? 0} Transactions`}
              loading={loading}
              icon={WalletCards}
              accentClass="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500"
            />
          </div>
        </div>

        <div className="mb-8 flex items-center justify-between rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] stagger-item">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-300/30">
              <Landmark size={24} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Performance</p>
              <h2 className="mt-1 text-[20px] font-semibold tracking-[-0.04em] text-slate-900">Volume overview</h2>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Healthy flow
          </div>
        </div>

        <div className="mb-8 flex flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-16 text-center shadow-[0_18px_40px_rgba(15,23,42,0.04)] stagger-item">
           <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300 shadow-inner">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                <polyline points="22 7 13.5 16 8.5 11 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
           </div>
           <h3 className="mb-2 text-[15px] font-semibold text-slate-900">No transactions in this period</h3>
           <p className="max-w-[360px] text-[14px] font-medium leading-relaxed text-slate-500">
             No transactions found for the selected date range. Try a different period or check back later.
           </p>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.04)] stagger-item">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
            <p className="m-0 text-lg font-semibold tracking-[-0.04em] text-slate-900">Transactions</p>
            <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {stats?.status_breakdown?.length ?? 0} buckets
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:px-8">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:px-8">Payments</th>
                  <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:px-8">Disbursements</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.status_breakdown || []).map((row) => {
                  const style = statusStyles[row.status] || statusStyles.Expired;
                  const hasDisb = row.disbursement_amount !== null && row.disbursement_count !== null;
                  return (
                    <tr key={row.status} className="border-t border-slate-100 transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-5 sm:px-8">
                        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ backgroundColor: style.bg, color: style.text }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: style.dot }} />
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right sm:px-8">
                        <div className="text-[15px] font-semibold text-slate-900 leading-none">{fmt(row.payment_amount)}</div>
                        <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">{row.payment_count} transactions</div>
                      </td>
                      <td className="px-6 py-5 text-right sm:px-8">
                        {hasDisb ? (
                          <>
                            <div className="text-[15px] font-semibold text-slate-900 leading-none">{fmt(row.disbursement_amount as number)}</div>
                            <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">{row.disbursement_count} transactions</div>
                          </>
                        ) : (
                          <>
                            <div className="text-[15px] font-semibold text-slate-900 leading-none">₱0.00</div>
                            <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">0 transactions</div>
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
