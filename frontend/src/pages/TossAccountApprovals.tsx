import { useCallback, useEffect, useState } from 'react';
import { Building2, CheckCircle2, Clock, Copy, Mail, Pencil, RefreshCw, Search, Send, ShieldCheck, UserRound, XCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { client } from '@/lib/api';
import { normalizeKrwBankName } from '@/config/krw-banks';
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
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { copyTextToClipboard } from '@/lib/clipboard';

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
    virtual_account?: {
      bank_name?: string;
      account_number?: string;
      account_holder_name?: string;
      status?: 'active' | 'suspended';
    };
  };
};

type TossPoolAccount = {
  id: number;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  is_active: boolean;
  last_assigned_at?: string | null;
};

export function TossAccountApprovalsPanel() {
  const [items, setItems] = useState<TossApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ item: TossApplication; action: 'approve' | 'reject' } | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [accountTarget, setAccountTarget] = useState<TossApplication | null>(null);
  const [accountForm, setAccountForm] = useState({ bank_name: '', account_number: '', account_holder_name: '', status: 'active' as 'active' | 'suspended' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_review' | 'active' | 'suspended'>('all');
  const [pool, setPool] = useState<TossPoolAccount[]>([]);
  const [poolForm, setPoolForm] = useState({ bank_name: 'Toss Bank', account_number: '', account_holder_name: '', is_active: true });
  const [editingPoolId, setEditingPoolId] = useState<number | null>(null);
  const [updatingPoolId, setUpdatingPoolId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [response, poolResponse] = await Promise.all([
        client.get('/api/v1/admin/toss-virtual-accounts'),
        client.get('/api/v1/admin/toss-account-pool'),
      ]);
      if (!response.ok) throw new Error(response.data?.detail || 'Unable to load TOSS applications');
      setItems(response.data?.items || []);
      if (poolResponse.ok) setPool(poolResponse.data?.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load TOSS applications');
    } finally {
      setLoading(false);
    }
  }, []);

  const savePoolAccount = async () => {
    if (!poolForm.account_number.trim() || !poolForm.account_holder_name.trim()) {
      toast.error('Bank account number and holder name are required.');
      return;
    }
    const response = await client.request(
      editingPoolId ? `/api/v1/admin/toss-account-pool/${editingPoolId}` : '/api/v1/admin/toss-account-pool',
      editingPoolId ? 'PATCH' : 'POST',
      poolForm,
    );
    if (!response.ok) {
      toast.error(response.data?.detail || 'Unable to save TOSS pool account.');
      return;
    }
    setPoolForm({ bank_name: 'Toss Bank', account_number: '', account_holder_name: '', is_active: true });
    toast.success(editingPoolId ? 'TOSS pool account updated.' : 'TOSS pool account added.');
    setEditingPoolId(null);
    await load();
  };

  const editPoolAccount = (account: TossPoolAccount) => {
    setPoolForm({
      bank_name: normalizeKrwBankName(account.bank_name),
      account_number: account.account_number,
      account_holder_name: account.account_holder_name,
      is_active: account.is_active,
    });
    setEditingPoolId(account.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const togglePoolAccount = async (account: TossPoolAccount, isActive: boolean) => {
    setUpdatingPoolId(account.id);
    try {
      const response = await client.request(
        `/api/v1/admin/toss-account-pool/${account.id}`,
        'PATCH',
        {
          bank_name: account.bank_name,
          account_number: account.account_number,
          account_holder_name: account.account_holder_name,
          is_active: isActive,
        },
      );
      if (!response.ok) {
        throw new Error(response.data?.detail || 'Unable to update TOSS checkout availability.');
      }
      setPool(accounts => accounts.map(item => (
        item.id === account.id ? { ...item, is_active: isActive } : item
      )));
      toast.success(isActive ? 'TOSS account enabled for checkout.' : 'TOSS account disabled for checkout.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to update TOSS checkout availability.');
    } finally {
      setUpdatingPoolId(null);
    }
  };

  useEffect(() => { void load(); }, [load]);

  const filteredItems = items.filter((item) => {
    const accountStatus = item.application.virtual_account?.status || '';
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'pending_review' && item.status === 'pending_review')
      || (statusFilter === 'active' && item.status === 'approved' && accountStatus !== 'suspended')
      || (statusFilter === 'suspended' && accountStatus === 'suspended');
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [
      item.user_id,
      item.name,
      item.email,
      item.application.legal_name,
      item.application.contact_email,
      item.application.virtual_account?.account_number,
    ].some((value) => value?.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  const copyAccount = async (item: TossApplication) => {
    const account = item.application.virtual_account;
    if (!account?.account_number) return;
    const copied = await copyTextToClipboard(
      `${account.bank_name || 'Toss Bank'}\n${account.account_number}\n${account.account_holder_name || ''}`,
    );
    if (copied) toast.success('Account details copied.');
    else toast.error('Unable to copy account details.');
  };

  const openAccountControl = (item: TossApplication) => {
    const account = item.application.virtual_account || {};
    setAccountForm({
      bank_name: account.bank_name || 'Toss Bank',
      account_number: account.account_number || '',
      account_holder_name: account.account_holder_name || item.application.legal_name || item.name || '',
      status: account.status || 'active',
    });
    setAccountTarget(item);
  };

  const saveAccountControl = async () => {
    if (!accountTarget) return;
    setReviewing(`${accountTarget.user_id}:account`);
    try {
      const response = await client.request(`/api/v1/admin/toss-virtual-accounts/${accountTarget.user_id}/account`, 'PATCH', accountForm);
      if (!response.ok) throw new Error(response.data?.detail || 'Unable to update TOSS account');
      toast.success('TOSS account controls updated.');
      setAccountTarget(null);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update TOSS account';
      setError(message);
      toast.error(message);
    } finally {
      setReviewing(null);
    }
  };

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

  const pendingReviewCount = items.filter((item) => item.status === 'pending_review').length;
  const activeAccountCount = items.filter((item) => item.status === 'approved' && item.application.virtual_account?.status !== 'suspended').length;
  const suspendedAccountCount = items.filter((item) => item.application.virtual_account?.status === 'suspended').length;
  const activePoolCount = pool.filter((account) => account.is_active).length;

  return (
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="min-w-0 space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">Pending review</p>
              <p className="mt-2 text-2xl font-semibold text-orange-950">{pendingReviewCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Active accounts</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-950">{activeAccountCount}</p>
            </div>
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Suspended accounts</p>
              <p className="mt-2 text-2xl font-semibold text-red-950">{suspendedAccountCount}</p>
            </div>
          </div>

          {error && <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><XCircle size={18} className="mt-0.5 shrink-0" />{error}</div>}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search applicant, email, ID, or account number" className="pl-9" />
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-slate-700">
              <option value="all">All statuses</option>
              <option value="pending_review">Pending review</option>
              <option value="active">Active accounts</option>
              <option value="suspended">Suspended accounts</option>
            </select>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="flex min-h-64 flex-col items-center justify-center p-12 text-center text-slate-500">
                <RefreshCw size={24} className="mb-3 animate-spin text-[#FF6B00]" />
                <p className="text-sm font-medium">Loading applications...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center p-12 text-center">
                <div className="rounded-full bg-emerald-50 p-3 text-emerald-600"><CheckCircle2 size={26} /></div>
                <p className="mt-4 text-sm font-semibold text-slate-900">{items.length ? 'No matching applications' : 'No TOSS applications'}</p>
                <p className="mt-1 text-sm text-slate-500">{items.length ? 'Try a different search or status filter.' : 'New applications will appear here when submitted.'}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <article key={item.user_id} className="p-5 transition-colors hover:bg-slate-50/60 sm:p-6">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00]"><Building2 size={19} /></div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="truncate text-base font-semibold text-slate-900">{item.application.legal_name || item.name || item.user_id}</h2>
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.status === 'pending_review' ? 'border-amber-200 bg-amber-50 text-amber-700' : item.application.virtual_account?.status === 'suspended' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{item.status === 'pending_review' ? 'Pending review' : item.application.virtual_account?.status === 'suspended' ? 'Account suspended' : 'Account active'}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">Applicant ID: <span className="font-mono">{item.user_id}</span></p>
                          </div>
                        </div>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div><p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><Mail size={13} />Contact</p><p className="mt-1 break-all text-sm text-slate-700">{item.application.contact_email || item.email || 'No email'}</p></div>
                          <div><p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><Send size={13} />Telegram</p><p className="mt-1 text-sm text-slate-700">{item.telegram_username ? `@${item.telegram_username}` : 'Not provided'}</p></div>
                          <div><p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><Building2 size={13} />Business</p><p className="mt-1 text-sm text-slate-700">{item.application.business_type || 'Not provided'} · {item.application.country || '—'}</p></div>
                          <div><p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><UserRound size={13} />Purpose</p><p className="mt-1 text-sm text-slate-700">{item.application.purpose || 'Not provided'}</p></div>
                        </div>
                        <div className="mt-4 grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm sm:grid-cols-3">
                          <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Monthly volume</p><p className="mt-1 font-medium text-slate-800">{item.application.monthly_volume || 'Not provided'}</p></div>
                          <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Requested currency</p><p className="mt-1 font-medium text-slate-800">{item.application.currencies?.join(', ') || 'KRW'}</p></div>
                          <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Review readiness</p><p className="mt-1 font-medium text-emerald-700">Signature and eligibility verified</p></div>
                        </div>
                        {item.application.virtual_account && (
                          <div className="mt-4 grid gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm sm:grid-cols-3">
                            <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Bank</p><p className="mt-1 font-medium text-slate-800">{item.application.virtual_account.bank_name || '—'}</p></div>
                            <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Account number</p><p className="mt-1 flex items-center gap-2 font-mono font-medium text-slate-800">{item.application.virtual_account.account_number || '—'}<button type="button" title="Copy account details" aria-label="Copy account details" className="text-blue-600 hover:text-blue-800" onClick={() => void copyAccount(item)}><Copy size={14} /></button></p></div>
                            <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Holder</p><p className="mt-1 font-medium text-slate-800">{item.application.virtual_account.account_holder_name || '—'}</p></div>
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row xl:border-t-0 xl:pt-0">
                        {item.status === 'pending_review' ? <>
                          <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" disabled={reviewing !== null} onClick={() => openReview(item, 'reject')}><XCircle size={15} className="mr-2" />Reject</Button>
                          <Button className="bg-emerald-600 text-white hover:bg-emerald-700" disabled={reviewing !== null} onClick={() => openReview(item, 'approve')}><CheckCircle2 size={15} className="mr-2" />Approve</Button>
                        </> : <Button variant="outline" disabled={reviewing !== null} onClick={() => openAccountControl(item)}><Pencil size={15} className="mr-2" />Manage account</Button>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-900">TOSS payment account pool</h2>
                  <p className="mt-1 text-sm text-slate-600">Add active 토스페이 accounts here. Each new KRW payment session randomly uses an active account and avoids the account assigned to the previous session whenever another is available.</p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">{activePoolCount} active</span>
              </div>
              {editingPoolId !== null && (
                <p className="text-xs font-semibold text-blue-700">Editing pool account #{editingPoolId}</p>
              )}
            </div>

            <div className="mt-4 grid gap-3">
              <Input value={poolForm.bank_name} onChange={(event) => setPoolForm({ ...poolForm, bank_name: event.target.value })} placeholder="Bank name" />
              <Input value={poolForm.account_number} onChange={(event) => setPoolForm({ ...poolForm, account_number: event.target.value })} placeholder="Account number" />
              <Input value={poolForm.account_holder_name} onChange={(event) => setPoolForm({ ...poolForm, account_holder_name: event.target.value })} placeholder="Account holder name" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <label className={`flex min-h-10 flex-1 cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors ${poolForm.is_active ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 bg-slate-50'}`}>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-slate-800">Checkout availability</span>
                    <span className={`mt-0.5 block text-[10px] ${poolForm.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>{poolForm.is_active ? 'Included in rotation' : 'Excluded from rotation'}</span>
                  </span>
                  <Switch
                    checked={poolForm.is_active}
                    onCheckedChange={(isActive) => setPoolForm({ ...poolForm, is_active: isActive })}
                    aria-label="Include this account in checkout rotation"
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </label>
                <div className="flex gap-2 sm:flex-col">
                  <Button onClick={() => void savePoolAccount()} className="flex-1 sm:flex-none">
                    <Building2 size={14} className="mr-2" />{editingPoolId ? 'Save account' : 'Add account'}
                  </Button>
                  {editingPoolId !== null && (
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setEditingPoolId(null);
                        setPoolForm({ bank_name: 'Toss Bank', account_number: '', account_holder_name: '', is_active: true });
                      }}
                      className="flex-1 sm:flex-none"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {pool.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-xl border border-blue-100 bg-white">
                <div className="max-h-[min(48vh,420px)] overflow-y-auto">
                  {pool.map((account) => (
                    <div key={account.id} className="flex flex-col gap-3 border-b border-slate-100 p-3 last:border-0 sm:px-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${account.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Building2 size={16} />
                        </span>
                        <div className="min-w-0 text-sm">
                          <p className="truncate font-semibold text-slate-800">{normalizeKrwBankName(account.bank_name)} <span className="font-normal text-slate-300">·</span> <span className="font-mono font-medium">{account.account_number}</span></p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">{account.account_holder_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2">
                        <label className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${account.is_active ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 bg-slate-50'}`}>
                          <span className="min-w-24">
                            <span className={`block text-xs font-semibold ${account.is_active ? 'text-emerald-800' : 'text-slate-600'}`}>{account.is_active ? 'Active' : 'Inactive'}</span>
                            <span className="block text-[10px] text-slate-500">{account.is_active ? 'Used for checkout' : 'Not in rotation'}</span>
                          </span>
                          <Switch
                            checked={account.is_active}
                            disabled={updatingPoolId !== null}
                            onCheckedChange={(isActive) => void togglePoolAccount(account, isActive)}
                            aria-label={`${account.is_active ? 'Disable' : 'Enable'} ${normalizeKrwBankName(account.bank_name)} ${account.account_number} for checkout`}
                            className="data-[state=checked]:bg-emerald-600"
                          />
                        </label>
                        <Button variant="outline" size="sm" disabled={updatingPoolId !== null} onClick={() => editPoolAccount(account)}><Pencil size={13} className="mr-1" />Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </aside>
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
        <Dialog open={accountTarget !== null} onOpenChange={(open) => !open && setAccountTarget(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Manage approved TOSS account</DialogTitle></DialogHeader>
            <p className="text-sm text-slate-500">{accountTarget?.application.legal_name || accountTarget?.name || accountTarget?.user_id}</p>
            <div className="grid gap-4">
              <label className="text-sm font-medium text-slate-700">Bank name<input className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={accountForm.bank_name} onChange={(event) => setAccountForm({ ...accountForm, bank_name: event.target.value })} /></label>
              <label className="text-sm font-medium text-slate-700">Account number<input className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm" value={accountForm.account_number} onChange={(event) => setAccountForm({ ...accountForm, account_number: event.target.value })} /></label>
              <label className="text-sm font-medium text-slate-700">Account holder<input className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={accountForm.account_holder_name} onChange={(event) => setAccountForm({ ...accountForm, account_holder_name: event.target.value })} /></label>
              <label className="text-sm font-medium text-slate-700">Account status<select className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={accountForm.status} onChange={(event) => setAccountForm({ ...accountForm, status: event.target.value as 'active' | 'suspended' })}><option value="active">Active</option><option value="suspended">Suspended</option></select></label>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setAccountTarget(null)}>Cancel</Button><Button onClick={() => void saveAccountControl()} disabled={reviewing !== null || !accountForm.bank_name.trim() || !accountForm.account_number.trim() || !accountForm.account_holder_name.trim()}>Save changes</Button></DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}

export default function TossAccountApprovals() {
  return (
    <Layout>
      <TossAccountApprovalsPanel />
    </Layout>
  );
}
