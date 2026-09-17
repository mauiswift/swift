import BrandLogo from './BrandLogo';

export default function AppLoadingScreen({ logoUrl, storeName }: { logoUrl?: string; storeName?: string }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="app-loading-panel app-loading-bg fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden px-6">
      <div className="app-loading-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="app-loading-content flex w-full max-w-[280px] flex-col items-center text-center">
        <div className="app-loading-mark" aria-hidden="true">
          <span className="app-loading-mark-ring" />
          <BrandLogo src={logoUrl} alt={storeName || 'SwiftPay'} className="app-loading-logo h-10 w-auto" />
        </div>

        <div className="app-loading-rule mt-8" aria-hidden="true">
          <span />
        </div>

        <div className="mt-6">
          <p className="app-loading-text text-[11px] font-semibold uppercase tracking-[0.2em]">
            Preparing your workspace
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Secure connection in progress</p>
          <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden="true">
            <span className="app-loading-dot" />
            <span className="app-loading-dot [animation-delay:120ms]" />
            <span className="app-loading-dot [animation-delay:240ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}
