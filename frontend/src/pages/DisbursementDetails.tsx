import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, FileText } from 'lucide-react';
import { client } from '@/lib/api';
import Layout from '@/components/Layout';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import { fmtCurrency } from '@/lib/format';
import { formatTransactionDate } from '@/lib/transactions';
import { StatusBadge, getStatusType } from '@/components/StatusBadge';
import { toast } from 'sonner';

interface DisbursementData {
  id: string;
  short_id?: string;
  amount: number;
  commission?: number;
  total_amount?: number;
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

  const mockDb = {
    id: data.id,
    shortId: data.short_id || 'N/A',
    amount: data.amount,
    commission: data.commission ?? 0,
    totalAmount: data.total_amount ?? data.amount,
    status: data.status,
    destination: data.destination || 'Not specified',
    reference: data.merchant_reference || '-',
    channelRef: data.channel_reference || '-',
    recipientName: data.recipient_name || 'Not specified',
    recipientAccount: data.recipient_account || '-',
    history: data.history || [
      { event: 'Disbursement created', date: formatTransactionDate(data.created_at) }
    ]
  };

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

          <button className="flex items-center gap-2 text-[12px] font-semibold text-slate-900 hover:text-[#FF6B00] transition-colors">
            <FileText size={16} />
            Download confirmation
          </button>
        </div>

        <div className="app-panel mb-8 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <div>
             <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Disbursement amount</p>
             <span className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{fmtCurrency(mockDb.totalAmount, 'PHP')}</span>
          </div>
          <div className="flex items-center gap-3">
             <StatusBadge status={getStatusType(mockDb.status)} size="sm" showDot={false} />
             <PaymentBrandLogo brand={mockDb.destination} size="sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          {/* Left Column */}
          <div className="space-y-12">
            {/* History */}
            <section className="app-panel p-5 sm:p-6">
              <h2 className="text-[16px] font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-2">History</h2>
              <div className="space-y-6">
                {mockDb.history.map((h, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${i === 0 ? 'bg-teal-400' : 'bg-slate-200'}`} />
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">{h.event}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{h.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Disbursement breakdown */}
            <section className="app-panel p-5 sm:p-6">
              <h2 className="text-[16px] font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-2">Disbursement breakdown</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[13px]">
                   <span className="text-slate-500">Amount</span>
                   <span className="font-semibold text-slate-900 font-mono">{fmtCurrency(mockDb.amount, 'PHP')}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                   <span className="text-slate-500">Service Fee</span>
                   <span className="font-semibold text-slate-900 font-mono">{fmtCurrency(mockDb.commission, 'PHP')}</span>
                </div>
                <div className="flex justify-between items-center text-[13px] pt-2 border-t border-slate-50">
                   <span className="font-semibold text-slate-900">Total amount</span>
                   <span className="font-semibold text-slate-900 font-mono">{fmtCurrency(mockDb.totalAmount, 'PHP')}</span>
                </div>
              </div>
            </section>

            {/* Callback */}
            <section className="app-panel p-5 sm:p-6">
              <h2 className="text-[16px] font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-2">Callback</h2>
              <div>
                 <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1">Status</p>
                 <div className="flex items-center gap-2">
                    <span className="text-rose-500">
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                       </svg>
                    </span>
                    <span className="text-[13px] font-semibold text-slate-700">Error</span>
                 </div>
                 <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-6 mb-1">Executed on</p>
                 <p className="text-[13px] text-slate-400">-</p>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="app-panel h-fit p-5 sm:p-6">
            <h2 className="text-[16px] font-semibold text-slate-900 border-b border-slate-100 pb-2">Details</h2>

            <div className="space-y-6">
               <DetailRow label="Disbursement ID" value={mockDb.id} showCopy onCopy={() => void copyToClipboard(mockDb.id)} />
               <DetailRow label="Short ID" value={mockDb.shortId} showCopy onCopy={() => void copyToClipboard(mockDb.shortId)} />
               <DetailRow label="Destination" value={mockDb.destination} />
               <DetailRow label="Merchant reference number" value={mockDb.reference} showCopy onCopy={() => void copyToClipboard(mockDb.reference)} />
               <DetailRow label="Channel reference number" value={mockDb.channelRef} />
               <DetailRow label="Recipient name" value={mockDb.recipientName} />
               <DetailRow label="Recipient account number" value={mockDb.recipientAccount} showCopy onCopy={() => void copyToClipboard(mockDb.recipientAccount)} />
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
