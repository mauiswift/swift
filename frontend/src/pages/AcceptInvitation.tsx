import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface InvitationDetails {
  email: string;
  role: string;
  organization_name?: string;
  accepted_at?: string;
}

type PageState =
  | { status: 'loading' }
  | { status: 'ready'; invitation: InvitationDetails }
  | { status: 'complete'; invitation: InvitationDetails }
  | { status: 'error'; message: string };

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState<PageState>({ status: 'loading' });
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setPage({ status: 'error', message: 'This invitation link is missing its token.' });
      return;
    }

    let cancelled = false;
    fetch(`/api/v1/team/invitations/${encodeURIComponent(token)}`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.detail || 'This invitation is unavailable.');
        return body;
      })
      .then((body) => { if (!cancelled) setPage({ status: 'ready', invitation: body.invitation }); })
      .catch((error: unknown) => {
        if (!cancelled) setPage({ status: 'error', message: error instanceof Error ? error.message : 'This invitation is unavailable.' });
      });

    return () => { cancelled = true; };
  }, [token]);

  if (page.status === 'loading') {
    return <InvitationShell><Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" /></InvitationShell>;
  }

  if (page.status === 'error') {
    return (
      <InvitationShell>
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-5 text-2xl font-semibold text-foreground">Invitation unavailable</h1>
        <p className="mt-3 text-muted-foreground">{page.message}</p>
        <Button asChild className="mt-6"><Link to="/">Return home</Link></Button>
      </InvitationShell>
    );
  }

  const { invitation } = page;
  if (page.status === 'complete') {
    return (
      <InvitationShell>
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h1 className="mt-5 text-2xl font-semibold text-foreground">Account created</h1>
        <p className="mt-3 text-muted-foreground">Your team access is ready. Sign in with {invitation.email} and the password you created.</p>
        <Button asChild className="mt-6 w-full"><Link to="/login">Continue to sign in</Link></Button>
      </InvitationShell>
    );
  }
  return (
    <InvitationShell>
      <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
      <h1 className="mt-5 text-2xl font-semibold text-foreground">Invitation accepted</h1>
      <p className="mt-3 text-muted-foreground">
        You have been invited as <strong>{invitation.role}</strong>
        {invitation.organization_name ? <> to <strong>{invitation.organization_name}</strong></> : null}.
      </p>
      <InvitationForm token={token || ''} invitation={invitation} onComplete={(value) => setPage({ status: 'complete', invitation: value })} />
    </InvitationShell>
  );
}

function InvitationForm({ token, invitation, onComplete }: { token: string; invitation: InvitationDetails; onComplete: (invitation: InvitationDetails) => void }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`/api/v1/team/invitations/accept/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirm_password: confirmPassword, full_name: fullName }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.detail || 'Unable to create your account.');
      onComplete(body.invitation || invitation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="mt-6 space-y-4 text-left" onSubmit={submit}>
      <p className="text-sm text-muted-foreground">Create your password to activate access for <strong>{invitation.email}</strong>.</p>
      <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name (optional)" />
      <Input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password (at least 8 characters)" />
      <Input required minLength={8} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full">{submitting ? 'Creating account...' : 'Create account'}</Button>
    </form>
  );
}

function InvitationShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#e2e8f0,_#f8fafc_45%)] px-4 py-8 sm:px-6 sm:py-12 text-center">
        <section className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <div className="bg-slate-900 px-6 py-5 text-left">
            <div className="flex items-center gap-2 text-lg font-semibold text-white">
              <Users className="h-5 w-5" /> SwiftPay
            </div>
            <p className="mt-1 text-xs text-slate-300">Secure team access</p>
          </div>
          <div className="p-6 sm:p-8">
            <div className="mb-4 flex justify-center text-slate-700"><ShieldCheck className="h-5 w-5" /></div>
            {children}
          </div>
        </section>
    </main>
  );
}