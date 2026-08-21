import { Link } from 'react-router-dom';
import {
  Bot, CheckCircle2, ArrowRight, MessageCircle, Zap, Shield,
  Building2, ChevronDown, ChevronRight, X,
} from 'lucide-react';
import { useState } from 'react';
import MarketingPageShell from '@/components/MarketingPageShell';

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
      'Priority settlement schedule',
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
      'Opening deposit criteria subject to onboarding review',
      'SwiftPay transaction fees apply (see table below)',
      'All PH banks via InstaPay / PESONet',
      'GrabPay support',
      'Disbursements to any PH bank',
      'Scheduled payout processing based on enabled rails',
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
    currency: 'PHP',
    currencyName: 'Philippine Peso',
    region: 'Local collection and disbursement',
    channels: ['Maya', 'GCash', 'QRPH', 'BDO', 'BPI', 'VBank', 'BPI Family Savings Bank', 'DiskarTech', 'Land Bank', 'Metrobank', 'Netbank', 'RCBC', 'UnionBank'],
    accent: 'border-blue-500/25 bg-blue-500/[0.06] text-blue-300',
  },
  {
    country: 'China',
    currency: 'CNY',
    currencyName: 'Chinese Yuan',
    region: 'Cross-border wallet collection',
    channels: ['Alipay', 'WeChat Pay'],
    accent: 'border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300',
  },
  {
    country: 'South Korea',
    currency: 'KRW',
    currencyName: 'South Korean Won',
    region: 'Cross-border wallet collection',
    channels: ['KakaoPay', 'NaverPay', 'Toss Pay', 'PAYCO'],
    accent: 'border-amber-500/25 bg-amber-500/[0.06] text-amber-300',
  },
  {
    country: 'Singapore',
    currency: 'SGD',
    currencyName: 'Singapore Dollar',
    region: 'Local wallet and QR collection',
    channels: ['PayNow QR', 'GrabPay', 'ShopeePay', 'Visa', 'Mastercard'],
    accent: 'border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-300',
  },
  {
    country: 'Malaysia',
    currency: 'MYR',
    currencyName: 'Malaysian Ringgit',
    region: 'Local wallet and QR collection',
    channels: ['DuitNow QR', 'FPX', 'Touch n Go eWallet', 'GrabPay', 'Visa', 'Mastercard'],
    accent: 'border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-300',
  },
  {
    country: 'Vietnam',
    currency: 'VND',
    currencyName: 'Vietnamese Dong',
    region: 'Local wallet and QR collection',
    channels: ['VietQR', 'MoMo', 'ZaloPay', 'Visa', 'Mastercard'],
    accent: 'border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-300',
  },
  {
    country: 'Japan',
    currency: 'JPY',
    currencyName: 'Japanese Yen',
    region: 'Local wallet and QR collection',
    channels: ['PayPay', 'au PAY', 'Rakuten Pay', 'Visa', 'Mastercard'],
    accent: 'border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-300',
  },
  {
    country: 'Thailand',
    currency: 'THB',
    currencyName: 'Thai Baht',
    region: 'Local wallet and QR collection',
    channels: ['PromptPay QR', 'TrueMoney', 'Rabbit LINE Pay', 'Visa', 'Mastercard'],
    accent: 'border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-300',
  },
  {
    country: 'Indonesia',
    currency: 'IDR',
    currencyName: 'Indonesian Rupiah',
    region: 'Local wallet and QR collection',
    channels: ['QRIS', 'GoPay', 'OVO', 'DANA', 'ShopeePay', 'Visa', 'Mastercard'],
    accent: 'border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-300',
  },
  {
    country: 'India',
    currency: 'INR',
    currencyName: 'Indian Rupee',
    region: 'Local wallet and QR collection',
    channels: ['UPI', 'Google Pay', 'PhonePe', 'Paytm', 'Visa', 'Mastercard'],
    accent: 'border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-300',
  },
  {
    country: 'United Kingdom',
    currency: 'GBP',
    currencyName: 'Pound Sterling',
    region: 'Local bank and card collection',
    channels: ['Faster Payments', 'Open Banking', 'Visa', 'Mastercard'],
    accent: 'border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-300',
  },
  {
    country: 'Germany',
    currency: 'EUR',
    currencyName: 'Euro',
    region: 'Local bank and card collection',
    channels: ['SEPA', 'Giropay', 'Visa', 'Mastercard'],
    accent: 'border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-300',
  },
  {
    country: 'Portugal',
    currency: 'EUR',
    currencyName: 'Euro',
    region: 'Local bank and card collection',
    channels: ['SEPA', 'Multibanco', 'Visa', 'Mastercard'],
    accent: 'border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-300',
  },
  {
    country: 'Bulgaria',
    currency: 'EUR',
    currencyName: 'Euro',
    region: 'Local bank and card collection',
    channels: ['SEPA', 'Bancontact', 'Visa', 'Mastercard'],
    accent: 'border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-300',
  },
  {
    country: 'Ukraine',
    currency: 'EUR',
    currencyName: 'Euro',
    region: 'Local bank and QR collection',
    channels: ['Ukrainian QR payments', 'PrivatBank', 'Visa', 'Mastercard'],
    accent: 'border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-300',
  },
  {
    country: 'United States',
    currency: 'USD',
    currencyName: 'US Dollar',
    region: 'Local wallet and QR collection',
    channels: ['Fawry', 'Meeza Digital', 'Visa', 'Mastercard'],
    accent: 'border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-300',
  },
];

