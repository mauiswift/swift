import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '@/contexts/AuthContext';
import { SUPPORT_URL } from '@/lib/brand';
import { loginSchema } from '@/lib/validation';

/* SwiftPay wordmark — exact SVG from auth.live.swiftpay.ph */
function SwiftPayLogo({ height = 28 }: { height?: number }) {
  return (
    <svg height={height} viewBox="0 0 212 47" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 'auto' }}>
      <path fillRule="evenodd" clipRule="evenodd" d="M26.2678 10.7427C26.2678 12.226 25.0611 13.4284 23.5725 13.4284C22.084 13.4284 20.8773 12.226 20.8773 10.7427C20.8773 9.25946 22.084 8.05704 23.5725 8.05704C25.0611 8.05704 26.2678 9.25946 26.2678 10.7427ZM26.2678 35.809C26.2678 37.2923 25.0611 38.4947 23.5725 38.4947C22.084 38.4947 20.8773 37.2923 20.8773 35.809C20.8773 34.3258 22.084 33.1234 23.5725 33.1234C25.0611 33.1234 26.2678 34.3258 26.2678 35.809ZM16.3852 33.1234C17.8738 33.1234 19.0805 31.9209 19.0805 30.4377C19.0805 28.9544 17.8738 27.752 16.3852 27.752C14.8967 27.752 13.69 28.9544 13.69 30.4377C13.69 31.9209 14.8967 33.1234 16.3852 33.1234ZM19.0805 16.1141C19.0805 17.5973 17.8738 18.7997 16.3852 18.7997C14.8967 18.7997 13.69 17.5973 13.69 16.1141C13.69 14.6308 14.8967 13.4284 16.3852 13.4284C17.8738 13.4284 19.0805 14.6308 19.0805 16.1141ZM30.7598 33.1234C32.2484 33.1234 33.4551 31.9209 33.4551 30.4377C33.4551 28.9544 32.2484 27.752 30.7598 27.752C29.2713 27.752 28.0646 28.9544 28.0646 30.4377C28.0646 31.9209 29.2713 33.1234 30.7598 33.1234ZM26.2678 23.2759C26.2678 24.7591 25.0611 25.9615 23.5725 25.9615C22.084 25.9615 20.8773 24.7591 20.8773 23.2759C20.8773 21.7926 22.084 20.5902 23.5725 20.5902C25.0611 20.5902 26.2678 21.7926 26.2678 23.2759ZM30.7598 18.7997C32.2484 18.7997 33.4551 17.5973 33.4551 16.1141C33.4551 14.6308 32.2484 13.4284 30.7598 13.4284C29.2713 13.4284 28.0646 14.6308 28.0646 16.1141C28.0646 17.5973 29.2713 18.7997 30.7598 18.7997Z" fill="#191919"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M117.861 20.6876V34.1379H113.27V20.6876H110.906V17.2055H113.27V16.1131C113.27 13.8828 113.807 12.119 114.88 10.8217C115.954 9.52448 117.416 8.87585 119.266 8.87585C120.727 8.87585 122.201 9.22861 123.685 9.93413L122.76 13.3821C122.418 13.2 122.012 13.0464 121.544 12.9212C121.076 12.796 120.647 12.7334 120.259 12.7334C118.66 12.7334 117.861 13.8031 117.861 15.9424V17.2055H122.246V20.6876H117.861ZM108.029 9.21723V13.7576H103.438V9.21723H108.029ZM62.5661 34.411C63.7538 34.411 64.89 34.2802 65.9749 34.0184C67.0598 33.7567 68.0191 33.3414 68.8527 32.7724C69.6864 32.2034 70.3487 31.4581 70.8398 30.5364C71.3308 29.6146 71.5764 28.5052 71.5764 27.2079C71.5764 26.0928 71.3936 25.154 71.0282 24.3915C70.6628 23.6291 70.1432 22.9748 69.4694 22.4286C68.7956 21.8824 67.9734 21.4272 67.0027 21.0631C66.032 20.699 64.9528 20.3576 63.7652 20.039C62.8516 19.8114 62.0465 19.5952 61.3499 19.3903C60.6533 19.1855 60.0766 18.9579 59.6198 18.7076C59.163 18.4572 58.8147 18.1671 58.5749 17.8371C58.335 17.5071 58.2151 17.0917 58.2151 16.591C58.2151 15.7262 58.5349 15.0548 59.1744 14.5769C59.8139 14.099 60.7846 13.86 62.0865 13.86C62.8173 13.86 63.5368 13.951 64.2448 14.1331C64.9528 14.3152 65.6095 14.5371 66.2147 14.7988C66.82 15.0605 67.3339 15.3279 67.7564 15.601C68.179 15.8741 68.4702 16.0903 68.63 16.2496L70.7199 12.4262C69.6464 11.6979 68.3902 11.0664 66.9513 10.5315C65.5124 9.99672 63.9365 9.7293 62.2235 9.7293C60.9902 9.7293 59.8368 9.8943 58.7633 10.2243C57.6898 10.5543 56.7477 11.0379 55.9369 11.6752C55.1261 12.3124 54.4923 13.109 54.0355 14.0648C53.5787 15.0207 53.3503 16.1131 53.3503 17.3421C53.3503 18.2752 53.493 19.0774 53.7785 19.7488C54.064 20.4202 54.4923 21.0119 55.0633 21.524C55.6342 22.036 56.348 22.4798 57.2045 22.8553C58.061 23.2309 59.0716 23.5779 60.2364 23.8965C61.1957 24.1696 62.0636 24.42 62.8402 24.6476C63.6167 24.8752 64.2791 25.1255 64.8272 25.3986C65.3754 25.6717 65.7979 25.9903 66.0948 26.3545C66.3917 26.7186 66.5402 27.1624 66.5402 27.6859C66.5402 29.3472 65.2383 30.1779 62.6346 30.1779C61.6982 30.1779 60.7846 30.0641 59.8939 29.8365C59.0031 29.609 58.1923 29.3302 57.4614 29.0002C56.7306 28.6702 56.0968 28.3402 55.56 28.0102C55.0233 27.6802 54.6521 27.4128 54.4466 27.2079L52.3568 31.2703C53.7728 32.2717 55.3716 33.0455 57.1531 33.5917C58.9346 34.1379 60.7389 34.411 62.5661 34.411ZM83.9098 34.1379L86.9589 26.2862L90.0422 34.1379H93.8108L101.314 16.2496H96.9627L91.6182 29.8365L89.4598 24.0331L92.5774 16.2838H88.8774L86.9589 21.78L85.0746 16.2838H81.3746L84.5265 24.0331L82.3338 29.8365L76.9894 16.2496H72.6727L80.1412 34.1379H83.9098ZM108.029 34.1379V16.2496H103.438V34.1379H108.029ZM130.537 34.4452C131.519 34.4452 132.456 34.3086 133.346 34.0355C134.237 33.7624 134.991 33.4893 135.607 33.2162L134.682 29.5976C134.408 29.7114 134.043 29.8479 133.586 30.0072C133.129 30.1665 132.661 30.2462 132.181 30.2462C131.702 30.2462 131.296 30.1153 130.965 29.8536C130.634 29.5919 130.469 29.1424 130.469 28.5052V19.7659H134.237V16.2496H130.469V10.4462H125.878V16.2496H123.514V19.7659H125.878V30.0414C125.878 30.8379 126.003 31.515 126.255 32.0726C126.506 32.6302 126.843 33.0853 127.265 33.4381C127.688 33.7909 128.179 34.0469 128.738 34.2062C129.298 34.3655 129.898 34.4452 130.537 34.4452ZM144.736 26.0131V34.1379H140.008V9.89999H150.32C151.439 9.89999 152.473 10.1333 153.421 10.5998C154.369 11.0664 155.185 11.6809 155.87 12.4433C156.556 13.2057 157.092 14.0705 157.481 15.0378C157.869 16.005 158.063 16.9779 158.063 17.9565C158.063 18.9807 157.88 19.9764 157.515 20.9436C157.149 21.9109 156.636 22.77 155.973 23.521C155.311 24.2721 154.511 24.8752 153.575 25.3303C152.639 25.7855 151.611 26.0131 150.492 26.0131H144.736ZM150.218 21.8824H144.736V14.0307H150.012C150.423 14.0307 150.829 14.116 151.228 14.2867C151.628 14.4574 151.976 14.7134 152.273 15.0548C152.57 15.3962 152.81 15.8115 152.993 16.3009C153.175 16.7902 153.267 17.3421 153.267 17.9565C153.267 19.1628 152.975 20.1186 152.393 20.8241C151.811 21.5296 151.085 21.8824 150.218 21.8824ZM169.471 33.66C168.329 34.2062 167.108 34.4793 165.806 34.4793C164.938 34.4793 164.127 34.3371 163.373 34.0526C162.62 33.7681 161.969 33.3698 161.42 32.8577C160.872 32.3457 160.444 31.7483 160.136 31.0655C159.827 30.3827 159.673 29.6317 159.673 28.8124C159.673 27.9703 159.862 27.1909 160.238 26.474C160.615 25.7571 161.141 25.1483 161.814 24.6476C162.488 24.1469 163.293 23.7543 164.23 23.4698C165.166 23.1853 166.194 23.0431 167.313 23.0431C168.112 23.0431 168.895 23.1114 169.66 23.2479C170.425 23.3845 171.104 23.5779 171.698 23.8283V22.8041C171.698 21.6207 171.361 20.7103 170.688 20.0731C170.014 19.4359 169.015 19.1172 167.69 19.1172C166.731 19.1172 165.794 19.2879 164.881 19.6293C163.967 19.9707 163.031 20.4714 162.071 21.1314L160.667 18.2296C162.974 16.7048 165.463 15.9424 168.135 15.9424C170.716 15.9424 172.72 16.574 174.148 17.8371C175.575 19.1002 176.289 20.9265 176.289 23.3162V28.8807C176.289 29.3586 176.375 29.7 176.546 29.9048C176.717 30.1096 176.997 30.2234 177.385 30.2462V34.1379C176.609 34.2972 175.935 34.3769 175.364 34.3769C174.496 34.3769 173.828 34.1834 173.36 33.7965C172.892 33.4096 172.6 32.8976 172.486 32.2603L172.384 31.2703C171.584 32.3172 170.613 33.1138 169.471 33.66ZM167.108 31.1338C166.24 31.1338 165.509 30.8778 164.915 30.3657C164.321 29.8536 164.024 29.2107 164.024 28.4369C164.024 27.6176 164.401 26.9405 165.155 26.4057C165.908 25.8709 166.879 25.6034 168.067 25.6034C168.661 25.6034 169.277 25.666 169.917 25.7912C170.556 25.9164 171.15 26.0814 171.698 26.2862V28.3345C171.698 28.8124 171.447 29.2448 170.945 29.6317C170.556 30.0869 170.014 30.451 169.317 30.7241C168.621 30.9972 167.884 31.1338 167.108 31.1338ZM187.149 40.7607C186.099 41.5572 184.797 41.9555 183.244 41.9555C182.878 41.9555 182.507 41.9271 182.13 41.8702C181.753 41.8133 181.36 41.7165 180.948 41.58V37.62C181.337 37.7338 181.714 37.8191 182.079 37.876C182.444 37.9329 182.753 37.9614 183.004 37.9614C183.301 37.9614 183.575 37.9045 183.826 37.7907C184.077 37.6769 184.306 37.4778 184.511 37.1933C184.717 36.9088 184.923 36.5162 185.128 36.0155C185.334 35.5148 185.551 34.889 185.779 34.1379L178.687 16.2496H183.415L188.28 30.1779L192.597 16.2496H196.913L189.376 37.6883C188.942 38.94 188.2 39.9641 187.149 40.7607Z" fill="#191919"/>
    </svg>
  );
}

