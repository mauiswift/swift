import { useState } from 'react';
import { ChevronLeft, Edit2, Loader2, Landmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { client } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Banking() {
  const navigate = useNavigate();
  const { user, refetch } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    settlement_type: user?.settlement_type || '',
    settlement_currency: user?.settlement_currency || 'PHP',
    bank_name: user?.bank_name || '',
    bank_account_number: user?.bank_account_number || '',
    bank_account_name: user?.bank_account_name || '',
    bank_address: user?.bank_address || '',
  });

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await client.patch(`/api/v1/users/${user.id}/settlement`, formData);
      if (res.ok) {
        toast.success('Settlement information updated');
        await refetch();
        setIsEditing(false);
      } else {
        toast.error('Failed to update settlement information');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const ROWS = [
    { label: 'Settlement type', value: user?.settlement_type, badge: 'Can be modified by admin' },
    { label: 'Settlement currency', value: user?.settlement_currency },
    { label: 'Bank', value: user?.bank_name },
    { label: 'Account number', value: user?.bank_account_number },
    { label: 'Recipient', value: user?.bank_account_name },
    { label: 'Address', value: user?.bank_address },
  ];

  const isConfigured = ROWS.some(row => !!row.value);
  const isSuperAdmin = user?.permissions?.is_super_admin;

  return (
    <Layout>
      <div className="page-enter">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-8 font-medium">
          <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={() => navigate('/settings')}>Settings</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-semibold">Banking</span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-5 mb-12">
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">Banking</h1>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-10">
          <span className="inline-block text-[13px] font-semibold text-slate-900 pb-4 border-b-2 border-[#FF6B00] -mb-[2px]">
            Settlement account
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-[720px] shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <p className="text-[14px] text-slate-500 font-medium m-0">
              Review all the critical details of your settlement account.
            </p>

            {isSuperAdmin && (
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-9 rounded-lg border-slate-200 text-[12px] font-semibold">
                    <Edit2 size={14} />
                    Edit Settlement Info
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] bg-white">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold tracking-tight">Edit Settlement Information</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-6 py-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Settlement Type</Label>
                        <Input
                          value={formData.settlement_type}
                          onChange={e => setFormData({ ...formData, settlement_type: e.target.value })}
                          placeholder="e.g. Wire Transfer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Input
                          value={formData.settlement_currency}
                          onChange={e => setFormData({ ...formData, settlement_currency: e.target.value })}
                          placeholder="PHP"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input
                        value={formData.bank_name}
                        onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                        placeholder="e.g. SECURITY BANK CORPORATION"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input
                        value={formData.bank_account_number}
                        onChange={e => setFormData({ ...formData, bank_account_number: e.target.value })}
                        placeholder="00000XXXXXXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Recipient Name</Label>
                      <Input
                        value={formData.bank_account_name}
                        onChange={e => setFormData({ ...formData, bank_account_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Address</Label>
                      <Input
                        value={formData.bank_address}
                        onChange={e => setFormData({ ...formData, bank_address: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-[#FF6B00] hover:bg-[#E66000] text-white px-8">
                      {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                      Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {!isConfigured ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Landmark size={32} className="text-slate-300" />
              </div>
              <h3 className="text-[16px] font-semibold text-slate-900 mb-2">Not configured</h3>
              <p className="text-[13px] text-slate-500 max-w-sm mx-auto">
                No settlement account has been configured for this merchant yet.
                {isSuperAdmin ? " Please update the details using the button above." : " Please contact support to set up your settlement details."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              {ROWS.map((row) => (
                <div
                  key={row.label}
                  className="px-10 py-6 bg-white flex items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors"
                >
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-widest">{row.label}</p>
                    <p className="text-[15px] font-semibold text-slate-900 tracking-tight">{row.value || '—'}</p>
                  </div>
                  {row.badge && (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                      {row.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
