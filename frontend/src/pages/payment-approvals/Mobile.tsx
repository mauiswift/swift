import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, X, ShieldCheck } from 'lucide-react';
import Layout from '@/components/Layout';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { fmtCurrency } from '@/lib/format';
import PaymentStatus from './PaymentStatus';
import PaymentTransferDetails from './PaymentTransferDetails';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';

interface PendingPayment {
  id: string;
  amount: number;
  currency: string;
  processing_amount?: number;
  processing_currency?: string;
  exchange_rate?: number | null;
  store_name?: string;
  customer_name?: string;
  user_name?: string;
  description: string;
  status: string;
  payment_status?: string | null;
  approval_status?: string | null;
  payment_received?: boolean;
  payment_received_at?: string | null;
  sender_name?: string | null;
  sender_bank?: string | null;
  sender_account_number?: string | null;
  receiver_bank?: string | null;
  receiver_account_name?: string | null;
  receiver_account_number?: string | null;
  has_swiftpay_details?: boolean;
  created_at: string;
  transaction_type: string;
  external_id?: string;
}

export default function SuperAdminPaymentApprovalMobile() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useTranslation(language);
  const { isSuperAdmin } = useAuth();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [reviewPayment, setReviewPayment] = useState<PendingPayment | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  useEffect(() => {
    if (!reviewPayment) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !approving) setReviewPayment(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [reviewPayment, approving]);

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/');
    }
  }, [isSuperAdmin, navigate]);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchPendingPayments(false);
    }, 15_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const fetchPendingPayments = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await client.get('/api/v1/admin/payment-approvals/pending');
      if (response.ok && response.data?.success) {
        const nextPayments = response.data.data;
        const refreshedPayments = Array.isArray(nextPayments) ? nextPayments : [];
        setPayments(refreshedPayments);
        setReviewPayment((current) =>
          current
            ? refreshedPayments.find((payment) => payment.id === current.id) || current
            : current
        );
        setError('');
      } else {
        const errorMsg = response.data?.detail || t('approval_failed_fetch');
        setError(errorMsg);
        if (showLoading) setPayments([]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('approval_failed_fetch');
      setError(errorMsg);
      if (showLoading) setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async (paymentId: string) => {
    try {
      setApproving(paymentId);
      const response = await client.post(`/api/v1/admin/payment-approvals/${paymentId}/approve`, {
        note: reviewNote.trim(),
        reason: reviewNote.trim() || 'Manually approved by super admin',
      });

      if (response.ok && response.data?.success) {
        toast.success(response.data.message || t('approval_payment_processed'));
        setPayments(prev => prev.filter(p => p.id !== paymentId));
        setSelectedIds(prev => prev.filter(id => id !== paymentId));
        setReviewPayment(null);
        setReviewNote('');
        await fetchPendingPayments(false);
      } else {
        toast.error(response.data?.detail || t('approval_failed_approve'));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('approval_error_approve'));
    } finally {
      setApproving(null);
    }
  };

  const rejectPayment = async (paymentId: string) => {
    try {
      setApproving(paymentId);
      const response = await client.post(`/api/v1/admin/payment-approvals/${paymentId}/reject`, {
        note: 'Rejected by super admin',
        reason: 'Manually rejected by super admin',
      });

      if (response.ok && response.data?.success) {
        toast.success(response.data.message || t('approval_payment_rejected'));
        setPayments(prev => prev.filter(p => p.id !== paymentId));
        setSelectedIds(prev => prev.filter(id => id !== paymentId));
        setReviewPayment(null);
        await fetchPendingPayments(false);
      } else {
        toast.error(response.data?.detail || t('approval_failed_reject'));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('approval_error_reject'));
    } finally {
      setApproving(null);
    }
  };

  const runBulk = async (action: 'approve' | 'reject') => {
    for (const paymentId of selectedIds) {
      if (action === 'approve') await approvePayment(paymentId);
      else await rejectPayment(paymentId);
    }
    setSelectedIds([]);
  };

  const formatDate = (dateString: string) => {
    const locale = language === 'ko' ? 'ko-KR' : language === 'zh' ? 'zh-CN' : 'en-US';
    return new Date(dateString).toLocaleString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-enter px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            {t('approval_page_title')}
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{t('approval_awaiting_review')}</p>
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
              {payments.length}
            </span>
          </div>
          {selectedIds.length > 0 && (
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={() => runBulk('approve')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">
                {t('approval_approve')} {selectedIds.length}
              </button>
              <button type="button" onClick={() => runBulk('reject')} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white">
                {t('approval_reject')} {selectedIds.length}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-start">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Mobile Card View */}
        <div className="space-y-3">
          {payments.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-lg border border-slate-200">
              <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-slate-600">{t('approval_no_pending')}</p>
              <p className="text-xs text-slate-500 mt-1">{t('approval_all_processed')}</p>
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(payment.id)}
                      onChange={() => setSelectedIds(ids => ids.includes(payment.id) ? ids.filter(id => id !== payment.id) : [...ids, payment.id])}
                      aria-label={`${t('approval_select_payment')} ${payment.id}`}
                    />
                    <span>{payment.external_id || `#${payment.id}`}</span>
                  </label>
                  <PaymentStatus payment={payment} compact />
                </div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-slate-500 truncate">
                      {payment.external_id || `#${payment.id}`}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">
                      {payment.external_id?.startsWith('OPEN-AMOUNT-') && payment.amount <= 0
                        ? t('approval_custom_amount')
                        : fmtCurrency(payment.amount, payment.currency)}
                    </p>
                    {payment.exchange_rate && payment.processing_currency && payment.processing_currency !== payment.currency && (
                      <p className="mt-1 text-[10px] text-slate-500">
                        {fmtCurrency(payment.processing_amount || 0, payment.processing_currency)} ·
                        {' '}1 {payment.currency} = {payment.exchange_rate.toFixed(6)} {payment.processing_currency}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded whitespace-nowrap">
                    {payment.transaction_type === 'payment_link'
                      ? t('approval_payment_link')
                      : payment.transaction_type === 'swiftpay_order'
                      ? 'SwiftPay'
                      : payment.transaction_type}
                  </span>
                </div>

                {/* Description */}
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-500 font-medium mb-1">{t('approval_store')}</p>
                  <p className="text-xs text-slate-700 font-medium">{payment.store_name || payment.user_name || payment.customer_name || t('approval_unknown')}</p>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-500 font-medium mb-1">{t('approval_description')}</p>
                  <p className="text-xs text-slate-600 line-clamp-2">{payment.description}</p>
                </div>

                {/* Request date and time */}
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-500 font-medium mb-1">{t('approval_date_time')}</p>
                  <p className="text-xs text-slate-600">{formatDate(payment.created_at)}</p>
                </div>
                {payment.payment_received && (
                  <PaymentTransferDetails
                    paymentId={payment.id}
                    hasSwiftpayDetails={payment.has_swiftpay_details}
                    storedDetails={payment}
                  />
                )}

                {/* Action Buttons */}
                <div className="border-t border-slate-100 pt-3 flex gap-2">
                  <button
                    onClick={() => { setReviewNote(''); setReviewPayment(payment); }}
                    disabled={approving === payment.id || !payment.payment_received}
                    title={!payment.payment_received ? t('approval_payment_received_required') : undefined}
                    className="flex-1 px-3 py-2 bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-200 rounded-md hover:bg-emerald-100 disabled:opacity-50"
                  >
                    {approving === payment.id ? <Loader2 size={12} className="animate-spin mx-auto" /> : t('approval_approve')}
                  </button>
                  <button
                    onClick={() => rejectPayment(payment.id)}
                    disabled={approving === payment.id}
                    className="flex-1 px-3 py-2 bg-red-50 text-red-600 text-xs font-semibold border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50"
                  >
                    {approving === payment.id ? <Loader2 size={12} className="animate-spin mx-auto" /> : t('approval_reject')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {reviewPayment && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="mobile-approval-review-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !approving) setReviewPayment(null); }}>
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
              <div className="flex items-start justify-between">
                <div className="flex gap-3"><div className="rounded-xl bg-emerald-50 p-2 text-emerald-600"><ShieldCheck size={18} /></div><div><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{t('approval_review_heading')}</p><h2 id="mobile-approval-review-title" className="mt-1 text-lg font-semibold text-slate-900">{t('approval_review_before')}</h2></div></div>
                <button type="button" aria-label={t('approval_close_review')} onClick={() => setReviewPayment(null)} disabled={Boolean(approving)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"><X size={18} /></button>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div><dt className="text-xs text-slate-400">{t('approval_store')}</dt><dd className="font-medium text-slate-800">{reviewPayment.store_name || reviewPayment.user_name || reviewPayment.customer_name || t('approval_unknown')}</dd></div>
                <div><dt className="text-xs text-slate-400">{t('approval_date_time')}</dt><dd className="font-medium text-slate-800">{formatDate(reviewPayment.created_at)}</dd></div>
                <div><dt className="text-xs text-slate-400">{t('approval_payment_status')}</dt><dd className="mt-1"><PaymentStatus payment={reviewPayment} /></dd></div>
                <div><dt className="text-xs text-slate-400">{t('approval_received_at')}</dt><dd className="font-medium text-slate-800">{reviewPayment.payment_received_at ? formatDate(reviewPayment.payment_received_at) : '—'}</dd></div>
                <div><dt className="text-xs text-slate-400">{t('approval_customer')}</dt><dd className="font-medium text-slate-800">{reviewPayment.customer_name || t('approval_unknown')}</dd></div>
                <div><dt className="text-xs text-slate-400">{t('approval_reference')}</dt><dd className="font-mono text-xs text-slate-800">{reviewPayment.external_id || `#${reviewPayment.id}`}</dd></div>
                <div><dt className="text-xs text-slate-400">{t('approval_amount')}</dt><dd className="text-base font-semibold text-slate-900">{fmtCurrency(reviewPayment.amount, reviewPayment.currency)}</dd></div>
                {reviewPayment.processing_currency && reviewPayment.processing_currency !== reviewPayment.currency && <div><dt className="text-xs text-slate-400">{t('approval_settlement')}</dt><dd className="font-medium text-slate-800">{fmtCurrency(reviewPayment.processing_amount || 0, reviewPayment.processing_currency)} · 1 {reviewPayment.currency} = {reviewPayment.exchange_rate?.toFixed(6)} {reviewPayment.processing_currency}</dd></div>}
                <div><dt className="text-xs text-slate-400">{t('approval_description')}</dt><dd className="text-slate-700">{reviewPayment.description || '—'}</dd></div>
              </dl>
              <div className="mt-4"><label htmlFor="mobile-approval-review-note" className="text-xs font-medium text-slate-500">{t('approval_note')} <span className="font-normal text-slate-400">{t('approval_optional')}</span></label><textarea id="mobile-approval-review-note" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} maxLength={500} rows={3} placeholder={t('approval_internal_note_short')} className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" /></div>
              <p className="mt-3 text-xs text-amber-700">{t('approval_warning_short')}</p>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setReviewPayment(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">{t('approval_cancel')}</button>
                <button type="button" onClick={() => void approvePayment(reviewPayment.id)} disabled={approving === reviewPayment.id || !reviewPayment.payment_received} title={!reviewPayment.payment_received ? t('approval_payment_received_required') : undefined} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{approving === reviewPayment.id && <Loader2 size={15} className="animate-spin" />}{t('approval_confirm')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
