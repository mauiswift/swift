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

  const linkUrl = `https://link.live.swiftpay.ph/${code}`;

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
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading...</div>
      </Layout>
    );
  }

  if (!link) {
    return (
      <Layout>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Payment link not found.</div>
      </Layout>
    );
  }

  const st = STATUS_STYLES[link.status] || STATUS_STYLES.inactive;

  return (
    <Layout>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <SettingsBanner />

        <p style={{ fontSize: 12, color: '#8a8a8a', marginBottom: 8 }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/pay-by-link')}>Payment links</span> {'>'} <span>Link details</span>
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <button
            onClick={() => navigate('/pay-by-link')}
            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            ‹
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>Payment link</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 2px' }}>
          <span style={{ fontSize: 34, fontWeight: 700, color: '#111' }}>₱{link.amount.toFixed(2)}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: st.color, background: st.bg, borderRadius: 999, padding: '3px 10px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color }} />
            {st.label}
          </span>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px' }}>{link.title || '—'}</p>

        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 12px' }}>Details</h2>
        <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: 20 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div>
            <p style={fieldLabel}>Code</p>
            <p style={fieldValue}>{link.external_id}</p>
          </div>
          <div>
            <p style={fieldLabel}>Created on</p>
            <p style={fieldValue}>{formatDate(link.created_at)}</p>
          </div>
          <div>
            <p style={fieldLabel}>Valid until</p>
            <p style={fieldValue}>{formatDate(link.expires_at)}</p>
          </div>
          <div>
            <p style={fieldLabel}>Description</p>
            <p style={fieldValue}>{link.description || '-'}</p>
          </div>
          <div>
            <p style={fieldLabel}>Order number</p>
            <p style={fieldValue}>{link.order_no || '-'}</p>
          </div>
          <div>
            <p style={fieldLabel}>Payor</p>
            <p style={fieldValue}>{link.customer_name || '-'}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 14px', marginBottom: 14, maxWidth: 620 }}>
          <span style={{ fontSize: 13, color: '#c2530f', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{linkUrl}</span>
          <Copy size={14} color="#9ca3af" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={copyLink} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
          <button onClick={copyLink} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #d1d5db', background: '#fff', color: '#111', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Copy size={14} /> Copy link
          </button>
          <button
            onClick={deactivate}
            disabled={link.status === 'inactive'}
            style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #d1d5db', background: '#fff', color: link.status === 'inactive' ? '#d1d5db' : '#111', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: link.status === 'inactive' ? 'default' : 'pointer' }}
          >
            Deactivate link
          </button>
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 12px' }}>Payment history</h2>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1.4fr 1fr', padding: '10px 20px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            <span>Payment</span>
            <span>Reference no</span>
            <span>Date</span>
            <span>Payment status</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1.4fr 1fr', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14 }}>⚡</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>₱{link.amount.toFixed(2)}</span>
            </div>
            <span style={{ fontSize: 12.5, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>{link.external_id}</span>
            <div>
              <p style={{ fontSize: 12.5, color: '#374151', margin: 0 }}>Created on {formatDate(link.created_at)}</p>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Executed on -</p>
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: link.status === 'paid' ? '#0d9488' : '#2563eb', background: link.status === 'paid' ? '#f0fdfa' : '#eff6ff', borderRadius: 999, padding: '3px 10px', width: 'fit-content', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: link.status === 'paid' ? '#0d9488' : '#2563eb' }} />
              {link.status === 'paid' ? 'Paid' : 'Pending'}
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const fieldLabel: CSSProperties = { fontSize: 11.5, color: '#9ca3af', margin: '0 0 4px' };
const fieldValue: CSSProperties = { fontSize: 13.5, fontWeight: 600, color: '#111', margin: 0 };
