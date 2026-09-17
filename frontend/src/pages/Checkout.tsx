import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { client } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';
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
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { APP_NAME } from '@/lib/brand';
import { fmtCurrency, getCurrencyName } from '@/lib/format';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import LoadingSkeleton from '@/design-system/components/LoadingSkeleton';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { fetchPaymentChannels, isPaymentChannelEnabled, type PaymentChannels } from '@/lib/paymentChannels';
import { resolveCheckoutQrPanelMode, sanitizeCheckoutDeepLink, sanitizeGcashAppDeepLink } from '@/lib/checkoutQr';

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
  logoUrl?: string;
  enabled: boolean;
  loginMethod: string;
}

const SUPPORTED_KRW_BANKS = [
  { code: 'KB', name: 'KB Kookmin Bank' },
  { code: 'SHINHAN', name: 'Shinhan Bank' },
  { code: 'HANA', name: 'Hana Bank' },
  { code: 'WOORI', name: 'Woori Bank' },
  { code: 'NH', name: 'NH NongHyup Bank' },
  { code: 'IBK', name: 'IBK' },
  { code: 'KDB', name: 'KDB Bank' },
  { code: 'SC', name: 'SC First Bank' },
  { code: 'KAKAO', name: 'Kakao Bank' },
  { code: 'NAVER', name: 'Naver Bank' },
];

const SWIFTPAY_INSTITUTION_PREFIXES: Record<string, string[]> = {
  BDO: ['BNORPHM'], BPI: ['BOPIPHM'], RCBC: ['RCBCPHM'], UNIONBANK: ['UBPHPHM'],
  METROBANK: ['MBTCPHM'], LANDBANK: ['TLBPPHM'], PNB: ['PNBMPHM'],
  EASTWEST: ['EWB CPHM'.replace(' ', ''), 'EAWRPHM'], CHINABANK: ['CHSVPHM', 'CHBKPHM'],
  SECURITYBANK: ['SETCPHM'], UBP: ['UBPHPHM'], UCPB: ['UCPVPHM'],
  PSBANK: ['PSB PPHM'.replace(' ', '')], CIMB: ['CIPHPHM'], MAYBANK: ['MBBEPHM'],
  ROBINSONS: ['ROBPPHM'],
};

