import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/auth';
import { SUPPORT_URL } from '@/lib/brand';
import { loginSchema } from '@/lib/validation';
import TelegramLoginWidget from '@/components/TelegramLoginWidget';
import BrandLogo from '@/components/BrandLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Fingerprint, ShieldCheck } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, string>) => void;
        };
      };
    };
  }
}

function SwiftPayLogo({ height = 28 }: { height?: number }) {
  return (
    <BrandLogo
      src="/swiftpay-logo-black.svg"
      className={height === 48 ? 'h-12' : 'h-7'}
    />
  );
}

type Step = 'email' | 'password';

export default function Login() {
  const { user, login, loginWithTelegram, loginWithGoogle, loading, error, platformBranding } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const configuredTelegramBot = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined)?.replace(/^@/, '').trim();
  const [telegramBotUsername, setTelegramBotUsername] = useState(configuredTelegramBot || '');
  const passwordRef = useRef<HTMLInputElement>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();
  const verificationRequired = Boolean(turnstileSiteKey && !turnstileToken);

  const handleTurnstileSuccess = (token: string) => {
    setTurnstileError(false);
    setTurnstileToken(token);
  };

  useEffect(() => {
    if (location.state?.sessionExpired) {
      toast.error('Your session expired due to inactivity. Please log in again.');
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (step === 'password') setTimeout(() => passwordRef.current?.focus(), 40);
  }, [step]);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;
    const renderGoogleButton = () => {
      if (!window.google?.accounts.id || !googleButtonRef.current) return;
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: ({ credential }) => {
          setLocalError(null);
          void loginWithGoogle(credential, turnstileToken);
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: '380',
        text: 'continue_with',
        shape: 'rectangular',
      });
    };

    if (window.google?.accounts.id) {
      renderGoogleButton();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    const script = existingScript || document.createElement('script');
    if (!existingScript) {
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', renderGoogleButton, { once: true });
    return () => script.removeEventListener('load', renderGoogleButton);
  }, [googleClientId, loginWithGoogle, turnstileToken]);

  useEffect(() => {
    if (configuredTelegramBot) return;
    let cancelled = false;
    fetch('/api/v1/auth/telegram-login-config')
      .then(async (response) => {
        if (!response.ok) throw new Error('Telegram login is not configured');
        return response.json();
      })
      .then((data) => {
        if (!cancelled && data?.bot_username) {
          setTelegramBotUsername(String(data.bot_username).replace(/^@/, '').trim());
        }
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [configuredTelegramBot]);

  if (user) return <Navigate to={user.must_change_password ? '/change-password' : '/dashboard'} replace />;

  const handleEmailStep = (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setLocalError(t('enter_valid_email'));
      return;
    }
    setStep('password');
  };

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    setLocalError(null);
    try {
      await authApi.loginWithPasskey();
      window.location.assign('/dashboard');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Passkey login failed');
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handlePasswordStep = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setLocalError(result.error.issues[0]?.message || t('please_check_input'));
      return;
    }
    setSubmitting(true);
    setLocalError(null);
    try {
      if (turnstileSiteKey && !turnstileToken) {
        setLocalError(t('complete_verification'));
        setSubmitting(false);
        return;
      }
      await login(result.data.email, result.data.password, turnstileToken ?? undefined);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('login_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        :root {
          --auth-bg: #f9f9f9;
          --auth-card: #ffffff;
          --text-100: #1a1a1a;
          --text-200: #666666;
          --border-color: #e2e2e2;
          --link-color: #5b6ea3;
        }

        .ak-page {
          min-height: 100vh;
          background-color: var(--auth-bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: "DM Sans", sans-serif;
        }

        .ak-card {
          background-color: var(--auth-card);
          width: 100%;
          max-width: 800px;
          min-height: 480px;
          padding: 48px 64px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .ak-main {
          width: 100%;
          max-width: 380px;
          margin: 40px auto 0;
          text-align: center;
        }

        .ak-login-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .ak-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-100);
          margin-bottom: 24px;
          letter-spacing: -0.01em;
          line-height: 1.1;
        }

        .ak-subtitle {
          font-size: 1rem;
          color: var(--text-200);
          margin-bottom: 28px;
          line-height: 1.5;
        }

        .ak-form-item {
          margin-bottom: 18px;
          text-align: left;
        }

        .ak-label {
          display: block;
          font-size: 15px;
          font-weight: 700;
          color: var(--text-100);
          margin-bottom: 8px;
        }

        .ak-label .req {
          color: #ef4444;
          margin-left: 4px;
        }

        .ak-input {
          width: 100%;
          border: 1px solid var(--border-color);
          padding: 12px 14px;
          font-size: 15px;
          border-radius: 4px;
          outline: none;
          transition: border-color 0.2s;
          color: var(--text-100);
          background: #fff;
        }

        .ak-input::placeholder {
          font-style: italic;
          color: #999;
        }

        .ak-input:focus {
          border-color: var(--text-100);
        }

        .ak-btn-primary {
          width: 100%;
          background-color: #1a1a1a;
          color: #ffffff;
          border: none;
          padding: 16px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.15s;
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .ak-btn-secondary {
          width: 100%;
          margin-top: 12px;
          background: #ffffff;
          color: #1a1a1a;
          border: 1px solid var(--border-color);
          padding: 14px;
          border-radius: 4px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .ak-passkey-icon {
          display: inline-flex;
          width: 28px;
          height: 28px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #f1f3f6;
          color: #1a1a1a;
        }

        .ak-btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ak-btn-primary:hover {
          background-color: #000;
        }

        .ak-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ak-forgot {
          display: inline-block;
          margin-top: 36px;
          font-size: 15px;
          color: var(--link-color);
          font-weight: 500;
          text-decoration: none;
        }

        .ak-forgot:hover {
          text-decoration: underline;
        }

        .ak-telegram-login {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid #eceef2;
        }

        .ak-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
          color: #8b929d;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .ak-divider::before,
        .ak-divider::after {
          content: '';
          height: 1px;
          flex: 1;
          background: #eceef2;
        }

        .ak-telegram-widget {
          display: flex;
          min-height: 44px;
          width: 100%;
          align-items: center;
          justify-content: center;
        }

        .ak-error-box {
          font-size: 14px;
          color: #b30745;
          background-color: #fff5f5;
          border: 1px solid #feb3ce;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 24px;
          font-weight: 600;
        }

        .ak-identity-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 32px;
          background: #f8f9fc;
          padding: 8px 12px;
          border-radius: 6px;
        }

        .ak-identity-text {
          font-size: 15px;
          color: #363f72;
          font-weight: 700;
        }

        .ak-identity-btn {
          background: none;
          border: none;
          color: var(--text-200);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .ak-footer {
          margin-top: 60px;
          display: flex;
          justify-content: center;
          gap: 40px;
        }

        .ak-footer-item {
          font-size: 13px;
          color: #94a3b8;
          text-decoration: none;
          font-weight: 500;
        }

        .ak-footer-item:hover {
          color: #64748b;
        }

        .ak-load-spin {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .ak-verification-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(15, 23, 42, 0.72);
          backdrop-filter: blur(8px);
        }

        .ak-verification-dialog {
          width: 100%;
          max-width: 420px;
          padding: 32px 28px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3);
          text-align: center;
        }

        .ak-verification-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          border-radius: 14px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .ak-verification-dialog h2 {
          margin: 0;
          color: #111827;
          font-size: 20px;
          font-weight: 750;
        }

        .ak-verification-dialog p {
          margin: 10px auto 22px;
          max-width: 320px;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
        }

        .ak-verification-widget {
          display: flex;
          min-height: 66px;
          align-items: center;
          justify-content: center;
        }

        .ak-verification-error {
          margin-top: 16px;
          color: #b91c1c;
          font-size: 13px;
          font-weight: 600;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .ak-card {
            padding: 40px 24px;
          }
          .ak-main {
            margin-top: 0;
          }
        }
      `}</style>

      <div className="ak-page">
        {turnstileSiteKey && verificationRequired && (
          <div className="ak-verification-backdrop" role="presentation">
            <section
              className="ak-verification-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="turnstile-title"
              aria-describedby="turnstile-description"
            >
              <div className="ak-verification-icon" aria-hidden="true"><ShieldCheck size={24} /></div>
              <h2 id="turnstile-title">Verify before continuing</h2>
              <p id="turnstile-description">
                Please complete the security check below. Login will become available after verification finishes.
              </p>
              <div className="ak-verification-widget">
                <Turnstile
                  siteKey={turnstileSiteKey}
                  onSuccess={handleTurnstileSuccess}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => {
                    setTurnstileToken(null);
                    setTurnstileError(true);
                  }}
                  options={{ theme: 'light' }}
                />
              </div>
              {turnstileError && (
                <p className="ak-verification-error" role="alert">
                  Verification could not be completed. Please try again.
                </p>
              )}
            </section>
          </div>
        )}
        <div className="ak-card">
          <div className="ak-main">
            {/* ── STEP 1: Email ──────────────────────────── */}
            {step === 'email' && (
              <div className="ak-step">
                <div className="ak-login-logo" aria-label="SwiftPay">
                  <SwiftPayLogo height={48} />
                </div>
                <p className="ak-subtitle">
                  {t('login_to_continue').replace('{brand}', platformBranding?.name || 'SwiftPay')}
                </p>

                <form onSubmit={handleEmailStep}>
                  <div className="ak-form-item">
                    <label htmlFor="ak-email" className="ak-label">
                      {t('email_label')}<span className="req">*</span>
                    </label>
                    <input
                      id="ak-email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setLocalError(null); }}
                      placeholder={t('email_placeholder')}
                      className="ak-input"
                    />
                  </div>

                  {localError && <div className="ak-error-box">{localError}</div>}
                  {error && <div className="ak-error-box">{error}</div>}

                  <button
                    type="submit"
                    className="ak-btn-primary"
                  >
                    {t('login_button')}
                  </button>
                </form>

                <button type="button" className="ak-btn-secondary" onClick={handlePasskeyLogin} disabled={passkeyLoading}>
                  <span className="ak-passkey-icon" aria-hidden="true">
                    <Fingerprint size={17} strokeWidth={2} />
                  </span>
                  {passkeyLoading ? 'Waiting for passkey…' : 'Sign in with passkey'}
                </button>

                {googleClientId && (
                  <div className="ak-google-login" aria-label="Continue with Google">
                    <div className="ak-divider"><span>or continue with</span></div>
                    <div ref={googleButtonRef} />
                  </div>
                )}

                <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="ak-forgot">
                  {t('forgot_password')}
                </a>

                {telegramBotUsername && (
                  <div className="ak-telegram-login">
                    <div className="ak-divider"><span>{t('or_continue_with')}</span></div>
                    <div className="ak-telegram-widget" aria-label={t('sign_in_with_telegram')}>
                      <TelegramLoginWidget
                        botName={telegramBotUsername}
                        onAuth={async (telegramUser) => {
                          setLocalError(null);
                          await loginWithTelegram(telegramUser, turnstileToken);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2: Password ───────────────────────── */}
            {step === 'password' && (
              <div className="ak-step">
                <div className="ak-login-logo" aria-label="SwiftPay">
                  <SwiftPayLogo height={48} />
                </div>

                <div className="ak-identity-row">
                  <span className="ak-identity-text">{email}</span>
                  <button
                    type="button"
                    className="ak-identity-btn"
                    onClick={() => { setStep('email'); setLocalError(null); setPassword(''); }}
                  >
                    {t('change')}
                  </button>
                </div>

                <form onSubmit={handlePasswordStep}>
                  <div className="ak-form-item">
                    <label htmlFor="ak-password" className="ak-label">
                      {t('password_label')}<span className="req">*</span>
                    </label>
                    <input
                      id="ak-password"
                      type="password"
                      ref={passwordRef}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setLocalError(null); }}
                      placeholder={t('password_placeholder')}
                      className="ak-input"
                    />
                  </div>

                  {(localError || error) && <div className="ak-error-box">{localError || error}</div>}

                  <button
                    type="submit"
                    className="ak-btn-primary"
                  >
                    {submitting
                      ? <><span className="ak-load-spin" /> {t('signing_in')}</>
                      : t('login_button')}
                  </button>
                </form>

                <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="ak-forgot">
                  {t('forgot_password')}
                </a>
              </div>
            )}
          </div>
        </div>

        <footer className="ak-footer">
          <Link to="/terms-of-service" className="ak-footer-item">{t('terms_of_use')}</Link>
          <Link to="/privacy-policy" className="ak-footer-item">{t('privacy_policy')}</Link>
          <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="ak-footer-item">{t('contact_us')}</a>
        </footer>
      </div>
    </>
  );
}
