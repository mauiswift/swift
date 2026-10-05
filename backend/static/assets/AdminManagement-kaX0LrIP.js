import { j as jsxRuntimeExports } from "./query-vendor-C49KnSO9.js";
import { a as reactExports, d as React, f as useNavigate, j as useSearchParams } from "./router-vendor-N0qZPfHZ.js";
import { i as client, d as cn, b as ue, I as Input, o as Card, p as CardHeader, q as CardTitle, s as CardContent, e as Button, D as Dialog, m as DialogContent, U as DialogHeader, V as DialogTitle, aY as DialogDescription, a7 as ResponsiveContainer, a8 as XAxis, a9 as YAxis, aa as Tooltip, aZ as Legend, ab as Cell, a as useLanguage, u as useAuth, a_ as getRoleDisplayName, a$ as buildAuthHeaders, L as Label, W as DialogFooter, X as isSystemWalletAdmin, w as Layout } from "./index-CpEIrYHf.js";
import { $ as ChevronDown, a5 as Search, aF as Store, b as LoaderCircle, z as CircleAlert, b3 as DollarSign, b0 as Eye, a7 as TrendingUp, aa as Users, a3 as Clock, y as CircleCheckBig, R as RefreshCw, a2 as CircleX, be as RotateCcw, aw as Play, aJ as Download, aT as Plus, as as Minus, a1 as Check, X, P as Power, aW as Save, bh as Database, a$ as UserPlus, aN as Mail, ay as Lock, aX as Trash2, T as TriangleAlert, k as ChartColumn, l as Wallet, B as Bitcoin, d as ShieldCheck, ba as Wrench, F as FileText } from "./utils-vendor-Bm5lXE_Q.js";
import { L as LineChart, C as CartesianGrid, a as Line, P as PieChart, b as Pie } from "./PieChart-R4u52Op9.js";
import { TossAccountApprovalsPanel } from "./TossAccountApprovals-Cm6dJ_dq.js";
import "./ui-vendor-CXLHQPHT.js";
import "./krw-banks-BOkJKSoB.js";
import "./switch-B82-5Hv5.js";
import "./clipboard-B4pReMJK.js";
function AdminSidebar({
  tabs,
  active,
  onChange
}) {
  const activeTab = tabs.find((tab) => tab.id === active);
  const groupedTabs = tabs.reduce((groups, tab) => {
    const label = tab.group || "General";
    const groupId = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "general";
    const group = groups.find((item) => item.label === label);
    if (group) {
      group.items.push(tab);
    } else {
      groups.push({ id: groupId, label, items: [tab] });
    }
    return groups;
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { "aria-label": "Administration sections", className: "w-full shrink-0 lg:sticky lg:top-24 lg:w-72", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:flex lg:max-h-[calc(100vh-7rem)] lg:flex-col lg:gap-1 lg:overflow-y-auto", children: groupedTabs.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { "aria-labelledby": `admin-group-${group.id}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { id: `admin-group-${group.id}`, className: "mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 first:mt-0", children: group.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: group.items.map((tab) => {
        const isActive = active === tab.id;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => onChange(tab.id),
            "aria-current": isActive ? "page" : void 0,
            "aria-label": `${tab.label}: ${tab.description}`,
            className: `motion-interactive group relative flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${isActive ? "border-orange-200 bg-orange-50 shadow-sm" : "border-transparent hover:border-slate-200 hover:bg-slate-50"}`,
            children: [
              isActive && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-[#FF6B00]", "aria-hidden": "true" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `rounded-lg p-2 transition-colors ${isActive ? "bg-[#FF6B00] text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(tab.icon, { className: `h-4 w-4 ${tab.iconClassName || ""}` }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `min-w-0 flex-1 truncate text-[13px] font-semibold ${isActive ? "text-[#C2410C]" : "text-slate-700 group-hover:text-slate-900"}`, children: tab.label }),
              tab.count !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isActive ? "bg-[#FF6B00] text-white" : "bg-slate-100 text-slate-500"}`, children: tab.count })
            ]
          },
          tab.id
        );
      }) })
    ] }, group.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "admin-section-select", className: "mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500", children: "Administration section" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "select",
          {
            id: "admin-section-select",
            value: active,
            onChange: (event) => onChange(event.target.value),
            className: "h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-10 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10",
            children: groupedTabs.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsx("optgroup", { label: group.label, children: group.items.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: tab.id, children: [
              tab.label,
              tab.count !== void 0 ? ` (${tab.count})` : ""
            ] }, tab.id)) }, group.id))
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500", "aria-hidden": "true" })
      ] }),
      (activeTab == null ? void 0 : activeTab.description) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 px-1 text-xs leading-5 text-slate-500", children: activeTab.description })
    ] })
  ] });
}
const adminApiService = {
  // ========== Dashboard ==========
  async getDashboard() {
    return client.get("/api/v1/admin/dashboard");
  },
  // ========== Merchants ==========
  async getMerchants(page = 1, limit = 20, search = "") {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    return client.get(`/api/v1/admin/merchants?${params}`);
  },
  async getMerchantDetails(merchantId) {
    return client.get(`/api/v1/admin/merchants/${merchantId}`);
  },
  async addMerchantTeamMember(merchantId, email, role) {
    return client.post(`/api/v1/admin/merchants/${merchantId}/team-members`, {
      email,
      role
    });
  },
  // ========== Transactions ==========
  async getTransactions(page = 1, limit = 20, filters = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });
    if (filters.status) params.set("status", filters.status);
    if (filters.type) params.set("type", filters.type);
    if (filters.search) params.set("search", filters.search);
    return client.get(`/api/v1/admin/transactions?${params}`);
  },
  async getTransactionDetails(transactionId) {
    return client.get(`/api/v1/admin/transactions/${transactionId}`);
  },
  async retryTransaction(transactionId) {
    return client.post(`/api/v1/admin/transactions/${transactionId}/retry`);
  },
  async cancelTransaction(transactionId) {
    return client.post(`/api/v1/admin/transactions/${transactionId}/cancel`);
  },
  // ========== Settlements ==========
  async getSettlements(page = 1, limit = 20, filters = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    return client.get(`/api/v1/admin/settlements?${params}`);
  },
  async getSettlementDetails(batchId) {
    return client.get(`/api/v1/admin/settlements/${batchId}`);
  },
  async processSettlementBatch(batchId) {
    return client.post(`/api/v1/admin/settlements/${batchId}/process`);
  },
  async retrySettlementBatch(batchId) {
    return client.post(`/api/v1/admin/settlements/${batchId}/retry`);
  },
  async exportSettlement(batchId) {
    return client.get(`/api/v1/admin/settlements/${batchId}/export`);
  },
  // ========== Wallet Control ==========
  async getWallets(page = 1, limit = 20, filters = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });
    if (filters.currency) params.set("currency", filters.currency);
    if (filters.search) params.set("search", filters.search);
    return client.get(`/api/v1/admin/wallets?${params}`);
  },
  async getWalletDetails(walletId) {
    return client.get(`/api/v1/admin/wallets/${walletId}`);
  },
  async creditWallet(walletId, amount, reason) {
    return client.post(`/api/v1/admin/wallets/${walletId}/credit`, {
      amount,
      reason
    });
  },
  async debitWallet(walletId, amount, reason) {
    return client.post(`/api/v1/admin/wallets/${walletId}/debit`, {
      amount,
      reason
    });
  },
  async toggleWalletFreeze(walletId, freeze) {
    return client.post(`/api/v1/admin/wallets/${walletId}/toggle-freeze`, {
      freeze
    });
  },
  // ========== Crypto Approvals ==========
  async getCryptoRequests(page = 1, limit = 20, filters = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    return client.get(`/api/v1/admin/crypto-requests?${params}`);
  },
  async getCryptoRequestDetails(requestId) {
    return client.get(`/api/v1/admin/crypto-requests/${requestId}`);
  },
  async approveCryptoRequest(requestId, notes) {
    return client.post(`/api/v1/admin/crypto-requests/${requestId}/approve`, {
      notes
    });
  },
  async rejectCryptoRequest(requestId, reason) {
    return client.post(`/api/v1/admin/crypto-requests/${requestId}/reject`, {
      reason
    });
  },
  // ========== Payment Channels ==========
  async getPaymentChannels() {
    return client.get("/api/v1/admin/payment-channels");
  },
  async updatePaymentChannel(channelId, enabled, config) {
    return client.patch(`/api/v1/admin/payment-channels/${channelId}`, {
      enabled,
      ...config
    });
  },
  // ========== Wallet Settings ==========
  async getWalletSettings() {
    return client.get("/api/v1/admin/wallet-settings");
  },
  async updateWalletSettings(settings) {
    return client.patch("/api/v1/admin/wallet-settings", settings);
  },
  // ========== Users ==========
  async getPlatformUsers(page = 1, limit = 20, search = "") {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });
    if (search) params.set("search", search);
    return client.get(`/api/v1/admin/users?${params}`);
  },
  async getUserDetails(userId) {
    return client.get(`/api/v1/admin/users/${userId}`);
  },
  async updateUserRole(userId, role) {
    return client.patch(`/api/v1/admin/users/${userId}`, { role });
  },
  // ========== Platform Settings ==========
  async getPlatformSettings() {
    return client.get("/api/v1/admin/platform-settings");
  },
  async updatePlatformSettings(settings) {
    return client.patch("/api/v1/admin/platform-settings", settings);
  },
  // ========== Operations ==========
  async runSettlementBatch() {
    return client.post("/api/v1/admin/operations/run-settlement");
  },
  async reconcileBalances() {
    return client.post("/api/v1/admin/operations/reconcile-balances");
  },
  async runDatabaseCleanup() {
    return client.post("/api/v1/admin/operations/cleanup-database");
  },
  // ========== Audit Logs ==========
  async getAuditLogs(page = 1, limit = 20, filters = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });
    if (filters.user) params.set("user", filters.user);
    if (filters.action) params.set("action", filters.action);
    if (filters.search) params.set("search", filters.search);
    return client.get(`/api/v1/admin/audit-logs?${params}`);
  },
  async exportAuditLogs(filters) {
    const params = new URLSearchParams();
    if (filters == null ? void 0 : filters.startDate) params.set("start_date", filters.startDate);
    if (filters == null ? void 0 : filters.endDate) params.set("end_date", filters.endDate);
    return client.get(`/api/v1/admin/audit-logs/export?${params}`);
  },
  // ========== Team Invitations ==========
  async getTeamInvitations() {
    return client.get("/api/v1/admin/team-invitations");
  },
  async sendTeamInvitation(email, permissions) {
    return client.post("/api/v1/admin/team-invitations", {
      email,
      permissions
    });
  },
  async cancelTeamInvitation(invitationId) {
    return client.post(`/api/v1/admin/team-invitations/${invitationId}/cancel`);
  },
  // ========== Team Members ==========
  async getTeamMembers() {
    return client.get("/api/v1/admin/team-members");
  },
  async updateTeamMemberPermissions(memberId, permissions) {
    return client.patch(`/api/v1/admin/team-members/${memberId}`, {
      permissions
    });
  },
  async removeTeamMember(memberId) {
    return client.post(`/api/v1/admin/team-members/${memberId}/remove`);
  }
};
const Table = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scrollbar-thin relative w-full overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  "table",
  {
    ref,
    className: cn("w-full caption-bottom text-sm", className),
    ...props
  }
) }));
Table.displayName = "Table";
const TableHeader = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { ref, className: cn("[&_tr]:border-b", className), ...props }));
TableHeader.displayName = "TableHeader";
const TableBody = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "tbody",
  {
    ref,
    className: cn("[&_tr:last-child]:border-0", className),
    ...props
  }
));
TableBody.displayName = "TableBody";
const TableFooter = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "tfoot",
  {
    ref,
    className: cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    ),
    ...props
  }
));
TableFooter.displayName = "TableFooter";
const TableRow = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "tr",
  {
    ref,
    className: cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    ),
    ...props
  }
));
TableRow.displayName = "TableRow";
const TableHead = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "th",
  {
    ref,
    className: cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    ),
    ...props
  }
));
TableHead.displayName = "TableHead";
const TableCell = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "td",
  {
    ref,
    className: cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className),
    ...props
  }
));
TableCell.displayName = "TableCell";
const TableCaption = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "caption",
  {
    ref,
    className: cn("mt-4 text-sm text-muted-foreground", className),
    ...props
  }
));
TableCaption.displayName = "TableCaption";
function MerchantManagement() {
  const [merchants, setMerchants] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [selectedMerchant, setSelectedMerchant] = reactExports.useState(null);
  const [showDetails, setShowDetails] = reactExports.useState(false);
  const [detailsLoading, setDetailsLoading] = reactExports.useState(false);
  const fetchMerchants = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApiService.getMerchants(1, 100, searchQuery);
      if (response.ok) {
        setMerchants(response.data.merchants || []);
      }
    } catch (err) {
      ue.error("Failed to load merchants");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);
  reactExports.useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);
  const handleViewMerchant = async (merchant) => {
    try {
      setDetailsLoading(true);
      const response = await adminApiService.getMerchantDetails(merchant.id);
      if (response.ok) {
        setSelectedMerchant(response.data);
        setShowDetails(true);
      }
    } catch (err) {
      ue.error("Failed to load merchant details");
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };
  const filteredMerchants = merchants.filter(
    (m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold text-slate-900", children: "Merchant Management" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Manage merchant accounts, view transactions, and manage team access." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            placeholder: "Search by merchant name or email...",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            className: "pl-9"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "overflow-hidden bg-white border border-slate-200 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "bg-slate-50/70 pb-4 border-b border-slate-100", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Store, { className: "h-5 w-5 text-blue-600" }),
        "Merchants (",
        filteredMerchants.length,
        ")"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-slate-400" }) }) : filteredMerchants.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mx-auto h-8 w-8 text-slate-300 mb-3" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500", children: "No merchants found" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "border-b border-slate-200 hover:bg-transparent", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600", children: "Merchant" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600", children: "Balance" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600", children: "Transactions" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: filteredMerchants.map((merchant) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "border-b border-slate-100 hover:bg-slate-50/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-slate-900", children: merchant.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: merchant.email })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${merchant.status === "active" ? "bg-emerald-50 text-emerald-700" : merchant.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`,
              children: merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-slate-900", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-4 w-4" }),
            merchant.wallet_balance.toLocaleString(),
            " ",
            merchant.currency
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-slate-900", children: merchant.total_transactions }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-500", children: [
              merchant.total_settlements,
              " settlements"
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              size: "sm",
              variant: "outline",
              onClick: () => handleViewMerchant(merchant),
              className: "gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }),
                "View Details"
              ]
            }
          ) })
        ] }, merchant.id)) })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showDetails, onOpenChange: setShowDetails, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { children: [
          selectedMerchant == null ? void 0 : selectedMerchant.merchant.name,
          " - Details"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Manage merchant information, transactions, and team members." })
      ] }),
      detailsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-slate-400" }) }) : selectedMerchant ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 font-semibold mb-1", children: "Wallet Balance" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-bold text-slate-900", children: [
              selectedMerchant.merchant.wallet_balance.toLocaleString(),
              " ",
              selectedMerchant.merchant.currency
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 font-semibold mb-1", children: "Total Transactions" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-bold text-slate-900 flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4" }),
              selectedMerchant.merchant.total_transactions
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 font-semibold mb-1", children: "Settlements" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-bold text-slate-900", children: selectedMerchant.merchant.total_settlements })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-slate-900 mb-3", children: "Recent Transactions" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 max-h-40 overflow-y-auto", children: selectedMerchant.transactions.length > 0 ? selectedMerchant.transactions.slice(0, 5).map((txn) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center p-2 bg-slate-50 rounded", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-slate-900 capitalize", children: txn.type }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: new Date(txn.created_at).toLocaleDateString() })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium text-slate-900", children: [
                txn.amount,
                " ",
                txn.currency
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: `text-xs font-medium ${txn.status === "completed" ? "text-emerald-600" : txn.status === "pending" ? "text-amber-600" : "text-red-600"}`,
                  children: txn.status.charAt(0).toUpperCase() + txn.status.slice(1)
                }
              )
            ] })
          ] }, txn.id)) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500 py-4 text-center", children: "No transactions" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-semibold text-slate-900 flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4" }),
              "Team Members (",
              selectedMerchant.team_members.length,
              ")"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", children: "Add Member" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 max-h-40 overflow-y-auto", children: selectedMerchant.team_members.length > 0 ? selectedMerchant.team_members.map((member) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center p-2 bg-slate-50 rounded", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-slate-900", children: member.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: member.email })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded", children: member.role })
          ] }, member.id)) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500 py-4 text-center", children: "No team members" }) })
        ] })
      ] }) : null
    ] }) })
  ] });
}
const STAT_CARD_COLORS = {
  blue: "bg-blue-50 border-blue-200 text-blue-600",
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-600",
  orange: "bg-orange-50 border-orange-200 text-orange-600",
  purple: "bg-purple-50 border-purple-200 text-purple-600",
  red: "bg-red-50 border-red-200 text-red-600"
};
const TRANSACTION_STATUS_COLORS = {
  completed: "#10b981",
  pending: "#f59e0b",
  failed: "#ef4444"
};
const ACTIVITY_STATUS_COLORS = {
  success: "#10b981",
  pending: "#f59e0b",
  failed: "#ef4444",
  warning: "#f97316"
};
function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  colorScheme
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: `border ${STAT_CARD_COLORS[colorScheme]}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-slate-600", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xl font-bold text-slate-900", children: value }),
      subtext && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: subtext })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-lg bg-white p-2 opacity-70", children: Icon })
  ] }) }) });
}
function BankingDashboard() {
  const [data, setData] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  reactExports.useEffect(() => {
    const fetchDashboardData = async () => {
      var _a;
      try {
        setLoading(true);
        const response = await adminApiService.getDashboard();
        if (!response.ok) {
          throw new Error(((_a = response.data) == null ? void 0 : _a.message) || "Failed to load dashboard");
        }
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mx-auto h-8 w-8 animate-spin text-slate-400" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-slate-600", children: "Loading dashboard..." })
    ] }) });
  }
  if (error || !data) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-red-200 bg-red-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mt-0.5 h-5 w-5 text-red-600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-red-900", children: "Failed to load dashboard" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-700", children: error })
      ] })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-4 text-lg font-semibold text-slate-900", children: "Key Metrics" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-5 w-5" }),
            label: "Total Transactions",
            value: data.metrics.totalTransactions.toLocaleString(),
            subtext: "This month",
            colorScheme: "blue"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-5 w-5" }),
            label: "Total Volume",
            value: `PHP ${(data.metrics.totalVolume / 1e6).toFixed(1)}M`,
            subtext: "This month",
            colorScheme: "emerald"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-5 w-5" }),
            label: "Active Now",
            value: data.metrics.activeTransactions,
            subtext: "In progress",
            colorScheme: "orange"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-5 w-5" }),
            label: "Merchants",
            value: data.metrics.activeMerchants,
            subtext: "Active accounts",
            colorScheme: "purple"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-5 w-5" }),
            label: "Success Rate",
            value: `${data.metrics.successRate}%`,
            subtext: "All transactions",
            colorScheme: "emerald"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: "Transaction Trend (7 Days)" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(LineChart, { data: data.transactionTrend, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e2e8f0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "date", stroke: "#94a3b8" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { stroke: "#94a3b8" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Tooltip,
            {
              contentStyle: {
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px"
              },
              formatter: (value) => {
                var _a;
                return [
                  value.toLocaleString(),
                  value === ((_a = data.transactionTrend[0]) == null ? void 0 : _a.count) ? "Count" : "Volume"
                ];
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Legend, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Line,
            {
              type: "monotone",
              dataKey: "count",
              stroke: "#3b82f6",
              strokeWidth: 2,
              dot: { fill: "#3b82f6", r: 4 },
              activeDot: { r: 6 },
              name: "Tx Count"
            }
          )
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: "Transaction Status" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(PieChart, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Pie,
            {
              data: data.transactionStatus,
              cx: "50%",
              cy: "50%",
              labelLine: false,
              label: ({ status, count }) => `${status}: ${count}`,
              outerRadius: 80,
              fill: "#8884d8",
              dataKey: "count",
              children: data.transactionStatus.map((entry, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                Cell,
                {
                  fill: TRANSACTION_STATUS_COLORS[entry.status.toLowerCase()] || "#8884d8"
                },
                `cell-${index}`
              ))
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { formatter: (value) => value.toLocaleString() })
        ] }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: "Recent Activity" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: data.recentActivity.map((activity) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex items-start gap-4 rounded-lg border border-slate-100 p-4 hover:bg-slate-50",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "mt-0.5 h-2 w-2 rounded-full shrink-0",
                style: {
                  backgroundColor: ACTIVITY_STATUS_COLORS[activity.status]
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-slate-900", children: activity.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-600", children: activity.description }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: activity.timestamp })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: "text-xs font-semibold px-2 py-1 rounded-full shrink-0",
                style: {
                  backgroundColor: {
                    success: "#d1fae5",
                    pending: "#fef3c7",
                    failed: "#fee2e2",
                    warning: "#fed7aa"
                  }[activity.status] || "#f1f5f9",
                  color: {
                    success: "#065f46",
                    pending: "#78350f",
                    failed: "#7f1d1d",
                    warning: "#92400e"
                  }[activity.status] || "#475569"
                },
                children: activity.status.charAt(0).toUpperCase() + activity.status.slice(1)
              }
            )
          ]
        },
        activity.id
      )) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: "System Health" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-emerald-200 bg-emerald-50 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-emerald-900", children: "API Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full bg-emerald-600" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-emerald-700", children: "Operational" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-emerald-200 bg-emerald-50 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-emerald-900", children: "Database" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full bg-emerald-600" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-emerald-700", children: "Healthy" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-emerald-200 bg-emerald-50 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-emerald-900", children: "Payment Gateway" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full bg-emerald-600" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-emerald-700", children: "Connected" })
          ] })
        ] })
      ] }) })
    ] })
  ] });
}
const STATUS_CONFIG$1 = {
  completed: {
    icon: CircleCheckBig,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700"
  },
  pending: {
    icon: Clock,
    color: "bg-amber-50 text-amber-700 border-amber-200",
    badge: "bg-amber-100 text-amber-700"
  },
  processing: {
    icon: RefreshCw,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    badge: "bg-blue-100 text-blue-700"
  },
  failed: {
    icon: CircleX,
    color: "bg-red-50 text-red-700 border-red-200",
    badge: "bg-red-100 text-red-700"
  }
};
function TransactionsTab() {
  const [transactions, setTransactions] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [typeFilter, setTypeFilter] = reactExports.useState("all");
  const [selectedTransaction, setSelectedTransaction] = reactExports.useState(null);
  const [showDetails, setShowDetails] = reactExports.useState(false);
  const [page, setPage] = reactExports.useState(1);
  const [total, setTotal] = reactExports.useState(0);
  const ITEMS_PER_PAGE = 20;
  const fetchTransactions = async () => {
    var _a;
    try {
      setLoading(true);
      setError("");
      const response = await adminApiService.getTransactions(page, ITEMS_PER_PAGE, {
        status: statusFilter === "all" ? void 0 : statusFilter,
        type: typeFilter === "all" ? void 0 : typeFilter,
        search: searchQuery
      });
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.message) || "Failed to load transactions");
      }
      setTransactions(response.data.transactions || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
      ue.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    fetchTransactions();
  }, [page, statusFilter, typeFilter, searchQuery]);
  const handleRetry = async (transaction) => {
    var _a;
    try {
      const response = await adminApiService.retryTransaction(transaction.transactionId);
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.message) || "Failed to retry transaction");
      }
      ue.success(`Retry initiated for ${transaction.transactionId}`);
      await fetchTransactions();
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to retry transaction");
    }
  };
  const handleCancel = async (transaction) => {
    var _a;
    try {
      const response = await adminApiService.cancelTransaction(transaction.transactionId);
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.message) || "Failed to cancel transaction");
      }
      ue.success(`Transaction ${transaction.transactionId} cancelled`);
      await fetchTransactions();
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to cancel transaction");
    }
  };
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = !searchQuery || tx.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) || tx.merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) || tx.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    const matchesType = typeFilter === "all" || tx.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });
  if (error && !transactions.length) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-red-200 bg-red-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mt-0.5 h-5 w-5 text-red-600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-red-900", children: "Failed to load transactions" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-700", children: error }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: fetchTransactions,
            variant: "outline",
            className: "mt-3 border-red-300 text-red-700 hover:bg-red-100",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
              "Try Again"
            ]
          }
        )
      ] })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            placeholder: "Search by transaction ID, merchant name, or reference...",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            className: "pl-9"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-xs font-semibold uppercase text-slate-600", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: statusFilter,
              onChange: (e) => setStatusFilter(e.target.value),
              className: "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-100",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All Statuses" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "completed", children: "Completed" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "pending", children: "Pending" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "processing", children: "Processing" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "failed", children: "Failed" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-xs font-semibold uppercase text-slate-600", children: "Type" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: typeFilter,
              onChange: (e) => setTypeFilter(e.target.value),
              className: "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-100",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All Types" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "payment", children: "Payment" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "settlement", children: "Settlement" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "deposit", children: "Deposit" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "withdrawal", children: "Withdrawal" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: fetchTransactions,
            disabled: loading,
            variant: "outline",
            className: "w-full gap-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-4 w-4 ${loading ? "animate-spin" : ""}` }),
              "Refresh"
            ]
          }
        ) })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-slate-200 pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base", children: [
        "Transactions (",
        filteredTransactions.length,
        " of ",
        total,
        ")"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: loading && !transactions.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center py-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-5 w-5 animate-spin text-slate-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-600", children: "Loading transactions..." })
      ] }) : filteredTransactions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mx-auto mb-3 h-8 w-8 text-slate-300" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-600", children: "No transactions found" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "border-b border-slate-200 hover:bg-transparent", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600", children: "Transaction ID" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600", children: "Merchant" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600", children: "Amount" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600", children: "Type" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600", children: "Date" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: filteredTransactions.map((tx) => {
          const StatusIcon = STATUS_CONFIG$1[tx.status].icon;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "border-b border-slate-100 hover:bg-slate-50/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "px-6 py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-sm font-medium text-slate-900", children: tx.transactionId }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: tx.reference })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "px-6 py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-slate-900", children: tx.merchant.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: tx.merchant.email })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "px-6 py-4 text-right", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-semibold text-slate-900", children: [
                tx.amount.toLocaleString(),
                " ",
                tx.currency
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: tx.paymentMethod })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 capitalize", children: tx.type }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(StatusIcon, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs font-semibold capitalize ${STATUS_CONFIG$1[tx.status].badge} px-2 py-1 rounded-full`, children: tx.status })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4 text-sm text-slate-600", children: new Date(tx.createdAt).toLocaleString() }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  size: "sm",
                  variant: "ghost",
                  onClick: () => {
                    setSelectedTransaction(tx);
                    setShowDetails(true);
                  },
                  title: "View details",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" })
                }
              ),
              tx.status === "failed" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  size: "sm",
                  variant: "ghost",
                  onClick: () => handleRetry(tx),
                  title: "Retry transaction",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-4 w-4" })
                }
              )
            ] }) })
          ] }, tx.id);
        }) })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showDetails, onOpenChange: setShowDetails, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Transaction Details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: selectedTransaction == null ? void 0 : selectedTransaction.transactionId })
      ] }),
      selectedTransaction && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase text-slate-600", children: "Transaction ID" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-mono text-sm font-medium text-slate-900", children: selectedTransaction.transactionId })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase text-slate-600", children: "Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center gap-2", children: [
              React.createElement(STATUS_CONFIG$1[selectedTransaction.status].icon, {
                className: "h-4 w-4"
              }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "capitalize font-medium text-slate-900", children: selectedTransaction.status })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-slate-200 bg-slate-50 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-slate-900 mb-3", children: "Merchant Information" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase text-slate-600", children: "Name" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-medium text-slate-900", children: selectedTransaction.merchant.name })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase text-slate-600", children: "Email" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-600", children: selectedTransaction.merchant.email })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase text-slate-600", children: "Amount" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-lg font-bold text-slate-900", children: [
              selectedTransaction.amount.toLocaleString(),
              " ",
              selectedTransaction.currency
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase text-slate-600", children: "Type" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-medium capitalize text-slate-900", children: selectedTransaction.type })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase text-slate-600", children: "Payment Method" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-900", children: selectedTransaction.paymentMethod })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase text-slate-600", children: "Reference" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-mono text-sm text-slate-900", children: selectedTransaction.reference })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-slate-200 bg-slate-50 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-slate-900 mb-3", children: "Timeline" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600", children: "Created:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-slate-900", children: new Date(selectedTransaction.createdAt).toLocaleString() })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600", children: "Updated:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-slate-900", children: new Date(selectedTransaction.updatedAt).toLocaleString() })
            ] })
          ] })
        ] }),
        selectedTransaction.error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-red-200 bg-red-50 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase text-red-600 mb-1", children: "Error" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-700", children: selectedTransaction.error })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          selectedTransaction.status === "failed" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => handleRetry(selectedTransaction), className: "bg-orange-600 hover:bg-orange-700", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "mr-2 h-4 w-4" }),
            "Retry Transaction"
          ] }),
          selectedTransaction.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleCancel(selectedTransaction), variant: "destructive", children: "Cancel Transaction" })
        ] })
      ] })
    ] }) })
  ] });
}
const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    badge: "bg-slate-100 text-slate-700",
    color: "bg-slate-50 border-slate-200"
  },
  processing: {
    icon: LoaderCircle,
    badge: "bg-blue-100 text-blue-700",
    color: "bg-blue-50 border-blue-200"
  },
  completed: {
    icon: CircleCheckBig,
    badge: "bg-emerald-100 text-emerald-700",
    color: "bg-emerald-50 border-emerald-200"
  },
  failed: {
    icon: CircleX,
    badge: "bg-red-100 text-red-700",
    color: "bg-red-50 border-red-200"
  },
  partial: {
    icon: CircleAlert,
    badge: "bg-amber-100 text-amber-700",
    color: "bg-amber-50 border-amber-200"
  }
};
function SettlementsTab() {
  const [batches, setBatches] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [selectedBatch, setSelectedBatch] = reactExports.useState(null);
  const [showDetails, setShowDetails] = reactExports.useState(false);
  const fetchSettlements = async () => {
    var _a;
    try {
      setLoading(true);
      setError("");
      const response = await adminApiService.getSettlements(1, 20, {
        status: statusFilter === "all" ? void 0 : statusFilter,
        search: searchQuery
      });
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.message) || "Failed to load settlements");
      }
      setBatches(response.data.batches || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settlements");
      ue.error("Failed to load settlements");
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    fetchSettlements();
  }, [statusFilter, searchQuery]);
  const handleProcessBatch = async (batch) => {
    var _a;
    try {
      const response = await adminApiService.processSettlementBatch(batch.batchId);
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.message) || "Failed to process batch");
      }
      ue.success(`Settlement batch ${batch.batchId} processing initiated`);
      await fetchSettlements();
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to process settlement batch");
    }
  };
  const handleRetryBatch = async (batch) => {
    var _a;
    try {
      const response = await adminApiService.retrySettlementBatch(batch.batchId);
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.message) || "Failed to retry batch");
      }
      ue.success(`Settlement batch ${batch.batchId} retry initiated`);
      await fetchSettlements();
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to retry settlement batch");
    }
  };
  const handleExportBatch = async (batch) => {
    var _a;
    try {
      const response = await adminApiService.exportSettlement(batch.batchId);
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.message) || "Failed to export batch");
      }
      ue.success(`Settlement batch ${batch.batchId} export started`);
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to export settlement batch");
    }
  };
  const filteredBatches = batches.filter((batch) => {
    const matchesSearch = !searchQuery || batch.batchId.toLowerCase().includes(searchQuery.toLowerCase()) || batch.period.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || batch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  if (error && !batches.length) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-red-200 bg-red-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mt-0.5 h-5 w-5 text-red-600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-red-900", children: "Failed to load settlements" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-700", children: error }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: fetchSettlements,
            variant: "outline",
            className: "mt-3 border-red-300 text-red-700 hover:bg-red-100",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
              "Try Again"
            ]
          }
        )
      ] })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            placeholder: "Search by batch ID or period...",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            className: "pl-9"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-xs font-semibold uppercase text-slate-600", children: "Status Filter" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: statusFilter,
            onChange: (e) => setStatusFilter(e.target.value),
            className: "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-100",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All Statuses" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "pending", children: "Pending" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "processing", children: "Processing" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "completed", children: "Completed" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "partial", children: "Partial" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "failed", children: "Failed" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: fetchSettlements,
          disabled: loading,
          variant: "outline",
          className: "w-full gap-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-4 w-4 ${loading ? "animate-spin" : ""}` }),
            "Refresh"
          ]
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-slate-200 pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base", children: [
        "Settlement Batches (",
        filteredBatches.length,
        " total)"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: loading && !batches.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center py-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-5 w-5 animate-spin text-slate-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-600", children: "Loading settlements..." })
      ] }) : filteredBatches.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mx-auto mb-3 h-8 w-8 text-slate-300" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-600", children: "No settlement batches found" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "border-b border-slate-200 hover:bg-transparent", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600", children: "Batch ID" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600", children: "Period" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600", children: "Merchants" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600", children: "Transactions" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600", children: "Net Amount" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: filteredBatches.map((batch) => {
          const StatusIcon = STATUS_CONFIG[batch.status].icon;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "border-b border-slate-100 hover:bg-slate-50/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "px-6 py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-sm font-medium text-slate-900", children: batch.batchId }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: new Date(batch.createdAt).toLocaleDateString() })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "px-6 py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-slate-900", children: batch.period }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: new Date(batch.startDate).toLocaleDateString() })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "px-6 py-4 text-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-slate-900", children: batch.merchantCount }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: "merchants" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "px-6 py-4 text-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-slate-900", children: batch.transactionCount }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: "txns" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "px-6 py-4 text-right", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-bold text-slate-900", children: [
                batch.netAmount.toLocaleString(),
                " ",
                batch.currency
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-500", children: [
                "Fees: ",
                batch.totalFees.toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(StatusIcon, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: `text-xs font-semibold capitalize px-2 py-1 rounded-full ${STATUS_CONFIG[batch.status].badge}`,
                  children: batch.status
                }
              )
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  size: "sm",
                  variant: "ghost",
                  onClick: () => {
                    setSelectedBatch(batch);
                    setShowDetails(true);
                  },
                  title: "View details",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" })
                }
              ),
              batch.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  size: "sm",
                  variant: "ghost",
                  onClick: () => handleProcessBatch(batch),
                  title: "Process batch",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-4 w-4" })
                }
              ),
              batch.status === "failed" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  size: "sm",
                  variant: "ghost",
                  onClick: () => handleRetryBatch(batch),
                  title: "Retry batch",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  size: "sm",
                  variant: "ghost",
                  onClick: () => handleExportBatch(batch),
                  title: "Export batch",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" })
                }
              )
            ] }) })
          ] }, batch.id);
        }) })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showDetails, onOpenChange: setShowDetails, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Settlement Batch Details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: selectedBatch == null ? void 0 : selectedBatch.batchId })
      ] }),
      selectedBatch && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase text-slate-600", children: "Batch ID" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-mono text-sm font-medium text-slate-900", children: selectedBatch.batchId })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase text-slate-600", children: "Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center gap-2", children: [
              React.createElement(STATUS_CONFIG[selectedBatch.status].icon, {
                className: "h-4 w-4"
              }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "capitalize font-medium text-slate-900", children: selectedBatch.status })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-slate-200 bg-slate-50 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-slate-900 mb-3", children: "Settlement Period" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase text-slate-600", children: "From" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-900", children: new Date(selectedBatch.startDate).toLocaleString() })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase text-slate-600", children: "To" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-900", children: new Date(selectedBatch.endDate).toLocaleString() })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-slate-200 bg-slate-50 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-slate-900 mb-3", children: "Settlement Summary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600", children: "Merchants Included:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-slate-900", children: selectedBatch.merchantCount })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600", children: "Total Transactions:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-slate-900", children: selectedBatch.transactionCount })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between border-t border-slate-200 pt-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600", children: "Gross Amount:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-slate-900", children: [
                selectedBatch.totalAmount.toLocaleString(),
                " ",
                selectedBatch.currency
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600", children: "Settlement Fees:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-red-600", children: [
                "-",
                selectedBatch.totalFees.toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between border-t border-slate-200 pt-2 text-base", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-slate-900", children: "Net Amount:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-emerald-600", children: [
                selectedBatch.netAmount.toLocaleString(),
                " ",
                selectedBatch.currency
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-slate-200 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-slate-900 mb-3", children: "Merchant Settlements" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: selectedBatch.merchants.map((merchant, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-center justify-between rounded-lg bg-slate-50 p-3",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-slate-900", children: merchant.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-500", children: [
                    "Merchant ID: ",
                    merchant.id
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-semibold text-slate-900", children: [
                    merchant.amount.toLocaleString(),
                    " PHP"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: `text-xs font-semibold px-2 py-1 rounded-full ${merchant.status === "completed" ? "bg-emerald-100 text-emerald-700" : merchant.status === "failed" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`,
                      children: merchant.status
                    }
                  )
                ] })
              ]
            },
            idx
          )) })
        ] }),
        selectedBatch.error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-red-200 bg-red-50 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase text-red-600 mb-1", children: "Error" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-700", children: selectedBatch.error })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          selectedBatch.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => handleProcessBatch(selectedBatch),
              className: "bg-orange-600 hover:bg-orange-700 gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-4 w-4" }),
                "Process Batch"
              ]
            }
          ),
          selectedBatch.status === "failed" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => handleRetryBatch(selectedBatch),
              className: "bg-orange-600 hover:bg-orange-700 gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4" }),
                "Retry Batch"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => handleExportBatch(selectedBatch),
              variant: "outline",
              className: "gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
                "Export"
              ]
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
function WalletControlTab() {
  const [wallets, setWallets] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [currencyFilter, setCurrencyFilter] = reactExports.useState("all");
  const [selectedWallet, setSelectedWallet] = reactExports.useState(null);
  const [showAdjustment, setShowAdjustment] = reactExports.useState(false);
  const [adjustmentType, setAdjustmentType] = reactExports.useState("credit");
  const [adjustmentAmount, setAdjustmentAmount] = reactExports.useState("");
  const [adjustmentReason, setAdjustmentReason] = reactExports.useState("");
  const [adjusting, setAdjusting] = reactExports.useState(false);
  const fetchWallets = async () => {
    var _a;
    try {
      setLoading(true);
      setError("");
      const response = await adminApiService.getWallets(1, 20, {
        currency: currencyFilter === "all" ? void 0 : currencyFilter,
        search: searchQuery
      });
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.message) || "Failed to load wallets");
      }
      setWallets(response.data.wallets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wallets");
      ue.error("Failed to load wallets");
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    fetchWallets();
  }, []);
  const handleAdjustWallet = async () => {
    var _a;
    if (!selectedWallet || !adjustmentAmount || !adjustmentReason) {
      ue.error("Please fill in all fields");
      return;
    }
    try {
      setAdjusting(true);
      const amount = parseFloat(adjustmentAmount);
      const response = adjustmentType === "credit" ? await adminApiService.creditWallet(selectedWallet.id, amount, adjustmentReason) : await adminApiService.debitWallet(selectedWallet.id, amount, adjustmentReason);
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.message) || "Failed to adjust wallet");
      }
      ue.success(
        `Wallet ${adjustmentType}ed with ${adjustmentAmount} ${selectedWallet.currency}`
      );
      setShowAdjustment(false);
      setAdjustmentAmount("");
      setAdjustmentReason("");
      await fetchWallets();
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to adjust wallet");
    } finally {
      setAdjusting(false);
    }
  };
  const handleToggleFreeze = async (wallet) => {
    var _a;
    try {
      const response = await adminApiService.toggleWalletFreeze(wallet.id, !wallet.isFrozen);
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.message) || "Failed to toggle freeze");
      }
      ue.success(`Wallet ${wallet.isFrozen ? "unfrozen" : "frozen"}`);
      await fetchWallets();
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to toggle wallet freeze");
    }
  };
  const filteredWallets = wallets.filter((wallet) => {
    const matchesSearch = !searchQuery || wallet.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) || wallet.merchantId.toString().includes(searchQuery);
    const matchesCurrency = currencyFilter === "all" || wallet.currency === currencyFilter;
    return matchesSearch && matchesCurrency;
  });
  const currencies = [...new Set(wallets.map((w) => w.currency))];
  if (error && !wallets.length) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-red-200 bg-red-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mt-0.5 h-5 w-5 text-red-600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-red-900", children: "Failed to load wallets" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-700", children: error }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: fetchWallets,
            variant: "outline",
            className: "mt-3 border-red-300 text-red-700 hover:bg-red-100",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
              "Try Again"
            ]
          }
        )
      ] })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            placeholder: "Search by merchant name or ID...",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            className: "pl-9"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-xs font-semibold uppercase text-slate-600", children: "Currency" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: currencyFilter,
              onChange: (e) => setCurrencyFilter(e.target.value),
              className: "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-100",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All Currencies" }),
                currencies.map((curr) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: curr, children: curr }, curr))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: fetchWallets,
            disabled: loading,
            variant: "outline",
            className: "w-full gap-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-4 w-4 ${loading ? "animate-spin" : ""}` }),
              "Refresh"
            ]
          }
        ) })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base", children: [
        "Merchant Wallets (",
        filteredWallets.length,
        ")"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: loading && !wallets.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center py-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-5 w-5 animate-spin text-slate-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-600", children: "Loading wallets..." })
      ] }) : filteredWallets.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mx-auto mb-3 h-8 w-8 text-slate-300" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-600", children: "No wallets found" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "border-b border-slate-200", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600", children: "Merchant" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600", children: "Currency" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-right text-xs font-semibold uppercase text-slate-600", children: "Balance" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-right text-xs font-semibold uppercase text-slate-600", children: "Available" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-right text-xs font-semibold uppercase text-slate-600", children: "Pending" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-center text-xs font-semibold uppercase text-slate-600", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: filteredWallets.map((wallet) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "border-b border-slate-100 hover:bg-slate-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "px-6 py-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-slate-900", children: wallet.merchantName }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-500", children: [
              "ID: ",
              wallet.merchantId
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700", children: wallet.currency }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-slate-900", children: wallet.balance.toLocaleString() }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-emerald-600", children: wallet.availableBalance.toLocaleString() }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-amber-600", children: wallet.pendingBalance.toLocaleString() }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4", children: wallet.isFrozen ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full bg-red-600" }),
            "Frozen"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full bg-emerald-600" }),
            "Active"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                size: "sm",
                variant: "ghost",
                onClick: () => {
                  setSelectedWallet(wallet);
                  setAdjustmentType("credit");
                  setShowAdjustment(true);
                },
                title: "Credit wallet",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                size: "sm",
                variant: "ghost",
                onClick: () => {
                  setSelectedWallet(wallet);
                  setAdjustmentType("debit");
                  setShowAdjustment(true);
                },
                title: "Debit wallet",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                size: "sm",
                variant: "ghost",
                onClick: () => handleToggleFreeze(wallet),
                title: wallet.isFrozen ? "Unfreeze" : "Freeze",
                children: wallet.isFrozen ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4 text-red-600" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4" })
              }
            )
          ] }) })
        ] }, wallet.id)) })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showAdjustment, onOpenChange: setShowAdjustment, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { children: [
          adjustmentType === "credit" ? "Credit" : "Debit",
          " Wallet"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { children: [
          selectedWallet == null ? void 0 : selectedWallet.merchantName,
          " - ",
          selectedWallet == null ? void 0 : selectedWallet.currency
        ] })
      ] }),
      selectedWallet && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase text-slate-600 mb-1", children: "Current Balance" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl font-bold text-slate-900", children: [
            selectedWallet.balance.toLocaleString(),
            " ",
            selectedWallet.currency
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mb-2 block text-sm font-semibold text-slate-700", children: [
            "Amount (",
            selectedWallet.currency,
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              type: "number",
              placeholder: "Enter amount",
              value: adjustmentAmount,
              onChange: (e) => setAdjustmentAmount(e.target.value),
              min: "0",
              step: "0.01"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-semibold text-slate-700", children: "Reason" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              placeholder: "e.g., Merchant refund, system adjustment",
              value: adjustmentReason,
              onChange: (e) => setAdjustmentReason(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-blue-50 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase text-blue-600 mb-2", children: "Preview" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600", children: "Current:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-slate-900", children: selectedWallet.balance.toLocaleString() })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-slate-600", children: [
                adjustmentType === "credit" ? "Add" : "Subtract",
                ":"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `font-medium ${adjustmentType === "credit" ? "text-emerald-600" : "text-red-600"}`, children: [
                adjustmentType === "credit" ? "+" : "-",
                adjustmentAmount || "0"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-blue-200 pt-1 flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-slate-900", children: "New Balance:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-900", children: (selectedWallet.balance + (adjustmentType === "credit" ? parseFloat(adjustmentAmount || "0") : -parseFloat(adjustmentAmount || "0"))).toLocaleString() })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: handleAdjustWallet,
              disabled: adjusting || !adjustmentAmount,
              className: "bg-orange-600 hover:bg-orange-700 gap-2 flex-1",
              children: adjusting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
                "Processing..."
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                adjustmentType === "credit" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "h-4 w-4" }),
                adjustmentType === "credit" ? "Credit" : "Debit",
                " Wallet"
              ] })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: () => setShowAdjustment(false),
              variant: "outline",
              className: "flex-1",
              children: "Cancel"
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
function CryptoApprovalsTab() {
  const [requests, setRequests] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [selectedRequest, setSelectedRequest] = reactExports.useState(null);
  const [showDetails, setShowDetails] = reactExports.useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = reactExports.useState(false);
  const [approvalNotes, setApprovalNotes] = reactExports.useState("");
  const [processing, setProcessing] = reactExports.useState(false);
  const fetchRequests = async () => {
    var _a;
    try {
      setLoading(true);
      setError("");
      const response = await adminApiService.getCryptoRequests(1, 20, {
        status: statusFilter === "all" ? void 0 : statusFilter,
        search: searchQuery
      });
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.message) || "Failed to load crypto requests");
      }
      setRequests(response.data.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load crypto requests");
      ue.error("Failed to load crypto requests");
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    fetchRequests();
  }, []);
  const handleApprove = async () => {
    var _a;
    if (!selectedRequest) return;
    try {
      setProcessing(true);
      const response = await adminApiService.approveCryptoRequest(selectedRequest.id, approvalNotes);
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.message) || "Failed to approve request");
      }
      ue.success(`Crypto request ${selectedRequest.requestId} approved`);
      setShowApprovalDialog(false);
      setApprovalNotes("");
      await fetchRequests();
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to approve request");
    } finally {
      setProcessing(false);
    }
  };
  const handleReject = async (reason) => {
    var _a;
    if (!selectedRequest) return;
    try {
      setProcessing(true);
      const response = await adminApiService.rejectCryptoRequest(selectedRequest.id, reason);
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.message) || "Failed to reject request");
      }
      ue.success(`Crypto request ${selectedRequest.requestId} rejected`);
      setShowDetails(false);
      await fetchRequests();
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to reject request");
    } finally {
      setProcessing(false);
    }
  };
  const filteredRequests = requests.filter((req) => {
    const matchesSearch = !searchQuery || req.requestId.toLowerCase().includes(searchQuery.toLowerCase()) || req.merchantName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const statusColors = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700"
  };
  if (error && !requests.length) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-red-200 bg-red-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mt-0.5 h-5 w-5 text-red-600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-red-900", children: "Failed to load crypto requests" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-700", children: error }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: fetchRequests,
            variant: "outline",
            className: "mt-3 border-red-300 text-red-700 hover:bg-red-100",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
              "Try Again"
            ]
          }
        )
      ] })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-600", children: "Pending" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xl font-bold text-amber-600", children: requests.filter((r) => r.status === "pending").length })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-600", children: "Approved" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xl font-bold text-blue-600", children: requests.filter((r) => r.status === "approved").length })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-600", children: "Completed" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xl font-bold text-emerald-600", children: requests.filter((r) => r.status === "completed").length })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-600", children: "Total USDT" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xl font-bold text-slate-900", children: requests.reduce((sum, r) => sum + r.amount, 0).toLocaleString() })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            placeholder: "Search by request ID or merchant name...",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            className: "pl-9"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-xs font-semibold uppercase text-slate-600", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: statusFilter,
              onChange: (e) => setStatusFilter(e.target.value),
              className: "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-100",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All Statuses" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "pending", children: "Pending" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "approved", children: "Approved" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "completed", children: "Completed" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "rejected", children: "Rejected" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: fetchRequests,
            disabled: loading,
            variant: "outline",
            className: "w-full gap-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-4 w-4 ${loading ? "animate-spin" : ""}` }),
              "Refresh"
            ]
          }
        ) })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base", children: [
        "Crypto Requests (",
        filteredRequests.length,
        ")"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: loading && !requests.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center py-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-5 w-5 animate-spin text-slate-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-600", children: "Loading requests..." })
      ] }) : filteredRequests.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mx-auto mb-3 h-8 w-8 text-slate-300" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-600", children: "No crypto requests found" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "border-b border-slate-200", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600", children: "Request ID" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600", children: "Merchant" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-right text-xs font-semibold uppercase text-slate-600", children: "Amount" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600", children: "Network" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600", children: "Date" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-center text-xs font-semibold uppercase text-slate-600", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: filteredRequests.map((req) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "border-b border-slate-100 hover:bg-slate-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-sm font-medium text-slate-900", children: req.requestId }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-slate-900", children: req.merchantName }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-bold text-slate-900", children: [
            req.amount,
            " USDT"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700", children: req.network }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusColors[req.status]}`, children: req.status }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4 text-sm text-slate-600", children: new Date(req.createdAt).toLocaleDateString() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                size: "sm",
                variant: "ghost",
                onClick: () => {
                  setSelectedRequest(req);
                  setShowDetails(true);
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" })
              }
            ),
            req.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  size: "sm",
                  variant: "ghost",
                  onClick: () => {
                    setSelectedRequest(req);
                    setShowApprovalDialog(true);
                  },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 text-emerald-600" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  size: "sm",
                  variant: "ghost",
                  onClick: () => handleReject("User requested"),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4 text-red-600" })
                }
              )
            ] })
          ] }) })
        ] }, req.id)) })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showDetails, onOpenChange: setShowDetails, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Request Details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: selectedRequest == null ? void 0 : selectedRequest.requestId })
      ] }),
      selectedRequest && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase text-slate-600 mb-1", children: "Amount" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-3xl font-bold text-slate-900", children: [
            selectedRequest.amount,
            " USDT"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase text-slate-600", children: "Merchant" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm font-medium text-slate-900", children: selectedRequest.merchantName })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase text-slate-600", children: "Network" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm font-medium text-slate-900", children: selectedRequest.network })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase text-slate-600", children: "Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm font-medium capitalize text-slate-900", children: selectedRequest.status })
          ] }),
          selectedRequest.notes && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase text-slate-600", children: "Notes" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-700", children: selectedRequest.notes })
          ] }),
          selectedRequest.txHash && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase text-slate-600", children: "TX Hash" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-mono text-xs text-slate-600 break-all", children: selectedRequest.txHash })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-slate-200 pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-500", children: [
          "Created: ",
          new Date(selectedRequest.createdAt).toLocaleString()
        ] }) }),
        selectedRequest.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: () => setShowApprovalDialog(true),
              className: "flex-1 bg-emerald-600 hover:bg-emerald-700",
              children: "Approve"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: () => handleReject("Rejected by admin"),
              variant: "destructive",
              className: "flex-1",
              children: "Reject"
            }
          )
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showApprovalDialog, onOpenChange: setShowApprovalDialog, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Approve Crypto Request" }) }),
      selectedRequest && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg bg-emerald-50 p-4 border border-emerald-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium text-emerald-900", children: [
          "Approve ",
          selectedRequest.amount,
          " USDT for ",
          selectedRequest.merchantName,
          "?"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-semibold text-slate-700", children: "Approval Notes (Optional)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              placeholder: "Add any notes for this approval...",
              value: approvalNotes,
              onChange: (e) => setApprovalNotes(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: handleApprove,
              disabled: processing,
              className: "flex-1 bg-emerald-600 hover:bg-emerald-700",
              children: processing ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
                "Approving..."
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mr-2 h-4 w-4" }),
                "Approve"
              ] })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: () => setShowApprovalDialog(false),
              variant: "outline",
              className: "flex-1",
              children: "Cancel"
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
function PaymentChannelsTab() {
  const [channels, setChannels] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoading(true);
        const response = await adminApiService.getPaymentChannels();
        if (response.ok) {
          setChannels(response.data.channels || []);
        }
      } catch (err) {
        console.error("Failed to fetch channels:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, []);
  const handleToggle = async (id) => {
    const channel = channels.find((ch) => ch.id === id);
    if (!channel) return;
    try {
      const response = await adminApiService.updatePaymentChannel(id, !channel.enabled);
      if (response.ok) {
        setChannels(
          channels.map(
            (ch) => ch.id === id ? { ...ch, enabled: !ch.enabled } : ch
          )
        );
        ue.success(`${channel.name} ${!channel.enabled ? "enabled" : "disabled"}`);
      } else {
        ue.error("Failed to update channel");
      }
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to toggle channel");
    }
  };
  const typeColors = {
    bank: "bg-blue-50 text-blue-700 border-blue-200",
    crypto: "bg-purple-50 text-purple-700 border-purple-200",
    digital: "bg-green-50 text-green-700 border-green-200"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-600", children: "Active Channels" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xl font-bold text-emerald-600", children: channels.filter((ch) => ch.enabled).length })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-600", children: "Total Channels" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xl font-bold text-slate-900", children: channels.length })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-600", children: "Avg Fee" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-2xl font-bold text-slate-900", children: [
          (channels.reduce((sum, ch) => sum + ch.processingFeePercent, 0) / channels.length).toFixed(2),
          "%"
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2", children: channels.map((channel) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: channel.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: channel.currency })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: `px-2 py-1 rounded text-xs font-semibold border ${typeColors[channel.type]}`,
            children: channel.type
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600", children: "Processing Fee:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-slate-900", children: [
              channel.processingFeePercent,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600", children: "Min Amount:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-slate-900", children: channel.minAmount })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600", children: "Max Amount:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-slate-900", children: channel.maxAmount.toLocaleString() })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600", children: "Available In:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-slate-900", children: channel.countries.join(", ") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-slate-200 pt-3 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: channel.enabled ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4 text-emerald-600" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-emerald-700", children: "Active" })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 text-slate-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-slate-500", children: "Inactive" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => handleToggle(channel.id),
              variant: channel.enabled ? "destructive" : "default",
              size: "sm",
              className: "gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Power, { className: "h-3 w-3" }),
                channel.enabled ? "Disable" : "Enable"
              ]
            }
          )
        ] })
      ] })
    ] }, channel.id)) })
  ] });
}
function WalletSettingsTab() {
  const [settings, setSettings] = reactExports.useState({
    depositCurrencies: "PHP, USDT, KRW",
    maxDepositAmount: "1000000",
    minDepositAmount: "100",
    depositFeePercent: "2.5",
    withdrawalFeePercent: "2.0",
    settlementFeePercent: "1.0"
  });
  const [saving, setSaving] = reactExports.useState(false);
  const handleSave = async () => {
    var _a;
    try {
      setSaving(true);
      const response = await adminApiService.updateWalletSettings({
        depositCurrencies: settings.depositCurrencies.split(",").map((c) => c.trim()),
        maxDepositAmount: parseFloat(settings.maxDepositAmount),
        minDepositAmount: parseFloat(settings.minDepositAmount),
        depositFeePercent: parseFloat(settings.depositFeePercent),
        withdrawalFeePercent: parseFloat(settings.withdrawalFeePercent),
        settlementFeePercent: parseFloat(settings.settlementFeePercent)
      });
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.message) || "Failed to save settings");
      }
      ue.success("Wallet settings saved successfully");
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Wallet Configuration" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-semibold text-slate-700", children: "Accepted Deposit Currencies (comma-separated)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: settings.depositCurrencies,
            onChange: (e) => setSettings({ ...settings, depositCurrencies: e.target.value }),
            placeholder: "PHP, USDT, KRW"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "e.g., PHP, USDT, KRW" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-semibold text-slate-700", children: "Min Deposit Amount" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              type: "number",
              value: settings.minDepositAmount,
              onChange: (e) => setSettings({ ...settings, minDepositAmount: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-semibold text-slate-700", children: "Max Deposit Amount" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              type: "number",
              value: settings.maxDepositAmount,
              onChange: (e) => setSettings({ ...settings, maxDepositAmount: e.target.value })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-slate-200 pt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-4 font-semibold text-slate-900", children: "Fee Configuration" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-semibold text-slate-700", children: "Deposit Fee (%)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                step: "0.1",
                value: settings.depositFeePercent,
                onChange: (e) => setSettings({ ...settings, depositFeePercent: e.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-semibold text-slate-700", children: "Withdrawal Fee (%)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                step: "0.1",
                value: settings.withdrawalFeePercent,
                onChange: (e) => setSettings({ ...settings, withdrawalFeePercent: e.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-semibold text-slate-700", children: "Settlement Fee (%)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                step: "0.1",
                value: settings.settlementFeePercent,
                onChange: (e) => setSettings({ ...settings, settlementFeePercent: e.target.value })
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-slate-200 pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: handleSave,
          disabled: saving,
          className: "bg-orange-600 hover:bg-orange-700 gap-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }),
            saving ? "Saving..." : "Save Settings"
          ]
        }
      ) })
    ] })
  ] }) });
}
function UsersTab() {
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [users, setUsers] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await adminApiService.getPlatformUsers(1, 100, searchQuery);
        if (response.ok) {
          setUsers(response.data.users || []);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [searchQuery]);
  const filteredUsers = users.filter(
    (user) => !searchQuery || user.email.toLowerCase().includes(searchQuery.toLowerCase()) || user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          placeholder: "Search by email or name...",
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          className: "pl-9"
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { children: [
        "Platform Users (",
        filteredUsers.length,
        ")"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "border-b border-slate-200", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600", children: "User" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600", children: "Role" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600", children: "Last Login" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600", children: "Joined" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: filteredUsers.map((user) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "border-b border-slate-100 hover:bg-slate-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "px-6 py-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-slate-900", children: user.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: user.email })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700", children: user.role }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 capitalize", children: user.status }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4 text-sm text-slate-600", children: new Date(user.lastLogin).toLocaleString() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4 text-sm text-slate-600", children: new Date(user.createdAt).toLocaleDateString() })
        ] }, user.id)) })
      ] }) }) })
    ] })
  ] });
}
function PlatformSettingsTab() {
  const [settings, setSettings] = reactExports.useState({
    collectionCurrencies: "PHP, USDT, KRW",
    systemFeePercent: "0.4",
    additionalFeePercent: "0",
    totalFeePercent: "0.5",
    vipGoldFeePercent: "0.3",
    maintenanceMode: false
  });
  const [saving, setSaving] = reactExports.useState(false);
  const handleSave = async () => {
    var _a;
    try {
      setSaving(true);
      const response = await adminApiService.updatePlatformSettings({
        collectionCurrencies: settings.collectionCurrencies.split(",").map((c) => c.trim()),
        systemFeePercent: parseFloat(settings.systemFeePercent),
        additionalFeePercent: parseFloat(settings.additionalFeePercent),
        totalFeePercent: parseFloat(settings.totalFeePercent),
        vipGoldFeePercent: parseFloat(settings.vipGoldFeePercent),
        maintenanceMode: settings.maintenanceMode
      });
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.message) || "Failed to save settings");
      }
      ue.success("Platform settings saved");
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "System Configuration" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-semibold text-slate-700", children: "Collection Currencies (comma-separated)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: settings.collectionCurrencies,
            onChange: (e) => setSettings({ ...settings, collectionCurrencies: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-slate-200 pt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-4 font-semibold text-slate-900", children: "Fee Structure" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-semibold text-slate-700", children: "System Fee (%)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                step: "0.1",
                value: settings.systemFeePercent,
                onChange: (e) => setSettings({ ...settings, systemFeePercent: e.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-semibold text-slate-700", children: "Additional Fee (%)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                step: "0.1",
                value: settings.additionalFeePercent,
                onChange: (e) => setSettings({ ...settings, additionalFeePercent: e.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-semibold text-slate-700", children: "Total Fee (%)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                step: "0.1",
                value: settings.totalFeePercent,
                onChange: (e) => setSettings({ ...settings, totalFeePercent: e.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-semibold text-slate-700", children: "VIP Gold Fee (%)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                step: "0.1",
                value: settings.vipGoldFeePercent,
                onChange: (e) => setSettings({ ...settings, vipGoldFeePercent: e.target.value })
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-slate-200 pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 rounded-lg bg-amber-50 p-4 border border-amber-200", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            id: "maintenance",
            checked: settings.maintenanceMode,
            onChange: (e) => setSettings({ ...settings, maintenanceMode: e.target.checked }),
            className: "h-4 w-4"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "maintenance", className: "flex-1 text-sm font-medium text-amber-900", children: "Maintenance Mode (pauses public access)" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-slate-200 pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: handleSave,
          disabled: saving,
          className: "bg-orange-600 hover:bg-orange-700 gap-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }),
            saving ? "Saving..." : "Save Settings"
          ]
        }
      ) })
    ] })
  ] }) });
}
function OperationsTab() {
  const [processing, setProcessing] = reactExports.useState(false);
  const operations = [
    {
      id: "settle",
      name: "Run Settlement Batch",
      description: "Initiate daily settlement processing",
      icon: Play,
      color: "blue"
    },
    {
      id: "reconcile",
      name: "Reconcile Balances",
      description: "Verify and reconcile all wallet balances",
      icon: RefreshCw,
      color: "green"
    },
    {
      id: "cleanup",
      name: "Database Cleanup",
      description: "Run maintenance and optimization tasks",
      icon: Database,
      color: "purple"
    }
  ];
  const handleRun = async (opId) => {
    var _a, _b;
    try {
      setProcessing(true);
      let response;
      if (opId === "settle") {
        response = await adminApiService.runSettlementBatch();
      } else if (opId === "reconcile") {
        response = await adminApiService.reconcileBalances();
      } else if (opId === "cleanup") {
        response = await adminApiService.runDatabaseCleanup();
      }
      if (!response || !response.ok) {
        throw new Error(((_a = response == null ? void 0 : response.data) == null ? void 0 : _a.message) || "Operation failed");
      }
      ue.success(`Operation started: ${(_b = operations.find((op) => op.id === opId)) == null ? void 0 : _b.name}`);
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setProcessing(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-amber-200 bg-amber-50 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mt-0.5 h-5 w-5 text-amber-600 shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-amber-900", children: "Use caution when running operations" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-amber-800", children: "Some operations may impact system performance or merchant settlements" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2", children: operations.map((op) => {
      const Icon = op.icon;
      const colorClasses = {
        blue: "bg-blue-50 border-blue-200 text-blue-700",
        green: "bg-green-50 border-green-200 text-green-700",
        purple: "bg-purple-50 border-purple-200 text-purple-700"
      };
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: `border-2 ${colorClasses[op.color]}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "mt-1 h-6 w-6" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-slate-900", children: op.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-600", children: op.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: () => handleRun(op.id),
              disabled: processing,
              className: "mt-4 gap-2",
              children: processing ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
                "Running..."
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-4 w-4" }),
                "Run Now"
              ] })
            }
          )
        ] })
      ] }) }) }, op.id);
    }) })
  ] });
}
function AuditLogsTab() {
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [logs] = reactExports.useState([
    {
      id: "1",
      timestamp: "2026-10-02T16:45:00Z",
      user: "john@swift.com",
      action: "APPROVE_CRYPTO",
      resource: "CRYPTO-20261002-001",
      status: "success",
      ipAddress: "192.168.1.100",
      details: "Approved 100 USDT for Online Mart"
    },
    {
      id: "2",
      timestamp: "2026-10-02T16:30:00Z",
      user: "jane@swift.com",
      action: "ADJUST_WALLET",
      resource: "Wallet:1",
      status: "success",
      ipAddress: "192.168.1.105",
      details: "Credited ABC Electronics wallet 10000 PHP"
    },
    {
      id: "3",
      timestamp: "2026-10-02T16:15:00Z",
      user: "bob@swift.com",
      action: "FAILED_LOGIN_ATTEMPT",
      resource: "User:unknown",
      status: "failed",
      ipAddress: "203.0.113.45",
      details: "Invalid credentials provided"
    },
    {
      id: "4",
      timestamp: "2026-10-02T15:50:00Z",
      user: "john@swift.com",
      action: "VIEW_TRANSACTION",
      resource: "TXN-20261001-001",
      status: "success",
      ipAddress: "192.168.1.100",
      details: "Viewed transaction details"
    },
    {
      id: "5",
      timestamp: "2026-10-02T15:30:00Z",
      user: "jane@swift.com",
      action: "UPDATE_SETTINGS",
      resource: "PlatformSettings",
      status: "success",
      ipAddress: "192.168.1.105",
      details: "Updated fee configuration"
    }
  ]);
  const filteredLogs = logs.filter(
    (log) => !searchQuery || log.user.toLowerCase().includes(searchQuery.toLowerCase()) || log.action.toLowerCase().includes(searchQuery.toLowerCase()) || log.resource.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const handleExport = async () => {
    var _a;
    try {
      const response = await adminApiService.exportAuditLogs();
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.message) || "Failed to export logs");
      }
      ue.success("Audit logs exported to CSV");
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to export logs");
    }
  };
  const getActionColor = (action) => {
    if (action.includes("FAILED")) return "text-red-600";
    if (action.includes("APPROVE") || action.includes("ADJUST")) return "text-blue-600";
    return "text-slate-600";
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            placeholder: "Search by user, action, or resource...",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            className: "pl-9"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleExport, variant: "outline", className: "gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
        "Export Logs"
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { children: [
        "Activity Logs (",
        filteredLogs.length,
        ")"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "border-b border-slate-200", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600", children: "Timestamp" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600", children: "User" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600", children: "Action" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600", children: "Resource" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600", children: "IP Address" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: filteredLogs.map((log) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "border-b border-slate-100 hover:bg-slate-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4 text-sm text-slate-600", children: new Date(log.timestamp).toLocaleString() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-slate-900 text-sm", children: log.user }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "px-6 py-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm font-medium ${getActionColor(log.action)}`, children: log.action }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 mt-1", children: log.details })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700", children: log.resource }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: `inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${log.status === "success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`,
              children: log.status
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-6 py-4 font-mono text-xs text-slate-600", children: log.ipAddress })
        ] }, log.id)) })
      ] }) }) })
    ] })
  ] });
}
const PERMISSION_LABELS = {
  can_add_delete_user: "Add/Delete User",
  can_edit_user_access: "Edit User Access",
  can_edit_business_settings: "Edit Business Settings",
  can_add_edit_delete_cards_promotion: "Cards Promotion",
  can_upload_delete_batch_disbursements: "Batch Disbursements",
  can_validate_batch_disbursements: "Validate Disbursements",
  can_generate_invoice: "Generate Invoice",
  can_add_edit_customers: "Manage Customers",
  can_view_transaction_details: "View Transactions",
  can_download_csv_report: "Download Reports",
  can_withdraw_funds: "Withdraw Funds",
  can_create_transfers: "Create Transfers",
  can_add_edit_delete_withdrawal_account: "Manage Withdrawal Account",
  can_see_api_keys: "See API Keys",
  can_resend_callbacks: "Resend Callbacks",
  can_change_callback_urls: "Change Callback URLs",
  can_approve_batch_disbursements: "Approve Disbursements",
  can_refund_cards_charges: "Refund Cards",
  can_manage_team: "Manage Team",
  can_credit_wallet: "Credit Wallet",
  can_debit_wallet: "Debit Wallet",
  can_freeze_wallet: "Freeze Wallet",
  can_unfreeze_wallet: "Unfreeze Wallet"
};
const INVITATION_STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  expired: "bg-slate-100 text-slate-600 border border-slate-200",
  revoked: "bg-slate-100 text-slate-600 border border-slate-200"
};
function getErrorMessage(error, fallback) {
  return error && typeof error === "object" && "message" in error ? String(error.message || fallback) : fallback;
}
function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
}
function getInvitationStatusStyle(status) {
  return INVITATION_STATUS_STYLES[status] || INVITATION_STATUS_STYLES.revoked;
}
function getPermissionLabels(permissions) {
  return Object.entries(permissions).filter(([, enabled]) => enabled).map(([permission]) => PERMISSION_LABELS[permission] || permission);
}
function getMemberInitials(member) {
  var _a, _b;
  const source = ((_a = member.name) == null ? void 0 : _a.trim()) || ((_b = member.email) == null ? void 0 : _b.trim()) || member.telegram_id;
  return source.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => {
    var _a2;
    return (_a2 = part[0]) == null ? void 0 : _a2.toUpperCase();
  }).join("") || "?";
}
async function apiFetch(url, options) {
  const headers = buildAuthHeaders(options == null ? void 0 : options.headers);
  if (!headers.has("Content-Type") && (options == null ? void 0 : options.body)) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, {
    ...options,
    headers
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  return res.json();
}
function RevokeConfirmDialog({
  email,
  onConfirm,
  onCancel
}) {
  const { language } = useLanguage();
  const tx = (en, ko, zh) => language === "zh" ? zh ?? en : language === "en" ? en : ko;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center", role: "presentation", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "my-auto max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-6 shadow-xl", role: "dialog", "aria-modal": "true", "aria-labelledby": "revoke-invitation-title", "aria-describedby": "revoke-invitation-description", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-5 w-5 text-red-500" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { id: "revoke-invitation-title", className: "font-semibold text-foreground text-sm", children: tx("Revoke Invitation", "초대 취소") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 mt-0.5 break-all", children: email })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { id: "revoke-invitation-description", className: "text-sm text-slate-600 mb-5", children: "This will cancel the invitation. The recipient will no longer be able to accept it." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          size: "sm",
          className: "flex-1 bg-red-600 hover:bg-red-700 text-white text-xs",
          type: "button",
          onClick: onConfirm,
          children: "Revoke"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          size: "sm",
          variant: "outline",
          className: "flex-1 text-xs",
          type: "button",
          onClick: onCancel,
          children: "Cancel"
        }
      )
    ] })
  ] }) });
}
function InviteFormDialog({
  isOpen,
  email,
  setEmail,
  selectedPermissions,
  setSelectedPermissions,
  permissionSearch,
  setPermissionSearch,
  onSend,
  onCancel,
  isLoading
}) {
  const [expandedGroups, setExpandedGroups] = reactExports.useState({});
  const permissionGroups = {
    "View Payments": ["can_view_transaction_details"],
    "Manage Links": ["can_create_transfers", "can_add_edit_customers", "can_see_api_keys"],
    "Manage Pages": ["can_edit_business_settings", "can_add_edit_delete_cards_promotion"],
    "Refund & Contest dispute": ["can_refund_cards_charges"],
    "Export": ["can_download_csv_report"],
    "Develop": ["can_resend_callbacks", "can_change_callback_urls"],
    "Manage Users": ["can_add_delete_user", "can_edit_user_access"],
    "View Wallet": ["can_withdraw_funds"],
    "Manage Wallet Transactions": ["can_credit_wallet", "can_debit_wallet"],
    "View child accounts": [],
    "Manage child accounts": ["can_edit_user_access"],
    "Manage child payouts": ["can_withdraw_funds"],
    "Manage loan offers": [],
    "Manage loans": [],
    "Manage Invoices": ["can_generate_invoice"],
    "Manage Approvals": ["can_approve_batch_disbursements"],
    "Manage Approvals Settings": [],
    "Manage Transfers Settings": [],
    "Manage Invoices Settings": [],
    "Manage Expenses Settings": [],
    "Manage Storefront": ["can_edit_business_settings"],
    "Manage Order & Pay": [],
    "Manage Products": ["can_edit_business_settings"]
  };
  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };
  const toggleGroupPermissions = (groupName) => {
    const perms = permissionGroups[groupName] || [];
    if (perms.length === 0) return;
    const allGroupSelected = perms.every((p) => selectedPermissions[p]);
    const updated = { ...selectedPermissions };
    perms.forEach((p) => {
      updated[p] = !allGroupSelected;
    });
    setSelectedPermissions(updated);
  };
  const togglePermission = (permissionKey) => {
    setSelectedPermissions({
      ...selectedPermissions,
      [permissionKey]: !selectedPermissions[permissionKey]
    });
  };
  const selectAllPermissions = () => {
    const allPerms = {};
    Object.values(permissionGroups).forEach((perms) => {
      perms.forEach((p) => {
        allPerms[p] = true;
      });
    });
    setSelectedPermissions(allPerms);
  };
  if (!isOpen) return null;
  const filteredGroups = Object.entries(permissionGroups).filter(
    ([groupName]) => groupName.toLowerCase().includes(permissionSearch.toLowerCase())
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 sm:items-center", role: "presentation", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl", role: "dialog", "aria-modal": "true", "aria-labelledby": "invite-dialog-title", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { id: "invite-dialog-title", className: "text-lg font-semibold text-slate-900", children: "Invite a new team member" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: onCancel,
          className: "text-slate-500 hover:text-slate-700 text-2xl leading-none",
          "aria-label": "Close",
          children: "×"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "invite-email", className: "text-sm font-medium text-slate-700", children: "Email address" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "invite-email",
            type: "email",
            placeholder: "name@company.com",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            className: "mt-1.5 h-10"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-sm font-medium text-slate-700 flex items-center gap-1.5", children: [
            "Permissions ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-xs", children: "(i)" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: selectAllPermissions,
              className: "text-xs font-semibold text-blue-600 hover:text-blue-700",
              children: "Select all"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              type: "search",
              placeholder: "Search permissions, e.g. refund, export, invoices",
              value: permissionSearch,
              onChange: (e) => setPermissionSearch(e.target.value),
              className: "pl-9 h-9 text-sm"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-96 overflow-y-auto", children: filteredGroups.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 text-center text-sm text-slate-500", children: "No permissions found" }) : filteredGroups.map(([groupName, perms]) => {
          const isExpanded = expandedGroups[groupName];
          const groupSelectedCount = perms.filter((p) => selectedPermissions[p]).length;
          const allGroupSelected = groupSelectedCount === perms.length && perms.length > 0;
          const hasNoPermissions = perms.length === 0;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-slate-100 last:border-b-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => {
                  if (!hasNoPermissions) toggleGroupPermissions(groupName);
                  toggleGroup(groupName);
                },
                className: "w-full flex items-center gap-3 p-3.5 hover:bg-slate-50 transition-colors",
                children: [
                  !hasNoPermissions && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: allGroupSelected,
                      onChange: () => toggleGroupPermissions(groupName),
                      className: "h-5 w-5 rounded-md border border-slate-300 cursor-pointer",
                      onClick: (e) => e.stopPropagation()
                    }
                  ),
                  hasNoPermissions && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-5" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 text-left", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-slate-900", children: groupName }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    perms.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-slate-500", children: [
                      groupSelectedCount,
                      " capabilities"
                    ] }),
                    perms.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          toggleGroup(groupName);
                        },
                        className: "p-1 hover:bg-slate-200 rounded transition-colors text-sm",
                        children: isExpanded ? "^" : "v"
                      }
                    )
                  ] })
                ]
              }
            ),
            isExpanded && perms.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-slate-50 border-t border-slate-100 p-3 space-y-2", children: perms.map((permKey) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2.5 cursor-pointer group", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  checked: selectedPermissions[permKey] || false,
                  onChange: () => togglePermission(permKey),
                  className: "h-4 w-4 rounded border border-slate-300 cursor-pointer"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-600 group-hover:text-slate-900", children: PERMISSION_LABELS[permKey] || permKey })
            ] }, permKey)) })
          ] }, groupName);
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: onSend,
            disabled: isLoading || !email,
            className: "flex-[1.35] h-11 gap-2",
            children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
              "Sending..."
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "Send Invitation" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "outline",
            onClick: onCancel,
            className: "flex-1 h-11",
            children: "Cancel"
          }
        )
      ] })
    ] })
  ] }) });
}
function TeamInvitationsTab() {
  const { language } = useLanguage();
  const tx = (en, ko, zh) => language === "zh" ? zh ?? en : language === "en" ? en : ko;
  const { isSuperAdmin } = useAuth();
  const [invitations, setInvitations] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [formOpen, setFormOpen] = reactExports.useState(false);
  const [email, setEmail] = reactExports.useState("");
  const [selectedPermissions, setSelectedPermissions] = reactExports.useState({});
  const [permissionSearch, setPermissionSearch] = reactExports.useState("");
  const [formLoading, setFormLoading] = reactExports.useState(false);
  const [revokeTarget, setRevokeTarget] = reactExports.useState(null);
  const [lastInvitationLink, setLastInvitationLink] = reactExports.useState(null);
  const fetchInvitations = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/v1/team/invitations");
      if (data == null ? void 0 : data.invitations) setInvitations(data.invitations);
    } catch (error) {
      ue.error(getErrorMessage(error, "Failed to load invitations"));
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    void fetchInvitations();
  }, [fetchInvitations]);
  const handleSendInvitation = async () => {
    if (!email) {
      ue.error("Please enter an email address");
      return;
    }
    const selectedPerms = Object.entries(selectedPermissions).filter(([, enabled]) => enabled).map(([perm]) => perm);
    if (selectedPerms.length === 0) {
      ue.error("Please select at least one permission");
      return;
    }
    try {
      setFormLoading(true);
      setLastInvitationLink(null);
      const data = await apiFetch("/api/v1/team/invite", {
        method: "POST",
        body: JSON.stringify({
          email,
          permissions: selectedPerms
        })
      });
      if (data == null ? void 0 : data.manual_link) {
        setLastInvitationLink(data.manual_link);
      }
      if (data == null ? void 0 : data.email_sent) {
        ue.success("Invitation email sent");
      } else {
        ue.error((data == null ? void 0 : data.email_error) || "Invitation created, but the email could not be sent. Use the manual link below.");
      }
      setEmail("");
      setSelectedPermissions({});
      setPermissionSearch("");
      if (!(data == null ? void 0 : data.manual_link)) setFormOpen(false);
      await fetchInvitations();
    } catch (error) {
      ue.error(getErrorMessage(error, "Failed to send invitation"));
    } finally {
      setFormLoading(false);
    }
  };
  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return;
    const id = revokeTarget.id;
    setRevokeTarget(null);
    try {
      await apiFetch(`/api/v1/team/invitations/${id}`, { method: "DELETE" });
      ue.success("Invitation revoked");
      await fetchInvitations();
    } catch (error) {
      ue.error(getErrorMessage(error, "Failed to revoke invitation"));
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    revokeTarget && /* @__PURE__ */ jsxRuntimeExports.jsx(
      RevokeConfirmDialog,
      {
        email: revokeTarget.email,
        onConfirm: handleRevokeConfirm,
        onCancel: () => setRevokeTarget(null)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-hidden bg-white border border-slate-200 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "bg-slate-50/70 pb-4 border-b border-slate-100", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base font-semibold text-foreground flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          tx("Invite a team member", "팀원 초대"),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs font-normal text-slate-500 mt-0.5", children: tx("Give a trusted teammate access to the shared organization wallet.", "신뢰할 수 있는 팀원에게 조직 공동 지갑 접근 권한을 부여하세요.") })
        ] })
      ] }),
      !formOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: () => setFormOpen(true), className: "h-10 gap-2 shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "h-3.5 w-3.5" }),
        "New Invitation"
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InviteFormDialog,
      {
        isOpen: formOpen,
        email,
        setEmail,
        selectedPermissions,
        setSelectedPermissions,
        permissionSearch,
        setPermissionSearch,
        onSend: handleSendInvitation,
        onCancel: () => {
          setFormOpen(false);
          setLastInvitationLink(null);
          setEmail("");
          setSelectedPermissions({});
          setPermissionSearch("");
        },
        isLoading: formLoading
      }
    ),
    lastInvitationLink && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-hidden bg-white border border-blue-200 bg-blue-50 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-5 sm:pt-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-blue-800 font-semibold text-xs uppercase tracking-wider mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }),
        "Invitation Link Created"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-blue-700 mb-3", children: "Copy and share this link manually if the invitation email was not received:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 sm:flex-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { readOnly: true, value: lastInvitationLink, className: "h-10 min-w-0 text-xs font-mono bg-white" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            size: "sm",
            onClick: () => {
              navigator.clipboard.writeText(lastInvitationLink);
              ue.success("Copied!");
            },
            className: "h-10 shrink-0",
            children: "Copy"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-hidden bg-white border border-slate-200 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "bg-slate-50/70 pb-4 border-b border-slate-100", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base font-semibold text-foreground flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          tx("Invite a team member", "팀원 초대"),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs font-normal text-slate-500 mt-0.5", children: tx("Give a trusted teammate access to the shared organization wallet.", "신뢰할 수 있는 팀원에게 조직 공동 지갑 접근 권한을 부여하세요.") })
        ] })
      ] }),
      !formOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: () => setFormOpen(true), className: "h-10 gap-2 shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "h-3.5 w-3.5" }),
        "New Invitation"
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "overflow-hidden bg-white border border-slate-200 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "bg-slate-50/70 pb-4 border-b border-slate-100", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base font-semibold text-foreground flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "Pending invitations",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs font-normal text-slate-500 mt-0.5", children: "Track email delivery and access status" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-8", "aria-busy": "true", "aria-label": "Loading invitations", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 motion-safe:animate-spin text-slate-400", "aria-hidden": "true" }) }) : invitations.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500 text-center py-8", children: "No pending invitations" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: invitations.map((inv) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex flex-col gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 transition-colors sm:flex-row sm:items-start sm:justify-between",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-4 w-4 text-slate-500 flex-shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground break-all", children: inv.email }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getInvitationStatusStyle(inv.status)}`, children: [
                  inv.status === "pending" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3" }),
                  inv.status
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-500 mt-1 break-words leading-relaxed", children: [
                "Role: ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: getRoleDisplayName(inv.role) }),
                " • Sent",
                " ",
                formatDate(inv.invited_at) || "Unknown date",
                formatDate(inv.expires_at) && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  " • Expires ",
                  formatDate(inv.expires_at)
                ] })
              ] }),
              (inv.organization_name || inv.organization_id) && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-600 mt-1 break-words", children: [
                "Org: ",
                inv.organization_name || inv.organization_id,
                inv.organization_name && inv.organization_id ? ` (${inv.organization_id})` : ""
              ] }),
              inv.notes && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-600 mt-1 break-words", children: [
                "Note: ",
                inv.notes
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1 mt-2", children: getPermissionLabels(inv.permissions).map((permission) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "span",
                {
                  className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-2.5 w-2.5" }),
                    permission
                  ]
                },
                permission
              )) })
            ] }),
            inv.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                onClick: () => setRevokeTarget(inv),
                "aria-label": `Revoke invitation for ${inv.email}`,
                className: "motion-interactive min-h-10 min-w-10 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 self-end sm:self-auto",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
              }
            )
          ]
        },
        inv.id
      )) }) })
    ] })
  ] });
}
function MemberPermissionEditor({
  isOpen,
  member,
  selectedPermissions,
  setSelectedPermissions,
  permissionSearch,
  setPermissionSearch,
  onSave,
  onCancel,
  isLoading
}) {
  const [expandedGroups, setExpandedGroups] = reactExports.useState({});
  const permissionGroups = {
    "View Payments": ["can_view_transaction_details"],
    "Manage Links": ["can_create_transfers", "can_add_edit_customers", "can_see_api_keys"],
    "Manage Pages": ["can_edit_business_settings", "can_add_edit_delete_cards_promotion"],
    "Refund & Contest dispute": ["can_refund_cards_charges"],
    "Export": ["can_download_csv_report"],
    "Develop": ["can_resend_callbacks", "can_change_callback_urls"],
    "Manage Users": ["can_add_delete_user", "can_edit_user_access"],
    "View Wallet": ["can_withdraw_funds"],
    "Manage Wallet Transactions": ["can_credit_wallet", "can_debit_wallet"],
    "View child accounts": [],
    "Manage child accounts": ["can_edit_user_access"],
    "Manage child payouts": ["can_withdraw_funds"],
    "Manage loan offers": [],
    "Manage loans": [],
    "Manage Invoices": ["can_generate_invoice"],
    "Manage Approvals": ["can_approve_batch_disbursements"],
    "Manage Approvals Settings": [],
    "Manage Transfers Settings": [],
    "Manage Invoices Settings": [],
    "Manage Expenses Settings": [],
    "Manage Storefront": ["can_edit_business_settings"],
    "Manage Order & Pay": [],
    "Manage Products": ["can_edit_business_settings"]
  };
  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };
  const toggleGroupPermissions = (groupName) => {
    const perms = permissionGroups[groupName] || [];
    if (perms.length === 0) return;
    const allGroupSelected = perms.every((p) => selectedPermissions[p]);
    const updated = { ...selectedPermissions };
    perms.forEach((p) => {
      updated[p] = !allGroupSelected;
    });
    setSelectedPermissions(updated);
  };
  const togglePermission = (permissionKey) => {
    setSelectedPermissions({
      ...selectedPermissions,
      [permissionKey]: !selectedPermissions[permissionKey]
    });
  };
  const selectAllPermissions = () => {
    const allPerms = {};
    Object.values(permissionGroups).forEach((perms) => {
      perms.forEach((p) => {
        allPerms[p] = true;
      });
    });
    setSelectedPermissions(allPerms);
  };
  if (!isOpen || !member) return null;
  const filteredGroups = Object.entries(permissionGroups).filter(
    ([groupName]) => groupName.toLowerCase().includes(permissionSearch.toLowerCase())
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 sm:items-center", role: "presentation", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl", role: "dialog", "aria-modal": "true", "aria-labelledby": "edit-permissions-title", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { id: "edit-permissions-title", className: "text-lg font-semibold text-slate-900", children: "Edit member permissions" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 mt-1", children: member.email || member.name || `@${member.telegram_id}` })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: onCancel,
          className: "text-slate-500 hover:text-slate-700 text-2xl leading-none",
          "aria-label": "Close",
          children: "×"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-medium text-slate-700", children: "Permissions" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: selectAllPermissions,
              className: "text-xs font-semibold text-blue-600 hover:text-blue-700",
              children: "Select all"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              type: "search",
              placeholder: "Search permissions...",
              value: permissionSearch,
              onChange: (e) => setPermissionSearch(e.target.value),
              className: "pl-9 h-9 text-sm"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-96 overflow-y-auto", children: filteredGroups.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 text-center text-sm text-slate-500", children: "No permissions found" }) : filteredGroups.map(([groupName, perms]) => {
          const isExpanded = expandedGroups[groupName];
          const groupSelectedCount = perms.filter((p) => selectedPermissions[p]).length;
          const allGroupSelected = groupSelectedCount === perms.length && perms.length > 0;
          const hasNoPermissions = perms.length === 0;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-slate-100 last:border-b-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => {
                  if (!hasNoPermissions) toggleGroupPermissions(groupName);
                  toggleGroup(groupName);
                },
                className: "w-full flex items-center gap-3 p-3.5 hover:bg-slate-50 transition-colors",
                children: [
                  !hasNoPermissions && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: allGroupSelected,
                      onChange: () => toggleGroupPermissions(groupName),
                      className: "h-5 w-5 rounded-md border border-slate-300 cursor-pointer",
                      onClick: (e) => e.stopPropagation()
                    }
                  ),
                  hasNoPermissions && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-5" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 text-left", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-slate-900", children: groupName }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    perms.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-slate-500", children: [
                      groupSelectedCount,
                      " capabilities"
                    ] }),
                    perms.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          toggleGroup(groupName);
                        },
                        className: "p-1 hover:bg-slate-200 rounded transition-colors text-sm",
                        children: isExpanded ? "^" : "v"
                      }
                    )
                  ] })
                ]
              }
            ),
            isExpanded && perms.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-slate-50 border-t border-slate-100 p-3 space-y-2", children: perms.map((permKey) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2.5 cursor-pointer group", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  checked: selectedPermissions[permKey] || false,
                  onChange: () => togglePermission(permKey),
                  className: "h-4 w-4 rounded border border-slate-300 cursor-pointer"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-600 group-hover:text-slate-900", children: PERMISSION_LABELS[permKey] || permKey })
            ] }, permKey)) })
          ] }, groupName);
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: onSave,
            disabled: isLoading,
            className: "flex-[1.35] h-11 gap-2",
            children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
              "Saving..."
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "Save Changes" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "outline",
            onClick: onCancel,
            className: "flex-1 h-11",
            children: "Cancel"
          }
        )
      ] })
    ] })
  ] }) });
}
function TeamMembersTab() {
  const { language } = useLanguage();
  const tx = (en, ko, zh) => language === "zh" ? zh ?? en : language === "en" ? en : ko;
  const { isSuperAdmin, user } = useAuth();
  const [members, setMembers] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [orgWallet, setOrgWallet] = reactExports.useState(null);
  const [query, setQuery] = reactExports.useState("");
  const [editingMember, setEditingMember] = reactExports.useState(null);
  const [editPermissions, setEditPermissions] = reactExports.useState({});
  const [editPermissionSearch, setEditPermissionSearch] = reactExports.useState("");
  const [editLoading, setEditLoading] = reactExports.useState(false);
  const fetchMembers = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/v1/team/members");
      if (data == null ? void 0 : data.members) {
        setMembers(isSuperAdmin ? data.members : data.members.filter((member) => member.role !== "super_admin"));
      }
      try {
        const walletData = await apiFetch("/api/v1/wallet/organization-balance");
        if (walletData == null ? void 0 : walletData.organization_id) setOrgWallet(walletData);
      } catch {
      }
    } catch (err) {
      ue.error(err.message || "Failed to load team members");
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);
  reactExports.useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);
  const visibleMembers = reactExports.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return members;
    return members.filter((member) => [
      member.name,
      member.email,
      member.telegram_id,
      member.role,
      member.organization_name,
      member.organization_id
    ].some((value) => value == null ? void 0 : value.toLowerCase().includes(normalizedQuery)));
  }, [members, query]);
  const handleEditPermissions = (member) => {
    setEditingMember(member);
    setEditPermissions({ ...member.permissions });
    setEditPermissionSearch("");
  };
  const handleSavePermissions = async () => {
    if (!editingMember) return;
    setEditLoading(true);
    try {
      const selectedPerms = Object.entries(editPermissions).filter(([, enabled]) => enabled).map(([perm]) => perm);
      await apiFetch(`/api/v1/team/members/${editingMember.id}`, {
        method: "PATCH",
        body: JSON.stringify({ permissions: selectedPerms })
      });
      ue.success("Member permissions updated");
      setEditingMember(null);
      setEditPermissions({});
      await fetchMembers();
    } catch (err) {
      ue.error(err.message || "Failed to update member permissions");
    } finally {
      setEditLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      MemberPermissionEditor,
      {
        isOpen: !!editingMember,
        member: editingMember,
        selectedPermissions: editPermissions,
        setSelectedPermissions: setEditPermissions,
        permissionSearch: editPermissionSearch,
        setPermissionSearch: setEditPermissionSearch,
        onSave: handleSavePermissions,
        onCancel: () => {
          setEditingMember(null);
          setEditPermissions({});
          setEditPermissionSearch("");
        },
        isLoading: editLoading
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-white border border-slate-200", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "gap-4 border-b border-slate-100 pb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-sm font-semibold text-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4", "aria-hidden": "true" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: tx("Active Team Members", "활성 팀원") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: tx("Manage access and organization membership at a glance.", "접근 권한과 조직 멤버를 한눈에 관리하세요.") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: () => void fetchMembers(),
              disabled: loading,
              className: "min-h-10 gap-2 self-start sm:self-auto",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-3.5 w-3.5 ${loading ? "motion-safe:animate-spin" : ""}`, "aria-hidden": "true" }),
                tx("Refresh", "새로고침")
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              type: "search",
              value: query,
              onChange: (event) => setQuery(event.target.value),
              placeholder: tx("Search by name, email, role, or Telegram ID", "이름, 이메일, 역할 또는 텔레그램 ID로 검색"),
              "aria-label": tx("Search team members", "팀원 검색"),
              className: "h-10 pl-9 pr-20"
            }
          ),
          query && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => setQuery(""),
              "aria-label": tx("Clear member search", "팀원 검색 지우기"),
              className: "absolute right-2 top-1/2 inline-flex h-7 -translate-y-1/2 items-center gap-1 rounded-md px-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5", "aria-hidden": "true" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: tx("Clear", "지우기") })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
        orgWallet && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-emerald-700", children: tx("Shared organization wallet", "공유 조직 지갑") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-emerald-700", children: orgWallet.organization_name || orgWallet.organization_id })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-semibold text-emerald-950", children: [
              orgWallet.currency,
              " ",
              Number(orgWallet.balance || 0).toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 border-t border-emerald-200/80 pt-2 text-xs text-emerald-700", children: [
            tx("Available balance", "사용 가능 잔액"),
            ": ",
            orgWallet.currency,
            " ",
            Number(orgWallet.available_balance || 0).toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ] })
        ] }),
        loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-8", "aria-busy": "true", "aria-label": "Loading team members", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 motion-safe:animate-spin text-slate-400", "aria-hidden": "true" }) }) : members.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "mx-auto h-8 w-8 text-slate-300", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm font-medium text-slate-700", children: tx("No team members yet", "아직 팀원이 없습니다") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: tx("Invite a member to start managing shared access.", "초대장을 보내 공유 접근 관리를 시작하세요.") })
        ] }) : visibleMembers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "mx-auto h-8 w-8 text-slate-300", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm font-medium text-slate-700", children: tx("No members match your search", "검색 결과가 없습니다") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "link", size: "sm", onClick: () => setQuery(""), className: "mt-1 h-auto p-0 text-xs", children: tx("Clear search", "검색 지우기") })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between gap-3 text-xs text-slate-500", "aria-live": "polite", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              tx("Showing", "표시 중"),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-slate-700", children: visibleMembers.length }),
              " ",
              tx("of", "/"),
              " ",
              members.length
            ] }),
            query && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "truncate", children: [
              tx("Filtered by", "검색어"),
              ": “",
              query,
              "”"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 md:grid-cols-2", children: visibleMembers.map((member) => /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "rounded-xl border border-slate-200 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50/70", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-start gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white", "aria-hidden": "true", children: getMemberInitials(member) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-start justify-between gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "break-words text-sm font-semibold text-foreground", children: member.name || tx("Unnamed member", "이름 없음") }),
                member.email && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 break-all text-xs text-slate-500", children: member.email }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-0.5 break-all text-[11px] text-slate-400", children: [
                  "@",
                  member.telegram_id
                ] })
              ] }) }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${member.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`, children: member.is_active ? tx("Active", "활성") : tx("Inactive", "비활성") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] text-slate-500", children: [
                tx("Joined", "가입일"),
                " ",
                formatDate(member.joined_at) || tx("Unknown", "알 수 없음")
              ] })
            ] }),
            (member.organization_name || member.organization_id) && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 break-words text-[11px] text-slate-500", children: [
              tx("Organization", "조직"),
              ": ",
              member.organization_name || member.organization_id
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-1", children: [
              getPermissionLabels(member.permissions).slice(0, 4).map((permission) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-2.5 w-2.5", "aria-hidden": "true" }),
                permission
              ] }, permission)),
              getPermissionLabels(member.permissions).length > 4 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500", children: [
                "+",
                getPermissionLabels(member.permissions).length - 4,
                " ",
                tx("more", "개 더")
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 flex min-h-9 items-center justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                size: "sm",
                variant: "outline",
                onClick: () => handleEditPermissions(member),
                className: "w-fit text-xs gap-1.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-3.5 w-3.5" }),
                  "Edit Permissions"
                ]
              }
            ) })
          ] }, member.id)) })
        ] })
      ] })
    ] })
  ] });
}
const emptyPreview = {
  eligible_test_merchants: 0,
  payment_transactions: 0,
  disbursements: 0,
  wallet_transactions: 0,
  refunds: 0,
  deposit_receipts: 0
};
const confirmationPhrase = "CLEAR TEST RECORDS";
function parsePreview(data) {
  if (typeof data !== "object" || data === null) {
    throw new Error("The test-record preview response was invalid.");
  }
  const counts = data;
  const eligibleTestMerchants = counts.eligible_test_merchants;
  const paymentTransactions = counts.payment_transactions;
  const disbursements = counts.disbursements;
  const walletTransactions = counts.wallet_transactions;
  const refunds = counts.refunds;
  const depositReceipts = counts.deposit_receipts;
  if (!Number.isInteger(eligibleTestMerchants) || !Number.isInteger(paymentTransactions) || !Number.isInteger(disbursements) || !Number.isInteger(walletTransactions) || !Number.isInteger(refunds) || !Number.isInteger(depositReceipts) || Number(eligibleTestMerchants) < 0 || Number(paymentTransactions) < 0 || Number(disbursements) < 0 || Number(walletTransactions) < 0 || Number(refunds) < 0 || Number(depositReceipts) < 0) {
    throw new Error("The test-record preview response was invalid.");
  }
  return {
    eligible_test_merchants: Number(eligibleTestMerchants),
    payment_transactions: Number(paymentTransactions),
    disbursements: Number(disbursements),
    wallet_transactions: Number(walletTransactions),
    refunds: Number(refunds),
    deposit_receipts: Number(depositReceipts)
  };
}
function parseClearResult(data) {
  if (typeof data !== "object" || data === null) {
    throw new Error("The test-record deletion response was invalid.");
  }
  const result = data;
  const paymentTransactions = result.payment_transactions;
  const disbursements = result.disbursements;
  const walletTransactions = result.wallet_transactions;
  const refunds = result.refunds;
  const depositReceipts = result.deposit_receipts;
  if (result.success !== true || !Number.isInteger(paymentTransactions) || !Number.isInteger(disbursements) || !Number.isInteger(walletTransactions) || !Number.isInteger(refunds) || !Number.isInteger(depositReceipts) || Number(paymentTransactions) < 0 || Number(disbursements) < 0 || Number(walletTransactions) < 0 || Number(refunds) < 0 || Number(depositReceipts) < 0) {
    throw new Error("The test-record deletion response was invalid.");
  }
  return {
    payment_transactions: Number(paymentTransactions),
    disbursements: Number(disbursements),
    wallet_transactions: Number(walletTransactions),
    refunds: Number(refunds),
    deposit_receipts: Number(depositReceipts)
  };
}
function TestDataCleanupTab() {
  const [preview, setPreview] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [clearing, setClearing] = reactExports.useState(false);
  const [confirmOpen, setConfirmOpen] = reactExports.useState(false);
  const [confirmation, setConfirmation] = reactExports.useState("");
  const refreshPreview = reactExports.useCallback(async () => {
    var _a;
    setLoading(true);
    try {
      const response = await client.get("/api/v1/admin/test-data/preview");
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.detail) || "Unable to load test-record counts.");
      }
      setPreview(parsePreview(response.data));
    } catch (error) {
      ue.error(error instanceof Error ? error.message : "Unable to load test-record counts.");
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    void refreshPreview();
  }, [refreshPreview]);
  const clearRecords = async () => {
    var _a;
    if (confirmation !== confirmationPhrase) return;
    setClearing(true);
    try {
      const response = await client.request("/api/v1/admin/test-data/clear", "POST", {
        confirmation
      });
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.detail) || "Unable to clear test records.");
      }
      const deleted = parseClearResult(response.data);
      setConfirmOpen(false);
      setConfirmation("");
      await refreshPreview();
      const total = Object.values(deleted).reduce((sum, count) => sum + count, 0);
      ue.success(`Removed ${total} transaction records across all record types.`);
    } catch (error) {
      ue.error(error instanceof Error ? error.message : "Unable to clear test records.");
    } finally {
      setClearing(false);
    }
  };
  const counts = preview || emptyPreview;
  const hasRecords = Object.entries(counts).filter(([key]) => key !== "eligible_test_merchants").some(([, count]) => count > 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-amber-200 bg-amber-50/50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-base text-slate-900", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-5 w-5 text-amber-600" }),
        "Clear test transaction records"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm leading-6 text-slate-600", children: "Permanently removes payment transactions, disbursements, wallet transaction history, refunds, and manual deposit receipts belonging to merchant accounts currently in Test Mode. Live-mode accounts and super-admin records are excluded. Wallet balances are preserved." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CountCard, { label: "Test-mode merchants", count: counts.eligible_test_merchants }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CountCard, { label: "Payment transactions", count: counts.payment_transactions }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CountCard, { label: "Disbursements", count: counts.disbursements }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CountCard, { label: "Wallet transaction history", count: counts.wallet_transactions }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CountCard, { label: "Refund records", count: counts.refunds }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CountCard, { label: "Manual deposit receipts", count: counts.deposit_receipts })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", onClick: () => void refreshPreview(), disabled: loading || clearing, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}` }),
            "Refresh counts"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "destructive",
              onClick: () => setConfirmOpen(true),
              disabled: loading || clearing || !hasRecords,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-2 h-4 w-4" }),
                "Clear test records"
              ]
            }
          )
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Dialog,
      {
        open: confirmOpen,
        onOpenChange: (open) => {
          if (!clearing) {
            setConfirmOpen(open);
            if (!open) setConfirmation("");
          }
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Confirm permanent deletion" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { children: [
              "This will delete all five listed record categories for current test-mode merchants. Wallet balances remain unchanged. This cannot be undone. Type",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: confirmationPhrase }),
              " to continue."
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              autoComplete: "off",
              value: confirmation,
              onChange: (event) => setConfirmation(event.target.value),
              "aria-label": `Type ${confirmationPhrase} to confirm`,
              className: "h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", disabled: clearing, onClick: () => setConfirmOpen(false), children: "Cancel" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "destructive",
                disabled: clearing || confirmation !== confirmationPhrase,
                onClick: () => void clearRecords(),
                children: clearing ? "Clearing…" : "Permanently clear records"
              }
            )
          ] })
        ] })
      }
    )
  ] });
}
function CountCard({ label, count }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-white px-4 py-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-500", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xl font-bold text-slate-900", children: count })
  ] });
}
function buildAdminTabs(access, merchantCount) {
  const tabs = [];
  if (access.isSuperAdmin) {
    tabs.push({
      id: "dashboard",
      label: "Dashboard",
      icon: ChartColumn,
      group: "Banking Operations",
      description: "Overview of key metrics, recent transactions, and system status."
    });
  }
  if (access.canAccessMerchants) {
    tabs.push({
      id: "merchants",
      label: "Merchants",
      icon: Users,
      count: merchantCount,
      group: "Banking Operations",
      description: "Manage merchant accounts and owner information."
    });
  }
  if (access.canAccessTransactions) {
    tabs.push({
      id: "transactions",
      label: "Transactions",
      icon: TrendingUp,
      group: "Banking Operations",
      description: "Monitor and manage payment transactions across the platform."
    });
  }
  if (access.canAccessSettlements) {
    tabs.push({
      id: "settlements",
      label: "Settlements",
      icon: DollarSign,
      group: "Banking Operations",
      description: "Manage settlement batches and reconciliation."
    });
  }
  if (access.canAccessWalletControl) {
    tabs.push({
      id: "wallet-control",
      label: "Wallet Control",
      icon: Wallet,
      group: "Financial Control",
      description: "Credit or debit wallets and manage account balances."
    });
  }
  if (access.canAccessCryptoApprovals) {
    tabs.push({
      id: "crypto-approvals",
      label: "Crypto Approvals",
      icon: Bitcoin,
      group: "Financial Control",
      description: "Review and approve USDT top-up requests."
    });
  }
  if (access.canAccessTossAccountApprovals) {
    tabs.push({
      id: "toss-account-approvals",
      label: "TOSS Account Approvals",
      icon: ShieldCheck,
      group: "Financial Control",
      description: "Manage and approve TOSS bank account applications."
    });
  }
  if (access.canAccessPaymentChannels) {
    tabs.push({
      id: "payment-channels",
      label: "Payment Channels",
      icon: Power,
      group: "Payment Configuration",
      description: "Enable/disable payment methods by currency and region."
    });
  }
  if (access.canAccessWalletSettings) {
    tabs.push({
      id: "wallet-settings",
      label: "Wallet Settings",
      icon: Wrench,
      group: "Payment Configuration",
      description: "Configure wallet deposit currencies and receiving accounts."
    });
  }
  if (access.canAccessUserManagement) {
    tabs.push({
      id: "users",
      label: "Users",
      icon: Users,
      group: "Access & Governance",
      description: "Manage platform users and their roles."
    });
  }
  if (access.canManageTeam) {
    tabs.push(
      {
        id: "team-invitations",
        label: "Team Invitations",
        icon: Mail,
        group: "Access & Governance",
        description: "Manage pending team member invitations."
      },
      {
        id: "team-members",
        label: "Team Members",
        icon: Users,
        group: "Access & Governance",
        description: "Manage team members and their permissions."
      }
    );
  }
  if (access.canAccessGovernance) {
    tabs.push({
      id: "audit-logs",
      label: "Audit Logs",
      icon: FileText,
      group: "Access & Governance",
      description: "Review audit trail of all platform operations."
    });
  }
  if (access.canAccessPlatformSettings) {
    tabs.push({
      id: "platform-settings",
      label: "Platform Settings",
      icon: Wrench,
      group: "Platform Management",
      description: "Configure system-wide settings and fees."
    });
  }
  if (access.canAccessOperations) {
    tabs.push({
      id: "operations",
      label: "Operations",
      icon: RefreshCw,
      group: "Platform Management",
      description: "Access operational workflows and maintenance tasks."
    });
  }
  if (access.isSuperAdmin) {
    tabs.push({
      id: "test-data-cleanup",
      label: "Test Data Cleanup",
      icon: Trash2,
      group: "Platform Management",
      description: "Clear test transactions and data."
    });
  }
  return tabs;
}
function AdminManagement() {
  var _a, _b, _c, _d, _e, _f, _g;
  const { user, isSuperAdmin: isPlatformSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [selectedTab, setSelectedTab] = reactExports.useState("dashboard");
  const canManageTeam = Boolean((_a = user == null ? void 0 : user.permissions) == null ? void 0 : _a.can_manage_team);
  const canAccessAdminManagement = isPlatformSuperAdmin || canManageTeam;
  const canManagePayments = Boolean((_b = user == null ? void 0 : user.permissions) == null ? void 0 : _b.can_manage_payments);
  const canManageWallet = Boolean((_c = user == null ? void 0 : user.permissions) == null ? void 0 : _c.can_manage_wallet);
  const canManageDisbursements = Boolean((_d = user == null ? void 0 : user.permissions) == null ? void 0 : _d.can_manage_disbursements);
  const canApproveTopups = Boolean((_e = user == null ? void 0 : user.permissions) == null ? void 0 : _e.can_approve_topups);
  const canViewReports = Boolean((_f = user == null ? void 0 : user.permissions) == null ? void 0 : _f.can_view_reports);
  const canManageBot = Boolean((_g = user == null ? void 0 : user.permissions) == null ? void 0 : _g.can_manage_bot);
  const canAccessDashboard = isPlatformSuperAdmin;
  const canAccessMerchants = isPlatformSuperAdmin && canManageTeam;
  const canAccessTransactions = isPlatformSuperAdmin && (canManagePayments || canViewReports);
  const canAccessSettlements = isPlatformSuperAdmin && canManageDisbursements;
  const canAccessWalletControl = isSystemWalletAdmin(user == null ? void 0 : user.id) && isPlatformSuperAdmin && canManageWallet;
  const canAccessCryptoApprovals = isSystemWalletAdmin(user == null ? void 0 : user.id) && isPlatformSuperAdmin && canApproveTopups;
  const canAccessPaymentChannels = isPlatformSuperAdmin && (canManagePayments || canManageDisbursements);
  const canAccessWalletSettings = isPlatformSuperAdmin && canManageWallet;
  const canAccessUserManagement = isPlatformSuperAdmin;
  const canAccessOperations = isPlatformSuperAdmin && (canManagePayments || canManageDisbursements || canApproveTopups || canViewReports || canManageBot);
  const canAccessPlatformSettings = isPlatformSuperAdmin && (canManagePayments || canManageWallet);
  const canAccessGovernance = isPlatformSuperAdmin;
  const canAccessTossAccountApprovals = isPlatformSuperAdmin && canManageWallet;
  const tabs = reactExports.useMemo(() => buildAdminTabs({
    canAccessMerchants,
    canAccessTransactions,
    canAccessSettlements,
    canAccessWalletControl,
    canAccessCryptoApprovals,
    canAccessPaymentChannels,
    canAccessWalletSettings,
    canAccessUserManagement,
    canAccessPlatformSettings,
    canAccessOperations,
    canAccessTossAccountApprovals,
    canManageTeam,
    canAccessGovernance,
    isSuperAdmin: isPlatformSuperAdmin
  }, 0), [
    canAccessDashboard,
    canAccessMerchants,
    canAccessTransactions,
    canAccessSettlements,
    canAccessWalletControl,
    canAccessCryptoApprovals,
    canAccessPaymentChannels,
    canAccessWalletSettings,
    canAccessUserManagement,
    canAccessPlatformSettings,
    canAccessOperations,
    canAccessTossAccountApprovals,
    canManageTeam,
    canAccessGovernance,
    isPlatformSuperAdmin
  ]);
  reactExports.useEffect(() => {
    if (requestedTab && tabs.some((tab) => tab.id === requestedTab)) {
      setSelectedTab(requestedTab);
    } else if (tabs.length > 0) {
      setSelectedTab(tabs[0].id);
    }
  }, [requestedTab, tabs]);
  reactExports.useEffect(() => {
    if (!canAccessAdminManagement) {
      navigate("/dashboard", { replace: true });
    }
  }, [canAccessAdminManagement, navigate]);
  if (!canAccessAdminManagement) {
    return null;
  }
  const selectedTabMeta = tabs.find((tab) => tab.id === selectedTab);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AdminSidebar,
      {
        tabs,
        active: selectedTab,
        onChange: setSelectedTab
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8", children: [
      selectedTabMeta && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-600", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold uppercase tracking-wider text-slate-500", children: selectedTabMeta.group }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: "•" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-slate-900", children: selectedTabMeta.label })
      ] }) }) }),
      selectedTab === "dashboard" && canAccessDashboard && /* @__PURE__ */ jsxRuntimeExports.jsx(BankingDashboard, {}),
      selectedTab === "merchants" && canAccessMerchants && /* @__PURE__ */ jsxRuntimeExports.jsx(MerchantManagement, {}),
      selectedTab === "transactions" && canAccessTransactions && /* @__PURE__ */ jsxRuntimeExports.jsx(TransactionsTab, {}),
      selectedTab === "settlements" && canAccessSettlements && /* @__PURE__ */ jsxRuntimeExports.jsx(SettlementsTab, {}),
      selectedTab === "wallet-control" && canAccessWalletControl && /* @__PURE__ */ jsxRuntimeExports.jsx(WalletControlTab, {}),
      selectedTab === "crypto-approvals" && canAccessCryptoApprovals && /* @__PURE__ */ jsxRuntimeExports.jsx(CryptoApprovalsTab, {}),
      selectedTab === "toss-account-approvals" && canAccessTossAccountApprovals && /* @__PURE__ */ jsxRuntimeExports.jsx(TossAccountApprovalsPanel, {}),
      selectedTab === "payment-channels" && canAccessPaymentChannels && /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentChannelsTab, {}),
      selectedTab === "wallet-settings" && canAccessWalletSettings && /* @__PURE__ */ jsxRuntimeExports.jsx(WalletSettingsTab, {}),
      selectedTab === "users" && canAccessUserManagement && /* @__PURE__ */ jsxRuntimeExports.jsx(UsersTab, {}),
      selectedTab === "team-invitations" && canManageTeam && /* @__PURE__ */ jsxRuntimeExports.jsx(TeamInvitationsTab, {}),
      selectedTab === "team-members" && canManageTeam && /* @__PURE__ */ jsxRuntimeExports.jsx(TeamMembersTab, {}),
      selectedTab === "audit-logs" && canAccessGovernance && /* @__PURE__ */ jsxRuntimeExports.jsx(AuditLogsTab, {}),
      selectedTab === "platform-settings" && canAccessPlatformSettings && /* @__PURE__ */ jsxRuntimeExports.jsx(PlatformSettingsTab, {}),
      selectedTab === "operations" && canAccessOperations && /* @__PURE__ */ jsxRuntimeExports.jsx(OperationsTab, {}),
      selectedTab === "test-data-cleanup" && isPlatformSuperAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(TestDataCleanupTab, {})
    ] })
  ] }) });
}
export {
  AdminManagement as default
};
