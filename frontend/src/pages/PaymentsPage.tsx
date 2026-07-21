import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, MoreVertical, X, Search, Check, RefreshCw, Download, FileText, SlidersHorizontal } from 'lucide-react';
import Layout from '@/components/Layout';
import SiteContainer from '@/components/SiteContainer';

type DateTab = 'created' | 'executed';
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

const mockPayments: Payment[] = [
  { id: '1', amount: 100.00, method: 'Transfer', provider: 'Maya', reference: 'E1316', createdAt: 'Jul 18 2026, 10:30 pm', executedAt: null, status: 'expired' },
  { id: '2', amount: 100.00, method: 'Transfer', provider: 'Maya', reference: 'E1316', createdAt: 'Jul 18 2026, 10:30 pm', executedAt: null, status: 'canceled' },
  { id: '3', amount: 100.00, method: 'Transfer', provider: 'RCBC', reference: 'E0915', createdAt: 'Jul 18 2026, 9:30 pm', executedAt: null, status: 'expired' },
  { id: '4', amount: 102.00, method: 'QRPH P2M', provider: 'MAYA', reference: 'GCYARDTE13T20260718220158718CE5', createdAt: 'Jul 18 2026, 6:02 am', executedAt: 'Jul 18 2026, 6:02 am', status: 'executed' },
  { id: '5', amount: 101.00, method: 'QRPH P2M', provider: 'MAYA', reference: 'GCYARDTE13T20260718204457648324', createdAt: 'Jul 18 2026, 4:45 am', executedAt: 'Jul 18 2026, 4:45 am', status: 'executed' },
  { id: '6', amount: 100.00, method: 'Transfer', provider: '', reference: 'GCYARDTE13T20260713121494818E4FEA', createdAt: 'Jul 14 2026, 7:49 am', executedAt: null, status: 'expired' },
  { id: '7', amount: 13.00, method: 'QRPH P2M', provider: 'MAYA', reference: 'GCYARDTE13T20260712171925E08A98', createdAt: 'Jul 14 2026, 1:16 am', executedAt: 'Jul 14 2026, 1:16 am', status: 'executed' },
  { id: '8', amount: 12.00, method: 'QRPH P2M', provider: 'MAYA', reference: 'GCYARDTE13T202607121075884521C5', createdAt: 'Jul 14 2026, 1:07 am', executedAt: 'Jul 14 2026, 1:08 am', status: 'executed' },
];

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('last7');
  const [dateTab, setDateTab] = useState<DateTab>('created');
  const [status, setStatus] = useState<Status>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dropdown states
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);

  // Filter modal states
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterAmountFrom, setFilterAmountFrom] = useState('');
  const [filterAmountTo, setFilterAmountTo] = useState('');

  const transactions = mockPayments.length;
  const totalAmount = mockPayments.reduce((sum, p) => sum + p.amount, 0);
  const avgAmount = totalAmount / transactions;

  const getStatusBadge = (status: Status) => {
    const styles: Record<Status, string> = {
      all: '',
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      executed: 'bg-teal-100 text-teal-700 border-teal-200',
      canceled: 'bg-gray-100 text-gray-600 border-gray-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      expired: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return styles[status] || '';
  };

  const getPaymentIcon = (method: string) => {
    if (method.includes('QR') || method.includes('QRPH')) {
      return (
        <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#535353" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#535353" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
    );
  };

  return (
    <Layout>
      <SiteContainer className="pb-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground">Payments</h1>

          <div className="relative">
            <button
              onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:bg-slate-50 transition"
              aria-label="More actions"
            >
              <MoreVertical size={20} />
            </button>

            {showMenuDropdown && (
              <>
                <div onClick={() => setShowMenuDropdown(false)} className="fixed inset-0 z-10" />
                <div className="absolute right-0 top-full mt-2 w-[220px] rounded-2xl border border-slate-200 bg-white shadow-lg z-20 overflow-hidden">
                  <button className="flex items-center gap-2 w-full text-left p-3 text-sm text-slate-700 hover:bg-slate-50">
                    <RefreshCw size={16} />
                    Refresh data
                  </button>
                  <button className="flex items-center gap-2 w-full text-left p-3 text-sm text-slate-700 hover:bg-slate-50">
                    <Download size={16} />
                    Export data
                  </button>
                  <button className="flex items-center gap-2 w-full text-left p-3 text-sm text-slate-700 hover:bg-slate-50">
                    <FileText size={16} />
                    Find by Payment Proof
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowDateDropdown(!showDateDropdown)}
                className="inline-flex items-center gap-2 h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 transition"
              >
                <span className="text-slate-500">Created on:</span>
                <span className="font-semibold text-slate-900">{dateRangeLabels[dateRange].label}</span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>

              {showDateDropdown && (
                <>
                  <div onClick={() => setShowDateDropdown(false)} className="fixed inset-0 z-10" />
                  <div className="absolute left-0 top-full z-20 mt-2 w-[300px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
                    <div className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Filter by date</div>
                    <div className="flex gap-4 px-4 pb-4 border-b border-slate-200">
                      <button
                        onClick={() => setDateTab('created')}
                        className={`rounded-full px-3 py-2 text-sm font-semibold ${dateTab === 'created' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500'}`}
                      >
                        Created on
                      </button>
                      <button
                        onClick={() => setDateTab('executed')}
                        className={`rounded-full px-3 py-2 text-sm font-semibold ${dateTab === 'executed' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500'}`}
                      >
                        Executed on
                      </button>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {(Object.keys(dateRangeLabels) as DateRange[]).map((key) => (
                        <button
                          key={key}
                          onClick={() => {
                            setDateRange(key);
                            setShowDateDropdown(false);
                          }}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm ${dateRange === key ? 'bg-slate-50 text-slate-900' : 'text-slate-600'}`}
                        >
                          <div>
                            <div className="font-semibold">{dateRangeLabels[key].label}</div>
                            {dateRangeLabels[key].dates && (
                              <div className="text-xs text-slate-500 mt-1">{dateRangeLabels[key].dates}</div>
                            )}
                          </div>
                          {dateRange === key && <Check size={16} className="text-slate-900" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="inline-flex items-center gap-2 h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 transition"
              >
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold text-slate-900">{statusLabels[status]}</span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>

              {showStatusDropdown && (
                <>
                  <div onClick={() => setShowStatusDropdown(false)} className="fixed inset-0 z-10" />
                  <div className="absolute left-0 top-full z-20 mt-2 w-[200px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
                    {(Object.keys(statusLabels) as Status[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          setStatus(key);
                          setShowStatusDropdown(false);
                        }}
                        className={`flex w-full items-center justify-between px-4 py-3 text-sm ${status === key ? 'bg-slate-50 text-slate-900' : 'text-slate-600'}`}
                      >
                        {statusLabels[key]}
                        {status === key && <Check size={16} className="text-slate-900" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowFilterModal(true)}
              className="inline-flex items-center justify-center h-11 rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 transition"
            >
              More
            </button>
          </div>

          <div className="ml-auto w-full xl:w-80">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Transactions</p>
            <p className="mt-4 text-4xl font-black tracking-tight text-slate-900">{transactions}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total amount</p>
            <p className="mt-4 text-4xl font-black tracking-tight text-slate-900">₱{totalAmount.toFixed(2)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Average amount</p>
            <p className="mt-4 text-4xl font-black tracking-tight text-slate-900">₱{avgAmount.toFixed(2)}</p>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Transactions history</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-[2.5fr_2fr_3fr_1.5fr] items-center gap-0 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            <div>PAYMENT</div>
            <div>REFERENCE NO</div>
            <div>DATE</div>
            <div>PAYMENT STATUS</div>
          </div>

          {mockPayments.map((payment, idx) => (
            <div
              key={payment.id}
              onClick={() => navigate(`/payments/${payment.id}`)}
              className={`grid grid-cols-[2.5fr_2fr_3fr_1.5fr] gap-0 items-center px-5 py-5 ${idx < mockPayments.length - 1 ? 'border-b border-slate-100' : ''} cursor-pointer hover:bg-slate-50 transition`}
            >
              <div className="flex items-center gap-3">
                {getPaymentIcon(payment.method)}
                <div>
                  <div className="text-base font-semibold text-slate-900">₱{payment.amount.toFixed(2)}</div>
                  <div className="text-sm text-slate-500">{payment.provider && `${payment.provider} • `}{payment.method}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span className="font-mono">{payment.reference}</span>
                <button type="button" className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>

              <div>
                <div className="text-sm text-slate-700 mb-1">Created on: {payment.createdAt}</div>
                <div className="text-sm text-slate-500">Executed on: {payment.executedAt || '—'}</div>
              </div>

              <div>
                <span className={`${getStatusBadge(payment.status)} inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold`}>
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {statusLabels[payment.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SiteContainer>

      {/* ── Filter Modal ───────────────────────────────────────── */}
      {showFilterModal && (
        <>
          <div onClick={() => setShowFilterModal(false)} className="fixed inset-0 bg-black/40 z-50" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg w-full max-w-md z-60 shadow-lg">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-foreground m-0">Filter</h3>
              <button onClick={() => setShowFilterModal(false)} className="p-1">
                <X size={20} color="#535353" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6">
              {/* Method */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">Method</label>
                  <button className="text-sm text-blue-500">Clear</button>
                </div>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="w-full text-sm text-foreground bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="transfer">Transfer</option>
                  <option value="qrph">QRPH P2M</option>
                  <option value="card">Card</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">Amount</label>
                  <button className="text-sm text-blue-500">Clear</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">From</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={filterAmountFrom}
                      onChange={(e) => setFilterAmountFrom(e.target.value)}
                      className="w-full text-sm text-foreground bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">To</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={filterAmountTo}
                      onChange={(e) => setFilterAmountTo(e.target.value)}
                      className="w-full text-sm text-foreground bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 p-5 border-t border-slate-200">
              <button
                onClick={() => {
                  setFilterMethod('all');
                  setFilterAmountFrom('');
                  setFilterAmountTo('');
                }}
                className="flex-1 bg-white text-slate-700 text-sm font-medium border border-slate-200 rounded-lg px-4 py-3"
              >
                Reset all
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="flex-1 bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-3"
              >
                Apply now
              </button>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
