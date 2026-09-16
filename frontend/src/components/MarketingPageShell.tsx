import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import AppFooter from '@/components/AppFooter';
import BrandLogo from '@/components/BrandLogo';

interface MarketingPageShellProps {
  children: ReactNode;
  className?: string;
}

export default function MarketingPageShell({ children, className = '' }: MarketingPageShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const solutionLinks = [
    { label: '온라인 결제', href: '/#solutions' },
    { label: '결제 알림', href: '/#solutions' },
    { label: '출금 및 정산', href: '/#solutions' },
    { label: '대금 정산 대조', href: '/#solutions' },
    { label: '이상 거래 감지', href: '/#security' },
    { label: '결제 라우팅', href: '/#solutions' },
    { label: '정기 결제', href: '/#solutions' },
  ];

  return (
    <div className={`min-h-screen overflow-x-hidden ${className}`}>
      <nav className={`fixed inset-x-0 top-0 z-50 border-b border-[#e9e3db] transition-all duration-300 ${scrolled ? 'bg-white/95 shadow-sm backdrop-blur-md' : 'bg-[#fcfcfc]/90 backdrop-blur-sm'}`}>
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">

          <Link to="/" className="flex items-center gap-2">
            <BrandLogo className="h-8 w-auto" />
            <span className="text-[22px] font-semibold tracking-tight text-[#1a1a1a] font-display">SwiftPay</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 lg:flex">
            <div className="relative">
              <button
                type="button"
                onClick={() => setSolutionsOpen(v => !v)}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#4d4d4d] transition-colors hover:text-[#1a1a1a]"
              >
                솔루션 <ChevronDown className="h-4 w-4" />
              </button>
              {solutionsOpen && (
                <div className="absolute left-0 z-50 mt-3 w-64 rounded-[24px] border border-[#ece7e1] bg-white p-3 shadow-xl">
                  {solutionLinks.map(item => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setSolutionsOpen(false)}
                      className="block rounded-2xl px-4 py-2.5 text-sm font-semibold text-[#1a1a1a] transition-colors hover:bg-[#fcf6ef] hover:text-[#c04e15]"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <a href="/#why" className="text-[13px] font-semibold text-[#4d4d4d] transition-colors hover:text-[#1a1a1a]">
              SwiftPay 특징
            </a>
            <Link to="/contact" className="text-[13px] font-semibold text-[#4d4d4d] transition-colors hover:text-[#1a1a1a]">
              문의하기
            </Link>
            <Link to="/privacy-policy" className="text-[13px] font-semibold text-[#4d4d4d] transition-colors hover:text-[#1a1a1a]">
              개인정보처리방침
            </Link>
            <Link to="/login" className="text-[13px] font-semibold text-[#4d4d4d] transition-colors hover:text-[#1a1a1a]">
              가맹점 포털
            </Link>
            <a
              href="/contact"
              className="rounded-full bg-[#1a1a1a] px-7 py-3 text-[13px] font-semibold text-white transition-all hover:bg-[#2b2b2b]"
            >
              데모 신청
            </a>
          </div>

          <button
            className="rounded-full p-2 text-[#1a1a1a] lg:hidden"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-[#e9e3db] bg-white/95 p-6 backdrop-blur-xl lg:hidden">
            <div className="flex flex-col gap-5">
              <a href="/#solutions" className="text-lg font-semibold text-[#1a1a1a]" onClick={() => setMobileOpen(false)}>솔루션</a>
              <a href="/#why" className="text-lg font-semibold text-[#1a1a1a]" onClick={() => setMobileOpen(false)}>SwiftPay 특징</a>
              <Link to="/contact" className="text-lg font-semibold text-[#1a1a1a]" onClick={() => setMobileOpen(false)}>문의하기</Link>
              <Link to="/privacy-policy" className="text-lg font-semibold text-[#1a1a1a]" onClick={() => setMobileOpen(false)}>개인정보처리방침</Link>
              <Link to="/login" className="text-lg font-semibold text-[#1a1a1a]" onClick={() => setMobileOpen(false)}>가맹점 포털</Link>
              <Link to="/contact" className="text-lg font-semibold text-[#1a1a1a]" onClick={() => setMobileOpen(false)}>데모 신청</Link>
            </div>
          </div>
        )}
      </nav>

      <div className="pt-20">
        {children}
      </div>

      <AppFooter />
    </div>
  );
}
