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
  Plus,
  Minus,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Wallet {
  id: number;
  merchantId: number;
  merchantName: string;
  currency: string;
  balance: number;
  availableBalance: number;
  pendingBalance: number;
  isFrozen: boolean;
  lastUpdated: string;
}

const CURRENCY_SYMBOLS = {
  PHP: '₱',
  USDT: 'USDT',
  KRW: '₩',
  CNY: '¥',
};

export function WalletControlTab() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | string>('all');
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'credit' | 'debit'>('credit');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminApiService.getWallets(1, 20, {
        currency: currencyFilter === 'all' ? undefined : currencyFilter,
        search: searchQuery,
      });

      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to load wallets');
      }

      setWallets(response.data.wallets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallets');
      toast.error('Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleAdjustWallet = async () => {
    if (!selectedWallet || !adjustmentAmount || !adjustmentReason) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setAdjusting(true);
      const amount = parseFloat(adjustmentAmount);
      const response = adjustmentType === 'credit'
        ? await adminApiService.creditWallet(selectedWallet.id, amount, adjustmentReason)
        : await adminApiService.debitWallet(selectedWallet.id, amount, adjustmentReason);

      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to adjust wallet');
      }

      toast.success(
        `Wallet ${adjustmentType}ed with ${adjustmentAmount} ${selectedWallet.currency}`
      );
      setShowAdjustment(false);
      setAdjustmentAmount('');
      setAdjustmentReason('');
      await fetchWallets();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to adjust wallet');
    } finally {
      setAdjusting(false);
    }
  };

  const handleToggleFreeze = async (wallet: Wallet) => {
    try {
      const response = await adminApiService.toggleWalletFreeze(wallet.id, !wallet.isFrozen);
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to toggle freeze');
      }
      toast.success(`Wallet ${wallet.isFrozen ? 'unfrozen' : 'frozen'}`);
      await fetchWallets();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle wallet freeze');
    }
  };

  const filteredWallets = wallets.filter((wallet) => {
    const matchesSearch =
      !searchQuery ||
      wallet.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallet.merchantId.toString().includes(searchQuery);

    const matchesCurrency = currencyFilter === 'all' || wallet.currency === currencyFilter;

    return matchesSearch && matchesCurrency;
  });

  const currencies = [...new Set(wallets.map((w) => w.currency))];

  if (error && !wallets.length) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Failed to load wallets</p>
              <p className="text-sm text-red-700">{error}</p>
              <Button
                onClick={fetchWallets}
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
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by merchant name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                  Currency
                </label>
                <select
                  value={currencyFilter}
                  onChange={(e) => setCurrencyFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-100"
                >
                  <option value="all">All Currencies</option>
                  {currencies.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={fetchWallets}
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

      {/* Wallets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Merchant Wallets ({filteredWallets.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && !wallets.length ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-slate-400" />
              <p className="text-slate-600">Loading wallets...</p>
            </div>
          ) : filteredWallets.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-slate-600">No wallets found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                      Merchant
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                      Currency
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-600">
                      Balance
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-600">
                      Available
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-600">
                      Pending
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                      Status
                    </TableHead>
                    <TableHead className="px-6 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWallets.map((wallet) => (
                    <TableRow key={wallet.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <TableCell className="px-6 py-4">
                        <p className="font-medium text-slate-900">{wallet.merchantName}</p>
                        <p className="text-xs text-slate-500">ID: {wallet.merchantId}</p>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {wallet.currency}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <p className="font-bold text-slate-900 font-numeric tabular-nums">
                          {wallet.balance.toLocaleString()}
                        </p>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <p className="font-medium text-emerald-600 font-numeric tabular-nums">
                          {wallet.availableBalance.toLocaleString()}
                        </p>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <p className="font-medium text-amber-600 font-numeric tabular-nums">
                          {wallet.pendingBalance.toLocaleString()}
                        </p>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {wallet.isFrozen ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                            <span className="h-2 w-2 rounded-full bg-red-600" />
                            Frozen
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-600" />
                            Active
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedWallet(wallet);
                              setAdjustmentType('credit');
                              setShowAdjustment(true);
                            }}
                            title="Credit wallet"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedWallet(wallet);
                              setAdjustmentType('debit');
                              setShowAdjustment(true);
                            }}
                            title="Debit wallet"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleFreeze(wallet)}
                            title={wallet.isFrozen ? 'Unfreeze' : 'Freeze'}
                          >
                            {wallet.isFrozen ? (
                              <CheckCircle className="h-4 w-4 text-red-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                          </Button>
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

      {/* Adjustment Dialog */}
      <Dialog open={showAdjustment} onOpenChange={setShowAdjustment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {adjustmentType === 'credit' ? 'Credit' : 'Debit'} Wallet
            </DialogTitle>
            <DialogDescription>
              {selectedWallet?.merchantName} - {selectedWallet?.currency}
            </DialogDescription>
          </DialogHeader>

          {selectedWallet && (
            <div className="space-y-4">
              {/* Current Balance */}
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-600 mb-1">
                  Current Balance
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {selectedWallet.balance.toLocaleString()} {selectedWallet.currency}
                </p>
              </div>

              {/* Amount Input */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Amount ({selectedWallet.currency})
                </label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Reason
                </label>
                <Input
                  placeholder="e.g., Merchant refund, system adjustment"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                />
              </div>

              {/* Preview */}
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase text-blue-600 mb-2">Preview</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Current:</span>
                    <span className="font-medium text-slate-900">
                      {selectedWallet.balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      {adjustmentType === 'credit' ? 'Add' : 'Subtract'}:
                    </span>
                    <span className={`font-medium ${
                      adjustmentType === 'credit' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {adjustmentType === 'credit' ? '+' : '-'}
                      {adjustmentAmount || '0'}
                    </span>
                  </div>
                  <div className="border-t border-blue-200 pt-1 flex justify-between">
                    <span className="font-semibold text-slate-900">New Balance:</span>
                    <span className="font-bold text-slate-900">
                      {(
                        selectedWallet.balance +
                        (adjustmentType === 'credit'
                          ? parseFloat(adjustmentAmount || '0')
                          : -parseFloat(adjustmentAmount || '0'))
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={handleAdjustWallet}
                  disabled={adjusting || !adjustmentAmount}
                  className="bg-orange-600 hover:bg-orange-700 gap-2 flex-1"
                >
                  {adjusting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {adjustmentType === 'credit' ? (
                        <Plus className="h-4 w-4" />
                      ) : (
                        <Minus className="h-4 w-4" />
                      )}
                      {adjustmentType === 'credit' ? 'Credit' : 'Debit'} Wallet
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowAdjustment(false)}
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
