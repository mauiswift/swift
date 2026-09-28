import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { a as reactExports } from "./router-vendor-C2eKMart.js";
import { g as client, M as getStoredToken, N as setStoredToken } from "./index-D6s1MavG.js";
import { z as LoaderCircle, R as RefreshCw, D as WalletCards, A as ArrowDownToLine, bj as ArrowUpFromLine, bn as History } from "./utils-vendor-B--1aD6k.js";
import "./ui-vendor-DsSOT9J9.js";
const money = (amount, currency = "PHP") => currency === "USDT" ? `₮ ${(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(amount || 0);
function MiniApp() {
  var _a, _b;
  const [balance, setBalance] = reactExports.useState(null);
  const [transactions, setTransactions] = reactExports.useState([]);
  const [amount, setAmount] = reactExports.useState("");
  const [accountNumber, setAccountNumber] = reactExports.useState("");
  const [bankCode, setBankCode] = reactExports.useState("");
  const [firstName, setFirstName] = reactExports.useState("");
  const [lastName, setLastName] = reactExports.useState("");
  const [phone, setPhone] = reactExports.useState("");
  const [currency, setCurrency] = reactExports.useState("PHP");
  const [loading, setLoading] = reactExports.useState(true);
  const [message, setMessage] = reactExports.useState("");
  const [error, setError] = reactExports.useState("");
  const [overview, setOverview] = reactExports.useState(null);
  const [overviewLoading, setOverviewLoading] = reactExports.useState(false);
  const [requests, setRequests] = reactExports.useState({ topups: [], withdrawals: [] });
  const [requestAction, setRequestAction] = reactExports.useState(null);
  const [authenticated, setAuthenticated] = reactExports.useState(false);
  const authenticationStarted = reactExports.useRef(false);
  const telegramInitData = (_b = (_a = window.Telegram) == null ? void 0 : _a.WebApp) == null ? void 0 : _b.initData;
  const loadWallet = reactExports.useCallback(async () => {
    var _a2;
    const [balanceResponse, transactionsResponse] = await Promise.all([
      client.get(`/api/v1/wallet/balance?currency=${currency}`),
      client.get(`/api/v1/wallet/transactions?currency=${currency}&limit=10`)
    ]);
    if (!balanceResponse.ok || !transactionsResponse.ok) {
      throw new Error("Unable to load your wallet");
    }
    setBalance(balanceResponse.data);
    setTransactions(((_a2 = transactionsResponse.data) == null ? void 0 : _a2.items) || []);
  }, [currency]);
  const loadOverview = reactExports.useCallback(async () => {
    var _a2;
    setOverviewLoading(true);
    try {
      const response = await client.get("/api/v1/mini-app/admin/overview");
      if (!response.ok) throw new Error(((_a2 = response.data) == null ? void 0 : _a2.detail) || "Unable to load admin overview");
      setOverview(response.data);
    } finally {
      setOverviewLoading(false);
    }
  }, []);
  const loadRequests = reactExports.useCallback(async () => {
    var _a2;
    const response = await client.get("/api/v1/mini-app/admin/requests");
    if (!response.ok) throw new Error(((_a2 = response.data) == null ? void 0 : _a2.detail) || "Unable to load approval requests");
    setRequests(response.data);
  }, []);
  reactExports.useEffect(() => {
    var _a2, _b2, _c, _d, _e, _f;
    (_c = (_b2 = (_a2 = window.Telegram) == null ? void 0 : _a2.WebApp) == null ? void 0 : _b2.ready) == null ? void 0 : _c.call(_b2);
    (_f = (_e = (_d = window.Telegram) == null ? void 0 : _d.WebApp) == null ? void 0 : _e.expand) == null ? void 0 : _f.call(_e);
    if (authenticationStarted.current) return;
    authenticationStarted.current = true;
    const authenticate = async () => {
      var _a3, _b3;
      try {
        if (!telegramInitData && !getStoredToken()) throw new Error("Open this page from your Telegram bot");
        if (telegramInitData) {
          const response = await client.post("/api/v1/mini-app/auth", { init_data: telegramInitData });
          if (!response.ok || !((_a3 = response.data) == null ? void 0 : _a3.token)) throw new Error(((_b3 = response.data) == null ? void 0 : _b3.detail) || "Telegram authentication failed");
          setStoredToken(response.data.token);
        }
        setAuthenticated(true);
        await Promise.allSettled([loadOverview(), loadRequests()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to open wallet");
      } finally {
        setLoading(false);
      }
    };
    void authenticate();
  }, [loadOverview, loadRequests, telegramInitData]);
  reactExports.useEffect(() => {
    if (!authenticated) return;
    void loadWallet().catch((err) => {
      setError(err instanceof Error ? err.message : "Unable to load your wallet");
    });
  }, [authenticated, loadWallet]);
  const submitTopup = async () => {
    var _a2;
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a positive amount");
      return;
    }
    setError("");
    setMessage("");
    const response = await client.post("/api/v1/topup/swiftpay", { amount: parsedAmount, currency });
    if (!response.ok) {
      setError(((_a2 = response.data) == null ? void 0 : _a2.detail) || "Unable to create payment");
      return;
    }
    setAmount("");
    if (response.data.redirect_url) window.location.href = response.data.redirect_url;
    else setMessage("Payment created. Follow the payment instructions sent by the provider.");
  };
  const submitWithdrawal = async () => {
    var _a2;
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a positive amount");
      return;
    }
    setError("");
    if (!bankCode.trim() || !accountNumber.trim() || !firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError("Enter the bank code, account details, recipient name, and Philippine mobile number");
      return;
    }
    const response = await client.post("/api/v1/mini-app/withdraw", {
      amount: parsedAmount,
      currency,
      bank_code: bankCode.trim(),
      account_number: accountNumber.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      recipient_phone: phone.trim(),
      note: "Telegram Mini App withdrawal"
    });
    setMessage(response.ok ? "Withdrawal submitted for approval." : ((_a2 = response.data) == null ? void 0 : _a2.detail) || "Withdrawal could not be submitted");
    if (response.ok) {
      setAmount("");
      setAccountNumber("");
      setBankCode("");
      setFirstName("");
      setLastName("");
      setPhone("");
      await loadWallet();
    }
  };
  const available = reactExports.useMemo(() => (balance == null ? void 0 : balance.available_balance) ?? (balance == null ? void 0 : balance.balance) ?? 0, [balance]);
  const approveRequest = async (type, id) => {
    var _a2;
    const key = `${type}-${id}`;
    setRequestAction(key);
    setError("");
    try {
      const response = type === "topup" ? await client.post(`/api/v1/topup/${id}/approve`, { note: "Approved via super admin Mini App" }) : await client.post(`/api/v1/wallet/admin/withdrawals/${id}/approve`, { note: "Approved via super admin Mini App" });
      if (!response.ok) throw new Error(((_a2 = response.data) == null ? void 0 : _a2.detail) || "Approval failed");
      setMessage(`${type === "topup" ? "Incoming funds" : "Withdrawal"} approved.`);
      await Promise.all([loadWallet(), loadOverview(), loadRequests()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setRequestAction(null);
    }
  };
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex min-h-screen items-center justify-center bg-[#070b16] text-white", "aria-label": "Loading Mini App", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-blue-400", "aria-hidden": "true" }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "min-h-screen bg-[radial-gradient(circle_at_top,#18284a_0%,#070b16_45%)] px-4 py-5 text-white sm:py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-lg space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-end justify-between px-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.2em] text-blue-300", children: "SwiftPay" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-1 text-2xl font-bold tracking-tight", children: "Super admin wallet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-400", children: "Private operations inside Telegram" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-300", children: "Secure" })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "alert", className: "rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200", children: error }),
    message && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "status", className: "rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200", children: message }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "overflow-hidden rounded-3xl border border-blue-300/20 bg-gradient-to-br from-blue-600/30 via-slate-800/90 to-slate-900 p-5 shadow-2xl shadow-blue-950/30", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-blue-200", children: "Live overview" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-1 text-lg font-semibold", children: "Platform operations" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => void loadOverview(), disabled: overviewLoading, "aria-label": "Refresh platform overview", className: "motion-interactive rounded-xl border border-white/10 bg-white/10 p-2.5 text-blue-100 disabled:opacity-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 18, className: overviewLoading ? "animate-spin" : "" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-white/5 bg-slate-950/30 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Pending payouts" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xl font-bold", children: (overview == null ? void 0 : overview.pending_disbursements.count) ?? 0 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] text-slate-500", children: "Awaiting completion" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-white/5 bg-slate-950/30 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Pending PHP value" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xl font-bold", children: money((overview == null ? void 0 : overview.pending_disbursements.amount) ?? 0) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] text-slate-500", children: "Across all accounts" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 space-y-2", children: overview == null ? void 0 : overview.wallets.map((wallet) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-slate-300", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-white", children: wallet.currency }),
          " · ",
          wallet.wallet_count,
          " wallets"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: money(wallet.balance, wallet.currency) })
      ] }, wallet.currency)) }),
      (overview == null ? void 0 : overview.recent_disbursements.length) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 border-t border-white/10 pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400", children: "Recent money out" }),
        overview.recent_disbursements.slice(0, 4).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-b border-white/5 py-2 text-xs last:border-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0 truncate text-slate-300", children: [
            item.currency,
            " ",
            money(item.amount, item.currency),
            " · ",
            item.account
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 capitalize text-slate-400", children: item.status })
        ] }, item.id))
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 border-t border-white/10 pt-4 text-sm text-slate-500", children: "No recent money-out activity." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-3xl border border-amber-300/20 bg-amber-500/10 p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-amber-200", children: "Approval queue" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-1 text-lg font-semibold", children: "Accept money and approve payouts" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        requests.topups.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/20 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: money(item.amount, item.currency) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "truncate text-xs text-slate-400", children: [
              "Incoming funds · ",
              item.user_id
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => void approveRequest("topup", item.id), disabled: requestAction === `topup-${item.id}`, className: "motion-interactive shrink-0 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50", children: requestAction === `topup-${item.id}` ? "Approving…" : "Approve funds" })
        ] }, `topup-${item.id}`)),
        requests.withdrawals.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/20 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: money(item.amount, item.currency) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "truncate text-xs text-slate-400", children: [
              "Money out · ",
              item.account
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => void approveRequest("withdrawal", item.id), disabled: requestAction === `withdrawal-${item.id}`, className: "motion-interactive shrink-0 rounded-xl bg-blue-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-50", children: requestAction === `withdrawal-${item.id}` ? "Approving…" : "Approve payout" })
        ] }, `withdrawal-${item.id}`)),
        !requests.topups.length && !requests.withdrawals.length && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-400", children: "No pending approval requests." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-3xl border border-cyan-300/20 bg-cyan-500/10 p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200", children: "SwiftPay collection balance" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-400", children: "Collections received minus completed disbursements." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 space-y-3", children: overview == null ? void 0 : overview.swiftpay_balance.items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-white/10 bg-slate-950/20 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: item.currency }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl font-bold", children: money(item.balance, item.currency) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "+ Collections",
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "text-emerald-300", children: money(item.collections, item.currency) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "− Disbursements",
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "text-rose-300", children: money(item.disbursements, item.currency) })
          ] })
        ] })
      ] }, item.currency)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-3xl border border-white/10 bg-slate-800/90 p-5 shadow-xl shadow-black/20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-slate-400", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "Selected wallet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(WalletCards, { size: 20, className: "text-blue-300" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-4xl font-bold tracking-tight", children: money(available, currency) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-slate-400", children: [
        "Pending: ",
        money((balance == null ? void 0 : balance.pending_balance) || 0, currency)
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "wallet-currency", className: "sr-only", children: "Wallet currency" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { id: "wallet-currency", value: currency, onChange: (event) => setCurrency(event.target.value), className: "motion-interactive mt-4 w-full rounded-xl border border-white/10 bg-slate-700/80 px-3 py-3 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "PHP", children: "PHP" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "CNY", children: "CNY" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "KRW", children: "KRW" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "USDT", children: "USDT" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-3xl border border-white/10 bg-slate-800/90 p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-blue-300", children: "Money movement" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-1 text-lg font-semibold", children: "Fund or withdraw" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "mini-amount", className: "text-sm text-slate-300", children: "Amount" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { id: "mini-amount", value: amount, onChange: (event) => setAmount(event.target.value), inputMode: "decimal", placeholder: "0.00", className: "motion-interactive mt-2 w-full rounded-xl border border-white/10 bg-slate-700/80 px-3 py-3 outline-none ring-blue-500 focus:ring-2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mt-3 block text-sm text-slate-300", children: "Destination account" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: accountNumber, onChange: (event) => setAccountNumber(event.target.value), placeholder: "Bank or mobile account number", className: "motion-interactive mt-2 w-full rounded-xl border border-white/10 bg-slate-700/80 px-3 py-3 outline-none ring-blue-500 focus:ring-2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mt-3 block text-sm text-slate-300", children: "SwiftPay bank code" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: bankCode, onChange: (event) => setBankCode(event.target.value), placeholder: "e.g. BPI", className: "motion-interactive mt-2 w-full rounded-xl border border-white/10 bg-slate-700/80 px-3 py-3 outline-none ring-blue-500 focus:ring-2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: firstName, onChange: (event) => setFirstName(event.target.value), placeholder: "First name", className: "motion-interactive w-full rounded-xl border border-white/10 bg-slate-700/80 px-3 py-3 outline-none ring-blue-500 focus:ring-2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: lastName, onChange: (event) => setLastName(event.target.value), placeholder: "Last name", className: "motion-interactive w-full rounded-xl border border-white/10 bg-slate-700/80 px-3 py-3 outline-none ring-blue-500 focus:ring-2" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mt-3 block text-sm text-slate-300", children: "Recipient mobile (+63)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: phone, onChange: (event) => setPhone(event.target.value), inputMode: "tel", placeholder: "+639171234567", className: "motion-interactive mt-2 w-full rounded-xl border border-white/10 bg-slate-700/80 px-3 py-3 outline-none ring-blue-500 focus:ring-2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => void submitTopup(), className: "motion-interactive flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-3 font-semibold shadow-lg shadow-blue-950/30", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownToLine, { size: 18 }),
          " Add funds"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => void submitWithdrawal(), disabled: available <= 0, className: "motion-interactive flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-700 px-3 py-3 font-semibold disabled:opacity-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpFromLine, { size: 18 }),
          " Withdraw"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-3xl border border-white/10 bg-slate-800/90 p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mb-3 flex items-center gap-2 font-semibold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(History, { size: 18 }),
        " Recent activity"
      ] }),
      transactions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-400", children: "No transactions yet." }) : transactions.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between border-t border-slate-700 py-3 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block capitalize", children: item.transaction_type.replace("_", " ") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-400", children: item.note || item.status || "" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: item.amount >= 0 ? "text-emerald-300" : "text-red-300", children: [
          item.amount >= 0 ? "+" : "",
          money(item.amount, item.currency)
        ] })
      ] }, item.id))
    ] })
  ] }) });
}
export {
  MiniApp as default
};
