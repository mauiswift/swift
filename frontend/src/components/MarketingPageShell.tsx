import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import { SUPPORT_URL } from '@/lib/brand';
import AppFooter from '@/components/AppFooter';

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
    { label: 'Online Payments',    href: '/#solutions' },
    { label: 'Payment Reminders',  href: '/#solutions' },
    { label: 'Disbursements',      href: '/#solutions' },
    { label: 'Reconciliation',     href: '/#solutions' },
    { label: 'Fraud Management',   href: '/#security'  },
    { label: 'Payment Routing',    href: '/#solutions' },
    { label: 'Subscriptions',      href: '/#solutions' },
  ];

  return (
    <div className={`min-h-screen overflow-x-hidden ${className}`}>
      <nav className={`fixed inset-x-0 top-0 z-50 border-b border-[#e9e3db] transition-all duration-300 ${scrolled ? 'bg-white/95 shadow-sm backdrop-blur-md' : 'bg-[#fcfcfc]/90 backdrop-blur-sm'}`}>
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">

          <Link to="/" className="flex items-center gap-2">
            <img
              src="https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/swiftpay-logo.svg"
              alt="SwiftPay"
              className="h-8 w-auto"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
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
                Solutions <ChevronDown className="h-4 w-4" />
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
              Why SwiftPay
            </a>
            <Link to="/contact" className="text-[13px] font-semibold text-[#4d4d4d] transition-colors hover:text-[#1a1a1a]">
              Contact
            </Link>
            <Link to="/privacy-policy" className="text-[13px] font-semibold text-[#4d4d4d] transition-colors hover:text-[#1a1a1a]">
              Privacy Policy
            </Link>
            <Link to="/login" className="text-[13px] font-semibold text-[#4d4d4d] transition-colors hover:text-[#1a1a1a]">
              Merchant Portal
            </Link>
            <a
              href={SUPPORT_URL}
              className="rounded-full bg-[#1a1a1a] px-7 py-3 text-[13px] font-semibold text-white transition-all hover:bg-[#2b2b2b]"
            >
              Request a demo
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
              <a href="/#solutions" className="text-lg font-semibold text-[#1a1a1a]" onClick={() => setMobileOpen(false)}>Solutions</a>
              <a href="/#why" className="text-lg font-semibold text-[#1a1a1a]" onClick={() => setMobileOpen(false)}>Why SwiftPay</a>
              <Link to="/contact" className="text-lg font-semibold text-[#1a1a1a]" onClick={() => setMobileOpen(false)}>Contact</Link>
              <Link to="/privacy-policy" className="text-lg font-semibold text-[#1a1a1a]" onClick={() => setMobileOpen(false)}>Privacy Policy</Link>
              <Link to="/login" className="text-lg font-semibold text-[#1a1a1a]" onClick={() => setMobileOpen(false)}>Merchant Portal</Link>
              <a href={SUPPORT_URL} className="text-lg font-semibold text-[#1a1a1a]" onClick={() => setMobileOpen(false)}>Request a demo</a>
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
