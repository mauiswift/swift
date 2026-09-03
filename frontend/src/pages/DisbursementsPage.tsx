import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronDown, Search, Receipt, Plus
} from 'lucide-react';
import Layout from '@/components/Layout';
import { fmt, fmtCurrency } from '@/lib/format';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { collectionCurrency } = useCollectionCurrency();
  const { language } = useLanguage();
  const isKorean = language === 'ko';
  const ui = isKorean ? {
    title: '출금', balance: '잔액', send: '자금 보내기', history: '기록', batch: '일괄 처리',
    range: '기간:', last7: '최근 7일', status: '상태:', all: '전체', search: '검색...',
    total: '총 건수', average: '평균 금액', totalAmount: '총 금액', transactions: '거래 내역',
    empty: '출금 내역이 없습니다', disbursement: '출금', reference: '가맹점 참조 번호', date: '날짜',
    statusLabel: '상태', registered: '등록:', settled: '정산:', noBatch: '일괄 처리 내역이 없습니다',
    upload: '파일을 업로드하여 여러 출금을 한 번에 처리하세요.', importFile: '파일에서 가져오기',
  } : {
    title: 'Disbursements', balance: 'Balance left', send: 'Send Funds', history: 'History', batch: 'Batch Processing',
    range: 'Range:', last7: 'Last 7 days', status: 'Status:', all: 'All', search: 'Search...',
    total: 'Total count', average: 'Average amount', totalAmount: 'Total amount', transactions: 'Transactions history',
    empty: 'No disbursement history found.', disbursement: 'Disbursement', reference: 'Merchant reference number', date: 'Date',
    statusLabel: 'Status', registered: 'Registered:', settled: 'Settled:', noBatch: 'No batch processing found',
    upload: 'Upload a file to process multiple disbursements at once.', importFile: 'Import from file',
  };
  const [mainTab, setMainTab] = useState('history');
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setListLoading(true);
    try {
      const [dRes, balRes] = await Promise.all([
        client.apiCall.invoke({ url: `/api/v1/swiftpay/disbursements?currency=${collectionCurrency}`, method: 'GET', data: {} }),
        client.apiCall.invoke({ url: `/api/v1/wallet/balance?currency=${collectionCurrency}`, method: 'GET', data: {} })
      ]);
      setDisbursements(Array.isArray(dRes.data?.data) ? dRes.data.data : []);
      if (balRes.data?.balance != null) setBalance(balRes.data.balance);
    } catch {
      setDisbursements([]);
    }
    setListLoading(false);
  }, [user, collectionCurrency]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const statusBadge = (s: string) => {
    const cfg: Record<string, string> = {
      completed: 'bg-[#F0FDFA] text-[#0D9488]',
      pending: 'bg-[#EFF6FF] text-[#2563EB]',
      transferring: 'bg-[#FFF7ED] text-[#C2410C]',
      failed: 'bg-[#FEF2F2] text-[#B91C1C]',
    };
    const dot: Record<string, string> = {
      completed: '#10B981',
      pending: '#3B82F6',
      transferring: '#F97316',
      failed: '#EF4444',
    };
    const labels: Record<string, string> = {
      completed: isKorean ? '실행됨' : 'Executed',
      pending: isKorean ? '대기 중' : 'Pending',
      transferring: isKorean ? '이체 중' : 'Transferring',
      failed: isKorean ? '실패' : 'Failed',
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
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0 mb-8">{ui.title}</h1>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="bg-white border border-slate-200 rounded-xl px-8 py-5 shadow-sm min-w-[240px]">
            <p className="text-[12px] text-slate-500 mb-2 font-medium uppercase tracking-wider">{ui.balance}</p>
            <p className="text-3xl font-semibold text-slate-900 tracking-tighter">{fmtCurrency(balance, collectionCurrency)}</p>
          </div>
          <button
            onClick={() => navigate('/disbursements/single/new')}
            className="h-11 bg-[#111111] text-white px-6 rounded-lg font-semibold text-[14px] flex items-center gap-3 shadow-lg hover:bg-black transition-all"
          >
            {ui.send}
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
                {ui.history}
              </TabsTrigger>
              <TabsTrigger
                value="batch"
                className="pb-4 text-[13px] font-semibold transition-all border-b-2 -mb-[2px] data-[state=active]:text-[#FF6B00] data-[state=active]:border-[#FF6B00] data-[state=inactive]:text-slate-400 data-[state=inactive]:border-transparent bg-transparent rounded-none"
              >
                {ui.batch}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="history" className="mt-0 space-y-6 animate-in fade-in duration-500">
            {/* Filters */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button className="inline-flex items-center gap-2 h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:border-slate-300 transition-all">
                  <span className="text-slate-400">{ui.range}</span>
                  <span className="text-slate-900 font-semibold">{ui.last7}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
                <button className="inline-flex items-center gap-2 h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:border-slate-300 transition-all">
                  <span className="text-slate-400">{ui.status}</span>
                  <span className="text-slate-900 font-semibold">{ui.all}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
              </div>

              <div className="relative w-full xl:w-80">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder={ui.search}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
                />
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <p className="text-[14px] font-semibold text-slate-900 mb-6">{ui.total}</p>
                <p className="text-3xl font-semibold text-slate-900 tracking-tight">{disbursements.length}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <p className="text-[14px] font-semibold text-slate-900 mb-6">{ui.average}</p>
                <p className="text-3xl font-semibold text-slate-900 tracking-tight">
                  {fmtCurrency(disbursements.length ? (disbursements.reduce((s, x) => s + (typeof (x as any).amount === 'number' ? (x as any).amount : parseFloat(String(x.creditInformation?.amount || 0))), 0) / disbursements.length) : 0, collectionCurrency)}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <p className="text-[14px] font-semibold text-slate-900 mb-6">{ui.totalAmount}</p>
                <p className="text-3xl font-semibold text-slate-900 tracking-tight">
                  {fmtCurrency(disbursements.reduce((s, x) => s + (typeof (x as any).amount === 'number' ? (x as any).amount : parseFloat(String(x.creditInformation?.amount || 0))), 0), collectionCurrency)}
                </p>
              </div>
            </div>

            {/* Transactions list */}
            <div>
              <h2 className="text-[16px] font-semibold text-slate-900 mb-4">{ui.transactions}</h2>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{ui.disbursement}</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{ui.reference}</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{ui.date}</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{ui.statusLabel}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {disbursements.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                          {ui.empty}
                        </td>
                      </tr>
                    ) : disbursements.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-500">
                              <Receipt size={16} />
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold text-slate-900">{fmtCurrency(parseFloat(String(d.creditInformation.amount)), collectionCurrency)}</p>
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
                          <p className="text-[11px] text-slate-500">{ui.registered} {d.registrationTime || '—'}</p>
                          <p className="text-[11px] text-slate-500">{ui.settled} {d.settlementTime || '—'}</p>
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
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{ui.noBatch}</h3>
                <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto">{ui.upload}</p>
                <Button className="bg-[#111111] text-white rounded-lg px-8">{ui.importFile}</Button>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
