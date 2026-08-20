import { useState } from 'react';
import { ArrowRight, CheckCircle2, Globe2, MessageCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_NAME, SUPPORT_URL } from '@/lib/brand';
import AppFooter from '@/components/AppFooter';

type MarketId = 'philippines' | 'china' | 'international';

type Market = {
  id: MarketId;
  label: string;
  flag: string;
  currency: string;
  settlement: string;
  summary: string;
  methods: { name: string; type: string; rate: string }[];
};

const MARKETS: Market[] = [
  {
    id: 'philippines',
    label: 'Philippines',
    flag: 'PH',
    currency: 'PHP',
    settlement: 'PHP collections settle same-day in USDT',
    summary: 'Local wallets, bank rails, cards, QR payments, and over-the-counter collections.',
    methods: [
      { name: 'GCash, Maya, GrabPay, ShopeePay', type: 'Digital wallets', rate: '0.5%' },
      { name: 'QR PH and InstaPay bank transfers', type: 'QR and bank rails', rate: '0.5%' },
      { name: 'Visa, Mastercard, and local cards', type: 'Cards', rate: '0.5%' },
      { name: 'BPI, BDO, UBP, RCBC, and other banks', type: 'Direct debit', rate: '0.5%' },
      { name: '7-Eleven, ECPay, Cebuana, LBC, SM', type: 'Over the counter', rate: '0.5%' },
    ],
  },
  {
    id: 'china',
    label: 'China',
    flag: 'CN',
    currency: 'PHP / USDT',
    settlement: 'Converted to USDT at daily closing rate',
    summary: 'Accept payments from Chinese customers through the wallets they already use.',
    methods: [
      { name: 'Alipay', type: 'Digital wallet', rate: '0.5%' },
      { name: 'WeChat Pay', type: 'Digital wallet', rate: '0.5%' },
    ],
  },
  {
    id: 'international',
    label: 'International',
    flag: 'INT',
    currency: 'PHP / USDT',
    settlement: 'Settlement currency confirmed during onboarding',
    summary: 'Offer familiar international card and wallet options through one integration.',
    methods: [
      { name: 'Visa and Mastercard', type: 'International cards', rate: '0.5%' },
      { name: 'KakaoPay, NaverPay, Payco, TossPay', type: 'International wallets', rate: '0.5%' },
      { name: 'UnionPay, JCB, and other supported rails', type: 'Alternative cards', rate: 'Custom' },
    ],
  },
];

export default function CollectionRates() {
  const [activeMarket, setActiveMarket] = useState<MarketId>('philippines');
  const market = MARKETS.find(item => item.id === activeMarket) ?? MARKETS[0];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#040C18] text-white">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#040C18]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600">
              <Globe2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight text-white sm:text-lg">{APP_NAME}</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/features" className="text-sm text-slate-400 transition-colors hover:text-white">Features</Link>
            <Link to="/pricing" className="text-sm text-slate-400 transition-colors hover:text-white">Pricing</Link>
            <Link to="/collection-rates" className="text-sm font-medium text-white">Collection rates</Link>
          </nav>
          <Link to="/register" className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-500 sm:px-5">
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 pb-12 pt-16 text-center sm:px-6 sm:pt-20">
          <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-[700px] -translate-x-1/2 rounded-full bg-blue-700/10 blur-[120px]" />
          <div className="relative mx-auto max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-600/10 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Transparent collection pricing</span>
            </div>
            <h1 className="mb-4 text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">Collection rates by market</h1>
            <p className="mx-auto max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              See the published rate for every supported collection channel, with same-day settlement options built in.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="mb-8 grid grid-cols-1 gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-2 sm:grid-cols-3">
            {MARKETS.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveMarket(item.id)}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${activeMarket === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'}`}
                aria-pressed={activeMarket === item.id}
              >
                <span className="rounded-md border border-current/20 px-1.5 py-0.5 text-[10px] font-bold">{item.flag}</span>
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-3xl border border-blue-500/25 bg-gradient-to-br from-[#0D1F4A] to-[#0A1530] p-7 sm:p-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">{market.label}</p>
              <h2 className="mb-4 text-2xl font-semibold text-white">One rate per successful collection</h2>
              <p className="mb-8 text-sm leading-6 text-slate-300">{market.summary}</p>
              <div className="mb-7 border-b border-white/[0.1] pb-7">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Published collection rate</p>
                <p className="mt-2 text-5xl font-semibold text-white">0.5<span className="text-2xl text-blue-300">%</span></p>
                <p className="mt-2 text-xs text-slate-400">Exclusive of VAT. Volume pricing is available for Enterprise accounts.</p>
              </div>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> No monthly platform fee</div>
                <div className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> {market.currency} collection support</div>
                <div className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> {market.settlement}</div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02]">
              <div className="border-b border-white/[0.08] px-6 py-5 sm:px-8">
                <h2 className="text-lg font-semibold text-white">Supported collection methods</h2>
                <p className="mt-1 text-sm text-slate-400">Rates apply to successful transactions.</p>
              </div>
              <div>
                {market.methods.map((method, index) => (
                  <div key={method.name} className={`grid grid-cols-[1fr_auto] gap-4 px-6 py-5 sm:grid-cols-[1fr_150px_90px] sm:px-8 ${index % 2 === 1 ? 'bg-white/[0.02]' : ''}`}>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{method.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{method.type}</p>
                    </div>
                    <p className="hidden items-center text-xs text-slate-400 sm:flex">{market.label}</p>
                    <p className="text-right text-sm font-semibold text-blue-300">{method.rate}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
              <ShieldCheck className="mb-4 h-5 w-5 text-emerald-400" />
              <h2 className="mb-2 text-sm font-semibold text-white">Clear pricing, predictable settlement</h2>
              <p className="text-sm leading-6 text-slate-400">No subscription fee or platform markup. Fees are charged only after a collection succeeds.</p>
            </div>
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-6">
              <MessageCircle className="mb-4 h-5 w-5 text-blue-400" />
              <h2 className="mb-2 text-sm font-semibold text-white">Need volume pricing?</h2>
              <p className="mb-4 text-sm leading-6 text-slate-400">Talk with the team about custom rates, settlement schedules, and multi-market coverage.</p>
              <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300 hover:text-blue-200">Contact sales <ArrowRight className="h-4 w-4" /></a>
            </div>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
