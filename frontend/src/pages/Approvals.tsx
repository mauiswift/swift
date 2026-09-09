import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Layout from '@/components/Layout';
import SiteContainer from '@/components/SiteContainer';

type TabType = 'pending' | 'history';
type FilterType = 'all' | 'payments' | 'bank_deposits' | 'topups' | 'disbursements' | 'usdt_send' | 'kyb' | 'kyc';

interface KybRegistration {
  id: number;
  chat_id: string;
  telegram_username: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string | null;
}

const filterLabels: Record<FilterType, string> = {
  kyb: 'KYB Registrations',
  all: 'All',
  payments: 'Payments',
  bank_deposits: 'Bank Deposits',
  topups: 'Top-up Requests',
  disbursements: 'Disbursements',
  usdt_send: 'USDT Send Requests',
  kyc: 'KYC Verifications',
};

const approvalPaths: Partial<Record<FilterType, string>> = {
  payments: '/payment-approvals',
  bank_deposits: '/bank-deposits',
  topups: '/topup-requests',
  disbursements: '/withdrawals',
  usdt_send: '/withdrawals/usdt-send-requests',
  kyc: '/kyc-verifications',
};

const statusConfig: Record<string, { color: string; label: string }> = {
  pending_review: { color: 'bg-amber-100 text-amber-800 border-amber-300', label: 'Pending Review' },
  in_progress: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'In Progress' },
  approved: { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Rejected' },
};


export default function Approvals() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [filter, setFilter] = useState<FilterType>('kyb');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [registrations, setRegistrations] = useState<KybRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRegistrations = useCallback(async () => {
    if (filter !== 'kyb') {
      setRegistrations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const statusParam = activeTab === 'pending' ? 'pending_review' : '';
      const url = statusParam ? `/api/v1/kyb?status=${statusParam}` : '/api/v1/kyb';
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.items || []);
      } else {
        setError('Failed to load registrations. Please try again.');
      }
    } catch (e) {
      console.error(e);
      setError('Network error while loading registrations.');
    }
    setLoading(false);
  }, [filter, activeTab]);

  useEffect(() => {
    fetchRegistrations();
    const interval = setInterval(fetchRegistrations, 30000);
    return () => clearInterval(interval);
  }, [fetchRegistrations]);

  const getStatusDisplay = (status: string) => {
    return statusConfig[status] || statusConfig.in_progress;
  };

  const fmt_time = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Layout>
      <div className="page-enter">
        {/* Page title */}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0 mb-2">
          Approvals
        </h1>
        <p className="text-sm text-slate-500 mb-6">Review and manage pending registrations and approvals</p>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-8">
          <div className="flex gap-10">
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-4 text-[13px] font-semibold transition-all border-b-2 -mb-[2px] ${
                activeTab === 'pending'
                  ? 'text-[#FF6B00] border-[#FF6B00]'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-4 text-[13px] font-semibold transition-all border-b-2 -mb-[2px] ${
                activeTab === 'history'
                  ? 'text-[#FF6B00] border-[#FF6B00]'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {/* Filter dropdown */}
        <div className="mb-6 flex items-center justify-between">
          <div className="relative inline-block">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:border-slate-300 transition-all"
            >
              <span className="text-slate-400 font-medium">{activeTab === 'pending' ? 'Show:' : 'Status:'}</span>
              <span className="text-slate-900 font-semibold">{filterLabels[filter]}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {showFilterDropdown && (
              <>
                <div
                  onClick={() => setShowFilterDropdown(false)}
                  className="fixed inset-0 z-10"
                />
                <div className="absolute top-full mt-2 left-0 w-[240px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl z-20 page-enter">
                  <div className="divide-y divide-slate-50">
                    {(Object.keys(filterLabels) as FilterType[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          const path = approvalPaths[key];
                          if (path) {
                            setShowFilterDropdown(false);
                            navigate(path);
                            return;
                          }
                          setFilter(key);
                          setShowFilterDropdown(false);
                        }}
                        className={`flex w-full items-center justify-between px-6 py-4 text-sm font-semibold transition-colors ${
                          filter === key ? 'bg-slate-50 text-[#FF6B00]' : 'text-slate-600 hover:bg-slate-50/50'
                        }`}
                      >
                        {filterLabels[key]}
                        {filter === key && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={fetchRegistrations}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Content area */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {error && (
            <div className="border-b border-slate-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
          ) : registrations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-slate-400 mb-2">
                <Clock size={32} className="mx-auto mb-2 opacity-50" />
              </div>
              <h3 className="text-slate-600 font-medium">
                {filter === 'kyb'
                  ? activeTab === 'pending'
                    ? 'No pending KYB registrations'
                    : 'No KYB registration history'
                  : 'Select an approval category'}
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                {filter === 'kyb'
                  ? 'New KYB applications will appear here'
                  : 'Use the category menu to review requests'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Telegram</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Email</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Submitted</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {registrations.map((reg) => {
                    const statusDisplay = getStatusDisplay(reg.status);
                    return (
                      <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{reg.full_name || '—'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
                            {reg.telegram_username ? `@${reg.telegram_username}` : reg.chat_id}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{reg.email || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${statusDisplay.color}`}>
                            {statusDisplay.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-xs">{fmt_time(reg.created_at)}</td>
                        <td className="px-6 py-4">
                          <a
                            href={`/kyb-registrations#${reg.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                          >
                            Review
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

