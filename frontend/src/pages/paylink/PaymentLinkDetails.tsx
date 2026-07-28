import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { copyTextToClipboard } from '@/lib/clipboard';
import { getPaymentLink, togglePaymentLinkStatus, PaymentLink } from '@/lib/paymentLinks';
import { fmtCurrencyPhp } from '@/lib/format';

export default function PaymentLinkDetails() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [link, setLink] = useState<PaymentLink | null>(null);

  useEffect(() => {
    if (!code) {
      setLink(null);
      return;
    }

    setLink(getPaymentLink(code));
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
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-4">Payment link not found</h1>
            <p className="text-[14px] text-slate-500">
              The payment link you are looking for does not exist or has been removed.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const linkUrl = link?.paymentUrl || '';

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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">Payment link</h1>
        </div>

        <div className="flex items-center gap-4 mb-2">
          <span className="text-4xl font-semibold tracking-tight text-slate-900">{fmtCurrencyPhp(link.amount)}</span>
          <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {link.status}
          </span>
        </div>
        <p className="text-[14px] text-slate-500 mb-10">{link.title}</p>

        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm mb-10">
          <h2 className="text-[16px] font-semibold text-slate-900 mb-8">Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-10 gap-x-12 mb-10">
            <DetailItem label="Code" value={link.code} />
            <DetailItem label="Created on" value={link.created} />
            <DetailItem label="Valid until" value={link.validUntil} />
            <DetailItem label="Description" value={link.description} />
            <DetailItem label="Order number" value={link.orderNo} />
            <DetailItem label="Payor" value={link.payor} />
          </div>

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
                      <p className="text-[14px] font-semibold text-slate-900">{fmtCurrencyPhp(100.00)}</p>
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
