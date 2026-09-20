import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, RefreshCw, XCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { client } from '@/lib/api';
import { Button } from '@/components/ui/button';

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
    contact_email?: string;
    purpose?: string;
    review_note?: string | null;
  };
};

export default function TossAccountApprovals() {
  const [items, setItems] = useState<TossApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const review = async (userId: string, action: 'approve' | 'reject') => {
    const response = await client.post(`/api/v1/admin/toss-virtual-accounts/${userId}/${action}`, {
      note: action === 'approve' ? 'Approved by Relationship Manager' : 'Rejected by Relationship Manager',
    });
    if (!response.ok) {
      setError(response.data?.detail || `Unable to ${action} application`);
      return;
    }
    await load();
  };

  return (
    <Layout>
      <div className="page-enter">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">TOSS Bank Account Approvals</h1>
            <p className="mt-1 text-sm text-slate-500">Review applications before the user&apos;s TOSS Bank account is opened.</p>
          </div>
          <Button variant="outline" onClick={() => void load()}><RefreshCw size={14} className="mr-2" />Refresh</Button>
        </div>
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading applications...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-slate-500"><Clock className="mx-auto mb-2" size={30} />No pending TOSS applications.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {items.map((item) => (
                <div key={item.user_id} className="flex flex-wrap items-center justify-between gap-5 p-6">
                  <div>
                    <p className="font-semibold text-slate-900">{item.application.legal_name || item.name || item.user_id}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.application.contact_email || item.email || 'No email'} · {item.telegram_username ? `@${item.telegram_username}` : item.user_id}</p>
                    <p className="mt-2 text-xs text-slate-500">{item.application.country} · {item.application.business_type} · {item.application.purpose}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => void review(item.user_id, 'reject')}><XCircle size={15} className="mr-2" />Reject</Button>
                    <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => void review(item.user_id, 'approve')}><CheckCircle2 size={15} className="mr-2" />Approve</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
