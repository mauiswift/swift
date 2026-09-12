import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, Loader2, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import { client } from '@/lib/api';
import { fmtCurrency } from '@/lib/format';
import { toast } from 'sonner';
import LoadingSkeleton from '@/design-system/components/LoadingSkeleton';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';

interface Transaction {
  id: number;
  transaction_type: string;
  external_id: string;
  xendit_id?: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  customer_name?: string;
  customer_email?: string;
  sender_name?: string;
  sender_bank?: string;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  payment_url?: string;
}

export default function PaymentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [txn, setTxn] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTransaction = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await client.get(`/api/v1/entities/transactions/${id}`);
      if (res.ok && res.data) {
        setTxn(res.data);
      } else {
        toast.error('Transaction not found');
        navigate('/payments');
      }
    } catch (err) {
      console.error('Failed to fetch transaction:', err);
      toast.error('Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSkeleton variant="page" />
      </Layout>
    );
  }

  if (!txn) return null;

  const isExecuted = txn.status.toLowerCase() === 'paid' || txn.status.toLowerCase() === 'executed' || txn.status.toLowerCase() === 'completed';
  const isPending = txn.status.toLowerCase() === 'pending' || txn.status.toLowerCase() === 'processing';
  const isFailed = !isExecuted && !isPending;

  const statusColor = isExecuted ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                   : isPending ? 'bg-blue-50 text-blue-600 border-blue-100'
                   : 'bg-rose-50 text-rose-600 border-rose-100';

  const statusDot = isExecuted ? 'bg-emerald-500' : isPending ? 'bg-blue-500' : 'bg-rose-500';

  return (
    <Layout>
      <div className="page-enter">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-6 font-medium">
          <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={() => navigate('/payments')}>Payments</span>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-600 font-semibold">Transaction details</span>
        </div>

        {/* Title row */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/payments')}
            type="button"
            aria-label="Back to payments"
            title="Back to payments"
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">Transaction details</h1>
        </div>

        <div className="flex items-center gap-4 mb-10">
          <span className="text-4xl font-semibold tracking-tight text-slate-900">{fmtCurrency(txn.amount, txn.currency)}</span>
          <span className={`border px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${statusColor}`}>
             <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
             {txn.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
          {/* Left Column */}
          <div className="space-y-12">
            {/* History */}
            <section>
              <h2 className="text-[16px] font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-2">History</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-slate-900">Payment created</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{new Date(txn.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                </div>
                {isExecuted && (
                  <div className="flex gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">Payment confirmed</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{new Date(txn.paid_at || txn.updated_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                )}
                {isFailed && (
                  <div className="flex gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">Payment {txn.status.toLowerCase()}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{new Date(txn.updated_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Payment breakdown */}
            <section>
              <h2 className="text-[16px] font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-2">Payment breakdown</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[13px]">
                   <span className="text-slate-500">Amount</span>
                   <span className="font-semibold text-slate-900 font-mono">{fmtCurrency(txn.amount, txn.currency)}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                   <span className="text-slate-500">Service Fee</span>
                   <span className="text-slate-400">0.00%</span>
                </div>
                <div className="flex justify-between items-center text-[13px] pt-2 border-t border-slate-50">
                   <span className="font-semibold text-slate-900">Total amount</span>
                   <span className="font-semibold text-slate-900 font-mono">{fmtCurrency(txn.amount, txn.currency)}</span>
                </div>
              </div>
            </section>

            {/* Callback */}
            <section>
              <h2 className="text-[16px] font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-2">Description</h2>
              <p className="text-[13px] text-slate-600">{txn.description || 'No description provided'}</p>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <h2 className="text-[16px] font-semibold text-slate-900 border-b border-slate-100 pb-2">Details</h2>

            <div className="space-y-6">
               <DetailRow label="Transaction ID" value={String(txn.id)} onCopy={() => copyToClipboard(String(txn.id))} />
               <DetailRow label="Reference no" value={txn.external_id} onCopy={() => copyToClipboard(txn.external_id)} />
               <DetailRow label="Gateway ID" value={txn.xendit_id || '-'} onCopy={txn.xendit_id ? () => copyToClipboard(txn.xendit_id!) : undefined} />
               <DetailRow label="Payment method" value={txn.transaction_type.toUpperCase()} icon methodId={txn.transaction_type} />
               <DetailRow label="Customer Name" value={txn.customer_name || '-'} />
               <DetailRow label="Customer Email" value={txn.customer_email || '-'} />
               {(txn.sender_name || txn.sender_bank) && (
                 <>
                   <DetailRow label="Sender Name" value={txn.sender_name || '-'} />
                   <DetailRow label="Sender Bank" value={txn.sender_bank || '-'} />
                 </>
               )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function DetailRow({ label, value, onCopy, icon, methodId }: { label: string; value: string; onCopy?: () => void; icon?: boolean; methodId?: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-slate-500 overflow-hidden">
              {methodId ? (
                <PaymentBrandLogo brand={methodId} size="sm" className="border-0 bg-transparent" />
              ) : (
                <RefreshCw size={12} />
              )}
            </div>
          )}
          <span className={`text-[13px] text-slate-600 ${onCopy ? 'font-mono' : 'font-medium'}`}>{value}</span>
        </div>
        {onCopy && (
          <button type="button" aria-label={`Copy ${label}`} title={`Copy ${label}`} onClick={onCopy} className="rounded-md bg-white p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
            <Copy size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
