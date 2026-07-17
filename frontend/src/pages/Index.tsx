import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { APP_NAME } from '@/lib/brand';
import ComplianceBar from '@/components/ComplianceBar';

function Navbar() {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { label: 'Clients', to: '#' },
    { label: 'Products', to: '#' },
    { label: 'Payment Methods', to: '#' },
    { label: 'Why Swiftpay', to: '#' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-screen-2xl mx-auto px-8 lg:px-12 h-24 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex flex-wrap w-5 h-5 items-center justify-center gap-0.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            ))}
          </div>
          <span className="font-bold text-slate-900 text-xl tracking-tighter">{APP_NAME}</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-12">
          <div className="flex items-center gap-10 text-[14px] font-medium text-slate-800">
            {navLinks.map((link) => (
              <a key={link.label} href={link.to} className="hover:text-slate-500 transition-colors">
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-10">
            <Link
              to="/login"
              className="text-[14px] font-medium text-slate-800 hover:text-slate-500 transition-colors"
            >
              Merchant Portal
            </Link>

            <a
              href="mailto:support@swiftpay.site"
              className="flex items-center gap-1.5 text-[14px] font-medium text-slate-800 group"
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
        <div className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-slate-100 p-8 flex flex-col gap-8 animate-in slide-in-from-top duration-300">
          {navLinks.map((link) => (
            <a key={link.label} href={link.to} className="text-lg font-semibold text-slate-900" onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <div className="h-px bg-slate-100 w-full" />
          <Link to="/login" className="text-lg font-bold text-slate-900" onClick={() => setOpen(false)}>
            Merchant Portal
          </Link>
          <a href="mailto:support@swiftpay.site" className="text-lg font-bold text-slate-900" onClick={() => setOpen(false)}>
            Contact us
          </a>
        </div>
      )}
    </nav>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FFF4E8] font-sans text-slate-900 selection:bg-orange-200 overflow-x-hidden">
      <Navbar />

      <main className="relative">
        {/* Background Waves (matching the image) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-[-20%] right-[-10%] w-[140%] h-[120%] opacity-60 blur-[60px]"
            style={{
              background: `
                radial-gradient(ellipse at 50% 50%, #fde68a 0%, #ffedd5 30%, #fff7ed 60%, transparent 100%),
                radial-gradient(circle at 80% 20%, #ffedd5 0%, transparent 50%),
                radial-gradient(circle at 20% 80%, #fed7aa 0%, transparent 50%)
              `,
              transform: 'skewY(-5deg)',
            }}
          />
          {/* SVG Waves for the specific silken look */}
          <svg className="absolute top-0 left-0 w-full h-full opacity-[0.25]" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M-100 400C200 300 500 600 800 400C1100 200 1300 500 1600 400V0H-100V400Z" fill="white" />
             <path d="M-100 450C200 350 500 650 800 450C1100 250 1300 550 1600 450V800H-100V450Z" fill="url(#grad1)" opacity="0.3" />
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
            <div className="space-y-12">
              <h1 className="text-6xl lg:text-[100px] font-bold leading-[0.95] tracking-[-0.05em] text-slate-900">
                Payments infrastructure<br />
                for industry leaders
              </h1>
            </div>

            {/* Right: Subtext + CTA */}
            <div className="space-y-12 mb-6">
              <p className="text-xl lg:text-2xl text-slate-700 leading-snug max-w-md font-medium tracking-tight opacity-90">
                One platform to accept payments, send payouts, individually or in bulk, with easy to use tools for merchants and customers.
              </p>

              <div className="flex items-center gap-5 text-slate-900 group cursor-pointer w-fit">
                <span className="font-bold text-2xl tracking-tight">Contact Us</span>
                <div className="w-16 h-16 rounded-full border-[3px] border-slate-900 flex items-center justify-center transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white">
                  <ArrowUpRight className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Trust Section */}
      <section className="relative z-10 bg-white/40 backdrop-blur-sm border-t border-slate-200/50 py-32">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col items-center text-center space-y-16">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Trusted by Industry Leaders</p>
            <div className="flex flex-wrap justify-center items-center gap-16 lg:gap-32 opacity-20 grayscale">
               <span className="text-3xl font-black tracking-tighter">Coins.ph</span>
               <span className="text-3xl font-black tracking-tighter">RCBC</span>
               <span className="text-3xl font-black tracking-tighter">Netbank</span>
               <span className="text-3xl font-black tracking-tighter">FLASH</span>
               <span className="text-3xl font-black tracking-tighter">ANSON'S</span>
            </div>
          </div>
        </div>
      </section>

      <ComplianceBar />

      {/* Simple Footer */}
      <footer className="relative z-10 bg-white py-16 border-t border-slate-100">
        <div className="max-w-screen-2xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} SwiftPay Philippines · Unified Payments Infrastructure
          </div>
          <div className="flex gap-10 text-[12px] font-black text-slate-600 uppercase tracking-widest">
            <Link to="/policies" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link to="/policies" className="hover:text-slate-900 transition-colors">Terms of Use</Link>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );
}
