import { fetchPaymentChannels, isPaymentChannelEnabled, type PaymentChannels } from '@/lib/paymentChannels';
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { client } from '@/lib/api';
import { authApi } from '@/lib/auth';
import type { WalletBalance } from '@/api/wallet';
import { useAuth } from '@/contexts/AuthContext';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import './PaymentActivity.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import CollectionWalletOverview from '@/components/wallet/CollectionWalletOverview';
import KrwWithdrawalPanel from '@/components/wallet/KrwWithdrawalPanel';
import UsdtWalletOverview, { BuyUsdtButton } from '@/components/wallet/UsdtWalletOverview';
import BankLogo from '@/components/BankLogo';
import { StatusBadge, getStatusType } from '@/components/StatusBadge';
import { PH_BANKS as PH_BANK_CATALOG } from '@/config/ph-banks';
import { KRW_BANKS } from '@/config/krw-banks';
import { fmtCurrency, getCurrencyName, getCurrencySymbol } from '@/lib/format';
const DepositWizard = React.lazy(() => import('@/components/DepositWizard'));
const UsdtTopupWizard = React.lazy(() => import('@/components/UsdtTopupWizard'));
import {
  Wallet, ArrowUpFromLine, ArrowDownToLine, Send, Bitcoin,
  Loader2, ChevronRight, Clock, CheckCircle, XCircle, Building2, Landmark,
  CreditCard, Receipt, AlertCircle, Globe, Wallet2, Crown,
  RefreshCw,
} from 'lucide-react';
import { getBankDisplayName } from '@/lib/bankBranding';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePaymentEvents } from '@/hooks/usePaymentEvents';

interface WalletTxn {
  id: number;
  type: 'deposit' | 'withdraw' | 'receive' | 'sent' | 'crypto_topup' | 'usdt_send' | 'disbursement' | 'refund' | 'fee' | 'admin_adjustment';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'processing' | 'transferring' | 'failed' | 'cancelled';
  description?: string;
  created_at: string;
  reference?: string;
  transaction_type?: string;
  reference_id?: string;
  payment_transaction_id?: number | null;
  note?: string;
}

interface OrganizationWalletBalance extends WalletBalance {
  organization_id: string;
  organization_name?: string | null;
}

interface BankOption {
  code: string;
  name: string;
}

interface WithdrawRequest {
  id: number;
  amount: number;
  processing_fee?: number;
  total_debit?: number;
  bank_name?: string;
  bank_code?: string;
  account_number: string;
  account_name: string;
  currency?: string;
  external_id?: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'transferring' | 'completed' | 'failed' | 'cancelled';
  created_at: string | null;
  processed_at?: string;
  processed_by?: string;
  rejection_reason?: string;
  request_type?: 'php_bank' | 'usdt_trc20' | 'swiftpay_disbursement';
  usdt_address?: string;
  usdt_platform?: string;
}

type WalletAction = 'deposit' | 'withdraw' | 'buy' | 'sell' | 'send' | 'receive';

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
  configuredAccounts: Array<{
    value: string;
    label: string;
    account_number: string;
    account_name: string;
    currency: string;
    swift_code?: string;
    bank_code?: string;
  }>,
) => {
  if (currency === 'KRW') return configuredAccounts.filter(account => account.currency === 'KRW');
  return configuredAccounts.filter(account => account.currency === currency);
};

const DEPOSIT_CHANNELS = DEPOSIT_DESTINATIONS.map(dest => ({ value: dest.value, label: dest.label }));

const TOPUP_METHODS = [
  { value: 'same_bank', label: 'Same-bank transfer' },
  { value: 'interbank', label: 'Interbank transfer' },
  { value: 'cash_deposit', label: 'Cash deposit' },
  { value: 'check_deposit', label: 'Check deposit' },
  { value: 'international', label: 'International transfer' },
];

const DEPOSIT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer', description: 'Transfer funds directly from a Philippine bank into the SwiftPay account.' },
  { value: 'same_bank', label: 'Same-bank transfer', description: 'Send funds from the same bank account to your SwiftPay wallet.' },
  { value: 'interbank', label: 'Interbank transfer', description: 'Use a different bank account to fund your wallet.' },
];

const txnMeta: Record<string, { label: string; color: string; icon: React.ReactNode; sign: string }> = {
  deposit:       { label: 'Deposit', color: 'text-blue-600', icon: <ArrowDownToLine className="h-4 w-4" />, sign: '+' },
  withdraw:      { label: 'Withdrawal', color: 'text-amber-600', icon: <ArrowUpFromLine className="h-4 w-4" />, sign: '-' },
  receive:       { label: 'Received', color: 'text-blue-600', icon: <ArrowDownToLine className="h-4 w-4" />, sign: '+' },
  sent:          { label: 'Sent', color: 'text-red-600', icon: <Send className="h-4 w-4" />, sign: '-' },
  crypto_topup:  { label: 'Crypto Top Up', color: 'text-blue-600', icon: <Bitcoin className="h-4 w-4" />, sign: '+' },
  usdt_send:     { label: 'USDT Withdrawal', color: 'text-red-600', icon: <Send className="h-4 w-4" />, sign: '-' },
  disbursement:  { label: 'Disbursement', color: 'text-red-600', icon: <Send className="h-4 w-4" />, sign: '-' },
  refund:        { label: 'Refund', color: 'text-blue-600', icon: <Receipt className="h-4 w-4" />, sign: '+' },
  fee:           { label: 'Fee', color: 'text-red-600', icon: <Receipt className="h-4 w-4" />, sign: '-' },
  admin_adjustment: { label: 'Wallet Adjustment', color: 'text-slate-600', icon: <Wallet2 className="h-4 w-4" />, sign: '+' },
};

const getTransactionType = (txn: WalletTxn) => String(txn.transaction_type || txn.type || '').toLowerCase();

const getTransactionMeta = (txn: WalletTxn) => {
  const type = getTransactionType(txn);
  if (['admin_debit', 'conversion_out', 'fee', 'withdrawal_fee'].includes(type)) {
    return txnMeta[type === 'admin_debit' || type === 'conversion_out' ? 'withdraw' : 'fee'];
  }
  return txnMeta[txn.type] || txnMeta.deposit;
};

const fmt = (n: number) => Number.isFinite(n) ? n.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '0.00';
const fmtUsd = (n: number) => Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
const PHP_USDT_RESERVE = 0;
const normalizeNumericValue = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number.parseFloat(String(value ?? fallback));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const dedupeRecords = <T extends { id?: number | string; reference?: string; reference_id?: string }>(
  records: T[],
): T[] => {
  const seen = new Set<string>();
  return records.filter(record => {
    const key = record.id != null
      ? `id:${record.id}`
      : record.reference_id
        ? `reference_id:${record.reference_id}`
        : record.reference
          ? `reference:${record.reference}`
          : null;

    if (!key || seen.has(key)) return !key;
    seen.add(key);
    return true;
  });
};

const formatWalletCurrency = (amount: number, currency: string) => {
  return fmtCurrency(normalizeNumericValue(amount, 0), currency);
};

const getWalletBalanceValue = (
  wallet: WalletBalanceSnapshot | null,
  field: keyof WalletBalanceSnapshot,
) =>
  normalizeNumericValue(wallet?.[field] ?? wallet?.balance ?? 0);

const getAvailableBalance = (wallet: WalletBalanceSnapshot | null) => {
  const available = getWalletBalanceValue(wallet, 'available_balance');
  const balance = getWalletBalanceValue(wallet, 'balance');
  const pending = normalizeNumericValue(wallet?.pending_balance, 0);
  return available > 0 || balance <= 0
    ? available
    : Math.max(0, balance - pending);
};

type WalletBalanceSnapshot = Pick<WalletBalance, 'balance' | 'available_balance' | 'pending_balance'>;

const getUsdtConversionSummary = (
  _collectionCurrency: string,
  phpBalance: WalletBalanceSnapshot | null,
  collectionBalance: WalletBalanceSnapshot | null,
  usdtPhpRate: number | null,
  requestedUsdtAmount: number,
  conversionFeeRate = 0.01,
  minimumPurchase = 0,
) => {
  const sourceCurrency = 'PHP';
  const sourceWallet = phpBalance;
  const availableSource = getAvailableBalance(sourceWallet);
  const retainedBalance = 0;
  const conversionRate = usdtPhpRate;
  const convertibleSource = Math.max(availableSource - retainedBalance, 0);
  const safeRequestedAmount = Number.isFinite(requestedUsdtAmount) ? requestedUsdtAmount : 0;
  const requiredSource = conversionRate && safeRequestedAmount > 0
    ? safeRequestedAmount / (conversionRate * (1 - conversionFeeRate))
    : 0;
  const convertibleUsdt = convertibleSource * (conversionRate || 0) * (1 - conversionFeeRate);

  return {
    sourceCurrency,
    availableSource,
    retainedBalance,
    conversionRate,
    convertibleSource,
    convertibleUsdt,
    requestedUsdtAmount: safeRequestedAmount,
    estimatedUsdtAmount: safeRequestedAmount,
    requiredSource,
    canConvert: safeRequestedAmount >= minimumPurchase
      && Boolean(conversionRate)
      && convertibleSource >= requiredSource,
    shortfallSource: Math.max(requiredSource - convertibleSource, 0),
  };
};

