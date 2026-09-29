import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { S as StatusBadge } from "./StatusBadge-B48d0q3E.js";
import { a as useLanguage } from "./index-BaRDtvhG.js";
import { a as getTransactionStatus, i as isAwaitingApproval, b as getTransactionStatusLabel } from "./transactions-iCGOaGQ5.js";
function PaymentStatusBadge({
  transaction,
  size = "sm",
  showDot = false,
  className
}) {
  var _a;
  const { language } = useLanguage();
  const localizedLanguage = language === "zh" ? "zh" : language === "en" ? "en" : "ko";
  const status = getTransactionStatus(transaction);
  const awaitingApproval = isAwaitingApproval(transaction);
  const approvalRejected = ((_a = transaction.approval_status) == null ? void 0 : _a.trim().toLowerCase()) === "rejected";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex flex-wrap items-center gap-1.5 ${className || ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      StatusBadge,
      {
        status,
        label: getTransactionStatusLabel(status, localizedLanguage),
        size,
        showDot
      }
    ),
    awaitingApproval && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800", children: localizedLanguage === "ko" ? "승인 대기" : "Awaiting approval" }),
    approvalRejected && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-800", children: localizedLanguage === "ko" ? "검토 거부됨" : "Review rejected" })
  ] });
}
export {
  PaymentStatusBadge as P
};
