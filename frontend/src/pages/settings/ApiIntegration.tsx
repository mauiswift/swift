import { useEffect, useState, CSSProperties, ReactNode, Fragment } from 'react';
import { Copy, Info } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import SettingsBanner from '@/components/settings/SettingsBanner';
import SettingsHeader from '@/components/settings/SettingsHeader';

interface ApiConfigItem {
  id: number;
  config_key: string;
  config_value: string;
}

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

function maskKey(value: string) {
  if (!value) return '—';
  if (value.length <= 8) return `${value.slice(0, 2)}${'•'.repeat(6)}`;
  return `${value.slice(0, 2)}${'•'.repeat(20)}${value.slice(-4)}`;
}

export default function ApiIntegration() {
  const { isSuperAdmin, permissions } = useAuth();
  const [testKey, setTestKey] = useState('');
  const [liveKey, setLiveKey] = useState('');
  const [revealTest, setRevealTest] = useState(false);
  const [revealLive, setRevealLive] = useState(false);
  const [loading, setLoading] = useState(true);

  const [testCallback, setTestCallback] = useState('');
  const [liveCallback, setLiveCallback] = useState('');
  const [statusPageTest, setStatusPageTest] = useState('SwiftPay');
  const [statusPageLive, setStatusPageLive] = useState('SwiftPay');
  const [testSuccess, setTestSuccess] = useState('');
  const [liveSuccess, setLiveSuccess] = useState('');
  const [testCancel, setTestCancel] = useState('');
  const [liveCancel, setLiveCancel] = useState('');
  const [testFailure, setTestFailure] = useState('');
  const [liveFailure, setLiveFailure] = useState('');
  const [saving, setSaving] = useState(false);

  const allowed = isSuperAdmin || Boolean(permissions?.can_manage_team);

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch('/api/v1/entities/api_configs?reveal=true&limit=200');
        const items: ApiConfigItem[] = data?.items || [];
        const test = items.find((i) => /^payment_api_key_test_\d+$/.test(i.config_key));
        const live = items.find((i) => /^payment_api_key_live_\d+$/.test(i.config_key));
        if (test) setTestKey(test.config_value);
        if (live) setLiveKey(live.config_value);
      } catch {
        // no keys issued yet
      } finally {
        setLoading(false);
      }
    })();
  }, [allowed]);

  if (!allowed) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto py-16 text-center text-sm text-muted-foreground">
          You don't have permission to view this page.
        </div>
      </Layout>
    );
  }

  const copy = (value: string) => {
    if (value) navigator.clipboard.writeText(value).catch(() => {});
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 600);
  };

  const rows: Array<{ label: string; render: () => JSX.Element }> = [
    {
      label: 'Access key',
      render: () => (
        <>
          <div style={cellStyle}>
            <MonoText>{loading ? '...' : testKey || 'Not issued yet'}</MonoText>
            {testKey && <Copy size={13} style={iconBtnStyle} onClick={() => copy(testKey)} />}
          </div>
          <div style={cellStyle}>
            <MonoText>{loading ? '...' : liveKey || 'Not issued yet'}</MonoText>
            {liveKey && <Copy size={13} style={iconBtnStyle} onClick={() => copy(liveKey)} />}
          </div>
        </>
      ),
    },
    {
      label: 'Secret key',
      render: () => (
        <>
          <div style={cellStyle}>
            <MonoText>{revealTest ? testKey || '—' : maskKey(testKey)}</MonoText>
            <Info size={13} style={iconBtnStyle} onClick={() => setRevealTest((v) => !v)} />
          </div>
          <div style={cellStyle}>
            <MonoText>{revealLive ? liveKey || '—' : maskKey(liveKey)}</MonoText>
            <Info size={13} style={iconBtnStyle} onClick={() => setRevealLive((v) => !v)} />
          </div>
        </>
      ),
    },
    {
      label: 'Callback URL',
      render: () => (
        <>
          <input style={inputStyle} value={testCallback} onChange={(e) => setTestCallback(e.target.value)} placeholder="https://" />
          <input style={inputStyle} value={liveCallback} onChange={(e) => setLiveCallback(e.target.value)} placeholder="https://" />
        </>
      ),
    },
    {
      label: 'Status page handling',
      render: () => (
        <>
          <select style={inputStyle} value={statusPageTest} onChange={(e) => setStatusPageTest(e.target.value)}>
            <option>SwiftPay</option>
            <option>Custom</option>
          </select>
          <select style={inputStyle} value={statusPageLive} onChange={(e) => setStatusPageLive(e.target.value)}>
            <option>SwiftPay</option>
            <option>Custom</option>
          </select>
        </>
      ),
    },
    {
      label: 'Success URL',
      render: () => (
        <>
          <input style={inputStyle} value={testSuccess} onChange={(e) => setTestSuccess(e.target.value)} placeholder="https://" />
          <input style={inputStyle} value={liveSuccess} onChange={(e) => setLiveSuccess(e.target.value)} placeholder="https://" />
        </>
      ),
    },
    {
      label: 'Cancel URL',
      render: () => (
        <>
          <input style={inputStyle} value={testCancel} onChange={(e) => setTestCancel(e.target.value)} placeholder="https://" />
          <input style={inputStyle} value={liveCancel} onChange={(e) => setLiveCancel(e.target.value)} placeholder="https://" />
        </>
      ),
    },
    {
      label: 'Failure URL',
      render: () => (
        <>
          <input style={inputStyle} value={testFailure} onChange={(e) => setTestFailure(e.target.value)} placeholder="https://" />
          <input style={inputStyle} value={liveFailure} onChange={(e) => setLiveFailure(e.target.value)} placeholder="https://" />
        </>
      ),
    },
  ];

  return (
    <Layout>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <SettingsBanner />
        <SettingsHeader crumb="API & Integration" title="API & Integration" />

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
          <p style={{ fontSize: 13, color: '#374151', margin: '0 0 20px' }}>
            Securely manage your API access keys and secret keys, and add personalized URLs for various scenarios.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr', columnGap: 20, rowGap: 14 }}>
            <span />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#9ca3af' }}>Test mode</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#9ca3af' }}>Live mode</span>

            {rows.map((row) => (
              <Fragment key={row.label}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#c2530f', alignSelf: 'center' }}>
                  {row.label}
                </span>
                {row.render()}
              </Fragment>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              marginTop: 24,
              background: '#111',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '9px 22px',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Layout>
  );
}

function MonoText({ children }: { children: ReactNode }) {
  return <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis' }}>{children}</span>;
}

const cellStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '8px 12px',
  minHeight: 36,
};

const iconBtnStyle: CSSProperties = { cursor: 'pointer', color: '#9ca3af', flexShrink: 0 };

const inputStyle: CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  width: '100%',
};
