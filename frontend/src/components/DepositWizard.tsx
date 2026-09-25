import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { buildAuthHeaders } from '@/lib/api';
import { Clipboard, Loader2, Banknote, Landmark } from 'lucide-react';
import { getBankDisplayName, getBankLogo } from '@/lib/bankBranding';

const getDepositDestinations = (
  currency: string = 'PHP',
  _userId = 'swiftpay-krw-virtual-account',
  _bankName = '',
  _accountHolderName = '',
) => {
  if (currency === 'KRW') {
    return [];
  }

  return [{
    value: 'Netbank',
    label: 'Netbank',
    account_number: '041-105-00037-6',
    account_name: 'Swift Technology Ventures Inc.',
  }];
};

const TOPUP_METHODS = [
  { value: 'same_bank', label: 'Same-bank transfer' },
  { value: 'interbank', label: 'Interbank transfer' },
  { value: 'cash_deposit', label: 'Cash deposit' },
  { value: 'check_deposit', label: 'Check deposit' },
  { value: 'international', label: 'International transfer' },
];

type DepositDestination = {
  value: string;
  label: string;
  account_number: string;
  account_name: string;
  currency?: string;
  receiving_currency?: string;
  swift_code?: string;
  bank_code?: string;
  branch_code?: string;
  bank_address?: string;
  minimum_amount?: number;
};

type Props = {
  onSuccess?: () => Promise<void> | void;
  currency?: string;
  userId?: string;
  bankName?: string;
  accountHolderName?: string;
  companyLogoUrl?: string;
  destinations?: DepositDestination[];
};

