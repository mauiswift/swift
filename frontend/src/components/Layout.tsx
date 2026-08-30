import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home, CheckSquare, CreditCard, Link2, Send,
  BarChart3, Settings, LogOut, Code2, Menu, X, ChevronDown, Landmark, Bot, MessageSquare, ShieldCheck, Wallet, Bell, DollarSign
} from 'lucide-react';
import { APP_NAME } from '@/lib/brand';
import { cn } from '@/lib/utils';
import { client } from '@/lib/api';
import WhatsNewBanner from './WhatsNewBanner';
import BroadcastBanner from './BroadcastBanner';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';

interface LayoutProps {
  children: React.ReactNode;
  connected?: boolean;
}

// ── Exact nav structure from merchant.live.swiftpay.ph ─────────────────────
const NAV_SECTIONS = [
  {
    items: [
      { label: 'Home',     icon: Home,        path: '/dashboard' },
      { label: 'Wallet',   icon: Wallet,      path: '/wallet' },
      { label: 'Approvals', icon: CheckSquare, path: '/approvals' },
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
  { label: 'Admin Management', icon: ShieldCheck, path: '/admin-management' },
  { label: 'Bot Settings', icon: Bot, path: '/bot-settings' },
  { label: 'Bot Messages', icon: MessageSquare, path: '/bot-messages' },
];

function DRLTechLogo({ className }: { className?: string }) {
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
        <span className="text-[11px] font-semibold text-slate-800 leading-tight tracking-tighter uppercase line-clamp-1">SWIFTPAY PHILIPPINES</span>
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
  const { user, logout, platformBranding, isSuperAdmin } = useAuth();
  const { setLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collectionCurrency, enabledCurrencies, setCollectionCurrency } = useCollectionCurrency();
  const [currencySaving, setCurrencySaving] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const systemItems = [
    { label: 'Settings', icon: Settings, path: '/settings' },
    ...(isSuperAdmin ? [
      { label: 'Admin Management', icon: ShieldCheck, path: '/admin-management' },
      { label: 'Withdrawals', icon: DollarSign, path: '/withdrawals' },
      { label: 'Broadcasts', icon: Bell, path: '/broadcasts' },
      { label: 'Bot Settings', icon: Bot, path: '/bot-settings' },
      { label: 'Bot Messages', icon: MessageSquare, path: '/bot-messages' },
    ] : []),
  ];

  const isActive = (path: string) => path === '/dashboard'
    ? location.pathname === '/dashboard'
    : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const businessName = (user as any)?.business_name || (user as any)?.name || (user as any)?.telegram_username || 'DRL Solutions';

  const switchCollectionCurrency = async (currency: string) => {
    currency = currency.toUpperCase();
    const previousCurrency = collectionCurrency;
    setCollectionCurrency(currency);
    setCurrencySaving(true);
    try {
      const response = await client.patch('/api/v1/merchant/api-config', {
        collection_currency: currency,
      });
      if (!response.ok) throw new Error('Currency update failed');
      setLanguage(currency === 'KRW' ? 'ko' : 'en');
      toast.success(`Store switched to ${currency}`);
    } catch {
      setCollectionCurrency(previousCurrency);
      toast.error('Currency switch failed', {
        description: 'Your previous store currency is still active.',
      });
    } finally {
      setCurrencySaving(false);
    }
  };

  const renderNavItem = (item: typeof NAV_SECTIONS[number]['items'][number], onClose?: () => void) => {
    const active = isActive(item.path.split('?')[0]);
    const exactTabMatch = item.path.includes('?tab=')
      ? `${location.pathname}${location.search}` === item.path
      : active;
    const Icon = item.icon;

    return (
      <Link
        key={item.label}
        to={item.path}
        onClick={onClose}
        aria-current={exactTabMatch ? 'page' : undefined}
        className={`group flex min-h-10 items-center gap-2.5 rounded-xl px-2.5 py-2 no-underline text-[12px] sm:text-[13px] transition-colors duration-200 ${exactTabMatch ? 'bg-orange-50 font-semibold text-[#FF6B00] shadow-[inset_0_0_0_1px_rgba(255,107,0,0.12)]' : 'font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        <Icon
          size={16}
          className={exactTabMatch ? 'text-[#FF6B00]' : 'text-slate-700 transition-colors group-hover:text-slate-900'}
          strokeWidth={exactTabMatch ? 2.5 : 2.2}
        />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const Sidebar = ({ onClose }: { onClose?: () => void }) => (
    <aside aria-label="Primary navigation" className="relative flex h-full w-[min(86vw,280px)] flex-shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white shadow-xl md:w-[200px] md:shadow-none xl:w-[220px]">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-3 pb-2 pt-4 sm:px-4 sm:pb-3 sm:pt-5">
          <DRLTechLogo className="px-1 sm:px-2" />
          {onClose && (
            <button type="button" aria-label="Close navigation" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden">
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 pb-5 pt-3 custom-scrollbar sm:px-4">
          {NAV_SECTIONS.map((section, si) => (
            <div key={section.label || `primary-${si}`}>
              {section.label && (
                <p className="text-[9px] font-semibold tracking-[0.18em] text-slate-500 px-2.5 mb-2 uppercase sm:text-[10px]">
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map(item => renderNavItem(item, onClose))}
              </div>
            </div>
          ))}
        </nav>

        <div className="flex-shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4">
          <p className="text-[9px] font-semibold tracking-[0.18em] text-slate-500 px-2.5 mb-2 uppercase sm:text-[10px]">SYSTEM</p>

          {systemItems.map((item) => {
            return renderNavItem(item, onClose);
          })}

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl my-1 text-[12px] sm:text-[13px] font-medium text-slate-600 w-full bg-transparent border-0 cursor-pointer hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
          >
            <LogOut size={16} className="text-slate-500" />
            <span className="truncate">Logout</span>
          </button>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2.5 mt-6 pt-4 border-t border-slate-200">
            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-[0.15em] sm:text-[10px]">Powered by</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <SwiftPayDotLogo color="#64748B" className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px] text-slate-400 font-semibold tracking-tight truncate">SwiftPay</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="dashboard-density min-h-screen flex bg-[#f6f8fb] font-sans text-slate-900">
      <div className="hidden md:flex h-dvh sticky top-0 z-20">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div onClick={e => e.stopPropagation()} className="h-full w-[min(86vw,280px)] animate-slide-in-left">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-slate-950/40 backdrop-blur-[2px] animate-fade-in" />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/70 px-3 shadow-[0_10px_30px_rgba(15,23,42,0.02)] backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="flex min-w-0 items-center gap-2 sm:gap-4 lg:gap-6">
            <div className="flex min-w-0 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/80 px-2 py-1.5 shadow-sm">
              <span className="hidden md:inline text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Collect</span>
              <select
                aria-label="Store collection currency"
                value={collectionCurrency}
                disabled={currencySaving}
                onChange={(event) => switchCollectionCurrency(event.target.value)}
                className="cursor-pointer border-0 bg-transparent pr-1 text-[12px] font-bold text-slate-700 outline-none disabled:cursor-wait disabled:opacity-60"
              >
                {enabledCurrencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </select>
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-2 py-1.5 shadow-sm transition-all duration-200 hover:bg-slate-50 sm:px-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center overflow-hidden">
                 <Landmark size={16} className="text-slate-500" />
              </div>
              <div className="flex items-center gap-2">
                <span className="max-w-[22vw] truncate text-[13px] font-semibold text-slate-700 sm:max-w-[240px]">{user?.store_name || platformBranding?.name || businessName}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col">
          <div className="max-w-7xl mx-auto w-full flex-1">
            <BroadcastBanner />
            <WhatsNewBanner />
            {children}
          </div>

          <footer className="max-w-7xl mx-auto w-full mt-20 pt-8 border-t border-slate-200/80 pb-12 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-12">
             <p className="text-[12px] text-slate-500 font-medium m-0">
                SwiftPay 2021-2026 © All Rights Reserved
             </p>
             <div className="flex items-center gap-8">
                <a href="/privacy-policy" className="text-[12px] text-slate-500 font-semibold no-underline hover:text-slate-800 transition-colors">Privacy policy</a>
                <a href="/terms-of-service" className="text-[12px] text-slate-500 font-semibold no-underline hover:text-slate-800 transition-colors">Terms of use</a>
             </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

