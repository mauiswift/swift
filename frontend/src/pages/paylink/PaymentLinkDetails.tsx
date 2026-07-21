import { useEffect, useState, CSSProperties } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy } from 'lucide-react';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import SettingsBanner from '@/components/settings/SettingsBanner';

interface PaymentLink {
  id: number;
  amount: number;
  title?: string;
  external_id?: string;
  status: string;
  description?: string;
  order_no?: string;
  customer_name?: string;
  created_at?: string;
  expires_at?: string;
}

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: '#2563eb', bg: '#eff6ff', label: 'Active' },
  inactive: { color: '#6b7280', bg: '#f3f4f6', label: 'Inactive' },
  paid: { color: '#0d9488', bg: '#f0fdfa', label: 'Paid' },
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function PaymentLinkDetails() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const query = encodeURIComponent(JSON.stringify({ transaction_type: 'payment_link', external_id: code }));
        const data = await apiFetch(`/api/v1/entities/transactions?query=${query}&limit=1`);
        setLink(data?.items?.[0] || null);
      } catch {
        setLink(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  const linkUrl = `https://swiftpay.site/checkout/${code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(linkUrl).catch(() => {});
    toast.success('Link copied!');
  };

  const deactivate = async () => {
    if (!link) return;
    try {
      await apiFetch(`/api/v1/entities/transactions/${link.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'inactive' }),
      });
      setLink({ ...link, status: 'inactive' });
      toast.success('Link deactivated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to deactivate');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-10 text-center text-sm text-muted-foreground">Loading...</div>
      </Layout>
    );
  }

  if (!link) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-10 text-center text-sm text-muted-foreground">Payment link not found.</div>
      </Layout>
    );
  }

  const st = STATUS_STYLES[link.status] || STATUS_STYLES.inactive;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <SettingsBanner />

        <p className="text-sm text-muted-foreground mb-2">
          <span className="cursor-pointer text-slate-600" onClick={() => navigate('/pay-by-link')}>Payment links</span> {'>'} <span>Link details</span>
        </p>

        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('/pay-by-link')}
            className="w-8 h-8 rounded-md border border-slate-200 bg-white flex items-center justify-center"
          >
            ‹
          </button>
          <h1 className="text-lg font-bold text-foreground m-0">Payment link</h1>
        </div>

        <div className="flex items-center gap-4 mt-2 mb-2">
          <span className="text-3xl font-bold text-foreground">₱{link.amount.toFixed(2)}</span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold rounded-full px-3 py-1" style={{ color: st.color, background: st.bg }}>
            <span className="w-2 h-2 rounded-full" style={{ background: st.color }} />
            {st.label}
          </span>
        </div>
        <p className="text-sm text-slate-600 mb-6">{link.title || '—'}</p>

        <h2 className="text-sm font-semibold text-foreground mb-3">Details</h2>
        <div className="border-b border-slate-200 mb-5" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Code</p>
            <p className="text-sm font-semibold text-foreground">{link.external_id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Created on</p>
            <p className="text-sm font-semibold text-foreground">{formatDate(link.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Valid until</p>
            <p className="text-sm font-semibold text-foreground">{formatDate(link.expires_at)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm font-semibold text-foreground">{link.description || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Order number</p>
            <p className="text-sm font-semibold text-foreground">{link.order_no || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Payor</p>
            <p className="text-sm font-semibold text-foreground">{link.customer_name || '-'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 border border-slate-200 rounded-lg p-3 mb-4 max-w-[620px]">
          <span className="text-sm text-amber-600 truncate">{linkUrl}</span>
          <Copy size={14} color="#9ca3af" className="cursor-pointer flex-shrink-0" onClick={copyLink} />
        </div>

        <div className="flex gap-3 mb-8">
          <button onClick={copyLink} className="flex items-center gap-2 border border-slate-200 bg-white text-foreground rounded-lg px-3 py-2 text-sm font-semibold">
            <Copy size={14} /> Copy link
          </button>
          <button
            onClick={deactivate}
            disabled={link.status === 'inactive'}
            className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-semibold ${link.status === 'inactive' ? 'border-slate-200 text-slate-300' : 'border-slate-200 text-foreground bg-white'}`}
          >
            Deactivate link
          </button>
        </div>

        <h2 className="text-sm font-semibold text-foreground mb-3">Payment history</h2>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-[2fr_1.4fr_1.4fr_1fr] p-3 text-xs font-semibold text-muted-foreground uppercase">
            <span>Payment</span>
            <span>Reference no</span>
            <span>Date</span>
            <span>Payment status</span>
          </div>
          <div className="grid grid-cols-[2fr_1.4fr_1.4fr_1fr] items-center p-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
                <span className="text-sm">⚡</span>
              </div>
              <span className="text-sm font-semibold text-foreground">₱{link.amount.toFixed(2)}</span>
            </div>
            <span className="text-sm text-slate-700 flex items-center gap-2">{link.external_id}</span>
            <div>
              <p className="text-sm text-slate-700 m-0">Created on {formatDate(link.created_at)}</p>
              <p className="text-sm text-muted-foreground m-0">Executed on -</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold" style={{ color: link.status === 'paid' ? '#0d9488' : '#2563eb', background: link.status === 'paid' ? '#f0fdfa' : '#eff6ff' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: link.status === 'paid' ? '#0d9488' : '#2563eb' }} />
              {link.status === 'paid' ? 'Paid' : 'Pending'}
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
