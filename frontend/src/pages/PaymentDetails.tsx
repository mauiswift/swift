import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import { client } from '@/lib/api';
import { fmtCurrency, normalizePublicCurrency } from '@/lib/format';
import {
  formatTransactionDate,
  getTransactionStatus,
  getTransactionTypeLabel,
  isPendingTransaction,
  isSuccessfulTransaction,
  type TransactionRecord,
} from '@/lib/transactions';
import { toast } from 'sonner';
import LoadingSkeleton from '@/design-system/components/LoadingSkeleton';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import { StatusBadge, getStatusType } from '@/components/StatusBadge';

export default function PaymentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [txn, setTxn] = useState<TransactionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchTransaction = useCallback(async () => {
    if (!id) {
      setLoadError('Transaction ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError('');
    try {
      const response = await client.get(`/api/v1/entities/transactions/${encodeURIComponent(id)}`);
      if (!response.ok || !response.data) {
        if (response.status === 404) {
          navigate('/payments');
          toast.error('Transaction not found');
          return;
        }
        throw new Error(response.data?.detail || 'Unable to load transaction.');
      }
      setTxn(response.data as TransactionRecord);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load transaction details.';
      setLoadError(message);
      toast.error('Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    void fetchTransaction();
  }, [fetchTransaction]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy transaction value:', error);
      toast.error('Unable to copy value');
    }
  };

  if (loading) {
    return <Layout><LoadingSkeleton variant="page" /></Layout>;
  }

  if (loadError) {
    return (
      <Layout>
        <div className="mx-auto max-w-xl py-20 text-center">
          <p className="text-lg font-semibold text-slate-900">Unable to load transaction</p>
          <p className="mt-2 text-sm text-slate-500">{loadError}</p>
          <button type="button" onClick={() => void fetchTransaction()} className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCw size={15} /> Try again
          </button>
        </div>
      </Layout>
    );
  }

  if (!txn) return null;

  const displayStatus = getTransactionStatus(txn);
  const successful = isSuccessfulTransaction(displayStatus);
  const pending = isPendingTransaction(displayStatus);
  const displayCurrency = normalizePublicCurrency(txn.currency);
  const statusType = getStatusType(displayStatus);

  return (
    <Layout>
      <div className="page-enter mx-auto max-w-6xl">
        <div className="mb-5 flex items-center gap-2 text-xs font-medium text-slate-400">
          <button type="button" className="hover:text-slate-600" onClick={() => navigate('/payments')}>Payments</button>
          <span className="text-slate-300">&gt;</span>
          <span className="font-semibold text-slate-600">Transaction details</span>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <button type="button" onClick={() => navigate('/payments')} aria-label="Back to payments" className="app-touch-target rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="m-0 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Transaction details</h1>
            <p className="mt-1 text-xs text-slate-400">{getTransactionTypeLabel(txn.transaction_type)}</p>
          </div>
        </div>

        <div className="app-panel mb-8 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Transaction amount</p>
            <span className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{fmtCurrency(txn.amount, displayCurrency)}</span>
          </div>
          <StatusBadge status={statusType} size="sm" showDot={false} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <section className="app-panel p-5 sm:p-6">
              <SectionTitle>History</SectionTitle>
              <div className="space-y-6">
                <TimelineItem label="Payment created" date={txn.created_at} color="bg-blue-500" />
                {successful && <TimelineItem label="Payment confirmed" date={txn.paid_at || txn.updated_at} color="bg-emerald-500" />}
                {pending && <TimelineItem label="Payment is being processed" date={txn.updated_at} color="bg-blue-500" />}
                {!successful && !pending && <TimelineItem label={`Payment ${displayStatus}`} date={txn.updated_at} color="bg-rose-500" />}
              </div>
            </section>

            <section className="app-panel p-5 sm:p-6">
              <SectionTitle>Payment breakdown</SectionTitle>
              <div className="space-y-4 text-[13px]">
                <SummaryRow label="Amount" value={fmtCurrency(txn.amount, displayCurrency)} />
                <SummaryRow label="Service fee" value="0.00%" muted />
                <SummaryRow label="Total amount" value={fmtCurrency(txn.amount, displayCurrency)} emphasized />
              </div>
            </section>

            <section className="app-panel p-5 sm:p-6">
              <SectionTitle>Description</SectionTitle>
              <p className="text-[13px] text-slate-600">{txn.description || 'No description provided'}</p>
            </section>
          </div>

          <div className="app-panel h-fit p-5 sm:p-6">
            <SectionTitle>Details</SectionTitle>
            <div className="space-y-6">
              <DetailRow label="Transaction ID" value={String(txn.id)} onCopy={() => void copyToClipboard(String(txn.id))} />
              <DetailRow label="Reference no" value={txn.external_id || '—'} onCopy={txn.external_id ? () => void copyToClipboard(txn.external_id!) : undefined} />
              <DetailRow label="Gateway ID" value={txn.xendit_id || '—'} onCopy={txn.xendit_id ? () => void copyToClipboard(txn.xendit_id!) : undefined} />
              <DetailRow label="Payment method" value={getTransactionTypeLabel(txn.transaction_type)} icon methodId={txn.transaction_type} />
              <DetailRow label="Approval status" value={getTransactionTypeLabel(txn.approval_status || 'not required')} />
              <DetailRow label="Created" value={formatTransactionDate(txn.created_at)} />
              <DetailRow label="Updated" value={formatTransactionDate(txn.updated_at)} />
              <DetailRow label="Customer name" value={txn.customer_name || '—'} />
              <DetailRow label="Customer email" value={txn.customer_email || '—'} />
              {(txn.sender_name || txn.sender_bank) && (
                <>
                  <DetailRow label="Sender name" value={txn.sender_name || '—'} />
                  <DetailRow label="Sender bank" value={txn.sender_bank || '—'} />
                </>
              )}
              {txn.rejection_reason && <DetailRow label="Rejection reason" value={txn.rejection_reason} />}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-6 border-b border-slate-100 pb-2 text-[16px] font-semibold text-slate-900">{children}</h2>;
}

function TimelineItem({ label, date, color }: { label: string; date?: string | null; color: string }) {
  return (
    <div className="flex gap-4">
      <div className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${color}`} />
      <div>
        <p className="text-[13px] font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">{formatTransactionDate(date)}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, muted = false, emphasized = false }: { label: string; value: string; muted?: boolean; emphasized?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${emphasized ? 'border-t border-slate-50 pt-2' : ''}`}>
      <span className={emphasized ? 'font-semibold text-slate-900' : 'text-slate-500'}>{label}</span>
      <span className={`${muted ? 'text-slate-400' : 'text-slate-900'} ${emphasized ? 'font-semibold' : 'font-medium'} font-mono`}>{value}</span>
    </div>
  );
}

function DetailRow({ label, value, onCopy, icon, methodId }: { label: string; value: string; onCopy?: () => void; icon?: boolean; methodId?: string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-slate-400">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {icon && <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100 text-slate-500"><PaymentBrandLogo brand={methodId || ''} size="sm" className="border-0 bg-transparent" /></div>}
          <span className={`truncate text-[13px] text-slate-600 ${onCopy ? 'font-mono' : 'font-medium'}`}>{value}</span>
        </div>
        {onCopy && <button type="button" aria-label={`Copy ${label}`} title={`Copy ${label}`} onClick={onCopy} className="rounded-md bg-white p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Copy size={14} /></button>}
      </div>
    </div>
  );
}
