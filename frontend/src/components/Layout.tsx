import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home, CheckSquare, CreditCard, Link2, Send,
  BarChart3, Settings, LogOut, Code2, Menu, X, ChevronDown, Landmark, Bot, MessageSquare, MessageCircle, ShieldCheck, Wallet, Bell, DollarSign, FileText
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { APP_NAME } from '@/lib/brand';
import { cn } from '@/lib/utils';
import { client } from '@/lib/api';
import WhatsNewBanner from './WhatsNewBanner';
import BroadcastBanner from './BroadcastBanner';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import { IconButton } from '@/components/ui/icon-button';
import { hasDashboardAccess, hasPermission, type UserPermissions } from '@/lib/permissions';

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface NavigationConfig {
  sections: NavSection[];
  systemItems: NavItem[];
}

interface LayoutProps {
  children: React.ReactNode;
  connected?: boolean;
}

interface AdminNotification {
  id: number;
  title: string;
  message: string;
  priority: string;
  is_read: boolean;
  action_url?: string | null;
  created_at: string;
}

const currencyFlags: Record<string, string> = {
  PHP: '🇵🇭',
  KRW: '🇰🇷',
  CNY: '🇨🇳',
};

function buildNavigation(
  permissions: UserPermissions | undefined,
  isSuperAdmin: boolean,
  language: string,
  collectionCurrency: string,
  t: (key: string) => string,
): NavigationConfig {
  const isKrw = collectionCurrency === 'KRW';
  const navLabel = (key: string, englishLabel: string) => isSuperAdmin ? englishLabel : t(key);
  const sectionLabel = (isKorean: boolean, englishLabel: string) => isSuperAdmin ? englishLabel : (isKorean ? '메인' : englishLabel);
  const mainItems: NavItem[] = [
    ...(hasDashboardAccess(permissions) ? [{ label: navLabel('nav_home', 'Home'), icon: Home, path: '/dashboard' }] : []),
    ...(hasPermission(permissions, 'can_manage_wallet') ? [{ label: navLabel('nav_wallet', 'Wallet'), icon: Wallet, path: '/wallet' }] : []),
  ];

  const transactionItems: NavItem[] = [
    ...(hasPermission(permissions, 'can_manage_payments') ? [
      { label: navLabel('nav_transactions', 'Transactions'), icon: CreditCard, path: '/payments' },
      { label: navLabel('nav_payment_links', 'Payment Links'), icon: Link2, path: '/pay-by-link' },
    ] : []),
    ...(hasPermission(permissions, 'can_manage_disbursements') ? [{ label: navLabel('nav_disbursements', 'Disbursements'), icon: Send, path: '/disbursements' }] : []),
  ];

  const sections: NavSection[] = [
    { label: sectionLabel(language === 'ko', 'MAIN'), items: mainItems },
    { label: isSuperAdmin ? 'TRANSACTIONS' : (language === 'ko' ? '거래' : 'TRANSACTIONS'), items: transactionItems },
    {
      label: isSuperAdmin ? 'INSIGHTS' : (language === 'ko' ? '인사이트' : 'INSIGHTS'),
      items: hasPermission(permissions, 'can_view_reports')
        ? [{ label: navLabel('nav_reports', 'Reports'), icon: BarChart3, path: '/reports' }]
        : [],
    },
    ...(isSuperAdmin ? [
      {
        label: 'APPROVALS',
        items: [
          { label: 'Payment approvals', icon: CheckSquare, path: '/payment-approvals' },
          { label: 'Bank deposits', icon: Landmark, path: '/bank-deposits' },
          { label: 'Top-up requests', icon: Wallet, path: '/topup-requests' },
          { label: 'Withdrawals', icon: DollarSign, path: '/withdrawals' },
          { label: 'USDT send requests', icon: Send, path: '/withdrawals/usdt-send-requests' },
        ],
      },
      {
        label: 'MANAGEMENT',
        items: [
          { label: 'KYB registrations', icon: FileText, path: '/kyb-registrations' },
          { label: 'KYC verifications', icon: ShieldCheck, path: '/kyc-verifications' },
          { label: 'Admin Management', icon: ShieldCheck, path: '/admin-management' },
        ],
      },
      {
        label: 'COMMUNICATIONS',
        items: [
          { label: 'Broadcasts', icon: Bell, path: '/broadcasts' },
          { label: 'Bot Messages', icon: MessageSquare, path: '/bot-messages' },
        ],
      },
    ] : []),
  ];

  const systemItems: NavItem[] = [
    ...(isSuperAdmin || hasPermission(permissions, 'can_manage_team') ? [
      { label: isKrw && !isSuperAdmin ? '다운라인 관리' : 'Downline Management', icon: BarChart3, path: '/downline-management' },
    ] : []),
    { label: navLabel('nav_settings', 'Settings'), icon: Settings, path: '/settings' },
    { label: 'Support', icon: MessageCircle, path: '/support' },
    ...(hasPermission(permissions, 'can_manage_bot') ? [
      { label: navLabel('nav_bot_settings', 'Bot Settings'), icon: Bot, path: '/bot-settings' },
    ] : []),
  ];

  return { sections, systemItems };
}

