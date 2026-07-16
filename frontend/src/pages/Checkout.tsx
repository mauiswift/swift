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
  Clipboard,
  Building2,
  Smartphone,
  Code2
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

interface Institution {
  id: string;
  code: string;
  name: string;
  logoUrl: string;
  enabled: boolean;
  loginMethod: string;
}

interface PaymentMethodCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverBgColor: string;
}

const PAYMENT_CATEGORIES: Record<string, PaymentMethodCategory> = {
  digital_wallets: {
    id: 'digital_wallets',
    label: 'Digital Wallets',
    icon: <Smartphone className="h-5 w-5" />,
    description: 'Fast & convenient mobile payments',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/5',
    borderColor: 'border-blue-500/20',
    hoverBgColor: 'hover:bg-blue-500/15',
  },
  banks: {
    id: 'banks',
    label: 'Bank Transfers',
    icon: <Building2 className="h-5 w-5" />,
    description: 'Direct bank payment methods',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/5',
    borderColor: 'border-purple-500/20',
    hoverBgColor: 'hover:bg-purple-500/15',
  },
  cards: {
    id: 'cards',
    label: 'Credit & Debit Cards',
    icon: <CreditCard className="h-5 w-5" />,
    description: 'Visa, Mastercard & other cards',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/5',
    borderColor: 'border-cyan-500/20',
    hoverBgColor: 'hover:bg-cyan-500/15',
  },
  qr_code: {
    id: 'qr_code',
    label: 'QR Code Payment',
    icon: <QrCode className="h-5 w-5" />,
    description: 'Scan with your banking app',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/5',
    borderColor: 'border-emerald-500/20',
    hoverBgColor: 'hover:bg-emerald-500/15',
  },
};

// Categorize institutions based on their codes
const categorizeInstitution = (code: string, name: string): string => {
  const upperCode = code.toUpperCase();
  const upperName = name.toUpperCase();

  // E-wallets
  if (['GCASH', 'MAYA', 'GRABPAY', 'SHOPEEPAY', 'ALIPAY', 'WECHAT'].some(w => upperCode.includes(w) || upperName.includes(w))) {
    return 'digital_wallets';
  }

  // Bank transfers / QR-based
  if (['INSTAPAY', 'PESONET', 'QRPH', 'VIRTUAL', 'VA'].some(b => upperCode.includes(b) || upperName.includes(b))) {
    return 'banks';
  }

  // Credit/Debit cards
  if (['CARD', 'VISA', 'MASTERCARD', 'AMEX', 'DINERS', 'UNIONPAY'].some(c => upperCode.includes(c) || upperName.includes(c))) {
    return 'cards';
  }

  return 'digital_wallets'; // default
};

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
      className: `${(children as React.ReactElement<{ className?: string }>).props.className ?? ''} inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`,
      ...props,
    });
  }

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`.trim()}
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

  if (/^https?:\/\//i.test(s)) {
    return s;
  }

  if (s.startsWith('data:')) {
    return s;
  }

  if (s.startsWith('<svg')) {
    try {
      return `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;
    } catch (e) {
      return s;
    }
  }

  const base64Like = /^[A-Za-z0-9+/=\s]+$/.test(s) && s.length > 100;
  if (base64Like) {
    const compact = s.replace(/\s+/g, '');
    return `data:image/png;base64,${compact}`;
  }

  return '';
};

