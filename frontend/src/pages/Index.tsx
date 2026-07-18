import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Landmark,
  LockKeyhole,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { SUPPORT_URL } from '@/lib/brand';
import ComplianceBar from '@/components/ComplianceBar';

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

  const navLinks = [
    { label: 'Why SwiftPay', href: '#why' },
    { label: 'Security', href: '#security' },
  ];

  const solutionLinks = [
    { label: 'Online Payments', href: '#solutions--online-payments' },
    { label: 'Payment Reminders', href: '#solutions--payment-reminders' },
    { label: 'Payment Routing', href: '#solutions--payment-routing' },
    { label: 'Subscriptions', href: '#solutions--subscriptions' },
    { label: 'Fraud Management', href: '#security' },
    { label: 'Disbursements', href: '#solutions--disbursements' },
    { label: 'Reconciliation', href: '#solutions--reconciliation' },
  ];

  return (
    <nav className={`fixed inset-x-0 top-0 z-50 border-b border-[#e9e3db] transition-all duration-300 ${scrolled ? 'bg-white/95 shadow-sm backdrop-blur-md' : 'bg-[#fcfbf8]/90 backdrop-blur-sm'}`}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-6 w-4 grid-cols-2 items-center gap-1">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-1.5 w-1.5 rounded-full bg-[#1a1a1a]" />
            ))}
          </div>
          <span className="text-[22px] font-bold tracking-tight text-[#1a1a1a] font-display">SwiftPay</span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#4d4d4d] transition-colors hover:text-[#1a1a1a]"
              aria-expanded={menuOpen}
            >
              Solutions
              <ChevronDown className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute left-0 z-50 mt-3 w-72 rounded-[28px] border border-[#ece7e1] bg-white p-4 shadow-xl">
                {solutionLinks.map((item) => (
                  <a key={item.label} href={item.href} className="block rounded-2xl px-4 py-3 text-sm font-semibold text-[#1a1a1a] transition-colors hover:bg-[#fcf6ef] hover:text-[#c04e15]">
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          <a href="/why-swiftpay/" className="text-[13px] font-semibold text-[#4d4d4d] transition-colors hover:text-[#1a1a1a]">
            Why SwiftPay
          </a>
          <Link to="/login" className="text-[13px] font-semibold text-[#4d4d4d] transition-colors hover:text-[#1a1a1a]">
            Merchant Portal
          </Link>
          <a href={SUPPORT_URL} className="rounded-full bg-[#1a1a1a] px-7 py-3 text-[13px] font-semibold text-white transition-all hover:bg-[#2b2b2b]">
            Request a demo
          </a>
        </div>

        <button className="rounded-full p-2 text-[#1a1a1a] lg:hidden" onClick={() => setOpen((value) => !value)}>
          {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[#e9e3db] bg-white/95 p-6 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-5">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-lg font-semibold text-[#1a1a1a]" onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
            <Link to="/login" className="text-lg font-semibold text-[#1a1a1a]" onClick={() => setOpen(false)}>
              Merchant Portal
            </Link>
            <a href={SUPPORT_URL} className="text-lg font-semibold text-[#1a1a1a]" onClick={() => setOpen(false)}>
              Request a demo
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

function HomePage() {
  const trustedBrands = ['Smart', 'Allianz', 'FLASH EXPRESS', 'Cebuana Lhuillier', 'Metrobank', 'Maya'];
  const stats = [
    { value: '₱57B+', label: 'processed to date' },
    { value: '30M+', label: 'monthly volume' },
    { value: '500+', label: 'businesses served' },
  ];

  const pillars = [
    {
      num: '01',
      title: 'Online Payments',
      description: 'Accept every payment. Connect cards, e-wallets, QR, and bank transfers into one checkout experience.',
      tools: ['Universal Checkout', 'QR Ph', 'GCash/Maya', 'Visa/Mastercard'],
    },
    {
      num: '02',
      title: 'Disbursements',
      description: 'Send payouts in real time to riders, partners, and merchants via local rails across the Philippines.',
      tools: ['Bulk Uploads', 'Real-Time Payouts', 'Approval Flows', 'Audit Trails'],
    },
    {
      num: '03',
      title: 'Payment Reminders',
      description: 'Reduce late payments with automated follow-ups delivered through SMS, Viber, and voice automation.',
      tools: ['Automated Follow-Ups', 'Viber/WhatsApp', 'AI Voice Agent', 'Custom Branding'],
    },
    {
      num: '04',
      title: 'Fraud Management',
      description: 'Protect high-volume flows with rules designed for the Philippine threat landscape and specific risk scenarios.',
      tools: ['Risk Scoring', 'Velocity Rules', 'Manual Review', 'BSP-Aligned Controls'],
    },
    {
      num: '05',
      title: 'Reconciliation',
      description: 'Automatically match transactions and keep finance teams aligned with up-to-date reporting and ledger views.',
      tools: ['Auto-Matching', 'ERP Integration', 'Exception Handling', 'Financial Reporting'],
    },
    {
      num: '06',
      title: 'Payment Routing',
      description: 'Increase uptime with intelligent routing and automatic failover that keep payment acceptance resilient.',
      tools: ['Failover Logic', 'Multi-Rail Availability', 'Smart Routing', 'Availability Guardrails'],
    },
    {
      num: '07',
      title: 'Enterprise Support',
      description: 'Work with dedicated experts for onboarding, implementation, and 24/7 operational continuity.',
      tools: ['Success Manager', 'SLA Support', 'Technical Scoping', 'Compliance Guidance'],
    },
  ];

  const caseStudies = [
    {
      industry: 'Retail',
      title: 'Consolidating 15+ payment channels',
      impact: 'SwiftPay unified our entire payment stack, reducing reconciliation time by 80% for our nationwide electronics chain.',
    },
    {
      industry: 'Insurance',
      title: 'Automating premium collections',
      impact: 'By implementing reminders and subscriptions, we increased on-time premium payments by 35% in just three months.',
    },
    {
      industry: 'Logistics',
      title: 'Real-time disbursements to riders',
      impact: 'Processing thousands of daily payouts is now instantaneous, giving riders immediate access to their earnings.',
    },
  ];

  const securityItems = [
    { title: 'BSP-aligned infrastructure', description: 'Built for Philippine regulatory expectations and operational resilience.' },
    { title: 'Advanced fraud controls', description: 'Real-time rules, velocity checks, and manual review workflows for high-risk flows.' },
    { title: 'Encrypted by default', description: 'TLS and modern key-management practices protect every transaction and API call.' },
    { title: 'Enterprise support', description: 'A dedicated team helps your operations stay live and compliant at scale.' },
  ];

  const industries = ['Retail & FMCG', 'Insurance', 'Financial Services', 'Logistics', 'Education', 'Real Estate', 'Healthcare', 'Government', 'E-commerce', 'Remittance', 'Hospitality', 'Utilities'];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fcfbf8] text-[#1a1a1a] selection:bg-[#f5c8a4]">
      <Navbar />

      <main>
        <section className="relative pt-32 pb-20 sm:pt-36 lg:pt-40 lg:pb-28">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-8">
            <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#f1d8c3] bg-[#fff6ee] px-4 py-2 text-sm font-semibold text-[#c04e15]">
                  <Sparkles className="h-4 w-4" />
                  Philippine payment infrastructure for modern enterprises
                </div>

                <h1 className="mt-8 text-5xl font-black leading-[0.95] tracking-[-0.03em] text-[#1a1a1a] sm:text-6xl lg:text-[88px] font-display">
                  The payment gateway for{' '}
                  <span className="relative inline-block">
                    Philippine enterprises
                    <span className="absolute bottom-1 left-0 h-2 w-full rounded-full bg-[#f8b08d]/70" />
                  </span>
                </h1>

                <p className="mt-8 max-w-xl text-lg leading-8 text-[#5f5f5f] sm:text-xl">
                  Accept payments, manage subscriptions, and send disbursements across major Philippine channels in one unified platform.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3 text-sm font-semibold text-[#2d2d2d]">
                  {['Same-day settlements', 'Automated reconciliation', 'Local support'].map((item) => (
                    <div key={item} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-[#ece7e1]">
                      <CheckCircle2 className="h-4 w-4 text-[#1fa67a]" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <a href={SUPPORT_URL} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff855b] px-8 py-4 text-base font-semibold text-white shadow-[0_14px_30px_rgba(255,133,91,0.28)] transition-transform hover:-translate-y-0.5 hover:bg-[#f2734a]">
                    Talk with a payments expert
                    <ArrowRight className="h-5 w-5" />
                  </a>
                  <Link to="/login" className="inline-flex items-center justify-center gap-2 text-base font-semibold text-[#525252] transition-colors hover:text-[#1a1a1a]">
                    Merchant Portal
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_top,_rgba(255,133,91,0.18),_transparent_65%)] blur-3xl" />
                <div className="relative overflow-hidden rounded-[2.5rem] border border-[#e9e3db] bg-white p-3 shadow-[0_20px_80px_rgba(15,23,42,0.12)]">
                  <img
                    src="https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/images/hero-photo.webp"
                    alt="SwiftPay payments team"
                    className="h-[520px] w-full rounded-[1.8rem] object-cover sm:h-[600px]"
                  />

                  <div className="absolute left-8 top-8 rounded-full border border-[#e9e3db] bg-[#fff8f2] px-4 py-2 text-sm font-semibold text-[#b96f37] shadow-sm">
                    Same-day settlement
                  </div>

                  <div className="absolute bottom-8 right-8 max-w-[250px] rounded-[1.5rem] border border-[#ece7e1] bg-white/95 p-4 shadow-xl backdrop-blur">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9a9a9a]">Live operations</p>
                    <div className="mt-3 rounded-2xl bg-[#f7f7f7] px-4 py-3 text-sm font-semibold text-[#1a1a1a]">
                      Collections and disbursements synced in one place
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#ece7e1] bg-white/80 py-8">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold uppercase tracking-[0.25em] text-[#6f6f6f]">
              <span className="text-[11px]">Trusted by leading enterprises</span>
              <div className="flex flex-wrap items-center justify-center gap-6 text-base font-black text-[#1a1a1a]">
                {trustedBrands.map((brand) => (
                  <span key={brand} className="whitespace-nowrap">
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="why" className="bg-[#191919] py-24 text-white sm:py-28 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#ffb18f]">Why SwiftPay</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:text-[44px]">
                Designed for high-volume transactions and dependable operations.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#c7c7c7]">
                From recurring collections to large-scale disbursements, SwiftPay gives finance teams one operating layer to process transactions at scale.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                  <p className="text-4xl font-black tracking-[-0.02em] sm:text-5xl">{stat.value}</p>
                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#9b9b9b]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="solutions" className="bg-[#faf7f2] py-24 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c04e15]">Solutions & tools</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.02em] text-[#1a1a1a] sm:text-4xl lg:text-[44px]">
                One system for your entire payment operation.
              </h2>
            </div>

            <div className="mt-14 space-y-4">
              {pillars.map((pillar) => (
                <div key={pillar.num} className="rounded-[2rem] border border-[#e7dfd8] bg-white p-8 shadow-sm transition-transform hover:-translate-y-0.5">
                  <div className="grid gap-6 lg:grid-cols-[0.1fr_0.8fr_0.6fr] lg:items-start">
                    <p className="text-2xl font-black text-[#d7d0c8]">{pillar.num}</p>
                    <div>
                      <h3 className="text-2xl font-bold text-[#1a1a1a]">{pillar.title}</h3>
                      <p className="mt-3 text-base leading-7 text-[#5f5f5f]">{pillar.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {pillar.tools.map((tool) => (
                        <span key={tool} className="rounded-full border border-[#ece7e1] bg-[#faf7f2] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5f5f]">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-24 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c04e15]">Real results</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.02em] text-[#1a1a1a] sm:text-4xl lg:text-[44px]">
                Consolidating the landscape for modern finance teams.
              </h2>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {caseStudies.map((study) => (
                <div key={study.title} className="rounded-[2rem] border border-[#ece7e1] bg-[#fcfbf8] p-8 shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c04e15]">{study.industry}</p>
                  <h3 className="mt-4 text-2xl font-bold text-[#1a1a1a]">{study.title}</h3>
                  <p className="mt-4 text-base leading-7 text-[#5f5f5f]">"{study.impact}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="bg-[#f7f2ea] py-24 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div className="max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c04e15]">Security & compliance</p>
                <h2 className="mt-4 text-3xl font-bold tracking-[-0.02em] text-[#1a1a1a] sm:text-4xl lg:text-[44px]">
                  Enterprise-grade infrastructure with a compliance-first mindset.
                </h2>
                <p className="mt-5 text-lg leading-8 text-[#5f5f5f]">
                  Designed to meet the rigor of modern payments operations while protecting customers, merchants, and internal teams.
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#e8dfd8] bg-[#fff7ef] text-[#c04e15]">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#e8dfd8] bg-[#fff7ef] text-[#c04e15]">
                    <LockKeyhole className="h-8 w-8" />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {securityItems.map((item, index) => (
                  <div key={item.title} className="rounded-[1.5rem] border border-[#ece7e1] bg-white p-6 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9a9a9a]">0{index + 1}</p>
                    <h3 className="mt-3 text-xl font-bold text-[#1a1a1a]">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#5f5f5f]">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-24 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c04e15]">Industry experience</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.02em] text-[#1a1a1a] sm:text-4xl lg:text-[44px]">
                Deep expertise across Philippine sectors.
              </h2>
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {industries.map((industry) => (
                <div key={industry} className="rounded-[1.5rem] border border-[#ece7e1] bg-[#fcfbf8] p-6 text-center text-lg font-semibold text-[#1a1a1a] shadow-sm">
                  {industry}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f6efe8] py-24 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-8">
            <div className="rounded-[2.5rem] border border-[#e9dece] bg-white p-8 shadow-[0_18px_60px_rgba(20,20,20,0.06)] sm:p-10 lg:p-14">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c04e15]">Ready to modernize payments?</p>
                  <h2 className="mt-4 text-3xl font-bold tracking-[-0.02em] text-[#1a1a1a] sm:text-4xl">
                    See how SwiftPay can power your next growth phase.
                  </h2>
                </div>
                <a href={SUPPORT_URL} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1a1a1a] px-8 py-4 text-base font-semibold text-white transition-transform hover:-translate-y-0.5">
                  Schedule a consultation
                  <ArrowRight className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ComplianceBar />

      <footer className="border-t border-[#ece7e1] bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="max-w-sm">
              <Link to="/" className="flex items-center gap-2">
                <div className="grid h-6 w-4 grid-cols-2 items-center gap-1">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="h-1.5 w-1.5 rounded-full bg-[#1a1a1a]" />
                  ))}
                </div>
                <span className="text-[22px] font-bold tracking-tight text-[#1a1a1a] font-display">SwiftPay</span>
              </Link>
              <p className="mt-6 text-sm leading-7 text-[#5f5f5f]">
                Swift Technology Ventures Inc. is a BSP-regulated Operator of Payment System serving enterprise merchants across the Philippines.
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#9a9a9a]">Solutions</p>
              <div className="mt-5 flex flex-col gap-3 text-sm font-semibold text-[#2f2f2f]">
                <a href="#solutions" className="hover:text-[#1a1a1a]">Online Payments</a>
                <a href="#solutions" className="hover:text-[#1a1a1a]">Disbursements</a>
                <a href="#solutions" className="hover:text-[#1a1a1a]">Payment Reminders</a>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#9a9a9a]">Company</p>
              <div className="mt-5 flex flex-col gap-3 text-sm font-semibold text-[#2f2f2f]">
                <a href="#why" className="hover:text-[#1a1a1a]">Why SwiftPay</a>
                <Link to="/login" className="hover:text-[#1a1a1a]">Merchant Portal</Link>
                <Link to="/policies" className="hover:text-[#1a1a1a]">Policies</Link>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#9a9a9a]">Contact</p>
              <div className="mt-5 flex flex-col gap-3 text-sm font-semibold text-[#2f2f2f]">
                <a href={SUPPORT_URL} className="hover:text-[#1a1a1a]">support@swiftpay.site</a>
                <span className="text-[#6f6f6f]">BGC, Manila, Philippines</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
