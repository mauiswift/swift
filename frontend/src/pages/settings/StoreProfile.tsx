import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Trash2, Save, Loader2, Link2, ExternalLink, Globe, ShoppingBag, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { client } from '@/lib/api';
import { toast } from 'sonner';

export default function StoreProfile() {
  const navigate = useNavigate();
  const { user, refetch } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [shopName, setShopName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [shopUrl, setShopUrl] = useState('https://drl-itsolutions.atoms.world/');
  const [platform, setPlatform] = useState('Custom');
  const [dailyStats, setDailyStats] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await client.get('/api/v1/merchant/api-config');
      if (res.data) {
        setShopName(res.data.store_name || user?.organization_name || '');
        setLogoUrl(res.data.store_logo_url || '');
        setSlug(res.data.permanent_link_slug || '');
      }
    } catch (err) {
      console.error('Failed to fetch store profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await client.patch('/api/v1/merchant/api-config', {
        store_name: shopName,
        store_logo_url: logoUrl,
        permanent_link_slug: slug,
      });
      if (res.ok) {
        toast.success('Store profile updated');
        await refetch();
      } else {
        const errorMsg = res.data?.detail || res.data?.message || 'Failed to update store profile';
        toast.error(errorMsg);
        console.error('Save failed:', res.data);
      }
    } catch (err) {
      toast.error('An error occurred. Check your network or the logo URL length.');
      console.error('Save exception:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    setSaving(true);
    try {
      const res = await client.post('/api/v1/merchant/api-config/upload-logo', formData);
      if (res.ok && res.data?.logo_url) {
        setLogoUrl(res.data.logo_url);
        toast.success('Logo uploaded successfully');
        await refetch();
      } else {
        toast.error(res.data?.detail || 'Failed to upload logo');
      }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const publicPayUrl = slug ? `${window.location.origin}/pay/${slug}` : '';

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
          <span className="text-slate-600 font-semibold">Store profile</span>
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
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">Store profile</h1>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#FF6B00] text-white px-8 py-2.5 rounded-lg text-[14px] font-semibold shadow-lg shadow-[#FF6B00]/20 hover:bg-[#E66000] transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-start">
          {/* Main Card */}
          <div className="space-y-10">
            <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm">
              <p className="text-[14px] text-slate-500 mb-10 max-w-xl font-medium">
                Personalize your online store with a unique shop name, custom URL, and the platform that best suits your business needs.
              </p>

              <div className="space-y-8 max-w-xl">
                <div>
                  <label className="text-[14px] font-semibold text-slate-900 block mb-3">Shop name</label>
                  <input
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[14px] font-semibold text-slate-900 block mb-3">Shop URL</label>
                  <input
                    value={shopUrl}
                    onChange={(e) => setShopUrl(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[14px] font-semibold text-slate-900 block mb-3">Platform</label>
                  <div className="relative">
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all appearance-none cursor-pointer"
                    >
                      <option>Custom</option>
                      <option>Shopify</option>
                      <option>WooCommerce</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-slate-50 mt-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setDailyStats(!dailyStats)}
                    className={`relative inline-block w-10 h-5.5 rounded-full transition-all duration-300 ${dailyStats ? 'bg-[#FF6B00]' : 'bg-slate-200'}`}
                  >
                    <span className={`absolute top-0.5 ${dailyStats ? 'left-5' : 'left-0.5'} w-4.5 h-4.5 rounded-full bg-white transition-all shadow-sm`} />
                  </button>
                  <span className="text-[13px] font-semibold text-slate-700">Receive daily stats email</span>
                </div>
              </div>
            </div>

            {/* Permanent Payment Link Section */}
            <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6B00]">
                  <Link2 size={20} />
                </div>
                <h3 className="text-[18px] font-semibold text-slate-900 m-0">Permanent Payment Link</h3>
              </div>

              <p className="text-[14px] text-slate-500 mb-10 max-w-xl font-medium">
                Create a permanent URL for your store where customers can pay you any amount at any time.
              </p>

              <div className="space-y-8 max-w-xl">
                <div>
                  <label className="text-[14px] font-semibold text-slate-900 block mb-3">Store Slug</label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[14px] font-medium shrink-0">swiftpay.ph/pay/</span>
                    <input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="my-store"
                      className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
                    />
                  </div>
                </div>

                {publicPayUrl && (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                    <div className="truncate">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Public Payment URL</p>
                      <p className="text-[13px] font-mono text-slate-600 truncate">{publicPayUrl}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { navigator.clipboard.writeText(publicPayUrl); toast.success('URL Copied'); }}
                        className="p-2 text-slate-400 hover:text-[#FF6B00] transition-colors"
                      >
                        <Copy size={18} />
                      </button>
                      <a
                        href={`/pay/${slug}`}
                        target="_blank"
                        rel="noopener"
                        className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                      >
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Logo Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm sticky top-24">
            <p className="text-[12px] font-semibold text-slate-500 mb-8 uppercase tracking-widest">Store logo</p>

            <div className="space-y-8">
              <div className="border border-slate-100 rounded-2xl p-8 bg-slate-50 relative group shadow-sm flex flex-col items-center justify-center min-h-[240px]">
                {logoUrl ? (
                  <>
                    <div className="w-full aspect-square flex items-center justify-center bg-white rounded-xl shadow-inner overflow-hidden">
                       <img src={logoUrl} alt="Store logo" className="max-w-[140px] max-h-[140px] object-contain" />
                    </div>
                    <div className="mt-8 w-full flex items-center justify-between gap-4">
                       <span className="text-[12px] text-slate-400 truncate font-medium max-w-[160px]">{logoUrl.split('/').pop()}</span>
                       <button
                        onClick={() => setLogoUrl('')}
                        className="p-2.5 text-slate-400 hover:text-rose-500 transition-all border border-white bg-white rounded-xl shadow-sm hover:shadow-md"
                       >
                          <Trash2 size={18} />
                       </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag size={32} className="text-slate-200" />
                    </div>
                    <p className="text-[13px] font-semibold text-slate-400">No logo uploaded</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[14px] font-semibold text-slate-900 block mb-3">Upload Logo</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex-1 cursor-pointer bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-500 hover:border-[#FF6B00] transition-all flex items-center gap-2"
                  >
                    <ShoppingBag size={18} />
                    {saving ? 'Uploading...' : 'Choose image...'}
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[14px] font-semibold text-slate-900 block mb-3">Logo URL (Alternative)</label>
                <input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-2">Recommended: Square image, transparent background.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ChevronDown({ className, size }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
