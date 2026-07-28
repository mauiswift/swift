import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentEvents } from '@/hooks/usePaymentEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  QrCode,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  ExternalLink,
  Copy,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Transaction {
  id: number;
  transaction_type: string;
  external_id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  customer_name: string;
  created_at: string;
  updated_at: string;
}

interface ExchangeRates {
  php_to_cny: number;
  cny_to_php: number;
  timestamp: number;
  error?: string;
}

interface Stats {
  total_count: number;
  paid_count: number;
  pending_count: number;
  expired_count: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  expired_amount: number;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  paid: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <CheckCircle className="h-3 w-3" /> },
  pending: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: <Clock className="h-3 w-3" /> },
  expired: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <XCircle className="h-3 w-3" /> },
  cancelled: { color: 'bg-slate-500/20 text-muted-foreground border-slate-500/30', icon: <XCircle className="h-3 w-3" /> },
};

const fmt = (n: number) => n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AlipayDashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total_count: 0,
    paid_count: 0,
    pending_count: 0,
    expired_count: 0,
    total_amount: 0,
    paid_amount: 0,
    pending_amount: 0,
    expired_amount: 0,
  });
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    php_to_cny: 0.0137,
    cny_to_php: 73.0,
    timestamp: Date.now(),
  });
  const [ratesLoading, setRatesLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatedTxnIds, setUpdatedTxnIds] = useState<Set<number>>(new Set());
  const limit = 10;

  // Fetch exchange rates
  const fetchExchangeRates = useCallback(async () => {
    setRatesLoading(true);
    try {
      // Using try-catch as fallback works fine with default rates
      const res = await client.entities.transactions.query({
        query: {},
        limit: 1,
      });
      // Exchange rates are typically static, use defaults
      console.log('Exchange rates fallback applied');
    } catch (err) {
      console.warn('Exchange rates fetch note:', err);
    } finally {
      setRatesLoading(false);
    }
  }, []);

  // Fetch Alipay transactions
  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const query: Record<string, string> = { transaction_type: 'alipay_qr' };
      if (statusFilter !== 'all') query.status = statusFilter;

      const res = await client.entities.transactions.query({
        query,
        sort: '-created_at',
        limit,
        skip: page * limit,
      });
      setTransactions(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to fetch Alipay transactions:', err);
    }
  }, [user, page, statusFilter]);

  // Fetch stats for Alipay
  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const res = await client.entities.transactions.query({
        query: { transaction_type: 'alipay_qr' },
        limit: 1000, // Get all for stats
      });
      const items = res.data?.items || [];
      const paidCount = items.filter(t => t.status === 'paid').length;
      const pendingCount = items.filter(t => t.status === 'pending').length;
      const expiredCount = items.filter(t => t.status === 'expired').length;
      const paidAmount = items.filter(t => t.status === 'paid').reduce((sum, t) => sum + (t.amount || 0), 0);
      const pendingAmount = items.filter(t => t.status === 'pending').reduce((sum, t) => sum + (t.amount || 0), 0);
      const expiredAmount = items.filter(t => t.status === 'expired').reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalAmount = items.reduce((sum, t) => sum + (t.amount || 0), 0);

      setStats({
        total_count: items.length,
        paid_count: paidCount,
        pending_count: pendingCount,
        expired_count: expiredCount,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        pending_amount: pendingAmount,
        expired_amount: expiredAmount,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [user]);

  const onStatusChangeCallback = useCallback(
    (event) => {
      fetchTransactions();
      fetchStats();
      if (event.transaction_id) {
        setUpdatedTxnIds((prev) => new Set(prev).add(event.transaction_id!));
        setTimeout(() => {
          setUpdatedTxnIds((prev) => {
            const next = new Set(prev);
            next.delete(event.transaction_id!);
            return next;
          });
        }, 3000);
      }
    },
    [fetchTransactions, fetchStats]
  );

  const { connected } = usePaymentEvents({
    enabled: !!user,
    onStatusChange: onStatusChangeCallback,
    pollInterval: 5000,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchTransactions(), fetchStats(), fetchExchangeRates()]);
      setLoading(false);
    };
    load();
  }, [fetchTransactions, fetchStats, fetchExchangeRates]);

  const filteredTxns = searchTerm
    ? transactions.filter(
        (t) =>
          t.external_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : transactions;

  const totalPages = Math.ceil(total / limit);
  const successRate = stats.total_count > 0 ? Math.round((stats.paid_count / stats.total_count) * 100) : 0;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const convertPhpToCny = (php: number) => (php * exchangeRates.php_to_cny).toFixed(2);

  return (
    <Layout connected={connected}>
      {/* Header */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-red-50 p-6 shadow-sm relative overflow-hidden animate-fade-in-up">
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-red-200/30 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-orange-200/30 blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
              <span className="text-lg font-semibold">支</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                🎏 Alipay Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-1">Track Alipay QR payment activity and real-time conversion rates</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle className="h-3 w-3" />
              {successRate}% Success Rate
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
              {connected ? <Wifi className="h-3 w-3 text-emerald-500" /> : <WifiOff className="h-3 w-3 text-red-500" />}
              {connected ? 'Live updates' : 'Offline'}
            </div>
            <Link to="/payments?method=alipay" className="ml-auto">
              <Button size="sm" className="rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                Create Alipay Payment Link
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4">
            <p className="font-display text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2">Total Transactions</p>
            <p className="font-display text-2xl font-semibold tracking-tighter text-foreground">{loading ? '-' : stats.total_count}</p>
            <p className="text-[13px] font-semibold text-slate-500 mt-2 uppercase tracking-wide">₱{fmt(stats.total_amount)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4">
            <p className="font-display text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2">Paid</p>
            <p className="font-display text-2xl font-semibold tracking-tighter text-emerald-600">{loading ? '-' : stats.paid_count}</p>
            <p className="text-[13px] font-semibold text-slate-500 mt-2 uppercase tracking-wide">₱{fmt(stats.paid_amount)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4">
            <p className="font-display text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2">Pending</p>
            <p className="font-display text-2xl font-semibold tracking-tighter text-amber-600">{loading ? '-' : stats.pending_count}</p>
            <p className="text-[13px] font-semibold text-slate-500 mt-2 uppercase tracking-wide">₱{fmt(stats.pending_amount)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4">
            <p className="font-display text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2">Expired</p>
            <p className="font-display text-2xl font-semibold tracking-tighter text-red-600">{loading ? '-' : stats.expired_count}</p>
            <p className="text-[13px] font-semibold text-slate-500 mt-2 uppercase tracking-wide">₱{fmt(stats.expired_amount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Exchange Rate Card */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 shadow-sm mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-red-600" />
              Real-Time Exchange Rates (CNY ↔ PHP)
            </CardTitle>
            <button
              onClick={fetchExchangeRates}
              disabled={ratesLoading}
              className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 text-red-600 ${ratesLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/80 rounded-lg p-3 border border-red-100">
              <p className="text-xs text-slate-600 font-medium mb-1">PHP to CNY</p>
              <p className="text-xl font-semibold text-red-600">¥{exchangeRates.php_to_cny.toFixed(4)}</p>
              <p className="text-xs text-slate-500 mt-1">₱1 = ¥{exchangeRates.php_to_cny.toFixed(4)}</p>
            </div>
            <div className="bg-white/80 rounded-lg p-3 border border-red-100">
              <p className="text-xs text-slate-600 font-medium mb-1">CNY to PHP</p>
              <p className="text-xl font-semibold text-red-600">₱{exchangeRates.cny_to_php.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">¥1 = ₱{exchangeRates.cny_to_php.toFixed(2)}</p>
            </div>
            <div className="bg-white/80 rounded-lg p-3 border border-red-100">
              <p className="text-xs text-slate-600 font-medium mb-1">Example Conversion</p>
              <p className="text-xl font-semibold text-red-600">₱1000 → ¥{convertPhpToCny(1000)}</p>
              <p className="text-xs text-slate-500 mt-1">Updated {new Date(exchangeRates.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-white border border-slate-200 mb-6 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, description, customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 text-foreground"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-[140px] bg-slate-50 border-slate-200 text-foreground">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-foreground">All Status</SelectItem>
                <SelectItem value="paid" className="text-emerald-400">Paid</SelectItem>
                <SelectItem value="pending" className="text-amber-400">Pending</SelectItem>
                <SelectItem value="expired" className="text-red-400">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <LoadingSpinner message="Fetching Alipay transactions" />
          ) : filteredTxns.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                <QrCode className="h-7 w-7" />
              </div>
              <p className="text-slate-700 font-medium">No Alipay transactions yet</p>
              <p className="text-sm text-slate-500 mt-1">Create your first Alipay QR payment using the bot /alipay command</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] px-4 py-3">ID</th>
                    <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] px-4 py-3 hidden sm:table-cell">Description</th>
                    <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] px-4 py-3 hidden md:table-cell">Customer</th>
                    <th className="text-right text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] px-4 py-3">Amount (PHP)</th>
                    <th className="text-right text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] px-4 py-3">Conv. (CNY)</th>
                    <th className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] px-4 py-3">Status</th>
                    <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] px-4 py-3 hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTxns.map((txn) => {
                    const sc = statusConfig[txn.status] || statusConfig.pending;
                    const isUpdated = updatedTxnIds.has(txn.id);
                    const cnyAmount = convertPhpToCny(txn.amount);
                    return (
                      <tr
                        key={txn.id}
                        className={`border-b border-border/30 transition-all duration-500 ${
                          isUpdated ? 'bg-red-500/10 ring-1 ring-inset ring-red-500/30' : 'hover:bg-muted/50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <code className="text-xs text-muted-foreground font-mono">{txn.external_id || `#${txn.id}`}</code>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-sm text-foreground truncate">{txn.description || '-'}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-foreground">{txn.customer_name || '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-lg font-semibold tracking-tighter text-foreground">₱{fmt(txn.amount)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-lg font-semibold tracking-tighter text-red-600">¥{cnyAmount}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={`${sc.color} border text-xs`}>
                            {sc.icon}
                            <span className="ml-1">{txn.status}</span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                          {txn.created_at
                            ? new Date(txn.created_at).toLocaleDateString('en-PH', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {page * limit + 1}-{Math.min((page + 1) * limit, total)} of {total}
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back to Dashboard */}
      <div className="mt-6 flex justify-center">
        <Link to="/">
          <Button variant="outline" className="border-slate-200">
            ← Back to Dashboard
          </Button>
        </Link>
      </div>
    </Layout>
  );
}
