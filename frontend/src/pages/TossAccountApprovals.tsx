import { useCallback, useEffect, useState } from 'react';
import { Building2, CheckCircle2, Clock, Mail, RefreshCw, Send, ShieldCheck, UserRound, XCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { client } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type TossApplication = {
  user_id: string;
  name?: string | null;
  email?: string | null;
  telegram_username?: string | null;
  status: string;
  application: {
    legal_name?: string;
    country?: string;
    business_type?: string;
    monthly_volume?: string;
    currencies?: string[];
    contact_email?: string;
    purpose?: string;
    review_note?: string | null;
  };
};

export default function TossAccountApprovals() {
  const [items, setItems] = useState<TossApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ item: TossApplication; action: 'approve' | 'reject' } | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await client.get('/api/v1/admin/toss-virtual-accounts?status_filter=pending_review');
      if (!response.ok) throw new Error(response.data?.detail || 'Unable to load TOSS applications');
      setItems(response.data?.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load TOSS applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openReview = (item: TossApplication, action: 'approve' | 'reject') => {
    setReviewNote(action === 'approve' ? 'Approved by Relationship Manager' : '');
    setReviewTarget({ item, action });
  };

  const review = async () => {
    if (!reviewTarget) return;
    const { item, action } = reviewTarget;
    setReviewTarget(null);
    setReviewing(`${item.user_id}:${action}`);
    setError('');
    try {
      const response = await client.post(`/api/v1/admin/toss-virtual-accounts/${item.user_id}/${action}`, {
        note: reviewNote.trim() || undefined,
      });
      if (!response.ok) {
        throw new Error(response.data?.detail || `Unable to ${action} application`);
      }
      toast.success(action === 'approve' ? 'TOSS Bank application approved.' : 'TOSS Bank application rejected.');
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : `Unable to ${action} application`;
      setError(message);
      toast.error(message);
    } finally {
      setReviewing(null);
      setReviewNote('');
    }
  };

  return (
    <Layout>
      <div className="page-enter">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                <ShieldCheck size={14} className="text-[#FF6B00]" />
                Super admin review
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-sm">
                <ShieldCheck size={12} />
                Security Badge
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">TOSS Bank Account Applications</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review business details before opening a TOSS Bank virtual account for the applicant.</p>
          </div>
          <Button variant="outline" onClick={() => void load()} disabled={loading} className="w-full sm:w-auto">
            <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh applications
          </Button>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">Pending review</p>
            <p className="mt-2 text-2xl font-semibold text-orange-950">{items.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Review type</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">Virtual account opening</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next step</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">Approve or reject each request</p>
          </div>
        </div>

        {error && <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><XCircle size={18} className="mt-0.5 shrink-0" />{error}</div>}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-12 text-center text-slate-500">
              <RefreshCw size={24} className="mb-3 animate-spin text-[#FF6B00]" />
              <p className="text-sm font-medium">Loading applications...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-12 text-center">
              <div className="rounded-full bg-emerald-50 p-3 text-emerald-600"><CheckCircle2 size={26} /></div>
              <p className="mt-4 text-sm font-semibold text-slate-900">No pending TOSS applications</p>
              <p className="mt-1 text-sm text-slate-500">New applications will appear here when submitted.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <article key={item.user_id} className="p-5 transition-colors hover:bg-slate-50/60 sm:p-6">
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00]"><Building2 size={19} /></div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-base font-semibold text-slate-900">{item.application.legal_name || item.name || item.user_id}</h2>
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">Pending review</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">Applicant ID: <span className="font-mono">{item.user_id}</span></p>
                        </div>
                      </div>
                      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div><p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><Mail size={13} />Contact</p><p className="mt-1 text-sm text-slate-700 break-all">{item.application.contact_email || item.email || 'No email'}</p></div>
                        <div><p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><Send size={13} />Telegram</p><p className="mt-1 text-sm text-slate-700">{item.telegram_username ? `@${item.telegram_username}` : 'Not provided'}</p></div>
                        <div><p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><Building2 size={13} />Business</p><p className="mt-1 text-sm text-slate-700">{item.application.business_type || 'Not provided'} · {item.application.country || '—'}</p></div>
                        <div><p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><UserRound size={13} />Purpose</p><p className="mt-1 text-sm text-slate-700">{item.application.purpose || 'Not provided'}</p></div>
                      </div>
                      <div className="mt-4 grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm sm:grid-cols-3">
                        <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Monthly volume</p><p className="mt-1 font-medium text-slate-800">{item.application.monthly_volume || 'Not provided'}</p></div>
                        <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Requested currency</p><p className="mt-1 font-medium text-slate-800">{item.application.currencies?.join(', ') || 'KRW'}</p></div>
                        <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Review readiness</p><p className="mt-1 font-medium text-emerald-700">Signature and eligibility verified</p></div>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row xl:border-t-0 xl:pt-0">
                      <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" disabled={reviewing !== null} onClick={() => openReview(item, 'reject')}><XCircle size={15} className="mr-2" />Reject</Button>
                      <Button className="bg-emerald-600 text-white hover:bg-emerald-700" disabled={reviewing !== null} onClick={() => openReview(item, 'approve')}><CheckCircle2 size={15} className="mr-2" />Approve</Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        <Dialog open={reviewTarget !== null} onOpenChange={(open) => !open && setReviewTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {reviewTarget?.action === 'approve' ? 'Approve TOSS Bank application' : 'Reject TOSS Bank application'}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-500">
              {reviewTarget?.item.application.legal_name || reviewTarget?.item.name || reviewTarget?.item.user_id}
            </p>
            <Textarea
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              placeholder="Add an internal review note"
              className="min-h-24"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewTarget(null)}>Cancel</Button>
              <Button
                className={reviewTarget?.action === 'approve' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-600 text-white hover:bg-red-700'}
                disabled={reviewing !== null || (reviewTarget?.action === 'reject' && !reviewNote.trim())}
                onClick={() => void review()}
              >
                {reviewTarget?.action === 'approve' ? 'Confirm approval' : 'Confirm rejection'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
