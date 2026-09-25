import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { copyTextToClipboard } from '@/lib/clipboard';
import {
  getIdentifiedPaymentLinkUrl,
  getPaymentLink,
  getPaymentStatusLabel,
  normalizePaymentStatus,
  togglePaymentLinkStatus,
  PaymentLink,
} from '@/lib/paymentLinks';
import { updatePaymentLink } from '@/lib/paymentLinks';
import { client } from '@/lib/api';
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

    const storedLink = getPaymentLink(code) ?? null;
    setLink(storedLink);
    if (!storedLink?.externalId) return;

    let active = true;
    const refreshStatus = async () => {
      try {
        const response = await client.get(`/api/v1/payments/checkout/${encodeURIComponent(storedLink.externalId!)}/status`);
        const status = String(response.data?.status || '').toLowerCase();
        if (!active || !status) return;
        const updated = updatePaymentLink(code, {
          paymentStatus: status,
          paymentUpdatedAt: response.data?.updated_at || undefined,
        });
        if (updated) setLink(updated);
      } catch {
        // The payment link remains usable when status polling is unavailable.
      }
    };

    refreshStatus();
    const interval = window.setInterval(refreshStatus, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [code]);

  if (!link) {
    return (
      <Layout>
        <div className="page-enter w-full">
          <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-6">
            <span className="cursor-pointer hover:text-slate-600" onClick={() => navigate('/pay-by-link')}>{isKorean ? '결제 링크' : 'Payment links'}</span>
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

  const permanentLinkUrl = getIdentifiedPaymentLinkUrl(link, window.location.origin);
  const currencyCode = String(link?.currency || 'PHP').toUpperCase();
  const krwBankAccount = link.bankAccountDetails;
  const paymentStatus = normalizePaymentStatus(link.paymentStatus);
  const isPaid = paymentStatus === 'paid';
  const isPaymentPending = paymentStatus === 'pending';

  return (
    <Layout>
      <div className="page-enter">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-6">
          <span className="cursor-pointer hover:text-slate-600" onClick={() => navigate('/pay-by-link')}>{isKorean ? '결제 링크' : 'Payment links'}</span>
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
            <DetailItem label={isKorean ? '통화' : 'Amount currency'} value={currencyCode} />
            <DetailItem label={isKorean ? '코드' : 'Code'} value={link.code} />
            <DetailItem label={isKorean ? '생성일' : 'Created on'} value={link.created} />
            <DetailItem label={isKorean ? '유효 기간' : 'Valid until'} value={link.validUntil} />
            <DetailItem label={isKorean ? '설명' : 'Description'} value={link.description} />
            <DetailItem label={isKorean ? '주문번호' : 'Order number'} value={link.orderNo} />
            <DetailItem label={isKorean ? '결제자' : 'Payor'} value={link.payor} />
          </div>

          {currencyCode === 'KRW' && (link.qrCodeUrl || krwBankAccount) && (
            <div className="mb-10 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="text-[15px] font-semibold text-amber-900">{krwBankAccount ? '한국 KRW 해외송금 안내' : isKorean ? 'SwiftPay QR 결제' : 'SwiftPay QR payment'}</h3>
                <span className="uppercase tracking-wide text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-1">{isKorean ? 'KRW 송금' : 'KRW transfer'}</span>
              </div>

              {krwBankAccount && (
                <ol className="mb-5 list-decimal space-y-1 pl-5 text-xs text-amber-900">
                  <li>한국 은행 앱 또는 영업점에서 해외송금(International Transfer) 또는 SWIFT를 선택하세요.</li>
                  <li>아래 수취 은행, 계좌번호, SWIFT/BIC 정보를 정확히 입력하세요.</li>
                  <li>송금 완료 후 이 결제 링크의 참조번호를 메모하고 영수증을 제출하세요.</li>
                </ol>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
                {link.qrCodeUrl ? (
                  <div className="rounded-2xl border border-amber-200 bg-white p-3 flex items-center justify-center shadow-sm">
                    <img src={link.qrCodeUrl} alt="KRW transfer QR" className="w-[180px] h-[180px] object-contain" />
                  </div>
                ) : null}

                {krwBankAccount ? <div className="space-y-3 text-sm text-amber-900">
                  <div className="rounded-xl bg-white/80 border border-amber-200 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1">수취 은행</p>
                    <p className="font-semibold">{krwBankAccount.bank_name}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 border border-amber-200 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1">예금주</p>
                    <p className="font-semibold">{krwBankAccount.account_name}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 border border-amber-200 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1">계좌번호</p>
                    <p className="font-mono font-semibold">{krwBankAccount.number}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 border border-amber-200 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1">SWIFT / BIC</p>
                    <p className="font-mono font-semibold">{krwBankAccount.swift_code}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 border border-amber-200 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1">참조번호</p>
                    <p className="font-mono font-semibold">{link.code}</p>
                  </div>
                </div> : <div className="text-sm text-amber-900"><p className="font-semibold">{isKorean ? '지원되는 한국 은행 앱으로 이 SwiftPay QR을 스캔하세요.' : 'Scan this SwiftPay QR with a supported Korean banking app.'}</p><p className="mt-2">{isKorean ? '결제 금액과 참조번호가 QR에 이미 포함되어 있습니다.' : 'The payment amount and reference are already attached to the QR.'}</p></div>}
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
            <div className="flex-1 w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] text-slate-500 flex items-center justify-between">
              <span className="truncate">{permanentLinkUrl || (isKorean ? '결제 URL을 사용할 수 없습니다' : 'No payment URL available')}</span>
              <button
                type="button"
                onClick={async () => {
                  if (!permanentLinkUrl) {
                    toast.error(isKorean ? '이 링크에 결제 URL이 없습니다.' : 'No payment URL available for this link');
                    return;
                  }

                  const success = await copyTextToClipboard(permanentLinkUrl);
                  if (success) {
                    toast.success(isKorean ? '결제 링크가 복사되었습니다.' : 'Copied payment link');
                  } else {
                    toast.error(isKorean ? '결제 링크를 복사할 수 없습니다.' : 'Unable to copy payment link');
                  }
                }}
                className="flex items-center gap-2 text-[12px] font-semibold text-slate-900 hover:text-[#FF6B00] transition-colors whitespace-nowrap ml-4"
              >
                <Copy size={14} />
                {isKorean ? '링크 복사' : 'Copy link'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={async () => {
                const success = await copyTextToClipboard(permanentLinkUrl);
                if (success) {
                  toast.success(isKorean ? '결제 링크가 복사되었습니다.' : 'Copied payment link');
                } else {
                  toast.error(isKorean ? '결제 링크를 복사할 수 없습니다.' : 'Unable to copy payment link');
                }
              }}
              className="h-9 px-6 bg-white border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-900 hover:bg-slate-50 flex items-center gap-2"
            >
              <Copy size={14} /> {isKorean ? '링크 복사' : 'Copy link'}
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

        <h2 className="text-[16px] font-semibold text-slate-900 mb-4">{isKorean ? '결제 내역' : 'Payment history'}</h2>
        <div className="-mx-3 w-[calc(100%+1.5rem)] overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm sm:mx-0 sm:w-full">
          <table className="w-full min-w-[640px] text-left border-collapse sm:min-w-0">
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
                    <p className="text-[11px] text-slate-400">Executed on: {link.paymentUpdatedAt ? new Date(link.paymentUpdatedAt).toLocaleString() : '-'}</p>
                </td>
                <td className="px-8 py-5">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold border ${isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : isPaymentPending ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : isPaymentPending ? 'bg-amber-500' : 'bg-red-500'}`} />
                    {getPaymentStatusLabel(link.paymentStatus)}
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
