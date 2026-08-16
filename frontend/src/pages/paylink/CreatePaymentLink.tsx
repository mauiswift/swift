import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import { createPaymentLink } from '@/lib/paymentLinks';
import { client } from '@/lib/api';

export default function CreatePaymentLink() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [payor, setPayor] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    const numericAmount = Number(amount.replace(/[^0-9.]/g, ''));

    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title.');
      return;
    }

    setError('');

    try {
      const reference_no = orderNo?.trim() || `PLNK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const body = {
        amount: numericAmount,
        reference_no,
        description: description.trim() || title.trim(),
        customer_name: payor.trim() || undefined,
        customer_email: undefined,
        currency: 'PHP',
        details: {
          title: title.trim(),
        },
      };

      const response = await client.post('/api/v1/swiftpay/create-order', body);
      const data = response.data as any;

      if (!response.ok || !data?.success) {
        const message = data?.detail || data?.message || 'Failed to create payment link.';
        setError(message);
        return;
      }

      const redirectUrl = data.redirect_url || data.raw?.customerRedirectUrl || data.raw?.customer_redirect_url || '';
      if (!redirectUrl) {
        setError('SwiftPay did not return a valid payment URL.');
        return;
      }

      // Route payment links to the payment-channel selector instead of the raw provider checkout URL.
      const channelSelectionUrl = `${window.location.origin}/checkout/${reference_no}`;

      const link = createPaymentLink({
        amount: numericAmount,
        title: title.trim(),
        validUntil,
        payor,
        orderNo,
        description,
        paymentUrl: channelSelectionUrl,
      });

      navigate(`/pay-by-link/details/${link.code}`);
    } catch (err) {
      setError('Unable to create payment link. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="page-enter">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-6">
          <span className="cursor-pointer hover:text-slate-600" onClick={() => navigate('/pay-by-link')}>Payment links</span>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-600 font-semibold">Create payment link</span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate('/pay-by-link')}
            className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">Create payment link</h1>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm max-w-[640px]">
          <p className="text-[13px] text-slate-500 mb-10 leading-relaxed">
            Enter transaction details to create a new payment link with the information you provided.
          </p>

          <div className="space-y-6">
            <div>
              <label className="text-[13px] font-semibold text-slate-900 block mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400 font-medium">₱</span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-slate-900 block mb-2">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[13px] font-semibold text-slate-900 block mb-2">Valid until</label>
                <div className="relative">
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-900 block mb-2">Payor <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  value={payor}
                  onChange={(e) => setPayor(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[13px] font-semibold text-slate-900 block mb-2">Order no <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-900 block mb-2">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
                />
              </div>
            </div>

            {error ? (
              <p className="text-sm text-rose-600 mb-2">{error}</p>
            ) : null}

            <div className="pt-8">
              <button
                type="button"
                onClick={handleGenerate}
                className="bg-[#111111] text-white px-8 py-3 rounded-lg font-semibold text-[13px] shadow-sm hover:bg-black transition-colors"
              >
                Generate link
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
