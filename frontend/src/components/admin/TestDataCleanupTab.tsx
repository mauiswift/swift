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
}

const emptyPreview: TestDataPreview = {
  eligible_test_merchants: 0,
  payment_transactions: 0,
  disbursements: 0,
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
  if (
    !Number.isInteger(eligibleTestMerchants) ||
    !Number.isInteger(paymentTransactions) ||
    !Number.isInteger(disbursements) ||
    Number(eligibleTestMerchants) < 0 ||
    Number(paymentTransactions) < 0 ||
    Number(disbursements) < 0
  ) {
    throw new Error('The test-record preview response was invalid.');
  }
  return {
    eligible_test_merchants: Number(eligibleTestMerchants),
    payment_transactions: Number(paymentTransactions),
    disbursements: Number(disbursements),
  };
}

function parseClearResult(data: unknown): Pick<TestDataPreview, 'payment_transactions' | 'disbursements'> {
  if (typeof data !== 'object' || data === null) {
    throw new Error('The test-record deletion response was invalid.');
  }
  const result = data as Record<string, unknown>;
  const paymentTransactions = result.payment_transactions;
  const disbursements = result.disbursements;
  if (
    result.success !== true ||
    !Number.isInteger(paymentTransactions) ||
    !Number.isInteger(disbursements) ||
    Number(paymentTransactions) < 0 ||
    Number(disbursements) < 0
  ) {
    throw new Error('The test-record deletion response was invalid.');
  }
  return {
    payment_transactions: Number(paymentTransactions),
    disbursements: Number(disbursements),
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
      toast.success(
        `Removed ${deleted.payment_transactions} payment transactions and ${deleted.disbursements} disbursements.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to clear test records.');
    } finally {
      setClearing(false);
    }
  };

  const counts = preview || emptyPreview;
  const hasRecords = counts.payment_transactions > 0 || counts.disbursements > 0;

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
              Permanently removes payment transactions and disbursements belonging to merchant
              accounts that are currently in Test Mode. Live-mode accounts and super-admin
              records are excluded. Wallet balances and wallet ledger history are not changed.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <CountCard label="Test-mode merchants" count={counts.eligible_test_merchants} />
              <CountCard label="Payment transactions" count={counts.payment_transactions} />
              <CountCard label="Disbursements" count={counts.disbursements} />
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
              This will delete {counts.payment_transactions} payment transactions and{' '}
              {counts.disbursements} disbursements for current test-mode merchants. This cannot
              be undone. Type <strong>{confirmationPhrase}</strong> to continue.
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
