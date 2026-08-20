import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Droplet,
  Globe,
  Heart,
  Home,
  Key,
  Layers,
  Menu,
  RefreshCw,
  Repeat,
  Send,
  Shield,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Shuffle,
  TrendingUp,
  Truck,
  X,
  Zap,
} from 'lucide-react';
import { SUPPORT_URL } from '@/lib/brand';

function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(entry.target); } },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}

// ─── Solutions tab data ────────────────────────────────────────
const SOLUTION_TABS = [
  {
    id: 'online-payments',
    label: 'Online Payments',
    Icon: ShoppingCart,
    heading: 'Accept payments across every channel',
    body: 'Collect payments online or in person through a single system, across all major Philippine payment methods.',
    tags: [] as string[],
    showPaymentMethods: true,
    dark: { heading: 'Payment pages', body: 'Hosted checkout pages optimized for every device and payment method.' },
  },
  {
    id: 'payment-reminders',
    label: 'Payment Reminders',
    Icon: Bell,
    heading: 'Never chase a payment again',
    body: 'Reduce late payments and internal follow-ups with automated reminders that reach customers on the channels they actually use.',
    tags: ['SMS reminders', 'Viber reminders', 'Whatsapp reminders', 'AI-powered Call Agent'],
    showPaymentMethods: false,
    dark: { heading: 'AI Call Agent', body: 'Automated voice calls that remind customers of upcoming or overdue payments. No human agent needed. Set the rules, SwiftPay makes the call.' },
  },
  {
    id: 'payment-routing',
    label: 'Payment Routing',
    Icon: Shuffle,
    heading: 'One integration across all payment rails',
    body: 'Route transactions intelligently across providers with built-in failover and transaction management.',
    tags: ['Multi-rail routing', 'Failover logic', 'Transaction management', 'Single API integration'],
    showPaymentMethods: false,
    dark: { heading: 'Availability controls', body: 'Automatically reroute transactions to maintain uptime and success rates.' },
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    Icon: Calendar,
    heading: 'Manage recurring payments',
    body: 'Handle billing cycles, plan changes, and recurring collections without manual tracking.',
    tags: ['Recurring billing', 'Plan changes', 'Proration', 'Automated invoicing'],
    showPaymentMethods: false,
    dark: { heading: 'Lifecycle management', body: 'Manage upgrades, downgrades, pauses, and billing events in one system.' },
  },
  {
    id: 'fraud-management',
    label: 'Fraud Management',
    Icon: Shield,
    heading: 'Protect every transaction',
    body: 'Philippine-built Fraud Management System that scores every transaction before it completes, meeting AFASA and BSP Circular 1213 requirements out of the box.',
    tags: ['BSP 1213-aligned', 'AFASA-ready', 'ISO 27001 & PCI DSS'],
    showPaymentMethods: false,
    dark: { heading: '40+ tunable rules across six categories', body: 'AML & structuring · Sanctions & watchlists · Behavioral · Fraud & mule · Volume & threshold · Account, access & location[...]'},
  },
  {
    id: 'disbursements',
    label: 'Disbursements',
    Icon: Send,
    heading: 'Payouts, automated',
    body: 'Send funds to partners, sellers, and customers in real time or in bulk, with full control over release and tracking.',
    tags: ['Bulk uploads', 'Real-time payouts', 'Scheduled disbursements', 'API-triggered payouts'],
    showPaymentMethods: false,
    dark: { heading: 'Approval chains', body: 'Control how payouts are reviewed, approved, and released across teams.' },
  },
  {
    id: 'reconciliation',
    label: 'Reconciliation',
    Icon: CheckCircle2,
    heading: 'Reconciliation, handled automatically',
    body: 'Every transaction is matched, recorded, and reported across systems without manual work.',
    tags: ['Automated matching', 'Real-time reporting', 'Exception handling', 'Audit-ready records'],
    showPaymentMethods: false,
    dark: { heading: 'Operations review', body: 'Surface mismatches and resolve exceptions through structured workflows.' },
  },
];

