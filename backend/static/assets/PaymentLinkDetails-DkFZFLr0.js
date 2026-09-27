import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { i as useParams, e as useNavigate, a as reactExports } from "./router-vendor-C2eKMart.js";
import { a as useLanguage, L as Layout, h as fmtCurrency, b as ue, g as client } from "./index-DrbT3WcF.js";
import { c as copyTextToClipboard } from "./clipboard-B4pReMJK.js";
import { b as getPaymentLink, a as getIdentifiedPaymentLinkUrl, n as normalizePaymentStatus, u as updatePaymentLink, t as togglePaymentLinkStatus, d as getPaymentStatusLabel } from "./paymentLinks-BlbKzDwi.js";
import { v as ChevronLeft, ap as Copy, X, Z as RefreshCw } from "./utils-vendor-BFordG78.js";
import "./ui-vendor-DsSOT9J9.js";
function PaymentLinkDetails() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isKorean = language === "ko";
  const [link, setLink] = reactExports.useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!code) {
      setLink(null);
      return;
    }
    const storedLink = getPaymentLink(code) ?? null;
    setLink(storedLink);
    if ((storedLink == null ? void 0 : storedLink.provider) === "swiftpay") {
      let active2 = true;
      const refreshSwiftPayLink = async () => {
        var _a, _b, _c;
        try {
          const response = await client.get(`/api/v1/swiftpay/payment-links/${encodeURIComponent(storedLink.code)}`);
          if (!response.ok || !((_a = response.data) == null ? void 0 : _a.success)) {
            const message = ((_b = response.data) == null ? void 0 : _b.detail) || ((_c = response.data) == null ? void 0 : _c.error) || `Request failed (${response.status})`;
            ue.error(String(message));
            return;
          }
          if (!active2) return;
          const remoteLink = response.data.data || {};
          const remoteStatus = String(remoteLink.linkStatus || "").toUpperCase();
          const updated = updatePaymentLink(storedLink.code, {
            status: remoteStatus === "INACTIVE" ? "Inactive" : remoteStatus === "ACTIVE" ? "Active" : storedLink.status,
            paymentUrl: remoteLink.paymentUrl || storedLink.paymentUrl,
            paymentStatus: remoteLink.paymentStatus || storedLink.paymentStatus
          });
          if (updated) setLink(updated);
        } catch {
          if (active2) ue.error(isKorean ? "결제 링크 정보를 불러올 수 없습니다." : "Unable to refresh payment link details");
        }
      };
      void refreshSwiftPayLink();
      return () => {
        active2 = false;
      };
    }
    if (!(storedLink == null ? void 0 : storedLink.externalId)) return;
    let active = true;
    const refreshStatus = async () => {
      var _a, _b;
      try {
        const response = await client.get(`/api/v1/payments/checkout/${encodeURIComponent(storedLink.externalId)}/status`);
        const status = String(((_a = response.data) == null ? void 0 : _a.status) || "").toLowerCase();
        if (!active || !status) return;
        const updated = updatePaymentLink(code, {
          paymentStatus: status,
          paymentUpdatedAt: ((_b = response.data) == null ? void 0 : _b.updated_at) || void 0
        });
        if (updated) setLink(updated);
      } catch {
      }
    };
    refreshStatus();
    const interval = window.setInterval(refreshStatus, 5e3);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [code, isKorean]);
  if (!link) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[12px] text-slate-400 mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cursor-pointer hover:text-slate-600", onClick: () => navigate("/pay-by-link"), children: isKorean ? "결제 링크" : "Payment links" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: ">" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600 font-medium", children: "Link details" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-8 shadow-sm max-w-[640px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight text-slate-900 mb-4", children: isKorean ? "결제 링크를 찾을 수 없습니다" : "Payment link not found" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] text-slate-500", children: isKorean ? "요청한 결제 링크가 없거나 삭제되었습니다." : "The payment link you are looking for does not exist or has been removed." })
      ] })
    ] }) });
  }
  const permanentLinkUrl = getIdentifiedPaymentLinkUrl(link, window.location.origin);
  const currencyCode = String((link == null ? void 0 : link.currency) || "PHP").toUpperCase();
  const krwBankAccount = link.bankAccountDetails;
  const paymentStatus = normalizePaymentStatus(link.paymentStatus);
  const isPaid = paymentStatus === "paid";
  const isPaymentPending = paymentStatus === "pending";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[12px] text-slate-400 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cursor-pointer hover:text-slate-600", onClick: () => navigate("/pay-by-link"), children: isKorean ? "결제 링크" : "Payment links" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: ">" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600 font-semibold", children: "Link details" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => navigate("/pay-by-link"),
          className: "w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 20 })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight text-slate-900 m-0", children: isKorean ? "결제 링크" : "Payment link" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 shadow-lg shadow-slate-200/40 text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] uppercase tracking-[0.22em] text-slate-300 mb-3", children: isKorean ? "안전한 송금" : "Secure transfer" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-4xl font-semibold tracking-tight", children: fmtCurrency(link.amount, link.currency) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-200", children: currencyCode })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-slate-300", children: link.title })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 self-start rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full bg-emerald-400" }),
        link.status
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-8 shadow-sm mb-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-12 mb-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DetailItem, { label: isKorean ? "통화" : "Amount currency", value: currencyCode }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DetailItem, { label: isKorean ? "코드" : "Code", value: link.code }),
        link.provider === "swiftpay" && /* @__PURE__ */ jsxRuntimeExports.jsx(DetailItem, { label: isKorean ? "결제 제공자" : "Provider", value: "SwiftPay" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DetailItem, { label: isKorean ? "생성일" : "Created on", value: link.created }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DetailItem, { label: isKorean ? "유효 기간" : "Valid until", value: link.validUntil }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DetailItem, { label: isKorean ? "설명" : "Description", value: link.description }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DetailItem, { label: isKorean ? "주문번호" : "Order number", value: link.orderNo }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DetailItem, { label: isKorean ? "결제자" : "Payor", value: link.payor })
      ] }),
      currencyCode === "KRW" && (link.qrCodeUrl || krwBankAccount) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-10 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50 p-5 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[15px] font-semibold text-amber-900", children: krwBankAccount ? "한국 KRW 해외송금 안내" : isKorean ? "SwiftPay QR 결제" : "SwiftPay QR payment" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "uppercase tracking-wide text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-1", children: isKorean ? "KRW 송금" : "KRW transfer" })
        ] }),
        krwBankAccount && /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "mb-5 list-decimal space-y-1 pl-5 text-xs text-amber-900", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "한국 은행 앱 또는 영업점에서 해외송금(International Transfer) 또는 SWIFT를 선택하세요." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "아래 수취 은행, 계좌번호, SWIFT/BIC 정보를 정확히 입력하세요." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "송금 메모에 이 결제 링크의 참조번호를 입력하세요. SwiftPay 관리자가 입금을 확인하고 승인한 후 결제 상태가 업데이트됩니다." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start", children: [
          link.qrCodeUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-amber-200 bg-white p-3 flex items-center justify-center shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: link.qrCodeUrl, alt: "KRW transfer QR", className: "w-[180px] h-[180px] object-contain" }) }) : null,
          krwBankAccount ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 text-sm text-amber-900", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-white/80 border border-amber-200 p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1", children: "수취 은행" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: krwBankAccount.bank_name })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-white/80 border border-amber-200 p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1", children: "예금주" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: krwBankAccount.account_name })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-white/80 border border-amber-200 p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1", children: "계좌번호" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono font-semibold", children: krwBankAccount.number })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-white/80 border border-amber-200 p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1", children: "SWIFT / BIC" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono font-semibold", children: krwBankAccount.swift_code })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-white/80 border border-amber-200 p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1", children: "참조번호" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono font-semibold", children: link.code })
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-amber-900", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: isKorean ? "지원되는 한국 은행 앱으로 이 SwiftPay QR을 스캔하세요." : "Scan this SwiftPay QR with a supported Korean banking app." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2", children: isKorean ? "결제 금액과 참조번호가 QR에 이미 포함되어 있습니다." : "The payment amount and reference are already attached to the QR." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col md:flex-row items-center gap-4 mb-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] text-slate-500 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: permanentLinkUrl || (isKorean ? "결제 URL을 사용할 수 없습니다" : "No payment URL available") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: async () => {
              if (!permanentLinkUrl) {
                ue.error(isKorean ? "이 링크에 결제 URL이 없습니다." : "No payment URL available for this link");
                return;
              }
              const success = await copyTextToClipboard(permanentLinkUrl);
              if (success) {
                ue.success(isKorean ? "결제 링크가 복사되었습니다." : "Copied payment link");
              } else {
                ue.error(isKorean ? "결제 링크를 복사할 수 없습니다." : "Unable to copy payment link");
              }
            },
            className: "flex items-center gap-2 text-[12px] font-semibold text-slate-900 hover:text-[#FF6B00] transition-colors whitespace-nowrap ml-4",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 14 }),
              isKorean ? "링크 복사" : "Copy link"
            ]
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: async () => {
              const success = await copyTextToClipboard(permanentLinkUrl);
              if (success) {
                ue.success(isKorean ? "결제 링크가 복사되었습니다." : "Copied payment link");
              } else {
                ue.error(isKorean ? "결제 링크를 복사할 수 없습니다." : "Unable to copy payment link");
              }
            },
            className: "h-9 px-6 bg-white border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-900 hover:bg-slate-50 flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 14 }),
              " ",
              isKorean ? "링크 복사" : "Copy link"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: async () => {
              var _a, _b, _c;
              if (!link) return;
              if (link.provider === "swiftpay") {
                if (link.status !== "Active") return;
                const confirmed = window.confirm(
                  isKorean ? "이 결제 링크는 비활성화 후 다시 활성화할 수 없습니다. 계속하시겠습니까?" : "This SwiftPay payment link cannot be reactivated after invalidation. Continue?"
                );
                if (!confirmed) return;
                setIsUpdatingStatus(true);
                try {
                  const response = await client.request(
                    `/api/v1/swiftpay/payment-links/${encodeURIComponent(link.code)}`,
                    "DELETE"
                  );
                  if (!response.ok || !((_a = response.data) == null ? void 0 : _a.success)) {
                    const message = ((_b = response.data) == null ? void 0 : _b.detail) || ((_c = response.data) == null ? void 0 : _c.error) || `Request failed (${response.status})`;
                    ue.error(String(message));
                    return;
                  }
                  const updated2 = updatePaymentLink(link.code, { status: "Inactive" });
                  if (updated2) {
                    setLink(updated2);
                    ue.success(isKorean ? "결제 링크가 비활성화되었습니다." : "Payment link invalidated");
                  }
                } catch {
                  ue.error(isKorean ? "결제 링크를 비활성화할 수 없습니다." : "Unable to invalidate payment link");
                } finally {
                  setIsUpdatingStatus(false);
                }
                return;
              }
              const updated = togglePaymentLinkStatus(link.code);
              if (updated) {
                setLink(updated);
                ue.success(`Link ${updated.status === "Active" ? "reactivated" : "deactivated"}`);
              }
            },
            disabled: isUpdatingStatus || link.provider === "swiftpay" && link.status !== "Active",
            className: "h-9 px-6 bg-white border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-900 hover:bg-slate-50 flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16, className: "text-slate-400" }),
              link.provider === "swiftpay" ? isKorean ? "비활성화" : "Invalidate link" : link.status === "Active" ? "Deactivate link" : "Activate link"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[16px] font-semibold text-slate-900 mb-4", children: isKorean ? "결제 내역" : "Payment history" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "-mx-3 w-[calc(100%+1.5rem)] overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm sm:mx-0 sm:w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full min-w-[640px] text-left border-collapse sm:min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50/50 border-b border-slate-100", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: "PAYMENT" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: "REFERENCE NO" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: "DATE" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: "PAYMENT STATUS" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50/30 transition-colors", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-8 py-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 16 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] font-semibold text-slate-900", children: fmtCurrency(link.amount, link.currency) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-400", children: "-" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-8 py-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[12px] text-slate-600 font-medium", children: link.code }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: async () => {
                const success = await copyTextToClipboard(link.code);
                if (success) {
                  ue.success("Reference copied to clipboard");
                } else {
                  ue.error("Unable to copy reference");
                }
              },
              className: "text-slate-300 hover:text-slate-500 transition-colors",
              "aria-label": "Copy reference",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 12 })
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-8 py-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-slate-500", children: [
            "Created on: ",
            link.created
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-slate-400", children: [
            "Executed on: ",
            link.paymentUpdatedAt ? new Date(link.paymentUpdatedAt).toLocaleString() : "-"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-8 py-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold border ${isPaid ? "bg-emerald-50 text-emerald-600 border-emerald-100" : isPaymentPending ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-red-50 text-red-600 border-red-100"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `w-1.5 h-1.5 rounded-full ${isPaid ? "bg-emerald-500" : isPaymentPending ? "bg-amber-500" : "bg-red-500"}` }),
          getPaymentStatusLabel(link.paymentStatus)
        ] }) })
      ] }) })
    ] }) })
  ] }) });
}
function DetailItem({ label, value }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-2", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] font-semibold text-slate-800", children: value })
  ] });
}
export {
  PaymentLinkDetails as default
};
