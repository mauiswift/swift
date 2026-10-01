import React, { useCallback, useEffect, useState } from 'react';
import { client } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Store,
  Search,
  Eye,
  DollarSign,
  TrendingUp,
  Users,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Merchant {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  wallet_balance: number;
  currency: string;
  total_transactions: number;
  total_settlements: number;
}

interface MerchantTransaction {
  id: number;
  type: 'payment' | 'settlement' | 'withdrawal';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}

interface MerchantDetails {
  merchant: Merchant;
  transactions: MerchantTransaction[];
  team_members: Array<{ id: number; name: string; email: string; role: string }>;
}

export function MerchantManagement() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchMerchants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await client.get('/api/v1/admin/merchants');
      if (response.ok && Array.isArray(response.data)) {
        setMerchants(response.data);
      }
    } catch (err) {
      toast.error('Failed to load merchants');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  const handleViewMerchant = async (merchant: Merchant) => {
    try {
      setDetailsLoading(true);
      const response = await client.get(`/api/v1/admin/merchants/${merchant.id}/details`);
      if (response.ok) {
        setSelectedMerchant(response.data);
        setShowDetails(true);
      }
    } catch (err) {
      toast.error('Failed to load merchant details');
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredMerchants = merchants.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with search */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Merchant Management</h2>
          <p className="mt-1 text-sm text-slate-500">Manage merchant accounts, view transactions, and manage team access.</p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by merchant name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Merchants Table */}
      <Card className="overflow-hidden bg-white border border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/70 pb-4 border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-5 w-5 text-blue-600" />
            Merchants ({filteredMerchants.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filteredMerchants.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-8 w-8 text-slate-300 mb-3" />
              <p className="text-slate-500">No merchants found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 hover:bg-transparent">
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Merchant
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Status
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Balance
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Transactions
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMerchants.map((merchant) => (
                    <TableRow key={merchant.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <TableCell className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{merchant.name}</p>
                          <p className="text-xs text-slate-500">{merchant.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            merchant.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : merchant.status === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                          <DollarSign className="h-4 w-4" />
                          {merchant.wallet_balance.toLocaleString()} {merchant.currency}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-slate-900">{merchant.total_transactions}</p>
                          <p className="text-xs text-slate-500">{merchant.total_settlements} settlements</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewMerchant(merchant)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Merchant Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMerchant?.merchant.name} - Details</DialogTitle>
            <DialogDescription>Manage merchant information, transactions, and team members.</DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : selectedMerchant ? (
            <div className="space-y-6">
              {/* Merchant Info Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500 font-semibold mb-1">Wallet Balance</p>
                  <p className="text-lg font-bold text-slate-900">
                    {selectedMerchant.merchant.wallet_balance.toLocaleString()} {selectedMerchant.merchant.currency}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500 font-semibold mb-1">Total Transactions</p>
                  <p className="text-lg font-bold text-slate-900 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    {selectedMerchant.merchant.total_transactions}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500 font-semibold mb-1">Settlements</p>
                  <p className="text-lg font-bold text-slate-900">{selectedMerchant.merchant.total_settlements}</p>
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Recent Transactions</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedMerchant.transactions.length > 0 ? (
                    selectedMerchant.transactions.slice(0, 5).map((txn) => (
                      <div key={txn.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                        <div>
                          <p className="text-sm font-medium text-slate-900 capitalize">{txn.type}</p>
                          <p className="text-xs text-slate-500">{new Date(txn.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">
                            {txn.amount} {txn.currency}
                          </p>
                          <span
                            className={`text-xs font-medium ${
                              txn.status === 'completed'
                                ? 'text-emerald-600'
                                : txn.status === 'pending'
                                ? 'text-amber-600'
                                : 'text-red-600'
                            }`}
                          >
                            {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 py-4 text-center">No transactions</p>
                  )}
                </div>
              </div>

              {/* Team Members */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Members ({selectedMerchant.team_members.length})
                  </h3>
                  <Button size="sm" variant="outline">
                    Add Member
                  </Button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedMerchant.team_members.length > 0 ? (
                    selectedMerchant.team_members.map((member) => (
                      <div key={member.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{member.name}</p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                        <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {member.role}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 py-4 text-center">No team members</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
