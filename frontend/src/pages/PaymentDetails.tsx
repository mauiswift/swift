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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#a3a6ad', marginBottom: 20 }}>
          <button
            onClick={() => navigate('/payments')}
            style={{ background: 'none', border: 'none', color: '#a3a6ad', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
          >
            Payments
          </button>
          <span>&gt;</span>
          <span>Transaction details</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => navigate('/payments')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', fontSize: 15, color: '#535353', cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginBottom: 12 }}
          >
            <ChevronLeft size={20} />
            Transaction details
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground m-0">
              ₱{transaction.amount.toFixed(2)}
            </h1>
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, border: '1px solid', borderRadius: 6, padding: '4px 10px' }}
              className={statusColors[transaction.status]}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
              {statusLabels[transaction.status]}
            </span>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10">
          {/* Left column */}
          <div>
            {/* History */}
            <section style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#191919', marginBottom: 16 }}>
                History
              </h2>
              <div style={{ background: '#fff', border: '1px solid #e9e9e9', borderRadius: 12, padding: '20px 24px' }}>
                {transaction.history.map((item, idx) => (
                  <div
                    key={idx}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: idx < transaction.history.length - 1 ? 16 : 0, marginBottom: idx < transaction.history.length - 1 ? 16 : 0, borderBottom: idx < transaction.history.length - 1 ? '1px solid #e9e9e9' : 'none' }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a3a6ad', marginTop: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#191919', marginBottom: 4 }}>
                        {item.event}
                      </div>
                      <div style={{ fontSize: 13, color: '#a3a6ad' }}>
                        {item.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Payment breakdown */}
            <section style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#191919', marginBottom: 16 }}>
                Payment breakdown
              </h2>
              <div style={{ background: '#fff', border: '1px solid #e9e9e9', borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #e9e9e9' }}>
                  <span style={{ fontSize: 14, color: '#535353' }}>Amount</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#191919' }}>₱{transaction.amount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>Total amount</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>₱{transaction.amount.toFixed(2)}</span>
                </div>
              </div>
            </section>

            {/* Callback */}
            {transaction.callback && (
              <section>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#191919', marginBottom: 16 }}>
                  Callback
                </h2>
                <div style={{ background: '#fff', border: '1px solid #e9e9e9', borderRadius: 12, padding: '20px 24px' }}>
                  {/* Status */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: '#a3a6ad', marginBottom: 8 }}>Status</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {transaction.callback.status === 'error' && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      )}
                      <span style={{ fontSize: 14, color: '#ef4444', fontWeight: 500 }}>Error</span>
                    </div>
                  </div>

                  {/* Executed on */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: '#a3a6ad', marginBottom: 8 }}>Executed on</div>
                    <div style={{ fontSize: 14, color: '#191919' }}>{transaction.callback.executedOn}</div>
                  </div>

                  {/* Response code */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: '#a3a6ad', marginBottom: 8 }}>Response code</div>
                    <div style={{ fontSize: 14, color: '#191919', fontFamily: 'monospace' }}>{transaction.callback.responseCode}</div>
                  </div>

                  {/* Error Message */}
                  {transaction.callback.errorMessage && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, color: '#a3a6ad', marginBottom: 8 }}>Error Message</div>
                      <div style={{ fontSize: 13, color: '#191919', fontFamily: 'monospace', background: '#f5f5f5', padding: '10px 12px', borderRadius: 6, wordBreak: 'break-all' }}>
                        {transaction.callback.errorMessage}
                      </div>
                    </div>
                  )}

                  {/* URL */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, color: '#a3a6ad', marginBottom: 8 }}>URL</div>
                    <div style={{ fontSize: 12, color: '#191919', fontFamily: 'monospace', background: '#f5f5f5', padding: '10px 12px', borderRadius: 6, wordBreak: 'break-all', lineHeight: 1.6 }}>
                      {transaction.callback.url}
                    </div>
                  </div>

                  {/* Retry button */}
                  <button
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#191919', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}
                  >
                    <RefreshCw size={16} />
                    Retry
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* Right column - Details */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#191919', marginBottom: 16 }}>
              Details
            </h2>
            <div style={{ background: '#fff', border: '1px solid #e9e9e9', borderRadius: 12, padding: '20px 24px' }}>
              {/* Payment ID */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#a3a6ad', marginBottom: 8 }}>Payment ID</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#191919', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {transaction.id}
                  </span>
                  <button
                    onClick={() => copyToClipboard(transaction.id, 'Payment ID')}
                    style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', flexShrink: 0 }}
                  >
                    <Copy size={14} color="#a3a6ad" />
                  </button>
                </div>
              </div>

              {/* Short ID */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#a3a6ad', marginBottom: 8 }}>Short ID</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, color: '#191919', fontFamily: 'monospace' }}>
                    {transaction.shortId}
                  </span>
                  <button
                    onClick={() => copyToClipboard(transaction.shortId, 'Short ID')}
                    style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', flexShrink: 0 }}
                  >
                    <Copy size={14} color="#a3a6ad" />
                  </button>
                </div>
              </div>

              {/* Payment method */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#a3a6ad', marginBottom: 8 }}>Payment method</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffa672" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  <span style={{ fontSize: 14, color: '#191919' }}>
                    {transaction.provider} • {transaction.method}
                  </span>
                </div>
              </div>

              {/* Reference no */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#a3a6ad', marginBottom: 8 }}>Reference no</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, color: '#191919', fontFamily: 'monospace' }}>
                    {transaction.reference}
                  </span>
                  <button
                    onClick={() => copyToClipboard(transaction.reference, 'Reference')}
                    style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', flexShrink: 0 }}
                  >
                    <Copy size={14} color="#a3a6ad" />
                  </button>
                </div>
              </div>

              {/* Institution reference no */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#a3a6ad', marginBottom: 8 }}>Institution reference no</div>
                <div style={{ fontSize: 14, color: '#a3a6ad' }}>
                  {transaction.institutionRef || '—'}
                </div>
              </div>

              {/* Account number */}
              {transaction.accountNumber && (
                <div>
                  <div style={{ fontSize: 13, color: '#a3a6ad', marginBottom: 8 }}>Account number</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, color: '#191919', fontFamily: 'monospace' }}>
                      {transaction.accountNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard(transaction.accountNumber!, 'Account number')}
                      style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', flexShrink: 0 }}
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
