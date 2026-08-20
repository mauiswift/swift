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
                    src="/static/images/payment-methods-list.webp"
                  alt="Supported payment methods"
                  className="max-w-full"
                  loading="lazy"
                    onError={(e) => { const img = e.currentTarget as HTMLImageElement; img.onerror = null; img.src = 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/images/payment-methods-list.webp'; }}
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
          <Link to="/pricing" className="text-[15px] font-semibold text-[#535353] transition-colors hover:text-[#1a1a1a]">Pricing</Link>
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
          <Link to="/pricing" className="block border-b border-[#f2f2f2] py-3 font-semibold text-[#1a1a1a]" onClick={() => setOpen(false)}>Pricing</Link>
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
    { region: 'East Asia', countries: ['South Korea'] },
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
    { name: 'Maya', logo: '/logos/maya.svg' },
    { name: 'GCash', logo: '/logos/gcash.svg' },
    { name: 'BPI', logo: '/logos/bpi.png' },
    { name: 'BDO', logo: '/logos/bdo.png' },
    { name: 'Landbank', logo: '/logos/landbank.png' },
    { name: 'UnionBank', logo: '/logos/unionbank.png' },
    { name: 'Alipay', logo: '/logos/alipay.svg' },
    { name: 'WeChat Pay', logo: '/logos/wechat.svg' },
    { name: 'KakaoPay', logo: '/logos/kakaopay.png' },
    { name: 'NaverPay', logo: '/logos/naverpay.png' },
    { name: 'Toss Pay', logo: '/logos/tosspay.png' },
    { name: 'PAYCO', logo: '/logos/payco.png' },
    { name: 'QR PH', logo: '/logos/qrph.svg' },
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
        @keyframes floatSlow { 0%,100% { transform:translateY(0px) } 50% { transform:translateY(-10px) } }
        @keyframes pulseGlow { 0%,100% { box-shadow:0 0 0 0 rgba(249,115,22,0.15); } 50% { box-shadow:0 0 0 14px rgba(249,115,22,0); } }
        @keyframes shimmer { 0% { transform:translateX(-120%);} 100% { transform:translateX(120%);} }
        .float-slow { animation: floatSlow 6s ease-in-out infinite; }
        .pulse-glow { animation: pulseGlow 3.2s ease-in-out infinite; }
        .shine::after {
          content:'';
          position:absolute;
          inset:-30% auto -30% -30%;
          width:55%;
          transform:translateX(-120%);
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.52),transparent);
          animation: shimmer 3.6s ease-in-out infinite;
        }
        .soft-grid {
          background-image: linear-gradient(rgba(15,23,42,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.02) 1px, transparent 1px);
          background-size: 18px 18px;
        }
      `}</style>

      <main id="main">
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
                  {['Settle same-day', 'Automated reconciliation', 'Local support'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-[14px] font-semibold text-[#2c2c2c]">
                      <CheckCircle2 className="h-[18px] w-[18px] flex-none text-[#20c997]" strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                </ul>
                <a href="/contact-us/" className="group inline-flex items-center gap-2.5 rounded-full bg-[#ff855b] px-[30px] py-[15px] text-[17px] font-semibold text-white shadow-[0_18px_40px_-12px_rgba(22,22,22,0.12)] transition-transform duration-200 hover:scale-[1.01]">
                  Talk with a payments expert
                  <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white text-[#ff855b] transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="h-[13px] w-[13px]" />
                  </span>
                </a>
              </div>

              {/* Hero visual */}
              <div className="relative hidden sm:block">
                <div className="absolute inset-10 rounded-[2rem] bg-gradient-to-br from-[#fff7ed] via-white to-[#dbeafe] blur-2xl opacity-70" />
                <img
                  src="https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/images/hero-photo.webp"
                  alt="A smiling businesswoman managing payments on a tablet"
                  className="float-slow relative z-[2] w-full object-contain object-bottom drop-shadow-[0_30px_70px_rgba(15,23,42,0.12)]"
                  fetchPriority="high"
                />
                {/* Ring card */}
                <div className="pulse-glow absolute left-[-6%] top-[7%] z-[3] w-[min(176px,46%)] rounded-2xl bg-white/90 p-5 shadow-[0_26px_55px_-22px_rgba(28,26,30,0.09)] backdrop-blur-sm text-center">
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
                <div className="absolute bottom-[19%] right-[-7%] z-[3] flex items-center gap-2.5 rounded-xl bg-white/90 px-4 py-3 text-[13px] font-semibold shadow-[0_18px_40px_-12px_rgba(20,20,20,0.07)]">
                  Collections
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d8faf3] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#026153]">
                    <CheckCircle2 className="h-3 w-3" strokeWidth={3} />DONE
                  </span>
                </div>
                {/* Chip: Payments */}
                <div className="absolute bottom-[6%] right-[4%] z-[3] flex items-center gap-2.5 rounded-xl bg-white/90 px-4 py-3 text-[13px] font-semibold shadow-[0_18px_40px_-12px_rgba(20,20,20,0.07)]">
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

        {/* remaining content unchanged */}
      </main>

      {/* footer omitted for brevity */}
    </div>
  );
}

export default HomePage;
