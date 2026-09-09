import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { client } from '@/lib/api';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  ArrowUpRight,
  QrCode,
  Smartphone,
  Building2,
  Copy,
  X,
  Loader2,
  Store,
} from 'lucide-react';
import { toast } from 'sonner';
import { APP_NAME } from '@/lib/brand';
import { fmtCurrency } from '@/lib/format';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import LoadingSkeleton from '@/design-system/components/LoadingSkeleton';
import { fetchPaymentChannels, isPaymentChannelEnabled, type PaymentChannels } from '@/lib/paymentChannels';

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
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  toss_deep_link?: string;
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
    const [paymentChannels, setPaymentChannels] = useState<PaymentChannels | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingInstitutions, setLoadingLoadingInstitutions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPollingStatus = (extId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await client.get(`/api/v1/payments/checkout/${extId}/status`);
        const status = String(response.data?.status || '').toLowerCase();
        if (status === 'paid' || status === 'completed' || status === 'executed') {
          setTxn(prev => prev ? { ...prev, status: 'paid' } : null);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          toast.success('Payment confirmed!');
        } else if (status === 'expired' || status === 'cancelled' || status === 'failed') {
          setTxn(prev => prev ? { ...prev, status } : null);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
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
      fetchPaymentChannels().then(setPaymentChannels).catch(() => undefined);
    } else {
      setError('Invalid checkout URL');
      setLoading(false);
    }
  }, [checkoutId]);

  useEffect(() => {
    if (txn?.status === 'pending' && txn.external_id) {
      startPollingStatus(txn.external_id);
    }
  }, [txn?.status, txn?.external_id]);

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
    return <LoadingSkeleton variant="page" />;
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
  const hasQR = !!txn?.qr_code_url && isPaymentChannelEnabled(paymentChannels, txn?.currency, 'checkout', 'qr_code');
  const isPhp = txn?.currency?.toUpperCase() === 'PHP';
  const isKrw = txn?.currency?.toUpperCase() === 'KRW';

  const isAlipay = txn?.transaction_type === 'alipay_qr' && isPaymentChannelEnabled(paymentChannels, txn?.currency, 'checkout', 'alipay');
  const isWeChat = txn?.transaction_type === 'wechat_qr' && isPaymentChannelEnabled(paymentChannels, txn?.currency, 'checkout', 'wechat');
  const isMagpieCheckout = txn?.transaction_type === 'magpie_checkout';
  const merchantDisplayName = txn.merchant_name?.trim() || 'Merchant';
  const krwTransferQrValue = [
    'SWIFTPAY-KRW-TRANSFER',
    `BANK:${txn.bank_name || 'Toss Bank'}`,
    `ACCOUNT:${txn.bank_account_number || '1908-1618-8260'}`,
    `NAME:${txn.bank_account_name || 'SwiftPay Ventures Inc.'}`,
    `AMOUNT:${Number(txn.amount).toFixed(2)} KRW`,
  ].join('\n');
  const digitalWallets = institutions.filter(i => ['MAYA', 'GCASH'].includes(i.code.toUpperCase()));
  const banks = institutions.filter(i => !['MAYA', 'GCASH'].includes(i.code.toUpperCase()));

  const handleStartCheckout = (institutionCode?: string) => {
    const url = txn.payment_url || txn.qr_code_url || '';
    if (!url) { toast.error('No checkout URL available'); return; }

    if (isKrw && institutionCode) {
      const redirectUrl = new URL(url, window.location.origin);
      redirectUrl.searchParams.set('payment_method', 'card');
      if (institutionCode.trim().toUpperCase() === 'KAKAOPAY') {
        redirectUrl.searchParams.set('wallet', 'kakaopay');
      }
      openCheckoutPopup(redirectUrl.toString());
      startPollingStatus(txn.external_id);
      return;
    }

    if (isPhp && institutionCode) {
      const redirectUrl = new URL(url, window.location.origin);
      redirectUrl.searchParams.set('institution_code', institutionCode.trim().toUpperCase());
      window.location.assign(redirectUrl.toString());
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

  const renderInstitutionButton = (institution: Institution) => (
    <button
      key={institution.id}
      type="button"
      onClick={() => handleStartCheckout(institution.code)}
      className="group flex min-h-20 items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-all hover:border-[#FF6B00] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
      aria-label={`Pay with ${institution.name}`}
    >
      <PaymentBrandLogo
        brand={institution.code || institution.name}
        logoUrl={institution.logoUrl}
        size="md"
        className="border border-slate-100 shadow-sm"
      />
      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-slate-900">{institution.name}</span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-300 transition-colors group-hover:bg-orange-50 group-hover:text-[#FF6B00]">
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  );

  return (
    <div className={`${isKrw ? 'krw-checkout font-[Noto_Sans_KR]' : ''} min-h-screen bg-[#F9FAFB] text-slate-900 font-sans pb-20`}>
      {/* Branded Header */}
      <div className={`${isKrw ? 'bg-[#f7f9fc]' : 'bg-white'} border-b border-slate-200 py-10 mb-8`}>
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 overflow-hidden">
            {txn.merchant_logo_url ? (
              <img src={txn.merchant_logo_url} alt={txn.merchant_name} className="w-full h-full object-contain p-2" />
            ) : (
              <Store size={32} className="text-slate-200" />
            )}
          </div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-2">{merchantDisplayName}</h1>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            <ShieldCheck size={14} className="text-emerald-500" />
            {isKrw ? '안전한 결제 페이지' : 'Secure Checkout'}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Left Column: Payment Details & Methods */}
          <div className="md:col-span-2 space-y-8">
            {/* Amount Card */}
            {!isPaid && !isExpired && !isKrw && (
              <div className="bg-[#111111] rounded-[32px] p-10 shadow-xl shadow-black/10 text-white">
                <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest mb-4">{isKrw ? '결제 금액' : 'Amount to Pay'}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-semibold tracking-tighter">{fmtCurrency(txn.amount, txn.currency)}</span>
                </div>
                {txn.description && (
                  <p className="mt-6 text-slate-300 text-[14px] leading-relaxed border-t border-white/10 pt-6">
                    {txn.description}
                  </p>
                )}
              </div>
            )}

            {isPending && isKrw && (
              <div className="overflow-hidden rounded-[28px] border border-[#d8e4f5] bg-white shadow-[0_18px_55px_rgba(15,63,120,0.10)]">
                <div className="bg-[linear-gradient(120deg,#071b3a_0%,#0b4b9a_58%,#1475d1_100%)] px-6 py-7 text-white sm:px-8">
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div>
                      <div className="mb-4 flex items-center gap-2 text-[10px] font-bold tracking-[0.24em] text-blue-100">
                        <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_0_4px_rgba(103,232,249,0.15)]" />
                        KRW BANK TRANSFER
                      </div>
                      <h2 className="text-2xl font-semibold tracking-tight">토스뱅크 계좌이체</h2>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-blue-100">아래 QR을 스캔하거나 계좌 정보를 사용해 정확한 금액을 보내 주세요.</p>
                    </div>
                    <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-blue-50 backdrop-blur-sm">
                      결제 대기 중
                    </div>
                  </div>
                  <div className="mt-7 flex flex-wrap items-end gap-x-8 gap-y-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">보내실 금액</p>
                      <p className="mt-1 text-4xl font-bold tracking-tight">{fmtCurrency(txn.amount, txn.currency)}</p>
                    </div>
                    <div className="h-9 w-px bg-white/20" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">주문번호</p>
                      <p className="mt-1 font-mono text-sm font-semibold text-white">{txn.external_id}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 bg-[#f5f8fc] p-5 sm:p-8">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Transfer details</p>
                        <p className="mt-1 text-sm text-slate-500">송금 전 아래 계좌 정보를 먼저 확인하세요.</p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        ['은행', txn.bank_name || 'Toss Bank'],
                        ['예금주', txn.bank_account_name || 'SwiftPay Ventures Inc.'],
                        ['계좌번호', txn.bank_account_number || '1908-1618-8260'],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-[#dce7f5] bg-white px-4 py-3.5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
                          <p className={`mt-1.5 break-all text-sm font-semibold text-slate-900 ${label === '계좌번호' ? 'font-mono' : ''}`}>{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <p>정확한 금액을 보내고 주문번호를 입금자명 또는 메모에 입력하세요. 입금 확인 후 결제 상태가 자동으로 업데이트됩니다.</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#dce7f5] bg-white p-4 text-center shadow-sm">
                    <div className="mx-auto flex aspect-square max-w-[208px] items-center justify-center rounded-xl bg-white p-2">
                      <QRCodeSVG value={krwTransferQrValue} size={188} level="M" includeMargin bgColor="#ffffff" fgColor="#071b3a" />
                    </div>
                    <p className="mt-4 text-xs font-bold text-slate-900">QR로 송금 정보 불러오기</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">계좌 정보를 확인한 뒤 은행 앱에서 QR을 스캔하세요.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Methods */}
            {isPending && !isKrw && (
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
                      <PaymentBrandLogo brand="Alipay" size="md" className="bg-transparent" />
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
                      <PaymentBrandLogo brand="WeChat Pay" size="md" className="bg-transparent" />
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
                           <PaymentBrandLogo brand="Alipay" size="sm" className="relative z-10 bg-white" />
                           <PaymentBrandLogo brand="WeChat Pay" size="sm" className="bg-white" />
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
                          {digitalWallets.map(renderInstitutionButton)}
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
                          {banks.map(renderInstitutionButton)}
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
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="pt-5 border-t border-slate-50">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Created</p>
                <p className="text-[13px] font-semibold text-slate-900">{new Date(txn.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
            </div>

            {txn.bank_account_number && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
                  <PaymentBrandLogo brand={txn.bank_name || 'Bank'} size="sm" />
                  <p className="text-[12px] font-semibold text-slate-900 uppercase tracking-widest">Payment account</p>
                </div>
                <div className="space-y-3 text-[13px]">
                  {txn.bank_name && <div><p className="text-[11px] text-slate-400">Bank</p><p className="font-semibold text-slate-900">{txn.bank_name}</p></div>}
                  {txn.bank_account_name && <div><p className="text-[11px] text-slate-400">Account holder</p><p className="font-semibold text-slate-900">{txn.bank_account_name}</p></div>}
                  <div>
                    <p className="text-[11px] text-slate-400">Account number</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="font-mono font-semibold text-slate-900 break-all flex-1">{txn.bank_account_number}</code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(txn.bank_account_number as string)}
                        className="p-1.5 hover:bg-slate-50 rounded-lg transition shrink-0"
                        aria-label="Copy account number"
                      >
                        {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Merchant identity */}
            <div className="text-center pt-4">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.2em] mb-1">Store</p>
              <p className="text-[14px] font-semibold text-slate-900 tracking-tight">{merchantDisplayName}</p>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
