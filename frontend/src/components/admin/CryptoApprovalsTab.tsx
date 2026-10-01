import React, { useEffect, useState } from 'react';
import { adminApiService } from '@/lib/admin-api-service';
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
  RefreshCw,
  Check,
  X,
  Eye,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface CryptoRequest {
  id: number;
  requestId: string;
  merchantId: number;
  merchantName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  network: string;
  txHash?: string;
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
  notes?: string;
  rejectionReason?: string;
}

export function CryptoApprovalsTab() {
  const [requests, setRequests] = useState<CryptoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CryptoRequest['status']>('all');
  const [selectedRequest, setSelectedRequest] = useState<CryptoRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminApiService.getCryptoRequests(1, 20, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery,
      });

      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to load crypto requests');
      }

      setRequests(response.data.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load crypto requests');
      toast.error('Failed to load crypto requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      const response = await adminApiService.approveCryptoRequest(selectedRequest.id, approvalNotes);
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to approve request');
      }

      toast.success(`Crypto request ${selectedRequest.requestId} approved`);
      setShowApprovalDialog(false);
      setApprovalNotes('');
      await fetchRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      const response = await adminApiService.rejectCryptoRequest(selectedRequest.id, reason);
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to reject request');
      }

      toast.success(`Crypto request ${selectedRequest.requestId} rejected`);
      setShowDetails(false);
      await fetchRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      !searchQuery ||
      req.requestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.merchantName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  };

  if (error && !requests.length) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Failed to load crypto requests</p>
              <p className="text-sm text-red-700">{error}</p>
              <Button
                onClick={fetchRequests}
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
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Pending</p>
            <p className="mt-2 text-2xl font-bold text-amber-600">
              {requests.filter((r) => r.status === 'pending').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Approved</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">
              {requests.filter((r) => r.status === 'approved').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Completed</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {requests.filter((r) => r.status === 'completed').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Total USDT</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {requests.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by request ID or merchant name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
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
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={fetchRequests}
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

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Crypto Requests ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && !requests.length ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-slate-400" />
              <p className="text-slate-600">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-slate-600">No crypto requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                      Request ID
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                      Merchant
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-600">
                      Amount
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                      Network
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                      Status
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                      Date
                    </TableHead>
                    <TableHead className="px-6 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((req) => (
                    <TableRow key={req.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <TableCell className="px-6 py-4">
                        <p className="font-mono text-sm font-medium text-slate-900">
                          {req.requestId}
                        </p>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <p className="font-medium text-slate-900">{req.merchantName}</p>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <p className="font-bold text-slate-900">{req.amount} USDT</p>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {req.network}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusColors[req.status]}`}>
                          {req.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-slate-600">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedRequest(req);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {req.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setShowApprovalDialog(true);
                                }}
                              >
                                <Check className="h-4 w-4 text-emerald-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReject('User requested')}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>{selectedRequest?.requestId}</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-600 mb-1">
                  Amount
                </p>
                <p className="text-3xl font-bold text-slate-900">{selectedRequest.amount} USDT</p>
              </div>

              <div className="grid gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Merchant</label>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {selectedRequest.merchantName}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Network</label>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {selectedRequest.network}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Status</label>
                  <p className="mt-1 text-sm font-medium capitalize text-slate-900">
                    {selectedRequest.status}
                  </p>
                </div>
                {selectedRequest.notes && (
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-600">
                      Notes
                    </label>
                    <p className="mt-1 text-sm text-slate-700">{selectedRequest.notes}</p>
                  </div>
                )}
                {selectedRequest.txHash && (
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-600">
                      TX Hash
                    </label>
                    <p className="mt-1 font-mono text-xs text-slate-600 break-all">
                      {selectedRequest.txHash}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-4">
                <p className="text-xs text-slate-500">
                  Created: {new Date(selectedRequest.createdAt).toLocaleString()}
                </p>
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowApprovalDialog(true)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject('Rejected by admin')}
                    variant="destructive"
                    className="flex-1"
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Crypto Request</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
                <p className="text-sm font-medium text-emerald-900">
                  Approve {selectedRequest.amount} USDT for {selectedRequest.merchantName}?
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Approval Notes (Optional)
                </label>
                <Input
                  placeholder="Add any notes for this approval..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowApprovalDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