export default function Checkout() {
  const { externalId, identifier } = useParams<{ externalId?: string; identifier?: string }>();
  const checkoutId = externalId ?? identifier;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const t = useTranslation(language);

  const [txn, setTxn] = useState<Transaction | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [paymentChannels, setPaymentChannels] = useState<PaymentChannels | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingInstitutions, setLoadingLoadingInstitutions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showQRPhModal, setShowQRPhModal] = useState(false);
  const openAmount = searchParams.get('open_amount') === '1';
  const [enteredAmount, setEnteredAmount] = useState('');
  const [openAmountRequestId, setOpenAmountRequestId] = useState<string | null>(null);
  const [openAmountSubmitted, setOpenAmountSubmitted] = useState(false);
  const [gcashDeepLink, setGcashDeepLink] = useState<string | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutModalUrl, setCheckoutModalUrl] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gcashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const openCheckoutModal = (url: string) => {
    setCheckoutModalUrl(url);
    setShowCheckoutModal(true);
  };

  const handleGcashDeepLink = async (deepLink: string) => {
    try {
      window.location.href = deepLink;
      if (gcashTimeoutRef.current) clearTimeout(gcashTimeoutRef.current);
      gcashTimeoutRef.current = setTimeout(() => {
        toast.info('GCash app not found. Please scan the QR code to pay.');
      }, 2500);
    } catch (err) {
      console.error('Failed to open GCash:', err);
      toast.error('Unable to open GCash app. Please scan the QR code to pay.');
    }
  };

  useEffect(() => {
    const qrphRedirect = searchParams.get('payment_method') === 'qrph';
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
        if (searchParams.get('open_amount') === '1') {
          setEnteredAmount('');
        }
        if (qrphRedirect && response.data.qr_code_url) {
          setShowQRPhModal(true);
          startPollingStatus(response.data.external_id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payment');
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
  }, [checkoutId, searchParams]);

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
      if (gcashTimeoutRef.current) clearTimeout(gcashTimeoutRef.current);
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
  const currencyCode = txn.currency?.trim().toUpperCase() || 'PHP';
  const currencyName = getCurrencyName(currencyCode);
  const displayReference = txn.external_id.replace(/^OPEN-AMOUNT-/i, '');
  const hasCheckoutLink = !!txn?.payment_url;
  const isPhp = currencyCode === 'PHP';
  const isCny = currencyCode === 'CNY';
  const isKrw = currencyCode === 'KRW';
  const isKoreanCheckout = isKrw || ['ko', 'kr', 'korean'].includes((searchParams.get('lang') || '').trim().toLowerCase());
  const payableAmountForFlow = openAmount && enteredAmount ? Number(enteredAmount) : Number(txn?.amount);
  const isHighValuePhp = isPhp && payableAmountForFlow > 50000;
  const isManualDeposit = (isKrw && !hasCheckoutLink) || isHighValuePhp;
  const usesHighValuePhpQr = isHighValuePhp;
  const hasQR = usesHighValuePhpQr || (!!txn?.qr_code_url && isPaymentChannelEnabled(paymentChannels, txn?.currency, 'checkout', 'qr_code')) || !!gcashDeepLink;
  const paymentMethodParam = String(searchParams.get('payment_method') || '').trim().toLowerCase();
  const hasQrPayload = usesHighValuePhpQr || !!(txn?.qr_code_url && String(txn.qr_code_url).trim());
  const qrPanelMode = resolveCheckoutQrPanelMode({
    hasQR,
    hasQrPayload,
    paymentMethod: paymentMethodParam,
    gcashDeepLink,
  });
  const payableAmount = openAmount ? Number(enteredAmount) : Number(txn.amount);

  const isAlipay = txn?.transaction_type === 'alipay_qr' && isPaymentChannelEnabled(paymentChannels, txn?.currency, 'checkout', 'alipay');
  const isWeChat = txn?.transaction_type === 'wechat_qr' && isPaymentChannelEnabled(paymentChannels, txn?.currency, 'checkout', 'wechat');
  const isMagpieCheckout = txn?.transaction_type === 'magpie_checkout';
  const merchantDisplayName = txn.merchant_name?.trim() || 'Merchant';
  const manualDepositBankName = isHighValuePhp ? 'Security Bank Corporation' : (txn.bank_name || 'Toss Bank');
  const manualDepositAccountNumber = isHighValuePhp ? '0000068888173' : (txn.bank_account_number || '1908-1618-8260');
  const manualDepositAccountName = isHighValuePhp ? 'SwiftPay Ventures Inc.' : (txn.bank_account_name || 'SwiftPay Ventures Inc.');
  const krwTransferQrValue = [
    'SWIFTPAY-KRW-TRANSFER',
    `BANK:${txn.bank_name || 'Toss Bank'}`,
    `ACCOUNT:${txn.bank_account_number || '1908-1618-8260'}`,
    `NAME:${txn.bank_account_name || 'SwiftPay Ventures Inc.'}`,
    `AMOUNT:${Number(txn.amount).toFixed(2)} KRW`,
  ].join('\n');
  const enabledPhpInstitutions = paymentChannels?.PHP?.checkout_institutions;
  const qrCodeEnabled = isPaymentChannelEnabled(paymentChannels, txn?.currency || 'PHP', 'checkout', 'qr_code');
  const institutionCode = (institution: Institution) => String(institution.code || '').trim().toUpperCase();
  const enabledInstitutionCode = (code: string) => String(code || '').trim().toUpperCase();
  const institutionIsEnabled = (providerCode: string, enabledCodes: string[]) => {
    const normalized = enabledInstitutionCode(providerCode);
    return enabledCodes.some(code => {
      const enabled = enabledInstitutionCode(code);
      return enabled === normalized || (SWIFTPAY_INSTITUTION_PREFIXES[enabled] || []).some(prefix => normalized.startsWith(prefix));
    });
  };
  const visibleInstitutions = institutions.filter(institution => (
    !isPhp
    || institutionCode(institution) === 'QRPH'
    || !Array.isArray(enabledPhpInstitutions)
    || institutionIsEnabled(institutionCode(institution), enabledPhpInstitutions)
  ));
  const qrphInstitutions = visibleInstitutions.filter(i => institutionCode(i) === 'QRPH');
  const digitalWallets = visibleInstitutions.filter(i => ['MAYA', 'GCASH'].includes(institutionCode(i)));
  const banks = visibleInstitutions.filter(i => !['MAYA', 'GCASH', 'QRPH'].includes(institutionCode(i)));
  const checkoutPathWithPaymentMethod = (targetCheckoutId: string, paymentMethod: 'gcash' | 'qrph') => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('payment_method', paymentMethod);
    return `/checkout/${encodeURIComponent(targetCheckoutId)}?${nextParams.toString()}`;
  };

  const handleStartCheckout = async (institutionCode?: string) => {
    const selectedInstitutionCode = institutionCode?.trim().toUpperCase() || '';
    let checkoutUrl = txn.payment_url || txn.qr_code_url || '';
    let activeExternalId = openAmountRequestId || txn.external_id;
    if (openAmount) {
      if (!Number.isFinite(payableAmount) || payableAmount <= 0) {
        toast.error('Enter a valid amount to pay.');
        return;
      }
      setTxn(prev => prev ? { ...prev, amount: payableAmount } : null);
      if (!openAmountRequestId) {
        try {
          const response = await client.post(`/api/v1/payments/checkout/${encodeURIComponent(txn.external_id)}/open-amount-request`, { amount: payableAmount });
          if (!response.ok) throw new Error(response.data?.detail || 'Unable to submit payment for approval');
          setOpenAmountRequestId(response.data.external_id);
          activeExternalId = response.data.external_id;
          setTxn(prev => prev ? {
            ...prev,
            id: response.data.id,
            external_id: response.data.external_id,
            amount: Number(response.data.amount),
            payment_url: `/checkout/${response.data.external_id}`,
          } : null);
          checkoutUrl = `/checkout/${response.data.external_id}`;
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Unable to submit payment for approval');
          return;
        }
      }
    }
    const checkoutExternalId = activeExternalId;
    const url = checkoutUrl;
    if (!url) { toast.error('No checkout URL available'); return; }

    if (isKrw && institutionCode) {
      const redirectUrl = new URL(url, window.location.origin);
      redirectUrl.searchParams.set('payment_method', 'card');
      if (institutionCode.trim().toUpperCase() === 'KAKAOPAY') {
        redirectUrl.searchParams.set('wallet', 'kakaopay');
      }
      openCheckoutModal(redirectUrl.toString());
      startPollingStatus(checkoutExternalId);
      return;
    }

    if (isPhp && institutionCode) {
      try {
        const checkoutIdentifier = checkoutExternalId || String(txn.id);
        const response = await client.post(`/api/v1/payments/checkout/${encodeURIComponent(checkoutIdentifier)}/institution`, {
          institution_code: selectedInstitutionCode,
          ...(openAmount ? { amount: payableAmount } : {}),
        });
        if (!response.ok) {
          throw new Error(response.data?.detail || response.data?.error || 'Unable to open the selected bank. Please try again.');
        }
        if (selectedInstitutionCode === 'GCASH') {
          const gcashDeepLink = sanitizeGcashAppDeepLink(
            response.data?.gcash_deep_link || response.data?.deep_link,
          );
          const qrPayload = response.data?.qr_content || response.data?.qr_code;
          if (!gcashDeepLink && !qrPayload) throw new Error('No GCash payment details returned');
          const gcashPageUrl = new URL(
            `/checkout/${encodeURIComponent(checkoutIdentifier)}/gcash`,
            window.location.origin,
          );
          if (gcashDeepLink) gcashPageUrl.searchParams.set('deep_link', gcashDeepLink);
          if (qrPayload) gcashPageUrl.searchParams.set('qr', qrPayload);
          navigate(`${gcashPageUrl.pathname}${gcashPageUrl.search}`);
          return;
        }
        if (['GCASH', 'QRPH'].includes(selectedInstitutionCode) && (response.data?.qr_content || response.data?.qr_code || response.data?.deep_link)) {
          const gcashDestination = sanitizeGcashAppDeepLink(response.data?.deep_link);
          const qrPayload = response.data.qr_content || response.data.qr_code || gcashDestination || '';
          const qrAppLink = gcashDestination || (
            qrPayload && !/^https?:\/\//i.test(qrPayload)
              ? buildGcashDeepLink(qrPayload, txn)
              : null
          );
          setGcashDeepLink(qrAppLink);
          setTxn(prev => prev ? {
            ...prev,
            payment_url: qrPayload,
            qr_code_url: qrPayload,
            transaction_type: 'swiftpay_qr',
          } : null);
          if (selectedInstitutionCode === 'GCASH') {
            navigate(checkoutPathWithPaymentMethod(checkoutIdentifier, 'gcash'));
            return;
          }
          setShowQRPhModal(true);
          return;
        }
        const redirectUrl = response.data?.redirect_url;
        if (!redirectUrl) throw new Error('No bank checkout URL returned');
        window.location.assign(redirectUrl);
      } catch (err) {
        console.error('Failed to open bank checkout:', err);
        if (selectedInstitutionCode === 'QRPH' && txn.qr_code_url) {
          setShowQRPhModal(true);
          return;
        }
        const detail = err instanceof Error ? err.message : 'Unable to open the selected bank. Please try again.';
        toast.error(detail);
      }
      return;
    }

    openCheckoutModal(url);
    startPollingStatus(checkoutExternalId);
  };

  function buildGcashDeepLink(qrCode: string, transaction: Transaction): string {
    const params = new URLSearchParams({
      qrCode,
      orderAmount: Number(transaction.amount).toFixed(2),
      merchantName: transaction.merchant_name || 'Payment',
      qrCodeFormat: 'EMVCO',
      sub: 'p2mpay',
    });
    return `gcash://com.mynt.gcash/app/006300000800?${params.toString()}`;
  }

  const submitOpenAmount = async () => {
    const amount = Number(enteredAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(isKoreanCheckout ? '결제 금액을 입력하세요.' : 'Enter a valid amount to pay.');
      return;
    }
    try {
      const response = await client.post(
        `/api/v1/payments/checkout/${encodeURIComponent(txn.external_id)}/open-amount-request`,
        { amount },
      );
      if (!response.ok) {
        throw new Error(response.data?.detail || 'Unable to submit payment amount');
      }
      setOpenAmountRequestId(response.data.external_id);
      navigate(`/checkout/${encodeURIComponent(response.data.external_id)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to submit payment amount');
    }
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
      className="group flex min-h-[132px] flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-4 text-center transition-all hover:-translate-y-0.5 hover:border-[#FF6B00] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2"
      aria-label={`Pay with ${institution.name}`}
    >
      <PaymentBrandLogo
        brand={institution.code || institution.name}
        logoUrl={institution.logoUrl}
        size="md"
        className="border border-slate-100 shadow-sm"
      />
      <span className="w-full truncate text-[12px] font-semibold text-slate-900">{institution.name}</span>
      <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-[#FF6B00]" aria-hidden="true" />
    </button>
  );

  if (openAmount) {
    const amountBrand = isKrw ? 'Toss Bank' : 'Netbank';
    const amountTitle = isKrw ? '수동 은행 송금' : (isKoreanCheckout ? '결제' : 'Payment');
    const amountDescription = isKrw
      ? '금액을 입력하면 수동 은행 송금 안내를 확인할 수 있습니다.'
      : (isKoreanCheckout ? '금액을 입력하면 안전한 결제 수단을 선택할 수 있습니다.' : 'Enter your amount to continue to secure bank and wallet selection.');
    return (
      <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
        <div className="border-b border-slate-200 bg-white py-6">
          <div className="mx-auto flex max-w-xl flex-col items-center px-4 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
              {txn.merchant_logo_url ? (
                <img src={txn.merchant_logo_url} alt={merchantDisplayName} className="h-full w-full object-contain p-2" />
              ) : (
                <Store size={24} className="text-slate-200" />
              )}
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">{merchantDisplayName}</h1>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              <ShieldCheck size={14} className="text-emerald-500" />
              {isKoreanCheckout ? '안전한 결제 페이지' : 'Secure payment'}
            </div>
          </div>
        </div>
        <main className="mx-auto flex max-w-xl justify-center px-4 py-8">
          <section className="w-full overflow-hidden rounded-[28px] border border-[#d8e4f5] bg-white shadow-[0_18px_55px_rgba(15,63,120,0.10)]">
            <div className="bg-[linear-gradient(120deg,#071b3a_0%,#0b4b9a_58%,#1475d1_100%)] px-6 py-7 text-white sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-4 flex items-center gap-2 text-[10px] font-bold tracking-[0.24em] text-blue-100">
                    <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_0_4px_rgba(103,232,249,0.15)]" />
                    {isKrw ? t('krw_bank_transfer') : (isKoreanCheckout ? 'PHP 결제' : 'PHP NETBANK')}
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-white">{amountTitle}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-blue-100">{amountDescription}</p>
                </div>
                <PaymentBrandLogo
                  brand={amountBrand}
                  size="sm"
                  className="shrink-0 border-0 bg-white p-1 shadow-sm"
                />
              </div>
            </div>
            {openAmountSubmitted ? (
              <div className="p-6 text-center sm:p-8">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                <h3 className="mt-4 text-xl font-semibold text-slate-900">
                  {isKoreanCheckout ? '검토 요청이 전송되었습니다.' : 'Payment request sent for review'}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {isKoreanCheckout
                    ? '관리자가 금액을 검토하고 승인하면 결제가 진행됩니다.'
                    : 'A super admin will review and approve this amount before payment can proceed.'}
                </p>
                <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    {isKoreanCheckout ? '요청 금액' : 'Requested amount'}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {fmtCurrency(payableAmount, currencyCode)}
                  </p>
                </div>
                {openAmountRequestId && (
                  <p className="mt-4 text-xs text-slate-400">
                    {isKoreanCheckout ? '요청 번호' : 'Request reference'}: {openAmountRequestId}
                  </p>
                )}
              </div>
            ) : <div className="p-6 sm:p-8">
              <label htmlFor="open-payment-amount" className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                {isKoreanCheckout ? '결제 금액 입력' : 'Enter payment amount'}
              </label>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-[#1475d1] focus-within:bg-white">
                <input
                  id="open-payment-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={enteredAmount}
                  onChange={(event) => setEnteredAmount(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') submitOpenAmount(); }}
                  placeholder="0.00"
                  autoFocus
                  className="min-w-0 flex-1 bg-transparent text-2xl font-semibold text-slate-900 outline-none placeholder:text-slate-300"
                  aria-label={isKoreanCheckout ? '결제 금액' : 'Payment amount'}
                />
                <span className="text-sm font-bold text-slate-500">{currencyCode}</span>
              </div>
              {isCny && enteredAmount ? (
                <div className="mt-6 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Choose payment channel
                  </p>
                  {[
                    { brand: 'Alipay', color: '#00A0E9' },
                    { brand: 'WeChat Pay', color: '#07C160' },
                    { brand: 'UnionPay', color: '#1677FF' },
                  ].map(channel => (
                    <button
                      key={channel.brand}
                      type="button"
                      onClick={submitOpenAmount}
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-[#1475d1] hover:shadow-sm"
                    >
                      <PaymentBrandLogo brand={channel.brand} size="sm" className="border-0 bg-transparent p-0 shadow-none" />
                      <span className="flex-1 text-sm font-semibold text-slate-900">{channel.brand}</span>
                      <ChevronRight className="h-4 w-4" style={{ color: channel.color }} />
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={submitOpenAmount}
                  className="mt-4 w-full rounded-xl bg-[#071b3a] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0b4b9a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1475d1] focus-visible:ring-offset-2"
                >
                  {isKrw ? '지금 결제' : 'Pay Now'}
                  <ChevronRight className="ml-1 inline-block h-4 w-4 align-text-bottom" />
                </button>
              )}
            </div>}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans pb-12">
      {/* Branded Header */}
      <div className="border-b border-slate-200 bg-white py-6 mb-6">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-3 overflow-hidden">
            {txn.merchant_logo_url ? (
              <img src={txn.merchant_logo_url} alt={txn.merchant_name} className="w-full h-full object-contain p-2" />
            ) : (
              <Store size={24} className="text-slate-200" />
            )}
          </div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-2">{merchantDisplayName}</h1>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            <ShieldCheck size={14} className="text-emerald-500" />
            Secure Checkout
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Payment Details & Methods */}
          <div className="md:col-span-2 space-y-6">
            {/* Amount Card */}
            {!isPaid && !isExpired && !isManualDeposit && (
              <div className="bg-[#111111] rounded-2xl p-6 sm:p-7 shadow-xl shadow-black/10 text-white">
                <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest mb-4">{isKrw ? '결제 금액' : 'Amount to Pay'}</p>
                {openAmount ? (
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={enteredAmount}
                    onChange={(event) => setEnteredAmount(event.target.value)}
                    placeholder="Enter amount"
                    className="w-full max-w-sm rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-3xl font-semibold tracking-tight text-white outline-none placeholder:text-slate-500"
                  />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tracking-tight sm:text-4xl">{fmtCurrency(txn.amount, currencyCode)}</span>
                  </div>
                )}
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{currencyName} ({currencyCode})</p>
                {txn.description && (
                  <p className="mt-6 text-slate-300 text-[14px] leading-relaxed border-t border-white/10 pt-6">
                    {txn.description}
                  </p>
                )}
              </div>
            )}

            {isPending && isManualDeposit && (
              <div className="overflow-hidden rounded-[28px] border border-[#d8e4f5] bg-white shadow-[0_18px_55px_rgba(15,63,120,0.10)]">
                <div className="bg-[linear-gradient(120deg,#071b3a_0%,#0b4b9a_58%,#1475d1_100%)] px-6 py-7 text-white sm:px-8">
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div>
                      <div className="mb-4 flex items-center gap-2 text-[10px] font-bold tracking-[0.24em] text-blue-100">
                        <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_0_4px_rgba(103,232,249,0.15)]" />
                        {isHighValuePhp ? 'PHP BANK TRANSFER' : t('krw_bank_transfer')}
                      </div>
                      <h2 className="text-2xl font-semibold tracking-tight">{isHighValuePhp ? 'Manual bank deposit' : '토스뱅크 계좌이체'}</h2>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-blue-100">{isHighValuePhp ? 'Send the exact amount to the Security Bank account below.' : '아래 QR을 스캔하거나 계좌 정보를 사용해 정확한 금액을 보내 주세요.'}</p>
                    </div>
                    <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-blue-50 backdrop-blur-sm">
                      {isHighValuePhp ? 'Payment pending' : '결제 대기 중'}
                    </div>
                  </div>
                  <div className="mt-7 flex flex-wrap items-end gap-x-8 gap-y-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">{isHighValuePhp ? 'Amount to send' : '보내실 금액'}</p>
                      {openAmount ? (
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={enteredAmount}
                          onChange={(event) => setEnteredAmount(event.target.value)}
                          placeholder={isKrw ? '결제 금액 입력' : 'Enter amount'}
                          className="mt-1 w-full max-w-xs rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-2xl font-bold tracking-tight text-white outline-none placeholder:text-blue-200"
                        />
                      ) : (
                        <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{fmtCurrency(txn.amount, currencyCode)}</p>
                      )}
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-blue-200">{currencyName} ({currencyCode})</p>
                    </div>
                    <div className="h-9 w-px bg-white/20" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">{isHighValuePhp ? 'Order reference' : '주문번호'}</p>
                      <p className="mt-1 font-mono text-sm font-semibold text-white">{displayReference}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 bg-[#f5f8fc] p-5 sm:p-8">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {!isHighValuePhp && (
                          <PaymentBrandLogo
                            brand={manualDepositBankName}
                            size="sm"
                            className="border border-[#dce7f5] shadow-sm"
                          />
                        )}
                        <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Transfer details</p>
                        <p className="mt-1 text-sm text-slate-500">{isHighValuePhp ? 'Confirm the account details before sending your deposit.' : '송금 전 아래 계좌 정보를 먼저 확인하세요.'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        [isHighValuePhp ? 'Bank' : '은행', manualDepositBankName],
                        [isHighValuePhp ? 'Account name' : '예금주', manualDepositAccountName],
                        [isHighValuePhp ? 'Account number' : '계좌번호', manualDepositAccountNumber],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-[#dce7f5] bg-white px-4 py-3.5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
                          <p className={`mt-1.5 break-all text-sm font-semibold text-slate-900 ${label === '계좌번호' ? 'font-mono' : ''}`}>{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                          <p>{isHighValuePhp ? 'Send the exact amount and include the order reference in the transfer note. Your payment status will update after the deposit is confirmed.' : '정확한 금액을 보내고 주문번호를 입금자명 또는 메모에 입력하세요. 입금 확인 후 결제 상태가 자동으로 업데이트됩니다.'}</p>
                    </div>
                  </div>

                  {!isHighValuePhp && (
                    <div className="border-t border-[#dce7f5] pt-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Supported Korean banks</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                        {SUPPORTED_KRW_BANKS.map(bank => (
                          <div key={bank.code} className="flex min-w-0 flex-col items-center gap-1.5 rounded-lg border border-[#dce7f5] bg-white px-2 py-2.5 text-center">
                            <div className="flex h-10 w-16 items-center justify-center">
                              <PaymentBrandLogo
                                brand={bank.code}
                                size="sm"
                                className="border-0 bg-transparent p-0 shadow-none"
                              />
                            </div>
                            <span className="w-full truncate text-[10px] font-semibold text-slate-700">{bank.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-[#dce7f5] bg-white p-4 text-center shadow-sm">
                    <div className="mx-auto flex aspect-square max-w-[208px] items-center justify-center rounded-xl bg-white p-2">
                      {isHighValuePhp ? (
                        <img src="/images/qrph_high_value.jpg" alt="QRPh payment code" className="w-full rounded-lg object-contain" />
                      ) : (
                        <QRCodeSVG value={krwTransferQrValue} size={188} level="M" includeMargin bgColor="#ffffff" fgColor="#071b3a" />
                      )}
                    </div>
                    <p className="mt-4 text-xs font-bold text-slate-900">{isHighValuePhp ? 'Scan with a QRPh-enabled banking app' : 'QR로 송금 정보 불러오기'}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{isHighValuePhp ? 'Verify the bank details and send the exact amount shown above.' : '계좌 정보를 확인한 뒤 은행 앱에서 QR을 스캔하세요.'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Methods */}
            {isPending && !isManualDeposit && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[16px] font-semibold text-slate-900 mb-1">Select Payment Channel</h2>
                  <p className="text-[13px] text-slate-500">{isCny ? 'Choose Alipay or WeChat Pay for your CNY payment.' : 'Choose your preferred bank, wallet, or payment flow.'}</p>
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
                      <PaymentBrandLogo brand="Alipay" size="sm" className="bg-transparent" />
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
                      <PaymentBrandLogo brand="WeChat Pay" size="sm" className="bg-transparent" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-lg text-slate-900">Pay with WeChat Pay</p>
                      <p className="text-[13px] text-slate-500">Secure payments via WeChat</p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-slate-300 group-hover:text-[#07C160] group-hover:translate-x-1 transition" />
                  </button>
                ) : isMagpieCheckout && isCny ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <button
                      onClick={() => handleStartCheckout()}
                      className="flex min-h-36 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all group hover:-translate-y-0.5 hover:border-[#00A0E9] hover:shadow-lg"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#00A0E9]/10">
                        <PaymentBrandLogo brand="Alipay" size="md" className="border-0 bg-transparent p-0 shadow-none" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-slate-900">Alipay</p>
                        <p className="mt-1 text-[12px] leading-5 text-slate-500">Pay in CNY with Alipay</p>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#00A0E9]" />
                    </button>
                    <button
                      onClick={() => handleStartCheckout()}
                      className="flex min-h-36 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all group hover:-translate-y-0.5 hover:border-[#07C160] hover:shadow-lg"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#07C160]/10">
                        <PaymentBrandLogo brand="WeChat Pay" size="md" className="border-0 bg-transparent p-0 shadow-none" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-slate-900">WeChat Pay</p>
                        <p className="mt-1 text-[12px] leading-5 text-slate-500">Pay in CNY with WeChat</p>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#07C160]" />
                    </button>
                  </div>
                ) : isMagpieCheckout ? (
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
                ) : institutions.length > 0 ? (
                  <div className="space-y-6">
                    {/* QRPH first for PHP checkout */}
                    {qrphInstitutions.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4 text-[#0B63FF]" />
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">QRPH</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                          {qrphInstitutions.map(renderInstitutionButton)}
                        </div>
                      </div>
                    )}

                    {/* Digital Wallets */}
                    {digitalWallets.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-[#FF6B00]" />
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">E-Wallets</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
                  <>
                    {qrPanelMode === 'gcash' ? (
                      <section
                        aria-label="GCash QRPH payment details"
                        className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm"
                      >
                        <h3 className="sr-only">GCash QRPH payment details</h3>
                        <div className="flex min-h-[180px] items-center justify-center bg-[#2f5f9f] px-6 py-10">
                          <img src="/logos/qrph.svg" alt="QRPH" className="h-14 w-auto" />
                        </div>
                        <div className="space-y-5 p-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-[15px] text-slate-500">Merchant</p>
                              <p className="text-right text-[18px] font-semibold text-slate-900">{merchantDisplayName}</p>
                            </div>
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-[15px] text-slate-500">Amount Due</p>
                              <p className="text-right text-[18px] font-semibold text-[#2f5f9f]">
                                PHP {Number(txn.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                          {gcashDeepLink && (
                            <button
                              onClick={() => handleGcashDeepLink(gcashDeepLink)}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f5f9f] px-5 py-3.5 text-[18px] font-medium text-white hover:bg-[#254f86] transition-colors"
                              aria-label="Open GCash app to continue payment"
                            >
                              <Smartphone size={18} />
                              Open GCash App
                            </button>
                          )}
                          {!gcashDeepLink && (
                            <div className="rounded-xl border border-[#2f5f9f]/20 bg-[#2f5f9f]/5 px-4 py-3 text-center text-[13px] text-[#1d3f69]">
                              Open your GCash app and scan the QR code below to continue.
                            </div>
                          )}
                          <div className="space-y-3 text-center">
                            <p className="text-[22px] font-semibold text-slate-900">Scan QR Code to Pay</p>
                            {hasQrPayload ? (
                              <div className="flex justify-center">
                                {/^https?:\/\//i.test(txn.qr_code_url || '') ? (
                                  <img src={txn.qr_code_url} alt="GCash QRPH payment code" className="mx-auto w-full max-w-[320px] rounded-xl object-contain" />
                                ) : (
                                  <QRCodeSVG value={txn.qr_code_url} size={320} level="M" includeMargin bgColor="#ffffff" fgColor="#071b3a" className="h-auto max-w-full" />
                                )}
                              </div>
                            ) : (
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
                                QR code is being prepared. Please refresh in a moment or use Open App.
                              </div>
                            )}
                          </div>
                        </div>
                      </section>
                    ) : qrPanelMode === 'qrph' ? (
                      <section
                        aria-label="QRPH payment details"
                        className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm"
                      >
                        <h3 className="sr-only">QRPH payment details</h3>
                        <div className="space-y-3 bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] px-6 py-7 text-white">
                          <div className="flex items-center justify-between gap-4">
                            <img src="/logos/qrph.svg" alt="QRPH" className="h-10 w-auto" />
                            <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide">
                              SWIFTPAY QRPH
                            </span>
                          </div>
                          <p className="text-[13px] text-blue-100">Scan this code with any QRPH-compatible bank or e-wallet app.</p>
                        </div>
                        <div className="space-y-5 p-6">
                          <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:grid-cols-2">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Merchant</p>
                              <p className="mt-1 truncate text-[15px] font-semibold text-slate-900">{merchantDisplayName}</p>
                            </div>
                            <div className="sm:text-right">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Amount Due</p>
                              <p className="mt-1 text-[18px] font-semibold text-[#1E3A8A]">
                                {fmtCurrency(Number(txn.amount || 0), txn.currency || 'PHP')}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-center">
                            <p className="text-[18px] font-semibold text-slate-900">Scan QR Code to Pay</p>
                            <p className="text-[12px] text-slate-500">Use your preferred banking app and confirm payment.</p>
                            <div className="flex justify-center">
                              {usesHighValuePhpQr ? (
                                <img
                                  src="/images/qrph_high_value.jpg"
                                  alt="QRPh payment code for high-value PHP checkout"
                                  className="mx-auto w-full max-w-[320px] rounded-xl object-contain"
                                />
                              ) : /^https?:\/\//i.test(txn.qr_code_url || '') ? (
                                <img src={txn.qr_code_url} alt="QRPH payment code" className="mx-auto w-full max-w-[320px] rounded-xl object-contain" />
                              ) : (
                                <QRCodeSVG value={txn.qr_code_url} size={320} level="M" includeMargin bgColor="#ffffff" fgColor="#071b3a" className="h-auto max-w-full" />
                              )}
                            </div>
                          </div>
                        </div>
                      </section>
                    ) : (
                      <>
                        <button
                          onClick={() => setShowQRPhModal(true)}
                          className="w-full flex items-center gap-4 p-5 rounded-2xl border bg-white transition-all group border-slate-200 hover:border-emerald-500"
                        >
                          <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50">
                            <QrCode className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-slate-900">{usesHighValuePhpQr ? 'Scan QRPh' : 'Scan QR Code'}</p>
                            <p className="text-[12px] text-slate-500">Pay using your banking app</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:text-emerald-500" />
                        </button>
                      </>
                    )}
                  </>
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
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Order reference</p>
                  <div className="group flex items-center gap-2">
                    <code className="min-w-0 flex-1 break-all font-mono text-[13px] font-semibold text-slate-900 blur-[3px] transition-[filter] duration-200 group-hover:blur-0 group-focus-within:blur-0">{displayReference}</code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(displayReference)}
                      className="shrink-0 rounded-lg p-1.5 transition hover:bg-slate-50"
                      aria-label="Copy order reference"
                    >
                      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                    </button>
                  </div>
                </div>
                <div className="border-t border-slate-50 pt-4">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Created</p>
                  <p className="text-[13px] font-semibold text-slate-900">{new Date(txn.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>
            </div>

            {txn.bank_account_number && !isKrw && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
                  {txn.merchant_logo_url ? (
                    <div className="flex h-9 w-16 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white p-1 shadow-sm">
                      <img src={txn.merchant_logo_url} alt={txn.merchant_name || 'Company logo'} className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <PaymentBrandLogo brand={txn.bank_name || 'Bank'} size="sm" />
                  )}
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

      {/* Checkout Modal Dialog */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 border-0 bg-white">
          {checkoutModalUrl && (
            <iframe
              src={checkoutModalUrl}
              title="Secure Checkout"
              className="w-full h-[85vh] border-0 rounded-lg"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-cookies"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* QRPH Modal Dialog */}
      <Dialog open={showQRPhModal} onOpenChange={setShowQRPhModal}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-slate-900">{usesHighValuePhpQr ? 'High-Value PHP QRPh Payment' : 'Scan QR Code to Pay'}</h2>
              <p className="text-sm text-slate-500">Use your banking or e-wallet app to scan and complete payment</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-center">
              {usesHighValuePhpQr ? (
                <img
                  src="/images/qrph_high_value.jpg"
                  alt="QRPh payment code for high-value PHP checkout"
                  className="w-full max-w-xs rounded-lg object-contain"
                />
              ) : /^https?:\/\//i.test(txn.qr_code_url || '') ? (
                <img src={txn.qr_code_url} alt="Payment QR code" className="w-full max-w-xs rounded-lg object-contain" />
              ) : (
                <QRCodeSVG value={txn.qr_code_url} size={320} level="M" includeMargin bgColor="#ffffff" fgColor="#071b3a" className="h-auto max-w-full" />
              )}
            </div>
            <div className="w-full bg-slate-50 rounded-lg p-4 space-y-2 text-center text-sm">
              <p className="font-semibold text-slate-900">Merchant: {merchantDisplayName}</p>
              <p className="text-slate-600">Amount: {fmtCurrency(Number(txn.amount || 0), txn.currency || 'PHP')}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
