import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { a as reactExports } from "./router-vendor-C2eKMart.js";
import { L as Layout, g as client, e as Button, T as Textarea, b as ue } from "./index-PXRdWIAr.js";
import { n as normalizeKrwBankName } from "./krw-banks-BXy8-Tdf.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-BXh6FG7t.js";
import { I as Input } from "./input-GT55LcvP.js";
import { S as Switch } from "./switch-DrRnvhrm.js";
import { c as copyTextToClipboard } from "./clipboard-B4pReMJK.js";
import { d as ShieldCheck, R as RefreshCw, Y as Building2, aT as Pencil, aS as CircleX, Z as Search, J as CircleCheck, aZ as Mail, S as Send, bg as UserRound, aq as Copy } from "./utils-vendor-DoKCqRlq.js";
import "./ui-vendor-DsSOT9J9.js";
function TossAccountApprovalsPanel() {
  const [items, setItems] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [reviewing, setReviewing] = reactExports.useState(null);
  const [reviewTarget, setReviewTarget] = reactExports.useState(null);
  const [reviewNote, setReviewNote] = reactExports.useState("");
  const [accountTarget, setAccountTarget] = reactExports.useState(null);
  const [accountForm, setAccountForm] = reactExports.useState({ bank_name: "", account_number: "", account_holder_name: "", status: "active" });
  const [search, setSearch] = reactExports.useState("");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [pool, setPool] = reactExports.useState([]);
  const [poolForm, setPoolForm] = reactExports.useState({ bank_name: "Toss Bank", account_number: "", account_holder_name: "", is_active: true });
  const [editingPoolId, setEditingPoolId] = reactExports.useState(null);
  const [updatingPoolId, setUpdatingPoolId] = reactExports.useState(null);
  const load = reactExports.useCallback(async () => {
    var _a, _b, _c;
    setLoading(true);
    setError("");
    try {
      const [response, poolResponse] = await Promise.all([
        client.get("/api/v1/admin/toss-virtual-accounts"),
        client.get("/api/v1/admin/toss-account-pool")
      ]);
      if (!response.ok) throw new Error(((_a = response.data) == null ? void 0 : _a.detail) || "Unable to load TOSS applications");
      setItems(((_b = response.data) == null ? void 0 : _b.items) || []);
      if (poolResponse.ok) setPool(((_c = poolResponse.data) == null ? void 0 : _c.items) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load TOSS applications");
    } finally {
      setLoading(false);
    }
  }, []);
  const savePoolAccount = async () => {
    var _a;
    if (!poolForm.account_number.trim() || !poolForm.account_holder_name.trim()) {
      ue.error("Bank account number and holder name are required.");
      return;
    }
    const response = await client.request(
      editingPoolId ? `/api/v1/admin/toss-account-pool/${editingPoolId}` : "/api/v1/admin/toss-account-pool",
      editingPoolId ? "PATCH" : "POST",
      poolForm
    );
    if (!response.ok) {
      ue.error(((_a = response.data) == null ? void 0 : _a.detail) || "Unable to save TOSS pool account.");
      return;
    }
    setPoolForm({ bank_name: "Toss Bank", account_number: "", account_holder_name: "", is_active: true });
    ue.success(editingPoolId ? "TOSS pool account updated." : "TOSS pool account added.");
    setEditingPoolId(null);
    await load();
  };
  const editPoolAccount = (account) => {
    setPoolForm({
      bank_name: normalizeKrwBankName(account.bank_name),
      account_number: account.account_number,
      account_holder_name: account.account_holder_name,
      is_active: account.is_active
    });
    setEditingPoolId(account.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const togglePoolAccount = async (account, isActive) => {
    var _a;
    setUpdatingPoolId(account.id);
    try {
      const response = await client.request(
        `/api/v1/admin/toss-account-pool/${account.id}`,
        "PATCH",
        {
          bank_name: account.bank_name,
          account_number: account.account_number,
          account_holder_name: account.account_holder_name,
          is_active: isActive
        }
      );
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.detail) || "Unable to update TOSS checkout availability.");
      }
      setPool((accounts) => accounts.map((item) => item.id === account.id ? { ...item, is_active: isActive } : item));
      ue.success(isActive ? "TOSS account enabled for checkout." : "TOSS account disabled for checkout.");
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Unable to update TOSS checkout availability.");
    } finally {
      setUpdatingPoolId(null);
    }
  };
  reactExports.useEffect(() => {
    void load();
  }, [load]);
  const filteredItems = items.filter((item) => {
    var _a, _b;
    const accountStatus = ((_a = item.application.virtual_account) == null ? void 0 : _a.status) || "";
    const matchesStatus = statusFilter === "all" || statusFilter === "pending_review" && item.status === "pending_review" || statusFilter === "active" && item.status === "approved" && accountStatus !== "suspended" || statusFilter === "suspended" && accountStatus === "suspended";
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [
      item.user_id,
      item.name,
      item.email,
      item.application.legal_name,
      item.application.contact_email,
      (_b = item.application.virtual_account) == null ? void 0 : _b.account_number
    ].some((value) => value == null ? void 0 : value.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });
  const copyAccount = async (item) => {
    const account = item.application.virtual_account;
    if (!(account == null ? void 0 : account.account_number)) return;
    const copied = await copyTextToClipboard(
      `${account.bank_name || "Toss Bank"}
${account.account_number}
${account.account_holder_name || ""}`
    );
    if (copied) ue.success("Account details copied.");
    else ue.error("Unable to copy account details.");
  };
  const openAccountControl = (item) => {
    const account = item.application.virtual_account || {};
    setAccountForm({
      bank_name: account.bank_name || "Toss Bank",
      account_number: account.account_number || "",
      account_holder_name: account.account_holder_name || item.application.legal_name || item.name || "",
      status: account.status || "active"
    });
    setAccountTarget(item);
  };
  const saveAccountControl = async () => {
    var _a;
    if (!accountTarget) return;
    setReviewing(`${accountTarget.user_id}:account`);
    try {
      const response = await client.request(`/api/v1/admin/toss-virtual-accounts/${accountTarget.user_id}/account`, "PATCH", accountForm);
      if (!response.ok) throw new Error(((_a = response.data) == null ? void 0 : _a.detail) || "Unable to update TOSS account");
      ue.success("TOSS account controls updated.");
      setAccountTarget(null);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update TOSS account";
      setError(message);
      ue.error(message);
    } finally {
      setReviewing(null);
    }
  };
  const openReview = (item, action) => {
    setReviewNote(action === "approve" ? "Approved by Relationship Manager" : "");
    setReviewTarget({ item, action });
  };
  const review = async () => {
    var _a;
    if (!reviewTarget) return;
    const { item, action } = reviewTarget;
    setReviewTarget(null);
    setReviewing(`${item.user_id}:${action}`);
    setError("");
    try {
      const response = await client.post(`/api/v1/admin/toss-virtual-accounts/${item.user_id}/${action}`, {
        note: reviewNote.trim() || void 0
      });
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.detail) || `Unable to ${action} application`);
      }
      ue.success(action === "approve" ? "TOSS Bank application approved." : "TOSS Bank application rejected.");
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : `Unable to ${action} application`;
      setError(message);
      ue.error(message);
    } finally {
      setReviewing(null);
      setReviewNote("");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 14, className: "text-[#FF6B00]" }),
            "Super admin review"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 12 }),
            "Security Badge"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl", children: "TOSS Bank Account Applications" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-2xl text-sm leading-6 text-slate-500", children: "Review business details before opening a TOSS Bank virtual account for the applicant." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => void load(), disabled: loading, className: "w-full sm:w-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, className: `mr-2 ${loading ? "animate-spin" : ""}` }),
        "Refresh applications"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 grid gap-3 sm:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-orange-100 bg-orange-50 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-orange-700", children: "Pending review" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xl font-semibold text-orange-950", children: items.filter((item) => item.status === "pending_review").length })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mb-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-semibold text-slate-900", children: "TOSS payment account pool" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-600", children: "Add active 토스페이 accounts here. Each new KRW payment session randomly uses an active account and avoids the account assigned to the previous session whenever another is available." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700", children: [
            pool.filter((account) => account.is_active).length,
            " active"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid gap-3 md:grid-cols-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: poolForm.bank_name, onChange: (event) => setPoolForm({ ...poolForm, bank_name: event.target.value }), placeholder: "Bank name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: poolForm.account_number, onChange: (event) => setPoolForm({ ...poolForm, account_number: event.target.value }), placeholder: "Account number" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: poolForm.account_holder_name, onChange: (event) => setPoolForm({ ...poolForm, account_holder_name: event.target.value }), placeholder: "Account holder name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: `flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors ${poolForm.is_active ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-slate-50"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs font-semibold text-slate-800", children: "Checkout availability" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `mt-0.5 block text-[10px] ${poolForm.is_active ? "text-emerald-700" : "text-slate-500"}`, children: poolForm.is_active ? "Included in rotation" : "Excluded from rotation" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                checked: poolForm.is_active,
                onCheckedChange: (isActive) => setPoolForm({ ...poolForm, is_active: isActive }),
                "aria-label": "Include this account in checkout rotation",
                className: "data-[state=checked]:bg-emerald-600"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => void savePoolAccount(), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { size: 14, className: "mr-2" }),
            editingPoolId ? "Save account" : "Add account"
          ] })
        ] }),
        pool.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 overflow-hidden rounded-xl border border-blue-100 bg-white", children: pool.map((account) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 border-b border-slate-100 p-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:px-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${account.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { size: 16 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "truncate font-semibold text-slate-800", children: [
                normalizeKrwBankName(account.bank_name),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-normal text-slate-300", children: "·" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-medium", children: account.account_number })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 truncate text-xs text-slate-500", children: account.account_holder_name })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-t border-slate-100 pt-2 sm:justify-end sm:border-0 sm:pt-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: `inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${account.is_active ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-slate-50"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-24", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `block text-xs font-semibold ${account.is_active ? "text-emerald-800" : "text-slate-600"}`, children: account.is_active ? "Active" : "Inactive" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-[10px] text-slate-500", children: account.is_active ? "Used for checkout" : "Not in rotation" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Switch,
                {
                  checked: account.is_active,
                  disabled: updatingPoolId !== null,
                  onCheckedChange: (isActive) => void togglePoolAccount(account, isActive),
                  "aria-label": `${account.is_active ? "Disable" : "Enable"} ${normalizeKrwBankName(account.bank_name)} ${account.account_number} for checkout`,
                  className: "data-[state=checked]:bg-emerald-600"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", disabled: updatingPoolId !== null, onClick: () => editPoolAccount(account), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { size: 13, className: "mr-1" }),
              "Edit"
            ] })
          ] })
        ] }, account.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-slate-500", children: "Review type" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm font-semibold text-slate-900", children: "Virtual account opening" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-slate-500", children: "Next step" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm font-semibold text-slate-900", children: "Approve requests and manage active accounts" })
      ] })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { size: 18, className: "mt-0.5 shrink-0" }),
      error
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 16, className: "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: search, onChange: (event) => setSearch(event.target.value), placeholder: "Search applicant, email, ID, or account number", className: "pl-9" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: statusFilter, onChange: (event) => setStatusFilter(event.target.value), className: "h-10 rounded-md border border-input bg-background px-3 text-sm text-slate-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All statuses" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "pending_review", children: "Pending review" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "active", children: "Active accounts" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "suspended", children: "Suspended accounts" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-64 flex-col items-center justify-center p-12 text-center text-slate-500", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 24, className: "mb-3 animate-spin text-[#FF6B00]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Loading applications..." })
    ] }) : filteredItems.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-64 flex-col items-center justify-center p-12 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-full bg-emerald-50 p-3 text-emerald-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 26 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-sm font-semibold text-slate-900", children: items.length ? "No matching applications" : "No TOSS applications" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500", children: items.length ? "Try a different search or status filter." : "New applications will appear here when submitted." })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-slate-100", children: filteredItems.map((item) => {
      var _a, _b, _c;
      return /* @__PURE__ */ jsxRuntimeExports.jsx("article", { className: "p-5 transition-colors hover:bg-slate-50/60 sm:p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { size: 19 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "truncate text-base font-semibold text-slate-900", children: item.application.legal_name || item.name || item.user_id }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.status === "pending_review" ? "border-amber-200 bg-amber-50 text-amber-700" : ((_a = item.application.virtual_account) == null ? void 0 : _a.status) === "suspended" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`, children: item.status === "pending_review" ? "Pending review" : ((_b = item.application.virtual_account) == null ? void 0 : _b.status) === "suspended" ? "Account suspended" : "Account active" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-slate-500", children: [
                "Applicant ID: ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: item.user_id })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { size: 13 }),
                "Contact"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-700 break-all", children: item.application.contact_email || item.email || "No email" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 13 }),
                "Telegram"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-700", children: item.telegram_username ? `@${item.telegram_username}` : "Not provided" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { size: 13 }),
                "Business"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm text-slate-700", children: [
                item.application.business_type || "Not provided",
                " · ",
                item.application.country || "—"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(UserRound, { size: 13 }),
                "Purpose"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-700", children: item.application.purpose || "Not provided" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm sm:grid-cols-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wider text-slate-400", children: "Monthly volume" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-medium text-slate-800", children: item.application.monthly_volume || "Not provided" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wider text-slate-400", children: "Requested currency" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-medium text-slate-800", children: ((_c = item.application.currencies) == null ? void 0 : _c.join(", ")) || "KRW" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wider text-slate-400", children: "Review readiness" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-medium text-emerald-700", children: "Signature and eligibility verified" })
            ] })
          ] }),
          item.application.virtual_account && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm sm:grid-cols-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wider text-slate-400", children: "Bank" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-medium text-slate-800", children: item.application.virtual_account.bank_name || "—" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wider text-slate-400", children: "Account number" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 flex items-center gap-2 font-mono font-medium text-slate-800", children: [
                item.application.virtual_account.account_number || "—",
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", title: "Copy account details", "aria-label": "Copy account details", className: "text-blue-600 hover:text-blue-800", onClick: () => void copyAccount(item), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 14 }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wider text-slate-400", children: "Holder" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-medium text-slate-800", children: item.application.virtual_account.account_holder_name || "—" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex shrink-0 flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row xl:border-t-0 xl:pt-0", children: item.status === "pending_review" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "border-red-200 text-red-700 hover:bg-red-50", disabled: reviewing !== null, onClick: () => openReview(item, "reject"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { size: 15, className: "mr-2" }),
            "Reject"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "bg-emerald-600 text-white hover:bg-emerald-700", disabled: reviewing !== null, onClick: () => openReview(item, "approve"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 15, className: "mr-2" }),
            "Approve"
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", disabled: reviewing !== null, onClick: () => openAccountControl(item), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { size: 15, className: "mr-2" }),
          "Manage account"
        ] }) })
      ] }) }, item.user_id);
    }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: reviewTarget !== null, onOpenChange: (open) => !open && setReviewTarget(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: (reviewTarget == null ? void 0 : reviewTarget.action) === "approve" ? "Approve TOSS Bank application" : "Reject TOSS Bank application" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500", children: (reviewTarget == null ? void 0 : reviewTarget.item.application.legal_name) || (reviewTarget == null ? void 0 : reviewTarget.item.name) || (reviewTarget == null ? void 0 : reviewTarget.item.user_id) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Textarea,
        {
          value: reviewNote,
          onChange: (event) => setReviewNote(event.target.value),
          placeholder: "Add an internal review note",
          className: "min-h-24"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setReviewTarget(null), children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            className: (reviewTarget == null ? void 0 : reviewTarget.action) === "approve" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-red-600 text-white hover:bg-red-700",
            disabled: reviewing !== null || (reviewTarget == null ? void 0 : reviewTarget.action) === "reject" && !reviewNote.trim(),
            onClick: () => void review(),
            children: (reviewTarget == null ? void 0 : reviewTarget.action) === "approve" ? "Confirm approval" : "Confirm rejection"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: accountTarget !== null, onOpenChange: (open) => !open && setAccountTarget(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Manage approved TOSS account" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500", children: (accountTarget == null ? void 0 : accountTarget.application.legal_name) || (accountTarget == null ? void 0 : accountTarget.name) || (accountTarget == null ? void 0 : accountTarget.user_id) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-sm font-medium text-slate-700", children: [
          "Bank name",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm", value: accountForm.bank_name, onChange: (event) => setAccountForm({ ...accountForm, bank_name: event.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-sm font-medium text-slate-700", children: [
          "Account number",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm", value: accountForm.account_number, onChange: (event) => setAccountForm({ ...accountForm, account_number: event.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-sm font-medium text-slate-700", children: [
          "Account holder",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm", value: accountForm.account_holder_name, onChange: (event) => setAccountForm({ ...accountForm, account_holder_name: event.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-sm font-medium text-slate-700", children: [
          "Account status",
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm", value: accountForm.status, onChange: (event) => setAccountForm({ ...accountForm, status: event.target.value }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "active", children: "Active" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "suspended", children: "Suspended" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setAccountTarget(null), children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => void saveAccountControl(), disabled: reviewing !== null || !accountForm.bank_name.trim() || !accountForm.account_number.trim() || !accountForm.account_holder_name.trim(), children: "Save changes" })
      ] })
    ] }) })
  ] });
}
function TossAccountApprovals() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TossAccountApprovalsPanel, {}) });
}
export {
  TossAccountApprovalsPanel,
  TossAccountApprovals as default
};
