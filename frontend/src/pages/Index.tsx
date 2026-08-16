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
    dark: { heading: '40+ tunable rules across six categories', body: 'AML & structuring · Sanctions & watchlists · Behavioral · Fraud & mule · Volume & threshold · Account, access & location' },
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
                  src="https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/images/payment-methods-list.webp"
                  alt="Supported payment methods: Visa, Mastercard, JCB, GCash, Maya, QR Ph, BDO, RPI, LANDBANK"
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
    <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-[#e6e6e6] bg-white/96 shadow-sm backdrop-blur-md' : 'border-b border-transparent bg-white/90 backdrop-blur-sm'}`}>
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
function HomePage() {
  const clientLogos = [
    { src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/client-rcbc.webp', alt: 'RCBC' },
    { src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/client-smart.webp', alt: 'Smart' },
    { src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/client-allianz.webp', alt: 'Allianz' },
    { src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/client-flash-express.webp', alt: 'Flash Express' },
    { src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/client-ansons.webp', alt: "Anson's" },
    { src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/client-diskartech.webp', alt: 'Diskartech' },
    { src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/client-cebuana.webp', alt: 'Cebuana Lhuillier' },
  ];

  const features = [
    { Icon: CreditCard, heading: 'Accept every payment', body: "Let customers pay using the methods they already trust, without adding new systems.", chipCls: 'bg-[#fce4d2] text-[#f97316]' },
    { Icon: Zap, heading: 'Go live quickly', body: 'Start accepting payments without long integration cycles or rebuilding your setup.', chipCls: 'bg-[#d7f3f0] text-[#0fb5a3]' },
    { Icon: TrendingUp, heading: 'Get paid faster', body: 'Access your funds sooner with same-day settlement where available.', chipCls: 'bg-[#e6e4fa] text-[#8b5cf6]' },
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
    { region: 'Europe', countries: ['United Kingdom', 'Germany', 'Portugal', 'Bulgaria', 'Ukraine'] },
    { region: 'North America', countries: ['United States'] },
    { region: 'Middle East & Africa', countries: ['Egypt'] },
  ];

  const supportedCurrencies = [
    { code: 'PHP', label: 'Philippine Peso' },
    { code: 'USD', label: 'US Dollar' },
    { code: 'EUR', label: 'Euro' },
    { code: 'GBP', label: 'Pound Sterling' },
    { code: 'CNY', label: 'Chinese Yuan' },
    { code: 'KRW', label: 'South Korean Won' },
    { code: 'VND', label: 'Vietnamese Dong' },
    { code: 'INR', label: 'Indian Rupee' },
  ];

  const paymentChannels = [
    'GCash',
    'Maya',
    'BDO',
    'BPI',
    'Landbank',
    'UnionBank',
    'Visa',
    'Mastercard',
    'American Express',
    'JCB',
    'UnionPay',
    'Discover',
    'Alipay',
    'WeChat Pay',
    'Bank transfer',
    'QR PH',
  ];

  const { ref: benefitsRef, isVisible: benefitsVisible } = useScrollReveal(0.1);
  const { ref: featuresRef, isVisible: featuresVisible } = useScrollReveal(0.1);
  const { ref: resultsRef, isVisible: resultsVisible } = useScrollReveal(0.1);
  const { ref: industriesRef, isVisible: industriesVisible } = useScrollReveal(0.1);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-display text-[#1a1a1a] [selection:bg-[#f5c8a4]]">
      <Navbar />

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes marqueeScroll { from { transform:translateX(0) } to { transform:translateX(-50%) } }
        .marquee-track { animation: marqueeScroll 36s linear infinite; }
        .marquee-wrap:hover .marquee-track { animation-play-state: paused; }
        @keyframes ringFill { to { stroke-dashoffset: 0 } }
        .ring-fill-anim { stroke-dasharray:232; stroke-dashoffset:232; animation: ringFill 1.4s cubic-bezier(.16,1,.3,1) 1s forwards; }
      `}</style>

      <main id="main">
        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="relative overflow-hidden" style={{ paddingBlock: 'clamp(48px,7vw,96px) clamp(56px,8vw,104px)', marginTop: '76px' }}>
          <div className="mx-auto max-w-[1200px] px-8">
            <div className="grid items-center gap-[clamp(40px,5vw,72px)] lg:grid-cols-[11fr_9fr]">
              {/* Copy */}
              <div>
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
                  {['Settle same-day', 'Automated reconciliation', 'Local support'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-[14px] font-semibold text-[#2c2c2c]">
                      <CheckCircle2 className="h-[18px] w-[18px] flex-none text-[#20c997]" strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                </ul>
                <a href="/contact-us/" className="inline-flex items-center gap-2.5 rounded-full bg-[#ff855b] px-[30px] py-[15px] text-[17px] font-semibold text-white shadow-sm transition-colors hover:bg-[#f2734a]">
                  Talk with a payments expert
                  <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white text-[#ff855b]">
                    <ArrowRight className="h-[13px] w-[13px]" />
                  </span>
                </a>
              </div>

              {/* Hero visual */}
              <div className="relative hidden sm:block">
                <img
                  src="https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/images/hero-photo.webp"
                  alt="A smiling businesswoman managing payments on a tablet"
                  className="relative z-[2] w-full object-contain object-bottom"
                  fetchPriority="high"
                />
                {/* Ring card */}
                <div className="absolute left-[-6%] top-[7%] z-[3] w-[min(176px,46%)] rounded-2xl bg-white p-5 shadow-[0_26px_55px_-22px_rgba(28,26,30,0.09)] text-center">
                  <p className="mb-3 text-[13px] font-semibold text-[#1a1a1a]">Transactions Today</p>
                  <div className="flex items-center justify-center">
                    <div className="relative h-[94px] w-[94px] flex-none">
                      <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90">
                        <circle className="stroke-[#e2f5f3]" cx="42" cy="42" r="37" fill="none" strokeWidth="8" />
                        <circle className="ring-fill-anim stroke-[#06d6b6]" cx="42" cy="42" r="37" fill="none" strokeWidth="8" strokeLinecap="round" />
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
                <div className="absolute bottom-[19%] right-[-7%] z-[3] flex items-center gap-2.5 rounded-xl bg-white px-4 py-3 text-[13px] font-semibold shadow-[0_18px_40px_-12px_rgba(20,20,20,0.16)]">
                  Collections
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d8faf3] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#026153]">
                    <CheckCircle2 className="h-3 w-3" strokeWidth={3} />DONE
                  </span>
                </div>
                {/* Chip: Payments */}
                <div className="absolute bottom-[6%] right-[4%] z-[3] flex items-center gap-2.5 rounded-xl bg-white px-4 py-3 text-[13px] font-semibold shadow-[0_18px_40px_-12px_rgba(20,20,20,0.16)]">
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
            className="marquee-wrap overflow-hidden"
            style={{ WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)', maskImage: 'linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)' }}
          >
            <div className="marquee-track flex w-max items-center" style={{ gap: 'clamp(64px,8vw,120px)' }}>
              {[...clientLogos, ...clientLogos].map((logo, i) => (
                <img key={i} src={logo.src} alt={i < clientLogos.length ? logo.alt : ''} aria-hidden={i >= clientLogos.length}
                  className="max-h-[44px] w-auto opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0" loading="lazy" />
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

        {/* ── Benefits (Why cards) ────────────────────────────── */}
        <section className="bg-white" style={{ paddingBlock: 'clamp(60px,8.5vw,104px)' }}>
          <div className="mx-auto max-w-[1200px] px-8">
            <div className="mx-auto mb-[clamp(40px,6vw,64px)] max-w-[720px] text-center">
              <h2 className="font-semibold tracking-[-0.018em]" style={{ fontSize: 'clamp(1.85rem,3.2vw,2.6rem)' }}>
                Settle same-day<span className="text-[#9a9a9a]">*</span><br />Zero reconciliation effort
              </h2>
              <p className="mx-auto mt-4 max-w-[640px] text-[12px] leading-relaxed text-[#9a9a9a]">
                *Same-day settlement applies to supported payment rails and is subject to network cut-off times and the receiving financial institution.
              </p>
            </div>
            <div
              ref={benefitsRef}
              className={`grid gap-[clamp(28px,3.4vw,48px)] lg:grid-cols-3 transition-all duration-700 ${benefitsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              {/* Coral */}
              <article className="relative isolate flex min-h-[228px] flex-col justify-end overflow-hidden rounded-2xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                style={{ background: 'linear-gradient(135deg,#fcefe3 0%,rgba(250,217,189,.55) 100%)' }}>
                <div className="mb-auto flex items-center justify-between gap-3">
                  <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-[14px] bg-[#fbddc6] text-[#b25f2e]">
                    <Calendar className="h-[26px] w-[26px]" />
                  </span>
                  <span className="inline-flex items-center gap-2.5 rounded-full bg-white/60 px-[14px] py-[9px] text-[14px] font-semibold text-[#535353] backdrop-blur-sm">
                    <span className="h-2 w-2 flex-none rounded-full bg-[#e79965]" />Fast access
                  </span>
                </div>
                <h3 className="mb-2 mt-5 text-[1.35rem] font-semibold leading-tight tracking-[-0.02em]">Settle same-day<span className="text-[#9a9a9a]">*</span></h3>
                <p className="text-[14px] leading-relaxed text-[#535353]">Your funds are available the same day they're collected.</p>
              </article>

              {/* Mint */}
              <article className="relative isolate flex min-h-[228px] flex-col justify-end overflow-hidden rounded-2xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                style={{ background: 'linear-gradient(135deg,#ecfdf5 0%,rgba(204,251,241,.65) 100%)' }}>
                <div className="mb-auto flex items-center justify-between gap-3">
                  <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-[14px] bg-[#c6f0e8] text-[#0d9488]">
                    <RefreshCw className="h-[26px] w-[26px]" />
                  </span>
                  <span className="inline-flex items-center gap-2.5 rounded-full bg-white/60 px-[14px] py-[9px] text-[14px] font-semibold text-[#535353] backdrop-blur-sm">
                    <span className="h-2 w-2 flex-none rounded-full bg-[#0d9488]" />Zero manual work
                  </span>
                </div>
                <h3 className="mb-2 mt-5 text-[1.35rem] font-semibold leading-tight tracking-[-0.02em]">Automated reconciliation</h3>
                <p className="text-[14px] leading-relaxed text-[#535353]">Every transaction is matched and recorded automatically.</p>
              </article>

              {/* Slate */}
              <article className="relative isolate flex min-h-[228px] flex-col justify-end overflow-hidden rounded-2xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                style={{ background: 'linear-gradient(135deg,#f8fafc 0%,rgba(226,232,240,.72) 100%)' }}>
                <div className="mb-auto flex items-center justify-between gap-3">
                  <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-[14px] bg-[#dfe4ea] text-[#475569]">
                    <Home className="h-[26px] w-[26px]" />
                  </span>
                  <span className="inline-flex items-center gap-2.5 rounded-full bg-white/60 px-[14px] py-[9px] text-[14px] font-semibold text-[#535353] backdrop-blur-sm">
                    <span className="h-2 w-2 flex-none rounded-full bg-[#4b5563]" />Local expertise
                  </span>
                </div>
                <h3 className="mb-2 mt-5 text-[1.35rem] font-semibold leading-tight tracking-[-0.02em]">Local support</h3>
                <p className="text-[14px] leading-relaxed text-[#535353]">Philippine-based support via WhatsApp and Telegram.</p>
              </article>
            </div>
          </div>
        </section>

        {/* ── Features grid ────────────────────────────────────── */}
        <section id="features" className="bg-white" style={{ paddingBlock: 'clamp(60px,8.5vw,104px)' }}>
          <div className="mx-auto max-w-[1200px] px-8">
            <div className="mx-auto mb-[clamp(40px,6vw,64px)] max-w-[720px] text-center">
              <h2 className="font-semibold tracking-[-0.018em]" style={{ fontSize: 'clamp(1.85rem,3.2vw,2.6rem)' }}>Everything your payments need, already built</h2>
            </div>
            <div
              ref={featuresRef}
              className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-700 ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              {features.map(f => (
                <div key={f.heading} className="rounded-2xl border border-[#f2f2f2] bg-white p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <span className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.chipCls}`}>
                    <f.Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mb-2 text-[16px] font-semibold">{f.heading}</h3>
                  <p className="text-[14px] leading-[1.55] text-[#9a9a9a]">{f.body}</p>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-5 grid max-w-[calc(75%-5px*0.25)] grid-cols-1 gap-5 sm:grid-cols-3">
              {features2.map(f => (
                <div key={f.heading} className="rounded-2xl border border-[#f2f2f2] bg-white p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <span className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.chipCls}`}>
                    <f.Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mb-2 text-[16px] font-semibold">{f.heading}</h3>
                  <p className="text-[14px] leading-[1.55] text-[#9a9a9a]">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Global coverage and payment rails ───────────────────────────────── */}
        <section className="bg-[#f8fafc]" style={{ paddingBlock: 'clamp(60px,8.5vw,104px)' }}>
          <div className="mx-auto max-w-[1200px] px-8">
            <div className="mx-auto mb-[clamp(32px,4vw,52px)] max-w-[720px] text-center">
              <span className="mb-4 block text-[13px] font-semibold uppercase tracking-[0.1em] text-[#c2410c]">Global coverage</span>
              <h2 className="font-semibold tracking-[-0.018em]" style={{ fontSize: 'clamp(1.85rem,3.2vw,2.6rem)' }}>Support where your customers are</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-[28px] border border-[#e2e8f0] bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0f2fe] text-[#0369a1]">
                    <Globe className="h-6 w-6" />
                  </span>
                  <h3 className="text-[22px] font-semibold tracking-[-0.02em]">Supported countries</h3>
                </div>
                <div className="space-y-4">
                  {supportedMarkets.map(group => (
                    <div key={group.region}>
                      <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">{group.region}</p>
                      <div className="flex flex-wrap gap-2">
                        {group.countries.map(country => (
                          <span key={country} className="rounded-full bg-[#f1f5f9] px-3 py-1.5 text-[13px] font-medium text-[#1e293b]">{country}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-[#e2e8f0] bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ecfeff] text-[#0f766e]">
                    <TrendingUp className="h-6 w-6" />
                  </span>
                  <h3 className="text-[22px] font-semibold tracking-[-0.02em]">Currencies</h3>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {supportedCurrencies.map(currency => (
                    <div key={currency.code} className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] px-4 py-3 text-center">
                      <div className="text-[15px] font-bold text-[#0f172a]">{currency.code}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.08em] text-[#64748b]">{currency.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-[#e2e8f0] bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff7ed] text-[#c2410c]">
                    <CreditCard className="h-6 w-6" />
                  </span>
                  <h3 className="text-[22px] font-semibold tracking-[-0.02em]">Payment channels</h3>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {paymentChannels.map(channel => (
                    <span key={channel} className="rounded-full bg-[#fff7ed] px-3 py-2 text-[13px] font-semibold text-[#7c2d12]">{channel}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Solutions (tabbed) ───────────────────────────────── */}
        <section id="solutions" className="bg-[#fafafa]" style={{ paddingBlock: 'clamp(60px,8.5vw,104px)' }}>
          <div className="mx-auto max-w-[1200px] px-8">
            <div className="mx-auto mb-[clamp(40px,6vw,64px)] max-w-[720px] text-center">
              <span className="mb-4 block text-[13px] font-semibold uppercase tracking-[0.1em] text-[#c2410c]">Solutions and tools</span>
              <h2 className="font-semibold tracking-[-0.018em]" style={{ fontSize: 'clamp(1.85rem,3.2vw,2.6rem)' }}>One system for your entire payment operation</h2>
            </div>
            <SolutionsTabs />
          </div>
        </section>

        {/* ── Results ──────────────────────────────────────────── */}
        <section id="stories" className="bg-white" style={{ paddingBlock: 'clamp(60px,8.5vw,104px)' }}>
          <div className="mx-auto max-w-[1200px] px-8">
            <div className="mx-auto mb-[clamp(40px,6vw,64px)] max-w-[720px] text-center">
              <h2 className="font-semibold tracking-[-0.018em]" style={{ fontSize: 'clamp(1.85rem,3.2vw,2.6rem)' }}>Real results from real implementations</h2>
            </div>
            <div
              ref={resultsRef}
              className={`grid grid-cols-1 gap-6 sm:grid-cols-3 transition-all duration-700 ${resultsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              {results.map(r => (
                <article key={r.industry} className="flex flex-col overflow-hidden rounded-2xl border border-[#e6e6e6] bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
                  <div className="flex min-h-[168px] items-center justify-center p-8" style={{ background: r.logoBg }}>
                    <img src={r.logo} alt={r.industry} className="h-[46px] w-auto max-w-[78%] object-contain" style={{ filter: r.logoFilter }} loading="lazy" />
                  </div>
                  <div className="flex flex-1 flex-col items-start gap-3 p-6">
                    <span className="rounded-full bg-[#f2f2f2] px-3 py-1 text-[14px] font-semibold text-[#2c2c2c]">{r.tag}</span>
                    <h3 className="text-[22px] font-semibold tracking-[-0.01em]">{r.industry}</h3>
                    <p className="text-[16px] leading-relaxed text-[#535353]">{r.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Industries ───────────────────────────────────────── */}
        <section id="industries" style={{ background: '#fff0eb', paddingBlock: 'clamp(60px,8.5vw,104px)' }}>
          <div className="mx-auto max-w-[1200px] px-8">
            <div className="mx-auto mb-[clamp(40px,6vw,64px)] max-w-[720px] text-center">
              <h2 className="font-semibold tracking-[-0.018em]" style={{ fontSize: 'clamp(1.85rem,3.2vw,2.6rem)' }}>Used across industries with complex payment needs</h2>
            </div>
            <div
              ref={industriesRef}
              className={`mx-auto grid max-w-[980px] grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 transition-all duration-700 ${industriesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              {industries.map(({ label, Icon, color }) => (
                <div key={label} className="group flex flex-col items-center gap-3 text-center">
                  <span className={`flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md ${color}`}>
                    <Icon className="h-7 w-7" />
                  </span>
                  <span className="text-[14px] font-semibold text-[#6a3617]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Security badges ──────────────────────────────────── */}
        <section id="security" className="bg-white" style={{ paddingBlock: 'clamp(60px,8.5vw,104px)' }}>
          <div className="mx-auto max-w-[1200px] px-8">
            <div className="mx-auto mb-[clamp(40px,6vw,64px)] max-w-[720px] text-center">
              <h2 className="font-semibold tracking-[-0.018em]" style={{ fontSize: 'clamp(1.85rem,3.2vw,2.6rem)' }}>Enterprise-grade security and compliance</h2>
              <p className="mt-5 text-[18px] leading-[1.65] text-[#535353]">Built to meet enterprise standards and Philippine regulatory requirements, including PCI DSS and BSP-aligned controls.</p>
            </div>
            <div className="mx-auto grid max-w-[1040px] grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
              {securityBadges.map(badge => (
                <div key={badge.label} className="flex flex-col items-center gap-4 text-center">
                  <img src={badge.src} alt={badge.label} className="h-[65px] w-auto opacity-50 grayscale" loading="lazy" />
                  <span className="max-w-[14ch] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9a9a9a]">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ───────────────────────────────────────── */}
        <section
          className="text-center text-white"
          style={{ background: '#191919', backgroundImage: 'radial-gradient(ellipse 60% 80% at 50% 120%,rgba(238,134,73,.14),transparent 62%)', paddingBlock: 'clamp(60px,8.5vw,104px)' }}
        >
          <div className="mx-auto max-w-[1200px] px-8">
            <h2 className="mx-auto mb-10 max-w-[17ch] font-semibold leading-tight tracking-[-0.018em] text-white" style={{ fontSize: 'clamp(1.85rem,3.2vw,2.6rem)' }}>
              See how SwiftPay transforms your payment operations
            </h2>
            <a href="/contact-us/" className="inline-flex items-center gap-2.5 rounded-full bg-[#ff855b] px-[32px] py-[14px] text-[18px] font-semibold text-white shadow-sm transition-colors hover:bg-[#f2734a]">
              Talk with a payments expert
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white/20">
                <ArrowRight className="h-[13px] w-[13px]" />
              </span>
            </a>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-[#191919] text-[14px]" style={{ borderTop: '1px solid rgba(255,255,255,.09)', color: 'rgba(255,255,255,.66)' }}>
        <div className="mx-auto max-w-[1200px] px-8">
          {/* Top row */}
          <div className="grid gap-8 pb-12 pt-16 lg:grid-cols-[1.3fr_auto]">
            <div>
              <img src="https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/swiftpay-logo-white.svg" alt="SwiftPay" height={28} className="mb-5 h-[28px] w-auto" />
              <p>The payment infrastructure powering Philippine businesses</p>
              <p className="mt-1 text-white/[0.42]">Enterprise-grade, built for scale</p>
            </div>
            <div className="text-right">
              <span className="mb-4 block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/[0.42]">Associated Brands</span>
              <div className="flex items-center justify-end gap-6">
                <a href="https://www.nextbank.ph/" target="_blank" rel="noopener" className="font-semibold transition-colors hover:text-white">Nextbank</a>
                <a href="https://www.miquido.com" target="_blank" rel="noopener" className="font-semibold transition-colors hover:text-white">Miquido</a>
              </div>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 py-12 lg:grid-cols-4" style={{ borderTop: '1px solid rgba(255,255,255,.09)' }}>
            <div>
              <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/[0.42]">Solutions</h3>
              <ul className="grid gap-3">
                {['Online Payments', 'Payment Reminders', 'Disbursements', 'Reconciliation'].map(s => (
                  <li key={s}><a href="#solutions" className="transition-colors hover:text-white">{s}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/[0.42]">Company</h3>
              <ul className="grid gap-3">
                <li><Link to="https://swiftpay.ph/why-swiftpay/" className="transition-colors hover:text-white">Why SwiftPay</Link></li>
                <li><Link to="/login" className="transition-colors hover:text-white">Merchant Portal</Link></li>
                <li><a href="/contact-us/" className="transition-colors hover:text-white">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/[0.42]">Legal</h3>
              <ul className="grid gap-3">
                <li><Link to="https://swiftpay.ph/policies" className="transition-colors hover:text-white">Privacy Policy</Link></li>
                <li><Link to="https://swiftpay.ph/terms" className="transition-colors hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/[0.42]">Contact</h3>
              <ul className="grid gap-3">
                <li><a href="mailto:support@swiftpay.site" className="transition-colors hover:text-white">support@swiftpay.site</a></li>
                <li><span className="text-white/[0.42]">BGC, Taguig City, Philippines</span></li>
              </ul>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="grid gap-3 py-6" style={{ borderTop: '1px solid rgba(255,255,255,.09)' }}>
            <p className="max-w-[110ch] text-[12px] leading-relaxed text-white/[0.42]">
              Swift Technology Ventures Inc. is regulated by the Bangko Sentral ng Pilipinas (BSP) as an Operator of Payment System (OPS).
              SwiftPay is PCI DSS compliant and ISO/IEC 27001 certified.
            </p>
            <p className="max-w-[110ch] text-[12px] leading-relaxed text-white/[0.42]">
              *T-0 Settlement applies to supported payment rails and is subject to network cut-off times and the receiving financial institution. Transactions submitted after cut-off may settle the next banking day.
            </p>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-6 text-[13px] text-white/[0.42]" style={{ borderTop: '1px solid rgba(255,255,255,.09)' }}>
            <span>© {new Date().getFullYear()} Swift Technology Ventures Inc. All rights reserved.</span>
            <div className="flex flex-wrap gap-5">
              <a href="https://swiftpay.ph/policies" className="transition-colors hover:text-white">Privacy Policy</a>
              <a href="https://swiftpay.ph/terms" className="transition-colors hover:text-white">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
