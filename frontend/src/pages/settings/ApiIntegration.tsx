import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Copy, HelpCircle, ChevronDown, Save, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { client } from '@/lib/api';
import { toast } from 'sonner';

interface ApiConfig {
  test_access_key: string;
  test_secret_key?: string;
  live_access_key: string;
  live_secret_key?: string;
  test_callback_url?: string;
  test_status_page_mode: string;
  test_external_status_url?: string;
  test_success_url?: string;
  test_cancel_url?: string;
  test_failure_url?: string;
  live_callback_url?: string;
  live_status_page_mode: string;
  live_external_status_url?: string;
  live_success_url?: string;
  live_cancel_url?: string;
  live_failure_url?: string;
}

export default function ApiIntegration() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const [config, setConfig] = useState<ApiConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<'test' | 'live' | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await client.get('/api/v1/merchant/api-config');
      if (res.data) setConfig(res.data);
    } catch (err) {
      toast.error('Failed to fetch API configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await client.patch('/api/v1/merchant/api-config', config);
      if (res.ok) {
        toast.success('Configuration saved successfully');
      } else {
        toast.error('Failed to save configuration');
      }
    } catch (err) {
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const generateSecret = async (mode: 'test' | 'live') => {
    if (!window.confirm(`Are you sure you want to generate a new ${mode} secret key? The existing one will be replaced.`)) return;

    setGenerating(mode);
    try {
      const res = await client.post('/api/v1/merchant/api-config/generate-secret', { mode });
      if (res.data?.secret_key) {
        toast.success(`${mode.toUpperCase()} Secret Key generated`);
        // Update local state
        setConfig(prev => prev ? {
          ...prev,
          [`${mode}_secret_key`]: res.data.secret_key
        } : null);
      }
    } catch (err) {
      toast.error('Failed to generate secret key');
    } finally {
      setGenerating(null);
    }
  };

  const resetSecret = async (mode: 'test' | 'live') => {
    if (!config || !user?.organization_id) return;
    if (!window.confirm(`Admin: Are you sure you want to RESET the ${mode} secret key? The key will be cleared.`)) return;

    setGenerating(mode);
    try {
      if (!user?.organization_id) throw new Error('Organization ID not found');
      const res = await client.post(`/api/v1/merchant/api-config/${user.organization_id}/reset-secret`, { mode });
      if (res.data?.success) {
        toast.success(`${mode.toUpperCase()} Secret Key reset`);
        setConfig(prev => prev ? {
          ...prev,
          [`${mode}_secret_key`]: undefined
        } : null);
      }
    } catch (err) {
      toast.error('Failed to reset secret key');
    } finally {
      setGenerating(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-enter pb-20">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-8 font-medium">
          <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={() => navigate('/settings')}>Settings</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-semibold">API & Integration</span>
        </div>

        {/* Title */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">API & Integration</h1>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#FF6B00] text-white px-6 py-2.5 rounded-lg text-[14px] font-semibold shadow-lg shadow-[#FF6B00]/20 hover:bg-[#E66000] transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm overflow-hidden">
          <p className="text-[14px] text-slate-500 mb-10 max-w-2xl font-medium">
            Securely manage your API access keys and secret keys, and add personalized URLs for various scenarios.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr>
                  <th className="w-[240px]"></th>
                  <th className="px-6 py-6 text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-center">Test mode</th>
                  <th className="px-6 py-6 text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-center">Live mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {/* Access Key Row */}
                <tr>
                  <td className="py-8 text-[13px] font-semibold text-slate-400">Access key</td>
                  <td className="px-6 py-8">
                    <div className="flex items-center gap-3 justify-center">
                      <span className="text-[12px] font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded border border-slate-100">
                        {config?.test_access_key}
                      </span>
                      <button onClick={() => copyToClipboard(config?.test_access_key || '')} className="text-slate-300 hover:text-slate-500 transition-colors">
                        <Copy size={16} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-8">
                    <div className="flex items-center gap-3 justify-center">
                      <span className="text-[12px] font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded border border-slate-100">
                        {config?.live_access_key}
                      </span>
                      <button onClick={() => copyToClipboard(config?.live_access_key || '')} className="text-slate-300 hover:text-slate-500 transition-colors">
                        <Copy size={16} />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Secret Key Row */}
                <tr>
                  <td className="py-8 text-[13px] font-semibold text-slate-400">Secret key</td>
                  <td className="px-6 py-8 text-center">
                    {config?.test_secret_key ? (
                      <div className="flex items-center gap-3 justify-center">
                        <span className="text-[12px] font-mono text-slate-900 bg-[#FFF5F1] px-3 py-1.5 rounded border border-[#FFDCCB]">
                          {config.test_secret_key}
                        </span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => generateSecret('test')} disabled={!!generating} title="Regenerate" className="text-slate-300 hover:text-[#FF6B00] transition-colors">
                            <RefreshCw size={16} className={generating === 'test' ? 'animate-spin' : ''} />
                          </button>
                          {isSuperAdmin && (
                            <button onClick={() => resetSecret('test')} disabled={!!generating} title="Reset (Admin Only)" className="text-slate-300 hover:text-rose-600 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => generateSecret('test')}
                        disabled={!!generating}
                        className="text-[13px] font-semibold text-slate-800 hover:text-[#FF6B00] transition-colors inline-flex items-center gap-2"
                      >
                        Generate API Secret key
                        <HelpCircle size={14} className="text-slate-400" />
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-8 text-center">
                    {config?.live_secret_key ? (
                      <div className="flex items-center gap-3 justify-center">
                        <span className="text-[12px] font-mono text-slate-900 bg-[#FFF5F1] px-3 py-1.5 rounded border border-[#FFDCCB]">
                          {config.live_secret_key}
                        </span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => generateSecret('live')} disabled={!!generating} title="Regenerate" className="text-slate-300 hover:text-[#FF6B00] transition-colors">
                            <RefreshCw size={16} className={generating === 'live' ? 'animate-spin' : ''} />
                          </button>
                          {isSuperAdmin && (
                            <button onClick={() => resetSecret('live')} disabled={!!generating} title="Reset (Admin Only)" className="text-slate-300 hover:text-rose-600 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => generateSecret('live')}
                        disabled={!!generating}
                        className="text-[13px] font-semibold text-slate-800 hover:text-[#FF6B00] transition-colors inline-flex items-center gap-2"
                      >
                        Generate API Secret key
                        <HelpCircle size={14} className="text-slate-400" />
                      </button>
                    )}
                  </td>
                </tr>

                <ApiInputRow
                  label="Callback URL"
                  testValue={config?.test_callback_url || ''}
                  liveValue={config?.live_callback_url || ''}
                  onChange={(mode, val) => setConfig(prev => prev ? { ...prev, [`${mode}_callback_url`]: val } : null)}
                />

                <tr>
                  <td className="py-8 text-[13px] font-semibold text-slate-400">Status page handling</td>
                  <td className="px-6 py-8">
                    <div className="relative">
                      <select
                        value={config?.test_status_page_mode || 'swiftpay'}
                        onChange={e => setConfig(prev => prev ? { ...prev, test_status_page_mode: e.target.value } : null)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] text-slate-600 outline-none focus:border-[#FF6B00] appearance-none cursor-pointer"
                      >
                        <option value="swiftpay">Swiftpay</option>
                        <option value="external">External</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                  </td>
                  <td className="px-6 py-8">
                    <div className="relative">
                      <select
                        value={config?.live_status_page_mode || 'swiftpay'}
                        onChange={e => setConfig(prev => prev ? { ...prev, live_status_page_mode: e.target.value } : null)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] text-slate-600 outline-none focus:border-[#FF6B00] appearance-none cursor-pointer"
                      >
                        <option value="swiftpay">Swiftpay</option>
                        <option value="external">External</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                  </td>
                </tr>

                <ApiInputRow
                  label="External status page URL"
                  testValue={config?.test_external_status_url || ''}
                  liveValue={config?.live_external_status_url || ''}
                  onChange={(mode, val) => setConfig(prev => prev ? { ...prev, [`${mode}_external_status_url`]: val } : null)}
                  disabledTest={config?.test_status_page_mode === 'swiftpay'}
                  disabledLive={config?.live_status_page_mode === 'swiftpay'}
                />

                <ApiInputRow
                  label="Success URL"
                  testValue={config?.test_success_url || ''}
                  liveValue={config?.live_success_url || ''}
                  onChange={(mode, val) => setConfig(prev => prev ? { ...prev, [`${mode}_success_url`]: val } : null)}
                />

                <ApiInputRow
                  label="Cancel URL"
                  testValue={config?.test_cancel_url || ''}
                  liveValue={config?.live_cancel_url || ''}
                  onChange={(mode, val) => setConfig(prev => prev ? { ...prev, [`${mode}_cancel_url`]: val } : null)}
                />

                <ApiInputRow
                  label="Failure URL"
                  testValue={config?.test_failure_url || ''}
                  liveValue={config?.live_failure_url || ''}
                  onChange={(mode, val) => setConfig(prev => prev ? { ...prev, [`${mode}_failure_url`]: val } : null)}
                />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ApiInputRow({ label, testValue, liveValue, onChange, disabledTest, disabledLive }: {
  label: string; testValue: string; liveValue: string;
  onChange: (mode: 'test' | 'live', val: string) => void;
  disabledTest?: boolean; disabledLive?: boolean;
}) {
  return (
    <tr>
      <td className="py-8 text-[13px] font-semibold text-slate-400">{label}</td>
      <td className="px-6 py-8">
        <input
          value={testValue}
          onChange={e => onChange('test', e.target.value)}
          disabled={disabledTest}
          placeholder="https://"
          className={`w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] text-slate-600 outline-none focus:border-[#FF6B00] transition-all ${disabledTest ? 'opacity-30' : ''}`}
        />
      </td>
      <td className="px-6 py-8">
        <input
          value={liveValue}
          onChange={e => onChange('live', e.target.value)}
          disabled={disabledLive}
          placeholder="https://"
          className={`w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] text-slate-600 outline-none focus:border-[#FF6B00] transition-all ${disabledLive ? 'opacity-30' : ''}`}
        />
      </td>
    </tr>
  );
}
