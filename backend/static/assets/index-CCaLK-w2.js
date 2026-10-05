import { j as jsxRuntimeExports } from "./query-vendor-C49KnSO9.js";
import { a as useLanguage, n as useTranslation, i as client, _ as getTranslation, u as useAuth, w as Layout, l as fmtCurrency, b as ue, $ as ResponsiveRoute } from "./index-DVjJBirV.js";
import { a as reactExports, f as useNavigate } from "./router-vendor-N0qZPfHZ.js";
import { a2 as CircleX, h as CircleCheck, j as CreditCard, aC as Clock3, b as LoaderCircle, R as RefreshCw, J as ChevronLeft, a5 as Search, z as CircleAlert, y as CircleCheckBig, d as ShieldCheck, X } from "./utils-vendor-Bm5lXE_Q.js";
import "./ui-vendor-CXLHQPHT.js";
function getApprovalPaymentStatus(payment) {
  return String(payment.payment_status || payment.status || "").trim().toLowerCase() || "unknown";
}
function getPaymentState(payment, translate) {
  const status = getApprovalPaymentStatus(payment);
  if (["failed", "cancelled", "canceled", "expired", "rejected"].includes(status)) {
    return {
      label: translate("approval_status_failed"),
      className: "border-red-200 bg-red-50 text-red-700",
      Icon: CircleX
    };
  }
  if (["paid", "completed", "complete", "success", "successful", "succeeded", "successfully_paid", "executed", "settled"].includes(status)) {
    return {
      label: translate("paid"),
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      Icon: CircleCheck
    };
  }
  if (status === "processing") {
    return {
      label: translate("approval_status_processing"),
      className: "border-blue-200 bg-blue-50 text-blue-700",
      Icon: CreditCard
    };
  }
  if (["pending", "created", "unpaid", "awaiting_payment"].includes(status)) {
    return {
      label: translate("pending"),
      className: "border-amber-200 bg-amber-50 text-amber-700",
      Icon: Clock3
    };
  }
  return {
    label: status.replace(/[_-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()),
    className: "border-slate-200 bg-slate-50 text-slate-600",
    Icon: CreditCard
  };
}
function PaymentStatus({ payment, compact = false }) {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const state = getPaymentState(payment, t);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex flex-wrap gap-1.5 ${compact ? "items-center" : "items-start"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "span",
    {
      title: `${t("approval_payment_status")}: ${state.label}`,
      className: `inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${state.className}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(state.Icon, { "aria-hidden": "true", className: "h-3 w-3" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: compact ? "sr-only" : "text-[9px] font-medium uppercase tracking-wide opacity-70", children: t("approval_payment_status") }),
        state.label
      ]
    }
  ) });
}
const detailRows = [
  ["sender_name", "approval_sender"],
  ["sender_bank", "approval_sender_bank"],
  ["sender_account_number", "approval_account_used"],
  ["receiver_bank", "approval_receiving_bank"],
  ["receiver_account_name", "approval_receiving_name"],
  ["receiver_account_number", "approval_account_received"],
  ["institution_reference_no", "approval_institution_reference"],
  ["channel_reference_no", "approval_channel_reference"],
  ["provider_status", "approval_provider_status"]
];
function PaymentTransferDetails({
  paymentId,
  hasSwiftpayDetails = false,
  storedDetails
}) {
  const { language } = useLanguage();
  const [details, setDetails] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const [expanded, setExpanded] = reactExports.useState(true);
  const fetchDetails = reactExports.useCallback(async () => {
    var _a, _b;
    setExpanded(true);
    setLoading(true);
    setError("");
    try {
      const response = await client.get(`/api/v1/admin/payment-approvals/${paymentId}/details`);
      if (!response.ok || !((_a = response.data) == null ? void 0 : _a.success)) {
        throw new Error(((_b = response.data) == null ? void 0 : _b.detail) || getTranslation(language, "approval_error_transfer_details"));
      }
      setDetails(response.data.data || {});
      setError(response.data.provider_lookup_error || "");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : getTranslation(language, "approval_error_transfer_details"));
    } finally {
      setLoading(false);
    }
  }, [paymentId, language]);
  reactExports.useEffect(() => {
    void fetchDetails();
  }, [fetchDetails]);
  const visibleDetails = details || storedDetails;
  const rows = detailRows.filter(([key]) => visibleDetails == null ? void 0 : visibleDetails[key]);
  if (!hasSwiftpayDetails && rows.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-slate-100 pt-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => expanded ? setExpanded(false) : void fetchDetails(),
        className: "inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-900",
        children: [
          loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 14, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 13 }),
          expanded ? getTranslation(language, "approval_hide_transfer_details") : hasSwiftpayDetails ? getTranslation(language, "approval_fetch_transfer_details") : getTranslation(language, "approval_view_transfer_details")
        ]
      }
    ),
    expanded && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: getTranslation(language, "approval_fetching_details") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      rows.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("dl", { className: "grid grid-cols-1 gap-2 sm:grid-cols-2", children: rows.map(([key, label]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-[10px] font-medium uppercase tracking-wide text-slate-400", children: getTranslation(language, label) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "mt-0.5 break-all text-xs font-medium text-slate-800", children: visibleDetails == null ? void 0 : visibleDetails[key] })
      ] }, key)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: getTranslation(language, "approval_no_transfer_details") }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-amber-700", children: error })
    ] }) })
  ] });
}
const KRW_PAYMENT_APPROVER_ID = "7851923260";
function filterVisiblePaymentApprovals(userId, payments) {
  if (userId === KRW_PAYMENT_APPROVER_ID) return payments;
  return payments.filter(
    (payment) => [payment.currency, payment.processing_currency].every(
      (currency) => (currency == null ? void 0 : currency.trim().toUpperCase()) !== "KRW"
    )
  );
}
function SuperAdminPaymentApprovalDesktop() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useTranslation(language);
  const { isSuperAdmin, user } = useAuth();
  const [payments, setPayments] = reactExports.useState([]);
  const [selectedIds, setSelectedIds] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [approving, setApproving] = reactExports.useState(null);
  const [error, setError] = reactExports.useState("");
  const [reviewPayment, setReviewPayment] = reactExports.useState(null);
  const [reviewNote, setReviewNote] = reactExports.useState("");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (!reviewPayment) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !approving) setReviewPayment(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [reviewPayment, approving]);
  reactExports.useEffect(() => {
    if (!isSuperAdmin) {
      navigate("/");
    }
  }, [isSuperAdmin, navigate]);
  reactExports.useEffect(() => {
    fetchPendingPayments();
  }, []);
  reactExports.useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchPendingPayments(false);
    }, 15e3);
    return () => window.clearInterval(intervalId);
  }, []);
  const fetchPendingPayments = async (showLoading = true) => {
    var _a, _b;
    try {
      if (showLoading) setLoading(true);
      const response = await client.get("/api/v1/admin/payment-approvals/pending");
      if (response.ok && ((_a = response.data) == null ? void 0 : _a.success)) {
        const nextPayments = response.data.data;
        const refreshedPayments = filterVisiblePaymentApprovals(
          user == null ? void 0 : user.id,
          Array.isArray(nextPayments) ? nextPayments : []
        );
        setPayments(refreshedPayments);
        setReviewPayment(
          (current) => current ? refreshedPayments.find((payment) => payment.id === current.id) || current : current
        );
        setError("");
      } else {
        const errorMsg = ((_b = response.data) == null ? void 0 : _b.detail) || t("approval_failed_fetch");
        setError(errorMsg);
        if (showLoading) setPayments([]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t("approval_failed_fetch");
      setError(errorMsg);
      if (showLoading) setPayments([]);
    } finally {
      setLoading(false);
    }
  };
  const approvePayment = async (paymentId) => {
    var _a, _b;
    try {
      setApproving(paymentId);
      const response = await client.post(`/api/v1/admin/payment-approvals/${paymentId}/approve`, {
        note: reviewNote.trim(),
        reason: reviewNote.trim() || "Manually approved by super admin"
      });
      if (response.ok && ((_a = response.data) == null ? void 0 : _a.success)) {
        ue.success(response.data.message || t("approval_payment_processed"));
        setPayments((prev) => prev.filter((p) => p.id !== paymentId));
        setSelectedIds((prev) => prev.filter((id) => id !== paymentId));
        setReviewPayment(null);
        setReviewNote("");
        await fetchPendingPayments(false);
      } else {
        ue.error(((_b = response.data) == null ? void 0 : _b.detail) || t("approval_failed_approve"));
      }
    } catch (err) {
      ue.error(err instanceof Error ? err.message : t("approval_error_approve"));
    } finally {
      setApproving(null);
    }
  };
  const rejectPayment = async (paymentId) => {
    var _a, _b;
    try {
      setApproving(paymentId);
      const response = await client.post(`/api/v1/admin/payment-approvals/${paymentId}/reject`, {
        note: "Rejected by super admin",
        reason: "Manually rejected by super admin"
      });
      if (response.ok && ((_a = response.data) == null ? void 0 : _a.success)) {
        ue.success(response.data.message || t("approval_payment_rejected"));
        setPayments((prev) => prev.filter((p) => p.id !== paymentId));
        setSelectedIds((prev) => prev.filter((id) => id !== paymentId));
        setReviewPayment(null);
        await fetchPendingPayments(false);
      } else {
        ue.error(((_b = response.data) == null ? void 0 : _b.detail) || t("approval_failed_reject"));
      }
    } catch (err) {
      ue.error(err instanceof Error ? err.message : t("approval_error_reject"));
    } finally {
      setApproving(null);
    }
  };
  const runBulk = async (action) => {
    for (const paymentId of selectedIds) {
      if (action === "approve") await approvePayment(paymentId);
      else await rejectPayment(paymentId);
    }
    setSelectedIds([]);
  };
  const formatDate = (dateString) => {
    const locale = language === "zh" ? "zh-CN" : language === "en" ? "en-US" : "ko-KR";
    return new Date(dateString).toLocaleString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };
  const visiblePayments = payments.filter((payment) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [
      payment.external_id,
      payment.store_name,
      payment.user_name,
      payment.customer_name,
      payment.description,
      payment.transaction_type
    ].some((value) => String(value || "").toLowerCase().includes(query));
  });
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center min-h-[60vh]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-blue-600" }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[12px] text-slate-400 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cursor-pointer hover:text-slate-600", onClick: () => navigate("/"), children: t("nav_dashboard") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: ">" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600 font-semibold", children: t("approval_page_title") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-7 flex items-start gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => navigate("/"),
          className: "w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 20 })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight text-slate-900 m-0", children: t("approval_page_title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500", children: t("approval_page_description") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => void fetchPendingPayments(false), disabled: loading, className: "ml-auto inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, className: loading ? "animate-spin" : "" }),
        " ",
        t("approval_refresh")
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 grid grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-amber-100 bg-amber-50 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock3, { size: 15 }),
          " ",
          t("approval_awaiting_review")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xl font-semibold text-slate-900", children: payments.length })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-blue-100 bg-blue-50 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-blue-700", children: t("approval_visible_requests") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xl font-semibold text-slate-900", children: visiblePayments.length })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-emerald-100 bg-emerald-50 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-emerald-700", children: t("approval_selected") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xl font-semibold text-slate-900", children: selectedIds.length })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative max-w-md flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 15, className: "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: searchQuery, onChange: (event) => setSearchQuery(event.target.value), placeholder: t("approval_search_placeholder"), className: "h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-medium text-slate-500", children: [
        payments.length,
        " ",
        t("approval_pending_count")
      ] })
    ] }),
    selectedIds.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium text-blue-900", children: [
        selectedIds.length,
        " ",
        t("approval_requests_selected")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => runBulk("approve"), className: "rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white", children: t("approval_approve_selected") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => runBulk("reject"), className: "rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white", children: t("approval_reject_selected") })
      ] })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "text-red-600 flex-shrink-0 mt-0.5", size: 18 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-600", children: error })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm", children: visiblePayments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-12 text-center", children: [
      payments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "mx-auto mb-4 h-12 w-12 text-emerald-500 opacity-50" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "mx-auto mb-4 h-12 w-12 text-slate-300" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-slate-600", children: payments.length === 0 ? t("approval_no_pending") : t("approval_no_matches") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500", children: payments.length === 0 ? t("approval_all_processed") : t("approval_try_search") })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-x-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50/50 border-b border-slate-100", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: visiblePayments.length > 0 && visiblePayments.every((payment) => selectedIds.includes(payment.id)),
              onChange: () => {
                const visibleIds = visiblePayments.map((payment) => payment.id);
                setSelectedIds((ids) => visibleIds.every((id) => ids.includes(id)) ? ids.filter((id) => !visibleIds.includes(id)) : Array.from(/* @__PURE__ */ new Set([...ids, ...visibleIds])));
              },
              "aria-label": t("approval_select_all")
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: "ID" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: t("approval_store") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: t("approval_amount") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: t("approval_type") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: t("approval_description") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: t("approval_date_time") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right", children: t("approval_actions") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-50", children: visiblePayments.map((payment) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50/30", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: selectedIds.includes(payment.id),
              onChange: () => setSelectedIds((ids) => ids.includes(payment.id) ? ids.filter((id) => id !== payment.id) : [...ids, payment.id]),
              "aria-label": `${t("approval_select_payment")} ${payment.id}`
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-8 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] font-mono text-slate-900 font-semibold truncate", children: payment.external_id || `#${payment.id}` }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-8 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] font-medium text-slate-700 truncate", children: payment.store_name || payment.user_name || payment.customer_name || t("approval_unknown") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-8 py-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] font-semibold text-slate-900 whitespace-nowrap", children: String(payment.external_id || "").startsWith("OPEN-AMOUNT-") && Number(payment.amount) <= 0 ? t("approval_custom_amount") : fmtCurrency(Number(payment.amount) || 0, payment.currency || "PHP") }),
            payment.exchange_rate && payment.processing_currency && payment.processing_currency !== payment.currency && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[10px] text-slate-500 whitespace-nowrap", children: [
              fmtCurrency(Number(payment.processing_amount) || 0, payment.processing_currency),
              " ·",
              " ",
              "1 ",
              payment.currency,
              " = ",
              Number(payment.exchange_rate).toFixed(6),
              " ",
              payment.processing_currency
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-8 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-medium text-slate-500 capitalize", children: payment.transaction_type === "payment_link" ? t("approval_payment_link") : payment.transaction_type === "swiftpay_order" ? "SwiftPay" : payment.transaction_type }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-8 py-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] text-slate-600 max-w-xs truncate", children: payment.description }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentStatus, { payment, compact: true }),
            payment.payment_received && /* @__PURE__ */ jsxRuntimeExports.jsx(
              PaymentTransferDetails,
              {
                paymentId: payment.id,
                hasSwiftpayDetails: payment.has_swiftpay_details,
                storedDetails: payment
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-8 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-500 font-medium whitespace-nowrap", children: formatDate(payment.created_at) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-8 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => {
                  setReviewNote("");
                  setReviewPayment(payment);
                },
                disabled: approving === payment.id || !payment.payment_received,
                title: !payment.payment_received ? t("approval_payment_received_required") : void 0,
                className: "px-3 py-2 bg-emerald-50 text-emerald-600 text-[12px] font-semibold border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50",
                children: approving === payment.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 14, className: "animate-spin" }) : t("approval_approve")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => rejectPayment(payment.id),
                disabled: approving === payment.id,
                className: "px-3 py-2 bg-red-50 text-red-600 text-[12px] font-semibold border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50",
                children: approving === payment.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 14, className: "animate-spin" }) : t("approval_reject")
              }
            )
          ] }) })
        ] }, payment.id)) })
      ] }),
      reviewPayment && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm sm:items-center", role: "dialog", "aria-modal": "true", "aria-labelledby": "approval-review-title", onMouseDown: (event) => {
        if (event.target === event.currentTarget && !approving) setReviewPayment(null);
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between border-b border-slate-100 px-6 py-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl bg-emerald-50 p-2 text-emerald-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 20 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-widest text-slate-400", children: t("approval_review_heading") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { id: "approval-review-title", className: "mt-1 text-lg font-semibold text-slate-900", children: t("approval_review_before") })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": t("approval_close_review"), onClick: () => setReviewPayment(null), disabled: Boolean(approving), className: "rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 18 }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: t("approval_store_merchant") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-medium text-slate-800", children: reviewPayment.store_name || reviewPayment.user_name || t("approval_unknown") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: t("approval_customer") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-medium text-slate-800", children: reviewPayment.customer_name || t("approval_unknown") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: t("approval_amount") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-base font-semibold text-slate-900", children: fmtCurrency(Number(reviewPayment.amount) || 0, reviewPayment.currency || "PHP") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: t("approval_submitted") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-medium text-slate-800", children: formatDate(reviewPayment.created_at) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: t("approval_payment_status") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentStatus, { payment: reviewPayment }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: t("approval_received_at") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-medium text-slate-800", children: reviewPayment.payment_received_at ? formatDate(reviewPayment.payment_received_at) : "—" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: t("approval_reference") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 break-all font-mono text-xs text-slate-700", children: reviewPayment.external_id || `#${reviewPayment.id}` })
            ] })
          ] }),
          reviewPayment.processing_currency && reviewPayment.processing_currency !== reviewPayment.currency && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800", children: [
            t("approval_settlement"),
            ": ",
            fmtCurrency(Number(reviewPayment.processing_amount) || 0, reviewPayment.processing_currency),
            " · 1 ",
            reviewPayment.currency,
            " = ",
            Number(reviewPayment.exchange_rate || 0).toFixed(6),
            " ",
            reviewPayment.processing_currency
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-500", children: t("approval_description") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-700", children: reviewPayment.description || t("approval_no_description") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { htmlFor: "approval-review-note", className: "text-xs font-medium text-slate-500", children: [
              t("approval_note"),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-normal text-slate-400", children: t("approval_optional") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { id: "approval-review-note", value: reviewNote, onChange: (event) => setReviewNote(event.target.value), maxLength: 500, rows: 3, placeholder: t("approval_internal_note_placeholder"), className: "mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-700", children: t("approval_warning") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setReviewPayment(null), disabled: Boolean(approving), className: "rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600", children: t("approval_cancel") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => void approvePayment(reviewPayment.id), disabled: approving === reviewPayment.id || !reviewPayment.payment_received, title: !reviewPayment.payment_received ? t("approval_payment_received_required") : void 0, className: "inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50", children: [
            approving === reviewPayment.id && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 15, className: "animate-spin" }),
            t("approval_confirm")
          ] })
        ] })
      ] }) })
    ] }) })
  ] }) });
}
function SuperAdminPaymentApprovalMobile() {
  var _a;
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useTranslation(language);
  const { isSuperAdmin, user } = useAuth();
  const [payments, setPayments] = reactExports.useState([]);
  const [selectedIds, setSelectedIds] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [approving, setApproving] = reactExports.useState(null);
  const [error, setError] = reactExports.useState("");
  const [reviewPayment, setReviewPayment] = reactExports.useState(null);
  const [reviewNote, setReviewNote] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (!reviewPayment) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !approving) setReviewPayment(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [reviewPayment, approving]);
  reactExports.useEffect(() => {
    if (!isSuperAdmin) {
      navigate("/");
    }
  }, [isSuperAdmin, navigate]);
  reactExports.useEffect(() => {
    fetchPendingPayments();
  }, []);
  reactExports.useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchPendingPayments(false);
    }, 15e3);
    return () => window.clearInterval(intervalId);
  }, []);
  const fetchPendingPayments = async (showLoading = true) => {
    var _a2, _b;
    try {
      if (showLoading) setLoading(true);
      const response = await client.get("/api/v1/admin/payment-approvals/pending");
      if (response.ok && ((_a2 = response.data) == null ? void 0 : _a2.success)) {
        const nextPayments = response.data.data;
        const refreshedPayments = filterVisiblePaymentApprovals(
          user == null ? void 0 : user.id,
          Array.isArray(nextPayments) ? nextPayments : []
        );
        setPayments(refreshedPayments);
        setReviewPayment(
          (current) => current ? refreshedPayments.find((payment) => payment.id === current.id) || current : current
        );
        setError("");
      } else {
        const errorMsg = ((_b = response.data) == null ? void 0 : _b.detail) || t("approval_failed_fetch");
        setError(errorMsg);
        if (showLoading) setPayments([]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t("approval_failed_fetch");
      setError(errorMsg);
      if (showLoading) setPayments([]);
    } finally {
      setLoading(false);
    }
  };
  const approvePayment = async (paymentId) => {
    var _a2, _b;
    try {
      setApproving(paymentId);
      const response = await client.post(`/api/v1/admin/payment-approvals/${paymentId}/approve`, {
        note: reviewNote.trim(),
        reason: reviewNote.trim() || "Manually approved by super admin"
      });
      if (response.ok && ((_a2 = response.data) == null ? void 0 : _a2.success)) {
        ue.success(response.data.message || t("approval_payment_processed"));
        setPayments((prev) => prev.filter((p) => p.id !== paymentId));
        setSelectedIds((prev) => prev.filter((id) => id !== paymentId));
        setReviewPayment(null);
        setReviewNote("");
        await fetchPendingPayments(false);
      } else {
        ue.error(((_b = response.data) == null ? void 0 : _b.detail) || t("approval_failed_approve"));
      }
    } catch (err) {
      ue.error(err instanceof Error ? err.message : t("approval_error_approve"));
    } finally {
      setApproving(null);
    }
  };
  const rejectPayment = async (paymentId) => {
    var _a2, _b;
    try {
      setApproving(paymentId);
      const response = await client.post(`/api/v1/admin/payment-approvals/${paymentId}/reject`, {
        note: "Rejected by super admin",
        reason: "Manually rejected by super admin"
      });
      if (response.ok && ((_a2 = response.data) == null ? void 0 : _a2.success)) {
        ue.success(response.data.message || t("approval_payment_rejected"));
        setPayments((prev) => prev.filter((p) => p.id !== paymentId));
        setSelectedIds((prev) => prev.filter((id) => id !== paymentId));
        setReviewPayment(null);
        await fetchPendingPayments(false);
      } else {
        ue.error(((_b = response.data) == null ? void 0 : _b.detail) || t("approval_failed_reject"));
      }
    } catch (err) {
      ue.error(err instanceof Error ? err.message : t("approval_error_reject"));
    } finally {
      setApproving(null);
    }
  };
  const runBulk = async (action) => {
    for (const paymentId of selectedIds) {
      if (action === "approve") await approvePayment(paymentId);
      else await rejectPayment(paymentId);
    }
    setSelectedIds([]);
  };
  const formatDate = (dateString) => {
    const locale = language === "zh" ? "zh-CN" : language === "en" ? "en-US" : "ko-KR";
    return new Date(dateString).toLocaleString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center min-h-[60vh]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-blue-600" }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter px-4 py-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold text-slate-900 mb-2", children: t("approval_page_title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: t("approval_awaiting_review") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100", children: payments.length })
      ] }),
      selectedIds.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mt-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => runBulk("approve"), className: "rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white", children: [
          t("approval_approve"),
          " ",
          selectedIds.length
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => runBulk("reject"), className: "rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white", children: [
          t("approval_reject"),
          " ",
          selectedIds.length
        ] })
      ] })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-start", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "text-red-600 flex-shrink-0 mt-0.5", size: 16 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-red-600", children: error })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: payments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 text-center bg-white rounded-lg border border-slate-200", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-50" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-slate-600", children: t("approval_no_pending") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 mt-1", children: t("approval_all_processed") })
    ] }) : payments.map((payment) => {
      var _a2;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-lg p-4 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-xs text-slate-500", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: selectedIds.includes(payment.id),
                onChange: () => setSelectedIds((ids) => ids.includes(payment.id) ? ids.filter((id) => id !== payment.id) : [...ids, payment.id]),
                "aria-label": `${t("approval_select_payment")} ${payment.id}`
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: payment.external_id || `#${payment.id}` })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentStatus, { payment, compact: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-mono text-slate-500 truncate", children: payment.external_id || `#${payment.id}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-900 mt-1", children: ((_a2 = payment.external_id) == null ? void 0 : _a2.startsWith("OPEN-AMOUNT-")) && payment.amount <= 0 ? t("approval_custom_amount") : fmtCurrency(payment.amount, payment.currency) }),
            payment.exchange_rate && payment.processing_currency && payment.processing_currency !== payment.currency && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[10px] text-slate-500", children: [
              fmtCurrency(payment.processing_amount || 0, payment.processing_currency),
              " ·",
              " ",
              "1 ",
              payment.currency,
              " = ",
              payment.exchange_rate.toFixed(6),
              " ",
              payment.processing_currency
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded whitespace-nowrap", children: payment.transaction_type === "payment_link" ? t("approval_payment_link") : payment.transaction_type === "swiftpay_order" ? "SwiftPay" : payment.transaction_type })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-slate-100 pt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 font-medium mb-1", children: t("approval_store") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-700 font-medium", children: payment.store_name || payment.user_name || payment.customer_name || t("approval_unknown") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-slate-100 pt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 font-medium mb-1", children: t("approval_description") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-600 line-clamp-2", children: payment.description })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-slate-100 pt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 font-medium mb-1", children: t("approval_date_time") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-600", children: formatDate(payment.created_at) })
        ] }),
        payment.payment_received && /* @__PURE__ */ jsxRuntimeExports.jsx(
          PaymentTransferDetails,
          {
            paymentId: payment.id,
            hasSwiftpayDetails: payment.has_swiftpay_details,
            storedDetails: payment
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-slate-100 pt-3 flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => {
                setReviewNote("");
                setReviewPayment(payment);
              },
              disabled: approving === payment.id || !payment.payment_received,
              title: !payment.payment_received ? t("approval_payment_received_required") : void 0,
              className: "flex-1 px-3 py-2 bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-200 rounded-md hover:bg-emerald-100 disabled:opacity-50",
              children: approving === payment.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 12, className: "animate-spin mx-auto" }) : t("approval_approve")
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => rejectPayment(payment.id),
              disabled: approving === payment.id,
              className: "flex-1 px-3 py-2 bg-red-50 text-red-600 text-xs font-semibold border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50",
              children: approving === payment.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 12, className: "animate-spin mx-auto" }) : t("approval_reject")
            }
          )
        ] })
      ] }, payment.id);
    }) }),
    reviewPayment && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm sm:items-center", role: "dialog", "aria-modal": "true", "aria-labelledby": "mobile-approval-review-title", onMouseDown: (event) => {
      if (event.target === event.currentTarget && !approving) setReviewPayment(null);
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl bg-white p-5 shadow-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl bg-emerald-50 p-2 text-emerald-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 18 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-widest text-slate-400", children: t("approval_review_heading") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { id: "mobile-approval-review-title", className: "mt-1 text-lg font-semibold text-slate-900", children: t("approval_review_before") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": t("approval_close_review"), onClick: () => setReviewPayment(null), disabled: Boolean(approving), className: "rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 18 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "mt-4 space-y-3 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-xs text-slate-400", children: t("approval_store") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "font-medium text-slate-800", children: reviewPayment.store_name || reviewPayment.user_name || reviewPayment.customer_name || t("approval_unknown") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-xs text-slate-400", children: t("approval_date_time") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "font-medium text-slate-800", children: formatDate(reviewPayment.created_at) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-xs text-slate-400", children: t("approval_payment_status") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "mt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentStatus, { payment: reviewPayment }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-xs text-slate-400", children: t("approval_received_at") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "font-medium text-slate-800", children: reviewPayment.payment_received_at ? formatDate(reviewPayment.payment_received_at) : "—" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-xs text-slate-400", children: t("approval_customer") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "font-medium text-slate-800", children: reviewPayment.customer_name || t("approval_unknown") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-xs text-slate-400", children: t("approval_reference") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "font-mono text-xs text-slate-800", children: reviewPayment.external_id || `#${reviewPayment.id}` })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-xs text-slate-400", children: t("approval_amount") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "text-base font-semibold text-slate-900", children: fmtCurrency(reviewPayment.amount, reviewPayment.currency) })
        ] }),
        reviewPayment.processing_currency && reviewPayment.processing_currency !== reviewPayment.currency && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-xs text-slate-400", children: t("approval_settlement") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("dd", { className: "font-medium text-slate-800", children: [
            fmtCurrency(reviewPayment.processing_amount || 0, reviewPayment.processing_currency),
            " · 1 ",
            reviewPayment.currency,
            " = ",
            (_a = reviewPayment.exchange_rate) == null ? void 0 : _a.toFixed(6),
            " ",
            reviewPayment.processing_currency
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-xs text-slate-400", children: t("approval_description") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "text-slate-700", children: reviewPayment.description || "—" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { htmlFor: "mobile-approval-review-note", className: "text-xs font-medium text-slate-500", children: [
          t("approval_note"),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-normal text-slate-400", children: t("approval_optional") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { id: "mobile-approval-review-note", value: reviewNote, onChange: (event) => setReviewNote(event.target.value), maxLength: 500, rows: 3, placeholder: t("approval_internal_note_short"), className: "mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xs text-amber-700", children: t("approval_warning_short") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex justify-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setReviewPayment(null), className: "rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600", children: t("approval_cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => void approvePayment(reviewPayment.id), disabled: approving === reviewPayment.id || !reviewPayment.payment_received, title: !reviewPayment.payment_received ? t("approval_payment_received_required") : void 0, className: "inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50", children: [
          approving === reviewPayment.id && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 15, className: "animate-spin" }),
          t("approval_confirm")
        ] })
      ] })
    ] }) })
  ] }) });
}
function SuperAdminPaymentApproval() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ResponsiveRoute,
    {
      desktopComponent: SuperAdminPaymentApprovalDesktop,
      mobileComponent: SuperAdminPaymentApprovalMobile,
      tabletComponent: SuperAdminPaymentApprovalMobile
    }
  );
}
export {
  SuperAdminPaymentApproval as default
};
