import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, FileText } from 'lucide-react';
import Layout from '@/components/Layout';

export default function DisbursementDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const mockDb = {
    id: id || '019f759b-5ba6-d77d-564d-91dd5edc274d',
    shortId: 'dd5edc274d',
    amount: 2983.00,
    commission: 10.00,
    totalAmount: 2993.00,
    status: 'Executed',
    destination: 'InstaPay • ASIA UNITED BANK (AUBKPHMMXXX)',
    reference: '934105321485',
    channelRef: '202619900195553',
    recipientName: 'Den Russell Leonardo',
    recipientAccount: '934105321485',
    history: [
      { event: 'Disbursement settled', date: 'Jul 18 2026, 10:22 PM' },
      { event: 'Disbursement registered', date: 'Jul 18 2026, 10:22 PM' }
    ]
  };

  return (
    <Layout>
      <div className="page-enter">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-6">
          <span className="cursor-pointer hover:text-slate-600" onClick={() => navigate('/disbursements')}>Disbursements</span>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-600 font-medium">Disbursement details</span>
        </div>

        {/* Title row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/disbursements')}
              className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">Disbursement details</h1>
          </div>

          <button className="flex items-center gap-2 text-[12px] font-semibold text-slate-900 hover:text-[#FF6B00] transition-colors">
            <FileText size={16} />
            Download confirmation
          </button>
        </div>

        <div className="flex items-center gap-4 mb-10">
          <span className="text-4xl font-semibold tracking-tight text-slate-900">₱{mockDb.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          <span className="bg-[#F0FDFA] text-[#0D9488] border border-teal-100 px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5">
             <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
             {mockDb.status}
          </span>
          <div className="ml-auto">
             <img src="/logos/instapay.svg" alt="InstaPay" className="h-6 opacity-80" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
          {/* Left Column */}
          <div className="space-y-12">
            {/* History */}
            <section>
              <h2 className="text-[16px] font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-2">History</h2>
              <div className="space-y-6">
                {mockDb.history.map((h, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${i === 0 ? 'bg-teal-400' : 'bg-slate-200'}`} />
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">{h.event}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{h.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Disbursement breakdown */}
            <section>
              <h2 className="text-[16px] font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-2">Disbursement breakdown</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[13px]">
                   <span className="text-slate-500">Amount</span>
                   <span className="font-semibold text-slate-900 font-mono">₱{mockDb.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                   <span className="text-slate-500">Commission</span>
                   <span className="font-semibold text-slate-900 font-mono">₱{mockDb.commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-[13px] pt-2 border-t border-slate-50">
                   <span className="font-semibold text-slate-900">Total amount</span>
                   <span className="font-semibold text-slate-900 font-mono">₱{mockDb.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </section>

            {/* Callback */}
            <section>
              <h2 className="text-[16px] font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-2">Callback</h2>
              <div>
                 <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1">Status</p>
                 <div className="flex items-center gap-2">
                    <span className="text-rose-500">
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                       </svg>
                    </span>
                    <span className="text-[13px] font-semibold text-slate-700">Error</span>
                 </div>
                 <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-6 mb-1">Executed on</p>
                 <p className="text-[13px] text-slate-400">-</p>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <h2 className="text-[16px] font-semibold text-slate-900 border-b border-slate-100 pb-2">Details</h2>

            <div className="space-y-6">
               <DetailRow label="Disbursement ID" value={mockDb.id} showCopy />
               <DetailRow label="Short ID" value={mockDb.shortId} showCopy />
               <DetailRow label="Destination" value={mockDb.destination} />
               <DetailRow label="Merchant reference number" value={mockDb.reference} showCopy />
               <DetailRow label="Channel reference number" value={mockDb.channelRef} />
               <DetailRow label="Recipient name" value={mockDb.recipientName} />
               <DetailRow label="Recipient account number" value={mockDb.recipientAccount} showCopy />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function DetailRow({ label, value, showCopy }: { label: string; value: string; showCopy?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[13px] text-slate-600 ${showCopy ? 'font-mono' : 'font-medium'}`}>{value}</span>
        {showCopy && (
          <button className="text-slate-300 hover:text-slate-500">
            <Copy size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
