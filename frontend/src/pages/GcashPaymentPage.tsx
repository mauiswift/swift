import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowRight, CheckCircle2, Loader2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { client } from '@/lib/api';
import { fmtCurrency } from '@/lib/format';
import { sanitizeCheckoutDeepLink } from '@/lib/checkoutQr';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';

interface Transaction {
  amount: number;
  currency: string;
  status: string;
  merchant_name?: string;
  description?: string;
}

export default function GcashPaymentPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const [searchParams] = useSearchParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const deepLink = useMemo(
    () => sanitizeCheckoutDeepLink(searchParams.get('deep_link')),
    [searchParams],
  );
  const qrValue = searchParams.get('qr') || deepLink;

  useEffect(() => {
    if (!identifier) {
      setError('Payment ID not found');
      setLoading(false);
      return;
    }

    let active = true;
    const fetchTransaction = async () => {
      try {
        const response = await client.get(`/api/v1/payments/checkout/${encodeURIComponent(identifier)}`);
        if (!response.ok || !response.data) throw new Error('Payment link not found or has expired');
        if (active) setTransaction(response.data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load payment details');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTransaction();
    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await client.get(`/api/v1/payments/checkout/${encodeURIComponent(identifier)}/status`);
        const status = String(response.data?.status || '').toLowerCase();
        if (!active || !status) return;
        setTransaction(previous => previous ? { ...previous, status } : previous);
        if (['paid', 'completed', 'executed'].includes(status)) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          toast.success('Payment confirmed!');
        } else if (['expired', 'cancelled', 'failed'].includes(status)) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
      } catch (err) {
        console.error('GCash payment status polling failed:', err);
      }
    }, 2000);

    return () => {
      active = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [identifier]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f4f8ff]"><Loader2 className="h-8 w-8 animate-spin text-[#1677ff]" /></div>;
  }

  if (error || !transaction) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f8ff] px-4 text-center">
        <div className="max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="text-xl font-semibold text-slate-900">GCash payment unavailable</h1>
          <p className="mt-3 text-sm text-slate-500">{error || 'The payment details could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  const status = transaction.status.toLowerCase();
  const isPaid = ['paid', 'completed', 'executed'].includes(status);
  const isClosed = isPaid || ['expired', 'cancelled', 'failed'].includes(status);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dceeff_0%,#f4f8ff_45%,#ffffff_100%)] px-4 py-8 text-slate-900 sm:py-14">
      <section className="mx-auto max-w-md overflow-hidden rounded-[28px] border border-[#d7e6f7] bg-white shadow-[0_24px_70px_rgba(30,89,150,0.16)]">
        <header className="bg-[#1677ff] px-6 py-7 text-center text-white">
          <PaymentBrandLogo brand="GCash" size="lg" className="mx-auto mb-4 border-0 bg-white p-2 shadow-none" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">Secure GCash payment</p>
          <h1 className="mt-2 text-2xl font-bold">{transaction.merchant_name || 'Payment'}</h1>
        </header>
        <div className="space-y-6 p-6 sm:p-8">
          <div className="text-center">
            <p className="text-sm text-slate-500">Amount to pay</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{fmtCurrency(transaction.amount, transaction.currency)}</p>
            {transaction.description && <p className="mt-2 text-sm text-slate-500">{transaction.description}</p>}
          </div>
          {isPaid ? (
            <div className="rounded-2xl bg-emerald-50 p-5 text-center text-emerald-700">
              <CheckCircle2 className="mx-auto h-10 w-10" />
              <p className="mt-2 font-semibold">Payment confirmed</p>
            </div>
          ) : (
            <>
              {qrValue ? (
                <div className="flex justify-center rounded-2xl border border-slate-200 bg-white p-5">
                  {/^https?:\/\//i.test(qrValue) && !qrValue.startsWith('https://gcash') ? (
                    <img src={qrValue} alt="GCash payment QR code" className="h-64 w-64 object-contain" />
                  ) : (
                    <QRCodeSVG value={qrValue} size={256} level="M" includeMargin />
                  )}
                </div>
              ) : (
                <div className="rounded-2xl bg-amber-50 p-4 text-center text-sm text-amber-800">
                  QR code is unavailable. Use the button below to continue in GCash.
                </div>
              )}
              <p className="text-center text-sm leading-6 text-slate-500">
                Scan the QR code with your GCash app, or tap the button to open GCash directly.
              </p>
              {deepLink && !isClosed && (
                <a
                  href={deepLink}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1677ff] px-5 py-3.5 font-semibold text-white transition hover:bg-[#0867e8]"
                >
                  <Smartphone className="h-5 w-5" />
                  Pay in GCash
                  <ArrowRight className="h-4 w-4" />
                </a>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
