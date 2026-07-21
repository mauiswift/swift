import { useNavigate } from 'react-router-dom';
import { Warehouse, Landmark, KeyRound, Users } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import SettingsBanner from '@/components/settings/SettingsBanner';

const ITEMS = [
  {
    title: 'Store profile',
    description: 'Shop name, logo, platform settings, and multicurrency.',
    icon: Warehouse,
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
  const { isSuperAdmin, permissions } = useAuth();

  if (!isSuperAdmin && !permissions?.can_manage_team) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto py-16 text-center text-sm text-muted-foreground">
          You don't have permission to view this page.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[960px] mx-auto">
        <SettingsBanner />

        <h1 className="text-2xl font-bold text-slate-900 mb-5">Settings</h1>

        <div className="bg-white border border-slate-200 rounded-lg p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                onClick={() => navigate(item.href)}
                className="flex items-start gap-3 text-left bg-transparent border-0 cursor-pointer p-0"
              >
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} color="#c2530f" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900 m-0">{item.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
