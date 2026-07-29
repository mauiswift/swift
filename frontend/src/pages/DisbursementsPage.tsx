import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronDown, Search, Receipt, Plus
} from 'lucide-react';
import Layout from '@/components/Layout';
import { fmt, fmtCurrencyPhp } from '@/lib/format';

interface Disbursement {
  id: number;
  merchantReferenceNo: string;
  registrationTime: string | null;
  settlementTime: string | null;
  status: string;
  creditInformation: {
    amount: string | number;
    remarks: string;
  };
  recipientInformation: {
    accountNumber: string;
    firstName: string;
    lastName: string;
  };
  institutionCode: string;
}

export default function DisbursementsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState('history');
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setListLoading(true);
    try {
      const [dRes, balRes] = await Promise.all([
        client.apiCall.invoke({ url: '/api/v1/swiftpay/disbursements', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/balance?currency=PHP', method: 'GET', data: {} })
      ]);
      setDisbursements(Array.isArray(dRes.data?.data) ? dRes.data.data : []);
      if (balRes.data?.balance != null) setBalance(balRes.data.balance);
    } catch {
      setDisbursements([]);
    }
    setListLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const statusBadge = (s: string) => {
    const cfg: Record<string, string> = {
      completed: 'bg-[#F0FDFA] text-[#0D9488]',
      pending: 'bg-[#EFF6FF] text-[#2563EB]',
      failed: 'bg-[#FEF2F2] text-[#B91C1C]',
    };
    const dot: Record<string, string> = {
      completed: '#10B981',
      pending: '#3B82F6',
      failed: '#EF4444',
    };
    const labels: Record<string, string> = {
      completed: 'Executed',
      pending: 'Pending',
      failed: 'Failed',
    };
    const label = labels[s] || 'Executed';
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${cfg[s] || 'bg-slate-50 text-slate-500'} text-[11px] font-semibold capitalize`}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot[s] || '#94A3B8' }} />
        {label}
      </div>
    );
  };

  return (
    <Layout>
      <div className="page-enter">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0 mb-8">Disbursements</h1>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="bg-white border border-slate-200 rounded-xl px-8 py-5 shadow-sm min-w-[240px]">
            <p className="text-[12px] text-slate-500 mb-2 font-medium uppercase tracking-wider">Balance left</p>
            <p className="text-3xl font-semibold text-slate-900 tracking-tighter">{fmtCurrencyPhp(balance)}</p>
          </div>
          <button
            onClick={() => navigate('/disbursements/single/new')}
            className="h-11 bg-[#111111] text-white px-6 rounded-lg font-semibold text-[14px] flex items-center gap-3 shadow-lg hover:bg-black transition-all"
          >
            Send Funds
            <ChevronDown size={16} />
          </button>
        </div>

        <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-8">
          <div className="border-b border-slate-200">
            <TabsList className="flex items-center gap-8 bg-transparent p-0">
              <TabsTrigger
                value="history"
                className="pb-4 text-[13px] font-semibold transition-all border-b-2 -mb-[2px] data-[state=active]:text-[#FF6B00] data-[state=active]:border-[#FF6B00] data-[state=inactive]:text-slate-400 data-[state=inactive]:border-transparent bg-transparent rounded-none"
              >
                History
              </TabsTrigger>
              <TabsTrigger
                value="batch"
                className="pb-4 text-[13px] font-semibold transition-all border-b-2 -mb-[2px] data-[state=active]:text-[#FF6B00] data-[state=active]:border-[#FF6B00] data-[state=inactive]:text-slate-400 data-[state=inactive]:border-transparent bg-transparent rounded-none"
              >
                Batch Processing
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="history" className="mt-0 space-y-6 animate-in fade-in duration-500">
            {/* Filters */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button className="inline-flex items-center gap-2 h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:border-slate-300 transition-all">
                  <span className="text-slate-400">Range:</span>
                  <span className="text-slate-900 font-semibold">Last 7 days</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
                <button className="inline-flex items-center gap-2 h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:border-slate-300 transition-all">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-slate-900 font-semibold">All</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
              </div>

              <div className="relative w-full xl:w-80">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder="Search..."
                  className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
                />
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <p className="text-[14px] font-semibold text-slate-900 mb-6">Total count</p>
                <p className="text-3xl font-semibold text-slate-900 tracking-tight">{disbursements.length}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <p className="text-[14px] font-semibold text-slate-900 mb-6">Average amount</p>
                <p className="text-3xl font-semibold text-slate-900 tracking-tight">
                  {fmtCurrencyPhp(disbursements.length ? (disbursements.reduce((s, x) => s + (typeof (x as any).amount === 'number' ? (x as any).amount : parseFloat(String(x.creditInformation?.amount || 0))), 0) / disbursements.length) : 0)}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <p className="text-[14px] font-semibold text-slate-900 mb-6">Total amount</p>
                <p className="text-3xl font-semibold text-slate-900 tracking-tight">
                  {fmtCurrencyPhp(disbursements.reduce((s, x) => s + (typeof (x as any).amount === 'number' ? (x as any).amount : parseFloat(String(x.creditInformation?.amount || 0))), 0))}
                </p>
              </div>
            </div>

            {/* Transactions list */}
            <div>
              <h2 className="text-[16px] font-semibold text-slate-900 mb-4">Transactions history</h2>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">DISBURSEMENT</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">MERCHANT REFERENCE NUMBER</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">DATE</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {disbursements.length === 0 ? (
                      [1,2,3].map(i => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-500">
                                <Receipt size={16} />
                              </div>
                              <div>
                                <p className="text-[14px] font-semibold text-slate-900">{fmtCurrencyPhp(2983.00)}</p>
                                <p className="text-[11px] text-slate-500">InstaPay • ASIA UNITED BANK (AUBKPHMMXXX)</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] text-slate-600 font-medium">934105321485</span>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[11px] text-slate-500">Registered on: Jul 18 2026, 10:22 pm</p>
                            <p className="text-[11px] text-slate-500">Settled on: Jul 18 2026, 10:22 pm</p>
                          </td>
                          <td className="px-6 py-4">{statusBadge('completed')}</td>
                        </tr>
                      ))
                    ) : disbursements.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-500">
                              <Receipt size={16} />
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold text-slate-900">{fmtCurrencyPhp(parseFloat(String(d.creditInformation.amount)))}</p>
                              <p className="text-[11px] text-slate-500">{d.institutionCode} • {d.recipientInformation.accountNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                             <span className="text-[12px] text-slate-600 font-medium">{d.merchantReferenceNo}</span>
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                             </svg>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[11px] text-slate-500">Registered: {d.registrationTime || '—'}</p>
                          <p className="text-[11px] text-slate-500">Settled: {d.settlementTime || '—'}</p>
                        </td>
                        <td className="px-6 py-4">{statusBadge(d.status.toLowerCase())}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="batch" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Plus size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No batch processing found</h3>
                <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto">Upload a file to process multiple disbursements at once.</p>
                <Button className="bg-[#111111] text-white rounded-lg px-8">Import from file</Button>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
