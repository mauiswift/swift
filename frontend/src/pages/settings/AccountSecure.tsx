import { useState, useEffect } from 'react';
import { ChevronLeft, Loader2, Send, Unlink2, Lock, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { client } from '@/lib/api';
import { TelegramWidgetUser } from '@/lib/auth';
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

export default function AccountSecure() {
  const navigate = useNavigate();
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

  // Fetch current telegram link status
  useEffect(() => {
    const fetchTelegramStatus = async () => {
      try {
        setLoading(true);
        const res = await client.get('/api/v1/auth/telegram-link-status');
        if (res.ok && res.data) {
          setTelegramLinkStatus(res.data);
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
      <div className="page-enter pb-20">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-8 font-medium">
          <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={() => navigate('/settings')}>Settings</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-semibold">Account & Security</span>
        </div>

        {/* Title */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate('/settings')}
              type="button"
              aria-label="Back to settings"
              title="Back to settings"
              className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">Account & Security</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8 max-w-2xl">
          
          {/* Telegram Account Linking */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Send size={20} />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 m-0">Telegram Account Linking</h2>
            </div>

            <p className="text-[14px] text-slate-600 mb-6 leading-relaxed">
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
                  <Shield size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
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
                  <TelegramLoginWidget botName={telegramBotName} onAuth={handleTelegramLink} />
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

          {/* Password / Security Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Lock size={20} />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 m-0">Password</h2>
            </div>

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
