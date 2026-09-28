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
import { EXPERT_CONTACT_URL, SUPPORT_URL } from '@/lib/brand';
import AppFooter from '@/components/AppFooter';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import BrandLogo from '@/components/BrandLogo';

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
    dark: { heading: '40+ tunable rules across six categories', body: 'AML & structuring · Sanctions & watchlists · Behavioral · Fraud & mule · Volume & threshold · Account, access & location[]'},
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
              id={t.id}
              role="tab"
              aria-controls={`solution-panel-${t.id}`}
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

      <div id={`solution-panel-${tab.id}`} role="tabpanel" aria-labelledby={tab.id} className="min-h-[420px] rounded-2xl border border-[#f2f2f2] bg-white p-8 shadow-sm lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h3 className="text-[22px] font-semibold tracking-tight text-[#1a1a1a]">{tab.heading}</h3>
            <p className="mt-4 text-base leading-7 text-[#535353]">{tab.body}</p>
            {tab.showPaymentMethods && (
              <div className="mt-6">
                  <img
                    src="/static/images/payment-methods-list.webp"
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
    <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-[#e6e6e6] bg-white/96 shadow-sm backdrop-blur-md' : 'border-b border-transparent bg-white'}`}>
      <div className="mx-auto flex h-[76px] max-w-[1200px] items-center gap-8 px-8">
        {/* Logo */}
        <Link to="/" className="flex-none" aria-label="SwiftPay — home">
          <BrandLogo className="h-[30px]" />
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
          <a href="/#why-swiftpay" className="text-[15px] font-semibold text-[#535353] transition-colors hover:text-[#1a1a1a]">Why SwiftPay</a>
          <Link to="/pricing" className="text-[15px] font-semibold text-[#535353] transition-colors hover:text-[#1a1a1a]">Pricing</Link>
        </div>

        {/* Desktop actions */}
        <div className="ml-auto hidden items-center gap-6 lg:flex">
          <Link to="/login" className="text-[15px] font-semibold text-[#1a1a1a] transition-colors hover:text-[#c2410c]">Merchant Portal</Link>
          <a href="/contact" className="rounded-full bg-[#1a1a1a] px-[22px] py-[11px] text-[15px] font-semibold text-white transition-colors hover:bg-[#2c2c2c]">Request a demo</a>
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
          <a href="/#why-swiftpay" className="block border-b border-[#f2f2f2] py-3 font-semibold text-[#1a1a1a]" onClick={() => setOpen(false)}>Why SwiftPay</a>
          <Link to="/pricing" className="block border-b border-[#f2f2f2] py-3 font-semibold text-[#1a1a1a]" onClick={() => setOpen(false)}>Pricing</Link>
          <Link to="/login" className="block border-b border-[#f2f2f2] py-3 font-semibold text-[#1a1a1a]" onClick={() => setOpen(false)}>Merchant Portal</Link>
          <a href="/contact" className="mt-5 mb-2 flex items-center justify-center rounded-full bg-[#ff855b] py-3 font-semibold text-white" onClick={() => setOpen(false)}>Request a demo</a>
        </div>
      )}
    </nav>
  );
}

// Reserve the hero space while the remote image loads to avoid layout shifts.
function HeroImage() {
  return (
    <div className="relative z-10 aspect-[4/3]">
      <img
        src="https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/images/hero-photo.webp"
        alt="A smiling businesswoman managing payments on a tablet"
        className="relative z-[2] h-full w-full object-contain object-bottom drop-shadow-[0_30px_70px_rgba(15,23,42,0.12)]"
        fetchPriority="high"
      />
    </div>
  );
}

function SectionIntro({ eyebrow, title, description, center = true }: { eyebrow?: string; title: string; description?: string; center?: boolean }) {
  return (
    <div className={center ? 'mx-auto mb-[clamp(40px,6vw,64px)] max-w-[720px] text-center' : 'mb-[clamp(40px,6vw,64px)] max-w-[720px]'}>
      {eyebrow && <span className="mb-4 block text-[13px] font-semibold uppercase tracking-[0.1em] text-[#c2410c]">{eyebrow}</span>}
      <h2 className="font-semibold tracking-[-0.018em]" style={{ fontSize: 'clamp(1.85rem,3.2vw,2.6rem)' }}>{title}</h2>
      {description && <p className="mt-5 text-[18px] leading-[1.65] text-[#535353]">{description}</p>}
    </div>
  );
}

