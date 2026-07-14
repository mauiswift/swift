import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { client } from '@/lib/api';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  Wallet,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Bot,
  Clipboard
} from 'lucide-react';
import { toast } from 'sonner';
import { APP_NAME } from '@/lib/brand';
import { fmt } from '@/lib/format';

interface Transaction {
  id: number;
  transaction_type: string;
  external_id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  customer_name: string;
  payment_url: string;
  qr_code_url: string;
  merchant_name?: string;
  created_at: string;
}

const cardBaseClass = 'rounded-lg border border-white/[0.08] bg-white/[0.03] shadow-sm';

const Card = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`${cardBaseClass} ${className}`.trim()} {...props} />
);

const CardHeader = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`.trim()} {...props} />
);

const CardTitle = ({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`.trim()} {...props} />
);

const CardContent = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pt-0 ${className}`.trim()} {...props} />
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const Button = ({ className = '', asChild = false, children, ...props }: ButtonProps) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
      className: `${(children as React.ReactElement<{ className?: string }>).props.className ?? ''} inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium r[...]
      ...props,
    });
  }

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 ease-out focus-visible:outline-n[...]
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ className = '', ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`.trim()} {...props} />
);

// Helper function to get proper QR image URL
const getQRImageUrl = (qrContent: string): string => {
  if (!qrContent) return '';
  const s = qrContent.trim();

  // If it's already a full URL (http/https), return as-is
  if (/^https?:\/\//i.test(s)) {
    return s;
  }

  // If it's already a data URL, return as-is
  if (s.startsWith('data:')) {
    return s;
  }

  // If it's an inline SVG fragment, convert to a data URI (SVG) so <img> can render it reliably
  if (s.startsWith('<svg')) {
    try {
      return `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;
    } catch (e) {
      return s;
    }
  }

  // If it looks like base64 content (common when backend returns raw base64), treat as PNG
  const base64Like = /^[A-Za-z0-9+/=\s]+$/.test(s) && s.length > 100;
  if (base64Like) {
    // Strip whitespace/newlines then return data URL
    const compact = s.replace(/\s+/g, '');
    return `data:image/png;base64,${compact}`;
  }

  // Unknown format — return empty so caller can handle fallback
  return '';
};

