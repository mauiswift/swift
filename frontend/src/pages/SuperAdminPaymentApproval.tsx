import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, Loader2, AlertCircle, Link2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
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
      if (response.ok && response.data.success) {
        setPayments(response.data.data || []);
      } else {
        setError(response.data?.detail || 'Failed to fetch pending payments');
      }
      if (response.ok && response.data.success) setError('');
    } catch (err) {
      setError('Failed to fetch pending payments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async (paymentId: string, reason: string = '') => {
    const details = senderDetails[paymentId] || { senderName: '', senderBank: '' };
    try {
      setApproving(paymentId);
      const response = await client.post(`/api/v1/admin/payment-approvals/${paymentId}/approve`, {
        note: reason,
        reason: reason || 'Manually approved by super admin',
        sender_name: details.senderName.trim() || undefined,
        sender_bank: details.senderBank.trim() || undefined,
      });

      if (response.ok && response.data.success) {
        toast.success(response.data.message || 'Payment approved successfully');
        setPayments(prev => prev.filter(p => p.id !== paymentId));
        setSenderDetails(prev => {
          const next = { ...prev };
          delete next[paymentId];
          return next;
        });
        await fetchPendingPayments();
      } else {
        toast.error(response.data.detail || response.data.error || 'Failed to approve payment');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error approving payment');
      console.error(err);
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

      if (response.ok && response.data.success) {
        toast.success(response.data.message || 'Payment rejected successfully');
        setPayments(prev => prev.filter(p => p.id !== paymentId));
        await fetchPendingPayments();
      } else {
        toast.error(response.data.detail || response.data.error || 'Failed to reject payment');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error rejecting payment');
      console.error(err);
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
                    <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      Payment ID
                    </th>
                    <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      Amount
                    </th>
                    <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      Type
                    </th>
                    <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      Description
                    </th>
                    <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      Created
                    </th>
                    <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-4">
                        <p className="text-[12px] font-mono text-slate-900 font-semibold">
                          {payment.external_id || `#${payment.id}`}
                        </p>
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-[14px] font-semibold text-slate-900">
                          {payment.external_id?.startsWith('OPEN-AMOUNT-') && payment.amount <= 0
                            ? 'Customer enters amount'
                            : fmtCurrency(payment.amount, payment.currency)}
                        </p>
                      </td>
                      <td className="px-8 py-4">
                        <span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-600 text-[11px] font-semibold border border-blue-100 rounded-full">
                          {payment.external_id?.startsWith('OPEN-AMOUNT-') ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-700 text-[11px] font-semibold border border-orange-200 rounded-full">
                              <Link2 size={12} /> Permanent Link
                            </span>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-600 text-[11px] font-semibold border border-blue-100 rounded-full">
                              {payment.transaction_type}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-[13px] text-slate-600 max-w-xs truncate">
                          {payment.description}
                        </p>
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-[12px] text-slate-500 font-medium">
                          {formatDate(payment.created_at)}
                        </p>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <div className="grid w-48 gap-2">
                            {!payment.external_id?.startsWith('OPEN-AMOUNT-') && <><input
                              value={senderDetails[payment.id]?.senderName || ''}
                              onChange={(event) => setSenderDetails(prev => ({
                                ...prev,
                                [payment.id]: {
                                  senderName: event.target.value,
                                  senderBank: prev[payment.id]?.senderBank || '',
                                },
                              }))}
                              placeholder="Sender name"
                              aria-label={`Sender name for payment ${payment.id}`}
                              className="rounded-md border border-slate-200 px-2 py-1.5 text-[11px] text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                            <input
                              value={senderDetails[payment.id]?.senderBank || ''}
                              onChange={(event) => setSenderDetails(prev => ({
                                ...prev,
                                [payment.id]: {
                                  senderName: prev[payment.id]?.senderName || '',
                                  senderBank: event.target.value,
                                },
                              }))}
                              placeholder="Sender bank"
                              aria-label={`Sender bank for payment ${payment.id}`}
                              className="rounded-md border border-slate-200 px-2 py-1.5 text-[11px] text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            /></>}
                          </div>
                          <button
                            onClick={() => approvePayment(payment.id)}
                            disabled={approving === payment.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[12px] font-semibold border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                          >
                            {approving === payment.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle size={14} />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => rejectPayment(payment.id)}
                            disabled={approving === payment.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-[12px] font-semibold border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {approving === payment.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <XCircle size={14} />
                            )}
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
      </div>
    </Layout>
  );
}
