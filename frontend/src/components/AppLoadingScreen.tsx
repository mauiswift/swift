export default function AppLoadingScreen({ logoUrl, storeName }: { logoUrl?: string; storeName?: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      {/* Centered Brand Logo */}
      <div className="mb-10 animate-in fade-in zoom-in duration-700">
        <img
          src={logoUrl || "/logo.svg"}
          alt={storeName || "SwiftPay"}
          className="h-12 w-auto"
        />
      </div>

      {/* Clean, high-performance circular spinner */}
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-100" />
        <div
          className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#FF6B00] animate-spin"
          style={{ animationDuration: '0.6s' }}
        />
      </div>

      <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300">
        <p className="text-[13px] font-semibold text-slate-400 tracking-[0.1em] uppercase">
          Initializing Secure Dashboard
        </p>
      </div>

      {/* Security/Compliance footer - minimal style */}
      <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-6 opacity-30">
        <div className="flex items-center gap-8">
           <img src="/logos/bsp.svg" alt="BSP" className="h-6 w-auto grayscale" />
           <img src="/logos/pci.svg" alt="PCI" className="h-6 w-auto grayscale" />
        </div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          Enterprise Grade Security
        </p>
      </div>
    </div>
  );
}
