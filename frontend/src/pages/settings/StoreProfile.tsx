import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Trash2, Save, Loader2, Link2, ExternalLink, ShoppingBag, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import { buildPermanentPaymentLink } from '@/lib/permanentLink';
import { client } from '@/lib/api';
import { walletApi } from '@/api/wallet';
import { toast } from 'sonner';
import { copyTextToClipboard } from '@/lib/clipboard';

type StoreProfileUpdate = {
  store_name?: string;
  store_logo_url?: string;
  permanent_link_slug?: string;
  store_slug?: string;
  collection_currency?: string;
};

export default function StoreProfile() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const canManageProfile = Boolean(
    isSuperAdmin || user?.permissions?.can_manage_payments || user?.permissions?.can_manage_team,
  );
  const { collectionCurrency: sharedCollectionCurrency, enabledCurrencies, setCollectionCurrency: setSharedCollectionCurrency } = useCollectionCurrency();
  const publicPayPrefix = typeof window !== 'undefined' ? `${window.location.host}/pay/` : 'swiftpay.site/pay/';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [shopName, setShopName] = useState('');
  const [savedShopName, setSavedShopName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [savedLogoUrl, setSavedLogoUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [savedSlug, setSavedSlug] = useState('');
  const [storeSlug, setStoreSlug] = useState('3');
  const [collectionCurrency, setCollectionCurrency] = useState(sharedCollectionCurrency || 'PHP');
  const [savedCollectionCurrency, setSavedCollectionCurrency] = useState(sharedCollectionCurrency || 'PHP');
  const [permanentLinks, setPermanentLinks] = useState<Array<{ currency: string; url: string }>>([]);

  useEffect(() => {
    setCollectionCurrency(sharedCollectionCurrency || 'PHP');
    setSavedCollectionCurrency(sharedCollectionCurrency || 'PHP');
  }, [sharedCollectionCurrency]);

  useEffect(() => {
    if (['KRW', 'PHP', 'CNY'].includes(collectionCurrency)) {
      setStoreSlug('3');
    }
  }, [collectionCurrency]);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await client.get('/api/v1/merchant/api-config');
      if (res.data) {
        const nextCurrency = String(res.data.collection_currency || sharedCollectionCurrency || 'PHP').toUpperCase();
        setShopName(res.data.store_name || user?.organization_name || '');
        setSavedShopName(res.data.store_name || user?.organization_name || '');
        setLogoUrl(res.data.store_logo_url || '');
        setSavedLogoUrl(res.data.store_logo_url || '');
        setSlug(res.data.permanent_link_slug || '');
        setSavedSlug(res.data.permanent_link_slug || '');
        setStoreSlug(res.data.store_slug || '3');
        setCollectionCurrency(nextCurrency);
        setSavedCollectionCurrency(nextCurrency);
        setSharedCollectionCurrency(nextCurrency);
      }
    } catch (err) {
      console.error('Failed to fetch store profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user, setSharedCollectionCurrency, sharedCollectionCurrency]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    client.get('/api/v1/payments/open-amount-links')
      .then((res) => {
        if (res.ok && Array.isArray(res.data?.links)) {
          setPermanentLinks(res.data.links);
        }
      })
      .catch((err) => console.error('Failed to fetch permanent payment links:', err));
  }, []);

  const saveSettings = async (updates: StoreProfileUpdate, successMessage: string) => {
    if (!canManageProfile) return;
    setSaving(true);
    try {
      const res = await client.patch('/api/v1/merchant/api-config', updates);
      if (res.ok) {
        if ('store_name' in updates) setSavedShopName(updates.store_name || '');
        if ('permanent_link_slug' in updates) setSavedSlug(updates.permanent_link_slug || '');
        if ('store_logo_url' in updates) setSavedLogoUrl(updates.store_logo_url || '');
        if ('collection_currency' in updates) {
          const savedCurrency = String(res.data?.collection_currency || updates.collection_currency || 'PHP').toUpperCase();
          setCollectionCurrency(savedCurrency);
          setSavedCollectionCurrency(savedCurrency);
          setSharedCollectionCurrency(savedCurrency);
        }
        toast.success(successMessage);
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

  const handleSave = () => saveSettings({
    store_name: shopName,
    store_logo_url: logoUrl,
    permanent_link_slug: slug,
    store_slug: storeSlug,
    collection_currency: collectionCurrency,
  }, 'Store profile updated');

  const saveStoreSettings = () => saveSettings({
    store_name: shopName,
    store_slug: storeSlug,
    collection_currency: collectionCurrency,
  }, 'Store settings updated');

  const savePermanentLink = () => saveSettings({ permanent_link_slug: slug }, 'Permanent payment link updated');

  const saveLogoUrl = () => saveSettings({ store_logo_url: logoUrl }, 'Store logo updated');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canManageProfile) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    setSaving(true);
    try {
      const res = await client.post('/api/v1/merchant/api-config/upload-logo', formData);
      if (res.ok && res.data?.logo_url) {
        setLogoUrl(res.data.logo_url);
        setSavedLogoUrl(res.data.logo_url);
        toast.success('Logo uploaded successfully');
      } else {
        toast.error(res.data?.detail || 'Failed to upload logo');
      }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const publicLinkSlug = slug;
  const publicPayUrl = publicLinkSlug
    ? buildPermanentPaymentLink(window.location.origin, publicLinkSlug, savedCollectionCurrency)
    : '';

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
      <div className="page-enter mx-auto w-full max-w-6xl pb-20">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-8 font-medium">
          <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={() => navigate('/settings')}>Settings</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-semibold">Store profile</span>
        </div>

        {/* Title */}
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <button
              onClick={() => navigate('/settings')}
              type="button"
              aria-label="Back to settings"
              title="Back to settings"
              className="app-touch-target rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Store profile</h1>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !canManageProfile}
            data-guide-target="store-profile-save"
            className="app-touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-6 text-sm font-semibold text-white shadow-lg shadow-[#FF6B00]/20 transition-all hover:bg-[#E66000] disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>

        {!canManageProfile && (
          <p role="note" className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            You have read-only access to this shared store profile. Ask an organization manager to make changes.
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-start">
          {/* Main Card */}
          <div className="space-y-10">
            <div className="app-panel p-5 sm:p-8">
              <p className="mb-8 max-w-2xl text-sm leading-relaxed text-slate-500">
                Manage the shared merchant name, collection currency, permanent payment link, and store logo.
              </p>

              <div className="max-w-2xl space-y-6">
                <div>
                  <label className="text-[14px] font-semibold text-slate-900 block mb-3">Shop name</label>
                  <input
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    disabled={!canManageProfile}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
                  />
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <label className="text-[14px] font-semibold text-slate-900 block mb-2">Collection currency</label>
                  <p className="text-[12px] text-slate-500 mb-3">This currency is used for new store collections.</p>
                  <div className="relative">
                    <select
                      value={collectionCurrency}
                      onChange={(e) => setCollectionCurrency(e.target.value)}
                      disabled={!canManageProfile}
                      className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all appearance-none cursor-pointer"
                    >
                      {enabledCurrencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                    </select>
                    <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>
                <div className="flex justify-end border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={saveStoreSettings}
                    disabled={saving || !canManageProfile || (shopName === savedShopName && collectionCurrency === savedCollectionCurrency)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-4 text-sm font-semibold text-white hover:bg-[#E66000] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save store settings
                  </button>
                </div>
              </div>
            </div>

            {/* Permanent Payment Link Section */}
            <div className="app-panel p-5 sm:p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6B00]">
                  <Link2 size={20} />
                </div>
                <h3 className="text-[18px] font-semibold text-slate-900 m-0">Permanent Payment Link</h3>
              </div>

              <p className="mb-8 max-w-2xl text-sm leading-relaxed text-slate-500">
                Create an open-amount payment link for your store. Customers can enter the amount they want to pay at checkout.
              </p>

              <div className="space-y-8 max-w-xl">
                <div>
                  <label className="text-[14px] font-semibold text-slate-900 block mb-3">Store Slug</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="shrink-0 text-[14px] font-medium text-slate-400">{publicPayPrefix}</span>
                    <input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="my-store"
                      disabled={!canManageProfile}
                      className="min-w-0 flex-1 basis-40 bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
                    />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={savePermanentLink}
                      disabled={saving || !canManageProfile || slug === savedSlug}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-4 text-sm font-semibold text-white hover:bg-[#E66000] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                      Save link
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {(permanentLinks.length ? permanentLinks : (publicPayUrl ? [{ currency: savedCollectionCurrency, url: publicPayUrl }] : [])).map((link) => (
                    <div key={link.currency} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-1">
                          {link.currency} permanent link
                        </p>
                        <p className="truncate font-mono text-[13px] text-slate-700">{link.url}</p>
                        <p className="mt-2 text-[11px] text-slate-600">Dedicated to this user · Customer enters the amount</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                        <button
                          type="button"
                          aria-label={`Copy ${link.currency} permanent payment link`}
                          title={`Copy ${link.currency} permanent payment link`}
                          onClick={async () => {
                            const copied = await copyTextToClipboard(link.url);
                            if (copied) toast.success(`${link.currency} URL copied`);
                            else toast.error('Unable to copy URL');
                          }}
                          className="p-2 text-slate-500 hover:text-[#FF6B00] transition-colors"
                        >
                          <Copy size={18} />
                        </button>
                        <a href={link.url} target="_blank" rel="noopener" className="p-2 text-slate-500 hover:text-blue-500 transition-colors">
                          <ExternalLink size={18} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Logo Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-10 lg:sticky lg:top-24">
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
                        disabled={!canManageProfile || saving}
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
                    disabled={!canManageProfile || saving}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className={`flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[14px] text-slate-500 transition-all flex items-center gap-2 ${canManageProfile && !saving ? 'cursor-pointer hover:border-[#FF6B00]' : 'cursor-not-allowed opacity-50'}`}
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
                  disabled={!canManageProfile}
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-2">Recommended: Square image, transparent background.</p>
                <button
                  type="button"
                  onClick={saveLogoUrl}
                  disabled={saving || !canManageProfile || logoUrl === savedLogoUrl}
                  className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-4 text-sm font-semibold text-white hover:bg-[#E66000] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Save logo URL
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ChevronDownIcon({ className, size }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
