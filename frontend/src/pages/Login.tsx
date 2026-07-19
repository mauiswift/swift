import { useEffect, useRef, useState, useCallback, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '@/contexts/AuthContext';
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
      <circle cx="12" cy="12" r="12" fill="url(#msgG)" />
      <defs>
        <linearGradient id="msgG" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
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
  const passwordRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    if (step === 'password') setTimeout(() => passwordRef.current?.focus(), 40);
  }, [step]);

  const handleEmailStep = (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
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
        setLocalError('Please complete the verification.');
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
    const cc = widgetContainerRef.current;
    return () => { canceled = true; if (cc) cc.innerHTML = ''; delete window.onTelegramAuth; };
  }, [botUsername, handleTelegramAuth, turnstileSiteKey, turnstileToken]);

  if (user) return <Navigate to="/intro" replace />;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; }
        .ak-root {
          min-height: 100vh;
          background: #f0f0ee;
          display: flex;
          flex-direction: column;
          font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .ak-body {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px;
        }
        .ak-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 8px 32px rgba(0,0,0,.07);
          width: 100%;
          max-width: 720px;
          padding: 48px 56px 48px;
          position: relative;
        }
        /* Logo — top-left of card */
        .ak-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 40px;
        }
        .ak-logo-dots {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3.5px;
        }
        .ak-logo-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #1a1a1a;
        }
        .ak-logo-text {
          font-size: 1.2rem;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.02em;
        }
        /* Centered content */
        .ak-content {
          max-width: 340px;
          margin: 0 auto;
        }
        .ak-step {
          animation: akIn 0.2s cubic-bezier(.16,1,.3,1) both;
        }
        @keyframes akIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }
        .ak-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
          text-align: center;
          margin-bottom: 8px;
          letter-spacing: -0.015em;
        }
        .ak-subtitle {
          font-size: 0.875rem;
          color: #6b6b6b;
          text-align: center;
          margin-bottom: 28px;
          line-height: 1.5;
        }
        .ak-subtitle .ak-login-link {
          color: #c2410c;
          font-weight: 600;
          cursor: default;
        }
        /* Email chip (step 2) */
        .ak-email-chip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .ak-email-chip span {
          font-size: 0.875rem;
          color: #6b6b6b;
        }
        .ak-email-chip button {
          background: none; border: none; cursor: pointer;
          font-size: 0.8125rem; color: #c2410c; font-weight: 600;
          padding: 0; font-family: inherit;
        }
        .ak-email-chip button:hover { text-decoration: underline; }
        /* Form */
        .ak-form { display: flex; flex-direction: column; gap: 0; }
        .ak-field { margin-bottom: 20px; }
        .ak-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #1a1a1a;
          margin-bottom: 6px;
        }
        .ak-label .ak-req { color: #e53e3e; margin-left: 2px; }
        .ak-input {
          width: 100%;
          border: 1px solid #d4d4d4;
          border-radius: 6px;
          padding: 10px 13px;
          font-size: 0.9375rem;
          color: #1a1a1a;
          background: #fff;
          outline: none;
          font-family: inherit;
          transition: border-color .15s, box-shadow .15s;
        }
        .ak-input:focus {
          border-color: #a0a0a0;
          box-shadow: 0 0 0 3px rgba(0,0,0,.07);
        }
        .ak-input::placeholder { color: #b8b8b8; }
        /* Error */
        .ak-error {
          font-size: 0.8125rem;
          color: #c0392b;
          background: #fff5f5;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 14px;
          text-align: center;
        }
        /* Log in button */
        .ak-btn {
          width: 100%;
          background: #1a1a1a;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 12px;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          letter-spacing: 0.01em;
          transition: background .15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .ak-btn:hover:not(:disabled) { background: #2c2c2c; }
        .ak-btn:disabled { opacity: .55; cursor: not-allowed; }
        .ak-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: akSpin .6s linear infinite;
        }
        @keyframes akSpin { to { transform: rotate(360deg); } }
        /* Forgot password */
        .ak-forgot {
          display: block;
          text-align: center;
          margin-top: 20px;
          font-size: 0.875rem;
          color: #4f6ef7;
          font-weight: 500;
          text-decoration: none;
          transition: color .15s;
        }
        .ak-forgot:hover { color: #3b5bdb; text-decoration: underline; }
        /* Divider */
        .ak-divider {
          display: flex; align-items: center; gap: 10px;
          margin: 20px 0;
          color: #c0c0c0; font-size: 0.75rem; font-weight: 600;
        }
        .ak-divider::before, .ak-divider::after {
          content: ''; flex: 1; height: 1px; background: #ebebeb;
        }
        /* Telegram / social */
        .ak-tg-wrap { display: flex; justify-content: center; margin-bottom: 4px; }
        .ak-social { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
        .ak-social-btn {
          display: flex; align-items: center; gap: 10px;
          width: 100%; border: 1px solid #e0e0e0; border-radius: 6px;
          padding: 10px 14px; font-size: 0.875rem; font-weight: 600;
          color: #1a1a1a; background: #fff; cursor: pointer;
          text-decoration: none; transition: background .15s, border-color .15s;
          font-family: inherit;
        }
        .ak-social-btn:hover { background: #fafafa; border-color: #c0c0c0; }
        /* Turnstile */
        .ak-turnstile { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-bottom: 14px; }
        .ak-turnstile p { font-size: 0.8125rem; color: #9a9a9a; }
        /* Register + support */
        .ak-sub-links {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; margin-top: 16px; flex-wrap: wrap;
        }
        .ak-sub-link {
          font-size: 0.8125rem; font-weight: 500; color: #6b6b6b;
          text-decoration: none; transition: color .15s;
        }
        .ak-sub-link:hover { color: #1a1a1a; }
        .ak-sub-sep { color: #d0d0d0; font-size: 0.75rem; }
        /* Footer */
        .ak-footer {
          padding: 20px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
        }
        .ak-footer-link {
          font-size: 0.8125rem;
          color: #9a9a9a;
          text-decoration: none;
          transition: color .15s;
          font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
        }
        .ak-footer-link:hover { color: #535353; }

        @media (max-width: 640px) {
          .ak-card { padding: 32px 24px; border-radius: 8px; }
          .ak-logo { margin-bottom: 28px; }
        }
      `}</style>

      <div className="ak-root">
        <div className="ak-body">
          <div className="ak-card">

            {/* Logo — top-left */}
            <div className="ak-logo">
              <div className="ak-logo-dots">
                {[0,1,2,3,4,5].map(i => <div key={i} className="ak-logo-dot" />)}
              </div>
              <span className="ak-logo-text">{APP_NAME}</span>
            </div>

            {/* Centered form content */}
            <div className="ak-content">

              {/* ── STEP 1: Email ──────────────────────── */}
              {step === 'email' && (
                <div className="ak-step">
                  <h1 className="ak-title">Welcome to {APP_NAME}</h1>
                  <p className="ak-subtitle">
                    <span className="ak-login-link">Login</span> to continue to {APP_NAME}.
                  </p>

                  {turnstileSiteKey && !turnstileToken && (
                    <div className="ak-turnstile">
                      <p>Please verify you are human</p>
                      <Turnstile siteKey={turnstileSiteKey} onSuccess={setTurnstileToken} options={{ theme: 'light' }} />
                    </div>
                  )}

                  <form onSubmit={handleEmailStep} className="ak-form">
                    <div className="ak-field">
                      <label htmlFor="ak-email" className="ak-label">
                        Email <span className="ak-req">*</span>
                      </label>
                      <input
                        id="ak-email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setLocalError(null); }}
                        placeholder="Email"
                        className="ak-input"
                      />
                    </div>

                    {localError && <div className="ak-error">{localError}</div>}
                    {error && <div className="ak-error">{error}</div>}

                    <button
                      type="submit"
                      className="ak-btn"
                      disabled={!email.trim()}
                    >
                      Log in
                    </button>
                  </form>

                  {/* Telegram SSO */}
                  <div className="ak-divider"><span>or continue with</span></div>
                  <div className="ak-tg-wrap" ref={widgetContainerRef} />

                  {/* WhatsApp / Messenger */}
                  {socialConfig && (socialConfig.whatsapp_number || socialConfig.messenger_page_username) && (
                    <div className="ak-social">
                      {socialConfig.whatsapp_number && (
                        <a href={`https://wa.me/${socialConfig.whatsapp_number.replace(/\D/g, '')}?text=Hi%2C+I+want+to+sign+in`}
                          target="_blank" rel="noopener noreferrer" className="ak-social-btn">
                          <WhatsAppIcon /> WhatsApp
                        </a>
                      )}
                      {socialConfig.messenger_page_username && (
                        <a href={`https://m.me/${socialConfig.messenger_page_username}`}
                          target="_blank" rel="noopener noreferrer" className="ak-social-btn">
                          <MessengerIcon /> Messenger
                        </a>
                      )}
                    </div>
                  )}

                  <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="ak-forgot">
                    Forgot password?
                  </a>

                  <div className="ak-sub-links">
                    <Link to="/register" className="ak-sub-link">Create account</Link>
                    <span className="ak-sub-sep">·</span>
                    <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="ak-sub-link">
                      Contact {SUPPORT_HANDLE}
                    </a>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Password ───────────────────── */}
              {step === 'password' && (
                <div className="ak-step">
                  <h1 className="ak-title">Welcome back</h1>
                  <div className="ak-email-chip">
                    <span>{email}</span>
                    <button type="button" onClick={() => { setStep('email'); setLocalError(null); setPassword(''); }}>
                      Change
                    </button>
                  </div>

                  {turnstileSiteKey && !turnstileToken && (
                    <div className="ak-turnstile">
                      <p>Please verify you are human</p>
                      <Turnstile siteKey={turnstileSiteKey} onSuccess={setTurnstileToken} options={{ theme: 'light' }} />
                    </div>
                  )}

                  <form onSubmit={handlePasswordStep} className="ak-form">
                    <div className="ak-field">
                      <label htmlFor="ak-password" className="ak-label">
                        Password <span className="ak-req">*</span>
                      </label>
                      <input
                        id="ak-password"
                        type="password"
                        ref={passwordRef}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setLocalError(null); }}
                        placeholder="Password"
                        className="ak-input"
                      />
                    </div>

                    {(localError || error) && <div className="ak-error">{localError || error}</div>}
                    {loading && !submitting && <p style={{ fontSize: '0.8125rem', color: '#9a9a9a', textAlign: 'center', marginBottom: 12 }}>Checking session…</p>}

                    <button
                      type="submit"
                      disabled={submitting || !password || (turnstileSiteKey ? !turnstileToken : false)}
                      className="ak-btn"
                    >
                      {submitting ? <><span className="ak-spinner" /> Signing in…</> : 'Log in'}
                    </button>
                  </form>

                  <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="ak-forgot">
                    Forgot password?
                  </a>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="ak-footer">
          <Link to="/privacy" className="ak-footer-link">Privacy policy</Link>
          <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="ak-footer-link">Contact us</a>
          <Link to="/" className="ak-footer-link">← swiftpay.ph</Link>
        </footer>
      </div>
    </>
  );
}
