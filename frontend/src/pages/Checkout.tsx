import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { client } from '@/lib/api';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  QrCode,
  Smartphone,
  Building2,
  Copy,
  X,
  Loader2,
  Store,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { APP_NAME } from '@/lib/brand';
import { fmtCurrencyPhp } from '@/lib/format';
import { PAYMENT_CHANNELS, getPaymentChannelsByCategory } from '@/config/payment-channels-official';

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
  merchant_logo_url?: string;
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

export default function Checkout() {
  const { externalId, identifier } = useParams<{ externalId?: string; identifier?: string }>();
  const checkoutId = externalId ?? identifier;

  const [txn, setTxn] = useState<Transaction | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInstitutions, setLoadingLoadingInstitutions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPollingStatus = (extId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(async () => {
      try {
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
    } else {
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
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-14 w-14 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Loading payment</p>
        </div>
      </div>
    );
  }

  if (error || !txn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Payment Not Found</h1>
          <p className="text-slate-400 mb-8">{error || 'The requested payment link is invalid or has expired.'}</p>
          <Link to="/home" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
            Go to {APP_NAME}
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = txn?.status === 'paid';
  const isExpired = txn?.status === 'expired' || txn?.status === 'cancelled';
  const isPending = txn?.status === 'pending';
  const hasCheckoutLink = !!txn?.payment_url;
  const hasQR = !!txn?.qr_code_url;

  const isAlipay = txn?.transaction_type === 'alipay_qr';
  const isWeChat = txn?.transaction_type === 'wechat_qr';
  const isMagpieCheckout = txn?.transaction_type === 'magpie_checkout';

  const digitalWallets = institutions.filter(i => ['MAYA', 'GCASH'].includes(i.code.toUpperCase()));
  const banks = institutions.filter(i => !['MAYA', 'GCASH'].includes(i.code.toUpperCase()));

  const handleStartCheckout = (institutionCode?: string) => {
    let url = txn.payment_url || txn.qr_code_url || '';
    if (!url) { toast.error('No checkout URL available'); return; }

    if (institutionCode) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}institution_code=${institutionCode}`;
      window.location.href = url;
      return;
    }

    openCheckoutPopup(url);
    startPollingStatus(txn.external_id);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans pb-20">
      {/* Branded Header */}
      <div className="bg-white border-b border-slate-200 py-10 mb-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 overflow-hidden">
            {txn.merchant_logo_url ? (
              <img src={txn.merchant_logo_url} alt={txn.merchant_name} className="w-full h-full object-contain p-2" />
            ) : (
              <Store size={32} className="text-slate-200" />
            )}
          </div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-2">{txn.merchant_name || 'SwiftPay Merchant'}</h1>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            <ShieldCheck size={14} className="text-emerald-500" />
            Secure Checkout
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Left Column: Payment Details & Methods */}
          <div className="md:col-span-2 space-y-8">
            {/* Amount Card */}
            {!isPaid && !isExpired && (
              <div className="bg-[#111111] rounded-[32px] p-10 shadow-xl shadow-black/10 text-white">
                <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Amount to Pay</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-semibold tracking-tighter">{fmtCurrencyPhp(txn.amount)}</span>
                </div>
                {txn.description && (
                  <p className="mt-6 text-slate-300 text-[14px] leading-relaxed border-t border-white/10 pt-6">
                    {txn.description}
                  </p>
                )}
              </div>
            )}

            {/* Payment Methods */}
            {isPending && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[16px] font-semibold text-slate-900 mb-1">Select Payment Channel</h2>
                  <p className="text-[13px] text-slate-500">Choose your preferred bank, wallet, or payment flow.</p>
                </div>

                {loadingInstitutions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
                  </div>
                ) : isAlipay ? (
                  <button
                    onClick={() => handleStartCheckout()}
                    className="w-full flex items-center gap-5 p-6 rounded-2xl border border-slate-200 bg-white hover:border-[#FF6B00] hover:shadow-lg transition-all group"
                  >
                    <div className="h-14 w-14 rounded-xl bg-[#00A0E9]/10 flex items-center justify-center flex-shrink-0">
                      <img src="/logos/alipay.svg" alt="Alipay" className="h-8 w-8" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-lg text-slate-900">Pay with Alipay</p>
                      <p className="text-[13px] text-slate-500">Fast & secure mobile wallet</p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-slate-300 group-hover:text-[#FF6B00] group-hover:translate-x-1 transition" />
                  </button>
                ) : isWeChat ? (
                  <button
                    onClick={() => handleStartCheckout()}
                    className="w-full flex items-center gap-5 p-6 rounded-2xl border border-slate-200 bg-white hover:border-[#07C160] hover:shadow-lg transition-all group"
                  >
                    <div className="h-14 w-14 rounded-xl bg-[#07C160]/10 flex items-center justify-center flex-shrink-0">
                      <img src="/logos/wechat.svg" alt="WeChat Pay" className="h-8 w-8" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-lg text-slate-900">Pay with WeChat Pay</p>
                      <p className="text-[13px] text-slate-500">Secure payments via WeChat</p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-slate-300 group-hover:text-[#07C160] group-hover:translate-x-1 transition" />
                  </button>
                ) : isMagpieCheckout ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => handleStartCheckout()}
                      className="w-full flex items-center gap-5 p-6 rounded-2xl border border-slate-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all group"
                    >
                      <div className="h-14 w-14 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                         <div className="flex -space-x-2">
                            <img src="/logos/alipay.svg" alt="Alipay" className="h-6 w-6 relative z-10" />
                            <img src="/logos/wechat.svg" alt="WeChat Pay" className="h-6 w-6" />
                         </div>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-lg text-slate-900">International Checkout</p>
                        <p className="text-[13px] text-slate-500">Alipay and WeChat Pay supported</p>
                      </div>
                      <ArrowRight className="h-6 w-6 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition" />
                    </button>
                  </div>
                ) : institutions.length > 0 ? (
                  <div className="space-y-6">
                    {/* Digital Wallets */}
                    {digitalWallets.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-[#FF6B00]" />
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">E-Wallets</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {digitalWallets.map((inst) => (
                            <button
                              key={inst.id}
                              onClick={() => handleStartCheckout(inst.code)}
                              className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-[#FF6B00] hover:shadow-md transition-all"
                            >
                              <div className="h-10 w-10 flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                                <img src={inst.logoUrl} alt={inst.name} className="h-7 w-7 object-contain" />
                              </div>
                              <span className="text-[14px] font-semibold text-slate-900 text-left flex-1">{inst.name}</span>
                              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#FF6B00] transition" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Banks */}
                    {banks.length > 0 && (
                      <div className="space-y-4 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#FF6B00]" />
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Banks</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {banks.map((inst) => (
                            <button
                              key={inst.id}
                              onClick={() => handleStartCheckout(inst.code)}
                              className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-[#FF6B00] hover:shadow-md transition-all"
                            >
                              <div className="h-10 w-10 flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                                <img src={inst.logoUrl} alt={inst.name} className="h-7 w-7 object-contain" />
                              </div>
                              <span className="text-[14px] font-semibold text-slate-900 text-left flex-1 truncate">{inst.name}</span>
                              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#FF6B00] transition" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : hasCheckoutLink ? (
                  <button
                    onClick={() => handleStartCheckout()}
                    className="w-full bg-[#111111] text-white py-6 rounded-2xl font-semibold text-lg shadow-xl shadow-black/20 hover:bg-black transition-all flex items-center justify-center gap-3 group"
                  >
                    Secure Checkout
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
                    <AlertCircle className="h-10 w-10 mx-auto mb-4 text-slate-200" />
                    <p className="text-[14px] font-semibold text-slate-400">No payment methods available</p>
                  </div>
                )}

                {/* QR Code Option */}
                {hasQR && (
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 transition-all group"
                  >
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <QrCode className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-slate-900">Scan QR Code</p>
                      <p className="text-[12px] text-slate-500">Pay using your banking app</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 transition" />
                  </button>
                )}
              </div>
            )}

            {/* Success State */}
            {isPaid && (
              <div className="bg-white border border-slate-200 rounded-[32px] p-12 text-center space-y-6 shadow-xl shadow-slate-200/50">
                <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">Payment Successful</h2>
                  <p className="text-slate-500">Your transaction has been completed successfully.</p>
                </div>
                <div className="pt-4">
                  <Link to="/home" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#111111] text-white rounded-xl font-semibold transition hover:bg-black shadow-lg shadow-black/10">
                    Done
                  </Link>
                </div>
              </div>
            )}

            {/* Expired State */}
            {isExpired && (
              <div className="bg-white border border-slate-200 rounded-[32px] p-12 text-center space-y-6 shadow-xl shadow-slate-200/50">
                <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto border border-rose-100">
                  <Clock className="h-10 w-10 text-rose-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">Link Expired</h2>
                  <p className="text-slate-500">This payment link is no longer active.</p>
                </div>
                <div className="pt-4">
                  <Link to="/home" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-100 text-slate-900 rounded-xl font-semibold transition hover:bg-slate-200">
                    Return Home
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Security & Transaction Details */}
          <div className="space-y-6">
            {/* Security Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <p className="text-[12px] font-semibold text-slate-900 uppercase tracking-widest">Security</p>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Lock className="h-4 w-4 text-[#FF6B00] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-semibold text-slate-900">AES-256 Encrypted</p>
                    <p className="text-[11px] text-slate-500 leading-tight">Your data is secured with industry-standard encryption.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-semibold text-slate-900">PCI DSS Compliant</p>
                    <p className="text-[11px] text-slate-500 leading-tight">All transactions are processed through secure gateways.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Transaction ID</p>
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <code className="text-[12px] font-mono font-semibold text-slate-600 truncate flex-1">{txn.external_id}</code>
                  <button
                    onClick={() => copyToClipboard(txn.external_id)}
                    className="p-1.5 hover:bg-white rounded-lg transition shrink-0 shadow-sm border border-transparent hover:border-slate-200"
                  >
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                  </button>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-50">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Created</p>
                <p className="text-[13px] font-semibold text-slate-900">{new Date(txn.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
            </div>

            {/* Powered By */}
            <div className="text-center pt-4">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.2em] mb-1">Powered by</p>
              <p className="text-[14px] font-semibold text-slate-900 tracking-tight">{APP_NAME}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Button */}
      {isPending && hasCheckoutLink && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md p-5 border-t border-slate-200 z-50">
          <button
            onClick={() => handleStartCheckout()}
            className="w-full bg-[#111111] text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-black/10 active:scale-[0.98] transition-all"
          >
            Pay Now
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
