import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Link2, Search, Plus, X, CircleDollarSign } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { copyTextToClipboard } from '@/lib/clipboard';
import { getAllPaymentLinks, PaymentLink, togglePaymentLinkStatus } from '@/lib/paymentLinks';
import { fmtCurrency } from '@/lib/format';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import { client } from '@/lib/api';

export default function PaymentLinksList() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { collectionCurrency } = useCollectionCurrency();
  const isKorean = language === 'ko';
  const [searchTerm, setSearchTerm] = useState('');
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const getPermanentLinkUrl = (link: PaymentLink) => (
    link.paymentUrl || (link.externalId ? `${window.location.origin}/checkout/${encodeURIComponent(link.externalId)}` : '')
  );

  useEffect(() => {
    setLinks(getAllPaymentLinks());
  }, []);

  const filteredLinks = useMemo(() => {
    const currencyLinks = links.filter(
      (link) => link.currency.toUpperCase() === collectionCurrency.toUpperCase(),
    );
    if (!searchTerm.trim()) {
      return currencyLinks;
    }

    const lowerTerm = searchTerm.toLowerCase();
    return currencyLinks.filter((link) =>
      [link.code, link.title, link.status, link.payor, link.orderNo]
        .join(' ')
        .toLowerCase()
        .includes(lowerTerm)
    );
  }, [links, searchTerm, collectionCurrency]);

  return (
    <Layout>
      <div className="page-enter w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">{isKorean ? '결제 링크' : 'Payment links'}</h1>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                const response = await client.get('/api/v1/payments/open-amount-link');
                const url = response.ok && response.data?.url
                  ? new URL(response.data.url, window.location.origin).toString()
                  : '';
                if (!url) {
                  toast.error('Unable to create your default payment link');
                  return;
                }
                const success = await copyTextToClipboard(url);
                if (success) {
                  toast.success('Default open-amount link copied');
                } else {
                  toast.error('Unable to copy default payment link');
                }
              }}
              className="h-9 inline-flex items-center gap-2 border border-[#FF6B00] bg-orange-50 text-[#C2410C] rounded-lg px-4 text-[12px] font-semibold shadow-sm hover:bg-orange-100"
            >
              <CircleDollarSign size={15} /> {isKorean ? '영구 링크' : 'Permanent Link'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/pay-by-link/new')}
              className="h-9 inline-flex items-center gap-2 bg-[#111111] text-white rounded-lg px-4 text-[12px] font-semibold shadow-sm"
            >
              <Plus size={16} /> {isKorean ? '새로 만들기' : 'New'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/pay-by-link/invoice')}
              className="h-9 inline-flex items-center gap-2 bg-[#FF6B00] text-white rounded-lg px-4 text-[12px] font-semibold shadow-sm"
            >
              <Plus size={16} /> {isKorean ? '청구서' : 'Invoice'}
            </button>
          </div>
        </div>

          <div className="mb-6 flex justify-end">
           <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isKorean ? '검색...' : 'Search...'}
              className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
            />
          </div>
        </div>

        {/* Mobile View: Separated Stacked Cards */}
        <div className="space-y-3 md:hidden">
          {filteredLinks.length > 0 ? (
            filteredLinks.map((l) => (
              <div
                key={l.code}
                onClick={() => navigate(`/pay-by-link/details/${l.code}`)}
                className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400">
                      <Link2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-slate-900 truncate">{fmtCurrency(l.amount, l.currency)}</p>
                      <p className="text-[12px] font-medium text-slate-500 truncate">{l.title}</p>
                      <p className="text-[11px] font-mono text-slate-400">{l.code}</p>
                    </div>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                    l.status === 'Active'
                      ? 'border-blue-100 bg-blue-50 text-blue-600'
                      : 'border-slate-100 bg-slate-50 text-slate-400'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${l.status === 'Active' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                    {l.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[12px] text-slate-500">
                  <span>{l.created}</span>
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={async () => {
                        const linkUrl = getPermanentLinkUrl(l);
                        if (!linkUrl) {
                          toast.error('No permanent payment URL available for this link');
                          return;
                        }
                        const success = await copyTextToClipboard(linkUrl);
                        if (success) {
                          toast.success('Payment link copied to clipboard');
                        } else {
                          toast.error('Unable to copy payment link');
                        }
                      }}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 hover:text-[#FF6B00]"
                    >
                      <Copy size={14} /> Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = togglePaymentLinkStatus(l.code);
                        if (updated) {
                          setLinks((current) =>
                            current.map((item) => (item.code === updated.code ? updated : item))
                          );
                          toast.success(`Link ${updated.status === 'Active' ? 'reactivated' : 'deactivated'}`);
                        }
                      }}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 hover:text-rose-500"
                    >
                      <X size={14} /> {l.status === 'Active' ? (isKorean ? '비활성화' : 'Deactivate') : (isKorean ? '활성화' : 'Activate')}
                    </button>
                  </div>
                </div>

                {l.currency === 'KRW' && (l.qrCodeUrl || l.bankAccountDetails) && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                    {l.qrCodeUrl && (
                      <div className="mb-2 flex justify-center">
                        <img src={l.qrCodeUrl} alt="KRW QR code" className="h-28 w-28 object-contain" />
                      </div>
                    )}
                    {l.bankAccountDetails && (
                      <div className="space-y-1 text-xs text-amber-900">
                        <p><span className="font-semibold text-amber-700">Bank:</span> {l.bankAccountDetails?.bank_name || 'Korean Bank'}</p>
                        <p><span className="font-semibold text-amber-700">Account:</span> {l.bankAccountDetails?.number || '100220651025'}</p>
                        <p><span className="font-semibold text-amber-700">Holder:</span> {l.bankAccountDetails?.account_name || 'SwiftPay Ventures Inc.'}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-[13px] text-slate-400">
              {isKorean ? '결제 링크가 없습니다' : 'No payment links found.'}
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">LINK</th>
                <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">CREATED ON</th>
                <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">STATUS</th>
                <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLinks.length > 0 ? (
                filteredLinks.map((l) => (
                  <Fragment key={l.code}>
                    <tr
                      onClick={() => navigate(`/pay-by-link/details/${l.code}`)}
                      className="cursor-pointer hover:bg-slate-50/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                            <Link2 size={18} />
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-slate-900">{fmtCurrency(l.amount, l.currency)}</p>
                            <p className="text-[11px] text-slate-500">{l.title} • {l.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center text-[12px] text-slate-600 font-medium">
                        {l.created}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                          l.status === 'Active'
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${l.status === 'Active' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                          {l.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={async () => {
                              const linkUrl = getPermanentLinkUrl(l);
                              if (!linkUrl) {
                                toast.error('No permanent payment URL available for this link');
                                return;
                              }
                              const success = await copyTextToClipboard(linkUrl);
                              if (success) {
                                toast.success('Payment link copied to clipboard');
                              } else {
                                toast.error('Unable to copy payment link');
                              }
                            }}
                            className="flex items-center gap-2 text-[12px] font-semibold text-slate-600 hover:text-[#FF6B00] transition-colors"
                          >
                            <Copy size={14} /> Copy
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = togglePaymentLinkStatus(l.code);
                              if (updated) {
                                setLinks((current) =>
                                  current.map((item) => (item.code === updated.code ? updated : item))
                                );
                                toast.success(`Link ${updated.status === 'Active' ? 'reactivated' : 'deactivated'}`);
                              }
                            }}
                            className="flex items-center gap-2 text-[12px] font-semibold text-slate-600 hover:text-rose-500 transition-colors"
                          >
                            <X size={14} /> {l.status === 'Active' ? (isKorean ? '비활성화' : 'Deactivate') : (isKorean ? '활성화' : 'Activate')}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {l.currency === 'KRW' && (l.qrCodeUrl || l.bankAccountDetails) && (
                      <tr className="bg-amber-50/40">
                        <td colSpan={4} className="px-8 py-4">
                          <div className="rounded-xl border border-amber-200 bg-white p-4">
                            <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-4 items-center">
                              {l.qrCodeUrl ? (
                                <div className="flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 p-2">
                                  <img src={l.qrCodeUrl} alt="KRW QR code" className="w-[140px] h-[140px] object-contain" />
                                </div>
                              ) : null}

                              {l.bankAccountDetails ? <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-amber-900">
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1">Bank</p>
                                  <p className="font-semibold">{l.bankAccountDetails?.bank_name || 'Korean Bank'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1">Holder</p>
                                  <p className="font-semibold">{l.bankAccountDetails?.account_name || 'SwiftPay Ventures Inc.'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1">Account number</p>
                                  <p className="font-mono font-semibold">{l.bankAccountDetails?.number || '100220651025'}</p>
                                </div>
                              </div> : <div className="text-sm text-amber-900"><p className="font-semibold">SwiftPay QR payment</p><p className="mt-1">Scan with a supported Korean banking app.</p></div>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              ) : (
                <tr>
                <td colSpan={4} className="px-8 py-10 text-center text-slate-500">
                  {isKorean ? '결제 링크가 없습니다. 새 링크를 만들어 보세요.' : 'No payment links found. Create one to get started.'}
                </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
