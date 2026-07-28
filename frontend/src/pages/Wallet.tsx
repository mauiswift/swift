import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import AppLoadingScreen from '@/components/AppLoadingScreen';
const DepositWizard = React.lazy(() => import('@/components/DepositWizard'));
import {
  Wallet, DollarSign, ArrowUpFromLine, ArrowDownToLine, Send, Bitcoin,
  Loader2, ChevronRight, Clock, CheckCircle, XCircle, Building2, Landmark,
  CreditCard, Receipt, AlertCircle, ArrowRight, Globe, Wallet2, Landmark2, TrendingUp
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────
interface WalletBalance {
  balance: number;
  available_balance?: number;
  pending_balance?: number;
  currency: string;
  updated_at?: string;
}

interface WalletTxn {
  id: number;
  type: 'deposit' | 'withdraw' | 'receive' | 'sent' | 'crypto_topup' | 'usdt_send' | 'disbursement' | 'refund';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  description?: string;
  created_at: string;
  reference?: string;
}

interface BankOption {
  code: string;
  name: string;
}

interface WithdrawRequest {
  id: number;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  created_at: string;
  processed_at?: string;
  processed_by?: string;
  rejection_reason?: string;
  request_type: 'php_bank' | 'usdt_trc20' | 'swiftpay_disbursement';
  usdt_address?: string;
  usdt_platform?: string;
}

// ─── Constants ───────────────────────────────────────────────────────
const BANKS: string[] = [
  'BDO', 'BPI', 'Metrobank', 'UnionBank', 'Landbank', 'PNB',
  'Chinabank', 'RCBC', 'Security Bank', 'EastWest', 'GCash', 'Maya'
];

const USDT_PLATFORMS: { code: string; name: string }[] = [
  { code: 'binance', name: 'Binance' },
  { code: 'trust_wallet', name: 'Trust Wallet' },
  { code: 'metamask', name: 'MetaMask' },
  { code: 'okx', name: 'OKX' },
  { code: 'bybit', name: 'Bybit' },
  { code: 'kucoin', name: 'KuCoin' },
  { code: 'gate_io', name: 'Gate.io' },
  { code: 'tronlink', name: 'TronLink' },
  { code: 'other', name: 'Other / Custom' },
];

const DEPOSIT_DESTINATIONS = [
  { value: 'Security Bank Corporation', label: 'Security Bank', account_number: '0000068888173', account_name: 'SwiftPay Philippines Inc' },
  { value: 'Asia United Bank', label: 'Asia United Bank', account_number: '934105321485', account_name: 'SwiftPay Philippines Inc' },
];

const DEPOSIT_CHANNELS = DEPOSIT_DESTINATIONS.map(dest => ({ value: dest.value, label: dest.label }));

const TOPUP_METHODS = [
  { value: 'same_bank', label: 'Same-bank transfer' },
  { value: 'interbank', label: 'Interbank transfer' },
  { value: 'cash_deposit', label: 'Cash deposit' },
  { value: 'check_deposit', label: 'Check deposit' },
  { value: 'international', label: 'International transfer' },
];

const FUND_WALLET_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer', description: 'Transfer funds directly from a Philippine bank into the SwiftPay account.' },
  { value: 'ubp_bills_payment', label: 'UBP Bills Payment', description: 'Use UnionBank Bills Payment and enter your SwiftPay payment code to top up.' },
];

const txnMeta: Record<string, { label: string; color: string; icon: React.ReactNode; sign: string }> = {
  deposit:       { label: 'Deposit', color: 'text-emerald-600', icon: <ArrowDownToLine className="h-4 w-4" />, sign: '+' },
  withdraw:      { label: 'Withdrawal', color: 'text-amber-600', icon: <ArrowUpFromLine className="h-4 w-4" />, sign: '-' },
  receive:       { label: 'Received', color: 'text-emerald-600', icon: <ArrowDownToLine className="h-4 w-4" />, sign: '+' },
  sent:          { label: 'Sent', color: 'text-red-600', icon: <Send className="h-4 w-4" />, sign: '-' },
  crypto_topup:  { label: 'Crypto Top Up', color: 'text-teal-600', icon: <Bitcoin className="h-4 w-4" />, sign: '+' },
  usdt_send:     { label: 'USDT Withdrawal', color: 'text-red-600', icon: <Send className="h-4 w-4" />, sign: '-' },
  disbursement:  { label: 'Disbursement', color: 'text-red-600', icon: <Send className="h-4 w-4" />, sign: '-' },
  refund:        { label: 'Refund', color: 'text-emerald-600', icon: <Receipt className="h-4 w-4" />, sign: '+' },
};