function ExchangeRulesTable({ sourceCurrency, rate, showReserve, mode, feeRate = 0.01, isKorean }: { sourceCurrency: string; rate: number | null; showReserve: boolean; mode: 'buy' | 'sell'; feeRate?: number; isKorean: boolean }) {
  const displayRate = rate && mode === 'buy' ? 1 / rate : rate;
  const rateLabel = displayRate
    ? `1 USDT = ${formatWalletCurrency(displayRate, sourceCurrency)}`
    : isKorean ? '사용할 수 없음' : 'Unavailable';
  const feeAmountLabel = isKorean ? `환전 금액의 ${(feeRate * 100).toFixed(2)}%` : `${(feeRate * 100).toFixed(2)}% of converted value`;
  const minimumLabel = mode === 'buy' ? '100 USDT' : isKorean ? '최소 금액 없음' : 'No minimum';
  const reserveLabel = showReserve && PHP_USDT_RESERVE > 0
    ? isKorean ? `지갑에 ${formatWalletCurrency(PHP_USDT_RESERVE, sourceCurrency)}을(를) 유지하세요` : `Keep ${formatWalletCurrency(PHP_USDT_RESERVE, sourceCurrency)} in your wallet`
    : isKorean ? '추가 보유금 없음' : 'No additional reserve';

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{isKorean ? '환전 안내' : 'Exchange details'}</h3>
      </div>
      <table className="w-full text-left text-xs">
        <tbody className="divide-y divide-slate-100">
          <tr>
            <th scope="row" className="w-1/2 px-4 py-3 font-medium text-slate-500">{isKorean ? '환율' : 'Rate'}</th>
            <td className="px-4 py-3 font-semibold text-slate-900">{rateLabel}</td>
          </tr>
          <tr>
            <th scope="row" className="px-4 py-3 font-medium text-slate-500">{isKorean ? '환전 수수료' : 'Exchange fee'}</th>
            <td className="px-4 py-3 font-semibold text-slate-900">{feeAmountLabel}</td>
          </tr>
          <tr>
            <th scope="row" className="px-4 py-3 font-medium text-slate-500">{isKorean ? '최소 금액' : 'Minimum'}</th>
            <td className="px-4 py-3 font-semibold text-slate-900">{minimumLabel}</td>
          </tr>
          <tr>
            <th scope="row" className="px-4 py-3 font-medium text-slate-500">{isKorean ? '지갑 규칙' : 'Wallet rule'}</th>
            <td className="px-4 py-3 font-semibold text-slate-900">{reserveLabel}</td>
          </tr>
          <tr>
            <th scope="row" className="px-4 py-3 font-medium text-slate-500">{isKorean ? '받는 금액' : 'You receive'}</th>
            <td className="px-4 py-3 font-semibold text-slate-900">{isKorean ? '수수료 차감 후 금액' : 'Amount after fee'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const getTransactionLabel = (txn: WalletTxn, isKorean = false) => {
  const type = getTransactionType(txn);
  if (type === 'wallet_migration') return isKorean ? '조직 지갑 잔액 통합' : 'Organization wallet consolidation';
  if (type === 'admin_credit') return isKorean ? 'USDT 충전' : 'Automated wallet funding';
  if (type === 'admin_debit') return isKorean ? '보안 지갑 조정' : 'Secure wallet adjustment';
  if (type === 'admin_adjustment') return isKorean ? '시스템 지갑 조정' : 'System balance adjustment';
  if (type === 'conversion_in') return isKorean ? '환전 입금' : 'Currency purchase';
  if (type === 'conversion_out') return isKorean ? '환전 출금' : 'Currency sale';
  if (['fee', 'withdrawal_fee'].includes(type)) return isKorean ? '수수료' : 'Fee';
  if (['payment_link', 'invoice', 'checkout', 'magpie_checkout', 'zip_checkout'].includes(type)) {
    const isKrwTransaction = String(txn.currency || '').toUpperCase() === 'KRW' || (!txn.currency && isKorean);
    return isKrwTransaction ? '지불' : 'Payment';
  }
  if (['payment', 'qrph_payment'].includes(type)) {
    return isKorean ? '결제' : 'Payment';
  }
  if (['top_up', 'topup', 'deposit', 'crypto_topup'].includes(type)) {
    return isKorean ? '입금' : 'Deposit';
  }
  return isKorean ? '거래' : 'Transaction';
};

const getTransactionStatusLabel = (status: string | null | undefined, isKorean = false) => {
  const normalized = String(status || '').toLowerCase();
  if (['failed', 'rejected', 'expired', 'cancelled'].includes(normalized)) {
    return isKorean ? '실패' : 'Failed';
  }
  if (['completed', 'paid', 'executed'].includes(normalized)) {
    return isKorean ? '성공' : 'Successful';
  }
  return isKorean ? '처리 중' : 'Processing';
};

const normalizeWalletTransaction = (item: WalletTxn): WalletTxn => {
  const backendType = getTransactionType(item);
  const type: WalletTxn['type'] =
    ['top_up', 'topup', 'deposit'].includes(backendType) ? 'deposit' :
    ['withdrawal', 'withdraw'].includes(backendType) ? 'withdraw' :
    backendType === 'send' ? 'sent' :
    ['fee', 'withdrawal_fee'].includes(backendType) ? 'fee' :
    backendType === 'conversion_in' ? 'receive' :
    backendType === 'conversion_out' ? 'withdraw' :
    ['admin_credit', 'admin_debit', 'admin_adjustment'].includes(backendType) ? 'admin_adjustment' :
    (item.type || backendType as WalletTxn['type']);
  return { ...item, type };
};

interface WalletTransactionHistoryProps {
  currency: string;
  transactions: WalletTxn[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

const WalletTransactionHistory = ({ currency, transactions, loading, error, onRetry, isKorean }: WalletTransactionHistoryProps & { isKorean: boolean }) => {
  const safeTransactions = useMemo(
    () => dedupeRecords(Array.isArray(transactions) ? transactions.filter(Boolean) : []),
    [transactions],
  );
  const recentTransactions = safeTransactions.slice(0, 5);

  return (
    <Card className="payment-workspace payment-workspace__history bg-white border border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Receipt className="h-4 w-4 text-slate-600" />
          {isKorean ? `${currency} 최근 거래 내역` : `Recent ${currency} transactions`}
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
        ) : error ? (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            <span>Unable to load {currency} transaction history.</span>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </div>
        ) : safeTransactions.length === 0 ? (
          <div className="text-center py-6">
            <Receipt className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-foreground">{isKorean ? `${currency} 거래 내역이 없습니다` : `No ${currency} transactions yet`}</p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="wallet-transaction-header grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-3 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <span>{isKorean ? '거래 종류' : 'Transaction'}</span>
              <span>{isKorean ? '날짜 및 시간' : 'Date and time'}</span>
              <span>{isKorean ? '금액' : 'Amount'}</span>
              <span>{isKorean ? '상태' : 'Status'}</span>
            </div>
            {recentTransactions.map(txn => {
              if (!txn) return null;
              const transactionAmount = normalizeNumericValue(txn.amount, 0);
              const meta = getTransactionMeta(txn);
              const paymentDetailsUrl = txn.payment_transaction_id
                ? `/payments/${encodeURIComponent(String(txn.payment_transaction_id))}`
                : null;
              const rowContent = (
                <div className="wallet-transaction-row grid w-full items-center gap-3">
                  <p className="truncate text-xs font-semibold text-foreground">{getTransactionLabel(txn, isKorean)}</p>
                  <p className="whitespace-nowrap text-[11px] text-slate-500">
                    {txn.created_at ? new Date(txn.created_at).toLocaleString(isKorean ? 'ko-KR' : 'en-PH') : '—'}
                  </p>
                  <p className={`whitespace-nowrap text-xs font-semibold ${meta.color}`}>
                    {meta.sign}{formatWalletCurrency(Math.abs(transactionAmount), txn.currency || currency)}
                  </p>
                  <p className={`whitespace-nowrap text-xs font-semibold ${
                    ['failed', 'rejected', 'expired', 'cancelled'].includes(String(txn.status || '').toLowerCase())
                      ? 'text-red-600'
                      : ['completed', 'paid', 'executed'].includes(String(txn.status || '').toLowerCase())
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                  }`}>
                    {getTransactionStatusLabel(txn.status, isKorean)}
                  </p>
                </div>
              );
              return paymentDetailsUrl ? (
                <Link
                  key={txn.id}
                  to={paymentDetailsUrl}
                  title={isKorean ? '결제 상태 및 상세 정보 보기' : 'View payment status and details'}
                  className="block rounded-lg border border-transparent p-3 transition-colors hover:border-slate-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {rowContent}
                </Link>
              ) : (
                <div key={txn.id} className="rounded-lg border border-transparent p-3">
                  {rowContent}
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
export default function WalletPage({
  cryptoOnly = false,
  layout = 'desktop',
}: {
  cryptoOnly?: boolean;
  layout?: 'desktop' | 'mobile';
}) {
  const [vipGold, setVipGold] = useState(false);
  const { user, platformBranding, loading: authLoading, isSuperAdmin } = useAuth();
  const { language } = useLanguage();
  const isKoreanWallet = language === 'ko';
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [phpBalance, setPhpBalance] = useState<WalletBalance | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<WalletBalance | null>(null);
  const [organizationWalletBalance, setOrganizationWalletBalance] = useState<OrganizationWalletBalance | null>(null);
  const [organizationWalletLoadError, setOrganizationWalletLoadError] = useState(false);
  const { collectionCurrency } = useCollectionCurrency();
  const selectedCollectionCurrency = String(collectionCurrency || 'PHP').toUpperCase();
  const [collectionBalance, setCollectionBalance] = useState<WalletBalance | null>(null);
  const [phpTransactions, setPhpTransactions] = useState<WalletTxn[]>([]);
  const [usdtTransactions, setUsdtTransactions] = useState<WalletTxn[]>([]);
  const [collectionTransactions, setCollectionTransactions] = useState<WalletTxn[]>([]);
  const [transactions, setTransactions] = useState<WalletTxn[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [balanceLoadErrors, setBalanceLoadErrors] = useState<string[]>([]);
  const [transactionLoadErrors, setTransactionLoadErrors] = useState<string[]>([]);
  const [withdrawRequestsLoadError, setWithdrawRequestsLoadError] = useState(false);
  const [bankOptions, setBankOptions] = useState<BankOption[]>([]);
  const [usdtPhpRate, setUsdtPhpRate] = useState<number | null>(null);
  const [usdtRateSource, setUsdtRateSource] = useState('');
  const [buyUsdtRate, setBuyUsdtRate] = useState<number | null>(null);
  const [conversionFeeRate, setConversionFeeRate] = useState(0.01);
  const [sellUsdtRate, setSellUsdtRate] = useState<number | null>(null);
  const [buyUsdtLoading, setBuyUsdtLoading] = useState(false);
  const buyTradeKeyRef = useRef<string | null>(null);
  const sellTradeKeyRef = useRef<string | null>(null);
  const [fundingUsdtLoading, setFundingUsdtLoading] = useState(false);
  const [depositAccounts, setDepositAccounts] = useState<Array<{ value: string; label: string; account_number: string; account_name: string; currency: string; swift_code?: string; receiving_currency?: string; bank_code?: string; branch_code?: string; bank_address?: string; bank_name?: string }>>(DEPOSIT_DESTINATIONS.map(account => ({ ...account, currency: 'PHP' })));
  const [assignedKrwAccount, setAssignedKrwAccount] = useState<typeof depositAccounts[number] | null>(null);
  const [krwBankName, setKrwBankName] = useState('');
  const [krwAccountHolderName, setKrwAccountHolderName] = useState('');
  const isKrwFlow = selectedCollectionCurrency === 'KRW';
  const canTradeUsdtForPhp = selectedCollectionCurrency === 'PHP';
  const tx = (en: string, ko: string, zh?: string) => (language === 'zh' ? (zh ?? en) : language === 'en' ? en : ko);
  const sharedWalletIsPrimary = Boolean(
    !cryptoOnly
    && user?.organization_id
  );
  const hasOrganizationWallet = Boolean(user?.organization_id);
  const isMobileLayout = layout === 'mobile';
  const primaryWalletBalance = sharedWalletIsPrimary ? organizationWalletBalance : collectionBalance;
  const primaryWalletUnavailable = sharedWalletIsPrimary
    ? organizationWalletLoadError || !organizationWalletBalance
    : balanceLoadErrors.includes('collection') || !collectionBalance;
  useEffect(() => {
    if (!user?.id) return;
    client.get('/api/v1/team/vip-status')
      .then(response => {
        setVipGold(Boolean(response.data?.vip_gold));
      })
      .catch(() => {
        setVipGold(false);
      });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    client.get(`/api/v1/users/${user.id}/toss-virtual-account`)
      .then(response => {
        setKrwBenefitsUnlocked(Boolean(response.ok && response.data?.benefits?.unlocked));
      })
      .catch(() => setKrwBenefitsUnlocked(false));
  }, [user?.id]);
  const walletDepositDestinations = useMemo(
    () => isKrwFlow && assignedKrwAccount
      ? [assignedKrwAccount]
      : getWalletDepositDestinations(selectedCollectionCurrency, depositAccounts),
    [selectedCollectionCurrency, depositAccounts, isKrwFlow, assignedKrwAccount],
  );
  const walletTitle = cryptoOnly ? tx('Cryptocurrency', '암호화폐') : tx('Wallet', '지갑');
  const walletSubtitle = cryptoOnly
    ? tx('Manage your USDT balance, buy and sell cryptocurrency, send funds, and review crypto activity.', 'USDT 잔액을 관리하고, 암호화폐를 사고 팔고, 자금을 보내고, 거래 활동을 확인하세요.')
    : sharedWalletIsPrimary
      ? tx(`Manage the merchant organization's shared ${selectedCollectionCurrency} and USDT wallet, funding, withdrawals, and payment activity.`, '조직 공동 지갑에서 KRW 및 USDT 잔액, 충전, 출금 및 결제 내역을 관리하세요.')
      : tx(`Manage ${selectedCollectionCurrency} and USDT balances, fund your account, submit withdrawals, and track activity`, 'KRW 및 USDT 잔액을 관리하고, 자금을 충전하고, 출금 및 거래 내역을 확인하세요.');
  const collectionWalletLabel = sharedWalletIsPrimary
    ? tx('Merchant organization wallet', '가맹점 조직 지갑')
    : tx(`${selectedCollectionCurrency} Wallet`, `${selectedCollectionCurrency} 지갑`);
  const fundWalletTitle = tx('Fund Wallet via bank transfer', '은행 계좌이체로 자금 충전');
  const withdrawTitle = tx('Withdraw to Bank Account', '한국 은행 계좌로 출금');
  const withdrawBankTitle = tx('Withdraw PHP by Bank Transfer', '출금');
  const withdrawSubmitLabel = isKrwFlow ? tx('Withdraw', '출금') : tx(`Withdraw ${selectedCollectionCurrency}`, `출금 ${selectedCollectionCurrency}`);
  const rateLabel = tx('Current Rate', '현재 환율');
  const usdtWalletLabel = tx('Your USDT Wallet', '내 USDT 지갑');

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
  const [wrAccount, setWrAccount] = useState('');
  const [wrName, setWrName] = useState('');
  const [wrPhone, setWrPhone] = useState('');
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
  const [walletFrozenDialogOpen, setWalletFrozenDialogOpen] = useState(false);
  const [accountActivationDialogOpen, setAccountActivationDialogOpen] = useState(false);
  const [krwBenefitsUnlocked, setKrwBenefitsUnlocked] = useState(false);
  const [buyUsdtAmount, setBuyUsdtAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [paymentChannels, setPaymentChannels] = useState<PaymentChannels | null>(null);
  const showFiatActionRow = isPaymentChannelEnabled(paymentChannels, selectedCollectionCurrency, 'withdrawal', 'bank_transfer');
  const frozenWallet = usdtBalance?.is_frozen
    ? usdtBalance
    : collectionBalance?.is_frozen
      ? collectionBalance
      : phpBalance?.is_frozen
        ? phpBalance
        : null;
  const walletFreezeCurrency = frozenWallet?.currency || selectedCollectionCurrency;
  const walletFreezeReason = frozenWallet?.freeze_reason;

  const ensureWalletIsOperational = useCallback((currency: string, actionLabel: string) => {
    const normalizedCurrency = String(currency || '').toUpperCase();
    const usesCollectionBalance = normalizedCurrency === selectedCollectionCurrency;
    const frozenBalance = usesCollectionBalance
      ? collectionBalance
      : normalizedCurrency === 'USDT'
        ? usdtBalance
        : phpBalance;

    if (!frozenBalance) {
      toast.error(tx(`Unable to verify your ${normalizedCurrency} wallet balance. Refresh the page before ${actionLabel.toLowerCase()}.`, `${normalizedCurrency} 지갑 잔액을 확인할 수 없습니다. 페이지를 새로고침한 뒤 ${actionLabel.toLowerCase()}를 다시 시도하세요.`));
      return false;
    }

    if (frozenBalance?.is_frozen) {
      setWalletFrozenDialogOpen(true);
      toast.error(tx(`Your ${normalizedCurrency} wallet is frozen. ${actionLabel} is unavailable until it is unfrozen.`, `${normalizedCurrency} 지갑이 정지 상태입니다. ${actionLabel}는 해제될 때까지 사용할 수 없습니다.`));
      return false;
    }

    return true;
  }, [collectionBalance, phpBalance, selectedCollectionCurrency, usdtBalance]);

  const openBuyUsdt = () => {
    if (!canTradeUsdtForPhp) {
      toast.error(isKoreanWallet ? 'USDT 거래는 PHP 지갑에서만 사용할 수 있습니다.' : 'USDT trading is available from the PHP wallet only.');
      return;
    }
    if (!ensureWalletIsOperational('USDT', 'Buying USDT')) return;
    setWalletAction('buy');
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const selectedCurrency = selectedCollectionCurrency;
      const institutionCurrency = selectedCurrency === 'KRW' ? 'KRW' : 'PHP';
      const [phpRes, usdtRes, collectionRes, phpTxnRes, usdtTxnRes, collectionTxnRes, banksRes, wrRes, rateRes, buyRateRes, sellRateRes, organizationWalletRes, organizationUsdtWalletRes] = await Promise.allSettled([
        client.apiCall.invoke({ url: '/api/v1/wallet/balance?currency=PHP', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/balance?currency=USDT', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: `/api/v1/wallet/balance?currency=${selectedCurrency}`, method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/transactions?currency=PHP&limit=20', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/transactions?currency=USDT&limit=20', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: `/api/v1/wallet/transactions?currency=${selectedCurrency}&limit=20`, method: 'GET', data: {} }),
        client.apiCall.invoke({ url: `/api/v1/swiftpay/institutions?currency=${institutionCurrency}`, method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/wallet/withdraw-requests', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/topup/rate', method: 'GET', data: {} }),
        client.apiCall.invoke({
          url: '/api/v1/wallet/quote',
          method: 'POST',
          data: { from_currency: 'PHP', to_currency: 'USDT', from_amount: 1 },
        }),
        client.apiCall.invoke({
          url: '/api/v1/wallet/quote',
          method: 'POST',
          data: { from_currency: 'USDT', to_currency: 'PHP', from_amount: 1 },
        }),
        user.organization_id && !cryptoOnly
          ? client.apiCall.invoke({
            url: `/api/v1/wallet/organization-balance?currency=${encodeURIComponent(selectedCurrency)}`,
            method: 'GET',
            data: {},
          })
          : Promise.resolve(null),
        user.organization_id
          ? client.apiCall.invoke({
            url: '/api/v1/wallet/organization-balance?currency=USDT',
            method: 'GET',
            data: {},
          })
          : Promise.resolve(null),
      ]);

      if (user.organization_id && !cryptoOnly) {
        const organizationData = organizationWalletRes.status === 'fulfilled'
          ? organizationWalletRes.value?.data
          : null;
        if (
          organizationData?.organization_id === user.organization_id
          && organizationData.balance != null
        ) {
          setOrganizationWalletBalance({
            organization_id: organizationData.organization_id,
            organization_name: organizationData.organization_name || user.organization_name,
            wallet_id: organizationData.wallet_id,
            balance: normalizeNumericValue(organizationData.balance),
            available_balance: normalizeNumericValue(organizationData.available_balance ?? organizationData.balance),
            pending_balance: normalizeNumericValue(organizationData.pending_balance ?? 0),
            currency: organizationData.currency || selectedCurrency,
          });
          setOrganizationWalletLoadError(false);
        } else {
          if (organizationWalletRes.status === 'rejected') {
            console.error('Organization wallet fetch error:', organizationWalletRes.reason);
          }
          setOrganizationWalletBalance(null);
          setOrganizationWalletLoadError(true);
        }
      } else {
        setOrganizationWalletBalance(null);
        setOrganizationWalletLoadError(false);
      }

      const failedBalances: string[] = [];
      const organizationUsdtData = organizationUsdtWalletRes.status === 'fulfilled'
        ? organizationUsdtWalletRes.value?.data
        : null;
      const usdtData = user.organization_id
        ? organizationUsdtData?.organization_id === user.organization_id
          ? organizationUsdtData
          : null
        : usdtRes.status === 'fulfilled'
          ? usdtRes.value?.data
          : null;
      if (phpRes.status === 'fulfilled' && phpRes.value?.data?.balance != null) {
        setPhpBalance({
          balance: normalizeNumericValue(phpRes.value.data.balance),
          available_balance: normalizeNumericValue(phpRes.value.data.available_balance ?? phpRes.value.data.balance),
          pending_balance: normalizeNumericValue(phpRes.value.data.pending_balance ?? 0),
          currency: 'PHP',
          is_frozen: Boolean(phpRes.value.data.is_frozen),
          freeze_reason: phpRes.value.data.freeze_reason ?? null,
        });
      } else {
        setPhpBalance(null);
        failedBalances.push('php');
      }
      if (usdtData?.balance != null) {
        setUsdtBalance({
          balance: normalizeNumericValue(usdtData.balance),
          available_balance: normalizeNumericValue(usdtData.available_balance ?? usdtData.balance),
          pending_balance: normalizeNumericValue(usdtData.pending_balance ?? 0),
          currency: 'USDT',
          is_frozen: Boolean(usdtData.is_frozen),
          freeze_reason: usdtData.freeze_reason ?? null,
        });
      } else {
        setUsdtBalance(null);
        failedBalances.push('usdt');
      }
      if (collectionRes.status === 'fulfilled' && collectionRes.value?.data?.balance != null) {
        setCollectionBalance({
          balance: normalizeNumericValue(collectionRes.value.data.balance),
          available_balance: normalizeNumericValue(collectionRes.value.data.available_balance ?? collectionRes.value.data.balance),
          pending_balance: normalizeNumericValue(collectionRes.value.data.pending_balance ?? 0),
          currency: selectedCurrency,
          is_frozen: Boolean(collectionRes.value.data.is_frozen),
          freeze_reason: collectionRes.value.data.freeze_reason ?? null,
        });
      } else {
        setCollectionBalance(null);
        failedBalances.push('collection');
      }
      setBalanceLoadErrors([...new Set(failedBalances)]);
      const failedTransactions: string[] = [];
      if (phpTxnRes.status === 'fulfilled' && Array.isArray(phpTxnRes.value?.data?.items)) {
        setPhpTransactions(dedupeRecords(phpTxnRes.value.data.items.filter(Boolean).map(normalizeWalletTransaction)));
      } else {
        setPhpTransactions([]);
        failedTransactions.push('php');
      }
      if (usdtTxnRes.status === 'fulfilled' && Array.isArray(usdtTxnRes.value?.data?.items)) {
        setUsdtTransactions(dedupeRecords(usdtTxnRes.value.data.items.filter(Boolean).map(normalizeWalletTransaction)));
      } else {
        setUsdtTransactions([]);
        failedTransactions.push('usdt');
      }
      if (collectionTxnRes.status === 'fulfilled' && Array.isArray(collectionTxnRes.value?.data?.items)) {
        setCollectionTransactions(dedupeRecords(collectionTxnRes.value.data.items.filter(Boolean).map(normalizeWalletTransaction)));
      } else {
        setCollectionTransactions([]);
        failedTransactions.push('collection');
      }
      setTransactionLoadErrors(failedTransactions);
      const fallbackKrwBanks = () => setBankOptions(KRW_BANKS);

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
      } else if (selectedCurrency === 'PHP') {
        setBankOptions(PH_BANK_CATALOG);
      }
      if (wrRes.status === 'fulfilled' && Array.isArray(wrRes.value?.data?.requests)) {
        setWithdrawRequests(dedupeRecords(wrRes.value.data.requests.filter(Boolean).map((request: WithdrawRequest) => ({
          ...request,
          bank_name: request.bank_name || request.bank_code || 'Bank',
          request_type: request.request_type || (request.currency === 'USD' ? 'usdt_trc20' : 'php_bank'),
        }))));
        setWithdrawRequestsLoadError(false);
      } else {
        setWithdrawRequests([]);
        setWithdrawRequestsLoadError(true);
      }
      if (rateRes.status === 'fulfilled' && rateRes.value?.data?.usdt_php_rate != null) {
        setUsdtPhpRate(rateRes.value.data.usdt_php_rate);
        setUsdtRateSource(rateRes.value.data.source || 'Standard SwiftPay rate');
      }
      if (buyRateRes.status === 'fulfilled' && buyRateRes.value?.data?.rate != null) {
        setBuyUsdtRate(normalizeNumericValue(buyRateRes.value.data.rate));
        if (buyRateRes.value.data.fee_rate != null) {
          setConversionFeeRate(normalizeNumericValue(buyRateRes.value.data.fee_rate));
        }
      } else {
        setBuyUsdtRate(null);
      }
      if (sellRateRes.status === 'fulfilled' && sellRateRes.value?.data?.rate != null) {
        setSellUsdtRate(normalizeNumericValue(sellRateRes.value.data.rate));
      } else {
        setSellUsdtRate(null);
      }
    } catch (err) {
      console.error('Wallet fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, selectedCollectionCurrency, cryptoOnly]);

  const handleLiveWalletUpdate = useCallback(() => {
    void fetchData();
  }, [fetchData]);
  const { connected: walletEventsConnected } = usePaymentEvents({
    enabled: Boolean(user),
    pollInterval: 5000,
    onWalletUpdate: handleLiveWalletUpdate,
  });

  const minimumUsdtPurchase = 0;
  const usdtConversion = getUsdtConversionSummary(
    selectedCollectionCurrency,
    phpBalance,
    collectionBalance,
    buyUsdtRate,
    Number(buyUsdtAmount),
    conversionFeeRate,
    minimumUsdtPurchase,
  );

  useEffect(() => {
    fetchPaymentChannels().then(setPaymentChannels).catch(() => undefined);
  }, []);

  const handleBuyUsdt = async () => {
    const requestedUsdtAmount = Number(buyUsdtAmount);
    if (
      !Number.isFinite(requestedUsdtAmount)
      || requestedUsdtAmount <= 0
      || !usdtConversion.conversionRate
      || usdtConversion.requiredSource <= 0
      || usdtConversion.convertibleSource < usdtConversion.requiredSource
      || buyUsdtLoading
      || fundingUsdtLoading
    ) return;
    if (!ensureWalletIsOperational('USDT', 'Buying USDT')) return;

    setBuyUsdtLoading(true);
    try {
      const passkeyCredential = await authApi.verifyPasskey('usdt_trade');
      const idempotencyKey = buyTradeKeyRef.current || crypto.randomUUID();
      buyTradeKeyRef.current = idempotencyKey;
      const response = await client.apiCall.invoke({
        url: '/api/v1/wallet/convert',
        method: 'POST',
        data: {
          from_currency: usdtConversion.sourceCurrency,
          to_currency: 'USDT',
          from_amount: usdtConversion.requiredSource,
          passkey_credential: passkeyCredential,
          idempotency_key: idempotencyKey,
        },
      });

      if (!response?.data?.success) {
        throw new Error(response?.data?.detail || response?.data?.message || 'Conversion failed');
      }

      const receivedUsdt = Number(response.data.provider_amount ?? response.data.to_amount);
      const receivedLabel = Number.isFinite(receivedUsdt) && receivedUsdt > 0
        ? fmtUsd(receivedUsdt)
        : fmtUsd(response.data.to_amount);
      toast.success(`Bought ${receivedLabel} USDT for ${formatWalletCurrency(usdtConversion.requiredSource, usdtConversion.sourceCurrency)}`);
      await fetchData();
      setWalletAction(null);
      buyTradeKeyRef.current = null;
    } catch (err) {
      toast.error((err as Error)?.message || 'Unable to buy USDT');
    } finally {
      setBuyUsdtLoading(false);
    }
  };

  const handleSellUsdt = async () => {
    const amount = Number(sellAmount);
    const availableUsdt = getWalletBalanceValue(usdtBalance, 'available_balance');
    if (
      !Number.isFinite(amount)
      || amount <= 0
      || amount > availableUsdt
      || !sellUsdtRate
      || !canTradeUsdtForPhp
      || buyUsdtLoading
    ) return;
    if (!ensureWalletIsOperational('USDT', 'Selling USDT') || !ensureWalletIsOperational(selectedCollectionCurrency, 'Selling USDT')) return;
    setBuyUsdtLoading(true);
    try {
      const passkeyCredential = await authApi.verifyPasskey('usdt_trade');
      const idempotencyKey = sellTradeKeyRef.current || crypto.randomUUID();
      sellTradeKeyRef.current = idempotencyKey;
      const response = await client.apiCall.invoke({
        url: '/api/v1/wallet/convert',
        method: 'POST',
        data: {
          from_currency: 'USDT',
          to_currency: 'PHP',
          from_amount: amount,
          passkey_credential: passkeyCredential,
          idempotency_key: idempotencyKey,
        },
      });
      if (!response?.data?.success) {
        throw new Error(response?.data?.detail || response?.data?.message || 'Conversion failed');
      }
      toast.success(`Converted ${fmtUsd(amount)} USDT to ${formatWalletCurrency(response.data.to_amount, 'PHP')}`);
      setSellAmount('');
      await fetchData();
      setWalletAction(null);
      sellTradeKeyRef.current = null;
    } catch (err) {
      toast.error((err as Error)?.message || 'Unable to sell USDT');
    } finally {
      setBuyUsdtLoading(false);
    }
  };

  const handleFundUsdtShortfall = async () => {
    if (!usdtConversion.conversionRate || usdtConversion.requestedUsdtAmount <= 0 || fundingUsdtLoading || buyUsdtLoading) return;
    const shortfall = usdtConversion.shortfallSource;
    if (shortfall <= 0) {
      await handleBuyUsdt();
      return;
    }

    setFundingUsdtLoading(true);
    try {
      const referenceNo = `USDT-FUND-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const isKrwCheckout = usdtConversion.sourceCurrency === 'KRW';
      const response = await client.apiCall.invoke({
        url: isKrwCheckout ? '/api/v1/paymentwall/create-payment' : '/api/v1/swiftpay/create-order',
        method: 'POST',
        data: {
          amount: Number(shortfall.toFixed(2)),
          currency: usdtConversion.sourceCurrency,
          ...(isKrwCheckout ? { reference_id: referenceNo } : { reference_no: referenceNo }),
          description: `Fund USDT purchase shortfall (${usdtConversion.requestedUsdtAmount} USDT)`,
          customer_name: user?.name || 'Customer',
          details: {
            source: 'usdt_purchase_shortfall',
            required_usdt: usdtConversion.requestedUsdtAmount,
            eligible_balance: usdtConversion.convertibleSource,
            shortfall_balance: shortfall,
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

    client.get('/api/v1/bank-deposits/accounts').then((bankRes) => {
      if (bankRes.ok && Array.isArray(bankRes.data?.accounts)) {
        const accounts = bankRes.data.accounts;
        setDepositAccounts(accounts);
        const krwAccount = accounts.find((account: { currency?: string }) => account.currency === 'KRW') || null;
        setAssignedKrwAccount(krwAccount);
        setKrwBankName(krwAccount?.label || '');
        setKrwAccountHolderName(krwAccount?.account_name || '');
      }
    }).catch(() => undefined);

    fetchData();
  }, [user, selectedCollectionCurrency, fetchData]);

  const [activeTab, setActiveTab] = useState(cryptoOnly ? 'usdt' : 'fund');
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'topup') {
      setActiveTab(cryptoOnly ? 'usdt' : 'fund');
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
    setUsdtAmount('');
    setBankOptions([]);
  }, [selectedCollectionCurrency]);

  // Enhanced validation logic
  const validateBankWithdraw = (amount: number): string | null => {
    if (isNaN(amount) || amount <= 0) return 'Enter a valid amount';
    if (!wrBank) return 'Select a bank';
    if (!wrAccount.trim()) return 'Enter account number';
    if (!wrName.trim()) return 'Enter account holder name';
    if (!isKrwFlow && !/^((\+?63|0)9\d{9})$/.test(wrPhone.replace(/[\s()-]/g, ''))) return 'Enter a valid Philippine mobile number';
    const selectedCurrency = String(selectedCollectionCurrency || 'PHP').toUpperCase();
    const available = getAvailableBalance(collectionBalance);
    if (amount > available) return 'Contact your Relationship Manager.';
    return null;
  };

  const validateUsdtWithdraw = (amount: number): string | null => {
    if (isNaN(amount) || amount <= 0) return 'Enter a valid USDT amount';
    if (!usdtAddress.trim()) return 'Enter your USDT address';
    if (!usdtPlatform) return 'Select which platform your address belongs to';
    const availableUsdt = getAvailableBalance(usdtBalance);
    if (amount > availableUsdt) return 'Contact your Relationship Manager.';
    if (!usdtAddress.startsWith('T') || usdtAddress.length !== 34) {
      return 'Invalid USDT address (must start with T and be 34 characters)';
    }
    return null;
  };

  const handlePhpDepositRequest = async () => {
    const amount = parseFloat(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error('Enter a valid deposit amount'); return; }
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
        toast.success('PHP deposit completed and submitted for review');
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
      console.error('Deposit submission failed:', err);
      toast.error('Network error sending the deposit. Please try again.');
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
          toast.success('USDT top-up completed and submitted for review');
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
      let passkeyCredential: Record<string, unknown> | undefined;
      let otpReference: string | undefined;
      let otpCode: string | undefined;
      try {
        passkeyCredential = await authApi.verifyPasskey('withdrawal');
      } catch {
        otpReference = await authApi.requestWithdrawalOtp();
        otpCode = window.prompt('Enter the 6-digit withdrawal OTP sent to your account email:')?.trim();
        if (!otpCode) throw new Error('Withdrawal OTP is required.');
      }
      const res = await fetch('/api/v1/wallet/withdraw-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type: 'bank_transfer',
          currency: selectedCurrency,
          amount,
          bank_code: wrBank,
          bank_name: wrBank,
          account_number: wrAccount.trim(),
          account_name: wrName.trim(),
          recipient_phone: isKrwFlow ? undefined : wrPhone.trim(),
          note: wrNote.trim() || undefined,
          passkey_credential: passkeyCredential,
          otp_reference: otpReference,
          otp_code: otpCode,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast.success(data.message || `${selectedCurrency} withdrawal submitted for approval`);
        if (data.processing_fee) {
          toast.info(`Processing fee: ${formatWalletCurrency(data.processing_fee, selectedCurrency)}`);
        }
        setWrAmount(''); setWrBank(''); setWrAccount(''); setWrName(''); setWrPhone(''); setWrNote('');
        await fetchData();
      } else {
        toast.error(data.detail || data.message || 'Failed to submit request');
      }
    } catch (err) {
      console.error('Withdrawal submission failed:', err);
      toast.error(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally { setWrLoading(false); }
  };

  const handleUsdtWithdrawRequest = async () => {
    const amount = parseFloat(usdtAmount);
    const error = validateUsdtWithdraw(amount);
    if (error) { toast.error(error); return; }

    setUsdtLoading(true);
    try {
      let passkeyCredential: Record<string, unknown> | undefined;
      let otpReference: string | undefined;
      let otpCode: string | undefined;
      try {
        passkeyCredential = await authApi.verifyPasskey('withdrawal');
      } catch {
        otpReference = await authApi.requestWithdrawalOtp();
        otpCode = window.prompt('Enter the 6-digit withdrawal OTP sent to your account email:')?.trim();
        if (!otpCode) throw new Error('Withdrawal OTP is required.');
      }
      const res = await fetch('/api/v1/wallet/usdt-send-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          to_address: usdtAddress.trim(),
          platform: usdtPlatform,
          note: `USDT withdrawal via ${usdtPlatform}`,
          passkey_credential: passkeyCredential,
          otp_reference: otpReference,
          otp_code: otpCode,
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
  const safeWithdrawRequests = dedupeRecords(Array.isArray(withdrawRequests) ? withdrawRequests.filter(Boolean) : []);
  const failedBalanceLabels = [
    ...(balanceLoadErrors.includes('php') ? ['PHP wallet data'] : []),
    ...(balanceLoadErrors.includes('usdt') ? ['USDT wallet'] : []),
    ...(primaryWalletUnavailable ? [collectionWalletLabel] : []),
  ];
  const {
    sourceCurrency: conversionSourceCurrency,
    availableSource,
    retainedBalance: sourceReserve,
    conversionRate,
    convertibleSource,
    canConvert: canConvertToUsdt,
    shortfallSource: usdtShortfallSource,
  } = usdtConversion;

  return (
    <Layout>
      <div className={`mx-auto w-full space-y-4 sm:space-y-8 ${isMobileLayout ? 'max-w-2xl px-1 pb-20' : 'max-w-none'}`}>
        {/* Header */}
        <div className="space-y-2">
          <div className={`relative overflow-hidden border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 shadow-sm ${isMobileLayout ? 'rounded-xl p-4' : 'rounded-2xl p-5 sm:p-8'}`}>
            {!isMobileLayout && (
              <>
                <div className="absolute -top-14 -right-10 h-40 w-40 rounded-full bg-blue-200/30 blur-2xl" />
                <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-blue-200/30 blur-2xl" />
              </>
            )}
            <div className={`relative z-10 flex gap-4 ${isMobileLayout ? 'items-center' : 'flex-col sm:flex-row sm:items-end sm:justify-between'}`}>
              <div>
                <div className={`flex items-center ${isMobileLayout ? 'gap-2' : 'gap-3 mb-2'}`}>
                  <div className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 ${isMobileLayout ? 'h-9 w-9' : 'h-10 w-10'}`}>
                    <Wallet className="h-6 w-6 text-blue-600" />
                  </div>
                  <h1 className={`font-semibold tracking-tight text-foreground ${isMobileLayout ? 'text-xl' : 'text-2xl sm:text-4xl'}`}>{walletTitle}</h1>
                </div>
                {!isMobileLayout && <p className="max-w-2xl text-sm font-medium text-slate-600">{walletSubtitle}</p>}
                {!isMobileLayout && (
                  <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-slate-500" aria-live="polite">
                    <span className={`h-2 w-2 rounded-full ${walletEventsConnected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    {walletEventsConnected ? 'Instapay' : 'Connecting to live wallet updates…'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Balance Cards */}
        {failedBalanceLabels.length > 0 && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span>
              Unable to verify {failedBalanceLabels.join(' and ')}. Balance-dependent actions remain unavailable until the data can be refreshed.
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => void fetchData()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </div>
        )}
        {isMobileLayout && (
          <>
            <section aria-label={walletTitle} className="grid gap-3">
              {!cryptoOnly && (
                <CollectionWalletOverview
                  mobile
                  isKorean={isKoreanWallet}
                  currency={selectedCollectionCurrency}
                  currencyName={getCurrencyName(selectedCollectionCurrency, language)}
                  title={collectionWalletLabel}
                  hasOrganizationWallet={sharedWalletIsPrimary}
                  organizationName={organizationWalletBalance?.organization_name || user?.organization_name || user?.organization_id}
                  loading={loading}
                  unavailable={primaryWalletUnavailable}
                  balance={getWalletBalanceValue(primaryWalletBalance, 'balance')}
                  availableBalance={getAvailableBalance(primaryWalletBalance)}
                  pendingBalance={getWalletBalanceValue(primaryWalletBalance, 'pending_balance')}
                  showActions={showFiatActionRow}
                  onDeposit={() => {
                    setShowUsdtTopupWizard(false);
                    setActiveTab('fund');
                    setWalletAction('deposit');
                  }}
                  onWithdraw={() => {
                    setShowUsdtTopupWizard(false);
                    setActiveTab('php');
                    setWalletAction('withdraw');
                  }}
                />
              )}

              <UsdtWalletOverview
                mobile
                isKorean={isKoreanWallet}
                hasOrganizationWallet={hasOrganizationWallet}
                organizationName={organizationWalletBalance?.organization_name || user?.organization_name || user?.organization_id}
                loading={loading}
                unavailable={balanceLoadErrors.includes('usdt') || !usdtBalance}
                balance={getWalletBalanceValue(usdtBalance, 'balance')}
                availableBalance={getWalletBalanceValue(usdtBalance, 'available_balance')}
                pendingBalance={getWalletBalanceValue(usdtBalance, 'pending_balance')}
                canTrade={canTradeUsdtForPhp}
                buyLoading={buyUsdtLoading}
                fundingLoading={fundingUsdtLoading}
                onBuy={openBuyUsdt}
                onSell={() => {
                  setSellAmount(String(getWalletBalanceValue(usdtBalance, 'available_balance')));
                  setWalletAction('sell');
                }}
                onSend={() => {
                  if (!ensureWalletIsOperational('USDT', 'Sending USDT')) return;
                  setShowUsdtTopupWizard(false);
                  setActiveTab('usdt');
                  setWalletAction('send');
                }}
                onReceive={() => {
                  setShowUsdtTopupWizard(true);
                  setActiveTab('fund');
                  setWalletAction('receive');
                }}
              />
            </section>
            <section className="space-y-4" aria-label={isKoreanWallet ? '최근 지갑 활동' : 'Recent wallet activity'}>
              {!cryptoOnly && (
                <WalletTransactionHistory
                  currency={selectedCollectionCurrency}
                  transactions={collectionTransactions}
                  loading={loading}
                  error={transactionLoadErrors.includes('collection')}
                  onRetry={() => void fetchData()}
                  isKorean={isKoreanWallet}
                />
              )}
              <WalletTransactionHistory
                currency="USDT"
                transactions={usdtTransactions}
                loading={loading}
                error={transactionLoadErrors.includes('usdt')}
                onRetry={() => void fetchData()}
                isKorean={isKoreanWallet}
              />
            </section>
          </>
        )}
        {!isMobileLayout && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {!cryptoOnly && (
          <div className="space-y-4">
            <CollectionWalletOverview
              mobile={false}
              isKorean={isKoreanWallet}
              currency={selectedCollectionCurrency}
              currencyName={getCurrencyName(selectedCollectionCurrency, language)}
              title={collectionWalletLabel}
              hasOrganizationWallet={sharedWalletIsPrimary}
              organizationName={organizationWalletBalance?.organization_name || user?.organization_name || user?.organization_id}
              loading={loading}
              unavailable={primaryWalletUnavailable}
              vipGold={vipGold}
              balance={getWalletBalanceValue(primaryWalletBalance, 'balance')}
              availableBalance={getAvailableBalance(primaryWalletBalance)}
              pendingBalance={getWalletBalanceValue(primaryWalletBalance, 'pending_balance')}
              showActions={showFiatActionRow}
              onDeposit={() => {
                setShowUsdtTopupWizard(false);
                setActiveTab('fund');
                setWalletAction('deposit');
              }}
              onWithdraw={() => {
                setShowUsdtTopupWizard(false);
                setActiveTab('php');
                setWalletAction('withdraw');
              }}
            />
            <WalletTransactionHistory
              currency={selectedCollectionCurrency}
              transactions={collectionTransactions}
              loading={loading}
              error={transactionLoadErrors.includes('collection')}
              onRetry={() => void fetchData()}
              isKorean={isKoreanWallet}
            />
          </div>
          )}

          {cryptoOnly && (
          <div className="space-y-4">
            <UsdtWalletOverview
              mobile={false}
              isKorean={isKoreanWallet}
              hasOrganizationWallet={hasOrganizationWallet}
              organizationName={organizationWalletBalance?.organization_name || user?.organization_name || user?.organization_id}
              loading={loading}
              unavailable={balanceLoadErrors.includes('usdt') || !usdtBalance}
              vipGold={vipGold}
              balance={getWalletBalanceValue(usdtBalance, 'balance')}
              availableBalance={getWalletBalanceValue(usdtBalance, 'available_balance')}
              pendingBalance={getWalletBalanceValue(usdtBalance, 'pending_balance')}
              canTrade={canTradeUsdtForPhp}
              buyLoading={buyUsdtLoading}
              fundingLoading={fundingUsdtLoading}
              onBuy={openBuyUsdt}
              onSell={() => {
                setSellAmount(String(getWalletBalanceValue(usdtBalance, 'available_balance')));
                setWalletAction('sell');
              }}
              onSend={() => {
                if (!ensureWalletIsOperational('USDT', 'Sending USDT')) return;
                setShowUsdtTopupWizard(false);
                setActiveTab('usdt');
                setWalletAction('send');
              }}
              onReceive={() => {
                setShowUsdtTopupWizard(true);
                setActiveTab('fund');
                setWalletAction('receive');
              }}
            />
            <WalletTransactionHistory
              currency="USDT"
              transactions={usdtTransactions}
              loading={loading}
              error={transactionLoadErrors.includes('usdt')}
              onRetry={() => void fetchData()}
              isKorean={isKoreanWallet}
            />
          </div>
          )}

        </div>
        }

        {/* Main Tabs */}
        <Dialog open={walletFrozenDialogOpen} onOpenChange={setWalletFrozenDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl border-amber-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3 pr-6">
              <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-lg font-semibold text-slate-900">
                  {walletFreezeCurrency} wallet under maintenance
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 text-slate-600">
                  Your {walletFreezeCurrency} wallet is temporarily unavailable for outgoing actions. Contact SwiftPay support or your account administrator for help.
                </DialogDescription>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">How to restore this wallet</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5">
                <li>Contact SwiftPay support or your account administrator.</li>
                <li>Provide your account details and complete any requested verification.</li>
                <li>Wait for an administrator to review and unfreeze the wallet.</li>
              </ol>
              {walletFreezeReason && (
                <p className="mt-3 border-t border-slate-200 pt-3">
                  <span className="font-semibold text-slate-900">Reason:</span> {walletFreezeReason}
                </p>
              )}
            </div>
            <Button
              type="button"
              onClick={() => setWalletFrozenDialogOpen(false)}
              className="w-full bg-blue-600 text-black hover:bg-blue-700"
            >
              I understand
            </Button>
          </DialogContent>
        </Dialog>
        <Dialog open={accountActivationDialogOpen} onOpenChange={setAccountActivationDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl border-blue-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3 pr-6">
              <div className="rounded-full bg-blue-100 p-2 text-blue-700">
                <Landmark className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-lg font-semibold text-slate-900">
                  {isKoreanWallet ? '계정 활성화' : 'Activate your account'}
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 text-slate-600">
                  {isKoreanWallet
                    ? 'USDT 구매와 연결된 한국 결제 기능을 활성화하려면 먼저 토스뱅크 계좌를 개설하세요. KRW eligibility 설정에 따라 승인된 USDT 입금이 필요할 수 있습니다.'
                    : 'Open your TOSS Bank account first to activate USDT purchases and the connected Korean payment features. An approved USDT deposit may be required based on the current KRW eligibility settings.'}
                </DialogDescription>
              </div>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
              <p className="font-semibold">{isKoreanWallet ? '다음 단계' : 'Next step'}</p>
              <p className="mt-1 leading-5">
                {isKoreanWallet ? '뱅킹 설정에서 토스뱅크 계좌 개설 신청을 시작하세요.' : 'Open Banking settings and start the TOSS Bank account opening application.'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setAccountActivationDialogOpen(false)} className="flex-1">
                {isKoreanWallet ? '나중에' : 'Not now'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setAccountActivationDialogOpen(false);
                  navigate('/settings/shop/settlement#banking-toss-application');
                }}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              >
                {isKoreanWallet ? '토스뱅크 뱅킹 열기' : 'Open TOSS Banking'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog
          open={walletAction !== null}
          onOpenChange={open => {
            if (!open) {
              setWalletAction(null);
              setShowUsdtTopupWizard(false);
            }
          }}
        >
          <DialogContent className={`overflow-y-auto border border-slate-200 bg-[#f6f8fb] p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] ${isMobileLayout ? 'fixed bottom-0 left-1/2 top-auto h-auto max-h-[92dvh] w-screen max-w-none -translate-x-1/2 translate-y-0 rounded-b-none rounded-t-3xl' : 'max-h-[90vh] max-w-5xl rounded-2xl sm:rounded-2xl'}`}>
            {walletAction === 'buy' ? (
              <div className="space-y-5 p-5 sm:p-7">
                <div className="border-b border-slate-200 pb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0B63FF]">{isKoreanWallet ? '지갑 작업' : 'Wallet action'}</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">{isKoreanWallet ? 'USDT 구매' : 'Buy USDT'}</h2>
                  <p className="mt-2 text-sm text-slate-600">
                  {isKoreanWallet
                    ? `구매할 USDT 금액을 선택하세요. ${formatWalletCurrency(sourceReserve, conversionSourceCurrency)}를 ${conversionSourceCurrency} 지갑에 남겨 두세요.`
                    : `Choose how much USDT you want to buy. Keep ${formatWalletCurrency(sourceReserve, conversionSourceCurrency)} in your ${conversionSourceCurrency} wallet.`}
                  </p>
                </div>
                <ExchangeRulesTable
                  sourceCurrency={conversionSourceCurrency}
                  rate={conversionRate}
                  showReserve={conversionSourceCurrency === 'PHP'}
                  mode="buy"
                  feeRate={conversionFeeRate}
                  isKorean={isKoreanWallet}
                />
                <div className="space-y-2">
                  <Label htmlFor="buy-usdt-amount">{isKoreanWallet ? '구매할 USDT 금액' : 'USDT amount to buy'}</Label>
                  <Input
                    id="buy-usdt-amount"
                    type="number"
                    min={minimumUsdtPurchase}
                    step="0.01"
                    value={buyUsdtAmount}
                    onChange={event => setBuyUsdtAmount(event.target.value)}
                    placeholder={String(minimumUsdtPurchase)}
                    aria-describedby="buy-usdt-amount-help"
                  />
                  <p id="buy-usdt-amount-help" className="text-xs text-slate-500">
                    {isKoreanWallet
                      ? `필요한 ${conversionSourceCurrency} 금액에는 ${(conversionFeeRate * 100).toFixed(2)}% 환전 수수료가 포함됩니다.`
                      : `The required ${conversionSourceCurrency} amount includes the ${(conversionFeeRate * 100).toFixed(2)}% conversion fee.`}
                  </p>
                  <p className="text-xs font-medium text-blue-700">
                    {isKoreanWallet
                      ? `예상 수령액: 약 ${fmtUsd(usdtConversion.requestedUsdtAmount)} USDT (실제 시장 체결가에 따라 달라질 수 있습니다).`
                      : `Estimated receive: about ${fmtUsd(usdtConversion.requestedUsdtAmount)} USDT (final amount may vary with the market fill).`}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{isKoreanWallet ? `사용 가능 ${conversionSourceCurrency}` : `Available ${conversionSourceCurrency}`}</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{formatWalletCurrency(availableSource, conversionSourceCurrency)}</p>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#0B63FF]">{isKoreanWallet ? '환전 가능 금액' : 'Eligible conversion'}</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{fmtUsd(usdtConversion.convertibleUsdt)} USDT</p>
                  </div>
                </div>
                {!canConvertToUsdt && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
                    {Number(buyUsdtAmount) <= 0
                      ? (isKoreanWallet ? '0보다 큰 USDT 금액을 입력하세요.' : 'Enter a USDT amount greater than 0.')
                      : convertibleSource > 0
                        ? (isKoreanWallet
                          ? `사용 가능한 잔액으로 최대 ${fmtUsd(usdtConversion.convertibleUsdt)} USDT를 구매할 수 있습니다. 구매를 완료하려면 ${formatWalletCurrency(usdtShortfallSource, conversionSourceCurrency)}를 더 입금하세요.`
                          : `You can buy up to ${fmtUsd(usdtConversion.convertibleUsdt)} USDT from your eligible balance. Deposit ${formatWalletCurrency(usdtShortfallSource, conversionSourceCurrency)} more to complete this purchase.`)
                        : (isKoreanWallet ? 'Relationship Manager에게 문의하세요.' : 'Contact your Relationship Manager.')}
                  </p>
                )}
                <BuyUsdtButton
                  loading={buyUsdtLoading}
                  funding={fundingUsdtLoading}
                  disabled={!conversionRate || Number(buyUsdtAmount) <= 0 || !Number.isFinite(Number(buyUsdtAmount))}
                  onClick={canConvertToUsdt ? handleBuyUsdt : handleFundUsdtShortfall}
                  label={canConvertToUsdt ? (isKoreanWallet ? 'USDT 구매' : 'Buy USDT') : (isKoreanWallet ? '입금' : 'Deposit')}
                />
              </div>
            ) : walletAction === 'sell' ? (
              <div className="space-y-5 p-5 sm:p-7">
                <div className="border-b border-slate-200 pb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Wallet action</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">Sell USDT</h2>
                  <p className="mt-2 text-sm text-slate-600">Convert USDT into your PHP wallet at the current exchange rate.</p>
                </div>
                <ExchangeRulesTable
                  sourceCurrency="PHP"
                  rate={sellUsdtRate}
                  showReserve={false}
                  mode="sell"
                  feeRate={conversionFeeRate}
                  isKorean={isKoreanWallet}
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                <Label htmlFor="sell-usdt-amount">USDT amount</Label>
                <button
                  type="button"
                  onClick={() => setSellAmount(String(getWalletBalanceValue(usdtBalance, 'available_balance')))}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                >
                  Use available balance
                </button>
                  </div>
                  <Input
                id="sell-usdt-amount"
                type="number"
                min="0"
                max={getWalletBalanceValue(usdtBalance, 'available_balance')}
                step="0.01"
                value={sellAmount}
                onChange={event => setSellAmount(event.target.value)}
                placeholder="0.00"
                aria-describedby="sell-usdt-amount-help"
                  />
                  <p id="sell-usdt-amount-help" className="text-xs text-slate-500">
                Available to sell: {fmtUsd(getWalletBalanceValue(usdtBalance, 'available_balance'))} USDT. The exchange fee is included in the estimate.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">You sell</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{fmtUsd(Number(sellAmount) || 0)} USDT</p>
                  </div>
                  <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">Estimated receive</p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {formatWalletCurrency(Math.max((Number(sellAmount) || 0) * (sellUsdtRate || 0) * (1 - conversionFeeRate), 0), 'PHP')}
                </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleSellUsdt}
                  disabled={buyUsdtLoading || !canTradeUsdtForPhp || !sellUsdtRate || !Number(sellAmount) || Number(sellAmount) > getWalletBalanceValue(usdtBalance, 'available_balance')}
                  className="w-full rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {buyUsdtLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sell USDT'}
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
                    isKorean={isKoreanWallet}
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
                      {walletDepositDestinations.length > 0 ? (
                        <p className="mt-1">아래에 표시된 SwiftPay 수취 계좌로 정확한 금액을 이체한 후, 송금 영수증을 업로드해 주세요. 입금은 관리자 확인 후 반영됩니다.</p>
                      ) : (
                        <p className="mt-1 font-medium text-amber-800">현재 등록된 KRW 수취 계좌가 없습니다. 관리자에게 계좌 설정을 요청해 주세요.</p>
                      )}
                    </div>
                  )}
                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-4">{isKoreanWallet ? '수취 은행 계좌' : isKrwFlow ? 'Receiving bank account' : 'Receiving bank accounts'}</p>
                    <div className="space-y-3">
                      {walletDepositDestinations.map(dest => (
                        <div key={dest.value} className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-3">
                              <BankLogo name={dest.label} code={dest.bank_code} size="md" className="h-10 w-10" />
                              <div>
                                <p className="text-xs font-medium text-slate-500">{isKoreanWallet ? '은행' : 'Bank'}</p>
                                <p className="mt-1 font-semibold text-foreground">{getBankDisplayName(dest.label)}</p>
                              </div>
                            </div>
                            {dest.swift_code && (
                              <div>
                                <p className="text-xs font-medium text-slate-500">SWIFT/BIC</p>
                                <p className="mt-2 font-mono font-semibold text-foreground">{dest.swift_code}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-medium text-slate-500">{isKoreanWallet ? '예금주' : 'Account holder'}</p>
                              <p className="mt-2 font-semibold text-foreground">{dest.account_name}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-xs font-medium text-slate-500">{isKoreanWallet ? '계좌번호' : 'Account number'}</p>
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
                    <DepositWizard
                      onSuccess={fetchData}
                      currency={selectedCollectionCurrency}
                      userId={user?.id}
                      bankName={krwBankName}
                      accountHolderName={krwAccountHolderName}
                      destinations={isKrwFlow ? (assignedKrwAccount ? [assignedKrwAccount] : []) : undefined}
                      companyLogoUrl={platformBranding?.logoUrl}
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
                      <p className="text-xs text-slate-500 mt-1">per 1 USDT{usdtRateSource ? ` · ${usdtRateSource}` : ''}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                      <p className="text-xs uppercase tracking-wider font-semibold text-blue-600 mb-2">{usdtWalletLabel}</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {usdtBalance ? `$${fmtUsd(getWalletBalanceValue(usdtBalance, 'balance'))}` : '—'}
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
                      <><Bitcoin className="h-4 w-4 mr-2" />Submit</>
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
            {isKrwFlow ? (
              <KrwWithdrawalPanel
                isKorean={isKoreanWallet}
                amount={wrAmount}
                selectedBank={wrBank}
                accountNumber={wrAccount}
                accountName={wrName}
                note={wrNote}
                availableBalance={getAvailableBalance(collectionBalance)}
                banks={bankList}
                loading={wrLoading}
                submitLabel={withdrawSubmitLabel}
                onAmountChange={setWrAmount}
                onBankChange={code => {
                  setWrBank(code);
                }}
                onAccountNumberChange={setWrAccount}
                onAccountNameChange={setWrName}
                onNoteChange={setWrNote}
                onSubmit={handlePhpWithdrawRequest}
              />
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-white border border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    {withdrawBankTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">{`Amount (${getCurrencySymbol(selectedCollectionCurrency).trim()})`}</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={wrAmount}
                        onChange={e => setWrAmount(e.target.value)}
                        min="1"
                        step="0.01"
                        className="bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      {collectionBalance && (
                        <div className="text-xs text-slate-600 mt-2 font-medium">
                          Available: <span className="text-blue-700">{formatWalletCurrency(getAvailableBalance(collectionBalance), selectedCollectionCurrency)}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">Bank</Label>
                      <Select value={wrBank} onValueChange={(val) => {
                        setWrBank(val);
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
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">Mobile Number</Label>
                      <Input
                        placeholder="09XXXXXXXXX or +63 9XX XXX XXXX"
                        value={wrPhone}
                        onChange={e => setWrPhone(e.target.value)}
                        inputMode="tel"
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
                    disabled={wrLoading || !wrAmount || !wrBank || !wrAccount || !wrName || !wrPhone}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-black h-10 rounded-lg font-semibold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    data-wallet-dark-action="true"
                  >
                    {wrLoading ? (
                      <><Loader2 className="h-4 w-4 mr-2 text-black animate-spin" />Submitting Request...</>
                    ) : (
                      <><ArrowUpFromLine className="h-4 w-4 mr-2 text-black" />{withdrawSubmitLabel}</>
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
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {PH_BANK_CATALOG.map(bank => {
                      return (
                        <div key={bank.code} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-2 hover:bg-slate-50 transition-colors">
                          <BankLogo name={bank.name} code={bank.code} size="sm" />
                          <span className="min-w-0 truncate text-xs font-medium text-slate-700">{bank.name}</span>
                        </div>
                      );
                    })}
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
            )}
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
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-semibold text-blue-900">Network: TRC-20 (Tron)</span>
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
                          Available: <span className="text-blue-700">${fmtUsd(getAvailableBalance(usdtBalance))} USDT</span>
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
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-black h-10 rounded-lg font-semibold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    data-wallet-dark-action="true"
                  >
                    {usdtLoading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting Request...</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" />Withdraw USDT</>
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
                ) : withdrawRequestsLoadError ? (
                  <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800">
                    <span>Unable to load withdrawal requests.</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => void fetchData()}>
                      <RefreshCw className="mr-2 h-4 w-4" /> Retry
                    </Button>
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
                      const statusType = getStatusType(req.status);
                      const isUsdt = req.request_type === 'usdt_trc20';
                      return (
                        <div key={req.id} className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <StatusBadge status={statusType} size="sm" showDot={false} className="shrink-0" />
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-foreground">
                                    {isUsdt ? formatWalletCurrency(req.amount, 'USDT') : formatWalletCurrency(req.amount, 'PHP')}
                                  </p>
                                  <StatusBadge status={statusType} size="sm" showDot={false} />
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                    {isUsdt ? 'USDT · TRC-20' : 'PHP · Bank Transfer'}
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
                                <p className="text-xs text-slate-500 mt-1">
                                  Amount: {formatWalletCurrency(req.amount, req.currency || (isUsdt ? 'USDT' : 'PHP'))}
                                  {' · Fee: '}{formatWalletCurrency(req.processing_fee || 0, req.currency || (isUsdt ? 'USDT' : 'PHP'))}
                                  {' · Total debited: '}{formatWalletCurrency(req.total_debit ?? (req.amount + (req.processing_fee || 0)), req.currency || (isUsdt ? 'USDT' : 'PHP'))}
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
                                {req.created_at
                                  ? new Date(req.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                                  : '—'}
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
