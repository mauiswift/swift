import { fetchPaymentChannels, isPaymentChannelEnabled, type PaymentChannels } from '@/lib/paymentChannels';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { client } from '@/lib/api';
import type { WalletBalance } from '@/api/wallet';
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
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
const DepositWizard = React.lazy(() => import('@/components/DepositWizard'));
const UsdtTopupWizard = React.lazy(() => import('@/components/UsdtTopupWizard'));
import {
  Wallet, ArrowUpFromLine, ArrowDownToLine, Send, Bitcoin,
  Loader2, ChevronRight, Clock, CheckCircle, XCircle, Building2, Landmark,
  CreditCard, Receipt, AlertCircle, Globe, Wallet2, TrendingUp, Crown
} from 'lucide-react';

interface WalletTxn {
  id: number;
  type: 'deposit' | 'withdraw' | 'receive' | 'sent' | 'crypto_topup' | 'usdt_send' | 'disbursement' | 'refund' | 'admin_adjustment';
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
  userId?: string,
  bankName = 'Toss Bank',
  accountHolderName = 'SwiftPay Ventures Inc.',
) => {
  if (currency === 'KRW') {
    return [{
      value: 'swiftpay-krw-toss-bank',
      label: bankName || 'Toss Bank',
      account_number: '1908-1618-8260',
      account_name: accountHolderName || 'SwiftPay Ventures Inc.',
      swift_code: 'TVBKVVTTXXX',
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
  { name: 'BDO', logoUrl: '/logos/bdo.svg' },
  { name: 'BPI', logoUrl: '/logos/bpi.svg' },
  { name: 'Metrobank', logoUrl: '/logos/metrobank.svg' },
  { name: 'UnionBank', logoUrl: '/logos/unionbank.svg' },
  { name: 'Landbank', logoUrl: '/logos/landbank.png' },
  { name: 'DBP', logoUrl: '/logos/dbp.svg' },
  { name: 'RCBC', logoUrl: '/logos/rcbc.svg' },
  { name: 'PSBank', logoUrl: '/logos/psbank.svg' },
  { name: 'Security Bank', logoUrl: '/logos/security-bank.svg' },
  { name: 'Asia United Bank', logoUrl: '/logos/asia-united-bank.svg' },
  { name: 'EastWest Bank', logoUrl: '/logos/eastwest-bank.svg' },
  { name: 'GCash', logoUrl: '/logos/gcash.png' },
  { name: 'Maya', logoUrl: '/logos/maya.svg' },
  { name: 'GrabPay', logoUrl: '/logos/grab.svg' },
] as const;

const PH_BANKS_BY_NAME = PH_BANKS.map((bank) => bank.name);

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
  admin_adjustment: { label: 'Wallet Adjustment', color: 'text-slate-600', icon: <Wallet2 className="h-4 w-4" />, sign: '+' },
};

const statusMeta: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50', icon: <Clock className="h-3.5 w-3.5" /> },
  approved:   { label: 'Approved', color: 'text-blue-600', bg: 'bg-blue-50', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  processing: { label: 'Processing', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  transferring: { label: 'Transferring', color: 'text-orange-600', bg: 'bg-orange-50', icon: <ArrowUpFromLine className="h-3.5 w-3.5" /> },
  completed:  { label: 'Completed', color: 'text-blue-600', bg: 'bg-blue-50', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  rejected:   { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-50', icon: <XCircle className="h-3.5 w-3.5" /> },
  failed:     { label: 'Failed', color: 'text-red-600', bg: 'bg-red-50', icon: <XCircle className="h-3.5 w-3.5" /> },
  cancelled:  { label: 'Cancelled', color: 'text-slate-500', bg: 'bg-slate-50', icon: <XCircle className="h-3.5 w-3.5" /> },
};

const fmt = (n: number) => Number.isFinite(n) ? n.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '0.00';
const fmtUsd = (n: number) => Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
const PHP_USDT_RESERVE = 0;
const MIN_USDT_PURCHASE = 100;
const currencySymbols: Record<string, string> = {
  PHP: '₱', USD: '$', USDT: 'USDT ', CNY: '¥', KRW: '₩', EUR: '€', GBP: '£', SGD: 'S$',
};
const currencyNames: Record<string, string> = {
  PHP: 'Philippine Peso', USD: 'US Dollar', CNY: 'Chinese Yuan', KRW: 'South Korean Won',
  EUR: 'Euro', GBP: 'British Pound', SGD: 'Singapore Dollar', USDT: 'Tether USD',
};
const currencyLocales: Record<string, string> = {
  PHP: 'en-PH', USD: 'en-US', USDT: 'en-US', CNY: 'zh-CN', KRW: 'ko-KR',
  EUR: 'de-DE', GBP: 'en-GB', SGD: 'en-SG',
};
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

const getWalletBalanceValue = (wallet: WalletBalanceSnapshot | null, field: 'balance' | 'available_balance') =>
  normalizeNumericValue(wallet?.[field] ?? wallet?.balance ?? 0);

const getAvailableBalance = (wallet: WalletBalanceSnapshot | null) => {
  const available = getWalletBalanceValue(wallet, 'available_balance');
  const balance = getWalletBalanceValue(wallet, 'balance');
  const pending = normalizeNumericValue(wallet?.pending_balance, 0);
  return available > 0 || balance <= 0
    ? available
    : Math.max(0, balance - pending);
};

interface BuyUsdtButtonProps {
  loading: boolean;
  funding: boolean;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
  compact?: boolean;
}

function BuyUsdtIcon({ busy, className = 'h-5 w-5' }: { busy: boolean; className?: string }) {
  return busy
    ? <Loader2 className={`${className} animate-spin`} stroke="#ffffff" strokeWidth={2.5} aria-hidden="true" />
    : <Bitcoin className={className} stroke="#ffffff" strokeWidth={2.5} aria-hidden="true" />;
}

function BuyUsdtButton({ loading, funding, disabled, onClick, label, compact = false }: BuyUsdtButtonProps) {
  const busy = loading || funding;
  const buttonLabel = loading
    ? 'Processing...'
    : funding
      ? 'Processing...'
      : label || 'Buy USDT';

  if (compact) {
    return (
      <button
        type="button"
        title="Buy USDT"
        aria-label="Buy USDT"
        onClick={onClick}
        disabled={disabled || busy}
        className="flex h-10 w-full min-w-0 items-center justify-center gap-1 rounded-xl border-2 border-[#1d4ed8] bg-[#2563eb] px-1 text-white opacity-100 shadow-none hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-100"
        data-wallet-dark-action="true"
        style={{ opacity: 1, visibility: 'visible' }}
      >
        <BuyUsdtIcon busy={busy} className="h-5 w-5 shrink-0" />
        <span className="text-[10px] font-bold leading-none text-white">BUY</span>
      </button>
    );
  }

  return (
    <Button
      type="button"
      title="Buy USDT"
      aria-label="Buy USDT"
      onClick={onClick}
      disabled={disabled || busy}
      className="w-full rounded-xl bg-[#0B63FF] text-white shadow-sm shadow-blue-600/20 hover:bg-[#0954d8] disabled:opacity-50"
    >
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-white" aria-hidden="true">
        <BuyUsdtIcon busy={busy} />
      </span>
      <span>{buttonLabel}</span>
    </Button>
  );
}

type WalletBalanceSnapshot = Pick<WalletBalance, 'balance' | 'available_balance' | 'pending_balance'>;

const getUsdtConversionSummary = (
  collectionCurrency: string,
  phpBalance: WalletBalanceSnapshot | null,
  collectionBalance: WalletBalanceSnapshot | null,
  usdtPhpRate: number | null,
  requestedUsdtAmount: number,
  conversionFeeRate = 0.01,
) => {
  const requestedCurrency = String(collectionCurrency || 'PHP').toUpperCase();
  const sourceCurrency = ['PHP', 'CNY', 'KRW'].includes(requestedCurrency) ? requestedCurrency : 'PHP';
  const sourceWallet = sourceCurrency === 'PHP' ? phpBalance : collectionBalance;
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
    requiredSource,
    canConvert: safeRequestedAmount >= MIN_USDT_PURCHASE
      && Boolean(conversionRate)
      && convertibleSource >= requiredSource,
    shortfallSource: Math.max(requiredSource - convertibleSource, 0),
  };
};

function ExchangeRulesTable({ sourceCurrency, rate, showReserve, mode, isKorean }: { sourceCurrency: string; rate: number | null; showReserve: boolean; mode: 'buy' | 'sell'; isKorean: boolean }) {
  const displayRate = rate && mode === 'buy' ? 1 / rate : rate;
  const rateLabel = displayRate
    ? `1 USDT = ${formatWalletCurrency(displayRate, sourceCurrency)}`
    : isKorean ? '사용할 수 없음' : 'Unavailable';
  const feeAmountLabel = isKorean ? '환전 금액의 1.00%' : '1.00% of converted value';
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
  const type = String(txn.transaction_type || txn.type || '').toLowerCase();
  const reference = txn.reference_id || txn.reference || '';
  if (['admin_credit', 'admin_debit', 'admin_adjustment'].includes(type)) return isKorean ? '지갑 거래' : 'Wallet transaction';
  if (type === 'conversion_in') return isKorean ? '환전 입금' : 'Currency purchase';
  if (type === 'conversion_out') return isKorean ? '환전 출금' : 'Currency sale';
  if (['payment_link', 'invoice', 'checkout', 'magpie_checkout', 'zip_checkout'].includes(type)) {
    const isKrwTransaction = String(txn.currency || '').toUpperCase() === 'KRW' || (!txn.currency && isKorean);
    const label = isKrwTransaction ? '지불' : 'Payment';
    return reference ? `${label}-${reference}` : label;
  }
  if (['payment', 'qrph_payment'].includes(type)) {
    return reference ? `${isKorean ? '결제' : 'Pay'} ${reference}` : isKorean ? '결제' : 'Pay';
  }
  if (['top_up', 'topup', 'deposit', 'crypto_topup'].includes(type)) {
    return isKorean ? '입금' : 'Deposit';
  }
  return txn.description || txn.note || reference || `${isKorean ? '거래' : 'Transaction'} #${txn.id}`;
};

const normalizeWalletTransaction = (item: WalletTxn): WalletTxn => {
  const backendType = String(item.transaction_type || item.type || '').toLowerCase();
  const type: WalletTxn['type'] =
    ['top_up', 'topup', 'deposit'].includes(backendType) ? 'deposit' :
    ['withdrawal', 'withdraw'].includes(backendType) ? 'withdraw' :
    backendType === 'send' ? 'sent' :
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
}

const WalletTransactionHistory = ({ currency, transactions, loading, isKorean }: WalletTransactionHistoryProps & { isKorean: boolean }) => {
  const safeTransactions = Array.isArray(transactions) ? transactions.filter(Boolean) : [];

  return (
    <Card className="bg-white border border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Receipt className="h-4 w-4 text-slate-600" />
          {isKorean ? `${currency} 거래 내역` : `${currency} Transaction History`}
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
            <p className="text-xs font-semibold text-foreground">{isKorean ? `${currency} 거래 내역이 없습니다` : `No ${currency} transactions yet`}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {safeTransactions.map(txn => {
              if (!txn) return null;
              const transactionAmount = normalizeNumericValue(txn.amount, 0);
              const meta = txnMeta[txn.type] || txnMeta.deposit;
              const isAdminAdjustment = ['admin_credit', 'admin_debit', 'admin_adjustment'].includes(
                String(txn.transaction_type || txn.type || '').toLowerCase()
              );
              const manualType = String(txn.transaction_type || txn.type || '').toLowerCase();
              const isPaymentTransaction = ['payment_link', 'invoice', 'checkout', 'magpie_checkout', 'zip_checkout'].includes(manualType);
              const paymentDetailsHref = isPaymentTransaction && txn.payment_transaction_id
                ? `/payments/${txn.payment_transaction_id}`
                : null;
              const sign = ['admin_debit', 'conversion_out'].includes(manualType) ? '-' : meta.sign;
              const status = statusMeta[txn.status] || statusMeta.pending;
              const rowContent = (
                <>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 ${meta.color}`}>
                      {meta.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{getTransactionLabel(txn, isKorean)}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {!isAdminAdjustment && (txn.description || txn.note || txn.reference_id || txn.reference || `#${txn.id}`)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-semibold ${meta.color}`}>
                      {sign}{formatWalletCurrency(Math.abs(transactionAmount), txn.currency || currency)}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${status.bg} ${status.color}`}>
                      {status.icon}
                      {isKorean ? ({ pending: '대기 중', approved: '승인됨', processing: '처리 중', transferring: '이체 중', completed: '완료됨', rejected: '거절됨', failed: '실패', cancelled: '취소됨' } as Record<string, string>)[txn.status] || status.label : status.label}
                    </span>
                  </div>
                </>
              );
              const rowClassName = 'flex items-center justify-between gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-slate-200 hover:bg-slate-50';
              return paymentDetailsHref ? (
                <Link key={txn.id} to={paymentDetailsHref} className={`${rowClassName} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}>
                  {rowContent}
                </Link>
              ) : (
                <div key={txn.id} className={rowClassName}>{rowContent}</div>
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
  const [vipGold, setVipGold] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [phpBalance, setPhpBalance] = useState<WalletBalance | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<WalletBalance | null>(null);
  const { collectionCurrency } = useCollectionCurrency();
  const selectedCollectionCurrency = String(collectionCurrency || 'PHP').toUpperCase();
  const [collectionBalance, setCollectionBalance] = useState<WalletBalance | null>(null);
  const [phpTransactions, setPhpTransactions] = useState<WalletTxn[]>([]);
  const [usdtTransactions, setUsdtTransactions] = useState<WalletTxn[]>([]);
  const [collectionTransactions, setCollectionTransactions] = useState<WalletTxn[]>([]);
  const [transactions, setTransactions] = useState<WalletTxn[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankOptions, setBankOptions] = useState<BankOption[]>([]);
  const [usdtPhpRate, setUsdtPhpRate] = useState<number | null>(null);
  const [usdtRateSource, setUsdtRateSource] = useState('');
  const [buyUsdtRate, setBuyUsdtRate] = useState<number | null>(null);
  const [conversionFeeRate, setConversionFeeRate] = useState(0.01);
  const [sellUsdtRate, setSellUsdtRate] = useState<number | null>(null);
  const [buyUsdtLoading, setBuyUsdtLoading] = useState(false);
  const [fundingUsdtLoading, setFundingUsdtLoading] = useState(false);
  const [krwBankName, setKrwBankName] = useState('Toss Bank');
  const [krwAccountHolderName, setKrwAccountHolderName] = useState('SwiftPay Ventures Inc.');
  const isKrwFlow = selectedCollectionCurrency === 'KRW';
  const isKoreanWallet = isKrwFlow;
  useEffect(() => {
    if (!user?.id) return;
    client.get('/api/v1/team/vip-status')
      .then(response => setVipGold(Boolean(response.data?.vip_gold)))
      .catch(() => setVipGold(false));
  }, [user?.id]);
  const walletDepositDestinations = useMemo(
    () => getWalletDepositDestinations(selectedCollectionCurrency, user?.id, krwBankName, krwAccountHolderName),
    [selectedCollectionCurrency, user?.id, krwBankName, krwAccountHolderName],
  );
  const walletTitle = isKoreanWallet ? '지갑' : 'Wallet';
  const walletSubtitle = isKoreanWallet
    ? 'PHP 및 USDT 잔액을 관리하고, 자금을 충전하고, 출금 및 거래 내역을 확인하세요.'
    : `Manage ${selectedCollectionCurrency} and USDT balances, fund your account, submit withdrawals, and track activity`;
  const collectionWalletLabel = isKoreanWallet ? `${selectedCollectionCurrency} 지갑` : `${selectedCollectionCurrency} Wallet`;
  const fundWalletTitle = isKoreanWallet ? '은행 이체로 자금 충전' : 'Fund Wallet via NetBank';
  const withdrawTitle = isKoreanWallet ? '한국 은행 계좌로 출금' : 'Withdraw to Bank Account';
  const withdrawBankTitle = isKrwFlow
    ? '출금'
    : 'Withdraw PHP by Bank Transfer';
  const withdrawSubmitLabel = isKrwFlow
    ? '출금'
    : `Withdraw ${selectedCollectionCurrency}`;
  const rateLabel = isKoreanWallet ? '현재 환율' : 'Current Rate';
  const usdtWalletLabel = isKoreanWallet ? '내 USDT 지갑' : 'Your USDT Wallet';

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
  const [buyUsdtAmount, setBuyUsdtAmount] = useState(String(MIN_USDT_PURCHASE));
  const [sellAmount, setSellAmount] = useState('');
  const [paymentChannels, setPaymentChannels] = useState<PaymentChannels | null>(null);
  const showFiatActionRow = isPaymentChannelEnabled(paymentChannels, selectedCollectionCurrency, 'withdrawal', 'bank_transfer');
  const showUsdtActionRow = true;

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const selectedCurrency = selectedCollectionCurrency;
      const institutionCurrency = selectedCurrency === 'KRW' ? 'KRW' : 'PHP';
      const [phpRes, usdtRes, collectionRes, phpTxnRes, usdtTxnRes, collectionTxnRes, banksRes, wrRes, rateRes, buyRateRes, sellRateRes] = await Promise.allSettled([
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
          data: { from_currency: selectedCurrency, to_currency: 'USDT', from_amount: 1 },
        }),
        client.apiCall.invoke({
          url: '/api/v1/wallet/quote',
          method: 'POST',
          data: { from_currency: 'USDT', to_currency: selectedCurrency, from_amount: 1 },
        }),
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
        setPhpTransactions(phpTxnRes.value.data.items.filter(Boolean).map(normalizeWalletTransaction));
      }
      if (usdtTxnRes.status === 'fulfilled' && Array.isArray(usdtTxnRes.value?.data?.items)) {
        setUsdtTransactions(usdtTxnRes.value.data.items.filter(Boolean).map(normalizeWalletTransaction));
      }
      if (collectionTxnRes.status === 'fulfilled' && Array.isArray(collectionTxnRes.value?.data?.items)) {
        setCollectionTransactions(collectionTxnRes.value.data.items.filter(Boolean).map(normalizeWalletTransaction));
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
        setWithdrawRequests(wrRes.value.data.requests.filter(Boolean).map((request: WithdrawRequest) => ({
          ...request,
          bank_name: request.bank_name || request.bank_code || 'Bank',
          request_type: request.request_type || (request.currency === 'USD' ? 'usdt_trc20' : 'php_bank'),
        })));
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
  }, [user, selectedCollectionCurrency]);

  const usdtConversion = getUsdtConversionSummary(
    selectedCollectionCurrency,
    phpBalance,
    collectionBalance,
    buyUsdtRate,
    Number(buyUsdtAmount),
    conversionFeeRate,
  );

  useEffect(() => {
    fetchPaymentChannels().then(setPaymentChannels).catch(() => undefined);
  }, []);

  const handleBuyUsdt = async () => {
    const requestedUsdtAmount = Number(buyUsdtAmount);
    if (
      !Number.isFinite(requestedUsdtAmount)
      || requestedUsdtAmount < MIN_USDT_PURCHASE
      || !usdtConversion.conversionRate
      || usdtConversion.requiredSource <= 0
      || usdtConversion.convertibleSource < usdtConversion.requiredSource
      || buyUsdtLoading
      || fundingUsdtLoading
    ) return;

    setBuyUsdtLoading(true);
    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/wallet/convert',
        method: 'POST',
        data: {
          from_currency: usdtConversion.sourceCurrency,
          to_currency: 'USDT',
          from_amount: usdtConversion.requiredSource,
        },
      });

      if (!response?.data?.success) {
        throw new Error(response?.data?.detail || response?.data?.message || 'Conversion failed');
      }

      toast.success(`Converted ${formatWalletCurrency(usdtConversion.requiredSource, usdtConversion.sourceCurrency)} to ${fmtUsd(response.data.to_amount)} USDT`);
      await fetchData();
      setWalletAction(null);
    } catch (err) {
      toast.error((err as Error)?.message || 'Unable to buy USDT');
    } finally {
      setBuyUsdtLoading(false);
    }
  };

  const handleSellUsdt = async () => {
    const amount = Number(sellAmount);
    if (!Number.isFinite(amount) || amount <= 0 || !['PHP', 'KRW'].includes(selectedCollectionCurrency)) return;
    setBuyUsdtLoading(true);
    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/wallet/convert',
        method: 'POST',
        data: {
          from_currency: 'USDT',
          to_currency: selectedCollectionCurrency,
          from_amount: amount,
        },
      });
      if (!response?.data?.success) {
        throw new Error(response?.data?.detail || response?.data?.message || 'Conversion failed');
      }
      toast.success(`Converted ${fmtUsd(amount)} USDT to ${formatWalletCurrency(response.data.to_amount, selectedCollectionCurrency)}`);
      setSellAmount('');
      await fetchData();
      setWalletAction(null);
    } catch (err) {
      toast.error((err as Error)?.message || 'Unable to sell USDT');
    } finally {
      setBuyUsdtLoading(false);
    }
  };

  const handleFundUsdtShortfall = async () => {
    if (!usdtConversion.conversionRate || usdtConversion.requestedUsdtAmount < MIN_USDT_PURCHASE || fundingUsdtLoading || buyUsdtLoading) return;
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
  }, [user, selectedCollectionCurrency, fetchData]);

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
    if (amount > available) return `Amount exceeds your available ${selectedCurrency} balance`;
    return null;
  };

  const validateUsdtWithdraw = (amount: number): string | null => {
    if (isNaN(amount) || amount <= 0) return 'Enter a valid USDT amount';
    if (amount < 10) return 'Minimum amount is 10 USDT';
    if (!usdtAddress.trim()) return 'Enter your USDT address';
    if (!usdtPlatform) return 'Select which platform your address belongs to';
    const availableUsdt = getAvailableBalance(usdtBalance);
    if (amount > availableUsdt) return 'Amount exceeds your available USDT balance';
    if (!usdtAddress.startsWith('T') || usdtAddress.length !== 34) {
      return 'Invalid USDT address (must start with T and be 34 characters)';
    }
    return null;
  };

  const handlePhpDepositRequest = async () => {
    const amount = parseFloat(depositAmount);
    if (!Number.isFinite(amount) || amount < 1000) { toast.error('Minimum deposit amount is ₱1,000'); return; }
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
      const res = await fetch('/api/v1/wallet/withdraw-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type: 'bank_transfer',
          currency: selectedCurrency,
          amount,
          bank_name: wrBank,
          account_number: wrAccount.trim(),
          account_name: wrName.trim(),
          recipient_phone: isKrwFlow ? undefined : wrPhone.trim(),
          note: wrNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${selectedCurrency} withdrawal submitted`);
        if (data.processing_fee) {
          toast.info(`Processing fee: ${formatWalletCurrency(data.processing_fee, selectedCurrency)}`);
        }
        setWrAmount(''); setWrBank(''); setWrAccount(''); setWrName(''); setWrPhone(''); setWrNote('');
        await fetchData();
      } else {
        toast.error(data.detail || data.message || 'Failed to submit request');
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
      const res = await fetch('/api/v1/wallet/usdt-send-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          to_address: usdtAddress.trim(),
          platform: usdtPlatform,
          note: `USDT withdrawal via ${usdtPlatform}`,
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
  const {
    sourceCurrency: conversionSourceCurrency,
    availableSource,
    retainedBalance: sourceReserve,
    conversionRate,
    convertibleSource,
    requiredSource: requiredSourceForUsdt,
    canConvert: canConvertToUsdt,
    shortfallSource: usdtShortfallSource,
  } = usdtConversion;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 p-8 shadow-sm">
            <div className="absolute -top-14 -right-10 h-40 w-40 rounded-full bg-blue-200/30 blur-2xl" />
            <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-blue-200/30 blur-2xl" />
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-blue-600" />
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
            <Card className="card-3d bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 ring-1 ring-blue-100/50 overflow-hidden hover:shadow-lg transition-all">
            <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-200" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">{collectionWalletLabel}</span>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-700">
                  <Landmark className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-semibold text-foreground">
                {loading ? (
                  <span className="inline-block w-32 h-10 bg-slate-100 rounded-lg animate-pulse" />
                ) : formatWalletCurrency(getWalletBalanceValue(collectionBalance, 'balance'), selectedCollectionCurrency)}
              </p>
              {vipGold && <div className="vip-gold-card mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
                <Crown className="h-3 w-3 fill-amber-400 text-amber-600" />
                VIP
              </div>}
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-slate-500">{currencyNames[selectedCollectionCurrency] || selectedCollectionCurrency}</p>
                {collectionBalance?.pending_balance ? (
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Pending: {formatWalletCurrency(collectionBalance.pending_balance, selectedCollectionCurrency)}</span>
                ) : null}
              </div>
              <div className="mt-4 flex items-center gap-2 min-h-[44px]">
                {showFiatActionRow ? (
                  <>
                    <Button
                      type="button"
                      size="icon"
                      title={`Deposit ${selectedCollectionCurrency}`}
                      aria-label={`Deposit ${selectedCollectionCurrency}`}
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
                      title={`Withdraw ${selectedCollectionCurrency}`}
                      aria-label={`Withdraw ${selectedCollectionCurrency}`}
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
              {selectedCollectionCurrency === 'PHP' && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-slate-500">
                    PHP-to-USDT conversion requires ₱5,000 PHP to remain in your wallet plus enough PHP to purchase at least 100 USDT.
                  </p>
                  {!canConvertToUsdt && (
                    <p className="text-xs font-semibold text-amber-700">
                      Your PHP balance does not meet this requirement. Deposit at least 100 USDT directly instead.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
            </Card>
            <WalletTransactionHistory
              currency={selectedCollectionCurrency}
              transactions={collectionTransactions}
              loading={loading}
              isKorean={isKoreanWallet}
            />
          </div>

          {/* USDT Balance */}
          <div className="space-y-4">
            <Card className="card-3d bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 ring-1 ring-blue-100/50 overflow-hidden hover:shadow-lg transition-all">
            <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-200" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">USDT Wallet</span>
                <div className="h-10 w-10 rounded-xl bg-[#0f2a5f]/10 flex items-center justify-center p-2">
                  <img src="/logos/tether.svg" alt="Tether USDT" className="h-7 w-7 object-contain" />
                </div>
              </div>
              <p className="text-3xl font-semibold text-foreground">
                {loading ? (
                  <span className="inline-block w-32 h-10 bg-slate-100 rounded-lg animate-pulse" />
                ) : `$${fmtUsd(getWalletBalanceValue(usdtBalance, 'balance'))}`}
              </p>
              {vipGold && <div className="vip-gold-card mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
                <Crown className="h-3 w-3 fill-amber-400 text-amber-600" />
                VIP
              </div>}
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-slate-500">{isKoreanWallet ? 'TRC-20 네트워크' : 'TRC-20 Network'}</p>
                {usdtConversion.conversionRate && (
                  <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                    {formatWalletCurrency(1 / usdtConversion.conversionRate, usdtConversion.sourceCurrency)}/USDT
                  </span>
                )}
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 min-h-[44px]">
                {showUsdtActionRow ? (
                  <>
                    <BuyUsdtButton
                      compact
                      loading={buyUsdtLoading}
                      funding={fundingUsdtLoading}
                      onClick={() => setWalletAction('buy')}
                    />
                    <Button
                      type="button"
                      size="icon"
                      title="Sell USDT"
                      aria-label="Sell USDT"
                      onClick={() => {
                        setSellAmount(String(getWalletBalanceValue(usdtBalance, 'available_balance')));
                        setWalletAction('sell');
                      }}
                      disabled={!['PHP', 'KRW'].includes(selectedCollectionCurrency)}
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-orange-600 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-50"
                    >
                      <ArrowUpFromLine className="h-4 w-4 text-white" />
                      <span className="text-[10px] font-bold text-white">Sell</span>
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
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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
              isKorean={isKoreanWallet}
            />
          </div>

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
                    Choose how much USDT you want to buy. Keep {formatWalletCurrency(sourceReserve, conversionSourceCurrency)} in your {conversionSourceCurrency} wallet.
                  </p>
                </div>
                <ExchangeRulesTable
                  sourceCurrency={conversionSourceCurrency}
                  rate={conversionRate}
                  showReserve={conversionSourceCurrency === 'PHP'}
                  mode="buy"
                  isKorean={isKoreanWallet}
                />
                <div className="space-y-2">
                  <Label htmlFor="buy-usdt-amount">USDT amount to buy</Label>
                  <Input
                    id="buy-usdt-amount"
                    type="number"
                    min={MIN_USDT_PURCHASE}
                    step="0.01"
                    value={buyUsdtAmount}
                    onChange={event => setBuyUsdtAmount(event.target.value)}
                    placeholder={String(MIN_USDT_PURCHASE)}
                    aria-describedby="buy-usdt-amount-help"
                  />
                  <p id="buy-usdt-amount-help" className="text-xs text-slate-500">
                    Minimum purchase: {MIN_USDT_PURCHASE} USDT. The required {conversionSourceCurrency} amount includes the {(conversionFeeRate * 100).toFixed(2)}% conversion fee.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Available {conversionSourceCurrency}</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{formatWalletCurrency(availableSource, conversionSourceCurrency)}</p>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#0B63FF]">Eligible conversion</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{fmtUsd(usdtConversion.convertibleUsdt)} USDT</p>
                  </div>
                </div>
                {!canConvertToUsdt && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
                    {Number(buyUsdtAmount) < MIN_USDT_PURCHASE
                      ? `Enter at least ${MIN_USDT_PURCHASE} USDT.`
                      : convertibleSource > 0
                        ? `You can buy up to ${fmtUsd(usdtConversion.convertibleUsdt)} USDT from your eligible balance. Deposit ${formatWalletCurrency(usdtShortfallSource, conversionSourceCurrency)} more to complete this purchase.`
                        : 'You have 0 eligible wallet balance. Deposit the required amount to buy USDT.'}
                  </p>
                )}
                <BuyUsdtButton
                  loading={buyUsdtLoading}
                  funding={fundingUsdtLoading}
                  disabled={!conversionRate || Number(buyUsdtAmount) < MIN_USDT_PURCHASE || !Number.isFinite(Number(buyUsdtAmount))}
                  onClick={canConvertToUsdt ? handleBuyUsdt : handleFundUsdtShortfall}
                  label={canConvertToUsdt ? 'Buy USDT' : 'Deposit'}
                />
              </div>
            ) : walletAction === 'sell' ? (
              <div className="space-y-5 p-5 sm:p-7">
                <div className="border-b border-slate-200 pb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Wallet action</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">Sell USDT</h2>
                  <p className="mt-2 text-sm text-slate-600">Convert USDT into your {selectedCollectionCurrency} wallet at the current exchange rate.</p>
                </div>
                <ExchangeRulesTable
                  sourceCurrency={selectedCollectionCurrency}
                  rate={sellUsdtRate}
                  showReserve={false}
                  mode="sell"
                  isKorean={isKoreanWallet}
                />
                <div className="space-y-2">
                  <Label htmlFor="sell-usdt-amount">USDT amount</Label>
                  <Input
                    id="sell-usdt-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={sellAmount}
                    onChange={event => setSellAmount(event.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleSellUsdt}
                  disabled={buyUsdtLoading || !sellUsdtRate || !Number(sellAmount) || Number(sellAmount) > getWalletBalanceValue(usdtBalance, 'available_balance')}
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
                        <li>수취 은행에 <strong>{krwBankName || 'Toss Bank'}</strong>, SWIFT/BIC에 <strong>TVBKVVTTXXX</strong>를 입력하세요.</li>
                        <li>수취인에 <strong>{krwAccountHolderName || 'SwiftPay Ventures Inc.'}</strong>, 계좌번호에 <strong>1908-1618-8260</strong>을 입력하세요.</li>
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
                                <p className="mt-2 font-mono font-semibold text-foreground">TVBKVVTTXXX</p>
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
                      currency={selectedCollectionCurrency}
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
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">{isKrwFlow ? '금액' : `Amount (${currencySymbols[selectedCollectionCurrency] || selectedCollectionCurrency})`}</Label>
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
                          {isKrwFlow ? '사용 가능 잔액' : 'Available'}: <span className="text-blue-700">{formatWalletCurrency(getAvailableBalance(collectionBalance), selectedCollectionCurrency)}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">{isKrwFlow ? '은행' : 'Bank'}</Label>
                      <Select value={wrBank} onValueChange={(val) => {
                        setWrBank(val);
                        const b = bankList.find(x => x.code === val);
                        if (b) setWrBankName(b.name);
                      }}>
                        <SelectTrigger className="bg-slate-50 border-slate-200 text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                          <SelectValue placeholder={isKrwFlow ? '은행을 선택하세요' : 'Select bank…'} />
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
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">{isKrwFlow ? '계좌번호' : 'Account Number'}</Label>
                      <Input
                        placeholder="1234567890"
                        value={wrAccount}
                        onChange={e => setWrAccount(e.target.value)}
                        className="bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">{isKrwFlow ? '예금주' : 'Account Holder Name'}</Label>
                      <Input
                        placeholder="Juan Dela Cruz"
                        value={wrName}
                        onChange={e => setWrName(e.target.value)}
                        className="bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    {!isKrwFlow && (
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
                    )}
                    <div className="sm:col-span-2">
                      <Label className="text-xs font-semibold text-slate-700 block mb-2">{isKrwFlow ? '메모 (선택)' : 'Note (optional)'}</Label>
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
                    disabled={wrLoading || !wrAmount || !wrBank || !wrAccount || !wrName || (!isKrwFlow && !wrPhone)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-10 rounded-lg font-semibold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    data-wallet-dark-action="true"
                  >
                    {wrLoading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting Request...</>
                    ) : (
                      <><ArrowUpFromLine className="h-4 w-4 mr-2" />{withdrawSubmitLabel}</>
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
                    {(isKrwFlow ? KRW_BANKS : PH_BANKS_BY_NAME).map(bank => {
                      const metadata = PH_BANKS.find((entry) => entry.name === bank);
                      return (
                        <div key={bank} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                          <PaymentBrandLogo brand={bank} logoUrl={metadata?.logoUrl} size="sm" className="border-0 bg-transparent shadow-none p-0" />
                          <span className="truncate">{bank}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">{isKrwFlow ? '처리 기간:' : 'Processing time:'}</span> {isKrwFlow ? '영업일 기준 1~3일' : '1-3 business days'}
                    </p>
                    <p className="text-xs text-slate-600 mt-2">
                      <span className="font-semibold text-slate-700">{isKrwFlow ? '통화:' : 'Network:'}</span> {isKrwFlow ? 'KRW만 가능' : 'PHP only'}
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
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-10 rounded-lg font-semibold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    {isUsdt ? formatWalletCurrency(req.amount, 'USDT') : formatWalletCurrency(req.amount, 'PHP')}
                                  </p>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${st.bg} ${st.color}`}>
                                    {st.label}
                                  </span>
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
