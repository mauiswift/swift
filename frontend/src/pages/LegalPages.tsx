import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, FileCheck2, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import MarketingPageShell from '@/components/MarketingPageShell';
import { COMPANY_NAME, SUPPORT_HANDLE } from '@/lib/brand';

const PROVIDER_NAME = 'Swiftpay Ventures Inc.';
const SIGNATORY_NAME = 'Den Leoardo';
const SIGNATORY_TITLE = 'President';
const SUPPORT_PHONE = '+63 910 335 0434';

function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.03)] md:p-8">
      <h2 className="mb-5 text-[22px] font-semibold tracking-[-0.04em] text-slate-900">{title}</h2>
      <div className="space-y-4 text-[15px] leading-7 text-slate-600">{children}</div>
    </section>
  );
}

export function ContactPage() {
  return (
    <MarketingPageShell>
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-8 lg:py-28">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Contact</p>
            <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-semibold tracking-[-0.06em] text-slate-900">Talk to {COMPANY_NAME}</h1>
          </div>
          <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-700">
            Open merchant account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.03)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
              <Mail className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Email</p>
            <a href={`mailto:${SUPPORT_HANDLE}`} className="mt-3 block text-lg font-semibold text-slate-900 hover:text-slate-600">
              {SUPPORT_HANDLE}
            </a>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.03)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
              <Phone className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Phone</p>
            <a href={`tel:${SUPPORT_PHONE.replace(/\s+/g, '')}`} className="mt-3 block text-lg font-semibold text-slate-900 hover:text-slate-600">
              {SUPPORT_PHONE}
            </a>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.03)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
              <MapPin className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Location</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">Manila, Philippines</p>
          </div>
        </div>

        <div className="mt-8 rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#111827,#0f172a)] p-8 text-white shadow-[0_24px_60px_rgba(15,23,42,0.15)] md:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Building2 className="h-5 w-5 text-slate-200" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Provider</p>
              <h2 className="text-2xl font-semibold text-white">{PROVIDER_NAME}</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-300">Authorized representative</p>
              <p className="mt-2 text-xl font-semibold text-white">{SIGNATORY_NAME}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Title</p>
              <p className="mt-2 text-xl font-semibold text-white">{SIGNATORY_TITLE}</p>
            </div>
          </div>
        </div>
      </div>
    </MarketingPageShell>
  );
}

export function PrivacyPolicyPage() {
  return (
    <MarketingPageShell>
      <div className="mx-auto max-w-4xl px-6 py-20 md:px-8 lg:py-28">
        <div className="mb-8">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Privacy policy</p>
          <h1 className="text-[clamp(2.3rem,4vw,3.8rem)] font-semibold tracking-[-0.06em] text-slate-900">Privacy policy</h1>
        </div>

        <LegalSection title="1. Who we are">
          <p>{PROVIDER_NAME} operates the SwiftPay merchant platform and payment services. We process personal and business information to deliver payment, compliance, onboarding, and support operations.</p>
        </LegalSection>

        <LegalSection title="2. Information we collect">
          <p>We may collect your name, business name, email address, phone number, company details, billing information, transaction records, and supporting compliance documents required to onboard and service your account.</p>
        </LegalSection>

        <LegalSection title="3. How we use your information">
          <p>We use your information to verify your account, process payments, support merchant onboarding, prevent fraud, meet legal obligations, and provide customer support for the services you access.</p>
        </LegalSection>

        <LegalSection title="4. Data sharing">
          <p>We do not sell personal information. We may share limited information with trusted providers, payment processors, banking partners, and regulatory or compliance counterparts when required to deliver secure and compliant services.</p>
        </LegalSection>

        <LegalSection title="5. Retention and security">
          <p>We retain personal information only as long as necessary for legal, business, and security purposes. We apply reasonable administrative, technical, and organizational controls to protect your information.</p>
        </LegalSection>

        <LegalSection title="6. Your rights">
          <p>You may request updates, corrections, or deletion of your personal data in line with applicable Philippine privacy laws and our internal compliance procedures.</p>
        </LegalSection>
      </div>
    </MarketingPageShell>
  );
}

