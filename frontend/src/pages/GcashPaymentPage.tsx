import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowRight, CheckCircle2, Loader2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { client } from '@/lib/api';
import { fmtCurrency } from '@/lib/format';
import { sanitizeGcashAppDeepLink } from '@/lib/checkoutQr';

interface Transaction {
  amount: number;
  currency: string;
  status: string;
  merchant_name?: string;
  description?: string;
}

export default function GcashPaymentPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const isAlipay = pathname.endsWith('/alipay');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appLaunchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const deepLink = useMemo(
    () => sanitizeGcashAppDeepLink(searchParams.get('deep_link') || searchParams.get('gcash_deep_link')),
    [searchParams],
  );
  const qrValue = searchParams.get('qr');

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
      if (appLaunchTimeoutRef.current) clearTimeout(appLaunchTimeoutRef.current);
    };
  }, [identifier]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f4f8ff]"><Loader2 className="h-8 w-8 animate-spin text-[#1677ff]" /></div>;
  }

  if (error || !transaction) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f8ff] px-4 text-center">
        <div className="max-w-md rounded-3xl bg-white p-8 shadow-xl">
            <h1 className="text-xl font-semibold text-slate-900">{isAlipay ? 'Alipay payment unavailable' : 'GCash payment unavailable'}</h1>
          <p className="mt-3 text-sm text-slate-500">{error || 'The payment details could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  const status = transaction.status.toLowerCase();
  const isPaid = ['paid', 'completed', 'executed'].includes(status);
  const isClosed = isPaid || ['expired', 'cancelled', 'failed'].includes(status);
  const qrAppLink = qrValue && !/^https?:\/\//i.test(qrValue)
    ? buildGcashDeepLink(qrValue, transaction)
    : null;
  const appPaymentLink = deepLink || qrAppLink;

  const openGcashApp = () => {
    if (!appPaymentLink) return;
    window.location.assign(appPaymentLink);
    if (appLaunchTimeoutRef.current) clearTimeout(appLaunchTimeoutRef.current);
    appLaunchTimeoutRef.current = setTimeout(() => {
      toast.info('GCash app did not open. Scan the QR code below to continue.');
    }, 1800);
  };

  return (
    <main className="min-h-screen bg-[#f5f8fc] px-4 py-6 text-slate-900 sm:py-10">
      <div className="mx-auto max-w-[430px]">
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(30,64,120,0.12)]">
          <div className={`flex flex-col items-center px-6 py-7 text-center text-white sm:px-8 ${isAlipay ? 'bg-[#0B57D0]' : 'bg-[#007dff]'}`}>
            <img src={isAlipay ? '/logos/alipay.png' : '/logos/gcash.png'} alt={isAlipay ? 'Alipay' : 'GCash'} className="h-10 w-auto object-contain brightness-0 invert" />
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100">{isAlipay ? 'Pay with Alipay' : 'Pay with GCash'}</p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">{transaction.merchant_name || 'Payment'}</h1>
            {transaction.description && <p className="mt-2 text-sm text-blue-100">{transaction.description}</p>}
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Amount to pay</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{fmtCurrency(transaction.amount, transaction.currency)}</p>
            </div>

            {isPaid ? (
              <div className="rounded-2xl bg-emerald-50 p-5 text-center text-emerald-700">
                <CheckCircle2 className="mx-auto h-10 w-10" />
                <p className="mt-2 font-semibold">Payment confirmed</p>
              </div>
            ) : (
              <>
                {appPaymentLink && !isClosed && (
                  <button
                    type="button"
                    onClick={openGcashApp}
                    aria-label={isAlipay ? 'Open Alipay' : 'Open GCash App'}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-base font-bold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isAlipay ? 'bg-[#0B57D0] shadow-[0_8px_20px_rgba(11,87,208,0.25)] hover:bg-[#0849b5] focus-visible:ring-[#0B57D0]' : 'bg-[#007dff] shadow-[0_8px_20px_rgba(0,125,255,0.25)] hover:bg-[#006fe6] focus-visible:ring-[#007dff]'}`}
                  >
                    <Smartphone className="h-5 w-5" />
                    {isAlipay ? 'Open Alipay' : 'Open GCash App'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  Or scan to pay
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                {qrValue ? (
                  <div className="flex justify-center rounded-2xl border border-slate-200 bg-white p-5">
                    {/^(https?:\/\/)/i.test(qrValue) && !/^https:\/\/gcash/i.test(qrValue) ? (
                      <img src={qrValue} alt="GCash payment QR code" className="h-64 w-64 object-contain" />
                    ) : (
                      <QRCodeSVG value={qrValue} size={256} level="M" includeMargin className="h-auto max-w-full" />
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-amber-50 p-4 text-center text-sm text-amber-800">
                    QR code is unavailable. Use the GCash button above to continue.
                  </div>
                )}
                <p className="text-center text-xs leading-5 text-slate-500">
                  {isAlipay ? 'Scan the QR code using Alipay to approve this payment.' : 'Open the GCash app to approve this payment, or scan the QR code using GCash.'}
                </p>
              </>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}

function buildGcashDeepLink(qrCode: string, transaction: Transaction): string {
  const params = new URLSearchParams({
    qrCode,
    orderAmount: Number(transaction.amount).toFixed(2),
    merchantName: transaction.merchant_name || 'Payment',
    qrCodeFormat: 'EMVCO',
    sub: 'p2mpay',
  });
  return `gcash://com.mynt.gcash/app/006300000800?${params.toString()}`;
}
