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
      <div className="max-w-[960px] mx-auto">
        <SettingsBanner />
        <SettingsHeader crumb="Store profile" title="Store profile" />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <p className="text-sm text-slate-700 mb-5">
              Personalize your online store with a unique shop name, custom URL, and the platform that best suits your
              business needs.
            </p>

            <label className="text-sm font-semibold text-slate-900 block mb-2">Shop name</label>
            <input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-4"
            />

            <label className="text-sm font-semibold text-slate-900 block mb-2">Shop URL</label>
            <input
              value={shopUrl}
              onChange={(e) => setShopUrl(e.target.value)}
              placeholder="https://"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-4"
            />

            <label className="text-sm font-semibold text-slate-900 block mb-2">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-4 bg-white"
            >
              <option>Custom</option>
              <option>Shopify</option>
              <option>WooCommerce</option>
              <option>Magento</option>
            </select>

            <label className="flex items-center gap-3 mb-6 cursor-pointer">
              <button
                type="button"
                onClick={() => setDailyStats((v) => !v)}
                className={`relative inline-block w-9 h-5 rounded-full ${dailyStats ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-0.5 ${dailyStats ? 'left-5' : 'left-0.5'} w-4 h-4 rounded-full bg-white transition-all`} />
              </button>
              <span className="text-sm text-slate-900">Receive daily stats email</span>
            </label>

            <div className="bg-emerald-50 border border-emerald-100 rounded-md p-3 mb-6">
              <label className="flex items-center gap-3 cursor-pointer m-0">
                <button
                  type="button"
                  onClick={() => setTestMode((v) => !v)}
                  className={`relative inline-block w-9 h-5 rounded-full ${testMode ? 'bg-blue-500' : 'bg-emerald-500'}`}
                >
                  <span className={`absolute top-0.5 ${testMode ? 'left-0.5' : 'left-5'} w-4 h-4 rounded-full bg-white transition-all`} />
                </button>
                <div>
                  <div className="text-sm font-semibold text-slate-900 m-0">
                    {testMode ? '🧪 Sandbox Mode (Test)' : '🚀 Live Mode'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {testMode ? 'Use test credentials for development' : 'Using live payment credentials'}
                  </div>
                </div>
              </label>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || loading}
              className={`px-5 py-2 rounded-md text-sm font-semibold ${saving || loading ? 'bg-slate-300 text-white cursor-default' : 'bg-slate-900 text-white'}`}
            >
              {loading ? 'Loading...' : saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <p className="text-sm font-semibold text-slate-700 mb-3">Store logo</p>
            <div className="border-dashed border-slate-200 rounded-lg p-7 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                <UploadCloud size={18} color="#6b7280" />
              </div>
              <p className="text-sm font-semibold text-slate-900 m-0">
                Click to upload <span className="font-normal text-slate-500">or drag and drop</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">PNG or JPG (max of 300 KB)</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