const SUPPORTED_CURRENCIES = Array.from(
  new Map(SUPPORTED_MARKETS.map(({ currency, currencyName }) => [currency, currencyName])).entries(),
).map(([code, name]) => ({ code, name }));

const FAQS = [
  {
    q: 'What is the Merchant account requirement?',
    a: 'Merchant onboarding may require an initial security deposit or account funding requirement based on the selected operating model and risk review.',
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
    q: 'How are settlement timings handled?',
    a: 'Payout timing depends on the enabled payment rail, bank partner, and operational processing schedule. SwiftPay outlines the supported timings during onboarding and account setup.',
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
  return (
    <MarketingPageShell className="pricing-page bg-white text-[#1a1a1a]">
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
            Scale your business with transparent rates, supported currencies, and payment channels for every market we serve.
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
          All prices in Philippine Peso (PHP). SwiftPay transaction fees are exclusive of VAT. Merchant onboarding may require an initial security deposit or account funding review based on the selected operating model.
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
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-2">Countries, currencies, and payment channels</h2>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            Collect through local wallets, banks, cross-border wallets, and cards. Each card shows the currency and channels available for that market.
          </p>
        </div>
        <div className="mb-6 rounded-2xl border border-[#e6e6e6] bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">Supported currencies</p>
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_CURRENCIES.map(({ code, name }) => (
              <span key={code} className="rounded-full border border-[#f5c8a4] bg-[#fffaf7] px-3 py-1.5 text-xs font-semibold text-[#9a3412]">
                {code} <span className="font-normal text-[#64748b]">{name}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {SUPPORTED_MARKETS.map(({ country, currency, currencyName, region, channels, accent }) => (
            <div key={country} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-white font-semibold">{country}</h3>
                  <p className="text-muted-foreground text-xs mt-1">{region}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex rounded-full bg-[#fce4d2] px-2.5 py-1 text-xs font-bold text-[#c2410c]">{currency}</span>
                  <span className="mt-1 block text-xs text-slate-400">{currencyName}</span>
                </div>
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
          Local wallet, bank, and QR channels require the relevant provider activation for your merchant account. Availability varies by merchant approval, customer location, currency, and account configuration.
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
            { label: 'Priority settlement schedule', values: [false, true, true] },
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

    </MarketingPageShell>
  );
}
