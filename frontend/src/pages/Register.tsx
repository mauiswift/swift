import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, XIcon } from 'lucide-react';
import { APP_NAME } from '@/lib/brand';
import { registerSchema } from '@/lib/validation';

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  business_name: string;
  telegram_username: string;
}

interface FormErrors {
  full_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  business_name?: string;
  telegram_username?: string;
  general?: string;
}

const INITIAL_FORM: FormData = {
  full_name: '',
  email: '',
  phone: '',
  address: '',
  business_name: '',
  telegram_username: '',
};

function SwiftPayLogo() {
  return (
    <svg width="142" height="32" viewBox="0 0 142 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M18.1818 5.11765C18.1818 6.28719 17.205 7.23529 16 7.23529C14.795 7.23529 13.8182 6.28719 13.8182 5.11765C13.8182 3.9481 14.795 3 16 3C17.205 3 18.1818 3.9481 18.1818 5.11765ZM18.1818 24.8824C18.1818 26.0519 17.205 27 16 27C14.795 27 13.8182 26.0519 13.8182 24.8824C13.8182 23.7128 14.795 22.7647 16 22.7647C17.205 22.7647 18.1818 23.7128 18.1818 24.8824ZM10.1818 22.7647C11.3868 22.7647 12.3636 21.8166 12.3636 20.647C12.3636 19.4775 11.3868 18.5294 10.1818 18.5294C8.97683 18.5294 8 19.4775 8 20.647C8 21.8166 8.97683 22.7647 10.1818 22.7647ZM12.3636 9.3529C12.3636 10.5224 11.3868 11.4705 10.1818 11.4705C8.97683 11.4705 8 10.5224 8 9.3529C8 8.18336 8.97683 7.23525 10.1818 7.23525C11.3868 7.23525 12.3636 8.18336 12.3636 9.3529ZM21.8182 22.7647C23.0232 22.7647 24 21.8166 24 20.647C24 19.4775 23.0232 18.5294 21.8182 18.5294C20.6132 18.5294 19.6364 19.4775 19.6364 20.647C19.6364 21.8166 20.6132 22.7647 21.8182 22.7647ZM18.1818 15C18.1818 16.1695 17.205 17.1176 16 17.1176C14.795 17.1176 13.8182 16.1695 13.8182 15C13.8182 13.8304 14.795 12.8823 16 12.8823C17.205 12.8823 18.1818 13.8304 18.1818 15ZM21.8182 11.4705C23.0232 11.4705 24 10.5224 24 9.3529C24 8.18336 23.0232 7.23525 21.8182 7.23525C20.6132 7.23525 19.6364 8.18336 19.6364 9.3529C19.6364 10.5224 20.6132 11.4705 21.8182 11.4705Z" fill="#191919"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M84.064 14.612V23.28H81.116V14.612H79.598V12.368H81.116V11.664C81.116 10.2267 81.4607 9.09 82.15 8.254C82.8393 7.418 83.778 7 84.966 7C85.9047 7 86.8507 7.22733 87.804 7.682L87.21 9.904C86.99 9.78667 86.7297 9.68767 86.429 9.607C86.1283 9.52633 85.8533 9.486 85.604 9.486C84.5773 9.486 84.064 10.1753 84.064 11.554V12.368H86.88V14.612H84.064ZM77.75 7.22V10.146H74.802V7.22H77.75ZM48.556 23.456C49.3187 23.456 50.0483 23.3717 50.745 23.203C51.4417 23.0343 52.0577 22.7667 52.593 22.4C53.1283 22.0333 53.5537 21.553 53.869 20.959C54.1843 20.365 54.342 19.65 54.342 18.814C54.342 18.0953 54.2247 17.4903 53.99 16.999C53.7553 16.5077 53.4217 16.086 52.989 15.734C52.5563 15.382 52.0283 15.0887 51.405 14.854C50.7817 14.6193 50.0887 14.3993 49.326 14.194C48.7393 14.0473 48.2223 13.908 47.775 13.776C47.3277 13.644 46.9573 13.4973 46.664 13.336C46.3707 13.1747 46.147 12.9877 45.993 12.775C45.839 12.5623 45.762 12.2947 45.762 11.972C45.762 11.4147 45.9673 10.982 46.378 10.674C46.7887 10.366 47.412 10.212 48.248 10.212C48.7173 10.212 49.1793 10.2707 49.634 10.388C50.0887 10.5053 50.5103 10.6483 50.899 10.817C51.2877 10.9857 51.6177 11.158 51.889 11.334C52.1603 11.51 52.3473 11.6493 52.45 11.752L53.792 9.288C53.1027 8.81867 52.296 8.41167 51.372 8.067C50.448 7.72233 49.436 7.55 48.336 7.55C47.544 7.55 46.8033 7.65633 46.114 7.869C45.4247 8.08167 44.8197 8.39333 44.299 8.804C43.7783 9.21467 43.3713 9.728 43.078 10.344C42.7847 10.96 42.638 11.664 42.638 12.456C42.638 13.0573 42.7297 13.5743 42.913 14.007C43.0963 14.4397 43.3713 14.821 43.738 15.151C44.1047 15.481 44.563 15.767 45.113 16.009C45.663 16.251 46.312 16.4747 47.06 16.68C47.676 16.856 48.2333 17.0173 48.732 17.164C49.2307 17.3107 49.656 17.472 50.008 17.648C50.36 17.824 50.6313 18.0293 50.822 18.264C51.0127 18.4987 51.108 18.7847 51.108 19.122C51.108 20.1927 50.272 20.728 48.6 20.728C47.9987 20.728 47.412 20.6547 46.84 20.508C46.268 20.3613 45.7473 20.1817 45.278 19.969C44.8087 19.7563 44.4017 19.5437 44.057 19.331C43.7123 19.1183 43.474 18.946 43.342 18.814L42 21.432C42.9093 22.0773 43.936 22.576 45.08 22.928C46.224 23.28 47.3827 23.456 48.556 23.456ZM62.262 23.28L64.22 18.22L66.2 23.28H68.62L73.438 11.752H70.644L67.212 20.508L65.826 16.768L67.828 11.774H65.452L64.22 15.316L63.01 11.774H60.634L62.658 16.768L61.25 20.508L57.818 11.752H55.046L59.842 23.28H62.262ZM77.75 23.28V11.752H74.802V23.28H77.75ZM92.204 23.478C92.8347 23.478 93.436 23.39 94.008 23.214C94.58 23.038 95.064 22.862 95.46 22.686L94.866 20.354C94.69 20.4273 94.4553 20.5153 94.162 20.618C93.8687 20.7207 93.568 20.772 93.26 20.772C92.952 20.772 92.6917 20.6877 92.479 20.519C92.2663 20.3503 92.16 20.0607 92.16 19.65V14.018H94.58V11.752H92.16V8.012H89.212V11.752H87.694V14.018H89.212V20.64C89.212 21.1533 89.2927 21.5897 89.454 21.949C89.6153 22.3083 89.8317 22.6017 90.103 22.829C90.3743 23.0563 90.6897 23.2213 91.049 23.324C91.4083 23.4267 91.7933 23.478 92.204 23.478ZM101.322 18.044V23.28H98.286V7.66H104.908C105.627 7.66 106.29 7.81033 106.899 8.111C107.508 8.41167 108.032 8.80767 108.472 9.299C108.912 9.79033 109.257 10.3477 109.506 10.971C109.755 11.5943 109.88 12.2213 109.88 12.852C109.88 13.512 109.763 14.1537 109.528 14.777C109.293 15.4003 108.963 15.954 108.538 16.438C108.113 16.922 107.599 17.3107 106.998 17.604C106.397 17.8973 105.737 18.044 105.018 18.044H101.322ZM104.842 15.382H101.322V10.322H104.71C104.974 10.322 105.234 10.377 105.491 10.487C105.748 10.597 105.971 10.762 106.162 10.982C106.353 11.202 106.507 11.4697 106.624 11.785C106.741 12.1003 106.8 12.456 106.8 12.852C106.8 13.6293 106.613 14.2453 106.239 14.7C105.865 15.1547 105.399 15.382 104.842 15.382Z" fill="#191919"/>
    </svg>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [kybId, setKybId] = useState<number | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched((t) => ({ ...t, [field]: true }));
    const partial = registerSchema.pick({ [field]: true } as any);
    const res = partial.safeParse({ [field]: form[field] });
    if (!res.success) {
      setErrors((e) => ({ ...e, [field]: res.error.issues[0]?.message }));
    } else {
      setErrors((e) => ({ ...e, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched: Record<string, boolean> = {};
    (Object.keys(INITIAL_FORM) as (keyof FormData)[]).forEach((k) => (allTouched[k] = true));
    setTouched(allTouched);

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
        setErrors({ general: data?.detail ?? 'Registration failed. Please try again.' });
      } else {
        setSuccess(true);
        setKybId(data.kyb_id ?? null);
      }
    } catch (err: unknown) {
      setErrors({ general: err instanceof Error ? err.message : 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

        .reg-page {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #fff;
          min-height: 100vh;
          color: #191919;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Nav ── */
        .reg-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #fcfbf8;
          border-bottom: 1px solid #e9e9e9;
          padding: 0 40px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .reg-nav__links {
          display: flex;
          align-items: center;
          gap: 32px;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .reg-nav__links a {
          color: #191919;
          font-size: 15px;
          font-weight: 400;
          text-decoration: none;
          transition: color 0.2s;
        }
        .reg-nav__links a:hover { color: #ffa672; }
        .reg-nav__btn {
          background: #191919;
          color: #fff;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          border: none;
          border-radius: 8px;
          padding: 10px 22px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s;
        }
        .reg-nav__btn:hover { background: #333; }

        /* ── Page header ── */
        .reg-header-section {
          background: #fcfbf8;
          border-bottom: 1px solid #e9e9e9;
          padding: 56px 40px 48px;
          text-align: center;
        }
        .reg-header-section h1 {
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 500;
          letter-spacing: -1.5px;
          color: #191919;
          margin: 0 0 12px;
        }
        .reg-header-section p {
          font-size: 17px;
          color: #535353;
          font-weight: 300;
          margin: 0;
        }

        /* ── Content wrapper ── */
        .reg-wrapper {
          max-width: 720px;
          margin: 0 auto;
          padding: 56px 40px 80px;
        }

        /* ── Form card ── */
        .reg-card {
          background: #fff;
          border: 1px solid #e9e9e9;
          border-radius: 16px;
          padding: 40px;
        }

        /* ── Field groups ── */
        .reg-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 600px) {
          .reg-grid-2 { grid-template-columns: 1fr; }
          .reg-wrapper { padding: 32px 20px 60px; }
          .reg-card { padding: 24px 20px; }
          .reg-header-section { padding: 40px 20px 36px; }
          .reg-nav { padding: 0 20px; }
          .reg-nav__links { display: none; }
        }

        .reg-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .reg-label {
          font-size: 13px;
          font-weight: 500;
          color: #535353;
          letter-spacing: 0.1px;
        }
        .reg-label span { color: #e05c2a; }

        .reg-input {
          font-family: inherit;
          font-size: 15px;
          color: #191919;
          background: #fff;
          border: 1px solid #d0d2d6;
          border-radius: 8px;
          padding: 12px 14px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          width: 100%;
          box-sizing: border-box;
        }
        .reg-input::placeholder { color: #a3a6ad; }
        .reg-input:focus {
          border-color: #191919;
          box-shadow: 0 0 0 3px rgba(25,25,25,0.06);
        }
        .reg-input.error {
          border-color: #e05c2a;
          box-shadow: 0 0 0 3px rgba(224,92,42,0.08);
        }
        .reg-textarea {
          resize: vertical;
          min-height: 80px;
        }
        .reg-error {
          font-size: 12px;
          color: #e05c2a;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* ── Alert ── */
        .reg-alert {
          background: #fff5f0;
          border: 1px solid #ffd0b5;
          border-radius: 10px;
          padding: 14px 16px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 14px;
          color: #b34400;
          margin-bottom: 28px;
        }

        /* ── KYC notice ── */
        .reg-notice {
          background: #f6f5ff;
          border: 1px solid #ceccff;
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 13px;
          color: #461db8;
          margin-bottom: 28px;
        }

        /* ── Submit button ── */
        .reg-submit {
          width: 100%;
          background: #191919;
          color: #fff;
          font-family: inherit;
          font-size: 16px;
          font-weight: 500;
          border: none;
          border-radius: 10px;
          padding: 15px;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .reg-submit:hover:not(:disabled) { background: #333; }
        .reg-submit:active:not(:disabled) { transform: scale(0.99); }
        .reg-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Spinner ── */
        .reg-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: regSpin 0.7s linear infinite;
        }
        @keyframes regSpin { to { transform: rotate(360deg); } }

        /* ── Divider ── */
        .reg-divider {
          text-align: center;
          font-size: 13px;
          color: #a3a6ad;
          margin: 24px 0 4px;
        }

        /* ── Success ── */
        .reg-success {
          text-align: center;
          padding: 48px 40px;
        }
        .reg-success__icon {
          width: 64px;
          height: 64px;
          background: #e6fff4;
          border: 1.5px solid #0c9f5e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        .reg-success h2 {
          font-size: 26px;
          font-weight: 500;
          color: #191919;
          margin: 0 0 10px;
        }
        .reg-success p {
          font-size: 15px;
          color: #535353;
          font-weight: 300;
          line-height: 1.6;
          margin: 0 0 28px;
        }
        .reg-success__meta {
          background: #f5f5f5;
          border-radius: 10px;
          padding: 16px 20px;
          text-align: left;
          margin-bottom: 28px;
        }
        .reg-success__meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          padding: 4px 0;
        }
        .reg-success__meta-label { color: #a3a6ad; }
        .reg-success__meta-value { color: #191919; font-weight: 500; }
        .reg-success__btn {
          display: block;
          width: 100%;
          background: #191919;
          color: #fff;
          font-family: inherit;
          font-size: 15px;
          font-weight: 500;
          border: none;
          border-radius: 10px;
          padding: 14px;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          transition: background 0.2s;
        }
        .reg-success__btn:hover { background: #333; }

        /* ── Footer ── */
        .reg-footer {
          border-top: 1px solid #e9e9e9;
          padding: 28px 40px;
          text-align: center;
          font-size: 13px;
          color: #a3a6ad;
        }
        .reg-footer a { color: #535353; text-decoration: none; }
        .reg-footer a:hover { color: #191919; }

        /* ── Section divider ── */
        .reg-section-sep {
          border: none;
          border-top: 1px solid #e9e9e9;
          margin: 28px 0;
        }
      `}</style>

      <div className="reg-page">
        {/* ── Navigation ── */}
        <nav className="reg-nav">
          <Link to="/">
            <SwiftPayLogo />
          </Link>
          <ul className="reg-nav__links">
            <li><Link to="/#solutions">Solutions</Link></li>
            <li><Link to="/features">Features</Link></li>
            <li><Link to="/pricing">Pricing</Link></li>
          </ul>
          <Link to="/login" className="reg-nav__btn">Log in</Link>
        </nav>

        {/* ── Page header ── */}
        <div className="reg-header-section">
          <h1>Register merchant account</h1>
          <p>Fill in your details below to apply for a SwiftPay merchant account.</p>
        </div>

        {/* ── Main content ── */}
        <div className="reg-wrapper">
          {success ? (
            <div className="reg-card">
              <div className="reg-success">
                <div className="reg-success__icon">
                  <CheckCircle size={28} color="#0c9f5e" />
                </div>
                <h2>Application submitted!</h2>
                <p>
                  Your KYC registration has been received. Our team will review your application
                  and notify you via Telegram once approved.
                </p>
                {kybId && (
                  <div className="reg-success__meta">
                    <div className="reg-success__meta-row">
                      <span className="reg-success__meta-label">Application ID</span>
                      <span className="reg-success__meta-value">#{kybId}</span>
                    </div>
                    <div className="reg-success__meta-row">
                      <span className="reg-success__meta-label">Status</span>
                      <span style={{ color: '#cc5f0c', fontWeight: 500, fontSize: 13 }}>Pending Review</span>
                    </div>
                  </div>
                )}
                <button className="reg-success__btn" onClick={() => navigate('/login')}>
                  Back to Sign In
                </button>
              </div>
            </div>
          ) : (
            <div className="reg-card">
              {errors.general && (
                <div className="reg-alert">
                  <AlertCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} />
                  <span>{errors.general}</span>
                </div>
              )}

              <div className="reg-notice">
                🔐 &nbsp;Your information will be reviewed as part of our <strong>KYC verification process</strong>. All data is kept secure and confidential.
              </div>

              <form onSubmit={handleSubmit} noValidate>
                {/* Row 1 */}
                <div className="reg-grid-2" style={{ marginBottom: 20 }}>
                  <div className="reg-field">
                    <label className="reg-label">Full Name <span>*</span></label>
                    <input
                      type="text"
                      className={`reg-input${errors.full_name ? ' error' : ''}`}
                      value={form.full_name}
                      onChange={(e) => handleChange('full_name', e.target.value)}
                      onBlur={() => handleBlur('full_name')}
                      placeholder="Juan dela Cruz"
                    />
                    {errors.full_name && (
                      <span className="reg-error"><XIcon size={12} />{errors.full_name}</span>
                    )}
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">Email Address <span>*</span></label>
                    <input
                      type="email"
                      className={`reg-input${errors.email ? ' error' : ''}`}
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      placeholder="juan@example.com"
                    />
                    {errors.email && (
                      <span className="reg-error"><XIcon size={12} />{errors.email}</span>
                    )}
                  </div>
                </div>

                {/* Row 2 */}
                <div className="reg-grid-2" style={{ marginBottom: 20 }}>
                  <div className="reg-field">
                    <label className="reg-label">Mobile Number <span>*</span></label>
                    <input
                      type="tel"
                      className={`reg-input${errors.phone ? ' error' : ''}`}
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      onBlur={() => handleBlur('phone')}
                      placeholder="09171234567"
                    />
                    {errors.phone && (
                      <span className="reg-error"><XIcon size={12} />{errors.phone}</span>
                    )}
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">Business Name</label>
                    <input
                      type="text"
                      className={`reg-input${errors.business_name ? ' error' : ''}`}
                      value={form.business_name}
                      onChange={(e) => handleChange('business_name', e.target.value)}
                      onBlur={() => handleBlur('business_name')}
                      placeholder="Your business name"
                    />
                    {errors.business_name && (
                      <span className="reg-error"><XIcon size={12} />{errors.business_name}</span>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="reg-field" style={{ marginBottom: 20 }}>
                  <label className="reg-label">Business Address</label>
                  <textarea
                    className={`reg-input reg-textarea${errors.address ? ' error' : ''}`}
                    value={form.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    onBlur={() => handleBlur('address')}
                    placeholder="123 Main St, Makati City, Metro Manila"
                  />
                  {errors.address && (
                    <span className="reg-error"><XIcon size={12} />{errors.address}</span>
                  )}
                </div>

                {/* Telegram */}
                <div className="reg-field" style={{ marginBottom: 8 }}>
                  <label className="reg-label">Telegram Username <span>*</span></label>
                  <input
                    type="text"
                    className={`reg-input${errors.telegram_username ? ' error' : ''}`}
                    value={form.telegram_username}
                    onChange={(e) => handleChange('telegram_username', e.target.value)}
                    onBlur={() => handleBlur('telegram_username')}
                    placeholder="@yourusername"
                  />
                  {errors.telegram_username && (
                    <span className="reg-error"><XIcon size={12} />{errors.telegram_username}</span>
                  )}
                  <span style={{ fontSize: 12, color: '#a3a6ad' }}>
                    Required to link your account and receive approval notifications.
                  </span>
                </div>

                <hr className="reg-section-sep" />

                <button type="submit" className="reg-submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="reg-spinner" />
                      Submitting…
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>

                <div className="reg-divider" style={{ marginTop: 20, marginBottom: 0 }}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: '#191919', fontWeight: 500, textDecoration: 'underline' }}>
                    Sign in
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <footer className="reg-footer">
          © {new Date().getFullYear()} SwiftPay Philippines. All rights reserved.
          &nbsp;·&nbsp;
          <a href="https://swiftpay.ph/privacy-policy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          &nbsp;·&nbsp;
          <a href="https://swiftpay.ph/terms-of-service/" target="_blank" rel="noopener noreferrer">Terms of Service</a>
        </footer>
      </div>
    </>
  );
}
