import { useNavigate } from 'react-router-dom';
import { Store, Landmark, KeyRound, Users } from 'lucide-react';
import Layout from '@/components/Layout';

const ITEMS = [
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
  {
    title: 'Team',
    description: 'Team members, roles, and access permissions.',
    icon: Users,
    href: '/settings/user-management',
  },
];

export default function Settings() {
  const navigate = useNavigate();

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
      </div>
    </Layout>
  );
}
