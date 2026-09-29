import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { a as reactExports, d as React } from "./router-vendor-C2eKMart.js";
import { K as buildAuthHeaders, P as PaymentBrandLogo, e as Button, b as ue } from "./index-C9--HWz5.js";
import { I as Input } from "./input-BNwcvOTx.js";
import { L as Label } from "./label-CTVR0ZgA.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Jb9qAn3I.js";
import { B as BankLogo, g as getBankDisplayName } from "./BankLogo-pizwWGBT.js";
import { bo as Clipboard, z as LoaderCircle } from "./utils-vendor-DoKCqRlq.js";
import "./ui-vendor-DsSOT9J9.js";
import "./krw-banks-KwwudeQI.js";
const getDepositDestinations = (currency = "PHP", _userId = "swiftpay-krw-virtual-account", _bankName = "", _accountHolderName = "") => {
  if (currency === "KRW") {
    return [];
  }
  return [{
    value: "Netbank",
    label: "Netbank",
    account_number: "041-105-00037-6",
    account_name: "Swift Technology Ventures Inc."
  }];
};
const TOPUP_METHODS = [
  { value: "same_bank", label: "Same-bank transfer" },
  { value: "interbank", label: "Interbank transfer" },
  { value: "cash_deposit", label: "Cash deposit" },
  { value: "check_deposit", label: "Check deposit" },
  { value: "international", label: "International transfer" }
];
function DepositWizard({ onSuccess, currency = "PHP", userId, bankName, accountHolderName, companyLogoUrl, destinations }) {
  var _a;
  const normalizedCurrency = String(currency || "PHP").toUpperCase();
  const isKrwFlow = normalizedCurrency === "KRW";
  const resolvedDestinations = reactExports.useMemo(
    () => destinations || getDepositDestinations(
      normalizedCurrency,
      userId || "swiftpay-krw-virtual-account",
      bankName || "Toss Bank",
      accountHolderName || "SwiftPay Ventures Inc."
    ),
    [normalizedCurrency, userId, bankName, accountHolderName, destinations]
  );
  const [configuredDestinations, setConfiguredDestinations] = reactExports.useState(destinations || null);
  React.useEffect(() => {
    if (destinations) return;
    fetch("/api/v1/bank-deposits/accounts", {
      credentials: "include",
      headers: buildAuthHeaders()
    }).then((response) => response.ok ? response.json() : Promise.reject(new Error("Failed to load deposit accounts"))).then((data) => setConfiguredDestinations((data.accounts || []).filter((item) => (item.currency || "PHP") === normalizedCurrency))).catch(() => void 0);
  }, [destinations, normalizedCurrency]);
  const activeDestinations = configuredDestinations === null ? resolvedDestinations : configuredDestinations;
  const [step, setStep] = reactExports.useState(1);
  const [depositAmount, setDepositAmount] = reactExports.useState("");
  const [depositChannel, setDepositChannel] = reactExports.useState(((_a = activeDestinations[0]) == null ? void 0 : _a.value) || "Netbank");
  const [depositMethod, setDepositMethod] = reactExports.useState(isKrwFlow ? "bank_transfer" : "same_bank");
  const [depositRefNumber, setDepositRefNumber] = reactExports.useState("");
  const [depositNotes, setDepositNotes] = reactExports.useState("");
  const [depositReceipt, setDepositReceipt] = reactExports.useState(null);
  const [depositDate, setDepositDate] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const [selectedHighValueDestination, setSelectedHighValueDestination] = reactExports.useState(null);
  const highValueDestinations = activeDestinations.filter((destination) => Number(destination.minimum_amount || 0) > 0);
  const isHighValueKrwTransfer = isKrwFlow && highValueDestinations.some((destination) => Number.parseFloat(depositAmount) >= Number(destination.minimum_amount));
  React.useEffect(() => {
    if (isHighValueKrwTransfer && !selectedHighValueDestination) {
      setSelectedHighValueDestination(highValueDestinations[Math.floor(Math.random() * highValueDestinations.length)] || null);
    } else if (!isHighValueKrwTransfer && selectedHighValueDestination) {
      setSelectedHighValueDestination(null);
    }
  }, [isHighValueKrwTransfer, selectedHighValueDestination, highValueDestinations]);
  const availableDestinations = isHighValueKrwTransfer && selectedHighValueDestination ? [selectedHighValueDestination] : activeDestinations.filter((destination) => !destination.minimum_amount);
  const selectedDestination = reactExports.useMemo(
    () => availableDestinations.find((d) => d.value === depositChannel) || availableDestinations[0],
    [depositChannel, availableDestinations]
  );
  const walletTopUpOptions = reactExports.useMemo(() => {
    const defaultOptions = [
      { value: "bank_transfer", label: isKrwFlow ? "은행 송금" : "Bank transfer", description: isKrwFlow ? "은행에서 직접 송금" : "Direct bank deposit or transfer", icon: "landmark" }
    ];
    return defaultOptions;
  }, [isKrwFlow]);
  React.useEffect(() => {
    if (depositMethod !== "bank_transfer") setDepositMethod("bank_transfer");
  }, [depositMethod, isKrwFlow]);
  React.useEffect(() => {
    var _a2;
    if (isHighValueKrwTransfer && selectedHighValueDestination && depositChannel !== selectedHighValueDestination.value) {
      setDepositChannel(selectedHighValueDestination.value);
    } else if (!isHighValueKrwTransfer && availableDestinations.some((destination) => destination.value === depositChannel)) {
      setDepositChannel(((_a2 = activeDestinations[0]) == null ? void 0 : _a2.value) || "Netbank");
    }
  }, [isHighValueKrwTransfer, depositChannel, activeDestinations, availableDestinations, selectedHighValueDestination]);
  const validStep1 = depositAmount && parseFloat(depositAmount) > 0;
  const validStep2 = Boolean(depositChannel && depositMethod);
  Boolean(depositReceipt && depositDate && depositRefNumber.trim());
  const goNext = () => {
    if (step === 1 && !validStep1) {
      ue.error(isKrwFlow ? "유효한 금액을 입력하세요." : "Enter a valid amount");
      return;
    }
    if (step === 2 && !validStep2) {
      ue.error(isKrwFlow ? "입금 계좌와 방법을 선택하세요." : "Choose destination and method");
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(1, s - 1));
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => ue.success(isKrwFlow ? "복사되었습니다." : "Copied"));
  };
  const previewUrl = depositReceipt ? URL.createObjectURL(depositReceipt) : null;
  const handleSubmit = async () => {
    var _a2;
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      ue.error(isKrwFlow ? "유효한 입금 금액을 입력하세요." : "Enter a valid deposit amount");
      return;
    }
    if (!depositChannel) {
      ue.error(isKrwFlow ? "입금 계좌를 선택하세요." : "Choose a destination bank");
      return;
    }
    if (!depositMethod.trim()) {
      ue.error(isKrwFlow ? "송금 방법을 선택하세요." : "Select a transfer method");
      return;
    }
    if (!depositDate) {
      ue.error(isKrwFlow ? "송금 날짜를 선택하세요." : "Select the transfer date");
      return;
    }
    if (!depositRefNumber.trim()) {
      ue.error(isKrwFlow ? "참조번호를 입력하세요." : "Enter the reference number");
      return;
    }
    if (!depositReceipt) {
      ue.error(isKrwFlow ? "송금 증빙을 업로드하세요." : "Upload proof of transaction");
      return;
    }
    setLoading(true);
    try {
      const selected = activeDestinations.find((d) => d.value === depositChannel) || activeDestinations[0];
      const accountNumber = (selected == null ? void 0 : selected.account_number) || depositChannel;
      let res, data;
      {
        const formData = new FormData();
        formData.append("amount_php", amount.toString());
        formData.append("currency", normalizedCurrency);
        formData.append("channel", depositChannel);
        formData.append("account_number", accountNumber);
        formData.append("transfer_method", depositMethod.trim());
        formData.append("ref_number", depositRefNumber.trim());
        formData.append("transfer_date", depositDate);
        if (depositNotes.trim()) formData.append("note", depositNotes.trim());
        formData.append("receipt", depositReceipt);
        res = await fetch("/api/v1/bank-deposits", {
          method: "POST",
          body: formData,
          credentials: "include",
          headers: buildAuthHeaders()
        });
        data = await res.json().catch(() => ({}));
      }
      if (res.ok && data && data.success) {
        ue.success(isKrwFlow ? "KRW 입금 완료 요청이 접수되었습니다. 은행 확인을 기다려 주세요." : `${normalizedCurrency} deposit completed - waiting for bank confirmation`);
        setDepositAmount("");
        setDepositChannel(((_a2 = activeDestinations[0]) == null ? void 0 : _a2.value) || "Netbank");
        setDepositMethod(isKrwFlow ? "bank_transfer" : "same_bank");
        setDepositRefNumber("");
        setDepositNotes("");
        setDepositReceipt(null);
        setDepositDate("");
        setStep(1);
        if (onSuccess) await onSuccess();
      } else {
        ue.error(data && (data.detail || data.error || data.message) || (isKrwFlow ? "입금 요청을 생성하지 못했습니다." : "Failed to create payment"));
      }
    } catch (e) {
      console.error("Manual deposit pay/create failed:", e);
      ue.error(isKrwFlow ? "네트워크 오류가 발생했습니다. 다시 시도하세요." : "Network error sending the manual deposit. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2", children: (isKrwFlow ? ["입금 방법 선택", "입금 정보", "입금 확인", "증빙 제출"] : ["Choose method", "Top up details", "Confirm top up", "Submit proof"]).map((t, i) => {
      const s = i + 1;
      const active = s === step;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-2xl border px-3 py-2 text-[11px] font-semibold ${active ? "border-blue-600 bg-blue-50 text-foreground" : "border-slate-200 bg-white text-slate-500"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-medium text-slate-500", children: [
          "Step ",
          s
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 leading-tight", children: t })
      ] }, t);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200 bg-slate-50 p-4", children: [
      step === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: isKrwFlow ? "입금 방법을 선택하세요" : "Choose how to top up" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-medium text-slate-700", children: isKrwFlow ? "입금 금액 (₩)" : "Top Up Amount (₱)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold", children: isKrwFlow ? "₩" : "₱" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                placeholder: "1000",
                value: depositAmount,
                onChange: (e) => setDepositAmount(e.target.value),
                min: "1000",
                className: "pl-8 bg-white border-slate-200 text-foreground"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-500 mt-1", children: isKrwFlow ? "최소 입금액: ₩1,000.00" : "Minimum deposit: ₱1,000.00" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: walletTopUpOptions.map((option) => {
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setDepositMethod(option.value),
              className: `rounded-2xl border p-4 text-left transition-all ${depositMethod === option.value ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-slate-200 bg-white hover:border-slate-300"}`,
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: option.label, size: "sm", className: "h-9 w-12 border-0 shadow-none" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm text-foreground", children: option.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-500 mt-1", children: option.description })
                ] })
              ] })
            },
            option.value
          );
        }) })
      ] }),
      step === 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: isKrwFlow ? "입금 정보" : "Top up details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-medium text-slate-700", children: isKrwFlow ? "입금 계좌" : "Top Up To" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: depositChannel, onValueChange: setDepositChannel, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-1 bg-white border-slate-200 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: isKrwFlow ? "계좌를 선택하세요" : "Select destination" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "bg-white border-slate-200", children: availableDestinations.map((dest) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: dest.value, children: [
                dest.label,
                dest.receiving_currency ? ` · ${dest.receiving_currency}` : ""
              ] }, dest.value)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-medium text-slate-700", children: isKrwFlow ? "송금 방법" : "Specific Method Details" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: depositMethod, onValueChange: setDepositMethod, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-1 bg-white border-slate-200 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: isKrwFlow ? "방법을 선택하세요" : "Select method" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "bg-white border-slate-200", children: TOPUP_METHODS.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: m.value, children: m.label }, m.value)) })
            ] })
          ] })
        ] })
      ] }),
      step === 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: isKrwFlow ? "KRW 입금 확인" : "Confirm top up" }),
        isKrwFlow && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-950", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "모바일 뱅킹 해외송금 안내" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "mt-2 list-decimal space-y-1 pl-4 leading-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "휴대폰에서 사용하는 은행 앱을 열고 ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "해외송금(International Transfer)" }),
              " 또는 SWIFT를 선택하세요."
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "화면 아래에 표시된 수취인 계좌의 은행명, 계좌번호, 수취인명, SWIFT/BIC를 그대로 입력하세요." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "앱에서 표시하는 환율과 수수료를 확인한 뒤 정확한 ",
              depositAmount || "입금",
              " 금액을 송금하세요."
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "송금이 완료되면 앱 영수증과 참조번호를 아래에 제출해 주세요." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center gap-3 border-b border-slate-100 pb-4", children: [
            companyLogoUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-16 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: companyLogoUrl, alt: selectedDestination.account_name || "Company logo", className: "h-full w-full object-contain" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(BankLogo, { name: selectedDestination.label, code: selectedDestination.bank_code, size: "md" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-500", children: isKrwFlow ? "Receiving bank" : "Company banking" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base font-semibold text-slate-900", children: getBankDisplayName(selectedDestination.label) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-600", children: selectedDestination.account_name })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-500", children: isKrwFlow ? "계좌번호" : "Account number" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "font-mono", children: selectedDestination.account_number }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", "aria-label": isKrwFlow ? "계좌번호 복사" : "Copy account number", title: isKrwFlow ? "계좌번호 복사" : "Copy account number", onClick: () => copyToClipboard(selectedDestination.account_number), className: "ml-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clipboard, { className: "h-4 w-4" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-500", children: isKrwFlow ? "예금주" : "Account name" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: selectedDestination.account_name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", "aria-label": isKrwFlow ? "예금주 복사" : "Copy account name", title: isKrwFlow ? "예금주 복사" : "Copy account name", onClick: () => copyToClipboard(selectedDestination.account_name), className: "ml-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clipboard, { className: "h-4 w-4" }) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid grid-cols-2 gap-3", children: [
            selectedDestination.swift_code && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-500", children: "SWIFT / BIC 코드" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "font-mono", children: selectedDestination.swift_code }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", "aria-label": "Copy SWIFT or BIC code", title: "Copy SWIFT or BIC code", onClick: () => copyToClipboard(selectedDestination.swift_code || ""), className: "ml-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clipboard, { className: "h-4 w-4" }) })
              ] })
            ] }),
            "bank_code" in selectedDestination && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-500", children: "Bank / branch code" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 font-mono text-sm", children: [
                selectedDestination.bank_code,
                " / ",
                selectedDestination.branch_code
              ] })
            ] }),
            (selectedDestination.receiving_currency || selectedDestination.currency) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-500", children: "Receiving currency" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 font-semibold", children: selectedDestination.receiving_currency || selectedDestination.currency })
            ] }),
            "bank_address" in selectedDestination && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-500", children: "Bank address" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm leading-5", children: selectedDestination.bank_address })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-500", children: isKrwFlow ? "금액" : "Amount" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-foreground font-semibold", children: [
                normalizedCurrency === "KRW" ? "₩" : "₱",
                depositAmount || "0.00"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-500", children: isKrwFlow ? "참조번호" : "Reference" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "REF-12345", value: depositRefNumber, onChange: (e) => setDepositRefNumber(e.target.value), className: "mt-1" })
            ] })
          ] })
        ] })
      ] }),
      step === 4 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: isKrwFlow ? "송금 증빙 제출" : "Submit proof" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-medium text-slate-700", children: "Proof of transaction" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*,.pdf", onChange: (e) => {
            var _a2;
            return setDepositReceipt(((_a2 = e.target.files) == null ? void 0 : _a2[0]) || null);
          }, className: "mt-2 block w-full" }),
          previewUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: previewUrl, alt: "preview", className: "mt-2 max-h-40 object-contain" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-medium text-slate-700", children: "Transfer Date" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: depositDate, onChange: (e) => setDepositDate(e.target.value), className: "mt-1" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-medium text-slate-700", children: "Reference Number" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "TRF-12345", value: depositRefNumber, onChange: (e) => setDepositRefNumber(e.target.value), className: "mt-1" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-medium text-slate-700", children: "Notes" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Optional notes for admin", value: depositNotes, onChange: (e) => setDepositNotes(e.target.value), className: "mt-1" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:justify-end mt-4", children: [
        step > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: goBack, className: "h-10 rounded-lg", children: "Back" }),
        step < 4 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: goNext, className: "h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white", children: "Continue" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSubmit, disabled: loading, className: "h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
          "Submit"
        ] }) : "Submit" })
      ] })
    ] })
  ] });
}
export {
  DepositWizard as default
};
