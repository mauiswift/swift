import { useCallback, useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import LoadingSkeleton from '@/design-system/components/LoadingSkeleton';
import { client } from '@/lib/api';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import { useAuth } from '@/contexts/AuthContext';

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

export default function DownlineManagement() {
  const { collectionCurrency } = useCollectionCurrency();
  const { isSuperAdmin } = useAuth();
  const isKrw = collectionCurrency === 'KRW' && !isSuperAdmin;
  const [members, setMembers] = useState<DownlineMember[]>([]);
  const [stats, setStats] = useState<DownlineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await client.get('/api/v1/team/downline');
      setMembers(response.data?.items || []);
      setStats(response.data?.stats || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : (isKrw ? '다운라인을 불러오지 못했습니다.' : 'Failed to load downline'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Layout><LoadingSkeleton variant="page" /></Layout>;

  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{isKrw ? '다운라인 관리' : 'Downline Management'}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isKrw ? '추천 네트워크와 커미션 활동을 확인하세요.' : 'View your referral network and commission activity.'}
          </p>
        </div>
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
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4 font-semibold text-slate-900">
            {isKrw ? '추천 회원' : 'Referral members'}
          </div>
          {members.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              {isKrw ? '아직 다운라인 회원이 없습니다.' : 'No downline members yet.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">{isKrw ? '회원' : 'Member'}</th>
                    <th className="px-5 py-3">{isKrw ? '등급' : 'Level'}</th>
                    <th className="px-5 py-3">{isKrw ? '상태' : 'Status'}</th>
                    <th className="px-5 py-3">{isKrw ? '보류 중인 커미션' : 'Pending commissions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map(member => (
                    <tr key={member.id}>
                      <td className="px-5 py-4"><p className="font-medium text-slate-900">{member.name || member.user_id}</p><p className="text-xs text-slate-500">{member.email || member.user_id}</p></td>
                      <td className="px-5 py-4 text-slate-600">{member.level}{member.is_direct ? (isKrw ? ' (직접)' : ' (direct)') : ''}</td>
                      <td className="px-5 py-4 capitalize text-slate-600">{member.status}</td>
                      <td className="px-5 py-4 text-slate-700">{member.pending_commissions.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
