import { useEffect, useRef, useState, useCallback, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowRight, ChevronRight, UserPlus, Lock, Mail,
  CheckCircle2, ShieldCheck, Zap, Globe,
} from 'lucide-react';
import { z } from 'zod';
import type { TelegramWidgetUser } from '@/lib/auth';
import { APP_NAME, SUPPORT_URL, SUPPORT_HANDLE } from '@/lib/brand';
import { loginSchema } from '@/lib/validation';
import MarketingPageShell from '@/components/MarketingPageShell';

declare global {
  interface Window { onTelegramAuth?: (user: TelegramWidgetUser) => void; }
}

/* ─── Simple Icons helper ──────────────────────────────────── */
function SiIcon({ src, alt, bg, size = 36 }: { src: string; alt: string; bg: string; size?: number }) {
  const r = Math.round(size * 0.24);
  const p = Math.round(size * 0.2);
  return (
    <div style={{ width: size, height: size, background: bg, borderRadius: r, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: p, flexShrink: 0 }}>
      <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
    </div>
  );
}
function ImgIcon({ src, alt, size = 36 }: { src: string; alt: string; size?: number }) {
  return <img src={src} alt={alt} style={{ height: size, width: 'auto', objectFit: 'contain', borderRadius: 8, flexShrink: 0 }} />;
}

const Logo = {
  Alipay:    (s = 36) => <SiIcon  src="/logos/alipay.svg"    alt="Alipay"     bg="#00A66C" size={s} />,
  WeChat:    (s = 36) => <SiIcon  src="/logos/wechat.svg"    alt="WeChat Pay" bg="#07C160" size={s} />,
  GCash:     (s = 36) => <ImgIcon src="/logos/gcash.svg"     alt="GCash"      size={s} />,
  Maya:      (s = 36) => <ImgIcon src="/logos/maya.svg"      alt="Maya"       size={s} />,
  GrabPay:   (s = 36) => <SiIcon  src="/logos/grab.svg"      alt="GrabPay"    bg="#00B14F" size={s} />,
  BPI:       (s = 36) => <ImgIcon src="/logos/bpi.svg"       alt="BPI"        size={s} />,
  BDO:       (s = 36) => <ImgIcon src="/logos/bdo.svg"       alt="BDO"        size={s} />,
  UnionBank: (s = 36) => <ImgIcon src="/logos/unionbank.svg" alt="UnionBank"  size={s} />,
  Metrobank: (s = 36) => <ImgIcon src="/logos/metrobank.svg" alt="Metrobank"  size={s} />,
};

/* ─── Social icons ─────────────────────────────────────────── */
function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#25D366" />
      <path d="M17.5 6.5A7.4 7.4 0 0 0 6.2 17.1L5 19l1.9-1.2a7.4 7.4 0 0 0 10.6-6.4 7.3 7.3 0 0 0-2.1-5.1-7.3 7.3 0 0 0-.9.2zm-5.3 11.4a6.1 6.1 0 0 1-3.1-.9l-.2-.1-2 .5.5-1.9-.2-.2a6.2 6.2 0 1 1 5 2.6zm3.4-4.7c-.2-.1-1-.5-1.2-.5-.2-.1-.3-.1-.4.1-.1.2-.5.5-.6.7-.1.1-.2.1-.4 0-.2-.1-.8-.3-1.5-1-.6-.5-.9-1.1-1-1.3-.1-.2 0-.3.1-.4l.3-.3.2-.3v-.3c0-.1-.4-1-.6-1.3-.1-.3-.3-.3-.4-.3h-.4c-.1 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.1 1.6 2.5 3.9 3.5.5.2.9.4 1.3.5.5.2 1 .1 1.3.1.4-.1 1.2-.5 1.4-1 .2-.5.2-.9.1-1-.1-.2-.2-.2-.4-.3z" fill="white" />
    </svg>
  );
}

function MessengerIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="url(#msgGradL)" />
      <defs>
        <linearGradient id="msgGradL" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00C6FF" /><stop offset="1" stopColor="#0068FF" />
        </linearGradient>
      </defs>
      <path d="M12 4C7.58 4 4 7.36 4 11.5c0 2.2 1.02 4.17 2.63 5.52V19l2.42-1.33c.64.18 1.33.28 2.04.28H12c4.42 0 8-3.36 8-7.5S16.42 4 12 4zm.79 9.78l-2.04-2.18-3.98 2.18 4.38-4.65 2.09 2.18 3.94-2.18-4.39 4.65z" fill="white" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════ */