export function TermsOfServicePage() {
  return (
    <MarketingPageShell>
      <div className="mx-auto max-w-4xl px-6 py-20 md:px-8 lg:py-28">
        <div className="mb-8">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Terms of service</p>
          <h1 className="text-[clamp(2.3rem,4vw,3.8rem)] font-semibold tracking-[-0.06em] text-slate-900">Terms of service</h1>
        </div>

        <LegalSection title="1. Agreement">
          <p>By creating a merchant account and using the SwiftPay platform, you agree to comply with the terms and conditions of {PROVIDER_NAME}, including applicable laws, transaction rules, and service requirements.</p>
        </LegalSection>

        <LegalSection title="2. Authorized use">
          <p>You agree to use the platform only for lawful business purposes and to provide accurate information. You are responsible for maintaining the security of your account and authorized access credentials.</p>
        </LegalSection>

        <LegalSection title="3. Payment services">
          <p>{PROVIDER_NAME} enables digital payment acceptance and payouts subject to verification, service availability, and compliance checks. The platform may be suspended or restricted if required by security, regulatory, or fraud safeguards.</p>
        </LegalSection>

        <LegalSection title="4. Liability">
          <p>We provide the platform on an as-is basis and seek to maintain reliable service levels, but we do not guarantee uninterrupted access or error-free operation. Our liability is limited to the extent permitted by law.</p>
        </LegalSection>

        <LegalSection title="5. Changes to terms">
          <p>We may update these terms from time to time. Continued use of the service after updates constitutes your acceptance of the revised terms.</p>
        </LegalSection>
      </div>
    </MarketingPageShell>
  );
}

export function NdaPage() {
  return (
    <MarketingPageShell>
      <div className="mx-auto max-w-4xl px-6 py-20 md:px-8 lg:py-28">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Confidentiality</p>
            <h1 className="text-[clamp(2.2rem,4vw,3.6rem)] font-semibold tracking-[-0.06em] text-slate-900">NDA agreement</h1>
          </div>
        </div>

        <LegalSection title="Non-disclosure agreement">
          <p>This Non-Disclosure Agreement is entered into by and between {PROVIDER_NAME} and the registering merchant or authorized representative who submits an onboarding application through the SwiftPay merchant account registration process.</p>
          <p>The merchant acknowledges that, in connection with onboarding and platform access, the company may disclose non-public information including business strategy, financial data, technical information, transaction analytics, pricing, product plans, security practices, and compliance information.</p>
          <p>The merchant agrees not to disclose, copy, share, or misuse any confidential information belonging to {PROVIDER_NAME} except as necessary to perform obligations under the merchant relationship and only for lawful business purposes.</p>
          <p>Confidential information remains protected for as long as it remains non-public and protected under applicable law. The merchant agrees to use reasonable care to protect the confidentiality and integrity of all information received from {PROVIDER_NAME}.</p>
          <p>By completing registration and selecting the acceptance checkbox, the merchant confirms that they have read and agree to this NDA and that the acceptance is binding and effective immediately.</p>
        </LegalSection>

        <section className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-6 md:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Authorized signatory</p>
          <div className="mt-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">{SIGNATORY_NAME}</p>
              <p className="text-slate-600">{SIGNATORY_TITLE}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm font-medium text-slate-500">For</p>
              <p className="text-lg font-semibold text-slate-900">{PROVIDER_NAME}</p>
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-700">
            Continue registration <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:text-slate-900">
            Contact provider
          </Link>
        </div>
      </div>
    </MarketingPageShell>
  );
}

export function LegalPageOverview() {
  return (
    <MarketingPageShell>
      <div className="mx-auto max-w-5xl px-6 py-20 md:px-8 lg:py-28">
        <div className="mb-8">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Legal center</p>
          <h1 className="text-[clamp(2.4rem,5vw,4rem)] font-semibold tracking-[-0.06em] text-slate-900">Company policies</h1>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[{ title: 'Contact', text: 'Support, sales, and business inquiries', to: '/contact', icon: Mail }, { title: 'Privacy Policy', text: 'How we safeguard merchant and customer data', to: '/privacy-policy', icon: ShieldCheck }, { title: 'Terms of Service', text: 'The rules for using the platform', to: '/terms-of-service', icon: FileCheck2 }, { title: 'NDA', text: 'Confidentiality agreement for all registrations', to: '/nda', icon: ShieldCheck }].map(({ title, text, to, icon: Icon }) => (
            <Link key={title} to={to} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.03)] transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-lg font-semibold text-slate-900">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </Link>
          ))}
        </div>
      </div>
    </MarketingPageShell>
  );
}
