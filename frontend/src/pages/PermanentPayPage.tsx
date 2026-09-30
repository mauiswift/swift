import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { client } from '@/lib/api';
import { Loader2, ShieldCheck, ChevronRight, Store } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSkeleton from '@/design-system/components/LoadingSkeleton';
import { getCurrencySymbol } from '@/lib/format';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';

const LINK_CURRENCIES = ['PHP', 'KRW', 'CNY', 'USDT'] as const;

function parsePermanentLink(value: string | undefined) {
  const normalized = (value || '').toLowerCase();
  const currency = LINK_CURRENCIES.find(code => normalized.endsWith(`-${code.toLowerCase()}`));
  return currency
    ? { slug: normalized.slice(0, -(currency.length + 1)), currency }
    : { slug: value || '', currency: null };
}

interface MerchantInfo {
  store_name: string;
  store_logo_url?: string;
  organization_id: string;
  collection_currency?: string;
  store_slug?: string;
}

export default function PermanentPayPage() {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const link = parsePermanentLink(routeSlug);
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [creating, setCreating] = useState(false);
  const { collectionCurrency } = useCollectionCurrency();

  const fetchMerchant = useCallback(async () => {
    try {
      const currency = link.currency || searchParams.get('currency')?.toUpperCase();
      const query = currency ? `?currency=${encodeURIComponent(currency)}` : '';
      const res = await client.get(`/api/v1/public/merchant/${encodeURIComponent(link.slug)}${query}`);
      if (res.data) setMerchant(res.data);
    } catch (err) {
      toast.error('Merchant not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [link.slug, link.currency, navigate, searchParams]);

  useEffect(() => {
    fetchMerchant();
  }, [fetchMerchant]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return toast.error('Please enter a valid amount');
    }
    if (!acknowledged) {
      return toast.error('Please acknowledge the payment compliance notice to continue');
    }

    setCreating(true);
    try {
      const currency = merchant?.collection_currency || 'PHP';
      const linkCurrency = link.currency || searchParams.get('currency');
      const query = linkCurrency ? `?currency=${encodeURIComponent(linkCurrency)}` : '';
      const res = await client.post(`/api/v1/public/merchant/${encodeURIComponent(link.slug)}/payment${query}`, {
        amount: numericAmount,
        currency,
        description: description || `Payment to ${merchant?.store_name}`,
      });

      if (res.ok && res.data?.external_id) {
        navigate(`/checkout/${encodeURIComponent(res.data.external_id)}`);
      } else {
        toast.error(res.data?.detail || 'Failed to initialize payment');
      }
    } catch (err) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton variant="page" />;
  }

  const displayCurrency = merchant?.collection_currency || collectionCurrency || 'PHP';
  const merchantName = merchant?.store_name?.trim() || 'Merchant';

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-slate-900">
      <header className="border-b border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            {merchant?.store_logo_url ? (
              <img src={merchant.store_logo_url} alt={merchantName} className="h-full w-full object-contain p-2" />
            ) : (
              <Store size={24} className="text-slate-200" />
            )}
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">{merchantName}</h1>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            <ShieldCheck size={14} className="text-emerald-500" />
            Secure payment
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl justify-center px-4 py-8 sm:py-10">
        <section className="w-full overflow-hidden rounded-[28px] border border-[#d8e4f5] bg-white shadow-[0_18px_55px_rgba(15,63,120,0.10)]">
          <div className="grid lg:grid-cols-2">
            <div className="bg-[linear-gradient(120deg,#071b3a_0%,#0b4b9a_58%,#1475d1_100%)] px-6 py-7 text-white sm:px-8 sm:py-9">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-4 flex items-center gap-2 text-[10px] font-bold tracking-[0.24em] text-blue-100">
                    <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_0_4px_rgba(103,232,249,0.15)]" />
                    OPEN AMOUNT PAYMENT
                  </div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-sm">
                      <ShieldCheck size={12} />
                      Secure Platform
                    </span>
                    <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-50">
                      {displayCurrency}
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">Enter amount</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">
                    Choose how much you want to pay, then continue to the secure payment selection page.
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-[13px] text-blue-50/90 backdrop-blur-sm">
                <p className="font-semibold text-white">Payment summary</p>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-blue-50/80">Merchant</span>
                  <span className="text-right font-semibold text-white">{merchantName}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-blue-50/80">Currency</span>
                  <span className="font-semibold text-white">{displayCurrency}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handlePay} className="space-y-6 p-6 sm:p-8 lg:p-10">
            <div>
              <label htmlFor="permanent-payment-amount" className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Enter payment amount
              </label>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-slate-200 focus-within:bg-white">
                <span className="text-2xl font-semibold text-slate-400">{getCurrencySymbol(displayCurrency)}</span>
                <input
                  id="permanent-payment-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  autoFocus
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="min-w-0 flex-1 bg-transparent text-2xl font-semibold text-slate-900 outline-none placeholder:text-slate-300"
                />
                <span className="text-sm font-bold text-slate-500">{displayCurrency}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">Customer can enter any amount for this payment.</p>
            </div>
            <div>
              <label htmlFor="permanent-payment-note" className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Note / Description
              </label>
              <input
                id="permanent-payment-note"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this for?"
                className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-[#1475d1] focus:bg-white"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-5 text-slate-600 transition-colors hover:border-slate-300 hover:bg-white">
              <input
                type="checkbox"
                required
                checked={acknowledged}
                onChange={event => setAcknowledged(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#071b3a]"
              />
              <span>
                I confirm that I have already received the goods or services purchased from <span className="font-semibold text-slate-900">{merchantName}</span>, and that I am voluntarily making this payment. I acknowledge that the payment details I provide are accurate and agree to the applicable payment compliance requirements.
              </span>
            </label>

            <button
              type="submit"
              disabled={creating || !amount || !acknowledged}
              className="w-full rounded-xl bg-[#071b3a] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0b4b9a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1475d1] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : (
                <span className="inline-flex items-center justify-center gap-1">
                  Pay Now
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
