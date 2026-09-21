import { Store, Landmark, KeyRound, Shield, ShieldCheck, Copy, Link2, SlidersHorizontal, CheckCircle2, CircleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { hasPermission } from '@/lib/permissions';
import { useTranslation } from '@/lib/i18n';

const BASE_ITEMS = [
  {
    title: 'Account & Security',
    description: 'Telegram linking, password management, and account security.',
    icon: Shield,
    href: '/settings/account-security',
    enabled: true,
  },
  {
    title: 'Store profile',
    description: 'Shop name, logo, platform settings, and multicurrency.',
    icon: Store,
    href: '/settings/shop/preferences',
    enabled: true,
  },
  {
    title: 'Banking',
    description: 'Bank account details and payout settings.',
    icon: Landmark,
    href: '/settings/shop/settlement',
    enabled: true,
  },
  {
    title: 'API & Integration',
    description: 'API keys, webhooks, and integration settings.',
    icon: KeyRound,
    href: '/settings/shop/credentials',
    enabled: true,
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { isSuperAdmin, permissions } = useAuth();
  const t = useTranslation(language);
  const [referralLink, setReferralLink] = useState('');
  const [referralLinkLoading, setReferralLinkLoading] = useState(false);
  const isKo = language === 'ko';
  const ITEMS = useMemo(() => {
    const items = [...BASE_ITEMS];

    return items
      .filter((item) => item.enabled !== false)
      .filter((item) => item.href !== '/settings/shop/credentials' || hasPermission(permissions, 'can_manage_bot'));
  }, [permissions]);

  useEffect(() => {
    setReferralLinkLoading(true);
    client.get('/api/v1/team/referral-link')
      .then((res) => {
        if (res.ok && res.data?.registration_link) setReferralLink(res.data.registration_link);
      })
      .catch(() => undefined)
      .finally(() => setReferralLinkLoading(false));

  }, []);

  return (
    <Layout>
      <div className="page-enter mx-auto w-full max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-blue-50/60 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">
              <SlidersHorizontal size={14} />
              {isKo ? '워크스페이스 설정' : 'Workspace settings'}
            </div>
            <h1 className="m-0 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{isKo ? '설정' : 'Settings'}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {isKo ? '계정, 상점, 결제 및 운영 환경을 한 곳에서 관리하세요.' : 'Manage your account, store, payments, and operating environment from one place.'}
            </p>
          </div>
          {isSuperAdmin && (
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              <ShieldCheck size={14} /> Super Admin
            </span>
          )}
        </div>

        <section className="mb-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 size={16} />
              <p className="text-xs font-bold uppercase tracking-[0.14em]">Account</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">Security and access</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Manage login protection and Telegram linking.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-blue-700">
              <Store size={16} />
              <p className="text-xs font-bold uppercase tracking-[0.14em]">Workspace</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">Store configuration</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Keep your storefront and currencies up to date.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-amber-700">
              <CircleAlert size={16} />
              <p className="text-xs font-bold uppercase tracking-[0.14em]">Operations</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">Review payout details</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Confirm settlement and integration settings before going live.</p>
          </div>
        </section>

        <section className="app-panel p-4 sm:p-6">
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{isKo ? '계정 및 상점' : 'Account and store'}</h2>
              <p className="mt-1 text-xs text-slate-500">{isKo ? '자주 사용하는 계정, 상점, 뱅킹 및 연동 설정입니다.' : 'Frequently used account, store, banking, and integration settings.'}</p>
            </div>
            <span className="text-[11px] font-medium text-slate-400">{isKo ? '빠른 설정' : 'Quick settings'}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const localizedItem = isKo ? ({
              'Account & Security': { title: '계정 및 보안', description: 'Telegram 연결, 비밀번호 관리 및 계정 보안' },
              'Store profile': { title: '상점 프로필', description: '상점 이름, 로고, 플랫폼 설정 및 다중 통화' },
              Banking: { title: '뱅킹', description: '은행 계좌 정보 및 지급 설정' },
              'API & Integration': { title: 'API 및 연동', description: 'API 키, 웹훅 및 연동 설정' },
            } as Record<string, { title: string; description: string }>)[item.title] : null;
            return (
              <button
                key={item.title}
                onClick={() => navigate(item.href)}
                type="button"
                className="group flex min-h-[112px] items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md sm:p-5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm">
                  <Icon size={19} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="m-0 text-sm font-semibold leading-5 text-slate-900">{localizedItem?.title || item.title}</p>
                    <span className="mt-0.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" aria-hidden="true">→</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">{localizedItem?.description || item.description}</p>
                </div>
              </button>
            );
          })}
          </div>
        </section>

        <div className="mt-8 max-w-3xl rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Link2 size={18} className="mt-0.5 flex-shrink-0 text-emerald-600" />
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">{isKo ? '팀 등록 링크' : 'Team registration link'}</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{isKo ? '이 링크를 팀원에게 보내 직접 등록하도록 하세요.' : 'Share this link with team members so they can register directly under your organization.'}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input readOnly value={referralLinkLoading ? (isKo ? '불러오는 중...' : 'Loading...') : referralLink} className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-700" aria-label={isKo ? '팀 등록 링크' : 'Team registration link'} />
            <button
              type="button"
              disabled={!referralLink}
              onClick={() => navigator.clipboard.writeText(referralLink)
                .then(() => toast.success(isKo ? '링크가 복사되었습니다.' : 'Registration link copied'))
                .catch(() => toast.error(isKo ? '링크를 복사하지 못했습니다.' : 'Unable to copy registration link'))}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Copy size={16} /> {isKo ? '복사' : 'Copy link'}
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
}
