import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Clock3, Copy, ImagePlus, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type Props = {
  initialAmount?: string;
  onClose: () => void;
  onSuccess?: () => Promise<void> | void;
};

const COOLDOWN_SECONDS = 15 * 60;

export default function UsdtTopupWizard({ initialAmount = '', onClose, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState(initialAmount);
  const [address, setAddress] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(COOLDOWN_SECONDS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/v1/app-settings/usdt-trc20-address')
      .then(response => response.json())
      .then(data => {
        if (active) setAddress(data.address || '');
      })
      .catch(() => toast.error('Unable to load the USDT deposit address'));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const countdown = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const seconds = (secondsLeft % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [secondsLeft]);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    toast.success('USDT address copied');
  };

  const goNext = () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error('Enter the USDT amount you will send');
      return;
    }
    if (!address) {
      toast.error('The USDT deposit address is not available yet');
      return;
    }
    if (secondsLeft <= 0) {
      toast.error('This deposit session has expired. Please start again.');
      return;
    }
    setStep(2);
  };

  const submitReceipt = async () => {
    if (!receipt) {
      toast.error('Upload the successful transfer screenshot');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('amount_usdt', Number(amount).toFixed(2));
      formData.append('receipt', receipt);
      if (note.trim()) formData.append('note', note.trim());
      const response = await fetch('/api/v1/topup/request-with-receipt', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || 'Unable to submit the USDT top-up');
      toast.success('USDT top-up submitted for admin review');
      await onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit the USDT top-up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-orange-200 bg-white p-5 shadow-sm space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">USDT Top-Up</p>
          <h3 className="text-lg font-semibold text-slate-900 mt-1">{step === 1 ? 'Send USDT to this address' : 'Upload transfer proof'}</h3>
        </div>
        <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-900">Close</button>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className={step === 1 ? 'font-semibold text-orange-700' : ''}>1. Send USDT</span>
        <ArrowRight className="h-3.5 w-3.5" />
        <span className={step === 2 ? 'font-semibold text-orange-700' : ''}>2. Upload proof</span>
        <span className="ml-auto inline-flex items-center gap-1 font-mono text-orange-700"><Clock3 className="h-3.5 w-3.5" />{countdown}</span>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold text-slate-700">USDT amount to send</Label>
            <Input type="number" min="1" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="e.g. 100" className="mt-2 bg-slate-50" />
          </div>
          <div className="flex flex-col items-center gap-4 rounded-lg border border-blue-200 bg-blue-50/60 p-4">
            {address ? <QRCodeSVG value={address} size={190} bgColor="#ffffff" fgColor="#0f172a" includeMargin /> : <div className="h-[190px] w-[190px] animate-pulse rounded bg-white" />}
            <div className="w-full space-y-2 text-center">
              <p className="text-xs font-semibold text-blue-900">USDT TRC-20 deposit address</p>
              <p className="break-all rounded bg-white px-3 py-2 font-mono text-xs text-slate-700">{address || 'Loading address...'}</p>
              <Button type="button" variant="outline" size="sm" onClick={copyAddress} disabled={!address} className="gap-2"><Copy className="h-3.5 w-3.5" />Copy address</Button>
            </div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            Send only USDT over the TRC-20 network. Send the exact amount, wait for the transfer to succeed, then continue and upload the screenshot from your wallet.
          </div>
          <Button type="button" onClick={goNext} className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2">I sent the USDT <ArrowRight className="h-4 w-4" /></Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 flex gap-2"><CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />Attach a clear screenshot showing the completed transfer, amount, destination, and transaction status.</div>
          <div>
            <Label className="text-xs font-semibold text-slate-700">Successful transfer screenshot</Label>
            <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-600 hover:border-orange-400 hover:text-orange-700">
              <ImagePlus className="h-5 w-5" />{receipt ? receipt.name : 'Choose an image'}
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={event => setReceipt(event.target.files?.[0] || null)} />
            </label>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700">Note (optional)</Label>
            <Input value={note} onChange={event => setNote(event.target.value)} placeholder="Transaction hash or additional details" className="mt-2 bg-slate-50" />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
            <Button type="button" onClick={submitReceipt} disabled={loading || secondsLeft <= 0} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">{loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : 'Submit top-up request'}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
