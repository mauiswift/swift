import { useNavigate } from 'react-router-dom';
import { Store, Landmark, KeyRound, Users, Coins, Loader2, Shield, Download, Upload, AlertTriangle, Copy, Link2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { hasPermission } from '@/lib/permissions';

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
  const [currencies, setCurrencies] = useState(['PHP', 'CNY', 'KRW']);
  const [currencySaving, setCurrencySaving] = useState(false);
  const [krwBankName, setKrwBankName] = useState('Toss Bank');
  const [krwAccountHolderName, setKrwAccountHolderName] = useState('SwiftPay Ventures Inc.');
  const [bankNameSaving, setBankNameSaving] = useState(false);
  const [accountHolderSaving, setAccountHolderSaving] = useState(false);
  const [conversionFeePercent, setConversionFeePercent] = useState('1');
  const [conversionFeeSaving, setConversionFeeSaving] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [referralLinkLoading, setReferralLinkLoading] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const isKo = language === 'ko';
  const ITEMS = useMemo(() => {
    const items = [...BASE_ITEMS];

    if (isSuperAdmin) {
      items.push({
        title: 'Admin management',
        description: 'Admin roles, permissions, team access, and system controls.',
        icon: Users,
        href: '/admin-management',
        enabled: true,
      });
    }

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

    client.get('/api/v1/app-settings/krw-bank-name').then((res) => {
      if (res.ok && res.data?.bank_name) setKrwBankName(res.data.bank_name);
    }).catch(() => undefined);

    client.get('/api/v1/app-settings/krw-account-holder-name').then((res) => {
      if (res.ok && res.data?.holder_name) setKrwAccountHolderName(res.data.holder_name);
    }).catch(() => undefined);

    client.get('/api/v1/app-settings/conversion-fee').then((res) => {
      if (res.ok && res.data?.fee_percent != null) setConversionFeePercent(String(res.data.fee_percent));
    }).catch(() => undefined);
  }, [isSuperAdmin]);


  const updateConversionFee = async () => {
    const percent = Number(conversionFeePercent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      toast.error('Conversion fee must be between 0 and 100%');
      return;
    }
    setConversionFeeSaving(true);
    try {
      const res = await client.request('/api/v1/app-settings/conversion-fee', 'PUT', { fee_percent: percent });
      if (!res.ok) throw new Error(res.data?.detail || 'Unable to update conversion fee');
      setConversionFeePercent(String(res.data.fee_percent));
      toast.success('Conversion fee updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update conversion fee');
    } finally {
      setConversionFeeSaving(false);
    }
  };

  const toggleCurrency = async (currency: string) => {
    const next = currencies.includes(currency)
      ? currencies.filter(item => item !== currency)
      : [...currencies, currency];
    if (!next.length) return toast.error('Keep at least one currency enabled');
    setCurrencySaving(true);
    try {
      const res = await client.request('/api/v1/app-settings/collection-currencies', 'PUT', { currencies: next });
      if (!res.ok) throw new Error(res.data?.detail || 'Unable to update currencies');
      setCurrencies(res.data.currencies);
      toast.success('Currency availability updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update currencies');
    } finally {
      setCurrencySaving(false);
    }
  };

  const updateKrwBankName = async () => {
    const trimmed = krwBankName.trim();
    if (!trimmed) return toast.error('KRW bank name cannot be empty');
    setBankNameSaving(true);
    try {
      const res = await client.request('/api/v1/app-settings/krw-bank-name', 'PUT', { bank_name: trimmed });
      if (!res.ok) throw new Error(res.data?.detail || 'Unable to update KRW bank name');
      setKrwBankName(res.data.bank_name);
      toast.success('KRW bank name updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update KRW bank name');
    } finally {
      setBankNameSaving(false);
    }
  };

  const updateKrwAccountHolderName = async () => {
    const trimmed = krwAccountHolderName.trim();
    if (!trimmed) return toast.error('KRW account holder name cannot be empty');
    setAccountHolderSaving(true);
    try {
      const res = await client.request('/api/v1/app-settings/krw-account-holder-name', 'PUT', { holder_name: trimmed });
      if (!res.ok) throw new Error(res.data?.detail || 'Unable to update KRW account holder name');
      setKrwAccountHolderName(res.data.holder_name);
      toast.success('KRW account holder updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update KRW account holder name');
    } finally {
      setAccountHolderSaving(false);
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
      <div className="page-enter">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0 mb-8">{isKo ? '설정' : 'Settings'}</h1>

        <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                onClick={() => navigate(item.href)}
                className="flex items-start gap-4 text-left p-2 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-[#FFF5F1] flex items-center justify-center flex-shrink-0 border border-[#FFDCCB]">
                  <Icon size={18} className="text-[#FF6B00]" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-slate-900 m-0">{item.title}</p>
                  <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 max-w-3xl rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Link2 size={18} className="mt-0.5 flex-shrink-0 text-emerald-600" />
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">{isKo ? '팀 등록 링크' : 'Team registration link'}</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{isKo ? '이 링크를 팀원에게 보내 직접 등록하도록 하세요.' : 'Share this link with team members so they can register directly under your organization.'}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input readOnly value={referralLinkLoading ? 'Loading...' : referralLink} className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-700" aria-label="Team registration link" />
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
                {['PHP', 'CNY', 'KRW'].map(currency => (
                  <button key={currency} type="button" disabled={currencySaving} onClick={() => toggleCurrency(currency)} className={`rounded-lg border px-4 py-2 text-[13px] font-semibold transition-colors ${currencies.includes(currency) ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                    {currency} {currencies.includes(currency) ? (isKo ? '활성화' : 'Enabled') : (isKo ? '비활성화' : 'Disabled')}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-900">Exchange conversion fee</h2>
                  <p className="mt-1 text-[12px] text-slate-500">Set the fee applied when users convert currencies in their wallet.</p>
                </div>
                {conversionFeeSaving && <Loader2 size={16} className="animate-spin text-slate-400" />}
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <input type="number" min="0" max="100" step="0.01" value={conversionFeePercent} onChange={(event) => setConversionFeePercent(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-300 focus:bg-white" aria-label="Conversion fee percentage" />
                  <span className="text-sm font-semibold text-slate-500">%</span>
                </div>
                <button type="button" onClick={updateConversionFee} disabled={conversionFeeSaving} className="rounded-lg bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e85f00] disabled:opacity-60">Save</button>
              </div>
            </div>

            <div className="mt-8 max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900"><Landmark size={18} className="text-[#FF6B00]" />{isKo ? 'KRW 입금 은행명' : 'KRW deposit bank name'}</h2>
                  <p className="mt-1 text-[12px] text-slate-500">{isKo ? 'KRW 가상 계좌에 표시되는 한국 은행명을 변경할 수 있습니다.' : 'Adjust the Korean bank name shown on KRW virtual-account deposits.'}</p>
                </div>
                {bankNameSaving && <Loader2 size={16} className="animate-spin text-slate-400" />}
              </div>
              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <input
                  value={krwBankName}
                  onChange={(e) => setKrwBankName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-300 focus:bg-white"
                  placeholder="Toss Bank"
                />
                <button
                  type="button"
                  onClick={updateKrwBankName}
                  disabled={bankNameSaving}
                  className="rounded-lg bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e85f00] disabled:opacity-60"
                >
                  {isKo ? '저장' : 'Save'}
                </button>
              </div>
            </div>

            <div className="mt-8 max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900"><Coins size={18} className="text-[#FF6B00]" />{isKo ? 'KRW 계좌 예금주' : 'KRW account holder'}</h2>
                  <p className="mt-1 text-[12px] text-slate-500">{isKo ? 'KRW 가상 계좌의 예금주명을 변경할 수 있습니다.' : 'Adjust the account holder name shown on KRW bank transfers.'}</p>
                </div>
                {accountHolderSaving && <Loader2 size={16} className="animate-spin text-slate-400" />}
              </div>
              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <input
                  value={krwAccountHolderName}
                  onChange={(e) => setKrwAccountHolderName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-300 focus:bg-white"
                  placeholder="SwiftPay Ventures Inc."
                />
                <button
                  type="button"
                  onClick={updateKrwAccountHolderName}
                  disabled={accountHolderSaving}
                  className="rounded-lg bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e85f00] disabled:opacity-60"
                >
                  {isKo ? '저장' : 'Save'}
                </button>
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
