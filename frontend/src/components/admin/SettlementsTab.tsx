import React, { useEffect, useState } from 'react';
import { client } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  RefreshCw,
  Eye,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  XCircle,
  Download,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface SettlementBatch {
  id: string;
  batchId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  period: string;
  startDate: string;
  endDate: string;
  merchantCount: number;
  transactionCount: number;
  totalAmount: number;
  totalFees: number;
  netAmount: number;
  currency: string;
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
  error?: string;
  merchants: Array<{
    id: number;
    name: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
  }>;
}

interface SettlementsResponse {
  batches: SettlementBatch[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    badge: 'bg-slate-100 text-slate-700',
    color: 'bg-slate-50 border-slate-200',
  },
  processing: {
    icon: Loader2,
    badge: 'bg-blue-100 text-blue-700',
    color: 'bg-blue-50 border-blue-200',
  },
  completed: {
    icon: CheckCircle,
    badge: 'bg-emerald-100 text-emerald-700',
    color: 'bg-emerald-50 border-emerald-200',
  },
  failed: {
    icon: XCircle,
    badge: 'bg-red-100 text-red-700',
    color: 'bg-red-50 border-red-200',
  },
  partial: {
    icon: AlertCircle,
    badge: 'bg-amber-100 text-amber-700',
    color: 'bg-amber-50 border-amber-200',
  },
};

