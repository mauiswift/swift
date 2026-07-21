import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  shortId: string;
  amount: number;
  status: 'executed' | 'expired' | 'canceled' | 'pending' | 'rejected';
  method: string;
  provider: string;
  reference: string;
  institutionRef?: string;
  accountNumber?: string;
  history: Array<{
    event: string;
    timestamp: string;
  }>;
  callback?: {
    status: 'success' | 'error';
    executedOn: string;
    responseCode: number;
    errorMessage?: string;
    url: string;
  };
}

// Mock data (in production, fetch from API based on ID)
const mockTransaction: Transaction = {
  id: '019161c56-6b23-1d47-00B9-5213eb3a2fe',
  shortId: '5eb3a2fe',
  amount: 100.00,
  status: 'expired',
  method: 'Transfer',
  provider: 'Maya',
  reference: 'E1316',
  institutionRef: '',
  accountNumber: '99595098578',
  history: [
    { event: 'Payment expired', timestamp: 'Jul 17 2026, 10:31 AM' },
    { event: 'Payment created', timestamp: 'Jul 18 2026, 10:30 PM' },
  ],
  callback: {
    status: 'error',
    executedOn: 'Jul 17 2026, 10:31 am',
    responseCode: 404,
    errorMessage: '{"detail":"Swift transaction not found."}',
    url: 'https://focupier.skipable-ksw1.ngrok-free.dev/webhook/swiftposlive?signature=b4e7b0ad965d0c8bc05f820343-c89cb490e1d8f454c2f89f1c9a7cf3fff0a6x_payment_status=EXPIRED&x_access_key=SEC42Q6FF681842CIBF3-58F731C4B74245x_payment_id=019f9b5d6-6b23-1e47-00B9-5213deb3a2fe&x_reference_no=E1316',
  },
};

const statusColors: Record<Transaction['status'], string> = {
  executed: 'bg-teal-100 text-teal-700 border-teal-200',
  expired: 'bg-gray-100 text-gray-600 border-gray-200',
  canceled: 'bg-gray-100 text-gray-600 border-gray-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels: Record<Transaction['status'], string> = {
  executed: 'Executed',
  expired: 'Expired',
  canceled: 'Canceled',
  pending: 'Pending',
  rejected: 'Rejected',
};

export default function PaymentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transaction] = useState<Transaction>(mockTransaction);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-5">
          <button
            onClick={() => navigate('/payments')}
            className="text-sm text-slate-400 hover:underline p-0"
          >
            Payments
          </button>
          <span className="text-slate-400">&gt;</span>
          <span>Transaction details</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/payments')}
            className="flex items-center gap-2 text-sm text-slate-600 p-0 mb-3"
          >
            <ChevronLeft size={20} />
            Transaction details
          </button>

          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground m-0">
              ₱{transaction.amount.toFixed(2)}
            </h1>
            <span
              className={`${statusColors[transaction.status]} inline-flex items-center gap-2 text-sm font-medium rounded-md px-3 py-1`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {statusLabels[transaction.status]}
            </span>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10">
          {/* Left column */}
          <div>
            {/* History */}
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                History
              </h2>
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                {transaction.history.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${idx < transaction.history.length - 1 ? 'pb-4 mb-4 border-b border-slate-200' : ''}`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1 shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900 mb-1">
                        {item.event}
                      </div>
                      <div className="text-sm text-slate-400">
                        {item.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Payment breakdown */}
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Payment breakdown
              </h2>
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <span className="text-sm text-slate-600">Amount</span>
                  <span className="text-sm font-medium text-slate-900">₱{transaction.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">Total amount</span>
                  <span className="text-sm font-semibold text-slate-900">₱{transaction.amount.toFixed(2)}</span>
                </div>
              </div>
            </section>

            {/* Callback */}
            {transaction.callback && (
              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Callback
                </h2>
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <div className="mb-4">
                    <div className="text-xs text-slate-400 mb-2">Status</div>
                    <div className="flex items-center gap-2">
                      {transaction.callback.status === 'error' && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      )}
                      <span className="text-sm text-red-600 font-medium">Error</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs text-slate-400 mb-2">Executed on</div>
                    <div className="text-sm text-slate-900">{transaction.callback.executedOn}</div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs text-slate-400 mb-2">Response code</div>
                    <div className="text-sm font-mono text-slate-900">{transaction.callback.responseCode}</div>
                  </div>

                  {transaction.callback.errorMessage && (
                    <div className="mb-4">
                      <div className="text-xs text-slate-400 mb-2">Error Message</div>
                      <div className="text-sm text-slate-900 font-mono bg-slate-100 p-3 rounded-md break-words">
                        {transaction.callback.errorMessage}
                      </div>
                    </div>
                  )}

                  <div className="mb-5">
                    <div className="text-xs text-slate-400 mb-2">URL</div>
                    <div className="text-sm text-slate-900 font-mono bg-slate-100 p-3 rounded-md break-words leading-relaxed">
                      {transaction.callback.url}
                    </div>
                  </div>

                  <button className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-medium rounded-md px-4 py-2">
                    <RefreshCw size={16} />
                    Retry
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* Right column - Details */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Details
            </h2>
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              {/* Payment ID */}
              <div className="mb-5">
                <div className="text-xs text-slate-400 mb-2">Payment ID</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-900 font-mono break-words">{transaction.id}</span>
                  <button
                    onClick={() => copyToClipboard(transaction.id, 'Payment ID')}
                    className="p-1"
                  >
                    <Copy size={14} color="#a3a6ad" />
                  </button>
                </div>
              </div>

              {/* Short ID */}
              <div className="mb-5">
                <div className="text-xs text-slate-400 mb-2">Short ID</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-900 font-mono">{transaction.shortId}</span>
                  <button
                    onClick={() => copyToClipboard(transaction.shortId, 'Short ID')}
                    className="p-1"
                  >
                    <Copy size={14} color="#a3a6ad" />
                  </button>
                </div>
              </div>

              {/* Payment method */}
              <div className="mb-5">
                <div className="text-xs text-slate-400 mb-2">Payment method</div>
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffa672" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  <span className="text-sm text-slate-900">
                    {transaction.provider} • {transaction.method}
                  </span>
                </div>
              </div>

              {/* Reference no */}
              <div className="mb-5">
                <div className="text-xs text-slate-400 mb-2">Reference no</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-900 font-mono">{transaction.reference}</span>
                  <button
                    onClick={() => copyToClipboard(transaction.reference, 'Reference')}
                    className="p-1"
                  >
                    <Copy size={14} color="#a3a6ad" />
                  </button>
                </div>
              </div>

              {/* Institution reference no */}
              <div className="mb-5">
                <div className="text-xs text-slate-400 mb-2">Institution reference no</div>
                <div className="text-sm text-slate-400">{transaction.institutionRef || '—'}</div>
              </div>

              {/* Account number */}
              {transaction.accountNumber && (
                <div>
                  <div className="text-xs text-slate-400 mb-2">Account number</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-900 font-mono">{transaction.accountNumber}</span>
                    <button
                      onClick={() => copyToClipboard(transaction.accountNumber!, 'Account number')}
                      className="p-1"
                    >
                      <Copy size={14} color="#a3a6ad" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
