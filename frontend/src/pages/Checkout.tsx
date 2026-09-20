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
  Landmark,
  Copy,
  X,
  Loader2,
  CreditCard,
  Store,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { CheckoutPoweredBy } from '@/components/CheckoutPoweredBy';
import { APP_NAME } from '@/lib/brand';
import { fmtCurrency, getCurrencyName, getCurrencySymbol } from '@/lib/format';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import LoadingSkeleton from '@/design-system/components/LoadingSkeleton';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { fetchPaymentChannels, isPaymentChannelEnabled, type PaymentChannels } from '@/lib/paymentChannels';
import { resolveCheckoutQrPanelMode, sanitizeCheckoutDeepLink } from '@/lib/checkoutQr';
import { KRW_BANKS as SUPPORTED_KRW_BANKS } from '@/config/krw-banks';

interface Transaction {
  id: number;
  transaction_type: string;
  external_id: string;
  amount: number;
  currency: string;
  processing_amount?: number;
  processing_currency?: string;
  original_amount?: number;
  original_currency?: string;
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

function getCheckoutErrorMessage(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value)) {
    const messages = value
      .map(item => getCheckoutErrorMessage(item, ''))
      .filter(Boolean);
    if (messages.length) return messages.join(', ');
  }
  if (value && typeof value === 'object') {
    const error = value as Record<string, unknown>;
    for (const key of ['detail', 'message', 'error', 'msg']) {
      const message = getCheckoutErrorMessage(error[key], '');
      if (message) return message;
    }
    try {
      const serialized = JSON.stringify(value);
      if (serialized && serialized !== '{}') return serialized;
    } catch {
      // Keep the user-facing fallback when an unexpected error object cannot be serialized.
    }
  }
  return fallback;
}

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
  const [cardCheckoutLoading, setCardCheckoutLoading] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardForm, setCardForm] = useState({ name: '', number: '', expMonth: '', expYear: '', cvc: '', country: 'KR' });
  const [checkoutDesign, setCheckoutDesign] = useState({
    display_name: '',
    primary_color: '#071B3A',
    accent_color: '#1475D1',
    page_background: '#F9FAFB',
    heading_color: '#0F172A',
    body_text_color: '#475569',
    card_radius: 24,
    payment_layout: 'grid',
    payment_alignment: 'left',
    show_powered_by: true,
  });
  const [cardFormError, setCardFormError] = useState<string | null>(null);
  const [walletMethod, setWalletMethod] = useState<'alipay' | 'wechat' | 'unionpay' | null>(null);
  const [walletCheckoutLoading, setWalletCheckoutLoading] = useState(false);
  const [walletFormError, setWalletFormError] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gcashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const COUNTRY_OPTIONS = [
    { label: 'Philippines', value: 'PH' },
    { label: 'South Korea', value: 'KR' },
    { label: 'United States', value: 'US' },
    { label: 'Japan', value: 'JP' },
    { label: 'Singapore', value: 'SG' },
    { label: 'Hong Kong', value: 'HK' },
    { label: 'Thailand', value: 'TH' },
    { label: 'Vietnam', value: 'VN' },
  ];

  useEffect(() => {
    const currency = (txn?.currency || '').toUpperCase();
    const defaultCountry = currency === 'KRW' ? 'KR' : currency === 'PHP' ? 'PH' : 'PH';
    setCardForm(prev => ({ ...prev, country: prev.country || defaultCountry }));
    if (currency === 'KRW') {
      setCardForm(prev => ({ ...prev, country: 'KR' }));
    }
    if (currency === 'PHP') {
      setCardForm(prev => ({ ...prev, country: prev.country === 'KR' ? 'PH' : prev.country || 'PH' }));
    }
  }, [txn?.currency]);

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
    const checkoutUrl = new URL(url, window.location.origin);
    if (checkoutUrl.origin !== window.location.origin) {
      window.location.assign(checkoutUrl.toString());
      return;
    }
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
    fetch('/api/v1/app-settings/checkout-design')
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (data?.design) setCheckoutDesign(current => ({ ...current, ...data.design }));
      })
      .catch(() => undefined);
  }, []);

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

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      <div className="checkout-page min-h-screen flex items-center justify-center p-4">
        <div className="checkout-empty-state w-full max-w-md text-center">
          <div className="checkout-status-icon mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-slate-950">{language === 'ko' ? '결제 정보를 찾을 수 없습니다' : 'Payment Not Found'}</h1>
          <p className="mb-8 text-slate-500">{error || (language === 'ko' ? '요청하신 결제 링크가 유효하지 않거나 만료되었습니다.' : 'The requested payment link is invalid or has expired.')}</p>
          <Link to="/home" className="checkout-primary-button inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold">
            {language === 'ko' ? `${APP_NAME}로 이동` : `Go to ${APP_NAME}`}
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = txn?.status === 'paid';
  const isExpired = txn?.status === 'expired' || txn?.status === 'cancelled';
  const isPending = txn?.status === 'pending';
  const currencyCode = txn.currency?.trim().toUpperCase() || 'PHP';
  const currencyName = getCurrencyName(currencyCode, language === 'ko' ? 'ko' : 'en');
  const displayReference = txn.external_id.replace(/^OPEN-AMOUNT-/i, '');
  const hasCheckoutLink = !!txn?.payment_url;
  const processingCurrencyCode = txn.processing_currency?.trim().toUpperCase() || currencyCode;
  const isPhp = processingCurrencyCode === 'PHP';
  const isCny = currencyCode === 'CNY';
  const isKrw = currencyCode === 'KRW';
  const supportsMagpieCard = isPhp || isKrw || isCny;
  const isKoreanCheckout = isKrw || language === 'ko' || ['ko', 'kr', 'korean'].includes((searchParams.get('lang') || '').trim().toLowerCase());
  const checkoutText = (english: string, korean: string) => (
    isKoreanCheckout ? korean : english
  );
  const payableAmountForFlow = openAmount && enteredAmount ? Number(enteredAmount) : Number(txn?.amount);
  const isHighValuePhp = isPhp && payableAmountForFlow > 50000;
  const paymentMethodParam = String(searchParams.get('payment_method') || '').trim().toLowerCase();
  const isManualDeposit = (isKrw && paymentMethodParam === 'bank_transfer') || isHighValuePhp;
  const usesHighValuePhpQr = isHighValuePhp;
  const hasQR = usesHighValuePhpQr || (!!txn?.qr_code_url && isPaymentChannelEnabled(paymentChannels, txn?.currency, 'checkout', 'qr_code')) || !!gcashDeepLink;
  const hasQrPayload = usesHighValuePhpQr || !!(txn?.qr_code_url && String(txn.qr_code_url).trim());
  const qrPanelMode = resolveCheckoutQrPanelMode({
    hasQR,
    hasQrPayload,
    paymentMethod: paymentMethodParam,
    gcashDeepLink,
  });
  const payableAmount = openAmount ? Number(enteredAmount) : Number(txn.amount);
  const amountInputInvalid = enteredAmount.length > 0 && (!Number.isFinite(Number(enteredAmount)) || Number(enteredAmount) <= 0);
  const amountSymbol = getCurrencySymbol(currencyCode);

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
  const isSupportedKrwInstitution = (institution: Institution) => {
    const code = institutionCode(institution);
    const name = institution.name.trim().toLowerCase();
    return SUPPORTED_KRW_BANKS.some(bank => (
      bank.code === code || bank.name.toLowerCase() === name
    ));
  };
  const visibleInstitutions = institutions.filter(institution => (
    (!isKrw || isSupportedKrwInstitution(institution))
    && (!isPhp
    || institutionCode(institution) === 'QRPH'
    || !Array.isArray(enabledPhpInstitutions)
    || institutionIsEnabled(institutionCode(institution), enabledPhpInstitutions))
  ));
  const qrphInstitutions = visibleInstitutions.filter(i => institutionCode(i) === 'QRPH');
  const digitalWallets = visibleInstitutions.filter(i => ['MAYA', 'GCASH'].includes(institutionCode(i)));
  const banks = visibleInstitutions.filter(i => !['MAYA', 'GCASH', 'QRPH'].includes(institutionCode(i)));
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

    if (isKrw && !isPhp && institutionCode) {
      if (institutionCode.trim().toUpperCase() === 'KAKAOPAY') {
        toast.error('KakaoPay collection is not currently available.');
        return;
      }
      try {
        const response = await client.post(
          `/api/v1/payments/checkout/${encodeURIComponent(checkoutExternalId)}/magpie-card`,
        );
        if (!response.ok) {
          throw new Error(response.data?.detail || response.data?.error || 'Unable to initialize the KRW card payment.');
        }
        const freshCheckoutUrl = response.data?.checkout_url || response.data?.payment_url;
        if (!freshCheckoutUrl) {
          throw new Error('The payment provider did not return a fresh KRW checkout URL.');
        }
        const redirectUrl = new URL(freshCheckoutUrl, window.location.origin);
        redirectUrl.searchParams.set('payment_method', 'card');
        openCheckoutModal(redirectUrl.toString());
        startPollingStatus(checkoutExternalId);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Unable to initialize the KRW card payment.');
      }
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
        if (['GCASH', 'QRPH'].includes(selectedInstitutionCode) && (response.data?.qr_content || response.data?.qr_code || response.data?.deep_link)) {
          const qrPayload = response.data.qr_content || response.data.qr_code || '';
          if (!qrPayload) throw new Error('SwiftPay did not return a QRPH payload');
          setGcashDeepLink(null);
          setTxn(prev => prev ? {
            ...prev,
            payment_url: qrPayload,
            qr_code_url: qrPayload,
            transaction_type: 'swiftpay_qr',
          } : null);
          if (selectedInstitutionCode === 'GCASH') {
            const gcashPageUrl = new URL(
              `/checkout/${encodeURIComponent(checkoutIdentifier)}/gcash`,
              window.location.origin,
            );
            gcashPageUrl.searchParams.set('payment_method', 'qrph');
            gcashPageUrl.searchParams.set('qr', qrPayload);
            navigate(`${gcashPageUrl.pathname}${gcashPageUrl.search}`);
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

  const openMagpieCardCheckout = async () => {
    if (!txn || cardCheckoutLoading) return;
    setCardFormError(null);
    setShowCardForm(true);
  };

  const openMagpieWalletCheckout = (method: 'alipay' | 'wechat' | 'unionpay') => {
    if (!txn || walletCheckoutLoading) return;
    setWalletMethod(method);
    setWalletFormError(null);
  };

  const submitMagpieWallet = async () => {
    if (!txn || !walletMethod || walletCheckoutLoading) return;
    setWalletCheckoutLoading(true);
    setWalletFormError(null);
    try {
      const checkoutResponse = await client.post(
        `/api/v1/payments/checkout/${encodeURIComponent(txn.external_id)}/magpie-method`,
        { payment_method: walletMethod },
      );
      if (!checkoutResponse.ok || !checkoutResponse.data?.checkout_url) {
        throw new Error(getCheckoutErrorMessage(checkoutResponse.data, 'Unable to initialize wallet payment.'));
      }
      setWalletMethod(null);
      window.location.assign(checkoutResponse.data.checkout_url);
    } catch (err) {
      const message = err instanceof Error ? err.message : getCheckoutErrorMessage(err, 'Unable to process wallet payment');
      setWalletFormError(message);
      toast.error(message);
    } finally {
      setWalletCheckoutLoading(false);
    }
  };

  const submitMagpieCard = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!txn || cardCheckoutLoading) return;
    setCardCheckoutLoading(true);
    setCardFormError(null);
    try {
      const configResponse = await client.get(`/api/v1/payments/checkout/${encodeURIComponent(txn.external_id)}/magpie-card/config`);
      if (!configResponse.ok) throw new Error(configResponse.data?.detail || 'Card payments are unavailable');
      const card = {
        name: cardForm.name.trim(),
        number: cardForm.number.replace(/\s+/g, ''),
        exp_month: cardForm.expMonth,
        exp_year: cardForm.expYear,
        cvc: cardForm.cvc,
      };
      if (!card.name || !/^\d{12,19}$/.test(card.number) || !/^\d{2}$/.test(card.exp_month) || !/^\d{4}$/.test(card.exp_year) || !/^\d{3,4}$/.test(card.cvc)) {
        throw new Error('Enter valid card details.');
      }
      const sourceRequest = {
        card: { ...card, country: cardForm.country || (txn?.currency === 'KRW' ? 'KR' : 'PH') },
        customer_country: cardForm.country || (txn?.currency === 'KRW' ? 'KR' : 'PH'),
        country: cardForm.country || (txn?.currency === 'KRW' ? 'KR' : 'PH'),
      };
      const sourceResponse = await client.post(
        `/api/v1/payments/checkout/${encodeURIComponent(txn.external_id)}/magpie-card/source`,
        sourceRequest,
      );
      if (!sourceResponse.ok || !sourceResponse.data?.source_id) {
        throw new Error(getCheckoutErrorMessage(sourceResponse.data, 'Card verification failed.'));
      }
      const chargeResponse = await client.post(`/api/v1/payments/checkout/${encodeURIComponent(txn.external_id)}/magpie-card/charge`, { source_id: sourceResponse.data.source_id });
      if (!chargeResponse.ok) throw new Error(chargeResponse.data?.detail || 'Unable to process card payment');
      setShowCardForm(false);
      const redirectUrl = chargeResponse.data?.redirect_url;
      if (redirectUrl) window.location.assign(redirectUrl);
      else startPollingStatus(txn.external_id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to process card payment';
      setCardFormError(message);
      toast.error(message);
    } finally {
      setCardCheckoutLoading(false);
    }
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
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: checkoutDesign.heading_color }}>{checkoutDesign.display_name || merchantDisplayName}</h1>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-600">
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
                  <p className="mt-2 text-sm leading-relaxed text-blue-50">{amountDescription}</p>
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
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">
                    {isKoreanCheckout ? '요청 금액' : 'Requested amount'}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {fmtCurrency(payableAmount, currencyCode)}
                  </p>
                </div>
                {openAmountRequestId && (
                  <p className="mt-4 text-xs text-slate-600">
                    {isKoreanCheckout ? '요청 번호' : 'Request reference'}: {openAmountRequestId}
                  </p>
                )}
              </div>
            ) : <div className="p-6 sm:p-8">
              <label htmlFor="open-payment-amount" className="text-sm font-medium text-slate-700">
                {isKoreanCheckout ? '결제 금액' : 'Payment amount'}
              </label>
              <div className={`checkout-amount-input mt-3 flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 shadow-sm ring-1 ring-slate-100 transition focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100 ${amountInputInvalid ? 'checkout-amount-input-error border-red-300 ring-red-100' : 'border-slate-200'}`}>
                <span className="checkout-amount-symbol flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-lg font-bold text-[#0b4b9a]" aria-hidden="true">
                  {amountSymbol}
                </span>
                <input
                  id="open-payment-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={enteredAmount}
                  onChange={(event) => setEnteredAmount(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') submitOpenAmount(); }}
                  placeholder="0.00"
                  autoFocus
                  className="checkout-number-input min-w-0 flex-1 bg-transparent text-3xl font-bold tracking-tight text-slate-900 outline-none placeholder:text-slate-300"
                  aria-label={isKoreanCheckout ? '결제 금액' : 'Payment amount'}
                  aria-invalid={amountInputInvalid}
                />
                <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-600 shadow-sm">{currencyCode}</span>
              </div>
              <div className="mt-2 flex min-h-5 items-center justify-between gap-3 text-xs">
                <span className={amountInputInvalid ? 'font-medium text-red-600' : 'text-slate-600'}>
                  {amountInputInvalid
                    ? (isKoreanCheckout ? '0보다 큰 금액을 입력하세요.' : 'Enter an amount greater than zero.')
                    : (isKoreanCheckout ? '결제할 금액을 입력하세요.' : 'Enter the amount you want to pay.')}
                </span>
                <span className="font-medium text-slate-400">{isKoreanCheckout ? '최소 0.01' : 'Min 0.01'}</span>
              </div>
              <button
                type="button"
                onClick={submitOpenAmount}
                className="mt-4 w-full rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ backgroundColor: checkoutDesign.primary_color }}
              >
                {isKrw ? '지금 결제' : 'Pay now'}
                <ChevronRight className="ml-1 inline-block h-4 w-4 align-text-bottom" />
              </button>
            </div>}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div
      className={`checkout-page checkout-${currencyCode.toLowerCase()} min-h-screen pb-8 font-sans text-slate-900 sm:pb-12`}
      style={{
        backgroundColor: checkoutDesign.page_background,
        '--checkout-primary': checkoutDesign.primary_color,
        '--checkout-accent': checkoutDesign.accent_color,
        '--checkout-radius': `${checkoutDesign.card_radius}px`,
        color: checkoutDesign.body_text_color,
      } as React.CSSProperties}
    >
      {/* Branded Header */}
      <header
        className="checkout-header mb-5 border-b px-4 py-5 sm:mb-8 sm:px-6 sm:py-7"
        style={{ borderColor: checkoutDesign.accent_color }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
          <div className="checkout-merchant-logo flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:h-14 sm:w-14">
            {txn.merchant_logo_url ? (
              <img src={txn.merchant_logo_url} alt={txn.merchant_name} className="h-full w-full object-contain p-2" />
            ) : (
              <Store size={isMobileView ? 20 : 24} className="text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold tracking-tight sm:text-lg" style={{ color: checkoutDesign.heading_color }}>{checkoutDesign.display_name || merchantDisplayName}</h1>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              <ShieldCheck size={13} className="checkout-success" />
              {checkoutText('Secure checkout', '안전한 결제')}
            </div>
          </div>
        </div>
          <div className="checkout-currency-pill shrink-0 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide" style={{ backgroundColor: checkoutDesign.primary_color, color: '#fff' }}>{currencyCode}</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 sm:px-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-7">
          {/* Left Column: Payment Details & Methods */}
          <div className="space-y-5 md:col-span-2 md:space-y-7">
            {/* Amount Card */}
            {!isPaid && !isExpired && !isManualDeposit && (
              <div className="checkout-amount-card rounded-3xl p-6 text-white sm:p-8">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/65">{checkoutText('Amount to pay', '결제 금액')}</p>
                  <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/75">{currencyName}</span>
                </div>
                {openAmount ? (
                  <div className={`checkout-amount-input flex max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 ${amountInputInvalid ? 'checkout-amount-input-error border-red-300' : 'border-white/20 bg-white/10'}`}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-base font-bold text-white/80" aria-hidden="true">{amountSymbol}</span>
                    <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={enteredAmount}
                    onChange={(event) => setEnteredAmount(event.target.value)}
                    placeholder="Enter amount"
                    className="checkout-number-input min-w-0 flex-1 bg-transparent text-3xl font-bold tracking-tight text-white outline-none placeholder:text-white/40"
                    aria-invalid={amountInputInvalid}
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-white/60">{currencyCode}</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tracking-tight sm:text-4xl">{fmtCurrency(txn.amount, currencyCode)}</span>
                  </div>
                )}
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-white/60">{currencyName} ({currencyCode})</p>
                {txn.description && (
                  <p className="mt-6 text-slate-200 text-[14px] leading-relaxed border-t border-white/15 pt-6">
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
                        <div className="checkout-amount-input mt-1 flex w-full max-w-xs items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                        <span className="text-sm font-bold text-white/70" aria-hidden="true">{amountSymbol}</span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          inputMode="decimal"
                          value={enteredAmount}
                          onChange={(event) => setEnteredAmount(event.target.value)}
                          placeholder={isKrw ? '결제 금액 입력' : 'Enter amount'}
                          className="checkout-number-input min-w-0 flex-1 bg-transparent text-2xl font-bold tracking-tight text-white outline-none placeholder:text-blue-200"
                          aria-invalid={amountInputInvalid}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">{currencyCode}</span>
                        </div>
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

                <div className="space-y-6 bg-slate-50 p-5 sm:p-8">
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
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">{checkoutText('Transfer details', '송금 정보')}</p>
                        <p className="mt-1 text-sm text-slate-700">{checkoutText('Confirm the account details before sending your deposit.', '입금 전에 아래 계좌 정보를 확인하세요.')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        [checkoutText('Bank', '은행'), manualDepositBankName],
                        [checkoutText('Account name', '예금주'), manualDepositAccountName],
                        [checkoutText('Account number', '계좌번호'), manualDepositAccountNumber],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-[#dce7f5] bg-white px-4 py-3.5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">{label}</p>
                          <p className={`mt-1.5 break-all text-sm font-semibold text-slate-900 ${label === '계좌번호' ? 'font-mono' : ''}`}>{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                          <p>{isHighValuePhp ? 'Send the exact amount and include the order reference in the transfer note. Your payment status will update after the deposit is confirmed.' : '정확한 금액을 보내고 주문번호를 입금자명 또는 메모에 입력하세요. 입금 확인 후 결제 상태가 자동으로 업데이트됩니다.'}</p>
                    </div>

                    {supportsMagpieCard && (
                      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{checkoutText('Pay with Visa or Mastercard', 'Visa 또는 Mastercard로 결제')}</p>
                            <p className="mt-1 text-xs text-slate-600">{checkoutText('Pay securely by card through Magpie.', 'Magpie를 통해 안전하게 카드로 결제하세요.')}</p>
                          </div>
                          <button
                            type="button"
                            onClick={openMagpieCardCheckout}
                            disabled={cardCheckoutLoading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1475d1] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0b4b9a] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {cardCheckoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                            Visa / Mastercard
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isHighValuePhp && (
                    <div className="border-t border-[#dce7f5] pt-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">{checkoutText('Supported Korean banks', '지원되는 한국 은행')}</p>
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
                            <span className="w-full truncate text-[10px] font-semibold text-slate-800">{bank.name}</span>
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
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-700">{isHighValuePhp ? 'Verify the bank details and send the exact amount shown above.' : '계좌 정보를 확인한 뒤 은행 앱에서 QR을 스캔하세요.'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Methods */}
            {isPending && !isManualDeposit && (
              <div className="space-y-6" style={{ textAlign: checkoutDesign.payment_alignment === 'center' ? 'center' : 'left' }}>
                <div style={{ textAlign: checkoutDesign.payment_alignment === 'center' ? 'center' : 'left' }}>
                  <h2 className="text-[16px] font-semibold mb-1" style={{ color: checkoutDesign.heading_color }}>{checkoutText('Select Payment Channel', '결제 수단 선택')}</h2>
                  <p className="text-[13px]" style={{ color: checkoutDesign.body_text_color }}>
                    {isCny
                      ? checkoutText('Choose your preferred payment flow for your CNY payment.', 'CNY 결제에 사용할 결제 수단을 선택하세요.')
                      : checkoutText('Choose your preferred bank, wallet, or payment flow.', '은행, 전자지갑 또는 결제 수단을 선택하세요.')}
                  </p>
                </div>

                {loadingInstitutions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
                  </div>
                ) : isPhp && institutions.length === 0 ? (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={openMagpieCardCheckout}
                      disabled={cardCheckoutLoading}
                      className="group flex w-full items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[#1475d1] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <CreditCard className="h-7 w-7 text-[#1475d1]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-semibold text-slate-900">{checkoutText('Visa / Mastercard', 'Visa / Mastercard')}</p>
                        <p className="mt-1 text-[13px] text-slate-500">{checkoutText('Secure PHP card payment powered by Magpie', 'Magpie에서 안전하게 처리되는 PHP 카드 결제')}</p>
                      </div>
                      {cardCheckoutLoading ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#1475d1]" /> : <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#1475d1]" />}
                    </button>
                    {institutions.length > 0 && (
                      <p className="text-center text-xs text-slate-500">{checkoutText('Or choose a local bank or wallet below.', '또는 아래에서 현지 은행이나 전자지갑을 선택하세요.')}</p>
                    )}
                  </div>
                ) : isAlipay ? (
                  <button
                   onClick={() => openMagpieWalletCheckout('alipay')}
                    className="w-full flex items-center gap-5 p-6 rounded-2xl border border-slate-200 bg-white hover:border-[#FF6B00] hover:shadow-lg transition-all group"
                  >
                    <div className="h-14 w-14 rounded-xl bg-[#00A0E9]/10 flex items-center justify-center flex-shrink-0">
                      <PaymentBrandLogo brand="Alipay" size="sm" className="bg-transparent" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-lg text-slate-900">{checkoutText('Pay with Alipay', 'Alipay로 결제')}</p>
                      <p className="text-[13px] text-slate-700">{checkoutText('Fast & secure mobile wallet', '빠르고 안전한 모바일 전자지갑')}</p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-slate-300 group-hover:text-[#FF6B00] group-hover:translate-x-1 transition" />
                  </button>
                ) : isWeChat ? (
                  <button
                   onClick={() => openMagpieWalletCheckout('wechat')}
                    className="w-full flex items-center gap-5 p-6 rounded-2xl border border-slate-200 bg-white hover:border-[#07C160] hover:shadow-lg transition-all group"
                  >
                    <div className="h-14 w-14 rounded-xl bg-[#07C160]/10 flex items-center justify-center flex-shrink-0">
                      <PaymentBrandLogo brand="WeChat Pay" size="sm" className="bg-transparent" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-lg text-slate-900">{checkoutText('Pay with WeChat Pay', 'WeChat Pay로 결제')}</p>
                      <p className="text-[13px] text-slate-700">{checkoutText('Secure payments via WeChat', 'WeChat을 통한 안전한 결제')}</p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-slate-300 group-hover:text-[#07C160] group-hover:translate-x-1 transition" />
                  </button>
                ) : isCny ? (
                  <div className={`grid gap-4 ${checkoutDesign.payment_layout === 'list' ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
                    <button
                      type="button"
                      onClick={() => openMagpieWalletCheckout('alipay')}
                      className={`flex min-h-36 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all group hover:-translate-y-0.5 hover:border-[#00A0E9] hover:shadow-lg ${checkoutDesign.payment_alignment === 'center' ? 'justify-center text-center' : 'text-left'}`}
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#00A0E9]/10">
                        <PaymentBrandLogo brand="Alipay" size="md" className="border-0 bg-transparent p-0 shadow-none" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-slate-900">{checkoutText('Alipay', 'Alipay')}</p>
                        <p className="mt-1 text-[12px] leading-5 text-slate-500">{checkoutText('Pay in CNY with Alipay', 'Alipay로 CNY 결제')}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#00A0E9]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openMagpieWalletCheckout('wechat')}
                      className={`flex min-h-36 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all group hover:-translate-y-0.5 hover:border-[#07C160] hover:shadow-lg ${checkoutDesign.payment_alignment === 'center' ? 'justify-center text-center' : 'text-left'}`}
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#07C160]/10">
                        <PaymentBrandLogo brand="WeChat Pay" size="md" className="border-0 bg-transparent p-0 shadow-none" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-slate-900">{checkoutText('WeChat Pay', 'WeChat Pay')}</p>
                        <p className="mt-1 text-[12px] leading-5 text-slate-500">{checkoutText('Pay in CNY with WeChat', 'WeChat으로 CNY 결제')}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#07C160]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openMagpieWalletCheckout('unionpay')}
                      disabled={walletCheckoutLoading}
                      className={`flex min-h-36 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all group hover:-translate-y-0.5 hover:border-[#e23b2e] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 ${checkoutDesign.payment_alignment === 'center' ? 'justify-center text-center' : 'text-left'}`}
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-red-50">
                        <PaymentBrandLogo brand="UnionPay" size="md" className="border-0 bg-transparent p-0 shadow-none" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-slate-900">{checkoutText('UnionPay', 'UnionPay')}</p>
                        <p className="mt-1 text-[12px] leading-5 text-slate-500">{checkoutText('Pay in CNY with UnionPay', 'UnionPay로 CNY 결제')}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#e23b2e]" />
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
                      <p className="font-semibold text-lg text-slate-900">{checkoutText('International Checkout', '해외 결제')}</p>
                      <p className="text-[13px] text-slate-500">{checkoutText('Alipay and WeChat Pay supported', 'Alipay와 WeChat Pay를 지원합니다')}</p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition" />
                  </button>
                ) : isKrw || institutions.length > 0 ? (
                  <div className="space-y-6">
                    {isKrw ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            const nextParams = new URLSearchParams(searchParams);
                            nextParams.set('payment_method', 'bank_transfer');
                            navigate(`/checkout/${encodeURIComponent(checkoutId || txn.external_id)}?${nextParams.toString()}`);
                          }}
                          className="group flex min-h-36 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[#1475d1] hover:shadow-lg"
                        >
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                            <Landmark className="h-7 w-7 text-[#1475d1]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-semibold text-slate-900">{checkoutText('Manual bank transfer', '수동 은행 송금')}</p>
                            <p className="mt-1 text-[12px] leading-5 text-slate-500">{checkoutText('Transfer KRW to the account shown on the next step.', '다음 단계에 표시되는 계좌로 KRW를 송금하세요.')}</p>
                          </div>
                          <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#1475d1]" />
                        </button>
                        {supportsMagpieCard && (
                          <button
                            type="button"
                            onClick={openMagpieCardCheckout}
                            disabled={cardCheckoutLoading}
                            className="group flex min-h-36 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[#1475d1] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                              <CreditCard className="h-7 w-7 text-[#1475d1]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-base font-semibold text-slate-900">{checkoutText('Visa / Mastercard', 'Visa / Mastercard')}</p>
                              <p className="mt-1 text-[12px] leading-5 text-slate-500">{checkoutText('Pay securely by card through Magpie.', 'Magpie를 통해 안전하게 카드로 결제하세요.')}</p>
                            </div>
                            {cardCheckoutLoading ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#1475d1]" /> : <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#1475d1]" />}
                          </button>
                        )}
                      </div>
                    ) : isPhp && (
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={openMagpieCardCheckout}
                          disabled={cardCheckoutLoading}
                          className="group flex w-full items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[#1475d1] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                            <CreditCard className="h-7 w-7 text-[#1475d1]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-semibold text-slate-900">{checkoutText('Visa / Mastercard', 'Visa / Mastercard')}</p>
                            <p className="mt-1 text-[13px] text-slate-500">{checkoutText('Secure PHP card payment powered by Magpie', 'Magpie에서 안전하게 처리되는 PHP 카드 결제')}</p>
                          </div>
                          {cardCheckoutLoading ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#1475d1]" /> : <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#1475d1]" />}
                        </button>
                        <p className="text-center text-xs text-slate-500">{checkoutText('Or choose a local bank or wallet below.', '또는 아래에서 현지 은행이나 전자지갑을 선택하세요.')}</p>
                      </div>
                    )}
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
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{checkoutText('E-Wallets', '전자지갑')}</p>
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
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{checkoutText('Banks', '은행')}</p>
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
                    <p className="text-[14px] font-semibold text-slate-400">{checkoutText('No payment methods available', '사용 가능한 결제 수단이 없습니다')}</p>
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
                        <h3 className="sr-only">{checkoutText('GCash QRPH payment details', 'GCash QRPH 결제 정보')}</h3>
                        <div className="flex min-h-[180px] items-center justify-center bg-[#2f5f9f] px-6 py-10">
                          <img src="/logos/qrph.svg" alt="QRPH" className="h-14 w-auto" />
                        </div>
                        <div className="space-y-5 p-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-[15px] text-slate-500">{checkoutText('Merchant', '가맹점')}</p>
                              <p className="text-right text-[18px] font-semibold text-slate-900">{merchantDisplayName}</p>
                            </div>
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-[15px] text-slate-500">{checkoutText('Amount Due', '결제 금액')}</p>
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
                            <p className="text-[22px] font-semibold text-slate-900">{checkoutText('Scan QR Code to Pay', 'QR 코드를 스캔하여 결제')}</p>
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
                        <h3 className="sr-only">{checkoutText('QRPH payment details', 'QRPH 결제 정보')}</h3>
                        <div className="space-y-3 bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] px-6 py-7 text-white">
                          <div className="flex items-center justify-between gap-4">
                            <img src="/logos/qrph.svg" alt="QRPH" className="h-10 w-auto" />
                            <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide">
                              SWIFTPAY QRPH
                            </span>
                          </div>
                          <p className="text-[13px] text-blue-100">{checkoutText('Scan this code with any QRPH-compatible bank or e-wallet app.', 'QRPH를 지원하는 은행 또는 전자지갑 앱으로 이 코드를 스캔하세요.')}</p>
                        </div>
                        <div className="space-y-5 p-6">
                          <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:grid-cols-2">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{checkoutText('Merchant', '가맹점')}</p>
                              <p className="mt-1 truncate text-[15px] font-semibold text-slate-900">{merchantDisplayName}</p>
                            </div>
                            <div className="sm:text-right">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{checkoutText('Amount Due', '결제 금액')}</p>
                              <p className="mt-1 text-[18px] font-semibold text-[#1E3A8A]">
                                {fmtCurrency(Number(txn.amount || 0), txn.currency || 'PHP')}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-center">
                            <p className="text-[18px] font-semibold text-slate-900">{checkoutText('Scan QR Code to Pay', 'QR 코드를 스캔하여 결제')}</p>
                            <p className="text-[12px] text-slate-500">{checkoutText('Use your preferred banking app and confirm payment.', '원하는 은행 앱으로 스캔한 뒤 결제를 확인하세요.')}</p>
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
                            <p className="text-[12px] text-slate-500">{checkoutText('Pay using your banking app', '은행 앱으로 결제')}</p>
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
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">{checkoutText('Payment Successful', '결제가 완료되었습니다')}</h2>
                  <p className="text-slate-500">{checkoutText('Your transaction has been completed successfully.', '거래가 성공적으로 완료되었습니다.')}</p>
                </div>
                <div className="pt-4">
                  <Link to="/home" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#111111] text-white rounded-xl font-semibold transition hover:bg-black shadow-lg shadow-black/10">
                    {checkoutText('Done', '완료')}
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
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">{checkoutText('Link Expired', '결제 링크 만료')}</h2>
                  <p className="text-slate-500">{checkoutText('This payment link is no longer active.', '이 결제 링크는 더 이상 사용할 수 없습니다.')}</p>
                </div>
                <div className="pt-4">
                  <Link to="/home" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-100 text-slate-900 rounded-xl font-semibold transition hover:bg-slate-200">
                    {checkoutText('Return Home', '홈으로 돌아가기')}
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
                  <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-1">{checkoutText('Order reference', '주문 번호')}</p>
                  <div className="group flex items-center gap-2">
                    <code className="min-w-0 flex-1 break-all font-mono text-[13px] font-semibold text-slate-900 blur-[3px] transition-[filter] duration-200 group-hover:blur-0 group-focus-within:blur-0">{displayReference}</code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(displayReference)}
                      className="shrink-0 rounded-lg p-1.5 transition hover:bg-slate-50"
                      aria-label="Copy order reference"
                    >
                      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                    </button>
                  </div>
                </div>
                <div className="border-t border-slate-50 pt-4">
                  <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-1">{checkoutText('Created', '생성일')}</p>
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
                  <p className="text-[12px] font-semibold text-slate-900 uppercase tracking-widest">{checkoutText('Payment account', '결제 계좌')}</p>
                </div>
                <div className="space-y-3 text-[13px]">
                  {txn.bank_name && <div><p className="text-[11px] text-slate-600">{checkoutText('Bank', '은행')}</p><p className="font-semibold text-slate-900">{txn.bank_name}</p></div>}
                  {txn.bank_account_name && <div><p className="text-[11px] text-slate-600">{checkoutText('Account holder', '예금주')}</p><p className="font-semibold text-slate-900">{txn.bank_account_name}</p></div>}
                  <div>
                    <p className="text-[11px] text-slate-600">{checkoutText('Account number', '계좌번호')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="font-mono font-semibold text-slate-900 break-all flex-1">{txn.bank_account_number}</code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(txn.bank_account_number as string)}
                        className="p-1.5 hover:bg-slate-50 rounded-lg transition shrink-0"
                        aria-label="Copy account number"
                      >
                        {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Merchant identity */}
            <div className="text-center pt-4">
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-[0.2em] mb-1">{checkoutText('Store', '상점')}</p>
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

      <Dialog open={showCardForm} onOpenChange={setShowCardForm}>
        <DialogContent className="max-w-md border-0 bg-white p-0 shadow-[0_24px_80px_rgba(2,6,23,0.16)]">
          <form onSubmit={submitMagpieCard} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
            <div className="bg-gradient-to-br from-[#071b3a] via-[#0b4b9a] to-[#1475d1] px-5 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/15">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{checkoutText('Card payment', '카드 결제')}</h2>
                  <p className="text-xs text-blue-100">{checkoutText('Secure checkout', '안전한 결제')}</p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100">{checkoutText('Amount', '금액')}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-white">
                    {fmtCurrency(Number(txn?.amount || 0), txn?.currency || 'KRW')}
                  </p>
                </div>
                <div className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                  {txn?.currency || 'KRW'}
                </div>
              </div>
            </div>
            <div className="space-y-5 p-5">
              <div className="rounded-2xl border border-[#dfeafc] bg-[#f8fbff] px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0b4b9a]">{checkoutText('Currency', '통화')}</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{txn?.currency || 'KRW'} {checkoutText('payment', '결제')}</p>
              </div>

              <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-800">
                {checkoutText('Cardholder name', '카드 소유자 이름')}
                <input required autoComplete="cc-name" value={cardForm.name} onChange={e => setCardForm({ ...cardForm, name: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 normal-case tracking-normal shadow-inner outline-none transition focus:border-[#1475d1] focus:bg-white focus:ring-4 focus:ring-sky-100" />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-800">
                {checkoutText('Card number', '카드 번호')}
                <input required inputMode="numeric" autoComplete="cc-number" value={cardForm.number} onChange={e => setCardForm({ ...cardForm, number: e.target.value })} placeholder="1234 5678 9012 3456" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 tracking-normal shadow-inner outline-none transition focus:border-[#1475d1] focus:bg-white focus:ring-4 focus:ring-sky-100" />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-800">
                {checkoutText('Customer country', '고객 국가')}
                <select
                  value={cardForm.country || (txn?.currency === 'KRW' ? 'KR' : 'PH')}
                  onChange={e => setCardForm({ ...cardForm, country: e.target.value })}
                  disabled={txn?.currency === 'KRW'}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 shadow-inner outline-none transition focus:border-[#1475d1] focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {COUNTRY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-800">{checkoutText('Month', '월')}<input required inputMode="numeric" autoComplete="cc-exp-month" maxLength={2} value={cardForm.expMonth} onChange={e => setCardForm({ ...cardForm, expMonth: e.target.value })} placeholder="MM" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 tracking-normal shadow-inner outline-none transition focus:border-[#1475d1] focus:bg-white focus:ring-4 focus:ring-sky-100" /></label>
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-800">{checkoutText('Year', '연도')}<input required inputMode="numeric" autoComplete="cc-exp-year" maxLength={4} value={cardForm.expYear} onChange={e => setCardForm({ ...cardForm, expYear: e.target.value })} placeholder="YYYY" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 tracking-normal shadow-inner outline-none transition focus:border-[#1475d1] focus:bg-white focus:ring-4 focus:ring-sky-100" /></label>
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-800">{checkoutText('CVC', 'CVC')}<input required inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={cardForm.cvc} onChange={e => setCardForm({ ...cardForm, cvc: e.target.value })} placeholder="CVC" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 tracking-normal shadow-inner outline-none transition focus:border-[#1475d1] focus:bg-white focus:ring-4 focus:ring-sky-100" /></label>
              </div>
              {cardFormError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{cardFormError}</p>}
              <p className="text-[11px] leading-relaxed text-slate-600">
                {txn?.currency === 'KRW'
                  ? checkoutText('Your card payment will process by Toss Bank.', '카드 결제는 토스뱅크를 통해 처리됩니다.')
                  : checkoutText('Your card payment will process by SwiftPay.', '카드 결제는 SwiftPay를 통해 처리됩니다.')}
              </p>
              <p className="text-[11px] leading-relaxed text-slate-500">
                {checkoutText(
                  'Your card details are sent directly to the payment processor for tokenization. SwiftPay does not store your card number or security code.',
                  '카드 정보는 토큰화를 위해 결제 처리업체로 직접 전송됩니다. SwiftPay는 카드 번호나 보안 코드를 저장하지 않습니다.',
                )}
              </p>
              <button type="submit" disabled={cardCheckoutLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#071b3a] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0b4b9a] disabled:cursor-not-allowed disabled:opacity-60">
                {cardCheckoutLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {checkoutText('Pay securely', '안전하게 결제')}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={walletMethod !== null} onOpenChange={open => !open && setWalletMethod(null)}>
        <DialogContent className="max-w-md border-0 bg-white p-0">
          <div className="overflow-hidden rounded-2xl">
            <div className="bg-gradient-to-br from-[#071b3a] via-[#0b4b9a] to-[#1475d1] px-6 py-6 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    {walletMethod === 'alipay' ? 'Alipay payment' : walletMethod === 'wechat' ? 'WeChat Pay payment' : 'UnionPay payment'}
                  </h2>
                  <p className="text-xs text-blue-100">{checkoutText('Securely processed by Magpie', 'Magpie를 통해 안전하게 처리됩니다')}</p>
                </div>
              </div>
              <p className="mt-5 text-2xl font-semibold">{fmtCurrency(Number(txn?.amount || 0), 'CNY')}</p>
            </div>
            <div className="space-y-4 p-6">
              <p className="text-sm leading-relaxed text-slate-600">
                Continue to your selected wallet to authorize this payment. SwiftPay does not collect your wallet password or account credentials.
              </p>
              {walletFormError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{walletFormError}</p>}
              <button
                type="button"
                onClick={submitMagpieWallet}
                disabled={walletCheckoutLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#071b3a] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0b4b9a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {walletCheckoutLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Continue securely
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QRPH Modal Dialog */}
      <Dialog open={showQRPhModal} onOpenChange={setShowQRPhModal}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-slate-900">{usesHighValuePhpQr ? 'High-Value PHP QRPh Payment' : 'Scan QR Code to Pay'}</h2>
              <p className="text-sm text-slate-500">{checkoutText('Use your banking or e-wallet app to scan and complete payment', '은행 또는 전자지갑 앱으로 스캔하여 결제를 완료하세요')}</p>
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
      {checkoutDesign.show_powered_by && <CheckoutPoweredBy currency={currencyCode} className="mx-auto max-w-5xl px-4 sm:px-6" />}
    </div>
  );
}
