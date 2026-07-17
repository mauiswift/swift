import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowUpRight, Menu, X, Shield, Zap, CheckCircle2, Lock, Terminal, Award } from 'lucide-react';
import { APP_NAME, SUPPORT_URL } from '@/lib/brand';
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
    { label: 'Solutions', to: '#solutions' },
    { label: 'Why Swiftpay', to: '#why' },
    { label: 'Industries', to: '#industries' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-100 h-20' : 'bg-transparent h-24'}`}>
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
          <div className="flex items-center gap-10 text-[13px] font-bold text-slate-600 font-display">
            {navLinks.map((link) => (
              <a key={link.label} href={link.to} className="hover:text-slate-900 transition-colors">
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-10 font-display">
            <Link
              to="/login"
              className="text-[13px] font-bold text-slate-800 hover:text-slate-500 transition-colors"
            >
              Merchant Portal
            </Link>

            <a
              href={SUPPORT_URL}
              className="flex items-center gap-1.5 text-[13px] font-bold text-white bg-slate-900 px-6 py-3 rounded-full hover:bg-blue-600 transition-all group"
            >
              Talk with a payments expert
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
            Contact us
          </a>
        </div>
      )}
    </nav>
  );
}

/* ─── Pillar Section ───────────────────────────────────────────────── */
function SolutionPillar({ num, title, description, tools }: { num: string; title: string; description: string; tools: string[] }) {
  return (
    <div className="group border-t border-slate-200 py-12 lg:py-16">
      <div className="grid lg:grid-cols-[1fr_2fr_1.5fr] gap-8 lg:gap-12">
        <div className="text-4xl lg:text-5xl font-black text-slate-200 group-hover:text-slate-900 transition-colors duration-500 font-display">
          {num}
        </div>
        <div className="space-y-6">
          <h3 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 font-display">{title}</h3>
          <p className="text-lg text-slate-600 leading-relaxed font-medium opacity-80">
            {description}
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 font-display">Included Tools</p>
          <div className="flex flex-wrap gap-2">
            {tools.map(tool => (
              <span key={tool} className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-700 bg-white/50 backdrop-blur-sm font-display">
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Security Item ────────────────────────────────────────────────── */
function SecurityItem({ num, title, description }: { num: string; title: string; description: string }) {
  return (
    <div className="space-y-4 p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-all group">
      <div className="text-xs font-black text-slate-400 group-hover:text-slate-900 transition-colors font-display">{num}</div>
      <h4 className="text-xl font-bold text-slate-900 font-display">{title}</h4>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FFF9F2] font-sans text-slate-900 selection:bg-orange-200 overflow-x-hidden">
      <Navbar />

      <main className="relative">
        {/* Background Waves (matching the silken look) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-[-20%] right-[-10%] w-[140%] h-[120%] opacity-70 blur-[60px]"
            style={{
              background: `
                radial-gradient(ellipse at 50% 50%, #fef3c7 0%, #fff7ed 30%, #fff 60%, transparent 100%),
                radial-gradient(circle at 80% 20%, #fed7aa 0%, transparent 50%),
                radial-gradient(circle at 20% 80%, #ffedd5 0%, transparent 50%)
              `,
              transform: 'skewY(-5deg)',
            }}
          />
          <svg className="absolute top-0 left-0 w-full h-full opacity-[0.2]" viewBox="0 0 1440 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M-100 400C200 300 500 600 800 400C1100 200 1300 500 1600 400V0H-100V400Z" fill="white" />
             <path d="M-100 450C200 350 500 650 800 450C1100 250 1300 550 1600 450V1000H-100V450Z" fill="url(#grad1)" opacity="0.4" />
             <defs>
               <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                 <stop offset="0%" stopColor="#fed7aa" />
                 <stop offset="100%" stopColor="#fff" />
               </linearGradient>
             </defs>
          </svg>
        </div>

        {/* Hero Section */}
        <section className="relative z-10 max-w-screen-2xl mx-auto px-8 lg:px-24 pt-48 pb-64 lg:pt-72 lg:pb-96">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-32 items-end">
            {/* Left: Main Headline */}
            <div className="space-y-12 animate-in fade-in slide-in-from-left-8 duration-700">
              <h1 className="text-6xl lg:text-[96px] font-black leading-[0.92] tracking-[-0.06em] text-slate-900 font-display">
                The payment gateway<br />
                for Philippine enterprises
              </h1>
            </div>

            {/* Right: Subtext + CTA */}
            <div className="space-y-12 mb-6 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
              <p className="text-xl lg:text-2xl text-slate-700 leading-snug max-w-md font-medium tracking-tight opacity-80">
                Accept payments, manage subscriptions, and send payouts across all major channels in one unified platform. Automated reconciliation and reporting integrated into your existing systems.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-8">
                <a href={SUPPORT_URL} className="flex items-center gap-5 text-slate-900 group cursor-pointer transition-transform hover:scale-105 active:scale-95">
                  <span className="font-bold text-2xl tracking-tight font-display">Talk with a payments expert</span>
                  <div className="w-16 h-16 rounded-full border-[3px] border-slate-900 flex items-center justify-center transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white">
                    <ArrowUpRight className="h-8 w-8" strokeWidth={3} />
                  </div>
                </a>

                <Link to="/login" className="text-lg font-bold text-slate-500 hover:text-slate-900 transition-colors font-display underline underline-offset-8 decoration-slate-200">
                  Merchant Portal
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="why" className="relative z-10 bg-slate-950 text-white py-32 overflow-hidden border-y border-white/5">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
          <div className="max-w-screen-2xl mx-auto px-8 lg:px-24 relative z-10">
            <div className="grid lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-12">
                <h2 className="text-4xl lg:text-7xl font-bold tracking-tight font-display">Built for<br />high-volume scale</h2>
                <div className="grid grid-cols-2 gap-12">
                  <div>
                    <p className="text-6xl font-black text-blue-500 mb-2 font-display">₱57B+</p>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 font-display">Transactions Processed</p>
                  </div>
                  <div>
                    <p className="text-6xl font-black text-blue-500 mb-2 font-display">30M+</p>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 font-display">Monthly Volume</p>
                  </div>
                </div>
              </div>
              <div className="space-y-10 text-xl text-slate-400 leading-relaxed max-w-xl font-medium">
                <p>
                  Philippine enterprises trust SwiftPay for mission-critical infrastructure. We handle the complexity of local payments so you can focus on growth.
                </p>
                <p>
                  With zero downtime on record and real-time reconciliation, we're the silent engine behind the country's leading digital platforms.
                </p>
                <div className="flex flex-wrap gap-6 pt-4">
                   {['Same-day Settlement', 'Automated Reconciliation', 'Local Support', '99.99% Uptime'].map(badge => (
                     <div key={badge} className="flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-white font-display">
                       <CheckCircle2 className="h-5 w-5 text-blue-500" /> {badge}
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7 Pillars Section */}
        <section id="solutions" className="relative z-10 bg-white py-32 lg:py-48">
          <div className="max-w-screen-2xl mx-auto px-8 lg:px-24">
            <div className="mb-24 space-y-6 max-w-3xl">
               <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600 font-display">Solutions & Tools</p>
               <h2 className="text-4xl lg:text-7xl font-bold tracking-tight text-slate-900 font-display">The payment gateway for industry leaders</h2>
            </div>

            <div className="border-b border-slate-200">
              <SolutionPillar
                num="01"
                title="Online Payments"
                description="Accept payments across every channel. Collect payments online or in person through a single system, across all major Philippine payment methods."
                tools={['Payment Pages', 'QR Ph', 'GCash', 'Maya', 'Visa/Mastercard', 'BillEase']}
              />
              <SolutionPillar
                num="02"
                title="Payment Reminders"
                description="Never chase a payment again. Reduce late payments and internal follow-ups with automated reminders that reach customers on the channels they actually use."
                tools={['SMS Reminders', 'Viber Reminders', 'WhatsApp Reminders', 'AI Call Agent']}
              />
              <SolutionPillar
                num="03"
                title="Payment Routing"
                description="One integration across all payment rails. Route transactions intelligently across providers with built-in failover and transaction management."
                tools={['Multi-Rail Routing', 'Failover Logic', 'Single API Integration', 'Availability Controls']}
              />
              <SolutionPillar
                num="04"
                title="Subscriptions"
                description="Manage recurring payments. Handle billing cycles, plan changes, and recurring collections without manual tracking."
                tools={['Recurring Billing', 'Proration', 'Automated Invoicing', 'Lifecycle Management']}
              />
              <SolutionPillar
                num="05"
                title="Fraud Management"
                description="Protect every transaction. Philippine-built Fraud Management System meeting AFASA and BSP Circular 1213 requirements out of the box."
                tools={['BSP 1213-aligned', 'AFASA-ready', '40+ Tunable Rules', 'Adaptive Scoring']}
              />
              <SolutionPillar
                num="06"
                title="Disbursements"
                description="Payouts, automated. Send funds to partners, sellers, and customers in real time or in bulk, with full control over release and tracking."
                tools={['Bulk Uploads', 'Real-time Payouts', 'Scheduled Disbursements', 'Approval Chains']}
              />
              <SolutionPillar
                num="07"
                title="Reconciliation"
                description="Reconciliation, handled automatically. Every transaction is matched, recorded, and reported across systems without manual work."
                tools={['Automated Matching', 'Real-time Reporting', 'Exception Handling', 'Audit-ready Records']}
              />
            </div>
          </div>
        </section>

        {/* Trusted By Section */}
        <section id="clients" className="bg-slate-50 py-32 border-y border-slate-100">
          <div className="max-w-screen-2xl mx-auto px-8 lg:px-24 text-center space-y-20">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-display">Integrated with Industry Leaders</p>
            <div className="flex flex-wrap justify-center items-center gap-16 lg:gap-32 opacity-20 grayscale">
               <span className="text-4xl font-black tracking-tighter font-display">Coins.ph</span>
               <span className="text-4xl font-black tracking-tighter font-display">RCBC</span>
               <span className="text-4xl font-black tracking-tighter font-display">Netbank</span>
               <span className="text-4xl font-black tracking-tighter font-display">FLASH</span>
               <span className="text-4xl font-black tracking-tighter font-display">ANSON'S</span>
            </div>
          </div>
        </section>

        {/* Industry Solutions Grid */}
        <section id="industries" className="bg-white py-32 lg:py-48">
          <div className="max-w-screen-2xl mx-auto px-8 lg:px-24">
            <div className="mb-24 space-y-6 max-w-3xl">
               <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600 font-display">Tailored Solutions</p>
               <h2 className="text-4xl lg:text-7xl font-bold tracking-tight text-slate-900 font-display">Built for your industry</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[
                'Retail', 'Insurance', 'Lending', 'Education',
                'E-commerce', 'Logistics', 'Remittance', 'Travel',
                'Hospitality', 'Government & Utilities', 'Healthcare', 'Real Estate'
              ].map(industry => (
                <div key={industry} className="p-10 rounded-[40px] bg-slate-50 border border-slate-100 hover:border-slate-300 transition-all flex flex-col justify-between h-56 group cursor-pointer hover:shadow-xl hover:-translate-y-1 duration-300">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-blue-600 transition-colors font-display">Solution</span>
                  <h4 className="text-2xl font-bold text-slate-900 leading-tight font-display">{industry}</h4>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bank Level Security Section */}
        <section className="bg-slate-950 text-white py-32 lg:py-48 overflow-hidden">
          <div className="max-w-screen-2xl mx-auto px-8 lg:px-24">
            <div className="grid lg:grid-cols-[1fr_1.5fr] gap-24 items-start">
              <div className="space-y-10 sticky top-32">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-500 font-display">Security First</p>
                <h2 className="text-4xl lg:text-7xl font-bold tracking-tight font-display">Enterprise-grade security & compliance</h2>
                <p className="text-2xl text-slate-400 leading-relaxed font-medium opacity-80">
                  Built to meet enterprise standards and Philippine regulatory requirements, keeping your funds and data secure.
                </p>
                <div className="flex items-center gap-8 pt-8">
                  <div className="h-20 w-20 rounded-3xl border border-white/10 flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity">
                    <Shield className="h-10 w-10" />
                  </div>
                  <div className="h-20 w-20 rounded-3xl border border-white/10 flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity">
                    <Lock className="h-10 w-10" />
                  </div>
                  <div className="h-20 w-20 rounded-3xl border border-white/10 flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity">
                    <Terminal className="h-10 w-10" />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-8">
                <SecurityItem num="01" title="BSP Supervised" description="Regulated Operator of Payment System by the Bangko Sentral ng Pilipinas." />
                <SecurityItem num="02" title="ISO/IEC 27001" description="Global benchmark for information security management systems." />
                <SecurityItem num="03" title="PCI DSS Compliant" description="Highest level of security for payment card data processing." />
                <SecurityItem num="04" title="SOC 2 Type II" description="Rigorous auditing standards for service organization controls." />
                <SecurityItem num="05" title="AES-256 Encryption" description="Industry-standard encryption for all data at rest and in transit." />
                <SecurityItem num="06" title="TLS 1.2 & 1.3" description="Secure communication protocols for all data transmission." />
                <SecurityItem num="07" title="Real-time Monitoring" description="24/7 fraud detection and security event monitoring." />
                <SecurityItem num="08" title="Secure SDLC" description="Security integrated into every stage of software development." />
              </div>
            </div>
          </div>
        </section>

        {/* Team / Miquido Section - Refined for SwiftPay.ph */}
        <section className="bg-white py-32 lg:py-48 overflow-hidden relative border-t border-slate-100">
          <div className="max-w-screen-2xl mx-auto px-8 lg:px-24 relative z-10">
            <div className="grid lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-12">
                 <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40">
                   <Award className="h-8 w-8 text-white" />
                 </div>
                 <h2 className="text-4xl lg:text-6xl font-bold tracking-tight text-slate-900 font-display leading-tight">Built by world-leading<br />engineers</h2>
                 <p className="text-2xl text-slate-600 leading-relaxed font-medium opacity-80">
                   SwiftPay is engineered by award-winning developers recognized by Time Magazine and the Financial Times.
                 </p>
                 <div className="flex gap-16 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 font-display">
                    <div className="space-y-4">
                      <p>Global Dev Center</p>
                      <p className="text-slate-900">Krakow, Poland</p>
                    </div>
                    <div className="space-y-4">
                      <p>Philippines HQ</p>
                      <p className="text-slate-900">Manila</p>
                    </div>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 {[
                   { label: 'Time Magazine', sub: 'Top Apps List' },
                   { label: 'Webby Awards', sub: 'Best Design' },
                   { label: 'Lovie Awards', sub: 'Gold Winner' },
                   { label: 'Awwwards', sub: 'Site Honors' },
                 ].map(item => (
                   <div key={item.label} className="bg-slate-50 border border-slate-100 p-10 rounded-[40px] space-y-3 hover:shadow-lg transition-all duration-300">
                     <p className="text-xl font-bold text-slate-900 font-display">{item.label}</p>
                     <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black font-display">{item.sub}</p>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <ComplianceBar />

      {/* Simplified Footer - Replicated from SwiftPay.ph */}
      <footer className="relative z-10 bg-white py-20 border-t border-slate-100">
        <div className="max-w-screen-2xl mx-auto px-8 lg:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="flex flex-wrap w-5 h-5 items-center justify-center gap-0.5">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  ))}
                </div>
                <span className="font-bold text-slate-900 text-[20px] tracking-tight font-display">SwiftPay</span>
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed font-medium max-w-xs">
                The payment gateway for Philippine enterprises. Accept payments, manage subscriptions, and send payouts across all major channels.
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 font-display">Contact</p>
              <div className="space-y-2 text-sm font-bold text-slate-700 font-display">
                <p>sales@swiftpay.ph</p>
                <p>+63 968 1635754</p>
                <p className="text-slate-400 font-medium">Manila, Philippines</p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 font-display">Legal</p>
              <div className="flex flex-col gap-2 text-sm font-bold text-slate-700 font-display">
                <Link to="/policies" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
                <Link to="/policies" className="hover:text-blue-600 transition-colors">Terms of Service</Link>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 font-display">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-slate-700 font-display">All systems operational</span>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] font-display text-center md:text-left">
              © {new Date().getFullYear()} SwiftPay Philippines · Swift Technology Ventures Inc.<br />
              <span className="text-[9px] opacity-60">Bangko Sentral ng Pilipinas (BSP)-regulated Operator of Payment System (OPS).</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
