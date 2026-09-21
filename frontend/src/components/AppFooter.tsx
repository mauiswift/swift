import { Link } from 'react-router-dom';
import { MessageCircle, Globe, Terminal, ShieldCheck } from 'lucide-react';
import { COMPANY_NAME, SUPPORT_URL, SUPPORT_HANDLE } from '@/lib/brand';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';

const PAYMENT_BRANDS = [
  'Visa', 'Mastercard', 'Alipay', 'WeChat Pay', 'GCash', 'Maya', 'GrabPay', 'Toss Bank',
];

const COMPLIANCE_BADGES = [
  { src: '/logos/bsp.svg', alt: 'Bangko Sentral ng Pilipinas' },
  { src: '/logos/pci.svg', alt: 'PCI DSS Compliant' },
  { src: '/logos/dpo.svg', alt: 'DPO Registered - NPC Philippines' },
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
            <Link to="/" className="flex items-center gap-3 group w-fit" aria-label="SwiftPay home">
              <img
                src="/swiftpay-logo-black.svg"
                alt="SwiftPay"
                className="h-8 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-white/[0.66] text-sm leading-relaxed max-w-sm font-medium">
              동남아시아 및 필리핀/글로벌 가맹점 결제 솔루션. 단일 통합 API로 온라인 결제, 정기 구독, 대금 정산 및 출금을 관리하세요.
            </p>
            <div className="flex flex-col gap-2">
               <a href={SUPPORT_URL} className="text-[13px] font-semibold text-white hover:text-[#ff855b] transition-colors flex items-center gap-2">
               <MessageCircle className="h-4 w-4" /> {SUPPORT_HANDLE}
               </a>
               <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                 Swiftpay Ventures Inc. · 공식 고객 지원 센터
               </p>
            </div>
          </div>

          {/* Links Column */}
          <div className="space-y-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/[0.42]">플랫폼 기능</p>
            <ul className="space-y-3">
              {[
                { label: '온라인 결제', to: '/features' },
                { label: '수수료 요율표', to: '/collection-rates' },
                { label: '결제 알림', to: '/features' },
                { label: '결제 라우팅', to: '/features' },
                { label: '정기 결제', to: '/features' },
                { label: '이상 거래 관리', to: '/features' },
                { label: '출금 및 정산', to: '/features' },
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/[0.42]">위치 및 규제 정보</p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Globe className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <span className="text-xs text-white/[0.66] font-medium leading-relaxed">
                  <b>본사:</b><br />필리핀 마닐라
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Terminal className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                <span className="text-xs text-white/[0.66] font-medium leading-relaxed">
                  <b>개발 센터:</b><br />폴란드 크라쿠프
                </span>
              </li>
              <li className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs text-white/[0.66] font-semibold">BSP 규제 준수 결제 시스템</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment and compliance */}
        <section className="border-t border-white/[0.09] py-10" aria-labelledby="footer-payment-title">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#ff855b]">Payment acceptance</p>
                <h2 id="footer-payment-title" className="mt-2 text-lg font-semibold text-white">Accepted payment networks</h2>
                <p className="mt-1 text-xs leading-5 text-white/[0.48]">Give customers a familiar, secure way to pay.</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Secure checkout
              </div>
            </div>
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8" aria-label="Accepted payment networks">
            {PAYMENT_BRANDS.map((name) => (
              <div
                key={name}
                className="group flex min-h-[4.5rem] flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.04] px-2 py-2 transition-colors hover:border-white/[0.2] hover:bg-white/[0.09]"
                title={name}
              >
                <PaymentBrandLogo brand={name} size="sm" className="grayscale opacity-80 transition-all group-hover:grayscale-0" />
                <span className="text-center text-[10px] font-semibold text-white/[0.66]">{name}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-3 border-t border-white/[0.09] pt-6 sm:grid-cols-3" aria-label="Trust and compliance badges">
            {COMPLIANCE_BADGES.map(({ src, alt }) => (
              <div key={src} className="flex min-h-[5.5rem] items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3">
                <img src={src} alt={alt} className="h-12 max-w-full w-auto object-contain opacity-95" />
              </div>
            ))}
          </div>
          <p className="mt-5 flex items-center justify-center gap-2 text-center text-[10px] font-medium leading-relaxed text-white/[0.42]">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400/70" aria-hidden="true" />
            Secure payment infrastructure with BSP, PCI DSS, and NPC data protection standards.
          </p>
          </div>
        </section>

        {/* Copyright */}
        <div className="border-t border-white/[0.09] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <p className="text-white/[0.42] text-[11px] font-semibold uppercase tracking-widest">
              © {new Date().getFullYear()} {COMPANY_NAME} · All rights reserved.
            </p>
            <div className="flex items-center gap-2.5">
              <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/[0.32]">Technology partner</span>
              <div className="overflow-hidden rounded-md px-1.5 py-0.5">
                <img
                  src="/partners/drl-technology-gold.png"
                  alt="DRL Technology"
                  className="h-10 w-auto max-w-[220px] object-contain drop-shadow-[0_0_10px_rgba(245,190,55,0.55)]"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5" aria-label="Secure settlement infrastructure">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
            <span className="text-emerald-300 text-[10px] font-semibold uppercase tracking-widest">Secure settlement infrastructure</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
