import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, MoreVertical, X, Search, Check, RefreshCw, Download, FileText } from 'lucide-react';
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
      <SiteContainer>
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-7">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground m-0">
            Payments
          </h1>
          
          {/* 3-dot menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              className="p-2 rounded-md hover:bg-slate-50"
            >
              <MoreVertical size={20} color="#535353" />
            </button>

            {showMenuDropdown && (
              <>
                <div onClick={() => setShowMenuDropdown(false)} className="fixed inset-0 z-10" />
                <div className="absolute top-full mt-1 right-0 bg-white border border-slate-200 rounded-lg shadow-md min-w-[200px] z-20 overflow-hidden">
                  <button className="flex items-center gap-2 w-full text-left p-3 text-sm text-foreground hover:bg-slate-50">
                    <RefreshCw size={16} color="#535353" />
                    Refresh data
                  </button>
                  <button className="flex items-center gap-2 w-full text-left p-3 text-sm text-foreground hover:bg-slate-50">
                    <Download size={16} color="#535353" />
                    Export data
                  </button>
                  <button className="flex items-center gap-2 w-full text-left p-3 text-sm text-foreground hover:bg-slate-50">
                    <FileText size={16} color="#535353" />
                    Find by Payment Proof
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Filters ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-7">
          <div className="flex items-center gap-3">
            {/* Date range dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDateDropdown(!showDateDropdown)}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600"
              >
                <span>Created on: <strong>{dateRangeLabels[dateRange].label}</strong></span>
                <ChevronDown size={16} color="#a3a6ad" />
              </button>

              {showDateDropdown && (
                <>
                  <div onClick={() => setShowDateDropdown(false)} className="fixed inset-0 z-10" />
                  <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-md min-w-[280px] z-20 p-2">
                    <div className="px-3 pb-2 text-xs font-semibold text-muted-foreground">FILTER BY DATE</div>

                    <div className="flex gap-6 px-3 pb-3 border-b border-slate-100">
                      <button
                        onClick={() => setDateTab('created')}
                        className={`text-sm font-medium ${dateTab === 'created' ? 'text-foreground border-b-2 border-foreground' : 'text-muted-foreground'}`}
                      >
                        Created on
                      </button>
                      <button
                        onClick={() => setDateTab('executed')}
                        className={`text-sm font-medium ${dateTab === 'executed' ? 'text-foreground border-b-2 border-foreground' : 'text-muted-foreground'}`}
                      >
                        Executed on
                      </button>
                    </div>

                    <div className="py-2">
                      {(Object.keys(dateRangeLabels) as DateRange[]).map((key) => (
                        <button
                          key={key}
                          onClick={() => {
                            setDateRange(key);
                            setShowDateDropdown(false);
                          }}
                          className={`flex items-center justify-between w-full text-left p-3 text-sm ${dateRange === key ? 'bg-slate-50' : 'bg-white'}`}
                        >
                          <div>
                            <div className="font-medium">{dateRangeLabels[key].label}</div>
                            {dateRangeLabels[key].dates && (
                              <div className="text-xs text-muted-foreground mt-1">{dateRangeLabels[key].dates}</div>
                            )}
                          </div>
                          {dateRange === key && <Check size={16} color="#0ea5e9" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Status dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600"
              >
                <span>Status: <strong>{statusLabels[status]}</strong></span>
                <ChevronDown size={16} color="#a3a6ad" />
              </button>

              {showStatusDropdown && (
                <>
                  <div onClick={() => setShowStatusDropdown(false)} className="fixed inset-0 z-10" />
                  <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-md min-w-[160px] z-20 overflow-hidden">
                    {(Object.keys(statusLabels) as Status[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          setStatus(key);
                          setShowStatusDropdown(false);
                        }}
                        className={`flex items-center justify-between w-full text-left p-3 text-sm ${status === key ? 'bg-slate-50' : 'bg-white'}`}
                      >
                        {statusLabels[key]}
                        {status === key && <Check size={16} color="#0ea5e9" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* More button */}
            <button
              onClick={() => setShowFilterModal(true)}
              className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
              More
            </button>
          </div>

          {/* Search box (right) */}
          <div className="ml-auto relative w-full sm:w-72">
            <Search size={16} color="#a3a6ad" className="absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none"
            />
          </div>
        </div>

        {/* ── Stats cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Transactions</div>
            <div className="text-2xl font-semibold text-foreground">{transactions}</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Total amount</div>
            <div className="text-2xl font-semibold text-foreground">₱{totalAmount.toFixed(2)}</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Average amount</div>
            <div className="text-2xl font-semibold text-foreground">₱{avgAmount.toFixed(2)}</div>
          </div>
        </div>

        {/* ── Transactions table ─────────────────────────────────── */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#191919', margin: '0 0 20px' }}>Transactions history</h2>

          <div className="bg-white border rounded-lg overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_2fr_2fr_1.5fr] p-4 bg-slate-50 border-b border-slate-200">
              <div className="text-xs font-semibold text-muted-foreground">PAYMENT</div>
              <div className="text-xs font-semibold text-muted-foreground">REFERENCE NO</div>
              <div className="text-xs font-semibold text-muted-foreground">DATE</div>
              <div className="text-xs font-semibold text-muted-foreground">PAYMENT STATUS</div>
            </div>

            {/* Table rows */}
            {mockPayments.map((payment, idx) => (
              <div
                key={payment.id}
                onClick={() => navigate(`/payments/${payment.id}`)}
                className={`grid grid-cols-[2fr_2fr_2fr_1.5fr] p-4 ${idx < mockPayments.length - 1 ? 'border-b border-slate-100' : ''} items-center cursor-pointer hover:bg-slate-50`}
              >
                {/* Payment column */}
                <div className="flex items-center gap-3">
                  {getPaymentIcon(payment.method)}
                  <div>
                    <div className="text-base font-medium text-foreground mb-0.5">₱{payment.amount.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">{payment.provider && `${payment.provider} • `}{payment.method}</div>
                  </div>
                </div>

                {/* Reference column */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-700 font-mono">{payment.reference}</span>
                  <button className="p-1 opacity-70">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3a6ad" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                </div>

                {/* Date column */}
                <div>
                  <div className="text-sm text-slate-700 mb-0.5">Created on: {payment.createdAt}</div>
                  <div className="text-sm text-muted-foreground">Executed on: {payment.executedAt || '—'}</div>
                </div>

                {/* Status column */}
                <div>
                  <span className={`${getStatusBadge(payment.status)} inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium`}>
                    <span className="w-2 h-2 rounded-full" style={{ background: 'currentColor' }} />
                    {statusLabels[payment.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: 500, color: '#191919' }}>Amount</label>
                  <button style={{ background: 'none', border: 'none', fontSize: 13, color: '#0ea5e9', cursor: 'pointer', fontFamily: 'inherit' }}>Clear</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#a3a6ad', marginBottom: 6 }}>From</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={filterAmountFrom}
                      onChange={(e) => setFilterAmountFrom(e.target.value)}
                      style={{ width: '100%', fontSize: 14, color: '#191919', background: '#fff', border: '1px solid #e9e9e9', borderRadius: 8, padding: '10px 14px', outline: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#a3a6ad', marginBottom: 6 }}>To</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={filterAmountTo}
                      onChange={(e) => setFilterAmountTo(e.target.value)}
                      style={{ width: '100%', fontSize: 14, color: '#191919', background: '#fff', border: '1px solid #e9e9e9', borderRadius: 8, padding: '10px 14px', outline: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ display: 'flex', gap: 12, padding: '20px 24px', borderTop: '1px solid #e9e9e9' }}>
              <button
                onClick={() => {
                  setFilterMethod('all');
                  setFilterAmountFrom('');
                  setFilterAmountTo('');
                }}
                style={{ flex: 1, background: '#fff', color: '#535353', fontFamily: 'inherit', fontSize: 15, fontWeight: 500, border: '1px solid #e9e9e9', borderRadius: 8, padding: '12px', cursor: 'pointer' }}
              >
                Reset all
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                style={{ flex: 1, background: '#191919', color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 500, border: 'none', borderRadius: 8, padding: '12px', cursor: 'pointer' }}
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