export function SettlementsTab() {
  const [batches, setBatches] = useState<SettlementBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SettlementBatch['status']>('all');
  const [selectedBatch, setSelectedBatch] = useState<SettlementBatch | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      setError('');
      // TODO: Replace with actual API call
      // const response = await client.get('/api/v1/admin/settlements', {
      //   params: {
      //     status: statusFilter === 'all' ? undefined : statusFilter,
      //     search: searchQuery,
      //   },
      // });

      // Mock data for now
      const mockBatches: SettlementBatch[] = [
        {
          id: '1',
          batchId: 'SETTLE-20261001-001',
          status: 'completed',
          period: 'Daily',
          startDate: '2026-09-30T00:00:00Z',
          endDate: '2026-09-30T23:59:59Z',
          merchantCount: 45,
          transactionCount: 342,
          totalAmount: 2450000,
          totalFees: 12250,
          netAmount: 2437750,
          currency: 'PHP',
          createdAt: '2026-10-01T00:30:00Z',
          completedAt: '2026-10-01T01:15:00Z',
          merchants: [
            { id: 1, name: 'ABC Electronics', amount: 450000, status: 'completed' },
            { id: 2, name: 'Tech Store', amount: 325000, status: 'completed' },
            { id: 3, name: 'Fashion Hub', amount: 215000, status: 'completed' },
          ],
        },
        {
          id: '2',
          batchId: 'SETTLE-20261001-002',
          status: 'processing',
          period: 'Daily',
          startDate: '2026-10-01T00:00:00Z',
          endDate: '2026-10-01T23:59:59Z',
          merchantCount: 48,
          transactionCount: 387,
          totalAmount: 3125000,
          totalFees: 15625,
          netAmount: 3109375,
          currency: 'PHP',
          createdAt: '2026-10-02T00:15:00Z',
          processedAt: '2026-10-02T00:35:00Z',
          merchants: [
            { id: 1, name: 'ABC Electronics', amount: 525000, status: 'completed' },
            { id: 4, name: 'Online Mart', amount: 625000, status: 'processing' },
            { id: 5, name: 'Digital Store', amount: 425000, status: 'completed' },
          ],
        },
        {
          id: '3',
          batchId: 'SETTLE-20260930-001',
          status: 'partial',
          period: 'Daily',
          startDate: '2026-09-29T00:00:00Z',
          endDate: '2026-09-29T23:59:59Z',
          merchantCount: 42,
          transactionCount: 298,
          totalAmount: 1875000,
          totalFees: 9375,
          netAmount: 1865625,
          currency: 'PHP',
          createdAt: '2026-09-30T00:20:00Z',
          completedAt: '2026-09-30T02:45:00Z',
          error: 'Failed to process settlement for 2 merchants (network timeout)',
          merchants: [
            { id: 1, name: 'ABC Electronics', amount: 350000, status: 'completed' },
            { id: 2, name: 'Tech Store', amount: 325000, status: 'failed' },
            { id: 6, name: 'Beauty Plus', amount: 275000, status: 'completed' },
          ],
        },
        {
          id: '4',
          batchId: 'SETTLE-20260928-002',
          status: 'failed',
          period: 'Daily',
          startDate: '2026-09-28T00:00:00Z',
          endDate: '2026-09-28T23:59:59Z',
          merchantCount: 40,
          transactionCount: 256,
          totalAmount: 1650000,
          totalFees: 8250,
          netAmount: 1641750,
          currency: 'PHP',
          createdAt: '2026-09-29T00:15:00Z',
          error: 'Database connection error - settlement batch rolled back',
          merchants: [
            { id: 1, name: 'ABC Electronics', amount: 400000, status: 'failed' },
            { id: 7, name: 'Sports World', amount: 350000, status: 'failed' },
            { id: 8, name: 'Electronics Plus', amount: 300000, status: 'failed' },
          ],
        },
        {
          id: '5',
          batchId: 'SETTLE-20261002-PENDING',
          status: 'pending',
          period: 'Daily',
          startDate: '2026-10-02T00:00:00Z',
          endDate: '2026-10-02T23:59:59Z',
          merchantCount: 52,
          transactionCount: 421,
          totalAmount: 3450000,
          totalFees: 17250,
          netAmount: 3432750,
          currency: 'PHP',
          createdAt: '2026-10-03T00:05:00Z',
          merchants: [
            { id: 1, name: 'ABC Electronics', amount: 575000, status: 'pending' },
            { id: 2, name: 'Tech Store', amount: 475000, status: 'pending' },
            { id: 4, name: 'Online Mart', amount: 725000, status: 'pending' },
          ],
        },
      ];

      setBatches(mockBatches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settlements');
      toast.error('Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [statusFilter, searchQuery]);

  const handleProcessBatch = async (batch: SettlementBatch) => {
    try {
      // TODO: Call API to process settlement batch
      toast.success(`Settlement batch ${batch.batchId} processing initiated`);
      await fetchSettlements();
    } catch (err) {
      toast.error('Failed to process settlement batch');
    }
  };

  const handleRetryBatch = async (batch: SettlementBatch) => {
    try {
      // TODO: Call API to retry settlement batch
      toast.success(`Settlement batch ${batch.batchId} retry initiated`);
      await fetchSettlements();
    } catch (err) {
      toast.error('Failed to retry settlement batch');
    }
  };

  const handleExportBatch = (batch: SettlementBatch) => {
    // TODO: Export batch to CSV/PDF
    toast.success(`Settlement batch ${batch.batchId} export started`);
  };

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      !searchQuery ||
      batch.batchId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.period.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (error && !batches.length) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Failed to load settlements</p>
              <p className="text-sm text-red-700">{error}</p>
              <Button
                onClick={fetchSettlements}
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
                placeholder="Search by batch ID or period..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-100"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="partial">Partial</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Refresh Button */}
            <Button
              onClick={fetchSettlements}
              disabled={loading}
              variant="outline"
              className="w-full gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settlements Table */}
      <Card>
        <CardHeader className="border-b border-slate-200 pb-4">
          <CardTitle className="text-base">
            Settlement Batches ({filteredBatches.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && !batches.length ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-slate-400" />
              <p className="text-slate-600">Loading settlements...</p>
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-slate-600">No settlement batches found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 hover:bg-transparent">
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Batch ID
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Period
                    </TableHead>
                    <TableHead className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Merchants
                    </TableHead>
                    <TableHead className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Transactions
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Net Amount
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Status
                    </TableHead>
                    <TableHead className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((batch) => {
                    const StatusIcon = STATUS_CONFIG[batch.status].icon;
                    return (
                      <TableRow key={batch.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <TableCell className="px-6 py-4">
                          <p className="font-mono text-sm font-medium text-slate-900">
                            {batch.batchId}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(batch.createdAt).toLocaleDateString()}
                          </p>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <p className="font-medium text-slate-900">{batch.period}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(batch.startDate).toLocaleDateString()}
                          </p>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <p className="font-semibold text-slate-900">{batch.merchantCount}</p>
                          <p className="text-xs text-slate-500">merchants</p>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <p className="font-semibold text-slate-900">{batch.transactionCount}</p>
                          <p className="text-xs text-slate-500">txns</p>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <p className="font-bold text-slate-900">
                            {batch.netAmount.toLocaleString()} {batch.currency}
                          </p>
                          <p className="text-xs text-slate-500">
                            Fees: {batch.totalFees.toLocaleString()}
                          </p>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4" />
                            <span
                              className={`text-xs font-semibold capitalize px-2 py-1 rounded-full ${STATUS_CONFIG[batch.status].badge}`}
                            >
                              {batch.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedBatch(batch);
                                setShowDetails(true);
                              }}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {batch.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleProcessBatch(batch)}
                                title="Process batch"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            {batch.status === 'failed' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRetryBatch(batch)}
                                title="Retry batch"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleExportBatch(batch)}
                              title="Export batch"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
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

      {/* Settlement Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Settlement Batch Details</DialogTitle>
            <DialogDescription>{selectedBatch?.batchId}</DialogDescription>
          </DialogHeader>

          {selectedBatch && (
            <div className="space-y-6">
              {/* Batch Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">
                    Batch ID
                  </label>
                  <p className="mt-1 font-mono text-sm font-medium text-slate-900">
                    {selectedBatch.batchId}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Status</label>
                  <div className="mt-1 flex items-center gap-2">
                    {React.createElement(STATUS_CONFIG[selectedBatch.status].icon, {
                      className: 'h-4 w-4',
                    })}
                    <span className="capitalize font-medium text-slate-900">
                      {selectedBatch.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Period */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Settlement Period</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-600">
                      From
                    </label>
                    <p className="mt-1 text-sm text-slate-900">
                      {new Date(selectedBatch.startDate).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-600">To</label>
                    <p className="mt-1 text-sm text-slate-900">
                      {new Date(selectedBatch.endDate).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Settlement Summary */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Settlement Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Merchants Included:</span>
                    <span className="font-medium text-slate-900">{selectedBatch.merchantCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Transactions:</span>
                    <span className="font-medium text-slate-900">
                      {selectedBatch.transactionCount}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2">
                    <span className="text-slate-600">Gross Amount:</span>
                    <span className="font-medium text-slate-900">
                      {selectedBatch.totalAmount.toLocaleString()} {selectedBatch.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Settlement Fees:</span>
                    <span className="font-medium text-red-600">
                      -{selectedBatch.totalFees.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                    <span className="font-semibold text-slate-900">Net Amount:</span>
                    <span className="font-bold text-emerald-600">
                      {selectedBatch.netAmount.toLocaleString()} {selectedBatch.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Merchants List */}
              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Merchant Settlements</h3>
                <div className="space-y-2">
                  {selectedBatch.merchants.map((merchant, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{merchant.name}</p>
                        <p className="text-xs text-slate-500">Merchant ID: {merchant.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          {merchant.amount.toLocaleString()} PHP
                        </p>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            merchant.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : merchant.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {merchant.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {selectedBatch.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-semibold uppercase text-red-600 mb-1">Error</p>
                  <p className="text-sm text-red-700">{selectedBatch.error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {selectedBatch.status === 'pending' && (
                  <Button
                    onClick={() => handleProcessBatch(selectedBatch)}
                    className="bg-orange-600 hover:bg-orange-700 gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Process Batch
                  </Button>
                )}
                {selectedBatch.status === 'failed' && (
                  <Button
                    onClick={() => handleRetryBatch(selectedBatch)}
                    className="bg-orange-600 hover:bg-orange-700 gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry Batch
                  </Button>
                )}
                <Button
                  onClick={() => handleExportBatch(selectedBatch)}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
