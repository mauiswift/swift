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
    `${current.page.split(' → ')[0]} 열기`,
    `${current.page.split(' → ')[1] || '강조된'} 섹션 찾기`,
    '이 페이지의 예시 확인하기',
    '페이지의 작업으로 계속하기',
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

  if (!user || !visible || location.pathname !== '/wallet') return null;

  return (
    <div className={demonstrating ? 'fixed inset-x-2 bottom-2 z-[100] flex max-h-[calc(100dvh-1rem)] justify-center sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[min(460px,calc(100vw-2rem))]' : 'fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/55 px-2 py-3 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6'} role="dialog" aria-modal="true" aria-labelledby="first-login-guide-title">
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
            <span className="absolute -top-9 left-1/2 max-w-[calc(100vw-2rem)] -translate-x-1/2 truncate rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
            Follow this action
          </span>
        </div>
      )}
      <div className={`relative flex max-h-[calc(100dvh-1.5rem)] w-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-300 ${demonstrating ? 'ring-2 ring-blue-500/20 sm:max-h-[calc(100dvh-2.5rem)]' : 'max-w-lg'}`}>
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
          <p className="mt-5 text-sm font-medium text-blue-200">{demonstrating ? `실시간 안내 · ${step + 1}/${steps.length}단계` : `시작하기 · ${step + 1}/${steps.length}단계`}</p>
          <div className="mt-3 flex gap-2" aria-hidden="true">
            {steps.map((item, index) => (
              <span key={item.title} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-blue-400' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>
        <div className="min-h-0 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Icon className="h-6 w-6" />
          </div>
          <h2 id="first-login-guide-title" className="mt-5 text-xl font-semibold text-slate-950">{current.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{current.description}</p>
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
            {demonstrating ? `${routeReady ? '현재 위치' : '이동 중'}: ${current.page}` : `다음 이동: ${current.page}`}
          </div>
          {demonstrating && (
            <div className="mt-4 overflow-hidden rounded-xl border border-blue-100 bg-slate-950 p-4 text-white" aria-live="polite">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-200">
                <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> 진행 과정 보기</span>
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
                {routeReady ? '실제 페이지가 열렸습니다. 강조된 작업을 수행한 뒤 여기로 돌아와 다음 안내를 확인하세요.' : '실제 페이지로 이동 중입니다…'}
              </p>
            </div>
          )}
          {current.example}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            {demonstrating ? (
              <button type="button" onClick={returnToGuide} className="text-left text-sm font-medium text-slate-500 hover:text-slate-800">
                안내로 돌아가기
              </button>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800">
            <input type="checkbox" checked={doNotShowAgain} onChange={event => setDoNotShowAgain(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            다시 표시하지 않기
            </label>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              {step > 0 && (
                <button type="button" onClick={() => setStep(value => value - 1)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  이전
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
                  다음 안내
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {!demonstrating && step < steps.length - 1 && (
                <button type="button" onClick={() => setStep(value => value + 1)} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                  다음
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              )}
              {step === steps.length - 1 && (
                <button type="button" onClick={finish} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                  완료
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
