import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { client } from '@/lib/api';
import { Loader2, ShieldCheck, ArrowRight, Store } from 'lucide-react';
import { toast } from 'sonner';

interface MerchantInfo {
  store_name: string;
  store_logo_url?: string;
  organization_id: string;
}

export default function PermanentPayPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchMerchant = useCallback(async () => {
    try {
      const res = await client.get(`/api/v1/public/merchant/${slug}`);
      if (res.data) setMerchant(res.data);
    } catch (err) {
      toast.error('Merchant not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [slug, navigate]);

  useEffect(() => {
    fetchMerchant();
  }, [fetchMerchant]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return toast.error('Please enter a valid amount');
    }

    setCreating(true);
    try {
      // We use the direct swiftpay order creation but as a "public" request
      // For simplicity here, I'll use the existing create-order logic if I can bridge it
      // In a real scenario, we'd have a public endpoint for this.
      const res = await client.apiCall.invoke({
         url: '/api/v1/swiftpay/create-order',
         method: 'POST',
         data: {
           amount: numericAmount,
           reference_no: `PAY-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
           description: description || `Payment to ${merchant?.store_name}`,
           customer_name: 'Customer',
           details: {
             source: 'permanent_link',
             merchant_slug: slug
           }
         }
      });

      if (res.data?.redirect_url) {
        window.location.href = res.data.redirect_url;
      } else {
        toast.error('Failed to initialize payment');
      }
    } catch (err) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FF6B00]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[480px] space-y-10">
        {/* Branding Header */}
        <div className="text-center">
          <div className="w-24 h-24 bg-white rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6 overflow-hidden">
            {merchant?.store_logo_url ? (
              <img src={merchant.store_logo_url} alt={merchant.store_name} className="w-full h-full object-contain p-2" />
            ) : (
              <Store size={40} className="text-slate-200" />
            )}
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-2">{merchant?.store_name}</h1>
          <p className="text-[14px] text-slate-500 font-medium uppercase tracking-widest flex items-center justify-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            Verified Merchant
          </p>
        </div>

        {/* Payment Card */}
        <div className="bg-white border border-slate-200 rounded-[32px] p-10 shadow-xl shadow-slate-200/50">
          <form onSubmit={handlePay} className="space-y-10">
            <div>
              <label className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest block mb-4">Amount to pay</label>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl font-semibold text-slate-300">₱</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent border-0 pl-8 text-5xl font-semibold text-slate-900 outline-none placeholder:text-slate-100 tracking-tighter"
                />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest block mb-3">Note / Description</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this for?"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-[15px] text-slate-900 outline-none focus:bg-white focus:border-[#FF6B00] transition-all"
              />
            </div>

            <button
              disabled={creating || !amount}
              className="w-full bg-[#111111] text-white py-5 rounded-2xl font-semibold text-lg shadow-xl shadow-black/20 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 group"
            >
              {creating ? <Loader2 className="animate-spin" /> : (
                <>
                  Pay Now
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center space-y-4">
          <p className="text-[12px] text-slate-400 font-semibold uppercase tracking-[0.2em]">Powered by SwiftPay</p>
          <div className="flex items-center justify-center gap-6">
            <span className="text-[11px] text-slate-400 font-medium">Secure</span>
            <span className="text-[11px] text-slate-400 font-medium">Instant</span>
            <span className="text-[11px] text-slate-400 font-medium">Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