// ── Exact nav structure from merchant.live.swiftpay.ph ─────────────────────
function PlatformLogo({ className, name, logoUrl }: { className?: string; name?: string; logoUrl?: string }) {
  return (
    <div className={cn("flex items-center gap-3 px-2 py-4", className)}>
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-white shadow-sm ring-1 ring-slate-200">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B63FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
        )}
      </div>
      <div className="flex flex-col">
        <span className="line-clamp-1 text-[11px] font-semibold uppercase leading-tight tracking-tighter text-white">{name || 'SwiftPay Philippines'}</span>
        <span className="text-[9px] font-semibold uppercase leading-tight tracking-[0.2em] text-slate-400">Technology</span>
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
  const { setLanguage, language, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collectionCurrency, enabledCurrencies, setCollectionCurrency } = useCollectionCurrency();
  const [currencySaving, setCurrencySaving] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const permissions = user?.permissions;
  const navigation = buildNavigation(permissions, isSuperAdmin, language, collectionCurrency, t as (key: string) => string);

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

  const loadNotifications = useCallback(async (showLoader = false) => {
    if (!isSuperAdmin) return;
    if (showLoader) setNotificationsLoading(true);
    try {
      const response = await client.get('/api/v1/admin/notifications?limit=8');
      if (!response.ok) throw new Error(response.data?.detail || 'Unable to load notifications');
      setNotifications(Array.isArray(response.data?.notifications) ? response.data.notifications : []);
      setUnreadNotificationCount(Number(response.data?.unread_count || 0));
    } catch (error) {
      if (showLoader) {
        toast.error(error instanceof Error ? error.message : 'Unable to load notifications');
      }
    } finally {
      if (showLoader) setNotificationsLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin) {
      setNotifications([]);
      setUnreadNotificationCount(0);
      return undefined;
    }

    void loadNotifications();
    const refresh = window.setInterval(() => { void loadNotifications(); }, 30000);
    return () => window.clearInterval(refresh);
  }, [isSuperAdmin, loadNotifications]);

  const markNotificationRead = async (notification: AdminNotification) => {
    if (!notification.is_read) {
      const response = await client.post('/api/v1/admin/notifications/mark-as-read', {
        notification_id: notification.id,
      });
      if (response.ok) {
        setNotifications(current => current.map(item => item.id === notification.id ? { ...item, is_read: true } : item));
        setUnreadNotificationCount(current => Math.max(0, current - 1));
      }
    }
    if (notification.action_url) {
      setNotificationsOpen(false);
      navigate(notification.action_url);
    }
  };

  const markAllNotificationsRead = async () => {
    const response = await client.post('/api/v1/admin/notifications/mark-all-as-read');
    if (response.ok) {
      setNotifications(current => current.map(notification => ({ ...notification, is_read: true })));
      setUnreadNotificationCount(0);
    } else {
      toast.error(response.data?.detail || 'Unable to mark notifications as read');
    }
  };

  const { sections, systemItems } = navigation;

  const isActive = (path: string) => path === '/dashboard'
    ? location.pathname === '/dashboard'
    : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const businessName = (user as any)?.business_name || (user as any)?.name || (user as any)?.telegram_username || 'DRL Solutions';
  const storeDisplayName = (user as any)?.store_name || platformBranding?.name || businessName || 'SwiftPay PH';

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

  const renderNavItem = (item: NavItem, onClose?: () => void) => {
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
        className={`group flex min-h-10 w-full min-w-0 items-center gap-2.5 rounded-xl px-2.5 py-2 no-underline text-[12px] sm:text-[13px] transition-colors duration-200 ${exactTabMatch ? 'bg-[#1F2A37] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]' : 'font-medium text-slate-300 hover:bg-[#1A2232] hover:text-white'}`}
      >
        <Icon
          size={16}
          className={exactTabMatch ? 'text-[#FF6B00]' : 'text-slate-400 transition-colors group-hover:text-white'}
          strokeWidth={exactTabMatch ? 2.5 : 2.2}
        />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const Sidebar = ({ onClose }: { onClose?: () => void }) => (
    <aside aria-label="Primary navigation" className="relative flex h-screen w-[min(78vw,220px)] shrink-0 flex-col overflow-hidden border-r border-[#1F2A37] bg-[#111827] text-white shadow-xl md:w-[clamp(180px,18vw,220px)] md:shadow-none xl:w-[clamp(180px,17vw,240px)]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between px-2 pb-2 pt-3 sm:px-3 sm:pb-2 sm:pt-4">
          <PlatformLogo className="px-1 sm:px-1.5" name={platformBranding?.name} logoUrl={platformBranding?.logoUrl} />
          {onClose && (
            <IconButton label="Close navigation" onClick={onClose} variant="ghost" className="h-9 w-9 text-slate-300 hover:bg-[#1F2A37] hover:text-white lg:hidden">
              <X size={16} />
            </IconButton>
          )}
        </div>

        <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2 pb-4 pt-2 custom-scrollbar sm:px-3">
          {sections.map((section, si) => (
            <div key={section.label || `primary-${si}`}>
              {section.label && (
                <p className="text-[9px] font-semibold tracking-[0.18em] text-slate-400 px-2 mb-1.5 uppercase sm:text-[10px]">
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map(item => renderNavItem(item, onClose))}
              </div>
            </div>
          ))}
        </nav>

        <div className="flex-shrink-0 border-t border-[#1F2A37] bg-[#111827] p-2.5 sm:p-3">
          <p className="text-[9px] font-semibold tracking-[0.18em] text-slate-400 px-2 mb-1.5 uppercase sm:text-[10px]">{t('nav_system')}</p>

          {systemItems.map((item) => {
            return renderNavItem(item, onClose);
          })}

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-2.5 py-2 rounded-xl my-1 text-[12px] sm:text-[13px] font-medium text-slate-300 w-full bg-transparent border-0 cursor-pointer hover:text-white hover:bg-[#1F2A37] transition-all duration-200"
          >
            <LogOut size={15} className="text-slate-400" />
            <span className="truncate">{t('nav_logout')}</span>
          </button>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2 mt-4 pt-3 border-t border-[#1F2A37]">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.15em] sm:text-[10px]">{t('nav_powered_by')}</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <SwiftPayDotLogo color="#94A3B8" className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px] text-slate-400 font-semibold tracking-tight truncate">SwiftPay</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="dashboard-density min-h-screen w-full flex overflow-hidden bg-[#f6f8fb] font-sans text-slate-900">
      <div className="hidden md:flex md:shrink-0 md:sticky md:top-0 md:z-20 md:h-screen md:min-w-0">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div onClick={e => e.stopPropagation()} className="h-screen w-[min(85vw,260px)] animate-slide-in-left">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-slate-950/40 backdrop-blur-[2px] animate-fade-in" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200/70 bg-white/78 px-3 pt-[env(safe-area-inset-top)] shadow-[0_12px_32px_rgba(15,23,42,0.045)] backdrop-blur-2xl sm:min-h-16 sm:px-6 sm:pt-0 lg:px-8">
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
            {isSuperAdmin && (
              <div className="relative">
                <button
                  type="button"
                  aria-label={unreadNotificationCount ? `${unreadNotificationCount} unread notifications` : 'Notifications'}
                  aria-expanded={notificationsOpen}
                  onClick={() => {
                    setNotificationsOpen(current => !current);
                    if (!notificationsOpen) void loadNotifications(true);
                  }}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:translate-y-0"
                >
                  <Bell size={18} strokeWidth={2.2} />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
                      {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Notifications</p>
                        <p className="text-[11px] text-slate-500">{unreadNotificationCount} unread</p>
                      </div>
                      {unreadNotificationCount > 0 && (
                        <button type="button" onClick={() => void markAllNotificationsRead()} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[min(420px,60vh)] overflow-y-auto">
                      {notificationsLoading ? (
                        <div className="px-4 py-8 text-center text-xs text-slate-500">Loading notifications...</div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Bell className="mx-auto h-7 w-7 text-slate-300" />
                          <p className="mt-2 text-xs font-medium text-slate-500">You are all caught up.</p>
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => void markNotificationRead(notification)}
                            className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${notification.is_read ? 'bg-white' : 'bg-blue-50/50'}`}
                          >
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.is_read ? 'bg-slate-300' : notification.priority === 'urgent' || notification.priority === 'high' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-semibold text-slate-800">{notification.title}</span>
                              <span className="mt-0.5 block text-xs leading-5 text-slate-500">{notification.message}</span>
                              <span className="mt-1 block text-[10px] text-slate-400">{new Date(notification.created_at).toLocaleString()}</span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex min-w-0 max-w-[calc(100vw-4.5rem)] items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-2 py-1.5 shadow-sm transition-all duration-200 hover:bg-slate-50 sm:max-w-none sm:px-3">
              <div className="hidden h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 sm:flex">
                 <Landmark size={16} className="text-slate-500" />
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <select
                  aria-label="Store collection currency"
                  value={collectionCurrency}
                  disabled={currencySaving}
                  onChange={(event) => switchCollectionCurrency(event.target.value)}
                  className="min-w-0 max-w-[calc(100vw-6rem)] cursor-pointer truncate border-0 bg-transparent pr-4 text-[11px] font-bold text-[#0B63FF] outline-none disabled:cursor-wait disabled:opacity-60 sm:max-w-[170px] sm:pr-5 sm:text-[12px]"
                >
                  {enabledCurrencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currencyFlags[currency] || '🌐'} {storeDisplayName}
                  </option>
                ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-5 sm:p-7 lg:p-9">
          <div key={`${location.pathname}${location.search}`} className="app-motion max-w-7xl mx-auto w-full min-w-0 flex-1">
            <BroadcastBanner />
            <WhatsNewBanner />
            {children}
          </div>

          <footer className="mx-auto mt-12 flex w-full min-w-0 max-w-7xl flex-col gap-4 border-t border-slate-200/80 pb-4 pt-6 sm:mt-20 sm:flex-row sm:items-center sm:gap-12 sm:pb-12 sm:pt-8">
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
