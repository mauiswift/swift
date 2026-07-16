import { APP_NAME } from '@/lib/brand';

export default function AppLoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center app-loading-bg animate-fade-in-scale"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Animated Logo Container */}
      <div className="relative mb-10 group">
        {/* Glow Effects */}
        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
        <div className="absolute inset-0 bg-cyan-400/10 blur-3xl rounded-full scale-[2] animate-float-delayed" />

        {/* Logo Frame */}
        <div className="relative bg-white dark:bg-[#0D1526] p-5 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-blue-500/10 app-logo-pulse overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 pointer-events-none" />
          <img
            src="/logo.svg"
            alt={APP_NAME}
            className="h-20 w-20 relative z-10 drop-shadow-2xl animate-logo-entrance"
          />
          {/* Animated Ring */}
          <div className="absolute inset-0 app-logo-ring" />
        </div>
      </div>

      {/* Brand & Loading Info */}
      <div className="text-center space-y-3 relative z-10">
        <h1 className="text-2xl font-black tracking-[-0.03em] text-[#0f172a] dark:text-white uppercase flex items-center justify-center gap-2">
          {APP_NAME}
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        </h1>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500/5 dark:bg-blue-500/10 rounded-full border border-blue-500/10">
            <span className="app-loading-dot" style={{ animationDelay: '0s' }} />
            <span className="app-loading-dot" style={{ animationDelay: '0.2s' }} />
            <span className="app-loading-dot" style={{ animationDelay: '0.4s' }} />
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] ml-2">
              Syncing Ledger
            </span>
          </div>

          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
            Secure Financial Gateway
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-12 left-0 right-0 text-center">
        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">
          Powered by SwiftPay Protocol
        </p>
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