function SolutionsTabs() {
  const [activeTab, setActiveTab] = useState(0);
  const tab = SOLUTION_TABS[activeTab];

  // Fetch platform branding so the homepage can show the uploaded logo when available
  const [platformLogo, setPlatformLogo] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    fetch('/api/v1/public/merchant/platform/branding')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!mounted) return;
        if (data && data.store_logo_url) setPlatformLogo(data.store_logo_url);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <div className="grid gap-8 lg:grid-cols-[264px_1fr]">
      <div className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0" role="tablist">
        {SOLUTION_TABS.map((t, i) => {
          const Icon = t.Icon;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={i === activeTab}
              onClick={() => setActiveTab(i)}
              className={`flex flex-none items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] font-semibold transition-colors ${
                i === activeTab ? 'bg-[#fce4d2] text-[#1a1a1a]' : 'text-[#9a9a9a] hover:bg-[#f2f2f2] hover:text-[#1a1a1a]'
              }`}
            >
              <Icon className={`h-5 w-5 flex-none ${i === activeTab ? 'text-[#d88a52]' : ''}`} />
              <span className="whitespace-nowrap">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="min-h-[420px] rounded-2xl border border-[#f2f2f2] bg-white p-8 shadow-sm lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h3 className="text-[22px] font-semibold tracking-tight text-[#1a1a1a]">{tab.heading}</h3>
            <p className="mt-4 text-base leading-7 text-[#535353]">{tab.body}</p>
            {tab.showPaymentMethods && (
              <div className="mt-6">
                <img
                  src={'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/images/payment-methods-list.webp'}
                  alt="Supported payment methods"
                  className="max-w-full"
                  loading="lazy"
                />
              </div>
            )}
            {tab.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {tab.tags.map(tag => (
                  <span key={tag} className="rounded-full bg-[#f2f2f2] px-[14px] py-[7px] text-[14px] font-semibold text-[#2c2c2c]">{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center rounded-2xl bg-[#242424] p-8">
            <h4 className="text-[18px] font-semibold text-white">{tab.dark.heading}</h4>
            <p className="mt-3 text-[14px] leading-[1.65] text-white/[0.66]">{tab.dark.body}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Navbar ────────────────────────────────────────────────────
function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const solutionLinks = [
    { label: 'Online Payments', href: '#solutions' },
    { label: 'Payment Reminders', href: '#solutions' },
    { label: 'Payment Routing', href: '#solutions' },
    { label: 'Subscriptions', href: '#solutions' },
    { label: 'Fraud Management', href: '#solutions' },
    { label: 'Disbursements', href: '#solutions' },
    { label: 'Reconciliation', href: '#solutions' },
  ];

  return (
    <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-[#e6e6e6] bg-white/96 shadow-sm backdrop-blur-md' : 'border-b border-transparent bg-white[...]'}>
      <div className="mx-auto flex h-[76px] max-w-[1200px] items-center gap-8 px-8">
        {/* Logo */}
        <Link to="/" className="flex-none" aria-label="SwiftPay — home">
          <img
            src="https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/swiftpay-logo-black.svg"
            alt="SwiftPay"
            height={30}
            className="h-[30px] w-auto"
          />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden flex-1 items-center justify-center gap-8 lg:flex">
          <div
            className="relative"
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#535353] transition-colors hover:text-[#1a1a1a]"
              aria-expanded={menuOpen}
            >
              Solutions
              <ChevronDown className={`h-3 w-3 transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
            {menuOpen && (
              <div className="absolute left-1/2 top-[calc(100%+8px)] z-50 min-w-[232px] -translate-x-1/2 rounded-2xl border border-[#e6e6e6] bg-white p-2 shadow-xl">
                {solutionLinks.map((item) => (
                  <a key={item.label} href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-[14px] py-[10px] text-[15px] font-semibold text-[#535353] transition-colors hover:bg-[#f2f2f2] hover:text-[#1a1a1a]">
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          <a href="/why-swiftpay/" className="text-[15px] font-semibold text-[#535353] transition-colors hover:text-[#1a1a1a]">Why SwiftPay</a>
        </div>

        {/* Desktop actions */}
        <div className="ml-auto hidden items-center gap-6 lg:flex">
          <Link to="/login" className="text-[15px] font-semibold text-[#1a1a1a] transition-colors hover:text-[#c2410c]">Merchant Portal</Link>
          <a href="/contact-us/" className="rounded-full bg-[#1a1a1a] px-[22px] py-[11px] text-[15px] font-semibold text-white transition-colors hover:bg-[#2c2c2c]">Request a demo</a>
        </div>

        {/* Mobile toggle */}
        <button className="ml-auto rounded-full p-2 text-[#1a1a1a] lg:hidden" onClick={() => setOpen(v => !v)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-[#e6e6e6] bg-white px-5 py-3 shadow-xl lg:hidden">
          <a href="#solutions" className="block border-b border-[#f2f2f2] py-3 font-semibold text-[#1a1a1a]" onClick={() => setOpen(false)}>Solutions</a>
          <a href="/why-swiftpay/" className="block border-b border-[#f2f2f2] py-3 font-semibold text-[#1a1a1a]" onClick={() => setOpen(false)}>Why SwiftPay</a>
          <Link to="/login" className="block border-b border-[#f2f2f2] py-3 font-semibold text-[#1a1a1a]" onClick={() => setOpen(false)}>Merchant Portal</Link>
          <a href="/contact-us/" className="mt-5 mb-2 flex items-center justify-center rounded-full bg-[#ff855b] py-3 font-semibold text-white" onClick={() => setOpen(false)}>Request a demo</a>
        </div>
      )}
    </nav>
  );
}

// ─── Homepage ──────────────────────────────────────────────────

