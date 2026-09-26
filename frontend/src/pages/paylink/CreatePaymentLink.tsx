import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Landmark, QrCode, ShieldCheck } from 'lucide-react';
import Layout from '@/components/Layout';
import { createPaymentLink } from '@/lib/paymentLinks';
import { client } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import '../PaymentActivity.css';

export default function CreatePaymentLink() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { collectionCurrency } = useCollectionCurrency();
  const isKorean = language === 'ko';
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [payor, setPayor] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [description, setDescription] = useState('');
  const currency = collectionCurrency.toUpperCase();
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    const numericAmount = Number(amount.replace(/[^0-9.]/g, ''));
    const minimumAmount = currency === 'KRW' ? 1000 : 1;
    const maximumAmount = currency === 'KRW' ? 100_000_000 : 50_000;
    const currencyLabel = currency === 'KRW' ? '₩' : '₱';

    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError(isKorean ? '유효한 금액을 입력하세요.' : 'Please enter a valid amount.');
      return;
    }

    if (numericAmount < minimumAmount || numericAmount > maximumAmount) {
      setError(
        isKorean
          ? `${currency} 결제 금액은 ${currencyLabel}${minimumAmount.toLocaleString()}~${currencyLabel}${maximumAmount.toLocaleString()}이어야 합니다.`
          : `${currency} payment links must be between ${currencyLabel}${minimumAmount.toLocaleString()} and ${currencyLabel}${maximumAmount.toLocaleString()}.`,
      );
      return;
    }

    if (!title.trim()) {
      setError(isKorean ? '제목을 입력하세요.' : 'Please enter a title.');
      return;
    }

    setError('');

    try {
      const reference_no = orderNo?.trim() || `PLNK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const normalizedCurrency = currency;
      const response = normalizedCurrency === 'KRW'
        ? await client.post('/api/v1/krw/payment-links', {
            amount: numericAmount,
            reference_no,
            description: description.trim() || title.trim(),
            customer_name: payor.trim() || undefined,
            payment_methods: ['bank_transfer'],
            expiry_days: Math.max(
              1,
              Math.min(
                90,
                Math.ceil((new Date(`${validUntil}T23:59:59`).getTime() - Date.now()) / 86400000),
              ),
            ),
          })
        : await client.post('/api/v1/xend/create-payment-link', {
            amount: numericAmount,
            description: description.trim() || title.trim(),
            currency: normalizedCurrency,
            external_id: reference_no,
            customer_name: payor.trim() || '',
            payment_methods: normalizedCurrency === 'PHP' ? [] : ['bank_transfer'],
          });
      const data = response.data as any;

      if (!response.ok || !data?.success) {
        const message = data?.detail || data?.message || 'Failed to create payment link.';
        setError(isKorean ? `결제 링크를 만들 수 없습니다: ${message}` : message);
        return;
      }

      const backendPayload = data?.data ?? data ?? {};
      const redirectUrl = backendPayload.payment_url || backendPayload.checkout_url || data.payment_url || data.redirect_url || '';
      if (!redirectUrl) {
        setError(isKorean ? '유효한 결제 링크를 받지 못했습니다.' : 'Payment link did not return a valid checkout URL.');
        return;
      }

      const rawBankAccount = backendPayload.raw?.bank_account || data.raw?.bank_account || {};
      const bankAccount = backendPayload.bank_account || data.bank_account || (
        rawBankAccount.bank_name || rawBankAccount.account_number || rawBankAccount.account_name
          ? {
              bank_name: rawBankAccount.bank_name,
              number: rawBankAccount.number || rawBankAccount.account_number,
              account_name: rawBankAccount.account_name || rawBankAccount.name,
              swift_code: rawBankAccount.swift_code,
            }
          : null
      );
      const qrCodeUrl = backendPayload.qr_code_url || data.qr_code_url || '';
      const hasBankAccount = Boolean(bankAccount?.bank_name || bankAccount?.number || bankAccount?.account_name);

      const channelSelectionUrl = redirectUrl;

      const link = createPaymentLink({
        amount: numericAmount,
        currency: normalizedCurrency,
        title: title.trim(),
        validUntil,
        payor,
        orderNo,
        externalId: reference_no,
        description,
        paymentUrl: channelSelectionUrl,
        qrCodeUrl,
        bankAccountDetails: hasBankAccount ? {
          bank_name: bankAccount?.bank_name || bankAccount?.bankName || '',
          number: bankAccount?.number || bankAccount?.account_number || '',
          account_name: bankAccount?.account_name || bankAccount?.accountName || '',
          swift_code: bankAccount?.swift_code,
        } : undefined,
      });

      navigate(`/pay-by-link/details/${link.code}`);
    } catch (err) {
      setError(isKorean ? '결제 링크를 만들 수 없습니다. 다시 시도하세요.' : 'Unable to create payment link. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="payment-workspace page-enter w-full space-y-5">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-6">
            <span className="cursor-pointer hover:text-slate-600" onClick={() => navigate('/pay-by-link')}>{isKorean ? '결제 링크' : 'Payment links'}</span>
          <span className="text-slate-300">&gt;</span>
            <span className="text-slate-600 font-semibold">{isKorean ? '결제 링크 만들기' : 'Create payment link'}</span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/pay-by-link')}
            className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">{isKorean ? '결제 링크 만들기' : 'Create payment link'}</h1>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sm:p-8 max-w-[640px]">
          <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">
            {isKorean ? `${currency} 결제 링크를 만들고 사용 가능한 결제 수단으로 결제받을 수 있습니다.` : `Create a ${currency} payment link and accept available payment methods.`}
          </p>

          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            {(currency === 'KRW'
              ? [
                  { icon: Landmark, title: 'Korean bank transfer', text: 'Manual payment verification' },
                  { icon: ShieldCheck, title: 'Super-admin approval', text: 'Payment is approved after verification' },
                  { icon: ShieldCheck, title: 'SwiftPay integrated', text: 'Self-hosted checkout on swiftpay.ph' },
                ]
              : [
                  { icon: QrCode, title: 'GCash / QRPH', text: 'Fast QR checkout' },
                  { icon: Landmark, title: 'Bank transfer', text: 'Supported PH banks' },
                  { icon: ShieldCheck, title: 'SwiftPay integrated', text: 'Self-hosted checkout on swiftpay.ph' },
                ]
            ).map(({ icon: Icon, title: cardTitle, text }) => (
              <div key={cardTitle} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <Icon size={17} className="mb-2 text-[#FF6B00]" />
                <p className="text-xs font-semibold text-slate-900">{cardTitle}</p>
                <p className="mt-1 text-[11px] text-slate-500">{text}</p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[13px] font-semibold text-slate-900 block mb-2">{isKorean ? '금액' : 'Amount'}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400 font-medium">{currency}</span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-slate-900 block mb-2">{isKorean ? '제목' : 'Title'}</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[13px] font-semibold text-slate-900 block mb-2">{isKorean ? '유효 기간' : 'Valid until'}</label>
                <div className="relative">
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-900 block mb-2">{isKorean ? '결제자' : 'Payor'} <span className="text-slate-400 font-normal">{isKorean ? '(선택 사항)' : '(optional)'}</span></label>
                <input
                  value={payor}
                  onChange={(e) => setPayor(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[13px] font-semibold text-slate-900 block mb-2">{isKorean ? '주문 번호' : 'Order no'} <span className="text-slate-400 font-normal">{isKorean ? '(선택 사항)' : '(optional)'}</span></label>
                <input
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-900 block mb-2">{isKorean ? '설명' : 'Description'} <span className="text-slate-400 font-normal">{isKorean ? '(선택 사항)' : '(optional)'}</span></label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
                />
              </div>
            </div>

            {error ? (
              <p className="text-sm text-rose-600 mb-2">{error}</p>
            ) : null}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerate}
                data-guide-target="payment-link-generate"
                className="bg-slate-900 text-white px-8 py-3 rounded-lg font-semibold text-[13px] hover:bg-slate-700 transition-colors"
              >
                {isKorean ? '링크 생성' : 'Generate link'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
