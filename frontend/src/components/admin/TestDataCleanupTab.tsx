import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { client } from '@/lib/api';

interface TestDataPreview {
  eligible_test_merchants: number;
  payment_transactions: number;
  disbursements: number;
  wallet_transactions: number;
  refunds: number;
  deposit_receipts: number;
}

const emptyPreview: TestDataPreview = {
  eligible_test_merchants: 0,
  payment_transactions: 0,
  disbursements: 0,
  wallet_transactions: 0,
  refunds: 0,
  deposit_receipts: 0,
};

const confirmationPhrase = 'CLEAR TEST RECORDS';

function parsePreview(data: unknown): TestDataPreview {
  if (typeof data !== 'object' || data === null) {
    throw new Error('The test-record preview response was invalid.');
  }
  const counts = data as Record<string, unknown>;
  const eligibleTestMerchants = counts.eligible_test_merchants;
  const paymentTransactions = counts.payment_transactions;
  const disbursements = counts.disbursements;
  const walletTransactions = counts.wallet_transactions;
  const refunds = counts.refunds;
  const depositReceipts = counts.deposit_receipts;
  if (
    !Number.isInteger(eligibleTestMerchants) ||
    !Number.isInteger(paymentTransactions) ||
    !Number.isInteger(disbursements) ||
    !Number.isInteger(walletTransactions) ||
    !Number.isInteger(refunds) ||
    !Number.isInteger(depositReceipts) ||
    Number(eligibleTestMerchants) < 0 ||
    Number(paymentTransactions) < 0 ||
    Number(disbursements) < 0 ||
    Number(walletTransactions) < 0 ||
    Number(refunds) < 0 ||
    Number(depositReceipts) < 0
  ) {
    throw new Error('The test-record preview response was invalid.');
  }
  return {
    eligible_test_merchants: Number(eligibleTestMerchants),
    payment_transactions: Number(paymentTransactions),
    disbursements: Number(disbursements),
    wallet_transactions: Number(walletTransactions),
    refunds: Number(refunds),
    deposit_receipts: Number(depositReceipts),
  };
}

function parseClearResult(data: unknown): Omit<TestDataPreview, 'eligible_test_merchants'> {
  if (typeof data !== 'object' || data === null) {
    throw new Error('The test-record deletion response was invalid.');
  }
  const result = data as Record<string, unknown>;
  const paymentTransactions = result.payment_transactions;
  const disbursements = result.disbursements;
  const walletTransactions = result.wallet_transactions;
  const refunds = result.refunds;
  const depositReceipts = result.deposit_receipts;
  if (
    result.success !== true ||
    !Number.isInteger(paymentTransactions) ||
    !Number.isInteger(disbursements) ||
    !Number.isInteger(walletTransactions) ||
    !Number.isInteger(refunds) ||
    !Number.isInteger(depositReceipts) ||
    Number(paymentTransactions) < 0 ||
    Number(disbursements) < 0 ||
    Number(walletTransactions) < 0 ||
    Number(refunds) < 0 ||
    Number(depositReceipts) < 0
  ) {
    throw new Error('The test-record deletion response was invalid.');
  }
  return {
    payment_transactions: Number(paymentTransactions),
    disbursements: Number(disbursements),
    wallet_transactions: Number(walletTransactions),
    refunds: Number(refunds),
    deposit_receipts: Number(depositReceipts),
  };
}

export default function TestDataCleanupTab() {
  const [preview, setPreview] = useState<TestDataPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  const refreshPreview = useCallback(async () => {
    setLoading(true);
    try {
      const response = await client.get('/api/v1/admin/test-data/preview');
      if (!response.ok) {
        throw new Error(response.data?.detail || 'Unable to load test-record counts.');
      }
      setPreview(parsePreview(response.data));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load test-record counts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPreview();
  }, [refreshPreview]);

  const clearRecords = async () => {
    if (confirmation !== confirmationPhrase) return;
    setClearing(true);
    try {
      const response = await client.request('/api/v1/admin/test-data/clear', 'POST', {
        confirmation,
      });
      if (!response.ok) {
        throw new Error(response.data?.detail || 'Unable to clear test records.');
      }
      const deleted = parseClearResult(response.data);
      setConfirmOpen(false);
      setConfirmation('');
      await refreshPreview();
      const total = Object.values(deleted).reduce((sum, count) => sum + count, 0);
      toast.success(`Removed ${total} transaction records across all record types.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to clear test records.');
    } finally {
      setClearing(false);
    }
  };

  const counts = preview || emptyPreview;
  const hasRecords = Object.entries(counts)
    .filter(([key]) => key !== 'eligible_test_merchants')
    .some(([, count]) => count > 0);

  return (
    <>
      <div className="space-y-4">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-900">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Clear test transaction records
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">
              Permanently removes payment transactions, disbursements, wallet transaction history,
              refunds, and manual deposit receipts belonging to merchant accounts currently in
              Test Mode. Live-mode accounts and super-admin records are excluded. Wallet balances
              are preserved.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <CountCard label="Test-mode merchants" count={counts.eligible_test_merchants} />
              <CountCard label="Payment transactions" count={counts.payment_transactions} />
              <CountCard label="Disbursements" count={counts.disbursements} />
              <CountCard label="Wallet transaction history" count={counts.wallet_transactions} />
              <CountCard label="Refund records" count={counts.refunds} />
              <CountCard label="Manual deposit receipts" count={counts.deposit_receipts} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => void refreshPreview()} disabled={loading || clearing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh counts
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
                disabled={loading || clearing || !hasRecords}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear test records
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={open => {
          if (!clearing) {
            setConfirmOpen(open);
            if (!open) setConfirmation('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm permanent deletion</DialogTitle>
            <DialogDescription>
              This will delete all five listed record categories for current test-mode merchants.
              Wallet balances remain unchanged. This cannot be undone. Type{' '}
              <strong>{confirmationPhrase}</strong> to continue.
            </DialogDescription>
          </DialogHeader>
          <input
            autoComplete="off"
            value={confirmation}
            onChange={event => setConfirmation(event.target.value)}
            aria-label={`Type ${confirmationPhrase} to confirm`}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
          />
          <DialogFooter>
            <Button type="button" variant="outline" disabled={clearing} onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={clearing || confirmation !== confirmationPhrase}
              onClick={() => void clearRecords()}
            >
              {clearing ? 'Clearing…' : 'Permanently clear records'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CountCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{count}</p>
    </div>
  );
}
