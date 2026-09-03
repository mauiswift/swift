import { useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { client } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface Report {
  id: number;
  name: string;
  report_type: string;
  report_date: string;
  available: boolean;
  file_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ReportsResponse {
  success: boolean;
  total_count: number;
  limit: number;
  offset: number;
  data: Report[];
}

const rangeDaysMap = {
  'Last 7 days': 7,
  'Last 30 days': 30,
  'Last 90 days': 90,
};

export default function ReportsPage() {
  const { language } = useLanguage();
  const isKorean = language === 'ko';
  const [range, setRange] = useState<'Last 7 days' | 'Last 30 days' | 'Last 90 days'>('Last 7 days');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: reportsData, isLoading, error } = useQuery<ReportsResponse>({
    queryKey: ['reports', range],
    queryFn: async () => {
      const days = rangeDaysMap[range];
      const response = await client.apiCall.invoke('GET', `/api/v1/reports?days=${days}`);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const handleDownload = (report: Report) => {
    if (report.available && report.file_url) {
      // Open file in new tab
      window.open(report.file_url, '_blank');
    }
  };

  const reports = reportsData?.data || [];
  const ui = isKorean ? {
    title: '보고서', range: '기간:', last7: '최근 7일', last30: '최근 30일', last90: '최근 90일',
    loading: '보고서를 불러오는 중...', error: '보고서를 불러오지 못했습니다.',
    empty: '선택한 기간에 보고서가 없습니다.', name: '이름', date: '날짜', download: '다운로드',
    noData: '보고서 데이터 없음',
  } : {
    title: 'Reports', range: 'Range:', last7: 'Last 7 days', last30: 'Last 30 days', last90: 'Last 90 days',
    loading: 'Loading reports...', error: 'Failed to load reports',
    empty: 'No reports found for the selected range', name: 'NAME', date: 'DATE', download: 'Download',
    noData: 'No report data',
  };
  const rangeLabels: Record<string, string> = {
    'Last 7 days': ui.last7,
    'Last 30 days': ui.last30,
    'Last 90 days': ui.last90,
  };

  return (
    <Layout>
      <div className="page-enter">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">{ui.title}</h1>
        </div>

        <div className="mb-8">
          <div className="relative inline-block">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex items-center gap-2 h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:border-slate-300 transition-colors"
            >
              <span className="text-slate-400">{ui.range}</span>
              <span className="text-slate-900 font-semibold">{rangeLabels[range]}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                {Object.keys(rangeDaysMap).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setRange(option as 'Last 7 days' | 'Last 30 days' | 'Last 90 days');
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-[13px] font-medium transition-colors ${
                      range === option ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {rangeLabels[option]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-8">
            <div className="text-center text-slate-600">{ui.loading}</div>
          </div>
        )}

        {error && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-8">
            <div className="text-center text-red-600">{ui.error}</div>
          </div>
        )}

        {!isLoading && !error && reports.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-8">
            <div className="text-center text-slate-600">{ui.empty}</div>
          </div>
        )}

        {!isLoading && !error && reports.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{ui.name}</th>
                  <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{ui.date}</th>
                  <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 text-[13px] text-slate-600 font-medium">{report.id}</td>
                    <td className="px-8 py-5 text-[13px] text-slate-900 font-semibold">{report.name}</td>
                    <td className="px-8 py-5 text-[13px] text-slate-600">{formatDate(report.report_date)}</td>
                    <td className="px-8 py-5 text-right">
                      {report.available ? (
                        <button
                          onClick={() => handleDownload(report)}
                          className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-900 hover:text-[#FF6B00] transition-colors"
                        >
                          <Download size={16} />
                          {ui.download}
                        </button>
                      ) : (
                        <span className="text-[12px] text-slate-400 font-medium">{ui.noData}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
