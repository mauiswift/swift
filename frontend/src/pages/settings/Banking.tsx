import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ChevronLeft, Loader2, Landmark, ArrowLeft, ArrowRight, CheckCircle2, Globe2, PenLine, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { client } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { KRW_BANKS } from '@/config/krw-banks';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';

const KOREA_CHANNELS = [
  { id: 'bank_transfer', label: 'Korean bank transfer', description: 'Manual KRW transfer with admin verification', tone: 'bg-blue-50 text-blue-700', available: true },
  { id: 'kakaopay', label: 'KakaoPay', description: 'Requires a Korean acquiring partner', tone: 'bg-yellow-50 text-yellow-800', available: false },
  { id: 'naverpay', label: 'Naver Pay', description: 'Requires a Korean acquiring partner', tone: 'bg-emerald-50 text-emerald-700', available: false },
  { id: 'tosspay', label: 'Toss Pay', description: 'Requires a Toss or acquiring partner account', tone: 'bg-violet-50 text-violet-700', available: false },
  { id: 'payco', label: 'PAYCO', description: 'Requires a Korean acquiring partner', tone: 'bg-red-50 text-red-700', available: false },
];

const DEFAULT_SETTLEMENT_CURRENCY = 'KRW';
const DEFAULT_SETTLEMENT_TYPE = 'Korean bank transfer';

type TossForm = {
  legal_name: string;
  country: string;
  business_type: string;
  monthly_volume: string;
  currencies: string[];
  purpose: string;
  contact_email: string;
};

type TossVirtualAccount = {
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  currency: string;
  account_type: string;
  status?: 'active' | 'suspended';
};

const createTossForm = (user?: { name?: string | null; email?: string | null }): TossForm => ({
  legal_name: user?.name || '',
  country: 'Philippines',
  business_type: 'Corporation',
  monthly_volume: 'Under 100,000 KRW',
  currencies: ['KRW'],
  purpose: 'Global collections and business payments',
  contact_email: user?.email || '',
});

