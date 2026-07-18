import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { SUPPORT_URL } from '@/lib/brand';
import AppFooter from '@/components/AppFooter';

interface MarketingPageShellProps {
  children: ReactNode;
  className?: string;
}

export default function MarketingPageShell({ children, className = '' }: MarketingPageShellProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Solutions', href: '/#solutions' },
    { label: 'Why SwiftPay', href: '/#why' },
    { label: 'Security', href: '/#security' },
  ];

  return (
    <div className={`min-h-screen overflow-x-hidden bg-white text-slate-900 ${className}`}>
      <nav className={`fixed left-0 right-0 top-0 z-50 border-b border-slate-100 transition-all duration-300 ${scrolled ? 'border-slate-100 bg-white/95 backdrop-blur-md' : 'bg-white/90'}`}>
        <div className="mx-auto flex h-20 max-w-screen-2xl items-center justify-between px-6 sm:px-8 lg:px-24">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-6 w-4 grid-cols-2 items-center gap-1">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="h-1.5 w-1.5 rounded-full bg-slate-900" />
              ))}
            </div>
            <span className="text-[22px] font-bold tracking-tight text-slate-900 font-display">SwiftPay</span>
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-[13px] font-bold text-slate-700 transition-colors hover:text-slate-900 font-display">
                {link.label}
              </a>
            ))}
            <Link to="/login" className="text-[13px] font-bold text-slate-700 transition-colors hover:text-slate-900">
              Merchant Portal
            </Link>
            <a href={SUPPORT_URL} className="rounded-full bg-slate-950 px-7 py-3 text-[13px] font-bold text-white transition-all hover:bg-black">
              Request a demo
            </a>
          </div>

          <button className="rounded-full p-2 text-slate-900 lg:hidden" onClick={() => setOpen((value) => !value)}>
            {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-slate-100 bg-white/95 p-6 backdrop-blur-xl lg:hidden">
            <div className="flex flex-col gap-5 font-display">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} className="text-lg font-semibold text-slate-900" onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              ))}
              <Link to="/login" className="text-lg font-semibold text-slate-900" onClick={() => setOpen(false)}>
                Merchant Portal
              </Link>
              <a href={SUPPORT_URL} className="text-lg font-semibold text-slate-900" onClick={() => setOpen(false)}>
                Request a demo
              </a>
            </div>
          </div>
        )}
      </nav>

      <div className="pt-24">
        {children}
      </div>

      <AppFooter />
    </div>
  );
}
