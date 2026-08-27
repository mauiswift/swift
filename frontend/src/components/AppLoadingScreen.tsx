export default function AppLoadingScreen({ logoUrl, storeName }: { logoUrl?: string; storeName?: string }) {
  return (
    <div role="status" aria-live="polite" className="app-loading-panel app-loading-bg fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden px-6">
      <div className="app-loading-content flex w-full max-w-[280px] flex-col items-center text-center">
        <img
          src={logoUrl || "/logo.svg"}
          alt={storeName || "SwiftPay"}
          className="h-10 w-auto app-loading-logo"
        />

        <div className="app-loading-rule mt-8" aria-hidden="true">
          <span />
        </div>

        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
          Preparing your workspace
          </p>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Secure connection in progress</p>
        </div>
      </div>
    </div>
  );
}
