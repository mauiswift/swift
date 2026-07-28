import { useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import Layout from '@/components/Layout';

const mockReports = [
  { id: '2327135', name: 'Reconciliation', date: 'Jul 20, 2026', available: false },
  { id: '2323845', name: 'Daily disbursement', date: 'Jul 20, 2026', available: false },
  { id: '2323779', name: 'Reconciliation', date: 'Jul 19, 2026', available: false },
  { id: '2320490', name: 'Daily disbursement', date: 'Jul 19, 2026', available: false },
  { id: '2320425', name: 'Reconciliation', date: 'Jul 18, 2026', available: false },
  { id: '2317136', name: 'Daily disbursement', date: 'Jul 18, 2026', available: true },
  { id: '2317071', name: 'Reconciliation', date: 'Jul 17, 2026', available: false },
  { id: '2313782', name: 'Daily disbursement', date: 'Jul 17, 2026', available: true },
  { id: '2313718', name: 'Reconciliation', date: 'Jul 16, 2026', available: true },
];

export default function ReportsPage() {
  const [range, setRange] = useState('Last 7 days');

  return (
    <Layout>
      <div className="page-enter">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">Reports</h1>
        </div>

        <div className="mb-8">
          <button className="inline-flex items-center gap-2 h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:border-slate-300">
            <span className="text-slate-400">Range:</span>
            <span className="text-slate-900 font-semibold">{range}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">ID</th>
                <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">NAME</th>
                <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">DATE</th>
                <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 text-[13px] text-slate-600 font-medium">{report.id}</td>
                  <td className="px-8 py-5 text-[13px] text-slate-900 font-semibold">{report.name}</td>
                  <td className="px-8 py-5 text-[13px] text-slate-600">{report.date}</td>
                  <td className="px-8 py-5 text-right">
                    {report.available ? (
                      <button className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-900 hover:text-[#FF6B00] transition-colors">
                        <Download size={16} />
                        Download
                      </button>
                    ) : (
                      <span className="text-[12px] text-slate-400 font-medium">No report data</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
