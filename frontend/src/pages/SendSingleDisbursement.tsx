import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Building2, Check, AlertCircle, Send } from 'lucide-react';
import { client } from '@/lib/api';
import { authApi } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import { PH_BANKS as PH_BANK_CATALOG } from '@/config/ph-banks';
import { fetchPaymentChannels, isPaymentChannelEnabled, type PaymentChannels } from '@/lib/paymentChannels';

interface BankOption {
  code: string;
  name: string;
}

const KRW_BANKS: BankOption[] = [
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

const CURRENCY_SYMBOLS: Record<string, string> = { PHP: '₱', KRW: '₩', USD: '$', CNY: '¥' };
const REQUIRED_RETAINED_BALANCE: Record<string, number> = { PHP: 5000, USDT: 100, USD: 100, KRW: 0 };

export default function SendSingleDisbursement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { collectionCurrency } = useCollectionCurrency();
  const isKrwFlow = collectionCurrency === 'KRW';
  const isPhpFlow = collectionCurrency === 'PHP';
  const uiText = {
    breadcrumb: isKrwFlow ? '출금' : 'Disbursements',
    currentPage: isKrwFlow ? '단일 출금 보내기' : 'Send single disbursement',
    sectionTitle: isKrwFlow ? '수취인 정보' : 'Recipient details',
    lastName: isKrwFlow ? '성' : 'Last name',
    firstName: isKrwFlow ? '이름' : 'First name',
    middleName: isKrwFlow ? '중간 이름' : 'Middle name',
    optional: isKrwFlow ? '(선택)' : '(optional)',
    phone: isKrwFlow ? '휴대폰번호' : 'Phone number',
    email: isKrwFlow ? '이메일' : 'Email',
    address: isKrwFlow ? '주소' : 'Address',
    city: isKrwFlow ? '시/구' : 'City',
    province: isKrwFlow ? '도/광역시' : 'Province',
    postalCode: isKrwFlow ? '우편번호' : 'Postal code',
    paymentInfo: isKrwFlow ? '지급 정보' : 'Payment details',
    amount: isKrwFlow ? '금액' : 'Amount',
    refNo: isKrwFlow ? '참조번호' : 'Reference no.',
    remark: isKrwFlow ? '메모' : 'Note',
    recipientBank: isKrwFlow ? '수취인 은행 선택' : 'Select recipient bank',
    bankSelectLabel: isKrwFlow ? '은행 선택' : 'Bank selection',
    bankSelectPlaceholder: isKrwFlow ? '은행을 선택하세요' : 'Select a bank',
    accountNumber: isKrwFlow ? '계좌번호' : 'Account number',
    accountNumberPlaceholder: isKrwFlow ? '계좌번호를 입력하세요' : 'Enter account number',
    submit: isKrwFlow ? '출금 전송' : 'Send disbursement',
    cancel: isKrwFlow ? '취소' : 'Cancel',
    now: isKrwFlow ? '지금 이체하기' : 'Send now',
    recipientBankInfo: isKrwFlow ? '수취은행 정보' : 'Recipient bank information',
    yourAccount: isKrwFlow ? '내 계좌' : 'Your account',
    balanceLabel: isKrwFlow ? '사용 가능한 잔액' : 'Available Balance',
    verifiedNode: isKrwFlow ? '검증된 노드' : 'Verified Node',
    importantNote: isKrwFlow ? '중요 안내' : 'Important Note',
    noteText: isKrwFlow
      ? '단일 출금은 INSTAPAY 네트워크를 통해 처리되며, 보통 10~15분 내에 입금됩니다.'
      : 'Single disbursements are processed via the INSTAPAY network. Funds typically arrive within 10-15 minutes.',
    helper: isKrwFlow
      ? '단일 지급은 즉시 처리되며 내역 탭에 바로 표시됩니다.'
      : 'Single disbursements are processed immediately and will appear directly in the History tab.',
  } as const;
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [balance, setBalance] = useState(0);
  const [paymentChannels, setPaymentChannels] = useState<PaymentChannels | null>(null);
  const disbursementEnabled = isPaymentChannelEnabled(paymentChannels, collectionCurrency, 'disbursement', 'bank_transfer');

  // Form state
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [amount, setAmount] = useState('');
  const [refNo, setRefNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNo, setAccountNo] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [banksRes, balRes] = await Promise.all([
        client.apiCall.invoke({ url: `/api/v1/swiftpay/institutions?currency=${collectionCurrency}`, method: 'GET', data: {} }),
        client.apiCall.invoke({ url: `/api/v1/wallet/balance?currency=${collectionCurrency}`, method: 'GET', data: {} })
      ]);

      const rawBanks = Array.isArray(banksRes.data?.data)
        ? banksRes.data.data as BankOption[]
        : Array.isArray(banksRes.data?.banks)
          ? banksRes.data.banks as BankOption[]
          : [];

      const uniqueBanks = rawBanks.filter((bank, index, options) => (
        bank &&
        typeof bank.code === 'string' &&
        typeof bank.name === 'string' &&
        options.findIndex(candidate => candidate.code.toUpperCase() === bank.code.toUpperCase()) === index
      ));

      if (uniqueBanks.length > 0) {
        setBanks(uniqueBanks);
      } else if (isKrwFlow) {
        setBanks(KRW_BANKS);
      } else if (isPhpFlow) {
        setBanks(PH_BANK_CATALOG);
      } else {
        setBanks([]);
      }

      if (balRes.data?.balance != null) setBalance(balRes.data.balance);
    } catch (err) {
      console.error('Failed to fetch disbursement data:', err);
      if (isKrwFlow) {
        setBanks(KRW_BANKS);
      } else if (isPhpFlow) {
        setBanks(PH_BANK_CATALOG);
      }
    }
  }, [collectionCurrency, isKrwFlow]);

  useEffect(() => {
    setBanks([]);
    setBankCode('');
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchPaymentChannels().then(setPaymentChannels).catch(() => undefined);
  }, []);

  const handleSubmit = async () => {
        if (!disbursementEnabled) {
          toast.error(isKrwFlow ? '이 통화의 출금 채널이 비활성화되었습니다.' : 'Disbursement is disabled for this currency');
          return;
        }
    const amt = parseFloat(amount);
    if (!firstName.trim() || !lastName.trim()) return toast.error(isKrwFlow ? '이름과 성을 입력해주세요.' : 'First and last names are required');
    if (isNaN(amt) || amt <= 0) return toast.error(isKrwFlow ? '유효한 금액을 입력해주세요.' : 'Enter a valid amount');
    if (!bankCode) return toast.error(isKrwFlow ? '수취인 은행을 선택해주세요.' : 'Select a recipient bank');
    if (!accountNo.trim()) return toast.error(isKrwFlow ? '계좌번호를 입력해주세요.' : 'Account number is required');
    const retainedBalance = REQUIRED_RETAINED_BALANCE[collectionCurrency] || 0;
    if (amt > Math.max(0, balance - retainedBalance)) {
      return toast.error(
        isKrwFlow
          ? `잔액에 ${retainedBalance.toLocaleString()} ${collectionCurrency} 이상이 유지되어야 합니다.`
          : `Keep at least ${CURRENCY_SYMBOLS[collectionCurrency] || ''}${retainedBalance.toLocaleString()} in your wallet`
      );
    }

    setLoading(true);
    try {
      const passkeyCredential = await authApi.verifyPasskey('disbursement');
      const res = await client.apiCall.invoke({
        url: '/api/v1/swiftpay/disbursements/send',
        method: 'POST',
        data: {
          reference_no: refNo.trim() || `disb-${Date.now()}`,
          currency: collectionCurrency,
          amount: amt,
          bank_code: bankCode,
          account_number: accountNo.trim(),
          first_name: firstName.trim(),
          middle_name: middleName.trim() || undefined,
          last_name: lastName.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          line1: line1.trim() || 'N/A',
          city: city.trim() || 'Manila',
          province: province.trim() || 'Metro Manila',
          postal_code: postalCode.trim() || '1000',
          note: remarks.trim(),
          passkey_credential: passkeyCredential,
        }
      });

      if (res.data?.success) {
        toast.success(isKrwFlow ? '출금 요청이 검토를 위해 제출되었습니다.' : 'Disbursement request submitted for review');
        navigate('/disbursements');
      } else {
        toast.error(res.data?.detail || res.data?.message || res.data?.error || (isKrwFlow ? '출금 전송에 실패했습니다.' : 'Failed to send disbursement'));
      }
    } catch (err) {
      console.error('Disbursement submission failed:', err);
      toast.error(err instanceof Error ? err.message : (isKrwFlow ? '네트워크 오류가 발생했습니다. 다시 시도해주세요.' : 'Network error. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="page-enter">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-8 font-medium">
          <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={() => navigate('/disbursements')}>{uiText.breadcrumb}</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-semibold">{uiText.currentPage}</span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-5 mb-12">
          <button
            onClick={() => navigate('/disbursements')}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">{uiText.currentPage}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16 items-start">
          {/* Main Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm">
            <p className="text-[14px] text-slate-500 mb-12 font-medium">
              {uiText.helper}
            </p>

            <div className="space-y-16 max-w-2xl">
              {/* Recipient Details */}
              <section>
                <h3 className="text-[16px] font-semibold text-slate-900 mb-8">{uiText.sectionTitle}</h3>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                      <label className="text-[14px] font-semibold text-slate-900 block mb-3">{uiText.lastName}</label>
                      <input
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="홍"
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[14px] font-semibold text-slate-900 block mb-3">{uiText.firstName}</label>
                      <input
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="길동"
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[14px] font-semibold text-slate-900 block mb-3">{uiText.middleName} <span className="text-slate-400 font-medium">{uiText.optional}</span></label>
                      <input
                        value={middleName}
                        onChange={e => setMiddleName(e.target.value)}
                        placeholder="민"
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="text-[14px] font-semibold text-slate-900 block mb-3">{uiText.phone} <span className="text-slate-400 font-medium">{uiText.optional}</span></label>
                      <input
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="01012345678"
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[14px] font-semibold text-slate-900 block mb-3">{uiText.email} <span className="text-slate-400 font-medium">{uiText.optional}</span></label>
                      <input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="recipient@example.com"
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div>
                      <label className="text-[14px] font-semibold text-slate-900 block mb-3">{uiText.address}</label>
                      <input
                        value={line1}
                        onChange={e => setLine1(e.target.value)}
                        placeholder="서울특별시 강남구 테헤란로 123"
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div>
                        <label className="text-[14px] font-semibold text-slate-900 block mb-3">{uiText.city}</label>
                        <input
                          value={city}
                          onChange={e => setCity(e.target.value)}
                          placeholder="서울"
                          className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[14px] font-semibold text-slate-900 block mb-3">{uiText.province}</label>
                        <input
                          value={province}
                          onChange={e => setProvince(e.target.value)}
                          placeholder="서울특별시"
                          className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[14px] font-semibold text-slate-900 block mb-3">{uiText.postalCode}</label>
                        <input
                          value={postalCode}
                          onChange={e => setPostalCode(e.target.value)}
                          placeholder="1550"
                          className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment Info */}
              <section>
                <h3 className="text-[16px] font-semibold text-slate-900 mb-8">{uiText.paymentInfo}</h3>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="text-[14px] font-semibold text-slate-900 block mb-3">{uiText.amount}</label>
                      <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-slate-400 font-semibold">
                           {CURRENCY_SYMBOLS[collectionCurrency] || '₩'}
                         </span>
                         <input
                           type="number"
                           value={amount}
                           onChange={e => setAmount(e.target.value)}
                           className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all font-semibold"
                         />
                      </div>
                    </div>
                    <div>
                      <label className="text-[14px] font-semibold text-slate-900 block mb-3">{uiText.refNo}</label>
                      <input
                        value={refNo}
                        onChange={e => setRefNo(e.target.value)}
                        placeholder="내부 참조"
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[14px] font-semibold text-slate-900 block mb-3">{uiText.remark}</label>
                    <input
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="예: 청구서 #123 결제"
                      className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                    />
                  </div>
                </div>
              </section>

              {/* Recipient Bank Information */}
              <section>
                <h3 className="text-[16px] font-semibold text-slate-900 mb-8">{uiText.recipientBankInfo}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[14px] font-semibold text-slate-900 block mb-3">{uiText.bankSelectLabel}</label>
                    <Select value={bankCode} onValueChange={setBankCode}>
                      <SelectTrigger className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 h-auto text-[14px]">
                        <SelectValue placeholder={uiText.bankSelectPlaceholder} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 max-h-[300px]">
                          {banks.map(bank => (
                            <SelectItem key={bank.code} value={bank.code}>
                              <span className="flex items-center gap-2"><PaymentBrandLogo brand={bank.code || bank.name} size="sm" />{bank.name}</span>
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[14px] font-semibold text-slate-900 block mb-3">{uiText.accountNumber}</label>
                    <input
                      value={accountNo}
                      onChange={e => setAccountNo(e.target.value)}
                      placeholder={uiText.accountNumberPlaceholder}
                      className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                    />
                  </div>
                </div>
              </section>

              <div className="pt-8 border-t border-slate-100 flex justify-end">
                <Button
                  onClick={handleSubmit}
                    disabled={loading || !disbursementEnabled}
                  className="bg-[#111111] text-white px-10 py-4 rounded-xl font-semibold text-[15px] shadow-lg hover:bg-black transition-all"
                >
                  {loading ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" size={18} />}
                  {uiText.now}
                </Button>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-10">
            <h3 className="text-[18px] font-semibold text-slate-900">{uiText.yourAccount}</h3>
            <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Building2 size={80} />
               </div>
               <p className="text-[12px] text-slate-500 mb-3 font-medium uppercase tracking-wider">{uiText.balanceLabel}</p>
               <p className="text-4xl font-semibold text-slate-900 tracking-tighter">{CURRENCY_SYMBOLS[collectionCurrency] || '₩'}{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
               <div className="mt-8 pt-8 border-t border-slate-50">
                 <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
                   <Check size={14} />
                   {uiText.verifiedNode}
                 </div>
               </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 space-y-4">
               <div className="flex items-center gap-3 text-blue-900 font-semibold">
                 <AlertCircle size={18} />
                 <span className="text-[14px]">{uiText.importantNote}</span>
               </div>
               <p className="text-[13px] text-blue-800 leading-relaxed">{uiText.noteText}</p>
            </div>

            {isPhpFlow && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 space-y-3">
                <div className="flex items-center gap-3 text-amber-900 font-semibold">
                  <AlertCircle size={18} />
                  <span className="text-[14px]">PHP balance reminder</span>
                </div>
                <p className="text-[13px] text-amber-800 leading-relaxed">
                  Please keep at least ₱5,000 in your PHP wallet, or access to all features may be turned off.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
