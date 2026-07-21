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
    <div className="w-[190px] min-w-[190px] bg-slate-800 h-full flex flex-col flex-shrink-0" style={{ fontFamily: 'RedHatText, "Red Hat Text", RedHatDisplay, ui-sans-serif, system-ui, -apple-system, sans-serif' }}>
      {/* Nav sections */}
      <div className="flex-1 overflow-y-auto p-3">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className="mb-1">
            {section.label && (
              <p className="text-[10px] font-semibold tracking-widest text-slate-300 px-2 pt-2 pb-1 uppercase">
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg my-1 no-underline text-[15px] ${active ? 'font-semibold text-white bg-white/10' : 'font-medium text-slate-200 hover:bg-white/5'} transition-colors`}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <item.icon size={15} style={{ color: active ? '#ff9b6a' : 'rgba(255,255,255,0.45)', flexShrink: 0 }} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* System section at bottom */}
      <div className="p-2 border-t border-white/10">
        <p className="text-[10px] font-semibold tracking-widest text-slate-300 px-2 pt-1 pb-1 uppercase">SYSTEM</p>

        {/* Test mode */}
        <div className="flex items-center justify-between p-2 rounded-md">
          <div className="flex items-center gap-2 text-slate-300">
            <Code2 size={15} style={{ color: 'rgba(255,255,255,0.45)', flexShrink: 0 }} />
            <span className="text-[13.5px] text-slate-300">Test mode</span>
          </div>
          <button
            onClick={() => setTestMode(t => !t)}
            className={`w-8 h-4 rounded-full border-0 cursor-pointer relative ${testMode ? 'bg-emerald-500' : 'bg-white/20'}`}
          >
            <span className={`absolute top-[3px] ${testMode ? 'left-[17px]' : 'left-[3px]'} w-3 h-3 rounded-full bg-white transition-all`} />
          </button>
        </div>

        {SYSTEM_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-2 px-3 py-2 rounded-md my-1 text-[13.5px] ${active ? 'font-medium text-white bg-white/10' : 'text-slate-200 hover:bg-white/5'}`}
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
          className="flex items-center gap-2 px-3 py-2 rounded-md my-1 text-[13.5px] text-slate-200 w-full bg-transparent border-0 cursor-pointer hover:bg-white/5"
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <LogOut size={15} style={{ color: 'rgba(255,255,255,0.45)', flexShrink: 0 }} />
          <span>Logout</span>
        </button>

        {/* Powered by */}
        <div className="flex items-center gap-2 px-2 pt-2 text-slate-300 text-sm">
          <span>Powered by</span>
          <SwiftPayDotLogo />
          <span className="text-slate-300 font-medium opacity-80">SwiftPay</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50" style={{ fontFamily: 'RedHatText, "Red Hat Text", RedHatDisplay, ui-sans-serif, system-ui, -apple-system, sans-serif' }}>
      {/* ── Full-width top bar ──────────────────────────────────── */}
      <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between flex-shrink-0 z-40">
        {/* Left: logo aligned with sidebar width */}
        <div className="w-[180px] min-w-[180px] flex items-center gap-2 pl-4">
          {/* Mobile hamburger */}
          <button
            type="button"
            className="lg:hidden p-1 mr-1 bg-transparent border-0"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            <Menu size={20} />
          </button>
          <SwiftPayDotLogo />
          <span className="text-sm font-semibold text-slate-900 tracking-tight">
            {APP_NAME}
          </span>
        </div>

        {/* Right: merchant name dropdown */}
        <div className="pr-5 flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer px-3 py-1 rounded-md border border-slate-200 text-sm font-medium text-slate-900">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
            <span>{businessName}</span>
            <ChevronDown size={13} color="#888" />
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + content ─────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex h-full">
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-50 flex"
            onClick={() => setMobileOpen(false)}
          >
            <div onClick={e => e.stopPropagation()} className="h-full">
              <div className="h-full flex flex-col bg-slate-800">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <SwiftPayDotLogo />
                    <span className="text-white font-semibold text-base">{APP_NAME}</span>
                  </div>
                  <button onClick={() => setMobileOpen(false)} className="bg-transparent border-0 text-white">
                    <X size={18} />
                  </button>
                </div>
                <Sidebar onClose={() => setMobileOpen(false)} />
              </div>
            </div>
            <div className="flex-1 bg-black/50" />
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
