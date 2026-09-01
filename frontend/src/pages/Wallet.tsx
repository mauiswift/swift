import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
const DepositWizard = React.lazy(() => import('@/components/DepositWizard'));
const UsdtTopupWizard = React.lazy(() => import('@/components/UsdtTopupWizard'));
import {
  Wallet, DollarSign, ArrowUpFromLine, ArrowDownToLine, Send, Bitcoin,
  Loader2, ChevronRight, Clock, CheckCircle, XCircle, Building2, Landmark,
  CreditCard, Receipt, AlertCircle, ArrowRight, Globe, Wallet2, TrendingUp
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

interface WalletRequirements {
  first_usdt_topup: { amount: number; currency: string; network: string };
  php_withdrawal: { security_deposit: number; currency: string; approval_required: boolean };
  usdt_withdrawal: { minimum_amount: number; currency: string; network: string; approval_required: boolean };
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

const createKrwVirtualAccountDestination = (userId = 'swiftpay-krw-virtual-account') => {
  const hash = Array.from(userId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const digits = Array.from({ length: 14 }, (_, index) => String((hash + index * 7 + 13) % 10)).join('');
  const accountNumber = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  const label = 'KB Kookmin Bank';
  return {
    value: `swiftpay-krw-virtual-account-${userId}`,
    label,
    account_number: accountNumber,
    account_name: 'SwiftPay',
  };
};

const getDepositDestinations = (currency: string) => {
  if (currency === 'KRW') {
    return [createKrwVirtualAccountDestination()];
  }

  return [{
    value: 'Netbank',
    label: 'Netbank',
    account_number: '041-105-00037-6',
    account_name: 'Swift Technology Ventures Inc.',
  }];
};

const DEPOSIT_CHANNELS = getDepositDestinations('PHP').map(dest => ({ value: dest.value, label: dest.label }));

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

const getStatusMeta = (isKrwFlow: boolean): Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> => ({
  pending:     { label: isKrwFlow ? '대기 중' : 'Pending', color: 'text-amber-600', bg: 'bg-amber-50', icon: <Clock className="h-3.5 w-3.5" /> },
  approved:    { label: isKrwFlow ? '승인됨' : 'Approved', color: 'text-blue-600', bg: 'bg-blue-50', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  processing:  { label: isKrwFlow ? '처리 중' : 'Processing', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  transfering: { label: isKrwFlow ? '이체 진행 중' : 'Processed', color: 'text-violet-600', bg: 'bg-violet-50', icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  transferring:{ label: isKrwFlow ? '이체 진행 중' : 'Processed', color: 'text-violet-600', bg: 'bg-violet-50', icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  completed:   { label: isKrwFlow ? '완료됨' : 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  rejected:    { label: isKrwFlow ? '거절됨' : 'Rejected', color: 'text-red-600', bg: 'bg-red-50', icon: <XCircle className="h-3.5 w-3.5" /> },
  failed:      { label: isKrwFlow ? '실패' : 'Failed', color: 'text-red-600', bg: 'bg-red-50', icon: <XCircle className="h-3.5 w-3.5" /> },
  cancelled:   { label: isKrwFlow ? '취소됨' : 'Cancelled', color: 'text-slate-500', bg: 'bg-slate-50', icon: <XCircle className="h-3.5 w-3.5" /> },
});

const fmt = (n: number) => Number.isFinite(n) ? n.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '0.00';
const fmtUsd = (n: number) => Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
const currencySymbols: Record<string, string> = { PHP: '₱', CNY: '¥', KRW: '₩', USDT: '$' };
const currencyNames: Record<string, string> = {
  PHP: 'Philippine Peso', USD: 'US Dollar', CNY: 'Chinese Yuan', KRW: 'South Korean Won',
  EUR: 'Euro', GBP: 'British Pound', SGD: 'Singapore Dollar', USDT: 'Tether USD',
};
const currencyLocales: Record<string, string> = { PHP: 'en-PH', CNY: 'zh-CN', KRW: 'ko-KR', USDT: 'en-US' };
const normalizeNumericValue = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number.parseFloat(String(value ?? fallback));
  return Number.isFinite(parsed) ? parsed : fallback;
};
const formatWalletCurrency = (amount: number, currency: string) => {
  const normalizedCurrency = String(currency || 'PHP').toUpperCase();
  const safeAmount = normalizeNumericValue(amount, 0);
  const formattedAmount = safeAmount.toLocaleString(currencyLocales[normalizedCurrency] || 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currencySymbols[normalizedCurrency] || `${normalizedCurrency} `}${formattedAmount}`;
};

// ─── Component ───────────────────────────────────────────────────────
export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const usdtWalletAddress = user?.usdt_wallet_address?.trim();
  const [phpBalance, setPhpBalance] = useState<WalletBalance | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<WalletBalance | null>(null);
  const { collectionCurrency } = useCollectionCurrency();
  const depositDestinations = React.useMemo(() => getDepositDestinations(collectionCurrency), [collectionCurrency]);
  const isKrwFlow = collectionCurrency === 'KRW';
  const transferSubmittedMessage = isKrwFlow
    ? '출금 요청이 접수되어 이체 진행 중입니다.'
    : 'Your bank transfer request has been submitted and is being processed.';
  const usdtTransferSubmittedMessage = isKrwFlow
    ? 'USDT 출금 요청이 접수되어 이체 진행 중입니다.'
    : 'Your USDT withdrawal request has been submitted and is being processed through the secure bank network.';
  const statusLabelMap = {
    pending: isKrwFlow ? '대기 중' : 'Pending',
    approved: isKrwFlow ? '승인됨' : 'Approved',
    processing: isKrwFlow ? '처리 중' : 'Processing',
    transfering: isKrwFlow ? '이체 진행 중' : 'Processed',
    transferring: isKrwFlow ? '이체 진행 중' : 'Processed',
    completed: isKrwFlow ? '완료됨' : 'Completed',
    rejected: isKrwFlow ? '거절됨' : 'Rejected',
    failed: isKrwFlow ? '실패' : 'Failed',
    cancelled: isKrwFlow ? '취소됨' : 'Cancelled',
  } as const;
  const [collectionBalance, setCollectionBalance] = useState<WalletBalance | null>(null);
  const [phpTransactions, setPhpTransactions] = useState<WalletTxn[]>([]);
  const [usdtTransactions, setUsdtTransactions] = useState<WalletTxn[]>([]);
  const [collectionTransactions, setCollectionTransactions] = useState<WalletTxn[]>([]);
  const [requirements, setRequirements] = useState<WalletRequirements | null>(null);
  const [transactions, setTransactions] = useState<WalletTxn[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankOptions, setBankOptions] = useState<BankOption[]>([]);
  const [usdtPhpRate, setUsdtPhpRate] = useState<number | null>(null);

  // PHP Deposit Request form state
  const [depositAmount, setDepositAmount] = useState('');
  const [depositChannel, setDepositChannel] = useState(getDepositDestinations('PHP')[0].value);
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
  const [topupCurrency, setTopupCurrency] = useState<'PHP' | 'USDT'>('PHP');
  const [topupNote, setTopupNote] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [showUsdtWizard, setShowUsdtWizard] = useState(false);

  useEffect(() => {
    const nextDefault = depositDestinations[0]?.value ?? 'Netbank';
    if (!depositDestinations.some(dest => dest.value === depositChannel)) {
      setDepositChannel(nextDefault);
    }
  }, [depositChannel, depositDestinations]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const selectedCurrency = collectionCurrency.toUpperCase();
      const [phpRes, usdtRes, collectionRes, phpTxnRes, usdtTxnRes, collectionTxnRes, banksRes, wrRes, rateRes, requirementsRes] = await Promise.allSettled([
        client.apiCall.invoke({ url: '/api/v1/wallet/balance?currency=PHP', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/balance?currency=USDT', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: `/api/v1/wallet/balance?currency=${selectedCurrency}`, method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/transactions?currency=PHP&limit=20', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/transactions?currency=USDT&limit=20', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: `/api/v1/wallet/transactions?currency=${selectedCurrency}&limit=20`, method: 'GET', data: {} }),
        client.apiCall.invoke({ url: `/api/v1/swiftpay/institutions?currency=${selectedCurrency}`, method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/withdraw-requests', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/topup/rate', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/requirements', method: 'GET', data: {} }),
      ]);

      if (phpRes.status === 'fulfilled' && phpRes.value?.data?.balance != null) {
        setPhpBalance({
          balance: normalizeNumericValue(phpRes.value.data.balance),
          available_balance: normalizeNumericValue(phpRes.value.data.available_balance ?? phpRes.value.data.balance),
          pending_balance: normalizeNumericValue(phpRes.value.data.pending_balance ?? 0),
          currency: 'PHP',
        });
      }
      if (usdtRes.status === 'fulfilled' && usdtRes.value?.data?.balance != null) {
        setUsdtBalance({
          balance: normalizeNumericValue(usdtRes.value.data.balance),
          available_balance: normalizeNumericValue(usdtRes.value.data.available_balance ?? usdtRes.value.data.balance),
          pending_balance: normalizeNumericValue(usdtRes.value.data.pending_balance ?? 0),
          currency: 'USDT',
        });
      }
      if (collectionRes.status === 'fulfilled' && collectionRes.value?.data?.balance != null) {
        setCollectionBalance({
          balance: normalizeNumericValue(collectionRes.value.data.balance),
          available_balance: normalizeNumericValue(collectionRes.value.data.available_balance ?? collectionRes.value.data.balance),
          pending_balance: normalizeNumericValue(collectionRes.value.data.pending_balance ?? 0),
          currency: selectedCurrency,
        });
      }
      if (phpTxnRes.status === 'fulfilled' && Array.isArray(phpTxnRes.value?.data?.items)) {
        setPhpTransactions(phpTxnRes.value.data.items.filter(Boolean));
      }
      if (usdtTxnRes.status === 'fulfilled' && Array.isArray(usdtTxnRes.value?.data?.items)) {
        setUsdtTransactions(usdtTxnRes.value.data.items.filter(Boolean));
      }
      if (collectionTxnRes.status === 'fulfilled' && Array.isArray(collectionTxnRes.value?.data?.items)) {
        setCollectionTransactions(collectionTxnRes.value.data.items.filter(Boolean));
      }
      if (banksRes.status === 'fulfilled' && Array.isArray(banksRes.value?.data?.data)) {
        setBankOptions(banksRes.value.data.data.filter(Boolean));
      } else if (banksRes.status === 'fulfilled' && Array.isArray(banksRes.value?.data?.banks)) {
        setBankOptions(banksRes.value.data.banks.filter(Boolean));
      }
      if (wrRes.status === 'fulfilled' && Array.isArray(wrRes.value?.data?.requests)) {
        setWithdrawRequests(wrRes.value.data.requests.filter(Boolean));
      }
      if (rateRes.status === 'fulfilled' && rateRes.value?.data?.usdt_php_rate != null) {
        setUsdtPhpRate(rateRes.value.data.usdt_php_rate);
      }
      if (requirementsRes.status === 'fulfilled' && requirementsRes.value?.data?.success) {
        setRequirements(requirementsRes.value.data as WalletRequirements);
      }
    } catch (err) {
      console.error('Wallet fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, collectionCurrency]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user, collectionCurrency, fetchData]);

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
    const availableUsdt = usdtBalance?.available_balance ?? usdtBalance?.balance ?? 0;
    if (amount > availableUsdt) return 'Insufficient USDT balance';
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
      const selectedDestination = depositDestinations.find(d => d.value === depositChannel) ?? depositDestinations[0];
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

      const res = await fetch('/api/v1/bank-deposits', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.id) {
        toast.success(isKrwFlow ? 'KRW deposit request submitted - waiting for confirmation' : 'PHP deposit request submitted - waiting for bank confirmation');
        setDepositAmount('');
        setDepositChannel(depositDestinations[0]?.value || 'Netbank');
        setDepositMethod('same_bank');
        setDepositRefNumber('');
        setDepositNotes('');
        setDepositReceipt(null);
        setDepositDate('');
        await fetchData();
      } else {
        toast.error(data.detail || data.message || 'You have reached the maximum number of attempts, please try again after 24 hours cool down period.');
      }
    } catch (err) {
      console.error('Manual deposit submission failed:', err);
      toast.error('Network error sending the manual deposit. Please try again.');
    } finally { setDepositLoading(false); }
  };

  const handleTopupRequest = async () => {
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) {
      toast.error(`Enter a valid ${topupCurrency} amount`);
      return;
    }

    setTopupLoading(true);
    try {
      const res = await client.apiCall.invoke({
        url: '/api/v1/topup/swiftpay',
        method: 'POST',
        data: { amount, currency: topupCurrency }
      });

      if (res.data?.success && res.data?.redirect_url) {
        toast.success('Redirecting to SwiftPay...');
        window.location.href = res.data.redirect_url;
      } else {
        toast.error(res.data?.detail || res.data?.message || 'Unable to start SwiftPay payment.');
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
        toast.success(transferSubmittedMessage);
        setWrAmount(''); setWrBank(''); setWrAccount(''); setWrName(''); setWrNote('');
        await fetchData();
      } else {
        toast.error(data.detail || data.message || 'Withdrawal request could not be submitted.');
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
        toast.success(usdtTransferSubmittedMessage);
        setUsdtAmount(''); setUsdtAddress(''); setUsdtPlatform('');
        await fetchData();
      } else {
        toast.error(data.detail || data.message || 'Withdrawal request could not be submitted.');
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

  const bankList = Array.isArray(bankOptions) ? bankOptions.filter(Boolean) : [];
  const safeWithdrawRequests = Array.isArray(withdrawRequests) ? withdrawRequests.filter(Boolean) : [];
  const safeCollectionTransactions = Array.isArray(collectionTransactions) ? collectionTransactions.filter(Boolean) : [];
  const pendingCount = safeWithdrawRequests.filter(r => r?.status === 'pending').length;
  const completedCount = safeWithdrawRequests.filter(r => r?.status === 'completed').length;

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

        {requirements && (
          <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm" aria-labelledby="wallet-requirements-title">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
              <div className="min-w-0">
                <h2 id="wallet-requirements-title" className="text-sm font-semibold text-blue-950">Before you use your wallet</h2>
                <div className="mt-2 grid gap-2 text-xs leading-5 text-blue-900 sm:grid-cols-2 lg:grid-cols-3">
                  <p>First USDT top-up: exactly <strong>{requirements.first_usdt_topup.amount} {requirements.first_usdt_topup.currency}</strong> on {requirements.first_usdt_topup.network}.</p>
                  <p>PHP withdrawals: keep <strong>₱{fmt(requirements.php_withdrawal.security_deposit)}</strong> as the security deposit; only the excess is withdrawable.</p>
                  <p>Withdrawals and top-ups are reviewed by the admin team. Use the exact network and account details shown in each form.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* PHP Balance */}
          <Card className="card-3d bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-200/50 ring-1 ring-emerald-100/50 overflow-hidden hover:shadow-lg transition-all">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-200" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">{collectionCurrency} Wallet</span>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center text-emerald-700">
                  <Landmark className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-semibold text-foreground">
                {loading ? (
                  <span className="inline-block w-32 h-10 bg-slate-100 rounded-lg animate-pulse" />
                ) : formatWalletCurrency(collectionBalance?.balance || 0, collectionCurrency)}
              </p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-slate-500">{currencyNames[collectionCurrency] || collectionCurrency}</p>
                {collectionBalance?.pending_balance ? (
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Pending: {formatWalletCurrency(collectionBalance.pending_balance, collectionCurrency)}</span>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* USDT Balance */}
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
                ) : `$${fmtUsd(usdtBalance?.balance || 0)}`}
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
              <p className="text-xs text-slate-500 mt-3">Waiting for bank confirmation</p>
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
          <TabsList className="grid grid-cols-5 gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm h-auto w-full">
            <TabsTrigger value="fund" className="flex items-center justify-center gap-2 rounded-lg px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 [&>svg]:text-slate-700 data-[state=active]:[&>svg]:text-white">
              <ArrowDownToLine className="h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Fund</span>
            </TabsTrigger>
            <TabsTrigger value="php" className="flex items-center justify-center gap-2 rounded-lg px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 [&>svg]:text-slate-700 data-[state=active]:[&>svg]:text-white">
              <Landmark className="h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">PHP</span>
            </TabsTrigger>
            <TabsTrigger value="usdt" className="flex items-center justify-center gap-2 rounded-lg px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 [&>svg]:text-slate-700 data-[state=active]:[&>svg]:text-white">
              <Globe className="h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">USDT</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center justify-center gap-2 rounded-lg px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 [&>svg]:text-slate-700 data-[state=active]:[&>svg]:text-white">
              <Receipt className="h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center justify-center gap-2 rounded-lg px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 [&>svg]:text-slate-700 data-[state=active]:[&>svg]:text-white">
              <Clock className="h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0" />
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
                      {depositDestinations.map(dest => (
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
                    <DepositWizard onSuccess={fetchData} currency={collectionCurrency} destinations={depositDestinations} />
                  </React.Suspense>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Bitcoin className="h-5 w-5 text-orange-600" />
                    Top Up USDT Balance (TRC-20)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Info Box */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900">How USDT Top-Up Works</p>
                      <ol className="text-xs text-orange-800 mt-2 space-y-1 ml-4 list-decimal">
                        <li>Enter the PHP amount you want to add to your wallet</li>
                        <li>System calculates required USDT at current rate</li>
                        <li>Send USDT to the address shown below on TRC-20 network</li>
                        <li>Submit your top-up request for admin approval</li>
                        <li>Once approved, PHP amount is credited to your wallet</li>
                      </ol>
                    </div>
                  </div>

                  {/* Exchange Rate & Calculator */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
                      <p className="text-xs uppercase tracking-wider font-semibold text-slate-600 mb-2">Current Rate</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {usdtPhpRate ? `₱${usdtPhpRate.toFixed(2)}` : '—'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">per 1 USDT</p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                      <p className="text-xs uppercase tracking-wider font-semibold text-blue-600 mb-2">Your USDT Wallet</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {usdtBalance ? `$${fmtUsd(usdtBalance.balance || 0)}` : '—'}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">TRC-20 Balance</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 mb-2">Deposit Address</p>
                    {usdtWalletAddress ? (
                      <div className="space-y-2">
                        <p className="break-all font-mono text-sm text-slate-900 bg-white border border-blue-200 rounded-lg px-3 py-2 shadow-sm">
                          {usdtWalletAddress}
                        </p>
                        <p className="text-[11px] text-blue-700">Send USDT from any external wallet to this TRC-20 address.</p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-blue-200 bg-white/70 px-3 py-4 text-sm text-slate-600">
                        No USDT wallet address is set yet. Add one in Settings → Banking first.
                      </div>
                    )}
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <Label className="text-xs font-semibold text-slate-700">Amount to Add</Label>
                        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
                          {(['PHP', 'USDT'] as const).map(currency => (
                            <button
                              key={currency}
                              type="button"
                              onClick={() => setTopupCurrency(currency)}
                              className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                                topupCurrency === currency
                                  ? 'bg-white text-orange-700 shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {currency}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
                          {topupCurrency === 'PHP' ? '₱' : '$'}
                        </span>
                        <Input
                          type="number"
                          placeholder={topupCurrency === 'PHP' ? 'e.g. 5000' : 'e.g. 100'}
                          value={topupAmount}
                          onChange={e => setTopupAmount(e.target.value)}
                          min={topupCurrency === 'PHP' ? '100' : '1'}
                          step="0.01"
                          className="bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 pl-7"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {topupCurrency === 'PHP' ? 'Minimum 100 PHP' : 'Enter the USDT amount you want to buy'}
                      </p>
                    </div>

                    {/* USDT Amount Display */}
                    {topupAmount && usdtPhpRate ? (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-300">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold text-orange-900 uppercase tracking-wider">
                              {topupCurrency === 'PHP' ? 'USDT Required' : 'PHP Equivalent'}
                            </p>
                            <p className="text-2xl font-bold text-orange-900 mt-1">
                              {topupCurrency === 'PHP'
                                ? `$${(parseFloat(topupAmount) / usdtPhpRate).toFixed(2)}`
                                : `₱${(parseFloat(topupAmount) * usdtPhpRate).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-orange-800">
                              {topupCurrency === 'PHP' ? "You'll receive" : 'You pay'}
                            </p>
                            <p className="text-xl font-bold text-orange-900 mt-1">
                              {topupCurrency === 'PHP'
                                ? `₱${parseFloat(topupAmount).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`
                                : `$${parseFloat(topupAmount).toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Reference Note */}
                  <div>
                    <Label className="text-xs font-semibold text-slate-700 block mb-2">Reference Note (optional)</Label>
                    <Input
                      placeholder="e.g. Top-up for Q1 campaign or transaction reference"
                      value={topupNote}
                      onChange={e => setTopupNote(e.target.value)}
                      className="bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleTopupRequest}
                      disabled={topupLoading || !topupAmount}
                      className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white h-11 rounded-lg font-semibold shadow-lg shadow-orange-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {topupLoading ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                      ) : (
                        <><Bitcoin className="h-4 w-4 mr-2" />Buy</>
                      )}
                    </Button>

                    <Button
                      type="button"
                      onClick={() => setShowUsdtWizard(prev => !prev)}
                      className="flex-1 border border-orange-200 bg-white text-orange-700 hover:bg-orange-50 h-11 rounded-lg font-semibold transition-all"
                    >
                      Top-Up
                    </Button>
                  </div>

                  {showUsdtWizard && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4 sm:p-8">
                      <div className="mx-auto flex min-h-full max-w-2xl items-center">
                        <React.Suspense fallback={<div className="w-full rounded-xl bg-white p-8 text-center text-sm text-slate-600">Loading USDT top-up...</div>}>
                          <UsdtTopupWizard
                            initialAmount={topupCurrency === 'USDT' ? topupAmount : ''}
                            onClose={() => setShowUsdtWizard(false)}
                            onSuccess={fetchData}
                          />
                        </React.Suspense>
                      </div>
                    </div>
                  )}

                  {/* Info Footer */}
                  <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-2">
                    <p>✓ Request submitted for admin review</p>
                    <p>✓ Approval typically within 24 hours</p>
                    <p>✓ Ensure you send exact USDT amount on TRC-20 network</p>
                  </div>
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
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">은행 선택</Label>
                      <Select value={wrBank} onValueChange={(val) => {
                        setWrBank(val);
                        const b = bankList.find(x => x.code === val);
                        if (b) setWrBankName(b.name);
                      }}>
                        <SelectTrigger className="bg-slate-50 border-slate-200 text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                          <SelectValue placeholder="은행을 선택하세요" />
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
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">예금주명</Label>
                      <Input
                        placeholder="홍길동"
                        value={wrName}
                        onChange={e => setWrName(e.target.value)}
                        className="bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">계좌번호</Label>
                      <Input
                        placeholder="1234567890123"
                        value={wrAccount}
                        onChange={e => setWrAccount(e.target.value)}
                        className="bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">메모 (선택)</Label>
                      <Input
                        placeholder="관리자 전달 메모를 입력하세요"
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
                    {bankList.map(bank => (
                      <div key={bank.code} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                        <PaymentBrandLogo brand={bank.code || bank.name} size="sm" />
                        {bank.name}
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
                      {usdtBalance && (
                        <div className="text-xs text-slate-600 mt-2 font-medium">
                          Available: <span className="text-blue-700">${fmtUsd(usdtBalance.available_balance ?? usdtBalance.balance)} USDT</span>
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
                              <span className="flex items-center gap-2"><PaymentBrandLogo brand={p.code} size="sm" />{p.name}</span>
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
                  {collectionCurrency} Transaction History
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
                ) : safeCollectionTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">No {collectionCurrency} transactions yet</p>
                    <p className="text-xs text-slate-500 mt-1">Your {collectionCurrency} transaction history will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {safeCollectionTransactions.map(txn => {
                      if (!txn) return null;
                      const transactionAmount = normalizeNumericValue(txn.amount, 0);
                      const meta = txnMeta[txn.type] || txnMeta.deposit;
                      const st = getStatusMeta(isKrwFlow)[txn.status] || getStatusMeta(isKrwFlow).pending;
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
                              {meta.sign}{formatWalletCurrency(Math.abs(transactionAmount), txn.currency || collectionCurrency)}
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
                ) : safeWithdrawRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">No withdrawal requests</p>
                    <p className="text-xs text-slate-500 mt-1">Submit a request from the PHP or USDT tab</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {safeWithdrawRequests.map(req => {
                      if (!req) return null;
                      const st = getStatusMeta(isKrwFlow)[req.status] || getStatusMeta(isKrwFlow).pending;
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
