import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import SettingsBanner from '@/components/settings/SettingsBanner';
import SettingsHeader from '@/components/settings/SettingsHeader';

const ROWS = [
  { label: 'Settlement type', value: 'Wire Transfer', badge: 'Can be modified by admin' },
  { label: 'Settlement currency', value: 'PHP' },
  { label: 'Bank', value: '—' },
  { label: 'Account number', value: '—' },
  { label: 'Recipient', value: '—' },
  { label: 'Address', value: '—' },
];

export default function Banking() {
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
        <SettingsHeader crumb="Banking" title="Banking" />

        <div className="border-b border-slate-200 mb-5">
          <span className="inline-block text-sm font-semibold text-slate-900 pb-2 border-b-2 border-orange-600">
            Settlement account
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-[620px]">
          <p className="text-sm text-slate-700 mb-4">
            Review all the critical details of your settlement account.
          </p>

          <div className="border border-slate-200 rounded-md overflow-hidden">
            {ROWS.map((row, i) => (
              <div
                key={row.label}
                className={`flex items-center justify-between px-4 py-3 ${i === 0 ? '' : 'border-t border-slate-200'}`}
              >
                <div>
                  <p className="text-xs text-slate-400 m-0">{row.label}</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{row.value}</p>
                </div>
                {row.badge && (
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 rounded-full px-2 py-1">
                    {row.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
