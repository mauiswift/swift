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
    navigator.clipboard.writeText(`https://link.live.swiftpay.ph/${code}`).catch(() => {});
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
      <div className="max-w-7xl mx-auto pb-16 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 px-6">
        <SettingsBanner />

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground m-0">Payment links</h1>
          <div className="flex items-center gap-4">
            <button onClick={copyPermalink} className="inline-flex items-center gap-2 border border-slate-200 bg-white text-foreground rounded-md px-3 py-2 text-sm font-semibold">
              <Copy size={14} /> Copy permalink
            </button>
            <button onClick={() => navigate('/pay-by-link/new')} className="inline-flex items-center gap-2 bg-foreground text-white rounded-md px-3 py-2 text-sm font-semibold">
              <Plus size={14} /> New
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 border border-slate-200 bg-white text-foreground rounded-md px-3 py-2 text-sm" onClick={() => {}}>
              Range: Last 7 days <ChevronDown size={13} />
            </button>
            <button className="inline-flex items-center gap-2 border border-slate-200 bg-white text-foreground rounded-md px-3 py-2 text-sm" onClick={() => {}}>
              Status: All <ChevronDown size={13} />
            </button>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="border border-slate-200 rounded-md px-8 py-2 text-sm w-56" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="grid" style={{ gridTemplateColumns: '2fr 1.4fr 1fr 1.4fr' }}>
            <div className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Link</div>
            <div className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created on</div>
            <div className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</div>
            <div className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</div>
          </div>

          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>No payment links yet.</div>
          ) : (
            filtered.map((l) => {
              const st = STATUS_STYLES[l.status] || STATUS_STYLES.inactive;
              return (
                <div
                  key={l.id}
                  onClick={() => navigate(`/pay-by-link/details/${l.external_id}`)}
                  className="grid items-center cursor-pointer border-t border-slate-100"
                  style={{ gridTemplateColumns: '2fr 1.4fr 1fr 1.4fr', padding: '14px 20px' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <ExternalLink size={14} color="#6b7280" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground m-0">₱{l.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground m-0">{l.title || '—'} • {l.external_id}</p>
                    </div>
                  </div>
                  <span className="text-sm text-slate-700">{formatDate(l.created_at)}</span>
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color }} />
                    {st.label}
                  </span>
                  <span className="flex items-center gap-6" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => copyLink(l.external_id)} className="inline-flex items-center gap-2 text-sm text-slate-700 p-0">
                      <Copy size={13} /> Copy link
                    </button>
                    <button onClick={() => deactivate(l)} disabled={l.status === 'inactive'} className={`inline-flex items-center gap-2 text-sm p-0 ${l.status === 'inactive' ? 'text-slate-300' : 'text-slate-700'}`}>
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

const filterBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  border: '1px solid #d1d5db',
  background: '#fff',
  color: '#374151',
  borderRadius: 8,
  padding: '7px 12px',
  fontSize: 12.5,
  cursor: 'pointer',
};
