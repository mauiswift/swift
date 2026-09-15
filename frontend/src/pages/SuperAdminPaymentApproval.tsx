import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { toast } from 'sonner';
import { fmtCurrency } from '@/lib/format';

interface PendingPayment {
  id: string;
  amount: number;
  currency: string;
  customer_name?: string;
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

export default function SuperAdminPaymentApproval() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const isMobileOrTablet = isMobile || isTablet;
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [senderDetails, setSenderDetails] = useState<Record<string, SenderDetails>>({});
  const [error, setError] = useState('');

  // Redirect if not super admin
  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/');
    }
  }, [isSuperAdmin, navigate]);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await client.get('/api/v1/admin/payment-approvals/pending');
      console.log('Fetch pending payments response:', response);
      if (response.ok && response.data?.success) {
        const paymentsList = response.data.data || [];
        console.log(`Loaded ${paymentsList.length} pending payments`);
        setPayments(paymentsList);
        setError('');
      } else {
        const errorMsg = response.data?.detail || 'Failed to fetch pending payments';
        console.error('Fetch pending payments error:', errorMsg);
        setError(errorMsg);
        setPayments([]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch pending payments';
      console.error('Fetch pending payments exception:', err);
      setError(errorMsg);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async (paymentId: string, reason: string = '') => {
    const details = senderDetails[paymentId] || { senderName: '', senderBank: '' };
    try {
      setApproving(paymentId);
      console.log(`Approving payment: ${paymentId}`);
      const response = await client.post(`/api/v1/admin/payment-approvals/${paymentId}/approve`, {
        note: reason,
        reason: reason || 'Manually approved by super admin',
        sender_name: details.senderName.trim() || undefined,
        sender_bank: details.senderBank.trim() || undefined,
      });

      console.log('Approve response:', response);
      if (response.ok && response.data?.success) {
        toast.success(response.data.message || 'Payment approved successfully');
        setPayments(prev => prev.filter(p => p.id !== paymentId));
        setSenderDetails(prev => {
          const next = { ...prev };
          delete next[paymentId];
          return next;
        });
        await fetchPendingPayments();
      } else {
        const errorMsg = response.data?.detail || response.data?.error || 'Failed to approve payment';
        console.error('Approve error:', errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error approving payment';
      console.error('Approve exception:', err);
      toast.error(errorMsg);
    } finally {
      setApproving(null);
    }
  };

  const rejectPayment = async (paymentId: string) => {
    try {
      setApproving(paymentId);
      console.log(`Rejecting payment: ${paymentId}`);
      const response = await client.post(`/api/v1/admin/payment-approvals/${paymentId}/reject`, {
        note: 'Rejected by super admin',
        reason: 'Manually rejected by super admin',
      });

      console.log('Reject response:', response);
      if (response.ok && response.data?.success) {
        toast.success(response.data.message || 'Payment rejected successfully');
        setPayments(prev => prev.filter(p => p.id !== paymentId));
        await fetchPendingPayments();
      } else {
        const errorMsg = response.data?.detail || response.data?.error || 'Failed to reject payment';
        console.error('Reject error:', errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error rejecting payment';
      console.error('Reject exception:', err);
      toast.error(errorMsg);
    } finally {
      setApproving(null);
    }
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
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">
            Payment Approvals
          </h1>
          <span className="ml-auto px-3 py-1 rounded-full text-sm font-semibold bg-red-50 text-red-600 border border-red-100">
            {payments.length} Pending
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Desktop View - Table */}
        {isDesktop && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {payments.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4 opacity-50" />
                <p className="text-slate-600 font-medium">No pending payments</p>
                <p className="text-sm text-slate-500 mt-1">All payments have been processed</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-3 sm:px-4 md:px-8 py-4 text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-widest">ID</th>
                      <th className="px-3 sm:px-4 md:px-8 py-4 text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Amount</th>
                      <th className="hidden sm:table-cell px-3 sm:px-4 md:px-8 py-4 text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Type</th>
                      <th className="hidden md:table-cell px-3 sm:px-4 md:px-8 py-4 text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Description</th>
                      <th className="hidden md:table-cell px-3 sm:px-4 md:px-8 py-4 text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Created</th>
                      <th className="px-3 sm:px-4 md:px-8 py-4 text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-3 sm:px-4 md:px-8 py-4">
                          <p className="text-[11px] sm:text-[12px] font-mono text-slate-900 font-semibold truncate">
                            {payment.external_id || `#${payment.id}`}
                          </p>
                        </td>
                        <td className="px-3 sm:px-4 md:px-8 py-4">
                          <p className="text-[12px] sm:text-[14px] font-semibold text-slate-900 whitespace-nowrap">
                            {payment.external_id?.startsWith('OPEN-AMOUNT-') && payment.amount <= 0
                              ? 'Custom'
                              : fmtCurrency(payment.amount, payment.currency)}
                          </p>
                        </td>
                        <td className="hidden sm:table-cell px-3 sm:px-4 md:px-8 py-4">
                          <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 capitalize">
                            {payment.transaction_type === 'payment_link'
                              ? 'Payment Link'
                              : payment.transaction_type === 'swiftpay_order'
                              ? 'SwiftPay'
                              : payment.transaction_type}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-3 sm:px-4 md:px-8 py-4">
                          <p className="text-[11px] sm:text-[12px] text-slate-600 max-w-xs truncate">
                            {payment.description}
                          </p>
                        </td>
                        <td className="hidden md:table-cell px-3 sm:px-4 md:px-8 py-4">
                          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap">
                            {formatDate(payment.created_at)}
                          </p>
                        </td>
                        <td className="px-3 sm:px-4 md:px-8 py-4">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <input
                              value={senderDetails[payment.id]?.senderName || ''}
                              onChange={(event) =>
                                setSenderDetails(prev => ({
                                  ...prev,
                                  [payment.id]: {
                                    senderName: event.target.value,
                                    senderBank: prev[payment.id]?.senderBank || '',
                                  },
                                }))
                              }
                              placeholder="Sender name"
                              className="rounded-md border border-slate-200 px-2 py-1.5 text-[11px] text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                            <input
                              value={senderDetails[payment.id]?.senderBank || ''}
                              onChange={(event) =>
                                setSenderDetails(prev => ({
                                  ...prev,
                                  [payment.id]: {
                                    senderName: prev[payment.id]?.senderName || '',
                                    senderBank: event.target.value,
                                  },
                                }))
                              }
                              placeholder="Sender bank"
                              className="rounded-md border border-slate-200 px-2 py-1.5 text-[11px] text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                            <button
                              onClick={() => approvePayment(payment.id)}
                              disabled={approving === payment.id}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 text-[12px] font-semibold border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            >
                              {approving === payment.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                              Approve
                            </button>
                            <button
                              onClick={() => rejectPayment(payment.id)}
                              disabled={approving === payment.id}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 text-[12px] font-semibold border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              {approving === payment.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Mobile View - Cards */}
        {isMobileOrTablet && (
          <div className="space-y-4">
            {payments.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
                <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3 opacity-50" />
                <p className="text-slate-600 font-medium text-sm">No pending payments</p>
                <p className="text-xs text-slate-500 mt-1">All payments have been processed</p>
              </div>
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-mono text-slate-500">ID: {payment.external_id || `#${payment.id}`}</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {payment.external_id?.startsWith('OPEN-AMOUNT-') && payment.amount <= 0
                          ? 'Custom Amount'
                          : fmtCurrency(payment.amount, payment.currency)}
                      </p>
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded capitalize">
                      {payment.transaction_type === 'payment_link'
                        ? 'Link'
                        : payment.transaction_type === 'swiftpay_order'
                        ? 'SwiftPay'
                        : payment.transaction_type}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[11px] text-slate-500 font-medium mb-1">Description</p>
                    <p className="text-xs text-slate-600">{payment.description}</p>
                  </div>

                  {/* Created Date */}
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[11px] text-slate-500 font-medium mb-1">Created</p>
                    <p className="text-xs text-slate-600">{formatDate(payment.created_at)}</p>
                  </div>

                  {/* Sender Details */}
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <input
                      value={senderDetails[payment.id]?.senderName || ''}
                      onChange={(event) =>
                        setSenderDetails(prev => ({
                          ...prev,
                          [payment.id]: {
                            senderName: event.target.value,
                            senderBank: prev[payment.id]?.senderBank || '',
                          },
                        }))
                      }
                      placeholder="Sender name"
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      value={senderDetails[payment.id]?.senderBank || ''}
                      onChange={(event) =>
                        setSenderDetails(prev => ({
                          ...prev,
                          [payment.id]: {
                            senderName: prev[payment.id]?.senderName || '',
                            senderBank: event.target.value,
                          },
                        }))
                      }
                      placeholder="Sender bank"
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-slate-100 pt-3 flex gap-2">
                    <button
                      onClick={() => approvePayment(payment.id)}
                      disabled={approving === payment.id}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      {approving === payment.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => rejectPayment(payment.id)}
                      disabled={approving === payment.id}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 text-xs font-semibold border border-red-200 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {approving === payment.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
