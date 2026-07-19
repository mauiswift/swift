import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Layout from '@/components/Layout';

type TabType = 'pending' | 'history';
type FilterType = 'all' | 'payments' | 'disbursements' | 'kyb' | 'kyc';

const filterLabels: Record<FilterType, string> = {
  all: 'All',
  payments: 'Payments',
  disbursements: 'Disbursements',
  kyb: 'KYB Registrations',
  kyc: 'KYC Verifications',
};

function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 120, paddingBottom: 120 }}>
      {/* Icon illustration */}
      <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 28 }}>
        {/* Outer circle icons */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 24, background: '#f5f5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3a6ad" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </div>
        <div style={{ position: 'absolute', top: 18, right: 6, width: 24, height: 24, background: '#f5f5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3a6ad" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div style={{ position: 'absolute', bottom: 18, right: 0, width: 24, height: 24, background: '#f5f5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3a6ad" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 24, background: '#f5f5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3a6ad" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div style={{ position: 'absolute', bottom: 18, left: 0, width: 24, height: 24, background: '#f5f5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3a6ad" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        </div>
        <div style={{ position: 'absolute', top: 18, left: 6, width: 24, height: 24, background: '#f5f5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3a6ad" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div style={{ position: 'absolute', top: 42, left: 18, width: 24, height: 24, background: '#f5f5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3a6ad" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        {/* Center circle with document icon */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 56, height: 56, background: '#2c2c2e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
      </div>

      {/* Text */}
      <h3 style={{ fontSize: 18, fontWeight: 500, color: '#191919', margin: '0 0 8px' }}>
        No results found
      </h3>
      <p style={{ fontSize: 14, color: '#a3a6ad', textAlign: 'center', maxWidth: 360, margin: 0 }}>
        Try adjusting your search or use different criteria to find what you're looking for.
      </p>
    </div>
  );
}

export default function Approvals() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  return (
    <Layout>
      <div style={{ padding: '32px 40px' }}>
        {/* Page title */}
        <h1 style={{ fontSize: 28, fontWeight: 600, color: '#191919', margin: '0 0 28px' }}>
          Approvals
        </h1>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #e9e9e9', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 32 }}>
            <button
              onClick={() => setActiveTab('pending')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 15,
                fontWeight: 500,
                color: activeTab === 'pending' ? '#191919' : '#a3a6ad',
                padding: '12px 0',
                cursor: 'pointer',
                borderBottom: activeTab === 'pending' ? '2px solid #ffa672' : '2px solid transparent',
                marginBottom: -1,
                fontFamily: 'inherit',
              }}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 15,
                fontWeight: 500,
                color: activeTab === 'history' ? '#191919' : '#a3a6ad',
                padding: '12px 0',
                cursor: 'pointer',
                borderBottom: activeTab === 'history' ? '2px solid #ffa672' : '2px solid transparent',
                marginBottom: -1,
                fontFamily: 'inherit',
              }}
            >
              History
            </button>
          </div>
        </div>

        {/* Filter dropdown */}
        <div style={{ marginBottom: 28, position: 'relative', display: 'inline-block' }}>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#fff',
              border: '1px solid #e9e9e9',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 14,
              color: '#535353',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <span>Show: {filterLabels[filter]}</span>
            <ChevronDown size={16} color="#a3a6ad" />
          </button>

          {showFilterDropdown && (
            <>
              <div
                onClick={() => setShowFilterDropdown(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 10 }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  background: '#fff',
                  border: '1px solid #e9e9e9',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  minWidth: 180,
                  zIndex: 20,
                  overflow: 'hidden',
                }}
              >
                {(Object.keys(filterLabels) as FilterType[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setFilter(key);
                      setShowFilterDropdown(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: filter === key ? '#f5f5f5' : '#fff',
                      border: 'none',
                      padding: '10px 16px',
                      fontSize: 14,
                      color: '#191919',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {filterLabels[key]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content area */}
        {activeTab === 'pending' && <EmptyState />}
        {activeTab === 'history' && <EmptyState />}
      </div>
    </Layout>
  );
}