export default function DepositWizard({ onSuccess, currency = 'PHP', userId, bankName, accountHolderName, companyLogoUrl, destinations }: Props) {
  const normalizedCurrency = String(currency || 'PHP').toUpperCase();
  const isKrwFlow = normalizedCurrency === 'KRW';
  const resolvedDestinations: DepositDestination[] = useMemo(
    () => destinations || getDepositDestinations(
      normalizedCurrency,
      userId || 'swiftpay-krw-virtual-account',
      bankName || '토스페이',
      accountHolderName || 'SwiftPay Ventures Inc.',
    ),
    [normalizedCurrency, userId, bankName, accountHolderName, destinations],
  );
  const [configuredDestinations, setConfiguredDestinations] = useState<DepositDestination[] | null>(destinations || null);
  React.useEffect(() => {
    if (destinations) return;
    fetch('/api/v1/bank-deposits/accounts', {
      credentials: 'include',
      headers: buildAuthHeaders(),
    })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Failed to load deposit accounts')))
      .then(data => setConfiguredDestinations((data.accounts || []).filter((item: DepositDestination & { currency?: string }) => (item.currency || 'PHP') === normalizedCurrency)))
      .catch(() => undefined);
  }, [destinations, normalizedCurrency]);
  const activeDestinations = configuredDestinations === null ? resolvedDestinations : configuredDestinations;
  const [step, setStep] = useState(1);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositChannel, setDepositChannel] = useState(activeDestinations[0]?.value || 'Netbank');
  const [depositMethod, setDepositMethod] = useState(isKrwFlow ? 'bank_transfer' : 'same_bank');
  const [depositRefNumber, setDepositRefNumber] = useState('');
  const [depositNotes, setDepositNotes] = useState('');
  const [depositReceipt, setDepositReceipt] = useState<File | null>(null);
  const [depositDate, setDepositDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedHighValueDestination, setSelectedHighValueDestination] = useState<DepositDestination | null>(null);

  const highValueDestinations = activeDestinations.filter(destination => Number(destination.minimum_amount || 0) > 0);
  const isHighValueKrwTransfer = isKrwFlow && highValueDestinations.some(destination => Number.parseFloat(depositAmount) >= Number(destination.minimum_amount));
  React.useEffect(() => {
    if (isHighValueKrwTransfer && !selectedHighValueDestination) {
      setSelectedHighValueDestination(highValueDestinations[Math.floor(Math.random() * highValueDestinations.length)] || null);
    } else if (!isHighValueKrwTransfer && selectedHighValueDestination) {
      setSelectedHighValueDestination(null);
    }
  }, [isHighValueKrwTransfer, selectedHighValueDestination, highValueDestinations]);

  const availableDestinations = isHighValueKrwTransfer && selectedHighValueDestination
    ? [selectedHighValueDestination]
    : activeDestinations.filter(destination => !destination.minimum_amount);
  const selectedDestination = useMemo(
    () => availableDestinations.find(d => d.value === depositChannel) || availableDestinations[0],
    [depositChannel, availableDestinations],
  );
  const walletTopUpOptions = useMemo(() => {
    const defaultOptions = [
      { value: 'bank_transfer', label: isKrwFlow ? '은행 송금' : 'Bank transfer', description: isKrwFlow ? '은행에서 직접 송금' : 'Direct bank deposit or transfer', icon: 'landmark' },
    ];
    return defaultOptions;
  }, [isKrwFlow]);

  React.useEffect(() => {
    if (depositMethod !== 'bank_transfer') setDepositMethod('bank_transfer');
  }, [depositMethod, isKrwFlow]);

  React.useEffect(() => {
    if (isHighValueKrwTransfer && selectedHighValueDestination && depositChannel !== selectedHighValueDestination.value) {
      setDepositChannel(selectedHighValueDestination.value);
    } else if (!isHighValueKrwTransfer && availableDestinations.some(destination => destination.value === depositChannel)) {
      setDepositChannel(activeDestinations[0]?.value || 'Netbank');
    }
  }, [isHighValueKrwTransfer, depositChannel, activeDestinations, availableDestinations, selectedHighValueDestination]);

  const validStep1 = depositAmount && parseFloat(depositAmount) > 0;
  const validStep2 = Boolean(depositChannel && depositMethod);
  const validStep3 = Boolean(depositRefNumber || depositNotes);
  const validStep4 = Boolean(depositReceipt && depositDate && depositRefNumber.trim());

  const goNext = () => {
    if (step === 1 && !validStep1) { toast.error(isKrwFlow ? '유효한 금액을 입력하세요.' : 'Enter a valid amount'); return; }
    if (step === 2 && !validStep2) { toast.error(isKrwFlow ? '입금 계좌와 방법을 선택하세요.' : 'Choose destination and method'); return; }
    setStep(s => Math.min(4, s + 1));
  };

  const goBack = () => setStep(s => Math.max(1, s - 1));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(isKrwFlow ? '복사되었습니다.' : 'Copied'));
  };

  const previewUrl = depositReceipt ? URL.createObjectURL(depositReceipt) : null;

  const handleSubmit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) { toast.error(isKrwFlow ? '유효한 입금 금액을 입력하세요.' : 'Enter a valid deposit amount'); return; }
    if (!depositChannel) { toast.error(isKrwFlow ? '입금 계좌를 선택하세요.' : 'Choose a destination bank'); return; }
    if (!depositMethod.trim()) { toast.error(isKrwFlow ? '송금 방법을 선택하세요.' : 'Select a transfer method'); return; }
    if (!depositDate) { toast.error(isKrwFlow ? '송금 날짜를 선택하세요.' : 'Select the transfer date'); return; }
    if (!depositRefNumber.trim()) { toast.error(isKrwFlow ? '참조번호를 입력하세요.' : 'Enter the reference number'); return; }
    if (!depositReceipt) { toast.error(isKrwFlow ? '송금 증빙을 업로드하세요.' : 'Upload proof of transaction'); return; }

    setLoading(true);
    try {
      const selected = activeDestinations.find(d => d.value === depositChannel) || activeDestinations[0];
      const accountNumber = selected?.account_number || depositChannel;

      let res, data;
      {
        const formData = new FormData();
        formData.append('amount_php', amount.toString());
        formData.append('currency', normalizedCurrency);
        formData.append('channel', depositChannel);
        formData.append('account_number', accountNumber);
        formData.append('transfer_method', depositMethod.trim());
        formData.append('ref_number', depositRefNumber.trim());
        formData.append('transfer_date', depositDate);
        if (depositNotes.trim()) formData.append('note', depositNotes.trim());
        formData.append('receipt', depositReceipt as Blob);

        res = await fetch('/api/v1/bank-deposits', {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: buildAuthHeaders(),
        });
        data = await res.json().catch(() => ({}));
      }
      if (res.ok && data && data.success) {
        toast.success(isKrwFlow ? 'KRW 입금 완료 요청이 접수되었습니다. 은행 확인을 기다려 주세요.' : `${normalizedCurrency} deposit completed - waiting for bank confirmation`);
        setDepositAmount(''); setDepositChannel(activeDestinations[0]?.value || 'Netbank'); setDepositMethod(isKrwFlow ? 'bank_transfer' : 'same_bank');
        setDepositRefNumber(''); setDepositNotes(''); setDepositReceipt(null); setDepositDate(''); setStep(1);
        if (onSuccess) await onSuccess();
      } else {
        toast.error((data && (data.detail || data.error || data.message)) || (isKrwFlow ? '입금 요청을 생성하지 못했습니다.' : 'Failed to create payment'));
      }
    } catch (e) {
      console.error('Manual deposit pay/create failed:', e);
      toast.error(isKrwFlow ? '네트워크 오류가 발생했습니다. 다시 시도하세요.' : 'Network error sending the manual deposit. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(isKrwFlow ? ['입금 방법 선택', '입금 정보', '입금 확인', '증빙 제출'] : ['Choose method','Top up details','Confirm top up','Submit proof']).map((t, i) => {
          const s = i + 1;
          const active = s === step;
          return (
            <div key={t} className={`rounded-2xl border px-3 py-2 text-[11px] font-semibold ${active ? 'border-blue-600 bg-blue-50 text-foreground' : 'border-slate-200 bg-white text-slate-500'}`}>
              <p className="text-xs font-medium text-slate-500">Step {s}</p>
              <p className="mt-1 leading-tight">{t}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">{isKrwFlow ? '입금 방법을 선택하세요' : 'Choose how to top up'}</p>

            <div>
              <Label className="text-[10px] font-medium text-slate-700">{isKrwFlow ? '입금 금액 (₩)' : 'Top Up Amount (₱)'}</Label>
              <div className="relative mt-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{isKrwFlow ? '₩' : '₱'}</div>
                <Input
                  type="number"
                  placeholder="1000"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  min="1000"
                  className="pl-8 bg-white border-slate-200 text-foreground"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">{isKrwFlow ? '최소 입금액: ₩1,000.00' : 'Minimum deposit: ₱1,000.00'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {walletTopUpOptions.map((option) => {
                const Icon = option.icon === 'banknote' ? Banknote : Landmark;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDepositMethod(option.value)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      depositMethod === option.value
                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{option.label}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{option.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">{isKrwFlow ? '입금 정보' : 'Top up details'}</p>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-[10px] font-medium text-slate-700">{isKrwFlow ? '입금 계좌' : 'Top Up To'}</Label>
                <Select value={depositChannel} onValueChange={setDepositChannel}>
                  <SelectTrigger className="mt-1 bg-white border-slate-200 text-foreground">
                    <SelectValue placeholder={isKrwFlow ? '계좌를 선택하세요' : 'Select destination'} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    {availableDestinations.map(dest => (
                      <SelectItem key={dest.value} value={dest.value}>
                        {dest.label}{dest.receiving_currency ? ` · ${dest.receiving_currency}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] font-medium text-slate-700">{isKrwFlow ? '송금 방법' : 'Specific Method Details'}</Label>
                <Select value={depositMethod} onValueChange={setDepositMethod}>
                  <SelectTrigger className="mt-1 bg-white border-slate-200 text-foreground"><SelectValue placeholder={isKrwFlow ? '방법을 선택하세요' : 'Select method'} /></SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    {TOPUP_METHODS.map(m => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">{isKrwFlow ? 'KRW 입금 확인' : 'Confirm top up'}</p>
            {isKrwFlow && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-950">
                <p className="font-semibold">모바일 뱅킹 해외송금 안내</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 leading-5">
                  <li>휴대폰에서 사용하는 은행 앱을 열고 <strong>해외송금(International Transfer)</strong> 또는 SWIFT를 선택하세요.</li>
                  <li>화면 아래에 표시된 수취인 계좌의 은행명, 계좌번호, 수취인명, SWIFT/BIC를 그대로 입력하세요.</li>
                  <li>앱에서 표시하는 환율과 수수료를 확인한 뒤 정확한 {depositAmount || '입금'} 금액을 송금하세요.</li>
                  <li>송금이 완료되면 앱 영수증과 참조번호를 아래에 제출해 주세요.</li>
                </ol>
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
                {companyLogoUrl ? (
                  <div className="flex h-10 w-16 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white p-1">
                    <img src={companyLogoUrl} alt={selectedDestination.account_name || 'Company logo'} className="h-full w-full object-contain" />
                  </div>
                ) : getBankLogo(selectedDestination.label) ? (
                  <img src={getBankLogo(selectedDestination.label)} alt="" className="h-9 w-9 object-contain" />
                ) : (
                  <Landmark className="h-5 w-5 text-slate-400" aria-hidden="true" />
                )}
                <div>
                  <p className="text-xs font-medium text-slate-500">{isKrwFlow ? 'Receiving bank' : 'Company banking'}</p>
                  <p className="text-base font-semibold text-slate-900">{getBankDisplayName(selectedDestination.label)}</p>
                  <p className="text-sm text-slate-600">{selectedDestination.account_name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500">{isKrwFlow ? '계좌번호' : 'Account number'}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="font-mono">{selectedDestination.account_number}</code>
                    <Button variant="ghost" size="sm" aria-label={isKrwFlow ? '계좌번호 복사' : 'Copy account number'} title={isKrwFlow ? '계좌번호 복사' : 'Copy account number'} onClick={() => copyToClipboard(selectedDestination.account_number)} className="ml-2"><Clipboard className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">{isKrwFlow ? '예금주' : 'Account name'}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-semibold">{selectedDestination.account_name}</span>
                    <Button variant="ghost" size="sm" aria-label={isKrwFlow ? '예금주 복사' : 'Copy account name'} title={isKrwFlow ? '예금주 복사' : 'Copy account name'} onClick={() => copyToClipboard(selectedDestination.account_name)} className="ml-2"><Clipboard className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {selectedDestination.swift_code && (
                  <div>
                    <p className="text-xs font-medium text-slate-500">SWIFT / BIC 코드</p>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="font-mono">{selectedDestination.swift_code}</code>
                      <Button variant="ghost" size="sm" aria-label="Copy SWIFT or BIC code" title="Copy SWIFT or BIC code" onClick={() => copyToClipboard(selectedDestination.swift_code || '')} className="ml-2"><Clipboard className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
                {'bank_code' in selectedDestination && (
                  <div>
                    <p className="text-xs font-medium text-slate-500">Bank / branch code</p>
                    <p className="mt-2 font-mono text-sm">{selectedDestination.bank_code} / {selectedDestination.branch_code}</p>
                  </div>
                )}
                {(selectedDestination.receiving_currency || selectedDestination.currency) && (
                  <div>
                    <p className="text-xs font-medium text-slate-500">Receiving currency</p>
                    <p className="mt-2 font-semibold">{selectedDestination.receiving_currency || selectedDestination.currency}</p>
                  </div>
                )}
                {'bank_address' in selectedDestination && (
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-slate-500">Bank address</p>
                    <p className="mt-2 text-sm leading-5">{selectedDestination.bank_address}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-slate-500">{isKrwFlow ? '금액' : 'Amount'}</p>
                  <p className="mt-2 text-foreground font-semibold">{normalizedCurrency === 'KRW' ? '₩' : '₱'}{depositAmount || '0.00'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">{isKrwFlow ? '참조번호' : 'Reference'}</p>
                  <Input placeholder="REF-12345" value={depositRefNumber} onChange={e => setDepositRefNumber(e.target.value)} className="mt-1" />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">{isKrwFlow ? '송금 증빙 제출' : 'Submit proof'}</p>
            <div>
              <Label className="text-[10px] font-medium text-slate-700">Proof of transaction</Label>
              <input type="file" accept="image/*,.pdf" onChange={e => setDepositReceipt(e.target.files?.[0] || null)} className="mt-2 block w-full" />
              {previewUrl && <img src={previewUrl} alt="preview" className="mt-2 max-h-40 object-contain" />}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] font-medium text-slate-700">Transfer Date</Label>
                <Input type="date" value={depositDate} onChange={e => setDepositDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-[10px] font-medium text-slate-700">Reference Number</Label>
                <Input placeholder="TRF-12345" value={depositRefNumber} onChange={e => setDepositRefNumber(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-[10px] font-medium text-slate-700">Notes</Label>
              <Input placeholder="Optional notes for admin" value={depositNotes} onChange={e => setDepositNotes(e.target.value)} className="mt-1" />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end mt-4">
          {step > 1 && <Button variant="outline" onClick={goBack} className="h-10 rounded-lg">Back</Button>}
          {step < 4 ? (
            <Button onClick={goNext} className="h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white">Continue</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submit</> : 'Submit'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
