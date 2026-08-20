import { Link } from 'react-router-dom';
import { Bot, MessageCircle, Shield, FileText, ExternalLink, Globe, Terminal, ShieldCheck, Phone } from 'lucide-react';
import { APP_NAME, COMPANY_NAME, SUPPORT_URL, SUPPORT_HANDLE, APP_TAGLINE } from '@/lib/brand';

/* ─── Logo helpers ───────────────────────────────── */
function SiIcon({ src, alt, bg, size = 22 }: { src: string; alt: string; bg: string; size?: number }) {
  const r = Math.round(size * 0.28);
  const p = Math.round(size * 0.18);
  return (
    <div className="flex items-center justify-center flex-shrink-0" style={{ width: size, height: size, background: bg, borderRadius: r, padding: p }}>
      <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
    </div>
  );
}

function ImgIcon({ src, alt, size = 20 }: { src: string; alt: string; size?: number }) {
  return (
    <img src={src} alt={alt} className="w-auto object-contain" style={{ height: size }} />
  );
}

const PAYMENT_BRANDS = [
  { el: <SiIcon src="/logos/visa.svg"       alt="Visa"       bg="#1A73E8" size={22} />, name: 'Visa' },
  { el: <SiIcon src="/logos/mastercard.svg" alt="Mastercard" bg="#EB001B" size={22} />, name: 'Mastercard' },
  { el: <SiIcon src="/logos/alipay.svg"     alt="Alipay"     bg="#1677FF" size={22} />, name: 'Alipay' },
  { el: <SiIcon src="/logos/wechat.svg"     alt="WeChat Pay" bg="#07C160" size={22} />, name: 'WeChat Pay' },
  { el: <div className="flex h-[22px] w-[22px] items-center justify-center rounded-md border border-slate-300 bg-slate-100 text-[8px] font-bold text-slate-700">UP</div>, name: 'UnionPay' },
  { el: <div className="flex h-[22px] w-[22px] items-center justify-center rounded-md border border-slate-300 bg-slate-100 text-[8px] font-bold text-slate-700">JCB</div>, name: 'JCB' },
  { el: <ImgIcon src="/logos/gcash.svg"     alt="GCash"      size={14} />,               name: 'GCash' },
  { el: <ImgIcon src="/logos/maya.svg"      alt="Maya"       size={18} />,               name: 'Maya' },
  { el: <SiIcon src="/logos/grab.svg"       alt="GrabPay"    bg="#00B14F" size={22} />, name: 'GrabPay' },
  { el: <ImgIcon src="/logos/bpi.png"       alt="BPI"        size={22} />,               name: 'BPI' },
  { el: <ImgIcon src="/logos/bdo.png"       alt="BDO"        size={18} />,               name: 'BDO' },
  { el: <ImgIcon src="/logos/unionbank.png" alt="UnionBank"  size={14} />,               name: 'UnionBank' },
  { el: <ImgIcon src="/logos/metrobank.png" alt="Metrobank"  size={12} />,               name: 'Metrobank' },
  { el: <ImgIcon src="/logos/rcbc.png"      alt="RCBC"       size={22} />,               name: 'RCBC' },
  { el: <SiIcon src="/logos/tether.svg"     alt="USDT"       bg="#26A17B" size={22} />, name: 'USDT' },
];

const NAV_LINKS = [
  { label: 'Home',     to: '/' },
  { label: 'Features', to: '/features' },
  { label: 'Pricing',  to: '/pricing' },
  { label: 'Contact',  to: '/contact' },
  { label: 'Privacy',  to: '/privacy-policy' },
  { label: 'Login',    to: '/login' },
  { label: 'Register', to: '/register' },
];

interface AppFooterProps {
  variant?: 'admin' | 'public';
}

export default function AppFooter({ variant = 'public' }: AppFooterProps) {
  const isAdmin = variant === 'admin';
  const dividerClass = isAdmin ? 'border-border' : 'border-slate-200';
  const bgClass = isAdmin ? 'bg-background' : 'bg-white';

  return (
    <footer className={`relative overflow-hidden border-t ${dividerClass} ${bgClass} py-20`}>
      <div className="max-w-screen-2xl mx-auto px-8 lg:px-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-24 mb-20">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-3 group w-fit">
              <div className="flex flex-wrap w-5 h-5 items-center justify-center gap-0.5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                ))}
              </div>
              <span className="font-semibold text-slate-900 text-xl tracking-tighter uppercase">{APP_NAME}</span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm font-medium">
              The payment gateway for Philippine enterprises. Accept digital payments, manage subscriptions, and send payouts through our unified API.
            </p>
            <div className="flex flex-col gap-2">
               <a href="mailto:support@swiftpay.site" className="text-[13px] font-semibold text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-2">
                 <MessageCircle className="h-4 w-4" /> support@swiftpay.site
               </a>
               <a href="https://t.me/alipayboss" target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-2">
                 <Bot className="h-4 w-4" /> @alipayboss
               </a>
               <a href="tel:+639103350434" className="text-[13px] font-semibold text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-2">
                 <Phone className="h-4 w-4" /> +63 910 335 0434
               </a>
               <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                 Swiftpay Ventures Inc. · Official sales & support
               </p>
            </div>
          </div>

          {/* Links Column */}
          <div className="space-y-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Platform</p>
            <ul className="space-y-3">
              {[
                { label: 'Online Payments', to: '#' },
                { label: 'Collection rates', to: '/collection-rates' },
                { label: 'Payment Reminders', to: '#' },
                { label: 'Payment Routing', to: '#' },
                { label: 'Subscriptions', to: '#' },
                { label: 'Fraud Management', to: '#' },
                { label: 'Disbursements', to: '#' },
              ].map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Location */}
          <div className="space-y-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Contact & Location</p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Globe className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-500 font-medium leading-relaxed">
                  <b>Headquarters:</b><br />Manila, Philippines
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Terminal className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-500 font-medium leading-relaxed">
                  <b>Dev Center:</b><br />Zablocie, Krakow, Poland
                </span>
              </li>
              <li className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs text-slate-500 font-semibold">BSP Regulated OPS</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Brands */}
        <div className="border-t border-slate-100 pt-10 pb-12">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] text-center mb-6">
            Accepted payment networks
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {PAYMENT_BRANDS.map(({ el, name }) => (
              <div
                key={name}
                className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 hover:bg-white hover:border-slate-300 transition-all cursor-default grayscale hover:grayscale-0 opacity-60 hover:opacity-100"
                title={name}
              >
                {el}
                <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-tight">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-widest">
            © {new Date().getFullYear()} {COMPANY_NAME} · All rights reserved.
          </p>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-emerald-700 text-[10px] font-semibold uppercase tracking-widest">USDT T+0 Settlement &middot; Live</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
