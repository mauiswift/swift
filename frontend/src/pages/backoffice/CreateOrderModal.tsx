import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Copy, ExternalLink, LoaderCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { client } from '@/lib/api';

type OrderKind = 'invoice' | 'payment_link' | 'qr_code';

interface CreateOrderModalProps {
  currency: string;
  onClose: () => void;
  onCreated: () => void;
}

const ORDER_ENDPOINTS: Record<OrderKind, string> = {
  invoice: '/api/v1/xend/create-invoice',
  payment_link: '/api/v1/xend/create-payment-link',
  qr_code: '/api/v1/xend/create-qr-code',
};

function getPaymentUrl(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const response = data as Record<string, unknown>;
  const nested = response.data && typeof response.data === 'object'
    ? response.data as Record<string, unknown>
    : {};
  for (const candidate of [
    nested.payment_url,
    nested.paymentUrl,
    nested.checkout_url,
    nested.redirect_url,
    nested.qr_code_url,
    response.payment_url,
    response.checkout_url,
    response.redirect_url,
  ]) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return '';
}

export default function CreateOrderModal({ currency, onClose, onCreated }: CreateOrderModalProps) {
  const [kind, setKind] = useState<OrderKind>('invoice');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [method, setMethod] = useState('');
  const [methods, setMethods] = useState<string[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    let active = true;
    const loadMethods = async () => {
      setMethodsLoading(true);
      setMethods([]);
      setMethod('');
      setError('');
      try {
        const response = await client.get(`/api/v1/xend/payment-methods?currency=${encodeURIComponent(currency.toUpperCase())}`);
        const values = response.data && typeof response.data === 'object'
          ? (response.data as { payment_methods?: unknown }).payment_methods
          : null;
        if (!response.ok || !Array.isArray(values)) {
          throw new Error('Unable to load payment methods enabled for this currency.');
        }
        const available = values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
        if (active) {
          setMethods(available);
          setMethod(available.includes('gcash') ? 'gcash' : available[0] || '');
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load payment methods enabled for this currency.');
      } finally {
        if (active) setMethodsLoading(false);
      }
    };
    void loadMethods();
    return () => { active = false; };
  }, [currency]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (!description.trim()) {
      setError('Enter an order description.');
      return;
    }
    if (methodsLoading || methods.length === 0 || !method) {
      setError('No payment methods are enabled for this currency.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await client.post(ORDER_ENDPOINTS[kind], {
        amount: numericAmount,
        currency: currency.toUpperCase(),
        description: description.trim(),
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        external_id: `SP-${crypto.randomUUID()}`,
        payment_methods: [method],
      });
      const body = response.data && typeof response.data === 'object'
        ? response.data as Record<string, unknown>
        : {};
      if (!response.ok || body.success === false) {
        throw new Error(String(body.detail || body.message || body.error || 'Unable to create the order.'));
      }

      onCreated();
      const url = getPaymentUrl(body);
      const nested = body.data && typeof body.data === 'object' ? body.data as Record<string, unknown> : {};
      const id = nested.payment_id || nested.transaction_id || body.payment_id || body.transaction_id;
      if (!url) {
        throw new Error('The provider did not return a checkout URL. Check the transaction list before retrying to avoid creating a duplicate order.');
      }
      setOrderId(id == null ? '' : String(id));
      setPaymentUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create the order.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(paymentUrl);
      toast.success('Checkout link copied.');
    } catch {
      toast.error('Unable to copy the checkout link.');
    }
  };

  const fieldClass = 'mt-1 w-full rounded-lg border border-white/10 bg-[#08120e] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-300/50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="create-order-title" className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1712] p-5 text-slate-100 shadow-2xl sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Payments</p>
            <h2 id="create-order-title" className="mt-1 text-xl font-semibold text-white">{paymentUrl ? 'Order created' : 'Create order'}</h2>
            <p className="mt-1 text-sm text-slate-400">{paymentUrl ? 'The payment request was submitted to your configured provider.' : 'Create a payment request using a channel enabled for this currency.'}</p>
          </div>
          {!submitting && <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white"><X size={16} /></button>}
        </header>

        {paymentUrl ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-3 text-sm text-emerald-200">
              <CheckCircle2 size={17} /> Payment request created
            </div>
            {orderId && <p className="text-xs text-slate-400">Provider reference: <span className="font-mono text-slate-200">{orderId}</span></p>}
            <div className="break-all rounded-lg border border-white/10 bg-[#08120e] p-3 text-xs text-slate-300">{paymentUrl}</div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void copyUrl()} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"><Copy size={14} /> Copy link</button>
              <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-[#06140e] hover:bg-emerald-300"><ExternalLink size={14} /> Open checkout</a>
              <button type="button" onClick={onClose} className="ml-auto rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5">Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-400">Order type
                <select value={kind} onChange={(event) => setKind(event.target.value as OrderKind)} className={fieldClass}>
                  <option value="invoice">Invoice</option>
                  <option value="payment_link">Payment link</option>
                  <option value="qr_code">QR payment</option>
                </select>
              </label>
              <label className="text-xs font-medium text-slate-400">Amount ({currency.toUpperCase()})
                <input type="number" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} className={fieldClass} />
              </label>
            </div>
            <label className="block text-xs font-medium text-slate-400">Enabled payment method
              <select value={method} onChange={(event) => setMethod(event.target.value)} disabled={methodsLoading || methods.length === 0} className={fieldClass}>
                {methodsLoading && <option value="">Loading methods…</option>}
                {!methodsLoading && methods.length === 0 && <option value="">No methods available</option>}
                {methods.map((value) => <option key={value} value={value}>{value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium text-slate-400">Description
              <input required maxLength={255} value={description} onChange={(event) => setDescription(event.target.value)} className={fieldClass} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-400">Customer name
                <input maxLength={200} value={customerName} onChange={(event) => setCustomerName(event.target.value)} className={fieldClass} />
              </label>
              <label className="text-xs font-medium text-slate-400">Customer email
                <input type="email" maxLength={254} value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} className={fieldClass} />
              </label>
            </div>
            {error && <p role="alert" className="rounded-lg border border-rose-300/20 bg-rose-300/5 p-3 text-sm text-rose-200">{error}</p>}
            <footer className="flex justify-end gap-2 border-t border-white/[0.06] pt-4">
              <button type="button" disabled={submitting} onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5">Cancel</button>
              <button type="submit" disabled={submitting || methodsLoading} className="rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#06140e] hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50">
                {submitting ? <span className="flex items-center gap-2"><LoaderCircle size={15} className="animate-spin" /> Creating…</span> : 'Create payment request'}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}
