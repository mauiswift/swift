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
    { label: 'Clients', to: '#' },
    { label: 'Products', to: '#' },
    { label: 'Payment Methods', to: '#' },
    { label: 'Why Swiftpay', to: '#' },
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
              className="flex items-center gap-1.5 text-[13px] font-bold text-slate-900 group"
            >
              Contact us
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
              <h1 className="text-6xl lg:text-[104px] font-black leading-[0.92] tracking-[-0.06em] text-slate-900 font-display">
                Payments infrastructure<br />
                for industry leaders
              </h1>
            </div>

            {/* Right: Subtext + CTA */}
            <div className="space-y-12 mb-6 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
              <p className="text-xl lg:text-2xl text-slate-700 leading-snug max-w-md font-medium tracking-tight opacity-80">
                One platform to accept payments, send payouts, individually or in bulk, with easy to use tools for merchants and customers.
              </p>

              <div className="flex items-center gap-5 text-slate-900 group cursor-pointer w-fit transition-transform hover:scale-105 active:scale-95">
                <span className="font-bold text-2xl tracking-tight font-display">Contact Us</span>
                <div className="w-16 h-16 rounded-full border-[3px] border-slate-900 flex items-center justify-center transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white">
                  <ArrowUpRight className="h-8 w-8" strokeWidth={3} />
                </div>
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
                <h2 className="text-4xl lg:text-7xl font-bold tracking-tight font-display">Tailored for<br />Philippine business</h2>
                <div className="grid grid-cols-2 gap-12">
                  <div>
                    <p className="text-6xl font-black text-blue-500 mb-2 font-display">$1B+</p>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 font-display">Transactions Processed</p>
                  </div>
                  <div>
                    <p className="text-6xl font-black text-blue-500 mb-2 font-display">500+</p>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 font-display">Enterprise Clients</p>
                  </div>
                </div>
              </div>
              <div className="space-y-10 text-xl text-slate-400 leading-relaxed max-w-xl font-medium">
                <p>
                  Made in the Philippines for the Philippines. We understand the unique challenges of local commerce, from e-wallet dominance to fragmented bank rails.
                </p>
                <p>
                  With one-day integration and same-day settlements, SwiftPay is built to keep your cash flow moving at the speed of your business.
                </p>
                <div className="flex flex-wrap gap-6 pt-4">
                   {['0 Downtime', 'API First', 'BSP Compliant', 'T+0 Settlement'].map(badge => (
                     <div key={badge} className="flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-white font-display">
                       <CheckCircle2 className="h-5 w-5 text-blue-500" /> {badge}
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5 Pillars Section */}
        <section id="solutions" className="relative z-10 bg-white py-32 lg:py-48">
          <div className="max-w-screen-2xl mx-auto px-8 lg:px-24">
            <div className="mb-24 space-y-6 max-w-3xl">
               <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600 font-display">Solutions & Tools</p>
               <h2 className="text-4xl lg:text-7xl font-bold tracking-tight text-slate-900 font-display">Seamless payments for every scale</h2>
            </div>

            <div className="border-b border-slate-200">
              <SolutionPillar
                num="01"
                title="Online Payments"
                description="Accept digital payments online or in person via merchant portal. Scale from single links to high-volume API processing."
                tools={['REST API', 'Payment Links', 'Shopify Plugin', 'WooCommerce', 'Bulk Uploads']}
              />
              <SolutionPillar
                num="02"
                title="Online Disbursements"
                description="Pay your partners, vendors, and sellers in real-time. Bulk payouts or individual transfers via one simple interface."
                tools={['Disbursement Portal', 'Real-time API', 'Batch Processing', 'PH Banks', 'E-Wallets']}
              />
              <SolutionPillar
                num="03"
                title="Fraud Management"
                description="Adaptive detection tools ensuring BSP compliance. Protect your business with real-time monitoring and device fingerprinting."
                tools={['Device Fingerprint', 'Geolocation', 'Rules Management', 'Adaptive Learning', 'BSP Compliance']}
              />
              <SolutionPillar
                num="04"
                title="Bank Orchestration"
                description="Optimize processing with multi-rail routing. Intelligent transaction management for maximum reliability."
                tools={['Multi-Rail Routing', 'Intelligent Failover', 'Transaction Optimization', 'Unified API']}
              />
              <SolutionPillar
                num="05"
                title="AI Payments Assistant"
                description="Automated AI agents to drive conversion and mitigate fraud. Smart collections and KYC screening."
                tools={['Voice Reminders', 'Chat Payments', 'AI KYC Screening', 'Conversion Recovery']}
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
        <section className="bg-white py-32 lg:py-48">
          <div className="max-w-screen-2xl mx-auto px-8 lg:px-24">
            <div className="mb-24 space-y-6 max-w-3xl">
               <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600 font-display">Tailored Solutions</p>
               <h2 className="text-4xl lg:text-7xl font-bold tracking-tight text-slate-900 font-display">Built for your industry</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[
                'Banks & Fintechs', 'Insurance', 'Governments & NGOs', 'Enterprises',
                'Healthcare', 'Marketplaces', 'E-commerce', 'Startups',
                'Tourism', 'Utilities', 'Real Estate', 'Logistics'
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
                <h2 className="text-4xl lg:text-7xl font-bold tracking-tight font-display">Bank-level security as standard</h2>
                <p className="text-2xl text-slate-400 leading-relaxed font-medium opacity-80">
                  We maintain the highest standards of data protection, keeping your funds and customer information secure.
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
                <SecurityItem num="01" title="ISO27001 Certified" description="Global benchmark for information security management systems." />
                <SecurityItem num="02" title="SOC2 / PCI-DSS" description="Compliant with international data security and privacy standards." />
                <SecurityItem num="03" title="AES-256 Encryption" description="Industry-standard encryption for all data at rest and in transit." />
                <SecurityItem num="04" title="AWS Infrastructure" description="Hosted on highly secure, reliable Amazon Web Services infrastructure." />
                <SecurityItem num="05" title="WAF & DDoS Protection" description="Enterprise-grade firewalls and distributed denial-of-service mitigation." />
                <SecurityItem num="06" title="VAPT Audits" description="Regular independent vulnerability assessments and penetration testing." />
                <SecurityItem num="07" title="Secure SDLC" description="Security integrated into every stage of our software development lifecycle." />
                <SecurityItem num="08" title="MFA & Access Control" description="Strict multi-factor authentication and role-based access for all team members." />
              </div>
            </div>
          </div>
        </section>

        {/* Team / Miquido Section */}
        <section className="bg-white py-32 lg:py-48 overflow-hidden relative border-t border-slate-100">
          <div className="absolute top-0 right-0 w-full h-full opacity-[0.02] pointer-events-none">
             <div className="grid grid-cols-6 gap-12 rotate-12 scale-150">
               {[...Array(24)].map((_, i) => (
                 <Award key={i} className="w-32 h-32 text-blue-600" />
               ))}
             </div>
          </div>
          <div className="max-w-screen-2xl mx-auto px-8 lg:px-24 relative z-10">
            <div className="grid lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-12">
                 <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40">
                   <Award className="h-8 w-8 text-white" />
                 </div>
                 <h2 className="text-4xl lg:text-6xl font-bold tracking-tight text-slate-900 font-display leading-tight">Built by world-leading<br />fintech developers</h2>
                 <p className="text-2xl text-slate-600 leading-relaxed font-medium opacity-80">
                   SwiftPay is engineered by the award-winning team at Miquido, recognized by Time Magazine and the Financial Times.
                 </p>
                 <div className="flex gap-16 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 font-display">
                    <div className="space-y-4">
                      <p>Krakow Dev Center</p>
                      <p className="text-slate-900">Poland</p>
                    </div>
                    <div className="space-y-4">
                      <p>Angeles City HQ</p>
                      <p className="text-slate-900">Philippines</p>
                    </div>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 {[
                   { label: 'Time Magazine', sub: '50 Best Apps' },
                   { label: 'Webby Awards', sub: 'Best Visual Design' },
                   { label: 'Lovie Awards', sub: 'Gold Winner' },
                   { label: 'Awwwards', sub: 'Site of the Month' },
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

      {/* Simplified Footer */}
      <footer className="relative z-10 bg-white py-20 border-t border-slate-100">
        <div className="max-w-screen-2xl mx-auto px-8 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-6">
             <div className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] font-display">
               © {new Date().getFullYear()} SwiftPay Philippines · Unified Payments Infrastructure
             </div>
             <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em] font-display">
               Headquarters: Clark Freeport Zone, Pampanga · Dev Center: Zablocie, Krakow
             </p>
          </div>
          <div className="flex gap-12 text-[12px] font-black text-slate-600 uppercase tracking-[0.3em] font-display">
            <Link to="/policies" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link to="/policies" className="hover:text-slate-900 transition-colors">Terms of Use</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