export default function Login() {
  const { user, login, loginWithTelegram, loading, error } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const widgetContainerRef = useRef<HTMLDivElement | null>(null);
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

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setLocalError(result.error.issues[0]?.message || 'Please check your input');
      return;
    }
    setSubmitting(true);
    setLocalError(null);
    try {
      if (turnstileSiteKey && !turnstileToken) {
        setLocalError('Please complete the human verification before signing in.');
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
      if (!u) {
        setLocalError('Telegram sign-in is not configured. Please set TELEGRAM_BOT_USERNAME.');
        return;
      }
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

  const paymentLogos = [
    { el: Logo.Alipay(),  label: 'Alipay'    },
    { el: Logo.WeChat(),  label: 'WeChat Pay' },
    { el: Logo.GCash(),   label: 'GCash'      },
    { el: Logo.Maya(),    label: 'Maya'       },
    { el: Logo.GrabPay(), label: 'GrabPay'    },
    { el: Logo.BPI(),     label: 'BPI'        },
    { el: Logo.BDO(),     label: 'BDO'        },
    { el: Logo.Metrobank(), label: 'Metrobank' },
  ];

  const highlights = [
    { icon: Zap,         label: 'T+0 USDT Settlement',       desc: 'Funds in your wallet same day' },
    { icon: Globe,       label: '10+ Payment Methods',        desc: 'Chinese wallets, e-wallets, banks' },
    { icon: ShieldCheck, label: 'BSP & PCI-DSS Compliant',    desc: 'Bank-grade security controls'  },
    { icon: CheckCircle2, label: '500+ Active Merchants',     desc: '₱57B+ processed to date'       },
  ];

  return (
    <MarketingPageShell className="bg-[#fcfbf8] text-[#1a1a1a]">
      <section className="min-h-[calc(100vh-5rem)] py-12 lg:py-0 flex items-center">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center lg:min-h-[calc(100vh-5rem)] lg:py-16">

            {/* ── LEFT: Brand panel ──────────────────────────────── */}
            <div className="order-2 lg:order-1">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e9e3db] bg-white px-4 py-1.5 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c2410c] animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#c2410c]">Merchant Portal</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1a1a1a] leading-[1.08] tracking-[-0.03em] mb-5">
                The payments platform<br />
                <span className="text-[#c2410c]">built for the Philippines.</span>
              </h1>

              <p className="text-[#5f5f5f] text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
                Accept Alipay, WeChat Pay, GCash, Maya, GrabPay, and every major PH bank — all through one merchant dashboard. Settle in USDT same day.
              </p>

              {/* Highlights grid */}
              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                {highlights.map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3 rounded-2xl border border-[#e9e3db] bg-white px-4 py-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff4ee] text-[#c2410c]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1a1a1a] leading-snug">{label}</p>
                      <p className="text-xs text-[#5f5f5f] mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment logos */}
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8a8a8a] mb-3">Accepted payment methods</p>
              <div className="flex flex-wrap gap-2.5">
                {paymentLogos.map(({ el, label }) => (
                  <div key={label} className="flex items-center gap-2 rounded-xl border border-[#e9e3db] bg-white px-3 py-2">
                    {el}
                    <span className="text-xs font-semibold text-[#1a1a1a]">{label}</span>
                  </div>
                ))}
                <div className="flex items-center rounded-xl border border-[#e9e3db] bg-white px-3 py-2">
                  <span className="text-xs text-[#5f5f5f]">+100 more banks</span>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Login form ────────────────────────────────── */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="w-full max-w-[440px] rounded-[32px] border border-[#e9e3db] bg-white p-8 shadow-sm">

                {/* Card heading */}
                <div className="mb-7">
                  <h2 className="text-2xl font-black text-[#1a1a1a] tracking-tight mb-1">Welcome back</h2>
                  <p className="text-sm text-[#5f5f5f]">Sign in to your {APP_NAME} merchant dashboard.</p>
                </div>

                {/* Turnstile (gate before form) */}
                {turnstileSiteKey && !turnstileToken && (
                  <div className="flex flex-col items-center mb-5 gap-2">
                    <p className="text-xs text-[#5f5f5f]">Please verify you are human</p>
                    <Turnstile
                      siteKey={turnstileSiteKey}
                      onSuccess={(token) => setTurnstileToken(token)}
                      options={{ theme: 'light' }}
                    />
                  </div>
                )}

                {/* Email / password form */}
                <form onSubmit={handleEmailLogin} className="space-y-3 mb-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8a8a]" />
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full rounded-xl border border-[#e9e3db] bg-[#fcfbf8] pl-10 pr-4 py-3 text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#c2410c] focus:bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8a8a]" />
                      <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full rounded-xl border border-[#e9e3db] bg-[#fcfbf8] pl-10 pr-4 py-3 text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#c2410c] focus:bg-white"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || (turnstileSiteKey ? !turnstileToken : false)}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1a1a1a] px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Signing in…' : <>Sign in <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-[#e9e3db]" />
                  <span className="text-xs text-[#8a8a8a] font-medium shrink-0">or continue with Telegram</span>
                  <div className="flex-1 h-px bg-[#e9e3db]" />
                </div>

                {/* Telegram widget */}
                <div className="flex justify-center mb-4" ref={widgetContainerRef} />

                {/* Loading / error states */}
                {submitting && (
                  <div className="flex items-center justify-center gap-2 text-[#5f5f5f] text-sm mb-3">
                    <span className="h-4 w-4 border-2 border-[#c2410c] border-t-transparent rounded-full animate-spin" />
                    Signing in…
                  </div>
                )}
                {(localError || error) && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm mb-4">
                    {localError || error}
                  </div>
                )}
                {loading && !submitting && (
                  <p className="text-[#5f5f5f] text-sm text-center mb-3">Checking session…</p>
                )}

                {/* Social logins */}
                {socialConfig && (socialConfig.whatsapp_number || socialConfig.messenger_page_username) && (
                  <>
                    <div className="relative flex items-center gap-3 mb-3">
                      <div className="flex-1 h-px bg-[#e9e3db]" />
                      <span className="text-xs text-[#8a8a8a] font-medium shrink-0">or sign in via</span>
                      <div className="flex-1 h-px bg-[#e9e3db]" />
                    </div>
                    <div className="flex flex-col gap-2 mb-4">
                      {socialConfig.whatsapp_number && (
                        <a
                          href={`https://wa.me/${socialConfig.whatsapp_number.replace(/\D/g, '')}?text=Hi%2C+I+want+to+sign+in`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 w-full rounded-xl border border-[#e9e3db] bg-white px-4 py-3 text-sm font-semibold text-[#1a1a1a] transition-colors hover:border-green-300 hover:bg-green-50"
                        >
                          <WhatsAppIcon size={20} />
                          Continue with WhatsApp
                        </a>
                      )}
                      {socialConfig.messenger_page_username && (
                        <a
                          href={`https://m.me/${socialConfig.messenger_page_username}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 w-full rounded-xl border border-[#e9e3db] bg-white px-4 py-3 text-sm font-semibold text-[#1a1a1a] transition-colors hover:border-blue-300 hover:bg-blue-50"
                        >
                          <MessengerIcon size={20} />
                          Continue with Messenger
                        </a>
                      )}
                    </div>
                  </>
                )}

                {/* Footer actions */}
                <div className="border-t border-[#e9e3db] pt-5 space-y-3">
                  <Link
                    to="/register"
                    className="flex items-center justify-between w-full rounded-xl border border-[#e9e3db] bg-[#fcfbf8] px-4 py-3 text-sm font-semibold text-[#1a1a1a] transition-all hover:border-[#c2410c]/40 hover:bg-[#fff4ee] group"
                  >
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-[#c2410c]" />
                      Create a merchant account
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#8a8a8a] transition-colors group-hover:text-[#c2410c]" />
                  </Link>
                  <p className="text-xs text-[#8a8a8a] text-center">
                    Need access?{' '}
                    <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="text-[#c2410c] font-semibold hover:underline">
                      Contact {SUPPORT_HANDLE}
                    </a>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </MarketingPageShell>
  );
}
