import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home, CheckSquare, CreditCard, Link2, Send,
  BarChart3, Settings, LogOut, Code2, Menu, X, ChevronDown
} from 'lucide-react';
import { APP_NAME } from '@/lib/brand';

interface LayoutProps {
  children: React.ReactNode;
  connected?: boolean;
}

// ── Exact nav structure from merchant.live.swiftpay.ph ─────────────────────
const NAV_SECTIONS = [
  {
    items: [
      { label: 'Home',     icon: Home,        path: '/dashboard' },
      { label: 'Approvals', icon: CheckSquare, path: '/kyb-registrations' },
    ],
  },
  {
    label: 'TRANSACTIONS',
    items: [
      { label: 'Payments',       icon: CreditCard, path: '/payments' },
      { label: 'Payment Links',  icon: Link2,      path: '/pay-by-link' },
      { label: 'Disbursements',  icon: Send,       path: '/disbursements' },
    ],
  },
  {
    label: 'INSIGHTS',
    items: [
      { label: 'Reports', icon: BarChart3, path: '/reports' },
    ],
  },
];

const SYSTEM_ITEMS = [
  { label: 'Settings', icon: Settings, path: '/settings' },
  { label: 'Merchant Settings', icon: Settings, path: '/admin/merchant-settings' },
];

function SwiftPayDotLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M18.1818 5.11765C18.1818 6.28719 17.205 7.23529 16 7.23529C14.795 7.23529 13.8182 6.28719 13.8182 5.11765C13.8182 3.9481 14.795 3 16 3C17.205 3 18.1818 3.9481 18.1818 5.11765ZM18.1818 24.8824C18.1818 26.0519 17.205 27 16 27C14.795 27 13.8182 26.0519 13.8182 24.8824C13.8182 23.7128 14.795 22.7647 16 22.7647C17.205 22.7647 18.1818 23.7128 18.1818 24.8824ZM10.1818 22.7647C11.3868 22.7647 12.3636 21.8166 12.3636 20.647C12.3636 19.4775 11.3868 18.5294 10.1818 18.5294C8.97683 18.5294 8 19.4775 8 20.647C8 21.8166 8.97683 22.7647 10.1818 22.7647ZM12.3636 9.3529C12.3636 10.5224 11.3868 11.4705 10.1818 11.4705C8.97683 11.4705 8 10.5224 8 9.3529C8 8.18336 8.97683 7.23525 10.1818 7.23525C11.3868 7.23525 12.3636 8.18336 12.3636 9.3529ZM21.8182 22.7647C23.0232 22.7647 24 21.8166 24 20.647C24 19.4775 23.0232 18.5294 21.8182 18.5294C20.6132 18.5294 19.6364 19.4775 19.6364 20.647C19.6364 21.8166 20.6132 22.7647 21.8182 22.7647ZM18.1818 15C18.1818 16.1695 17.205 17.1176 16 17.1176C14.795 17.1176 13.8182 16.1695 13.8182 15C13.8182 13.8304 14.795 12.8823 16 12.8823C17.205 12.8823 18.1818 13.8304 18.1818 15ZM21.8182 11.4705C23.0232 11.4705 24 10.5224 24 9.3529C24 8.18336 23.0232 7.23525 21.8182 7.23525C20.6132 7.23525 19.6364 8.18336 19.6364 9.3529C19.6364 10.5224 20.6132 11.4705 21.8182 11.4705Z" fill="white"/>
    </svg>
  );
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, isSuperAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [testMode, setTestMode] = useState(false);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const businessName = (user as any)?.business_name || (user as any)?.name || (user as any)?.telegram_username || 'My Business';

  const Sidebar = ({ onClose }: { onClose?: () => void }) => (
    <div style={{
      width: 190,
      minWidth: 190,
      background: '#1c1c1e',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      fontFamily: 'RedHatText, "Red Hat Text", RedHatDisplay, ui-sans-serif, system-ui, -apple-system, sans-serif'
    }}>
      {/* Nav sections */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} style={{ marginBottom: 4 }}>
            {section.label && (
              <p style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.35)',
                padding: '10px 10px 4px',
                textTransform: 'uppercase',
              }}>
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    margin: '2px 0',
                    textDecoration: 'none',
                    fontSize: 15,
                    fontWeight: active ? 600 : 500,
                    color: active ? '#fff' : 'rgba(255,255,255,0.75)',
                    background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <item.icon
                    size={15}
                    style={{ color: active ? '#ff9b6a' : 'rgba(255,255,255,0.45)', flexShrink: 0 }}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* System section at bottom */}
      <div style={{ padding: '8px 8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <p style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.35)',
          padding: '6px 10px 4px',
          textTransform: 'uppercase',
        }}>
          SYSTEM
        </p>

        {/* Test mode */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 10px',
          borderRadius: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Code2 size={15} style={{ color: 'rgba(255,255,255,0.45)', flexShrink: 0 }} />
            <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.65)' }}>Test mode</span>
          </div>
          <button
            onClick={() => setTestMode(t => !t)}
            style={{
              width: 32,
              height: 18,
              borderRadius: 9,
              border: 'none',
              cursor: 'pointer',
              background: testMode ? '#22c55e' : 'rgba(255,255,255,0.2)',
              position: 'relative',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute',
              top: 3,
              left: testMode ? 17 : 3,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.2s',
            }} />
          </button>
        </div>

        {SYSTEM_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 10px',
                borderRadius: 8,
                margin: '1px 0',
                textDecoration: 'none',
                fontSize: 13.5,
                fontWeight: active ? 500 : 400,
                color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <item.icon size={15} style={{ color: active ? '#ff9b6a' : 'rgba(255,255,255,0.45)', flexShrink: 0 }} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 10px',
            borderRadius: 8,
            margin: '1px 0',
            fontSize: 13.5,
            color: 'rgba(255,255,255,0.65)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <LogOut size={15} style={{ color: 'rgba(255,255,255,0.45)', flexShrink: 0 }} />
          <span>Logout</span>
        </button>

        {/* Powered by */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 10px 4px',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 11,
        }}>
          <span>Powered by</span>
          <SwiftPayDotLogo />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>SwiftPay</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff' }}>
      {/* ── Full-width top bar ──────────────────────────────────── */}
      <div style={{
        height: 52,
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        flexShrink: 0,
        zIndex: 40,
      }}>
        {/* Left: logo aligned with sidebar width */}
        <div style={{
          width: 180,
          minWidth: 180,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingLeft: 16,
        }}>
          {/* Mobile hamburger */}
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginRight: 4 }}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            <Menu size={20} />
          </button>
          <SwiftPayDotLogo />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#111', letterSpacing: '-0.3px' }}>
            {APP_NAME}
          </span>
        </div>

        {/* Right: merchant name dropdown */}
        <div style={{ paddingRight: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            padding: '5px 10px',
            borderRadius: 6,
            border: '1px solid #e5e7eb',
            fontSize: 13,
            fontWeight: 500,
            color: '#111',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
            <span>{businessName}</span>
            <ChevronDown size={13} color="#888" />
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + content ─────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Desktop sidebar */}
        <div className="hidden lg:flex" style={{ height: '100%' }}>
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}
            onClick={() => setMobileOpen(false)}
          >
            <div onClick={e => e.stopPropagation()} style={{ height: '100%' }}>
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: '#1c1c1e',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SwiftPayDotLogo />
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{APP_NAME}</span>
                  </div>
                  <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>
                    <X size={18} />
                  </button>
                </div>
                <Sidebar onClose={() => setMobileOpen(false)} />
              </div>
            </div>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} />
          </div>
        )}

        {/* Main content */}
        <main style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
