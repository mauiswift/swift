import { useEffect, useRef, useState, useCallback, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ChevronRight, UserPlus } from 'lucide-react';
import type { TelegramWidgetUser } from '@/lib/auth';
import { APP_NAME, SUPPORT_URL, SUPPORT_HANDLE } from '@/lib/brand';
import { loginSchema } from '@/lib/validation';

declare global {
  interface Window { onTelegramAuth?: (user: TelegramWidgetUser) => void; }
}

/* ─── Social icons ─────────────────────────────────────────── */
function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#25D366" />
      <path d="M17.5 6.5A7.4 7.4 0 0 0 6.2 17.1L5 19l1.9-1.2a7.4 7.4 0 0 0 10.6-6.4 7.3 7.3 0 0 0-2.1-5.1-7.3 7.3 0 0 0-.9.2zm-5.3 11.4a6.1 6.1 0 0 1-3.1-.9l-.2-.1-2 .5.5-1.9-.2-.2a6.2 6.2 0 1 1 5 2.6zm3.4-4.7c-.2-.1-1-.5-1.2-.5-.2-.1-.3-.1-.4.1-.1.2-.5.5-.6.7-.1.1-.2.1-.4 0-.2-.1-.8-.3-1.5-1-.6-.5-.9-1.1-1-1.3-.1-.2 0-.3.1-.4l.3-.3.2-.3v-.3c0-.1-.4-1-.6-1.3-.1-.3-.3-.3-.4-.3h-.4c-.1 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.1 1.6 2.5 3.9 3.5.5.2.9.4 1.3.5.5.2 1 .1 1.3.1.4-.1 1.2-.5 1.4-1 .2-.5.2-.9.1-1-.1-.2-.2-.2-.4-.3z" fill="white" />
    </svg>
  );
}

function MessengerIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="url(#msgGradLogin2)" />
      <defs>
        <linearGradient id="msgGradLogin2" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00C6FF" /><stop offset="1" stopColor="#0068FF" />
        </linearGradient>
      </defs>
      <path d="M12 4C7.58 4 4 7.36 4 11.5c0 2.2 1.02 4.17 2.63 5.52V19l2.42-1.33c.64.18 1.33.28 2.04.28H12c4.42 0 8-3.36 8-7.5S16.42 4 12 4zm.79 9.78l-2.04-2.18-3.98 2.18 4.38-4.65 2.09 2.18 3.94-2.18-4.39 4.65z" fill="white" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════ */

type Step = 'email' | 'password';

