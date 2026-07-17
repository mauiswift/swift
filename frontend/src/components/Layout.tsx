import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  CreditCard,
  Send,
  FileText,
  BarChart3,
  Wallet,
  Settings,
  LogOut,
  Menu,
  User,
  ShieldCheck,
  Crown,
  Bell,
  QrCode,
  Smartphone,
  ArrowUpFromLine,
  DollarSign,
  ClipboardList,
  MessageSquare,
  Code2,
} from 'lucide-react';
import { APP_NAME } from '@/lib/brand';

interface LayoutProps {
  children: React.ReactNode;
  connected?: boolean;
}

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  permission?: string;
  badge?: string;
  badgeColor?: string;
}

const userNavItems: NavItem[] = [
  { label: 'Overview', icon: LayoutDashboard, path: '/' },
  { label: 'Payments', icon: CreditCard, path: '/payments' },
  { label: 'Disbursements', icon: Send, path: '/disbursements' },
  { label: 'QR Codes', icon: QrCode, path: '/qr-codes' },
  { label: 'Wallet', icon: Wallet, path: '/wallet' },
  { label: 'Transactions', icon: FileText, path: '/transactions' },
  { label: 'Reports', icon: BarChart3, path: '/reports' },
];

const paymentMethodsItems: NavItem[] = [
  {
    label: 'Alipay QR',
    icon: QrCode,
    path: '/alipay',
    badge: 'Alipay',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    label: 'WeChat Pay',
    icon: QrCode,
    path: '/wechat',
    badge: 'WeChat',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
];

const supportNavItems: NavItem[] = [
  { label: 'Compliance', icon: ShieldCheck, path: '/compliance' },
  { label: 'Policies', icon: FileText, path: '/policies' },
  { label: 'Messenger', icon: MessageSquare, path: '/messenger' },
];

const developerNavItems: NavItem[] = [
  { label: 'Developer Experience', icon: Code2, path: '/developer-experience', permission: 'can_manage_bot' },
  { label: 'API Docs', icon: Code2, path: '/api-docs', permission: 'can_manage_bot' },
];

const adminNavItems: NavItem[] = [
  { label: 'Bot Settings', icon: User, path: '/bot-settings', permission: 'can_manage_bot' },
];

const superAdminNavItems: NavItem[] = [
  { label: 'Bot Messages', icon: MessageSquare, path: '/bot-messages' },
  { label: 'Top-up Requests', icon: DollarSign, path: '/topup-requests' },
  { label: 'USDT Send Requests', icon: Send, path: '/usdt-send-requests' },
  { label: 'Bank Deposits', icon: ArrowUpFromLine, path: '/bank-deposits' },
  { label: 'KYB Registrations', icon: ClipboardList, path: '/kyb-registrations' },
  { label: 'KYC Verifications', icon: ShieldCheck, path: '/kyc-verifications' },
  { label: 'Admin Management', icon: ShieldCheck, path: '/admin-management' },
  { label: 'Roles', icon: ShieldCheck, path: '/roles' },
];

const buildSections = (
  userItems: NavItem[],
  paymentItems: NavItem[],
  supportItems: NavItem[],
  developerItems: NavItem[],
  adminItems: NavItem[],
  superAdminItems: NavItem[],
  isSuperAdmin: boolean,
  permissions?: Record<string, boolean>,
) => {
  const filterItems = (items: NavItem[]) =>
    items.filter((item) => {
      if (item.permission && !permissions?.[item.permission] && !isSuperAdmin) {
        return false;
      }
      return true;
    });

  const visibleDeveloperItems = filterItems(developerItems);
  const visibleAdminItems = filterItems(adminItems);
  const visibleSuperAdminItems = isSuperAdmin ? filterItems(superAdminItems) : [];

  return [
    {
      label: 'Main',
      items: filterItems([...userItems]),
    },
    { label: 'Payment Channels', items: filterItems(paymentItems) },
    { label: 'Support', items: filterItems(supportItems) },
    ...(visibleDeveloperItems.length > 0 ? [{ label: 'Developer', items: visibleDeveloperItems }] : []),
    ...(visibleAdminItems.length > 0 ? [{ label: 'Administration', items: visibleAdminItems }] : []),
    ...(visibleSuperAdminItems.length > 0 ? [{ label: 'Super Admin Controls', items: visibleSuperAdminItems }] : []),
    { label: 'Account', items: filterItems([{ label: 'Settings', icon: Settings, path: '/settings' }]) },
  ];
};

export default function Layout({ children, connected }: LayoutProps) {
  const { user, logout, isSuperAdmin, permissions } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navSections = buildSections(
    userNavItems,
    paymentMethodsItems,
    supportNavItems,
    developerNavItems,
    adminNavItems,
    superAdminNavItems,
    isSuperAdmin,
    permissions,
  );

  const allItems = [
    ...userNavItems,
    ...paymentMethodsItems,
    ...supportNavItems,
    ...developerNavItems,
    ...adminNavItems,
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userName = user?.name || user?.telegram_username || 'Admin';

  return (
    <div className="h-screen min-h-screen bg-slate-50 flex overflow-hidden">
      <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 border-r border-slate-200 bg-white shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <Link to="/" className="flex items-center gap-3 group w-full">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-brand-blue-600 to-brand-blue-700 flex items-center justify-center overflow-hidden shadow-md shadow-brand-blue-500/20 transition-transform duration-300 group-hover:scale-105">
              <img src="/logo.svg" alt="Logo" className="h-6 w-6 invert brightness-0" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-slate-900 tracking-tight">{APP_NAME}</p>
              <p className="text-xs text-slate-500">Merchant dashboard</p>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-5 space-y-6">
          {navSections.map((section) => (
            <div key={section.label}>
              <div className="flex items-center justify-between px-1 mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{section.label}</p>
                {section.label === 'Administration' && isSuperAdmin && (
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                )}
              </div>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'bg-brand-blue-50 text-brand-blue-700 shadow-sm ring-1 ring-brand-blue-100'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 transition ${active ? 'text-brand-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className={`ml-auto text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-1 rounded-full ${item.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5 pt-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${isSuperAdmin ? 'bg-amber-100' : 'bg-slate-100'}`}>
              {isSuperAdmin ? (
                <Crown className="h-5 w-5 text-amber-600" />
              ) : (
                <User className="h-5 w-5 text-slate-600" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-500 truncate">{isSuperAdmin ? 'Super Admin' : 'Administrator'}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="mt-4 w-full justify-center">
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="lg:hidden fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="h-14 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-700">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 bg-white border-r border-slate-200">
                  <div className="h-16 flex items-center px-5 border-b border-slate-100">
                    <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                      <div className="h-9 w-9 rounded-2xl bg-brand-blue-600 flex items-center justify-center">
                        <img src="/logo.svg" alt="Logo" className="h-5 w-5 invert brightness-0" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-900">{APP_NAME}</p>
                        <p className="text-xs text-slate-500">Merchant dashboard</p>
                      </div>
                    </Link>
                  </div>
                  <div className="py-4 px-3 space-y-6">
                    {navSections.map((section) => (
                      <div key={section.label}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 mb-2">{section.label}</p>
                        <div className="space-y-2">
                          {section.items.map((item) => {
                            const active = isActive(item.path);
                            return (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                                  active
                                    ? 'bg-slate-100 text-slate-900'
                                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                              >
                                <item.icon className={`h-5 w-5 ${active ? 'text-brand-blue-600' : 'text-slate-400'}`} />
                                <span className="truncate">{item.label}</span>
                                {item.badge && (
                                  <span className={`ml-auto text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-1 rounded-full ${item.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                                    {item.badge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-slate-100">
                    <Button variant="outline" size="sm" onClick={() => { setMobileOpen(false); handleLogout(); }} className="w-full justify-center">
                      <LogOut className="h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              <Link to="/" className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-2xl bg-brand-blue-600 flex items-center justify-center">
                  <img src="/logo.svg" alt="Logo" className="h-5 w-5 invert brightness-0" />
                </div>
                <span className="text-sm font-semibold text-slate-900">{APP_NAME}</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {connected !== undefined && (
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
                  connected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  {connected ? 'Live updates' : 'Offline'}
                </span>
              )}
            </div>
          </div>
        </div>

        <main className="flex-1 flex flex-col overflow-hidden pt-16 lg:pt-0">
          <div className={`hidden lg:flex h-20 items-center justify-between px-8 border-b border-slate-200 bg-white/90 backdrop-blur-sm ${scrolled ? 'shadow-sm' : ''}`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Current section</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">{allItems.find((item) => isActive(item.path))?.label || 'Dashboard'}</h1>
            </div>
            <div className="flex items-center gap-3">
              {connected !== undefined && (
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  connected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  {connected ? 'Live status' : 'Offline'}
                </span>
              )}
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-slate-600 hover:bg-slate-100">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="sm" className="hidden xl:inline-flex">
                Settings
              </Button>
              <div className="hidden xl:flex items-center gap-3 rounded-full bg-slate-100 px-3 py-2">
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
                  <p className="text-xs text-slate-500">Manage account</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
