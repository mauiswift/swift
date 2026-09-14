import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import LoadingSkeleton from '@/design-system/components/LoadingSkeleton';
import { client } from '@/lib/api';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Ban, CheckCircle, CheckSquare, Copy, Eye, Network, Search, UserPlus, WalletCards, X, KeyRound, Shield } from 'lucide-react';

interface DownlineMember {
  id: number;
  user_id: string;
  name: string | null;
  email: string | null;
  level: number;
  is_direct: boolean;
  status: string;
  total_commissions: number;
  pending_commissions: number;
  service_fee_percent: number;
  created_at: string | null;
}

interface DownlineStats {
  direct_referrals: number;
  total_network_size: number;
  active_members: number;
  total_earned: number;
  pending_earnings: number;
  paid_out: number;
}

interface DownlineActivity {
  wallets: Array<{ currency: string; balance: number; available_balance: number; pending_balance: number; is_frozen: boolean; freeze_reason?: string | null }>;
  transactions: Array<{ id: number; currency: string; transaction_type: string; amount: number; balance_after: number | null; status: string | null; reference_id: string | null; note: string | null; created_at: string | null }>;
}
interface DownlineTree {
  nodes: Array<{ id: string; name: string; email?: string | null; level: number; status: string; is_root: boolean }>;
  edges: Array<{ from: string; to: string }>;
}

