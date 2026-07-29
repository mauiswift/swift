import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home, CheckSquare, CreditCard, Link2, Send,
  BarChart3, Settings, LogOut, Code2, Menu, X, ChevronDown, ArrowRight, Store, ShieldCheck,
  Users, Shield, ClipboardList, UserCheck, Bitcoin, Wallet, Clock, Landmark, Mail, Globe
} from 'lucide-react';
import { APP_NAME } from '@/lib/brand';
import { cn } from '@/lib/utils';
import WhatsNewBanner from './WhatsNewBanner';

interface LayoutProps {
  children: React.ReactNode;
  connected?: boolean;
}

// ── Exact nav structure from merchant.live.swiftpay.ph ─────────────────────
const NAV_SECTIONS = [
  {
    items: [
      { label: 'Home',     icon: Home,        path: '/dashboard' },
      { label: 'Approvals', icon: CheckSquare, path: '/approvals' },
    ],
  },
  {
    label: 'TRANSACTIONS',
    items: [
      { label: 'Payments',       icon: CreditCard, path: '/payments' },
      { label: 'Payment Links',  icon: Link2,      path: '/pay-by-link' },
      { label: 'International Links', icon: Globe, path: '/pay-by-link/international/new' },
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
];

function DRLTechLogo({ className }: { className?: string, logoUrl?: string, storeName?: string }) {
  return (
    <div className={cn("flex items-center gap-3 px-2 py-4", className)}>
      <div className="w-8 h-8 rounded bg-[#0B63FF] flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold text-white leading-tight tracking-tighter uppercase line-clamp-1">SWIFTPAY PHILIPPINES</span>
        <span className="text-[9px] font-semibold text-slate-400 leading-tight tracking-[0.2em] uppercase">TECHNOLOGY</span>
      </div>
    </div>
  );
}

function SwiftPayDotLogo({ className, color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="5" r="2.5" fill={color}/>
      <circle cx="16" cy="27" r="2.5" fill={color}/>
      <circle cx="10" cy="20.5" r="2.5" fill={color}/>
      <circle cx="10" cy="9.5" r="2.5" fill={color}/>
      <circle cx="22" cy="20.5" r="2.5" fill={color}/>
      <circle cx="16" cy="15" r="2.5" fill={color}/>
      <circle cx="22" cy="9.5" r="2.5" fill={color}/>
    </svg>
  );
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, platformBranding } = useAuth();
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

  const businessName = (user as any)?.business_name || (user as any)?.name || (user as any)?.telegram_username || 'DRL Solutions';

  const navSections = NAV_SECTIONS;

  const Sidebar = ({ onClose }: { onClose?: () => void }) => (
    <div className="w-[240px] min-w-[240px] bg-[#111111] h-full flex flex-col flex-shrink-0 border-r border-white/5">
      {/* Logo */}
      <div className="p-4 mb-2">
        <DRLTechLogo
          logoUrl={user?.store_logo_url || platformBranding?.logoUrl}
          storeName={user?.store_name || user?.organization_name || platformBranding?.name}
        />
      </div>

      {/* Nav sections */}
      <div className="flex-1 overflow-y-auto px-4 space-y-8 pb-10 custom-scrollbar">
        {navSections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 px-3 mb-3 uppercase">
                {section.label}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.path.split('?')[0]);
                // If it has a tab, check if current search matches
                const isTabActive = item.path.includes('?tab=')
                  ? location.pathname + location.search === item.path
                  : active;

                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg no-underline text-[13px] transition-all duration-200 ${isTabActive ? 'font-semibold text-[#FF6B00] bg-white/5 shadow-sm' : 'font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                  >
                    <item.icon size={18} className={isTabActive ? 'text-[#FF6B00]' : 'text-slate-500'} strokeWidth={isTabActive ? 2.5 : 2} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* System section at bottom */}
      <div className="p-4 bg-[#111111] border-t border-white/5">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 px-3 mb-3 uppercase">SYSTEM</p>

        {/* Test mode */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg mb-1 group">
          <div className="flex items-center gap-3 text-slate-400">
            <Code2 size={18} className="text-slate-500" />
            <span className="text-[13px] font-medium">Test mode</span>
          </div>
          <button
            onClick={() => setTestMode(t => !t)}
            className={`w-8 h-4.5 rounded-full border-0 cursor-pointer relative transition-all duration-300 ${testMode ? 'bg-[#FF6B00] shadow-[0_0_8px_rgba(255,107,0,0.4)]' : 'bg-slate-700'}`}
          >
            <span className={`absolute top-[3px] ${testMode ? 'left-[17px]' : 'left-[3px]'} w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm`} />
          </button>
        </div>

        {SYSTEM_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg my-1 text-[13px] transition-all duration-200 ${active ? 'font-semibold text-[#FF6B00] bg-white/5' : 'font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            >
              <item.icon size={18} className={active ? 'text-[#FF6B00]' : 'text-slate-500'} strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg my-1 text-[13px] font-medium text-slate-400 w-full bg-transparent border-0 cursor-pointer hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <LogOut size={18} className="text-slate-500" />
          <span>Logout</span>
        </button>

        {/* Powered by */}
        <div className="flex items-center gap-2 px-3 mt-8 pt-5 border-t border-white/5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em]">Powered by</span>
          <div className="flex items-center gap-1.5">
            <SwiftPayDotLogo color="#64748B" className="w-3.5 h-3.5" />
            <span className="text-[11px] text-slate-400 font-semibold tracking-tight">SwiftPay</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F9FAFB] font-sans text-slate-900">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setMobileOpen(false)}
        >
          <div onClick={e => e.stopPropagation()} className="h-full animate-slide-in-left">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/40 backdrop-blur-sm animate-fade-in" />
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar inside content area */}
        <header className="h-16 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                 <Landmark size={16} className="text-slate-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-slate-700">{user?.store_name || platformBranding?.name || businessName}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
          <div className="max-w-7xl mx-auto w-full flex-1">
            <WhatsNewBanner />
            {children}
          </div>

          {/* Footer - Exactly from screenshots */}
          <footer className="max-w-7xl mx-auto w-full mt-20 pt-8 border-t border-slate-100 pb-12 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-12">
             <p className="text-[12px] text-slate-400 font-medium m-0">
                SwiftPay 2021-2026 © All Rights Reserved
             </p>
             <div className="flex items-center gap-8">
                <a href="#" className="text-[12px] text-slate-400 font-semibold no-underline hover:text-slate-600">Privacy policy</a>
                <a href="#" className="text-[12px] text-slate-400 font-semibold no-underline hover:text-slate-600">Terms of use</a>
             </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

