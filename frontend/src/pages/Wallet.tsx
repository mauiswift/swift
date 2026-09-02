import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
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

const DEPOSIT_DESTINATIONS = [
  { value: 'Netbank', label: 'Netbank', account_number: '041-105-00037-6', account_name: 'Swift Technology Ventures Inc.' },
];

const getWalletDepositDestinations = (
  currency: string,
  userId?: string,
  bankName = 'KB Kookmin Bank',
  accountHolderName = 'SwiftPay Ventures Inc.',
) => {
  if (currency === 'KRW') {
    const hash = Array.from((userId || 'swiftpay-krw-virtual-account')).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const digits = Array.from({ length: 14 }, (_, index) => String((hash + index * 7 + 13) % 10)).join('');
    const accountNumber = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    return [{
      value: `swiftpay-krw-virtual-account-${userId || 'swiftpay-krw-virtual-account'}`,
      label: bankName,
      account_number: accountNumber,
      account_name: accountHolderName,
    }];
  }

  return DEPOSIT_DESTINATIONS;
};

const DEPOSIT_CHANNELS = DEPOSIT_DESTINATIONS.map(dest => ({ value: dest.value, label: dest.label }));

const TOPUP_METHODS = [
  { value: 'same_bank', label: 'Same-bank transfer' },
  { value: 'interbank', label: 'Interbank transfer' },
  { value: 'cash_deposit', label: 'Cash deposit' },
  { value: 'check_deposit', label: 'Check deposit' },
  { value: 'international', label: 'International transfer' },
];

