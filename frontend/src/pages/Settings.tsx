import { useNavigate } from 'react-router-dom';
import { Store, Landmark, KeyRound, Users, Coins, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Layout from '@/components/Layout';

const BASE_ITEMS = [
  {
    title: 'Store profile',
    description: 'Shop name, logo, platform settings, and multicurrency.',
    icon: Store,
    href: '/settings/shop/preferences',
  },
  {
    title: 'Banking',
    description: 'Bank account details and payout settings.',
    icon: Landmark,
    href: '/settings/shop/settlement',
  },
  {
    title: 'API & Integration',
    description: 'API keys, webhooks, and integration settings.',
    icon: KeyRound,
    href: '/settings/shop/credentials',
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [currencies, setCurrencies] = useState(['PHP', 'CNY', 'KRW']);
  const [currencySaving, setCurrencySaving] = useState(false);
  const ITEMS = isSuperAdmin
    ? [
        ...BASE_ITEMS,
        {
          title: 'Team',
          description: 'Team members, roles, and access permissions.',
          icon: Users,
          href: '/settings/user-management',
        },
      ]
    : BASE_ITEMS;

  useEffect(() => {
    if (!isSuperAdmin) return;
    client.get('/api/v1/app-settings/collection-currencies').then((res) => {
      if (res.ok && Array.isArray(res.data?.currencies)) setCurrencies(res.data.currencies);
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

  return (
    <Layout>
      <div className="page-enter">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0 mb-8">Settings</h1>

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
          <div className="mt-8 max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900"><Coins size={18} className="text-[#FF6B00]" />Merchant currency choices</h2>
                <p className="mt-1 text-[12px] text-slate-500">Control which collection currencies merchants can select.</p>
              </div>
              {currencySaving && <Loader2 size={16} className="animate-spin text-slate-400" />}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {['PHP', 'CNY', 'KRW'].map(currency => (
                <button key={currency} type="button" disabled={currencySaving} onClick={() => toggleCurrency(currency)} className={`rounded-lg border px-4 py-2 text-[13px] font-semibold transition-colors ${currencies.includes(currency) ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                  {currency} {currencies.includes(currency) ? 'Enabled' : 'Disabled'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
