import { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Camera, CheckCircle2, ExternalLink, QrCode } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DEFAULT_QRPH_SAMPLE = '00020101...';

export default function TossPayQrInstructions() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const initialQr = params.get('qr') || DEFAULT_QRPH_SAMPLE;
  const [qrContent, setQrContent] = useState(initialQr);
  const [amount, setAmount] = useState(params.get('amount') || '');

  const normalizedQr = useMemo(() => qrContent.trim(), [qrContent]);
  const normalizedAmount = useMemo(() => amount.trim(), [amount]);

  return (
    <Layout>
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900">TOSS Pay — QR Scan Instructions</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Note: I can’t capture real screenshots from the TOSS app in this environment. This page is an in-dashboard guide
              with a live QR preview. If you send real TOSS screenshots, I’ll replace the placeholders and make it look 1:1.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => navigate('/settings/shop/settlement')} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Banking settings
          </Button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-slate-700" />
              <h2 className="text-sm font-semibold text-slate-900">SwiftPay QRPH (Paste your QR content)</h2>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Paste the QRPH/EMV payload string from your SwiftPay checkout (usually starts with <span className="font-mono">000201</span>).
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <Label className="text-xs font-semibold text-slate-700">QR content</Label>
                <Input
                  value={qrContent}
                  onChange={(event) => setQrContent(event.target.value)}
                  placeholder="Paste QRPH payload here"
                  className="mt-2 font-mono text-xs"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Tip: You can open this page with query params: <span className="font-mono">/help/toss-pay-qr?qr=...</span>
                </p>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Amount (optional)</Label>
                <Input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="decimal"
                  placeholder="e.g. 1000"
                  className="mt-2"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Multi-currency note: QRPH is PHP-oriented. If you need KRW/USDT collection, use the KRW channels / USDT top-up flow.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-slate-700" />
              <h2 className="text-sm font-semibold text-slate-900">What the payer scans</h2>
            </div>

            <div className="mt-4 flex flex-col items-center gap-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
              {normalizedQr ? (
                <QRCodeSVG value={normalizedQr} size={220} bgColor="#ffffff" fgColor="#0f172a" includeMargin />
              ) : (
                <div className="h-[220px] w-[220px] animate-pulse rounded bg-white" />
              )}
              <div className="w-full space-y-2 text-center">
                <p className="text-xs font-semibold text-blue-900">SwiftPay QR (QRPH)</p>
                {normalizedAmount ? (
                  <p className="text-xs text-blue-900">
                    Amount: <span className="font-semibold">{normalizedAmount}</span>
                  </p>
                ) : null}
                <p className="break-all rounded bg-white px-3 py-2 font-mono text-[11px] text-slate-700">
                  {normalizedQr || 'Paste your QRPH payload to preview the QR.'}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Screenshots</p>
              <p className="mt-1 text-xs leading-5 text-amber-900/80">
                Upload real TOSS app screenshots for: (1) Home → Pay, (2) Scan QR screen, (3) Confirm payment screen, (4) Success/receipt.
                I’ll wire them here and also link from Banking → Toss Pay.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Step-by-step</h2>
          <ol className="mt-4 grid gap-3 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">1</span>
              <div>
                <p className="font-semibold">Open TOSS</p>
                <p className="text-xs text-slate-500">On the home screen, go to Pay (or Payments).</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">2</span>
              <div>
                <p className="font-semibold">Tap Scan QR</p>
                <p className="text-xs text-slate-500">Allow camera permission if prompted.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">3</span>
              <div>
                <p className="font-semibold">Scan the SwiftPay QRPH</p>
                <p className="text-xs text-slate-500">Point the camera at the QR code shown above or on your SwiftPay checkout.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">4</span>
              <div>
                <p className="font-semibold">Confirm merchant + amount</p>
                <p className="text-xs text-slate-500">Double-check the merchant name and amount before paying.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">5</span>
              <div>
                <p className="font-semibold">Complete payment</p>
                <p className="text-xs text-slate-500">Save the receipt or screenshot the success page if your support team needs it.</p>
              </div>
            </li>
          </ol>

          <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            This guide is ready. Send your real TOSS screenshots + your real SwiftPay QRPH payload, and I’ll finalize it as “real screenshot” instructions.
          </div>
        </div>
      </div>
    </Layout>
  );
}