const BANKS = [
  'BDO',
  'BPI',
  'Metrobank',
  'UnionBank',
  'Security Bank',
  'Landbank',
  'RCBC',
  'EastWest',
  'DBP',
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
  const { language } = useLanguage();
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [phpBalance, setPhpBalance] = useState<WalletBalance | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<WalletBalance | null>(null);
  const { collectionCurrency } = useCollectionCurrency();
  const [collectionBalance, setCollectionBalance] = useState<WalletBalance | null>(null);
  const [phpTransactions, setPhpTransactions] = useState<WalletTxn[]>([]);
  const [usdtTransactions, setUsdtTransactions] = useState<WalletTxn[]>([]);
  const [collectionTransactions, setCollectionTransactions] = useState<WalletTxn[]>([]);
  const [transactions, setTransactions] = useState<WalletTxn[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankOptions, setBankOptions] = useState<BankOption[]>([]);
  const [usdtPhpRate, setUsdtPhpRate] = useState<number | null>(null);
  const [krwBankName, setKrwBankName] = useState('KB Kookmin Bank');
  const [krwAccountHolderName, setKrwAccountHolderName] = useState('SwiftPay Ventures Inc.');
  const isKrwFlow = collectionCurrency === 'KRW';
  const isKoreanWallet = language === 'ko' || isKrwFlow;
  const walletDepositDestinations = useMemo(
    () => getWalletDepositDestinations(collectionCurrency, user?.id, krwBankName, krwAccountHolderName),
    [collectionCurrency, user?.id, krwBankName, krwAccountHolderName],
  );
  const walletTitle = isKoreanWallet ? '지갑' : 'Wallet';
  const walletSubtitle = isKoreanWallet
    ? 'PHP 및 USDT 잔액을 관리하고, 자금을 충전하고, 출금 및 거래 내역을 확인하세요.'
    : 'Manage PHP and USDT balances, fund your account, submit withdrawals, and track activity';
  const collectionWalletLabel = isKoreanWallet ? `${collectionCurrency} 지갑` : `${collectionCurrency} Wallet`;
  const fundWalletTitle = isKoreanWallet ? '은행 이체로 자금 충전' : 'Fund Wallet via Bank Transfer';
  const withdrawTitle = isKoreanWallet ? '한국 은행 계좌로 출금' : 'Withdraw to Bank Account';
  const withdrawBankTitle = isKrwFlow
    ? `${krwBankName || 'KB Kookmin Bank'} 한국 은행 계좌로 출금`
    : 'Withdraw PHP to Bank Account';
  const withdrawSubmitLabel = isKrwFlow
    ? `${krwBankName || 'KB Kookmin Bank'} 출금 요청 제출`
    : 'Submit PHP Withdrawal Request';
  const tabLabels = {
    fund: isKoreanWallet ? '충전' : 'Fund',
    php: isKrwFlow ? 'KRW' : 'PHP',
    usdt: 'USDT',
    history: isKoreanWallet ? '기록' : 'History',
    requests: isKoreanWallet ? '요청' : 'Requests',
  };
  const tabIcons = {
    fund: ArrowDownToLine,
    php: Landmark,
    usdt: Globe,
    history: Receipt,
    requests: Clock,
  } as const;
  const rateLabel = isKoreanWallet ? '현재 환율' : 'Current Rate';
  const usdtWalletLabel = isKoreanWallet ? '내 USDT 지갑' : 'Your USDT Wallet';
  const pendingSummaryLabel = isKoreanWallet ? '검토 대기 중' : 'Pending';
  const completedSummaryLabel = isKoreanWallet ? '처리 완료' : 'Completed';

  // PHP Deposit Request form state
  const [depositAmount, setDepositAmount] = useState('');
  const [depositChannel, setDepositChannel] = useState('Netbank');
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
      const selectedCurrency = collectionCurrency.toUpperCase();
      const institutionCurrency = selectedCurrency === 'KRW' ? 'KRW' : 'PHP';
      const [phpRes, usdtRes, collectionRes, phpTxnRes, usdtTxnRes, collectionTxnRes, banksRes, wrRes, rateRes] = await Promise.allSettled([
        client.apiCall.invoke({ url: '/api/v1/wallet/balance?currency=PHP', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/balance?currency=USDT', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: `/api/v1/wallet/balance?currency=${selectedCurrency}`, method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/transactions?currency=PHP&limit=20', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/transactions?currency=USDT&limit=20', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: `/api/v1/wallet/transactions?currency=${selectedCurrency}&limit=20`, method: 'GET', data: {} }),
        client.apiCall.invoke({ url: `/api/v1/swiftpay/institutions?currency=${institutionCurrency}`, method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/withdraw-requests', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/topup/rate', method: 'GET', data: {} }),
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
    } catch (err) {
      console.error('Wallet fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, collectionCurrency]);

  useEffect(() => {
    if (!user) return;

    Promise.allSettled([
      client.get('/api/v1/app-settings/krw-bank-name'),
      client.get('/api/v1/app-settings/krw-account-holder-name'),
    ]).then(([bankRes, holderRes]) => {
      if (bankRes.status === 'fulfilled' && bankRes.value?.ok && bankRes.value.data?.bank_name) {
        setKrwBankName(bankRes.value.data.bank_name);
      }
      if (holderRes.status === 'fulfilled' && holderRes.value?.ok && holderRes.value.data?.holder_name) {
        setKrwAccountHolderName(holderRes.value.data.holder_name);
      }
    }).catch(() => undefined);

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

  useEffect(() => {
    if (isKrwFlow && krwAccountHolderName && !wrName) {
      setWrName(krwAccountHolderName);
    }
  }, [isKrwFlow, krwAccountHolderName, wrName]);

  // Enhanced validation logic
-  const validatePhpWithdraw = (amount: number): string | null => {
-    if (isNaN(amount) || amount <= 0) return 'Enter a valid amount';
-    if (!wrBank) return 'Select a bank';
-    if (!wrAccount.trim()) return 'Enter account number';
-    if (!wrName.trim()) return 'Enter account holder name';
-    const availablePhp = phpBalance?.available_balance ?? phpBalance?.balance ?? 0;
-    if (amount > availablePhp) return 'Insufficient available balance';
-    return null;
-  };
+  const validateBankWithdraw = (amount: number): string | null => {
+    if (isNaN(amount) || amount <= 0) return 'Enter a valid amount';
+    if (!wrBank) return 'Select a bank';
+    if (!wrAccount.trim()) return 'Enter account number';
+    if (!wrName.trim()) return 'Enter account holder name';
+    // Use collectionBalance for the active currency (collectionCurrency is the source of truth)
+    const selectedCurrency = String(collectionCurrency || 'PHP').toUpperCase();
+    const available = selectedCurrency === 'PHP'
+      ? (phpBalance?.available_balance ?? phpBalance?.balance ?? 0)
+      : (collectionBalance?.available_balance ?? collectionBalance?.balance ?? 0);
+    if (amount > available) return 'Insufficient available balance';
+    return null;
+  };

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

      const res = await fetch('/api/v1/bank-deposits', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.id) {
        toast.success('PHP deposit request submitted for review');
        setDepositAmount('');
        setDepositChannel('Netbank');
        setDepositMethod('same_bank');
        setDepositRefNumber('');
        setDepositNotes('');
        setDepositReceipt(null);
        setDepositDate('');
        await fetchData();
      } else {
        toast.error(data.detail || data.message || 'Failed to submit deposit request');
      }
    } catch (err) {
      console.error('Manual deposit submission failed:', err);
      toast.error('Network error sending the manual deposit. Please try again.');
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

-  const handlePhpWithdrawRequest = async () => {
-    const amount = parseFloat(wrAmount);
-    const error = validatePhpWithdraw(amount);
-    if (error) { toast.error(error); return; }
-
-    setWrLoading(true);
-    try {
-      const res = await fetch('/api/v1/wallet/withdraw-request', {
-        method: 'POST',
-        headers: { 'Content-Type': 'application/json' },
-        body: JSON.stringify({
-          request_type: 'php_bank',
-          amount,
-          bank_name: wrBank,
-          account_number: wrAccount.trim(),
-          account_name: wrName.trim(),
-          note: wrNote.trim() || undefined,
-        }),
-      });
-      const data = await res.json();
-      if (data.success) {
-        toast.success('PHP withdrawal request submitted');
-        setWrAmount(''); setWrBank(''); setWrAccount(''); setWrName(''); setWrNote('');
-        await fetchData();
-      } else {
-        toast.error(data.message || 'Failed to submit request');
-      }
-    } catch {
-      toast.error('Network error. Please try again.');
-    } finally { setWrLoading(false); }
-  };
+  const handleWithdrawRequest = async () => {
+    const selectedCurrency = String(collectionCurrency || 'PHP').toUpperCase();
+
+    // USDT flow (crypto)
+    if (selectedCurrency === 'USDT') {
+      const amount = parseFloat(usdtAmount);
+      const error = validateUsdtWithdraw(amount);
+      if (error) { toast.error(error); return; }
+
+      setUsdtLoading(true);
+      try {
+        const res = await fetch('/api/v1/wallet/withdraw-request', {
+          method: 'POST',
+          headers: { 'Content-Type': 'application/json' },
+          body: JSON.stringify({
+            request_type: 'usdt_trc20',
+            currency: 'USDT',
+            amount,
+            usdt_address: usdtAddress.trim(),
+            usdt_platform: usdtPlatform,
+            network: 'TRC20',
+          }),
+        });
+        const data = await res.json();
+        if (data.success) {
+          toast.success('USDT withdrawal request submitted');
+          setUsdtAmount(''); setUsdtAddress(''); setUsdtPlatform('');
+          await fetchData();
+        } else {
+          toast.error(data.message || 'Failed to submit request');
+        }
+      } catch {
+        toast.error('Network error. Please try again.');
+      } finally { setUsdtLoading(false); }
+      return;
+    }
+
+    // Bank / fiat flow (PHP, KRW, etc.)
+    const amount = parseFloat(wrAmount);
+    const error = validateBankWithdraw(amount);
+    if (error) { toast.error(error); return; }
+
+    setWrLoading(true);
+    try {
+      // Use a generic `bank` request_type and include currency for backend routing.
+      // Fallback to php_bank for compatibility if needed.
+      const body: any = {
+        request_type: 'bank',
+        currency: selectedCurrency,
+        amount,
+        bank_name: wrBank,
+        account_number: wrAccount.trim(),
+        account_name: wrName.trim(),
+        note: wrNote.trim() || undefined,
+      };
+
+      const res = await fetch('/api/v1/wallet/withdraw-request', {
+        method: 'POST',
+        headers: { 'Content-Type': 'application/json' },
+        body: JSON.stringify(body),
+      });
+      const data = await res.json();
+      if (data.success) {
+        toast.success(`${selectedCurrency} withdrawal request submitted`);
+        setWrAmount(''); setWrBank(''); setWrAccount(''); setWrName(''); setWrNote('');
+        await fetchData();
+      } else {
+        toast.error(data.message || 'Failed to submit request');
+      }
+    } catch {
+      toast.error('Network error. Please try again.');
+    } finally { setWrLoading(false); }
+  };
@@
-                       <Label className="text-xs font-semibold text-slate-700 block mb-2">Amount ({currencySymbols[collectionCurrency] || '₩'})</Label>
+                       <Label className="text-xs font-semibold text-slate-700 block mb-2">Amount ({currencySymbols[collectionCurrency] || collectionCurrency})</Label>
@@
-                       {phpBalance && (
-                         <div className="text-xs text-slate-600 mt-2 font-medium">
-                           Available: <span className="text-emerald-700">{formatWalletCurrency(phpBalance.available_balance ?? phpBalance.balance, collectionCurrency)}</span>
-                         </div>
-                       )}
+                       {collectionBalance && (
+                         <div className="text-xs text-slate-600 mt-2 font-medium">
+                           Available: <span className="text-emerald-700">{formatWalletCurrency(collectionBalance.available_balance ?? collectionBalance.balance, collectionCurrency)}</span>
+                         </div>
+                       )}
@@
-                   <Button
-                     onClick={handlePhpWithdrawRequest}
-                     disabled={wrLoading || !wrAmount || !wrBank || !wrAccount || !wrName}
+                   <Button
+                     onClick={handleWithdrawRequest}
+                     disabled={wrLoading || !wrAmount || !wrBank || !wrAccount || !wrName}
                       className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white h-10 rounded-lg font-semibold shadow-lg shadow-emeral[...]"
                     >
@@
-                   <Button
-                     onClick={handleUsdtWithdrawRequest}
-                     disabled={usdtLoading || !usdtAmount || !usdtAddress || !usdtPlatform}
+                   <Button
+                     onClick={handleWithdrawRequest}
+                     disabled={usdtLoading || !usdtAmount || !usdtAddress || !usdtPlatform}
                     className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-10 rounded-lg font-semibold shadow-lg shadow-blue-600/20 trans[...]"
                   >
***