export default function DownlineManagement() {
  const { collectionCurrency } = useCollectionCurrency();
  const { user, isSuperAdmin } = useAuth();
  const isKrw = collectionCurrency === 'KRW' && !isSuperAdmin;
  const [members, setMembers] = useState<DownlineMember[]>([]);
  const [stats, setStats] = useState<DownlineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState<DownlineMember | null>(null);
  const [busyMemberId, setBusyMemberId] = useState<number | null>(null);
  const [referralLink, setReferralLink] = useState('');
  const [serviceFee, setServiceFee] = useState('0');
    const [downlinePassword, setDownlinePassword] = useState('');
    const [downlinePasswordConfirm, setDownlinePasswordConfirm] = useState('');
  const [activity, setActivity] = useState<DownlineActivity | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [walletFreezeLoading, setWalletFreezeLoading] = useState(false);
  const [ownWalletFrozen, setOwnWalletFrozen] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [tree, setTree] = useState<DownlineTree | null>(null);
  const [showNetwork, setShowNetwork] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await client.get('/api/v1/team/downline');
      if (!response.ok) {
        throw new Error(response.data?.detail || response.data?.message || 'Failed to load downline');
      }
      setMembers(response.data?.items || []);
      setSelectedMemberIds(new Set());
      setStats(response.data?.stats || null);
      const treeResponse = await client.get('/api/v1/team/downline/tree');
      if (treeResponse.ok) setTree(treeResponse.data || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : (isKrw ? '다운라인을 불러오지 못했습니다.' : 'Failed to load downline'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isSuperAdmin || !user?.id) return;
    client.get(`/api/v1/admin/wallets/user/${encodeURIComponent(user.id)}/analytics`)
      .then(response => {
        const wallets = response.data?.wallets || [];
        setOwnWalletFrozen(wallets.some((wallet: { is_frozen?: boolean }) => wallet.is_frozen));
      })
      .catch(() => setOwnWalletFrozen(false));
  }, [isSuperAdmin, user?.id]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return members.filter(member => {
      const matchesSearch = !query || [member.name, member.email, member.user_id]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      const matchesLevel = levelFilter === 'all' || String(member.level) === levelFilter;
      return matchesSearch && matchesStatus && matchesLevel;
    });
  }, [members, search, statusFilter, levelFilter]);

  const fetchReferralLink = async () => {
    try {
      const response = await client.get('/api/v1/team/referral-link');
      if (!response.ok) {
        throw new Error(response.data?.detail || response.data?.message || 'Failed to create referral link');
      }
      const link = response.data?.registration_link;
      if (!link) throw new Error('Referral link was not returned');
      setReferralLink(link);
      await navigator.clipboard.writeText(link);
      toast.success(isKrw ? '추천 링크가 복사되었습니다.' : 'Referral link copied');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create referral link');
    }
  };

  const updateMemberStatus = async (member: DownlineMember) => {
    const nextStatus = member.status === 'suspended' ? 'active' : 'suspended';
    try {
      setBusyMemberId(member.id);
      const response = await client.patch(`/api/v1/team/downline/${member.id}/status`, { status: nextStatus });
      if (!response.ok) throw new Error(response.data?.detail || 'Unable to update member status');
      toast.success(isKrw ? (nextStatus === 'active' ? '회원이 활성화되었습니다.' : '회원이 정지되었습니다.') : `Member ${nextStatus === 'active' ? 'reactivated' : 'suspended'}`);
      await load();
      setSelectedMember(current => current ? { ...current, status: nextStatus } : current);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update member status');
    } finally {
      setBusyMemberId(null);
    }
  };

  const approveCommissions = async (member: DownlineMember) => {
    if (member.pending_commissions <= 0) return;
    try {
      setBusyMemberId(member.id);
      const response = await client.post(`/api/v1/team/downline/${member.id}/approve-commissions`);
      if (!response.ok) throw new Error(response.data?.detail || 'Unable to approve commissions');
      toast.success(isKrw ? '커미션이 승인되었습니다.' : 'Pending commissions approved');
      await load();
      setSelectedMember(current => current ? { ...current, pending_commissions: 0, total_commissions: current.total_commissions + member.pending_commissions } : current);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve commissions');
    } finally {
      setBusyMemberId(null);
    }
  };

  const toggleMemberSelection = (memberId: number) => {
    setSelectedMemberIds(current => {
      const next = new Set(current);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const toggleAllVisibleMembers = () => {
    setSelectedMemberIds(current => {
      const next = new Set(current);
      const allSelected = filteredMembers.every(member => next.has(member.id));
      filteredMembers.forEach(member => allSelected ? next.delete(member.id) : next.add(member.id));
      return next;
    });
  };

  const runBulkAction = async (action: 'suspend' | 'reactivate' | 'approve_commissions') => {
    const relationshipIds = [...selectedMemberIds];
    if (relationshipIds.length === 0) return;
    const label = action === 'suspend' ? 'suspend' : action === 'reactivate' ? 'reactivate' : 'approve commissions for';
    if (!window.confirm(`Are you sure you want to ${label} ${relationshipIds.length} selected member(s)?`)) return;
    try {
      setBulkActionLoading(true);
      const response = await client.post('/api/v1/team/downline/bulk-action', {
        relationship_ids: relationshipIds,
        action,
      });
      if (!response.ok) throw new Error(response.data?.detail || 'Bulk action failed');
      toast.success(isKrw ? '일괄 작업이 완료되었습니다.' : `Bulk action completed for ${relationshipIds.length} members`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk action failed');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const loadActivity = async (member: DownlineMember) => {
    try {
      setActivityLoading(true);
      const response = await client.get(`/api/v1/team/downline/${member.id}/activity`);
      setActivity(response.data || null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load member activity');
    } finally {
      setActivityLoading(false);
    }
  };

  const updateWalletFreeze = async (userId: string, freeze: boolean, member?: DownlineMember) => {
    if (!isSuperAdmin) return;
    const promptedReason = freeze
      ? window.prompt('Reason for freezing this wallet (optional):')
      : '';
    if (promptedReason === null) return;
    const reason = promptedReason || '';

    try {
      setWalletFreezeLoading(true);
      const response = freeze
        ? await client.post('/api/v1/admin/wallets/freeze', { user_id: userId, reason })
        : await client.post(`/api/v1/admin/wallets/unfreeze?user_id=${encodeURIComponent(userId)}`);
      if (!response.ok) {
        throw new Error(response.data?.detail || `Unable to ${freeze ? 'freeze' : 'unfreeze'} wallet`);
      }
      toast.success(freeze ? 'Wallet frozen' : 'Wallet unfrozen');
      if (member) {
        await loadActivity(member);
      } else {
        setOwnWalletFrozen(freeze);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${freeze ? 'freeze' : 'unfreeze'} wallet`);
    } finally {
      setWalletFreezeLoading(false);
    }
  };

  const updateDownlinePassword = async () => {
    if (!selectedMember) return;
    if (downlinePassword.length < 8 || downlinePassword !== downlinePasswordConfirm) {
      toast.error(downlinePassword.length < 8 ? "Password must be at least 8 characters." : "Passwords do not match.");
      return;
    }
    try {
      setBusyMemberId(selectedMember.id);
      const response = await client.post(`/api/v1/team/downline/${selectedMember.id}/password`, {
        password: downlinePassword,
        confirm_password: downlinePasswordConfirm,
      });
      if (!response.ok) throw new Error(response.data?.detail || 'Unable to update downline password');
      setDownlinePassword('');
      setDownlinePasswordConfirm('');
      toast.success('Downline password updated. They must change it at next login.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update downline password');
    } finally {
      setBusyMemberId(null);
    }
  };

  const removePasskey = async () => {
    if (!selectedMember || !window.confirm("Remove this member's passkey? They can register a new passkey after signing in with another method.")) return;
    try {
      setBusyMemberId(selectedMember.id);
      const response = await client.request(`/api/v1/team/downline/${selectedMember.id}/passkey`, 'DELETE');
      if (!response.ok) throw new Error(response.data?.detail || 'Unable to remove passkey');
      toast.success('Downline passkey removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove passkey');
    } finally {
      setBusyMemberId(null);
    }
  };

  const updateServiceFee = async () => {
    if (!selectedMember) return;
    const fee = Number(serviceFee);
    if (!Number.isFinite(fee) || fee < 0 || fee > 100) {
      toast.error(isKrw ? '서비스 수수료는 0~100%여야 합니다.' : 'Service fee must be between 0 and 100%');
      return;
    }
    try {
      setBusyMemberId(selectedMember.id);
      const response = await client.patch(`/api/v1/team/downline/${selectedMember.id}/service-fee`, { service_fee_percent: fee });
      if (!response.ok) throw new Error(response.data?.detail || 'Unable to update service fee');
      toast.success(isKrw ? '서비스 수수료가 저장되었습니다.' : 'Service fee saved');
      await load();
      setSelectedMember(current => current ? { ...current, service_fee_percent: fee } : current);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update service fee');
    } finally {
      setBusyMemberId(null);
    }
  };

  const statusLabel = (status: string) => isKrw
    ? ({ active: '활성', suspended: '정지됨', inactive: '비활성' }[status] || status)
    : status;

  const treeByLevel = useMemo(() => {
    if (!tree) return [];
    return Array.from(new Set(tree.nodes.map(node => node.level))).sort((a, b) => a - b).map(level => ({
      level,
      nodes: tree.nodes.filter(node => node.level === level),
    }));
  }, [tree]);

  if (loading) return <Layout><LoadingSkeleton variant="page" /></Layout>;

  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{isKrw ? '다운라인 관리' : 'Downline Management'}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isKrw ? '추천 네트워크와 커미션 활동을 확인하세요.' : 'View your referral network and commission activity.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowNetwork(current => !current)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Network className="h-4 w-4" />
              {showNetwork ? (isKrw ? '회원 목록' : 'Member list') : (isKrw ? '네트워크 보기' : 'View network')}
            </button>
            <button type="button" onClick={fetchReferralLink} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              <UserPlus className="h-4 w-4" />
              {isKrw ? '추천 회원 초대' : 'Invite member'}
            </button>
            {referralLink && (
              <button type="button" onClick={() => navigator.clipboard.writeText(referralLink)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <Copy className="h-4 w-4" />
                {isKrw ? '링크 복사' : 'Copy invite link'}
              </button>
            )}
          </div>
        </div>
        {isSuperAdmin && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-amber-950">My wallet access</h2>
                <p className="mt-1 text-xs text-amber-800">
                  {ownWalletFrozen ? 'Your wallets are frozen.' : 'Manage the freeze status of your own wallets.'}
                </p>
              </div>
              {ownWalletFrozen ? (
                <button
                  type="button"
                  onClick={() => user?.id && updateWalletFreeze(user.id, false)}
                  disabled={walletFreezeLoading}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {walletFreezeLoading ? 'Updating...' : 'Unfreeze my wallets'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => user?.id && updateWalletFreeze(user.id, true)}
                  disabled={walletFreezeLoading}
                  className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {walletFreezeLoading ? 'Updating...' : 'Freeze my wallets'}
                </button>
              )}
            </div>
          </div>
        )}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {stats && (
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              [isKrw ? '직접 추천' : 'Direct referrals', stats.direct_referrals],
              [isKrw ? '네트워크 규모' : 'Network size', stats.total_network_size],
              [isKrw ? '활성 회원' : 'Active members', stats.active_members],
              [isKrw ? '총 수익' : 'Total earned', stats.total_earned.toFixed(2)],
              [isKrw ? '보류 중인 수익' : 'Pending earnings', stats.pending_earnings.toFixed(2)],
              [isKrw ? '지급 완료' : 'Paid out', stats.paid_out.toFixed(2)],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        )}
        {showNetwork && tree && (
          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">{isKrw ? '추천 네트워크' : 'Referral network'}</h2>
                <p className="mt-1 text-xs text-slate-500">{isKrw ? '추천 단계별 네트워크 구조' : `${tree.nodes.length - 1} members across ${Math.max(0, treeByLevel.length - 1)} levels`}</p>
              </div>
              <Network className="h-5 w-5 text-blue-600" />
            </div>
            <div className="mt-5 space-y-4">
              {treeByLevel.map(group => (
                <div key={group.level}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.level === 0 ? 'You' : `Level ${group.level}`}</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {group.nodes.map(node => (
                      <div key={node.id} className={`rounded-lg border p-3 ${node.is_root ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                        <p className="truncate text-sm font-semibold text-slate-900">{node.name}</p>
                        {!node.is_root && <p className="truncate text-xs text-slate-500">{node.email || node.id}</p>}
                        {!node.is_root && <span className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-medium text-slate-600">{statusLabel(node.status)}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        {showNetwork ? null : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
            <div className="mr-auto font-semibold text-slate-900">{isKrw ? '추천 회원' : 'Referral members'}</div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder={isKrw ? '회원 검색' : 'Search members'} className="h-9 w-44 rounded-md border border-slate-200 pl-8 pr-2 text-sm outline-none focus:border-blue-500" />
            </div>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="h-9 rounded-md border border-slate-200 px-2 text-sm text-slate-600">
              <option value="all">{isKrw ? '모든 상태' : 'All statuses'}</option>
              <option value="active">{isKrw ? '활성' : 'Active'}</option>
              <option value="suspended">{isKrw ? '정지됨' : 'Suspended'}</option>
              <option value="inactive">{isKrw ? '비활성' : 'Inactive'}</option>
            </select>
            <select value={levelFilter} onChange={event => setLevelFilter(event.target.value)} className="h-9 rounded-md border border-slate-200 px-2 text-sm text-slate-600">
              <option value="all">{isKrw ? '모든 등급' : 'All levels'}</option>
              {[1, 2, 3].map(level => <option key={level} value={String(level)}>{isKrw ? `${level}단계` : `Level ${level}`}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <button type="button" onClick={toggleAllVisibleMembers} disabled={filteredMembers.length === 0 || bulkActionLoading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-50">
                <CheckSquare className="h-4 w-4" />
                {filteredMembers.length > 0 && filteredMembers.every(member => selectedMemberIds.has(member.id)) ? 'Clear visible' : 'Select visible'}
              </button>
              {selectedMemberIds.size > 0 && (
                <>
                  <span className="text-xs font-medium text-slate-500">{selectedMemberIds.size} selected</span>
                  <button type="button" onClick={() => void runBulkAction('suspend')} disabled={bulkActionLoading} className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Suspend selected</button>
                  <button type="button" onClick={() => void runBulkAction('reactivate')} disabled={bulkActionLoading} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Reactivate selected</button>
                  <button type="button" onClick={() => void runBulkAction('approve_commissions')} disabled={bulkActionLoading} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Approve commissions</button>
                </>
              )}
          </div>
          {filteredMembers.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              {members.length === 0
                ? (isKrw ? '아직 다운라인 회원이 없습니다.' : 'No downline members yet.')
                : (isKrw ? '조건에 맞는 회원이 없습니다.' : 'No members match the selected filters.')}
            </p>
          ) : (
            <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">{isKrw ? '회원' : 'Member'}</th>
                    <th className="px-5 py-3">{isKrw ? '등급' : 'Level'}</th>
                    <th className="px-5 py-3">{isKrw ? '상태' : 'Status'}</th>
                    <th className="px-5 py-3">{isKrw ? '보류 중인 커미션' : 'Pending commissions'}</th>
                    <th className="px-5 py-3 text-right">{isKrw ? '작업' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map(member => (
                    <tr key={member.id}>
                      <td className="px-5 py-4"><label className="flex items-center gap-3"><input type="checkbox" checked={selectedMemberIds.has(member.id)} onChange={() => toggleMemberSelection(member.id)} className="h-4 w-4 rounded border-slate-300 text-blue-600" /><span><p className="font-medium text-slate-900">{member.name || member.user_id}</p><p className="text-xs text-slate-500">{member.email || member.user_id}</p></span></label></td>
                      <td className="px-5 py-4 text-slate-600">{member.level}{member.is_direct ? (isKrw ? ' (직접)' : ' (direct)') : ''}</td>
                      <td className="px-5 py-4 text-slate-600">{statusLabel(member.status)}</td>
                      <td className="px-5 py-4 text-slate-700">{member.pending_commissions.toFixed(2)}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button type="button" title={isKrw ? '상세 보기' : 'View details'} onClick={() => { setSelectedMember(member); setActivity(null); setServiceFee(String(member.service_fee_percent || 0)); setDownlinePassword(''); setDownlinePasswordConfirm(''); void loadActivity(member); }} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><Eye className="h-4 w-4" /></button>
                          <button type="button" title={member.status === 'suspended' ? (isKrw ? '활성화' : 'Reactivate') : (isKrw ? '정지' : 'Suspend')} disabled={busyMemberId === member.id} onClick={() => updateMemberStatus(member)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                            {member.status === 'suspended' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Ban className="h-4 w-4 text-amber-600" />}
                          </button>
                          {member.pending_commissions > 0 && <button type="button" title={isKrw ? '커미션 승인' : 'Approve commissions'} disabled={busyMemberId === member.id} onClick={() => approveCommissions(member)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><WalletCards className="h-4 w-4 text-blue-600" /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredMembers.map(member => (
                <article key={member.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex min-w-0 items-start gap-3">
                      <input type="checkbox" checked={selectedMemberIds.has(member.id)} onChange={() => toggleMemberSelection(member.id)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{member.name || member.user_id}</p>
                      <p className="truncate text-xs text-slate-500">{member.email || member.user_id}</p>
                    </div>
                    </label>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                      member.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : member.status === 'suspended'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}>
                      {statusLabel(member.status)}
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs">
                    <div>
                      <dt className="text-slate-500">{isKrw ? '등급' : 'Level'}</dt>
                      <dd className="mt-1 font-medium text-slate-800">{member.level}{member.is_direct ? (isKrw ? ' (직접)' : ' (direct)') : ''}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">{isKrw ? '보류 중인 커미션' : 'Pending commissions'}</dt>
                      <dd className="mt-1 font-medium text-slate-800">{member.pending_commissions.toFixed(2)}</dd>
                    </div>
                  </dl>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => { setSelectedMember(member); setActivity(null); setServiceFee(String(member.service_fee_percent || 0)); setDownlinePassword(''); setDownlinePasswordConfirm(''); void loadActivity(member); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      {isKrw ? '상세 보기' : 'View details'}
                    </button>
                    <button type="button" disabled={busyMemberId === member.id} onClick={() => updateMemberStatus(member)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-50" aria-label={member.status === 'suspended' ? (isKrw ? '활성화' : 'Reactivate') : (isKrw ? '정지' : 'Suspend')}>
                      {member.status === 'suspended' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Ban className="h-4 w-4 text-amber-600" />}
                    </button>
                    {member.pending_commissions > 0 && <button type="button" disabled={busyMemberId === member.id} onClick={() => approveCommissions(member)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-50" aria-label={isKrw ? '커미션 승인' : 'Approve commissions'}><WalletCards className="h-4 w-4 text-blue-600" /></button>}
                  </div>
                </article>
              ))}
            </div>
            </>
          )}
        </div>
        )}
      </div>
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{selectedMember.name || selectedMember.user_id}</h2>
                <p className="text-sm text-slate-500">{selectedMember.email || selectedMember.user_id}</p>
              </div>
              <button type="button" onClick={() => { setSelectedMember(null); setDownlinePassword(''); setDownlinePasswordConfirm(''); }} className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{isKrw ? '상태' : 'Status'}</p><p className="mt-1 font-semibold text-slate-900">{statusLabel(selectedMember.status)}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{isKrw ? '등급' : 'Level'}</p><p className="mt-1 font-semibold text-slate-900">{selectedMember.level}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{isKrw ? '총 커미션' : 'Total commissions'}</p><p className="mt-1 font-semibold text-slate-900">{selectedMember.total_commissions.toFixed(2)}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{isKrw ? '보류 중인 커미션' : 'Pending commissions'}</p><p className="mt-1 font-semibold text-slate-900">{selectedMember.pending_commissions.toFixed(2)}</p></div>
            </div>
            <div className="mt-5 rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Change dashboard password</h3>
              <p className="mt-1 text-xs text-slate-500">The member will be required to change this password at next login.</p>
              <div className="mt-3 grid gap-2">
                <input type="password" autoComplete="new-password" value={downlinePassword} onChange={event => setDownlinePassword(event.target.value)} placeholder="New password" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500" />
                <input type="password" autoComplete="new-password" value={downlinePasswordConfirm} onChange={event => setDownlinePasswordConfirm(event.target.value)} placeholder="Confirm password" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500" />
                <button type="button" onClick={updateDownlinePassword} disabled={busyMemberId === selectedMember.id || !downlinePassword || !downlinePasswordConfirm} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">Update password</button>
              </div>
            </div>
            <div className="mt-5 rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Wallet balance</h3>
              {activityLoading ? <p className="mt-2 text-xs text-slate-500">Loading activity...</p> : activity?.wallets.length ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {activity.wallets.map(wallet => (
                    <div key={wallet.currency} className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase text-slate-500">{wallet.currency}</p>
                      <p className="mt-1 font-semibold text-slate-900">{Number(wallet.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      <p className="mt-1 text-[11px] text-slate-500">Available: {Number(wallet.available_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-2 text-xs text-slate-500">No wallet balances found.</p>}
            </div>
            <div className="mt-5 rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Recent transactions</h3>
              <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                {activity?.transactions.length ? activity.transactions.map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-700">
                        {transaction.transaction_type === 'admin_credit'
                          ? 'Automated wallet funding'
                          : transaction.transaction_type === 'admin_debit'
                            ? 'Secure wallet adjustment'
                            : transaction.transaction_type.replace(/_/g, ' ')}
                        {' · '}{transaction.currency}
                      </p>
                      <p className="truncate text-slate-500">
                        {transaction.transaction_type === 'admin_credit'
                          ? 'Automatic wallet system'
                          : transaction.transaction_type === 'admin_debit'
                            ? 'Automatic wallet system'
                            : transaction.note || transaction.reference_id || 'No reference'}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold text-slate-900">{Number(transaction.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )) : <p className="text-xs text-slate-500">No transactions found.</p>}
              </div>
            </div>
            <div className="mt-5 rounded-lg border border-slate-200 p-4">
              <label htmlFor="downline-service-fee" className="text-xs font-semibold text-slate-600">{isKrw ? '이 회원의 서비스 수수료' : 'Service fee for this invite'}</label>
              <div className="mt-2 flex items-center gap-2">
                <input id="downline-service-fee" type="number" min="0" max="100" step="0.01" value={serviceFee} onChange={event => setServiceFee(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500" />
                <span className="text-sm font-semibold text-slate-500">%</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{isKrw ? '이 초대 회원의 결제에만 적용됩니다.' : 'Applied only to payments from this invited member.'}</p>
            </div>
            {isSuperAdmin && (
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-amber-950">Wallet access</h3>
                    <p className="mt-1 text-xs text-amber-800">
                      {activity?.wallets.some(wallet => wallet.is_frozen)
                        ? 'This member\'s wallets are frozen.'
                        : 'Freeze this member\'s wallets to block transfers, withdrawals, and conversions.'}
                    </p>
                  </div>
                  <Shield className="h-5 w-5 shrink-0 text-amber-700" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activity?.wallets.some(wallet => wallet.is_frozen) ? (
                    <button
                      type="button"
                      onClick={() => updateWalletFreeze(selectedMember.user_id, false, selectedMember)}
                      disabled={walletFreezeLoading || activityLoading}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {walletFreezeLoading ? 'Updating...' : 'Unfreeze wallets'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateWalletFreeze(selectedMember.user_id, true, selectedMember)}
                      disabled={walletFreezeLoading || activityLoading}
                      className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      {walletFreezeLoading ? 'Updating...' : 'Freeze wallets'}
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              {selectedMember.pending_commissions > 0 && <button type="button" onClick={() => approveCommissions(selectedMember)} disabled={busyMemberId === selectedMember.id} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{isKrw ? '커미션 승인' : 'Approve commissions'}</button>}
              <button
                type="button"
                onClick={updateServiceFee}
                disabled={busyMemberId === selectedMember.id}
                className="inline-flex min-w-[4rem] shrink-0 items-center justify-center rounded-lg border border-blue-700 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Set
              </button>
              <button type="button" onClick={() => updateMemberStatus(selectedMember)} disabled={busyMemberId === selectedMember.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{selectedMember.status === 'suspended' ? (isKrw ? '활성화' : 'Reactivate') : (isKrw ? '정지' : 'Suspend')}</button>
              <button type="button" onClick={removePasskey} disabled={busyMemberId === selectedMember.id} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><KeyRound className="h-4 w-4" />Remove passkey</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
