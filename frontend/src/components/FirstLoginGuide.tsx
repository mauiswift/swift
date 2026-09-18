import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Landmark, ShieldCheck, WalletCards, X, Coins, MousePointer2, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const GUIDE_VERSION = '2026-09-motion';

export default function FirstLoginGuide() {
  const { user, platformBranding } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const optOutKey = useMemo(
    () => (user ? `swiftpay:introduction-guide-hidden:${user.id}:${GUIDE_VERSION}` : ''),
    [user],
  );
  const [visible, setVisible] = useState(() => Boolean(user && optOutKey && localStorage.getItem(optOutKey) !== '1'));
  const [step, setStep] = useState(0);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
  const [demonstrating, setDemonstrating] = useState(false);
  const [demoPhase, setDemoPhase] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setStep(0);
    setDoNotShowAgain(false);
    setDemonstrating(false);
    setDemoPhase(0);
    setVisible(Boolean(user && optOutKey && localStorage.getItem(optOutKey) !== '1'));
  }, [user, optOutKey]);

  useEffect(() => {
    if (!demonstrating) return undefined;
    const timer = window.setInterval(() => {
      setDemoPhase(value => (value + 1) % 4);
    }, 1400);
    return () => window.clearInterval(timer);
  }, [demonstrating, step]);

  const finish = () => {
    if (doNotShowAgain) localStorage.setItem(optOutKey, '1');
    setVisible(false);
  };

  const steps = [
    {
      icon: ShieldCheck,
      title: 'Welcome to your merchant portal',
      description: 'Complete business verification first. Once approved, your payment, wallet, and banking tools become available.',
      example: (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <p className="font-semibold">Example</p>
          <p className="mt-1 leading-5">On the Store profile page, enter your legal business details and save them. Your verification status is then shown in the merchant portal.</p>
        </div>
      ),
      action: 'Open Store profile',
      href: '/settings/shop/preferences',
      page: 'Settings → Store profile',
      target: 'store-profile-save',
    },
    {
      icon: WalletCards,
      title: 'Unlock KRW services',
      description: 'Approve your first 600 USDT deposit to unlock KRW benefits, Korean payment channels, and the TOSS virtual account application.',
      example: (
        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
          <p className="font-semibold">Example</p>
          <p className="mt-1 leading-5">On Wallet, open the USDT wallet and submit a 600 USDT top-up. After approval, return to Banking to see KRW services unlocked.</p>
        </div>
      ),
      action: 'Open Wallet',
      href: '/wallet',
      page: 'Wallet → USDT top-up',
      target: 'wallet-usdt-receive',
    },
    {
      icon: Coins,
      title: 'Understand the 600 USDT requirement',
      description: 'The total is 500 USDT for virtual account setup and activation, plus 100 USDT to provision up to 50 virtual accounts. The 100 USDT allocation equals 2 USDT per virtual account.',
      example: (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Example calculation</p>
          <div className="mt-2 grid grid-cols-2 gap-y-1">
            <span>Setup and activation</span><strong className="text-right">500 USDT</strong>
            <span>Virtual account allocation</span><strong className="text-right">100 USDT</strong>
            <span className="border-t border-amber-200 pt-1 font-semibold">Total required</span><strong className="border-t border-amber-200 pt-1 text-right">600 USDT</strong>
          </div>
          <p className="mt-2 leading-5">This breakdown is shown before you open the KRW banking application. The 100 USDT allocation supports up to 50 accounts, which is 2 USDT per account.</p>
        </div>
      ),
      action: 'Open Banking',
      href: '/settings/shop/settlement',
      page: 'Settings → Banking',
      target: 'banking-toss-application',
    },
    {
      icon: Landmark,
      title: 'Use your 50 virtual accounts for checkout',
      description: 'After the TOSS account is approved, create a checkout payment link. Your allocated virtual accounts are connected to your account wallet so customers can use the payment link to complete checkout.',
      example: (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
          <p className="font-semibold">Example customer flow from a checkout payment link</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 leading-5">
            <li>Create a checkout payment link for the product or invoice.</li>
            <li>Share the link with your customer.</li>
            <li>The customer completes checkout using one of your allocated virtual accounts.</li>
            <li>The payment settles into your account wallet and can be tracked from the payment record.</li>
          </ol>
        </div>
      ),
      action: 'Create checkout link',
      href: '/pay-by-link/new',
      page: 'Payment → Create payment link',
      target: 'payment-link-generate',
    },
  ];
  const current = steps[step];
  const Icon = current.icon;
  const openCurrentPage = () => {
    setDemoPhase(0);
    setDemonstrating(true);
    navigate(current.href);
  };

  const returnToGuide = () => {
    setDemonstrating(false);
    setDemoPhase(0);
  };
  const demoActions = [
    `Open ${current.page.split(' → ')[0]}`,
    `Find the ${current.page.split(' → ')[1] || 'highlighted'} section`,
    'Review the example shown on this page',
    'Use the page action to continue',
  ];
  const routeReady = location.pathname === current.href;

  useEffect(() => {
    if (!demonstrating || !routeReady) {
      setTargetRect(null);
      return undefined;
    }
    const updateTarget = () => {
      const target = document.querySelector<HTMLElement>(`[data-guide-target="${current.target}"]`);
      if (!target) {
        setTargetRect(null);
        return;
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTargetRect(target.getBoundingClientRect());
    };
    const frame = window.requestAnimationFrame(updateTarget);
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget, true);
    };
  }, [demonstrating, routeReady, step, current.target]);

  if (!user || !visible) return null;

  return (
    <div className={demonstrating ? 'fixed bottom-5 right-5 z-[100] w-[min(460px,calc(100vw-2rem))]' : 'fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm'} role="dialog" aria-modal="true" aria-labelledby="first-login-guide-title">
      <style>{`
        @keyframes swift-guide-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        @keyframes swift-guide-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, .35); } 50% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); } }
        @keyframes swift-guide-draw { from { width: 0; } to { width: 100%; } }
        @keyframes swift-guide-click { 0%, 70%, 100% { transform: scale(1); opacity: .9; } 78% { transform: scale(.82); opacity: 1; } 88% { transform: scale(1.08); opacity: 1; } }
        .swift-guide-float { animation: swift-guide-float 2.4s ease-in-out infinite; }
        .swift-guide-pulse { animation: swift-guide-pulse 1.8s ease-out infinite; }
        .swift-guide-draw { animation: swift-guide-draw 1.2s ease-out both; }
        .swift-guide-click { animation: swift-guide-click 1.4s ease-in-out infinite; transform-origin: 30% 30%; }
        @media (prefers-reduced-motion: reduce) {
          .swift-guide-float, .swift-guide-pulse, .swift-guide-draw, .swift-guide-click { animation: none; }
        }
      `}</style>
      {demonstrating && targetRect && (
        <div
          className="pointer-events-none fixed z-[99] rounded-xl border-2 border-blue-500 shadow-[0_0_0_9999px_rgba(15,23,42,0.28),0_0_0_6px_rgba(59,130,246,0.25)] transition-all duration-500"
          style={{
            left: targetRect.left - 6,
            top: targetRect.top - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        >
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
            Follow this action
          </span>
        </div>
      )}
      <div className={`relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-300 ${demonstrating ? 'ring-2 ring-blue-500/20' : 'max-w-lg'}`}>
        <button
          type="button"
          onClick={finish}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close introduction guide"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="bg-gradient-to-br from-slate-950 to-blue-950 px-6 pb-5 pt-6 text-white sm:px-8">
          <div className="flex items-center gap-3">
            {platformBranding?.logoUrl ? (
              <img src={platformBranding.logoUrl} alt="" className="h-9 w-9 rounded-lg bg-white object-contain p-1" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 font-bold">S</div>
            )}
            <span className="text-sm font-semibold">{platformBranding?.name || 'SwiftPay'}</span>
          </div>
          <p className="mt-5 text-sm font-medium text-blue-200">{demonstrating ? `Live walkthrough · Step ${step + 1} of ${steps.length}` : `Getting started · ${step + 1} of ${steps.length}`}</p>
          <div className="mt-3 flex gap-2" aria-hidden="true">
            {steps.map((item, index) => (
              <span key={item.title} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-blue-400' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>
        <div className="px-6 py-6 sm:px-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Icon className="h-6 w-6" />
          </div>
          <h2 id="first-login-guide-title" className="mt-5 text-xl font-semibold text-slate-950">{current.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{current.description}</p>
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
            {demonstrating ? `${routeReady ? 'You are now on' : 'Opening'}: ${current.page}` : `Next destination: ${current.page}`}
          </div>
          {demonstrating && (
            <div className="mt-4 overflow-hidden rounded-xl border border-blue-100 bg-slate-950 p-4 text-white" aria-live="polite">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-200">
                <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Watch it work</span>
                <span>{Math.round(((demoPhase + 1) / demoActions.length) * 100)}%</span>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15">
                <div className="swift-guide-draw h-full rounded-full bg-blue-400" style={{ width: `${((demoPhase + 1) / demoActions.length) * 100}%` }} />
              </div>
              <div className="mt-4 space-y-2">
                {demoActions.map((action, index) => (
                  <div key={action} className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-xs transition-all duration-500 ${index === demoPhase ? 'bg-blue-500/20 text-white' : index < demoPhase ? 'text-emerald-300' : 'text-slate-500'}`}>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${index < demoPhase ? 'bg-emerald-400 text-slate-950' : index === demoPhase ? 'swift-guide-pulse bg-blue-400 text-slate-950' : 'bg-white/10'}`}>
                      {index < demoPhase ? '✓' : index + 1}
                    </span>
                    <span className="flex-1">{action}</span>
                    {index === demoPhase && <MousePointer2 className="swift-guide-click h-4 w-4 text-blue-300" />}
                  </div>
                ))}
              </div>
              <p className="mt-3 border-t border-white/10 pt-3 text-[11px] leading-4 text-slate-400">
                {routeReady ? 'The real page is open. Follow the highlighted action there, then return here for the next demonstration.' : 'Navigating to the real page…'}
              </p>
            </div>
          )}
          {current.example}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {demonstrating ? (
              <button type="button" onClick={returnToGuide} className="text-left text-sm font-medium text-slate-500 hover:text-slate-800">
                Return to guide
              </button>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800">
            <input type="checkbox" checked={doNotShowAgain} onChange={event => setDoNotShowAgain(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            Do not show again
            </label>
            )}
            <div className="flex gap-2">
              {step > 0 && (
                <button type="button" onClick={() => setStep(value => value - 1)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Back
                </button>
              )}
              {!demonstrating && <button
                type="button"
                onClick={openCurrentPage}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {current.action}
                <ArrowRight className="h-4 w-4" />
              </button>}
              {demonstrating && step < steps.length - 1 && (
                <button type="button" onClick={() => { setStep(value => value + 1); setDemonstrating(false); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                  Next demonstration
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {step < steps.length - 1 && (
                <button type="button" onClick={() => setStep(value => value + 1)} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                  Next
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              )}
              {step === steps.length - 1 && (
                <button type="button" onClick={finish} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                  Finish
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
