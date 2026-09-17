import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, ShieldCheck, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api';
import BrandLogo from '@/components/BrandLogo';

interface MaintenanceStatus {
  maintenance_mode: boolean;
  maintenance_started_at?: string | null;
  maintenance_ends_at?: string | null;
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const emptyCountdown: Countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };

function getCountdown(endAt?: string | null): Countdown {
  if (!endAt) return emptyCountdown;

  const remaining = Math.max(0, new Date(endAt).getTime() - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);

  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

function CountdownCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-4 text-center shadow-inner shadow-white/[0.03] sm:px-5 sm:py-5">
      <p className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {String(value).padStart(2, '0')}
      </p>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
    </div>
  );
}

export default function MaintenancePage() {
  const [countdown, setCountdown] = useState<Countdown>(emptyCountdown);

  const { data: maintenanceData, isLoading } = useQuery({
    queryKey: ['maintenance-status'],
    queryFn: async () => {
      const response = await client.apiCall.invoke({
        url: '/api/v1/app-settings/maintenance',
        method: 'GET',
        data: {},
      });
      if (!response.ok) throw new Error('Unable to read maintenance status');
      return response.data as MaintenanceStatus;
    },
    refetchInterval: 30_000,
    retry: 2,
  });

  useEffect(() => {
    setCountdown(getCountdown(maintenanceData?.maintenance_ends_at));
    const timer = window.setInterval(() => {
      setCountdown(getCountdown(maintenanceData?.maintenance_ends_at));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [maintenanceData?.maintenance_ends_at]);

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#08111f] px-6 text-white">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-blue-400/20" aria-label="점검 상태를 불러오는 중" />
      </main>
    );
  }

  if (!maintenanceData?.maintenance_mode) return null;

  return (
    <main lang="ko" className="relative min-h-screen overflow-hidden bg-[#07111f] px-5 py-8 text-white sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(45,127,249,0.2),transparent_32%),radial-gradient(circle_at_85%_85%,rgba(25,196,180,0.12),transparent_30%)]" />
      <div className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col justify-between">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" aria-label="SwiftPay 홈">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-lg shadow-black/20">
              <BrandLogo alt="" className="h-7 w-7" />
            </span>
            <span className="text-lg font-bold tracking-tight">SwiftPay</span>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
            한국 서버 업그레이드
          </div>
        </header>

        <section className="mx-auto w-full max-w-3xl py-14 text-center sm:py-20">
          <div className="mx-auto mb-7 grid h-16 w-16 place-items-center rounded-2xl border border-blue-300/20 bg-blue-400/10 shadow-2xl shadow-blue-950/40">
            <Clock3 className="h-8 w-8 text-blue-300" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-300">예정된 시스템 점검</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">
            곧 다시 만나 뵙겠습니다.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
            더 빠르고 안정적인 결제 처리를 위해 한국 서버를 새로운 인프라로 이전하고 있습니다.
            계정과 결제 데이터는 안전하게 보호됩니다.
          </p>
          <p className="mt-4 text-sm font-semibold text-emerald-300">고객님의 자금은 안전하게 보호됩니다.</p>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.05] p-4 shadow-2xl shadow-black/20 sm:p-6">
            <div className="mb-4 flex items-center justify-between px-1 text-left">
              <div>
                <p className="text-sm font-semibold text-white">예상 남은 시간</p>
                <p className="mt-1 text-xs text-slate-500">서버를 다시 배포해도 카운트다운은 유지됩니다.</p>
              </div>
              <Wifi className="hidden h-5 w-5 text-blue-300 sm:block" />
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              <CountdownCard value={countdown.days} label="일" />
              <CountdownCard value={countdown.hours} label="시간" />
              <CountdownCard value={countdown.minutes} label="분" />
              <CountdownCard value={countdown.seconds} label="초" />
            </div>
          </div>

          <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
            {[
              ['인프라 이전 중', '더 빠르고 안정적인 서버로 이동합니다'],
              ['데이터 보호', '보안 시스템이 계속 작동합니다'],
              ['자동 서비스 재개', '별도의 조치가 필요하지 않습니다'],
            ].map(([title, body]) => (
              <div key={title} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <div>
                  <p className="text-sm font-semibold text-slate-200">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="flex flex-col gap-6 border-t border-white/10 pt-5 text-xs text-slate-500 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              점검 중에도 고객님의 데이터는 안전하게 보호됩니다
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">기술 파트너</span>
              <div className="overflow-hidden rounded-lg px-2 py-1">
                <img
                  src="/partners/drl-technology-gold.png"
                  alt="DRL Technology"
                  className="h-14 w-auto max-w-[260px] object-contain drop-shadow-[0_0_14px_rgba(245,190,55,0.6)]"
                />
              </div>
            </div>
          </div>
          <Link to="/login" className="inline-flex items-center justify-center gap-2 font-semibold text-blue-300 transition hover:text-white sm:justify-end">
            <ArrowLeft className="h-3.5 w-3.5" />
            로그인으로 이동
          </Link>
        </footer>
      </div>
    </main>
  );
}
