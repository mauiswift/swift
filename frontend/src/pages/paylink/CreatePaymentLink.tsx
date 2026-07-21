import { useState, CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import SettingsBanner from '@/components/settings/SettingsBanner';
import SettingsHeader from '@/components/settings/SettingsHeader';

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

function defaultValidUntil() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
}

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'E';
  for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function CreatePaymentLink() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [validUntil, setValidUntil] = useState(defaultValidUntil());
  const [payor, setPayor] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const code = generateCode();
      const created = await apiFetch('/api/v1/entities/transactions', {
        method: 'POST',
        body: JSON.stringify({
          transaction_type: 'payment_link',
          amount: Number(amount),
          status: 'active',
          title: title.trim(),
          external_id: code,
          expires_at: new Date(`${validUntil}T23:59:59`).toISOString(),
          created_at: new Date().toISOString(),
          customer_name: payor.trim() || undefined,
          order_no: orderNo.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });
      toast.success('Payment link created');
      navigate(`/pay-by-link/details/${created.external_id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate link');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <SettingsBanner />
        <SettingsHeader crumb="Create payment link" title="Create payment link" />

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, maxWidth: 430 }}>
          <p style={{ fontSize: 13, color: '#374151', margin: '0 0 20px' }}>
            Enter transaction details to create a new payment link with the information you provided.
          </p>

          <label style={labelStyle}>Amount</label>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 8, marginBottom: 18 }}>
            <span style={{ padding: '9px 0 9px 12px', fontSize: 13.5, color: '#6b7280' }}>₱</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              style={{ border: 'none', outline: 'none', padding: '9px 12px', fontSize: 13.5, flex: 1 }}
            />
          </div>

          <label style={{ ...labelStyle, color: '#c2530f' }}>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ ...inputStyle, marginBottom: 18 }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
            <div>
              <label style={{ ...labelStyle, color: '#c2530f' }}>Valid until</label>
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>
                Payor <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
              </label>
              <input value={payor} onChange={(e) => setPayor(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
            <div>
              <label style={labelStyle}>
                Order no <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
              </label>
              <input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>
                Description <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
              </label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={saving}
            style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
          >
            {saving ? 'Generating...' : 'Generate link'}
          </button>
        </div>
      </div>
    </Layout>
  );
}

const labelStyle: CSSProperties = { fontSize: 13, fontWeight: 600, color: '#111', display: 'block', marginBottom: 6 };
const inputStyle: CSSProperties = { width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '9px 12px', fontSize: 13.5, boxSizing: 'border-box' };
