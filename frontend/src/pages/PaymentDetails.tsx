import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy } from 'lucide-react';
import Layout from '@/components/Layout';

export default function PaymentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const mockTx = {
    id: id || '019f831e-35da-be68-d6ab-3d017f1d2633',
    shortId: '7f1d2633',
    amount: 1.00,
    status: 'Pending',
    method: 'QRPH P2M',
    provider: '',
    reference: 'MP-abad6d6ca2214931af84587e0b67c865',
    institutionRef: '-',
    accountNumber: '999941465144',
    history: [
      { event: 'Payment created', date: 'Jul 21 2026, 1:20 PM' }
    ],
    commission: 'Pending',
    totalAmount: 1.00
  };

  return (
    <Layout>
      <div className="page-enter">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-6">
          <span className="cursor-pointer hover:text-slate-600" onClick={() => navigate('/payments')}>Payments</span>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-600 font-medium">Transaction details</span>
        </div>

        {/* Title row */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/payments')}
            className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 m-0">Transaction details</h1>
        </div>

        <div className="flex items-center gap-4 mb-10">
          <span className="text-4xl font-black tracking-tight text-slate-900">₱{mockTx.amount.toFixed(2)}</span>
          <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5">
             <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
             {mockTx.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
          {/* Left Column */}
          <div className="space-y-12">
            {/* History */}
            <section>
              <h2 className="text-[16px] font-bold text-slate-900 mb-6 border-b border-slate-100 pb-2">History</h2>
              <div className="space-y-6">
                {mockTx.history.map((h, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-[13px] font-bold text-slate-900">{h.event}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{h.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Payment breakdown */}
            <section>
              <h2 className="text-[16px] font-bold text-slate-900 mb-6 border-b border-slate-100 pb-2">Payment breakdown</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[13px]">
                   <span className="text-slate-500">Amount</span>
                   <span className="font-bold text-slate-900 font-mono">₱{mockTx.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                   <span className="text-slate-500">Commission</span>
                   <span className="text-slate-400">{mockTx.commission}</span>
                </div>
                <div className="flex justify-between items-center text-[13px] pt-2 border-t border-slate-50">
                   <span className="font-bold text-slate-900">Total amount</span>
                   <span className="font-black text-slate-900 font-mono">₱{mockTx.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </section>

            {/* Callback */}
            <section>
              <h2 className="text-[16px] font-bold text-slate-900 mb-6 border-b border-slate-100 pb-2">Callback</h2>
              <p className="text-[13px] text-slate-400 italic">Data not available</p>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <h2 className="text-[16px] font-bold text-slate-900 border-b border-slate-100 pb-2">Details</h2>

            <div className="space-y-6">
               <DetailRow label="Payment ID" value={mockTx.id} showCopy />
               <DetailRow label="Short ID" value={mockTx.shortId} showCopy />
               <DetailRow label="Payment method" value={mockTx.method} icon />
               <DetailRow label="Reference no" value={mockTx.reference} showCopy />
               <DetailRow label="Institution reference no" value={mockTx.institutionRef} />
               <DetailRow label="Account number" value={mockTx.accountNumber} showCopy />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function DetailRow({ label, value, showCopy, icon }: { label: string; value: string; showCopy?: boolean; icon?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
           {icon && (
             <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-slate-500">
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                 <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                 <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
               </svg>
             </div>
           )}
           <span className={`text-[13px] text-slate-600 ${showCopy ? 'font-mono' : 'font-medium'}`}>{value}</span>
        </div>
        {showCopy && (
          <button className="text-slate-300 hover:text-slate-500">
            <Copy size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
