import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { copyTextToClipboard } from '@/lib/clipboard';
import { getPaymentLink, togglePaymentLinkStatus, PaymentLink } from '@/lib/paymentLinks';
import { fmtCurrency } from '@/lib/format';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PaymentLinkDetails() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isKorean = language === 'ko';
  const [link, setLink] = useState<PaymentLink | null>(null);

  useEffect(() => {
    if (!code) {
      setLink(null);
      return;
    }

    setLink(getPaymentLink(code) ?? null);
  }, [code]);

  if (!link) {
    return (
      <Layout>
        <div className="page-enter">
          <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-6">
            <span className="cursor-pointer hover:text-slate-600" onClick={() => navigate('/pay-by-link')}>Payment links</span>
            <span className="text-slate-300">&gt;</span>
            <span className="text-slate-600 font-medium">Link details</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm max-w-[640px]">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-4">{isKorean ? '결제 링크를 찾을 수 없습니다' : 'Payment link not found'}</h1>
            <p className="text-[14px] text-slate-500">
              {isKorean ? '요청한 결제 링크가 없거나 삭제되었습니다.' : 'The payment link you are looking for does not exist or has been removed.'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const linkUrl = link?.paymentUrl || '';
  const currencyCode = String(link?.currency || 'PHP').toUpperCase();

  return (
    <Layout>
      <div className="page-enter">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-6">
          <span className="cursor-pointer hover:text-slate-600" onClick={() => navigate('/pay-by-link')}>Payment links</span>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-600 font-semibold">Link details</span>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/pay-by-link')}
            className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">{isKorean ? '결제 링크' : 'Payment link'}</h1>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 shadow-lg shadow-slate-200/40 text-white">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-300 mb-3">{isKorean ? '안전한 송금' : 'Secure transfer'}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-4xl font-semibold tracking-tight">{fmtCurrency(link.amount, link.currency)}</span>
                <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-200">
                  {currencyCode}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-300">{link.title}</p>
            </div>

            <div className="flex items-center gap-2 self-start rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {link.status}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-12 mb-10">
            <DetailItem label="Amount currency" value={currencyCode} />
            <DetailItem label="Code" value={link.code} />
            <DetailItem label="Created on" value={link.created} />
            <DetailItem label="Valid until" value={link.validUntil} />
            <DetailItem label="Description" value={link.description} />
            <DetailItem label="Order number" value={link.orderNo} />
            <DetailItem label="Payor" value={link.payor} />
          </div>

          {link.currency === 'KRW' && (link.qrCodeUrl || link.bankAccountDetails) && (
            <div className="mb-10 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="text-[15px] font-semibold text-amber-900">{link.bankAccountDetails ? 'Bank transfer instructions' : 'SwiftPay QR payment'}</h3>
                <span className="uppercase tracking-wide text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-1">KRW transfer</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
                {link.qrCodeUrl ? (
                  <div className="rounded-2xl border border-amber-200 bg-white p-3 flex items-center justify-center shadow-sm">
                    <img src={link.qrCodeUrl} alt="KRW transfer QR" className="w-[180px] h-[180px] object-contain" />
                  </div>
                ) : null}

                {link.bankAccountDetails ? <div className="space-y-3 text-sm text-amber-900">
                  <div className="rounded-xl bg-white/80 border border-amber-200 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1">Bank</p>
                    <p className="font-semibold">{link.bankAccountDetails?.bank_name || 'Korean Bank'}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 border border-amber-200 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1">Account holder</p>
                    <p className="font-semibold">{link.bankAccountDetails?.account_name || 'SwiftPay Ventures Inc.'}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 border border-amber-200 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1">Account number</p>
                    <p className="font-mono font-semibold">{link.bankAccountDetails?.number || '100220651025'}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 border border-amber-200 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1">Reference</p>
                    <p className="font-mono font-semibold">{link.code}</p>
                  </div>
                </div> : <div className="text-sm text-amber-900"><p className="font-semibold">Scan this SwiftPay QR with a supported Korean banking app.</p><p className="mt-2">The payment amount and reference are already attached to the QR.</p></div>}
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
            <div className="flex-1 w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] text-slate-500 flex items-center justify-between">
              <span className="truncate">{linkUrl || 'No payment URL available'}</span>
              <button
                type="button"
                onClick={async () => {
                  if (!linkUrl) {
                    toast.error('No payment URL available for this link');
                    return;
                  }

                  const success = await copyTextToClipboard(linkUrl);
                  if (success) {
                    toast.success('Copied payment link');
                  } else {
                    toast.error('Unable to copy payment link');
                  }
                }}
                className="flex items-center gap-2 text-[12px] font-semibold text-slate-900 hover:text-[#FF6B00] transition-colors whitespace-nowrap ml-4"
              >
                <Copy size={14} />
                Copy link
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={async () => {
                const success = await copyTextToClipboard(linkUrl);
                if (success) {
                  toast.success('Copied payment link');
                } else {
                  toast.error('Unable to copy payment link');
                }
              }}
              className="h-9 px-6 bg-white border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-900 hover:bg-slate-50 flex items-center gap-2"
            >
              <Copy size={14} /> Copy link
            </button>
            <button
              type="button"
              onClick={() => {
                if (!link) return;
                const updated = togglePaymentLinkStatus(link.code);
                if (updated) {
                  setLink(updated);
                  toast.success(`Link ${updated.status === 'Active' ? 'reactivated' : 'deactivated'}`);
                }
              }}
              className="h-9 px-6 bg-white border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-900 hover:bg-slate-50 flex items-center gap-2"
            >
              <X size={16} className="text-slate-400" />
              {link?.status === 'Active' ? 'Deactivate link' : 'Activate link'}
            </button>
          </div>
        </div>

        <h2 className="text-[16px] font-semibold text-slate-900 mb-4">Payment history</h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">PAYMENT</th>
                <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">REFERENCE NO</th>
                <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">DATE</th>
                <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">PAYMENT STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-slate-50/30 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                      <RefreshCw size={16} />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-slate-900">{fmtCurrency(link.amount, link.currency)}</p>
                      <p className="text-[11px] text-slate-400">-</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-slate-600 font-medium">{link.code}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        const success = await copyTextToClipboard(link.code);
                        if (success) {
                          toast.success('Reference copied to clipboard');
                        } else {
                          toast.error('Unable to copy reference');
                        }
                      }}
                      className="text-slate-300 hover:text-slate-500 transition-colors"
                      aria-label="Copy reference"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <p className="text-[11px] text-slate-500">Created on: {link.created}</p>
                  <p className="text-[11px] text-slate-400">Executed on: -</p>
                </td>
                <td className="px-8 py-5">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-400 border border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    Expired
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-[14px] font-semibold text-slate-800">{value}</p>
    </div>
  );
}
