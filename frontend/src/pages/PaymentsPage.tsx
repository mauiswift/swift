import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, MoreVertical, Search, Check, RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import { client } from '@/lib/api';
import { fmtCurrencyPhp } from '@/lib/format';

type DateRange = 'last7' | 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';
type Status = 'all' | 'pending' | 'executed' | 'canceled' | 'rejected' | 'expired';

interface Payment {
  id: string;
  amount: number;
  method: string;
  provider: string;
  reference: string;
  createdAt: string;
  executedAt: string | null;
  status: Status;
}

const dateRangeLabels: Record<DateRange, { label: string; dates: string }> = {
  last7: { label: 'Last 7 days', dates: '13 Jul - 19 Jul' },
  today: { label: 'Today', dates: '19 Jul' },
  yesterday: { label: 'Yesterday', dates: '18 Jul' },
  thisWeek: { label: 'This week', dates: '19 Jul' },
  lastWeek: { label: 'Last week', dates: '12 Jul - 18 Jul' },
  thisMonth: { label: 'This month', dates: '01 Jul - 19 Jul' },
  lastMonth: { label: 'Last month', dates: '01 Jun - 30 Jun' },
  custom: { label: 'Custom range', dates: '' },
};

const statusLabels: Record<Status, string> = {
  all: 'All',
  pending: 'Pending',
  executed: 'Executed',
  canceled: 'Canceled',
  rejected: 'Rejected',
  expired: 'Expired',
};

const statusStyles: Record<Status, { bg: string; text: string; dot: string }> = {
  all: { bg: '', text: '', dot: '' },
  pending: { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' },
  executed: { bg: '#F0FDFA', text: '#0D9488', dot: '#10B981' },
  canceled: { bg: '#F9FAFB', text: '#64748B', dot: '#94A3B8' },
  rejected: { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
  expired: { bg: '#F9FAFB', text: '#64748B', dot: '#94A3B8' },
};

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('last7');
  const [status, setStatus] = useState<Status>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get('/api/v1/entities/transactions');
      if (res.ok && res.data) {
        // Handle both direct array and list response with items
        const rawItems = Array.isArray(res.data) ? res.data : (res.data?.items || []);
        const mapped: Payment[] = rawItems.map((item: any) => ({
          id: String(item.id),
          amount: item.amount,
          method: item.transaction_type || 'Transfer',
          provider: item.title || 'SwiftPay',
          reference: item.order_no || item.external_id || 'N/A',
          createdAt: item.created_at ? new Date(item.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A',
          executedAt: (item.status === 'paid' || item.status === 'executed' || item.status === 'completed') && item.updated_at
            ? new Date(item.updated_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
            : null,
          status: (item.status?.toLowerCase() || 'pending') as Status,
        }));
        setPayments(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (status !== 'all' && p.status !== status) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return p.reference.toLowerCase().includes(term) ||
               p.provider.toLowerCase().includes(term) ||
               p.method.toLowerCase().includes(term);
      }
      return true;
    });
  }, [payments, status, searchTerm]);

  const transactionsCount = filteredPayments.length;
  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const avgAmount = transactionsCount > 0 ? totalAmount / transactionsCount : 0;

  return (
    <Layout>
      <div className="page-enter">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">Payments</h1>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
              />
            </div>
            <button
              onClick={() => fetchPayments()}
              className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 shadow-sm"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 shadow-sm"
            >
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:border-slate-300"
            >
              <span className="text-slate-400">Created on:</span>
              <span className="text-slate-900 font-semibold">{dateRangeLabels[dateRange].label}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {showDateDropdown && (
              <>
                <div onClick={() => setShowDateDropdown(false)} className="fixed inset-0 z-10" />
                <div className="absolute left-0 top-full mt-2 w-[200px] bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden page-enter">
                  {(Object.keys(dateRangeLabels) as DateRange[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setDateRange(key); setShowDateDropdown(false); }}
                      className={`flex w-full items-center justify-between px-4 py-3 text-[13px] font-semibold ${dateRange === key ? 'bg-slate-50 text-[#FF6B00]' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {dateRangeLabels[key].label}
                      {dateRange === key && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex items-center gap-2 h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:border-slate-300"
            >
              <span className="text-slate-400">Status:</span>
              <span className="text-slate-900 font-semibold">{statusLabels[status]}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {showStatusDropdown && (
              <>
                <div onClick={() => setShowStatusDropdown(false)} className="fixed inset-0 z-10" />
                <div className="absolute left-0 top-full mt-2 w-[180px] bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden page-enter">
                  {(Object.keys(statusLabels) as Status[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setStatus(key); setShowStatusDropdown(false); }}
                      className={`flex w-full items-center justify-between px-4 py-3 text-[13px] font-semibold ${status === key ? 'bg-slate-50 text-[#FF6B00]' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {statusLabels[key]}
                      {status === key && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button className="flex items-center gap-2 h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600 shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
            More
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
            <p className="text-[14px] font-semibold text-slate-900 mb-6">Transactions</p>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">{transactionsCount}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
            <p className="text-[14px] font-semibold text-slate-900 mb-6">Total amount</p>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">{fmtCurrencyPhp(totalAmount)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
            <p className="text-[14px] font-semibold text-slate-900 mb-6">Average amount</p>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">{fmtCurrencyPhp(avgAmount)}</p>
          </div>
        </div>

        {/* Table */}
        <h2 className="text-[18px] font-semibold text-slate-900 mb-6">Transactions history</h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">PAYMENT</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">REFERENCE NO</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">DATE</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">PAYMENT STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center">
                    <RefreshCw size={24} className="animate-spin mx-auto text-slate-300" />
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                    No transactions found
                  </td>
                </tr>
              ) : filteredPayments.map((payment) => {
                const style = statusStyles[payment.status] || statusStyles.expired;
                return (
                  <tr
                    key={payment.id}
                    onClick={() => navigate(`/payments/${payment.id}`)}
                    className="cursor-pointer hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-500">
                          {payment.method.includes('QR') ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                            </svg>
                          ) : (
                            <RefreshCw size={16} />
                          )}
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-slate-900">{fmtCurrencyPhp(payment.amount)}</p>
                          <p className="text-[11px] text-slate-500">{payment.provider} • {payment.method}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-slate-600 font-medium">{payment.reference}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] text-slate-500">Created: {payment.createdAt}</p>
                      {payment.executedAt && <p className="text-[11px] text-slate-500">Executed: {payment.executedAt}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize"
                        style={{ backgroundColor: style.bg, color: style.text }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.dot }} />
                        {statusLabels[payment.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
