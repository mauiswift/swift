export default function AppLoadingScreen() {
  return (
    <div className="sp-loader fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50">

      {/* Logo + ring */}
      <div className="sp-loader__ring-wrap" style={{ animation: 'spRise 0.7s cubic-bezier(.16,1,.3,1) backwards' }}>
        {/* Teal ring — matches swiftpay.ph hero ring animation */}
        <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90 block">
          <circle cx="48" cy="48" r="44" fill="none" stroke="#e2f5f3" strokeWidth="5" />
          <circle
            cx="48" cy="48" r="44"
            fill="none"
            stroke="#06d6b6"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="276"
            strokeDashoffset="276"
            style={{ animation: 'spRingFill 1.4s cubic-bezier(.16,1,.3,1) 0.2s forwards' }}
          />
        </svg>

        {/* Logo centred inside ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/swiftpay-logo.svg"
            alt="SwiftPay"
            className="h-7 w-auto"
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              el.style.display = 'none';
              const fallback = el.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = 'block';
            }}
          />
          {/* Fallback dot-grid logo if CDN fails */}
          <div className="hidden">
            <div className="grid grid-cols-2 gap-1 w-4">
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-900" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Brand name */}
      <div style={{ marginTop: 20, animation: 'spRise 0.7s cubic-bezier(.16,1,.3,1) 0.12s backwards', textAlign: 'center' }}>
        <p style={{
          fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.025em',
          color: '#1a1a1a', lineHeight: 1.1,
        }}>
          SwiftPay
        </p>
        <p style={{ fontSize: '0.75rem', color: '#9a9a9a', fontWeight: 600, marginTop: 4 }}>
          The payment gateway for Philippine enterprises
        </p>
      </div>

      {/* Compliance badges — greyscale, matches swiftpay.ph security-badge style */}
      <div style={{
        marginTop: 40, display: 'flex', alignItems: 'center', gap: 24,
        animation: 'spRise 0.7s cubic-bezier(.16,1,.3,1) 0.24s backwards',
      }}>
        {[
          { src: '/logos/bsp.svg', alt: 'BSP Regulated'     },
          { src: '/logos/pci.svg', alt: 'PCI DSS Compliant' },
          { src: '/logos/dpo.svg', alt: 'NPC / DPO'         },
        ].map(({ src, alt }) => (
          <img key={alt} src={src} alt={alt} className="h-8 w-auto filter grayscale opacity-50" />
        ))}
      </div>

      {/* Bottom bar — matches swiftpay.ph footer status style */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4 flex items-center justify-between" style={{ animation: 'spRise 0.7s cubic-bezier(.16,1,.3,1) 0.32s backwards' }}>
        <p className="text-xs font-bold tracking-[0.06em] text-slate-400">
          © {new Date().getFullYear()} SwiftPay Philippines
        </p>
        {/* Live status dot — matches swiftpay.ph .status-ok */}
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(5,230,197,0.7)] animate-pulse" />
          <span className="text-xs font-bold tracking-[0.06em] text-slate-600">All systems operational</span>
        </div>
      </div>

      <style>{`
        @keyframes spRise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes spRingFill {
          to { stroke-dashoffset: 0; }
        }
        @keyframes spPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
        .sp-loader__ring-wrap {
          position: relative;
          width: 96px;
          height: 96px;
        }
      `}</style>
    </div>
  );
}
