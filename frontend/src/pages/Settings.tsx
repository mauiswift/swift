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
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <SettingsBanner />

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 20px' }}>Settings</h1>

        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}
        >
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                onClick={() => navigate(item.href)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#fbe3cf',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color="#c2530f" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: 0 }}>{item.title}</p>
                  <p style={{ fontSize: 12.5, color: '#6b7280', margin: '2px 0 0' }}>{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
