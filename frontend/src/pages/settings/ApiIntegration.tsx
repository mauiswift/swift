import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Copy, HelpCircle, ChevronDown, Save, Loader2, RefreshCw, Trash2, BookOpen, Download, ExternalLink, KeyRound, ShieldCheck } from 'lucide-react';
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

type EditableApiConfig = Pick<ApiConfig,
  | 'test_callback_url'
  | 'test_status_page_mode'
  | 'test_external_status_url'
  | 'test_success_url'
  | 'test_cancel_url'
  | 'test_failure_url'
  | 'live_callback_url'
  | 'live_status_page_mode'
  | 'live_external_status_url'
  | 'live_success_url'
  | 'live_cancel_url'
  | 'live_failure_url'
>;

const EDITABLE_FIELDS: (keyof EditableApiConfig)[] = [
  'test_callback_url',
  'test_status_page_mode',
  'test_external_status_url',
  'test_success_url',
  'test_cancel_url',
  'test_failure_url',
  'live_callback_url',
  'live_status_page_mode',
  'live_external_status_url',
  'live_success_url',
  'live_cancel_url',
  'live_failure_url',
];

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
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
    const urlFields = EDITABLE_FIELDS.filter((field) => field.endsWith('_url'));
    for (const field of urlFields) {
      const value = String(config[field] || '').trim();
      if (value && !isValidUrl(value)) {
        toast.error(`${field.replace(/^(test|live)_/, '').replaceAll('_', ' ')} must be a valid HTTP or HTTPS URL`);
        return;
      }
    }
    for (const mode of ['test', 'live'] as const) {
      const statusMode = config[`${mode}_status_page_mode` as keyof ApiConfig];
      const externalUrl = String(config[`${mode}_external_status_url` as keyof ApiConfig] || '').trim();
      if (statusMode === 'external' && !externalUrl) {
        toast.error(`${mode === 'test' ? 'Test' : 'Live'} external status page URL is required`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = EDITABLE_FIELDS.reduce<Partial<EditableApiConfig>>((result, field) => {
        result[field] = config[field];
        return result;
      }, {});
      const res = await client.patch('/api/v1/merchant/api-config', payload);
      if (res.ok) {
        toast.success('Configuration saved successfully');
      } else {
        toast.error(res.data?.detail || 'Failed to save configuration');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred while saving');
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
      } else {
        throw new Error(res.data?.detail || 'The server did not return a secret key');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate secret key');
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
      } else {
        throw new Error(res.data?.detail || 'Failed to reset secret key');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset secret key');
    } finally {
      setGenerating(null);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) {
      toast.error('Nothing to copy');
      return;
    }
    void navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Unable to copy to clipboard'));
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
      <div className="page-enter mx-auto w-full max-w-7xl pb-20">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-8 font-medium">
          <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={() => navigate('/settings')}>Settings</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-semibold">API & Integration</span>
        </div>

        {/* Title */}
        <div className="mb-8 flex flex-col gap-5 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-blue-50/60 p-5 shadow-sm sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/settings')}
              type="button"
              aria-label="Back to settings"
              title="Back to settings"
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">
                <KeyRound size={14} />
                Developer workspace
              </div>
              <h1 className="m-0 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">API & Integration</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage credentials, callbacks, and checkout behavior for your test and live environments.
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-5 text-[14px] font-semibold text-white shadow-lg shadow-[#FF6B00]/20 transition-all hover:bg-[#E66000] disabled:opacity-50 lg:shrink-0"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <ShieldCheck size={19} />
              </div>
              <div>
                <h2 className="m-0 text-sm font-semibold text-slate-900">Secure integration settings</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Keep secrets private and use test mode before switching traffic to live.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">Test mode</span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">Live mode</span>
            </div>
          </div>
          <div className="p-5 sm:p-8">

          <section className="mb-8 rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50/80 to-amber-50/40 p-5 sm:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-[#FF6B00] shadow-sm">
                  <BookOpen size={19} />
                </div>
                <div>
                  <h2 className="m-0 text-[15px] font-semibold text-slate-900">Developer resources</h2>
                  <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-slate-600">
                    Read the complete payment integration guide or download the API contract and ready-to-import Postman collection.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href="/api-docs" target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#FF6B00] px-3 text-[12px] font-semibold text-white no-underline hover:bg-[#E66000]">
                  <ExternalLink size={14} /> Open API docs
                </a>
                <a href="/downloads/swiftpay-api-guide.md" download className="inline-flex h-9 items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 text-[12px] font-semibold text-orange-700 no-underline hover:bg-orange-100">
                  <Download size={14} /> Full guide
                </a>
                <a href="/downloads/swiftpay-openapi.json" download className="inline-flex h-9 items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 text-[12px] font-semibold text-orange-700 no-underline hover:bg-orange-100">
                  <Download size={14} /> OpenAPI JSON
                </a>
                <a href="/downloads/swiftpay-postman.json" download className="inline-flex h-9 items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 text-[12px] font-semibold text-orange-700 no-underline hover:bg-orange-100">
                  <Download size={14} /> Postman
                </a>
              </div>
            </div>
          </section>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full min-w-[900px] border-collapse text-left">
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
                      <button type="button" aria-label="Copy test access key" title="Copy test access key" onClick={() => copyToClipboard(config?.test_access_key || '')} className="rounded-md bg-white p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
                        <Copy size={16} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-8">
                    <div className="flex items-center gap-3 justify-center">
                      <span className="text-[12px] font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded border border-slate-100">
                        {config?.live_access_key}
                      </span>
                      <button type="button" aria-label="Copy live access key" title="Copy live access key" onClick={() => copyToClipboard(config?.live_access_key || '')} className="rounded-md bg-white p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
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
                          <button type="button" onClick={() => generateSecret('test')} disabled={!!generating} title="Regenerate test secret" aria-label="Regenerate test secret" className="rounded-md bg-white p-1 text-slate-500 hover:bg-orange-50 hover:text-[#FF6B00] transition-colors">
                            <RefreshCw size={16} className={generating === 'test' ? 'animate-spin' : ''} />
                          </button>
                          {isSuperAdmin && (
                            <button type="button" onClick={() => resetSecret('test')} disabled={!!generating} title="Reset test secret" aria-label="Reset test secret" className="rounded-md bg-white p-1 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors">
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
                          <button type="button" onClick={() => generateSecret('live')} disabled={!!generating} title="Regenerate live secret" aria-label="Regenerate live secret" className="rounded-md bg-white p-1 text-slate-500 hover:bg-orange-50 hover:text-[#FF6B00] transition-colors">
                            <RefreshCw size={16} className={generating === 'live' ? 'animate-spin' : ''} />
                          </button>
                          {isSuperAdmin && (
                            <button type="button" onClick={() => resetSecret('live')} disabled={!!generating} title="Reset live secret" aria-label="Reset live secret" className="rounded-md bg-white p-1 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors">
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
