import { useState } from 'react';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';

export default function StoreProfile() {
  const navigate = useNavigate();
  const [shopName, setShopName] = useState('DRL Solutions');
  const [shopUrl, setShopUrl] = useState('https://drl-itsolutions.atoms.world/');
  const [platform, setPlatform] = useState('Custom');
  const [dailyStats, setDailyStats] = useState(false);

  return (
    <Layout>
      <div className="page-enter">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-8 font-medium">
          <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={() => navigate('/settings')}>Settings</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-bold">Store profile</span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-5 mb-12">
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 m-0">Store profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-start">
          {/* Main Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm">
            <p className="text-[14px] text-slate-500 mb-10 max-w-xl font-medium">
              Personalize your online store with a unique shop name, custom URL, and the platform that best suits your business needs.
            </p>

            <div className="space-y-8 max-w-xl">
              <div>
                <label className="text-[14px] font-bold text-slate-900 block mb-3">Shop name</label>
                <input
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                />
              </div>

              <div>
                <label className="text-[14px] font-bold text-slate-900 block mb-3">Shop URL</label>
                <input
                  value={shopUrl}
                  onChange={(e) => setShopUrl(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                />
              </div>

              <div>
                <label className="text-[14px] font-bold text-slate-900 block mb-3">Platform</label>
                <div className="relative">
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all appearance-none cursor-pointer"
                  >
                    <option>Custom</option>
                    <option>Shopify</option>
                    <option>WooCommerce</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDailyStats(!dailyStats)}
                  className={`relative inline-block w-10 h-5.5 rounded-full transition-all duration-300 ${dailyStats ? 'bg-[#FF6B00]' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-0.5 ${dailyStats ? 'left-5' : 'left-0.5'} w-4.5 h-4.5 rounded-full bg-white transition-all shadow-sm`} />
                </button>
                <span className="text-[13px] font-bold text-slate-700">Receive daily stats email</span>
              </div>

              <div className="pt-6">
                <button className="bg-[#A3A3A3] text-white px-10 py-3 rounded-xl font-bold text-[14px] shadow-sm hover:brightness-95 transition-all">
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Logo Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm">
            <p className="text-[12px] font-bold text-slate-500 mb-8 uppercase tracking-widest">Store logo</p>
            <div className="border border-slate-100 rounded-2xl p-8 bg-white relative group shadow-sm">
              <div className="w-full aspect-square flex items-center justify-center">
                 <img src="/logos/drl-logo.svg" alt="Store logo" className="max-w-[140px] max-h-[140px] object-contain" />
              </div>
              <div className="mt-8 flex items-center justify-between gap-4">
                 <span className="text-[12px] text-slate-400 truncate font-medium">019f7d45-16bd-f866-ba17-f20a0e9caf2d.jpg</span>
                 <button className="p-2.5 text-slate-400 hover:text-rose-500 transition-all border border-slate-100 rounded-xl hover:bg-rose-50">
                    <Trash2 size={20} />
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ChevronDown({ className, size }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
