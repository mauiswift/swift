import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Building2, Check, AlertCircle, Send } from 'lucide-react';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BankOption {
  code: string;
  name: string;
}

export default function SendSingleDisbursement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [balance, setBalance] = useState(0);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [amount, setAmount] = useState('');
  const [refNo, setRefNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNo, setAccountNo] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [banksRes, balRes] = await Promise.all([
        client.apiCall.invoke({ url: '/api/v1/swiftpay/institutions', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/balance?currency=PHP', method: 'GET', data: {} })
      ]);
      if (banksRes.data?.data) setBanks(banksRes.data.data);
      if (balRes.data?.balance != null) setBalance(balRes.data.balance);
    } catch (err) {
      console.error('Failed to fetch disbursement data:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!firstName.trim() || !lastName.trim()) return toast.error('First and last names are required');
    if (isNaN(amt) || amt <= 0) return toast.error('Enter a valid amount');
    if (!bankCode) return toast.error('Select a recipient bank');
    if (!accountNo.trim()) return toast.error('Account number is required');
    if (amt > balance) return toast.error('Insufficient balance');

    setLoading(true);
    try {
      const res = await client.apiCall.invoke({
        url: '/api/v1/swiftpay/disbursements/send',
        method: 'POST',
        data: {
          amount: amt,
          reference_no: refNo.trim() || `DISB-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          bank_code: bankCode,
          account_number: accountNo.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          middle_name: middleName.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          line1: line1.trim() || "N/A",
          city: city.trim() || "Manila",
          province: province.trim() || "Metro Manila",
          postal_code: postalCode.trim() || "1000",
          note: remarks.trim() || undefined,
        }
      });

      if (res.data?.success) {
        toast.success('Disbursement scheduled successfully');
        navigate('/disbursements');
      } else {
        toast.error(res.data?.message || res.data?.error || 'Failed to send disbursement');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="page-enter">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-8 font-medium">
          <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={() => navigate('/disbursements')}>Disbursements</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-semibold">Send single disbursement</span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-5 mb-12">
          <button
            onClick={() => navigate('/disbursements')}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">Send single disbursement</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16 items-start">
          {/* Main Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm">
            <p className="text-[14px] text-slate-500 mb-12 font-medium">
              Single disbursements are processed immediately and will appear directly in the History tab.
            </p>

            <div className="space-y-16 max-w-2xl">
              {/* Recipient Details */}
              <section>
                <h3 className="text-[16px] font-semibold text-slate-900 mb-8">Recipient Details</h3>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                      <label className="text-[14px] font-semibold text-slate-900 block mb-3">First name</label>
                      <input
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="John"
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[14px] font-semibold text-slate-900 block mb-3">Middle name <span className="text-slate-400 font-medium">(opt)</span></label>
                      <input
                        value={middleName}
                        onChange={e => setMiddleName(e.target.value)}
                        placeholder="Doe"
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[14px] font-semibold text-slate-900 block mb-3">Last name</label>
                      <input
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Smith"
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="text-[14px] font-semibold text-slate-900 block mb-3">Phone number <span className="text-slate-400 font-medium">(optional)</span></label>
                      <input
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="09123456789"
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[14px] font-semibold text-slate-900 block mb-3">Email address <span className="text-slate-400 font-medium">(optional)</span></label>
                      <input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="recipient@example.com"
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div>
                      <label className="text-[14px] font-semibold text-slate-900 block mb-3">Street Address</label>
                      <input
                        value={line1}
                        onChange={e => setLine1(e.target.value)}
                        placeholder="123 Example St."
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div>
                        <label className="text-[14px] font-semibold text-slate-900 block mb-3">City</label>
                        <input
                          value={city}
                          onChange={e => setCity(e.target.value)}
                          placeholder="Mandaluyong"
                          className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[14px] font-semibold text-slate-900 block mb-3">Province</label>
                        <input
                          value={province}
                          onChange={e => setProvince(e.target.value)}
                          placeholder="Metro Manila"
                          className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[14px] font-semibold text-slate-900 block mb-3">Postal Code</label>
                        <input
                          value={postalCode}
                          onChange={e => setPostalCode(e.target.value)}
                          placeholder="1550"
                          className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment Info */}
              <section>
                <h3 className="text-[16px] font-semibold text-slate-900 mb-8">Payment Info</h3>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="text-[14px] font-semibold text-slate-900 block mb-3">Amount</label>
                      <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-slate-400 font-semibold">₱</span>
                         <input
                           type="number"
                           value={amount}
                           onChange={e => setAmount(e.target.value)}
                           className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all font-semibold"
                         />
                      </div>
                    </div>
                    <div>
                      <label className="text-[14px] font-semibold text-slate-900 block mb-3">Reference number</label>
                      <input
                        value={refNo}
                        onChange={e => setRefNo(e.target.value)}
                        placeholder="Internal Ref"
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[14px] font-semibold text-slate-900 block mb-3">Remarks</label>
                    <input
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="e.g. Payment for invoice #123"
                      className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                    />
                  </div>
                </div>
              </section>

              {/* Recipient Bank Information */}
              <section>
                <h3 className="text-[16px] font-semibold text-slate-900 mb-8">Recipient Bank Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[14px] font-semibold text-slate-900 block mb-3">Select Bank</label>
                    <Select value={bankCode} onValueChange={setBankCode}>
                      <SelectTrigger className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 h-auto text-[14px]">
                        <SelectValue placeholder="Choose a bank..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 max-h-[300px]">
                        {banks.map(bank => (
                          <SelectItem key={bank.code} value={bank.code}>{bank.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[14px] font-semibold text-slate-900 block mb-3">Account number</label>
                    <input
                      value={accountNo}
                      onChange={e => setAccountNo(e.target.value)}
                      placeholder="Enter bank account number"
                      className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
                    />
                  </div>
                </div>
              </section>

              <div className="pt-8 border-t border-slate-100 flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-[#111111] text-white px-10 py-4 rounded-xl font-semibold text-[15px] shadow-lg hover:bg-black transition-all"
                >
                  {loading ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" size={18} />}
                  Send funds now
                </Button>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-10">
            <h3 className="text-[18px] font-semibold text-slate-900">Your account</h3>
            <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Building2 size={80} />
               </div>
               <p className="text-[12px] text-slate-500 mb-3 font-medium uppercase tracking-wider">Available Balance</p>
               <p className="text-4xl font-semibold text-slate-900 tracking-tighter">₱{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
               <div className="mt-8 pt-8 border-t border-slate-50">
                 <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
                   <Check size={14} />
                   Verified Node
                 </div>
               </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 space-y-4">
               <div className="flex items-center gap-3 text-blue-900 font-semibold">
                 <AlertCircle size={18} />
                 <span className="text-[14px]">Important Note</span>
               </div>
               <p className="text-[13px] text-blue-800 leading-relaxed">
                 Single disbursements are processed via the <strong>INSTAPAY</strong> network. Funds typically arrive within 10-15 minutes.
               </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
