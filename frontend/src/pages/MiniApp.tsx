import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, History, Loader2, WalletCards } from 'lucide-react';
import { client } from '@/lib/api';
import { getStoredToken, setStoredToken } from '@/lib/auth';

type Balance = {
  balance: number;
  available_balance: number;
  pending_balance: number;
  currency: string;
  is_frozen?: boolean;
};

type LedgerItem = {
  id: number;
  transaction_type: string;
  amount: number;
  currency: string;
  status?: string;
  note?: string;
  created_at?: string;
};

declare global {
  interface Window {
    Telegram?: { WebApp?: { initData?: string; ready?: () => void; expand?: () => void } };
  }
}

const money = (amount: number, currency = 'PHP') =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency }).format(amount || 0);

export default function MiniApp() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<LedgerItem[]>([]);
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [currency, setCurrency] = useState('PHP');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const telegram = window.Telegram?.WebApp;
  const hasInitData = Boolean(telegram?.initData);

  const loadWallet = async () => {
    const [balanceResponse, transactionsResponse] = await Promise.all([
      client.get(`/api/v1/wallet/balance?currency=${currency}`),
      client.get(`/api/v1/wallet/transactions?currency=${currency}&limit=10`),
    ]);
    if (!balanceResponse.ok || !transactionsResponse.ok) {
      throw new Error('Unable to load your wallet');
    }
    setBalance(balanceResponse.data);
    setTransactions(transactionsResponse.data?.items || []);
  };

  useEffect(() => {
    telegram?.ready?.();
    telegram?.expand?.();
    const authenticate = async () => {
      try {
        if (!hasInitData) throw new Error('Open this page from your Telegram bot');
        if (!getStoredToken()) {
          const response = await client.post('/api/v1/mini-app/auth', { init_data: telegram?.initData });
          if (!response.ok || !response.data?.token) throw new Error(response.data?.detail || 'Telegram authentication failed');
          setStoredToken(response.data.token);
        }
        await loadWallet();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to open wallet');
      } finally {
        setLoading(false);
      }
    };
    void authenticate();
  }, [currency]);

  const submitTopup = async () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a positive amount');
      return;
    }
    setError('');
    setMessage('');
    const response = await client.post('/api/v1/topup/swiftpay', { amount: parsedAmount, currency });
    if (!response.ok) {
      setError(response.data?.detail || 'Unable to create payment');
      return;
    }
    setAmount('');
    if (response.data.redirect_url) window.location.href = response.data.redirect_url;
    else setMessage('Payment created. Follow the payment instructions sent by the provider.');
  };

  const submitWithdrawal = async () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a positive amount');
      return;
    }
    setError('');
    if (!bankCode.trim() || !accountNumber.trim() || !firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError('Enter the bank code, account details, recipient name, and Philippine mobile number');
      return;
    }
    const response = await client.post('/api/v1/mini-app/withdraw', {
      amount: parsedAmount,
      currency,
      bank_code: bankCode.trim(),
      account_number: accountNumber.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      recipient_phone: phone.trim(),
      note: 'Telegram Mini App withdrawal',
    });
    setMessage(response.ok ? 'Withdrawal submitted for approval.' : response.data?.detail || 'Withdrawal could not be submitted');
    if (response.ok) await loadWallet();
  };

  const available = useMemo(() => balance?.available_balance ?? balance?.balance ?? 0, [balance]);

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white"><Loader2 className="animate-spin" /></main>;
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-md space-y-4">
        <header><p className="text-sm text-slate-400">SwiftPay Wallet</p><h1 className="text-2xl font-bold">Your money, in Telegram</h1></header>
        {error && <p className="rounded-lg bg-red-500/15 p-3 text-sm text-red-200">{error}</p>}
        {message && <p className="rounded-lg bg-emerald-500/15 p-3 text-sm text-emerald-200">{message}</p>}
        <section className="rounded-2xl bg-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400"><span>Available balance</span><WalletCards size={20} /></div>
          <p className="mt-2 text-3xl font-bold">{money(available, currency)}</p>
          <p className="mt-1 text-xs text-slate-400">Pending: {money(balance?.pending_balance || 0, currency)}</p>
          <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="mt-4 rounded-lg bg-slate-700 px-3 py-2 text-sm">
            <option value="PHP">PHP</option><option value="CNY">CNY</option><option value="KRW">KRW</option><option value="USDT">USDT</option>
          </select>
        </section>
        <section className="rounded-2xl bg-slate-800 p-5">
          <label className="text-sm text-slate-300">Amount</label>
          <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="0.00" className="mt-2 w-full rounded-lg bg-slate-700 px-3 py-3 outline-none ring-blue-500 focus:ring-2" />
          <label className="mt-3 block text-sm text-slate-300">Destination account</label>
          <input value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} placeholder="Bank or mobile account number" className="mt-2 w-full rounded-lg bg-slate-700 px-3 py-3 outline-none ring-blue-500 focus:ring-2" />
          <label className="mt-3 block text-sm text-slate-300">SwiftPay bank code</label>
          <input value={bankCode} onChange={(event) => setBankCode(event.target.value)} placeholder="e.g. BPI" className="mt-2 w-full rounded-lg bg-slate-700 px-3 py-3 outline-none ring-blue-500 focus:ring-2" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" className="w-full rounded-lg bg-slate-700 px-3 py-3 outline-none ring-blue-500 focus:ring-2" />
            <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" className="w-full rounded-lg bg-slate-700 px-3 py-3 outline-none ring-blue-500 focus:ring-2" />
          </div>
          <label className="mt-3 block text-sm text-slate-300">Recipient mobile (+63)</label>
          <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="+639171234567" className="mt-2 w-full rounded-lg bg-slate-700 px-3 py-3 outline-none ring-blue-500 focus:ring-2" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button onClick={() => void submitTopup()} className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-3 font-medium"><ArrowDownToLine size={18} /> Add funds</button>
            <button onClick={() => void submitWithdrawal()} disabled={available <= 0} className="flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-3 py-3 font-medium disabled:opacity-50"><ArrowUpFromLine size={18} /> Withdraw</button>
          </div>
        </section>
        <section className="rounded-2xl bg-slate-800 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><History size={18} /> Recent activity</h2>
          {transactions.length === 0 ? <p className="text-sm text-slate-400">No transactions yet.</p> : transactions.map((item) => (
            <div key={item.id} className="flex justify-between border-t border-slate-700 py-3 text-sm">
              <span><span className="block capitalize">{item.transaction_type.replace('_', ' ')}</span><span className="text-xs text-slate-400">{item.note || item.status || ''}</span></span>
              <span className={item.amount >= 0 ? 'text-emerald-300' : 'text-red-300'}>{item.amount >= 0 ? '+' : ''}{money(item.amount, item.currency)}</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
