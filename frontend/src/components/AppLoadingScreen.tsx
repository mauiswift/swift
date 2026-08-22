export default function AppLoadingScreen({ logoUrl, storeName }: { logoUrl?: string; storeName?: string }) {
  return (
    <div role="status" aria-live="polite" className="app-loading-panel app-loading-bg fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden">
      {/* decorative glow */}
      <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-orange-500/10 blur-3xl" />

      {/* Logo + subtle animated ring */}
      <div className="relative mb-8">
        <img
          src={logoUrl || "/logo.svg"}
          alt={storeName || "SwiftPay"}
          className="relative z-10 h-12 w-auto drop-shadow-sm loading-logo-anim"
        />

        <span className="app-logo-ring absolute -inset-4 rounded-full opacity-80" aria-hidden="true" />
      </div>

      {/* Progress / loader bar (uses shared progress-bar styles) */}
      <div className="relative h-9 w-44 overflow-hidden rounded-full border border-slate-200/80 bg-white/60 shadow-inner dark:border-slate-700/80 dark:bg-slate-900/50">
        <div className="progress-bar-track absolute inset-0">
          <div className="progress-bar-fill" />
        </div>
      </div>

      {/* Accessible status text */}
      <div className="mt-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          Preparing your workspace
        </p>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Secure connection in progress</p>
      </div>

      {/* tertiary branding / trust marks */}
      <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-4 opacity-40 pointer-events-none">
        <div className="flex items-center gap-8">
          <img src="/logos/bsp.svg" alt="BSP" className="h-6 w-auto grayscale" />
          <span className="h-1 w-1 rounded-full bg-slate-400" />
          <img src="/logos/pci.svg" alt="PCI" className="h-6 w-auto grayscale" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Protected payments infrastructure
        </p>
      </div>
    </div>
  );
}
