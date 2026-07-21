import { useState, useEffect, useCallback } from 'react';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2, Loader2, Plus,
  Send, RotateCcw, Users, CalendarDays, History, Settings2,
  ChevronRight, Check, ShieldCheck, Receipt, Search, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import SiteContainer from '@/components/SiteContainer';
import { fmt } from '@/lib/format';

interface Disbursement {
  id: number; external_id: string; amount: number; bank_code: string;
  account_number: string; account_name: string; description: string;
  status: string; disbursement_type: string; created_at: string | null;
}
interface Refund {
  id: number; transaction_id: number; amount: number; reason: string;
  status: string; refund_type: string; created_at: string | null;
}
interface Subscription {
  id: number; plan_name: string; amount: number; interval: string;
  customer_name: string; customer_email: string; status: string;
  next_billing_date: string | null; total_cycles: number; created_at: string | null;
}
interface Customer {
  id: number; name: string; email: string; phone: string; notes: string;
  total_payments: number; total_amount: number; created_at: string | null;
}

export default function DisbursementsPage() {
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState('disbursements');
  const [wizardStep, setWizardStep] = useState(1);
  const [dAmount, setDAmount] = useState('');
  const [dBank, setDBank] = useState('BDO');
  const [dAccount, setDAccount] = useState('');
  const [dName, setDName] = useState('');
  const [dDesc, setDDesc] = useState('');
  const [dLoading, setDLoading] = useState(false);
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [rTxnId, setRTxnId] = useState('');
  const [rAmount, setRAmount] = useState('');
  const [rReason, setRReason] = useState('');
  const [rLoading, setRLoading] = useState(false);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [sPlan, setSPlan] = useState('');
  const [sAmount, setSAmount] = useState('');
  const [sInterval, setSInterval] = useState('monthly');
  const [sCustName, setSCustName] = useState('');
  const [sCustEmail, setSCustEmail] = useState('');
  const [sLoading, setSLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cNotes, setCNotes] = useState('');
  const [cLoading, setCLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setListLoading(true);
    try {
      const [dRes, rRes, sRes, cRes] = await Promise.all([
        client.apiCall.invoke({ url: '/api/v1/gateway/disbursements', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/gateway/refunds', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/gateway/subscriptions', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/gateway/customers', method: 'GET', data: {} }),
      ]);
      setDisbursements(Array.isArray(dRes.data?.items) ? dRes.data.items : []);
      setRefunds(Array.isArray(rRes.data?.items) ? rRes.data.items : []);
      setSubscriptions(Array.isArray(sRes.data?.items) ? sRes.data.items : []);
      setCustomers(Array.isArray(cRes.data?.items) ? cRes.data.items : []);
    } catch {
      setDisbursements([]);
      setRefunds([]);
      setSubscriptions([]);
      setCustomers([]);
    }
    setListLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDisburse = async () => {
    if (!dAmount || !dAccount || !dName) { toast.error('Fill all required fields'); return; }
    setDLoading(true);
    try {
      const res = await client.apiCall.invoke({
        url: '/api/v1/gateway/disbursement', method: 'POST',
        data: { amount: parseFloat(dAmount), bank_code: dBank, account_number: dAccount, account_name: dName, description: dDesc },
      });
      if (res.data?.success) {
        toast.success('Disbursement created!');
        setDAmount(''); setDAccount(''); setDName(''); setDDesc('');
        setWizardStep(1);
        fetchAll();
      }
      else toast.error(res.data?.message || 'Failed');
    } catch (e: unknown) { toast.error((e as { data?: { detail?: string } })?.data?.detail || 'Failed'); }
    setDLoading(false);
  };

  const handleRefund = async () => {
    if (!rTxnId || !rAmount) { toast.error('Enter transaction ID and amount'); return; }
    setRLoading(true);
    try {
      const res = await client.apiCall.invoke({
        url: '/api/v1/gateway/refund', method: 'POST',
        data: { transaction_id: parseInt(rTxnId), amount: parseFloat(rAmount), reason: rReason },
      });
      if (res.data?.success) { toast.success('Refund processed!'); setRTxnId(''); setRAmount(''); setRReason(''); fetchAll(); }
      else toast.error(res.data?.message || 'Failed');
    } catch (e: unknown) { toast.error((e as { data?: { detail?: string } })?.data?.detail || 'Failed'); }
    setRLoading(false);
  };

  const handleSubscribe = async () => {
    if (!sPlan || !sAmount) { toast.error('Enter plan name and amount'); return; }
    setSLoading(true);
    try {
      const res = await client.apiCall.invoke({
        url: '/api/v1/gateway/subscription', method: 'POST',
        data: { plan_name: sPlan, amount: parseFloat(sAmount), interval: sInterval, customer_name: sCustName, customer_email: sCustEmail },
      });
      if (res.data?.success) { toast.success('Subscription created!'); setSPlan(''); setSAmount(''); setSCustName(''); setSCustEmail(''); fetchAll(); }
      else toast.error(res.data?.message || 'Failed');
    } catch (e: unknown) { toast.error((e as { data?: { detail?: string } })?.data?.detail || 'Failed'); }
    setSLoading(false);
  };

  const handleSubAction = async (id: number, status: string) => {
    try {
      await client.apiCall.invoke({ url: `/api/v1/gateway/subscription/${id}`, method: 'PUT', data: { status } });
      toast.success(`Subscription ${status}`); fetchAll();
    } catch { toast.error('Failed'); }
  };

  const handleAddCustomer = async () => {
    if (!cName) { toast.error('Enter customer name'); return; }
    setCLoading(true);
    try {
      const res = await client.apiCall.invoke({
        url: '/api/v1/gateway/customer', method: 'POST',
        data: { name: cName, email: cEmail, phone: cPhone, notes: cNotes },
      });
      if (res.data?.success) { toast.success('Customer added!'); setCName(''); setCEmail(''); setCPhone(''); setCNotes(''); fetchAll(); }
      else toast.error(res.data?.message || 'Failed');
    } catch (e: unknown) { toast.error((e as { data?: { detail?: string } })?.data?.detail || 'Failed'); }
    setCLoading(false);
  };

  const handleDeleteCustomer = async (id: number) => {
    try {
      await client.apiCall.invoke({ url: `/api/v1/gateway/customer/${id}`, method: 'DELETE', data: {} });
      toast.success('Customer deleted'); fetchAll();
    } catch { toast.error('Failed'); }
  };

  const statusBadge = (s: string) => {
    const cfg: Record<string, string> = {
      completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      failed: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      paused: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      cancelled: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    };
    const labels: Record<string, string> = {
      completed: 'Executed',
      pending: 'Pending',
      failed: 'Failed',
      active: 'Active',
      paused: 'Paused',
      cancelled: 'Cancelled',
    };
    const label = labels[s] || s.toUpperCase();
    return <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full ${cfg[s] || 'bg-slate-500/10 text-muted-foreground border-slate-500/20'} border text-[9px] font-black uppercase tracking-widest shadow-sm`}>{label}</div>;
  };

  return (
    <Layout>
      <SiteContainer className="pb-16 space-y-10">
        <div className="flex items-center justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Disbursements</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage outgoing payments</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-border">
              <p className="text-[12px] text-muted-foreground">Balance left</p>
              <p className="text-xl font-bold mt-1">₱0.00</p>
            </div>
            <div>
              <Button className="bg-black text-white px-4 py-2 rounded-md">Send Funds</Button>
            </div>
          </div>
        </div>

        <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
          <div className="flex items-center gap-4">
            <TabsList className="flex items-center gap-2">
              <TabsTrigger value="disbursements" className="px-3 py-2 text-sm font-semibold data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground">
                <Send className="h-4 w-4 mr-2" />History
              </TabsTrigger>
              <TabsTrigger value="batch" className="px-3 py-2 text-sm font-semibold data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground">
                Batch Processing
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="disbursements" className="mt-0 space-y-6">
            {/* Filters + Search */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Select value={''} onValueChange={() => {}}>
                  <SelectTrigger className="h-10 bg-muted border-border text-foreground"><SelectValue placeholder="Range: Last 7 days"/></SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={''} onValueChange={() => {}}>
                  <SelectTrigger className="h-10 bg-muted border-border text-foreground"><SelectValue placeholder="Status: All"/></SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="completed">Executed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-72">
                <Input placeholder="Search..." className="h-10" />
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-border">
                <p className="text-sm text-muted-foreground">Total count</p>
                <p className="text-xl font-semibold mt-2">{disbursements.length}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-border">
                <p className="text-sm text-muted-foreground">Average amount</p>
                <p className="text-xl font-semibold mt-2">₱{disbursements.length ? (disbursements.reduce((s, x) => s + x.amount, 0) / disbursements.length).toFixed(2) : '0.00'}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-border">
                <p className="text-sm text-muted-foreground">Total amount</p>
                <p className="text-xl font-semibold mt-2">₱{disbursements.reduce((s, x) => s + x.amount, 0).toFixed(2)}</p>
              </div>
            </div>

            {/* Transactions list */}
            <div>
              <h2 className="text-lg font-semibold">Transactions history</h2>

              <div className="mt-4 bg-card/5 rounded-xl border border-border/10">
                {/* header row (desktop) */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-[11px] font-black uppercase text-muted-foreground tracking-widest border-b border-border/10 rounded-t-xl">
                  <div className="col-span-6">Disbursement</div>
                  <div className="col-span-3">Merchant reference number</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-1 text-right">Status</div>
                </div>

                <div className="divide-y divide-border/10 overflow-y-auto h-[480px] px-4 custom-scrollbar">
                  {disbursements.map((d) => (
                    <div key={d.id} className="grid grid-cols-12 gap-4 items-center py-5">

                      <div className="col-span-12 md:col-span-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-muted/5 flex items-center justify-center border border-border/10">
                          <Building2 className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-black uppercase tracking-tight text-foreground truncate">₱{fmt(d.amount)}</p>
                          <p className="text-xs text-muted-foreground truncate">{d.bank_code} • {d.account_number}</p>
                        </div>
                      </div>

                      <div className="col-span-12 md:col-span-3 text-sm text-muted-foreground truncate">{d.external_id}</div>

                      <div className="col-span-12 md:col-span-2 text-xs text-muted-foreground">
                        {d.created_at ? (
                          <>
                            <div>Registered on: {new Date(d.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                            <div className="mt-1 text-[11px] text-muted-foreground/60">Settled on: {new Date(d.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                          </>
                        ) : '—'}
                      </div>

                      <div className="col-span-12 md:col-span-1 text-right">{statusBadge(d.status)}</div>

                    </div>
                  ))}
                </div>
              </div>
            </div>

          </TabsContent>

          <TabsContent value="refunds" className="mt-0 space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <Card className="fintech-card border-0 shadow-2xl overflow-hidden bg-card/60 backdrop-blur-sm">
                <div className="h-2.5 bg-orange-500 w-full shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
                <CardHeader className="p-10 border-b border-border/10">
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-inner">
                      <RotateCcw className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                       <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground">Protocol Reversal</CardTitle>
                       <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">Initiate asset recovery from settled node</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                  <div className="space-y-4">
                    <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1">Internal Reference Hub (TXN_ID)</Label>
                    <Input type="number" placeholder="NODE_IDENTIFIER (e.g. 10245)" value={rTxnId} onChange={e => setRTxnId(e.target.value)}
                      className="h-18 bg-muted/20 border-border/40 rounded-3xl font-black tabular-nums tracking-[0.3em] focus:ring-orange-500/10 border-2 shadow-inner uppercase px-8" />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1">Adjustment Quota (PHP)</Label>
                    <div className="relative group">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-500 font-black text-3xl group-focus-within:scale-110 transition-transform">₱</span>
                       <Input type="number" placeholder="0.00" value={rAmount} onChange={e => setRAmount(e.target.value)}
                         className="pl-12 h-20 bg-muted/20 border-border/40 rounded-3xl text-4xl font-black tabular-nums focus:ring-orange-500/10 border-2 shadow-sm" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1">Reason for Adjustment</Label>
                    <Textarea placeholder="Specify network adjustment metadata..." value={rReason} onChange={e => setRReason(e.target.value)}
                      className="bg-muted/20 border-border/40 rounded-[2rem] min-h-[160px] resize-none focus:ring-orange-500/10 p-8 font-black uppercase tracking-tight text-sm border-2 shadow-inner" />
                  </div>
                  <Button onClick={handleRefund} disabled={rLoading} className="w-full h-20 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-[2rem] shadow-2xl shadow-orange-500/30 transition-all active:scale-95 uppercase tracking-[0.4em] group">
                    {rLoading ? <Loader2 className="h-7 w-7 mr-3 animate-spin opacity-50" /> : <RotateCcw className="h-7 w-7 mr-4 group-hover:rotate-180 transition-transform duration-700" />}
                    EXECUTE_REVERSAL
                  </Button>
                </CardContent>
              </Card>

              <Card className="fintech-card border-0 shadow-2xl overflow-hidden bg-card/60 backdrop-blur-sm h-[800px] flex flex-col">
                <CardHeader className="p-10 border-b border-border/10 bg-[#0A0F1E]">
                   <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                         <History className="h-6 w-6 text-white/30" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-black uppercase tracking-tight text-white/80">Adjustment Logs</CardTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-1">Audit trail for node reversals</p>
                      </div>
                   </div>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden flex-1 bg-card">
                  {listLoading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-8 px-10">
                       <Loader2 className="h-16 w-16 animate-spin text-orange-500 opacity-20" />
                       <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 animate-pulse">Scanning ledger adjustments...</p>
                    </div>
                  ) : refunds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 px-10 text-center space-y-8">
                      <div className="h-32 w-32 rounded-[3rem] bg-muted/20 flex items-center justify-center shadow-inner border-4 border-dashed border-border/40 group">
                        <RotateCcw className="h-16 w-16 text-muted-foreground/10 group-hover:-rotate-180 transition-transform duration-1000" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-foreground/40 uppercase tracking-tighter">Zero Record set</h3>
                        <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">No reversals detected in this node cycle</p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/10 h-full overflow-y-auto px-8 custom-scrollbar pt-6">
                      {Array.isArray(refunds) && refunds.map(r => (
                        <div key={r.id} className="p-8 hover:bg-muted/10 transition-all rounded-[2.5rem] my-4 border border-transparent hover:border-border/40 group/item">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-2">
                            <div className="min-w-0 space-y-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="fintech-badge bg-orange-500/5 text-orange-600 border-orange-500/10 px-3 tracking-widest">TXN_REF: #{r.transaction_id}</div>
                                <div className="fintech-badge bg-muted/20 text-muted-foreground/40 border-0 px-3 tracking-widest">{r.refund_type.toUpperCase()}</div>
                              </div>
                              <p className="text-xs text-muted-foreground/60 font-black uppercase tracking-tight leading-relaxed italic truncate max-w-[340px]">"{r.reason || 'SYSTEM_INITIATED_ADJUSTMENT'}"</p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-3">
                              <p className="text-2xl font-black text-orange-500 tracking-tighter tabular-nums group-hover:scale-110 transition-transform">₱{fmt(r.amount)}</p>
                              {statusBadge(r.status)}
                            </div>
                          </div>
                          <div className="mt-6 pt-6 border-t border-border/5 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <Clock className="h-3 w-3 text-muted-foreground/40" />
                                <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">{new Date(r.created_at!).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                             </div>
                             <p className="text-[10px] font-bold text-white/5 uppercase tracking-[0.5em]">AUTH_OK</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-0 space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
             <Card className="fintech-card border-0 bg-[#0A0F1E] p-20 text-center border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-brandblue-500/5 to-transparent opacity-50" />
                <div className="relative z-10 space-y-10">
                   <div className="h-32 w-32 rounded-[3rem] bg-white/5 flex items-center justify-center mx-auto mb-10 shadow-3xl border border-white/10 group-hover:scale-110 transition-transform duration-1000">
                      <CalendarDays className="h-16 w-16 text-brandblue-400 animate-float" />
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Recurring Engine Active</h3>
                      <p className="text-[11px] text-white/30 font-black uppercase tracking-[0.5em] max-w-lg mx-auto leading-loose">Automated subscription node management system is fully operational across regional clusters.</p>
                   </div>
                   <div className="flex gap-4 justify-center pt-10 border-t border-white/5">
                      <div className="fintech-badge bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-8">DAEMON_ONLINE</div>
                      <div className="fintech-badge bg-white/5 text-white/40 border-white/10 px-8">VERSION_4.2.0</div>
                   </div>
                </div>
             </Card>
          </TabsContent>

          <TabsContent value="customers" className="mt-0 animate-in fade-in slide-in-from-top-4 duration-500">
             <Card className="fintech-card border-0 bg-[#0A0F1E] p-20 text-center border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-50" />
                <div className="relative z-10 space-y-10">
                   <div className="h-32 w-32 rounded-[3rem] bg-white/5 flex items-center justify-center mx-auto mb-10 shadow-3xl border border-white/10 group-hover:scale-110 transition-transform duration-1000">
                      <Users className="h-16 w-16 text-cyan-400 animate-float-delayed" />
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Directory Node Synchronized</h3>
                      <p className="text-[11px] text-white/30 font-black uppercase tracking-[0.5em] max-w-lg mx-auto leading-loose">Identity management kernel is aggregating transmission data from all merchant endpoints in real-time.</p>
                   </div>
                   <div className="flex gap-4 justify-center pt-10 border-t border-white/5">
                      <div className="fintech-badge bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-8">IAM_SYNCED</div>
                      <div className="fintech-badge bg-white/5 text-white/40 border-white/10 px-8">DATA_LOCKED</div>
                   </div>
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </SiteContainer>
    </Layout>
  );
}
