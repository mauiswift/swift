import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Loader2, AlertCircle, X, ShieldCheck, Search, RefreshCw, Clock3 } from 'lucide-react';
import Layout from '@/components/Layout';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { fmtCurrency } from '@/lib/format';

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
  created_at: string;
  transaction_type: string;
  external_id?: string;
}

interface SenderDetails {
  senderName: string;
  senderBank: string;
}

export default function SuperAdminPaymentApprovalDesktop() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [senderDetails, setSenderDetails] = useState<Record<string, SenderDetails>>({});
  const [error, setError] = useState('');
  const [reviewPayment, setReviewPayment] = useState<PendingPayment | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

  const fetchPendingPayments = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await client.get('/api/v1/admin/payment-approvals/pending');
      if (response.ok && response.data?.success) {
        const nextPayments = response.data.data;
        setPayments(Array.isArray(nextPayments) ? nextPayments : []);
        setError('');
      } else {
        const errorMsg = response.data?.detail || 'Failed to fetch pending payments';
        setError(errorMsg);
        setPayments([]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch pending payments';
      setError(errorMsg);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async (paymentId: string) => {
    const details = senderDetails[paymentId] || { senderName: '', senderBank: '' };
    try {
      setApproving(paymentId);
      const response = await client.post(`/api/v1/admin/payment-approvals/${paymentId}/approve`, {
        note: reviewNote.trim(),
        reason: reviewNote.trim() || 'Manually approved by super admin',
        sender_name: details.senderName.trim() || undefined,
        sender_bank: details.senderBank.trim() || undefined,
      });

      if (response.ok && response.data?.success) {
        toast.success(response.data.message || 'Payment approved successfully');
        setPayments(prev => prev.filter(p => p.id !== paymentId));
        setSelectedIds(prev => prev.filter(id => id !== paymentId));
        setReviewPayment(null);
        setReviewNote('');
        setSenderDetails(prev => {
          const next = { ...prev };
          delete next[paymentId];
          return next;
        });
        await fetchPendingPayments(false);
      } else {
        toast.error(response.data?.detail || 'Failed to approve payment');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error approving payment');
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
        toast.success(response.data.message || 'Payment rejected successfully');
        setPayments(prev => prev.filter(p => p.id !== paymentId));
        setSelectedIds(prev => prev.filter(id => id !== paymentId));
        setReviewPayment(null);
        await fetchPendingPayments(false);
      } else {
        toast.error(response.data?.detail || 'Failed to reject payment');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error rejecting payment');
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
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const visiblePayments = payments.filter((payment) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [
      payment.external_id,
      payment.store_name,
      payment.user_name,
      payment.customer_name,
      payment.description,
      payment.transaction_type,
    ].some((value) => String(value || '').toLowerCase().includes(query));
  });

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
      <div className="page-enter">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-6">
          <span className="cursor-pointer hover:text-slate-600" onClick={() => navigate('/')}>
            Dashboard
          </span>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-600 font-semibold">Payment Approvals</span>
        </div>

        {/* Header */}
        <div className="mb-7 flex items-start gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">Payment Approvals</h1>
            <p className="mt-1 text-sm text-slate-500">Review incoming payment-link requests before they are credited.</p>
          </div>
          <button type="button" onClick={() => void fetchPendingPayments(false)} disabled={loading} className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700"><Clock3 size={15} /> Awaiting review</div><p className="mt-2 text-2xl font-semibold text-slate-900">{payments.length}</p></div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Visible requests</p><p className="mt-2 text-2xl font-semibold text-slate-900">{visiblePayments.length}</p></div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Selected</p><p className="mt-2 text-2xl font-semibold text-slate-900">{selectedIds.length}</p></div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search reference, merchant, customer..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>
          <span className="text-xs font-medium text-slate-500">{payments.length} pending</span>
        </div>

        {selectedIds.length > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-sm font-medium text-blue-900">{selectedIds.length} request{selectedIds.length === 1 ? '' : 's'} selected</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => runBulk('approve')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Approve selected</button>
              <button type="button" onClick={() => runBulk('reject')} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white">Reject selected</button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Desktop Table View */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {visiblePayments.length === 0 ? (
            <div className="p-12 text-center">
              {payments.length === 0 ? <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-500 opacity-50" /> : <Search className="mx-auto mb-4 h-12 w-12 text-slate-300" />}
              <p className="font-medium text-slate-600">{payments.length === 0 ? 'No pending payments' : 'No matching requests'}</p>
              <p className="mt-1 text-sm text-slate-500">{payments.length === 0 ? 'All payments have been processed' : 'Try a different reference, merchant, or customer search.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={visiblePayments.length > 0 && visiblePayments.every((payment) => selectedIds.includes(payment.id))}
                        onChange={() => {
                          const visibleIds = visiblePayments.map((payment) => payment.id);
                          setSelectedIds((ids) => visibleIds.every((id) => ids.includes(id))
                            ? ids.filter((id) => !visibleIds.includes(id))
                            : Array.from(new Set([...ids, ...visibleIds])));
                        }}
                        aria-label="Select all pending payments"
                      />
                    </th>
                    <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">ID</th>
                    <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Store</th>
                    <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Description</th>
                    <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Date &amp; time</th>
                    <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {visiblePayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50/30">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(payment.id)}
                          onChange={() => setSelectedIds(ids => ids.includes(payment.id) ? ids.filter(id => id !== payment.id) : [...ids, payment.id])}
                          aria-label={`Select payment ${payment.id}`}
                        />
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-[12px] font-mono text-slate-900 font-semibold truncate">
                          {payment.external_id || `#${payment.id}`}
                        </p>
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-[12px] font-medium text-slate-700 truncate">{payment.store_name || payment.user_name || payment.customer_name || 'Unknown'}</p>
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-[14px] font-semibold text-slate-900 whitespace-nowrap">
                          {String(payment.external_id || '').startsWith('OPEN-AMOUNT-') && Number(payment.amount) <= 0
                            ? 'Custom'
                            : fmtCurrency(Number(payment.amount) || 0, payment.currency || 'PHP')}
                        </p>
                        {payment.exchange_rate && payment.processing_currency && payment.processing_currency !== payment.currency && (
                          <p className="mt-1 text-[10px] text-slate-500 whitespace-nowrap">
                            {fmtCurrency(Number(payment.processing_amount) || 0, payment.processing_currency)} ·
                            {' '}1 {payment.currency} = {Number(payment.exchange_rate).toFixed(6)} {payment.processing_currency}
                          </p>
                        )}
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-[11px] font-medium text-slate-500 capitalize">
                          {payment.transaction_type === 'payment_link'
                            ? 'Payment Link'
                            : payment.transaction_type === 'swiftpay_order'
                            ? 'SwiftPay'
                            : payment.transaction_type}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-[12px] text-slate-600 max-w-xs truncate">
                          {payment.description}
                        </p>
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                          {formatDate(payment.created_at)}
                        </p>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <input
                            value={senderDetails[payment.id]?.senderName || ''}
                            onChange={(e) =>
                              setSenderDetails(prev => ({
                                ...prev,
                                [payment.id]: {
                                  senderName: e.target.value,
                                  senderBank: prev[payment.id]?.senderBank || '',
                                },
                              }))
                            }
                            placeholder="Sender name"
                            className="rounded-md border border-slate-200 px-2 py-1.5 text-[11px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                          <input
                            value={senderDetails[payment.id]?.senderBank || ''}
                            onChange={(e) =>
                              setSenderDetails(prev => ({
                                ...prev,
                                [payment.id]: {
                                  senderName: prev[payment.id]?.senderName || '',
                                  senderBank: e.target.value,
                                },
                              }))
                            }
                            placeholder="Sender bank"
                            className="rounded-md border border-slate-200 px-2 py-1.5 text-[11px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                          <button
                            onClick={() => { setReviewNote(''); setReviewPayment(payment); }}
                            disabled={approving === payment.id}
                            className="px-3 py-2 bg-emerald-50 text-emerald-600 text-[12px] font-semibold border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50"
                          >
                            {approving === payment.id ? <Loader2 size={14} className="animate-spin" /> : 'Approve'}
                          </button>
                          <button
                            onClick={() => rejectPayment(payment.id)}
                            disabled={approving === payment.id}
                            className="px-3 py-2 bg-red-50 text-red-600 text-[12px] font-semibold border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
                          >
                            {approving === payment.id ? <Loader2 size={14} className="animate-spin" /> : 'Reject'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            {reviewPayment && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="approval-review-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !approving) setReviewPayment(null); }}>
                <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                  <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                    <div className="flex gap-3"><div className="rounded-xl bg-emerald-50 p-2 text-emerald-600"><ShieldCheck size={20} /></div><div><p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Payment link approval</p><h2 id="approval-review-title" className="mt-1 text-lg font-semibold text-slate-900">Review before approving</h2></div></div>
                    <button type="button" aria-label="Close review" onClick={() => setReviewPayment(null)} disabled={Boolean(approving)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"><X size={18} /></button>
                  </div>
                  <div className="space-y-5 px-6 py-5">
                    <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
                      <div><p className="text-xs text-slate-400">Store / merchant</p><p className="mt-1 font-medium text-slate-800">{reviewPayment.store_name || reviewPayment.user_name || 'Unknown'}</p></div>
                      <div><p className="text-xs text-slate-400">Customer</p><p className="mt-1 font-medium text-slate-800">{reviewPayment.customer_name || 'Unknown'}</p></div>
                      <div><p className="text-xs text-slate-400">Amount</p><p className="mt-1 text-base font-semibold text-slate-900">{fmtCurrency(Number(reviewPayment.amount) || 0, reviewPayment.currency || 'PHP')}</p></div>
                      <div><p className="text-xs text-slate-400">Submitted</p><p className="mt-1 font-medium text-slate-800">{formatDate(reviewPayment.created_at)}</p></div>
                      <div className="col-span-2"><p className="text-xs text-slate-400">Reference</p><p className="mt-1 break-all font-mono text-xs text-slate-700">{reviewPayment.external_id || `#${reviewPayment.id}`}</p></div>
                    </div>
                    {reviewPayment.processing_currency && reviewPayment.processing_currency !== reviewPayment.currency && <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">Settlement: {fmtCurrency(Number(reviewPayment.processing_amount) || 0, reviewPayment.processing_currency)} · 1 {reviewPayment.currency} = {Number(reviewPayment.exchange_rate || 0).toFixed(6)} {reviewPayment.processing_currency}</p>}
                    <div><p className="text-xs font-medium text-slate-500">Description</p><p className="mt-1 text-sm text-slate-700">{reviewPayment.description || 'No description provided.'}</p></div>
                    <div><label htmlFor="approval-review-note" className="text-xs font-medium text-slate-500">Approval note <span className="font-normal text-slate-400">(optional)</span></label><textarea id="approval-review-note" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} maxLength={500} rows={3} placeholder="Add an internal note for the approval record" className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" /></div>
                    <p className="text-xs text-amber-700">Approving authorizes this payment request to proceed. Verify the amount, merchant, and reference before continuing.</p>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
                    <button type="button" onClick={() => setReviewPayment(null)} disabled={Boolean(approving)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
                    <button type="button" onClick={() => void approvePayment(reviewPayment.id)} disabled={approving === reviewPayment.id} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50">{approving === reviewPayment.id && <Loader2 size={15} className="animate-spin" />}Approve payment</button>
                  </div>
                </div>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