export default function Login() {
  const { user, login, loginWithTelegram, loading, error } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const widgetContainerRef = useRef<HTMLDivElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [botUsername, setBotUsername] = useState<string>(
    (import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '').trim()
  );
  const [socialConfig, setSocialConfig] = useState<{ whatsapp_number: string; messenger_page_username: string } | null>(null);

  useEffect(() => {
    fetch('/api/v1/auth/social-config')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setSocialConfig(d))
      .catch(() => {});
  }, []);

  /* Focus password field when step changes */
  useEffect(() => {
    if (step === 'password') {
      setTimeout(() => passwordInputRef.current?.focus(), 50);
    }
  }, [step]);

  const handleEmailStep = (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim() || !email.includes('@')) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    setStep('password');
  };

  const handlePasswordStep = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setLocalError(result.error.issues[0]?.message || 'Please check your input.');
      return;
    }
    setSubmitting(true);
    setLocalError(null);
    try {
      if (turnstileSiteKey && !turnstileToken) {
        setLocalError('Please complete the human verification.');
        setSubmitting(false);
        return;
      }
      await login(result.data.email, result.data.password, turnstileToken ?? undefined);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTelegramAuth = useCallback(
    async (tgUser: TelegramWidgetUser) => {
      setSubmitting(true);
      setLocalError(null);
      await loginWithTelegram(tgUser, turnstileToken ?? undefined);
      setSubmitting(false);
    },
    [loginWithTelegram, turnstileToken]
  );

  useEffect(() => {
    let canceled = false;

    const resolveBotUsername = async () => {
      if (botUsername) return botUsername;
      try {
        const res = await fetch('/api/v1/auth/telegram-login-config');
        if (!res.ok) return '';
        const data = await res.json();
        const ru = (data?.bot_username || '').toString().trim();
        if (!canceled && ru) setBotUsername(ru);
        return ru;
      } catch { return ''; }
    };

    const renderWidget = async () => {
      const u = await resolveBotUsername();
      if (!u) return;
      if (turnstileSiteKey && !turnstileToken) return;
      const container = widgetContainerRef.current;
      if (!container) return;
      setLocalError(null);
      window.onTelegramAuth = handleTelegramAuth;
      container.innerHTML = '';
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://telegram.org/js/telegram-widget.js?22';
      s.setAttribute('data-telegram-login', u);
      s.setAttribute('data-size', 'large');
      s.setAttribute('data-userpic', 'false');
      s.setAttribute('data-onauth', 'onTelegramAuth(user)');
      s.setAttribute('data-request-access', 'write');
      container.appendChild(s);
    };

    renderWidget();
    const currentContainer = widgetContainerRef.current;
    return () => {
      canceled = true;
      if (currentContainer) currentContainer.innerHTML = '';
      delete window.onTelegramAuth;
    };
  }, [botUsername, handleTelegramAuth, turnstileSiteKey, turnstileToken]);

  if (user) return <Navigate to="/intro" replace />;

  /* First letter of email for the avatar chip shown on step 2 */
  const emailInitial = email ? email[0].toUpperCase() : '';

  return (
    <div className="sp-auth-root">

      {/* ── Full-screen centered layout ─────────────────────── */}
      <div className="sp-auth-outer">

        {/* Logo */}
        <div className="sp-auth-logo">
          <img
            src="https://swiftpay.ph/wp-content/themes/SwiftPay/site-assets/swiftpay-logo.svg"
            alt={APP_NAME}
            className="sp-logo-img"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="sp-logo-text">SwiftPay</span>
        </div>

        {/* Card */}
        <div className="sp-auth-card">

          {/* ── STEP 1: Email ─────────────────────────────── */}
          {step === 'email' && (
            <div className="sp-step" key="email">
              <h1 className="sp-title">Sign in</h1>
              <p className="sp-subtitle">to continue to {APP_NAME} Merchant Portal</p>

              {/* Turnstile */}
              {turnstileSiteKey && !turnstileToken && (
                <div className="sp-turnstile">
                  <p className="sp-hint">Please verify you are human</p>
                  <Turnstile siteKey={turnstileSiteKey} onSuccess={setTurnstileToken} options={{ theme: 'light' }} />
                </div>
              )}

              <form onSubmit={handleEmailStep} className="sp-form">
                <div className="sp-field">
                  <label htmlFor="sp-email" className="sp-label">Email address</label>
                  <input
                    id="sp-email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setLocalError(null); }}
                    placeholder="you@company.com"
                    className="sp-input"
                  />
                </div>

                {localError && <p className="sp-error">{localError}</p>}
                {error && <p className="sp-error">{error}</p>}

                <button
                  type="submit"
                  className="sp-btn-primary"
                  disabled={!email.trim()}
                >
                  Next <ChevronRight className="sp-btn-icon" />
                </button>
              </form>

              {/* Divider */}
              <div className="sp-divider"><span>or</span></div>

              {/* Telegram */}
              <div className="sp-tg-wrap" ref={widgetContainerRef} />

              {/* Social logins */}
              {socialConfig && (socialConfig.whatsapp_number || socialConfig.messenger_page_username) && (
                <div className="sp-social">
                  {socialConfig.whatsapp_number && (
                    <a href={`https://wa.me/${socialConfig.whatsapp_number.replace(/\D/g, '')}?text=Hi%2C+I+want+to+sign+in`}
                      target="_blank" rel="noopener noreferrer" className="sp-social-btn">
                      <WhatsAppIcon /> WhatsApp
                    </a>
                  )}
                  {socialConfig.messenger_page_username && (
                    <a href={`https://m.me/${socialConfig.messenger_page_username}`}
                      target="_blank" rel="noopener noreferrer" className="sp-social-btn">
                      <MessengerIcon /> Messenger
                    </a>
                  )}
                </div>
              )}

              {/* Register link */}
              <div className="sp-footer-links">
                <Link to="/register" className="sp-link">
                  <UserPlus size={14} /> Create account
                </Link>
                <span className="sp-sep">·</span>
                <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="sp-link">
                  Need help?
                </a>
              </div>
            </div>
          )}

          {/* ── STEP 2: Password ──────────────────────────── */}
          {step === 'password' && (
            <div className="sp-step" key="password">
              {/* Email chip — shows which account */}
              <div className="sp-account-chip">
                <span className="sp-account-avatar">{emailInitial}</span>
                <span className="sp-account-email">{email}</span>
                <button
                  type="button"
                  className="sp-account-change"
                  onClick={() => { setStep('email'); setLocalError(null); setPassword(''); }}
                  aria-label="Change account"
                >
                  <ArrowLeft size={13} />
                </button>
              </div>

              <h1 className="sp-title">Welcome back</h1>
              <p className="sp-subtitle">Enter your password to continue</p>

              {/* Turnstile */}
              {turnstileSiteKey && !turnstileToken && (
                <div className="sp-turnstile">
                  <p className="sp-hint">Please verify you are human</p>
                  <Turnstile siteKey={turnstileSiteKey} onSuccess={setTurnstileToken} options={{ theme: 'light' }} />
                </div>
              )}

              <form onSubmit={handlePasswordStep} className="sp-form">
                <div className="sp-field">
                  <label htmlFor="sp-password" className="sp-label">Password</label>
                  <input
                    id="sp-password"
                    type="password"
                    ref={passwordInputRef}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setLocalError(null); }}
                    placeholder="Enter your password"
                    className="sp-input"
                  />
                </div>

                {(localError || error) && <p className="sp-error">{localError || error}</p>}
                {loading && !submitting && <p className="sp-hint">Checking session…</p>}

                <button
                  type="submit"
                  disabled={submitting || !password || (turnstileSiteKey ? !turnstileToken : false)}
                  className="sp-btn-primary"
                >
                  {submitting
                    ? <><span className="sp-spinner" /> Signing in…</>
                    : <>Sign in <ChevronRight className="sp-btn-icon" /></>}
                </button>
              </form>

              <div className="sp-footer-links" style={{ marginTop: 16 }}>
                <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="sp-link">
                  Forgot password?
                </a>
                <span className="sp-sep">·</span>
                <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="sp-link">
                  Contact {SUPPORT_HANDLE}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Below-card links */}
        <div className="sp-below-card">
          <Link to="/" className="sp-below-link">← Back to swiftpay.ph</Link>
        </div>
      </div>

      {/* ── Compliance footer ───────────────────────────────── */}
      <footer className="sp-auth-footer">
        <div className="sp-footer-badges">
          {[
            { src: '/logos/bsp.svg', alt: 'BSP Regulated'     },
            { src: '/logos/pci.svg', alt: 'PCI DSS Compliant' },
            { src: '/logos/dpo.svg', alt: 'NPC / DPO'         },
          ].map(({ src, alt }) => (
            <img key={alt} src={src} alt={alt} className="sp-footer-badge" />
          ))}
        </div>
        <p className="sp-footer-text">
          © {new Date().getFullYear()} SwiftPay Philippines · Regulated by BSP · PCI DSS Compliant
        </p>
      </footer>

      <style>{`
        .sp-auth-root {
          min-height: 100vh;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .sp-auth-outer {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px 24px;
        }
        .sp-auth-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }
        .sp-logo-img { height: 26px; width: auto; }
        .sp-logo-text {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.025em;
        }
        .sp-auth-card {
          width: 100%;
          max-width: 400px;
          background: #fff;
          border: 1px solid #e6e6e6;
          border-radius: 16px;
          padding: 36px 32px;
          box-shadow: 0 1px 2px rgba(20,20,20,.04), 0 8px 24px rgba(20,20,20,.06);
        }
        .sp-step {
          animation: spStepIn 0.22s cubic-bezier(.16,1,.3,1) both;
        }
        @keyframes spStepIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: none; }
        }

        /* Account chip (step 2) */
        .sp-account-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #e6e6e6;
          border-radius: 999px;
          padding: 5px 10px 5px 6px;
          margin-bottom: 20px;
          background: #fafafa;
        }
        .sp-account-avatar {
          width: 24px; height: 24px;
          border-radius: 50%;
          background: #1a1a1a;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sp-account-email {
          font-size: 13px;
          font-weight: 600;
          color: #1a1a1a;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sp-account-change {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          color: #6f6f6f;
          padding: 2px;
          border-radius: 50%;
          transition: color .15s;
        }
        .sp-account-change:hover { color: #1a1a1a; }

        /* Headings */
        .sp-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.025em;
          margin-bottom: 4px;
          line-height: 1.1;
        }
        .sp-subtitle {
          font-size: 0.875rem;
          color: #6f6f6f;
          margin-bottom: 24px;
          line-height: 1.5;
        }

        /* Form */
        .sp-form { display: flex; flex-direction: column; gap: 0; }
        .sp-field { margin-bottom: 12px; }
        .sp-label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 6px;
        }
        .sp-input {
          width: 100%;
          border: 1px solid #e6e6e6;
          border-radius: 8px;
          padding: 11px 14px;
          font-size: 0.9375rem;
          color: #1a1a1a;
          background: #fff;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
          font-family: inherit;
        }
        .sp-input:focus {
          border-color: #1a1a1a;
          box-shadow: 0 0 0 3px rgba(26,26,26,.08);
        }
        .sp-input::placeholder { color: #b0b0b0; }

        .sp-error {
          font-size: 0.8125rem;
          color: #c0392b;
          margin-bottom: 10px;
          background: #fff5f5;
          border: 1px solid #fdd;
          border-radius: 8px;
          padding: 8px 12px;
        }
        .sp-hint {
          font-size: 0.8125rem;
          color: #9a9a9a;
          margin-bottom: 8px;
          text-align: center;
        }

        /* Primary button */
        .sp-btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          background: #1a1a1a;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          transition: background .15s, transform .1s;
          font-family: inherit;
          margin-top: 4px;
        }
        .sp-btn-primary:hover:not(:disabled) { background: #2c2c2c; }
        .sp-btn-primary:active:not(:disabled) { transform: scale(.99); }
        .sp-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
        .sp-btn-icon { width: 15px; height: 15px; flex-shrink: 0; }

        /* Spinner */
        .sp-spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spSpin .65s linear infinite;
        }
        @keyframes spSpin { to { transform: rotate(360deg); } }

        /* Divider */
        .sp-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 20px 0;
          color: #b0b0b0;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .sp-divider::before,
        .sp-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e6e6e6;
        }

        /* Telegram widget wrapper */
        .sp-tg-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 4px;
        }

        /* Social buttons */
        .sp-social { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
        .sp-social-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          border: 1px solid #e6e6e6;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1a1a1a;
          background: #fff;
          cursor: pointer;
          text-decoration: none;
          transition: background .15s, border-color .15s;
          font-family: inherit;
        }
        .sp-social-btn:hover { background: #fafafa; border-color: #c8c8c8; }

        /* Turnstile wrapper */
        .sp-turnstile { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 16px; }

        /* Footer links (below form) */
        .sp-footer-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        .sp-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #535353;
          text-decoration: none;
          transition: color .15s;
        }
        .sp-link:hover { color: #1a1a1a; }
        .sp-sep { color: #d0d0d0; font-size: 0.75rem; }

        /* Below card */
        .sp-below-card { margin-top: 20px; }
        .sp-below-link {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #9a9a9a;
          text-decoration: none;
          transition: color .15s;
        }
        .sp-below-link:hover { color: #1a1a1a; }

        /* Compliance footer */
        .sp-auth-footer {
          border-top: 1px solid #f2f2f2;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          background: #fafafa;
        }
        .sp-footer-badges {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .sp-footer-badge {
          height: 24px;
          width: auto;
          filter: grayscale(1);
          opacity: 0.4;
        }
        .sp-footer-text {
          font-size: 0.6875rem;
          color: #b0b0b0;
          font-weight: 600;
          letter-spacing: 0.03em;
          text-align: center;
        }

        @media (max-width: 480px) {
          .sp-auth-card { padding: 28px 20px; border-radius: 12px; }
          .sp-title { font-size: 1.25rem; }
        }
      `}</style>
    </div>
  );
}
