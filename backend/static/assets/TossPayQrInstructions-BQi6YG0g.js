import { j as jsxRuntimeExports } from "./query-vendor-C49KnSO9.js";
import { f as useNavigate, j as useSearchParams, a as reactExports } from "./router-vendor-N0qZPfHZ.js";
import { w as Layout, e as Button, L as Label, I as Input, Q as QRCodeSVG } from "./index-DquEFgr_.js";
import { o as openMobileDeepLink } from "./deeplinks-Bm8YbAYj.js";
import { aE as ArrowLeft, aI as ExternalLink, a4 as QrCode, bp as Camera, h as CircleCheck } from "./utils-vendor-Bm5lXE_Q.js";
import "./ui-vendor-CXLHQPHT.js";
const DEFAULT_QRPH_SAMPLE = "";
function TossPayQrInstructions() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialQr = params.get("qr") || DEFAULT_QRPH_SAMPLE;
  const [qrContent, setQrContent] = reactExports.useState(initialQr);
  const [amount, setAmount] = reactExports.useState(params.get("amount") || "");
  const normalizedQr = reactExports.useMemo(() => qrContent.trim(), [qrContent]);
  const normalizedAmount = reactExports.useMemo(() => amount.trim(), [amount]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto w-full max-w-4xl px-4 py-6 sm:px-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => navigate(-1),
            className: "inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
              "Back"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-3 text-2xl font-semibold text-slate-900", children: "Toss Pay — QR Scan Instructions" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-2xl text-sm leading-6 text-slate-600", children: "Use this guide to complete a QR payment using Toss. The QR preview below is generated from your SwiftPay QRPH payload, so you can verify what the payer will scan." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 sm:flex-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => {
              openMobileDeepLink({
                url: "supertoss://toss/pay",
                androidPackage: "viva.republica.toss"
              });
            },
            className: "gap-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-4 w-4" }),
              "Open Toss app"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", onClick: () => navigate("/settings/shop/settlement"), className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-4 w-4" }),
          "Banking settings"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(QrCode, { className: "h-5 w-5 text-slate-700" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-slate-900", children: "SwiftPay QRPH (Paste your QR content)" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-sm text-slate-600", children: [
          "Paste the QRPH/EMV payload string from your SwiftPay checkout (usually starts with ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: "000201" }),
          ")."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-slate-700", children: "QR content" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: qrContent,
                onChange: (event) => setQrContent(event.target.value),
                placeholder: "Paste QRPH payload here",
                className: "mt-2 font-mono text-xs"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs text-slate-500", children: [
              "Tip: You can open this page with query params: ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: "/help/toss-pay-qr?qr=..." })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold text-slate-700", children: "Amount (optional)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: amount,
                onChange: (event) => setAmount(event.target.value),
                inputMode: "decimal",
                placeholder: "e.g. 1000",
                className: "mt-2"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-slate-500", children: "Multi-currency note: QRPH is PHP-oriented. If you need KRW/USDT collection, use the KRW channels / USDT top-up flow." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "h-5 w-5 text-slate-700" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-slate-900", children: "What the payer scans" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-col items-center gap-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4", children: [
          normalizedQr ? /* @__PURE__ */ jsxRuntimeExports.jsx(QRCodeSVG, { value: normalizedQr, size: 220, bgColor: "#ffffff", fgColor: "#0f172a", includeMargin: true }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-[220px] w-[220px] animate-pulse rounded bg-white" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full space-y-2 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-blue-900", children: "SwiftPay QR (QRPH)" }),
            normalizedAmount ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-blue-900", children: [
              "Amount: ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: normalizedAmount })
            ] }) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "break-all rounded bg-white px-3 py-2 font-mono text-[11px] text-slate-700", children: normalizedQr || "Paste your QRPH payload to preview the QR." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "If the deep link doesn’t open" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs leading-5 text-amber-900/80", children: [
            "Open the Toss app manually, go to ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Pay" }),
            ", then tap ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Scan QR" }),
            ". If prompted, allow camera permission and scan the QR shown on this page."
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-slate-900", children: "Step-by-step" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "mt-4 grid gap-3 text-sm text-slate-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white", children: "1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "Open Toss" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: "On the home screen, go to Pay (or Payments)." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white", children: "2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "Tap Scan QR" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: "Allow camera permission if prompted." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white", children: "3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "Scan the SwiftPay QRPH" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: "Point the camera at the QR code shown above or on your SwiftPay checkout." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white", children: "4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "Confirm merchant + amount" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: "Double-check the merchant name and amount before paying." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white", children: "5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "Complete payment" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: "Save the receipt or screenshot the success page if your support team needs it." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 shrink-0" }),
        "Tip: For best results, open this page on the same device as Toss (or show the QR on a second device) so the payer can scan without switching apps."
      ] })
    ] })
  ] }) });
}
export {
  TossPayQrInstructions as default
};
