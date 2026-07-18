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
      <div className="text-center space-y-3 relative z-10">
        <h1 className="text-2xl font-black tracking-[-0.03em] text-[#0f172a] dark:text-white uppercase flex items-center justify-center gap-2">
          {APP_NAME}
        </h1>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading dashboard...
        </p>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-12 left-0 right-0 text-center">
        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">
          SwiftPay
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
