import { useState, type FormEvent } from 'react';
import { ArrowRight, BadgeCheck, KeyRound, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { DEMO_ACCOUNTS, type DemoAccount } from './demoData';

export default function DemoLogin({ onLogin }: { onLogin: (account: DemoAccount) => void }) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const autofillAccount = (account: DemoAccount) => {
    setSelectedAccountId(account.id);
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const account = DEMO_ACCOUNTS.find((candidate) => candidate.email === email.trim().toLowerCase()
      && candidate.password === password);
    if (!account) {
      setError('Those credentials do not match a demo account. Choose a role below to autofill.');
      return;
    }
    onLogin(account);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07120f] px-4 py-10 text-white">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0c1915] shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden min-h-[690px] flex-col justify-between overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.18),transparent_38%),linear-gradient(145deg,#0c1c17,#09130f)] p-12 lg:flex">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-emerald-300/10" />
          <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full border border-emerald-300/10" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-[#07120f]">
                <span className="text-xl font-black">S</span>
              </div>
              <div>
                <p className="font-bold tracking-tight">SwiftPay</p>
                <p className="text-xs text-emerald-200/60">ADMIN BACKOFFICE</p>
              </div>
            </div>
            <div className="mt-24 max-w-lg">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/5 px-3 py-1.5 text-xs font-medium text-emerald-200">
                <Sparkles size={14} /> Philippines payments operations
              </p>
              <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight">Your payment operations, in focus.</h1>
              <p className="mt-5 max-w-md text-base leading-7 text-slate-400">
                A guided preview of the SwiftPay enterprise control room for merchants, transactions, and platform health.
              </p>
            </div>
          </div>
          <div className="relative grid grid-cols-2 gap-3">
            {[
              [ShieldCheck, 'HMAC-signed webhooks', 'Tamper-evident event delivery'],
              [KeyRound, 'Role-based access', 'Four operational permission tiers'],
              [LockKeyhole, 'Secure by design', 'Protected production authentication'],
              [BadgeCheck, 'Audit-ready activity', 'Clear status and event history'],
            ].map(([Icon, title, subtitle]) => {
              const FeatureIcon = Icon as typeof ShieldCheck;
              return (
                <div key={title as string} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                  <FeatureIcon className="h-4 w-4 text-emerald-300" />
                  <p className="mt-3 text-sm font-semibold">{title as string}</p>
                  <p className="mt-1 text-xs text-slate-500">{subtitle as string}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <p className="text-lg font-bold">SwiftPay <span className="text-emerald-300">Backoffice</span></p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Demo environment</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Sign in to your workspace</h2>
              <p className="mt-2 text-sm text-slate-400">Choose a role to autofill its demo credentials.</p>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => autofillAccount(account)}
                  className={`rounded-xl border px-3 py-3 text-left transition ${selectedAccountId === account.id ? 'border-emerald-300/50 bg-emerald-300/10 text-white' : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20'}`}
                >
                  <span className="block text-xs font-semibold">{account.role}</span>
                  <span className="mt-1 block truncate text-[10px] text-slate-500">{account.email}</span>
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-300">Work email</span>
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => { setEmail(event.target.value); setError(''); }}
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#08120f] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/10"
                  placeholder="name@company.com"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-300">Password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); setError(''); }}
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#08120f] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/10"
                  placeholder="Enter demo password"
                />
              </label>
              {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
              <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-bold text-[#06110d] transition hover:bg-emerald-300">
                Enter demo workspace <ArrowRight size={16} />
              </button>
            </form>

            <p className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/[0.05] p-3 text-xs leading-5 text-amber-100/70">
              Demo only: this login is simulated in your browser. It does not authenticate against or grant access to production SwiftPay.
            </p>
            <p className="mt-4 text-center text-[11px] text-slate-600">Illustrative data · no real payments are processed</p>
          </div>
        </section>
      </div>
    </main>
  );
}
