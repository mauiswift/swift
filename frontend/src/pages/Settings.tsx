import { useNavigate } from 'react-router-dom';
import { Store, Landmark, KeyRound, Coins, Loader2, Shield, Download, Upload, AlertTriangle, Copy, Link2, ShieldCheck, SlidersHorizontal, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [currencies, setCurrencies] = useState(['PHP', 'CNY', 'KRW', 'USDT']);
  const [currencySaving, setCurrencySaving] = useState(false);
  const [conversionFeePercent, setConversionFeePercent] = useState('1');
  const [conversionFeeSaving, setConversionFeeSaving] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [referralLinkLoading, setReferralLinkLoading] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const isKo = language === 'ko';
  const ITEMS = useMemo(() => {
    const items = [...BASE_ITEMS];

    return items
      .filter((item) => item.enabled !== false)
      .filter((item) => item.href !== '/settings/shop/credentials' || hasPermission(permissions, 'can_manage_bot'));
  }, [isSuperAdmin, permissions]);

  useEffect(() => {
    setReferralLinkLoading(true);
    client.get('/api/v1/team/referral-link')
      .then((res) => {
        if (res.ok && res.data?.registration_link) setReferralLink(res.data.registration_link);
      })
      .catch(() => undefined)
      .finally(() => setReferralLinkLoading(false));

    if (!isSuperAdmin) return;
    client.get('/api/v1/app-settings/collection-currencies').then((res) => {
      if (res.ok && Array.isArray(res.data?.currencies)) setCurrencies(res.data.currencies);
    }).catch(() => undefined);

    client.get('/api/v1/app-settings/conversion-fee').then((res) => {
      if (res.ok && res.data?.fee_percent != null) setConversionFeePercent(String(res.data.fee_percent));
    }).catch(() => undefined);
  }, [isSuperAdmin]);


  const updateConversionFee = async () => {
    const percent = Number(conversionFeePercent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      toast.error(isKo ? '환전 수수료는 0에서 100% 사이여야 합니다.' : 'Conversion fee must be between 0 and 100%');
      return;
    }
    setConversionFeeSaving(true);
    try {
      const res = await client.request('/api/v1/app-settings/conversion-fee', 'PUT', { fee_percent: percent });
      if (!res.ok) throw new Error(res.data?.detail || (isKo ? '환전 수수료를 업데이트할 수 없습니다.' : 'Unable to update conversion fee'));
      setConversionFeePercent(String(res.data.fee_percent));
      toast.success(isKo ? '환전 수수료가 업데이트되었습니다.' : 'Conversion fee updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (isKo ? '환전 수수료를 업데이트할 수 없습니다.' : 'Unable to update conversion fee'));
    } finally {
      setConversionFeeSaving(false);
    }
  };

  const toggleCurrency = async (currency: string) => {
    const next = currencies.includes(currency)
      ? currencies.filter(item => item !== currency)
      : [...currencies, currency];
    if (!next.length) return toast.error(isKo ? '최소 하나의 통화를 활성화해야 합니다.' : 'Keep at least one currency enabled');
    setCurrencySaving(true);
    try {
      const res = await client.request('/api/v1/app-settings/collection-currencies', 'PUT', { currencies: next });
      if (!res.ok) throw new Error(res.data?.detail || (isKo ? '통화 설정을 업데이트할 수 없습니다.' : 'Unable to update currencies'));
      setCurrencies(res.data.currencies);
      toast.success(isKo ? '통화 사용 가능 설정이 업데이트되었습니다.' : 'Currency availability updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (isKo ? '통화 설정을 업데이트할 수 없습니다.' : 'Unable to update currencies'));
    } finally {
      setCurrencySaving(false);
    }
  };

  const downloadBackup = async () => {
    setBackupBusy(true);
    try {
      const response = await client.fetch('/api/v1/admin/backups/download');
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.detail || 'Unable to create backup');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `swiftpay-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(isKo ? '백업 다운로드가 시작되었습니다.' : 'Backup download started');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create backup');
    } finally {
      setBackupBusy(false);
    }
  };

  const restoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!window.confirm(isKo ? '현재 데이터가 백업 파일로 교체됩니다. 계속하시겠습니까?' : 'This will replace the current data with the backup. Continue?')) return;

    setBackupBusy(true);
    try {
      const formData = new FormData();
      formData.append('backup', file);
      const response = await client.fetch('/api/v1/admin/backups/restore', { method: 'POST', body: formData });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.detail || 'Unable to restore backup');
      toast.success(isKo ? '백업이 복원되었습니다.' : 'Backup restored successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to restore backup');
    } finally {
      setBackupBusy(false);
    }
  };

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

        {isSuperAdmin && (
          <section className="mt-8 app-panel p-4 sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-slate-900">{isKo ? '플랫폼 구성' : 'Platform configuration'}</h2>
              <p className="mt-1 text-xs text-slate-500">{isKo ? '관리자 전용 운영 및 접근 제어 도구입니다.' : 'Super-admin controls for operations, access, and platform-wide behavior.'}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: 'Admin users and roles', description: 'Manage administrators, permissions, and access.', tab: 'admins', icon: Users },
                { title: 'Payment and wallet controls', description: 'Configure channels, limits, fees, and wallet behavior.', tab: 'payment-channels', icon: Coins },
                { title: 'Tatum USDT wallet', description: 'Configure TRC20 address assignment and USDT transfer monitoring.', tab: 'tatum', icon: Link2 },
                { title: 'System operations', description: 'Review maintenance, audit logs, and platform tools.', tab: 'audit-logs', icon: ShieldCheck },
              ].map(item => {
                const Icon = item.icon;
                const localized = isKo ? ({
                  'Admin users and roles': ['관리자 및 역할', '관리자, 권한 및 접근을 관리합니다.'],
                  'Payment and wallet controls': ['결제 및 지갑 관리', '채널, 한도, 수수료 및 지갑 동작을 설정합니다.'],
                  'Tatum USDT wallet': ['Tatum USDT 지갑', 'TRC20 주소 할당 및 USDT 전송 모니터링을 설정합니다.'],
                  'System operations': ['시스템 운영', '점검, 감사 로그 및 플랫폼 도구를 확인합니다.'],
                } as Record<string, string[]>)[item.title] : null;
                return (
                  <button key={item.tab} type="button" onClick={() => navigate(`/admin-management?tab=${item.tab}`)} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white"><Icon size={18} /></div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{localized?.[0] || item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{localized?.[1] || item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

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
              onClick={() => navigator.clipboard.writeText(referralLink).then(() => toast.success(isKo ? '링크가 복사되었습니다.' : 'Registration link copied'))}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Copy size={16} /> {isKo ? '복사' : 'Copy link'}
            </button>
          </div>
        </div>

        {isSuperAdmin && (
          <>
            <div className="mt-8 max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900"><Coins size={18} className="text-[#FF6B00]" />{isKo ? '상점 통화 선택' : 'Merchant currency choices'}</h2>
                  <p className="mt-1 text-[12px] text-slate-500">{isKo ? '상점이 선택할 수 있는 결제 통화를 관리합니다.' : 'Control which collection currencies merchants can select.'}</p>
                </div>
                {currencySaving && <Loader2 size={16} className="animate-spin text-slate-400" />}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {['PHP', 'CNY', 'KRW', 'USDT'].map(currency => (
                  <button key={currency} type="button" data-testid={`currency-toggle-${currency.toLowerCase()}`} aria-pressed={currencies.includes(currency)} disabled={currencySaving} onClick={() => toggleCurrency(currency)} className={`rounded-lg border px-4 py-2 text-[13px] font-semibold transition-colors ${currencies.includes(currency) ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                    {currency} {currencies.includes(currency) ? (isKo ? '활성화' : 'Enabled') : (isKo ? '비활성화' : 'Disabled')}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-900">{isKo ? '환전 수수료' : 'Exchange conversion fee'}</h2>
                  <p className="mt-1 text-[12px] text-slate-500">{isKo ? '사용자가 지갑에서 통화를 환전할 때 적용되는 수수료를 설정합니다.' : 'Set the fee applied when users convert currencies in their wallet.'}</p>
                </div>
                {conversionFeeSaving && <Loader2 size={16} className="animate-spin text-slate-400" />}
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <input type="number" min="0" max="100" step="0.01" value={conversionFeePercent} onChange={(event) => setConversionFeePercent(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-300 focus:bg-white" aria-label={isKo ? '환전 수수료 비율' : 'Conversion fee percentage'} />
                  <span className="text-sm font-semibold text-slate-500">%</span>
                </div>
                <button type="button" onClick={updateConversionFee} disabled={conversionFeeSaving} className="rounded-lg bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e85f00] disabled:opacity-60">{isKo ? '저장' : 'Save'}</button>
              </div>
            </div>

            <div className="mt-8 max-w-3xl rounded-xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-amber-600" />
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-900">{isKo ? '데이터 백업 및 복원' : 'Data backup and restore'}</h2>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{isKo ? '전체 데이터베이스를 다운로드하거나 이전 백업으로 복원합니다. 복원하면 현재 데이터가 교체됩니다.' : 'Download the full database or restore a previous backup. Restoring replaces the current data.'}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={downloadBackup} disabled={backupBusy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e85f00] disabled:cursor-not-allowed disabled:opacity-60">
                  <Download size={16} /> {isKo ? '백업 다운로드' : 'Download backup'}
                </button>
                <input ref={restoreInputRef} type="file" accept="application/json,.json" onChange={restoreBackup} className="hidden" />
                <button type="button" onClick={() => restoreInputRef.current?.click()} disabled={backupBusy} className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60">
                  <Upload size={16} /> {isKo ? '백업 복원' : 'Restore backup'}
                </button>
                {backupBusy && <Loader2 size={18} className="m-2 animate-spin text-amber-700" />}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