export default function Banking() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [channelLoading, setChannelLoading] = useState(true);
  const [channelSaving, setChannelSaving] = useState(false);
  const [channelEligible, setChannelEligible] = useState(false);
  const channelCurrency = 'KRW';
  const [paymentChannels, setPaymentChannels] = useState<Record<string, string[]>>({});
  const [tossStatus, setTossStatus] = useState('not_started');
  const [tossWizardOpen, setTossWizardOpen] = useState(false);
  const [tossStep, setTossStep] = useState(1);
  const [tossSaving, setTossSaving] = useState(false);
  const [tossBenefitsUnlocked, setTossBenefitsUnlocked] = useState(false);
  const [tossVirtualAccount, setTossVirtualAccount] = useState<TossVirtualAccount | null>(null);
  const [usdtDepositAddress, setUsdtDepositAddress] = useState('');
  const [tossForm, setTossForm] = useState<TossForm>(() => createTossForm(user || undefined));
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingSignature = useRef(false);
  const [signatureData, setSignatureData] = useState('');
  const [settlementEditing, setSettlementEditing] = useState(false);
  const [settlementSaving, setSettlementSaving] = useState(false);
  const [settlementForm, setSettlementForm] = useState({
    bank_name: user?.bank_name || '',
    bank_account_number: user?.bank_account_number || '',
    bank_account_name: user?.bank_account_name || '',
    bank_address: user?.bank_address || '',
    settlement_type: user?.settlement_type || DEFAULT_SETTLEMENT_TYPE,
    settlement_currency: user?.settlement_currency || DEFAULT_SETTLEMENT_CURRENCY,
  });

  useEffect(() => {
    setSettlementForm({
      bank_name: user?.bank_name || '',
      bank_account_number: user?.bank_account_number || '',
      bank_account_name: user?.bank_account_name || '',
      bank_address: user?.bank_address || '',
      settlement_type: user?.settlement_type || DEFAULT_SETTLEMENT_TYPE,
      settlement_currency: user?.settlement_currency || DEFAULT_SETTLEMENT_CURRENCY,
    });
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    setChannelLoading(true);
    client.get(`/api/v1/users/${user.id}/payment-channels`)
      .then((res) => {
        if (!res.ok) throw new Error(res.data?.detail || 'Unable to load payment channels');
        setChannelEligible(Boolean(res.data?.eligible));
        setPaymentChannels(res.data?.channels || {});
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Unable to load payment channels'))
      .finally(() => setChannelLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    client.get(`/api/v1/users/${user.id}/toss-virtual-account`)
      .then((res) => {
        if (res.ok) {
          setTossStatus(res.data?.status || 'not_started');
          setTossBenefitsUnlocked(Boolean(res.data?.benefits?.unlocked));
          setTossVirtualAccount(res.data?.virtual_account || null);
        }
      })
      .catch(() => toast.error('Unable to load TOSS Virtual Account status'));
    client.get('/api/v1/app-settings/usdt-trc20-address')
      .then((res) => {
        if (res.ok) setUsdtDepositAddress(String(res.data?.address || ''));
      })
      .catch(() => toast.error('USDT 입금 지갑 주소를 불러오지 못했습니다.'));
  }, [user?.id]);

  const submitTossApplication = async () => {
    if (!user?.id || !isTossStepValid(3)) return;
    setTossSaving(true);
    try {
      const res = await client.post(`/api/v1/users/${user.id}/toss-virtual-account`, {
        ...tossForm,
        signature_data: signatureData,
      });
      if (!res.ok) throw new Error(res.data?.detail || 'Unable to submit application');
      setTossStatus(res.data?.status || 'pending_review');
      setTossWizardOpen(false);
      setTossStep(1);
      toast.success(
        res.data?.message ||
        "TOSS Bank account application submitted. Please wait for your Relationship Manager's approval.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit application');
    } finally {
      setTossSaving(false);
    }
  };

  const isTossStepValid = (step: number) => {
    if (step === 1) return tossForm.legal_name.trim().length >= 2 && tossForm.country.trim().length >= 2;
    if (step === 2) return tossForm.purpose.trim().length >= 5;
    return Boolean(tossForm.contact_email.trim() && signatureData && usdtDepositAddress.trim());
  };

  const openTossWizard = () => {
    setTossForm(createTossForm(user || undefined));
    setSignatureData('');
    setTossStep(1);
    setTossWizardOpen(true);
  };

  const closeTossWizard = (open: boolean) => {
    if (!open && !tossSaving) {
      setTossWizardOpen(false);
      setTossStep(1);
      setSignatureData('');
    }
  };

  const startSignature = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext('2d');
    if (!context) return;
    isDrawingSignature.current = true;
    context.beginPath();
    context.moveTo(event.clientX - rect.left, event.clientY - rect.top);
    canvas.setPointerCapture(event.pointerId);
  };

  const drawSignature = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignature.current) return;
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const rect = canvas.getBoundingClientRect();
    context.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    context.stroke();
  };

  const finishSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || !isDrawingSignature.current) return;
    isDrawingSignature.current = false;
    setSignatureData(canvas.toDataURL('image/png'));
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  const updateTossField = <K extends keyof TossForm>(field: K, value: TossForm[K]) => {
    setTossForm((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    const canvas = signatureCanvasRef.current;
    if (!tossWizardOpen || tossStep !== 3 || !canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    const context = canvas.getContext('2d');
    if (context) {
      context.scale(ratio, ratio);
      context.lineWidth = 2;
      context.lineCap = 'round';
      context.strokeStyle = '#0f172a';
    }
  }, [tossWizardOpen, tossStep]);

  const togglePaymentChannel = (channel: string, checked: boolean) => {
    setPaymentChannels((current) => {
      const enabled = current[channelCurrency] || [];
      return {
        ...current,
        [channelCurrency]: checked
          ? [...new Set([...enabled, channel])]
          : enabled.filter((value) => value !== channel),
      };
    });
  };

  const savePaymentChannels = async () => {
    if (!user?.id) return;
    setChannelSaving(true);
    try {
      const res = await client.request(`/api/v1/users/${user.id}/payment-channels`, 'PUT', { channels: paymentChannels });
      if (!res.ok) throw new Error(res.data?.detail || 'Unable to update payment channels');
      setPaymentChannels(res.data?.channels || paymentChannels);
      toast.success('Payment channels updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update payment channels');
    } finally {
      setChannelSaving(false);
    }
  };

  const saveSettlement = async () => {
    if (!user?.id) return;
    if (!settlementForm.bank_name || !settlementForm.bank_account_number.trim() || !settlementForm.bank_account_name.trim()) {
      toast.error('Enter the Korean bank, account number, and account holder name.');
      return;
    }
    setSettlementSaving(true);
    try {
      const res = await client.request(`/api/v1/users/${user.id}/settlement`, 'PATCH', {
        ...settlementForm,
        bank_name: settlementForm.bank_name,
        bank_account_number: settlementForm.bank_account_number.replace(/\s+/g, '').trim(),
        bank_account_name: settlementForm.bank_account_name.trim(),
        bank_address: settlementForm.bank_address.trim() || undefined,
        settlement_type: DEFAULT_SETTLEMENT_TYPE,
        settlement_currency: DEFAULT_SETTLEMENT_CURRENCY,
      });
      if (!res.ok) throw new Error(res.data?.detail || 'Unable to save settlement account');
      setSettlementEditing(false);
      toast.success('Korean settlement account updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save settlement account');
    } finally {
      setSettlementSaving(false);
    }
  };

  const ROWS = [
    { label: 'Settlement type', value: user?.settlement_type || DEFAULT_SETTLEMENT_TYPE },
    { label: 'Settlement currency', value: user?.settlement_currency || DEFAULT_SETTLEMENT_CURRENCY },
    { label: 'Bank', value: user?.bank_name },
    { label: 'Account number', value: user?.bank_account_number },
    { label: 'Recipient', value: user?.bank_account_name },
    { label: 'USDT wallet', value: user?.usdt_wallet_address },
    { label: 'Address', value: user?.bank_address },
  ];
  const selectedBank = KRW_BANKS.find(bank => bank.name === settlementForm.bank_name);
  const savedBank = KRW_BANKS.find(bank => bank.name === user?.bank_name);

  const isConfigured = Boolean(
    user?.bank_name?.trim()
      && user?.bank_account_number?.trim()
      && user?.bank_account_name?.trim(),
  );
  return (
    <Layout>
      <div className="page-enter mx-auto w-full max-w-5xl">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-8 font-medium">
          <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={() => navigate('/settings')}>Settings</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-semibold">Banking</span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-5 mb-12">
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">Banking</h1>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Settlement status</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <p className="text-sm font-semibold text-slate-900">{isConfigured ? 'Ready to settle' : 'Setup required'}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Settlement currency</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">KRW <span className="font-normal text-slate-500">· Korean won</span></p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Payment channels</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{channelEligible ? 'Available to configure' : 'Locked'}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-10">
          <span className="inline-block text-[13px] font-semibold text-slate-900 pb-4 border-b-2 border-[#FF6B00] -mb-[2px]">
            Settlement account
          </span>
        </div>

        <div className="app-panel max-w-3xl p-5 sm:p-8">
          <div className="flex items-center justify-between gap-4 mb-10">
            <div>
              <p className="text-[14px] text-slate-700 font-semibold m-0">Settlement account</p>
              <p className="mt-1 text-[13px] text-slate-500">Review the details used for KRW settlement payouts.</p>
            </div>
            <Button type="button" variant="outline" onClick={() => setSettlementEditing(value => !value)} className="shrink-0 gap-2">
              <PenLine size={15} /> {settlementEditing ? 'Cancel' : 'Edit account'}
            </Button>
          </div>

          {settlementEditing && (
            <div className="mb-8 grid gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="settlement-bank-name">Korean bank</Label>
                <div className="mt-1.5 flex items-center gap-3">
                  <PaymentBrandLogo
                    brand={selectedBank?.name || 'Bank'}
                    logoUrl={selectedBank?.logo}
                    size="sm"
                    className="h-10 w-12 rounded-md"
                  />
                  <select
                    id="settlement-bank-name"
                    value={settlementForm.bank_name}
                    onChange={event => setSettlementForm(current => ({ ...current, bank_name: event.target.value }))}
                    className="flex h-10 min-w-0 flex-1 rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a bank</option>
                    {KRW_BANKS.map(bank => <option key={bank.code} value={bank.name}>{bank.name}</option>)}
                  </select>
                </div>
              </div>
              <div><Label htmlFor="settlement-account-number">Account number</Label><Input id="settlement-account-number" inputMode="numeric" autoComplete="off" value={settlementForm.bank_account_number} onChange={event => setSettlementForm(current => ({ ...current, bank_account_number: event.target.value }))} placeholder="Enter account number" className="mt-1.5 bg-white" /></div>
              <div><Label htmlFor="settlement-account-name">Account holder name</Label><Input id="settlement-account-name" value={settlementForm.bank_account_name} onChange={event => setSettlementForm(current => ({ ...current, bank_account_name: event.target.value }))} placeholder="Name registered with the bank" className="mt-1.5 bg-white" /></div>
              <div><Label htmlFor="settlement-bank-address">Bank address (optional)</Label><Input id="settlement-bank-address" value={settlementForm.bank_address} onChange={event => setSettlementForm(current => ({ ...current, bank_address: event.target.value }))} placeholder="Bank branch or address" className="mt-1.5 bg-white" /></div>
              <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-blue-100 pt-4"><p className="text-xs text-blue-800">Settlement currency: <strong>KRW</strong>.</p><Button type="button" onClick={saveSettlement} disabled={settlementSaving} className="bg-[#FF6B00] text-white hover:bg-[#E66000]">{settlementSaving ? 'Saving...' : 'Save settlement account'}</Button></div>
            </div>
          )}

          {!isConfigured ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Landmark size={32} className="text-slate-300" />
              </div>
              <h3 className="text-[16px] font-semibold text-slate-900 mb-2">Not configured</h3>
              <p className="text-[13px] text-slate-500 max-w-sm mx-auto">
                No settlement account has been configured yet. Please update the details using the button above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              {ROWS.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-6 bg-white px-5 py-5 transition-colors hover:bg-slate-50/50 sm:px-10 sm:py-6"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-widest">{row.label}</p>
                    <div className="flex min-w-0 items-center gap-3">
                      {row.label === 'Bank' && (
                        <PaymentBrandLogo
                          brand={savedBank?.name || row.value || 'Bank'}
                          logoUrl={savedBank?.logo}
                          size="sm"
                          className="h-9 w-12 rounded-md"
                        />
                      )}
                      <p className="truncate text-[15px] font-semibold tracking-tight text-slate-900">{row.value || '—'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-[720px] shadow-sm mt-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-lg">🇰🇷</div>
                <div>
                  <h2 className="text-[16px] font-semibold text-slate-900">Korea payment channels</h2>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">KRW checkout activation</p>
                </div>
              </div>
              <p className="text-[13px] text-slate-500 mt-3">
                Activate the Korean payment methods your business accepts. Changes apply to KRW checkout only.
              </p>
            </div>
            <Button
              onClick={savePaymentChannels}
              disabled={!channelEligible || channelLoading || channelSaving}
              className="bg-[#FF6B00] hover:bg-[#E66000] text-white"
            >
              {channelSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Save activation
            </Button>
          </div>

          {channelLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Loading channels...</div>
          ) : !channelEligible ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-800">
              Make one approved USDT deposit of at least 600 USDT to enable payment channel settings.
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-blue-900">Available for KRW</p>
                  <p className="mt-1 text-xs text-blue-700">Choose one or more payment channels.</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700 shadow-sm">KRW</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {KOREA_CHANNELS.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-4 transition-colors hover:border-slate-300">
                    <div className="flex min-w-0 items-center gap-3">
                      <PaymentBrandLogo
                        brand={channel.id === 'bank_transfer' ? 'Bank Transfer' : channel.label}
                        size="sm"
                        className={`h-9 w-12 rounded-lg border-0 shadow-none ${channel.tone}`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{channel.label}</p>
                        <p className="mt-1 text-[11px] leading-4 text-slate-500">{channel.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={(paymentChannels[channelCurrency] || []).includes(channel.id)}
                      disabled={!channel.available}
                      onCheckedChange={(checked) => togglePaymentChannel(channel.id, checked)}
                      aria-label={`Enable ${channel.label}`}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-[720px] shadow-sm mt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <PaymentBrandLogo brand="Toss Bank" size="md" className="h-8 w-20 rounded-lg" />
                <h2 className="text-[16px] font-semibold text-white">토스 가상계좌</h2>
              </div>
              <p className="text-[13px] text-slate-400 mt-1">
                글로벌 수금과 사업자 결제를 위한 원화(KRW) 가상계좌를 신청합니다.
              </p>
            </div>
            {tossStatus === 'pending_review' && (
              <span className="rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-semibold text-amber-300">심사 중</span>
            )}
          </div>

          {!tossBenefitsUnlocked ? (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-[13px] text-amber-100">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-amber-300" />
              <div>
                <p className="font-semibold">서비스 이용 조건</p>
                <p className="mt-1 text-amber-200/80">승인된 USDT 입금액이 600 USDT 이상이어야 원화 가상계좌를 신청할 수 있습니다.</p>
              </div>
            </div>
          ) : tossStatus === 'pending_review' ? (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-[13px] text-emerald-100">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
              <div>
                <p className="font-semibold">신청서가 접수되었습니다</p>
                <p className="mt-1 text-emerald-200/80">신청서가 접수되었습니다. 담당 Relationship Manager의 승인이 완료될 때까지 기다려 주세요. 승인 결과와 계좌 개설 안내는 이메일로 알려드립니다.</p>
                <p className="mt-2 text-xs text-emerald-200/70">Your TOSS Bank account will be opened after your Relationship Manager approves the application.</p>
              </div>
            </div>
          ) : tossStatus === 'approved' && tossVirtualAccount?.status !== 'suspended' ? (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-[13px] text-emerald-100">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
              <div className="min-w-0">
                <p className="font-semibold">TOSS Bank account approved</p>
                <p className="mt-1 text-emerald-200/80">Your account is active and ready to receive KRW payments.</p>
                {tossVirtualAccount && (
                  <div className="mt-4 grid gap-3 rounded-lg border border-emerald-300/20 bg-slate-900/50 p-4 sm:grid-cols-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200/60">Bank</p>
                      <p className="mt-1 font-medium text-white">{tossVirtualAccount.bank_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200/60">Account number</p>
                      <p className="mt-1 font-mono font-medium text-white">{tossVirtualAccount.account_number}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200/60">Account holder</p>
                      <p className="mt-1 font-medium text-white">{tossVirtualAccount.account_holder_name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : tossStatus === 'approved' && tossVirtualAccount?.status === 'suspended' ? (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-[13px] text-red-100">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-red-300" />
              <div>
                <p className="font-semibold">TOSS Bank account suspended</p>
                <p className="mt-1 text-red-200/80">This account is temporarily unavailable for KRW payments. Contact support for assistance.</p>
              </div>
            </div>
          ) : tossStatus === 'rejected' ? (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-[13px] text-red-100">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-red-300" />
              <div>
                <p className="font-semibold">TOSS Bank application needs changes</p>
                <p className="mt-1 text-red-200/80">Your Relationship Manager did not approve this application. Please contact support before submitting a new application.</p>
              </div>
            </div>
          ) : (
            <Button data-guide-target="banking-toss-application" onClick={openTossWizard} className="mt-6 bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              토스 가상계좌 신청
            </Button>
          )}
        </div>

        <Dialog open={tossWizardOpen} onOpenChange={closeTossWizard}>
          <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full flex-col gap-0 overflow-hidden rounded-none border-slate-700 bg-slate-950 p-0 text-white sm:h-auto sm:max-h-[90vh] sm:max-w-[640px] sm:rounded-lg sm:p-6">
            <DialogHeader className="shrink-0 border-b border-slate-800 px-4 pb-4 pt-5 sm:border-0 sm:px-0 sm:pb-0 sm:pt-0">
              <DialogTitle className="flex items-center gap-2 pr-8 text-lg font-semibold text-white sm:gap-3 sm:text-xl">
                <PaymentBrandLogo brand="Toss Bank" size="lg" className="h-8 w-20 rounded-lg sm:h-9 sm:w-24" />
                토스 가상계좌 신청
              </DialogTitle>
              <p className="mt-2 text-xs leading-5 text-slate-400 sm:text-sm">원화(KRW) 전용 가상계좌를 안전하게 신청하는 3단계 절차입니다.</p>
              <div className="grid grid-cols-3 gap-1.5 pt-4 sm:gap-2">
                {['사업자 정보', '계좌 정보', '검토 및 서명'].map((label, index) => {
                  const step = index + 1;
                  return (
                    <div key={label} className={`border-t-2 pt-1.5 sm:pt-2 ${tossStep >= step ? 'border-cyan-400' : 'border-slate-700'}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${tossStep >= step ? 'text-cyan-300' : 'text-slate-500'}`}>{step}</p>
                      <p className={`mt-1 truncate text-[11px] sm:text-xs ${tossStep >= step ? 'text-slate-200' : 'text-slate-500'}`}>{label}</p>
                    </div>
                  );
                })}
              </div>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 text-slate-200 sm:px-0">
              {tossStep === 1 && (
                <div className="space-y-4">
                  <div><Label className="text-slate-300">법인명 또는 사업자명</Label><Input className="mt-2 border-slate-700 bg-slate-900 text-white" value={tossForm.legal_name} onChange={(e) => updateTossField('legal_name', e.target.value)} placeholder="등록된 사업자명을 입력하세요" /></div>
                  <div><Label className="text-slate-300">사업자 등록 국가</Label><Input className="mt-2 border-slate-700 bg-slate-900 text-white" value={tossForm.country} onChange={(e) => updateTossField('country', e.target.value)} /></div>
                  <div><Label className="text-slate-300">사업자 유형</Label><select className="mt-2 h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white" value={tossForm.business_type} onChange={(e) => updateTossField('business_type', e.target.value)}><option value="Corporation">법인</option><option value="Partnership">파트너십</option><option value="Sole proprietorship">개인사업자</option><option value="Non-profit">비영리단체</option></select></div>
                </div>
              )}
              {tossStep === 2 && (
                <div className="space-y-5">
                  <div><Label className="text-slate-300">예상 월 거래량</Label><select className="mt-2 h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white" value={tossForm.monthly_volume} onChange={(e) => updateTossField('monthly_volume', e.target.value)}><option value="Under 100,000 KRW">100,000 KRW 미만</option><option value="100,000–1,000,000 KRW">100,000–1,000,000 KRW</option><option value="Over 1,000,000 KRW">1,000,000 KRW 초과</option></select></div>
                  <div><Label className="text-slate-300">계좌 통화</Label><div className="mt-2 rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-3 text-sm font-semibold text-cyan-300">KRW 원화 전용</div></div>
                  <div><Label className="text-slate-300">계좌 사용 목적</Label><Input className="mt-2 border-slate-700 bg-slate-900 text-white" value={tossForm.purpose} onChange={(e) => updateTossField('purpose', e.target.value)} /></div>
                </div>
              )}
              {tossStep === 3 && (
                <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
                  <p><strong>사업자명:</strong> {tossForm.legal_name || '—'}</p>
                  <p><strong>등록 정보:</strong> {tossForm.country} · {tossForm.business_type}</p>
                  <p><strong>예상 거래량:</strong> {tossForm.monthly_volume}</p>
                  <p><strong>통화:</strong> KRW 원화</p>
                  <p><strong>사용 목적:</strong> {tossForm.purpose || '—'}</p>
                  <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-4">
                    <p className="font-semibold text-cyan-200">600 USDT 입금 안내</p>
                    <p className="mt-1 text-xs leading-5 text-cyan-100/80">
                      신청서를 제출하기 전에 아래 지갑 주소로 600 USDT를 입금해 주세요. 500 USDT는 계좌 개설 및 활성화 비용이며, 100 USDT는 최대 50개의 가상계좌 발급을 위한 할당 금액입니다.
                    </p>
                    <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950 p-3">
                      <p className="text-xs font-medium text-slate-400">입금할 USDT 지갑 주소</p>
                      {usdtDepositAddress ? (
                        <div className="mt-2 flex items-start gap-2">
                          <code className="min-w-0 flex-1 break-all font-mono text-xs text-white">{usdtDepositAddress}</code>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="shrink-0 text-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-200"
                            onClick={() => navigator.clipboard.writeText(usdtDepositAddress).then(() => toast.success('USDT 입금 지갑 주소가 복사되었습니다.'))}
                          >
                            복사
                          </Button>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-amber-300">현재 USDT 입금 지갑 주소가 설정되지 않았습니다. 관리자에게 문의해 주세요.</p>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-cyan-100/70">입금 네트워크와 주소를 반드시 확인한 후 전송하세요. 잘못된 네트워크로 보낸 자산은 복구되지 않을 수 있습니다.</p>
                  </div>
                  <div><label className="block pt-3"><span className="text-xs font-semibold text-slate-400">담당자 이메일</span><Input type="email" className="mt-2 border-slate-700 bg-slate-950 text-white" value={tossForm.contact_email} onChange={(e) => updateTossField('contact_email', e.target.value)} /></label></div>
                  <div className="pt-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2 text-slate-300"><PenLine size={15} className="text-cyan-300" />서명 입력</Label>
                      <Button type="button" variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={clearSignature}>지우기</Button>
                    </div>
                    <canvas
                      ref={signatureCanvasRef}
                      className="mt-2 h-44 w-full touch-none rounded-lg border border-slate-600 bg-white sm:h-36"
                      onPointerDown={startSignature}
                      onPointerMove={drawSignature}
                      onPointerUp={finishSignature}
                      onPointerCancel={finishSignature}
                      onPointerLeave={finishSignature}
                      aria-label="Signature drawing area"
                    />
                    <p className="mt-2 text-xs leading-5 text-slate-500">휴대폰에서는 손가락으로 서명란 안에 천천히 서명해 주세요.</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="shrink-0 border-t border-slate-800 bg-slate-950 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:pt-4">
              <Button variant="ghost" className="flex-1 text-slate-400 hover:bg-slate-800 hover:text-white sm:flex-none" onClick={() => tossStep === 1 ? closeTossWizard(false) : setTossStep(tossStep - 1)} disabled={tossSaving}><ArrowLeft size={15} className="mr-2" />Back</Button>
              {tossStep < 3 ? <Button onClick={() => isTossStepValid(tossStep) && setTossStep(tossStep + 1)} disabled={!isTossStepValid(tossStep)} className="flex-1 bg-cyan-400 text-slate-950 hover:bg-cyan-300 sm:flex-none">Continue<ArrowRight size={15} className="ml-2" /></Button> : <Button onClick={submitTossApplication} disabled={tossSaving || !isTossStepValid(3)} className="flex-1 bg-cyan-400 text-slate-950 hover:bg-cyan-300 sm:flex-none">{tossSaving ? <Loader2 size={15} className="mr-2 animate-spin" /> : null}Submit request</Button>}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
