import { Link } from 'react-router-dom';
import { Bot, MessageCircle, Shield, FileText, ExternalLink, Globe, Terminal, ShieldCheck, Phone } from 'lucide-react';
import { APP_NAME, COMPANY_NAME, SUPPORT_URL, SUPPORT_HANDLE, APP_TAGLINE } from '@/lib/brand';

/* ─── Logo helpers ───────────────────────────────── */
function ImgIcon({ src, alt, size = 20 }: { src: string; alt: string; size?: number }) {
  return <img src={src} alt={alt} className="w-auto object-contain" style={{ height: size }} />;
}

const PAYMENT_BRANDS = [
  { el: <ImgIcon src="/logos/visa.svg"       alt="Visa"       size={22} />,               name: 'Visa' },
  { el: <ImgIcon src="/logos/mastercard.svg" alt="Mastercard" size={22} />,               name: 'Mastercard' },
  { el: <ImgIcon src="/logos/alipay-official.svg" alt="Alipay" size={22} />,              name: 'Alipay' },
  { el: <ImgIcon src="/logos/wechat.svg"     alt="WeChat Pay" size={22} />,               name: 'WeChat Pay' },
  { el: <ImgIcon src="/logos/gcash_wide.svg" alt="GCash"      size={18} />,               name: 'GCash' },
  { el: <ImgIcon src="/logos/maya.svg"      alt="Maya"       size={18} />,               name: 'Maya' },
  { el: <ImgIcon src="/logos/grab.svg"       alt="GrabPay"    size={22} />,               name: 'GrabPay' },
  { el: <ImgIcon src="/logos/bpi.svg"       alt="BPI"        size={22} />,               name: 'BPI' },
  { el: <ImgIcon src="/logos/bdo.svg"       alt="BDO"        size={18} />,               name: 'BDO' },
  { el: <ImgIcon src="/logos/unionbank.svg" alt="UnionBank"  size={14} />,               name: 'UnionBank' },
  { el: <ImgIcon src="/logos/metrobank.svg" alt="Metrobank"  size={12} />,               name: 'Metrobank' },
  { el: <ImgIcon src="/logos/rcbc.svg"      alt="RCBC"       size={22} />,               name: 'RCBC' },
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
   const dividerClass = isAdmin ? 'border-border' : 'border-white/[0.09]';
   const bgClass = isAdmin ? 'bg-background' : 'bg-[#191919]';

  return (
    <footer className={`relative overflow-hidden border-t ${dividerClass} ${bgClass} py-20 ${isAdmin ? '' : 'text-white/[0.66]'}`}>
      <div className="max-w-screen-2xl mx-auto px-8 lg:px-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-24 mb-20">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-3 group w-fit">
               <img src="https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/logos/swiftpay-logo-white.svg" alt="SwiftPay" className="h-8 w-auto" />
            </Link>
            <p className="text-white/[0.66] text-sm leading-relaxed max-w-sm font-medium">
              The payment gateway for Philippine enterprises. Accept digital payments, manage subscriptions, and send payouts through our unified API.
            </p>
            <div className="flex flex-col gap-2">
               <a href="mailto:support@swiftpay.site" className="text-[13px] font-semibold text-white hover:text-[#ff855b] transition-colors flex items-center gap-2">
                 <MessageCircle className="h-4 w-4" /> support@swiftpay.site
               </a>
               <a href="https://t.me/alipayboss" target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-white hover:text-[#ff855b] transition-colors flex items-center gap-2">
                 <Bot className="h-4 w-4" /> @alipayboss
               </a>
               <a href="tel:+639103350434" className="text-[13px] font-semibold text-white hover:text-[#ff855b] transition-colors flex items-center gap-2">
                 <Phone className="h-4 w-4" /> +63 910 335 0434
               </a>
               <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                 Swiftpay Ventures Inc. · Official sales & support
               </p>
            </div>
          </div>

          {/* Links Column */}
          <div className="space-y-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/[0.42]">Platform</p>
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
                  <Link to={link.to} className="text-sm font-semibold text-white/[0.66] hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Location */}
          <div className="space-y-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/[0.42]">Contact & Location</p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Globe className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <span className="text-xs text-white/[0.66] font-medium leading-relaxed">
                  <b>Headquarters:</b><br />Manila, Philippines
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Terminal className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                <span className="text-xs text-white/[0.66] font-medium leading-relaxed">
                  <b>Dev Center:</b><br />Zablocie, Krakow, Poland
                </span>
              </li>
              <li className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs text-white/[0.66] font-semibold">BSP Regulated OPS</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Brands */}
        <div className="border-t border-white/[0.09] pt-10 pb-12">
          <p className="text-[10px] font-semibold text-white/[0.42] uppercase tracking-[0.3em] text-center mb-6">
            Accepted payment networks
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {PAYMENT_BRANDS.map(({ el, name }) => (
              <div
                key={name}
                className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.09] rounded-xl px-4 py-2 hover:bg-white/[0.1] hover:border-white/[0.2] transition-all cursor-default grayscale hover:grayscale-0 opacity-80 hover:opacity-100"
                title={name}
              >
                {el}
                <span className="text-white/[0.66] text-[11px] font-semibold uppercase tracking-tight">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/[0.09] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/[0.42] text-[11px] font-semibold uppercase tracking-widest">
            © {new Date().getFullYear()} {COMPANY_NAME} · All rights reserved.
          </p>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-emerald-300 text-[10px] font-semibold uppercase tracking-widest">USDT T+0 Settlement &middot; Live</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
