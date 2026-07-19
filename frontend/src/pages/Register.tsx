import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { registerSchema } from '@/lib/validation';

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  business_name: string;
}

interface FormErrors {
  full_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  business_name?: string;
  general?: string;
}

const INITIAL_FORM: FormData = {
  full_name: '',
  email: '',
  phone: '',
  address: '',
  business_name: '',
};

function SwiftPayLogo() {
  return (
    <svg width="142" height="32" viewBox="0 0 142 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M18.1818 5.11765C18.1818 6.28719 17.205 7.23529 16 7.23529C14.795 7.23529 13.8182 6.28719 13.8182 5.11765C13.8182 3.9481 14.795 3 16 3C17.205 3 18.1818 3.9481 18.1818 5.11765ZM18.1818 24.8824C18.1818 26.0519 17.205 27 16 27C14.795 27 13.8182 26.0519 13.8182 24.8824C13.8182 23.7128 14.795 22.7647 16 22.7647C17.205 22.7647 18.1818 23.7128 18.1818 24.8824ZM10.1818 22.7647C11.3868 22.7647 12.3636 21.8166 12.3636 20.647C12.3636 19.4775 11.3868 18.5294 10.1818 18.5294C8.97683 18.5294 8 19.4775 8 20.647C8 21.8166 8.97683 22.7647 10.1818 22.7647ZM12.3636 9.3529C12.3636 10.5224 11.3868 11.4705 10.1818 11.4705C8.97683 11.4705 8 10.5224 8 9.3529C8 8.18336 8.97683 7.23525 10.1818 7.23525C11.3868 7.23525 12.3636 8.18336 12.3636 9.3529ZM21.8182 22.7647C23.0232 22.7647 24 21.8166 24 20.647C24 19.4775 23.0232 18.5294 21.8182 18.5294C20.6132 18.5294 19.6364 19.4775 19.6364 20.647C19.6364 21.8166 20.6132 22.7647 21.8182 22.7647ZM18.1818 15C18.1818 16.1695 17.205 17.1176 16 17.1176C14.795 17.1176 13.8182 16.1695 13.8182 15C13.8182 13.8304 14.795 12.8823 16 12.8823C17.205 12.8823 18.1818 13.8304 18.1818 15ZM21.8182 11.4705C23.0232 11.4705 24 10.5224 24 9.3529C24 8.18336 23.0232 7.23525 21.8182 7.23525C20.6132 7.23525 19.6364 8.18336 19.6364 9.3529C19.6364 10.5224 20.6132 11.4705 21.8182 11.4705Z" fill="#191919"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M84.064 14.612V23.28H81.116V14.612H79.598V12.368H81.116V11.664C81.116 10.2267 81.4607 9.09 82.15 8.254C82.8393 7.418 83.778 7 84.966 7C85.9047 7 86.8507 7.22733 87.804 7.682L87.21 9.904C86.99 9.78667 86.7297 9.68767 86.429 9.607C86.1283 9.52633 85.8533 9.486 85.604 9.486C84.5773 9.486 84.064 10.1753 84.064 11.554V12.368H86.88V14.612H84.064ZM77.75 7.22V10.146H74.802V7.22H77.75ZM48.556 23.456C49.3187 23.456 50.0483 23.3717 50.745 23.203C51.4417 23.0343 52.0577 22.7667 52.593 22.4C53.1283 22.0333 53.5537 21.553 53.869 20.959C54.1843 20.365 54.342 19.65 54.342 18.814C54.342 18.0953 54.2247 17.4903 53.99 16.999C53.7553 16.5077 53.4217 16.086 52.989 15.734C52.5563 15.382 52.0283 15.0887 51.405 14.854C50.7817 14.6193 50.0887 14.3993 49.326 14.194C48.7393 14.0473 48.2223 13.908 47.775 13.776C47.3277 13.644 46.9573 13.4973 46.664 13.336C46.3707 13.1747 46.147 12.9877 45.993 12.775C45.839 12.5623 45.762 12.2947 45.762 11.972C45.762 11.4147 45.9673 10.982 46.378 10.674C46.7887 10.366 47.412 10.212 48.248 10.212C48.7173 10.212 49.1793 10.2707 49.634 10.388C50.0887 10.5053 50.5103 10.6483 50.899 10.817C51.2877 10.9857 51.6177 11.158 51.889 11.334C52.1603 11.51 52.3473 11.6493 52.45 11.752L53.792 9.288C53.1027 8.81867 52.296 8.41167 51.372 8.067C50.448 7.72233 49.436 7.55 48.336 7.55C47.544 7.55 46.8033 7.65633 46.114 7.869C45.4247 8.08167 44.8197 8.39333 44.299 8.804C43.7783 9.21467 43.3713 9.728 43.078 10.344C42.7847 10.96 42.638 11.664 42.638 12.456C42.638 13.0573 42.7297 13.5743 42.913 14.007C43.0963 14.4397 43.3713 14.821 43.738 15.151C44.1047 15.481 44.563 15.767 45.113 16.009C45.663 16.251 46.312 16.4747 47.06 16.68C47.676 16.856 48.2333 17.0173 48.732 17.164C49.2307 17.3107 49.656 17.472 50.008 17.648C50.36 17.824 50.6313 18.0293 50.822 18.264C51.0127 18.4987 51.108 18.7847 51.108 19.122C51.108 20.1927 50.272 20.728 48.6 20.728C47.9987 20.728 47.412 20.6547 46.84 20.508C46.268 20.3613 45.7473 20.1817 45.278 19.969C44.8087 19.7563 44.4017 19.5437 44.057 19.331C43.7123 19.1183 43.474 18.946 43.342 18.814L42 21.432C42.9093 22.0773 43.936 22.576 45.08 22.928C46.224 23.28 47.3827 23.456 48.556 23.456ZM62.262 23.28L64.22 18.22L66.2 23.28H68.62L73.438 11.752H70.644L67.212 20.508L65.826 16.768L67.828 11.774H65.452L64.22 15.316L63.01 11.774H60.634L62.658 16.768L61.25 20.508L57.818 11.752H55.046L59.842 23.28H62.262ZM77.75 23.28V11.752H74.802V23.28H77.75ZM92.204 23.478C92.8347 23.478 93.436 23.39 94.008 23.214C94.58 23.038 95.064 22.862 95.46 22.686L94.866 20.354C94.69 20.4273 94.4553 20.5153 94.162 20.618C93.8687 20.7207 93.568 20.772 93.26 20.772C92.952 20.772 92.6917 20.6877 92.479 20.519C92.2663 20.3503 92.16 20.0607 92.16 19.65V14.018H94.58V11.752H92.16V8.012H89.212V11.752H87.694V14.018H89.212V20.64C89.212 21.1533 89.2927 21.5897 89.454 21.949C89.6153 22.3083 89.8317 22.6017 90.103 22.829C90.3743 23.0563 90.6897 23.2213 91.049 23.324C91.4083 23.4267 91.7933 23.478 92.204 23.478ZM101.322 18.044V23.28H98.286V7.66H104.908C105.627 7.66 106.29 7.81033 106.899 8.111C107.508 8.41167 108.032 8.80767 108.472 9.299C108.912 9.79033 109.257 10.3477 109.506 10.971C109.755 11.5943 109.88 12.2213 109.88 12.852C109.88 13.512 109.763 14.1537 109.528 14.777C109.293 15.4003 108.963 15.954 108.538 16.438C108.113 16.922 107.599 17.3107 106.998 17.604C106.397 17.8973 105.737 18.044 105.018 18.044H101.322ZM104.842 15.382H101.322V10.322H104.71C104.974 10.322 105.234 10.377 105.491 10.487C105.748 10.597 105.971 10.762 106.162 10.982C106.353 11.202 106.507 11.4697 106.624 11.785C106.741 12.1003 106.8 12.456 106.8 12.852C106.8 13.6293 106.613 14.2453 106.239 14.7C105.865 15.1547 105.399 15.382 104.842 15.382Z" fill="#191919"/>
    </svg>
  );
}

