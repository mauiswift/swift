import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowUpRight, Menu, X, Shield, Zap, CheckCircle2, Lock, Terminal, Award, ChevronRight } from 'lucide-react';
import { SUPPORT_URL } from '@/lib/brand';
import ComplianceBar from '@/components/ComplianceBar';

/* ─── Navbar ──────────────────────────────────────────────────────── */
function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Solutions', to: '#solutions', hasDropdown: true },
    { label: 'Why SwiftPay', to: '#why' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md border-b border-slate-100 h-20' : 'bg-transparent h-24'}`}>
      <div className="max-w-screen-2xl mx-auto px-8 lg:px-12 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex flex-wrap w-5 h-5 items-center justify-center gap-0.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            ))}
          </div>
          <span className="font-bold text-slate-900 text-[22px] tracking-tight font-display">SwiftPay</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-12">
          <div className="flex items-center gap-10 text-[13px] font-bold text-slate-800 font-display">
            {navLinks.map((link) => (
              <a key={link.label} href={link.to} className="hover:text-slate-900 transition-colors flex items-center gap-1">
                {link.label}
                {link.hasDropdown && <ChevronRight className="h-3 w-3 opacity-60 rotate-90" />}
              </a>
            ))}
            <Link to="/login" className="hover:text-slate-900 transition-colors">Merchant Portal</Link>
          </div>

          <div className="flex items-center gap-8">
            <a
              href={SUPPORT_URL}
              className="bg-slate-950 text-white px-8 py-3 rounded-full text-[13px] font-bold hover:bg-black transition-all"
            >
              Request a demo
            </a>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button className="lg:hidden p-2 text-slate-900" onClick={() => setOpen(!open)}>
          {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-slate-100 p-8 flex flex-col gap-8 animate-in slide-in-from-top duration-300 font-display">
          {navLinks.map((link) => (
            <a key={link.label} href={link.to} className="text-lg font-semibold text-slate-900" onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <div className="h-px bg-slate-100 w-full" />
          <Link to="/login" className="text-lg font-bold text-slate-900" onClick={() => setOpen(false)}>
            Merchant Portal
          </Link>
          <a href={SUPPORT_URL} className="text-lg font-bold text-slate-900" onClick={() => setOpen(false)}>
            Request a demo
          </a>
        </div>
      )}
    </nav>
  );
}

/* ─── Pillar Section ───────────────────────────────────────────────── */
function SolutionPillar({ num, title, description, tools }: { num: string; title: string; description: string; tools: string[] }) {
  return (
    <div className="group border-t border-slate-200 py-12 lg:py-20 transition-all duration-500 hover:bg-slate-50/50">
      <div className="grid lg:grid-cols-[1fr_2fr_1.5fr] gap-8 lg:gap-16 items-start">
        <div className="text-4xl lg:text-5xl font-black text-slate-100 group-hover:text-blue-600 transition-colors duration-500 font-display">
          {num}
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h3 className="text-3xl lg:text-5xl font-bold tracking-tighter text-slate-900 font-display transition-transform duration-500 group-hover:translate-x-2">{title}</h3>
          </div>
          <p className="text-xl text-slate-600 leading-relaxed font-medium opacity-70 max-w-xl">
            {description}
          </p>
        </div>
        <div className="space-y-6">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 font-display">Capabilities</p>
          <div className="flex flex-wrap gap-2.5">
            {tools.map(tool => (
              <span key={tool} className="px-4 py-2 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-700 bg-white shadow-sm hover:border-blue-600 hover:text-blue-600 transition-all cursor-default font-display">
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Case Study Card ──────────────────────────────────────────────── */
function CaseStudyCard({ industry, title, impact }: { industry: string; title: string; impact: string }) {
  return (
    <div className="bg-white p-10 rounded-[40px] border border-slate-100 space-y-8 hover:shadow-2xl transition-all duration-500 group">
      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 font-display">{industry}</p>
        <h4 className="text-2xl font-bold text-slate-900 leading-tight font-display">{title}</h4>
      </div>
      <p className="text-lg text-slate-500 font-medium leading-relaxed italic">"{impact}"</p>
      <div className="pt-4 flex items-center gap-3 text-slate-900 font-bold font-display cursor-pointer hover:gap-5 transition-all">
        Read Case Study <ArrowUpRight className="h-5 w-5" />
      </div>
    </div>
  );
}

/* ─── Security Item ────────────────────────────────────────────────── */
function SecurityItem({ num, title, description }: { num: string; title: string; description: string }) {
  return (
    <div className="space-y-4 p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group hover:bg-white/[0.08]">
      <div className="text-xs font-black text-slate-500 group-hover:text-blue-500 transition-colors font-display">{num}</div>
      <h4 className="text-xl font-bold text-white font-display">{title}</h4>
      <p className="text-sm text-slate-400 leading-relaxed font-medium">{description}</p>
    </div>
  );
}

/* ─── CountUp Component ────────────────────────────────────────────── */
function CountUp({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-200 overflow-x-hidden">
      <Navbar />

      <main className="relative">
        {/* Hero Section */}
        <section className="relative z-10 max-w-screen-2xl mx-auto px-8 lg:px-24 pt-48 pb-32 lg:pt-64 lg:pb-48">
          <div className="grid lg:grid-cols-2 gap-20 lg:gap-32 items-center">
            {/* Left: Content */}
            <div className="space-y-12 animate-in fade-in slide-in-from-left-8 duration-700">
              <h1 className="text-6xl lg:text-[96px] font-black leading-[0.95] tracking-[-0.05em] text-slate-900 font-display max-w-2xl">
                Powering the backbone of Philippine commerce
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-4">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 font-display">Infrastructure</p>
                   <p className="text-lg text-slate-600 leading-relaxed font-medium">
                     The payment gateway for Philippine enterprises. Built for scale, security, and complex operations.
                   </p>
                </div>
                <div className="space-y-4">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 font-display">Automation</p>
                   <p className="text-lg text-slate-600 leading-relaxed font-medium">
                     Automated reconciliation and reporting integrated directly into your existing ERP systems.
                   </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-8 pt-4">
                <a
                  href={SUPPORT_URL}
                  className="bg-slate-950 hover:bg-slate-800 text-white px-10 py-5 rounded-full font-bold text-xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200"
                >
                  Request a demo
                  <ArrowUpRight className="h-6 w-6" strokeWidth={3} />
                </a>

                <Link to="/login" className="text-lg font-bold text-slate-500 hover:text-slate-900 transition-colors font-display underline underline-offset-8 decoration-slate-200">
                  Merchant Portal
                </Link>
              </div>
            </div>

            {/* Right: Visual Container */}
            <div className="relative hidden lg:block animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
              <div className="relative rounded-[60px] overflow-hidden border border-slate-100 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200"
                  alt="Enterprise Dashboard"
                  className="w-full h-[720px] object-cover grayscale-[0.1]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
              </div>

              {/* Stats Card Overlay */}
              <div className="absolute -bottom-10 -left-20 bg-white p-10 rounded-[40px] shadow-2xl border border-slate-50 w-80 animate-float">
                 <div className="flex items-center justify-between mb-8">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Status</span>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] font-black text-emerald-600 uppercase">Active</span>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <p className="text-4xl font-black text-slate-900 font-display">100%</p>
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Availability</p>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Logo Carousel Section */}
        <section className="border-y border-slate-100 py-24 bg-white">
           <div className="max-w-screen-2xl mx-auto px-8 lg:px-24">
              <div className="flex flex-col items-center gap-16">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] font-display">Trusted by Leading Enterprises</p>
                 <div className="flex flex-wrap justify-center items-center gap-16 lg:gap-24 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                    <span className="text-3xl font-black tracking-tighter font-display">Allianz (III)</span>
                    <span className="text-3xl font-black tracking-tighter font-display uppercase italic font-serif">FLASH EXPRESS</span>
                    <span className="text-3xl font-black tracking-tighter font-display font-serif italic">Anson's</span>
                    <span className="text-3xl font-black tracking-tighter font-display">IskarTech</span>
                    <span className="text-3xl font-black tracking-tighter font-display">Cebuana Lhuillier</span>
                 </div>
              </div>
           </div>
        </section>

        {/* High Volume Stats Section - The Dark Power Section */}
        <section id="why" className="bg-[#050505] text-white py-48 relative overflow-hidden">
           {/* Subtle blue/violet glow at the top center */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.08),transparent_70%)] pointer-events-none" />

           <div className="max-w-screen-2xl mx-auto px-8 lg:px-24 relative z-10 text-center space-y-24">
              <h2 className="text-4xl lg:text-[60px] font-bold tracking-tight font-display text-[#FF7A45]">Designed for high volume transactions</h2>

              <div className="grid md:grid-cols-3 gap-12 lg:gap-24">
                 <div className="space-y-4 hover:scale-105 transition-transform duration-500 cursor-default">
                    <p className="text-7xl lg:text-[110px] font-bold text-white tracking-tighter leading-none font-sans">
                      ₱<CountUp end={57} suffix="B+" />
                    </p>
                    <p className="text-[14px] font-bold uppercase tracking-[0.3em] text-slate-500">processed to date</p>
                 </div>
                 <div className="space-y-4 hover:scale-105 transition-transform duration-500 cursor-default">
                    <p className="text-7xl lg:text-[110px] font-bold text-white tracking-tighter leading-none font-sans">
                      <CountUp end={30} suffix="M+" />
                    </p>
                    <p className="text-[14px] font-bold uppercase tracking-[0.3em] text-slate-500">monthly, zero downtime*</p>
                 </div>
                 <div className="space-y-4 hover:scale-105 transition-transform duration-500 cursor-default">
                    <p className="text-7xl lg:text-[110px] font-bold text-white tracking-tighter leading-none font-sans">
                      <CountUp end={500} suffix="+" />
                    </p>
                    <p className="text-[14px] font-bold uppercase tracking-[0.3em] text-slate-500">businesses served</p>
                 </div>
              </div>

              <div className="pt-16">
                <p className="text-slate-600 text-[12px] font-medium tracking-widest uppercase">*No payment failures on record to date.</p>
              </div>
           </div>
        </section>

        {/* 7 Pillars Section */}
        <section id="solutions" className="relative z-10 bg-white py-32 lg:py-48">
          <div className="max-w-screen-2xl mx-auto px-8 lg:px-24">
            <div className="mb-24 space-y-6 max-w-3xl text-center mx-auto">
               <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600 font-display">The SwiftPay System</p>
               <h2 className="text-4xl lg:text-7xl font-bold tracking-tight text-slate-900 font-display">One system for your entire payment operation</h2>
            </div>

            <div className="border-b border-slate-200">
              <SolutionPillar
                num="01"
                title="Online Payments"
                description="The critical layer that makes payments work. Accept all major Philippine payment methods through a single integration."
                tools={['Universal Checkout', 'QR Ph', 'Direct Debit', 'E-wallets', 'Cards']}
              />
              <SolutionPillar
                num="02"
                title="Disbursements"
                description="Automated payouts at scale. Send funds to partners, sellers, and customers in real-time via InstaPay and PESONet."
                tools={['Bulk Uploads', 'Real-time Payouts', 'Approval Workflows', 'Audit Logs']}
              />
              <SolutionPillar
                num="03"
                title="Payment Reminders"
                description="Reduce late payments with multi-channel automation. Reach customers where they are: SMS, Viber, and AI voice agents."
                tools={['Automated Follow-ups', 'Viber/WhatsApp', 'AI Voice Agent', 'Custom Branding']}
              />
              <SolutionPillar
                num="04"
                title="Fraud Management"
                description="Protect every transaction with SwiftGuard. A tunable engine designed specifically for the Philippine threat landscape."
                tools={['40+ Fraud Rules', 'BSP 1213 Aligned', 'Risk Scoring', 'Manual Review Hub']}
              />
              <SolutionPillar
                num="05"
                title="Reconciliation"
                description="End manual accounting. Every transaction is matched and reported across your ledger in real-time."
                tools={['ERP Integration', 'Auto-Matching', 'Exception Handling', 'Financial Reporting']}
              />
              <SolutionPillar
                num="06"
                title="Payment Routing"
                description="Maximize availability with intelligent routing. Automatic failover ensures your business never stops accepting payments."
                tools={['Failover Logic', 'Multi-Rail Availability', 'Speed Optimization', 'Custom Logic']}
              />
              <SolutionPillar
                num="07"
                title="Enterprise Support"
                description="Dedicated experts for your mission-critical operations. 24/7 technical support and white-glove onboarding."
                tools={['Success Manager', 'SLA Guarantees', 'Technical Scoping', 'Compliance Guidance']}
              />
            </div>
          </div>
        </section>

        {/* Case Studies Section - One Clean Instance */}
        <section className="bg-slate-50 py-32 lg:py-48 border-y border-slate-100">
          <div className="max-w-screen-2xl mx-auto px-8 lg:px-24">
            <div className="mb-24 space-y-6 max-w-3xl">
               <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600 font-display">Real Results</p>
               <h2 className="text-4xl lg:text-7xl font-bold tracking-tight text-slate-900 font-display">Consolidating the landscape</h2>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <CaseStudyCard
                industry="Retail"
                title="Consolidating 15+ payment channels"
                impact="SwiftPay unified our entire payment stack, reducing reconciliation time by 80% for our nationwide electronics chain."
              />
              <CaseStudyCard
                industry="Insurance"
                title="Automating premium collections"
                impact="By implementing SwiftPay Reminders and Subscriptions, we increased on-time premium payments by 35% in just 3 months."
              />
              <CaseStudyCard
                industry="Logistics"
                title="Real-time disbursements to riders"
                impact="Processing thousands of daily payouts is now instantaneous. Our riders get their earnings immediately via E-wallets."
              />
            </div>
          </div>
        </section>

        {/* Bank Level Security Section */}
        <section className="bg-slate-950 text-white py-32 lg:py-48 overflow-hidden border-t border-white/5">
          <div className="max-w-screen-2xl mx-auto px-8 lg:px-24">
            <div className="grid lg:grid-cols-[1fr_1.5fr] gap-24 items-start">
              <div className="space-y-10 sticky top-32">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-500 font-display">Security & Compliance</p>
                <h2 className="text-4xl lg:text-7xl font-bold tracking-tight font-display text-slate-100">Enterprise-grade infrastructure</h2>
                <p className="text-2xl text-slate-400 leading-relaxed font-medium opacity-80">
                  Built to meet the rigorous standards of global enterprises and Philippine regulatory frameworks.
                </p>
                <div className="flex items-center gap-8 pt-8">
                  <div className="h-20 w-20 rounded-3xl border border-white/10 flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity">
                    <Shield className="h-10 w-10 text-blue-500" />
                  </div>
                  <div className="h-20 w-20 rounded-3xl border border-white/10 flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity">
                    <Lock className="h-10 w-10 text-blue-500" />
                  </div>
                  <div className="h-20 w-20 rounded-3xl border border-white/10 flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity">
                    <Terminal className="h-10 w-10 text-blue-500" />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-8">
                <SecurityItem num="01" title="BSP Supervised" description="Regulated Operator of Payment System (OPS) by the Bangko Sentral ng Pilipinas." />
                <SecurityItem num="02" title="ISO/IEC 27001" description="Certified management systems for information security across the entire platform." />
                <SecurityItem num="03" title="PCI DSS Level 1" description="The highest level of security standard for organizations that handle payment cards." />
                <SecurityItem num="04" title="SOC 2 Type II" description="Verified security controls for data privacy and operational integrity." />
                <SecurityItem num="05" title="AES-256 Encryption" description="Standardized encryption for all sensitive data at rest and in transit." />
                <SecurityItem num="06" title="TLS 1.2 & 1.3" description="Encrypted communication channels for all API and dashboard traffic." />
                <SecurityItem num="07" title="Real-time Monitoring" description="Continuous threat detection and automated security event response." />
                <SecurityItem num="08" title="Secure SDLC" description="Security integrated into every line of code via our rigorous development cycle." />
              </div>
            </div>
          </div>
        </section>

        {/* Industry Solutions Grid */}
        <section id="industries" className="bg-white py-32 lg:py-48">
          <div className="max-w-screen-2xl mx-auto px-8 lg:px-24">
            <div className="mb-24 space-y-6 max-w-3xl">
               <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600 font-display">Industry Experience</p>
               <h2 className="text-4xl lg:text-7xl font-bold tracking-tight text-slate-900 font-display">Deep expertise across Philippine sectors</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[
                'Retail & FMCG', 'Insurance', 'Financial Services', 'Logistics',
                'Education', 'Real Estate', 'Healthcare', 'Government',
                'E-commerce', 'Remittance', 'Hospitality', 'Utilities'
              ].map(industry => (
                <div key={industry} className="p-10 rounded-[40px] bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all flex flex-col justify-between h-64 group cursor-pointer hover:shadow-2xl hover:-translate-y-2 duration-500 bg-white">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-blue-600 transition-colors font-display">Industry Vertical</span>
                  <h4 className="text-2xl font-bold text-slate-900 leading-tight font-display">{industry}</h4>
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                     <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <ComplianceBar />

      {/* Synchronized Footer */}
      <footer className="relative z-10 bg-white py-32 border-t border-slate-100">
        <div className="max-w-screen-2xl mx-auto px-8 lg:px-24">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-16 mb-24">
            <div className="lg:col-span-2 space-y-8">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="flex flex-wrap w-5 h-5 items-center justify-center gap-0.5">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  ))}
                </div>
                <span className="font-bold text-slate-900 text-[24px] tracking-tight font-display">SwiftPay</span>
              </Link>
              <p className="text-base text-slate-500 leading-relaxed font-medium max-w-sm">
                Swift Technology Ventures Inc. is a Bangko Sentral ng Pilipinas (BSP)-regulated Operator of Payment System (OPS).
              </p>
              <div className="flex items-center gap-3 bg-emerald-50 w-fit px-4 py-2 rounded-full border border-emerald-100">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 font-display">Manila — All systems operational</span>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 font-display">Solutions</p>
              <div className="flex flex-col gap-4 text-sm font-bold text-slate-700 font-display">
                <Link to="#" className="hover:text-blue-600 transition-colors">Online Payments</Link>
                <Link to="#" className="hover:text-blue-600 transition-colors">Disbursements</Link>
                <Link to="#" className="hover:text-blue-600 transition-colors">Payment Reminders</Link>
                <Link to="#" className="hover:text-blue-600 transition-colors">Fraud Management</Link>
                <Link to="#" className="hover:text-blue-600 transition-colors">Routing & Failover</Link>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 font-display">Company</p>
              <div className="flex flex-col gap-4 text-sm font-bold text-slate-700 font-display">
                <Link to="#" className="hover:text-blue-600 transition-colors">Why SwiftPay</Link>
                <Link to="#" className="hover:text-blue-600 transition-colors">Industries</Link>
                <Link to="#" className="hover:text-blue-600 transition-colors">Merchant Portal</Link>
                <Link to="/policies" className="hover:text-blue-600 transition-colors">Legal & Privacy</Link>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 font-display">Contact</p>
              <div className="space-y-4 text-sm font-bold text-slate-700 font-display">
                <p>sales@swiftpay.ph</p>
                <p>support@swiftpay.ph</p>
                <p className="text-slate-400 font-medium">Headquarters:<br />BGC, Manila, Philippines</p>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-display">
              © {new Date().getFullYear()} SwiftPay Philippines · Built for Enterprise
            </div>
            <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-display">
              <Link to="/policies" className="hover:text-slate-900 transition-colors">ISO 27001</Link>
              <Link to="/policies" className="hover:text-slate-900 transition-colors">PCI-DSS</Link>
              <Link to="/policies" className="hover:text-slate-900 transition-colors">SOC 2</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
