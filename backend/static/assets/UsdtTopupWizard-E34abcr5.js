import { j as jsxRuntimeExports } from "./query-vendor-C49KnSO9.js";
import { a as reactExports } from "./router-vendor-N0qZPfHZ.js";
import { a$ as buildAuthHeaders, b as ue, L as Label, I as Input, Q as QRCodeSVG, e as Button } from "./index-CpEIrYHf.js";
import { A as ArrowRight, aC as Clock3, aG as Copy, y as CircleCheckBig, br as ImagePlus, aE as ArrowLeft, b as LoaderCircle } from "./utils-vendor-Bm5lXE_Q.js";
import "./ui-vendor-CXLHQPHT.js";
const COOLDOWN_SECONDS = 15 * 60;
function UsdtTopupWizard({ initialAmount = "", isKorean = false, onClose, onSuccess }) {
  const [step, setStep] = reactExports.useState(1);
  const [amount, setAmount] = reactExports.useState(initialAmount);
  const [address, setAddress] = reactExports.useState("");
  const [receipt, setReceipt] = reactExports.useState(null);
  const [txHash, setTxHash] = reactExports.useState("");
  const [note, setNote] = reactExports.useState("");
  const [secondsLeft, setSecondsLeft] = reactExports.useState(COOLDOWN_SECONDS);
  const [loading, setLoading] = reactExports.useState(false);
  reactExports.useEffect(() => {
    let active = true;
    fetch("/api/v1/bitgo/my-address", {
      credentials: "include",
      headers: buildAuthHeaders()
    }).then(async (response) => {
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Unable to load the BitGo USDT deposit address");
      }
      return response.json();
    }).then((data) => {
      if (active) setAddress(data.address || "");
    }).catch((error) => ue.error(error instanceof Error ? error.message : "Unable to load the USDT deposit address"));
    return () => {
      active = false;
    };
  }, []);
  reactExports.useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1e3);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);
  const countdown = reactExports.useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const seconds = (secondsLeft % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [secondsLeft]);
  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    ue.success("USDT address copied");
  };
  const goNext = () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      ue.error("Enter the USDT amount you will send");
      return;
    }
    if (!address) {
      ue.error("The USDT deposit address is not available yet");
      return;
    }
    if (secondsLeft <= 0) {
      ue.error("This deposit session has expired. Please start again.");
      return;
    }
    setStep(2);
  };
  const submitReceipt = async () => {
    const normalizedTxHash = txHash.trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(normalizedTxHash)) {
      ue.error("Enter the 64-character TRON transaction hash");
      return;
    }
    if (!receipt) {
      ue.error("Upload the successful transfer screenshot");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("amount_usdt", Number(amount).toFixed(2));
      formData.append("tx_hash", normalizedTxHash);
      formData.append("receipt", receipt);
      if (note.trim()) formData.append("note", note.trim());
      const response = await fetch("/api/v1/topup/request-with-receipt", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: buildAuthHeaders()
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Unable to submit the USDT top-up");
      ue.success(isKorean ? "USDT 충전 처리 중" : "Processing USDT Top-Up");
      await (onSuccess == null ? void 0 : onSuccess());
      onClose();
    } catch (error) {
      ue.error(error instanceof Error ? error.message : "Unable to submit the USDT top-up");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-orange-200 bg-white p-5 shadow-sm space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-orange-700", children: "USDT Top-Up" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900 mt-1", children: step === 1 ? "Send USDT to this address" : "Submit transfer proof" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClose, className: "text-sm text-slate-500 hover:text-slate-900", children: "Close" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-500", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: step === 1 ? "font-semibold text-orange-700" : "", children: "1. Send USDT" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3.5 w-3.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: step === 2 ? "font-semibold text-orange-700" : "", children: "2. Upload proof" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto inline-flex items-center gap-1 font-mono text-orange-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock3, { className: "h-3.5 w-3.5" }),
        countdown
      ] })
    ] }),
    step === 1 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-slate-700", children: "USDT amount to send" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: "1", step: "0.01", value: amount, onChange: (event) => setAmount(event.target.value), placeholder: "e.g. 100", className: "mt-2 bg-slate-50" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-4 rounded-lg border border-blue-200 bg-blue-50/60 p-4", children: [
        address ? /* @__PURE__ */ jsxRuntimeExports.jsx(QRCodeSVG, { value: address, size: 190, bgColor: "#ffffff", fgColor: "#0f172a", includeMargin: true }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-[190px] w-[190px] animate-pulse rounded bg-white" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full space-y-2 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-blue-900", children: "USDT TRC-20 deposit address" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "break-all rounded bg-white px-3 py-2 font-mono text-xs text-slate-700", children: address || "Loading address..." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: copyAddress, disabled: !address, className: "gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3.5 w-3.5" }),
            "Copy address"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900", children: "Send only USDT over the TRC-20 network. Send the exact amount, wait for the transfer to succeed, then continue and upload the screenshot from your wallet." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", onClick: goNext, className: "w-full bg-orange-600 hover:bg-orange-700 text-white gap-2", children: [
        "I sent the USDT ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-slate-700", children: "TRON transaction hash" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: txHash, onChange: (event) => setTxHash(event.target.value), placeholder: "Paste the 64-character transaction hash", className: "mt-2 bg-slate-50 font-mono text-xs" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4 mt-0.5 shrink-0" }),
        "Attach a clear screenshot showing the completed transfer, amount, destination, and transaction status."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-slate-700", children: "Successful transfer screenshot" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-600 hover:border-orange-400 hover:text-orange-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ImagePlus, { className: "h-5 w-5" }),
          receipt ? receipt.name : "Choose an image",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*,.pdf", className: "hidden", onChange: (event) => {
            var _a;
            return setReceipt(((_a = event.target.files) == null ? void 0 : _a[0]) || null);
          } })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-slate-700", children: "Note (optional)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: note, onChange: (event) => setNote(event.target.value), placeholder: "Transaction hash or additional details", className: "mt-2 bg-slate-50" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", onClick: () => setStep(1), className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
          "Back"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", onClick: submitReceipt, disabled: loading || secondsLeft <= 0, className: "flex-1 bg-orange-600 hover:bg-orange-700 text-white", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
          "Submitting..."
        ] }) : "Submit top-up request" })
      ] })
    ] })
  ] });
}
export {
  UsdtTopupWizard as default
};
