import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Layout from '@/components/Layout';
import SiteContainer from '@/components/SiteContainer';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { language } = useLanguage();
  const isKorean = language === 'ko';
  const tx = (en: string, ko: string) => isKorean ? ko : en;
  const localizedFilterLabels: Record<FilterType, string> = isKorean
    ? { kyb: 'KYB 등록', all: '전체', payments: '결제', bank_deposits: '은행 입금', topups: '충전 요청', disbursements: '지급', usdt_send: 'USDT 전송 요청', kyc: 'KYC 인증' }
    : filterLabels;
  const localizedStatusLabels: Record<string, string> = isKorean
    ? { pending_review: '검토 대기', in_progress: '진행 중', approved: '승인됨', rejected: '거부됨' }
    : Object.fromEntries(Object.entries(statusConfig).map(([key, value]) => [key, value.label]));
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
        setError(isKorean ? '등록을 불러오지 못했습니다. 다시 시도해 주세요.' : 'Failed to load registrations. Please try again.');
      }
    } catch (e) {
      console.error(e);
      setError(isKorean ? '등록을 불러오는 중 네트워크 오류가 발생했습니다.' : 'Network error while loading registrations.');
    }
    setLoading(false);
  }, [filter, activeTab, isKorean]);

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
    return new Date(dateStr).toLocaleDateString(isKorean ? 'ko-KR' : 'en-US', {
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
          {tx('Approvals', '승인')}
        </h1>
        <p className="text-sm text-slate-500 mb-6">{tx('Review and manage pending registrations and approvals', '대기 중인 등록 및 승인 요청을 검토하고 관리하세요')}</p>

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
              {tx('Pending', '대기 중')}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-4 text-[13px] font-semibold transition-all border-b-2 -mb-[2px] ${
                activeTab === 'history'
                  ? 'text-[#FF6B00] border-[#FF6B00]'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              {tx('History', '기록')}
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
              <span className="text-slate-400 font-medium">{activeTab === 'pending' ? tx('Show:', '표시:') : tx('Status:', '상태:')}</span>
              <span className="text-slate-900 font-semibold">{localizedFilterLabels[filter]}</span>
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
                        {localizedFilterLabels[key]}
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
            <RefreshCw size={14} /> {tx('Refresh', '새로고침')}
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
                    ? tx('No pending KYB registrations', '대기 중인 KYB 등록이 없습니다')
                    : tx('No KYB registration history', 'KYB 등록 기록이 없습니다')
                  : tx('Select an approval category', '승인 카테고리를 선택하세요')}
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                {filter === 'kyb'
                  ? tx('New KYB applications will appear here', '새 KYB 신청이 여기에 표시됩니다')
                  : tx('Use the category menu to review requests', '카테고리 메뉴에서 요청을 검토하세요')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">{tx('Name', '이름')}</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Telegram</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">Email</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">{tx('Status', '상태')}</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">{tx('Submitted', '제출일')}</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">{tx('Action', '작업')}</th>
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
                            {localizedStatusLabels[reg.status] || statusDisplay.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-xs">{fmt_time(reg.created_at)}</td>
                        <td className="px-6 py-4">
                          <a
                            href={`/kyb-registrations#${reg.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                          >
                            {tx('Review', '검토')}
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
