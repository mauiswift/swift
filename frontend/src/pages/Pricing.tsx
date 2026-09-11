import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Globe2,
  LockKeyhole,
  MessageCircle,
  Minus,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import MarketingPageShell from '@/components/MarketingPageShell';
import { EXPERT_CONTACT_URL } from '@/lib/brand';

const plans = [
  {
    name: 'Starter',
    eyebrow: 'For testing',
    price: 'Free',
    description: 'Start collecting and see how SwiftPay fits your workflow.',
    tone: 'neutral',
    features: ['Telegram bot access', 'QR code payments', 'GCash and local e-wallets', 'Transaction history', 'Email support'],
    excluded: ['Disbursements', 'Multi-admin controls', 'Advanced reporting'],
    cta: 'Create an account',
    href: '/register',
  },
  {
    name: 'Merchant',
    eyebrow: 'For growing teams',
    price: '0.4%',
    suffix: 'per successful collection',
    description: 'The complete payment stack for active merchants. No monthly subscription.',
    tone: 'featured',
    features: ['Everything in Starter', 'All supported PH bank rails', 'Alipay and WeChat Pay', 'Disbursements to PH banks', 'Reports and analytics', 'KYC / KYB onboarding', 'Priority support'],
    cta: 'Start collecting',
    href: '/register',
  },
  {
    name: 'Enterprise',
    eyebrow: 'For high volume',
    price: 'Custom',
    description: 'Flexible commercial terms and hands-on support for complex operations.',
    tone: 'dark',
    features: ['Everything in Merchant', 'Volume-based pricing', 'Dedicated account manager', 'Custom settlement schedule', 'Multi-branch / sub-merchants', 'API and webhook support', 'Custom compliance reporting'],
    cta: 'Talk to an expert',
    href: EXPERT_CONTACT_URL,
  },
];

const fees = [
  ['GCash, Maya, GrabPay and ShopeePay', '0.4%'],
  ['QRPH and bank transfer rails', '0.4%'],
  ['Local and international cards', '0.4%'],
  ['Alipay and WeChat Pay', '0.4%'],
  ['Over-the-counter channels', '0.4%'],
];

const faqs = [
  ['Is there a monthly subscription fee?', 'No. SwiftPay is pay-as-you-go. You pay the published processing fee only when a collection succeeds.'],
  ['What does the 0.4% fee include?', 'The standard fee applies to supported collection methods listed below and is exclusive of VAT. Volume pricing may be available for Enterprise accounts.'],
  ['When do I receive settlement?', 'Settlement depends on the payment rail, bank partner, and operational processing schedule. Your enabled schedule is confirmed during onboarding.'],
  ['What documents are needed to get started?', 'Individuals generally provide a government-issued ID and proof of business. Companies provide registration documents and an authorized representative ID.'],
];

function ActionLink({ href, children, dark = false }: { href: string; children: React.ReactNode; dark?: boolean }) {
  const className = `inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${
    dark ? 'bg-white text-[#0f2347] hover:bg-blue-50' : 'bg-[#0f2347] text-white hover:bg-[#193c73]'
  }`;
  return href.startsWith('http') ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>{children}</a>
  ) : (
    <Link to={href} className={className}>{children}</Link>
  );
}

