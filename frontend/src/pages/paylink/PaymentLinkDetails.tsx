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
import { useTranslation } from '@/lib/i18n';

export default function PaymentLinkDetails() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useTranslation(language);
  const isKorean = language === 'ko';
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!code) {
      setLink(null);
      return;
    }

    const storedLink = getPaymentLink(code) ?? null;
    setLink(storedLink);
    if (storedLink?.provider === 'swiftpay') {
      let active = true;
      const refreshSwiftPayLink = async () => {
        try {
          const response = await client.get(`/api/v1/swiftpay/payment-links/${encodeURIComponent(storedLink.code)}`);
          if (!response.ok || !response.data?.success) {
            const message = response.data?.detail || response.data?.error || `Request failed (${response.status})`;
            toast.error(String(message));
            return;
          }
          if (!active) return;
          const remoteLink = response.data.data || {};
          const remoteStatus = String(remoteLink.linkStatus || '').toUpperCase();
          const updated = updatePaymentLink(storedLink.code, {
            status: remoteStatus === 'INACTIVE'
              ? 'Inactive'
              : remoteStatus === 'ACTIVE'
                ? 'Active'
                : storedLink.status,
            paymentUrl: remoteLink.paymentUrl || storedLink.paymentUrl,
            paymentStatus: remoteLink.paymentStatus || storedLink.paymentStatus,
          });
          if (updated) setLink(updated);
        } catch {
          if (active) toast.error(isKorean ? '결제 링크 정보를 불러올 수 없습니다.' : 'Unable to refresh payment link details');
        }
      };
      void refreshSwiftPayLink();
      return () => { active = false; };
    }
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
  }, [code, isKorean]);

  if (!link) {
    return (
      <Layout>
        <div className="page-enter w-full">
          <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-6">
            <span className="cursor-pointer hover:text-slate-600" onClick={() => navigate('/pay-by-link')}>{t('payment_links')}</span>
            <span className="text-slate-300">&gt;</span>
            <span className="text-slate-600 font-medium">{t('payment_link_details')}</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm max-w-[640px]">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-4">{t('payment_link_not_found')}</h1>
            <p className="text-[14px] text-slate-500">
              {t('payment_link_not_found_desc')}
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
          <span className="cursor-pointer hover:text-slate-600" onClick={() => navigate('/pay-by-link')}>{t('payment_links')}</span>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-600 font-semibold">{t('payment_link_details')}</span>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/pay-by-link')}
            className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">{t('payment_link')}</h1>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 shadow-lg shadow-slate-200/40 text-white">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-300 mb-3">{t('secure_transfer')}</p>
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
            <DetailItem label={t('payment_link_currency')} value={currencyCode} />
            <DetailItem label={t('payment_link_details_label')} value={link.code} />
            {link.provider === 'swiftpay' && <DetailItem label="SwiftPay" value="SwiftPay" />}
            <DetailItem label={t('created_on')} value={link.created} />
            <DetailItem label={t('payment_link_valid_until')} value={link.validUntil} />
            <DetailItem label={t('payment_link_description')} value={link.description} />
            <DetailItem label={t('payment_link_order_no')} value={link.orderNo} />
            <DetailItem label={t('payment_link_payor')} value={link.payor} />
          </div>

          {currencyCode === 'KRW' && (link.qrCodeUrl || krwBankAccount) && (
            <div className="mb-10 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="text-[15px] font-semibold text-amber-900">{krwBankAccount ? '한국 KRW 해외송금 안내' : t('payment_link_qr')}</h3>
                <span className="uppercase tracking-wide text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-1">{isKorean ? 'KRW 송금' : 'KRW transfer'}</span>
              </div>

              {krwBankAccount && (
                <ol className="mb-5 list-decimal space-y-1 pl-5 text-xs text-amber-900">
                  <li>한국 은행 앱 또는 영업점에서 해외송금(International Transfer) 또는 SWIFT를 선택하세요.</li>
                  <li>아래 수취 은행, 계좌번호, SWIFT/BIC 정보를 정확히 입력하세요.</li>
                  <li>송금 메모에 이 결제 링크의 참조번호를 입력하세요. SwiftPay 관리자가 입금을 확인하고 승인한 후 결제 상태가 업데이트됩니다.</li>
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
                </div> : <div className="text-sm text-amber-900"><p className="font-semibold">{t('scan_supported_banking_app')}</p><p className="mt-2">{t('qr_amount_reference_attached')}</p></div>}
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
            <div className="flex-1 w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] text-slate-500 flex items-center justify-between">
              <span className="truncate">{permanentLinkUrl || t('payment_url_unavailable')}</span>
              <button
                type="button"
                onClick={async () => {
                  if (!permanentLinkUrl) {
                    toast.error(isKorean ? '이 링크에 결제 URL이 없습니다.' : 'No payment URL available for this link');
                    return;
                  }

                  const success = await copyTextToClipboard(permanentLinkUrl);
                  if (success) {
                    toast.success(t('link_copied'));
                  } else {
                    toast.error(t('unable_to_copy_link'));
                  }
                }}
                className="flex items-center gap-2 text-[12px] font-semibold text-slate-900 hover:text-[#FF6B00] transition-colors whitespace-nowrap ml-4"
              >
                <Copy size={14} />
                {t('copy_link')}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={async () => {
                const success = await copyTextToClipboard(permanentLinkUrl);
                if (success) {
                  toast.success(t('link_copied'));
                } else {
                  toast.error(t('unable_to_copy_link'));
                }
              }}
              className="h-9 px-6 bg-white border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-900 hover:bg-slate-50 flex items-center gap-2"
            >
              <Copy size={14} /> {isKorean ? '링크 복사' : 'Copy link'}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!link) return;
                if (link.provider === 'swiftpay') {
                  if (link.status !== 'Active') return;
                  const confirmed = window.confirm(
                    isKorean
                      ? '이 결제 링크는 비활성화 후 다시 활성화할 수 없습니다. 계속하시겠습니까?'
                      : 'This SwiftPay payment link cannot be reactivated after invalidation. Continue?',
                  );
                  if (!confirmed) return;
                  setIsUpdatingStatus(true);
                  try {
                    const response = await client.request(
                      `/api/v1/swiftpay/payment-links/${encodeURIComponent(link.code)}`,
                      'DELETE',
                    );
                    if (!response.ok || !response.data?.success) {
                      const message = response.data?.detail || response.data?.error || `Request failed (${response.status})`;
                      toast.error(String(message));
                      return;
                    }
                    const updated = updatePaymentLink(link.code, { status: 'Inactive' });
                    if (updated) {
                      setLink(updated);
                      toast.success(isKorean ? '결제 링크가 비활성화되었습니다.' : 'Payment link invalidated');
                    }
                  } catch {
                    toast.error(isKorean ? '결제 링크를 비활성화할 수 없습니다.' : 'Unable to invalidate payment link');
                  } finally {
                    setIsUpdatingStatus(false);
                  }
                  return;
                }
                const updated = togglePaymentLinkStatus(link.code);
                if (updated) {
                  setLink(updated);
                  toast.success(`Link ${updated.status === 'Active' ? 'reactivated' : 'deactivated'}`);
                }
              }}
              disabled={isUpdatingStatus || (link.provider === 'swiftpay' && link.status !== 'Active')}
              className="h-9 px-6 bg-white border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-900 hover:bg-slate-50 flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={16} className="text-slate-400" />
              {link.provider === 'swiftpay'
                ? t('payment_link_invalidate')
                : link.status === 'Active' ? t('payment_link_deactivate') : t('payment_link_activate')}
            </button>
          </div>
        </div>

        <h2 className="text-[16px] font-semibold text-slate-900 mb-4">{t('payment_history')}</h2>
        <div className="-mx-3 w-[calc(100%+1.5rem)] overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm sm:mx-0 sm:w-full">
          <table className="w-full min-w-[640px] text-left border-collapse sm:min-w-0">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{t('payment_status_label')}</th>
                <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{t('reference_no')}</th>
                <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{t('created_on')}</th>
                <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{t('payment_status_label')}</th>
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
                          toast.success(t('payment_link_copy_reference'));
                        } else {
                          toast.error(t('unable_to_copy_reference'));
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
