import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { client } from '@/lib/api';
import { createPaymentLink } from '@/lib/paymentLinks';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';

const DEFAULT_TAX_NUMBER = '330-460-536-00000';
export default function CreateInvoice() {
  const navigate = useNavigate();
  const { collectionCurrency } = useCollectionCurrency();
  const [currency, setCurrency] = useState(collectionCurrency || 'PHP');
  const [invoiceNumber, setInvoiceNumber] = useState(() => `INV-${Date.now().toString().slice(-8)}`);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [taxNumber, setTaxNumber] = useState(DEFAULT_TAX_NUMBER);
  const [itemDescription, setItemDescription] = useState('');
  const [subtotal, setSubtotal] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setCurrency(collectionCurrency || 'PHP');
  }, [collectionCurrency]);

  const numericSubtotal = Number(subtotal.replace(/[^0-9.]/g, '')) || 0;
  const numericTaxRate = Number(taxRate) || 0;
  const taxAmount = numericSubtotal * numericTaxRate / 100;
  const total = numericSubtotal + taxAmount;

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (numericSubtotal <= 0) {
      toast.error('Enter a valid subtotal');
      return;
    }
    if (!itemDescription.trim()) {
      toast.error('Enter an invoice item or description');
      return;
    }

    setCreating(true);
    const normalizedCurrency = currency.toUpperCase();
    const referenceNo = invoiceNumber.trim() || `INV-${Date.now().toString().slice(-8)}`;
    const description = itemDescription.trim();

    try {
      const response = await client.post('/api/v1/payments/create', {
        amount: total,
        description,
        currency: normalizedCurrency,
        transaction_type: 'invoice',
        metadata: {
          external_id: referenceNo,
          currency: normalizedCurrency,
          customer_name: customerName.trim() || undefined,
          customer_email: customerEmail.trim() || undefined,
          manual_verification: normalizedCurrency !== 'KRW',
          invoice_number: referenceNo,
          tax_number: taxNumber.trim(),
          tax_amount: taxAmount,
          source: 'invoice',
          subtotal: numericSubtotal,
          tax_rate: numericTaxRate,
        },
      });

      const data = response.data as any;
      if (!response.ok || !data?.success) {
        throw new Error(data?.detail || data?.message || 'Unable to create invoice payment link');
      }

      const payload = data.data ?? data;
      const redirectUrl = payload.payment_url || payload.checkout_url || data.payment_url || data.redirect_url || `${window.location.origin}/checkout/${referenceNo}`;
      if (!redirectUrl) throw new Error('No payment link was returned');

      const rawBankAccount = payload.raw?.bank_account || data.raw?.bank_account || {};
      const bankAccount = payload.bank_account || data.bank_account || (
        rawBankAccount.bank_name || rawBankAccount.account_number || rawBankAccount.account_name
          ? {
              bank_name: rawBankAccount.bank_name,
              number: rawBankAccount.number || rawBankAccount.account_number,
              account_name: rawBankAccount.account_name || rawBankAccount.name,
              swift_code: rawBankAccount.swift_code,
            }
          : null
      );

      const link = createPaymentLink({
        amount: total,
        currency: normalizedCurrency,
        title: `Invoice ${referenceNo}`,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payor: customerName,
        orderNo: referenceNo,
        description: `${description} | Tax no: ${taxNumber.trim() || DEFAULT_TAX_NUMBER}`,
        paymentUrl: redirectUrl,
        bankAccountDetails: bankAccount ? {
          bank_name: bankAccount.bank_name || '',
          number: bankAccount.number || '',
          account_name: bankAccount.account_name || '',
          swift_code: bankAccount.swift_code,
        } : undefined,
      });
      toast.success('Invoice payment link generated');
      navigate(`/pay-by-link/details/${link.code}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create invoice payment link');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout>
      <div className="page-enter max-w-[760px]">
        <div className="flex items-center gap-4 mb-8">
          <button type="button" onClick={() => navigate('/pay-by-link')} className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
            <ChevronLeft size={20} />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FF6B00]">Invoice</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">Create invoice payment link</h1>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
            <FileText className="text-[#FF6B00]" size={22} />
            <p className="text-sm text-slate-500">Create an invoice link in any supported collection currency.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="text-[13px] font-semibold text-slate-900">Currency
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-2 w-full border border-slate-200 rounded-lg px-4 py-2.5 font-normal outline-none focus:border-[#FF6B00]">
                <option value="PHP">PHP</option><option value="KRW">KRW</option><option value="CNY">CNY</option>
              </select>
            </label>
            <label className="text-[13px] font-semibold text-slate-900">Invoice number
              <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="mt-2 w-full border border-slate-200 rounded-lg px-4 py-2.5 font-normal outline-none focus:border-[#FF6B00]" />
            </label>
          </div>

          <label className="block text-[13px] font-semibold text-slate-900">Item or description
            <input required value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} placeholder="What is this invoice for?" className="mt-2 w-full border border-slate-200 rounded-lg px-4 py-2.5 font-normal outline-none focus:border-[#FF6B00]" />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <label className="text-[13px] font-semibold text-slate-900">Subtotal
              <input required inputMode="decimal" value={subtotal} onChange={(e) => setSubtotal(e.target.value)} placeholder="0.00" className="mt-2 w-full border border-slate-200 rounded-lg px-4 py-2.5 font-normal outline-none focus:border-[#FF6B00]" />
            </label>
            <label className="text-[13px] font-semibold text-slate-900">Tax rate (%)
              <input type="number" min="0" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="mt-2 w-full border border-slate-200 rounded-lg px-4 py-2.5 font-normal outline-none focus:border-[#FF6B00]" />
            </label>
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-600">Total
              <strong className="block text-lg text-slate-900">{currency} {total.toFixed(2)}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="text-[13px] font-semibold text-slate-900">Customer name
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-2 w-full border border-slate-200 rounded-lg px-4 py-2.5 font-normal outline-none focus:border-[#FF6B00]" />
            </label>
            <label className="text-[13px] font-semibold text-slate-900">Customer email
              <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="mt-2 w-full border border-slate-200 rounded-lg px-4 py-2.5 font-normal outline-none focus:border-[#FF6B00]" />
            </label>
          </div>

          <label className="block text-[13px] font-semibold text-slate-900">Tax number
            <input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} className="mt-2 w-full border border-slate-200 rounded-lg px-4 py-2.5 font-normal outline-none focus:border-[#FF6B00]" />
          </label>

          <button type="submit" disabled={creating} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#111111] text-white py-3 text-sm font-semibold hover:bg-black disabled:opacity-60">
            {creating ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
            {creating ? 'Generating...' : 'Generate invoice payment link'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
