import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserPlus,
  Mail,
  Shield,
  Clock,
  Trash2,
  Check,
  X,
  Users,
  Lock,
  Loader2,
  AlertTriangle,
  Search,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { getRoleDisplayName } from '@/lib/roleDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { buildAuthHeaders } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface TeamInvitation {
  id: number;
  email: string;
  role: string;
  status: string;
  invited_at: string;
  expires_at?: string;
  invited_by: string;
  permissions: Record<string, boolean>;
  notes?: string;
  organization_id?: string;
  organization_name?: string;
  email_sent?: boolean;
  email_error?: string;
}

function RoleBadge({ role }: { role: string }) {
  if (role.trim().toLowerCase() === 'store') {
    return (
      <span
        className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800"
        aria-label="Powered by DRL Technology"
      >
        <span>Powered by</span>
        <img
          src="/partners/drl-technology-gold.png"
          alt="DRL Technology"
          className="h-4 w-auto max-w-[92px] object-contain"
        />
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
      <Shield className="h-3 w-3" />
      {getRoleDisplayName(role)}
    </span>
  );
}

interface TeamMember {
  id: number;
  name?: string;
  email?: string | null;
  telegram_id: string;
  role: string;
  permissions: Record<string, boolean>;
  joined_at: string;
  is_active: boolean;
  organization_id?: string;
  organization_name?: string;
}

interface OrganizationWalletBalance {
  organization_id: string;
  organization_name?: string;
  wallet_id: number;
  currency: string;
  balance: number;
  available_balance: number;
  pending_balance: number;
}

const PERMISSION_LABELS: Record<string, string> = {
  can_add_delete_user: 'Add/Delete User',
  can_edit_user_access: 'Edit User Access',
  can_edit_business_settings: 'Edit Business Settings',
  can_add_edit_delete_cards_promotion: 'Cards Promotion',
  can_upload_delete_batch_disbursements: 'Batch Disbursements',
  can_validate_batch_disbursements: 'Validate Disbursements',
  can_generate_invoice: 'Generate Invoice',
  can_add_edit_customers: 'Manage Customers',
  can_view_transaction_details: 'View Transactions',
  can_download_csv_report: 'Download Reports',
  can_withdraw_funds: 'Withdraw Funds',
  can_create_transfers: 'Create Transfers',
  can_add_edit_delete_withdrawal_account: 'Manage Withdrawal Account',
  can_see_api_keys: 'See API Keys',
  can_resend_callbacks: 'Resend Callbacks',
  can_change_callback_urls: 'Change Callback URLs',
  can_approve_batch_disbursements: 'Approve Disbursements',
  can_refund_cards_charges: 'Refund Cards',
  can_manage_team: 'Manage Team',
  can_credit_wallet: 'Credit Wallet',
  can_debit_wallet: 'Debit Wallet',
  can_freeze_wallet: 'Freeze Wallet',
  can_unfreeze_wallet: 'Unfreeze Wallet',
};

type ApiError = { message?: string };

const INVITATION_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  expired: 'bg-slate-100 text-slate-600 border border-slate-200',
  revoked: 'bg-slate-100 text-slate-600 border border-slate-200',
};

function getErrorMessage(error: unknown, fallback: string) {
  return error && typeof error === 'object' && 'message' in error
    ? String((error as ApiError).message || fallback)
    : fallback;
}

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
}

function getInvitationStatusStyle(status: string) {
  return INVITATION_STATUS_STYLES[status] || INVITATION_STATUS_STYLES.revoked;
}

function getPermissionLabels(permissions: Record<string, boolean>) {
  return Object.entries(permissions)
    .filter(([, enabled]) => enabled)
    .map(([permission]) => PERMISSION_LABELS[permission] || permission);
}

function getMemberInitials(member: TeamMember) {
  const source = member.name?.trim() || member.email?.trim() || member.telegram_id;
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
}

