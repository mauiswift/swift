import { Link } from 'react-router-dom';
import {
  Bot, CheckCircle2, ArrowRight, MessageCircle, Zap, Shield,
  Building2, ChevronDown, ChevronRight, X,
  Menu,
} from 'lucide-react';
import { useState } from 'react';
import { APP_NAME, SUPPORT_URL } from '@/lib/brand';

const EXPERT_CONTACT_URL = 'https://t.me/alipayboss';

/* ─── Logo helpers (same as Login.tsx) ───────────────────────── */
function SiIcon({ src, alt, bg, size = 32 }: { src: string; alt: string; bg: string; size?: number }) {
  const r = Math.round(size * 0.25);
  const p = Math.round(size * 0.18);
  return (
    <div style={{ width: size, height: size, background: bg, borderRadius: r, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: p, flexShrink: 0 }}>
      <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
    </div>
  );
}
function ImgIcon({ src, alt, size = 32 }: { src: string; alt: string; size?: number }) {
  return <img src={src} alt={alt} style={{ height: size, width: 'auto', maxWidth: size * 3.2, objectFit: 'contain', flexShrink: 0 }} />;
}

/* ─── FAQ ─────────────────────────────────────────────────────── */
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/[0.08] rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-white font-medium text-sm pr-4">{q}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 py-4 bg-white/[0.01] border-t border-white/[0.06]">
          <p className="text-muted-foreground text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Plan card ───────────────────────────────────────────────── */
interface Plan {
  name: string;
  price: string;
  period?: string;
  desc: string;
  badge?: string;
  badgeCls?: string;
  borderCls: string;
  bgCls: string;
  glowCls: string;
  ctaLabel: string;
  ctaTo: string;
  ctaCls: string;
  features: string[];
  notIncluded?: string[];
}

