import React, { useEffect, useState } from 'react';
import { client } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  RotateCcw,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  transactionId: string;
  merchant: {
    id: number;
    name: string;
    email: string;
  };
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'processing';
  type: 'payment' | 'withdrawal' | 'deposit' | 'settlement';
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  reference: string;
  description?: string;
  error?: string;
  metadata?: Record<string, any>;
}

interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  pending: {
    icon: Clock,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
  },
  processing: {
    icon: RefreshCw,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
  },
  failed: {
    icon: XCircle,
    color: 'bg-red-50 text-red-700 border-red-200',
    badge: 'bg-red-100 text-red-700',
  },
};

export function TransactionsTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Transaction['status']>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | Transaction['type']>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const ITEMS_PER_PAGE = 20;

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      // TODO: Replace with actual API call
      // const response = await client.get('/api/v1/admin/transactions', {
      //   params: {
      //     page,
      //     limit: ITEMS_PER_PAGE,
      //     status: statusFilter === 'all' ? undefined : statusFilter,
      //     type: typeFilter === 'all' ? undefined : typeFilter,
      //     search: searchQuery,
      //   },
      // });

      // Mock data for now
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          transactionId: 'TXN-20261001-001',
          merchant: { id: 1, name: 'ABC Electronics', email: 'admin@abc.com' },
          amount: 45000,
          currency: 'PHP',
          status: 'completed',
          type: 'payment',
          paymentMethod: 'BDO Bank Transfer',
          createdAt: '2026-10-01T14:30:00Z',
          updatedAt: '2026-10-01T14:35:00Z',
          reference: 'ORDER-12345',
          description: 'Payment for Order #12345',
        },
        {
          id: '2',
          transactionId: 'TXN-20261001-002',
          merchant: { id: 2, name: 'Tech Store Korea', email: 'info@techstore.kr' },
          amount: 125000,
          currency: 'KRW',
          status: 'pending',
          type: 'payment',
          paymentMethod: 'Credit Card',
          createdAt: '2026-10-01T15:20:00Z',
          updatedAt: '2026-10-01T15:20:00Z',
          reference: 'ORDER-12346',
          description: 'Payment for Order #12346',
        },
        {
          id: '3',
          transactionId: 'TXN-20261001-003',
          merchant: { id: 3, name: 'Fashion Hub', email: 'support@fashionhub.ph' },
          amount: 75000,
          currency: 'PHP',
          status: 'failed',
          type: 'payment',
          paymentMethod: 'Metrobank Transfer',
          createdAt: '2026-10-01T13:15:00Z',
          updatedAt: '2026-10-01T13:20:00Z',
          reference: 'ORDER-12344',
          description: 'Payment for Order #12344',
          error: 'Insufficient funds in merchant account',
        },
        {
          id: '4',
          transactionId: 'TXN-20261001-004',
          merchant: { id: 1, name: 'ABC Electronics', email: 'admin@abc.com' },
          amount: 500000,
          currency: 'PHP',
          status: 'completed',
          type: 'settlement',
          paymentMethod: 'Bank Settlement',
          createdAt: '2026-10-01T12:00:00Z',
          updatedAt: '2026-10-01T12:05:00Z',
          reference: 'SETTLEMENT-001',
          description: 'Daily settlement batch',
        },
        {
          id: '5',
          transactionId: 'TXN-20261001-005',
          merchant: { id: 4, name: 'Online Mart', email: 'contact@onlinemart.com' },
          amount: 200000,
          currency: 'USDT',
          status: 'processing',
          type: 'deposit',
          paymentMethod: 'Crypto Transfer',
          createdAt: '2026-10-01T10:45:00Z',
          updatedAt: '2026-10-01T10:50:00Z',
          reference: 'USDT-DEP-001',
          description: 'USDT top-up deposit',
        },
      ];

      setTransactions(mockTransactions);
      setTotal(mockTransactions.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, statusFilter, typeFilter, searchQuery]);

  const handleRetry = async (transaction: Transaction) => {
    try {
      // TODO: Call API to retry transaction
      toast.success(`Retry initiated for ${transaction.transactionId}`);
      await fetchTransactions();
    } catch (err) {
      toast.error('Failed to retry transaction');
    }
  };

  const handleCancel = async (transaction: Transaction) => {
    try {
      // TODO: Call API to cancel transaction
      toast.success(`Transaction ${transaction.transactionId} cancelled`);
      await fetchTransactions();
    } catch (err) {
      toast.error('Failed to cancel transaction');
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      !searchQuery ||
      tx.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.reference.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  if (error && !transactions.length) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Failed to load transactions</p>
              <p className="text-sm text-red-700">{error}</p>
              <Button
                onClick={fetchTransactions}
                variant="outline"
                className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by transaction ID, merchant name, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Status Filter */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-100"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                  Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-100"
                >
                  <option value="all">All Types</option>
                  <option value="payment">Payment</option>
                  <option value="settlement">Settlement</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                </select>
              </div>

              {/* Refresh Button */}
              <div className="flex items-end">
                <Button
                  onClick={fetchTransactions}
                  disabled={loading}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="border-b border-slate-200 pb-4">
          <CardTitle className="text-base">
            Transactions ({filteredTransactions.length} of {total})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && !transactions.length ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-slate-400" />
              <p className="text-slate-600">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-slate-600">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 hover:bg-transparent">
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Transaction ID
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Merchant
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Amount
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Type
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Status
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Date
                    </TableHead>
                    <TableHead className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => {
                    const StatusIcon = STATUS_CONFIG[tx.status].icon;
                    return (
                      <TableRow key={tx.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <TableCell className="px-6 py-4">
                          <p className="font-mono text-sm font-medium text-slate-900">
                            {tx.transactionId}
                          </p>
                          <p className="text-xs text-slate-500">{tx.reference}</p>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <p className="font-medium text-slate-900">{tx.merchant.name}</p>
                          <p className="text-xs text-slate-500">{tx.merchant.email}</p>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <p className="font-semibold text-slate-900">
                            {tx.amount.toLocaleString()} {tx.currency}
                          </p>
                          <p className="text-xs text-slate-500">{tx.paymentMethod}</p>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 capitalize">
                            {tx.type}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4" />
                            <span className={`text-xs font-semibold capitalize ${STATUS_CONFIG[tx.status].badge} px-2 py-1 rounded-full`}>
                              {tx.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm text-slate-600">
                          {new Date(tx.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTransaction(tx);
                                setShowDetails(true);
                              }}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {tx.status === 'failed' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRetry(tx)}
                                title="Retry transaction"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>{selectedTransaction?.transactionId}</DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">
                    Transaction ID
                  </label>
                  <p className="mt-1 font-mono text-sm font-medium text-slate-900">
                    {selectedTransaction.transactionId}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Status</label>
                  <div className="mt-1 flex items-center gap-2">
                    {React.createElement(STATUS_CONFIG[selectedTransaction.status].icon, {
                      className: 'h-4 w-4',
                    })}
                    <span className="capitalize font-medium text-slate-900">
                      {selectedTransaction.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Merchant Info */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Merchant Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-600">Name</label>
                    <p className="mt-1 font-medium text-slate-900">{selectedTransaction.merchant.name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-600">Email</label>
                    <p className="mt-1 text-sm text-slate-600">{selectedTransaction.merchant.email}</p>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-600">Amount</label>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {selectedTransaction.amount.toLocaleString()} {selectedTransaction.currency}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-600">Type</label>
                    <p className="mt-1 font-medium capitalize text-slate-900">
                      {selectedTransaction.type}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-600">
                      Payment Method
                    </label>
                    <p className="mt-1 text-sm text-slate-900">{selectedTransaction.paymentMethod}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-600">Reference</label>
                    <p className="mt-1 font-mono text-sm text-slate-900">
                      {selectedTransaction.reference}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Created:</span>
                    <span className="font-medium text-slate-900">
                      {new Date(selectedTransaction.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Updated:</span>
                    <span className="font-medium text-slate-900">
                      {new Date(selectedTransaction.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {selectedTransaction.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-semibold uppercase text-red-600 mb-1">Error</p>
                  <p className="text-sm text-red-700">{selectedTransaction.error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {selectedTransaction.status === 'failed' && (
                  <Button onClick={() => handleRetry(selectedTransaction)} className="bg-orange-600 hover:bg-orange-700">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retry Transaction
                  </Button>
                )}
                {selectedTransaction.status === 'pending' && (
                  <Button onClick={() => handleCancel(selectedTransaction)} variant="destructive">
                    Cancel Transaction
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
