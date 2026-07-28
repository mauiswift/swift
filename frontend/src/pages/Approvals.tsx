import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Layout from '@/components/Layout';
import SiteContainer from '@/components/SiteContainer';

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
    <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-1000">
      {/* Icon illustration */}
      <div className="relative w-32 h-32 mb-10">
        {/* Outer circle icons */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3a6ad" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </div>
        <div className="absolute top-5 right-2 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3a6ad" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div className="absolute bottom-5 right-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3a6ad" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3a6ad" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div className="absolute bottom-5 left-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3a6ad" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        </div>
        <div className="absolute top-5 left-2 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3a6ad" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div className="absolute top-12 left-5 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3a6ad" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        {/* Center circle with document icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center shadow-xl">
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
      <h3 className="text-xl font-semibold tracking-tight text-slate-900 mb-2 uppercase">
        No results found
      </h3>
      <p className="text-sm font-medium text-slate-400 text-center max-w-[360px]">
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
      <div className="page-enter">
        {/* Page title */}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0 mb-10">
          Approvals
        </h1>

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
        <div className="mb-8 relative inline-block">
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

        {/* Content area */}
        <div className="bg-white border border-slate-200 rounded-xl p-12 min-h-[400px] flex items-center justify-center">
          <EmptyState />
        </div>
      </div>
    </Layout>
  );
}