async function apiFetch(url: string, options?: RequestInit) {
  const headers = buildAuthHeaders(options?.headers);
  if (!headers.has('Content-Type') && options?.body) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(url, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

// ── Revoke Confirmation Dialog ────────────────────────────────────────────────

function RevokeConfirmDialog({
  email,
  onConfirm,
  onCancel,
}: {
  email: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { language } = useLanguage();
  const tx = (en: string, ko: string) => language === 'ko' ? ko : en;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="presentation">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4" role="dialog" aria-modal="true" aria-labelledby="revoke-invitation-title" aria-describedby="revoke-invitation-description">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p id="revoke-invitation-title" className="font-semibold text-foreground text-sm">{tx('Revoke Invitation', '초대 취소')}</p>
            <p className="text-xs text-slate-500 mt-0.5 break-all">{email}</p>
          </div>
        </div>
        <p id="revoke-invitation-description" className="text-sm text-slate-600 mb-5">
          This will cancel the invitation. The recipient will no longer be able to accept it.
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs"
            type="button"
            onClick={onConfirm}
          >
            Revoke
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Team Invitations Tab ──────────────────────────────────────────────────────

export function TeamInvitationsTab() {
  const { language } = useLanguage();
  const tx = (en: string, ko: string) => language === 'ko' ? ko : en;
  const { isSuperAdmin } = useAuth();
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('admin');
  const [email, setEmail] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [notes, setNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<TeamInvitation | null>(null);
  const [lastInvitationLink, setLastInvitationLink] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/v1/team/invitations');
      if (data?.invitations) setInvitations(data.invitations);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to load invitations'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchInvitations(); }, [fetchInvitations]);

  const handleSendInvitation = async () => {
    if (!email) { toast.error('Please enter an email address'); return; }
    if (isSuperAdmin && selectedRole === 'owner' && !organizationName.trim() && !organizationId.trim()) {
      toast.error('Organization name or ID is required for owner invitations');
      return;
    }
    try {
      setFormLoading(true);
      setLastInvitationLink(null);
      const data = await apiFetch('/api/v1/team/invite', {
        method: 'POST',
        body: JSON.stringify({
          email,
          role: selectedRole,
          organization_name: isSuperAdmin ? (organizationName.trim() || undefined) : undefined,
          organization_id: isSuperAdmin ? (organizationId.trim() || undefined) : undefined,
          notes: notes || undefined,
        }),
      });

      if (data?.manual_link) {
        setLastInvitationLink(data.manual_link);
      }

      if (data?.email_sent) {
        toast.success('Invitation email sent');
      } else {
        toast.error(data?.email_error || 'Invitation created, but the email could not be sent. Use the manual link below.');
      }
      setEmail(''); setOrganizationName(''); setOrganizationId(''); setNotes('');
      setSelectedRole('admin');
      // Keep form open if we have a link to show
      if (!data?.manual_link) setFormOpen(false);
      await fetchInvitations();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to send invitation'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return;
    const id = revokeTarget.id;
    setRevokeTarget(null);
    try {
      await apiFetch(`/api/v1/team/invitations/${id}`, { method: 'DELETE' });
      toast.success('Invitation revoked');
      await fetchInvitations();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to revoke invitation'));
    }
  };

  return (
    <div className="space-y-6">
      {revokeTarget && (
        <RevokeConfirmDialog
          email={revokeTarget.email}
          onConfirm={handleRevokeConfirm}
          onCancel={() => setRevokeTarget(null)}
        />
      )}

      {/* Send Invitation Form */}
      <Card className="overflow-hidden bg-white border border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/70 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                <UserPlus className="h-4 w-4" />
              </span>
              <span>
                {tx('Invite a team member', '팀원 초대')}
                <span className="block text-xs font-normal text-slate-500 mt-0.5">
                  {tx('Give a trusted teammate access to the shared organization wallet.', '신뢰할 수 있는 팀원에게 조직 공동 지갑 접근 권한을 부여하세요.')}
                </span>
              </span>
            </CardTitle>
            {!formOpen && (
              <Button size="sm" onClick={() => setFormOpen(true)} className="h-10 gap-2 shrink-0">
                <UserPlus className="h-3.5 w-3.5" />
                New Invitation
              </Button>
            )}
          </div>
        </CardHeader>

        {formOpen && (
          <CardContent className="pt-5 sm:pt-6">
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs leading-relaxed text-blue-800">
                {tx('Team members share your organization wallet. Only grant the permissions they need for their work.', '팀원은 조직 공동 지갑을 함께 사용합니다. 업무에 필요한 권한만 부여하세요.')}
              </div>
              <div>
                <Label htmlFor="team-invitation-email" className="text-sm font-medium">{tx('Email Address', '이메일 주소')}</Label>
                <Input
                  id="team-invitation-email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="team-invitation-role" className="text-sm font-medium">{tx('Role', '역할')}</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="team-invitation-role" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                    {isSuperAdmin && <SelectItem value="owner">Owner</SelectItem>}
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="approver">Approver</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isSuperAdmin && (
                <>
                  <div>
                    <Label htmlFor="team-invitation-organization-name" className="text-sm font-medium">{tx('Organization Name (Optional)', '조직 이름 (선택 사항)')}</Label>
                    <Input
                      id="team-invitation-organization-name"
                      placeholder="Acme Business Inc"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="team-invitation-organization-id" className="text-sm font-medium">{tx('Organization ID (Optional)', '조직 ID (선택 사항)')}</Label>
                    <Input
                      id="team-invitation-organization-id"
                      placeholder="acme-business"
                      value={organizationId}
                      onChange={(e) => setOrganizationId(e.target.value)}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-slate-500 mt-1">Owner invites require a name or ID.</p>
                  </div>
                </>
              )}

              <div>
                <Label className="text-sm font-medium">{tx('Notes (Optional)', '메모 (선택 사항)')}</Label>
                <Input
                  placeholder="Add notes for this invitation..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-[1fr_auto]">
                <Button onClick={handleSendInvitation} disabled={formLoading} className="min-h-11 gap-2">
                  {formLoading ? (
                    <><Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />Sending...</>
                  ) : (
                    <><Mail className="h-4 w-4" />Send Invitation</>
                  )}
                </Button>
                <Button variant="outline" className="min-h-11" onClick={() => { setFormOpen(false); setLastInvitationLink(null); }}>{tx('Cancel', '취소')}</Button>
              </div>

              {lastInvitationLink && (
                <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200 animate-fade-in-up">
                  <div className="flex items-center gap-2 text-blue-800 font-semibold text-xs uppercase tracking-wider mb-2">
                    <Check className="h-4 w-4" />
                    Invitation Link Created
                  </div>
                  <p className="text-xs text-blue-700 mb-3">
                    Copy and share this link manually if the invitation email was not received:
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input readOnly value={lastInvitationLink} className="h-10 min-w-0 text-xs font-mono bg-white" />
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(lastInvitationLink);
                        toast.success('Copied!');
                      }}
                      className="h-10 shrink-0"
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Invitations List */}
      <Card className="overflow-hidden bg-white border border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/70 pb-4 border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Mail className="h-4 w-4" />
            </span>
            <span>
              Pending invitations
              <span className="block text-xs font-normal text-slate-500 mt-0.5">Track email delivery and access status</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8" aria-busy="true" aria-label="Loading invitations">
            <Loader2 className="h-5 w-5 motion-safe:animate-spin text-slate-400" aria-hidden="true" />
            </div>
          ) : invitations.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No pending invitations</p>
          ) : (
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-col gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 transition-colors sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Mail className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      <p className="text-sm font-medium text-foreground break-all">{inv.email}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getInvitationStatusStyle(inv.status)}`}>
                        {inv.status === 'pending' ? <Clock className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 break-words leading-relaxed">
                      Role: <span className="font-medium">{getRoleDisplayName(inv.role)}</span> • Sent{' '}
                      {formatDate(inv.invited_at) || 'Unknown date'}
                      {formatDate(inv.expires_at) && <> • Expires {formatDate(inv.expires_at)}</>}
                    </p>
                    {(inv.organization_name || inv.organization_id) && (
                      <p className="text-xs text-slate-600 mt-1 break-words">
                        Org: {inv.organization_name || inv.organization_id}
                        {inv.organization_name && inv.organization_id ? ` (${inv.organization_id})` : ''}
                      </p>
                    )}
                    {inv.notes && <p className="text-xs text-slate-600 mt-1 break-words">Note: {inv.notes}</p>}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {getPermissionLabels(inv.permissions).map((permission) => (
                          <span
                            key={permission}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600"
                          >
                            <Lock className="h-2.5 w-2.5" />
                            {permission}
                          </span>
                        ))}
                    </div>
                  </div>
                  {inv.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRevokeTarget(inv)}
                      aria-label={`Revoke invitation for ${inv.email}`}
                      className="motion-interactive min-h-10 min-w-10 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 self-end sm:self-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Team Members Tab ──────────────────────────────────────────────────────────

export function TeamMembersTab() {
  const { language } = useLanguage();
  const tx = (en: string, ko: string) => language === 'ko' ? ko : en;
  const { isSuperAdmin, user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [orgWallet, setOrgWallet] = useState<OrganizationWalletBalance | null>(null);
  const [query, setQuery] = useState('');

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/v1/team/members');
      if (data?.members) {
        setMembers(isSuperAdmin ? data.members : data.members.filter((member: TeamMember) => member.role !== 'super_admin'));
      }

      try {
        const walletData = await apiFetch('/api/v1/wallet/organization-balance');
        if (walletData?.organization_id) setOrgWallet(walletData as OrganizationWalletBalance);
      } catch {
        // org wallet is optional — silently ignore if endpoint missing
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => { void fetchMembers(); }, [fetchMembers]);

  const visibleMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return members;
    return members.filter((member) => [
      member.name,
      member.email,
      member.telegram_id,
      member.role,
      member.organization_name,
      member.organization_id,
    ].some((value) => value?.toLowerCase().includes(normalizedQuery)));
  }, [members, query]);

  const handleSuperAdminToggle = async (member: TeamMember) => {
    if (!isSuperAdmin || String(member.telegram_id) === String(user?.id)) return;
    const grant = member.role !== 'super_admin';
    try {
      await apiFetch(`/api/v1/admin-users/${member.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_super_admin: grant }),
      });
      toast.success(grant ? 'Super admin access granted' : 'Super admin access removed');
      await fetchMembers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update super admin access');
    }
  };

  return (
    <Card className="bg-white border border-slate-200">
      <CardHeader className="gap-4 border-b border-slate-100 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Users className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>{tx('Active Team Members', '활성 팀원')}</span>
            </CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              {tx('Manage access and organization membership at a glance.', '접근 권한과 조직 멤버를 한눈에 관리하세요.')}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchMembers()}
            disabled={loading}
            className="min-h-10 gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
            {tx('Refresh', '새로고침')}
          </Button>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tx('Search by name, email, role, or Telegram ID', '이름, 이메일, 역할 또는 텔레그램 ID로 검색')}
            aria-label={tx('Search team members', '팀원 검색')}
            className="h-10 pl-9 pr-20"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={tx('Clear member search', '팀원 검색 지우기')}
              className="absolute right-2 top-1/2 inline-flex h-7 -translate-y-1/2 items-center gap-1 rounded-md px-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{tx('Clear', '지우기')}</span>
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {orgWallet && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {tx('Organization wallet', '조직 지갑')}
                </p>
                <p className="mt-1 text-xs text-emerald-700">{orgWallet.organization_name || orgWallet.organization_id}</p>
              </div>
              <p className="text-lg font-semibold text-emerald-950">
                {orgWallet.currency} {Number(orgWallet.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <p className="mt-3 border-t border-emerald-200/80 pt-2 text-xs text-emerald-700">
              {tx('Available balance', '사용 가능 잔액')}: {orgWallet.currency} {Number(orgWallet.available_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8" aria-busy="true" aria-label="Loading team members">
            <Loader2 className="h-5 w-5 motion-safe:animate-spin text-slate-400" aria-hidden="true" />
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
            <Users className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-slate-700">{tx('No team members yet', '아직 팀원이 없습니다')}</p>
            <p className="mt-1 text-xs text-slate-500">{tx('Invite a member to start managing shared access.', '초대장을 보내 공유 접근 관리를 시작하세요.')}</p>
          </div>
        ) : visibleMembers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center">
            <Search className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-slate-700">{tx('No members match your search', '검색 결과가 없습니다')}</p>
            <Button type="button" variant="link" size="sm" onClick={() => setQuery('')} className="mt-1 h-auto p-0 text-xs">
              {tx('Clear search', '검색 지우기')}
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3 text-xs text-slate-500" aria-live="polite">
              <span>
                {tx('Showing', '표시 중')} <span className="font-semibold text-slate-700">{visibleMembers.length}</span> {tx('of', '/')} {members.length}
              </span>
              {query && <span className="truncate">{tx('Filtered by', '검색어')}: “{query}”</span>}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
            {visibleMembers.map((member) => (
              <article key={member.id} className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50/70">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white" aria-hidden="true">
                    {getMemberInitials(member)}
                  </div>
                  <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-foreground">{member.name || tx('Unnamed member', '이름 없음')}</p>
                      {member.email && <p className="mt-0.5 break-all text-xs text-slate-500">{member.email}</p>}
                      <p className="mt-0.5 break-all text-[11px] text-slate-400">@{member.telegram_id}</p>
                    </div>
                    <RoleBadge role={member.role} />
                  </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${member.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {member.is_active ? tx('Active', '활성') : tx('Inactive', '비활성')}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {tx('Joined', '가입일')} {formatDate(member.joined_at) || tx('Unknown', '알 수 없음')}
                  </span>
                </div>
                {(member.organization_name || member.organization_id) && (
                  <p className="mt-3 break-words text-[11px] text-slate-500">
                    {tx('Organization', '조직')}: {member.organization_name || member.organization_id}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1">
                  {getPermissionLabels(member.permissions).slice(0, 4).map((permission) => (
                    <span key={permission} className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                      <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                      {permission}
                    </span>
                  ))}
                  {getPermissionLabels(member.permissions).length > 4 && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                      +{getPermissionLabels(member.permissions).length - 4} {tx('more', '개 더')}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex min-h-9 items-center justify-end">
                  {isSuperAdmin && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={String(member.telegram_id) === String(user?.id)}
                      onClick={() => handleSuperAdminToggle(member)}
                      className="w-fit text-xs"
                    >
                      {member.role === 'super_admin' ? 'Remove Super Admin' : 'Make Super Admin'}
                    </Button>
                  )}
                </div>
              </article>
            ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