// ── Paperform-style field wrapper (label + sub-label + underline input + banner) ──
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
    <div>
      <label style={{ display: 'block', fontSize: 16, fontWeight: 500, color: '#191919', marginBottom: 4 }}>
        {label}{required && <span style={{ color: '#ffa672' }}>*</span>}
      </label>
      {subLabel && (
        <p style={{ fontSize: 13, color: '#8a8a8a', margin: '0 0 12px', fontWeight: 300 }}>{subLabel}</p>
      )}
      {children}
      {error && (
        <div style={{ background: '#ff9458', color: '#fff', textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', padding: '10px 16px', borderRadius: 6, marginTop: 14 }}>
          {error}
        </div>
      )}
    </div>
  );
}

const paperInputStyle = (hasError?: boolean): React.CSSProperties => ({
  width: '100%',
  fontSize: 16,
  fontWeight: 300,
  color: '#191919',
  background: 'transparent',
  border: 'none',
  borderBottom: `1px solid ${hasError ? '#ff9458' : '#f8c4c4'}`,
  borderRadius: 0,
  padding: '8px 0',
  outline: 'none',
  fontFamily: 'inherit',
});

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [kybId, setKybId] = useState<number | null>(null);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormData;
        fieldErrors[field] = issue.message;
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
      }
    } catch {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#fcfcfc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#e6fff4', border: '1.5px solid #0c9f5e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle size={28} color="#0c9f5e" />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 500, color: '#191919', margin: '0 0 10px' }}>Application submitted!</h2>
          <p style={{ fontSize: 15, color: '#535353', fontWeight: 300, lineHeight: 1.6, margin: '0 0 28px' }}>
            Your merchant application has been received. Our team will review it and reach out via email.
          </p>
          {kybId && (
            <div style={{ background: '#f5f5f5', borderRadius: 10, padding: '16px 20px', marginBottom: 28, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                <span style={{ color: '#a3a6ad' }}>Application ID</span>
                <span style={{ color: '#191919', fontWeight: 500 }}>#{kybId}</span>
              </div>
            </div>
          )}
          <button onClick={() => navigate('/login')} style={{ display: 'block', width: '100%', background: '#191919', color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 500, border: 'none', borderRadius: 10, padding: 14, cursor: 'pointer' }}>
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        .heading-1 { letter-spacing: -1.75px; font-size: 80px; line-height: 88px; }
        @media only screen and (max-width: 1025px) {
          .heading-1 { letter-spacing: -1.5px; font-size: 40px; line-height: 48px; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#fcfcfc' }}>
        {/* ── Header ──────────────────────────────────────────── */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e9e9e9', padding: '0 40px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/">
            <SwiftPayLogo />
          </Link>
          <nav style={{ display: 'flex', gap: 32, fontSize: 15, color: '#191919' }}>
            <Link to="/#solutions" style={{ color: '#191919', textDecoration: 'none' }}>Solutions</Link>
            <Link to="/features" style={{ color: '#191919', textDecoration: 'none' }}>Features</Link>
            <Link to="/pricing" style={{ color: '#191919', textDecoration: 'none' }}>Pricing</Link>
          </nav>
        </header>

        {/* ── Main section ───────────────────────────────────── */}
        <main className="wrapper wrapper--small" style={{ maxWidth: 928, margin: '0 auto', padding: '0 40px' }}>
          {/* Page title */}
          <header className="policy_header" style={{ textAlign: 'left', padding: '64px 0 48px' }}>
            <h1 className="heading-1" style={{ fontWeight: 500, color: '#191919', margin: 0 }}>
              Register merchant account
            </h1>
          </header>

          {/* Form container */}
          <article style={{ paddingBottom: 80 }}>
            {errors.general && (
              <div style={{ background: '#ffebeb', border: '1px solid #ffadad', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#8f0000', marginBottom: 28 }}>
                <AlertCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} />
                <span>{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Light-blue card matching the SwiftPay Paperform layout */}
              <div style={{ background: '#eef8fa', borderRadius: 16, padding: 48 }}>
                <p style={{ fontSize: 22, fontWeight: 500, color: '#191919', margin: '0 0 32px' }}>
                  Please provide your company details
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  <PaperField label="Company name" subLabel="Provide your company name" required error={errors.business_name}>
                    <input
                      type="text"
                      value={form.business_name}
                      onChange={(e) => handleChange('business_name', e.target.value)}
                      style={paperInputStyle(!!errors.business_name)}
                    />
                  </PaperField>

                  <PaperField label="Your full name" subLabel="Provide a main contact person's full name" required error={errors.full_name}>
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(e) => handleChange('full_name', e.target.value)}
                      style={paperInputStyle(!!errors.full_name)}
                    />
                  </PaperField>

                  <PaperField label="Your email address" subLabel="Provide e-mail address we will use to contact your company" required error={errors.email}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      style={paperInputStyle(!!errors.email)}
                    />
                  </PaperField>

                  <PaperField label="Your mobile number" subLabel="Provide a main contact person mobile number" required error={errors.phone}>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      style={paperInputStyle(!!errors.phone)}
                    />
                  </PaperField>

                  <PaperField label="Business address" subLabel="Provide your registered business address" error={errors.address}>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      style={paperInputStyle(!!errors.address)}
                    />
                  </PaperField>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                style={{ width: '100%', background: '#191919', color: '#fff', fontFamily: 'inherit', fontSize: 16, fontWeight: 500, border: 'none', borderRadius: 10, padding: 15, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: submitting ? 0.6 : 1, marginTop: 32 }}
              >
                {submitting ? (
                  <>
                    <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Submitting…
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>

              <div style={{ textAlign: 'center', fontSize: 13, color: '#a3a6ad', marginTop: 24 }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#191919', fontWeight: 500, textDecoration: 'underline' }}>
                  Sign in
                </Link>
              </div>
            </form>
          </article>
        </main>

        {/* ── Footer ──────────────────────────────────────────── */}
        <footer style={{ borderTop: '1px solid #e9e9e9', padding: '28px 40px', textAlign: 'center', fontSize: 13, color: '#a3a6ad', background: '#fff' }}>
          © {new Date().getFullYear()} SwiftPay Philippines. All rights reserved.
          &nbsp;·&nbsp;
          <a href="https://swiftpay.ph/privacy-policy/" target="_blank" rel="noopener noreferrer" style={{ color: '#535353', textDecoration: 'none' }}>Privacy</a>
          &nbsp;·&nbsp;
          <a href="https://swiftpay.ph/terms-of-service/" target="_blank" rel="noopener noreferrer" style={{ color: '#535353', textDecoration: 'none' }}>Terms</a>
        </footer>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
