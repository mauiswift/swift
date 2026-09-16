import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, History, Loader2, RefreshCw, WalletCards } from 'lucide-react';
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

type AdminOverview = {
  swiftpay_balance: { available: boolean; balance?: number; currency?: string; code?: string; error?: string };
  wallets: Array<{
    currency: string;
    wallet_count: number;
    balance: number;
    available_balance: number;
    pending_balance: number;
  }>;
  pending_disbursements: { count: number; amount: number };
  recent_disbursements: Array<{
    id: number;
    amount: number;
    currency: string;
    status: string;
    account: string;
    created_at?: string | null;
  }>;
};

type AdminRequests = {
  topups: Array<{ id: number; amount: number; currency: string; user_id: string; note: string }>;
  withdrawals: Array<{ id: number; amount: number; currency: string; account: string; status: string; user_id: string }>;
};

declare global {
  interface Window {
    Telegram?: { WebApp?: { initData?: string; ready?: () => void; expand?: () => void } };
  }
}

const money = (amount: number, currency = 'PHP') =>
  currency === 'USDT'
    ? `USDT ${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : new Intl.NumberFormat('en-PH', { style: 'currency', currency }).format(amount || 0);

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
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [requests, setRequests] = useState<AdminRequests>({ topups: [], withdrawals: [] });
  const [requestAction, setRequestAction] = useState<string | null>(null);

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

  const loadOverview = async () => {
    setOverviewLoading(true);
    try {
      const response = await client.get('/api/v1/mini-app/admin/overview');
      if (!response.ok) throw new Error(response.data?.detail || 'Unable to load admin overview');
      setOverview(response.data);
    } finally {
      setOverviewLoading(false);
    }
  };

  const loadRequests = async () => {
    const response = await client.get('/api/v1/mini-app/admin/requests');
    if (!response.ok) throw new Error(response.data?.detail || 'Unable to load approval requests');
    setRequests(response.data);
  };

  useEffect(() => {
    telegram?.ready?.();
    telegram?.expand?.();
    const authenticate = async () => {
      try {
        if (!hasInitData && !getStoredToken()) throw new Error('Open this page from your Telegram bot');
        if (hasInitData) {
          const response = await client.post('/api/v1/mini-app/auth', { init_data: telegram?.initData });
          if (!response.ok || !response.data?.token) throw new Error(response.data?.detail || 'Telegram authentication failed');
          setStoredToken(response.data.token);
        }
        await Promise.all([loadWallet(), loadOverview(), loadRequests()]);
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

  const approveRequest = async (type: 'topup' | 'withdrawal', id: number) => {
    const key = `${type}-${id}`;
    setRequestAction(key);
    setError('');
    try {
      const response = type === 'topup'
        ? await client.post(`/api/v1/topup/${id}/approve`, { note: 'Approved via super admin Mini App' })
        : await client.post(`/api/v1/entities/disbursements/${id}/approve`);
      if (!response.ok) throw new Error(response.data?.detail || 'Approval failed');
      setMessage(`${type === 'topup' ? 'Incoming funds' : 'Withdrawal'} approved.`);
      await Promise.all([loadWallet(), loadOverview(), loadRequests()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setRequestAction(null);
    }
  };

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#070b16] text-white" aria-label="Loading Mini App"><Loader2 className="h-8 w-8 animate-spin text-blue-400" aria-hidden="true" /></main>;
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#18284a_0%,#070b16_45%)] px-4 py-5 text-white sm:py-8">
      <div className="mx-auto max-w-lg space-y-4">
        <header className="flex items-end justify-between px-1">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">SwiftPay</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Super admin wallet</h1><p className="mt-1 text-sm text-slate-400">Private operations inside Telegram</p></div>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-300">Secure</span>
        </header>
        {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        {message && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p>}
        <section className="overflow-hidden rounded-3xl border border-blue-300/20 bg-gradient-to-br from-blue-600/30 via-slate-800/90 to-slate-900 p-5 shadow-2xl shadow-blue-950/30">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Live overview</p><h2 className="mt-1 text-lg font-semibold">Platform operations</h2></div>
            <button type="button" onClick={() => void loadOverview()} disabled={overviewLoading} aria-label="Refresh platform overview" className="motion-interactive rounded-xl border border-white/10 bg-white/10 p-2.5 text-blue-100 disabled:opacity-50"><RefreshCw size={18} className={overviewLoading ? 'animate-spin' : ''} /></button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/5 bg-slate-950/30 p-4"><p className="text-xs text-slate-400">Pending payouts</p><p className="mt-1 text-2xl font-bold">{overview?.pending_disbursements.count ?? 0}</p><p className="mt-1 text-[11px] text-slate-500">Awaiting completion</p></div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/30 p-4"><p className="text-xs text-slate-400">Pending PHP value</p><p className="mt-1 text-2xl font-bold">{money(overview?.pending_disbursements.amount ?? 0)}</p><p className="mt-1 text-[11px] text-slate-500">Across all accounts</p></div>
          </div>
          <div className="mt-4 space-y-2">
            {overview?.wallets.map((wallet) => <div key={wallet.currency} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5 text-sm"><span className="text-slate-300"><span className="font-semibold text-white">{wallet.currency}</span> · {wallet.wallet_count} wallets</span><span className="font-semibold">{money(wallet.balance, wallet.currency)}</span></div>)}
          </div>
          {overview?.recent_disbursements.length ? <div className="mt-4 border-t border-white/10 pt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Recent money out</p>{overview.recent_disbursements.slice(0, 4).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 border-b border-white/5 py-2 text-xs last:border-0"><span className="min-w-0 truncate text-slate-300">{item.currency} {money(item.amount, item.currency)} · {item.account}</span><span className="shrink-0 capitalize text-slate-400">{item.status}</span></div>)}</div> : <p className="mt-4 border-t border-white/10 pt-4 text-sm text-slate-500">No recent money-out activity.</p>}
        </section>
        <section className="rounded-3xl border border-amber-300/20 bg-amber-500/10 p-5">
          <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Approval queue</p><h2 className="mt-1 text-lg font-semibold">Accept money and approve payouts</h2></div>
          <div className="space-y-3">
            {requests.topups.map((item) => <div key={`topup-${item.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/20 p-3"><div className="min-w-0"><p className="font-semibold">{money(item.amount, item.currency)}</p><p className="truncate text-xs text-slate-400">Incoming funds · {item.user_id}</p></div><button type="button" onClick={() => void approveRequest('topup', item.id)} disabled={requestAction === `topup-${item.id}`} className="motion-interactive shrink-0 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">{requestAction === `topup-${item.id}` ? 'Approving…' : 'Approve funds'}</button></div>)}
            {requests.withdrawals.map((item) => <div key={`withdrawal-${item.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/20 p-3"><div className="min-w-0"><p className="font-semibold">{money(item.amount, item.currency)}</p><p className="truncate text-xs text-slate-400">Money out · {item.account}</p></div><button type="button" onClick={() => void approveRequest('withdrawal', item.id)} disabled={requestAction === `withdrawal-${item.id}`} className="motion-interactive shrink-0 rounded-xl bg-blue-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{requestAction === `withdrawal-${item.id}` ? 'Approving…' : 'Approve payout'}</button></div>)}
            {!requests.topups.length && !requests.withdrawals.length && <p className="text-sm text-slate-400">No pending approval requests.</p>}
          </div>
        </section>
        <section className="rounded-3xl border border-cyan-300/20 bg-cyan-500/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">SwiftPay provider balance</p>
          {overview?.swiftpay_balance.available ? (
            <p className="mt-2 text-3xl font-bold tracking-tight">{money(overview.swiftpay_balance.balance || 0, overview.swiftpay_balance.currency || 'PHP')}</p>
          ) : (
            <p role="status" className="mt-2 text-sm text-slate-300">
              {overview?.swiftpay_balance.code === 'provider_unauthorized'
                ? 'Live provider balance is unavailable for the configured SwiftPay account.'
                : overview?.swiftpay_balance.error || 'Provider balance unavailable'}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-400">Live balance returned by SwiftPay, separate from platform wallets.</p>
        </section>
        <section className="rounded-3xl border border-white/10 bg-slate-800/90 p-5 shadow-xl shadow-black/20">
          <div className="flex items-center justify-between text-slate-400"><span className="text-sm font-medium">Selected wallet</span><WalletCards size={20} className="text-blue-300" /></div>
          <p className="mt-2 text-4xl font-bold tracking-tight">{money(available, currency)}</p>
          <p className="mt-1 text-xs text-slate-400">Pending: {money(balance?.pending_balance || 0, currency)}</p>
          <label htmlFor="wallet-currency" className="sr-only">Wallet currency</label><select id="wallet-currency" value={currency} onChange={(event) => setCurrency(event.target.value)} className="motion-interactive mt-4 w-full rounded-xl border border-white/10 bg-slate-700/80 px-3 py-3 text-sm">
            <option value="PHP">PHP</option><option value="CNY">CNY</option><option value="KRW">KRW</option><option value="USDT">USDT</option>
          </select>
        </section>
        <section className="rounded-3xl border border-white/10 bg-slate-800/90 p-5">
          <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Money movement</p><h2 className="mt-1 text-lg font-semibold">Fund or withdraw</h2></div>
          <label htmlFor="mini-amount" className="text-sm text-slate-300">Amount</label>
          <input id="mini-amount" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="0.00" className="motion-interactive mt-2 w-full rounded-xl border border-white/10 bg-slate-700/80 px-3 py-3 outline-none ring-blue-500 focus:ring-2" />
          <label className="mt-3 block text-sm text-slate-300">Destination account</label>
          <input value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} placeholder="Bank or mobile account number" className="motion-interactive mt-2 w-full rounded-xl border border-white/10 bg-slate-700/80 px-3 py-3 outline-none ring-blue-500 focus:ring-2" />
          <label className="mt-3 block text-sm text-slate-300">SwiftPay bank code</label>
          <input value={bankCode} onChange={(event) => setBankCode(event.target.value)} placeholder="e.g. BPI" className="motion-interactive mt-2 w-full rounded-xl border border-white/10 bg-slate-700/80 px-3 py-3 outline-none ring-blue-500 focus:ring-2" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" className="motion-interactive w-full rounded-xl border border-white/10 bg-slate-700/80 px-3 py-3 outline-none ring-blue-500 focus:ring-2" />
            <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" className="motion-interactive w-full rounded-xl border border-white/10 bg-slate-700/80 px-3 py-3 outline-none ring-blue-500 focus:ring-2" />
          </div>
          <label className="mt-3 block text-sm text-slate-300">Recipient mobile (+63)</label>
          <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="+639171234567" className="motion-interactive mt-2 w-full rounded-xl border border-white/10 bg-slate-700/80 px-3 py-3 outline-none ring-blue-500 focus:ring-2" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => void submitTopup()} className="motion-interactive flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-3 font-semibold shadow-lg shadow-blue-950/30"><ArrowDownToLine size={18} /> Add funds</button>
            <button type="button" onClick={() => void submitWithdrawal()} disabled={available <= 0} className="motion-interactive flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-700 px-3 py-3 font-semibold disabled:opacity-50"><ArrowUpFromLine size={18} /> Withdraw</button>
          </div>
        </section>
        <section className="rounded-3xl border border-white/10 bg-slate-800/90 p-5">
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
