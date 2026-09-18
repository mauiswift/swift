import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Landmark, ShieldCheck, WalletCards, X, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const GUIDE_VERSION = '2026-09';

export default function FirstLoginGuide() {
  const { user, platformBranding } = useAuth();
  const navigate = useNavigate();
  const optOutKey = useMemo(
    () => (user ? `swiftpay:introduction-guide-hidden:${user.id}:${GUIDE_VERSION}` : ''),
    [user],
  );
  const [visible, setVisible] = useState(() => Boolean(user && optOutKey && localStorage.getItem(optOutKey) !== '1'));
  const [step, setStep] = useState(0);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
  const [demonstrating, setDemonstrating] = useState(false);

  useEffect(() => {
    setStep(0);
    setDoNotShowAgain(false);
    setDemonstrating(false);
    setVisible(Boolean(user && optOutKey && localStorage.getItem(optOutKey) !== '1'));
  }, [user, optOutKey]);

  if (!user || !visible) return null;

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
    },
    {
      icon: Landmark,
      title: 'Receive Korean bank deposits',
      description: 'After KRW access is unlocked, customers can see an available receiving account and submit a transfer receipt for manual review.',
      example: (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
          <p className="font-semibold">Example customer flow on the Wallet page</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 leading-5">
            <li>The system assigns one configured Korean bank account.</li>
            <li>The customer transfers the exact KRW amount shown.</li>
            <li>The customer uploads the receipt and reference number.</li>
            <li>An administrator reviews and approves the deposit.</li>
          </ol>
        </div>
      ),
      action: 'Open Wallet',
      href: '/wallet',
      page: 'Wallet → KRW deposit',
    },
  ];
  const current = steps[step];
  const Icon = current.icon;
  const openCurrentPage = () => {
    setDemonstrating(true);
    navigate(current.href);
  };

  const returnToGuide = () => setDemonstrating(false);

  return (
    <div className={demonstrating ? 'fixed bottom-5 right-5 z-[100] w-[min(420px,calc(100vw-2rem))]' : 'fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm'} role="dialog" aria-modal="true" aria-labelledby="first-login-guide-title">
      <div className={`relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${demonstrating ? '' : 'max-w-lg'}`}>
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
            {demonstrating ? `You are now on: ${current.page}` : `Next destination: ${current.page}`}
          </div>
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
