import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Globe } from 'lucide-react';
import Layout from '@/components/Layout';
import { createPaymentLink } from '@/lib/paymentLinks';
import { client } from '@/lib/api';
import { toast } from 'sonner';

export default function CreateInternationalLink() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [productName, setProductName] = useState('');
  const [currency, setCurrency] = useState('PHP');
  const [payor, setPayor] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    const numericAmount = Number(amount.replace(/[^0-9.]/g, ''));

    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (!productName.trim()) {
      setError('Please enter a product name.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const reference_id = orderNo?.trim() || `MAG-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

      const payload = {
        amount: numericAmount,
        currency,
        product_name: productName.trim(),
        reference_id,
        customer_name: payor.trim() || undefined,
        payment_method_types: ["alipay", "wechat_pay"]
      };

      const response = await client.post('/api/v1/magpie/qr/checkout/session', payload);

      if (!response.ok || !response.data?.success) {
        console.error('International link creation failed:', response);
        const data = response.data;
        let errorMessage = 'Failed to create international payment link.';

        if (typeof data === 'object' && data !== null) {
          errorMessage = data.error || data.message || data.detail || errorMessage;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }

        setError(errorMessage);
        return;
      }

      const channelSelectionUrl = response.data.checkout_url;

      // We reuse the existing paymentLinks library to store local history of the link
      const link = createPaymentLink({
        amount: numericAmount,
        title: productName.trim(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payor,
        orderNo: reference_id,
        description: `International Payment (${currency})`,
        paymentUrl: channelSelectionUrl,
      });

      toast.success('International payment link generated');
      navigate(`/pay-by-link/details/${link.code}`);
    } catch (err) {
      setError('Unable to create payment link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="page-enter">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-6 font-medium">
          <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={() => navigate('/pay-by-link')}>Payment links</span>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-600 font-semibold">International</span>
        </div>

        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate('/pay-by-link')}
            className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Globe size={22} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">Create International Payment Link</h1>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm max-w-[640px]">
          <p className="text-[13px] text-slate-500 mb-10 leading-relaxed font-medium">
            Generate a branded checkout link for international customers using <strong>Alipay</strong> and <strong>WeChat Pay</strong>.
          </p>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[13px] font-semibold text-slate-900 block mb-2">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-900 block mb-2">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-blue-500 transition-all appearance-none"
                >
                  <option value="PHP">PHP (Philippine Peso)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="CNY">CNY (Chinese Yuan)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-slate-900 block mb-2">Product / Service Name</label>
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Consulting Fee"
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[13px] font-semibold text-slate-900 block mb-2">Reference / Order No</label>
                <input
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  placeholder="Optional"
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-900 block mb-2">Customer Name</label>
                <input
                  value={payor}
                  onChange={(e) => setPayor(e.target.value)}
                  placeholder="Optional"
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-4 items-center">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center p-1.5 shadow-sm">
                  <img src="/logos/alipay.svg" alt="Alipay" />
                </div>
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center p-1.5 shadow-sm">
                  <img src="/logos/wechat.svg" alt="WeChat" />
                </div>
              </div>
              <p className="text-[12px] text-slate-500 font-medium">
                Customer will be able to choose between Alipay and WeChat Pay at checkout.
              </p>
            </div>

            {error ? (
              <p className="text-sm text-rose-600 mb-2 font-medium">{error}</p>
            ) : null}

            <div className="pt-8">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="bg-[#111111] text-white px-10 py-3.5 rounded-xl font-semibold text-[14px] shadow-lg hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Generating...' : 'Generate International Link'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
