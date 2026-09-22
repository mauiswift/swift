import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InvitationDetails {
  email: string;
  role: string;
  organization_name?: string;
  accepted_at?: string;
}

type PageState =
  | { status: 'loading' }
  | { status: 'ready'; invitation: InvitationDetails }
  | { status: 'error'; message: string };

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [page, setPage] = useState<PageState>({ status: 'loading' });
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setPage({ status: 'error', message: 'This invitation link is missing its token.' });
      return;
    }

    let cancelled = false;
    fetch(`/api/v1/team/invitations/accept/${encodeURIComponent(token)}`, { method: 'POST' })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.detail || 'This invitation could not be accepted.');
        return body;
      })
      .then((body) => {
        if (!cancelled) setPage({ status: 'ready', invitation: body.invitation });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setPage({
            status: 'error',
            message: error instanceof Error ? error.message : 'This invitation could not be accepted.',
          });
        }
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
  const registrationUrl = `/register?email=${encodeURIComponent(invitation.email)}`;
  return (
    <InvitationShell>
      <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
      <h1 className="mt-5 text-2xl font-semibold text-foreground">Invitation accepted</h1>
      <p className="mt-3 text-muted-foreground">
        You have been invited as <strong>{invitation.role}</strong>
        {invitation.organization_name ? <> to <strong>{invitation.organization_name}</strong></> : null}.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">Continue registration with {invitation.email} to finish setting up access.</p>
      <Button className="mt-6 w-full" onClick={() => navigate(registrationUrl)}>Continue registration</Button>
    </InvitationShell>
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