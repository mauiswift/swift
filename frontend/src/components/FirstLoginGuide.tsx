import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Landmark, ShieldCheck, WalletCards, X, Coins, MousePointer2, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const GUIDE_VERSION = '2026-09-motion';

export default function FirstLoginGuide() {
  const { user, platformBranding } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const optOutKey = useMemo(
    () => (user ? `swiftpay:introduction-guide-hidden:${user.id}:${GUIDE_VERSION}` : ''),
    [user],
  );
  const [visible, setVisible] = useState(() => Boolean(user && optOutKey && localStorage.getItem(optOutKey) !== '1'));
  const [expanded, setExpanded] = useState(false);
  const [step, setStep] = useState(0);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
  const [demonstrating, setDemonstrating] = useState(false);
  const [demoPhase, setDemoPhase] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([]);
  const isKorean = language === 'ko';
  const ui = isKorean ? {
    liveGuide: '실시간 안내',
    gettingStarted: '시작하기',
    currentLocation: '현재 위치',
    moving: '이동 중',
    nextMove: '다음 이동',
    followAction: '이 작업을 따라 하세요',
    process: '진행 과정 보기',
    opened: '실제 페이지가 열렸습니다. 강조된 작업을 수행한 뒤 여기로 돌아와 다음 안내를 확인하세요.',
    movingToPage: '실제 페이지로 이동 중입니다…',
    close: '소개 가이드 닫기',
    return: '안내로 돌아가기',
    dontShow: '다시 표시하지 않기',
    previous: '이전',
    next: '다음',
    nextGuide: '다음 안내',
    complete: '온보딩 완료',
    checklist: '가맹점 설정 체크리스트',
    checklistHint: '각 단계를 따라가며 설정을 완료하세요.',
    completed: '완료',
    current: '진행 중',
    upcoming: '예정',
    progress: '진행률',
  } : {
    liveGuide: 'Live guide',
    gettingStarted: 'Getting started',
    currentLocation: 'Current location',
    moving: 'Moving',
    nextMove: 'Next',
    followAction: 'Follow this action',
    process: 'See the process',
    opened: 'The page is open. Complete the highlighted action, then return here for the next step.',
    movingToPage: 'Moving to the page…',
    close: 'Close introduction guide',
    return: 'Back to guide',
    dontShow: "Don't show again",
    previous: 'Previous',
    next: 'Next',
    nextGuide: 'Next guide',
    complete: 'Complete onboarding',
    checklist: 'Merchant setup checklist',
    checklistHint: 'Follow each step to finish your setup.',
    completed: 'Completed',
    current: 'In progress',
    upcoming: 'Upcoming',
    progress: 'Progress',
  };

  useEffect(() => {
    setStep(0);
    setExpanded(false);
    setDoNotShowAgain(false);
    setDemonstrating(false);
    setDemoPhase(0);
    setCompletedSteps([]);
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
    setExpanded(false);
  };

  const steps = isKorean ? [
    {
      icon: ShieldCheck,
      title: '가맹점 포털에 오신 것을 환영합니다',
      description: '먼저 사업자 인증을 완료하세요. 승인되면 결제, 지갑, 뱅킹 도구를 사용할 수 있습니다.',
      example: (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <p className="font-semibold">예시</p>
          <p className="mt-1 leading-5">스토어 프로필에서 법적 사업자 정보를 입력하고 저장하세요. 인증 상태가 가맹점 포털에 표시됩니다.</p>
        </div>
      ),
      action: '스토어 프로필 열기',
      href: '/settings/shop/preferences',
      page: '설정 → 스토어 프로필',
      target: 'store-profile-save',
      checklist: '사업자 인증',
    },
    {
      icon: WalletCards,
      title: 'KRW 서비스 잠금 해제',
      description: '첫 600 USDT 입금을 승인받으면 KRW 혜택, 한국 결제 채널, TOSS 가상계좌 신청 기능이 활성화됩니다.',
      example: (
        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
          <p className="font-semibold">예시</p>
          <p className="mt-1 leading-5">지갑에서 USDT 지갑을 열고 600 USDT 충전을 신청하세요. 승인 후 뱅킹으로 돌아오면 KRW 서비스가 활성화됩니다.</p>
        </div>
      ),
      action: '지갑 열기',
      href: '/wallet',
      page: '지갑 → USDT 충전',
      target: 'wallet-usdt-receive',
      checklist: 'USDT 충전',
    },
    {
      icon: Coins,
      title: '600 USDT 요건 이해하기',
      description: '가상계좌 설정 및 활성화에 500 USDT, 최대 50개 가상계좌 발급에 100 USDT가 필요합니다. 계좌당 배정 금액은 2 USDT입니다.',
      example: (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">계산 예시</p>
          <div className="mt-2 grid grid-cols-2 gap-y-1">
            <span>설정 및 활성화</span><strong className="text-right">500 USDT</strong>
            <span>가상계좌 배정</span><strong className="text-right">100 USDT</strong>
            <span className="border-t border-amber-200 pt-1 font-semibold">총 필요 금액</span><strong className="border-t border-amber-200 pt-1 text-right">600 USDT</strong>
          </div>
          <p className="mt-2 leading-5">이 내역은 KRW 뱅킹 신청 전에 표시됩니다. 100 USDT로 최대 50개 계좌를 지원하며 계좌당 2 USDT가 배정됩니다.</p>
        </div>
      ),
      action: '뱅킹 열기',
      href: '/settings/shop/settlement',
      page: '설정 → 뱅킹',
      target: 'banking-toss-application',
      checklist: 'KRW 뱅킹 신청',
    },
    {
      icon: Landmark,
      title: '50개 가상계좌로 결제 받기',
      description: 'TOSS 계좌가 승인되면 결제 링크를 만드세요. 배정된 가상계좌가 지갑에 연결되어 고객이 결제 링크로 결제를 완료할 수 있습니다.',
      example: (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
          <p className="font-semibold">결제 링크 고객 이용 예시</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 leading-5">
            <li>상품 또는 청구서의 결제 링크를 만드세요.</li>
            <li>고객에게 링크를 공유하세요.</li>
            <li>고객이 배정된 가상계좌 중 하나를 사용해 결제합니다.</li>
            <li>결제 금액이 지갑에 정산되며 결제 기록에서 확인할 수 있습니다.</li>
          </ol>
        </div>
      ),
      action: '결제 링크 만들기',
      href: '/pay-by-link/new',
      page: '결제 → 결제 링크 만들기',
      target: 'payment-link-generate',
      checklist: '결제 링크 만들기',
    },
  ] : [
    {
      icon: ShieldCheck,
      title: 'Welcome to your merchant portal',
      description: 'Start by completing your business verification. Once approved, you can use payments, wallet, and banking tools.',
      example: <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><p className="font-semibold">Example</p><p className="mt-1 leading-5">Open Store Profile, add your legal business details, and save them. Your verification status will appear in the merchant portal.</p></div>,
      action: 'Open Store Profile',
      href: '/settings/shop/preferences',
      page: 'Settings → Store Profile',
      target: 'store-profile-save',
      checklist: 'Business verification',
    },
    {
      icon: WalletCards,
      title: 'Unlock KRW services',
      description: 'After your first 600 USDT deposit is approved, KRW benefits, Korean payment channels, and TOSS virtual-account applications become available.',
      example: <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950"><p className="font-semibold">Example</p><p className="mt-1 leading-5">Open the USDT wallet and request a 600 USDT top-up. After approval, return to Banking to activate KRW services.</p></div>,
      action: 'Open Wallet',
      href: '/wallet',
      page: 'Wallet → USDT top-up',
      target: 'wallet-usdt-receive',
      checklist: 'USDT top-up',
    },
    {
      icon: Coins,
      title: 'Understand the 600 USDT requirement',
      description: 'Virtual-account setup and activation requires 500 USDT, plus 100 USDT for up to 50 virtual accounts. Each account is assigned 2 USDT.',
      example: <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">Example calculation</p><div className="mt-2 grid grid-cols-2 gap-y-1"><span>Setup and activation</span><strong className="text-right">500 USDT</strong><span>Virtual-account allocation</span><strong className="text-right">100 USDT</strong><span className="border-t border-amber-200 pt-1 font-semibold">Total required</span><strong className="border-t border-amber-200 pt-1 text-right">600 USDT</strong></div><p className="mt-2 leading-5">This breakdown appears before applying for KRW banking. The 100 USDT allocation supports up to 50 accounts at 2 USDT each.</p></div>,
      action: 'Open Banking',
      href: '/settings/shop/settlement',
      page: 'Settings → Banking',
      target: 'banking-toss-application',
      checklist: 'KRW banking application',
    },
    {
      icon: Landmark,
      title: 'Accept payments with virtual accounts',
      description: 'After your TOSS account is approved, create a payment link. Your assigned virtual accounts connect to the wallet so customers can pay through the link.',
      example: <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800"><p className="font-semibold">Customer payment flow</p><ol className="mt-2 list-decimal space-y-1 pl-5 leading-5"><li>Create a payment link for a product or invoice.</li><li>Share the link with your customer.</li><li>The customer pays using one of the assigned virtual accounts.</li><li>Confirm settlement in your wallet and payment history.</li></ol></div>,
      action: 'Create Payment Link',
      href: '/pay-by-link/new',
      page: 'Payments → Create payment link',
      target: 'payment-link-generate',
      checklist: 'Create payment link',
    },
  ];
  const current = steps[step];
  const Icon = current.icon;
  const completedCount = completedSteps.filter(Boolean).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const markCurrentStepComplete = () => {
    setCompletedSteps(previous => previous.map((completed, index) => index === step ? true : completed));
  };
  const openCurrentPage = () => {
    setDemoPhase(0);
    setDemonstrating(true);
    navigate(current.href);
  };

  const returnToGuide = () => {
    setDemonstrating(false);
    setDemoPhase(0);
  };
  const demoActions = isKorean ? [
    `${current.page.split(' → ')[0]} 열기`,
    `${current.page.split(' → ')[1] || '강조된'} 섹션 찾기`,
    '이 페이지의 예시 확인하기',
    '페이지의 작업으로 계속하기',
  ] : [
    `Open ${current.page.split(' → ')[0]}`,
    `Find the ${current.page.split(' → ')[1] || 'highlighted'} section`,
    'Review the example on this page',
    'Continue with the page action',
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

  const onboardingRoutePrefixes = ['/settings', '/pay-by-link', '/wallet', '/dashboard'];
  const guideHome = onboardingRoutePrefixes.some((prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`));
  if (!user || !visible || (!demonstrating && !guideHome)) return null;
  const showPanel = expanded || demonstrating;

  return (
    <div className={showPanel ? 'pointer-events-auto fixed bottom-4 right-4 z-[110] flex max-h-[calc(100dvh-2rem)] w-[min(560px,calc(100vw-2rem))] min-w-0 justify-end overflow-x-hidden sm:bottom-5 sm:right-5' : 'pointer-events-auto fixed bottom-4 right-4 z-[110]'} role={showPanel ? 'dialog' : undefined} aria-modal={showPanel ? true : undefined} aria-labelledby={showPanel ? 'first-login-guide-title' : undefined}>
      <style>{`
        @keyframes swift-guide-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        @keyframes swift-guide-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, .35); } 50% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); } }
        @keyframes swift-guide-draw { from { width: 0; } to { width: 100%; } }
        @keyframes swift-guide-click { 0%, 70%, 100% { transform: scale(1); opacity: .9; } 78% { transform: scale(.82); opacity: 1; } 88% { transform: scale(1.08); opacity: 1; } }
        .swift-guide-float { animation: swift-guide-float 2.4s ease-in-out infinite; }
        .swift-guide-pulse { animation: swift-guide-pulse 1.8s ease-out infinite; }
        .swift-guide-draw { animation: swift-guide-draw 1.2s ease-out both; }
        .swift-guide-click { animation: swift-guide-click 1.4s ease-in-out infinite; transform-origin: 30% 30%; }
        .swift-phone-guide { border-radius: 28px; }
        .swift-guide-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(100, 116, 139, .55) transparent;
        }
        .swift-guide-scroll::-webkit-scrollbar { width: 7px; }
        .swift-guide-scroll::-webkit-scrollbar-track { background: transparent; }
        .swift-guide-scroll::-webkit-scrollbar-thumb {
          border: 2px solid transparent;
          border-radius: 999px;
          background-clip: padding-box;
          background-color: rgba(100, 116, 139, .55);
        }
        .swift-guide-scroll::-webkit-scrollbar-thumb:hover { background-color: rgba(37, 99, 235, .75); }
        @media (max-width: 640px) {
          .swift-phone-guide { border-radius: 22px 22px 0 0; }
          .swift-guide-scroll::-webkit-scrollbar { width: 5px; }
        }
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
            <span className="absolute -top-9 left-1/2 max-w-[calc(100vw-2rem)] -translate-x-1/2 truncate rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
            {ui.followAction}
          </span>
        </div>
      )}
      {!showPanel && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)] transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
          aria-label={ui.gettingStarted}
        >
          <Sparkles className="h-4 w-4" />
          {ui.gettingStarted}
        </button>
      )}
      {showPanel && <div className={`pointer-events-auto swift-phone-guide relative box-border flex h-auto max-h-[calc(100dvh-2rem)] w-full min-w-0 min-h-0 shrink-0 flex-col overflow-hidden border border-slate-200/90 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.28)] transition-all duration-300 ${demonstrating ? 'ring-2 ring-blue-500/20' : ''} rounded-[22px] sm:max-w-[560px] sm:rounded-[32px]`} style={{ touchAction: 'manipulation' }}>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="app-touch-target absolute right-3 top-3 z-20 rounded-xl bg-white/95 p-2 text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.18)] transition hover:bg-white hover:text-slate-900 sm:right-4 sm:top-4"
          aria-label={ui.close}
        >
          <X className="h-5 w-5" />
        </button>
        <div
          className="shrink-0 px-4 pb-3 pr-16 pt-4 text-white sm:px-10 sm:pb-7 sm:pr-20 sm:pt-8"
          style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 52%, #1e3a8a 100%)' }}
        >
          <div className="flex min-w-0 items-center gap-3">
            {platformBranding?.logoUrl ? (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1 sm:h-12 sm:w-12">
                <img src={platformBranding.logoUrl} alt="" className="block h-full w-full object-contain" />
              </span>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-sm font-bold sm:h-12 sm:w-12">S</div>
            )}
            <span
              className="min-w-0 truncate text-xs font-semibold uppercase tracking-[0.12em] sm:text-base sm:tracking-normal sm:normal-case"
              style={{ color: '#dbeafe' }}
            >
              {platformBranding?.name || 'SwiftPay'}
            </span>
          </div>
          <p className="mt-3 text-xs font-medium text-blue-100 sm:mt-5 sm:text-base">
            {demonstrating ? `${ui.liveGuide} · ${step + 1}/${steps.length}` : `${ui.gettingStarted} · ${step + 1}/${steps.length}`}
          </p>
          <div className="mt-2 flex gap-1.5 sm:mt-4 sm:gap-2" aria-hidden="true">
            {steps.map((item, index) => (
              <span key={item.title} className={`h-1.5 flex-1 rounded-full sm:h-2 ${index <= step ? 'bg-blue-400' : 'bg-white/20'}`} />
            ))}
          </div>
          <div
            className="mt-3 rounded-xl border p-3 sm:mt-5 sm:rounded-2xl sm:p-5"
            style={{ borderColor: 'rgba(148, 163, 184, 0.28)', backgroundColor: 'rgba(30, 41, 59, 0.82)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-white">{ui.checklist}</p>
                <p className="mt-1 text-[11px] text-blue-100/70">{ui.checklistHint}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-blue-100">
                {ui.progress} {progressPercent}%
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-3 grid max-h-[7.5rem] grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:max-h-none sm:grid-cols-2 sm:gap-2">
              {steps.map((item, index) => {
                const isComplete = completedSteps[index];
                const isCurrent = index === step;
                return (
                  <button
                    key={item.checklist}
                    type="button"
                    onClick={() => {
                      setStep(index);
                      setDemonstrating(false);
                      setDemoPhase(0);
                    }}
                    className={`flex min-h-10 min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-[11px] transition-colors ${
                      isCurrent ? 'border-blue-200/70 bg-blue-500/40 text-white shadow-[0_0_0_1px_rgba(147,197,253,0.12)]' : 'border-white/10 bg-slate-900/70 text-blue-100 hover:bg-slate-800'
                    }`}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      isComplete ? 'bg-emerald-400 text-slate-950' : isCurrent ? 'border border-blue-200 text-blue-100' : 'bg-white/10 text-blue-100/60'
                    }`}>
                      {isComplete ? '✓' : index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.checklist}</span>
                    <span className="shrink-0 text-[10px] text-blue-100/50">
                      {isComplete ? ui.completed : isCurrent ? ui.current : ui.upcoming}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="swift-guide-scroll min-w-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-4 pb-3 [-webkit-overflow-scrolling:touch] sm:px-10 sm:py-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 shadow-sm sm:h-16 sm:w-16 sm:rounded-2xl">
            <Icon className="h-5 w-5 sm:h-8 sm:w-8" />
          </div>
          <h2 id="first-login-guide-title" className="mt-3 text-lg font-semibold leading-tight text-slate-950 sm:mt-6 sm:text-2xl">{current.title}</h2>
          <p className="mt-2.5 text-sm leading-5 text-slate-600 sm:mt-4 sm:text-base sm:leading-7">{current.description}</p>
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-semibold leading-4 text-blue-800 sm:mt-5 sm:px-4 sm:py-3 sm:text-sm">
            {demonstrating ? `${routeReady ? ui.currentLocation : ui.moving}: ${current.page}` : `${ui.nextMove}: ${current.page}`}
          </div>
          {demonstrating && (
            <div className="mt-4 overflow-hidden rounded-xl border border-blue-100 bg-slate-950 p-4 text-white" aria-live="polite">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-200">
                <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> {ui.process}</span>
                <span>{Math.round(((demoPhase + 1) / demoActions.length) * 100)}%</span>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15">
                <div className="swift-guide-draw h-full rounded-full bg-blue-400" style={{ width: `${((demoPhase + 1) / demoActions.length) * 100}%` }} />
              </div>
              <div className="mt-4 space-y-2">
                {demoActions.map((action, index) => (
                  <div key={action} className={`flex min-h-9 items-center gap-3 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-500 ${index === demoPhase ? 'border-blue-400/50 bg-blue-500/25 text-white' : index < demoPhase ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-300'}`}>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${index < demoPhase ? 'bg-emerald-400 text-slate-950' : index === demoPhase ? 'swift-guide-pulse bg-blue-400 text-slate-950' : 'border border-slate-500 bg-slate-800 text-slate-200'}`}>
                      {index < demoPhase ? '✓' : index + 1}
                    </span>
                    <span className="flex-1 leading-5">{action}</span>
                    {index === demoPhase && <MousePointer2 className="swift-guide-click h-4 w-4 text-blue-300" />}
                  </div>
                ))}
              </div>
              <p className="mt-3 border-t border-white/10 pt-3 text-[11px] leading-4 text-slate-400">
                {routeReady ? ui.opened : ui.movingToPage}
              </p>
            </div>
          )}
          {current.example}
          <div className="sticky bottom-0 -mx-4 mt-4 flex flex-col gap-2.5 border-t border-slate-100 bg-white/95 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-0 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0 sm:backdrop-blur-none">
            {demonstrating ? (
              <button type="button" onClick={returnToGuide} className="text-left text-sm font-medium text-slate-500 hover:text-slate-800">
                {ui.return}
              </button>
            ) : (
              <label className="flex min-h-10 cursor-pointer items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 sm:min-h-0 sm:text-sm">
                <input type="checkbox" checked={doNotShowAgain} onChange={event => setDoNotShowAgain(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                {ui.dontShow}
              </label>
            )}
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
              {step > 0 && (
                <button type="button" onClick={() => setStep(value => value - 1)} className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:min-h-0 sm:px-4 sm:py-2.5">
                  {ui.previous}
                </button>
              )}
              {!demonstrating && <button
                type="button"
                onClick={openCurrentPage}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:min-h-0 sm:px-4 sm:py-2.5"
              >
                {current.action}
                <ArrowRight className="h-4 w-4" />
              </button>}
              {demonstrating && step < steps.length - 1 && (
                <button type="button" onClick={() => { markCurrentStepComplete(); setStep(value => value + 1); setDemonstrating(false); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:min-h-0 sm:px-4 sm:py-2.5">
                  {ui.nextGuide}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {!demonstrating && step < steps.length - 1 && (
                <button type="button" onClick={() => setStep(value => value + 1)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 sm:min-h-0 sm:px-4 sm:py-2.5">
                  {ui.next}
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              )}
              {step === steps.length - 1 && (
                <button type="button" onClick={() => { markCurrentStepComplete(); finish(); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:min-h-0 sm:px-4 sm:py-2.5">
                  {ui.complete}
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}
