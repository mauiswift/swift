import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { registerSchema } from '@/lib/validation';
import MarketingPageShell from '@/components/MarketingPageShell';

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  business_name: string;
  nda_accepted: boolean;
}

interface FormErrors {
  full_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  business_name?: string;
  nda_accepted?: string;
  general?: string;
}

const INITIAL_FORM: FormData = {
  full_name: '',
  email: '',
  phone: '',
  address: '',
  business_name: '',
  nda_accepted: false,
};

// ── Paperform-style field wrapper ──
function PaperField({
  label,
  subLabel,
  required,
  error,
  children,
}: {
  label: string;
  subLabel?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[17px] font-semibold text-[#1a1a1a]">
        {label}{required && <span className="text-[#ff855b] ml-1">*</span>}
      </label>
      {subLabel && (
        <p className="text-[14px] text-[#535353] leading-relaxed mb-3">{subLabel}</p>
      )}
      <div className="relative">
        {children}
        {error && (
          <div className="mt-4 bg-[#ff855b] text-white text-[11px] font-semibold uppercase tracking-widest px-4 py-2.5 rounded-lg text-center animate-in fade-in slide-in-from-top-2 duration-300">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [kybId, setKybId] = useState<number | null>(null);
  const [referenceCode, setReferenceCode] = useState<string | null>(null);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value as never }));
    if (errors[field as keyof FormErrors]) setErrors((e) => ({ ...e, [field as keyof FormErrors]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nda_accepted) {
      setErrors({ nda_accepted: 'You must accept the NDA before submitting your registration.' });
      return;
    }

    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormData;
        fieldErrors[field as keyof FormErrors] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ general: data?.detail ?? 'Registration failed.' });
      } else {
        setSuccess(true);
        setKybId(data.kyb_id ?? null);
        setReferenceCode(data.reference_code ?? null);
      }
    } catch {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (hasError?: boolean) => `
    w-full bg-transparent border-0 border-b-2 py-3 px-0 text-[18px] text-[#1a1a1a] focus:ring-0 transition-all duration-300 outline-none
    ${hasError ? 'border-[#ff855b]' : 'border-[#f8c4c4] focus:border-[#1a1a1a]'}
    placeholder:text-slate-300
  `;

  if (success) {
    return (
      <MarketingPageShell>
        <div className="min-h-[70vh] flex items-center justify-center px-6 py-20">
          <div className="max-w-[480px] w-full text-center">
            <div className="w-20 h-20 bg-[#d8faf3] border-2 border-[#06d6b6] rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
              <CheckCircle size={36} className="text-[#026153]" />
            </div>
            <h2 className="text-[32px] font-semibold text-[#1a1a1a] tracking-tight mb-4">Application submitted!</h2>
            <p className="text-[17px] text-[#535353] leading-relaxed mb-10">
              Your merchant application has been received. Our team will review your details and reach out via email within 24–48 hours.
            </p>
            {(kybId || referenceCode) && (
              <div className="bg-[#fafafa] border border-[#f2f2f2] rounded-2xl p-6 mb-10 text-left space-y-4">
                {kybId && (
                  <div className="flex justify-between items-center text-[14px]">
                    <span className="font-semibold text-[#9a9a9a] uppercase tracking-wider">Application ID</span>
                    <span className="font-semibold text-[#1a1a1a] text-lg">#{kybId}</span>
                  </div>
                )}
                {referenceCode && (
                  <div className="flex justify-between items-center text-[14px]">
                    <span className="font-semibold text-[#9a9a9a] uppercase tracking-wider">KYB reference</span>
                    <span className="font-semibold text-[#1a1a1a] text-lg tracking-[0.18em]">{referenceCode}</span>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-[#1a1a1a] text-white font-semibold text-[16px] py-4 rounded-full hover:bg-[#2b2b2b] transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </MarketingPageShell>
    );
  }

  return (
    <MarketingPageShell>
      <div className="mx-auto max-w-[960px] px-8 py-20 md:py-32">
        {/* Page Title */}
        <header className="mb-16 md:mb-24">
          <h1 className="text-[clamp(2.5rem,5.5vw,5rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-[#1a1a1a] max-w-[12ch]">
            Register merchant account
          </h1>
        </header>

        {/* Error State */}
        {errors.general && (
          <div className="mb-10 bg-[#fff5f5] border border-[#ffdada] rounded-2xl p-5 flex items-start gap-4 text-[#c53030] text-[15px] animate-in fade-in slide-in-from-top-4 duration-500">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="font-semibold">{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Main Form Card */}
          <div className="bg-[#eef8fa] rounded-[40px] p-8 md:p-16 lg:p-20 shadow-sm border border-[#e2eff1]">
            <p className="text-[22px] md:text-[26px] font-semibold text-[#1a1a1a] tracking-tight mb-12">
              Please provide your company details
            </p>

            <div className="space-y-12">
              <PaperField label="Company name" subLabel="Provide your registered business name" required error={errors.business_name}>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={form.business_name}
                  onChange={(e) => handleChange('business_name', e.target.value)}
                  className={inputClass(!!errors.business_name)}
                />
              </PaperField>

              <PaperField label="Your full name" subLabel="Provide a main contact person's full name" required error={errors.full_name}>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={form.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  className={inputClass(!!errors.full_name)}
                />
              </PaperField>

              <PaperField label="Your email address" subLabel="Provide e-mail address we will use to contact your company" required error={errors.email}>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={inputClass(!!errors.email)}
                />
              </PaperField>

              <PaperField label="Your mobile number" subLabel="Provide a main contact person mobile number" required error={errors.phone}>
                <input
                  type="tel"
                  placeholder="+63 9XX XXX XXXX"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={inputClass(!!errors.phone)}
                />
              </PaperField>

              <PaperField label="Business address" subLabel="Provide your registered business address" error={errors.address}>
                <input
                  type="text"
                  placeholder="e.g. BGC, Taguig City"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className={inputClass(!!errors.address)}
                />
              </PaperField>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <input
                    id="nda_accepted"
                    type="checkbox"
                    checked={form.nda_accepted}
                    onChange={(e) => handleChange('nda_accepted', e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                  />
                  <label htmlFor="nda_accepted" className="flex-1 text-left text-[15px] leading-7 text-[#1a1a1a]">
                    I have read and accept the <Link to="/nda" target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">NDA and confidentiality agreement</Link> for Swiftpay Ventures Inc. This acceptance is required for every account registration. The undersigned representative agrees to be bound by the provisions of the NDA and approves the appointment of Den Leoardo as the authorized company signatory.
                  </label>
                </div>
                {errors.nda_accepted && (
                  <div className="mt-4 bg-[#fff5f5] border border-[#ffdada] rounded-xl px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[#c53030]">
                    {errors.nda_accepted}
                  </div>
                )}
              </div>
            </div>
          </div>
 
          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full group relative flex items-center justify-center gap-3 py-5 px-10 rounded-full text-[17px] font-semibold text-white transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-[0.98] ${submitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#1a1a1a] hover:bg-[#2b2b2b]'}`}
            >
              {submitting ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting Application…</span>
                </>
              ) : (
                <>
                  <span>Submit Application</span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#1a1a1a] group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </>
              )}
            </button>

            <div className="mt-8 text-center text-[15px] text-[#535353] font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-[#1a1a1a] font-semibold hover:underline underline-offset-4">
                Sign in
              </Link>
            </div>
          </div>
        </form>
      </div>
    </MarketingPageShell>
  );
}
