import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, LayoutDashboard, LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import DemoDashboard from './admin-demo/DemoDashboard';
import DemoLogin from './admin-demo/DemoLogin';
import DemoTransactions from './admin-demo/DemoTransactions';
import { createDemoOrders, DEMO_ACCOUNTS, type DemoAccount, type DemoOrder } from './admin-demo/demoData';

const DEMO_ROLE_STORAGE_KEY = 'swiftpay_admin_demo_role';

export default function AdminBackofficeDemo() {
  const location = useLocation();
  const navigate = useNavigate();
  const [account, setAccount] = useState<DemoAccount | null>(() => {
    const roleId = window.sessionStorage.getItem(DEMO_ROLE_STORAGE_KEY);
    return DEMO_ACCOUNTS.find((candidate) => candidate.id === roleId) ?? null;
  });
  const [orders, setOrders] = useState<DemoOrder[]>(createDemoOrders);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isLoginPage = location.pathname === '/admin-demo' || location.pathname === '/admin-demo/';

  useEffect(() => {
    if (account && isLoginPage) navigate('/admin-demo/dashboard', { replace: true });
    if (!account && !isLoginPage) navigate('/admin-demo', { replace: true });
  }, [account, isLoginPage, navigate]);

  const signIn = (nextAccount: DemoAccount) => {
    window.sessionStorage.setItem(DEMO_ROLE_STORAGE_KEY, nextAccount.id);
    setAccount(nextAccount);
    navigate('/admin-demo/dashboard', { replace: true });
  };

  const signOut = () => {
    window.sessionStorage.removeItem(DEMO_ROLE_STORAGE_KEY);
    setAccount(null);
    setMobileNavOpen(false);
    navigate('/admin-demo', { replace: true });
  };

  const createOrder = (order: Omit<DemoOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    setOrders((previous) => [{
      ...order,
      id: `SWP-${String(261001 + previous.length).padStart(6, '0')}`,
      createdAt: now,
      updatedAt: now,
    }, ...previous]);
  };

  if (!account) return <DemoLogin onLogin={signIn} />;

  const activePage = location.pathname.endsWith('/transactions') ? 'transactions' : 'dashboard';
  const navItems = [
    { to: '/admin-demo/dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
    { to: '/admin-demo/transactions', label: 'Transactions', icon: Activity, page: 'transactions' },
  ];

  return (
    <div className="min-h-screen bg-[#07120f] text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.06] bg-[#0a1511] lg:flex">
        <div className="flex h-[72px] items-center gap-3 border-b border-white/[0.06] px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-[#07120f]"><span className="font-black">S</span></div>
          <div><p className="text-sm font-bold tracking-tight">SwiftPay</p><p className="text-[9px] font-semibold tracking-[0.17em] text-emerald-300/75">ADMIN BACKOFFICE</p></div>
        </div>
        <div className="mx-4 mt-5 rounded-xl border border-amber-300/10 bg-amber-300/[0.045] px-3 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-amber-200">Demo workspace</p>
          <p className="mt-1 text-[10px] text-slate-500">Illustrative data only</p>
        </div>
        <nav aria-label="Demo navigation" className="mt-6 space-y-1 px-3">
          <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.17em] text-slate-600">Workspace</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition ${isActive ? 'bg-emerald-300/10 text-emerald-200' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'}`}><Icon size={16} />{item.label}</NavLink>;
          })}
        </nav>
        <div className="mt-auto border-t border-white/[0.06] p-4">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-300/10 text-xs font-bold text-emerald-200">{account.name.split(' ').map((part) => part[0]).join('')}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-200">{account.name}</p><p className="truncate text-[10px] text-slate-500">{account.role}</p></div>
            <button type="button" onClick={signOut} title="Sign out of demo" aria-label="Sign out of demo" className="rounded-md p-2 text-slate-500 hover:bg-white/5 hover:text-white"><LogOut size={14} /></button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#09140f]/95 px-4 backdrop-blur lg:ml-64 lg:px-8">
        <div className="flex h-[64px] items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Toggle navigation" onClick={() => setMobileNavOpen((open) => !open)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden">{mobileNavOpen ? <X size={18} /> : <Menu size={18} />}</button>
            <span className="text-xs text-slate-500">SwiftPay <span className="px-1 text-slate-700">/</span> <span className="text-slate-300">{activePage === 'transactions' ? 'Transactions' : 'Dashboard'}</span></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-300/10 bg-emerald-300/[0.04] px-2.5 py-1.5 text-[10px] text-emerald-200 sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Demo session</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-300/10 text-[10px] font-bold text-emerald-200 lg:hidden">{account.name.split(' ').map((part) => part[0]).join('')}</span>
          </div>
        </div>
        {mobileNavOpen && (
          <nav aria-label="Mobile demo navigation" className="space-y-1 border-t border-white/[0.06] py-3 lg:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              return <NavLink key={item.to} to={item.to} onClick={() => setMobileNavOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs ${isActive ? 'bg-emerald-300/10 text-emerald-200' : 'text-slate-400'}`}><Icon size={15} />{item.label}</NavLink>;
            })}
            <button type="button" onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-slate-400"><LogOut size={15} />Sign out of demo</button>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-[1560px] px-4 py-6 sm:px-6 lg:ml-64 lg:px-8 lg:py-8">
        {activePage === 'transactions'
          ? <DemoTransactions orders={orders} onCreateOrder={createOrder} />
          : <DemoDashboard orders={orders} operatorName={account.name} onTransactions={() => navigate('/admin-demo/transactions')} />}
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-4 text-[10px] text-slate-600">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={12} /> Demo interface only · Authentication is simulated</span>
          <button type="button" onClick={() => navigate('/')} className="inline-flex items-center gap-1 hover:text-slate-300"><ArrowLeft size={12} /> Return to SwiftPay</button>
        </footer>
      </main>
    </div>
  );
}
