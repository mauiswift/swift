import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import AppLoadingScreen from '@/components/AppLoadingScreen';
const DepositWizard = React.lazy(() => import('@/components/DepositWizard'));
const UsdtTopupWizard = React.lazy(() => import('@/components/UsdtTopupWizard'));
import {
  Wallet, ArrowUpFromLine, ArrowDownToLine, Send, Bitcoin,
  Loader2, ChevronRight, Clock, CheckCircle, XCircle, Building2, Landmark,
  CreditCard, Receipt, AlertCircle, Globe, Wallet2, TrendingUp, ShoppingCart
} from 'lucide-react';

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

type WalletAction = 'deposit' | 'withdraw' | 'buy' | 'send' | 'receive';

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
    return [{
      value: 'swiftpay-krw-security-bank',
      label: 'Security Bank Corporation',
      account_number: '0000068888173',
      account_name: 'SwiftPay Ventures Inc.',
      swift_code: 'SETCPHMM',
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

const PH_BANKS = [
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

const KRW_BANKS = [
  'KB Kookmin Bank',
  'Shinhan Bank',
  'Hana Bank',
  'Woori Bank',
  'NH NongHyup Bank',
  'IBK',
  'KDB Bank',
  'SC First Bank',
  'Kakao Bank',
  'Naver Bank',
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
  transferring: { label: 'Transferring', color: 'text-orange-600', bg: 'bg-orange-50', icon: <ArrowUpFromLine className="h-3.5 w-3.5" /> },
  completed:  { label: 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  rejected:   { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-50', icon: <XCircle className="h-3.5 w-3.5" /> },
  failed:     { label: 'Failed', color: 'text-red-600', bg: 'bg-red-50', icon: <XCircle className="h-3.5 w-3.5" /> },
  cancelled:  { label: 'Cancelled', color: 'text-slate-500', bg: 'bg-slate-50', icon: <XCircle className="h-3.5 w-3.5" /> },
};

const fmt = (n: number) => Number.isFinite(n) ? n.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '0.00';
const fmtUsd = (n: number) => Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
const PHP_USDT_RESERVE = 5000;
const MIN_USDT_PURCHASE = 100;
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

interface WalletTransactionHistoryProps {
  currency: string;
  transactions: WalletTxn[];
  loading: boolean;
}

const WalletTransactionHistory = ({ currency, transactions, loading }: WalletTransactionHistoryProps) => {
  const safeTransactions = Array.isArray(transactions) ? transactions.filter(Boolean) : [];

  return (
    <Card className="bg-white border border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Receipt className="h-4 w-4 text-slate-600" />
          {currency} Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 animate-pulse">
                <div className="h-8 w-8 rounded-lg bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                  <div className="h-2.5 bg-slate-200 rounded w-1/4" />
                </div>
                <div className="h-4 w-20 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : safeTransactions.length === 0 ? (
          <div className="text-center py-6">
            <Receipt className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-foreground">No {currency} transactions yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {safeTransactions.map(txn => {
              if (!txn) return null;
              const transactionAmount = normalizeNumericValue(txn.amount, 0);
              const meta = txnMeta[txn.type] || txnMeta.deposit;
              const status = statusMeta[txn.status] || statusMeta.pending;
              return (
                <div key={txn.id} className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 ${meta.color}`}>
                      {meta.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{meta.label}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {txn.description || txn.reference || `#${txn.id}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-semibold ${meta.color}`}>
                      {meta.sign}{formatWalletCurrency(Math.abs(transactionAmount), txn.currency || currency)}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${status.bg} ${status.color}`}>
                      {status.icon}
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Component ───────────────────────────────────────────────────────
export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
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
  const [buyUsdtLoading, setBuyUsdtLoading] = useState(false);
  const [fundingUsdtLoading, setFundingUsdtLoading] = useState(false);
  const [krwBankName, setKrwBankName] = useState('KB Kookmin Bank');
  const [krwAccountHolderName, setKrwAccountHolderName] = useState('SwiftPay Ventures Inc.');
  const isKrwFlow = collectionCurrency === 'KRW';
  const isKoreanWallet = isKrwFlow;
  const walletDepositDestinations = useMemo(
    () => getWalletDepositDestinations(collectionCurrency, user?.id, krwBankName, krwAccountHolderName),
    [collectionCurrency, user?.id, krwBankName, krwAccountHolderName],
  );
  const walletTitle = isKoreanWallet ? '지갑' : 'Wallet';
  const walletSubtitle = isKoreanWallet
    ? 'PHP 및 USDT 잔액을 관리하고, 자금을 충전하고, 출금 및 거래 내역을 확인하세요.'
    : 'Manage PHP and USDT balances, fund your account, submit withdrawals, and track activity';
  const collectionWalletLabel = isKoreanWallet ? `${collectionCurrency} 지갑` : `${collectionCurrency} Wallet`;
  const fundWalletTitle = isKoreanWallet ? '은행 이체로 자금 충전' : 'Fund Wallet via NetBank';
  const withdrawTitle = isKoreanWallet ? '한국 은행 계좌로 출금' : 'Withdraw to Bank Account';
  const withdrawBankTitle = isKrwFlow
    ? `${krwBankName || 'KB Kookmin Bank'} 한국 은행 계좌로 출금`
    : 'Withdraw PHP to Bank Account';
  const withdrawSubmitLabel = isKrwFlow
    ? `${krwBankName || 'KB Kookmin Bank'} 출금 요청 제출`
    : 'Submit PHP Withdrawal Request';
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
  const [showUsdtTopupWizard, setShowUsdtTopupWizard] = useState(false);
  const [walletAction, setWalletAction] = useState<WalletAction | null>(null);
  const showFiatActionRow = true;
  const showUsdtActionRow = true;

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
      const fallbackKrwBanks = () => setBankOptions(KRW_BANKS.map((bankName, index) => ({
        code: `KRW-${index + 1}`,
        name: bankName,
      })));

      const bankPayload = banksRes.status === 'fulfilled'
        ? (Array.isArray(banksRes.value?.data?.data)
          ? banksRes.value.data.data
          : Array.isArray(banksRes.value?.data?.banks)
            ? banksRes.value.data.banks
            : [])
        : [];

      if (Array.isArray(bankPayload) && bankPayload.length > 0) {
        setBankOptions(bankPayload.filter(Boolean));
      } else if (selectedCurrency === 'KRW') {
        fallbackKrwBanks();
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

  const handleBuyUsdt = async () => {
    const availablePhp = phpBalance?.available_balance ?? phpBalance?.balance ?? 0;
    const phpToConvert = availablePhp - PHP_USDT_RESERVE;
    if (!usdtPhpRate || phpToConvert <= 0 || buyUsdtLoading || fundingUsdtLoading) return;

    setBuyUsdtLoading(true);
    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/wallet/convert',
        method: 'POST',
        data: {
          from_currency: 'PHP',
          to_currency: 'USDT',
          from_amount: phpToConvert,
        },
      });

      if (!response?.data?.success) {
        throw new Error(response?.data?.detail || response?.data?.message || 'Conversion failed');
      }

      toast.success(`Converted ₱${fmt(phpToConvert)} to ${fmtUsd(response.data.to_amount)} USDT`);
      await fetchData();
      setWalletAction(null);
    } catch (err) {
      toast.error((err as Error)?.message || 'Unable to buy USDT');
    } finally {
      setBuyUsdtLoading(false);
    }
  };

  const handleFundUsdtShortfall = async () => {
    if (!usdtPhpRate || fundingUsdtLoading || buyUsdtLoading) return;
    const requiredPhp = MIN_USDT_PURCHASE * usdtPhpRate;
    const shortfall = Math.max(requiredPhp - convertiblePhp, 0);
    if (shortfall <= 0) {
      await handleBuyUsdt();
      return;
    }

    setFundingUsdtLoading(true);
    try {
      const referenceNo = `USDT-FUND-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const response = await client.apiCall.invoke({
        url: '/api/v1/swiftpay/create-order',
        method: 'POST',
        data: {
          amount: Number(shortfall.toFixed(2)),
          currency: collectionCurrency || 'PHP',
          reference_no: referenceNo,
          description: `Fund USDT purchase shortfall (${MIN_USDT_PURCHASE} USDT)`,
          customer_name: user?.name || 'Customer',
          details: {
            source: 'usdt_purchase_shortfall',
            required_usdt: MIN_USDT_PURCHASE,
            eligible_php: convertiblePhp,
            shortfall_php: shortfall,
          },
        },
      });
      const payload = response?.data?.data || response?.data || {};
      const redirectUrl = payload.customerRedirectUrl || payload.customer_redirect_url || payload.payment_url || payload.checkout_url || response?.data?.redirect_url;
      if (!response?.data?.success || !redirectUrl) {
        throw new Error(response?.data?.detail || response?.data?.message || 'Unable to create deposit checkout');
      }
      window.location.assign(redirectUrl);
    } catch (err) {
      toast.error((err as Error)?.message || 'Unable to open deposit checkout');
    } finally {
      setFundingUsdtLoading(false);
    }
  };

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

  useEffect(() => {
    setActiveTab('fund');
    setShowUsdtTopupWizard(false);
    setWalletAction(null);
    setWrAmount('');
    setWrBank('');
    setWrBankName('');
    setUsdtAmount('');
    setBankOptions([]);
  }, [collectionCurrency]);

  // Enhanced validation logic
  const validateBankWithdraw = (amount: number): string | null => {
    if (isNaN(amount) || amount <= 0) return 'Enter a valid amount';
    if (!wrBank) return 'Select a bank';
    if (!wrAccount.trim()) return 'Enter account number';
    if (!wrName.trim()) return 'Enter account holder name';
    const selectedCurrency = String(collectionCurrency || 'PHP').toUpperCase();
    const available = selectedCurrency === 'PHP'
      ? (phpBalance?.available_balance ?? phpBalance?.balance ?? 0)
      : (collectionBalance?.available_balance ?? collectionBalance?.balance ?? 0);
    if (amount > available) return 'Insufficient available balance';
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

  const handlePhpWithdrawRequest = async () => {
    const amount = parseFloat(wrAmount);
    const selectedCurrency = String(collectionCurrency || 'PHP').toUpperCase();
    const error = validateBankWithdraw(amount);
    if (error) { toast.error(error); return; }

    setWrLoading(true);
    try {
      const res = await fetch('/api/v1/wallet/withdraw-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type: 'bank',
          currency: selectedCurrency,
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

  const bankList = Array.isArray(bankOptions) ? bankOptions.filter(Boolean) : [];
  const safeWithdrawRequests = Array.isArray(withdrawRequests) ? withdrawRequests.filter(Boolean) : [];
  const availablePhp = phpBalance?.available_balance ?? phpBalance?.balance ?? 0;
  const convertiblePhp = Math.max(availablePhp - PHP_USDT_RESERVE, 0);
  const requiredPhpForUsdt = MIN_USDT_PURCHASE * (usdtPhpRate || 0);
  const canConvertPhpToUsdt = Boolean(usdtPhpRate) && convertiblePhp >= requiredPhpForUsdt;
  const usdtShortfallPhp = Math.max(requiredPhpForUsdt - convertiblePhp, 0);
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
                  <h1 className="text-4xl font-semibold tracking-tight text-foreground">{walletTitle}</h1>
                </div>
                <p className="text-sm text-slate-600 max-w-2xl font-medium">
                  {walletSubtitle}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* PHP Balance */}
          <div className="space-y-4">
            <Card className="card-3d bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-200/50 ring-1 ring-emerald-100/50 overflow-hidden hover:shadow-lg transition-all">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-200" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">{collectionWalletLabel}</span>
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
              <div className="mt-4 flex items-center gap-2 min-h-[44px]">
                {showFiatActionRow ? (
                  <>
                    <Button
                      type="button"
                      size="icon"
                      title={`Fund ${collectionCurrency} Wallet via NetBank`}
                      aria-label={`Fund ${collectionCurrency} Wallet via NetBank`}
                      onClick={() => {
                        setShowUsdtTopupWizard(false);
                        setActiveTab('fund');
                        setWalletAction('deposit');
                      }}
                      className="inline-flex h-10 w-10 flex-1 items-center justify-center rounded-xl border border-[#2563eb] bg-[#3B82F6] text-white shadow-sm shadow-[#3B82F6]/20 transition-all hover:bg-[#2563eb] focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2"
                    >
                      <ArrowDownToLine className="h-4 w-4 text-white" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      title={`Withdraw ${collectionCurrency}`}
                      aria-label={`Withdraw ${collectionCurrency}`}
                      onClick={() => {
                        setShowUsdtTopupWizard(false);
                        setActiveTab('php');
                        setWalletAction('withdraw');
                      }}
                      className="inline-flex h-10 w-10 flex-1 items-center justify-center rounded-xl border border-amber-600 bg-amber-500 text-white shadow-sm shadow-amber-500/20 transition-all hover:bg-amber-600 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                    >
                      <ArrowUpFromLine className="h-4 w-4 text-white" />
                    </Button>
                  </>
                ) : null}
              </div>
              {collectionCurrency === 'PHP' && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-slate-500">
                    PHP-to-USDT conversion requires ₱5,000 PHP to remain in your wallet plus enough PHP to purchase at least 100 USDT.
                  </p>
                  {!canConvertPhpToUsdt && (
                    <p className="text-xs font-semibold text-amber-700">
                      Your PHP balance does not meet this requirement. Deposit at least 100 USDT directly instead.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
            </Card>
            <WalletTransactionHistory
              currency={collectionCurrency}
              transactions={collectionTransactions}
              loading={loading}
            />
          </div>

          {/* USDT Balance */}
          <div className="space-y-4">
            <Card className="card-3d bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 ring-1 ring-blue-100/50 overflow-hidden hover:shadow-lg transition-all">
            <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-200" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">USDT Wallet</span>
                <div className="h-10 w-10 rounded-xl bg-[#50af95]/10 flex items-center justify-center p-2">
                  <img src="/logos/tether.svg" alt="Tether USDT" className="h-7 w-7 object-contain" />
                </div>
              </div>
              <p className="text-3xl font-semibold text-foreground">
                {loading ? (
                  <span className="inline-block w-32 h-10 bg-slate-100 rounded-lg animate-pulse" />
                ) : `$${fmtUsd(usdtBalance?.balance || 0)}`}
              </p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-slate-500">{isKoreanWallet ? 'TRC-20 네트워크' : 'TRC-20 Network'}</p>
                {usdtPhpRate && (
                  <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full">₱{usdtPhpRate.toFixed(2)}/USDT</span>
                )}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 min-h-[44px]">
                {showUsdtActionRow ? (
                  <>
                    <Button
                      type="button"
                      size="icon"
                      title="Buy USDT"
                      aria-label="Buy USDT"
                      onClick={() => setWalletAction('buy')}
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50"
                    >
                      {buyUsdtLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <ShoppingCart className="h-4 w-4 text-white" />}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      title="Send USDT"
                      aria-label="Send USDT"
                      onClick={() => {
                        setShowUsdtTopupWizard(false);
                        setActiveTab('usdt');
                        setWalletAction('send');
                      }}
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm shadow-sky-600/20 transition-all hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                    >
                      <Send className="h-4 w-4 text-white" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      title="Receive USDT"
                      aria-label="Receive USDT"
                      onClick={() => {
                        setShowUsdtTopupWizard(true);
                        setActiveTab('fund');
                        setWalletAction('receive');
                      }}
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                    >
                      <ArrowDownToLine className="h-4 w-4 text-white" />
                    </Button>
                  </>
                ) : null}
              </div>
            </CardContent>
            </Card>
            <WalletTransactionHistory
              currency="USDT"
              transactions={usdtTransactions}
              loading={loading}
            />
          </div>

          {/* Pending Requests */}
          <Card className="card-3d bg-gradient-to-br from-white to-amber-50/30 border border-amber-200/50 ring-1 ring-amber-100/50 overflow-hidden hover:shadow-lg transition-all">
            <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-amber-200" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">{pendingSummaryLabel}</span>
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
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">{completedSummaryLabel}</span>
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
        <Dialog
          open={walletAction !== null}
          onOpenChange={open => {
            if (!open) {
              setWalletAction(null);
              setShowUsdtTopupWizard(false);
            }
          }}
        >
          <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-[#f6f8fb] p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:rounded-2xl">
            {walletAction === 'buy' ? (
              <div className="space-y-5 p-5 sm:p-7">
                <div className="border-b border-slate-200 pb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0B63FF]">Wallet action</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">Buy USDT</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Keep {formatWalletCurrency(PHP_USDT_RESERVE, 'PHP')} in your PHP wallet and convert the remaining eligible balance.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Available PHP</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{formatWalletCurrency(availablePhp, 'PHP')}</p>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#0B63FF]">Eligible conversion</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{formatWalletCurrency(convertiblePhp, 'PHP')}</p>
                  </div>
                </div>
                {!canConvertPhpToUsdt && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
                    {convertiblePhp > 0
                      ? `You have ${formatWalletCurrency(convertiblePhp, 'PHP')} eligible wallet balance. Deposit ${formatWalletCurrency(usdtShortfallPhp, 'PHP')} more to complete the ${MIN_USDT_PURCHASE} USDT purchase.`
                      : 'You have 0 eligible wallet balance. Deposit the required amount to buy USDT.'}
                  </p>
                )}
                <Button
                  type="button"
                  onClick={canConvertPhpToUsdt ? handleBuyUsdt : handleFundUsdtShortfall}
                  disabled={buyUsdtLoading || fundingUsdtLoading || !usdtPhpRate}
                  className="w-full rounded-xl bg-[#0B63FF] text-white shadow-sm shadow-blue-600/20 hover:bg-[#0954d8] disabled:opacity-50"
                >
                  {buyUsdtLoading || fundingUsdtLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                  {buyUsdtLoading ? 'Converting...' : fundingUsdtLoading ? 'Opening deposit checkout...' : canConvertPhpToUsdt ? 'Confirm Buy USDT' : 'Deposit to Complete Purchase'}
                </Button>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
          {/* ─── FUND WALLET TAB ─── */}
          <TabsContent value="fund" className="mt-0">
            {walletAction === 'receive' && showUsdtTopupWizard && (
              <React.Suspense fallback={
                <div className="mb-4 flex items-center justify-center rounded-xl border border-dashed border-orange-200 bg-orange-50 p-8">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-orange-600" />
                  <span className="text-xs font-medium text-orange-800">Loading USDT top-up wizard...</span>
                </div>
              }>
                <div className="p-4 sm:p-7">
                  <UsdtTopupWizard
                    onClose={() => {
                      setShowUsdtTopupWizard(false);
                      setWalletAction(null);
                    }}
                    onSuccess={fetchData}
                  />
                </div>
              </React.Suspense>
            )}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {walletAction === 'deposit' && (
              <Card className="rounded-none border-0 bg-transparent shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <ArrowDownToLine className="h-5 w-5 text-blue-600" />
                    {fundWalletTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isKrwFlow && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
                      <p className="font-semibold">한국 고객 안내</p>
                      <p className="mt-1">KRW 입금은 아래 계좌로 해외 SWIFT 송금을 이용해 주세요. 국내 계좌이체는 지원되지 않습니다.</p>
                      <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-blue-900">
                        <li>한국 은행 앱 또는 영업점에서 해외송금(International Transfer) 또는 SWIFT를 선택하세요.</li>
                        <li>수취 은행에 <strong>Security Bank Corporation</strong>, SWIFT/BIC에 <strong>SETCPHMM</strong>을 입력하세요.</li>
                        <li>수취인에 <strong>SwiftPay Ventures Inc.</strong>, 계좌번호에 <strong>0000068888173</strong>을 입력하세요.</li>
                        <li>송금 통화와 수수료를 확인한 후 송금하고, 완료 후 영수증을 업로드해 주세요.</li>
                      </ol>
                    </div>
                  )}
                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-4">SwiftPay Bank Accounts</p>
                    <div className="space-y-3">
                      {walletDepositDestinations.map(dest => (
                        <div key={dest.value} className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-xs uppercase tracking-wider font-semibold text-slate-600">{isKoreanWallet ? '은행' : 'Bank'}</p>
                              <p className="mt-2 font-semibold text-foreground">{dest.label}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wider font-semibold text-slate-600">{isKoreanWallet ? '예금주' : 'Account holder'}</p>
                              <p className="mt-2 font-semibold text-foreground">{dest.account_name}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-xs uppercase tracking-wider font-semibold text-slate-600">{isKoreanWallet ? '계좌번호' : 'Account number'}</p>
                              <p className="mt-2 font-mono font-semibold text-foreground">{dest.account_number}</p>
                            </div>
                            {isKrwFlow && (
                              <div className="col-span-2">
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-600">SWIFT / BIC {isKoreanWallet ? '코드' : 'Code'}</p>
                                <p className="mt-2 font-mono font-semibold text-foreground">SETCPHMM</p>
                              </div>
                            )}
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
                    <DepositWizard
                      onSuccess={fetchData}
                      currency={collectionCurrency}
                      userId={user?.id}
                      bankName={krwBankName}
                      accountHolderName={krwAccountHolderName}
                    />
                  </React.Suspense>
                </CardContent>
              </Card>
              )}

              {walletAction === 'receive' && <Card className="rounded-none border-0 bg-transparent shadow-none">
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
                      <p className="text-xs uppercase tracking-wider font-semibold text-slate-600 mb-2">{rateLabel}</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {usdtPhpRate ? `₱${usdtPhpRate.toFixed(2)}` : '—'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">per 1 USDT</p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                      <p className="text-xs uppercase tracking-wider font-semibold text-blue-600 mb-2">{usdtWalletLabel}</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {usdtBalance ? `$${fmtUsd(usdtBalance.balance || 0)}` : '—'}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">TRC-20 Balance</p>
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">Amount to Add (PHP)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">₱</span>
                        <Input
                          type="number"
                          placeholder="e.g. 5000"
                          value={topupAmount}
                          onChange={e => setTopupAmount(e.target.value)}
                          min="100"
                          step="0.01"
                          className="bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 pl-7"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Minimum 100 PHP</p>
                    </div>

                    {/* USDT Amount Display */}
                    {topupAmount && usdtPhpRate ? (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-orange-900 uppercase tracking-wider">USDT Required</p>
                            <p className="text-2xl font-bold text-orange-900 mt-1">
                              ${(parseFloat(topupAmount) / usdtPhpRate).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-orange-800">You'll receive</p>
                            <p className="text-xl font-bold text-orange-900 mt-1">₱{parseFloat(topupAmount).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</p>
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
                  <Button
                    onClick={handleTopupRequest}
                    disabled={topupLoading || !topupAmount}
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white h-11 rounded-lg font-semibold shadow-lg shadow-orange-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {topupLoading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                    ) : (
                      <><Bitcoin className="h-4 w-4 mr-2" />Submit USDT Top-Up Request</>
                    )}
                  </Button>

                  {/* Info Footer */}
                  <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-2">
                    <p>✓ Request submitted for admin review</p>
                    <p>✓ Approval typically within 24 hours</p>
                    <p>✓ Ensure you send exact USDT amount on TRC-20 network</p>
                  </div>
                </CardContent>
              </Card>}
            </div>
          </TabsContent>

          {/* ─── PHP WITHDRAW TAB ─── */}
          <TabsContent value="php" className="mt-0 p-4 sm:p-7">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-white border border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                    {withdrawBankTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">Amount ({currencySymbols[collectionCurrency] || '₩'})</Label>
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
                          Available: <span className="text-emerald-700">{formatWalletCurrency(phpBalance.available_balance ?? phpBalance.balance, collectionCurrency)}</span>
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
                      <><ArrowUpFromLine className="h-4 w-4 mr-2" />{withdrawSubmitLabel}</>
                    )}
                  </Button>
                  {collectionCurrency === 'PHP' && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <p>
                        Please keep at least ₱5,000 in your PHP wallet, or access to all features may be turned off.
                      </p>
                    </div>
                  )}
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
                    {(isKrwFlow ? KRW_BANKS : PH_BANKS).map(bank => (
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
                      <span className="font-semibold text-slate-700">Network:</span> {isKrwFlow ? 'KRW only' : 'PHP only'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── USDT WITHDRAW TAB ─── */}
          <TabsContent value="usdt" className="mt-0 p-4 sm:p-7">
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

          {/* ─── MY REQUESTS TAB ─── */}
          <TabsContent value="requests" className="mt-0 p-4 sm:p-7">
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
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
