import { APP_NAME } from '@/lib/brand';

export default function AppLoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center app-loading-bg animate-fade-in-scale"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Animated Logo Container */}
      <div className="relative mb-10 group">
        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
        <div className="absolute inset-0 bg-cyan-400/10 blur-3xl rounded-full scale-[2] animate-float-delayed" />

        <div className="relative bg-white p-5 rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden">
          <img
            src="/logo.svg"
            alt={APP_NAME}
            className="loading-logo-anim h-20 w-20 relative z-10"
          />
        </div>
      </div>

      {/* Brand & Loading Info */}
      <div className="text-center space-y-4 relative z-10">
        <h1 className="text-2xl font-black tracking-[-0.03em] text-[#0f172a] dark:text-white uppercase flex items-center justify-center gap-2">
          {APP_NAME}
        </h1>

        <div className="flex items-center justify-center gap-6 flex-wrap">
          <img
            src="/logos/bsp.svg"
            alt="Bangko Sentral ng Pilipinas"
            className="h-14 w-auto opacity-90"
          />
          <img
            src="/logos/pci.svg"
            alt="PCI DSS Compliant"
            className="h-14 w-auto opacity-90"
          />
          <img
            src="/logos/dpo.svg"
            alt="DPO Registered – NPC Philippines"
            className="h-14 w-auto opacity-90"
          />
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-lg leading-relaxed">
          <span className="text-slate-600 dark:text-slate-300 font-medium">SwiftPay</span> is regulated by the{' '}
          <span className="text-slate-600 dark:text-slate-300 font-medium">Bangko Sentral ng Pilipinas (BSP)</span>.
          We are PCI&nbsp;DSS compliant and registered with the National Privacy Commission (NPC) as a Data Protection Officer.
        </p>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-12 left-0 right-0 text-center px-4">
        <div className="max-w-screen-2xl mx-auto border-t border-slate-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} SwiftPay Philippines · All rights reserved.
          </p>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-emerald-700 text-[10px] font-black uppercase tracking-widest">USDT T+0 Settlement · Live</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