export default function Checkout() {
  const { externalId, identifier } = useParams<{ externalId?: string; identifier?: string }>();
  const checkoutId = externalId ?? identifier;

  const [txn, setTxn] = useState<Transaction | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInstitutions, setLoadingLoadingInstitutions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const popupRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('digital_wallets');

  const startPollingStatus = (extId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        setPollCount(c => c + 1);
        const response = await client.get(`/api/v1/payments/checkout/${extId}/status`);
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

  const openCheckoutPopup = (url: string) => {
    popupRef.current = window.open(url, 'checkout', 'width=500,height=600,left=200,top=100');
  };

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const response = await client.get(`/api/v1/payments/checkout/${checkoutId}`);
        if (!response.ok) {
          throw new Error(response.data?.detail || 'Failed to load payment');
        }
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

    if (checkoutId) {
      fetchTransaction();
      fetchInstitutions();
    }
    else {
      setError('Invalid checkout URL');
      setLoading(false);
    }
  }, [checkoutId]);

  const fetchInstitutions = async () => {
    try {
      setLoadingLoadingInstitutions(true);
      const response = await client.get(`/api/v1/payments/checkout/${checkoutId}/institutions`);
      if (response.data?.success && Array.isArray(response.data.data)) {
        setInstitutions(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch institutions:', err);
    } finally {
      setLoadingLoadingInstitutions(false);
    }
  };

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
        <Link to="/home" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10">
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

  // Group institutions by category
  const institutionsByCategory = institutions.reduce((acc, inst) => {
    const category = categorizeInstitution(inst.code, inst.name);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(inst);
    return acc;
  }, {} as Record<string, Institution[]>);

  const handleStartCheckout = (institutionCode?: string) => {
    let url = txn.payment_url || txn.qr_code_url || '';
    if (!url) { toast.error('No checkout URL available'); return; }

    if (institutionCode) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}institution_code=${institutionCode}`;
    }

    openCheckoutPopup(url);
    startPollingStatus(txn.external_id);
  };

  return (
    <div className="min-h-screen bg-[#080E1A] text-white selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-white/[0.05] bg-white/[0.02] backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
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

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 items-start">

          {/* Main Checkout Section */}
          <div className="space-y-6">
            {/* Order Summary Card */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Order Summary</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tight">₱ {fmt(txn.amount)}</span>
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
                            className="hover:text-blue-400 transition-colors flex-shrink-0"
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

            {/* Payment Methods Section */}
            {isPending && (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <p className="text-base font-semibold text-white">Payment Methods</p>
                    <p className="text-xs text-slate-500 mt-0.5">Choose your preferred payment method</p>
                  </div>
                  {loadingInstitutions && <div className="h-3 w-3 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />}
                </div>

                {/* Categorized Payment Methods */}
                {institutions.length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(PAYMENT_CATEGORIES).map(([categoryId, category]) => {
                      const categoryInstitutions = institutionsByCategory[categoryId] || [];
                      if (categoryInstitutions.length === 0) return null;

                      const isExpanded = expandedCategory === categoryId;

                      return (
                        <div key={categoryId} className="overflow-hidden">
                          {/* Category Header */}
                          <button
                            onClick={() => setExpandedCategory(isExpanded ? null : categoryId)}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${category.bgColor} ${category.borderColor} hover:${category.hoverBgColor.split('hover:')[1]}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`${category.color}`}>
                                {category.icon}
                              </div>
                              <div className="text-left">
                                <p className="font-semibold text-white">{category.label}</p>
                                <p className="text-xs text-slate-400">{category.description}</p>
                              </div>
                            </div>
                            <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>

                          {/* Expanded Methods */}
                          {isExpanded && (
                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 pl-1 pr-1 pb-2 animate-in fade-in duration-200">
                              {categoryInstitutions.map((inst) => (
                                <button
                                  key={inst.id}
                                  onClick={() => handleStartCheckout(inst.code)}
                                  className={`group relative flex flex-col items-center justify-center rounded-2xl border transition-all duration-300 p-5 ${category.bgColor} ${category.borderColor} ${category.hoverBgColor}`}
                                >
                                  <div className="h-12 w-12 rounded-xl bg-white/10 p-2 mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <img src={inst.logoUrl} alt={inst.name} className="max-h-full max-w-full object-contain" />
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-300 group-hover:text-white uppercase tracking-wider text-center line-clamp-2">{inst.name}</p>
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight className={`h-4 w-4 ${category.color}`} />
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Fallback Payment Options */}
                    {hasCheckoutLink && (
                      <button onClick={() => handleStartCheckout()} className="group w-full text-left">
                        <div className="h-full rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 transition-all hover:bg-blue-500/10 hover:border-blue-500/40">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform flex-shrink-0">
                              <CreditCard className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white">Secure Checkout</p>
                              <p className="text-sm text-slate-400">All payment methods via secure gateway</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                          </div>
                        </div>
                      </button>
                    )}

                    {hasQR && (
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                            <QrCode className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-bold text-white">QR Code Payment</p>
                            <p className="text-sm text-slate-400">Scan with your banking app</p>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/20 p-6 text-center">
                          <img
                            src={getQRImageUrl(txn.qr_code_url)}
                            alt="Checkout QR Code"
                            className="mx-auto h-48 w-48 bg-white rounded-lg shadow-xl"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="text-slate-400 text-sm italic py-8">QR code unavailable</div>';
                              }
                            }}
                          />
                          <p className="mt-4 text-xs text-slate-500 uppercase tracking-widest font-medium">Scan to Pay</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {institutions.length > 0 && (
                  <div className="pt-2 px-1">
                    <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] text-center">
                      Powered by SwiftPay Secure Gateway
                    </p>
                  </div>
                )}

                {!hasCheckoutLink && !hasQR && !loadingInstitutions && (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
                    <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                    <p className="text-sm text-amber-400">No active payment methods available for this transaction.</p>
                  </div>
                )}
              </div>
            )}

            {/* Payment Success State */}
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

            {/* Payment Expired State */}
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

          {/* Sidebar: Security & Additional Info */}
          <div className="space-y-4 h-fit">
            {/* Security Features Card */}
            <Card className="border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] rounded-[1.5rem]">
              <CardContent className="space-y-5 p-6">
                <div className="pb-4 border-b border-white/[0.05]">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Security Features
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Lock className="h-4.5 w-4.5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200 uppercase tracking-wider">AES-256 Encryption</p>
                      <p className="text-[11px] text-slate-500 mt-1">Industry-standard encryption protocol</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200 uppercase tracking-wider">PCI DSS Compliant</p>
                      <p className="text-[11px] text-slate-500 mt-1">All transactions fully verified</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <Wallet className="h-4.5 w-4.5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Multiple Gateways</p>
                      <p className="text-[11px] text-slate-500 mt-1">Xendit & PayMongo integrated</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-white/[0.08] bg-white/[0.02] rounded-[1.5rem]">
              <CardContent className="space-y-4 p-6">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transaction ID</p>
                  <p className="text-xs text-slate-300 font-mono mt-1 break-all">{txn.external_id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment Type</p>
                  <p className="text-xs text-slate-300 mt-1 capitalize">{txn.transaction_type.replace('_', ' ')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Sticky Payment Bar */}
      {isPending && (hasCheckoutLink || hasQR) && (
        <div className="fixed left-0 right-0 bottom-0 z-40 px-4 sm:px-6 lg:px-0 py-4 bg-gradient-to-t from-[#080E1A] via-[#080E1A]/80 to-transparent flex justify-center">
          <div className="max-w-5xl w-full bg-gradient-to-r from-blue-600/20 to-indigo-600/20 backdrop-blur-xl rounded-2xl p-4 flex items-center justify-between gap-6 border border-blue-500/20 shadow-2xl">
            <div className="min-w-0">
              <div className="text-xs text-slate-400 uppercase tracking-wider">Total Amount</div>
              <div className="text-2xl font-black text-white tracking-tight">₱ {fmt(txn.amount)}</div>
            </div>
            <div className="flex-shrink-0 flex gap-3">
              {hasCheckoutLink && (
                <button onClick={() => handleStartCheckout()} className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 px-8 font-bold text-white transition-all duration-200 shadow-lg shadow-blue-600/50">
                  Pay Now <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
