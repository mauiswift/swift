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
} from 'lucide-react';
import { toast } from 'sonner';
import { APP_NAME } from '@/lib/brand';
import { fmt } from '@/lib/format';
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
          <h1 className="text-2xl font-bold mb-2">Payment Not Found</h1>
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

  const digitalWallets = institutions.filter(i => ['MAYA', 'GCASH'].includes(i.code.toUpperCase()));
  const banks = institutions.filter(i => !['MAYA', 'GCASH'].includes(i.code.toUpperCase()));

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-white/2 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-sm font-semibold">{APP_NAME}</h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Secure Payment
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Payment Details & Methods */}
          <div className="md:col-span-2 space-y-6">
            {/* Amount Card */}
            {!isPaid && !isExpired && (
              <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/20 rounded-2xl p-8">
                <p className="text-sm text-slate-400 mb-2">Amount to Pay</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tight">₱{fmt(txn.amount)}</span>
                  <span className="text-slate-400 text-lg">{txn.currency}</span>
                </div>
              </div>
            )}

            {/* Transaction Info */}
            {isPending && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Merchant</p>
                  <p className="text-sm font-semibold">{txn.merchant_name || 'SwiftPay Merchant'}</p>
                </div>
                {txn.description && (
                  <div className="pt-3 border-t border-white/5">
                    <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Description</p>
                    <p className="text-sm text-slate-300">{txn.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Payment Methods */}
            {isPending && (
              <div className="space-y-4">
                <div>
                  <p className="text-lg font-semibold mb-0.5">Select Payment Method</p>
                  <p className="text-sm text-slate-400">Choose how you'd like to pay</p>
                </div>

                {loadingInstitutions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                ) : institutions.length > 0 ? (
                  <div className="space-y-4">
                    {/* Digital Wallets */}
                    {digitalWallets.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-blue-400" />
                          <p className="text-xs font-semibold text-slate-400 uppercase">E-Wallets</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {digitalWallets.map((inst) => (
                            <button
                              key={inst.id}
                              onClick={() => handleStartCheckout(inst.code)}
                              className="group flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-blue-600/20 hover:border-blue-500/30 transition-all"
                            >
                              <img src={inst.logoUrl} alt={inst.name} className="h-6 w-6 object-contain" />
                              <span className="text-sm font-medium text-left flex-1">{inst.name}</span>
                              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 transition" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Banks */}
                    {banks.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-purple-400" />
                          <p className="text-xs font-semibold text-slate-400 uppercase">Banks</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {banks.map((inst) => (
                            <button
                              key={inst.id}
                              onClick={() => handleStartCheckout(inst.code)}
                              className="group flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-purple-600/20 hover:border-purple-500/30 transition-all"
                            >
                              <img src={inst.logoUrl} alt={inst.name} className="h-6 w-6 object-contain" />
                              <span className="text-sm font-medium text-left flex-1 truncate">{inst.name}</span>
                              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-purple-400 transition" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : hasCheckoutLink ? (
                  <button
                    onClick={() => handleStartCheckout()}
                    className="w-full flex items-center gap-3 p-4 rounded-lg border border-blue-500/30 bg-blue-600/20 hover:bg-blue-600/30 transition-all group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold">Secure Checkout</p>
                      <p className="text-xs text-slate-400">All payment methods</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-blue-400 group-hover:translate-x-1 transition" />
                  </button>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No payment methods available</p>
                  </div>
                )}

                {/* QR Code Option */}
                {hasQR && (
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="w-full flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <QrCode className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold">Scan QR Code</p>
                      <p className="text-xs text-slate-400">Use your banking app</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-500 group-hover:translate-x-1 transition" />
                  </button>
                )}
              </div>
            )}

            {/* Success State */}
            {isPaid && (
              <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/10 border border-emerald-500/20 rounded-2xl p-8 text-center space-y-4">
                <div className="h-16 w-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">Payment Successful</h2>
                  <p className="text-slate-400">Your transaction has been completed.</p>
                </div>
                <Link to="/home" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition">
                  Continue to {APP_NAME}
                </Link>
              </div>
            )}

            {/* Expired State */}
            {isExpired && (
              <div className="bg-gradient-to-br from-red-600/20 to-rose-600/10 border border-red-500/20 rounded-2xl p-8 text-center space-y-4">
                <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                  <Clock className="h-8 w-8 text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">Link Expired</h2>
                  <p className="text-slate-400">This payment link is no longer active.</p>
                </div>
                <Link to="/home" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition">
                  Return Home
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: Security & Transaction Details */}
          <div className="space-y-4">
            {/* Security Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <p className="text-sm font-semibold">Security</p>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex gap-2">
                  <Lock className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-200">AES-256 Encrypted</p>
                    <p className="text-slate-500">Industry standard</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-200">PCI DSS Compliant</p>
                    <p className="text-slate-500">Payment secured</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Transaction ID</p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-slate-300 truncate">{txn.external_id}</code>
                <button
                  onClick={() => copyToClipboard(txn.external_id)}
                  className="p-1 hover:bg-white/10 rounded transition flex-shrink-0"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-500" />}
                </button>
              </div>

              <div className="pt-3 border-t border-white/5">
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">Created</p>
                <p className="text-xs text-slate-400">{new Date(txn.created_at).toLocaleString('en-PH')}</p>
              </div>
            </div>

            {/* Powered By */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">Powered by</p>
              <p className="text-sm font-semibold text-blue-400">{APP_NAME}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Button */}
      {isPending && hasCheckoutLink && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent p-4 border-t border-white/5">
          <button
            onClick={() => handleStartCheckout()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
          >
            Pay Now
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
