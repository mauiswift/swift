import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy } from 'lucide-react';
import { client } from '@/lib/api';
import Layout from '@/components/Layout';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import { fmtCurrency } from '@/lib/format';
import { StatusBadge, getStatusType } from '@/components/StatusBadge';
import { toast } from 'sonner';

interface DisbursementData {
  id: string;
  short_id?: string;
  amount: number;
  commission?: number;
  total_amount?: number;
  currency?: string;
  status: string;
  destination?: string;
  merchant_reference?: string;
  channel_reference?: string;
  recipient_name?: string;
  recipient_account?: string;
  history?: Array<{ event: string; date: string }>;
  created_at?: string;
  updated_at?: string;
}

export default function DisbursementDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<DisbursementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await client.apiCall.invoke({
          url: `/api/v1/entities/disbursements/${id}`,
          method: 'GET',
          data: {},
        });
        if (res.ok && res.data) {
          setData(res.data);
        } else {
          setError('Failed to load disbursement details');
        }
      } catch (err) {
        setError('Error loading disbursement details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <AppLoadingScreen />;
  if (error || !data) {
    return (
      <Layout>
        <div className="page-enter flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-slate-600 font-medium">{error || 'Disbursement not found'}</p>
          <button
            onClick={() => navigate('/disbursements')}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Back to disbursements
          </button>
        </div>
      </Layout>
    );
  }

  const currency = data.currency || 'PHP';
  const history = data.history || [];
  const shortId = data.short_id;
  const merchantReference = data.merchant_reference;
  const recipientAccount = data.recipient_account;

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Unable to copy value');
    }
  };

  return (
    <Layout>
      <div className="page-enter mx-auto max-w-6xl">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-6">
          <span className="cursor-pointer hover:text-slate-600" onClick={() => navigate('/disbursements')}>Disbursements</span>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-600 font-medium">Disbursement details</span>
        </div>

        {/* Title row */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/disbursements')}
              className="app-touch-target rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">Disbursement details</h1>
          </div>

        </div>

        <div className="app-panel mb-8 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <div>
             <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Disbursement amount</p>
             <span className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{data.total_amount !== undefined ? fmtCurrency(data.total_amount, currency) : '—'}</span>
          </div>
          <div className="flex items-center gap-3">
             <StatusBadge status={getStatusType(data.status)} size="sm" showDot={false} />
             {data.destination && <PaymentBrandLogo brand={data.destination} size="sm" />}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          {/* Left Column */}
          <div className="space-y-12">
            {/* History */}
            <section className="app-panel p-5 sm:p-6">
              <h2 className="text-[16px] font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-2">History</h2>
              {history.length > 0 ? (
                <div className="space-y-6">
                {history.map((h, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${i === 0 ? 'bg-teal-400' : 'bg-slate-200'}`} />
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">{h.event}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{h.date}</p>
                    </div>
                  </div>
                ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No history details available.</p>
              )}
            </section>

            {/* Disbursement breakdown */}
            <section className="app-panel p-5 sm:p-6">
              <h2 className="mb-6 border-b border-slate-100 pb-2 text-[16px] font-semibold text-slate-900">Disbursement breakdown</h2>
              <div className="space-y-2 text-[13px]">
                <BreakdownRow label="Disbursement amount" value={fmtCurrency(data.amount, currency)} />
                <BreakdownRow label="Processing fee" value={data.commission !== undefined ? fmtCurrency(data.commission, currency) : '—'} />
                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3.5 text-white">
                  <span className="font-semibold">Total debit</span>
                  <span className="font-mono text-base font-semibold">{data.total_amount !== undefined ? fmtCurrency(data.total_amount, currency) : '—'}</span>
                </div>
              </div>
            </section>

          </div>

          {/* Right Column */}
          <div className="app-panel h-fit p-5 sm:p-6">
            <h2 className="text-[16px] font-semibold text-slate-900 border-b border-slate-100 pb-2">Details</h2>

            <div className="space-y-6">
               <DetailRow label="Disbursement ID" value={data.id} showCopy onCopy={() => void copyToClipboard(data.id)} />
               <DetailRow label="Short ID" value={shortId || '—'} showCopy={Boolean(shortId)} onCopy={shortId ? () => void copyToClipboard(shortId) : undefined} />
               <DetailRow label="Destination" value={data.destination || '—'} />
               <DetailRow label="Merchant reference number" value={merchantReference || '—'} showCopy={Boolean(merchantReference)} onCopy={merchantReference ? () => void copyToClipboard(merchantReference) : undefined} />
               <DetailRow label="Channel reference number" value={data.channel_reference || '—'} />
               <DetailRow label="Recipient name" value={data.recipient_name || '—'} />
               <DetailRow label="Recipient account number" value={recipientAccount || '—'} showCopy={Boolean(recipientAccount)} onCopy={recipientAccount ? () => void copyToClipboard(recipientAccount) : undefined} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function DetailRow({ label, value, showCopy, onCopy }: { label: string; value: string; showCopy?: boolean; onCopy?: () => void }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[13px] text-slate-600 ${showCopy ? 'font-mono' : 'font-medium'}`}>{value}</span>
        {showCopy && onCopy && (
          <button type="button" aria-label={`Copy ${label}`} title={`Copy ${label}`} onClick={onCopy} className="app-touch-target h-8 min-h-0 min-w-0 rounded-md bg-white p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <Copy size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono font-medium text-slate-900">{value}</span>
    </div>
  );
}
