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
      <div className="max-w-7xl mx-auto px-6">
        <SettingsBanner />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>Payment links</h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={copyPermalink}
              style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #d1d5db', background: '#fff', color: '#111', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <Copy size={14} /> Copy permalink
            </button>
            <button
              onClick={() => navigate('/pay-by-link/new')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <Plus size={14} /> New
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={filterBtnStyle}>
              Range: Last 7 days <ChevronDown size={13} />
            </button>
            <button style={filterBtnStyle}>
              Status: All <ChevronDown size={13} />
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#9ca3af' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '7px 12px 7px 30px', fontSize: 13, width: 220 }}
            />
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1fr 1.4fr', padding: '10px 20px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            <span>Link</span>
            <span>Created on</span>
            <span>Status</span>
            <span>Actions</span>
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
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1fr 1.4fr', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #f0f0f0', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ExternalLink size={14} color="#6b7280" />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: 0 }}>₱{l.amount.toFixed(2)}</p>
                      <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{l.title || '—'} • {l.external_id}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 12.5, color: '#374151' }}>{formatDate(l.created_at)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#374151' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color }} />
                    {st.label}
                  </span>
                  <span style={{ display: 'flex', gap: 16 }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => copyLink(l.external_id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#374151', fontSize: 12.5, cursor: 'pointer', padding: 0 }}
                    >
                      <Copy size={13} /> Copy link
                    </button>
                    <button
                      onClick={() => deactivate(l)}
                      disabled={l.status === 'inactive'}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: l.status === 'inactive' ? '#d1d5db' : '#374151', fontSize: 12.5, cursor: l.status === 'inactive' ? 'default' : 'pointer', padding: 0 }}
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
