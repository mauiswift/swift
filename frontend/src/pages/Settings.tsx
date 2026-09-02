import { useNavigate } from 'react-router-dom';
import { Store, Landmark, KeyRound, Users, Coins, Loader2, Shield } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { isSuperAdmin } = useAuth();
  const [currencies, setCurrencies] = useState(['PHP', 'CNY', 'KRW']);
  const [currencySaving, setCurrencySaving] = useState(false);
  const [krwBankName, setKrwBankName] = useState('KB Kookmin Bank');
  const [krwAccountHolderName, setKrwAccountHolderName] = useState('SwiftPay Ventures Inc.');
  const [bankNameSaving, setBankNameSaving] = useState(false);
  const [accountHolderSaving, setAccountHolderSaving] = useState(false);
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

    return items.filter((item) => item.enabled !== false);
  }, [isSuperAdmin]);

  useEffect(() => {
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
  }, [isSuperAdmin]);

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
                  placeholder="KB Kookmin Bank"
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
          </>
        )}
      </div>
    </Layout>
  );
}
