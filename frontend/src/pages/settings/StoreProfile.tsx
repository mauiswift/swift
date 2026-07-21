import { useState, useEffect } from 'react';
import { UploadCloud } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { client } from '@/lib/api';
import SettingsBanner from '@/components/settings/SettingsBanner';
import SettingsHeader from '@/components/settings/SettingsHeader';
import { toast } from 'sonner';

export default function StoreProfile() {
  const { user, isSuperAdmin, permissions } = useAuth();

  const [shopName, setShopName] = useState(user?.organization_name || '');
  const [shopUrl, setShopUrl] = useState('');
  const [platform, setPlatform] = useState('Custom');
  const [dailyStats, setDailyStats] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await client.get('/api/v1/admin-users/me/test-mode');
        if (response.ok && response.data) {
          setTestMode(response.data.test_mode);
        }
      } catch (err) {
        console.error('Failed to load test mode setting:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!isSuperAdmin && !permissions?.can_manage_team) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto py-16 text-center text-sm text-muted-foreground">
          You don't have permission to view this page.
        </div>
      </Layout>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await client.patch('/api/v1/admin-users/me/test-mode', { test_mode: testMode });
      if (response.ok) {
        toast.success(`Switched to ${testMode ? 'sandbox (test mode)' : 'live mode'}`);
      } else {
        toast.error('Failed to update test mode setting');
      }
    } catch (err) {
      toast.error('Failed to update test mode setting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <SettingsBanner />
        <SettingsHeader crumb="Store profile" title="Store profile" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
            <p style={{ fontSize: 13, color: '#374151', margin: '0 0 20px' }}>
              Personalize your online store with a unique shop name, custom URL, and the platform that best suits your
              business needs.
            </p>

            <label style={{ fontSize: 13, fontWeight: 600, color: '#111', display: 'block', marginBottom: 6 }}>
              Shop name
            </label>
            <input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: 13.5,
                marginBottom: 18,
              }}
            />

            <label style={{ fontSize: 13, fontWeight: 600, color: '#111', display: 'block', marginBottom: 6 }}>
              Shop URL
            </label>
            <input
              value={shopUrl}
              onChange={(e) => setShopUrl(e.target.value)}
              placeholder="https://"
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: 13.5,
                marginBottom: 18,
              }}
            />

            <label style={{ fontSize: 13, fontWeight: 600, color: '#111', display: 'block', marginBottom: 6 }}>
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: 13.5,
                marginBottom: 18,
                background: '#fff',
              }}
            >
              <option>Custom</option>
              <option>Shopify</option>
              <option>WooCommerce</option>
              <option>Magento</option>
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, cursor: 'pointer' }}>
              <span
                onClick={() => setDailyStats((v) => !v)}
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 999,
                  background: dailyStats ? '#22c55e' : '#d1d5db',
                  position: 'relative',
                  transition: 'background 0.15s',
                  display: 'inline-block',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: dailyStats ? 18 : 2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.15s',
                  }}
                />
              </span>
              <span style={{ fontSize: 13.5, color: '#111' }}>Receive daily stats email</span>
            </label>

            <div style={{ background: '#f0fdfa', border: '1px solid #99f6e0', borderRadius: 8, padding: 12, marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', margin: 0 }}>
                <span
                  onClick={() => setTestMode((v) => !v)}
                  style={{
                    width: 36,
                    height: 20,
                    borderRadius: 999,
                    background: testMode ? '#3b82f6' : '#22c55e',
                    position: 'relative',
                    transition: 'background 0.15s',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: testMode ? 2 : 18,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: '#fff',
                      transition: 'left 0.15s',
                    }}
                  />
                </span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111', margin: 0 }}>
                    {testMode ? '🧪 Sandbox Mode (Test)' : '🚀 Live Mode'}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
                    {testMode ? 'Use test credentials for development' : 'Using live payment credentials'}
                  </div>
                </div>
              </label>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || loading}
              style={{
                background: saving || loading ? '#9ca3af' : '#111',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '9px 22px',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: saving || loading ? 'default' : 'pointer',
              }}
            >
              {loading ? 'Loading...' : saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', margin: '0 0 12px' }}>Store logo</p>
            <div
              style={{
                border: '1px dashed #d1d5db',
                borderRadius: 10,
                padding: '28px 12px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                }}
              >
                <UploadCloud size={18} color="#6b7280" />
              </div>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: '#111', margin: 0 }}>
                Click to upload <span style={{ fontWeight: 400, color: '#6b7280' }}>or drag and drop</span>
              </p>
              <p style={{ fontSize: 11.5, color: '#9ca3af', margin: '4px 0 0' }}>PNG or JPG (max of 300 KB)</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
