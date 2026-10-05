import { j as jsxRuntimeExports } from "./query-vendor-C49KnSO9.js";
import { f as useNavigate, a as reactExports } from "./router-vendor-N0qZPfHZ.js";
import { u as useAuth, i as client, b as ue, w as Layout, e as Button, L as Label, K as Select, M as SelectTrigger, N as SelectValue, O as SelectContent, R as SelectItem, I as Input, P as PaymentBrandLogo, D as Dialog, m as DialogContent, U as DialogHeader, V as DialogTitle, W as DialogFooter } from "./index-DKLUwC1a.js";
import { S as Switch } from "./switch-0G6dF9tn.js";
import { K as KRW_BANKS } from "./krw-banks-DCV22Xih.js";
import { B as BankLogo } from "./BankLogo-bhH8Sgr4.js";
import { J as ChevronLeft, aY as PenLine, e as Landmark, b as LoaderCircle, d as ShieldCheck, h as CircleCheck, aE as ArrowLeft, A as ArrowRight } from "./utils-vendor-Bm5lXE_Q.js";
import "./ui-vendor-CXLHQPHT.js";
const KOREA_CHANNELS = [
  { id: "bank_transfer", label: "Korean bank transfer", description: "Manual KRW transfer with admin verification", tone: "bg-blue-50 text-blue-700", available: true },
  { id: "kakaopay", label: "KakaoPay", description: "Requires a Korean acquiring partner", tone: "bg-yellow-50 text-yellow-800", available: false },
  { id: "naverpay", label: "Naver Pay", description: "Requires a Korean acquiring partner", tone: "bg-emerald-50 text-emerald-700", available: false },
  { id: "tosspay", label: "Toss Pay", description: "Requires a Toss or acquiring partner account", tone: "bg-violet-50 text-violet-700", available: false },
  { id: "payco", label: "PAYCO", description: "Requires a Korean acquiring partner", tone: "bg-red-50 text-red-700", available: false }
];
const DEFAULT_SETTLEMENT_CURRENCY = "KRW";
const DEFAULT_SETTLEMENT_TYPE = "Korean bank transfer";
const createTossForm = (user) => ({
  legal_name: (user == null ? void 0 : user.name) || "",
  country: "Philippines",
  business_type: "Corporation",
  monthly_volume: "Under 100,000 KRW",
  currencies: ["KRW"],
  purpose: "Global collections and business payments",
  contact_email: (user == null ? void 0 : user.email) || ""
});
function Banking() {
  var _a, _b, _c, _d, _e;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [channelLoading, setChannelLoading] = reactExports.useState(true);
  const [channelSaving, setChannelSaving] = reactExports.useState(false);
  const [channelEligible, setChannelEligible] = reactExports.useState(false);
  const [krwBenefitThreshold, setKrwBenefitThreshold] = reactExports.useState(600);
  const channelCurrency = "KRW";
  const [paymentChannels, setPaymentChannels] = reactExports.useState({});
  const [tossStatus, setTossStatus] = reactExports.useState("not_started");
  const [tossWizardOpen, setTossWizardOpen] = reactExports.useState(false);
  const [tossStep, setTossStep] = reactExports.useState(1);
  const [tossSaving, setTossSaving] = reactExports.useState(false);
  const [tossBenefitsUnlocked, setTossBenefitsUnlocked] = reactExports.useState(false);
  const [tossAccounts, setTossAccounts] = reactExports.useState([]);
  const [tossAccountsLoading, setTossAccountsLoading] = reactExports.useState(false);
  const [tossAccountsSaving, setTossAccountsSaving] = reactExports.useState(false);
  const [usdtDepositAddress, setUsdtDepositAddress] = reactExports.useState("");
  const [tossForm, setTossForm] = reactExports.useState(() => createTossForm(user || void 0));
  const signatureCanvasRef = reactExports.useRef(null);
  const isDrawingSignature = reactExports.useRef(false);
  const [signatureData, setSignatureData] = reactExports.useState("");
  const [settlementEditing, setSettlementEditing] = reactExports.useState(false);
  const [settlementSaving, setSettlementSaving] = reactExports.useState(false);
  const [settlementForm, setSettlementForm] = reactExports.useState({
    bank_name: (user == null ? void 0 : user.bank_name) || "",
    bank_account_number: (user == null ? void 0 : user.bank_account_number) || "",
    bank_account_name: (user == null ? void 0 : user.bank_account_name) || "",
    bank_address: (user == null ? void 0 : user.bank_address) || "",
    settlement_type: (user == null ? void 0 : user.settlement_type) || DEFAULT_SETTLEMENT_TYPE,
    settlement_currency: (user == null ? void 0 : user.settlement_currency) || DEFAULT_SETTLEMENT_CURRENCY
  });
  reactExports.useEffect(() => {
    setSettlementForm({
      bank_name: (user == null ? void 0 : user.bank_name) || "",
      bank_account_number: (user == null ? void 0 : user.bank_account_number) || "",
      bank_account_name: (user == null ? void 0 : user.bank_account_name) || "",
      bank_address: (user == null ? void 0 : user.bank_address) || "",
      settlement_type: (user == null ? void 0 : user.settlement_type) || DEFAULT_SETTLEMENT_TYPE,
      settlement_currency: (user == null ? void 0 : user.settlement_currency) || DEFAULT_SETTLEMENT_CURRENCY
    });
  }, [user]);
  reactExports.useEffect(() => {
    if (!(user == null ? void 0 : user.id)) return;
    setChannelLoading(true);
    client.get(`/api/v1/users/${user.id}/payment-channels`).then((res) => {
      var _a2, _b2, _c2, _d2;
      if (!res.ok) throw new Error(((_a2 = res.data) == null ? void 0 : _a2.detail) || "Unable to load payment channels");
      setChannelEligible(Boolean((_b2 = res.data) == null ? void 0 : _b2.eligible));
      setKrwBenefitThreshold(Number(((_c2 = res.data) == null ? void 0 : _c2.minimum_deposit_usdt) ?? 600));
      setPaymentChannels(((_d2 = res.data) == null ? void 0 : _d2.channels) || {});
    }).catch((error) => ue.error(error instanceof Error ? error.message : "Unable to load payment channels")).finally(() => setChannelLoading(false));
  }, [user == null ? void 0 : user.id]);
  reactExports.useEffect(() => {
    var _a2;
    if (!((_a2 = user == null ? void 0 : user.permissions) == null ? void 0 : _a2.is_super_admin)) return;
    setTossAccountsLoading(true);
    client.get("/api/v1/app-settings/toss-bank-accounts").then((res) => {
      var _a3, _b2;
      if (!res.ok) throw new Error(((_a3 = res.data) == null ? void 0 : _a3.detail) || "Unable to load Toss Bank accounts");
      setTossAccounts(((_b2 = res.data) == null ? void 0 : _b2.accounts) || []);
    }).catch((error) => ue.error(error instanceof Error ? error.message : "Unable to load Toss Bank accounts")).finally(() => setTossAccountsLoading(false));
  }, [(_a = user == null ? void 0 : user.permissions) == null ? void 0 : _a.is_super_admin]);
  reactExports.useEffect(() => {
    if (!(user == null ? void 0 : user.id)) return;
    client.get(`/api/v1/users/${user.id}/toss-virtual-account`).then((res) => {
      var _a2, _b2, _c2, _d2, _e2;
      if (res.ok) {
        setTossStatus(((_a2 = res.data) == null ? void 0 : _a2.status) || "not_started");
        setTossBenefitsUnlocked(Boolean((_c2 = (_b2 = res.data) == null ? void 0 : _b2.benefits) == null ? void 0 : _c2.unlocked));
        setKrwBenefitThreshold(Number(((_e2 = (_d2 = res.data) == null ? void 0 : _d2.benefits) == null ? void 0 : _e2.threshold_usdt) ?? 600));
      }
    }).catch(() => ue.error("Unable to load TOSS Virtual Account status"));
    client.get("/api/v1/app-settings/usdt-trc20-address").then((res) => {
      var _a2;
      if (res.ok) setUsdtDepositAddress(String(((_a2 = res.data) == null ? void 0 : _a2.address) || ""));
    }).catch(() => ue.error("USDT 입금 지갑 주소를 불러오지 못했습니다."));
  }, [user == null ? void 0 : user.id]);
  const submitTossApplication = async () => {
    var _a2, _b2, _c2;
    if (!(user == null ? void 0 : user.id) || !isTossStepValid(3)) return;
    setTossSaving(true);
    try {
      const res = await client.post(`/api/v1/users/${user.id}/toss-virtual-account`, {
        ...tossForm,
        signature_data: signatureData
      });
      if (!res.ok) throw new Error(((_a2 = res.data) == null ? void 0 : _a2.detail) || "Unable to submit application");
      setTossStatus(((_b2 = res.data) == null ? void 0 : _b2.status) || "pending_review");
      setTossWizardOpen(false);
      setTossStep(1);
      ue.success(
        ((_c2 = res.data) == null ? void 0 : _c2.message) || "TOSS Bank account application submitted. Please wait for your Relationship Manager's approval."
      );
    } catch (error) {
      ue.error(error instanceof Error ? error.message : "Unable to submit application");
    } finally {
      setTossSaving(false);
    }
  };
  const isTossStepValid = (step) => {
    if (step === 1) return tossForm.legal_name.trim().length >= 2 && tossForm.country.trim().length >= 2;
    if (step === 2) return tossForm.purpose.trim().length >= 5;
    return Boolean(tossForm.contact_email.trim() && signatureData && usdtDepositAddress.trim());
  };
  const openTossWizard = () => {
    setTossForm(createTossForm(user || void 0));
    setSignatureData("");
    setTossStep(1);
    setTossWizardOpen(true);
  };
  const closeTossWizard = (open) => {
    if (!open && !tossSaving) {
      setTossWizardOpen(false);
      setTossStep(1);
      setSignatureData("");
    }
  };
  const startSignature = (event) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext("2d");
    if (!context) return;
    isDrawingSignature.current = true;
    context.beginPath();
    context.moveTo(event.clientX - rect.left, event.clientY - rect.top);
    canvas.setPointerCapture(event.pointerId);
  };
  const drawSignature = (event) => {
    if (!isDrawingSignature.current) return;
    const canvas = signatureCanvasRef.current;
    const context = canvas == null ? void 0 : canvas.getContext("2d");
    if (!canvas || !context) return;
    const rect = canvas.getBoundingClientRect();
    context.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    context.stroke();
  };
  const finishSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || !isDrawingSignature.current) return;
    isDrawingSignature.current = false;
    setSignatureData(canvas.toDataURL("image/png"));
  };
  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    const context = canvas == null ? void 0 : canvas.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData("");
  };
  const updateTossField = (field, value) => {
    setTossForm((current) => ({ ...current, [field]: value }));
  };
  reactExports.useEffect(() => {
    const canvas = signatureCanvasRef.current;
    if (!tossWizardOpen || tossStep !== 3 || !canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    const context = canvas.getContext("2d");
    if (context) {
      context.scale(ratio, ratio);
      context.lineWidth = 2;
      context.lineCap = "round";
      context.strokeStyle = "#0f172a";
    }
  }, [tossWizardOpen, tossStep]);
  const togglePaymentChannel = (channel, checked) => {
    setPaymentChannels((current) => {
      const enabled = current[channelCurrency] || [];
      return {
        ...current,
        [channelCurrency]: checked ? [.../* @__PURE__ */ new Set([...enabled, channel])] : enabled.filter((value) => value !== channel)
      };
    });
  };
  const savePaymentChannels = async () => {
    var _a2, _b2;
    if (!(user == null ? void 0 : user.id)) return;
    setChannelSaving(true);
    try {
      const res = await client.request(`/api/v1/users/${user.id}/payment-channels`, "PUT", { channels: paymentChannels });
      if (!res.ok) throw new Error(((_a2 = res.data) == null ? void 0 : _a2.detail) || "Unable to update payment channels");
      setPaymentChannels(((_b2 = res.data) == null ? void 0 : _b2.channels) || paymentChannels);
      ue.success("Payment channels updated");
    } catch (error) {
      ue.error(error instanceof Error ? error.message : "Unable to update payment channels");
    } finally {
      setChannelSaving(false);
    }
  };
  const saveSettlement = async () => {
    var _a2;
    if (!(user == null ? void 0 : user.id)) return;
    if (!settlementForm.bank_name || !settlementForm.bank_account_number.trim() || !settlementForm.bank_account_name.trim()) {
      ue.error("Enter the Korean bank, account number, and account holder name.");
      return;
    }
    setSettlementSaving(true);
    try {
      const res = await client.request(`/api/v1/users/${user.id}/settlement`, "PATCH", {
        ...settlementForm,
        bank_name: settlementForm.bank_name,
        bank_account_number: settlementForm.bank_account_number.replace(/\s+/g, "").trim(),
        bank_account_name: settlementForm.bank_account_name.trim(),
        bank_address: settlementForm.bank_address.trim() || void 0,
        settlement_type: DEFAULT_SETTLEMENT_TYPE,
        settlement_currency: DEFAULT_SETTLEMENT_CURRENCY
      });
      if (!res.ok) throw new Error(((_a2 = res.data) == null ? void 0 : _a2.detail) || "Unable to save settlement account");
      setSettlementEditing(false);
      ue.success("Korean settlement account updated");
    } catch (error) {
      ue.error(error instanceof Error ? error.message : "Unable to save settlement account");
    } finally {
      setSettlementSaving(false);
    }
  };
  const updateTossAccount = (index, field, value) => {
    setTossAccounts((current) => current.map((account, accountIndex) => accountIndex === index ? { ...account, [field]: value } : account));
  };
  const addTossAccount = () => {
    setTossAccounts((current) => [...current, {
      value: `toss-${current.length + 1}`,
      label: "Toss Bank",
      bank_name: "Toss Bank",
      account_number: "",
      account_name: "",
      currency: "KRW"
    }]);
  };
  const saveTossAccounts = async () => {
    var _a2, _b2;
    if (!tossAccounts.length || tossAccounts.some((account) => !account.account_number.trim() || !account.account_name.trim())) {
      ue.error("Enter an account number and account holder name for every Toss Bank account.");
      return;
    }
    setTossAccountsSaving(true);
    try {
      const res = await client.request("/api/v1/app-settings/toss-bank-accounts", "PUT", { accounts: tossAccounts });
      if (!res.ok) throw new Error(((_a2 = res.data) == null ? void 0 : _a2.detail) || "Unable to save Toss Bank accounts");
      setTossAccounts(((_b2 = res.data) == null ? void 0 : _b2.accounts) || tossAccounts);
      ue.success("Toss Bank account pool updated");
    } catch (error) {
      ue.error(error instanceof Error ? error.message : "Unable to save Toss Bank accounts");
    } finally {
      setTossAccountsSaving(false);
    }
  };
  const ROWS = [
    { label: "Settlement type", value: (user == null ? void 0 : user.settlement_type) || DEFAULT_SETTLEMENT_TYPE },
    { label: "Settlement currency", value: (user == null ? void 0 : user.settlement_currency) || DEFAULT_SETTLEMENT_CURRENCY },
    { label: "Bank", value: user == null ? void 0 : user.bank_name },
    { label: "Account number", value: user == null ? void 0 : user.bank_account_number },
    { label: "Recipient", value: user == null ? void 0 : user.bank_account_name },
    { label: "USDT wallet", value: user == null ? void 0 : user.usdt_wallet_address },
    { label: "Address", value: user == null ? void 0 : user.bank_address }
  ];
  const selectedBank = KRW_BANKS.find((bank) => bank.name === settlementForm.bank_name);
  const savedBank = KRW_BANKS.find((bank) => bank.name === (user == null ? void 0 : user.bank_name));
  const isConfigured = Boolean(
    ((_b = user == null ? void 0 : user.bank_name) == null ? void 0 : _b.trim()) && ((_c = user == null ? void 0 : user.bank_account_number) == null ? void 0 : _c.trim()) && ((_d = user == null ? void 0 : user.bank_account_name) == null ? void 0 : _d.trim())
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter mx-auto w-full max-w-6xl space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs font-medium text-slate-400", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "text-slate-400 transition-colors hover:text-slate-200", onClick: () => navigate("/settings"), children: "Settings" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: "/" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600 font-semibold", children: "Banking" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => navigate("/settings"),
          "aria-label": "Back to settings",
          className: "app-touch-target rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 20 })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "m-0 text-2xl font-semibold tracking-tight text-slate-900", children: "Banking" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Manage KRW settlement details, deposit accounts, and payment availability." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block border-b-2 border-emerald-500 pb-3 text-[13px] font-semibold text-slate-900", children: "Settlement account" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-panel p-5 sm:p-7", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex flex-wrap items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-semibold text-slate-900", children: "Settlement account" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Review the KRW account used for settlement." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", onClick: () => setSettlementEditing((value) => !value), className: "shrink-0 gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { size: 15 }),
          " ",
          settlementEditing ? "Cancel" : "Edit account"
        ] })
      ] }),
      settlementEditing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 grid gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:grid-cols-2 sm:p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "settlement-bank-name", children: "Korean bank" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              BankLogo,
              {
                name: (selectedBank == null ? void 0 : selectedBank.name) || "Bank",
                code: selectedBank == null ? void 0 : selectedBank.code,
                size: "sm",
                className: "h-10 w-10 rounded-md"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: settlementForm.bank_name,
                onValueChange: (value) => setSettlementForm((current) => ({ ...current, bank_name: value })),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "settlement-bank-name", className: "min-w-0 flex-1 bg-white text-slate-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select a bank" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "max-h-80 bg-white", children: KRW_BANKS.map((bank) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: bank.name, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(BankLogo, { name: bank.name, code: bank.code, size: "sm", className: "h-8 w-8 rounded-md" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: bank.name })
                  ] }) }, bank.code)) })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "settlement-account-number", children: "Account number" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "settlement-account-number", inputMode: "numeric", autoComplete: "off", value: settlementForm.bank_account_number, onChange: (event) => setSettlementForm((current) => ({ ...current, bank_account_number: event.target.value })), placeholder: "Enter account number", className: "mt-1.5 bg-white" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "settlement-account-name", children: "Account holder name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "settlement-account-name", value: settlementForm.bank_account_name, onChange: (event) => setSettlementForm((current) => ({ ...current, bank_account_name: event.target.value })), placeholder: "Name registered with the bank", className: "mt-1.5 bg-white" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "settlement-bank-address", children: "Bank address (optional)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "settlement-bank-address", value: settlementForm.bank_address, onChange: (event) => setSettlementForm((current) => ({ ...current, bank_address: event.target.value })), placeholder: "Bank branch or address", className: "mt-1.5 bg-white" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sm:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-500", children: [
            "Settlement currency: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-slate-200", children: "KRW" }),
            "."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", onClick: saveSettlement, disabled: settlementSaving, children: settlementSaving ? "Saving..." : "Save settlement account" })
        ] })
      ] }),
      !isConfigured ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Landmark, { size: 32, className: "text-slate-300" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[16px] font-semibold text-slate-900 mb-2", children: "Not configured" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-slate-500 max-w-sm mx-auto", children: "No settlement account has been configured yet. Please update the details using the button above." })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-slate-50 border border-slate-100 rounded-2xl overflow-hidden shadow-sm", children: ROWS.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "flex items-center justify-between gap-6 bg-white px-5 py-5 transition-colors hover:bg-slate-50/50 sm:px-10 sm:py-6",
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-widest", children: row.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-3", children: [
              row.label === "Bank" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                PaymentBrandLogo,
                {
                  brand: (savedBank == null ? void 0 : savedBank.name) || row.value || "Bank",
                  logoUrl: savedBank == null ? void 0 : savedBank.logo,
                  size: "sm",
                  className: "h-9 w-12 rounded-md"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-[15px] font-semibold tracking-tight text-slate-900", children: row.value || "—" })
            ] })
          ] })
        },
        row.label
      )) })
    ] }),
    ((_e = user == null ? void 0 : user.permissions) == null ? void 0 : _e.is_super_admin) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-panel p-5 sm:p-7", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[16px] font-semibold text-slate-900", children: "TOSS Bank manual deposit account" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-slate-500 mt-1", children: "KRW wallet deposits use these details. Checkout sessions are assigned separately from the TOSS payment account pool in TOSS Bank Account Applications." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: addTossAccount, children: "Add deposit account" })
      ] }),
      tossAccountsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500", children: "Loading Toss Bank accounts..." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        tossAccounts.map((account, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Account number" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: account.account_number, onChange: (event) => updateTossAccount(index, "account_number", event.target.value), className: "mt-1.5" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Account holder" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: account.account_name, onChange: (event) => updateTossAccount(index, "account_name", event.target.value), className: "mt-1.5" })
          ] })
        ] }, `${account.value}-${index}`)),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", onClick: saveTossAccounts, disabled: tossAccountsSaving || !tossAccounts.length, children: tossAccountsSaving ? "Saving..." : "Save deposit account details" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-panel p-5 sm:p-7", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-lg", children: "🇰🇷" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[16px] font-semibold text-slate-900", children: "Korea payment channels" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400", children: "KRW checkout activation" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-slate-500 mt-3", children: "Activate the Korean payment methods your business accepts. Changes apply to KRW checkout only." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: savePaymentChannels,
            disabled: !channelEligible || channelLoading || channelSaving,
            children: [
              channelSaving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 16, className: "animate-spin mr-2" }) : null,
              "Save activation"
            ]
          }
        )
      ] }),
      channelLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 16, className: "animate-spin" }),
        " Loading channels..."
      ] }) : !channelEligible ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-800", children: krwBenefitThreshold === 0 ? "Make any positive USDT deposit and have it approved to enable payment channel settings." : `Make one approved USDT deposit of at least ${krwBenefitThreshold.toLocaleString()} USDT to enable payment channel settings.` }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-emerald-300", children: "Available for KRW" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-400", children: "Choose one or more payment channels." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300", children: "KRW" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            className: "border-slate-200 text-slate-700",
            onClick: () => navigate("/help/toss-pay-qr"),
            children: "TOSS Pay QR scan guide"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: KOREA_CHANNELS.map((channel) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-4 transition-colors hover:border-emerald-500/30", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              PaymentBrandLogo,
              {
                brand: channel.id === "bank_transfer" ? "Bank Transfer" : channel.label,
                size: "sm",
                className: `h-9 w-12 rounded-lg border-0 shadow-none ${channel.tone}`
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-800", children: channel.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] leading-4 text-slate-500", children: channel.description })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Switch,
            {
              checked: (paymentChannels[channelCurrency] || []).includes(channel.id),
              disabled: !channel.available,
              onCheckedChange: (checked) => togglePaymentChannel(channel.id, checked),
              "aria-label": `Enable ${channel.label}`
            }
          )
        ] }, channel.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-panel p-5 sm:p-7", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: "Toss Bank", size: "md", className: "h-8 w-20 rounded-lg" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[16px] font-semibold text-white", children: "토스 가상계좌" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-slate-400 mt-1", children: "글로벌 수금과 사업자 결제를 위한 원화(KRW) 가상계좌를 신청합니다." })
        ] }),
        tossStatus === "pending_review" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-semibold text-amber-300", children: "심사 중" })
      ] }),
      !tossBenefitsUnlocked ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-[13px] text-amber-100", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 18, className: "mt-0.5 shrink-0 text-amber-300" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "서비스 이용 조건" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-amber-200/80", children: krwBenefitThreshold === 0 ? "양수 금액의 USDT 입금이 승인되면 원화 가상계좌를 신청할 수 있습니다." : `승인된 USDT 입금액이 ${krwBenefitThreshold.toLocaleString()} USDT 이상이어야 원화 가상계좌를 신청할 수 있습니다.` })
        ] })
      ] }) : tossStatus === "pending_review" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-[13px] text-emerald-100", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 18, className: "mt-0.5 shrink-0 text-emerald-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "신청서가 접수되었습니다" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-emerald-200/80", children: "신청서가 접수되었습니다. 담당 Relationship Manager의 승인이 완료될 때까지 기다려 주세요. 승인 결과와 계좌 개설 안내는 이메일로 알려드립니다." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-emerald-200/70", children: "Your TOSS Bank account will be opened after your Relationship Manager approves the application." })
        ] })
      ] }) : tossStatus === "approved" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-[13px] text-emerald-100", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 18, className: "mt-0.5 shrink-0 text-emerald-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "TOSS Bank account approved" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-emerald-200/80", children: "Your Relationship Manager approved your application. Your TOSS Bank account opening will now be completed." })
        ] })
      ] }) : tossStatus === "rejected" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-[13px] text-red-100", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 18, className: "mt-0.5 shrink-0 text-red-300" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "TOSS Bank application needs changes" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-red-200/80", children: "Your Relationship Manager did not approve this application. Please contact support before submitting a new application." })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { "data-guide-target": "banking-toss-application", onClick: openTossWizard, className: "mt-6 bg-cyan-400 text-slate-950 hover:bg-cyan-300", children: "토스 가상계좌 신청" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: tossWizardOpen, onOpenChange: closeTossWizard, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-h-[90vh] overflow-y-auto sm:max-w-[640px] border-slate-700 bg-slate-950 text-white", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-3 text-xl font-semibold text-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: "Toss Bank", size: "lg", className: "h-9 w-24 rounded-lg" }),
          "토스 가상계좌 신청"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-400", children: "원화(KRW) 전용 가상계좌를 안전하게 신청하는 3단계 절차입니다." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2 pt-4", children: ["사업자 정보", "계좌 정보", "검토 및 서명"].map((label, index) => {
          const step = index + 1;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `border-t-2 pt-2 ${tossStep >= step ? "border-cyan-400" : "border-slate-700"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-[10px] font-semibold uppercase tracking-[0.12em] ${tossStep >= step ? "text-cyan-300" : "text-slate-500"}`, children: step }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `mt-1 text-xs ${tossStep >= step ? "text-slate-200" : "text-slate-500"}`, children: label })
          ] }, label);
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-5 text-slate-200", children: [
        tossStep === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-300", children: "법인명 또는 사업자명" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "mt-2 border-slate-700 bg-slate-900 text-white", value: tossForm.legal_name, onChange: (e) => updateTossField("legal_name", e.target.value), placeholder: "등록된 사업자명을 입력하세요" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-300", children: "사업자 등록 국가" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "mt-2 border-slate-700 bg-slate-900 text-white", value: tossForm.country, onChange: (e) => updateTossField("country", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-300", children: "사업자 유형" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "mt-2 h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white", value: tossForm.business_type, onChange: (e) => updateTossField("business_type", e.target.value), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "Corporation", children: "법인" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "Partnership", children: "파트너십" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "Sole proprietorship", children: "개인사업자" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "Non-profit", children: "비영리단체" })
            ] })
          ] })
        ] }),
        tossStep === 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-300", children: "예상 월 거래량" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "mt-2 h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white", value: tossForm.monthly_volume, onChange: (e) => updateTossField("monthly_volume", e.target.value), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "Under 100,000 KRW", children: "100,000 KRW 미만" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "100,000–1,000,000 KRW", children: "100,000–1,000,000 KRW" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "Over 1,000,000 KRW", children: "1,000,000 KRW 초과" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-300", children: "계좌 통화" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-3 text-sm font-semibold text-cyan-300", children: "KRW 원화 전용" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-slate-300", children: "계좌 사용 목적" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "mt-2 border-slate-700 bg-slate-900 text-white", value: tossForm.purpose, onChange: (e) => updateTossField("purpose", e.target.value) })
          ] })
        ] }),
        tossStep === 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "사업자명:" }),
            " ",
            tossForm.legal_name || "—"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "등록 정보:" }),
            " ",
            tossForm.country,
            " · ",
            tossForm.business_type
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "예상 거래량:" }),
            " ",
            tossForm.monthly_volume
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "통화:" }),
            " KRW 원화"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "사용 목적:" }),
            " ",
            tossForm.purpose || "—"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-cyan-200", children: "USDT 입금 안내" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-5 text-cyan-100/80", children: krwBenefitThreshold === 0 ? "양수 금액의 USDT 입금이 승인되어야 신청서를 제출할 수 있습니다. 계좌 개설 및 가상계좌 배정 비용은 별도로 확인해 주세요." : `신청서를 제출하려면 아래 지갑 주소로 최소 ${krwBenefitThreshold.toLocaleString()} USDT를 입금하고 승인을 받아야 합니다. 계좌 개설 및 가상계좌 배정 비용은 별도로 확인해 주세요.` }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-lg border border-slate-700 bg-slate-950 p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-400", children: "입금할 USDT 지갑 주소" }),
              usdtDepositAddress ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "min-w-0 flex-1 break-all font-mono text-xs text-white", children: usdtDepositAddress }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    size: "sm",
                    variant: "ghost",
                    className: "shrink-0 text-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-200",
                    onClick: () => navigator.clipboard.writeText(usdtDepositAddress).then(() => ue.success("USDT 입금 지갑 주소가 복사되었습니다.")),
                    children: "복사"
                  }
                )
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-amber-300", children: "현재 USDT 입금 지갑 주소가 설정되지 않았습니다. 관리자에게 문의해 주세요." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-cyan-100/70", children: "입금 네트워크와 주소를 반드시 확인한 후 전송하세요. 잘못된 네트워크로 보낸 자산은 복구되지 않을 수 있습니다." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block pt-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-slate-400", children: "담당자 이메일" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "email", className: "mt-2 border-slate-700 bg-slate-950 text-white", value: tossForm.contact_email, onChange: (e) => updateTossField("contact_email", e.target.value) })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "flex items-center gap-2 text-slate-300", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { size: 15, className: "text-cyan-300" }),
                "서명 입력"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "text-slate-400 hover:text-white", onClick: clearSignature, children: "지우기" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "canvas",
              {
                ref: signatureCanvasRef,
                className: "mt-2 h-36 w-full touch-none rounded-lg border border-slate-600 bg-white",
                onPointerDown: startSignature,
                onPointerMove: drawSignature,
                onPointerUp: finishSignature,
                onPointerCancel: finishSignature,
                onPointerLeave: finishSignature,
                "aria-label": "Signature drawing area"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "마우스나 손가락으로 서명란에 서명해 주세요." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "flex-row justify-between sm:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", className: "text-slate-400 hover:bg-slate-800 hover:text-white", onClick: () => tossStep === 1 ? closeTossWizard(false) : setTossStep(tossStep - 1), disabled: tossSaving, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 15, className: "mr-2" }),
          "Back"
        ] }),
        tossStep < 3 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => isTossStepValid(tossStep) && setTossStep(tossStep + 1), disabled: !isTossStepValid(tossStep), className: "bg-cyan-400 text-slate-950 hover:bg-cyan-300", children: [
          "Continue",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { size: 15, className: "ml-2" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: submitTossApplication, disabled: tossSaving || !isTossStepValid(3), className: "bg-cyan-400 text-slate-950 hover:bg-cyan-300", children: [
          tossSaving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 15, className: "mr-2 animate-spin" }) : null,
          "Submit request"
        ] })
      ] })
    ] }) })
  ] }) });
}
export {
  Banking as default
};
