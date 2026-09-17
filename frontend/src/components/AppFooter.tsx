import { Link } from 'react-router-dom';
import { MessageCircle, Globe, Terminal, ShieldCheck } from 'lucide-react';
import { COMPANY_NAME, SUPPORT_URL, SUPPORT_HANDLE } from '@/lib/brand';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import BrandLogo from '@/components/BrandLogo';

const PAYMENT_BRANDS = [
  'Visa', 'Mastercard', 'Alipay', 'WeChat Pay', 'GCash', 'Maya', 'GrabPay',
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
              <BrandLogo variant="white" className="h-8 w-auto" />
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

        {/* Payment Brands */}
        <div className="border-t border-white/[0.09] pt-10 pb-12">
          <p className="text-[10px] font-semibold text-white/[0.42] uppercase tracking-[0.3em] text-center mb-6">
            Accepted payment networks
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5" aria-label="Accepted payment networks">
            {PAYMENT_BRANDS.map((name) => (
              <div
                key={name}
                className="flex min-h-10 items-center gap-2 bg-white/[0.05] border border-white/[0.09] rounded-xl px-3.5 py-2 hover:bg-white/[0.1] hover:border-white/[0.2] transition-all cursor-default grayscale hover:grayscale-0 opacity-80 hover:opacity-100"
                title={name}
              >
                <PaymentBrandLogo brand={name} size="sm" className="bg-transparent" />
                <span className="text-white/[0.66] text-[11px] font-semibold uppercase tracking-tight">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/[0.09] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <p className="text-white/[0.42] text-[11px] font-semibold uppercase tracking-widest">
              © {new Date().getFullYear()} {COMPANY_NAME} · All rights reserved.
            </p>
            <div className="flex items-center gap-2.5">
              <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/[0.32]">Technology partner</span>
              <div className="overflow-hidden rounded-md bg-white px-1.5 py-0.5">
                <img
                  src="/partners/drl-technology-gold.png"
                  alt="DRL Technology"
                  className="h-7 w-auto max-w-[140px] object-contain drop-shadow-[0_0_8px_rgba(245,190,55,0.35)]"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-emerald-300 text-[10px] font-semibold uppercase tracking-widest">Secure settlement infrastructure</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