function PlanCard({ plan }: { plan: Plan }) {
  const isLightPlan = plan.name === 'Starter';

  return (
    <div className={`relative flex flex-col rounded-3xl p-7 sm:p-8 border ${plan.borderCls} ${plan.bgCls} overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-48 h-48 ${plan.glowCls} blur-3xl rounded-full`} />
      <div className="relative flex-1">
        {plan.badge && (
          <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border mb-4 ${plan.badgeCls}`}>
            <Zap className="h-3 w-3" /> {plan.badge}
          </div>
        )}
        <h3 className={`text-xl font-semibold mb-1 ${isLightPlan ? 'text-[#1a1a1a]' : 'text-white'}`}>{plan.name}</h3>
        <p className={`text-sm mb-5 ${isLightPlan ? 'text-[#535353]' : 'text-slate-300'}`}>{plan.desc}</p>
        <div className="mb-6">
          <span className={`text-3xl sm:text-4xl font-semibold ${isLightPlan ? 'text-[#1a1a1a]' : 'text-white'}`}>{plan.price}</span>
          {plan.period && <span className={`text-sm ml-1 ${isLightPlan ? 'text-[#535353]' : 'text-slate-300'}`}>{plan.period}</span>}
        </div>
        <ul className="space-y-2.5 mb-6">
          {plan.features.map(f => (
            <li key={f} className={`flex items-start gap-2.5 text-sm ${isLightPlan ? 'text-[#2c2c2c]' : 'text-slate-300'}`}>
              <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${isLightPlan ? 'text-[#0f9f83]' : 'text-emerald-400'}`} /> {f}
            </li>
          ))}
          {plan.notIncluded?.map(f => (
            <li key={f} className="flex items-start gap-2.5 text-slate-600 text-sm line-through">
              <X className="h-4 w-4 shrink-0 mt-0.5" /> {f}
            </li>
          ))}
        </ul>
      </div>
      <Link to={plan.ctaTo} className={`relative flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-xl text-sm transition-all ${isLightPlan ? 'bg-[#1a1a1a] hover:bg-[#2c2c2c] text-white' : plan.ctaCls}`}>
        {plan.ctaLabel} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function PricingFooter() {
  return (
    <footer className="bg-[#191919] text-[14px] text-white/[0.66]" style={{ borderTop: '1px solid rgba(255,255,255,.09)' }}>
      <div className="mx-auto max-w-[1200px] px-8">
        <div className="grid gap-8 pb-12 pt-16 lg:grid-cols-[1.3fr_auto]">
          <div>
            <img src="https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/swiftpay-logo-white.svg" alt="SwiftPay" className="mb-5 h-8 w-auto" />
            <p>The payment infrastructure powering Philippine businesses</p>
            <p className="mt-1 text-white/[0.42]">Enterprise-grade, built for scale</p>
            <a href={EXPERT_CONTACT_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 font-semibold text-white hover:text-[#ff855b]"><MessageCircle className="h-4 w-4" /> Talk to an expert</a>
          </div>
          <div className="text-right"><span className="mb-4 block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/[0.42]">Associated Brands</span><div className="flex items-center justify-end gap-6"><a href="https://www.nextbank.ph/" target="_blank" rel="noopener noreferrer" className="font-semibold transition-colors hover:text-white">Nextbank</a><a href="https://www.miquido.com" target="_blank" rel="noopener noreferrer" className="font-semibold transition-colors hover:text-white">Miquido</a></div></div>
        </div>
        <div className="grid grid-cols-2 gap-8 py-12 lg:grid-cols-4" style={{ borderTop: '1px solid rgba(255,255,255,.09)' }}>
          <div><h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/[0.42]">Solutions</h3><ul className="grid gap-3"><li><a href="#coverage" className="transition-colors hover:text-white">Online Payments</a></li><li><a href="#coverage" className="transition-colors hover:text-white">Payment Channels</a></li><li><a href="#plans" className="transition-colors hover:text-white">Merchant Plans</a></li></ul></div>
          <div><h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/[0.42]">Company</h3><ul className="grid gap-3"><li><a href="/why-swiftpay/" className="transition-colors hover:text-white">Why SwiftPay</a></li><li><Link to="/login" className="transition-colors hover:text-white">Merchant Portal</Link></li><li><a href="/contact-us/" className="transition-colors hover:text-white">Contact Us</a></li></ul></div>
          <div><h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/[0.42]">Legal</h3><ul className="grid gap-3"><li><a href="/privacy-policy" className="transition-colors hover:text-white">Privacy Policy</a></li><li><a href="/terms" className="transition-colors hover:text-white">Terms of Service</a></li></ul></div>
          <div><h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/[0.42]">Contact</h3><ul className="grid gap-3"><li><a href="mailto:support@swiftpay.site" className="transition-colors hover:text-white">support@swiftpay.site</a></li><li><a href={EXPERT_CONTACT_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">@alipayboss</a></li></ul></div>
        </div>
        <div className="border-t border-white/[0.09] py-6 text-center text-[12px] text-white/[0.42]">© {new Date().getFullYear()} SwiftPay. All rights reserved.</div>
      </div>
    </footer>
  );
}

const PLANS: Plan[] = [
  {
    name: 'Starter',
    price: 'Free',
    desc: 'Try the platform with no commitment. Perfect for testing and onboarding.',
    borderCls: 'border-white/[0.08]',
    bgCls: 'bg-white/[0.02]',
    glowCls: 'bg-blue-700/5',
    ctaLabel: 'Create an account',
    ctaTo: '/register',
    ctaCls: 'bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-slate-200 hover:text-white',
    features: [
      'Telegram bot access',
      'GCash and local e-wallet support',
      'QR code payments',
      'Real-time Telegram alerts',
      'Transaction history',
      'Email support',
    ],
    notIncluded: [
      'Alipay & WeChat Pay',
      'USDT T+0 settlement',
      'Virtual accounts (InstaPay)',
      'Disbursements',
      'Multi-admin management',
      'Reports & analytics',
    ],
  },
  {
    name: 'Merchant',
    price: 'No monthly fee',
    desc: 'For active merchants who need full local and cross-border coverage. Pay only per transaction at SwiftPay rates.',
    badge: 'Most Popular',
    badgeCls: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    borderCls: 'border-blue-500/40',
    bgCls: 'bg-gradient-to-br from-[#0D1F4A] to-[#0A1530]',
    glowCls: 'bg-blue-600/8',
    ctaLabel: 'Get started',
    ctaTo: '/register',
    ctaCls: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25',
    features: [
      'Everything in Starter',
      'Opening deposit: 600 USDT',
      'SwiftPay transaction fees apply (see table below)',
      'All PH banks via InstaPay / PESONet',
      'GrabPay support',
      'Disbursements to any PH bank',
      'USDT T+0 same-day settlement',
      'Reports & analytics',
      'KYC / KYB onboarding',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    desc: 'For high-volume merchants and businesses with custom requirements.',
    badge: 'Contact Us',
    badgeCls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    borderCls: 'border-emerald-500/25',
    bgCls: 'bg-gradient-to-br from-[#0A2B1A] to-[#071A10]',
    glowCls: 'bg-emerald-700/6',
    ctaLabel: 'Talk to an expert',
    ctaTo: EXPERT_CONTACT_URL,
    ctaCls: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20',
    features: [
      'Everything in Merchant',
      'Dedicated account manager',
      'Custom settlement schedule',
      'Multi-branch / sub-merchant',
      'Webhook & API integration',
      'White-label Telegram bot',
      'Custom compliance & reporting',
      'SLA-backed uptime guarantee',
      'Onsite onboarding & training',
    ],
  },
];

/* ─── SwiftPay fee schedule ─────────────────────────────────── */
const SWIFTPAY_FEES = [
  { method: 'GCash', fee: '0.5%', note: '' },
  { method: 'Maya', fee: '0.5%', note: '' },
  { method: 'GrabPay', fee: '0.5%', note: '' },
  { method: 'ShopeePay', fee: '0.5%', note: '' },
  { method: 'QRPH (QR code payments)', fee: '0.5%', note: '' },
  { method: 'Local credit / debit cards', fee: '0.5%', note: '' },
  { method: 'International cards (PHP)', fee: '0.5%', note: '' },
  { method: 'Bank direct debit (BPI, UBP, RCBC, etc.)', fee: '0.5%', note: '' },
  { method: 'Over-the-counter (7-Eleven, ECPay)', fee: '0.5%', note: '' },
  { method: 'Over-the-counter (Cebuana, LBC, SM)', fee: '0.5%', note: '' },
  { method: 'BillEase (BNPL)', fee: '0.5%', note: '' },
];

const SUPPORTED_MARKETS = [
  {
    country: 'Philippines',
    region: 'Local collection and disbursement',
    channels: ['Maya', 'GCash', 'BDO', 'BPI', 'VBank', 'BPI Family Savings Bank', 'DiskarTech', 'Land Bank', 'Metrobank', 'Netbank', 'RCBC', 'UnionBank'],
    accent: 'border-blue-500/25 bg-blue-500/[0.06] text-blue-300',
  },
  {
    country: 'China',
    region: 'Cross-border wallet collection',
    channels: ['Alipay', 'WeChat Pay'],
    accent: 'border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300',
  },
  {
    country: 'South Korea',
    region: 'Cross-border wallet collection',
    channels: ['KakaoPay', 'NaverPay', 'Toss Pay', 'PAYCO'],
    accent: 'border-amber-500/25 bg-amber-500/[0.06] text-amber-300',
  },
  {
    country: 'International',
    region: 'Card payments accepted across supported markets',
    channels: ['Visa', 'Mastercard'],
    accent: 'border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-300',
  },
];

const FAQS = [
  {
    q: 'What is the Merchant account requirement?',
    a: 'A 600 USDT opening deposit is required for Merchant accounts. It is held as a security float and applied to your transaction balance — it is not a fee.',
  },
  {
    q: 'Are there any monthly subscription fees?',
    a: 'No. SwiftPay uses pay-as-you-go pricing — there are no monthly subscription fees. You only pay the standard transaction fee per successful payment collected.',
  },
  {
    q: 'What are the transaction fees?',
    a: 'Transaction fees are a flat 0.5% for all supported payment methods. See the full fee table on this page. All fees are exclusive of VAT.',
  },
  {
    q: 'How does USDT T+0 settlement work?',
    a: 'All PHP collections (Alipay, WeChat, GCash, BPI, BDO, etc.) are converted to USDT at the daily closing rate and sent to your registered USDT wallet address by end of business day — no waiting for T+1 or T+3 bank settlement.',
  },
  {
    q: 'Do I need a separate Telegram account?',
    a: 'Yes. SwiftPay is 100% Telegram-native. You authenticate with your Telegram account. Once approved, all payment commands, alerts, and notifications come through the bot — no app install required.',
  },
  {
    q: 'What KYC / KYB documents are required?',
    a: 'For individual merchants: a government-issued ID and proof of business. For companies: SEC/DTI registration, business permit, and authorized representative ID. The registration form guides you through each step.',
  },
  {
    q: 'Can I accept Chinese tourist payments (Alipay / WeChat Pay)?',
    a: 'Yes — this is a core feature of the Merchant and Enterprise plans. You generate a dynamic QR code via the bot or dashboard, the Chinese customer scans it with their Alipay or WeChat Pay app, and the payment is credited instantly.',
  },
];

/* ═══════════════════════════════════════════════════════════════ */

export default function Pricing() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="pricing-page min-h-screen bg-white text-[#1a1a1a] overflow-x-hidden">
      <style>{`
        .pricing-page .surface-section { color: #1a1a1a; }
        .pricing-page .surface-section .text-white { color: #1a1a1a !important; }
        .pricing-page .surface-section .text-muted-foreground { color: #535353 !important; }
        .pricing-page .surface-section .text-slate-300 { color: #2c2c2c !important; }
        .pricing-page .surface-section .text-slate-400 { color: #64748b !important; }
        .pricing-page .surface-section .text-blue-300 { color: #c2410c !important; }
        .pricing-page .surface-section .border-white\\/[0.08] { border-color: #e6e6e6; }
        .pricing-page .surface-section .border-white\\/[0.05] { border-color: #f2f2f2; }
        .pricing-page .surface-section .bg-white\\/[0.03] { background: #f8fafc; }
        .pricing-page .surface-section .bg-white\\/[0.01] { background: #fafafa; }
      `}</style>

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e6e6e6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/swiftpay-logo-black.svg" alt="SwiftPay" className="h-7 w-auto" />
          </Link>
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-8">
            <Link to="/" className="text-[#535353] hover:text-[#1a1a1a] text-sm font-semibold transition-colors">Home</Link>
            <Link to="/features" className="text-[#535353] hover:text-[#1a1a1a] text-sm font-semibold transition-colors">Features</Link>
            <a href="/why-swiftpay/" className="text-[#535353] hover:text-[#1a1a1a] text-sm font-semibold transition-colors">Why SwiftPay</a>
            <Link to="/pricing" className="text-[#1a1a1a] text-sm font-semibold">Pricing</Link>
          </nav>
          <div className="hidden lg:flex items-center gap-6">
            <Link to="/login" className="text-[#1a1a1a] text-sm font-semibold hover:text-[#c2410c] transition-colors">Merchant Portal</Link>
            <a href="/contact-us/" className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#2c2c2c] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors">Request a demo <ArrowRight className="h-3.5 w-3.5" /></a>
          </div>
          <button className="ml-auto rounded-full p-2 text-[#1a1a1a] lg:hidden" onClick={() => setMobileNavOpen(v => !v)} aria-label="Menu">
            {mobileNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileNavOpen && (
          <div className="border-t border-[#e6e6e6] bg-white px-5 py-3 shadow-xl lg:hidden">
            <Link to="/" className="block border-b border-[#f2f2f2] py-3 font-semibold text-[#1a1a1a]" onClick={() => setMobileNavOpen(false)}>Home</Link>
            <Link to="/features" className="block border-b border-[#f2f2f2] py-3 font-semibold text-[#1a1a1a]" onClick={() => setMobileNavOpen(false)}>Features</Link>
            <a href="/why-swiftpay/" className="block border-b border-[#f2f2f2] py-3 font-semibold text-[#1a1a1a]" onClick={() => setMobileNavOpen(false)}>Why SwiftPay</a>
            <Link to="/pricing" className="block border-b border-[#f2f2f2] py-3 font-semibold text-[#1a1a1a]" onClick={() => setMobileNavOpen(false)}>Pricing</Link>
            <Link to="/login" className="block border-b border-[#f2f2f2] py-3 font-semibold text-[#1a1a1a]" onClick={() => setMobileNavOpen(false)}>Merchant Portal</Link>
            <a href="/contact-us/" className="mt-5 mb-2 flex items-center justify-center rounded-full bg-[#ff855b] py-3 font-semibold text-white" onClick={() => setMobileNavOpen(false)}>Request a demo</a>
          </div>
        )}
      </header>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative pt-16 sm:pt-20 pb-10 sm:pb-14 text-center overflow-hidden bg-[#fffaf7]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#f5c8a4]/30 blur-[120px] rounded-full" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 bg-[#fce4d2] border border-[#f5c8a4] rounded-full px-4 py-1.5 mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff855b] animate-pulse" />
            <span className="text-[#c2410c] text-xs font-semibold tracking-wide uppercase">Simple, transparent pricing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] leading-tight mb-4">
            Most competitive pricing<br />
            <span className="text-[#d56f3f]">
              in the industry
            </span>
          </h1>
          <p className="text-[#535353] text-base sm:text-lg max-w-xl mx-auto mb-6">
            Scale your business with enterprise-grade rates and same-day settlements. Pay only for what you process.
          </p>

          {/* Accepted payment logos */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { el: <ImgIcon src="/logos/alipay-official.svg" alt="Alipay" size={26} />, name: 'Alipay' },
              { el: <ImgIcon src="/logos/wechat.svg" alt="WeChat Pay" size={26} />, name: 'WeChat Pay' },
              { el: <ImgIcon src="/logos/gcash_wide.svg" alt="GCash" size={26} />, name: 'GCash' },
              { el: <ImgIcon src="/logos/maya.svg" alt="Maya" size={26} />, name: 'Maya' },
              { el: <ImgIcon src="/logos/grab.svg" alt="GrabPay" size={26} />, name: 'GrabPay' },
              { el: <ImgIcon src="/logos/tether.svg" alt="USDT" size={26} />, name: 'USDT' },
            ].map(({ el, name }) => (
              <div key={name} className="flex items-center gap-2 bg-white border border-[#e6e6e6] rounded-xl px-3 py-2 shadow-sm transition-all duration-150 cursor-default">
                {el}
                <span className="text-[#535353] text-xs font-semibold">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OPENING DEPOSIT BANNER ───────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 sm:px-7 py-4 sm:py-5">
          <div className="flex-shrink-0 h-10 w-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <Building2 className="h-5 w-5 text-amber-400" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-amber-800 font-semibold text-sm">Merchant Account Requirement</p>
            <p className="text-slate-700 text-xs mt-0.5">
              A <span className="text-slate-950 font-semibold">600 USDT opening deposit</span> is required for Merchant accounts. It is applied to your transaction balance — not a fee.
            </p>
          </div>
        </div>
      </section>

      {/* ── PLANS ───────────────────────────────────────────────── */}
      <section id="plans" className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {PLANS.map(plan => <PlanCard key={plan.name} plan={plan} />)}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          All prices in Philippine Peso (PHP). SwiftPay transaction fees are exclusive of VAT. A 600 USDT opening deposit is required for Merchant accounts.
        </p>
      </section>

      {/* ── SWIFTPAY FEE SCHEDULE ─────────────────────────────────── */}
      <section className="surface-section max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white text-center mb-2">SwiftPay transaction fees</h2>
        <p className="text-muted-foreground text-sm text-center mb-8 sm:mb-10">Pay only per successful transaction. No monthly fees, no hidden charges. All supported methods use a flat 0.5% fee.</p>
        <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
          <div className="grid grid-cols-3 bg-white/[0.03] border-b border-white/[0.08]">
            <div className="px-4 sm:px-6 py-3 text-muted-foreground text-xs font-semibold uppercase tracking-wider col-span-2">Payment Method</div>
            <div className="px-4 sm:px-6 py-3 text-muted-foreground text-xs font-semibold uppercase tracking-wider">Fee</div>
          </div>
          {SWIFTPAY_FEES.map(({ method, fee, note }, i) => (
            <div key={method} className={`grid grid-cols-3 border-b border-white/[0.05] last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
              <div className="px-4 sm:px-6 py-3 col-span-2">
                <span className="text-slate-300 text-xs sm:text-sm">{method}</span>
                {note && <span className="ml-2 text-muted-foreground text-xs">{note}</span>}
              </div>
              <div className="px-4 sm:px-6 py-3 text-blue-300 font-semibold text-xs sm:text-sm">{fee}</div>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground text-xs mt-4 text-center">
          Source: <a href="https://www.swiftpay.site/pricing/" target="_blank" rel="noopener noreferrer" className="underline hover:text-muted-foreground transition-colors">swiftpay.site/pricing</a>. Rates may change; confirm current rates with SwiftPay directly.
        </p>
      </section>

      {/* ── SUPPORTED COUNTRIES AND CHANNELS ────────────────────── */}
      <section className="surface-section max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-2">Supported countries and payment channels</h2>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            Collect from customers through local wallets, banks, cross-border wallets, and international cards in the markets below.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {SUPPORTED_MARKETS.map(({ country, region, channels, accent }) => (
            <div key={country} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-white font-semibold">{country}</h3>
                  <p className="text-muted-foreground text-xs mt-1">{region}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{channels.length} channels</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {channels.map(channel => (
                  <span key={channel} className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${accent}`}>
                    {channel}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground text-xs mt-4 text-center">
          Availability can vary by merchant approval, customer location, currency, and account configuration.
        </p>
      </section>

      {/* ── FEATURE COMPARISON TABLE ─────────────────────────────── */}
      <section className="surface-section max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white text-center mb-8 sm:mb-10">Compare plans</h2>
        <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-4 bg-white/[0.03] border-b border-white/[0.08]">
            <div className="px-4 sm:px-6 py-3 text-muted-foreground text-xs font-semibold uppercase tracking-wider">Feature</div>
            {['Starter', 'Merchant', 'Enterprise'].map((p, i) => (
              <div key={p} className={`px-2 sm:px-4 py-3 text-center text-xs font-semibold ${i === 1 ? 'text-blue-400' : i === 2 ? 'text-emerald-400' : 'text-slate-300'}`}>{p}</div>
            ))}
          </div>

          {[
            { label: 'Telegram bot', values: [true, true, true] },
            { label: 'GCash payments', values: [true, true, true] },
            { label: 'Maya payments', values: [true, true, true] },
            { label: 'GrabPay', values: [true, true, true] },
            { label: 'QR code generation', values: [true, true, true] },
            { label: 'Real-time alerts', values: [true, true, true] },
            { label: 'Transaction history', values: [true, true, true] },
            { label: 'Alipay QR collection', values: [false, true, true] },
            { label: 'WeChat Pay QR', values: [false, true, true] },
            { label: 'PH banks (InstaPay)', values: [false, true, true] },
            { label: 'Disbursements', values: [false, true, true] },
            { label: 'USDT T+0 settlement', values: [false, true, true] },
            { label: 'Reports & analytics', values: [false, true, true] },
            { label: 'KYC / KYB onboarding', values: [false, true, true] },
            { label: 'Multi-admin', values: [false, true, true] },
            { label: 'Custom settlement', values: [false, false, true] },
            { label: 'API / Webhook access', values: [false, false, true] },
            { label: 'White-label bot', values: [false, false, true] },
            { label: 'Dedicated account manager', values: [false, false, true] },
          ].map(({ label, values }, i) => (
            <div key={label} className={`grid grid-cols-4 border-b border-white/[0.05] last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
              <div className="px-4 sm:px-6 py-3 text-slate-300 text-xs sm:text-sm">{label}</div>
              {values.map((v, j) => (
                <div key={j} className="flex items-center justify-center py-3">
                  {v
                    ? <CheckCircle2 className={`h-4 w-4 ${j === 0 ? 'text-muted-foreground' : j === 1 ? 'text-blue-400' : 'text-emerald-400'}`} />
                    : <span className="h-1 w-4 bg-white/[0.08] rounded-full" />
                  }
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW FEES WORK ───────────────────────────────────────── */}
      <section className="surface-section max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              icon: <Shield className="h-5 w-5 text-blue-400" />,
              bg: 'bg-blue-500/10 border-blue-500/20',
              title: 'No monthly fees',
              desc: 'Pay only per successful transaction at SwiftPay\'s published rates. No subscription, no platform markup.',
            },
            {
              icon: <Zap className="h-5 w-5 text-emerald-400" />,
              bg: 'bg-emerald-500/10 border-emerald-500/20',
              title: 'T+0 USDT payout',
              desc: 'Skip T+1–T+3 bank delays. Your daily collections convert to USDT and hit your wallet same-day.',
            },
            {
              icon: <Building2 className="h-5 w-5 text-amber-400" />,
              bg: 'bg-amber-500/10 border-amber-500/20',
              title: 'KYC / KYB included',
              desc: 'Compliance is built in. Full KYC and KYB onboarding at no extra cost on Merchant and Enterprise plans.',
            },
          ].map(({ icon, bg, title, desc }) => (
            <div key={title} className={`rounded-2xl border p-5 sm:p-6 ${bg}`}>
              <div className="mb-3">{icon}</div>
              <h3 className="text-white font-semibold text-sm mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="surface-section max-w-3xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white text-center mb-8 sm:mb-10">Frequently asked questions</h2>
        <div className="space-y-3">
          {FAQS.map(faq => <FAQ key={faq.q} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* ── BOTTOM CTA ──────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-900/50 via-[#0A1628] to-emerald-900/20 border border-blue-700/25 rounded-3xl p-8 sm:p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="h-12 w-12 sm:h-14 sm:w-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-blue-600/30 logo-glow-hover transition-all">
              <Bot className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-3">
              Ready to start accepting payments?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-sm sm:text-base">
              Create your free account today. No credit card required. Upgrade whenever you need more payment methods.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-blue-600/25 hover:-translate-y-0.5"
              >
                Create free account <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={EXPERT_CONTACT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.12] text-slate-300 hover:text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all"
              >
                <MessageCircle className="h-4 w-4 text-sky-400" />
                Talk to an expert
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <PricingFooter />

    </div>
  );
}