function FeatureList({ features, excluded = false, dark = false }: { features: string[]; excluded?: boolean; dark?: boolean }) {
  return (
    <ul className="space-y-3">
      {features.map(feature => (
        <li key={feature} className={`flex items-start gap-2.5 text-sm ${dark ? 'text-blue-100/75' : excluded ? 'text-slate-400' : 'text-slate-700'}`}>
          {excluded ? <Minus className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" /> : <Check className={`mt-0.5 h-4 w-4 shrink-0 ${dark ? 'text-blue-200' : 'text-[#1769aa]'}`} />}
          <span className={excluded ? 'line-through' : ''}>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button type="button" onClick={() => setOpen(value => !value)} className="flex w-full items-center justify-between gap-4 py-5 text-left">
        <span className="text-sm font-semibold text-slate-900">{question}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="max-w-2xl pb-5 text-sm leading-6 text-slate-600">{answer}</p>}
    </div>
  );
}

export default function Pricing() {
  return (
    <MarketingPageShell className="bg-[#f7f9fc] text-slate-900">
      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-blue-100/60 blur-3xl" />
          <div className="pointer-events-none absolute -left-40 bottom-[-280px] h-[480px] w-[480px] rounded-full bg-sky-100/70 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#1769aa]">
                <Sparkles className="h-3.5 w-3.5" /> Simple, transparent pricing
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.055em] text-[#0f2347] sm:text-6xl">
                Keep more of every payment.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Start free, then scale with one clear processing rate across the payment methods your customers already use. No platform subscription. No surprise tiers.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ActionLink href="/register">Create your account <ArrowRight className="h-4 w-4" /></ActionLink>
                <a href="#fee-table" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-[#0f2347] transition-colors hover:border-blue-300 hover:bg-blue-50">
                  View collection rates
                </a>
              </div>
            </div>
            <div className="mt-14 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Zap, title: 'No monthly fee', text: 'Pay only when you collect.' },
                { icon: Globe2, title: 'Local + global', text: 'Reach customers across markets.' },
                { icon: ShieldCheck, title: 'Built for trust', text: 'Compliance-ready operations.' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#1769aa]"><Icon className="h-4 w-4" /></div>
                  <div><p className="text-sm font-bold text-[#0f2347]">{title}</p><p className="mt-0.5 text-xs text-slate-500">{text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8 sm:py-20">
          <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1769aa]">Plans that grow with you</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#0f2347]">Choose your starting point</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-slate-500">Every plan includes secure access to the SwiftPay dashboard and Telegram operations.</p>
          </div>
          <div className="grid items-stretch gap-5 lg:grid-cols-3">
            {plans.map(plan => {
              const featured = plan.tone === 'featured';
              const dark = plan.tone === 'dark';
              return (
                <article key={plan.name} className={`relative flex flex-col rounded-3xl border p-7 ${dark ? 'border-[#173e79] bg-[#0f2347] text-white shadow-xl shadow-blue-950/10' : featured ? 'border-blue-300 bg-white shadow-xl shadow-blue-900/10' : 'border-slate-200 bg-white'}`}>
                  {featured && <div className="absolute -top-3 left-6 rounded-full bg-[#1769aa] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">Most popular</div>}
                  <div className="flex-1">
                    <p className={`text-xs font-bold uppercase tracking-[0.16em] ${dark ? 'text-blue-200' : 'text-[#1769aa]'}`}>{plan.eyebrow}</p>
                    <h3 className={`mt-3 text-2xl font-semibold ${dark ? 'text-white' : 'text-[#0f2347]'}`}>{plan.name}</h3>
                    <p className={`mt-2 min-h-12 text-sm leading-6 ${dark ? 'text-blue-100/70' : 'text-slate-600'}`}>{plan.description}</p>
                    <div className="mt-6 flex items-baseline gap-2">
                      <span className={`text-4xl font-semibold tracking-[-0.05em] ${dark ? 'text-white' : 'text-[#0f2347]'}`}>{plan.price}</span>
                      {plan.suffix && <span className={`text-xs ${dark ? 'text-blue-100/60' : 'text-slate-500'}`}>{plan.suffix}</span>}
                    </div>
                    <div className={`my-7 border-t pt-6 ${dark ? 'border-white/10' : 'border-slate-200'}`}><FeatureList features={plan.features} dark={dark} />{plan.excluded && <div className={`mt-5 border-t pt-5 ${dark ? 'border-white/10' : 'border-slate-100'}`}><FeatureList features={plan.excluded} excluded dark={dark} /></div>}</div>
                  </div>
                  <ActionLink href={plan.href} dark={dark}>{plan.cta} <ArrowRight className="h-4 w-4" /></ActionLink>
                </article>
              );
            })}
          </div>
        </section>

        <section id="fee-table" className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1769aa]">One clear rate</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#0f2347]">Transparent collection fees</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">The published rate applies to successful collections. Settlement timing and VAT treatment are confirmed during onboarding.</p>
              <div className="mt-7 rounded-2xl bg-[#eef5ff] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#1769aa]">Standard rate</p>
                <p className="mt-2 text-5xl font-semibold tracking-[-0.06em] text-[#0f2347]">0.4<span className="text-2xl">%</span></p>
                <p className="mt-1 text-xs text-slate-500">per successful collection, exclusive of VAT</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 bg-slate-50 px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-500"><span>Collection method</span><span>Rate</span></div>
              {fees.map(([method, fee]) => <div key={method} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-slate-100 px-5 py-4 text-sm last:border-0"><span className="text-slate-700">{method}</span><span className="font-bold text-[#1769aa]">{fee}</span></div>)}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 py-16 sm:px-8 lg:grid-cols-[1fr_1.15fr] lg:py-20">
          <div className="rounded-3xl bg-[#0f2347] p-8 text-white sm:p-10">
            <LockKeyhole className="h-6 w-6 text-blue-200" />
            <h2 className="mt-6 text-2xl font-semibold tracking-[-0.03em]">Pricing without the fine print.</h2>
            <p className="mt-3 text-sm leading-6 text-blue-100/75">From onboarding to settlement, we explain what is enabled, what it costs, and when funds move.</p>
            <div className="mt-8 space-y-3 text-sm text-blue-100/85"><p className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-blue-200" /> No monthly platform subscription</p><p className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-blue-200" /> No locked-in annual contract</p><p className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-blue-200" /> Volume terms available for Enterprise</p></div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
            <div className="flex items-center gap-3"><CircleHelp className="h-5 w-5 text-[#1769aa]" /><h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#0f2347]">Frequently asked</h2></div>
            <div className="mt-4">{faqs.map(([question, answer]) => <FaqItem key={question} question={question} answer={answer} />)}</div>
          </div>
        </section>

        <section className="bg-[#eef5ff] px-6 py-16 text-center sm:px-8 sm:py-20">
          <MessageCircle className="mx-auto h-6 w-6 text-[#1769aa]" />
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#0f2347]">Ready to make payments simpler?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">Create your account today or talk with our team about custom rates and settlement requirements.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><ActionLink href="/register">Get started <ArrowRight className="h-4 w-4" /></ActionLink><ActionLink href={EXPERT_CONTACT_URL} dark>Talk to an expert</ActionLink></div>
        </section>
      </main>
    </MarketingPageShell>
  );
}
