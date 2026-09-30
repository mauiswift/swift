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

function AuthLogo({
  height = 28,
  logoUrl,
  name,
}: {
  height?: number;
  logoUrl?: string | null;
  name?: string | null;
}) {
  return (
    <BrandLogo
      src={logoUrl || '/swiftpay-logo-black.svg'}
      alt={name || 'SwiftPay'}
      className={height === 48 ? 'h-12' : 'h-7'}
    />
  );
}

type Step = 'email' | 'password';

export default function Login() {
  const { user, login, loginWithTelegram, loginWithGoogle, loading, error, platformBranding } = useAuth();
  const { t, language } = useLanguage();
  const isKorean = language === 'ko';
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
  const configuredGoogleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();
  const [googleClientId, setGoogleClientId] = useState(configuredGoogleClientId || '');
  const verificationRequired = Boolean(turnstileSiteKey && !turnstileToken);

  const handleTurnstileSuccess = (token: string) => {
    setTurnstileError(false);
    setTurnstileToken(token);
  };

  useEffect(() => {
    if (location.state?.sessionExpired) {
      toast.error(isKorean ? '비활성 상태가 지속되어 세션이 만료되었습니다. 다시 로그인하세요.' : 'Your session expired due to inactivity. Please log in again.');
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [isKorean, location.pathname, location.state, navigate]);

  useEffect(() => {
    if (step === 'password') setTimeout(() => passwordRef.current?.focus(), 40);
  }, [step]);

  useEffect(() => {
    if (configuredGoogleClientId) return;
    let cancelled = false;
    fetch('/api/v1/auth/google-config')
      .then(async (response) => {
        if (!response.ok) throw new Error('Google login is not configured');
        return response.json();
      })
      .then((data) => {
        if (!cancelled && data?.client_id) {
          setGoogleClientId(String(data.client_id).trim());
        }
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [configuredGoogleClientId]);

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
        type: 'icon',
        theme: 'outline',
        size: 'medium',
        shape: 'circle',
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
      setLocalError(err instanceof Error ? err.message : (isKorean ? '패스키 로그인에 실패했습니다.' : 'Passkey login failed'));
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
          min-height: 100dvh;
          background:
            radial-gradient(circle at 50% 0%, rgba(91, 110, 163, 0.12), transparent 38%),
            var(--auth-bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: clamp(16px, 4vw, 48px);
          font-family: "DM Sans", sans-serif;
        }

        .ak-page-inner {
          width: 100%;
          flex: 1 1 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ak-card {
          background-color: var(--auth-card);
          width: 100%;
          max-width: 520px;
          padding: clamp(28px, 5vw, 52px) clamp(20px, 6vw, 64px);
          border: 1px solid rgba(226, 226, 226, 0.9);
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .ak-grid {
          display: block;
        }

        .ak-side {
          display: none;
        }

        .ak-main {
          width: 100%;
          max-width: 380px;
          margin: 0 auto;
          text-align: center;
        }

        .ak-login-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
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
          margin: 28px auto 30px;
          max-width: 340px;
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
          min-height: 52px;
          font-size: 15px;
          border-radius: 10px;
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
          box-shadow: 0 0 0 3px rgba(91, 110, 163, 0.14);
        }

        .ak-btn-primary {
          width: 100%;
          background-color: #1a1a1a;
          color: #ffffff;
          border: none;
          padding: 16px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 10px;
          cursor: pointer;
          transition: background-color 0.15s;
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 52px;
        }

        .ak-btn-secondary {
          width: 100%;
          margin-top: 12px;
          background: #ffffff;
          color: #1a1a1a;
          border: 1px solid var(--border-color);
          padding: 14px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: border-color 0.15s, background-color 0.15s, transform 0.15s;
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

        .ak-login-methods {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: stretch;
          justify-content: stretch;
          gap: 12px;
          margin-top: 16px;
        }

        .ak-login-methods .ak-btn-secondary {
          margin-top: 0;
          width: 100%;
          min-height: 52px;
        }

        .ak-google-login,
        .ak-telegram-login {
          display: flex;
          min-width: 0;
          height: 52px;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 4px 10px;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          background: #fff;
          color: #1a1a1a;
          transition: border-color 0.15s, background-color 0.15s, transform 0.15s;
          width: 100%;
        }

        .ak-google-login > div {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ak-telegram-login {
          margin: 0;
        }

        .ak-method-label {
          display: inline;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .ak-btn-secondary:hover,
        .ak-google-login:hover,
        .ak-telegram-login:hover {
          border-color: #aeb8d5;
          background: #f8f9fc;
          transform: translateY(-1px);
        }

        .ak-btn-secondary:focus-visible,
        .ak-google-login:focus-within,
        .ak-telegram-login:focus-within,
        .ak-btn-primary:focus-visible,
        .ak-forgot:focus-visible,
        .ak-identity-btn:focus-visible {
          outline: 3px solid rgba(91, 110, 163, 0.3);
          outline-offset: 2px;
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
          text-align: left;
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
          margin-top: 0;
          padding-top: 24px;
          padding-bottom: 8px;
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

        @media (min-width: 1024px) {
          .ak-card {
            max-width: 980px;
            padding: 0;
            overflow: hidden;
          }

          .ak-grid {
            display: grid;
            grid-template-columns: 1fr 460px;
            align-items: stretch;
          }

          .ak-side {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 42px 44px;
            border-right: 1px solid rgba(226, 226, 226, 0.9);
            background:
              radial-gradient(circle at 20% 10%, rgba(91, 110, 163, 0.14), transparent 45%),
              linear-gradient(180deg, rgba(248, 249, 252, 1) 0%, rgba(255, 255, 255, 1) 100%);
          }

          .ak-side-top {
            min-width: 0;
          }

          .ak-side-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 18px;
            min-width: 0;
          }

          .ak-side-brand {
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0.02em;
            color: var(--text-100);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .ak-side-title {
            font-size: 28px;
            font-weight: 850;
            color: var(--text-100);
            letter-spacing: -0.02em;
            line-height: 1.08;
            margin: 0;
            max-width: 360px;
          }

          .ak-side-sub {
            margin: 12px 0 0;
            color: var(--text-200);
            font-size: 14px;
            line-height: 1.55;
            max-width: 360px;
          }

          .ak-side-list {
            margin: 22px 0 0;
            padding: 0;
            list-style: none;
            display: grid;
            gap: 10px;
            max-width: 360px;
          }

          .ak-side-list li {
            display: flex;
            gap: 10px;
            align-items: flex-start;
            padding: 10px 12px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.75);
            border: 1px solid rgba(226, 226, 226, 0.65);
            color: #334155;
            font-size: 13px;
            font-weight: 650;
          }

          .ak-side-list li::before {
            content: "";
            margin-top: 3px;
            width: 10px;
            height: 10px;
            border-radius: 999px;
            background: #0b63ff;
            box-shadow: 0 0 0 3px rgba(11, 99, 255, 0.12);
            flex: 0 0 auto;
          }

          .ak-side-support {
            display: inline-flex;
            gap: 10px;
            align-items: center;
            justify-content: space-between;
            padding-top: 18px;
            border-top: 1px solid rgba(226, 226, 226, 0.75);
            color: #475569;
            text-decoration: none;
            font-size: 13px;
            font-weight: 700;
          }

          .ak-side-support:hover {
            color: #0f172a;
          }

          .ak-main {
            max-width: none;
            margin: 0;
            padding: 42px 44px;
          }

          .ak-subtitle {
            margin-top: 16px;
          }
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
            padding: 28px 18px 24px;
            border-radius: 20px;
          }
          .ak-main {
            margin-top: 0;
          }
          .ak-login-methods {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }
          .ak-login-methods .ak-btn-secondary {
            width: 52px;
            height: 52px;
            flex: 0 0 52px;
            padding: 0;
            border-radius: 999px;
          }
          .ak-google-login,
          .ak-telegram-login {
            width: 52px;
            flex: 0 0 52px;
            border-radius: 999px;
          }
          .ak-telegram-login {
            width: 52px;
            flex: 0 0 52px;
            border-radius: 999px;
          }
          .ak-method-label {
            display: none;
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
              <h2 id="turnstile-title">{isKorean ? '보안 인증을 기다려 주세요' : 'Please Wait for Security Validation'}</h2>
              <p id="turnstile-description">
                {isKorean ? '계속하려면 아래 보안 확인을 완료하세요.' : 'Complete the security check below to continue.'}
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
                  options={{ theme: 'light', action: 'login' }}
                />
              </div>
              {turnstileError && (
                <p className="ak-verification-error" role="alert">
                  {isKorean ? '인증을 완료할 수 없습니다. 다시 시도하세요.' : 'Verification could not be completed. Please try again.'}
                </p>
              )}
            </section>
          </div>
        )}
        <div className="ak-page-inner">
          <div className="ak-card">
            <div className="ak-grid">
              <aside className="ak-side" aria-label={isKorean ? '로그인 안내' : 'Login information'}>
                <div className="ak-side-top">
                  <div className="ak-side-logo">
                    <AuthLogo height={28} logoUrl={platformBranding?.logoUrl} name={platformBranding?.name} />
                    <span className="ak-side-brand">{platformBranding?.name || 'SwiftPay'}</span>
                  </div>
                  <h2 className="ak-side-title">{isKorean ? '안전한 대시보드 액세스' : 'Secure dashboard access'}</h2>
                  <p className="ak-side-sub">
                    {isKorean ? '인증된 계정만 로그인할 수 있습니다. 보안 검증이 활성화된 경우 화면의 안내를 따라주세요.' : 'Only verified accounts can sign in. If security validation is enabled, follow the on-screen prompt.'}
                  </p>
                  <ul className="ak-side-list" aria-label={isKorean ? '주요 기능' : 'Highlights'}>
                    <li>{isKorean ? '지갑, 정산, 승인 흐름을 한 곳에서 관리' : 'Manage wallets, settlements, and approvals in one place'}</li>
                    <li>{isKorean ? 'KRW 가상계좌 신청 검토 및 계정 풀 관리' : 'Review KRW virtual account applications and manage the pool'}</li>
                    <li>{isKorean ? '감사 추적 가능한 트랜잭션 모니터링' : 'Track transactions with audit-ready visibility'}</li>
                  </ul>
                </div>
                <a className="ak-side-support" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
                  <span>{isKorean ? '도움이 필요하신가요? 지원팀에 문의하세요' : 'Need help? Contact support'}</span>
                  <span aria-hidden="true">→</span>
                </a>
              </aside>

              <div className="ak-main">
            {/* ── STEP 1: Email ──────────────────────────── */}
            {step === 'email' && (
              <div className="ak-step">
                <div className="ak-login-logo" aria-label={platformBranding?.name || 'SwiftPay'}>
                  <AuthLogo height={48} logoUrl={platformBranding?.logoUrl} name={platformBranding?.name} />
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

                <div className="ak-login-methods" aria-label={isKorean ? '다른 로그인 방법' : 'Other sign-in methods'}>
                  {googleClientId && (
                    <div className="ak-google-login" aria-label="Continue with Google" title="Continue with Google">
                      <div ref={googleButtonRef} />
                      <span className="ak-method-label">{isKorean ? 'Google' : 'Google'}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="ak-btn-secondary"
                    onClick={handlePasskeyLogin}
                    disabled={passkeyLoading}
                    aria-label={isKorean ? '패스키로 로그인' : 'Sign in with passkey'}
                    title={isKorean ? '패스키로 로그인' : 'Sign in with passkey'}
                  >
                    <span className="ak-passkey-icon" aria-hidden="true">
                      <Fingerprint size={19} strokeWidth={2} />
                    </span>
                  <span className="ak-method-label">
                      {passkeyLoading ? (isKorean ? '패스키를 기다리는 중…' : 'Waiting for passkey…') : (isKorean ? '패스키' : 'Passkey')}
                    </span>
                  </button>

                  {telegramBotUsername && (
                    <div className="ak-telegram-login" title={t('sign_in_with_telegram')}>
                      <TelegramLoginWidget
                        botName={telegramBotUsername}
                        onAuth={async (telegramUser) => {
                          setLocalError(null);
                          await loginWithTelegram(telegramUser, turnstileToken);
                        }}
                      />
                      <span className="ak-method-label">Telegram</span>
                    </div>
                  )}
                </div>

                <Link to="/forgot-password" className="ak-forgot">
                  {t('forgot_password')}
                </Link>

              </div>
            )}

            {/* ── STEP 2: Password ───────────────────────── */}
            {step === 'password' && (
              <div className="ak-step">
                <div className="ak-login-logo" aria-label={platformBranding?.name || 'SwiftPay'}>
                  <AuthLogo height={48} logoUrl={platformBranding?.logoUrl} name={platformBranding?.name} />
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

                <Link to="/forgot-password" className="ak-forgot">
                  {t('forgot_password')}
                </Link>
              </div>
            )}
              </div>
            </div>
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
