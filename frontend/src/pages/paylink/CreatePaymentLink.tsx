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
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <SettingsBanner />
        <SettingsHeader crumb="Create payment link" title="Create payment link" />

        <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-[430px]">
          <p className="text-sm text-slate-700 mb-5">
            Enter transaction details to create a new payment link with the information you provided.
          </p>

          <label className={labelClass}>Amount</label>
          <div className="flex items-center border border-slate-200 rounded-lg mb-4">
            <span className="px-3 py-2 text-sm text-slate-500">₱</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              className="border-none outline-none px-3 py-2 text-sm flex-1"
            />
          </div>

          <label className={`${labelClass} text-[#c2530f]`}>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputClass} mb-4`} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={`${labelClass} text-[#c2530f]`}>Valid until</label>
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>
                Payor <span className="text-[#9ca3af] font-normal">(optional)</span>
              </label>
              <input value={payor} onChange={(e) => setPayor(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className={labelClass}>
                Order no <span className="text-[#9ca3af] font-normal">(optional)</span>
              </label>
              <input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>
                Description <span className="text-[#9ca3af] font-normal">(optional)</span>
              </label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={saving}
            className="bg-slate-900 text-white rounded-lg px-5 py-2 text-sm font-semibold"
          >
            {saving ? 'Generating...' : 'Generate link'}
          </button>
        </div>
      </div>
    </Layout>
  );
}

const labelClass = "text-sm font-semibold text-slate-900 block mb-1";
const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm box-border";
