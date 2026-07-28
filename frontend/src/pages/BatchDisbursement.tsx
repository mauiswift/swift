import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, Download, UploadCloud } from 'lucide-react';
import Layout from '@/components/Layout';

export default function BatchDisbursement() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="page-enter">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-8 font-medium">
          <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={() => navigate('/disbursements')}>Disbursements</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-semibold">Import from file</span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-5 mb-12">
          <button
            onClick={() => navigate('/disbursements')}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">New batch disbursement</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-start">
          {/* Main Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm">
            <p className="text-[14px] text-slate-500 mb-10 font-medium">
              Upload file with your new batch disbursement.
            </p>

            <div className="space-y-10">
              <div>
                <label className="text-[14px] font-semibold text-slate-900 block mb-3">Batch disbursement name</label>
                <input
                  placeholder="e.g. My New Batch Disbursement #1"
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                />
              </div>

              <div>
                <label className="text-[14px] font-semibold text-slate-900 block mb-3">Your CSV file:</label>
                <div className="border-2 border-dashed border-slate-100 rounded-2xl p-14 text-center bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group">
                  <div className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-110 transition-transform">
                    <UploadCloud size={28} className="text-slate-400" />
                  </div>
                  <p className="text-[14px] font-semibold text-slate-900">Click to upload <span className="text-slate-400 font-medium">or drag and drop</span></p>
                  <p className="text-[12px] text-slate-400 mt-2 font-medium">CSV format only (max of 10 MB)</p>
                </div>
              </div>

              <div className="pt-4">
                 <button className="bg-[#A3A3A3] text-white px-12 py-3 rounded-xl font-semibold text-[14px] shadow-sm hover:brightness-95 transition-all">
                    Import
                 </button>
              </div>
            </div>
          </div>

          {/* Rules Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                     <Info size={18} />
                  </div>
                  <h3 className="text-[16px] font-semibold text-slate-900">File rules</h3>
               </div>
               <button className="h-8 px-4 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                  Download sample
               </button>
            </div>

            <p className="text-[13px] text-slate-500 mb-8">Please follow these guidelines when uploading your CSV file.</p>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-6">
               <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Use this exact order of columns:</p>
               <ul className="space-y-3 text-[13px] text-slate-700 font-medium">
                  <li className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                     Merchant reference no
                  </li>
                  <li className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                     SWIFT code of recipient's bank
                  </li>
                  <li className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                     Recipient account number
                  </li>
                  <li className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                     Transfer amount
                  </li>
                  <li className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                     Recipient name
                  </li>
                  <li className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                     Recipient address (optional)
                  </li>
                  <li className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                     Remarks
                  </li>
               </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
