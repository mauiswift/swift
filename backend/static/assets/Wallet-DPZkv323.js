const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/DepositWizard-DzupVwb4.js","assets/query-vendor-DuVr9DAU.js","assets/router-vendor-C2eKMart.js","assets/index-D7WzENaT.js","assets/ui-vendor-DsSOT9J9.js","assets/utils-vendor-B--1aD6k.js","assets/index-BwBb1VnE.css","assets/input-BJv7qs0g.js","assets/label-B-FJpQPs.js","assets/select-hv5GsK8T.js","assets/BankLogo-BgBPBc49.js","assets/krw-banks-B5PBJApF.js","assets/UsdtTopupWizard-Dcr7g7a-.js","assets/index-wGjaXQdC.js"])))=>i.map(i=>d[i]);
import { u as useAuth, a as useLanguage, f as useCollectionCurrency, g as client, b as ue, y as usePaymentEvents, F as AppLoadingScreen, L as Layout, e as Button, p as Card, v as CardContent, m as getCurrencyName, P as PaymentBrandLogo, q as CardHeader, s as CardTitle, o as getCurrencySymbol, c as authApi, h as fmtCurrency, _ as __vitePreload } from "./index-D7WzENaT.js";
import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { i as isPaymentChannelEnabled, f as fetchPaymentChannels } from "./paymentChannels-su6LRWP7.js";
import { a as reactExports, e as useNavigate, u as useLocation, d as React, L as Link } from "./router-vendor-C2eKMart.js";
/* empty css                         */
import { I as Input } from "./input-BJv7qs0g.js";
import { L as Label } from "./label-B-FJpQPs.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-hv5GsK8T.js";
import { T as Tabs, c as TabsContent } from "./tabs-BZ-218pw.js";
import { D as Dialog, a as DialogContent, c as DialogTitle, e as DialogDescription } from "./dialog-B4w7hwoh.js";
import { P as PH_BANKS, B as BankLogo, g as getBankDisplayName } from "./BankLogo-BgBPBc49.js";
import { g as getStatusType, S as StatusBadge } from "./StatusBadge-B3XGmY2k.js";
import { K as KRW_BANKS } from "./krw-banks-B5PBJApF.js";
import { W as Wallet, R as RefreshCw, r as Landmark, O as Crown, A as ArrowDownToLine, bj as ArrowUpFromLine, Y as Building2, S as Send, p as CircleAlert, z as LoaderCircle, B as Bitcoin, b as CreditCard, a3 as Globe, bk as WalletMinimal, aO as Clock, aj as Receipt } from "./utils-vendor-B--1aD6k.js";
import "./ui-vendor-DsSOT9J9.js";
const DepositWizard = React.lazy(() => __vitePreload(() => import("./DepositWizard-DzupVwb4.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11]) : void 0));
const UsdtTopupWizard = React.lazy(() => __vitePreload(() => import("./UsdtTopupWizard-Dcr7g7a-.js"), true ? __vite__mapDeps([12,1,2,13,3,4,5,6,7,8]) : void 0));
const USDT_PLATFORMS = [
  { code: "binance", name: "Binance" },
  { code: "trust_wallet", name: "Trust Wallet" },
  { code: "metamask", name: "MetaMask" },
  { code: "okx", name: "OKX" },
  { code: "bybit", name: "Bybit" },
  { code: "kucoin", name: "KuCoin" },
  { code: "gate_io", name: "Gate.io" },
  { code: "tronlink", name: "TronLink" },
  { code: "other", name: "Other / Custom" }
];
const DEPOSIT_DESTINATIONS = [
  { value: "Netbank", label: "Netbank", account_number: "041-105-00037-6", account_name: "Swift Technology Ventures Inc." }
];
const getWalletDepositDestinations = (currency, configuredAccounts) => {
  if (currency === "KRW") return configuredAccounts.filter((account) => account.currency === "KRW");
  return configuredAccounts.filter((account) => account.currency === currency);
};
DEPOSIT_DESTINATIONS.map((dest) => ({ value: dest.value, label: dest.label }));
const txnMeta = {
  deposit: { label: "Deposit", color: "text-blue-600", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownToLine, { className: "h-4 w-4" }), sign: "+" },
  withdraw: { label: "Withdrawal", color: "text-amber-600", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpFromLine, { className: "h-4 w-4" }), sign: "-" },
  receive: { label: "Received", color: "text-blue-600", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownToLine, { className: "h-4 w-4" }), sign: "+" },
  sent: { label: "Sent", color: "text-red-600", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }), sign: "-" },
  crypto_topup: { label: "Crypto Top Up", color: "text-blue-600", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Bitcoin, { className: "h-4 w-4" }), sign: "+" },
  usdt_send: { label: "USDT Withdrawal", color: "text-red-600", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }), sign: "-" },
  disbursement: { label: "Disbursement", color: "text-red-600", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }), sign: "-" },
  refund: { label: "Refund", color: "text-blue-600", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "h-4 w-4" }), sign: "+" },
  fee: { label: "Fee", color: "text-red-600", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "h-4 w-4" }), sign: "-" },
  admin_adjustment: { label: "Wallet Adjustment", color: "text-slate-600", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(WalletMinimal, { className: "h-4 w-4" }), sign: "+" }
};
const getTransactionType = (txn) => String(txn.transaction_type || txn.type || "").toLowerCase();
const getTransactionMeta = (txn) => {
  const type = getTransactionType(txn);
  if (["admin_debit", "conversion_out", "fee", "withdrawal_fee"].includes(type)) {
    return txnMeta[type === "admin_debit" || type === "conversion_out" ? "withdraw" : "fee"];
  }
  return txnMeta[txn.type] || txnMeta.deposit;
};
const fmtUsd = (n) => Number.isFinite(n) ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
const normalizeNumericValue = (value, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number.parseFloat(String(value ?? fallback));
  return Number.isFinite(parsed) ? parsed : fallback;
};
const dedupeRecords = (records) => {
  const seen = /* @__PURE__ */ new Set();
  return records.filter((record) => {
    const key = record.id != null ? `id:${record.id}` : record.reference_id ? `reference_id:${record.reference_id}` : record.reference ? `reference:${record.reference}` : null;
    if (!key || seen.has(key)) return !key;
    seen.add(key);
    return true;
  });
};
const formatWalletCurrency = (amount, currency) => {
  return fmtCurrency(normalizeNumericValue(amount, 0), currency);
};
const getWalletBalanceValue = (wallet, field) => normalizeNumericValue((wallet == null ? void 0 : wallet[field]) ?? (wallet == null ? void 0 : wallet.balance) ?? 0);
const getAvailableBalance = (wallet) => {
  const available = getWalletBalanceValue(wallet, "available_balance");
  const balance = getWalletBalanceValue(wallet, "balance");
  const pending = normalizeNumericValue(wallet == null ? void 0 : wallet.pending_balance, 0);
  return available > 0 || balance <= 0 ? available : Math.max(0, balance - pending);
};
function BuyUsdtIcon({ busy, className = "h-5 w-5" }) {
  return busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: `${className} animate-spin`, stroke: "#16a34a", strokeWidth: 2.5, "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: "USDT", size: "sm", className: `h-auto w-auto border-0 bg-transparent p-0 shadow-none ${className}` });
}
function BuyUsdtButton({ loading, funding, disabled, onClick, label, compact = false }) {
  const busy = loading || funding;
  const buttonLabel = loading ? "Processing..." : funding ? "Processing..." : label || "Buy USDT";
  if (compact) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        title: "Buy USDT",
        "aria-label": "Buy USDT",
        onClick,
        disabled: disabled || busy,
        className: "flex h-10 w-full min-w-0 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-1 text-slate-900 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BuyUsdtIcon, { busy, className: "h-5 w-5 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold leading-none text-slate-900", children: "BUY" })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Button,
    {
      type: "button",
      title: "Buy USDT",
      "aria-label": "Buy USDT",
      onClick,
      disabled: disabled || busy,
      className: "w-full rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-50",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex h-5 w-5 shrink-0 items-center justify-center", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BuyUsdtIcon, { busy }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: buttonLabel })
      ]
    }
  );
}
const getUsdtConversionSummary = (_collectionCurrency, phpBalance, collectionBalance, usdtPhpRate, requestedUsdtAmount, conversionFeeRate = 0.01, minimumPurchase = 0) => {
  const sourceCurrency = "PHP";
  const sourceWallet = phpBalance;
  const availableSource = getAvailableBalance(sourceWallet);
  const retainedBalance = 0;
  const conversionRate = usdtPhpRate;
  const convertibleSource = Math.max(availableSource - retainedBalance, 0);
  const safeRequestedAmount = Number.isFinite(requestedUsdtAmount) ? requestedUsdtAmount : 0;
  const requiredSource = conversionRate && safeRequestedAmount > 0 ? safeRequestedAmount / (conversionRate * (1 - conversionFeeRate)) : 0;
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
    canConvert: safeRequestedAmount >= minimumPurchase && Boolean(conversionRate) && convertibleSource >= requiredSource,
    shortfallSource: Math.max(requiredSource - convertibleSource, 0)
  };
};
function ExchangeRulesTable({ sourceCurrency, rate, showReserve, mode, feeRate = 0.01, isKorean }) {
  const displayRate = rate && mode === "buy" ? 1 / rate : rate;
  const rateLabel = displayRate ? `1 USDT = ${formatWalletCurrency(displayRate, sourceCurrency)}` : isKorean ? "사용할 수 없음" : "Unavailable";
  const feeAmountLabel = isKorean ? `환전 금액의 ${(feeRate * 100).toFixed(2)}%` : `${(feeRate * 100).toFixed(2)}% of converted value`;
  const minimumLabel = mode === "buy" ? "100 USDT" : isKorean ? "최소 금액 없음" : "No minimum";
  const reserveLabel = isKorean ? "추가 보유금 없음" : "No additional reserve";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-slate-200 bg-slate-50 px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-slate-900", children: isKorean ? "환전 안내" : "Exchange details" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "w-full text-left text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-slate-100", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { scope: "row", className: "w-1/2 px-4 py-3 font-medium text-slate-500", children: isKorean ? "환율" : "Rate" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-semibold text-slate-900", children: rateLabel })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { scope: "row", className: "px-4 py-3 font-medium text-slate-500", children: isKorean ? "환전 수수료" : "Exchange fee" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-semibold text-slate-900", children: feeAmountLabel })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { scope: "row", className: "px-4 py-3 font-medium text-slate-500", children: isKorean ? "최소 금액" : "Minimum" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-semibold text-slate-900", children: minimumLabel })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { scope: "row", className: "px-4 py-3 font-medium text-slate-500", children: isKorean ? "지갑 규칙" : "Wallet rule" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-semibold text-slate-900", children: reserveLabel })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { scope: "row", className: "px-4 py-3 font-medium text-slate-500", children: isKorean ? "받는 금액" : "You receive" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-semibold text-slate-900", children: isKorean ? "수수료 차감 후 금액" : "Amount after fee" })
      ] })
    ] }) })
  ] });
}
const getTransactionLabel = (txn, isKorean = false) => {
  const type = getTransactionType(txn);
  if (type === "admin_credit") return isKorean ? "USDT 충전" : "Automated wallet funding";
  if (type === "admin_debit") return isKorean ? "보안 지갑 조정" : "Secure wallet adjustment";
  if (type === "admin_adjustment") return isKorean ? "시스템 지갑 조정" : "System balance adjustment";
  if (type === "conversion_in") return isKorean ? "환전 입금" : "Currency purchase";
  if (type === "conversion_out") return isKorean ? "환전 출금" : "Currency sale";
  if (["fee", "withdrawal_fee"].includes(type)) return isKorean ? "수수료" : "Fee";
  if (["payment_link", "invoice", "checkout", "magpie_checkout", "zip_checkout"].includes(type)) {
    const isKrwTransaction = String(txn.currency || "").toUpperCase() === "KRW" || !txn.currency && isKorean;
    return isKrwTransaction ? "지불" : "Payment";
  }
  if (["payment", "qrph_payment"].includes(type)) {
    return isKorean ? "결제" : "Payment";
  }
  if (["top_up", "topup", "deposit", "crypto_topup"].includes(type)) {
    return isKorean ? "입금" : "Deposit";
  }
  return isKorean ? "거래" : "Transaction";
};
const getTransactionStatusLabel = (status, isKorean = false) => {
  const normalized = String(status || "").toLowerCase();
  if (["failed", "rejected", "expired", "cancelled"].includes(normalized)) {
    return isKorean ? "실패" : "Failed";
  }
  if (["completed", "paid", "executed"].includes(normalized)) {
    return isKorean ? "성공" : "Successful";
  }
  return isKorean ? "처리 중" : "Processing";
};
const normalizeWalletTransaction = (item) => {
  const backendType = getTransactionType(item);
  const type = ["top_up", "topup", "deposit"].includes(backendType) ? "deposit" : ["withdrawal", "withdraw"].includes(backendType) ? "withdraw" : backendType === "send" ? "sent" : ["fee", "withdrawal_fee"].includes(backendType) ? "fee" : backendType === "conversion_in" ? "receive" : backendType === "conversion_out" ? "withdraw" : ["admin_credit", "admin_debit", "admin_adjustment"].includes(backendType) ? "admin_adjustment" : item.type || backendType;
  return { ...item, type };
};
const WalletTransactionHistory = ({ currency, transactions, loading, error, onRetry, isKorean }) => {
  const safeTransactions = reactExports.useMemo(
    () => dedupeRecords(Array.isArray(transactions) ? transactions.filter(Boolean) : []),
    [transactions]
  );
  const recentTransactions = safeTransactions.slice(0, 5);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "payment-workspace payment-workspace__history bg-white border border-slate-200 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm font-semibold text-foreground flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "h-4 w-4 text-slate-600" }),
      isKorean ? `${currency} 최근 거래 내역` : `Recent ${currency} transactions`
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-3 rounded-lg bg-slate-50 animate-pulse", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 rounded-lg bg-slate-200 shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 bg-slate-200 rounded w-1/3" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2.5 bg-slate-200 rounded w-1/4" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-20 bg-slate-200 rounded" })
    ] }, i)) }) : error ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "alert", className: "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "Unable to load ",
        currency,
        " transaction history."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: onRetry, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
        " Retry"
      ] })
    ] }) : safeTransactions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "h-8 w-8 text-slate-300 mx-auto mb-2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-foreground", children: isKorean ? `${currency} 거래 내역이 없습니다` : `No ${currency} transactions yet` })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "wallet-transaction-header grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-3 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: isKorean ? "거래 종류" : "Transaction" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: isKorean ? "날짜 및 시간" : "Date and time" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: isKorean ? "금액" : "Amount" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: isKorean ? "상태" : "Status" })
      ] }),
      recentTransactions.map((txn) => {
        if (!txn) return null;
        const transactionAmount = normalizeNumericValue(txn.amount, 0);
        const meta = getTransactionMeta(txn);
        const paymentDetailsUrl = txn.payment_transaction_id ? `/payments/${encodeURIComponent(String(txn.payment_transaction_id))}` : null;
        const rowContent = /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "wallet-transaction-row grid w-full items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-xs font-semibold text-foreground", children: getTransactionLabel(txn, isKorean) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-nowrap text-[11px] text-slate-500", children: txn.created_at ? new Date(txn.created_at).toLocaleString(isKorean ? "ko-KR" : "en-PH") : "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `whitespace-nowrap text-xs font-semibold ${meta.color}`, children: [
            meta.sign,
            formatWalletCurrency(Math.abs(transactionAmount), txn.currency || currency)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `whitespace-nowrap text-xs font-semibold ${["failed", "rejected", "expired", "cancelled"].includes(String(txn.status || "").toLowerCase()) ? "text-red-600" : ["completed", "paid", "executed"].includes(String(txn.status || "").toLowerCase()) ? "text-emerald-600" : "text-amber-600"}`, children: getTransactionStatusLabel(txn.status, isKorean) })
        ] });
        return paymentDetailsUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: paymentDetailsUrl,
            title: isKorean ? "결제 상태 및 상세 정보 보기" : "View payment status and details",
            className: "block rounded-lg border border-transparent p-3 transition-colors hover:border-slate-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            children: rowContent
          },
          txn.id
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-transparent p-3", children: rowContent }, txn.id);
      })
    ] }) })
  ] });
};
function WalletPage({ cryptoOnly = false }) {
  var _a;
  const [vipGold, setVipGold] = reactExports.useState(false);
  const { user, platformBranding, loading: authLoading, isSuperAdmin } = useAuth();
  const { language } = useLanguage();
  const isKoreanWallet = language === "ko";
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = reactExports.useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [phpBalance, setPhpBalance] = reactExports.useState(null);
  const [usdtBalance, setUsdtBalance] = reactExports.useState(null);
  const [organizationWalletBalance, setOrganizationWalletBalance] = reactExports.useState(null);
  const [organizationWalletLoadError, setOrganizationWalletLoadError] = reactExports.useState(false);
  const { collectionCurrency } = useCollectionCurrency();
  const selectedCollectionCurrency = String(collectionCurrency || "PHP").toUpperCase();
  const [collectionBalance, setCollectionBalance] = reactExports.useState(null);
  const [phpTransactions, setPhpTransactions] = reactExports.useState([]);
  const [usdtTransactions, setUsdtTransactions] = reactExports.useState([]);
  const [collectionTransactions, setCollectionTransactions] = reactExports.useState([]);
  const [transactions, setTransactions] = reactExports.useState([]);
  const [withdrawRequests, setWithdrawRequests] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [balanceLoadErrors, setBalanceLoadErrors] = reactExports.useState([]);
  const [transactionLoadErrors, setTransactionLoadErrors] = reactExports.useState([]);
  const [withdrawRequestsLoadError, setWithdrawRequestsLoadError] = reactExports.useState(false);
  const [bankOptions, setBankOptions] = reactExports.useState([]);
  const [usdtPhpRate, setUsdtPhpRate] = reactExports.useState(null);
  const [usdtRateSource, setUsdtRateSource] = reactExports.useState("");
  const [buyUsdtRate, setBuyUsdtRate] = reactExports.useState(null);
  const [conversionFeeRate, setConversionFeeRate] = reactExports.useState(0.01);
  const [sellUsdtRate, setSellUsdtRate] = reactExports.useState(null);
  const [buyUsdtLoading, setBuyUsdtLoading] = reactExports.useState(false);
  const buyTradeKeyRef = reactExports.useRef(null);
  const sellTradeKeyRef = reactExports.useRef(null);
  const [fundingUsdtLoading, setFundingUsdtLoading] = reactExports.useState(false);
  const [depositAccounts, setDepositAccounts] = reactExports.useState(DEPOSIT_DESTINATIONS.map((account) => ({ ...account, currency: "PHP" })));
  const [assignedKrwAccount, setAssignedKrwAccount] = reactExports.useState(null);
  const [krwBankName, setKrwBankName] = reactExports.useState("");
  const [krwAccountHolderName, setKrwAccountHolderName] = reactExports.useState("");
  const isKrwFlow = selectedCollectionCurrency === "KRW";
  const canTradeUsdtForPhp = selectedCollectionCurrency === "PHP";
  const tx = (en, ko, zh) => language === "zh" ? en : language === "en" ? en : ko;
  const sharedWalletIsPrimary = Boolean(
    !cryptoOnly && !isSuperAdmin && (user == null ? void 0 : user.organization_id) && ((_a = user.permissions) == null ? void 0 : _a.can_manage_wallet)
  );
  const primaryWalletBalance = sharedWalletIsPrimary ? organizationWalletBalance : collectionBalance;
  const primaryWalletUnavailable = sharedWalletIsPrimary ? organizationWalletLoadError || !organizationWalletBalance : balanceLoadErrors.includes("collection") || !collectionBalance;
  reactExports.useEffect(() => {
    if (!(user == null ? void 0 : user.id)) return;
    client.get("/api/v1/team/vip-status").then((response) => {
      var _a2;
      setVipGold(Boolean((_a2 = response.data) == null ? void 0 : _a2.vip_gold));
    }).catch(() => {
      setVipGold(false);
    });
  }, [user == null ? void 0 : user.id]);
  reactExports.useEffect(() => {
    if (!(user == null ? void 0 : user.id)) return;
    client.get(`/api/v1/users/${user.id}/toss-virtual-account`).then((response) => {
      var _a2, _b;
      setKrwBenefitsUnlocked(Boolean(response.ok && ((_b = (_a2 = response.data) == null ? void 0 : _a2.benefits) == null ? void 0 : _b.unlocked)));
    }).catch(() => setKrwBenefitsUnlocked(false));
  }, [user == null ? void 0 : user.id]);
  const walletDepositDestinations = reactExports.useMemo(
    () => isKrwFlow && assignedKrwAccount ? [assignedKrwAccount] : getWalletDepositDestinations(selectedCollectionCurrency, depositAccounts),
    [selectedCollectionCurrency, depositAccounts, isKrwFlow, assignedKrwAccount]
  );
  const walletTitle = cryptoOnly ? tx("Cryptocurrency", "암호화폐") : tx("Wallet", "지갑");
  const walletSubtitle = cryptoOnly ? tx("Manage your USDT balance, buy and sell cryptocurrency, send funds, and review crypto activity.", "USDT 잔액을 관리하고, 암호화폐를 사고 팔고, 자금을 보내고, 거래 활동을 확인하세요.") : tx(`Manage ${selectedCollectionCurrency} and USDT balances, fund your account, submit withdrawals, and track activity`, "KRW 및 USDT 잔액을 관리하고, 자금을 충전하고, 출금 및 거래 내역을 확인하세요.");
  const collectionWalletLabel = sharedWalletIsPrimary ? tx("Shared organization wallet", "공유 조직 지갑") : tx(`${selectedCollectionCurrency} Wallet`, `${selectedCollectionCurrency} 지갑`);
  const fundWalletTitle = tx("Fund Wallet via bank transfer", "은행 계좌이체로 자금 충전");
  const withdrawBankTitle = tx("Withdraw PHP by Bank Transfer", "출금");
  const withdrawSubmitLabel = isKrwFlow ? tx("Withdraw", "출금") : tx(`Withdraw ${selectedCollectionCurrency}`, `출금 ${selectedCollectionCurrency}`);
  const rateLabel = tx("Current Rate", "현재 환율");
  const usdtWalletLabel = tx("Your USDT Wallet", "내 USDT 지갑");
  const [depositAmount, setDepositAmount] = reactExports.useState("");
  const [depositChannel, setDepositChannel] = reactExports.useState("Netbank");
  const [depositMethod, setDepositMethod] = reactExports.useState("same_bank");
  const [depositRefNumber, setDepositRefNumber] = reactExports.useState("");
  const [depositNotes, setDepositNotes] = reactExports.useState("");
  const [depositReceipt, setDepositReceipt] = reactExports.useState(null);
  const [depositDate, setDepositDate] = reactExports.useState("");
  const [depositLoading, setDepositLoading] = reactExports.useState(false);
  const [wrAmount, setWrAmount] = reactExports.useState("");
  const [wrBank, setWrBank] = reactExports.useState("");
  const [wrBankName, setWrBankName] = reactExports.useState("");
  const [wrAccount, setWrAccount] = reactExports.useState("");
  const [wrName, setWrName] = reactExports.useState("");
  const [wrPhone, setWrPhone] = reactExports.useState("");
  const [wrNote, setWrNote] = reactExports.useState("");
  const [wrLoading, setWrLoading] = reactExports.useState(false);
  const [usdtAmount, setUsdtAmount] = reactExports.useState("");
  const [usdtAddress, setUsdtAddress] = reactExports.useState("");
  const [usdtPlatform, setUsdtPlatform] = reactExports.useState("");
  const [usdtLoading, setUsdtLoading] = reactExports.useState(false);
  const [topupAmount, setTopupAmount] = reactExports.useState("");
  const [topupNote, setTopupNote] = reactExports.useState("");
  const [topupLoading, setTopupLoading] = reactExports.useState(false);
  const [showUsdtTopupWizard, setShowUsdtTopupWizard] = reactExports.useState(false);
  const [walletAction, setWalletAction] = reactExports.useState(null);
  const [walletFrozenDialogOpen, setWalletFrozenDialogOpen] = reactExports.useState(false);
  const [accountActivationDialogOpen, setAccountActivationDialogOpen] = reactExports.useState(false);
  const [krwBenefitsUnlocked, setKrwBenefitsUnlocked] = reactExports.useState(false);
  const [buyUsdtAmount, setBuyUsdtAmount] = reactExports.useState("");
  const [sellAmount, setSellAmount] = reactExports.useState("");
  const [paymentChannels, setPaymentChannels] = reactExports.useState(null);
  const showFiatActionRow = isPaymentChannelEnabled(paymentChannels, selectedCollectionCurrency, "withdrawal", "bank_transfer");
  const frozenWallet = (usdtBalance == null ? void 0 : usdtBalance.is_frozen) ? usdtBalance : (collectionBalance == null ? void 0 : collectionBalance.is_frozen) ? collectionBalance : (phpBalance == null ? void 0 : phpBalance.is_frozen) ? phpBalance : null;
  const walletFreezeCurrency = (frozenWallet == null ? void 0 : frozenWallet.currency) || selectedCollectionCurrency;
  const walletFreezeReason = frozenWallet == null ? void 0 : frozenWallet.freeze_reason;
  const ensureWalletIsOperational = reactExports.useCallback((currency, actionLabel) => {
    const normalizedCurrency = String(currency || "").toUpperCase();
    const usesCollectionBalance = normalizedCurrency === selectedCollectionCurrency;
    const frozenBalance = usesCollectionBalance ? collectionBalance : normalizedCurrency === "USDT" ? usdtBalance : phpBalance;
    if (!frozenBalance) {
      ue.error(tx(`Unable to verify your ${normalizedCurrency} wallet balance. Refresh the page before ${actionLabel.toLowerCase()}.`, `${normalizedCurrency} 지갑 잔액을 확인할 수 없습니다. 페이지를 새로고침한 뒤 ${actionLabel.toLowerCase()}를 다시 시도하세요.`));
      return false;
    }
    if (frozenBalance == null ? void 0 : frozenBalance.is_frozen) {
      setWalletFrozenDialogOpen(true);
      ue.error(tx(`Your ${normalizedCurrency} wallet is frozen. ${actionLabel} is unavailable until it is unfrozen.`, `${normalizedCurrency} 지갑이 정지 상태입니다. ${actionLabel}는 해제될 때까지 사용할 수 없습니다.`));
      return false;
    }
    return true;
  }, [collectionBalance, phpBalance, selectedCollectionCurrency, usdtBalance]);
  const openBuyUsdt = () => {
    if (!canTradeUsdtForPhp) {
      ue.error(isKoreanWallet ? "USDT 거래는 PHP 지갑에서만 사용할 수 있습니다." : "USDT trading is available from the PHP wallet only.");
      return;
    }
    if (!ensureWalletIsOperational("USDT", "Buying USDT")) return;
    setWalletAction("buy");
  };
  const fetchData = reactExports.useCallback(async () => {
    var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
    if (!user) return;
    try {
      const selectedCurrency = selectedCollectionCurrency;
      const institutionCurrency = selectedCurrency === "KRW" ? "KRW" : "PHP";
      const [phpRes, usdtRes, collectionRes, phpTxnRes, usdtTxnRes, collectionTxnRes, banksRes, wrRes, rateRes, buyRateRes, sellRateRes, organizationWalletRes] = await Promise.allSettled([
        client.apiCall.invoke({ url: "/api/v1/wallet/balance?currency=PHP", method: "GET", data: {} }),
        client.apiCall.invoke({ url: "/api/v1/wallet/balance?currency=USDT", method: "GET", data: {} }),
        client.apiCall.invoke({ url: `/api/v1/wallet/balance?currency=${selectedCurrency}`, method: "GET", data: {} }),
        client.apiCall.invoke({ url: "/api/v1/wallet/transactions?currency=PHP&limit=20", method: "GET", data: {} }),
        client.apiCall.invoke({ url: "/api/v1/wallet/transactions?currency=USDT&limit=20", method: "GET", data: {} }),
        client.apiCall.invoke({ url: `/api/v1/wallet/transactions?currency=${selectedCurrency}&limit=20`, method: "GET", data: {} }),
        client.apiCall.invoke({ url: `/api/v1/swiftpay/institutions?currency=${institutionCurrency}`, method: "GET", data: {} }),
        client.apiCall.invoke({ url: "/api/v1/wallet/withdraw-requests", method: "GET", data: {} }),
        client.apiCall.invoke({ url: "/api/v1/topup/rate", method: "GET", data: {} }),
        client.apiCall.invoke({
          url: "/api/v1/wallet/quote",
          method: "POST",
          data: { from_currency: "PHP", to_currency: "USDT", from_amount: 1 }
        }),
        client.apiCall.invoke({
          url: "/api/v1/wallet/quote",
          method: "POST",
          data: { from_currency: "USDT", to_currency: "PHP", from_amount: 1 }
        }),
        user.organization_id && !cryptoOnly ? client.apiCall.invoke({
          url: `/api/v1/wallet/organization-balance?currency=${encodeURIComponent(selectedCurrency)}`,
          method: "GET",
          data: {}
        }) : Promise.resolve(null)
      ]);
      if (user.organization_id && !cryptoOnly) {
        const organizationData = organizationWalletRes.status === "fulfilled" ? (_a2 = organizationWalletRes.value) == null ? void 0 : _a2.data : null;
        if ((organizationData == null ? void 0 : organizationData.organization_id) === user.organization_id && organizationData.balance != null) {
          setOrganizationWalletBalance({
            organization_id: organizationData.organization_id,
            organization_name: organizationData.organization_name || user.organization_name,
            wallet_id: organizationData.wallet_id,
            balance: normalizeNumericValue(organizationData.balance),
            available_balance: normalizeNumericValue(organizationData.available_balance ?? organizationData.balance),
            pending_balance: normalizeNumericValue(organizationData.pending_balance ?? 0),
            currency: organizationData.currency || selectedCurrency
          });
          setOrganizationWalletLoadError(false);
        } else {
          if (organizationWalletRes.status === "rejected") {
            console.error("Organization wallet fetch error:", organizationWalletRes.reason);
          }
          setOrganizationWalletBalance(null);
          setOrganizationWalletLoadError(true);
        }
      } else {
        setOrganizationWalletBalance(null);
        setOrganizationWalletLoadError(false);
      }
      const failedBalances = [];
      if (phpRes.status === "fulfilled" && ((_c = (_b = phpRes.value) == null ? void 0 : _b.data) == null ? void 0 : _c.balance) != null) {
        setPhpBalance({
          balance: normalizeNumericValue(phpRes.value.data.balance),
          available_balance: normalizeNumericValue(phpRes.value.data.available_balance ?? phpRes.value.data.balance),
          pending_balance: normalizeNumericValue(phpRes.value.data.pending_balance ?? 0),
          currency: "PHP",
          is_frozen: Boolean(phpRes.value.data.is_frozen),
          freeze_reason: phpRes.value.data.freeze_reason ?? null
        });
      } else {
        setPhpBalance(null);
        failedBalances.push("php");
      }
      if (usdtRes.status === "fulfilled" && ((_e = (_d = usdtRes.value) == null ? void 0 : _d.data) == null ? void 0 : _e.balance) != null) {
        setUsdtBalance({
          balance: normalizeNumericValue(usdtRes.value.data.balance),
          available_balance: normalizeNumericValue(usdtRes.value.data.available_balance ?? usdtRes.value.data.balance),
          pending_balance: normalizeNumericValue(usdtRes.value.data.pending_balance ?? 0),
          currency: "USDT",
          is_frozen: Boolean(usdtRes.value.data.is_frozen),
          freeze_reason: usdtRes.value.data.freeze_reason ?? null
        });
      } else {
        setUsdtBalance(null);
        failedBalances.push("usdt");
      }
      if (collectionRes.status === "fulfilled" && ((_g = (_f = collectionRes.value) == null ? void 0 : _f.data) == null ? void 0 : _g.balance) != null) {
        setCollectionBalance({
          balance: normalizeNumericValue(collectionRes.value.data.balance),
          available_balance: normalizeNumericValue(collectionRes.value.data.available_balance ?? collectionRes.value.data.balance),
          pending_balance: normalizeNumericValue(collectionRes.value.data.pending_balance ?? 0),
          currency: selectedCurrency,
          is_frozen: Boolean(collectionRes.value.data.is_frozen),
          freeze_reason: collectionRes.value.data.freeze_reason ?? null
        });
      } else {
        setCollectionBalance(null);
        failedBalances.push("collection");
      }
      setBalanceLoadErrors([...new Set(failedBalances)]);
      const failedTransactions = [];
      if (phpTxnRes.status === "fulfilled" && Array.isArray((_i = (_h = phpTxnRes.value) == null ? void 0 : _h.data) == null ? void 0 : _i.items)) {
        setPhpTransactions(dedupeRecords(phpTxnRes.value.data.items.filter(Boolean).map(normalizeWalletTransaction)));
      } else {
        setPhpTransactions([]);
        failedTransactions.push("php");
      }
      if (usdtTxnRes.status === "fulfilled" && Array.isArray((_k = (_j = usdtTxnRes.value) == null ? void 0 : _j.data) == null ? void 0 : _k.items)) {
        setUsdtTransactions(dedupeRecords(usdtTxnRes.value.data.items.filter(Boolean).map(normalizeWalletTransaction)));
      } else {
        setUsdtTransactions([]);
        failedTransactions.push("usdt");
      }
      if (collectionTxnRes.status === "fulfilled" && Array.isArray((_m = (_l = collectionTxnRes.value) == null ? void 0 : _l.data) == null ? void 0 : _m.items)) {
        setCollectionTransactions(dedupeRecords(collectionTxnRes.value.data.items.filter(Boolean).map(normalizeWalletTransaction)));
      } else {
        setCollectionTransactions([]);
        failedTransactions.push("collection");
      }
      setTransactionLoadErrors(failedTransactions);
      const fallbackKrwBanks = () => setBankOptions(KRW_BANKS);
      const bankPayload = banksRes.status === "fulfilled" ? Array.isArray((_o = (_n = banksRes.value) == null ? void 0 : _n.data) == null ? void 0 : _o.data) ? banksRes.value.data.data : Array.isArray((_q = (_p = banksRes.value) == null ? void 0 : _p.data) == null ? void 0 : _q.banks) ? banksRes.value.data.banks : [] : [];
      if (Array.isArray(bankPayload) && bankPayload.length > 0) {
        setBankOptions(bankPayload.filter(Boolean));
      } else if (selectedCurrency === "KRW") {
        fallbackKrwBanks();
      } else if (selectedCurrency === "PHP") {
        setBankOptions(PH_BANKS);
      }
      if (wrRes.status === "fulfilled" && Array.isArray((_s = (_r = wrRes.value) == null ? void 0 : _r.data) == null ? void 0 : _s.requests)) {
        setWithdrawRequests(dedupeRecords(wrRes.value.data.requests.filter(Boolean).map((request) => ({
          ...request,
          bank_name: request.bank_name || request.bank_code || "Bank",
          request_type: request.request_type || (request.currency === "USD" ? "usdt_trc20" : "php_bank")
        }))));
        setWithdrawRequestsLoadError(false);
      } else {
        setWithdrawRequests([]);
        setWithdrawRequestsLoadError(true);
      }
      if (rateRes.status === "fulfilled" && ((_u = (_t = rateRes.value) == null ? void 0 : _t.data) == null ? void 0 : _u.usdt_php_rate) != null) {
        setUsdtPhpRate(rateRes.value.data.usdt_php_rate);
        setUsdtRateSource(rateRes.value.data.source || "Standard SwiftPay rate");
      }
      if (buyRateRes.status === "fulfilled" && ((_w = (_v = buyRateRes.value) == null ? void 0 : _v.data) == null ? void 0 : _w.rate) != null) {
        setBuyUsdtRate(normalizeNumericValue(buyRateRes.value.data.rate));
        if (buyRateRes.value.data.fee_rate != null) {
          setConversionFeeRate(normalizeNumericValue(buyRateRes.value.data.fee_rate));
        }
      } else {
        setBuyUsdtRate(null);
      }
      if (sellRateRes.status === "fulfilled" && ((_y = (_x = sellRateRes.value) == null ? void 0 : _x.data) == null ? void 0 : _y.rate) != null) {
        setSellUsdtRate(normalizeNumericValue(sellRateRes.value.data.rate));
      } else {
        setSellUsdtRate(null);
      }
    } catch (err) {
      console.error("Wallet fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, selectedCollectionCurrency, cryptoOnly]);
  const handleLiveWalletUpdate = reactExports.useCallback(() => {
    void fetchData();
  }, [fetchData]);
  const { connected: walletEventsConnected } = usePaymentEvents({
    enabled: Boolean(user),
    pollInterval: 5e3,
    onWalletUpdate: handleLiveWalletUpdate
  });
  const minimumUsdtPurchase = 0;
  const usdtConversion = getUsdtConversionSummary(
    selectedCollectionCurrency,
    phpBalance,
    collectionBalance,
    buyUsdtRate,
    Number(buyUsdtAmount),
    conversionFeeRate,
    minimumUsdtPurchase
  );
  reactExports.useEffect(() => {
    fetchPaymentChannels().then(setPaymentChannels).catch(() => void 0);
  }, []);
  const handleBuyUsdt = async () => {
    var _a2, _b, _c;
    const requestedUsdtAmount = Number(buyUsdtAmount);
    if (!Number.isFinite(requestedUsdtAmount) || requestedUsdtAmount <= 0 || !usdtConversion.conversionRate || usdtConversion.requiredSource <= 0 || usdtConversion.convertibleSource < usdtConversion.requiredSource || buyUsdtLoading || fundingUsdtLoading) return;
    if (!ensureWalletIsOperational("USDT", "Buying USDT")) return;
    setBuyUsdtLoading(true);
    try {
      const passkeyCredential = await authApi.verifyPasskey("usdt_trade");
      const idempotencyKey = buyTradeKeyRef.current || crypto.randomUUID();
      buyTradeKeyRef.current = idempotencyKey;
      const response = await client.apiCall.invoke({
        url: "/api/v1/wallet/convert",
        method: "POST",
        data: {
          from_currency: usdtConversion.sourceCurrency,
          to_currency: "USDT",
          from_amount: usdtConversion.requiredSource,
          passkey_credential: passkeyCredential,
          idempotency_key: idempotencyKey
        }
      });
      if (!((_a2 = response == null ? void 0 : response.data) == null ? void 0 : _a2.success)) {
        throw new Error(((_b = response == null ? void 0 : response.data) == null ? void 0 : _b.detail) || ((_c = response == null ? void 0 : response.data) == null ? void 0 : _c.message) || "Conversion failed");
      }
      const receivedUsdt = Number(response.data.provider_amount ?? response.data.to_amount);
      const receivedLabel = Number.isFinite(receivedUsdt) && receivedUsdt > 0 ? fmtUsd(receivedUsdt) : fmtUsd(response.data.to_amount);
      ue.success(`Bought ${receivedLabel} USDT for ${formatWalletCurrency(usdtConversion.requiredSource, usdtConversion.sourceCurrency)}`);
      await fetchData();
      setWalletAction(null);
      buyTradeKeyRef.current = null;
    } catch (err) {
      ue.error((err == null ? void 0 : err.message) || "Unable to buy USDT");
    } finally {
      setBuyUsdtLoading(false);
    }
  };
  const handleSellUsdt = async () => {
    var _a2, _b, _c;
    const amount = Number(sellAmount);
    const availableUsdt = getWalletBalanceValue(usdtBalance, "available_balance");
    if (!Number.isFinite(amount) || amount <= 0 || amount > availableUsdt || !sellUsdtRate || !canTradeUsdtForPhp || buyUsdtLoading) return;
    if (!ensureWalletIsOperational("USDT", "Selling USDT") || !ensureWalletIsOperational(selectedCollectionCurrency, "Selling USDT")) return;
    setBuyUsdtLoading(true);
    try {
      const passkeyCredential = await authApi.verifyPasskey("usdt_trade");
      const idempotencyKey = sellTradeKeyRef.current || crypto.randomUUID();
      sellTradeKeyRef.current = idempotencyKey;
      const response = await client.apiCall.invoke({
        url: "/api/v1/wallet/convert",
        method: "POST",
        data: {
          from_currency: "USDT",
          to_currency: "PHP",
          from_amount: amount,
          passkey_credential: passkeyCredential,
          idempotency_key: idempotencyKey
        }
      });
      if (!((_a2 = response == null ? void 0 : response.data) == null ? void 0 : _a2.success)) {
        throw new Error(((_b = response == null ? void 0 : response.data) == null ? void 0 : _b.detail) || ((_c = response == null ? void 0 : response.data) == null ? void 0 : _c.message) || "Conversion failed");
      }
      ue.success(`Converted ${fmtUsd(amount)} USDT to ${formatWalletCurrency(response.data.to_amount, "PHP")}`);
      setSellAmount("");
      await fetchData();
      setWalletAction(null);
      sellTradeKeyRef.current = null;
    } catch (err) {
      ue.error((err == null ? void 0 : err.message) || "Unable to sell USDT");
    } finally {
      setBuyUsdtLoading(false);
    }
  };
  const handleFundUsdtShortfall = async () => {
    var _a2, _b, _c, _d, _e;
    if (!usdtConversion.conversionRate || usdtConversion.requestedUsdtAmount <= 0 || fundingUsdtLoading || buyUsdtLoading) return;
    const shortfall = usdtConversion.shortfallSource;
    if (shortfall <= 0) {
      await handleBuyUsdt();
      return;
    }
    setFundingUsdtLoading(true);
    try {
      const referenceNo = `USDT-FUND-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const isKrwCheckout = usdtConversion.sourceCurrency === "KRW";
      const response = await client.apiCall.invoke({
        url: isKrwCheckout ? "/api/v1/paymentwall/create-payment" : "/api/v1/swiftpay/create-order",
        method: "POST",
        data: {
          amount: Number(shortfall.toFixed(2)),
          currency: usdtConversion.sourceCurrency,
          ...isKrwCheckout ? { reference_id: referenceNo } : { reference_no: referenceNo },
          description: `Fund USDT purchase shortfall (${usdtConversion.requestedUsdtAmount} USDT)`,
          customer_name: (user == null ? void 0 : user.name) || "Customer",
          details: {
            source: "usdt_purchase_shortfall",
            required_usdt: usdtConversion.requestedUsdtAmount,
            eligible_balance: usdtConversion.convertibleSource,
            shortfall_balance: shortfall
          }
        }
      });
      const payload = ((_a2 = response == null ? void 0 : response.data) == null ? void 0 : _a2.data) || (response == null ? void 0 : response.data) || {};
      const redirectUrl = payload.customerRedirectUrl || payload.customer_redirect_url || payload.payment_url || payload.checkout_url || ((_b = response == null ? void 0 : response.data) == null ? void 0 : _b.redirect_url);
      if (!((_c = response == null ? void 0 : response.data) == null ? void 0 : _c.success) || !redirectUrl) {
        throw new Error(((_d = response == null ? void 0 : response.data) == null ? void 0 : _d.detail) || ((_e = response == null ? void 0 : response.data) == null ? void 0 : _e.message) || "Unable to create deposit checkout");
      }
      window.location.assign(redirectUrl);
    } catch (err) {
      ue.error((err == null ? void 0 : err.message) || "Unable to open deposit checkout");
    } finally {
      setFundingUsdtLoading(false);
    }
  };
  reactExports.useEffect(() => {
    if (!user) return;
    client.get("/api/v1/bank-deposits/accounts").then((bankRes) => {
      var _a2;
      if (bankRes.ok && Array.isArray((_a2 = bankRes.data) == null ? void 0 : _a2.accounts)) {
        const accounts = bankRes.data.accounts;
        setDepositAccounts(accounts);
        const krwAccount = accounts.find((account) => account.currency === "KRW") || null;
        setAssignedKrwAccount(krwAccount);
        setKrwBankName((krwAccount == null ? void 0 : krwAccount.label) || "");
        setKrwAccountHolderName((krwAccount == null ? void 0 : krwAccount.account_name) || "");
      }
    }).catch(() => void 0);
    fetchData();
  }, [user, selectedCollectionCurrency, fetchData]);
  const [activeTab, setActiveTab] = reactExports.useState(cryptoOnly ? "usdt" : "fund");
  reactExports.useEffect(() => {
    const action = searchParams.get("action");
    if (action === "topup") {
      setActiveTab(cryptoOnly ? "usdt" : "fund");
    } else if (action === "withdraw") {
      setActiveTab("php");
    }
  }, [searchParams]);
  reactExports.useEffect(() => {
    if (isKrwFlow && krwAccountHolderName && !wrName) {
      setWrName(krwAccountHolderName);
    }
  }, [isKrwFlow, krwAccountHolderName, wrName]);
  reactExports.useEffect(() => {
    setActiveTab("fund");
    setShowUsdtTopupWizard(false);
    setWalletAction(null);
    setWrAmount("");
    setWrBank("");
    setWrBankName("");
    setUsdtAmount("");
    setBankOptions([]);
  }, [selectedCollectionCurrency]);
  const validateBankWithdraw = (amount) => {
    if (isNaN(amount) || amount <= 0) return "Enter a valid amount";
    if (!wrBank) return "Select a bank";
    if (!wrAccount.trim()) return "Enter account number";
    if (!wrName.trim()) return "Enter account holder name";
    if (!isKrwFlow && !/^((\+?63|0)9\d{9})$/.test(wrPhone.replace(/[\s()-]/g, ""))) return "Enter a valid Philippine mobile number";
    String(selectedCollectionCurrency || "PHP").toUpperCase();
    const available = getAvailableBalance(collectionBalance);
    if (amount > available) return "Contact your Relationship Manager.";
    return null;
  };
  const validateUsdtWithdraw = (amount) => {
    if (isNaN(amount) || amount <= 0) return "Enter a valid USDT amount";
    if (amount < 10) return "Minimum amount is 10 USDT";
    if (!usdtAddress.trim()) return "Enter your USDT address";
    if (!usdtPlatform) return "Select which platform your address belongs to";
    const availableUsdt = getAvailableBalance(usdtBalance);
    if (amount > availableUsdt) return "Contact your Relationship Manager.";
    if (!usdtAddress.startsWith("T") || usdtAddress.length !== 34) {
      return "Invalid USDT address (must start with T and be 34 characters)";
    }
    return null;
  };
  const handleTopupRequest = async () => {
    var _a2, _b;
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) {
      ue.error("Enter a valid PHP amount");
      return;
    }
    setTopupLoading(true);
    try {
      const res = await client.apiCall.invoke({
        url: "/api/v1/topup/swiftpay",
        method: "POST",
        data: { amount, currency: "PHP" }
      });
      if (((_a2 = res.data) == null ? void 0 : _a2.success) && ((_b = res.data) == null ? void 0 : _b.redirect_url)) {
        ue.success("Redirecting to SwiftPay...");
        window.location.href = res.data.redirect_url;
      } else {
        const manualRes = await fetch("/api/v1/topup/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, currency: "PHP", note: topupNote.trim() || void 0 })
        });
        const data = await manualRes.json();
        if (data.id) {
          ue.success("USDT top-up completed and submitted for review");
          setTopupAmount("");
          setTopupNote("");
          await fetchData();
        } else {
          ue.error(data.detail || "Failed to submit top-up request");
        }
      }
    } catch {
      ue.error("Network error. Please try again.");
    } finally {
      setTopupLoading(false);
    }
  };
  const handlePhpWithdrawRequest = async () => {
    var _a2;
    const amount = parseFloat(wrAmount);
    const selectedCurrency = String(collectionCurrency || "PHP").toUpperCase();
    const error = validateBankWithdraw(amount);
    if (error) {
      ue.error(error);
      return;
    }
    setWrLoading(true);
    try {
      let passkeyCredential;
      let otpReference;
      let otpCode;
      try {
        passkeyCredential = await authApi.verifyPasskey("withdrawal");
      } catch {
        otpReference = await authApi.requestWithdrawalOtp();
        otpCode = (_a2 = window.prompt("Enter the 6-digit withdrawal OTP sent to your account email:")) == null ? void 0 : _a2.trim();
        if (!otpCode) throw new Error("Withdrawal OTP is required.");
      }
      const res = await fetch("/api/v1/wallet/withdraw-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type: "bank_transfer",
          currency: selectedCurrency,
          amount,
          bank_code: wrBank,
          bank_name: wrBank,
          account_number: wrAccount.trim(),
          account_name: wrName.trim(),
          recipient_phone: isKrwFlow ? void 0 : wrPhone.trim(),
          note: wrNote.trim() || void 0,
          passkey_credential: passkeyCredential,
          otp_reference: otpReference,
          otp_code: otpCode
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        ue.success(data.message || `${selectedCurrency} withdrawal submitted for approval`);
        if (data.processing_fee) {
          ue.info(`Processing fee: ${formatWalletCurrency(data.processing_fee, selectedCurrency)}`);
        }
        setWrAmount("");
        setWrBank("");
        setWrAccount("");
        setWrName("");
        setWrPhone("");
        setWrNote("");
        await fetchData();
      } else {
        ue.error(data.detail || data.message || "Failed to submit request");
      }
    } catch (err) {
      console.error("Withdrawal submission failed:", err);
      ue.error(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setWrLoading(false);
    }
  };
  const handleUsdtWithdrawRequest = async () => {
    var _a2;
    const amount = parseFloat(usdtAmount);
    const error = validateUsdtWithdraw(amount);
    if (error) {
      ue.error(error);
      return;
    }
    setUsdtLoading(true);
    try {
      let passkeyCredential;
      let otpReference;
      let otpCode;
      try {
        passkeyCredential = await authApi.verifyPasskey("withdrawal");
      } catch {
        otpReference = await authApi.requestWithdrawalOtp();
        otpCode = (_a2 = window.prompt("Enter the 6-digit withdrawal OTP sent to your account email:")) == null ? void 0 : _a2.trim();
        if (!otpCode) throw new Error("Withdrawal OTP is required.");
      }
      const res = await fetch("/api/v1/wallet/usdt-send-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          to_address: usdtAddress.trim(),
          platform: usdtPlatform,
          note: `USDT withdrawal via ${usdtPlatform}`,
          passkey_credential: passkeyCredential,
          otp_reference: otpReference,
          otp_code: otpCode
        })
      });
      const data = await res.json();
      if (data.success) {
        ue.success("USDT withdrawal request submitted");
        setUsdtAmount("");
        setUsdtAddress("");
        setUsdtPlatform("");
        await fetchData();
      } else {
        ue.error(data.message || "Failed to submit request");
      }
    } catch {
      ue.error("Network error. Please try again.");
    } finally {
      setUsdtLoading(false);
    }
  };
  if (authLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(AppLoadingScreen, {});
  }
  if (!user) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500", children: "Please log in to view your wallet." }) });
  }
  const bankList = Array.isArray(bankOptions) ? bankOptions.filter(Boolean) : [];
  const safeWithdrawRequests = dedupeRecords(Array.isArray(withdrawRequests) ? withdrawRequests.filter(Boolean) : []);
  const failedBalanceLabels = [
    ...balanceLoadErrors.includes("php") ? ["PHP wallet data"] : [],
    ...balanceLoadErrors.includes("usdt") ? ["USDT wallet"] : [],
    ...primaryWalletUnavailable ? [collectionWalletLabel] : []
  ];
  const {
    sourceCurrency: conversionSourceCurrency,
    availableSource,
    retainedBalance: sourceReserve,
    conversionRate,
    convertibleSource,
    canConvert: canConvertToUsdt,
    shortfallSource: usdtShortfallSource
  } = usdtConversion;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-none mx-auto space-y-4 sm:space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 p-5 shadow-sm sm:p-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-14 -right-10 h-40 w-40 rounded-full bg-blue-200/30 blur-2xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-blue-200/30 blur-2xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-6 w-6 text-blue-600" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight text-foreground sm:text-4xl", children: walletTitle })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-600 max-w-2xl font-medium", children: walletSubtitle }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 inline-flex items-center gap-2 text-xs font-medium text-slate-500", "aria-live": "polite", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `h-2 w-2 rounded-full ${walletEventsConnected ? "bg-emerald-500" : "bg-slate-300"}` }),
          walletEventsConnected ? "Instapay" : "Connecting to live wallet updates…"
        ] })
      ] }) })
    ] }) }),
    failedBalanceLabels.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "alert", className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "Unable to verify ",
        failedBalanceLabels.join(" and "),
        ". Balance-dependent actions remain unavailable until the data can be refreshed."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => void fetchData(), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
        " Retry"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [
      !cryptoOnly && /* PHP Balance */
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "card-3d bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 ring-1 ring-blue-100/50 overflow-hidden hover:shadow-lg transition-all", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1 w-full bg-gradient-to-r from-blue-400 to-blue-200" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 sm:p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-blue-700 uppercase tracking-wider", children: collectionWalletLabel }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Landmark, { className: "h-5 w-5" }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-semibold text-foreground", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block w-32 h-10 bg-slate-100 rounded-lg animate-pulse" }) : primaryWalletUnavailable ? "Unavailable" : formatWalletCurrency(getWalletBalanceValue(primaryWalletBalance, "balance"), selectedCollectionCurrency) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-emerald-50 px-2.5 py-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-emerald-700", children: "Available" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 truncate text-xs font-bold text-emerald-900", children: primaryWalletUnavailable ? "Unavailable" : formatWalletCurrency(getAvailableBalance(primaryWalletBalance), selectedCollectionCurrency) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-amber-50 px-2.5 py-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-amber-700", children: "Pending" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 truncate text-xs font-bold text-amber-900", children: primaryWalletUnavailable ? "Unavailable" : formatWalletCurrency(getWalletBalanceValue(primaryWalletBalance, "pending_balance"), selectedCollectionCurrency) })
              ] })
            ] }),
            vipGold && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vip-gold-card mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-3 w-3 fill-amber-400 text-amber-600" }),
              "VIP"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: getCurrencyName(selectedCollectionCurrency, language) }),
              (primaryWalletBalance == null ? void 0 : primaryWalletBalance.pending_balance) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full", children: [
                isKoreanWallet ? "처리 중" : "Pending",
                ": ",
                formatWalletCurrency(primaryWalletBalance.pending_balance, selectedCollectionCurrency)
              ] }) : null
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 flex items-center gap-2 min-h-[44px]", children: showFiatActionRow ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  size: "icon",
                  title: `Deposit ${selectedCollectionCurrency}`,
                  "aria-label": `Deposit ${selectedCollectionCurrency}`,
                  onClick: () => {
                    setShowUsdtTopupWizard(false);
                    setActiveTab("fund");
                    setWalletAction("deposit");
                  },
                  className: "inline-flex h-10 w-10 flex-1 items-center justify-center rounded-xl border border-[#2563eb] bg-[#3B82F6] text-white shadow-sm shadow-[#3B82F6]/20 transition-all hover:bg-[#2563eb] focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownToLine, { className: "h-4 w-4 text-white" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  size: "icon",
                  title: `Withdraw ${selectedCollectionCurrency}`,
                  "aria-label": `Withdraw ${selectedCollectionCurrency}`,
                  onClick: () => {
                    setShowUsdtTopupWizard(false);
                    setActiveTab("php");
                    setWalletAction("withdraw");
                  },
                  className: "inline-flex h-10 w-10 flex-1 items-center justify-center rounded-xl border border-amber-600 bg-amber-500 text-black shadow-sm shadow-amber-500/20 transition-all hover:bg-amber-600 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpFromLine, { className: "h-4 w-4 text-black" })
                }
              )
            ] }) : null })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          WalletTransactionHistory,
          {
            currency: selectedCollectionCurrency,
            transactions: collectionTransactions,
            loading,
            error: transactionLoadErrors.includes("collection"),
            onRetry: () => void fetchData(),
            isKorean: isKoreanWallet
          }
        )
      ] }),
      !cryptoOnly && (user == null ? void 0 : user.organization_id) && !sharedWalletIsPrimary && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "card-3d overflow-hidden border border-emerald-200/70 bg-gradient-to-br from-white to-emerald-50/50 transition-all hover:shadow-lg", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-300" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 sm:p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-emerald-700", children: isKoreanWallet ? "조직 지갑" : "Organization wallet" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 truncate text-xs text-slate-500", children: (organizationWalletBalance == null ? void 0 : organizationWalletBalance.organization_name) || user.organization_name || user.organization_id })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-5 w-5", "aria-hidden": "true" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-semibold text-foreground", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block h-10 w-32 animate-pulse rounded-lg bg-slate-100" }) : organizationWalletLoadError || !organizationWalletBalance ? "Unavailable" : formatWalletCurrency(
            getWalletBalanceValue(organizationWalletBalance, "balance"),
            organizationWalletBalance.currency
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-emerald-50 px-2.5 py-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-emerald-700", children: isKoreanWallet ? "사용 가능" : "Available" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 truncate text-xs font-bold text-emerald-900", children: loading ? "—" : organizationWalletLoadError || !organizationWalletBalance ? "Unavailable" : formatWalletCurrency(
                getWalletBalanceValue(organizationWalletBalance, "available_balance"),
                organizationWalletBalance.currency
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-amber-50 px-2.5 py-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-amber-700", children: isKoreanWallet ? "보류 중" : "Pending" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 truncate text-xs font-bold text-amber-900", children: loading ? "—" : organizationWalletLoadError || !organizationWalletBalance ? "Unavailable" : formatWalletCurrency(
                getWalletBalanceValue(organizationWalletBalance, "pending_balance"),
                organizationWalletBalance.currency
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xs text-slate-500", children: isKoreanWallet ? "조직 구성원과 공유" : "Shared with organization members" })
        ] })
      ] }),
      cryptoOnly && /* USDT Balance */
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "card-3d bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 ring-1 ring-blue-100/50 overflow-hidden hover:shadow-lg transition-all", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1 w-full bg-gradient-to-r from-blue-400 to-blue-200" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-blue-700 uppercase tracking-wider", children: "USDT Wallet" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-[#0f2a5f]/10 flex items-center justify-center p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: "USDT", size: "sm", className: "h-7 w-7 border-0 bg-transparent p-0 shadow-none" }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-semibold text-foreground", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block w-32 h-10 bg-slate-100 rounded-lg animate-pulse" }) : balanceLoadErrors.includes("usdt") || !usdtBalance ? "Unavailable" : `$${fmtUsd(getWalletBalanceValue(usdtBalance, "balance"))}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-emerald-50 px-2.5 py-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-emerald-700", children: "Available" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 truncate text-xs font-bold text-emerald-900", children: balanceLoadErrors.includes("usdt") || !usdtBalance ? "Unavailable" : `$${fmtUsd(getWalletBalanceValue(usdtBalance, "available_balance"))}` })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-amber-50 px-2.5 py-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-amber-700", children: "Pending" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 truncate text-xs font-bold text-amber-900", children: balanceLoadErrors.includes("usdt") || !usdtBalance ? "Unavailable" : `$${fmtUsd(getWalletBalanceValue(usdtBalance, "pending_balance"))}` })
              ] })
            ] }),
            vipGold && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vip-gold-card mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-3 w-3 fill-amber-400 text-amber-600" }),
              "VIP"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: isKoreanWallet ? "TRC-20 네트워크" : "TRC-20 Network" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 grid grid-cols-4 gap-2 min-h-[44px]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                BuyUsdtButton,
                {
                  compact: true,
                  loading: buyUsdtLoading,
                  funding: fundingUsdtLoading,
                  onClick: openBuyUsdt,
                  disabled: !canTradeUsdtForPhp
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  size: "icon",
                  title: "Sell USDT",
                  "aria-label": "Sell USDT",
                  onClick: () => {
                    setSellAmount(String(getWalletBalanceValue(usdtBalance, "available_balance")));
                    setWalletAction("sell");
                  },
                  disabled: !canTradeUsdtForPhp,
                  className: "inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm transition-all hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: "USDT", size: "sm", className: "h-5 w-5 border-0 bg-transparent p-0 shadow-none" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-slate-900", children: "SELL" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  size: "icon",
                  title: "Send USDT",
                  "aria-label": "Send USDT",
                  onClick: () => {
                    if (!ensureWalletIsOperational("USDT", "Sending USDT")) return;
                    setShowUsdtTopupWizard(false);
                    setActiveTab("usdt");
                    setWalletAction("send");
                  },
                  className: "inline-flex h-10 w-full items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm shadow-sky-600/20 transition-all hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4 text-white" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  size: "icon",
                  title: "Receive USDT",
                  "aria-label": "Receive USDT",
                  "data-guide-target": "wallet-usdt-receive",
                  onClick: () => {
                    setShowUsdtTopupWizard(true);
                    setActiveTab("fund");
                    setWalletAction("receive");
                  },
                  className: "inline-flex h-10 w-full items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownToLine, { className: "h-4 w-4 text-white" })
                }
              )
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          WalletTransactionHistory,
          {
            currency: "USDT",
            transactions: usdtTransactions,
            loading,
            error: transactionLoadErrors.includes("usdt"),
            onRetry: () => void fetchData(),
            isKorean: isKoreanWallet
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: walletFrozenDialogOpen, onOpenChange: setWalletFrozenDialogOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md rounded-2xl border-amber-200 bg-white p-6 shadow-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 pr-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-full bg-amber-100 p-2 text-amber-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "text-lg font-semibold text-slate-900", children: [
            walletFreezeCurrency,
            " wallet under maintenance"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { className: "text-sm leading-6 text-slate-600", children: [
            "Your ",
            walletFreezeCurrency,
            " wallet is temporarily unavailable for outgoing actions. Top up 600 USDT to enable all wallet features and unlock sending and buying."
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-slate-900", children: "How to restore this wallet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "mt-2 list-decimal space-y-1.5 pl-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Contact SwiftPay support or your account administrator." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Provide your account details and complete any requested verification." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Wait for an administrator to review and unfreeze the wallet." })
        ] }),
        walletFreezeReason && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 border-t border-slate-200 pt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-slate-900", children: "Reason:" }),
          " ",
          walletFreezeReason
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          onClick: () => setWalletFrozenDialogOpen(false),
          className: "w-full bg-blue-600 text-black hover:bg-blue-700",
          children: "I understand"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: accountActivationDialogOpen, onOpenChange: setAccountActivationDialogOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md rounded-2xl border-blue-200 bg-white p-6 shadow-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 pr-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-full bg-blue-100 p-2 text-blue-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Landmark, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-lg font-semibold text-slate-900", children: isKoreanWallet ? "계정 활성화" : "Activate your account" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { className: "text-sm leading-6 text-slate-600", children: isKoreanWallet ? "USDT 구매와 연결된 한국 결제 기능을 활성화하려면 먼저 토스뱅크 계좌를 개설하세요. 600 USDT 입금이 승인되면 계정이 활성화됩니다." : "Open your TOSS Bank account first to activate USDT purchases and the connected Korean payment features. Your account becomes eligible after an approved 600 USDT deposit." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: isKoreanWallet ? "다음 단계" : "Next step" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 leading-5", children: isKoreanWallet ? "뱅킹 설정에서 토스뱅크 계좌 개설 신청을 시작하세요." : "Open Banking settings and start the TOSS Bank account opening application." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setAccountActivationDialogOpen(false), className: "flex-1", children: isKoreanWallet ? "나중에" : "Not now" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            onClick: () => {
              setAccountActivationDialogOpen(false);
              navigate("/settings/shop/settlement#banking-toss-application");
            },
            className: "flex-1 bg-blue-600 text-white hover:bg-blue-700",
            children: isKoreanWallet ? "토스뱅크 뱅킹 열기" : "Open TOSS Banking"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Dialog,
      {
        open: walletAction !== null,
        onOpenChange: (open) => {
          if (!open) {
            setWalletAction(null);
            setShowUsdtTopupWizard(false);
          }
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "max-h-[90vh] max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-[#f6f8fb] p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:rounded-2xl", children: walletAction === "buy" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 p-5 sm:p-7", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-slate-200 pb-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.16em] text-[#0B63FF]", children: isKoreanWallet ? "지갑 작업" : "Wallet action" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-1 text-xl font-semibold text-slate-900", children: isKoreanWallet ? "USDT 구매" : "Buy USDT" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-600", children: isKoreanWallet ? `구매할 USDT 금액을 선택하세요. ${formatWalletCurrency(sourceReserve, conversionSourceCurrency)}를 ${conversionSourceCurrency} 지갑에 남겨 두세요.` : `Choose how much USDT you want to buy. Keep ${formatWalletCurrency(sourceReserve, conversionSourceCurrency)} in your ${conversionSourceCurrency} wallet.` })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            ExchangeRulesTable,
            {
              sourceCurrency: conversionSourceCurrency,
              rate: conversionRate,
              showReserve: conversionSourceCurrency === "PHP",
              mode: "buy",
              feeRate: conversionFeeRate,
              isKorean: isKoreanWallet
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "buy-usdt-amount", children: isKoreanWallet ? "구매할 USDT 금액" : "USDT amount to buy" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "buy-usdt-amount",
                type: "number",
                min: minimumUsdtPurchase,
                step: "0.01",
                value: buyUsdtAmount,
                onChange: (event) => setBuyUsdtAmount(event.target.value),
                placeholder: String(minimumUsdtPurchase),
                "aria-describedby": "buy-usdt-amount-help"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { id: "buy-usdt-amount-help", className: "text-xs text-slate-500", children: isKoreanWallet ? `필요한 ${conversionSourceCurrency} 금액에는 ${(conversionFeeRate * 100).toFixed(2)}% 환전 수수료가 포함됩니다.` : `The required ${conversionSourceCurrency} amount includes the ${(conversionFeeRate * 100).toFixed(2)}% conversion fee.` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-blue-700", children: isKoreanWallet ? `예상 수령액: 약 ${fmtUsd(usdtConversion.requestedUsdtAmount)} USDT (실제 시장 체결가에 따라 달라질 수 있습니다).` : `Estimated receive: about ${fmtUsd(usdtConversion.requestedUsdtAmount)} USDT (final amount may vary with the market fill).` })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4 shadow-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-slate-500", children: isKoreanWallet ? `사용 가능 ${conversionSourceCurrency}` : `Available ${conversionSourceCurrency}` }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-lg font-bold text-slate-900", children: formatWalletCurrency(availableSource, conversionSourceCurrency) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-[#0B63FF]", children: isKoreanWallet ? "환전 가능 금액" : "Eligible conversion" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-lg font-bold text-slate-900", children: [
                fmtUsd(usdtConversion.convertibleUsdt),
                " USDT"
              ] })
            ] })
          ] }),
          !canConvertToUsdt && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800", children: Number(buyUsdtAmount) <= 0 ? isKoreanWallet ? "0보다 큰 USDT 금액을 입력하세요." : "Enter a USDT amount greater than 0." : convertibleSource > 0 ? isKoreanWallet ? `사용 가능한 잔액으로 최대 ${fmtUsd(usdtConversion.convertibleUsdt)} USDT를 구매할 수 있습니다. 구매를 완료하려면 ${formatWalletCurrency(usdtShortfallSource, conversionSourceCurrency)}를 더 입금하세요.` : `You can buy up to ${fmtUsd(usdtConversion.convertibleUsdt)} USDT from your eligible balance. Deposit ${formatWalletCurrency(usdtShortfallSource, conversionSourceCurrency)} more to complete this purchase.` : isKoreanWallet ? "Relationship Manager에게 문의하세요." : "Contact your Relationship Manager." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            BuyUsdtButton,
            {
              loading: buyUsdtLoading,
              funding: fundingUsdtLoading,
              disabled: !conversionRate || Number(buyUsdtAmount) <= 0 || !Number.isFinite(Number(buyUsdtAmount)),
              onClick: canConvertToUsdt ? handleBuyUsdt : handleFundUsdtShortfall,
              label: canConvertToUsdt ? isKoreanWallet ? "USDT 구매" : "Buy USDT" : isKoreanWallet ? "입금" : "Deposit"
            }
          )
        ] }) : walletAction === "sell" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 p-5 sm:p-7", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-slate-200 pb-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.16em] text-orange-600", children: "Wallet action" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-1 text-xl font-semibold text-slate-900", children: "Sell USDT" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-600", children: "Convert USDT into your PHP wallet at the current exchange rate." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            ExchangeRulesTable,
            {
              sourceCurrency: "PHP",
              rate: sellUsdtRate,
              showReserve: false,
              mode: "sell",
              feeRate: conversionFeeRate,
              isKorean: isKoreanWallet
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "sell-usdt-amount", children: "USDT amount" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setSellAmount(String(getWalletBalanceValue(usdtBalance, "available_balance"))),
                  className: "text-xs font-semibold text-orange-600 hover:text-orange-700",
                  children: "Use available balance"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "sell-usdt-amount",
                type: "number",
                min: "0",
                max: getWalletBalanceValue(usdtBalance, "available_balance"),
                step: "0.01",
                value: sellAmount,
                onChange: (event) => setSellAmount(event.target.value),
                placeholder: "0.00",
                "aria-describedby": "sell-usdt-amount-help"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { id: "sell-usdt-amount-help", className: "text-xs text-slate-500", children: [
              "Available to sell: ",
              fmtUsd(getWalletBalanceValue(usdtBalance, "available_balance")),
              " USDT. The exchange fee is included in the estimate."
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4 shadow-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-slate-500", children: "You sell" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-lg font-bold text-slate-900", children: [
                fmtUsd(Number(sellAmount) || 0),
                " USDT"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-orange-100 bg-orange-50 p-4 shadow-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-orange-700", children: "Estimated receive" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-lg font-bold text-slate-900", children: formatWalletCurrency(Math.max((Number(sellAmount) || 0) * (sellUsdtRate || 0) * (1 - conversionFeeRate), 0), "PHP") })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              onClick: handleSellUsdt,
              disabled: buyUsdtLoading || !canTradeUsdtForPhp || !sellUsdtRate || !Number(sellAmount) || Number(sellAmount) > getWalletBalanceValue(usdtBalance, "available_balance"),
              className: "w-full rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50",
              children: buyUsdtLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }) : "Sell USDT"
            }
          )
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "space-y-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "fund", className: "mt-0", children: [
            walletAction === "receive" && showUsdtTopupWizard && /* @__PURE__ */ jsxRuntimeExports.jsx(React.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-center rounded-xl border border-dashed border-orange-200 bg-orange-50 p-8", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-5 w-5 animate-spin text-orange-600" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-orange-800", children: "Loading USDT top-up wizard..." })
            ] }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 sm:p-7", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              UsdtTopupWizard,
              {
                isKorean: isKoreanWallet,
                onClose: () => {
                  setShowUsdtTopupWizard(false);
                  setWalletAction(null);
                },
                onSuccess: fetchData
              }
            ) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-4", children: [
              walletAction === "deposit" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border-0 bg-transparent shadow-none", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg font-semibold text-foreground flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownToLine, { className: "h-5 w-5 text-blue-600" }),
                  fundWalletTitle
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
                  isKrwFlow && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "한국 고객 안내" }),
                    walletDepositDestinations.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: "아래에 표시된 SwiftPay 수취 계좌로 정확한 금액을 이체한 후, 송금 영수증을 업로드해 주세요. 입금은 관리자 확인 후 반영됩니다." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-medium text-amber-800", children: "현재 등록된 KRW 수취 계좌가 없습니다. 관리자에게 계좌 설정을 요청해 주세요." })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-700 mb-4", children: isKoreanWallet ? "수취 은행 계좌" : isKrwFlow ? "Receiving bank account" : "Receiving bank accounts" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: walletDepositDestinations.map((dest) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(BankLogo, { name: dest.label, code: dest.bank_code, size: "md", className: "h-10 w-10" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-500", children: isKoreanWallet ? "은행" : "Bank" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-semibold text-foreground", children: getBankDisplayName(dest.label) })
                        ] })
                      ] }),
                      dest.swift_code && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-500", children: "SWIFT/BIC" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 font-mono font-semibold text-foreground", children: dest.swift_code })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-500", children: isKoreanWallet ? "예금주" : "Account holder" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 font-semibold text-foreground", children: dest.account_name })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-500", children: isKoreanWallet ? "계좌번호" : "Account number" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 font-mono font-semibold text-foreground", children: dest.account_number })
                      ] })
                    ] }) }, dest.value)) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(React.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 text-slate-400 animate-spin mr-2" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-600 font-medium", children: "Loading deposit wizard..." })
                  ] }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    DepositWizard,
                    {
                      onSuccess: fetchData,
                      currency: selectedCollectionCurrency,
                      userId: user == null ? void 0 : user.id,
                      bankName: krwBankName,
                      accountHolderName: krwAccountHolderName,
                      destinations: isKrwFlow ? assignedKrwAccount ? [assignedKrwAccount] : [] : void 0,
                      companyLogoUrl: platformBranding == null ? void 0 : platformBranding.logoUrl
                    }
                  ) })
                ] })
              ] }),
              walletAction === "receive" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border-0 bg-transparent shadow-none", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg font-semibold text-foreground flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Bitcoin, { className: "h-5 w-5 text-orange-600" }),
                  "Top Up USDT Balance (TRC-20)"
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-6", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 p-4 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-5 w-5 text-orange-600 mt-0.5 shrink-0" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-orange-900", children: "How USDT Top-Up Works" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "text-xs text-orange-800 mt-2 space-y-1 ml-4 list-decimal", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Enter the PHP amount you want to add to your wallet" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "System calculates required USDT at current rate" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Send USDT to the address shown below on TRC-20 network" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Submit your top-up request for admin approval" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Once approved, PHP amount is credited to your wallet" })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wider font-semibold text-slate-600 mb-2", children: rateLabel }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-slate-900", children: usdtPhpRate ? `₱${usdtPhpRate.toFixed(2)}` : "—" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-500 mt-1", children: [
                        "per 1 USDT",
                        usdtRateSource ? ` · ${usdtRateSource}` : ""
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-cyan-50", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wider font-semibold text-blue-600 mb-2", children: usdtWalletLabel }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-blue-900", children: usdtBalance ? `$${fmtUsd(getWalletBalanceValue(usdtBalance, "balance"))}` : "—" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-blue-600 mt-1", children: "TRC-20 Balance" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-slate-700 block mb-2", children: "Amount to Add (PHP)" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold", children: "₱" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            type: "number",
                            placeholder: "e.g. 5000",
                            value: topupAmount,
                            onChange: (e) => setTopupAmount(e.target.value),
                            min: "100",
                            step: "0.01",
                            className: "bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 pl-7"
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Minimum 100 PHP" })
                    ] }),
                    topupAmount && usdtPhpRate ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 rounded-lg bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-300", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-orange-900 uppercase tracking-wider", children: "USDT Required" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl font-bold text-orange-900 mt-1", children: [
                          "$",
                          (parseFloat(topupAmount) / usdtPhpRate).toFixed(2)
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-orange-800", children: "You'll receive" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xl font-bold text-orange-900 mt-1", children: [
                          "₱",
                          parseFloat(topupAmount).toLocaleString("en-PH", { maximumFractionDigits: 2 })
                        ] })
                      ] })
                    ] }) }) : null
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-slate-700 block mb-2", children: "Reference Note (optional)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        placeholder: "e.g. Top-up for Q1 campaign or transaction reference",
                        value: topupNote,
                        onChange: (e) => setTopupNote(e.target.value),
                        className: "bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      onClick: handleTopupRequest,
                      disabled: topupLoading || !topupAmount,
                      className: "w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white h-11 rounded-lg font-semibold shadow-lg shadow-orange-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                      children: topupLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
                        "Processing..."
                      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Bitcoin, { className: "h-4 w-4 mr-2" }),
                        "Submit"
                      ] })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "✓ Request submitted for admin review" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "✓ Approval typically within 24 hours" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "✓ Ensure you send exact USDT amount on TRC-20 network" })
                  ] })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "php", className: "mt-0 p-4 sm:p-7", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "lg:col-span-2 bg-white border border-slate-200 shadow-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg font-semibold text-foreground flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-5 w-5 text-blue-600" }),
                withdrawBankTitle
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-slate-700 block mb-2", children: isKrwFlow ? "금액" : `Amount (${getCurrencySymbol(selectedCollectionCurrency).trim()})` }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        type: "number",
                        placeholder: "0.00",
                        value: wrAmount,
                        onChange: (e) => setWrAmount(e.target.value),
                        min: "1",
                        step: "0.01",
                        className: "bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      }
                    ),
                    collectionBalance && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-slate-600 mt-2 font-medium", children: [
                      isKrwFlow ? "사용 가능 잔액" : "Available",
                      ": ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-700", children: formatWalletCurrency(getAvailableBalance(collectionBalance), selectedCollectionCurrency) })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-slate-700 block mb-2", children: isKrwFlow ? "은행" : "Bank" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: wrBank, onValueChange: (val) => {
                      setWrBank(val);
                      const b = bankList.find((x) => x.code === val);
                      if (b) setWrBankName(b.name);
                    }, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "bg-slate-50 border-slate-200 text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: isKrwFlow ? "은행을 선택하세요" : "Select bank…" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "bg-white border-slate-200 max-h-[300px]", children: bankList.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: b.code, className: "text-foreground", children: b.name }, b.code)) })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-slate-700 block mb-2", children: isKrwFlow ? "계좌번호" : "Account Number" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        placeholder: "1234567890",
                        value: wrAccount,
                        onChange: (e) => setWrAccount(e.target.value),
                        className: "bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-slate-700 block mb-2", children: isKrwFlow ? "예금주" : "Account Holder Name" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        placeholder: "Juan Dela Cruz",
                        value: wrName,
                        onChange: (e) => setWrName(e.target.value),
                        className: "bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      }
                    )
                  ] }),
                  !isKrwFlow && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-slate-700 block mb-2", children: "Mobile Number" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        placeholder: "09XXXXXXXXX or +63 9XX XXX XXXX",
                        value: wrPhone,
                        onChange: (e) => setWrPhone(e.target.value),
                        inputMode: "tel",
                        className: "bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sm:col-span-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-slate-700 block mb-2", children: isKrwFlow ? "메모 (선택)" : "Note (optional)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        placeholder: "Additional instructions for admin...",
                        value: wrNote,
                        onChange: (e) => setWrNote(e.target.value),
                        className: "bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    onClick: handlePhpWithdrawRequest,
                    disabled: wrLoading || !wrAmount || !wrBank || !wrAccount || !wrName || !isKrwFlow && !wrPhone,
                    className: "w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-black h-10 rounded-lg font-semibold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                    "data-wallet-dark-action": "true",
                    children: wrLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 text-black animate-spin" }),
                      "Submitting Request..."
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpFromLine, { className: "h-4 w-4 mr-2 text-black" }),
                      withdrawSubmitLabel
                    ] })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg font-semibold text-foreground flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-5 w-5 text-slate-600" }),
                "Supported Banks"
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-3", children: (isKrwFlow ? KRW_BANKS : PH_BANKS).map((bank) => {
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-2 hover:bg-slate-50 transition-colors", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(BankLogo, { name: bank.name, code: bank.code, size: "sm" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 truncate text-xs font-medium text-slate-700", children: bank.name })
                  ] }, bank.code);
                }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 pt-4 border-t border-slate-200", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-600", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-slate-700", children: isKrwFlow ? "처리 기간:" : "Processing time:" }),
                    " ",
                    isKrwFlow ? "영업일 기준 1~3일" : "1-3 business days"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-600 mt-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-slate-700", children: isKrwFlow ? "통화:" : "Network:" }),
                    " ",
                    isKrwFlow ? "KRW만 가능" : "PHP only"
                  ] })
                ] })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "usdt", className: "mt-0 p-4 sm:p-7", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "lg:col-span-2 bg-white border border-slate-200 shadow-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg font-semibold text-foreground flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "h-5 w-5 text-blue-600" }),
                "Withdraw USDT to Wallet"
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-2 rounded-full bg-blue-500 animate-pulse" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-blue-900", children: "Network: TRC-20 (Tron)" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-slate-700 block mb-2", children: "Amount (USDT)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        type: "number",
                        placeholder: "0.00",
                        value: usdtAmount,
                        onChange: (e) => setUsdtAmount(e.target.value),
                        min: "10",
                        step: "0.01",
                        className: "bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      }
                    ),
                    usdtBalance && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-slate-600 mt-2 font-medium", children: [
                      "Available: ",
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-blue-700", children: [
                        "$",
                        fmtUsd(getAvailableBalance(usdtBalance)),
                        " USDT"
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-slate-700 block mb-2", children: "Platform / Wallet" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: usdtPlatform, onValueChange: setUsdtPlatform, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "bg-slate-50 border-slate-200 text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select platform…" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "bg-white border-slate-200", children: USDT_PLATFORMS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.code, className: "text-foreground", children: p.name }, p.code)) })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sm:col-span-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-slate-700 block mb-2", children: "USDT Address (TRC-20)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        placeholder: "TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                        value: usdtAddress,
                        onChange: (e) => setUsdtAddress(e.target.value),
                        className: "bg-slate-50 border-slate-200 text-foreground placeholder:text-slate-400 font-mono text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-600 mt-2 font-medium", children: 'Must start with "T" and be 34 characters long. Double-check before submitting.' })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    onClick: handleUsdtWithdrawRequest,
                    disabled: usdtLoading || !usdtAmount || !usdtAddress || !usdtPlatform,
                    className: "w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-black h-10 rounded-lg font-semibold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                    "data-wallet-dark-action": "true",
                    children: usdtLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
                      "Submitting Request..."
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4 mr-2" }),
                      "Withdraw USDT"
                    ] })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg font-semibold text-foreground flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(WalletMinimal, { className: "h-5 w-5 text-slate-600" }),
                "Important Info"
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-slate-700", children: "Supported Platforms:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 mt-2", children: [
                    USDT_PLATFORMS.slice(0, 5).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-600", children: [
                      "• ",
                      p.name
                    ] }, p.code)),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-600", children: "• And more..." })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-3 border-t border-slate-200", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-700 font-semibold mb-2", children: "Withdrawal Details:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-1 text-xs text-slate-600", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      "• ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Network:" }),
                      " TRC-20 only"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      "• ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Min amount:" }),
                      " 10 USDT"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      "• ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Network fee:" }),
                      " ~1 USDT"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      "• ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Processing:" }),
                      " 1-2 hours"
                    ] })
                  ] })
                ] })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "requests", className: "mt-0 p-4 sm:p-7", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-white border border-slate-200 shadow-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg font-semibold text-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-5 w-5 text-slate-600" }),
              "My Withdrawal Requests"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-4 rounded-lg bg-slate-50 animate-pulse", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-lg bg-slate-200 shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 bg-slate-200 rounded w-1/3" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2.5 bg-slate-200 rounded w-1/4" })
              ] })
            ] }, i)) }) : withdrawRequestsLoadError ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "alert", className: "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Unable to load withdrawal requests." }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => void fetchData(), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
                " Retry"
              ] })
            ] }) : safeWithdrawRequests.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-12 w-12 text-slate-300 mx-auto mb-3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: "No withdrawal requests" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Submit a request from the PHP or USDT tab" })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: safeWithdrawRequests.map((req) => {
              var _a2;
              if (!req) return null;
              const statusType = getStatusType(req.status);
              const isUsdt = req.request_type === "usdt_trc20";
              return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: statusType, size: "sm", showDot: false, className: "shrink-0" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: isUsdt ? formatWalletCurrency(req.amount, "USDT") : formatWalletCurrency(req.amount, "PHP") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: statusType, size: "sm", showDot: false }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200", children: isUsdt ? "USDT · TRC-20" : "PHP · Bank Transfer" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 mt-2", children: isUsdt ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      req.usdt_platform && `${((_a2 = USDT_PLATFORMS.find((p) => p.code === req.usdt_platform)) == null ? void 0 : _a2.name) || req.usdt_platform} · `,
                      req.usdt_address
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      req.bank_name,
                      " · ",
                      req.account_number,
                      " · ",
                      req.account_name
                    ] }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-500 mt-1", children: [
                      "Amount: ",
                      formatWalletCurrency(req.amount, req.currency || (isUsdt ? "USDT" : "PHP")),
                      " · Fee: ",
                      formatWalletCurrency(req.processing_fee || 0, req.currency || (isUsdt ? "USDT" : "PHP")),
                      " · Total debited: ",
                      formatWalletCurrency(req.total_debit ?? req.amount + (req.processing_fee || 0), req.currency || (isUsdt ? "USDT" : "PHP"))
                    ] }),
                    req.note && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-500 mt-1 italic", children: [
                      "Note: ",
                      req.note
                    ] }),
                    req.rejection_reason && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-red-600 mt-1 font-medium", children: [
                      "Reason: ",
                      req.rejection_reason
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right shrink-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 font-medium", children: req.created_at ? new Date(req.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—" }),
                  req.processed_at && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-500 mt-1", children: [
                    "Processed: ",
                    new Date(req.processed_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })
                  ] })
                ] })
              ] }) }, req.id);
            }) }) })
          ] }) })
        ] }) })
      }
    )
  ] }) });
}
export {
  WalletPage as default
};