const LIVE_RATE_CURRENCIES = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'KRW', label: 'South Korean Won' },
  { code: 'CNY', label: 'Chinese Yuan' },
  { code: 'USDT', label: 'Tether' },
] as const;

function LiveRatesPool() {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRates = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/v1/app-settings/public-exchange-rates');
      if (!response.ok) throw new Error('Unable to load exchange rates');
      const data = await response.json();
      setRates(data.rates || {});
      setUpdatedAt(data.updated_at || null);
    } catch {
      setRates({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadRates();
    const refreshTimer = window.setInterval(() => void loadRates(), 5_000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const formatRate = (value: number) => value >= 100 ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  return (
    <section className="overflow-hidden bg-[#111827] text-white" aria-labelledby="live-rates-heading">
      <div className="mx-auto max-w-[1200px] px-8 py-10 lg:py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-xl">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f5c8a4]">
              <span className="h-2 w-2 rounded-full bg-[#20c997] shadow-[0_0_0_4px_rgba(32,201,151,0.14)]" />
              Live market board
            </div>
            <h2 id="live-rates-heading" className="text-[26px] font-semibold tracking-[-0.025em] sm:text-[30px]">One view for every market</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">Reference rates for the currencies your customers and operations use every day.</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/55">
            <span>{updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Refreshing live rates'}</span>
            <button
              type="button"
              onClick={() => void loadRates()}
              disabled={refreshing}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:border-white/35 hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
              aria-label="Refresh exchange rates"
              title="Refresh exchange rates"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <div className="-mx-2 flex snap-x gap-px overflow-x-auto overscroll-x-contain rounded-2xl border border-white/10 bg-white/10 px-2 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-hidden sm:px-0 sm:pb-0 lg:grid-cols-5">
          {LIVE_RATE_CURRENCIES.map(currency => (
            <div key={currency.code} className="min-w-[190px] snap-start bg-[#1b2535] px-5 py-5 transition-colors hover:bg-[#243146] sm:min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-[0.1em] text-white/80">{currency.code}</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#20c997]">Live</span>
              </div>
              <p className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-white">
                {loading ? '—' : rates[currency.code] ? `₱${formatRate(rates[currency.code])}` : '—'}
              </p>
              <p className="mt-1 text-xs text-white/45">1 {currency.code} · {currency.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-white/40">Rates shown are indicative and refreshed automatically. All quotes are expressed in Philippine pesos.</p>
      </div>
    </section>
  );
}

// ─── Homepage ──────────────────────────────────────────────────
function HomePage() {
  const showLegacyFooter = false;
  const clientLogos = [
    { src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/client-rcbc.webp', alt: 'RCBC' },
    { src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/client-smart.webp', alt: 'Smart' },
    { src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/client-allianz.webp', alt: 'Allianz' },
    { src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/client-flash-express.webp', alt: 'Flash Express' },
    { src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/client-ansons.webp', alt: "Anson's" },
    { src: '/logos/diskartech.png', alt: 'Diskartech' },
    { src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/client-cebuana.webp', alt: 'Cebuana Lhuillier' },
  ];

  const features = [
    { Icon: CreditCard, heading: 'Accept every payment', body: "Let customers pay using the methods they already trust, without adding new systems.", chipCls: 'bg-[#fce4d2] text-[#f97316]' },
    { Icon: Zap, heading: 'Go live quickly', body: 'Start accepting payments without long integration cycles or rebuilding your setup.', chipCls: 'bg-[#d7f3f0] text-[#0fb5a3]' },
    { Icon: TrendingUp, heading: 'Move funds faster', body: 'Access your processing schedule sooner with approved payout timing based on the enabled payment rails.', chipCls: 'bg-[#e6e4fa] text-[#8b5cf6]' },
    { Icon: RefreshCw, heading: 'Reconcile automatically', body: 'Match and record every transaction automatically, without manual work.', chipCls: 'bg-[#e2eefb] text-[#3b82f6]' },
  ];

  const features2 = [
    { Icon: Layers, heading: 'Handle high volume', body: 'Process large payment volumes reliably without operational bottlenecks.', chipCls: 'bg-[#ddf4e3] text-[#17b364]' },
    { Icon: ShieldCheck, heading: 'Stay secure and compliant', body: 'Operate with PCI DSS, BSP, and ISO 27001 standards built in.', chipCls: 'bg-[#ffefc9] text-[#f59e0b]' },
    { Icon: Bell, heading: 'Fast local support', body: 'Get help from a Philippines-based team that resolves issues quickly.', chipCls: 'bg-[#fce4d2] text-[#f97316]' },
  ];

  const results = [
    {
      logo: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/client-ansons.webp',
      logoBg: '#c1574f', logoFilter: 'brightness(0) invert(1)',
      tag: 'Online Payments', industry: 'Retail',
      desc: 'End-to-end payment acceptance for a leading appliances and electronics retailer.',
    },
    {
      logo: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/client-allianz.webp',
      logoBg: '#3d5d84', logoFilter: 'brightness(0) invert(1)',
      tag: 'Recurring Payments', industry: 'Insurance',
      desc: "Multi-channel premium collection platform for one of the world's largest insurance groups.",
    },
    {
      logo: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/client-flash-express.webp',
      logoBg: '#e6b657', logoFilter: 'brightness(0)',
      tag: 'Collections', industry: 'Logistics',
      desc: 'Nationwide COD and digital collections infrastructure for a high-volume logistics provider.',
    },
  ];

  const industries: { label: string; Icon: React.ElementType; color: string }[] = [
    { label: 'Retail', Icon: ShoppingBag, color: 'text-[#f97316]' },
    { label: 'Insurance', Icon: ShieldCheck, color: 'text-[#0fb5a3]' },
    { label: 'Lending', Icon: CreditCard, color: 'text-[#8b5cf6]' },
    { label: 'Education', Icon: BookOpen, color: 'text-[#3b82f6]' },
    { label: 'E-commerce', Icon: Globe, color: 'text-[#f97316]' },
    { label: 'Logistics', Icon: Truck, color: 'text-[#0fb5a3]' },
    { label: 'Remittance', Icon: Repeat, color: 'text-[#8b5cf6]' },
    { label: 'Travel', Icon: Send, color: 'text-[#3b82f6]' },
    { label: 'Hospitality', Icon: Home, color: 'text-[#f97316]' },
    { label: 'Government & Utilities', Icon: Droplet, color: 'text-[#0fb5a3]' },
    { label: 'Healthcare', Icon: Heart, color: 'text-[#8b5cf6]' },
    { label: 'Real Estate', Icon: Key, color: 'text-[#3b82f6]' },
  ];

  const securityBadges = [
    { src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/badges/badge-bsp.webp', label: 'BSP supervised' },
    { src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/badges/badge-iso.webp', label: 'ISO/IEC 27001 certified' },
    { src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/badges/badge-pci.webp', label: 'PCI DSS compliant' },
    { src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/badges/badge-soc2.webp', label: 'SOC 2 Type II aligned (via AWS)' },
    { src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/badges/badge-aes.webp', label: 'AES 256 encryption' },
    { src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/badges/badge-tls.webp', label: 'TLS 1.2 & 1.3 enabled' },
  ];

  const supportedMarkets = [
    { region: 'Philippines', countries: ['Philippines'] },
    { region: 'China', countries: ['China'] },
    { region: 'East and Southeast Asia', countries: ['South Korea', 'Singapore', 'Malaysia', 'Vietnam', 'Japan', 'Thailand', 'Indonesia'] },
    { region: 'South Asia', countries: ['India'] },
    { region: 'Europe', countries: ['United Kingdom', 'Germany', 'Portugal', 'Bulgaria', 'Ukraine'] },
    { region: 'North America', countries: ['United States'] },
    { region: 'Middle East & Africa', countries: ['Egypt'] },
  ];

  const supportedCurrencies = [
    { code: 'PHP', label: 'Philippine Peso' },
    { code: 'CNY', label: 'Chinese Yuan' },
    { code: 'KRW', label: 'South Korean Won' },
    { code: 'USDT', label: 'Tether' },
  ];

  // Platform-level (uploaded) logo — fetched and used for some channels on the homepage
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

  const paymentChannels = [
    { name: 'Maya' },
    { name: 'GCash' },
    { name: 'BPI' },
    { name: 'BDO' },
    { name: 'Landbank' },
    { name: 'UnionBank' },
    { name: 'Alipay' },
    { name: 'WeChat Pay' },
    { name: 'KakaoPay' },
    { name: 'NaverPay' },
    { name: 'Toss Pay' },
    { name: 'PAYCO' },
    { name: 'QR PH' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-display text-[#1a1a1a] [selection:bg-[#f5c8a4]]">
      <Navbar />

      <style>{`
        .soft-grid {
          background-image: linear-gradient(rgba(15,23,42,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.02) 1px, transparent 1px);
          background-size: 18px 18px;
        }
      `}</style>

      <main id="main">
        <LiveRatesPool />

        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="soft-grid relative overflow-hidden" style={{ paddingBlock: 'clamp(48px,7vw,96px) clamp(56px,8vw,104px)', marginTop: '76px' }}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
            <div className="absolute -left-16 top-10 h-72 w-72 rounded-full bg-[#fbbf24]/10 blur-3xl" />
            <div className="absolute right-10 top-0 h-80 w-80 rounded-full bg-[#ff855b]/12 blur-3xl" />
            <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#60a5fa]/10 blur-3xl" />
          </div>
          <div className="mx-auto max-w-[1200px] px-8">
            <div className="grid items-center gap-[clamp(40px,5vw,72px)] lg:grid-cols-[11fr_9fr]">
              {/* Copy */}
              <div className="relative z-10">
                <h1 className="mb-6 text-[clamp(2.5rem,4.6vw,2.9rem)] font-semibold leading-[1.04] tracking-[-0.025em]">
                  The payment gateway for{' '}
                  <span className="relative z-0 inline-block whitespace-nowrap">
                    Philippine
                    <span className="absolute bottom-[0.08em] left-[-0.06em] right-[-0.06em] -z-10 h-[0.3em] rounded-sm bg-[#f5c8a4]" />
                  </span>{' '}
                  enterprises
                </h1>
                <p className="mb-8 max-w-[52ch] text-[18px] leading-[1.65] text-[#535353]">
                  Accept payments, manage subscriptions, and send payouts across all major channels in one unified platform. Automated reconciliation and reporting integrated into your existing systems.
                </p>
                <ul className="mb-10 flex flex-wrap gap-x-6 gap-y-5">
                  {['Approved payout timing', 'Automated reconciliation', 'Local support'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-[14px] font-semibold text-[#2c2c2c]">
                      <CheckCircle2 className="h-[18px] w-[18px] flex-none text-[#20c997]" strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                </ul>
                <a href={EXPERT_CONTACT_URL} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2.5 rounded-full bg-[#ff855b] px-[30px] py-[15px] text-[17px] font-semibold text-white shadow-[0_18px_40px_-12px_rgba(22,22,22,0.12)] transition-transform duration-200 hover:scale-[1.01]">
                  Talk with a payments expert
                  <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white text-[#ff855b] transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="h-[13px] w-[13px]" />
                  </span>
                </a>
              </div>

              {/* Hero visual */}
              <div className="relative hidden sm:block">
                <div className="absolute inset-10 rounded-[2rem] bg-gradient-to-br from-[#fff7ed] via-white to-[#dbeafe] blur-2xl opacity-70" />
                <HeroImage />
                {/* Ring card */}
                <div className="absolute left-[-6%] top-[7%] z-[3] w-[min(176px,46%)] rounded-2xl bg-white p-5 shadow-[0_26px_55px_-22px_rgba(28,26,30,0.09)] text-center">
                  <p className="mb-3 text-[13px] font-semibold text-[#1a1a1a]">Transactions Today</p>
                  <div className="flex items-center justify-center">
                    <div className="relative h-[94px] w-[94px] flex-none">
                      <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90">
                        <circle className="stroke-[#e2f5f3]" cx="42" cy="42" r="37" fill="none" strokeWidth="8" />
                        <circle className="stroke-[#06d6b6]" cx="42" cy="42" r="37" fill="none" strokeWidth="8" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
                        <strong className="text-[17px] font-semibold">100%</strong>
                        <span className="text-[8px] font-semibold uppercase tracking-[0.08em] text-[#007c7c]">Complete</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-[#9a9a9a]">0 pending transactions</p>
                </div>
                {/* Chip: Collections */}
                <div className="absolute bottom-[19%] right-[-7%] z-[3] flex items-center gap-2.5 rounded-xl bg-white px-4 py-3 text-[13px] font-semibold shadow-[0_18px_40px_-12px_rgba(20,20,20,0.07)]">
                  Collections
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d8faf3] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#026153]">
                    <CheckCircle2 className="h-3 w-3" strokeWidth={3} />DONE
                  </span>
                </div>
                {/* Chip: Payments */}
                <div className="absolute bottom-[6%] right-[4%] z-[3] flex items-center gap-2.5 rounded-xl bg-white px-4 py-3 text-[13px] font-semibold shadow-[0_18px_40px_-12px_rgba(20,20,20,0.07)]">
                  Payments
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d8faf3] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#026153]">
                    <CheckCircle2 className="h-3 w-3" strokeWidth={3} />DONE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Client logos marquee ──────────────────────────── */}
        <section className="border-t border-[#f2f2f2]" style={{ paddingBlock: 'clamp(40px,5vw,64px)' }} aria-label="Trusted by leading enterprises">
          <p className="mb-8 text-center text-[13px] font-semibold uppercase tracking-[0.1em] text-[#9a9a9a]">Trusted by leading enterprises</p>
          <div
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
              {clientLogos.map((logo) => (
                <img key={logo.alt} src={logo.src} alt={logo.alt}
                  className="max-h-[44px] w-auto opacity-60 grayscale transition-[opacity,filter] hover:opacity-100 hover:grayscale-0" loading="lazy" />
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats band ──────────────────────────────────────── */}
        <section
          id="why-swiftpay"
          className="text-center text-white"
          style={{ background: '#191919', backgroundImage: 'radial-gradient(ellipse 70% 90% at 50% -20%, rgba(238,134,73,.14), transparent 60%)', paddingBlock: 'clamp(60px,8.5vw,104px)' }}
        >
          <div className="mx-auto max-w-[1200px] px-8">
            <h2 className="font-semibold tracking-[-0.018em] text-[#ffa266]" style={{ fontSize: 'clamp(1.85rem,3.2vw,2.6rem)', marginBottom: 'clamp(40px,5vw,64px)' }}>
              Designed for high volume transactions
            </h2>
            <div className="mx-auto grid max-w-[920px] grid-cols-1 gap-8 sm:grid-cols-3">
              {[
                { value: '₱57B+', label: 'processed' },
                { value: '30M+', label: 'monthly, zero downtime*' },
                { value: '500+', label: 'businesses served' },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="font-semibold leading-[1.05] tracking-[-0.02em]" style={{ fontSize: 'clamp(2.6rem,5vw,4rem)' }}>{stat.value}</div>
                  <div className="mt-3 text-[16px] text-white/[0.66]">{stat.label}</div>
                </div>
              ))}
            </div>
            <p className="mt-8 text-[12px] leading-relaxed text-white/[0.42]">*No payment failures on record to date.</p>
          </div>
        </section>

        {/* ── Markets, currencies, and payment channels ─────────── */}
        <section id="coverage" className="bg-[#f8fafc]" style={{ paddingBlock: 'clamp(60px,8.5vw,104px)' }}>
          <div className="mx-auto max-w-[1200px] px-8">
            <SectionIntro
              eyebrow="Coverage"
              title="Reach customers across markets and payment rails"
              description="Accept local and cross-border payments through one payment operation, with channel availability based on your merchant configuration."
            />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-[28px] border border-[#e2e8f0] bg-white p-8 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb]"><Globe className="h-6 w-6" /></span>
                  <h3 className="text-[22px] font-semibold tracking-[-0.02em]">Supported countries</h3>
                </div>
                <div className="space-y-5">
                  {supportedMarkets.map(group => (
                    <div key={group.region}>
                      <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">{group.region}</p>
                      <div className="flex flex-wrap gap-2">
                        {group.countries.map(country => <span key={country} className="rounded-full bg-[#f1f5f9] px-3 py-1.5 text-[13px] font-medium text-[#1e293b]">{country}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[28px] border border-[#e2e8f0] bg-white p-8 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ecfeff] text-[#0f766e]"><TrendingUp className="h-6 w-6" /></span>
                  <h3 className="text-[22px] font-semibold tracking-[-0.02em]">Currencies</h3>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {supportedCurrencies.map(currency => <div key={currency.code} className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] px-4 py-3 text-center"><div className="text-[15px] font-bold text-[#0f172a]">{currency.code}</div><div className="mt-1 text-[11px] uppercase tracking-[0.08em] text-[#64748b]">{currency.label}</div></div>)}
                </div>
              </div>
              <div className="rounded-[28px] border border-[#e2e8f0] bg-white p-8 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff7ed] text-[#c2410c]"><CreditCard className="h-6 w-6" /></span>
                  <h3 className="text-[22px] font-semibold tracking-[-0.02em]">Payment channels</h3>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {paymentChannels.map(channel => <span key={channel.name} className="inline-flex items-center gap-2 rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-3 py-2 text-[13px] font-semibold text-[#7c2d12] shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"><PaymentBrandLogo brand={channel.name} size="sm" />{channel.name}</span>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Solutions ─────────────────────────────────────────── */}
        <section id="solutions" className="bg-[#fafafa]" style={{ paddingBlock: 'clamp(60px,8.5vw,104px)' }}>
          <div className="mx-auto max-w-[1200px] px-8">
            <SectionIntro
              eyebrow="Solutions and tools"
              title="One system for your entire payment operation"
            />
            <SolutionsTabs />
          </div>
        </section>

        {/* ── Results and industries ────────────────────────────── */}
        <section id="stories" className="bg-white" style={{ paddingBlock: 'clamp(60px,8.5vw,104px)' }}>
          <div className="mx-auto max-w-[1200px] px-8"><div className="mx-auto mb-[clamp(40px,6vw,64px)] max-w-[720px] text-center"><h2 className="font-semibold tracking-[-0.018em]" style={{ fontSize: 'clamp(1.85rem,3.2vw,2.6rem)' }}>Real results from real implementations</h2></div><div className="grid grid-cols-1 gap-6 sm:grid-cols-3">{results.map(result => <article key={result.industry} className="flex flex-col overflow-hidden rounded-2xl border border-[#e6e6e6] bg-white shadow-sm transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-xl"><div className="flex min-h-[168px] items-center justify-center p-8" style={{ background: result.logoBg }}><img src={result.logo} alt={result.industry} className="h-[46px] w-auto max-w-[78%] object-contain" style={{ filter: result.logoFilter }} loading="lazy" /></div><div className="flex flex-1 flex-col items-start gap-3 p-6"><span className="rounded-full bg-[#f2f2f2] px-3 py-1 text-[14px] font-semibold text-[#2c2c2c]">{result.tag}</span><h3 className="text-[22px] font-semibold tracking-[-0.01em]">{result.industry}</h3><p className="text-[16px] leading-relaxed text-[#535353]">{result.desc}</p></div></article>)}</div></div>
        </section>
        <section id="industries" style={{ background: '#fff0eb', paddingBlock: 'clamp(60px,8.5vw,104px)' }}><div className="mx-auto max-w-[1200px] px-8"><div className="mx-auto mb-[clamp(40px,6vw,64px)] max-w-[720px] text-center"><h2 className="font-semibold tracking-[-0.018em]" style={{ fontSize: 'clamp(1.85rem,3.2vw,2.6rem)' }}>Used across industries with complex payment needs</h2></div><div className="mx-auto grid max-w-[980px] grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">{industries.map(({ label, Icon, color }) => <div key={label} className="group flex flex-col items-center gap-3 text-center"><span className={`flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm transition-[box-shadow,transform] duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md ${color}`}><Icon className="h-7 w-7" /></span><span className="text-[14px] font-semibold text-[#6a3617]">{label}</span></div>)}</div></div></section>

        {/* ── Security and CTA ──────────────────────────────────── */}
        <section id="security" className="bg-white" style={{ paddingBlock: 'clamp(60px,8.5vw,104px)' }}><div className="mx-auto max-w-[1200px] px-8"><SectionIntro eyebrow="Security" title="Enterprise-grade security and compliance" description="Built to meet enterprise standards and Philippine regulatory requirements, including PCI DSS and BSP-aligned controls." /><div className="mx-auto grid max-w-[1040px] grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">{securityBadges.map(badge => <div key={badge.label} className="flex flex-col items-center gap-4 text-center"><img src={badge.src} alt={badge.label} className="h-[65px] w-auto opacity-50 grayscale" loading="lazy" /><span className="max-w-[14ch] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9a9a9a]">{badge.label}</span></div>)}</div></div></section>
        <section className="relative overflow-hidden bg-[#191919] text-center text-white" style={{ backgroundImage: 'radial-gradient(ellipse 60% 80% at 50% 120%,rgba(238,134,73,.14),transparent 62%)', paddingBlock: 'clamp(60px,8.5vw,104px)' }}><div className="relative z-10 mx-auto max-w-[1200px] px-6 sm:px-8"><h2 className="mx-auto mb-10 block max-w-[17ch] font-semibold leading-tight tracking-[-0.018em] text-white" style={{ fontSize: 'clamp(1.85rem,3.2vw,2.6rem)' }}>See how SwiftPay transforms your payment operations</h2><a href="/contact" className="inline-flex items-center gap-2.5 rounded-full bg-[#ff855b] px-[32px] py-[14px] text-[18px] font-semibold text-white shadow-sm transition-colors hover:bg-[#f2734a]">Talk with a payments expert<span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white/20"><ArrowRight className="h-[13px] w-[13px]" /></span></a></div></section>
      </main>

      {showLegacyFooter && <footer className="bg-[#191919] text-[14px]" style={{ borderTop: '1px solid rgba(255,255,255,.09)', color: 'rgba(255,255,255,.66)' }}>
        <div className="mx-auto max-w-[1200px] px-8"><div className="grid gap-8 pb-12 pt-16 lg:grid-cols-[1.3fr_auto]"><div><BrandLogo variant="white" className="mb-5 h-[28px]" /><p>The payment infrastructure powering Philippine businesses</p><p className="mt-1 text-white/[0.42]">Enterprise-grade, built for scale</p></div><div className="text-right"><span className="mb-4 block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/[0.42]">Associated Brands</span><div className="flex items-center justify-end gap-6"><a href="https://www.nextbank.ph/" target="_blank" rel="noopener noreferrer" className="font-semibold transition-colors hover:text-white">Nextbank</a><a href="https://www.miquido.com" target="_blank" rel="noopener noreferrer" className="font-semibold transition-colors hover:text-white">Miquido</a></div></div></div><div className="grid grid-cols-2 gap-8 py-12 lg:grid-cols-4" style={{ borderTop: '1px solid rgba(255,255,255,.09)' }}><div><h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/[0.42]">Solutions</h3><ul className="grid gap-3">{['Online Payments', 'Payment Reminders', 'Disbursements', 'Reconciliation'].map(label => <li key={label}><a href="#solutions" className="transition-colors hover:text-white">{label}</a></li>)}</ul></div><div><h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/[0.42]">Company</h3><ul className="grid gap-3">        <li><a href="/contact" className="transition-colors hover:text-white">Contact Us</a></li></ul></div><div><h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/[0.42]">Legal</h3><ul className="grid gap-3"><li><a href="/privacy-policy" className="transition-colors hover:text-white">Privacy Policy</a></li><li><a href="/terms-of-service" className="transition-colors hover:text-white">Terms of Service</a></li></ul></div><div><h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/[0.42]">Contact</h3><ul className="grid gap-3"><li><a href="/contact" className="transition-colors hover:text-white">Support</a></li><li><a href={SUPPORT_URL} className="transition-colors hover:text-white">support@swiftpay.site</a></li></ul></div></div><div className="border-t border-white/[0.09] py-6 text-center text-[12px] text-white/[0.42]">© {new Date().getFullYear()} SwiftPay. All rights reserved.</div></div>
      </footer>}
      <AppFooter />
    </div>
  );
}

export default HomePage;
