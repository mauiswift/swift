import { useEffect, useState, CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, ExternalLink, Search, ChevronDown, Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import SettingsBanner from '@/components/settings/SettingsBanner';

interface PaymentLinkItem {
  id: number;
  amount: number;
  title?: string;
  external_id?: string;
  status: string;
  created_at?: string;
}

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  active: { color: '#2563eb', label: 'Active' },
  inactive: { color: '#6b7280', label: 'Inactive' },
  paid: { color: '#0d9488', label: 'Paid' },
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function PaymentLinksList() {
  const navigate = useNavigate();
  const [links, setLinks] = useState<PaymentLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const query = encodeURIComponent(JSON.stringify({ transaction_type: 'payment_link' }));
        const data = await apiFetch(`/api/v1/entities/transactions?query=${query}&sort=-id&limit=200`);
        setLinks(data?.items || []);
      } catch {
        setLinks([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = links.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (l.title || '').toLowerCase().includes(q) || (l.external_id || '').toLowerCase().includes(q);
  });

  const copyPermalink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    toast.success('Link copied!');
  };

  const copyLink = (code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(`https://swiftpay.site/checkout/${code}`).catch(() => {});
    toast.success('Link copied!');
  };

  const deactivate = async (item: PaymentLinkItem) => {
    try {
      await apiFetch(`/api/v1/entities/transactions/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'inactive' }),
      });
      setLinks((prev) => prev.map((l) => (l.id === item.id ? { ...l, status: 'inactive' } : l)));
    } catch (err: any) {
      toast.error(err.message || 'Failed to deactivate');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <SettingsBanner />

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg md:text-xl font-bold text-foreground m-0">Payment links</h1>
          <div className="flex gap-3">
            <button onClick={copyPermalink} className="flex items-center gap-2 border border-slate-200 bg-white text-foreground rounded-lg px-3 py-2 text-sm font-semibold">
              <Copy size={14} /> Copy permalink
            </button>
            <button onClick={() => navigate('/pay-by-link/new')} className="flex items-center gap-2 bg-slate-900 text-white rounded-lg px-3 py-2 text-sm font-semibold">
              <Plus size={14} /> New
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600">Range: Last 7 days <ChevronDown size={13} /></button>
            <button className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600">Status: All <ChevronDown size={13} /></button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="border border-slate-200 rounded-lg px-3 py-2 pl-9 text-sm w-56"
            />
          </div>
        </div>

        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="grid grid-cols-[2fr_1.4fr_1fr_1.4fr] p-3 text-xs font-semibold text-muted-foreground uppercase">
            <span>Link</span>
            <span>Created on</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No payment links yet.</div>
          ) : (
            filtered.map((l) => {
              const st = STATUS_STYLES[l.status] || STATUS_STYLES.inactive;
              return (
                <div
                  key={l.id}
                  onClick={() => navigate(`/pay-by-link/details/${l.external_id}`)}
                  className="grid grid-cols-[2fr_1.4fr_1fr_1.4fr] items-center p-4 border-t border-slate-100 cursor-pointer hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <ExternalLink size={14} color="#6b7280" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground m-0">₱{l.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground m-0">{l.title || '—'} • {l.external_id}</p>
                    </div>
                  </div>
                  <span className="text-sm text-slate-700">{formatDate(l.created_at)}</span>
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="w-2 h-2 rounded-full" style={{ background: st.color }} />
                    {st.label}
                  </span>
                  <span className="flex gap-4 justify-end" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => copyLink(l.external_id)}
                      className="text-sm text-slate-700 flex items-center gap-1"
                    >
                      <Copy size={13} /> Copy link
                    </button>
                    <button
                      onClick={() => deactivate(l)}
                      disabled={l.status === 'inactive'}
                      className={`text-sm ${l.status === 'inactive' ? 'text-slate-300' : 'text-slate-700'}`}
                    >
                      Deactivate
                    </button>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}

