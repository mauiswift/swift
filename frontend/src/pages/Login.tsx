import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '@/contexts/AuthContext';
import { APP_NAME, SUPPORT_URL } from '@/lib/brand';
import { loginSchema } from '@/lib/validation';

type Step = 'email' | 'password';

export default function Login() {
  const { user, login, loading, error } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const passwordRef = useRef<HTMLInputElement>(null);

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
          padding: 48px 56px 52px;
        }
        /* Logo top-left */
        .ak-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 44px;
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
          font-size: 1.15rem;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.02em;
        }
        /* Centered content */
        .ak-content { max-width: 340px; margin: 0 auto; }
        .ak-step {
          animation: akIn 0.2s cubic-bezier(.16,1,.3,1) both;
        }
        @keyframes akIn {
          from { opacity: 0; transform: translateY(7px); }
          to   { opacity: 1; transform: none; }
        }
        .ak-title {
          font-size: 1.45rem;
          font-weight: 700;
          color: #1a1a1a;
          text-align: center;
          margin-bottom: 16px;
          letter-spacing: -0.015em;
        }
        /* Email + "Not you?" row (step 2) */
        .ak-identity {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .ak-identity-email {
          font-size: 0.9rem;
          color: #4f6ef7;
          font-weight: 500;
        }
        .ak-identity-change {
          background: none; border: none; cursor: pointer;
          font-size: 0.875rem; color: #6b6b6b;
          font-weight: 500; padding: 0; font-family: inherit;
          transition: color .15s;
        }
        .ak-identity-change:hover { color: #1a1a1a; }
        /* Subtitle (step 1) */
        .ak-subtitle {
          font-size: 0.875rem;
          color: #6b6b6b;
          text-align: center;
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .ak-subtitle .ak-login-word {
          color: #c2410c;
          font-weight: 600;
        }
        /* Form */
        .ak-form { display: flex; flex-direction: column; }
        .ak-field { margin-bottom: 20px; }
        .ak-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #1a1a1a;
          margin-bottom: 6px;
        }
        .ak-req { color: #e53e3e; margin-left: 2px; }
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
        /* Primary button */
        .ak-btn {
          width: 100%;
          background: #1a1a1a;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 13px;
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
        .ak-btn:disabled { opacity: .5; cursor: not-allowed; }
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
          margin-top: 22px;
          font-size: 0.875rem;
          color: #4f6ef7;
          font-weight: 500;
          text-decoration: none;
          transition: color .15s;
        }
        .ak-forgot:hover { color: #3b5bdb; text-decoration: underline; }
        /* Turnstile */
        .ak-turnstile {
          display: flex; flex-direction: column;
          align-items: center; gap: 6px; margin-bottom: 16px;
        }
        .ak-turnstile p { font-size: 0.8125rem; color: #9a9a9a; }
        /* Footer */
        .ak-footer {
          padding: 20px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 36px;
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
          .ak-card { padding: 32px 24px 36px; border-radius: 8px; }
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

            <div className="ak-content">

              {/* ── STEP 1: Email ──────────────────────────── */}
              {step === 'email' && (
                <div className="ak-step">
                  <h1 className="ak-title">Welcome to {APP_NAME}</h1>
                  <p className="ak-subtitle">
                    <span className="ak-login-word">Login</span> to continue to {APP_NAME}.
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
                      disabled={!email.trim() || (turnstileSiteKey ? !turnstileToken : false)}
                    >
                      Log in
                    </button>
                  </form>

                  <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="ak-forgot">
                    Forgot password?
                  </a>
                </div>
              )}

              {/* ── STEP 2: Password ───────────────────────── */}
              {step === 'password' && (
                <div className="ak-step">
                  <h1 className="ak-title">Welcome to {APP_NAME}</h1>

                  {/* Email + "Not you?" on same line */}
                  <div className="ak-identity">
                    <span className="ak-identity-email">{email}</span>
                    <button
                      type="button"
                      className="ak-identity-change"
                      onClick={() => { setStep('email'); setLocalError(null); setPassword(''); }}
                    >
                      Not you?
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
                        placeholder="••••••••••••"
                        className="ak-input"
                      />
                    </div>

                    {(localError || error) && <div className="ak-error">{localError || error}</div>}
                    {loading && !submitting && (
                      <p style={{ fontSize: '0.8125rem', color: '#9a9a9a', textAlign: 'center', marginBottom: 12 }}>
                        Checking session…
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || !password || (turnstileSiteKey ? !turnstileToken : false)}
                      className="ak-btn"
                    >
                      {submitting
                        ? <><span className="ak-spinner" /> Signing in…</>
                        : 'Continue'}
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

        {/* Footer — Terms of use · Privacy policy · Contact us */}
        <footer className="ak-footer">
          <Link to="/terms" className="ak-footer-link">Terms of use</Link>
          <Link to="/privacy" className="ak-footer-link">Privacy policy</Link>
          <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="ak-footer-link">Contact us</a>
        </footer>
      </div>
    </>
  );
}
