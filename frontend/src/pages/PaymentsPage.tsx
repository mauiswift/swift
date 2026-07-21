import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, MoreVertical, X, Search, Check, RefreshCw, Download, FileText } from 'lucide-react';
import Layout from '@/components/Layout';

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
        <div style={{ width: 32, height: 32, background: '#f5f5f5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      <div style={{ width: 32, height: 32, background: '#f5f5f5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#535353" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
    );
  };

  return (
    <Layout>
      <div className="px-4 md:px-6 lg:px-10">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-7">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground m-0">
            Payments
          </h1>
          
          {/* 3-dot menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', borderRadius: 6 }}
            >
              <MoreVertical size={20} color="#535353" />
            </button>

            {showMenuDropdown && (
              <>
                <div onClick={() => setShowMenuDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: '#fff', border: '1px solid #e9e9e9', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: 200, zIndex: 20, overflow: 'hidden' }}>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: '#fff', border: 'none', padding: '12px 16px', fontSize: 14, color: '#191919', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <RefreshCw size={16} color="#535353" />
                    Refresh data
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: '#fff', border: 'none', padding: '12px 16px', fontSize: 14, color: '#191919', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Download size={16} color="#535353" />
                    Export data
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: '#fff', border: 'none', padding: '12px 16px', fontSize: 14, color: '#191919', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <FileText size={16} color="#535353" />
                    Find by Payment Proof
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Filters ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          {/* Date range dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e9e9e9', borderRadius: 8, padding: '8px 14px', fontSize: 14, color: '#535353', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <span>Created on: <strong>{dateRangeLabels[dateRange].label}</strong></span>
              <ChevronDown size={16} color="#a3a6ad" />
            </button>

            {showDateDropdown && (
              <>
                <div onClick={() => setShowDateDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, background: '#fff', border: '1px solid #e9e9e9', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: 280, zIndex: 20, padding: '16px 0' }}>
                  <div style={{ padding: '0 16px 12px', fontSize: 11, fontWeight: 600, color: '#a3a6ad', letterSpacing: '0.5px' }}>FILTER BY DATE</div>
                  
                  {/* Tabs */}
                  <div style={{ display: 'flex', gap: 24, padding: '0 16px 12px', borderBottom: '1px solid #e9e9e9' }}>
                    <button
                      onClick={() => setDateTab('created')}
                      style={{ background: 'none', border: 'none', fontSize: 14, fontWeight: 500, color: dateTab === 'created' ? '#191919' : '#a3a6ad', padding: '8px 0', cursor: 'pointer', borderBottom: dateTab === 'created' ? '2px solid #191919' : 'none', marginBottom: -2, fontFamily: 'inherit' }}
                    >
                      Created on
                    </button>
                    <button
                      onClick={() => setDateTab('executed')}
                      style={{ background: 'none', border: 'none', fontSize: 14, fontWeight: 500, color: dateTab === 'executed' ? '#191919' : '#a3a6ad', padding: '8px 0', cursor: 'pointer', borderBottom: dateTab === 'executed' ? '2px solid #191919' : 'none', marginBottom: -2, fontFamily: 'inherit' }}
                    >
                      Executed on
                    </button>
                  </div>

                  {/* Date range options */}
                  <div style={{ padding: '8px 0' }}>
                    {(Object.keys(dateRangeLabels) as DateRange[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          setDateRange(key);
                          setShowDateDropdown(false);
                        }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left', background: dateRange === key ? '#f5f5f5' : '#fff', border: 'none', padding: '10px 16px', fontSize: 14, color: '#191919', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        <div>
                          <div style={{ fontWeight: 500 }}>{dateRangeLabels[key].label}</div>
                          {dateRangeLabels[key].dates && (
                            <div style={{ fontSize: 12, color: '#a3a6ad', marginTop: 2 }}>{dateRangeLabels[key].dates}</div>
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
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e9e9e9', borderRadius: 8, padding: '8px 14px', fontSize: 14, color: '#535353', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <span>Status: <strong>{statusLabels[status]}</strong></span>
              <ChevronDown size={16} color="#a3a6ad" />
            </button>

            {showStatusDropdown && (
              <>
                <div onClick={() => setShowStatusDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, background: '#fff', border: '1px solid #e9e9e9', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: 160, zIndex: 20, overflow: 'hidden' }}>
                  {(Object.keys(statusLabels) as Status[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setStatus(key);
                        setShowStatusDropdown(false);
                      }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left', background: status === key ? '#f5f5f5' : '#fff', border: 'none', padding: '10px 16px', fontSize: 14, color: '#191919', cursor: 'pointer', fontFamily: 'inherit' }}
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
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e9e9e9', borderRadius: 8, padding: '8px 14px', fontSize: 14, color: '#535353', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
            More
          </button>

          {/* Search box */}
          <div style={{ marginLeft: 'auto', position: 'relative', width: 280 }}>
            <Search size={16} color="#a3a6ad" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', fontSize: 14, color: '#191919', background: '#fff', border: '1px solid #e9e9e9', borderRadius: 8, padding: '8px 14px 8px 38px', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* ── Stats cards ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 13, color: '#a3a6ad', marginBottom: 6 }}>Transactions</div>
            <div style={{ fontSize: 32, fontWeight: 600, color: '#191919' }}>{transactions}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#a3a6ad', marginBottom: 6 }}>Total amount</div>
            <div style={{ fontSize: 32, fontWeight: 600, color: '#191919' }}>₱{totalAmount.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#a3a6ad', marginBottom: 6 }}>Average amount</div>
            <div style={{ fontSize: 32, fontWeight: 600, color: '#191919' }}>₱{avgAmount.toFixed(2)}</div>
          </div>
        </div>

        {/* ── Transactions table ─────────────────────────────────── */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#191919', margin: '0 0 20px' }}>Transactions history</h2>

          <div style={{ background: '#fff', border: '1px solid #e9e9e9', borderRadius: 12, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 1.5fr', padding: '14px 20px', background: '#f5f5f5', borderBottom: '1px solid #e9e9e9' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#a3a6ad', letterSpacing: '0.5px' }}>PAYMENT</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#a3a6ad', letterSpacing: '0.5px' }}>REFERENCE NO</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#a3a6ad', letterSpacing: '0.5px' }}>DATE</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#a3a6ad', letterSpacing: '0.5px' }}>PAYMENT STATUS</div>
            </div>

            {/* Table rows */}
            {mockPayments.map((payment, idx) => (
              <div
                key={payment.id}
                onClick={() => navigate(`/payments/${payment.id}`)}
                style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 1.5fr', padding: '16px 20px', borderBottom: idx < mockPayments.length - 1 ? '1px solid #e9e9e9' : 'none', alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s', background: '#fff' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
              >
                {/* Payment column */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {getPaymentIcon(payment.method)}
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: '#191919', marginBottom: 2 }}>
                      ₱{payment.amount.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 13, color: '#a3a6ad' }}>
                      {payment.provider && `${payment.provider} • `}{payment.method}
                    </div>
                  </div>
                </div>

                {/* Reference column */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, color: '#535353', fontFamily: 'monospace' }}>{payment.reference}</span>
                  <button style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', opacity: 0.6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3a6ad" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                </div>

                {/* Date column */}
                <div>
                  <div style={{ fontSize: 13, color: '#535353', marginBottom: 2 }}>
                    Created on: {payment.createdAt}
                  </div>
                  <div style={{ fontSize: 13, color: '#a3a6ad' }}>
                    Executed on: {payment.executedAt || '—'}
                  </div>
                </div>

                {/* Status column */}
                <div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, border: '1px solid', borderRadius: 6, padding: '4px 10px' }} className={getStatusBadge(payment.status)}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                    {statusLabels[payment.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter Modal ───────────────────────────────────────── */}
      {showFilterModal && (
        <>
          <div onClick={() => setShowFilterModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, zIndex: 60, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e9e9e9' }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#191919', margin: 0 }}>Filter</h3>
              <button onClick={() => setShowFilterModal(false)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                <X size={20} color="#535353" />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: 24 }}>
              {/* Method */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: 500, color: '#191919' }}>Method</label>
                  <button style={{ background: 'none', border: 'none', fontSize: 13, color: '#0ea5e9', cursor: 'pointer', fontFamily: 'inherit' }}>Clear</button>
                </div>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  style={{ width: '100%', fontSize: 14, color: '#191919', background: '#fff', border: '1px solid #e9e9e9', borderRadius: 8, padding: '10px 14px', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
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