export default function Checkout() {
  // Support either route param name: `externalId` (older) or `identifier` (routes in App.tsx)
  const { externalId, identifier } = useParams<{ externalId?: string; identifier?: string }>();
  const checkoutId = externalId ?? identifier;

  const [txn, setTxn] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const popupRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for status updates
  const startPollingStatus = (extId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        setPollCount(c => c + 1);
        const response = await client.get(`/payments/checkout/${extId}/status`);
        if (response.data?.status === 'paid') {
          setTxn(prev => prev ? { ...prev, status: 'paid' } : null);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          toast.success('Payment confirmed!');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);
  };

  // Open checkout popup
  const openCheckoutPopup = (url: string) => {
    popupRef.current = window.open(url, 'checkout', 'width=500,height=600,left=200,top=100');
  };

  // Fetch transaction data
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const response = await client.get(`/payments/checkout/${checkoutId}`);
        // Validate response has required fields
        if (typeof response.data.amount !== 'number' || response.data.amount < 0) {
          throw new Error('Invalid response: amount must be a non-negative number');
        }
        setTxn(response.data);
      } catch (err) {
        setError((err as any)?.response?.data?.detail || 'Failed to load payment');
      } finally {
        setLoading(false);
      }
    };

    if (checkoutId) fetchTransaction();
    else {
      // If no checkoutId found in route, surface a clear error instead of staying on spinner
      setError('Invalid checkout URL');
      setLoading(false);
    }
  }, [checkoutId]);

  // Cleanup effect for polling and popup
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080E1A] text-white flex flex-col items-center justify-center p-6">
        <div className="h-12 w-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
        <p className="mt-4 text-sm uppercase tracking-[0.3em] text-slate-400">Loading checkout</p>
      </div>
    );
  }

  if (error || !txn) {
    return (
      <div className="min-h-screen bg-[#080E1A] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment Not Found</h1>
        <p className="text-slate-400 max-w-xs mb-8">{error || "The requested payment link is invalid or has expired."}</p>
        <Link to="/home" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-wh[...]
          Go to {APP_NAME}
        </Link>
      </div>
    );
  }

  const isPaid = txn?.status === 'paid';
  const isExpired = txn?.status === 'expired' || txn?.status === 'cancelled';
  const isPending = txn?.status === 'pending';
  const hasCheckoutLink = !!txn?.payment_url;
  const hasQR = !!txn?.qr_code_url;

  const handleStartCheckout = () => {
    const url = txn.payment_url || txn.qr_code_url || '';
    if (!url) { toast.error('No checkout URL available'); return; }
    openCheckoutPopup(url);
    startPollingStatus(txn.external_id);
  };

  return (
    <div className="min-h-screen bg-[#080E1A] text-white selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-white/[0.05] bg-white/[0.02] backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Bot className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg">{APP_NAME} <span className="text-blue-400 font-medium">Checkout</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            Secure Payment
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-8 items-start">

          {/* Main Checkout Section */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Order Summary</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tight">₱ {fmt(txn.amount)}</span>
                <span className="text-slate-400 font-medium">{txn.currency}</span>
              </div>
            </div>

            <Card className="border-white/[0.08] bg-white/[0.03] overflow-hidden rounded-[1.5rem]">
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex justify-between items-start border-b border-white/[0.05] pb-6">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Merchant</p>
                      <p className="text-lg font-bold text-white">{txn.merchant_name || 'SwiftPay Merchant'}</p>
                    </div>
                    <Badge className={isPaid ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}>
                      {isPaid ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                      {txn.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Description</p>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {txn.description || "Digital transaction via SwiftPay"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Reference</p>
                        <div className="flex items-center gap-2">
                          <code className="text-[11px] font-mono text-slate-300 break-all">{txn.external_id}</code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(txn.external_id);
                              toast.success('Copied!');
                            }}
                            className="hover:text-blue-400 transition-colors"
                          >
                            <Clipboard className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Created</p>
                        <p className="text-[11px] text-slate-300">{new Date(txn.created_at).toLocaleString('en-PH')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isPending && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-400 px-1">Complete your payment using:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hasCheckoutLink && (
                    <button onClick={handleStartCheckout} className="group text-left w-full">
                      <div className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 transition-all hover:bg-blue-600/10 hover:border-blue-500/40 w-full">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-white">Direct Payment</p>
                            <p className="text-[11px] text-slate-500">Open the secure checkout popup</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                        </div>
                      </div>
                    </button>
                  )}
                  {hasQR && (
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                          <QrCode className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-white">QR Code</p>
                          <p className="text-[11px] text-slate-500">Scan with a QRPH-capable wallet</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
                      </div>
                      <div className="mt-4 rounded-2xl border border-white/[0.08] bg-slate-900/20 p-4 text-center">
                        <img
                          src={getQRImageUrl(txn.qr_code_url)}
                          alt="Checkout QR Code"
                          className="mx-auto h-40 w-40 bg-white rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="text-slate-400 text-sm">QR code failed to load</div>';
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {!hasCheckoutLink && !hasQR && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-center text-sm text-amber-400">
                    No active checkout URL or QR code is available for this transaction.
                  </div>
                )}
              </div>
            )}

            {/* Sticky bottom pay bar for mobile / convenience */}
            {isPending && (hasCheckoutLink || hasQR) && (
              <div className="fixed left-0 right-0 bottom-4 z-50 px-4 sm:px-6 lg:px-0 flex justify-center">
                <div className="max-w-4xl w-full bg-gradient-to-r from-white/5 to-white/3 backdrop-blur rounded-3xl p-3 flex items-center gap-4 border border-white/[0.06] shadow-lg">
                  <div className="flex-1">
                    <div className="text-sm text-slate-300">Total</div>
                    <div className="text-lg font-bold">₱ {fmt(txn.amount)}</div>
                  </div>
                  {hasCheckoutLink ? (
                    <button onClick={handleStartCheckout} className="inline-flex h-12 items-center justify-center rounded-2xl bg-blue-600 px-6 font-bold text-white transition-colors hover:bg-blue[...]
                      Pay Now
                    </button>
                  ) : (
                    <a href={txn.qr_code_url} target="_blank" rel="noopener noreferrer" className="inline-block">
                      <Button className="h-12 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold">Open QR</Button>
                    </a>
                  )}
                </div>
              </div>
            )}

            {isPaid && (
              <div className="rounded-[1.5rem] bg-emerald-500/10 border border-emerald-500/20 p-8 text-center space-y-4 animate-fade-in">
                <div className="h-16 w-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Payment Successful</h3>
                  <p className="text-slate-400 mt-1">Thank you for your business. Your transaction is complete.</p>
                </div>
                <div className="pt-4 flex justify-center gap-3">
                  <Button variant="outline" className="rounded-xl border-white/10 bg-white/5 text-slate-200 hover:text-white hover:bg-white/10">
                    View Receipt
                  </Button>
                  <Button asChild className="rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                    <Link to="/home">Return Home</Link>
                  </Button>
                </div>
              </div>
            )}

            {isExpired && (
              <div className="rounded-[1.5rem] bg-red-500/10 border border-red-500/20 p-8 text-center space-y-4">
                <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                  <Clock className="h-8 w-8 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Link Expired</h3>
                  <p className="text-slate-400 mt-1">This payment link is no longer active. Please contact the merchant for a new link.</p>
                </div>
                <Link to="/home" className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 font-medium text-slate-300 transition-colors hover:bg-white/10">
                  Go to {APP_NAME}
                </Link>
              </div>
            )}
          </div>

          {/* Security Info Sidebar */}
          <div className="space-y-4">
            <Card className="border-white/[0.08] bg-white/[0.02] rounded-[1.5rem]">
              <CardContent className="space-y-6 p-6">
                <div className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Lock className="h-4.5 w-4.5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">End-to-End Encryption</p>
                    <p className="text-[11px] text-slate-500 mt-1">Your data is secured using industry-standard AES-256 encryption protocol.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <ShieldCheck className="h-4.5 w-4.5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Verified Gateway</p>
                    <p className="text-[11px] text-slate-500 mt-1">Transactions are processed through certified payment gateways only.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
