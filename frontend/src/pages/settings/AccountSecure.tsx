import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  Chrome,
  KeyRound,
  Loader2,
  LockKeyhole,
  Send,
  ShieldCheck,
  Unlink2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { client } from '@/lib/api';
import { authApi, TelegramWidgetUser } from '@/lib/auth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import TelegramLoginWidget from '@/components/TelegramLoginWidget';
import { useLanguage } from '@/contexts/LanguageContext';

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

export default function AccountSecure() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const tx = (en: string, ko: string) => language === 'ko' ? ko : en;
  const { user, refetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [telegramLinkStatus, setTelegramLinkStatus] = useState<{
    linked: boolean;
    telegram_id?: string;
    telegram_username?: string;
  }>({ linked: false });
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [linkingInstructions, setLinkingInstructions] = useState(false);
  const [telegramBotName, setTelegramBotName] = useState('');
  const [linking, setLinking] = useState(false);
  const [googleLinkStatus, setGoogleLinkStatus] = useState<{ linked: boolean; google_email?: string }>({ linked: false });
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const configuredGoogleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();
  const [googleClientId, setGoogleClientId] = useState(configuredGoogleClientId || '');

  // Fetch current telegram link status
  useEffect(() => {
    const fetchTelegramStatus = async () => {
      try {
        setLoading(true);
        const res = await client.get('/api/v1/auth/telegram-link-status');
        if (res.ok && res.data) {
          setTelegramLinkStatus(res.data);
        }
        const googleRes = await client.get('/api/v1/auth/google-link-status');
        if (googleRes.ok && googleRes.data) setGoogleLinkStatus(googleRes.data);
        if (!configuredGoogleClientId) {
          const googleConfig = await client.get('/api/v1/auth/google-config');
          if (googleConfig.ok && googleConfig.data?.client_id) {
            setGoogleClientId(String(googleConfig.data.client_id).trim());
          }
        }
      } catch (err) {
        console.error('Failed to fetch telegram link status:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTelegramStatus();
      fetch('/api/v1/auth/telegram-login-config')
        .then((response) => response.ok ? response.json() : null)
        .then((data) => setTelegramBotName(data?.bot_username || ''))
        .catch(() => setTelegramBotName(''));
    }
  }, [user]);

  useEffect(() => {
    if (!googleClientId || googleLinkStatus.linked) return;
    const renderGoogleButton = () => {
      const element = googleButtonRef.current;
      if (!window.google?.accounts.id || !element) return;
      element.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: ({ credential }) => { void handleGoogleLink(credential); },
      });
      window.google.accounts.id.renderButton(element, {
        type: 'standard', theme: 'outline', size: 'large', width: '380', text: 'continue_with', shape: 'rectangular',
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
  }, [googleClientId, googleLinkStatus.linked]);

  const handleGoogleLink = async (credential: string) => {
    setLinking(true);
    try {
      const res = await client.post('/api/v1/auth/google-link', { credential });
      if (res.ok) {
        toast.success('Google account linked successfully');
        setGoogleLinkStatus({ linked: true, google_email: res.data?.google_email });
      } else {
        toast.error(res.data?.detail || 'Failed to link Google account');
      }
    } catch {
      toast.error('Error linking Google account');
    } finally {
      setLinking(false);
    }
  };

  const handleTelegramLink = async (telegramUser: TelegramWidgetUser) => {
    setLinking(true);
    try {
      const res = await client.post('/api/v1/auth/telegram-link', telegramUser);
      if (res.ok) {
        toast.success('Telegram account linked successfully');
        setTelegramLinkStatus(res.data);
        await refetch();
      } else {
        toast.error(res.data?.detail || 'Failed to link Telegram account');
      }
    } catch (err) {
      toast.error('Error linking Telegram account');
    } finally {
      setLinking(false);
    }
  };

  const handleRegisterPasskey = async () => {
    setPasskeyLoading(true);
    try {
      await authApi.registerPasskey();
      toast.success('Passkey registered successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Passkey registration failed');
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    setUnlinkLoading(true);
    try {
      const res = await client.post('/api/v1/auth/telegram-unlink');
      if (res.ok) {
        toast.success('Telegram account unlinked successfully');
        setShowUnlinkDialog(false);
        setTelegramLinkStatus({ linked: false });
      } else {
        toast.error(res.data?.detail || 'Failed to unlink Telegram account');
      }
    } catch (err) {
      toast.error('Error unlinking Telegram account');
      console.error(err);
    } finally {
      setUnlinkLoading(false);
    }
  };

  return (
    <Layout>
      <div className="page-enter mx-auto w-full max-w-4xl pb-20">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-8 font-medium">
          <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={() => navigate('/settings')}>{tx('Settings', '설정')}</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-semibold">Account & Security</span>
        </div>

        {/* Title */}
        <div className="mb-8 flex items-center justify-between sm:mb-10">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <button
              onClick={() => navigate('/settings')}
              type="button"
              aria-label="Back to settings"
              title="Back to settings"
              className="app-touch-target rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{tx('Account & Security', '계정 및 보안')}</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-5 sm:space-y-6">
          <div className="mb-2 rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-200 ring-1 ring-white/15">
                <ShieldCheck size={21} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Security center</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">Protect your SwiftPay account</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                  Add trusted sign-in methods and keep your account recovery options up to date.
                </p>
              </div>
            </div>
          </div>

          <div className="app-panel overflow-hidden p-0">
            <div className="border-b border-slate-100 bg-slate-50/70 p-5 sm:p-7">
              <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                <KeyRound size={19} strokeWidth={1.9} />
              </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{tx('Passkey login', '패스키 로그인')}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Fast, device-based authentication</p>
                </div>
              </div>
            </div>
            <div className="p-5 sm:p-7">
            <p className="mb-6 max-w-2xl text-sm leading-relaxed text-slate-600">
              Register this device’s biometrics or security key for passwordless sign-in.
            </p>
            <Button onClick={handleRegisterPasskey} disabled={passkeyLoading} className="min-h-11 w-full sm:w-auto">
              {passkeyLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <KeyRound size={16} className="mr-2" />}
              {passkeyLoading ? 'Registering…' : 'Register passkey'}
            </Button>
            </div>
          </div>
          
          {/* Telegram Account Linking */}
          <div className="app-panel overflow-hidden p-0">
            <div className="border-b border-slate-100 bg-slate-50/70 p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                <Send size={19} strokeWidth={1.9} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{tx('Telegram Account Linking', 'Telegram 계정 연결')}</h2>
                <p className="mt-0.5 text-xs text-slate-500">Connect your Telegram identity</p>
              </div>
            </div>
            </div>

            <div className="p-5 sm:p-7">
            <p className="mb-6 max-w-2xl text-sm leading-relaxed text-slate-600">
              Link your Telegram account to manage your bot and access features directly from Telegram. This enables secure authentication and seamless bot integration.
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-slate-400" />
              </div>
            ) : telegramLinkStatus.linked ? (
              <div className="space-y-4">
                {/* Linked Status */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <ShieldCheck size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-green-900">Telegram Account Linked</p>
                    <p className="text-[12px] text-green-700 mt-1">
                      {telegramLinkStatus.telegram_username && (
                        <>
                          Username: <code className="bg-white px-2 py-1 rounded text-green-900 font-mono">@{telegramLinkStatus.telegram_username}</code>
                        </>
                      )}
                      {telegramLinkStatus.telegram_id && (
                        <div className="mt-2">
                          ID: <code className="bg-white px-2 py-1 rounded text-green-900 font-mono text-[11px]">{telegramLinkStatus.telegram_id}</code>
                        </div>
                      )}
                    </p>
                  </div>
                </div>

                {/* Unlink Button */}
                <button
                  onClick={() => setShowUnlinkDialog(true)}
                  className="w-full flex items-center justify-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors px-4 py-3 rounded-xl font-semibold text-[13px]"
                >
                  <Unlink2 size={16} />
                  Unlink Telegram Account
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Not Linked Status */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-[13px] font-semibold text-amber-900">Not linked yet</p>
                  <p className="text-[12px] text-amber-700 mt-2">
                    Your Telegram account is not currently linked. You can link it using the login widget or by following the instructions below.
                  </p>
                </div>

                {/* Link Button */}
                {telegramBotName && !linking ? (
                  <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                    <TelegramLoginWidget botName={telegramBotName} onAuth={handleTelegramLink} />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Continue with Telegram</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500">A Telegram window will open to verify your account.</p>
                    </div>
                  </div>
                ) : linking ? (
                  <div className="flex items-center justify-center gap-2 py-3 text-[13px] text-slate-500">
                    <Loader2 size={16} className="animate-spin" /> Linking Telegram account...
                  </div>
                ) : null}

                <p className="text-[12px] text-slate-500 text-center">
                  💡 Tip: You can also link by logging in with Telegram on the login page
                </p>
              </div>
            )}
            </div>
          </div>

          {/* Google Account Linking */}
          <div className="app-panel overflow-hidden p-0">
            <div className="border-b border-slate-100 bg-slate-50/70 p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                <Chrome size={19} strokeWidth={1.9} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{tx('Google Account Linking', 'Google 계정 연결')}</h2>
                <p className="mt-0.5 text-xs text-slate-500">Use your trusted Google identity</p>
              </div>
            </div>
            </div>
            <div className="p-5 sm:p-7">
            <p className="mb-6 max-w-2xl text-sm leading-relaxed text-slate-600">
              Link the Google account that uses your SwiftPay email for a faster and more secure sign-in.
            </p>
            {googleLinkStatus.linked ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-green-900">Google Account Linked</p>
                  <p className="text-[12px] text-green-700 mt-1">{googleLinkStatus.google_email}</p>
                </div>
              </div>
            ) : googleClientId ? (
              linking ? (
                <div className="flex items-center justify-center gap-2 py-3 text-[13px] text-slate-500">
                  <Loader2 size={16} className="animate-spin" /> Linking Google account...
                </div>
              ) : (
                <div className="flex min-h-11 w-full max-w-full items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 sm:w-fit">
                  <div ref={googleButtonRef} className="max-w-full" />
                </div>
              )
            ) : (
              <p className="text-[12px] text-slate-500">Google account linking is not configured.</p>
            )}
            </div>
          </div>

          {/* Password / Security Section */}
          <div className="app-panel overflow-hidden p-0">
            <div className="border-b border-slate-100 bg-slate-50/70 p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                <LockKeyhole size={19} strokeWidth={1.9} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{tx('Password', '비밀번호')}</h2>
                <p className="mt-0.5 text-xs text-slate-500">Maintain a strong account credential</p>
              </div>
            </div>
            </div>

            <div className="p-5 sm:p-7">
            <p className="text-[14px] text-slate-600 mb-6">
              Keep your account secure by using a strong, unique password.
            </p>

            <button
              onClick={() => navigate('/change-password')}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-3 rounded-xl font-semibold text-[13px] transition-colors"
            >
              Change Password
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions Dialog */}
      <Dialog open={linkingInstructions} onOpenChange={setLinkingInstructions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>How to Link Telegram Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">1</div>
                <div>
                  <p className="font-semibold text-[13px] text-slate-900">Use the Login Widget</p>
                  <p className="text-[12px] text-slate-600 mt-1">On the login page, click "Sign in with Telegram" to authenticate with your Telegram account.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">2</div>
                <div>
                  <p className="font-semibold text-[13px] text-slate-900">Confirm Your Details</p>
                  <p className="text-[12px] text-slate-600 mt-1">Make sure your Telegram username matches your account username for automatic linking.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">3</div>
                <div>
                  <p className="font-semibold text-[13px] text-slate-900">Instant Linking</p>
                  <p className="text-[12px] text-slate-600 mt-1">Your accounts will be automatically linked, and you'll see the status here.</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-[12px] text-blue-900">
                ℹ️ <strong>Note:</strong> Your Telegram username must match your account username for automatic linking to work.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLinkingInstructions(false)}
              className="w-full"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlink Confirmation Dialog */}
      <Dialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unlink Telegram Account?</DialogTitle>
          </DialogHeader>
          <p className="text-[14px] text-slate-600 py-4">
            Are you sure you want to unlink your Telegram account? You won't be able to log in with Telegram until you link it again.
          </p>
          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowUnlinkDialog(false)}
              disabled={unlinkLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnlinkTelegram}
              disabled={unlinkLoading}
              className="flex-1"
            >
              {unlinkLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Unlinking...
                </>
              ) : (
                'Unlink'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