type Step = 'email' | 'password';

export default function Login() {
  const { user, login, loading, error, platformBranding } = useAuth();
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

  if (user) return <Navigate to="/dashboard" replace />;

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
          min-height: 520px;
          padding: 64px 80px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .ak-branding {
          position: absolute;
          top: 48px;
          left: 48px;
        }

        .ak-main {
          width: 100%;
          max-width: 380px;
          margin: 60px auto 0;
          text-align: center;
        }

        .ak-title {
          font-size: 2.25rem;
          font-weight: 700;
          color: var(--text-100);
          margin-bottom: 32px;
          letter-spacing: -0.01em;
          line-height: 1.1;
        }

        .ak-subtitle {
          font-size: 1.125rem;
          color: var(--text-200);
          margin-bottom: 40px;
          line-height: 1.5;
        }

        .ak-form-item {
          margin-bottom: 24px;
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

        .ak-btn-primary:hover {
          background-color: #000;
        }

        .ak-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ak-forgot {
          display: inline-block;
          margin-top: 48px;
          font-size: 15px;
          color: var(--link-color);
          font-weight: 500;
          text-decoration: none;
        }

        .ak-forgot:hover {
          text-decoration: underline;
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

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .ak-card {
            padding: 40px 24px;
          }
          .ak-branding {
            position: static;
            margin-bottom: 40px;
            text-align: center;
          }
          .ak-main {
            margin-top: 0;
          }
        }
      `}</style>

      <div className="ak-page">
        <div className="ak-card">
          <div className="ak-branding">
            <SwiftPayLogo height={32} />
          </div>

          <div className="ak-main">
            {turnstileSiteKey && (
              <div className="ak-turnstile-wrap" style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
                <Turnstile siteKey={turnstileSiteKey} onSuccess={setTurnstileToken} options={{ theme: 'light' }} />
              </div>
            )}

            {/* ── STEP 1: Email ──────────────────────────── */}
            {step === 'email' && (
              <div className="ak-step">
                <h1 className="ak-title">Welcome to {platformBranding?.name || 'SwiftPay'}</h1>
                <p className="ak-subtitle">
                  Login to continue to {platformBranding?.name || 'SwiftPay'}.
                </p>

                <form onSubmit={handleEmailStep}>
                  <div className="ak-form-item">
                    <label htmlFor="ak-email" className="ak-label">
                      Email<span className="req">*</span>
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

                  {localError && <div className="ak-error-box">{localError}</div>}
                  {error && <div className="ak-error-box">{error}</div>}

                  <button
                    type="submit"
                    className="ak-btn-primary"
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
                <h1 className="ak-title">Welcome to {platformBranding?.name || 'SwiftPay'}</h1>

                <div className="ak-identity-row">
                  <span className="ak-identity-text">{email}</span>
                  <button
                    type="button"
                    className="ak-identity-btn"
                    onClick={() => { setStep('email'); setLocalError(null); setPassword(''); }}
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handlePasswordStep}>
                  <div className="ak-form-item">
                    <label htmlFor="ak-password" className="ak-label">
                      Password<span className="req">*</span>
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

                  {(localError || error) && <div className="ak-error-box">{localError || error}</div>}

                  <button
                    type="submit"
                    className="ak-btn-primary"
                  >
                    {submitting
                      ? <><span className="ak-load-spin" /> Signing in…</>
                      : 'Log in'}
                  </button>
                </form>

                <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="ak-forgot">
                  Forgot password?
                </a>
              </div>
            )}
          </div>
        </div>

        <footer className="ak-footer">
          <Link to="/terms" className="ak-footer-item">Terms of use</Link>
          <Link to="/privacy" className="ak-footer-item">Privacy policy</Link>
          <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="ak-footer-item">Contact us</a>
        </footer>
      </div>
    </>
  );
}
