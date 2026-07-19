export default function AppLoadingScreen() {
  return (
    <div
      className="sp-loader"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#fcfcfc',
        fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {/* Logo + ring */}
      <div className="sp-loader__ring-wrap" style={{ animation: 'spRise 0.7s cubic-bezier(.16,1,.3,1) backwards' }}>
        {/* Teal ring — matches swiftpay.ph hero ring animation */}
        <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
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
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img
            src="https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/swiftpay-logo.svg"
            alt="SwiftPay"
            style={{ height: 28, width: 'auto' }}
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              el.style.display = 'none';
              const fallback = el.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = 'block';
            }}
          />
          {/* Fallback dot-grid logo if CDN fails */}
          <div style={{ display: 'none', display: 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, width: 16 }}>
              {[0,1,2,3,4,5].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#1a1a1a' }} />
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
          <img key={alt} src={src} alt={alt}
            style={{ height: 32, width: 'auto', filter: 'grayscale(1)', opacity: 0.45 }}
          />
        ))}
      </div>

      {/* Bottom bar — matches swiftpay.ph footer status style */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        borderTop: '1px solid #e6e6e6',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        animation: 'spRise 0.7s cubic-bezier(.16,1,.3,1) 0.32s backwards',
      }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em', color: '#9a9a9a' }}>
          © {new Date().getFullYear()} SwiftPay Philippines
        </p>
        {/* Live status dot — matches swiftpay.ph .status-ok */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: '#05e6c5', boxShadow: '0 0 6px rgba(5,230,197,.7)',
            animation: 'spPulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em', color: '#535353' }}>
            All systems operational
          </span>
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
