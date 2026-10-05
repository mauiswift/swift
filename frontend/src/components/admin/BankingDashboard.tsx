import React, { useEffect, useState } from 'react';
import { adminApiService } from '@/lib/admin-api-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
} from 'lucide-react';

interface DashboardMetrics {
  totalTransactions: number;
  totalVolume: number;
  activeTransactions: number;
  activeMerchants: number;
  pendingSettlements: number;
  successRate: number;
}

interface DashboardData {
  metrics: DashboardMetrics;
  transactionTrend: Array<{ date: string; count: number; volume: number }>;
  transactionStatus: Array<{ status: string; count: number }>;
  recentActivity: Array<{
    id: string;
    type: 'transaction' | 'settlement' | 'user_action' | 'alert';
    title: string;
    description: string;
    timestamp: string;
    status: 'success' | 'pending' | 'failed' | 'warning';
  }>;
}

const STAT_CARD_COLORS = {
  blue: 'bg-blue-50 border-blue-200 text-blue-600',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
  orange: 'bg-orange-50 border-orange-200 text-orange-600',
  purple: 'bg-purple-50 border-purple-200 text-purple-600',
  red: 'bg-red-50 border-red-200 text-red-600',
};

const TRANSACTION_STATUS_COLORS = {
  completed: '#10b981',
  pending: '#f59e0b',
  failed: '#ef4444',
};

const ACTIVITY_STATUS_COLORS = {
  success: '#10b981',
  pending: '#f59e0b',
  failed: '#ef4444',
  warning: '#f97316',
};

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  colorScheme,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  colorScheme: keyof typeof STAT_CARD_COLORS;
}) {
  return (
    <Card className={`border shadow-sm transition-all hover:shadow ${STAT_CARD_COLORS[colorScheme]}`}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">{label}</p>
            <p className="mt-2 text-2xl font-bold font-numeric tracking-tight text-slate-900">{value}</p>
            {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
          </div>
          <div className="h-10 w-10 shrink-0 rounded-xl border border-slate-200/60 bg-white/80 p-2 shadow-xs">
            {Icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BankingDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await adminApiService.getDashboard();

        if (!response.ok) {
          throw new Error(response.data?.message || 'Failed to load dashboard');
        }

        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
          <p className="mt-3 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Failed to load dashboard</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Key Metrics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Total Transactions"
            value={data.metrics.totalTransactions.toLocaleString()}
            subtext="This month"
            colorScheme="blue"
          />
          <StatCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Total Volume"
            value={`PHP ${(data.metrics.totalVolume / 1000000).toFixed(1)}M`}
            subtext="This month"
            colorScheme="emerald"
          />
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label="Active Now"
            value={data.metrics.activeTransactions}
            subtext="In progress"
            colorScheme="orange"
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Merchants"
            value={data.metrics.activeMerchants}
            subtext="Active accounts"
            colorScheme="purple"
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5" />}
            label="Success Rate"
            value={`${data.metrics.successRate}%`}
            subtext="All transactions"
            colorScheme="emerald"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Transaction Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction Trend (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.transactionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [
                    value.toLocaleString(),
                    value === data.transactionTrend[0]?.count ? 'Count' : 'Volume',
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Tx Count"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transaction Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.transactionStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.transactionStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        TRANSACTION_STATUS_COLORS[
                          entry.status.toLowerCase() as keyof typeof TRANSACTION_STATUS_COLORS
                        ] || '#8884d8'
                      }
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 rounded-lg border border-slate-100 p-4 hover:bg-slate-50"
              >
                <div
                  className="mt-0.5 h-2 w-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: ACTIVITY_STATUS_COLORS[activity.status],
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{activity.title}</p>
                  <p className="text-sm text-slate-600">{activity.description}</p>
                  <p className="mt-1 text-xs text-slate-500">{activity.timestamp}</p>
                </div>
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      {
                        success: '#d1fae5',
                        pending: '#fef3c7',
                        failed: '#fee2e2',
                        warning: '#fed7aa',
                      }[activity.status] || '#f1f5f9',
                    color:
                      {
                        success: '#065f46',
                        pending: '#78350f',
                        failed: '#7f1d1d',
                        warning: '#92400e',
                      }[activity.status] || '#475569',
                  }}
                >
                  {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-900">API Status</p>
              <p className="mt-2 flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <span className="text-emerald-700">Operational</span>
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-900">Database</p>
              <p className="mt-2 flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <span className="text-emerald-700">Healthy</span>
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-900">Payment Gateway</p>
              <p className="mt-2 flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <span className="text-emerald-700">Connected</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