const statusMeta: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50', icon: <Clock className="h-3.5 w-3.5" /> },
  approved:   { label: 'Approved', color: 'text-blue-600', bg: 'bg-blue-50', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  processing: { label: 'Processing', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  completed:  { label: 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  rejected:   { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-50', icon: <XCircle className="h-3.5 w-3.5" /> },
  failed:     { label: 'Failed', color: 'text-red-600', bg: 'bg-red-50', icon: <XCircle className="h-3.5 w-3.5" /> },
  cancelled:  { label: 'Cancelled', color: 'text-slate-500', bg: 'bg-slate-50', icon: <XCircle className="h-3.5 w-3.5" /> },
};

const fmt = (n: number) => n.toLocaleString('en-PH', { minimumFractionDigits: 2 });
const fmtUsd = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Component ───────────────────────────────────────────────────────
export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = React.useMemo(() => [new URLSearchParams(window.location.search)], [window.location.search]);
  const [phpBalance, setPhpBalance] = useState<WalletBalance | null>(null);
  const [usdBalance, setUsdBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTxn[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankOptions, setBankOptions] = useState<BankOption[]>([]);
  const [usdtPhpRate, setUsdtPhpRate] = useState<number | null>(null);

  // PHP Deposit Request form state
  const [depositAmount, setDepositAmount] = useState('');
  const [depositChannel, setDepositChannel] = useState('Security Bank Corporation');
  const [depositMethod, setDepositMethod] = useState('same_bank');
  const [depositRefNumber, setDepositRefNumber] = useState('');
  const [depositNotes, setDepositNotes] = useState('');
  const [depositReceipt, setDepositReceipt] = useState<File | null>(null);
  const [depositDate, setDepositDate] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);

  // PHP Bank Withdraw Request form state
  const [wrAmount, setWrAmount] = useState('');
  const [wrBank, setWrBank] = useState('');
  const [wrBankName, setWrBankName] = useState('');
  const [wrAccount, setWrAccount] = useState('');
  const [wrName, setWrName] = useState('');
  const [wrNote, setWrNote] = useState('');
  const [wrLoading, setWrLoading] = useState(false);

  // USDT Withdraw Request form state
  const [usdtAmount, setUsdtAmount] = useState('');
  const [usdtAddress, setUsdtAddress] = useState('');
  const [usdtPlatform, setUsdtPlatform] = useState('');
  const [usdtLoading, setUsdtLoading] = useState(false);

  // USDT Top-up request form state
  const [topupAmount, setTopupAmount] = useState('');
  const [topupNote, setTopupNote] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [phpRes, usdRes, txnRes, banksRes, wrRes, rateRes] = await Promise.allSettled([
        client.apiCall.invoke({ url: '/api/v1/wallet/balance?currency=PHP', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/balance?currency=USD', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/transactions?limit=20', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/swiftpay/institutions', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/withdraw-requests', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/topup/rate', method: 'GET', data: {} }),
      ]);

      if (phpRes.status === 'fulfilled' && phpRes.value?.data?.balance != null) {
        setPhpBalance({
          balance: phpRes.value.data.balance,
          available_balance: phpRes.value.data.available_balance ?? phpRes.value.data.balance,
          pending_balance: phpRes.value.data.pending_balance ?? 0,
          currency: 'PHP',
        });
      }
      if (usdRes.status === 'fulfilled' && usdRes.value?.data?.balance != null) {
        setUsdBalance({
          balance: usdRes.value.data.balance,
          available_balance: usdRes.value.data.available_balance ?? usdRes.value.data.balance,
          pending_balance: usdRes.value.data.pending_balance ?? 0,
          currency: 'USD',
        });
      }
      if (txnRes.status === 'fulfilled' && txnRes.value?.data?.items) {
        setTransactions(txnRes.value.data.items);
      }
      if (banksRes.status === 'fulfilled' && banksRes.value?.data?.data) {
        setBankOptions(banksRes.value.data.data);
      } else if (banksRes.status === 'fulfilled' && banksRes.value?.data?.banks) {
        setBankOptions(banksRes.value.data.banks);
      }
      if (wrRes.status === 'fulfilled' && wrRes.value?.data?.requests) {
        setWithdrawRequests(wrRes.value.data.requests);
      }
      if (rateRes.status === 'fulfilled' && rateRes.value?.data?.usdt_php_rate != null) {
        setUsdtPhpRate(rateRes.value.data.usdt_php_rate);
      }
    } catch (err) {
      console.error('Wallet fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user, fetchData]);

  const [activeTab, setActiveTab] = useState('fund');
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'topup') {
      setActiveTab('fund');
    } else if (action === 'withdraw') {
      setActiveTab('php');
    }
  }, [searchParams]);

  // Enhanced validation logic
  const validatePhpWithdraw = (amount: number): string | null => {
    if (isNaN(amount) || amount <= 0) return 'Enter a valid amount';
    if (!wrBank) return 'Select a bank';
    if (!wrAccount.trim()) return 'Enter account number';
    if (!wrName.trim()) return 'Enter account holder name';
    const availablePhp = phpBalance?.available_balance ?? phpBalance?.balance ?? 0;
    if (amount > availablePhp) return 'Insufficient available balance';
    return null;
  };

  const validateUsdtWithdraw = (amount: number): string | null => {
    if (isNaN(amount) || amount <= 0) return 'Enter a valid USDT amount';
    if (amount < 10) return 'Minimum amount is 10 USDT';
    if (!usdtAddress.trim()) return 'Enter your USDT address';
    if (!usdtPlatform) return 'Select which platform your address belongs to';
    const availableUsd = usdBalance?.available_balance ?? usdBalance?.balance ?? 0;
    if (amount > availableUsd) return 'Insufficient USDT balance';
    if (!usdtAddress.startsWith('T') || usdtAddress.length !== 34) {
      return 'Invalid USDT address (must start with T and be 34 characters)';
    }
    return null;
  };

  const handlePhpDepositRequest = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid deposit amount'); return; }
    if (!depositChannel) { toast.error('Choose a destination bank'); return; }
    if (!depositMethod.trim()) { toast.error('Select a transfer method'); return; }
    if (!depositDate) { toast.error('Select the transfer date'); return; }
    if (!depositRefNumber.trim()) { toast.error('Enter the reference number'); return; }
    if (!depositReceipt) { toast.error('Upload proof of transaction'); return; }

    setDepositLoading(true);
    try {
      const selectedDestination = DEPOSIT_DESTINATIONS.find(d => d.value === depositChannel);
      const accountNumber = selectedDestination?.account_number || depositChannel;
      const formData = new FormData();
      formData.append('amount_php', amount.toString());
      formData.append('channel', depositChannel);
      formData.append('account_number', accountNumber);
      formData.append('transfer_method', depositMethod.trim());
      formData.append('ref_number', depositRefNumber.trim());
      formData.append('receipt', depositReceipt);
      if (depositNotes.trim()) {
        formData.append('note', depositNotes.trim());
      }
      formData.append('transfer_date', depositDate);

      const res = await fetch('/api/v1/bank-deposits', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.id) {
        toast.success('PHP deposit request submitted for review');
        setDepositAmount('');
        setDepositChannel('Security Bank Corporation');
        setDepositMethod('same_bank');
        setDepositRefNumber('');
        setDepositNotes('');
        setDepositReceipt(null);
        setDepositDate('');
        await fetchData();
      } else {
        toast.error(data.detail || 'Failed to submit deposit request');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally { setDepositLoading(false); }
  };

  const handleTopupRequest = async () => {
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid PHP amount'); return; }

    setTopupLoading(true);
    try {
      const res = await client.apiCall.invoke({
        url: '/api/v1/topup/swiftpay',
        method: 'POST',
        data: { amount, currency: 'PHP' }
      });

      if (res.data?.success && res.data?.redirect_url) {
        toast.success('Redirecting to SwiftPay...');
        window.location.href = res.data.redirect_url;
      } else {
        // Fallback to manual request if SwiftPay fails or not configured
        const manualRes = await fetch('/api/v1/topup/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currency: 'PHP', note: topupNote.trim() || undefined }),
        });
        const data = await manualRes.json();
        if (data.id) {
          toast.success('USDT top-up request submitted (Manual)');
          setTopupAmount(''); setTopupNote('');
          await fetchData();
        } else {
          toast.error(data.detail || 'Failed to submit top-up request');
        }
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally { setTopupLoading(false); }
  };

  const handlePhpWithdrawRequest = async () => {
    const amount = parseFloat(wrAmount);
    const error = validatePhpWithdraw(amount);
    if (error) { toast.error(error); return; }

    setWrLoading(true);
    try {
      const res = await fetch('/api/v1/wallet/withdraw-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type: 'php_bank',
          amount,
          bank_name: wrBank,
          account_number: wrAccount.trim(),
          account_name: wrName.trim(),
          note: wrNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('PHP withdrawal request submitted');
        setWrAmount(''); setWrBank(''); setWrAccount(''); setWrName(''); setWrNote('');
        await fetchData();
      } else {
        toast.error(data.message || 'Failed to submit request');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally { setWrLoading(false); }
  };

  const handleUsdtWithdrawRequest = async () => {
    const amount = parseFloat(usdtAmount);
    const error = validateUsdtWithdraw(amount);
    if (error) { toast.error(error); return; }

    setUsdtLoading(true);
    try {
      const res = await fetch('/api/v1/wallet/withdraw-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type: 'usdt_trc20',
          amount,
          usdt_address: usdtAddress.trim(),
          usdt_platform: usdtPlatform,
          network: 'TRC20',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('USDT withdrawal request submitted');
        setUsdtAmount(''); setUsdtAddress(''); setUsdtPlatform('');
        await fetchData();
      } else {
        toast.error(data.message || 'Failed to submit request');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally { setUsdtLoading(false); }
  };

  if (authLoading) {
    return <AppLoadingScreen />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <p className="text-slate-500">Please log in to view your wallet.</p>
      </div>
    );
  }

  const bankList = bankOptions.length > 0 ? bankOptions : BANKS.map(b => ({ code: b, name: b }));
  const pendingCount = withdrawRequests.filter(r => r.status === 'pending').length;
  const completedCount = withdrawRequests.filter(r => r.status === 'completed').length;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50/30 p-8 shadow-sm">
            <div className="absolute -top-14 -right-10 h-40 w-40 rounded-full bg-emerald-200/30 blur-2xl" />
            <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-blue-200/30 blur-2xl" />
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h1 className="text-4xl font-semibold tracking-tight text-foreground">Wallet</h1>
                </div>
                <p className="text-sm text-slate-600 max-w-2xl font-medium">
                  Manage PHP and USDT balances, fund your account, submit withdrawals, and track activity
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* PHP Balance */}
          <Card className="card-3d bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-200/50 ring-1 ring-emerald-100/50 overflow-hidden hover:shadow-lg transition-all">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-200" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">PHP Wallet</span>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center text-emerald-700">
                  <Landmark className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-semibold text-foreground">
                {loading ? (
                  <span className="inline-block w-32 h-10 bg-slate-100 rounded-lg animate-pulse" />
                ) : `₱${fmt(phpBalance?.balance || 0)}`}
              </p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-slate-500">Philippine Peso</p>
                {phpBalance?.pending_balance ? (
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Pending: ₱{fmt(phpBalance.pending_balance)}</span>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* USD Balance */}
          <Card className="card-3d bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 ring-1 ring-blue-100/50 overflow-hidden hover:shadow-lg transition-all">
            <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-200" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">USDT Wallet</span>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-700">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-semibold text-foreground">
                {loading ? (
                  <span className="inline-block w-32 h-10 bg-slate-100 rounded-lg animate-pulse" />
                ) : `$${fmtUsd(usdBalance?.balance || 0)}`}
              </p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-slate-500">TRC-20 Network</p>
                {usdtPhpRate && (
                  <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full">₱{usdtPhpRate.toFixed(2)}/USDT</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Requests */}
          <Card className="card-3d bg-gradient-to-br from-white to-amber-50/30 border border-amber-200/50 ring-1 ring-amber-100/50 overflow-hidden hover:shadow-lg transition-all">
            <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-amber-200" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending</span>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center text-amber-700">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-semibold text-foreground">
                {loading ? (
                  <span className="inline-block w-16 h-10 bg-slate-100 rounded-lg animate-pulse" />
                ) : pendingCount}
              </p>
              <p className="text-xs text-slate-500 mt-3">Requests awaiting review</p>
            </CardContent>
          </Card>

          {/* Completed Requests */}
          <Card className="card-3d bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 ring-1 ring-green-100/50 overflow-hidden hover:shadow-lg transition-all">
            <div className="h-1 w-full bg-gradient-to-r from-green-400 to-green-200" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">Completed</span>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center text-green-700">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-semibold text-foreground">
                {loading ? (
                  <span className="inline-block w-16 h-10 bg-slate-100 rounded-lg animate-pulse" />
                ) : completedCount}
              </p>
              <p className="text-xs text-slate-500 mt-3">Successfully processed</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 gap-1 rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-1 shadow-sm h-auto w-full">
            <TabsTrigger value="fund" className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
              <ArrowDownToLine className="h-4 w-4" />
              <span className="hidden sm:inline">Fund</span>
            </TabsTrigger>
            <TabsTrigger value="php" className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
              <Landmark className="h-4 w-4" />
              <span className="hidden sm:inline">PHP</span>
            </TabsTrigger>
            <TabsTrigger value="usdt" className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">USDT</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Requests</span>
            </TabsTrigger>
          </TabsList>

          {/* ─── FUND WALLET TAB ─── */}
          <TabsContent value="fund" className="mt-0">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <ArrowDownToLine className="h-5 w-5 text-blue-600" />
                    Fund Wallet via Bank Transfer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-4">SwiftPay Bank Accounts</p>
                    <div className="space-y-3">
                      {DEPOSIT_DESTINATIONS.map(dest => (
                        <div key={dest.value} className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-xs uppercase tracking-wider font-semibold text-slate-600">Bank</p>
                              <p className="mt-2 font-semibold text-foreground">{dest.label}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wider font-semibold text-slate-600">Account Name</p>
                              <p className="mt-2 font-semibold text-foreground">{dest.account_name}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-xs uppercase tracking-wider font-semibold text-slate-600">Account Number</p>
                              <p className="mt-2 font-mono font-semibold text-foreground">{dest.account_number}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <React.Suspense fallback={
                    <div className="flex items-center justify-center p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <Loader2 className="h-5 w-5 text-slate-400 animate-spin mr-2" />
                      <span className="text-xs text-slate-600 font-medium">Loading deposit wizard...</span>
                    </div>
                  }>
                    <DepositWizard onSuccess={fetchData} />
                  </React.Suspense>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Bitcoin className="h-5 w-5 text-orange-600" />
                    Top Up USDT Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">USDT to PHP Conversion</p>
                      <p className="text-xs text-blue-800 mt-1">Send USDT on TRC-20 network and request conversion to PHP. Your wallet will be credited after admin approval.</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700 block mb-2">PHP Amount to Credit</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 5000"
                      value={topupAmount}
                      onChange={e => setTopupAmount(e.target.value)}
                      min="100"
                      step="0.01"
                      className="bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    {usdtPhpRate ? (
                      <p className="text-xs text-slate-600 mt-2 font-medium">Rate: ₱{usdtPhpRate.toFixed(2)} per USDT · Approx: ${(parseFloat(topupAmount) / usdtPhpRate).toFixed(2)} USDT</p>
                    ) : (
                      <p className="text-xs text-slate-500 mt-2">Rate loads automatically</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700 block mb-2">Reference Note (optional)</Label>
                    <Input
                      placeholder="Enter any reference or notes for admin"
                      value={topupNote}
                      onChange={e => setTopupNote(e.target.value)}
                      className="bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <Button
                    onClick={handleTopupRequest}
                    disabled={topupLoading || !topupAmount}
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white h-10 rounded-lg font-semibold shadow-lg shadow-orange-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {topupLoading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
                    ) : (
                      <><Bitcoin className="h-4 w-4 mr-2" />Submit USDT Top-Up Request</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── PHP WITHDRAW TAB ─── */}
          <TabsContent value="php" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-white border border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                    Withdraw PHP to Bank Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">Amount (₱)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={wrAmount}
                        onChange={e => setWrAmount(e.target.value)}
                        min="1"
                        step="0.01"
                        className="bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      {phpBalance && (
                        <div className="text-xs text-slate-600 mt-2 font-medium">
                          Available: <span className="text-emerald-700">₱{fmt(phpBalance.available_balance ?? phpBalance.balance)}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">Bank</Label>
                      <Select value={wrBank} onValueChange={(val) => {
                        setWrBank(val);
                        const b = bankList.find(x => x.code === val);
                        if (b) setWrBankName(b.name);
                      }}>
                        <SelectTrigger className="bg-slate-50 border-slate-200 text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                          <SelectValue placeholder="Select bank…" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 max-h-[300px]">
                          {bankList.map(b => (
                            <SelectItem key={b.code} value={b.code} className="text-foreground">
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">Account Number</Label>
                      <Input
                        placeholder="1234567890"
                        value={wrAccount}
                        onChange={e => setWrAccount(e.target.value)}
                        className="bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">Account Holder Name</Label>
                      <Input
                        placeholder="Juan Dela Cruz"
                        value={wrName}
                        onChange={e => setWrName(e.target.value)}
                        className="bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">Note (optional)</Label>
                      <Input
                        placeholder="Additional instructions for admin..."
                        value={wrNote}
                        onChange={e => setWrNote(e.target.value)}
                        className="bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handlePhpWithdrawRequest}
                    disabled={wrLoading || !wrAmount || !wrBank || !wrAccount || !wrName}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white h-10 rounded-lg font-semibold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {wrLoading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting Request...</>
                    ) : (
                      <><ArrowUpFromLine className="h-4 w-4 mr-2" />Submit PHP Withdrawal Request</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-slate-600" />
                    Supported Banks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {BANKS.map(bank => (
                      <div key={bank} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                        <div className="h-2 w-2 rounded-full bg-blue-600" />
                        {bank}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Processing time:</span> 1-3 business days
                    </p>
                    <p className="text-xs text-slate-600 mt-2">
                      <span className="font-semibold text-slate-700">Network:</span> PHP only
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── USDT WITHDRAW TAB ─── */}
          <TabsContent value="usdt" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-white border border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Withdraw USDT to Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-900">Network: TRC-20 (Tron)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">Amount (USDT)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={usdtAmount}
                        onChange={e => setUsdtAmount(e.target.value)}
                        min="10"
                        step="0.01"
                        className="bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      {usdBalance && (
                        <div className="text-xs text-slate-600 mt-2 font-medium">
                          Available: <span className="text-blue-700">${fmtUsd(usdBalance.available_balance ?? usdBalance.balance)} USDT</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">Platform / Wallet</Label>
                      <Select value={usdtPlatform} onValueChange={setUsdtPlatform}>
                        <SelectTrigger className="bg-slate-50 border-slate-200 text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                          <SelectValue placeholder="Select platform…" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200">
                          {USDT_PLATFORMS.map(p => (
                            <SelectItem key={p.code} value={p.code} className="text-foreground">
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">USDT Address (TRC-20)</Label>
                      <Input
                        placeholder="TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                        value={usdtAddress}
                        onChange={e => setUsdtAddress(e.target.value)}
                        className="bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 font-mono text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <p className="text-xs text-slate-600 mt-2 font-medium">
                        Must start with "T" and be 34 characters long. Double-check before submitting.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleUsdtWithdrawRequest}
                    disabled={usdtLoading || !usdtAmount || !usdtAddress || !usdtPlatform}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-10 rounded-lg font-semibold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {usdtLoading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting Request...</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" />Submit USDT Withdrawal Request</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Wallet2 className="h-5 w-5 text-slate-600" />
                    Important Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Supported Platforms:</p>
                    <div className="space-y-1 mt-2">
                      {USDT_PLATFORMS.slice(0, 5).map(p => (
                        <p key={p.code} className="text-xs text-slate-600">• {p.name}</p>
                      ))}
                      <p className="text-xs text-slate-600">• And more...</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-xs text-slate-700 font-semibold mb-2">Withdrawal Details:</p>
                    <ul className="space-y-1 text-xs text-slate-600">
                      <li>• <span className="font-medium">Network:</span> TRC-20 only</li>
                      <li>• <span className="font-medium">Min amount:</span> 10 USDT</li>
                      <li>• <span className="font-medium">Network fee:</span> ~1 USDT</li>
                      <li>• <span className="font-medium">Processing:</span> 1-2 hours</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── HISTORY TAB ─── */}
          <TabsContent value="history" className="mt-0">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-slate-600" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 animate-pulse">
                        <div className="h-10 w-10 rounded-lg bg-slate-200 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-slate-200 rounded w-1/3" />
                          <div className="h-2.5 bg-slate-200 rounded w-1/4" />
                        </div>
                        <div className="h-4 w-24 bg-slate-200 rounded" />
                      </div>
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">No transactions yet</p>
                    <p className="text-xs text-slate-500 mt-1">Your transaction history will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {transactions.map(txn => {
                      const meta = txnMeta[txn.type] || txnMeta.deposit;
                      const st = statusMeta[txn.status] || statusMeta.pending;
                      return (
                        <div key={txn.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center ${meta.color}`}>
                              {meta.icon}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                              <p className="text-xs text-slate-500">
                                {txn.description || txn.reference || `#${txn.id}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${meta.color}`}>
                              {meta.sign}{txn.currency === 'USD' ? '$' : '₱'}{fmt(Math.abs(txn.amount))}
                            </p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${st.bg} ${st.color}`}>
                              {st.icon}
                              {st.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── MY REQUESTS TAB ─── */}
          <TabsContent value="requests" className="mt-0">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-600" />
                  My Withdrawal Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 animate-pulse">
                        <div className="h-10 w-10 rounded-lg bg-slate-200 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-slate-200 rounded w-1/3" />
                          <div className="h-2.5 bg-slate-200 rounded w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : withdrawRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">No withdrawal requests</p>
                    <p className="text-xs text-slate-500 mt-1">Submit a request from the PHP or USDT tab</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {withdrawRequests.map(req => {
                      const st = statusMeta[req.status] || statusMeta.pending;
                      const isUsdt = req.request_type === 'usdt_trc20';
                      return (
                        <div key={req.id} className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${st.bg} ${st.color}`}>
                                {st.icon}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-foreground">
                                    {isUsdt ? `$${fmtUsd(req.amount)} USDT` : `₱${fmt(req.amount)}`}
                                  </p>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${st.bg} ${st.color}`}>
                                    {st.label}
                                  </span>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                    {isUsdt ? 'USDT · TRC-20' : 'PHP · Bank'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                  {isUsdt ? (
                                    <>
                                      {req.usdt_platform && `${USDT_PLATFORMS.find(p => p.code === req.usdt_platform)?.name || req.usdt_platform} · `}
                                      {req.usdt_address}
                                    </>
                                  ) : (
                                    <>
                                      {req.bank_name} · {req.account_number} · {req.account_name}
                                    </>
                                  )}
                                </p>
                                {req.note && (
                                  <p className="text-xs text-slate-500 mt-1 italic">
                                    Note: {req.note}
                                  </p>
                                )}
                                {req.rejection_reason && (
                                  <p className="text-xs text-red-600 mt-1 font-medium">
                                    Reason: {req.rejection_reason}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-slate-500 font-medium">
                                {new Date(req.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                              {req.processed_at && (
                                <p className="text-xs text-slate-500 mt-1">
                                  Processed: {new Date(req.processed_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
