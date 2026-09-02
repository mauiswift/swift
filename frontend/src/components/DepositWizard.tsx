import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Clipboard, Loader2, Banknote, Landmark } from 'lucide-react';

const createKrwVirtualAccountDestination = (
  userId = 'swiftpay-krw-virtual-account',
  bankName = 'KB Kookmin Bank',
  accountHolderName = 'SwiftPay Ventures Inc.',
) => {
  const hash = Array.from(userId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const digits = Array.from({ length: 14 }, (_, index) => String((hash + index * 7 + 13) % 10)).join('');
  const accountNumber = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  return {
    value: `swiftpay-krw-virtual-account-${userId}`,
    label: bankName,
    account_number: accountNumber,
    account_name: accountHolderName,
  };
};

const getDepositDestinations = (
  currency: string = 'PHP',
  userId = 'swiftpay-krw-virtual-account',
  bankName = 'KB Kookmin Bank',
  accountHolderName = 'SwiftPay Ventures Inc.',
) => {
  if (currency === 'KRW') {
    return [createKrwVirtualAccountDestination(userId, bankName, accountHolderName)];
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

type Props = {
  onSuccess?: () => Promise<void> | void;
  currency?: string;
  userId?: string;
  bankName?: string;
  accountHolderName?: string;
  destinations?: Array<{ value: string; label: string; account_number: string; account_name: string }>;
};

export default function DepositWizard({ onSuccess, currency = 'PHP', userId, bankName, accountHolderName, destinations }: Props) {
  const normalizedCurrency = String(currency || 'PHP').toUpperCase();
  const isKrwFlow = normalizedCurrency === 'KRW';
  const resolvedDestinations = useMemo(
    () => destinations || getDepositDestinations(
      normalizedCurrency,
      userId || 'swiftpay-krw-virtual-account',
      bankName || 'KB Kookmin Bank',
      accountHolderName || 'SwiftPay Ventures Inc.',
    ),
    [normalizedCurrency, userId, bankName, accountHolderName, destinations],
  );
  const [step, setStep] = useState(1);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositChannel, setDepositChannel] = useState(resolvedDestinations[0]?.value || 'Netbank');
  const [depositMethod, setDepositMethod] = useState(isKrwFlow ? 'bank_transfer' : 'same_bank');
  const [depositRefNumber, setDepositRefNumber] = useState('');
  const [depositNotes, setDepositNotes] = useState('');
  const [depositReceipt, setDepositReceipt] = useState<File | null>(null);
  const [depositDate, setDepositDate] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedDestination = useMemo(() => resolvedDestinations.find(d => d.value === depositChannel) || resolvedDestinations[0], [depositChannel, resolvedDestinations]);
  const walletTopUpOptions = useMemo(() => {
    const defaultOptions = [
      { value: 'bank_transfer', label: 'Bank transfer', description: 'Direct bank deposit or transfer', icon: 'landmark' },
      { value: 'ubp_bills_payment', label: 'UBP Bills Payment', description: 'Pay via UnionBank app', icon: 'banknote' },
    ];
    return isKrwFlow ? defaultOptions.filter(option => option.value !== 'ubp_bills_payment') : defaultOptions;
  }, [isKrwFlow]);

  React.useEffect(() => {
    if (isKrwFlow && depositMethod === 'ubp_bills_payment') {
      setDepositMethod('bank_transfer');
    }
  }, [depositMethod, isKrwFlow]);

  const validStep1 = depositAmount && parseFloat(depositAmount) > 0;
  const validStep2 = Boolean(depositChannel && depositMethod);
  const validStep3 = Boolean(depositRefNumber || depositNotes);
  const validStep4 = Boolean(depositReceipt && depositDate && depositRefNumber.trim());

  const goNext = () => {
    if (step === 1 && !validStep1) { toast.error('Enter a valid amount'); return; }
    if (step === 2 && !validStep2) { toast.error('Choose destination and method'); return; }
    setStep(s => Math.min(4, s + 1));
  };

  const goBack = () => setStep(s => Math.max(1, s - 1));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied'));
  };

  const previewUrl = depositReceipt ? URL.createObjectURL(depositReceipt) : null;

  const handleSubmit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid deposit amount'); return; }
    if (!depositChannel) { toast.error('Choose a destination bank'); return; }
    if (!depositMethod.trim()) { toast.error('Select a transfer method'); return; }
    if (!depositDate) { toast.error('Select the transfer date'); return; }
    if (!depositRefNumber.trim()) { toast.error('Enter the reference number'); return; }
    if (!depositReceipt) { toast.error('Upload proof of transaction'); return; }

    setLoading(true);
    try {
      // Create a canonical payment via unified payments endpoint so dashboard and bot share behavior
      const selected = resolvedDestinations.find(d => d.value === depositChannel) || resolvedDestinations[0];
      const accountNumber = selected?.account_number || depositChannel;

      const payload = {
        amount: amount,
        description: `Bank deposit to ${selected?.label || depositChannel}`,
        currency: 'PHP',
        metadata: {
          channel: depositChannel,
          account_number: accountNumber,
          transfer_method: depositMethod.trim(),
          ref_number: depositRefNumber.trim(),
          note: depositNotes.trim(),
          transfer_date: depositDate,
        },
      };

      let res, data;
      if (depositReceipt) {
        const formData = new FormData();
        formData.append('amount', amount.toString());
        formData.append('description', payload.description);
        formData.append('currency', 'PHP');
        // prefix metadata keys with meta_ for server parsing
        Object.entries(payload.metadata).forEach(([k, v]) => {
          if (v !== undefined && v !== null) formData.append(`meta_${k}`, String(v));
        });
        formData.append('receipt', depositReceipt as Blob);

        res = await fetch('/api/v1/payments/create', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        data = await res.json().catch(() => ({}));
      } else {
        res = await fetch('/api/v1/payments/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
        data = await res.json().catch(() => ({}));
      }
      if (res.ok && data && data.success) {
        toast.success('PHP deposit request created - waiting for bank confirmation');
        setDepositAmount(''); setDepositChannel(resolvedDestinations[0]?.value || 'Netbank'); setDepositMethod('same_bank');
        setDepositRefNumber(''); setDepositNotes(''); setDepositReceipt(null); setDepositDate(''); setStep(1);
        if (onSuccess) await onSuccess();
      } else {
        toast.error((data && (data.detail || data.error || data.message)) || 'Failed to create payment');
      }
    } catch (e) {
      console.error('Manual deposit pay/create failed:', e);
      toast.error('Network error sending the manual deposit. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {['Choose method','Top up details','Confirm top up','Submit proof'].map((t, i) => {
          const s = i + 1;
          const active = s === step;
          return (
            <div key={t} className={`rounded-2xl border px-3 py-2 text-[11px] font-semibold ${active ? 'border-blue-600 bg-blue-50 text-foreground' : 'border-slate-200 bg-white text-slate-500'}`}>
              <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Step {s}</p>
              <p className="mt-1 leading-tight">{t}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">Choose how to top up</p>

            <div>
              <Label className="text-[10px] font-medium text-slate-700">Top Up Amount (₱)</Label>
              <div className="relative mt-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₱</div>
                <Input
                  type="number"
                  placeholder="1000"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  min="1000"
                  className="pl-8 bg-white border-slate-200 text-foreground"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Minimum deposit: ₱1,000.00</p>
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
            <p className="text-sm font-semibold text-foreground">Top up details</p>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-[10px] font-medium text-slate-700">Top Up To</Label>
                <Select value={depositChannel} onValueChange={setDepositChannel}>
                  <SelectTrigger className="mt-1 bg-white border-slate-200 text-foreground">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    {resolvedDestinations.map(dest => (
                      <SelectItem key={dest.value} value={dest.value}>{dest.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] font-medium text-slate-700">Specific Method Details</Label>
                <Select value={depositMethod} onValueChange={setDepositMethod}>
                  <SelectTrigger className="mt-1 bg-white border-slate-200 text-foreground"><SelectValue placeholder="Select method" /></SelectTrigger>
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
            <p className="text-sm font-semibold text-foreground">Confirm top up</p>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Account Number</p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="font-mono">{selectedDestination.account_number}</code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(selectedDestination.account_number)} className="ml-2"><Clipboard className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Account Name</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-semibold">{selectedDestination.account_name}</span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(selectedDestination.account_name)} className="ml-2"><Clipboard className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Amount</p>
                  <p className="mt-2 text-foreground font-semibold">₱{depositAmount || '0.00'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Reference</p>
                  <Input placeholder="REF-12345" value={depositRefNumber} onChange={e => setDepositRefNumber(e.target.value)} className="mt-1" />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">Submit proof</p>
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
