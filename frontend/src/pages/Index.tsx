import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import type { ElementType } from 'react';
import { ArrowUpRight, Menu, X, Shield, CheckCircle2, Lock, Terminal, Sparkles, CircleDollarSign, BadgeCheck, Workflow } from 'lucide-react';
import { SUPPORT_URL } from '@/lib/brand';
import ComplianceBar from '@/components/ComplianceBar';

const heroImage = 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/images/hero-photo.webp';
const paymentLogos = [
  { label: 'QRPh', src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/pm-qrph.svg' },
  { label: 'GCash', src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/pm-gcash.webp' },
  { label: 'Maya', src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/pm-maya.svg' },
  { label: 'Visa', src: 'https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/pm-visa.svg' },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Solutions', to: '#solutions' },
    { label: 'Why SwiftPay', to: '#why' },
    { label: 'Security', to: '#security' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md border-b border-slate-100 h-20' : 'bg-transparent h-24'}`}>
      <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between px-8 lg:px-24">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-6 w-4 grid-cols-2 items-center gap-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-1.5 w-1.5 rounded-full bg-slate-900" />
            ))}
          </div>
          <span className="text-[22px] font-bold tracking-tight text-slate-900 font-display">SwiftPay</span>
        </Link>

        <div className="hidden items-center gap-10 lg:flex">
          {navLinks.map((link) => (
            <a key={link.label} href={link.to} className="text-[13px] font-bold text-slate-800 transition-colors hover:text-slate-900 font-display">
              {link.label}
            </a>
          ))}
          <Link to="/login" className="text-[13px] font-bold text-slate-800 transition-colors hover:text-slate-900">
            Merchant Portal
          </Link>
          <a href={SUPPORT_URL} className="rounded-full bg-slate-950 px-8 py-3 text-[13px] font-bold text-white transition-all hover:bg-black">
            Request a demo
          </a>
        </div>

        <button className="rounded-full p-2 text-slate-900 lg:hidden" onClick={() => setOpen((value) => !value)}>
          {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </div>

      {open && (
        <div className="border-b border-slate-100 bg-white/95 p-8 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-6 font-display">
            {navLinks.map((link) => (
              <a key={link.label} href={link.to} className="text-lg font-semibold text-slate-900" onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
            <Link to="/login" className="text-lg font-semibold text-slate-900" onClick={() => setOpen(false)}>
              Merchant Portal
            </Link>
            <a href={SUPPORT_URL} className="text-lg font-semibold text-slate-900" onClick={() => setOpen(false)}>
              Request a demo
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function CountUp({ end, suffix = '', duration = 2200, trigger = true }: { end: number; suffix?: string; duration?: number; trigger?: boolean }) {
  const [count, setCount] = useState(0);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    if (!trigger || hasRun) return;
    let startTime: number | null = null;
    let frame = 0;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        frame = window.requestAnimationFrame(step);
      } else {
        setHasRun(true);
      }
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [end, duration, trigger, hasRun]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

function StatsGrid() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div ref={ref} className="grid gap-12 md:grid-cols-3 lg:gap-24">
      <div className="space-y-4 transition-transform duration-500 hover:scale-105">
        <p className="text-7xl font-black leading-none tracking-tighter text-white lg:text-[110px] font-display">
          ₱<CountUp end={57} suffix="B+" trigger={isVisible} />
        </p>
        <p className="text-[14px] font-black uppercase tracking-[0.4em] text-slate-400 font-display">processed to date</p>
      </div>
      <div className="space-y-4 transition-transform duration-500 hover:scale-105">
        <p className="text-7xl font-black leading-none tracking-tighter text-white lg:text-[110px] font-display">
          <CountUp end={30} suffix="M+" trigger={isVisible} />
        </p>
        <p className="text-[14px] font-black uppercase tracking-[0.4em] text-slate-400 font-display">monthly, zero downtime*</p>
      </div>
      <div className="space-y-4 transition-transform duration-500 hover:scale-105">
        <p className="text-7xl font-black leading-none tracking-tighter text-white lg:text-[110px] font-display">
          <CountUp end={500} suffix="+" trigger={isVisible} />
        </p>
        <p className="text-[14px] font-black uppercase tracking-[0.4em] text-slate-400 font-display">businesses served</p>
      </div>
    </div>
  );
}

function FeatureCard({ title, description, icon: Icon, delay = '0s' }: { title: string; description: string; icon: ElementType; delay?: string }) {
  return (
    <div style={{ animationDelay: delay }} className="animate-fade-in-up rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_10px_35px_rgba(15,23,42,0.04)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#FF7A45]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-3 text-2xl font-bold text-slate-900 font-display">{title}</h3>
      <p className="text-base leading-relaxed text-slate-600">{description}</p>
    </div>
  );
}

function SolutionBlock({ title, description, bullets, delay = '0s' }: { title: string; description: string; bullets: string[]; delay?: string }) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div ref={ref} style={{ animationDelay: delay }} className={`rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_12px_35px_rgba(15,23,42,0.04)] transition-all duration-700 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)] ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
      <h3 className="mb-4 text-2xl font-semibold text-slate-900 font-display">{title}</h3>
      <p className="mb-6 text-base leading-relaxed text-slate-600">{description}</p>
      <ul className="flex flex-wrap gap-2">
        {bullets.map((bullet) => (
          <li key={bullet} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700">
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SecurityItem({ num, title, description }: { num: string; title: string; description: string }) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div ref={ref} className={`rounded-3xl border border-white/10 bg-white/5 p-8 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.08] ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
      <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">{num}</div>
      <h4 className="mb-3 text-xl font-bold text-white font-display">{title}</h4>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}

function IndustryCard({ industry }: { industry: string }) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div ref={ref} className={`flex h-64 flex-col justify-between rounded-[36px] border border-slate-200 bg-white p-8 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Industry Vertical</span>
      <h4 className="text-2xl font-bold leading-tight text-slate-900 font-display">{industry}</h4>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-indigo-600">
        <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-white" />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-900 selection:bg-orange-200">
      <Navbar />

      <main>
        <section className="mx-auto max-w-screen-2xl px-8 pb-20 pt-40 lg:px-24 lg:pb-28 lg:pt-56">
          <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-2xl space-y-10">
              <div style={{ animationDelay: '0.1s' }} className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-[#FF7A45] animate-fade-in-up">
                <Sparkles className="h-4 w-4" />
                Philippine payment infrastructure for modern enterprises
              </div>
              <h1 style={{ animationDelay: '0.2s' }} className="text-5xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl font-display animate-fade-in-up">
                The payment gateway for{' '}
                <span className="relative inline-block">
                  Philippine enterprises
                  <span className="absolute -bottom-2 left-0 h-2 w-full rounded-full bg-[#FF9E7A]/40" />
                </span>
              </h1>
              <p style={{ animationDelay: '0.3s' }} className="max-w-xl text-xl leading-relaxed text-slate-600 lg:text-[1.35rem] animate-fade-in-up">
                Accept payments, manage subscriptions, and send payouts across all major channels in one unified platform. Automated reconciliation and reporting integrated into your existing systems.
              </p>

              <div style={{ animationDelay: '0.4s' }} className="flex flex-wrap gap-x-8 gap-y-4 animate-fade-in-up">
                {['Settle same-day*', 'Automated reconciliation', 'Local support'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>

              <div style={{ animationDelay: '0.5s' }} className="flex flex-col items-start gap-6 sm:flex-row sm:items-center animate-fade-in-up">
                <a href={SUPPORT_URL} className="inline-flex items-center gap-3 rounded-[1.1rem] bg-gradient-to-r from-[#FF9E7A] to-[#FF7A45] px-8 py-4 text-lg font-bold text-white shadow-[0_16px_40px_rgba(255,122,69,0.22)] transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_20px_48px_rgba(255,122,69,0.28)]">
                  Talk with a payments expert
                  <ArrowUpRight className="h-5 w-5" />
                </a>
                <Link to="/login" className="text-lg font-bold text-slate-500 transition-colors hover:text-slate-900">
                  Merchant Portal
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="animate-float overflow-hidden rounded-[48px] border border-slate-200 bg-slate-100 shadow-2xl">
                <img src={heroImage} alt="SwiftPay payments operations" className="h-[620px] w-full object-cover" />
              </div>

              <div className="absolute left-4 top-6 w-64 rounded-[30px] border border-slate-100 bg-white/95 p-7 shadow-2xl backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Transactions Today</p>
                <div className="mx-auto mt-6 flex h-28 w-28 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50">
                  <div className="text-center">
                    <p className="text-3xl font-black text-slate-900">100%</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">Complete</p>
                  </div>
                </div>
                <p className="mt-5 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">0 pending transactions</p>
              </div>

              <div className="absolute bottom-6 right-4 flex flex-col gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/95 px-5 py-3 shadow-xl">
                  <span className="text-sm font-bold text-slate-900">Collections</span>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">Done</div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/95 px-5 py-3 shadow-xl">
                  <span className="text-sm font-bold text-slate-900">Payments</span>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">Done</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-white py-20">
          <div className="mx-auto flex max-w-screen-2xl flex-col items-center gap-12 px-8 lg:px-24">
            <p className="text-[10px] font-black uppercase tracking-[0.45em] text-slate-400 font-display">Trusted by leading enterprises</p>
            <div className="flex flex-wrap items-center justify-center gap-10 text-slate-400 opacity-70 lg:gap-16">
              <span className="text-3xl font-black tracking-tighter font-display">Smart</span>
              <span className="text-3xl font-black tracking-tighter font-display">Allianz (III)</span>
              <span className="text-3xl font-black uppercase italic tracking-[0.2em] font-display">FLASH EXPRESS</span>
              <span className="text-3xl font-serif italic tracking-tighter">Anson's</span>
              <span className="text-3xl font-black tracking-tighter font-display">IskarTech</span>
            </div>
          </div>
        </section>

        <section id="why" className="relative overflow-hidden bg-[#050505] py-32 text-white lg:py-48">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-full max-w-4xl -translate-x-1/2 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.12),transparent_70%)]" />
          <div className="relative z-10 mx-auto max-w-screen-2xl px-8 lg:px-24">
            <div className="mb-16 text-center">
              <h2 className="text-4xl font-bold tracking-tight text-[#FF9E7A] lg:text-[56px] font-display">Designed for high volume transactions</h2>
            </div>
            <StatsGrid />
            <div className="mt-16 text-center">
              <p className="text-[12px] font-medium uppercase tracking-[0.35em] text-slate-600">*No payment failures on record to date.</p>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-24 lg:py-32">
          <div className="mx-auto max-w-screen-2xl px-8 lg:px-24">
            <div className="mb-14 max-w-3xl">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.4em] text-[#FF7A45] font-display">Settle same-day*</p>
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 lg:text-5xl font-display">Your funds are available the same day they’re collected.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <FeatureCard title="Zero reconciliation effort" description="Every transaction is matched and recorded automatically, reducing manual work and errors." icon={BadgeCheck} delay="0.05s" />
              <FeatureCard title="Fast access" description="Get funds quickly with same-day settlement availability where supported by the network." icon={CircleDollarSign} delay="0.12s" />
              <FeatureCard title="Local expertise" description="Philippine-based support via WhatsApp and Telegram keeps your team moving." icon={Workflow} delay="0.19s" />
            </div>
          </div>
        </section>

        <section id="solutions" className="bg-white py-24 lg:py-32">
          <div className="mx-auto max-w-screen-2xl px-8 lg:px-24">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600 font-display">Solutions & tools</p>
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 lg:text-6xl font-display">One system for your entire payment operation</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <SolutionBlock title="Accept payments across every channel" description="Collect payments online or in person through a single system across all major Philippine payment methods." bullets={['QR Ph', 'GCash', 'Maya', 'Visa', 'Bank Transfers']} delay="0.05s" />
              <SolutionBlock title="Never chase a payment again" description="Reduce late payments and internal follow-ups with automated reminders sent over the channels your customers actually use." bullets={['SMS', 'Viber', 'WhatsApp', 'AI Voice Agent']} delay="0.12s" />
              <SolutionBlock title="One integration across all payment rails" description="Route transactions intelligently across providers to keep uptime high and make the experience reliable." bullets={['Multi-rail routing', 'Failover logic', 'Availability controls']} delay="0.19s" />
              <SolutionBlock title="Manage recurring payments" description="Handle billing cycles, plan changes, and recurring collections without manual tracking." bullets={['Recurring billing', 'Plan changes', 'Automated invoicing']} delay="0.26s" />
            </div>
          </div>
        </section>

        <section className="bg-slate-950 py-24 text-white lg:py-32">
          <div className="mx-auto grid max-w-screen-2xl gap-16 px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-24">
            <div className="max-w-2xl space-y-8">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-500 font-display">How it works</p>
              <h2 className="text-4xl font-bold tracking-tight text-white lg:text-6xl font-display">The critical layer that makes payments work</h2>
              <p className="text-xl leading-relaxed text-slate-400">
                Unlike typical gateways that only provide APIs, we connect every payment channel directly into your systems, so transactions are matched, reconciled, and recorded without manual work.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {['Collect', 'Route', 'Reconcile', 'Settle'].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[36px] border border-white/10 bg-white/5 p-8">
              <div className="mb-8 flex items-center gap-3">
                <div className="rounded-full bg-[#FF7A45]/10 p-3 text-[#FF7A45]">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Payment channels</p>
                  <h3 className="text-2xl font-bold text-white font-display">Supported rails</h3>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {paymentLogos.map((logo) => (
                  <div key={logo.label} className="flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                    <img src={logo.src} alt={logo.label} className="h-12 object-contain" />
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-sm leading-relaxed text-slate-400">
                Every payment method is connected into one operating layer for your ERP systems, accounting, and reporting workflows.
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-24 lg:py-32">
          <div className="mx-auto max-w-screen-2xl px-8 lg:px-24">
            <div className="mb-16 max-w-3xl">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.4em] text-[#FF7A45] font-display">Protect every transaction</p>
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 lg:text-6xl font-display">Philippine-built Fraud Management System that scores every transaction before it completes.</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[36px] border border-slate-200 bg-slate-50 p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-full bg-orange-100 p-3 text-[#FF7A45]">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">SwiftGuard</p>
                    <h3 className="text-2xl font-bold text-slate-900 font-display">40+ tunable rules</h3>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['AML & structuring', 'Sanctions & watchlists', 'Behavioral', 'Fraud & mule', 'Volume & threshold', 'Account & access'].map((item) => (
                    <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-sm">
                <p className="mb-4 text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600 font-display">Security & compliance</p>
                <h3 className="mb-6 text-3xl font-bold text-slate-900 font-display">BSP 1213-aligned, AFASA-ready, ISO 27001 & PCI DSS</h3>
                <a href="https://swiftpay.ph/swiftguard/" className="inline-flex items-center gap-2 text-lg font-bold text-[#FF7A45]">
                  Know more about SwiftGuard <ArrowUpRight className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="security" className="border-t border-slate-100 bg-slate-950 py-24 text-white lg:py-32">
          <div className="mx-auto max-w-screen-2xl px-8 lg:px-24">
            <div className="mb-12 max-w-3xl">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.4em] text-indigo-500 font-display">Enterprise-grade infrastructure</p>
              <h2 className="text-4xl font-bold tracking-tight text-white lg:text-6xl font-display">Built to meet the rigorous standards of global enterprises and Philippine frameworks.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <SecurityItem num="01" title="BSP Supervised" description="Regulated Operator of Payment System (OPS) by the Bangko Sentral ng Pilipinas." />
              <SecurityItem num="02" title="ISO/IEC 27001" description="Certified management systems for information security across the entire platform." />
              <SecurityItem num="03" title="PCI DSS Level 1" description="The highest level of security standard for organizations that handle payment cards." />
              <SecurityItem num="04" title="SOC 2 Type II" description="Verified security controls for data privacy and operational integrity." />
            </div>
          </div>
        </section>

        <section id="industries" className="bg-white py-24 lg:py-32">
          <div className="mx-auto max-w-screen-2xl px-8 lg:px-24">
            <div className="mb-16 max-w-3xl">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600 font-display">Industry experience</p>
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 lg:text-6xl font-display">Deep expertise across Philippine sectors</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {['Retail & FMCG', 'Insurance', 'Financial Services', 'Logistics', 'Education', 'Real Estate', 'Healthcare', 'Government', 'E-commerce', 'Remittance', 'Hospitality', 'Utilities'].map((industry) => (
                <IndustryCard key={industry} industry={industry} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <ComplianceBar />

      <footer id="support" className="border-t border-slate-100 bg-white py-32">
        <div className="mx-auto grid max-w-screen-2xl gap-12 px-8 md:grid-cols-2 lg:grid-cols-5 lg:px-24">
          <div className="space-y-8 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-6 w-4 grid-cols-2 items-center gap-1">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                ))}
              </div>
              <span className="text-[24px] font-bold tracking-tight text-slate-900 font-display">SwiftPay</span>
            </Link>
            <p className="max-w-sm text-base leading-relaxed text-slate-500">
              Swift Technology Ventures Inc. is a Bangko Sentral ng Pilipinas (BSP)-regulated Operator of Payment System (OPS).
            </p>
            <div className="flex items-center gap-3 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700 font-display">Manila — All systems operational</span>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 font-display">Solutions</p>
            <div className="flex flex-col gap-4 text-sm font-bold text-slate-700 font-display">
              <a href="#solutions" className="transition-colors hover:text-indigo-600">Online Payments</a>
              <a href="#solutions" className="transition-colors hover:text-indigo-600">Disbursements</a>
              <a href="#solutions" className="transition-colors hover:text-indigo-600">Payment Reminders</a>
              <a href="#solutions" className="transition-colors hover:text-indigo-600">Fraud Management</a>
              <a href="#solutions" className="transition-colors hover:text-indigo-600">Routing & Failover</a>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 font-display">Company</p>
            <div className="flex flex-col gap-4 text-sm font-bold text-slate-700 font-display">
              <a href="#why" className="transition-colors hover:text-indigo-600">Why SwiftPay</a>
              <a href="#industries" className="transition-colors hover:text-indigo-600">Industries</a>
              <Link to="/login" className="transition-colors hover:text-indigo-600">Merchant Portal</Link>
              <Link to="/policies" className="transition-colors hover:text-indigo-600">Legal & Privacy</Link>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 font-display">Contact</p>
            <div className="space-y-4 text-sm font-bold text-slate-700 font-display">
              <p>sales@swiftpay.site</p>
              <p>support@swiftpay.site</p>
              <p className="font-medium text-slate-400">Headquarters:<br />BGC, Manila, Philippines</p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 flex max-w-screen-2xl flex-col items-center justify-between gap-6 border-t border-slate-100 px-8 pt-8 text-center md:flex-row lg:px-24">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-display">© {new Date().getFullYear()} SwiftPay Philippines · Built for Enterprise</div>
          <div className="flex gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-display">
            <Link to="/policies" className="transition-colors hover:text-slate-900">ISO 27001</Link>
            <Link to="/policies" className="transition-colors hover:text-slate-900">PCI-DSS</Link>
            <Link to="/policies" className="transition-colors hover:text-slate-900">SOC 2</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
