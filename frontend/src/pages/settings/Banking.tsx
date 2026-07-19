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
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <SettingsBanner />
        <SettingsHeader crumb="Banking" title="Banking" />

        <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: 13,
              fontWeight: 600,
              color: '#111',
              padding: '0 0 10px',
              borderBottom: '2px solid #ea6d1f',
            }}
          >
            Settlement account
          </span>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, maxWidth: 620 }}>
          <p style={{ fontSize: 13, color: '#374151', margin: '0 0 16px' }}>
            Review all the critical details of your settlement account.
          </p>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
            {ROWS.map((row, i) => (
              <div
                key={row.label}
                style={{
                  padding: '12px 16px',
                  borderTop: i === 0 ? 'none' : '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <p style={{ fontSize: 11.5, color: '#9ca3af', margin: 0 }}>{row.label}</p>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: '#111', margin: '2px 0 0' }}>{row.value}</p>
                </div>
                {row.badge && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#374151',
                      background: '#f3f4f6',
                      borderRadius: 999,
                      padding: '3px 10px',
                    }}
                  >
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
