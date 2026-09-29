import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { a as reactExports, h as useSearchParams, e as useNavigate, d as React } from "./router-vendor-C2eKMart.js";
import { I as PERMISSION_DEFINITIONS, d as cn, a as useLanguage, u as useAuth, b as ue, p as Card, q as CardHeader, s as CardTitle, e as Button, v as CardContent, J as getRoleDisplayName, K as buildAuthHeaders, g as client, L as Layout } from "./index-PXRdWIAr.js";
import { w as walletApi } from "./wallet-kssx3QR7.js";
import { B as Badge } from "./badge-Osp_isCm.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, e as DialogDescription, d as DialogFooter } from "./dialog-BXh6FG7t.js";
import { I as Input } from "./input-GT55LcvP.js";
import { L as Label } from "./label-BdowKUYF.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-C68HPGFj.js";
import { aP as UserPlus, z as LoaderCircle, aZ as Mail, $ as Check, aO as Clock, aG as Lock, at as Trash2, a3 as Users, R as RefreshCw, Z as Search, X, T as TriangleAlert, k as Shield, _ as ChevronDown, d as ShieldCheck, B as Bitcoin, W as Wallet, o as CircleCheckBig, P as Power, b1 as Wrench, bb as Palette, aH as FileText, al as Plus, p as CircleAlert, O as Crown, l as User, ao as KeyRound, bc as Tag, aU as DollarSign, bd as PowerOff, am as Download, ar as Save, be as Settings2, r as Landmark, aT as Pencil, bf as Upload, aS as CircleX } from "./utils-vendor-DoKCqRlq.js";
import { TossAccountApprovalsPanel } from "./TossAccountApprovals-BsyuyXwt.js";
import "./ui-vendor-DsSOT9J9.js";
import "./krw-banks-BXy8-Tdf.js";
import "./switch-DrRnvhrm.js";
import "./clipboard-B4pReMJK.js";
const platformOnlyPermissions = /* @__PURE__ */ new Set([
  "can_approve_topups",
  "can_credit_wallet",
  "can_debit_wallet",
  "can_freeze_wallet",
  "can_unfreeze_wallet"
]);
const ROLE_PERMISSION_PRESETS = {
  owner: new Set(PERMISSION_DEFINITIONS.filter(({ key }) => !platformOnlyPermissions.has(key)).map(({ key }) => key)),
  admin: new Set(PERMISSION_DEFINITIONS.filter(({ key }) => !platformOnlyPermissions.has(key)).map(({ key }) => key)),
  manager: /* @__PURE__ */ new Set(["can_manage_team", "can_manage_payments", "can_manage_disbursements", "can_view_reports", "can_manage_wallet", "can_manage_transactions"]),
  operator: /* @__PURE__ */ new Set(["can_manage_payments", "can_manage_disbursements", "can_manage_transactions"]),
  viewer: /* @__PURE__ */ new Set(["can_view_reports", "can_manage_transactions"]),
  developer: /* @__PURE__ */ new Set(["can_manage_bot"])
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
function RoleBadge({ role }) {
  if (role.trim().toLowerCase() === "store") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "span",
      {
        className: "inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800",
        "aria-label": "Powered by DRL Technology",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Powered by" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: "/partners/drl-technology-gold.png",
              alt: "DRL Technology",
              className: "h-4 w-auto max-w-[92px] object-contain"
            }
          )
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex w-fit items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-3 w-3" }),
    getRoleDisplayName(role)
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
function formatDate$1(value) {
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
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", role: "presentation", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4", role: "dialog", "aria-modal": "true", "aria-labelledby": "revoke-invitation-title", "aria-describedby": "revoke-invitation-description", children: [
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
function TeamInvitationsTab() {
  const { language } = useLanguage();
  const tx = (en, ko, zh) => language === "zh" ? zh ?? en : language === "en" ? en : ko;
  const { isSuperAdmin } = useAuth();
  const [invitations, setInvitations] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [formOpen, setFormOpen] = reactExports.useState(false);
  const [selectedRole, setSelectedRole] = reactExports.useState("admin");
  const [email, setEmail] = reactExports.useState("");
  const [organizationName, setOrganizationName] = reactExports.useState("");
  const [organizationId, setOrganizationId] = reactExports.useState("");
  const [notes, setNotes] = reactExports.useState("");
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
    if (isSuperAdmin && selectedRole === "owner" && !organizationName.trim() && !organizationId.trim()) {
      ue.error("Organization name or ID is required for owner invitations");
      return;
    }
    try {
      setFormLoading(true);
      setLastInvitationLink(null);
      const data = await apiFetch("/api/v1/team/invite", {
        method: "POST",
        body: JSON.stringify({
          email,
          role: selectedRole,
          organization_name: isSuperAdmin ? organizationName.trim() || void 0 : void 0,
          organization_id: isSuperAdmin ? organizationId.trim() || void 0 : void 0,
          notes: notes || void 0
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
      setOrganizationName("");
      setOrganizationId("");
      setNotes("");
      setSelectedRole("admin");
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
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "overflow-hidden bg-white border border-slate-200 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "bg-slate-50/70 pb-4 border-b border-slate-100", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
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
      ] }) }),
      formOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-5 sm:pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs leading-relaxed text-blue-800", children: tx("Payment links owned by your organization settle into its single shared wallet. Grant each member only the permissions they need.", "조직 소유 결제 링크의 정산금은 조직 공동 지갑 하나로 입금됩니다. 각 팀원에게 필요한 권한만 부여하세요.") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "team-invitation-email", className: "text-sm font-medium", children: tx("Email Address", "이메일 주소") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "team-invitation-email",
              type: "email",
              placeholder: "user@example.com",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              className: "mt-1.5"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "team-invitation-role", className: "text-sm font-medium", children: tx("Role", "역할") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: selectedRole, onValueChange: setSelectedRole, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "team-invitation-role", className: "mt-1.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              isSuperAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "super_admin", children: "Super Admin" }),
              isSuperAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "owner", children: "Owner (create organization)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "admin", children: "Admin" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "editor", children: "Editor" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "viewer", children: "Viewer" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "developer", children: "Developer" })
            ] })
          ] })
        ] }),
        isSuperAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "team-invitation-organization-name", className: "text-sm font-medium", children: tx("Organization Name (Optional)", "조직 이름 (선택 사항)") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "team-invitation-organization-name",
                placeholder: "Acme Business Inc",
                value: organizationName,
                onChange: (e) => setOrganizationName(e.target.value),
                className: "mt-1.5"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "team-invitation-organization-id", className: "text-sm font-medium", children: tx("Organization ID (Optional)", "조직 ID (선택 사항)") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "team-invitation-organization-id",
                placeholder: "acme-business",
                value: organizationId,
                onChange: (e) => setOrganizationId(e.target.value),
                className: "mt-1.5"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Owner invites require a name or ID." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-medium", children: tx("Notes (Optional)", "메모 (선택 사항)") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              placeholder: "Add notes for this invitation...",
              value: notes,
              onChange: (e) => setNotes(e.target.value),
              className: "mt-1.5"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-2 pt-2 sm:grid-cols-[1fr_auto]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSendInvitation, disabled: formLoading, className: "min-h-11 gap-2", children: formLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 motion-safe:animate-spin", "aria-hidden": "true" }),
            "Sending..."
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-4 w-4" }),
            "Send Invitation"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "min-h-11", onClick: () => {
            setFormOpen(false);
            setLastInvitationLink(null);
          }, children: tx("Cancel", "취소") })
        ] }),
        lastInvitationLink && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200 animate-fade-in-up", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-blue-800 font-semibold text-xs uppercase tracking-wider mb-2", children: [
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
        ] })
      ] }) })
    ] }),
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
                formatDate$1(inv.invited_at) || "Unknown date",
                formatDate$1(inv.expires_at) && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  " • Expires ",
                  formatDate$1(inv.expires_at)
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
function TeamMembersTab() {
  const { language } = useLanguage();
  const tx = (en, ko, zh) => language === "zh" ? zh ?? en : language === "en" ? en : ko;
  const { isSuperAdmin, user } = useAuth();
  const [members, setMembers] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [orgWallet, setOrgWallet] = reactExports.useState(null);
  const [query, setQuery] = reactExports.useState("");
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
  const handleSuperAdminToggle = async (member) => {
    if (!isSuperAdmin || String(member.telegram_id) === String(user == null ? void 0 : user.id)) return;
    const grant = member.role !== "super_admin";
    try {
      await apiFetch(`/api/v1/admin-users/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_super_admin: grant })
      });
      ue.success(grant ? "Super admin access granted" : "Super admin access removed");
      await fetchMembers();
    } catch (err) {
      ue.error(err.message || "Failed to update super admin access");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-white border border-slate-200", children: [
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
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "break-words text-sm font-semibold text-foreground", children: member.name || tx("Unnamed member", "이름 없음") }),
                member.email && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 break-all text-xs text-slate-500", children: member.email }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-0.5 break-all text-[11px] text-slate-400", children: [
                  "@",
                  member.telegram_id
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(RoleBadge, { role: member.role })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${member.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`, children: member.is_active ? tx("Active", "활성") : tx("Inactive", "비활성") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] text-slate-500", children: [
              tx("Joined", "가입일"),
              " ",
              formatDate$1(member.joined_at) || tx("Unknown", "알 수 없음")
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
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 flex min-h-9 items-center justify-end", children: isSuperAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              size: "sm",
              variant: "outline",
              disabled: String(member.telegram_id) === String(user == null ? void 0 : user.id),
              onClick: () => handleSuperAdminToggle(member),
              className: "w-fit text-xs",
              children: member.role === "super_admin" ? "Remove Super Admin" : "Make Super Admin"
            }
          ) })
        ] }, member.id)) })
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
function buildAdminTabs(access, adminCount) {
  const tabs = [];
  if (access.canAccessAdminUsers) {
    tabs.push({
      id: "admins",
      label: "Admin Users",
      icon: ShieldCheck,
      count: adminCount,
      group: "People & access",
      description: "Manage dashboard administrators and their specific permissions."
    });
  }
  if (access.canAccessUserManagement) {
    tabs.push({
      id: "users",
      label: "User Management",
      icon: Users,
      group: "People & access",
      description: "View and manage roles for all registered platform users."
    });
  }
  if (access.canAccessCryptoRequests) {
    tabs.push({
      id: "crypto",
      label: "Crypto Requests",
      icon: Bitcoin,
      group: "Approvals & wallets",
      description: "Review and approve USDT top-up requests from users."
    });
  }
  if (access.canAccessWalletControl) {
    tabs.push({
      id: "wallet-control",
      label: "Wallet Control",
      icon: Wallet,
      iconClassName: "text-blue-400",
      group: "Approvals & wallets",
      description: "Credit or debit any active user wallet in PHP, USDT, CNY, or KRW."
    });
  }
  if (access.canAccessOperations) {
    tabs.push({
      id: "operations",
      label: "Operational workflows",
      icon: RefreshCw,
      group: "Approvals & wallets",
      description: "Open payment, deposit, withdrawal, verification, broadcast, and bot operations."
    });
  }
  if (access.canAccessTossApprovals) {
    tabs.push({
      id: "toss-approvals",
      label: "TOSS Bank approvals",
      icon: CircleCheckBig,
      group: "Approvals & wallets",
      description: "Review and approve TOSS Bank virtual account applications."
    });
  }
  if (access.canAccessPaymentChannels) {
    tabs.push({
      id: "payment-channels",
      label: "Payment Channels",
      icon: Power,
      group: "Payments & configuration",
      description: "Control checkout, withdrawal, and disbursement channels by currency."
    });
  }
  if (access.canAccessWalletSettings) {
    tabs.push({
      id: "wallet-settings",
      label: "Wallet Settings",
      icon: Wrench,
      group: "Payments & configuration",
      description: "Set incoming, deposit, balance, and withdrawal limits for all user wallets."
    });
  }
  if (access.canAccessBitgo) {
    tabs.push({
      id: "bitgo",
      label: "BitGo USDT",
      icon: Bitcoin,
      group: "Payments & configuration",
      description: "Configure unique TRC20 address assignment and scan incoming and outgoing transfers."
    });
  }
  if (access.canAccessCheckoutDesign) {
    tabs.push({
      id: "checkout-design",
      label: "Checkout Design",
      icon: Palette,
      group: "Payments & configuration",
      description: "Customize the public checkout appearance."
    });
  }
  if (access.canAccessPlatformSettings) {
    tabs.push({
      id: "platform-settings",
      label: "Platform settings",
      icon: Wrench,
      group: "Payments & configuration",
      description: "Manage collection currencies, conversion fees, and database backups."
    });
  }
  if (access.canManageTeam) {
    tabs.push(
      {
        id: "team-invitations",
        label: "Team Invitations",
        icon: Mail,
        group: "Teams",
        description: "Manage pending team invites and organization access."
      },
      {
        id: "team-members",
        label: "Team Members",
        icon: Users,
        group: "Teams",
        description: "Manage existing team members within your organization."
      }
    );
  }
  if (access.canAccessGovernance) {
    tabs.push({
      id: "audit-logs",
      label: "Audit Logs",
      icon: FileText,
      group: "Governance",
      description: "Review administrative activity and export audit history."
    });
  }
  if (access.isSuperAdmin) {
    tabs.push({
      id: "test-data-cleanup",
      label: "Test data cleanup",
      icon: Trash2,
      group: "Governance",
      description: "Review and permanently clear payment transactions and disbursements for test-mode merchants."
    });
  }
  return tabs;
}
const authenticatedFetch = client.fetch;
const channelOptions = [
  { id: "gcash", label: "GCash" },
  { id: "maya", label: "Maya" },
  { id: "bank_transfer", label: "Bank transfer" },
  { id: "virtual_account", label: "SwiftPay Virtual Account" },
  { id: "qr_code", label: "QR code" },
  { id: "alipay", label: "Alipay" },
  { id: "wechat", label: "WeChat Pay" },
  { id: "card", label: "Card" }
];
const phpInstitutionOptions = [
  { id: "GCASH", label: "GCash" },
  { id: "MAYA", label: "Maya" },
  { id: "ALIPAY", label: "Alipay" },
  { id: "BDO", label: "BDO" },
  { id: "BPI", label: "BPI" },
  { id: "LANDBANK", label: "LandBank" },
  { id: "METROBANK", label: "Metrobank" },
  { id: "UNIONBANK", label: "UnionBank" },
  { id: "RCBC", label: "RCBC" },
  { id: "PSBANK", label: "PSBank" },
  { id: "SECBANK", label: "Security Bank" },
  { id: "AUB", label: "Asia United Bank" },
  { id: "EASTWEST", label: "EastWest Bank" },
  { id: "DBP", label: "DBP" },
  { id: "KB", label: "KB Kookmin Bank" },
  { id: "SHINHAN", label: "Shinhan Bank" },
  { id: "HANA", label: "Hana Bank" },
  { id: "WOORI", label: "Woori Bank" },
  { id: "NH", label: "NH NongHyup Bank" },
  { id: "IBK", label: "IBK" },
  { id: "KDB", label: "KDB Bank" },
  { id: "SC", label: "SC First Bank" },
  { id: "KAKAO", label: "Kakao Bank" },
  { id: "TOSS", label: "Toss Bank" }
];
function PaymentChannelsTab({ onError }) {
  const [config, setConfig] = reactExports.useState({});
  const [currency, setCurrency] = reactExports.useState("PHP");
  const [saving, setSaving] = reactExports.useState(false);
  const load = reactExports.useCallback(async () => {
    try {
      const response = await authenticatedFetch("/api/v1/app-settings/payment-channels");
      if (!response.ok) throw new Error(await response.text());
      setConfig((await response.json()).channels || {});
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to load payment channels");
    }
  }, [onError]);
  reactExports.useEffect(() => {
    load();
  }, [load]);
  const toggle = (flow, channel) => {
    setConfig((current2) => {
      const currentCurrency = current2[currency] || { checkout: [], withdrawal: [], disbursement: [] };
      const enabledChannels = currentCurrency[flow] || [];
      const enabled = enabledChannels.includes(channel);
      return {
        ...current2,
        [currency]: {
          ...currentCurrency,
          [flow]: enabled ? enabledChannels.filter((value) => value !== channel) : [...enabledChannels, channel]
        }
      };
    });
  };
  const toggleInstitution = (institution) => {
    setConfig((current2) => {
      const currentCurrency = current2.PHP || { checkout: [], withdrawal: [], disbursement: [] };
      const enabled = currentCurrency.checkout_institutions ?? phpInstitutionOptions.map((option) => option.id);
      return {
        ...current2,
        PHP: {
          ...currentCurrency,
          checkout_institutions: enabled.includes(institution) ? enabled.filter((value) => value !== institution) : [...enabled, institution]
        }
      };
    });
  };
  const save = async () => {
    setSaving(true);
    try {
      const response = await authenticatedFetch("/api/v1/app-settings/payment-channels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channels: config })
      });
      if (!response.ok) throw new Error(await response.text());
      setConfig((await response.json()).channels || config);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to save payment channels");
    } finally {
      setSaving(false);
    }
  };
  const current = config[currency] || { checkout: [], withdrawal: [], disbursement: [] };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-slate-900", children: "Payment Channels" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Choose which channels appear for each currency and flow." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: save, disabled: saving, className: "w-full shrink-0 bg-[#FF6B00] text-white hover:bg-[#E66000] sm:w-auto", children: saving ? "Saving..." : "Save changes" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 grid grid-cols-3 rounded-xl bg-slate-100 p-1", role: "group", "aria-label": "Payment channel currency", children: ["PHP", "CNY", "KRW"].map((value) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        "aria-pressed": currency === value,
        onClick: () => setCurrency(value),
        className: `motion-interactive min-h-11 rounded-lg px-3 text-sm font-semibold transition-colors ${currency === value ? "bg-white text-[#FF6B00] shadow-sm" : "text-slate-500 hover:text-slate-800"}`,
        children: value
      },
      value
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 hidden overflow-hidden rounded-xl border border-slate-200 sm:block", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[minmax(0,1fr)_repeat(3,minmax(96px,120px))] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Channel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-center", children: "Checkout" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-center", children: "Withdrawal" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-center", children: "Disbursement" })
      ] }),
      channelOptions.map((channel) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[minmax(0,1fr)_repeat(3,minmax(96px,120px))] items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 truncate font-medium", children: channel.label }),
        ["checkout", "withdrawal", "disbursement"].map((flow) => {
          const enabled = current[flow].includes(channel.id);
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => toggle(flow, channel.id),
              "aria-label": `${channel.label} ${flow}`,
              "aria-pressed": enabled,
              className: `motion-interactive mx-auto min-h-9 min-w-14 rounded-full px-3 text-xs font-semibold ${enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`,
              children: enabled ? "On" : "Off"
            },
            flow
          );
        })
      ] }, channel.id))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 space-y-3 sm:hidden", children: channelOptions.map((channel) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-3 text-sm font-semibold text-slate-900", children: channel.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: ["checkout", "withdrawal", "disbursement"].map((flow) => {
        const enabled = current[flow].includes(channel.id);
        const label = flow === "disbursement" ? "Disburse" : flow;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => toggle(flow, channel.id),
            "aria-label": `${channel.label} ${flow}`,
            "aria-pressed": enabled,
            className: `motion-interactive flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg border px-1.5 text-[11px] font-semibold capitalize ${enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-medium", children: enabled ? "On" : "Off" })
            ]
          },
          flow
        );
      }) })
    ] }, channel.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 border-t border-slate-200 pt-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-slate-900", children: "PHP checkout banks" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Turn individual SwiftPay institutions on or off for the public checkout page." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3", children: phpInstitutionOptions.map((institution) => {
        var _a;
        const enabled = (((_a = config.PHP) == null ? void 0 : _a.checkout_institutions) || phpInstitutionOptions.map((option) => option.id)).includes(institution.id);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => toggleInstitution(institution.id),
            "aria-pressed": enabled,
            className: `motion-interactive flex min-h-12 items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm font-medium ${enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 truncate", children: institution.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 text-xs font-semibold", children: enabled ? "On" : "Off" })
            ]
          },
          institution.id
        );
      }) })
    ] })
  ] });
}
const createDepositAccount = (number) => ({
  value: `account-${number}`,
  label: "",
  account_number: "",
  account_name: "",
  currency: "PHP",
  swift_code: "",
  receiving_currency: "",
  bank_code: "",
  branch_code: "",
  bank_address: "",
  minimum_amount: void 0
});
const isTossDepositAccount = (account) => account.currency.toUpperCase() === "KRW" && /toss|토스/i.test(`${account.value} ${account.label}`);
function PlatformSettingsTab({ onError }) {
  const [currencies, setCurrencies] = reactExports.useState(["PHP", "CNY", "KRW", "USDT"]);
  const [conversionFee, setConversionFee] = reactExports.useState("1");
  const [saving, setSaving] = reactExports.useState(false);
  const [backupBusy, setBackupBusy] = reactExports.useState(false);
  const restoreInputRef = React.useRef(null);
  reactExports.useEffect(() => {
    Promise.all([
      client.get("/api/v1/app-settings/collection-currencies"),
      client.get("/api/v1/app-settings/conversion-fee")
    ]).then(([currencyResponse, feeResponse]) => {
      var _a, _b;
      if (currencyResponse.ok && Array.isArray((_a = currencyResponse.data) == null ? void 0 : _a.currencies)) setCurrencies(currencyResponse.data.currencies);
      if (feeResponse.ok && ((_b = feeResponse.data) == null ? void 0 : _b.fee_percent) != null) setConversionFee(String(feeResponse.data.fee_percent));
    }).catch((error) => onError(error instanceof Error ? error.message : "Unable to load platform settings"));
  }, [onError]);
  const updateCurrencies = async (currency) => {
    var _a;
    const next = currencies.includes(currency) ? currencies.filter((item) => item !== currency) : [...currencies, currency];
    if (!next.length) return onError("Keep at least one collection currency enabled");
    setSaving(true);
    try {
      const response = await client.request("/api/v1/app-settings/collection-currencies", "PUT", { currencies: next });
      if (!response.ok) throw new Error(((_a = response.data) == null ? void 0 : _a.detail) || "Unable to update collection currencies");
      setCurrencies(response.data.currencies);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Unable to update collection currencies");
    } finally {
      setSaving(false);
    }
  };
  const saveFee = async () => {
    var _a;
    const fee = Number(conversionFee);
    if (!Number.isFinite(fee) || fee < 0 || fee > 100) return onError("Conversion fee must be between 0 and 100%");
    setSaving(true);
    try {
      const response = await client.request("/api/v1/app-settings/conversion-fee", "PUT", { fee_percent: fee });
      if (!response.ok) throw new Error(((_a = response.data) == null ? void 0 : _a.detail) || "Unable to update conversion fee");
      setConversionFee(String(response.data.fee_percent));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Unable to update conversion fee");
    } finally {
      setSaving(false);
    }
  };
  const downloadBackup = async () => {
    setBackupBusy(true);
    try {
      const response = await client.fetch("/api/v1/admin/backups/download");
      if (!response.ok) throw new Error("Unable to create backup");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `swiftpay-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Unable to create backup");
    } finally {
      setBackupBusy(false);
    }
  };
  const restoreBackup = async (event) => {
    var _a;
    const file = (_a = event.target.files) == null ? void 0 : _a[0];
    event.target.value = "";
    if (!file || !window.confirm("This will replace the current data with the backup. Continue?")) return;
    setBackupBusy(true);
    try {
      const formData = new FormData();
      formData.append("backup", file);
      const response = await client.fetch("/api/v1/admin/backups/restore", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Unable to restore backup");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Unable to restore backup");
    } finally {
      setBackupBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-slate-200 bg-white", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base text-slate-900", children: "Collection currencies" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-4 text-sm text-slate-500", children: "Control which currencies merchants can select for collection." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: ["PHP", "CNY", "KRW", "USDT"].map((currency) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", disabled: saving, onClick: () => updateCurrencies(currency), "aria-pressed": currencies.includes(currency), className: `rounded-lg border px-4 py-2 text-sm font-semibold ${currencies.includes(currency) ? "border-orange-200 bg-orange-50 text-orange-700" : "border-slate-200 bg-slate-50 text-slate-400"}`, children: [
          currency,
          " ",
          currencies.includes(currency) ? "Enabled" : "Disabled"
        ] }, currency)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-slate-200 bg-white", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base text-slate-900", children: "Conversion fee" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-col gap-3 sm:flex-row sm:items-end", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex-1 text-sm font-semibold text-slate-700", children: [
          "Wallet conversion fee (%)",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: "0", max: "100", step: "0.01", value: conversionFee, onChange: (event) => setConversionFee(event.target.value), className: "mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 font-normal text-slate-900" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", onClick: saveFee, disabled: saving, className: "bg-[#FF6B00] text-white hover:bg-[#E66000]", children: "Save fee" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-amber-200 bg-amber-50/60", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base text-slate-900", children: "Data backup and restore" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-col gap-3 sm:flex-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", onClick: downloadBackup, disabled: backupBusy, className: "gap-2 bg-[#FF6B00] text-white hover:bg-[#E66000]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
          "Download backup"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: restoreInputRef, type: "file", accept: "application/json,.json", onChange: restoreBackup, className: "hidden" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", onClick: () => {
          var _a;
          return (_a = restoreInputRef.current) == null ? void 0 : _a.click();
        }, disabled: backupBusy, className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4" }),
          "Restore backup"
        ] })
      ] })
    ] })
  ] });
}
function AdminOperationsTab() {
  const navigate = useNavigate();
  const operations = [
    ["Payment approvals", "/payment-approvals"],
    ["Bank deposits", "/bank-deposits"],
    ["Top-up requests", "/topup-requests"],
    ["Withdrawals", "/withdrawals"],
    ["USDT send requests", "/withdrawals/usdt-send-requests"],
    ["TOSS Bank applications", "?tab=toss-approvals"],
    ["KYB registrations", "/kyb-registrations"],
    ["KYC verifications", "/kyc-verifications"],
    ["Broadcasts", "/broadcasts"],
    ["Bot messages", "/bot-messages"]
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: operations.map(([label, path]) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => path.startsWith("?") ? navigate(`/admin-management${path}`) : navigate(path), className: "rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-orange-200 hover:bg-orange-50/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-900", children: label }) }, path)) });
}
function CheckoutDesignTab({ onError }) {
  const [design, setDesign] = reactExports.useState({ display_name: "", primary_color: "#071B3A", accent_color: "#1475D1", page_background: "#F9FAFB", heading_color: "#0F172A", body_text_color: "#475569", card_radius: 24, payment_layout: "grid", payment_alignment: "left", show_powered_by: true });
  const [saving, setSaving] = reactExports.useState(false);
  reactExports.useEffect(() => {
    authenticatedFetch("/api/v1/app-settings/checkout-design").then(async (response) => {
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setDesign((current) => ({ ...current, ...data.design || {} }));
    }).catch((error) => onError(error instanceof Error ? error.message : "Failed to load checkout design"));
  }, [onError]);
  const save = async () => {
    setSaving(true);
    try {
      const response = await authenticatedFetch("/api/v1/app-settings/checkout-design", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ design }) });
      if (!response.ok) throw new Error(await response.text());
      setDesign((await response.json()).design);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to save checkout design");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-slate-900", children: "Checkout Design" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Customize the public checkout appearance." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: save, disabled: saving, className: "bg-[#FF6B00] text-white hover:bg-[#E66000]", children: saving ? "Saving..." : "Save changes" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 sm:p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "md:col-span-2 text-sm font-semibold text-slate-700", children: [
        "Checkout display name",
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: design.display_name, maxLength: 80, onChange: (event) => setDesign((current) => ({ ...current, display_name: event.target.value })), placeholder: "Leave blank to use the merchant name", className: "mt-1.5 h-10 w-full rounded-lg border px-3 font-normal text-slate-900" })
      ] }),
      ["primary_color", "accent_color", "page_background"].map((key) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-semibold capitalize text-slate-700", children: [
        key.replace("_", " "),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "color", value: design[key], onChange: (event) => setDesign((current) => ({ ...current, [key]: event.target.value })), className: "h-9 w-12" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: design[key], onChange: (event) => setDesign((current) => ({ ...current, [key]: event.target.value })), className: "h-9 w-24 rounded-lg border px-2 font-mono text-xs uppercase" })
        ] })
      ] }, key)),
      ["heading_color", "body_text_color"].map((key) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-semibold capitalize text-slate-700", children: [
        key.replace("_", " "),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "color", value: design[key], onChange: (event) => setDesign((current) => ({ ...current, [key]: event.target.value })), className: "h-9 w-12" })
      ] }, key)),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700", children: [
        "Card radius",
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: "8", max: "48", value: design.card_radius, onChange: (event) => setDesign((current) => ({ ...current, card_radius: Number(event.target.value) || 8 })), className: "h-9 w-20 rounded-lg border px-2" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700", children: [
        "Payment channel layout",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: design.payment_layout, onChange: (event) => setDesign((current) => ({ ...current, payment_layout: event.target.value })), className: "h-9 rounded-lg border px-2 font-normal", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "grid", children: "Grid cards" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "list", children: "List rows" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700", children: [
        "Channel alignment",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: design.payment_alignment, onChange: (event) => setDesign((current) => ({ ...current, payment_alignment: event.target.value })), className: "h-9 rounded-lg border px-2 font-normal", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "left", children: "Left" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "center", children: "Center" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 md:col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: design.show_powered_by, onChange: (event) => setDesign((current) => ({ ...current, show_powered_by: event.target.checked })) }),
        " Show “Powered by SwiftPay”"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border p-5 md:col-span-2", style: { backgroundColor: design.page_background, borderColor: design.accent_color, borderRadius: design.card_radius }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl p-4 text-white", style: { backgroundColor: design.primary_color }, children: [
        "Checkout preview",
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ml-3 rounded-lg px-3 py-1 text-sm", style: { backgroundColor: design.accent_color }, children: "Pay Now" })
      ] }) })
    ] })
  ] });
}
function WalletSettingsTab({ onError }) {
  const currencies = ["PHP", "CNY", "KRW", "USDT"];
  const depositCurrencies = ["PHP", "CNY", "KRW", "USD", "USDT"];
  const receivingCurrencies = ["PHP", "KRW", "CNY", "HKD", "USD", "USDT"];
  const [currency, setCurrency] = reactExports.useState("PHP");
  const [loading, setLoading] = reactExports.useState(true);
  const [loaded, setLoaded] = reactExports.useState(false);
  const [limits, setLimits] = reactExports.useState({});
  const [depositRules, setDepositRules] = reactExports.useState({
    bank_deposit_currencies: ["PHP", "KRW"],
    topup_currencies: ["PHP", "USDT", "KRW"],
    receipt_max_size_mb: 10,
    first_usdt_topup_amount: 600,
    first_usdt_topup_rule_enabled: true
  });
  const [depositAccounts, setDepositAccounts] = reactExports.useState([]);
  const [accountDialogOpen, setAccountDialogOpen] = reactExports.useState(false);
  const [editingAccountIndex, setEditingAccountIndex] = reactExports.useState(null);
  const [accountDraft, setAccountDraft] = reactExports.useState(() => createDepositAccount(1));
  const [saving, setSaving] = reactExports.useState(false);
  const load = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const responses = await Promise.all([
        authenticatedFetch("/api/v1/app-settings/wallet-limits"),
        authenticatedFetch("/api/v1/app-settings/deposit-rules"),
        authenticatedFetch("/api/v1/app-settings/deposit-accounts")
      ]);
      const failedResponse = responses.find((response) => !response.ok);
      if (failedResponse) throw new Error(await failedResponse.text());
      const [limitsData, rulesData, accountsData] = await Promise.all(responses.map((response) => response.json()));
      setLimits(limitsData.limits || {});
      setDepositRules((current2) => ({ ...current2, ...rulesData.rules || {} }));
      setDepositAccounts(accountsData.accounts || []);
      setLoaded(true);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to load wallet settings");
    } finally {
      setLoading(false);
    }
  }, [onError]);
  reactExports.useEffect(() => {
    load();
  }, [load]);
  const current = limits[currency] || {
    max_incoming: 0,
    minimum_balance: 0,
    minimum_deposit: 0,
    max_withdrawal_daily: 0,
    max_withdrawal_monthly: 0
  };
  const update = (key, value) => {
    const parsed = value === "" ? 0 : Number(value);
    setLimits((previous) => ({
      ...previous,
      [currency]: { ...current, [key]: Number.isFinite(parsed) ? parsed : 0 }
    }));
  };
  const save = async () => {
    setSaving(true);
    try {
      const response = await authenticatedFetch("/api/v1/app-settings/wallet-limits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limits })
      });
      if (!response.ok) throw new Error(await response.text());
      setLimits((await response.json()).limits || limits);
      const rulesResponse = await authenticatedFetch("/api/v1/app-settings/deposit-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: depositRules })
      });
      if (!rulesResponse.ok) throw new Error(await rulesResponse.text());
      setDepositRules((await rulesResponse.json()).rules || depositRules);
      const accountsResponse = await authenticatedFetch("/api/v1/app-settings/deposit-accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: depositAccounts })
      });
      if (!accountsResponse.ok) throw new Error(await accountsResponse.text());
      setDepositAccounts((await accountsResponse.json()).accounts || depositAccounts);
      ue.success("Wallet settings saved");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to save wallet settings");
    } finally {
      setSaving(false);
    }
  };
  const updateAccount = (index, updates) => {
    setDepositAccounts((accounts) => accounts.map((account, itemIndex) => itemIndex === index ? { ...account, ...updates } : account));
  };
  const openNewAccount = () => {
    setEditingAccountIndex(null);
    setAccountDraft(createDepositAccount(depositAccounts.length + 1));
    setAccountDialogOpen(true);
  };
  const openNewTossDepositAccount = () => {
    setEditingAccountIndex(null);
    setAccountDraft({
      ...createDepositAccount(depositAccounts.length + 1),
      value: "Toss Bank",
      label: "Toss Bank",
      currency: "KRW"
    });
    setAccountDialogOpen(true);
  };
  const openEditAccount = (index) => {
    setEditingAccountIndex(index);
    setAccountDraft({ ...depositAccounts[index] });
    setAccountDialogOpen(true);
  };
  const saveAccountDraft = () => {
    if (editingAccountIndex === null) {
      setDepositAccounts((accounts) => [...accounts, accountDraft]);
    } else {
      updateAccount(editingAccountIndex, accountDraft);
    }
    setAccountDialogOpen(false);
  };
  const tossDepositAccounts = depositAccounts.map((account, index) => ({ account, index })).filter(({ account }) => isTossDepositAccount(account));
  const otherDepositAccounts = depositAccounts.map((account, index) => ({ account, index })).filter(({ account }) => !isTossDepositAccount(account));
  const fields = [
    { key: "max_incoming", label: "Maximum incoming amount", help: "Maximum amount accepted in one incoming transaction." },
    { key: "minimum_balance", label: "Minimum maintaining balance", help: "Wallet balance must remain at or above this amount after withdrawal." },
    { key: "minimum_deposit", label: "Minimum deposit", help: "Smallest amount accepted for a deposit or top-up." },
    { key: "max_withdrawal_daily", label: "Maximum withdrawal per day", help: "Total withdrawal amount allowed from 00:00 UTC each day." },
    { key: "max_withdrawal_monthly", label: "Maximum withdrawal per month", help: "Total withdrawal amount allowed from the first day of each month." }
  ];
  const visibleFields = fields.filter((field) => !(currency === "PHP" && field.key === "minimum_balance"));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-start gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400 ring-1 ring-orange-400/25", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-6 w-6" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-[0.18em] text-orange-300", children: "Platform controls" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-1 text-xl font-bold tracking-tight sm:text-2xl", children: "Wallet settings" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-2xl text-sm leading-6 text-slate-300", children: "Configure transaction limits, accepted deposit currencies, and the receiving accounts shown to customers." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 lg:justify-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200", children: [
            currencies.length,
            " wallet currencies"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200", children: [
            depositAccounts.length,
            " receiving accounts"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: save, disabled: loading || !loaded || saving, className: "w-full gap-2 bg-[#FF6B00] text-white hover:bg-[#E66000] sm:w-auto", children: [
            saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }),
            saving ? "Saving…" : "Save all settings"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { "aria-label": "Wallet settings sections", className: "flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-3 sm:px-7", children: [
        { href: "#wallet-limits", label: "Wallet limits", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings2, { className: "h-3.5 w-3.5" }) },
        { href: "#deposit-accounts", label: "Receiving accounts", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Landmark, { className: "h-3.5 w-3.5" }) },
        { href: "#deposit-rules", label: "Deposit rules", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-3.5 w-3.5" }) }
      ].map((section) => /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: section.href, className: "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white", children: [
        section.icon,
        section.label
      ] }, section.href)) })
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mx-auto h-6 w-6 animate-spin text-[#FF6B00]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm font-medium text-slate-600", children: "Loading wallet configuration…" })
    ] }) : !loaded ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-red-200 bg-red-50 p-6 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-red-800", children: "Wallet configuration could not be loaded." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-red-700", children: "Settings are unavailable, so saving is disabled to protect existing values." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", onClick: load, className: "mt-4 gap-2 border-red-300 text-red-800 hover:bg-red-100", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4" }),
        "Retry loading"
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { id: "wallet-limits", className: "scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings2, { className: "h-5 w-5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-bold text-slate-900", children: "Wallet limits" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Configure balance and transaction limits independently for each wallet currency." })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600", children: [
            currency,
            " configuration"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 flex flex-wrap gap-2", role: "group", "aria-label": "Wallet settings currency", children: currencies.map((value) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-pressed": currency === value, onClick: () => setCurrency(value), className: `motion-interactive min-w-20 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${currency === value ? "border-orange-200 bg-orange-50 text-[#C2410C] shadow-sm" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"}`, children: value }, value)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3", children: visibleFields.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex min-w-0 flex-col rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-colors focus-within:border-orange-300 focus-within:bg-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-slate-800", children: field.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-1 min-h-10 text-xs leading-5 text-slate-500", children: field.help }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mt-3 flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-[#FF6B00] focus-within:ring-4 focus-within:ring-[#FF6B00]/5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                min: "0",
                step: "0.01",
                value: current[field.key] || "",
                onChange: (event) => update(field.key, event.target.value),
                className: "h-10 min-w-0 flex-1 rounded-lg bg-transparent px-3 text-sm font-bold text-slate-900 outline-none"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pr-3 text-xs font-bold text-slate-400", children: currency })
          ] })
        ] }, field.key)) }),
        currency === "PHP" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800", children: "PHP wallets have no minimum maintaining balance; withdrawals can use the full available balance." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { id: "deposit-accounts", className: "scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-start gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Landmark, { className: "h-5 w-5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700", children: "Wallet deposit destinations" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-1 text-lg font-bold tracking-tight text-slate-900", children: "Bank deposit settings" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 max-w-2xl text-sm leading-5 text-slate-500", children: "Manage the accounts customers see when they deposit funds into their wallet." })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-blue-500" }),
            tossDepositAccounts.length + otherDepositAccounts.length,
            " accounts configured"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 grid gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-blue-100 bg-blue-50/70 p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-blue-800", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-wide", children: "Wallet deposits" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm font-semibold text-slate-900", children: "This page controls deposit accounts" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-5 text-slate-600", children: "Toss deposits show one randomly selected account for each deposit session. Other accounts follow their currency and minimum-amount rules." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-slate-600", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-wide", children: "Payment checkout" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm font-semibold text-slate-900", children: "Managed separately" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-5 text-slate-600", children: "KRW payment-link checkout uses the active TOSS pool under Admin Management → TOSS Bank approvals, not the deposit accounts below." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 overflow-hidden rounded-2xl border border-orange-200 bg-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 via-white to-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-start gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#C2410C]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Landmark, { className: "h-5 w-5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-bold text-slate-900", children: "Toss Bank · KRW deposit pool" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "border border-orange-200 bg-white text-[10px] text-[#C2410C]", children: "Wallet deposits only" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 max-w-2xl text-xs leading-5 text-slate-600", children: "One account is randomly selected per deposit session. The full pool is never shown to the customer, and the previous account is avoided when possible." })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                className: "w-full shrink-0 gap-2 border-orange-200 bg-white text-[#C2410C] hover:bg-orange-50 sm:w-auto",
                onClick: openNewTossDepositAccount,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
                  "Add Toss account"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 p-3 sm:p-4", children: tossDepositAccounts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-dashed border-orange-200 bg-orange-50/40 px-4 py-8 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Landmark, { className: "mx-auto h-7 w-7 text-orange-300" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm font-semibold text-slate-700", children: "No Toss deposit accounts yet" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Add a KRW account to enable Toss wallet deposits." })
          ] }) : tossDepositAccounts.map(({ account, index }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-orange-200 hover:bg-orange-50/30 sm:flex-row sm:items-center sm:justify-between sm:px-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Landmark, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-semibold text-slate-900", children: account.account_number || "Account number not set" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 truncate text-xs text-slate-500", children: [
                  account.account_name || "Account holder not set",
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-1 text-slate-300", children: "·" }),
                  " KRW"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center justify-between gap-2 border-t border-slate-100 pt-2 sm:justify-end sm:border-0 sm:pt-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700", children: "In deposit rotation" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => openEditAccount(index),
                    className: "motion-interactive inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900",
                    "aria-label": `Edit ${account.account_number || "Toss deposit account"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3.5 w-3.5" }),
                      "Edit"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => setDepositAccounts((items) => items.filter((_, itemIndex) => itemIndex !== index)),
                    className: "motion-interactive inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50",
                    "aria-label": `Remove ${account.account_number || "Toss deposit account"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }),
                      "Remove"
                    ]
                  }
                )
              ] })
            ] })
          ] }, `${account.value}-${index}`)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 overflow-hidden rounded-2xl border border-slate-200", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-bold text-slate-900", children: "Other receiving accounts" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Shown in Wallet → Deposit, subject to currency and minimum amount." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                className: "w-full shrink-0 gap-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-100 sm:w-auto",
                onClick: openNewAccount,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
                  "Add other account"
                ]
              }
            )
          ] }),
          otherDepositAccounts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white px-4 py-8 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "mx-auto h-7 w-7 text-slate-300" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm font-semibold text-slate-700", children: "No other accounts configured" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Use this section for non-Toss wallet deposit destinations." })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "bg-slate-50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-slate-50", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "whitespace-nowrap text-xs font-bold uppercase tracking-wide text-slate-500", children: "Account" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "whitespace-nowrap text-xs font-bold uppercase tracking-wide text-slate-500", children: "Bank details" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "whitespace-nowrap text-xs font-bold uppercase tracking-wide text-slate-500", children: "Currencies" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "whitespace-nowrap text-xs font-bold uppercase tracking-wide text-slate-500", children: "Minimum" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "min-w-48 text-xs font-bold uppercase tracking-wide text-slate-500", children: "Shown to customers in" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-24 text-right text-xs font-bold uppercase tracking-wide text-slate-500", children: "Actions" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: otherDepositAccounts.map(({ account, index }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "align-top", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "min-w-40", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-slate-900", children: account.label || "Untitled account" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: account.value || "No provider set" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "min-w-48", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-slate-800", children: account.account_number || "No account number" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: account.account_name || "Account holder not set" }),
                (account.bank_code || account.branch_code || account.swift_code) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-400", children: [account.bank_code && `Bank ${account.bank_code}`, account.branch_code && `Branch ${account.branch_code}`, account.swift_code && `SWIFT ${account.swift_code}`].filter(Boolean).join(" · ") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "whitespace-nowrap", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: account.currency }),
                account.receiving_currency && account.receiving_currency !== account.currency && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-slate-500", children: [
                  "Receives as ",
                  account.receiving_currency
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "whitespace-nowrap text-sm text-slate-700", children: account.minimum_amount ? `${account.minimum_amount.toLocaleString()} ${account.currency}` : "None" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "min-w-48 text-xs leading-5 text-slate-600", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Wallet > Deposit" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400", children: "Telegram fallback, where applicable" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "whitespace-nowrap text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => openEditAccount(index),
                    className: "motion-interactive inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900",
                    "aria-label": `Edit ${account.label || "receiving account"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3.5 w-3.5" }),
                      "Edit"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => setDepositAccounts((items) => items.filter((_, itemIndex) => itemIndex !== index)),
                    className: "motion-interactive inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50",
                    "aria-label": `Remove ${account.label || "receiving account"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }),
                      "Remove"
                    ]
                  }
                )
              ] }) })
            ] }, `${account.value}-${index}`)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xs leading-5 text-slate-500", children: "Minimum amounts can be used to select a non-Toss destination for eligible high-value wallet deposits." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: accountDialogOpen, onOpenChange: setAccountDialogOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-h-[90vh] overflow-y-auto border-slate-200 bg-white sm:max-w-2xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-slate-900", children: editingAccountIndex === null ? "Add receiving account" : "Edit receiving account" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "These details appear in Wallet > Deposit and may be used as the Telegram deposit fallback." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5 text-xs font-semibold text-slate-600", children: [
            "Account label",
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: accountDraft.label, placeholder: "e.g. Netbank PHP", onChange: (event) => setAccountDraft((draft) => ({ ...draft, label: event.target.value })), className: "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5 text-xs font-semibold text-slate-600", children: [
            "Currency",
            /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: accountDraft.currency, onChange: (event) => setAccountDraft((draft) => ({ ...draft, currency: event.target.value })), className: "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900", children: depositCurrencies.map((value) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value, children: value }, value)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5 text-xs font-semibold text-slate-600", children: [
            "Bank or provider",
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: accountDraft.value, placeholder: "e.g. netbank", onChange: (event) => setAccountDraft((draft) => ({ ...draft, value: event.target.value })), className: "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5 text-xs font-semibold text-slate-600", children: [
            "Account number",
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: accountDraft.account_number, placeholder: "Enter account number", onChange: (event) => setAccountDraft((draft) => ({ ...draft, account_number: event.target.value })), className: "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5 text-xs font-semibold text-slate-600", children: [
            "Account holder name",
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: accountDraft.account_name, placeholder: "Registered account holder", onChange: (event) => setAccountDraft((draft) => ({ ...draft, account_name: event.target.value })), className: "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5 text-xs font-semibold text-slate-600", children: [
            "Receiving currency (optional)",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: accountDraft.receiving_currency || "", onChange: (event) => setAccountDraft((draft) => ({ ...draft, receiving_currency: event.target.value })), className: "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Same as collection" }),
              receivingCurrencies.map((value) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value, children: value }, value))
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5 text-xs font-semibold text-slate-600", children: [
            "Minimum collection amount (optional)",
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: "0", step: "0.01", value: accountDraft.minimum_amount ?? "", onChange: (event) => setAccountDraft((draft) => ({ ...draft, minimum_amount: event.target.value ? Number(event.target.value) : void 0 })), placeholder: `Amount in ${accountDraft.currency}`, className: "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5 text-xs font-semibold text-slate-600", children: [
            "Bank code (optional)",
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: accountDraft.bank_code || "", onChange: (event) => setAccountDraft((draft) => ({ ...draft, bank_code: event.target.value })), className: "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5 text-xs font-semibold text-slate-600", children: [
            "Branch code (optional)",
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: accountDraft.branch_code || "", onChange: (event) => setAccountDraft((draft) => ({ ...draft, branch_code: event.target.value })), className: "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5 text-xs font-semibold text-slate-600", children: [
            "SWIFT/BIC (optional)",
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: accountDraft.swift_code || "", placeholder: "e.g. ABCDKRSE", onChange: (event) => setAccountDraft((draft) => ({ ...draft, swift_code: event.target.value })), className: "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5 text-xs font-semibold text-slate-600 sm:col-span-2", children: [
            "Bank address (optional)",
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: accountDraft.bank_address || "", onChange: (event) => setAccountDraft((draft) => ({ ...draft, bank_address: event.target.value })), className: "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setAccountDialogOpen(false), children: "Cancel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", onClick: saveAccountDraft, className: "bg-[#FF6B00] text-white hover:bg-[#E66000]", children: editingAccountIndex === null ? "Add account" : "Save account" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { id: "deposit-rules", className: "scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-bold text-slate-900", children: "Deposit rules" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Control accepted currencies, receipt uploads, and first-time USDT funding." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 grid items-start gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5 text-sm font-semibold text-slate-700", children: [
            "Bank deposit currencies",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: depositRules.bank_deposit_currencies.join(", "),
                onChange: (event) => setDepositRules((current2) => ({ ...current2, bank_deposit_currencies: event.target.value.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean) })),
                className: "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 focus:border-[#FF6B00] focus:outline-none focus:ring-4 focus:ring-[#FF6B00]/5",
                placeholder: "PHP, KRW"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs font-normal text-slate-400", children: "Separate currency codes with commas." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5 text-sm font-semibold text-slate-700", children: [
            "Top-up currencies",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: depositRules.topup_currencies.join(", "),
                onChange: (event) => setDepositRules((current2) => ({ ...current2, topup_currencies: event.target.value.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean) })),
                className: "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 focus:border-[#FF6B00] focus:outline-none focus:ring-4 focus:ring-[#FF6B00]/5",
                placeholder: "PHP, USDT, KRW"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs font-normal text-slate-400", children: "Separate currency codes with commas." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5 text-sm font-semibold text-slate-700", children: [
            "Maximum receipt size (MB)",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex h-11 items-center rounded-xl border border-slate-200 bg-white focus-within:border-[#FF6B00] focus-within:ring-4 focus-within:ring-[#FF6B00]/5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: "0", step: "0.1", value: depositRules.receipt_max_size_mb, onChange: (event) => setDepositRules((current2) => ({ ...current2, receipt_max_size_mb: Number(event.target.value) || 0 })), className: "h-full min-w-0 flex-1 rounded-xl bg-transparent px-3 text-sm font-normal text-slate-900 outline-none" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pr-3 text-xs font-semibold text-slate-400", children: "MB" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5 text-sm font-semibold text-slate-700", children: [
            "First USDT top-up amount",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex h-11 items-center rounded-xl border border-slate-200 bg-white focus-within:border-[#FF6B00] focus-within:ring-4 focus-within:ring-[#FF6B00]/5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: "0", step: "0.01", value: depositRules.first_usdt_topup_amount, onChange: (event) => setDepositRules((current2) => ({ ...current2, first_usdt_topup_amount: Number(event.target.value) || 0 })), className: "h-full min-w-0 flex-1 rounded-xl bg-transparent px-3 text-sm font-normal text-slate-900 outline-none" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pr-3 text-xs font-semibold text-slate-400", children: "USDT" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 md:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", className: "h-4 w-4 accent-[#FF6B00]", checked: depositRules.first_usdt_topup_rule_enabled, onChange: (event) => setDepositRules((current2) => ({ ...current2, first_usdt_topup_rule_enabled: event.target.checked })) }),
            "Enforce the first USDT top-up amount rule"
          ] })
        ] })
      ] })
    ] })
  ] });
}
const PERMISSION_KEYS = PERMISSION_DEFINITIONS;
const defaultForm = {
  telegram_id: "",
  telegram_username: "",
  email: "",
  password: "",
  name: "",
  role: "admin"
};
const ADMIN_ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "operator", label: "Operator" },
  { value: "viewer", label: "Viewer" },
  { value: "developer", label: "Developer" }
];
function PermissionBadge({
  active,
  label,
  color,
  onClick,
  interactive
}) {
  const activeStyles = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    teal: "bg-teal-50 text-teal-700 border-teal-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "span",
    {
      role: interactive ? "button" : void 0,
      tabIndex: interactive ? 0 : void 0,
      onClick,
      "aria-pressed": interactive ? active : void 0,
      className: `motion-interactive inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold shadow-sm
        ${active ? activeStyles[color] || "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 border-slate-100 text-slate-400"}
        ${interactive ? "cursor-pointer hover:scale-105 active:scale-95" : "cursor-default"}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `w-1.5 h-1.5 rounded-full ${active ? "bg-current" : "bg-slate-300"}` }),
        label
      ]
    }
  );
}
function AdminSummaryCard({
  label,
  value,
  description,
  icon,
  tone
}) {
  const tones = {
    orange: "bg-orange-50 text-orange-600 ring-orange-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    slate: "bg-slate-100 text-slate-600 ring-slate-200"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-slate-200 bg-white shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex items-start justify-between gap-3 p-4 sm:p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xl font-bold tracking-tight text-slate-900", children: value }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 truncate text-xs font-medium text-slate-500", children: description })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-4 ${tones[tone]}`, children: icon })
  ] }) });
}
function formatDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function AdminCard({
  admin,
  isSuperAdmin,
  currentUserId,
  onToggleActive,
  onChangeRole,
  onDelete,
  onEditBank,
  onEditApiKeys,
  onEditPassword,
  onEditFees
}) {
  var _a;
  const permissionCount = PERMISSION_KEYS.filter(({ key }) => Boolean(admin[key])).length;
  const displayName = admin.name || admin.telegram_username || `Merchant ID: ${admin.telegram_id}`;
  const roleLabel = ((_a = ADMIN_ROLE_OPTIONS.find((option) => option.value === admin.role)) == null ? void 0 : _a.label) || admin.role || "Admin";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: `border-slate-200 transition-all duration-300 hover:shadow-sm ${admin.is_active ? "bg-white opacity-100" : "bg-slate-50/50 opacity-75"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 sm:p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${admin.is_super_admin ? "border-amber-200 bg-amber-100 text-amber-600" : "border-blue-200 bg-blue-100 text-blue-600"}`, children: admin.is_super_admin ? /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-5 w-5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm font-semibold text-slate-900", children: displayName }),
            admin.telegram_username && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] font-semibold text-blue-500", children: [
              "@",
              admin.telegram_username
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex flex-wrap items-center gap-1.5", children: [
            admin.is_super_admin && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "h-5 border border-amber-200 bg-amber-100 px-1.5 text-[9px] font-semibold uppercase tracking-widest text-amber-700", children: "Super" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "h-5 border border-slate-200 bg-slate-50 px-1.5 text-[9px] font-semibold uppercase tracking-widest text-slate-600", children: roleLabel }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: `h-5 border px-1.5 text-[9px] font-semibold uppercase tracking-widest ${admin.is_active ? "border-emerald-200 bg-emerald-100 text-emerald-700" : "border-slate-200 bg-slate-200 text-slate-600"}`, children: admin.is_active ? "Active" : "Disabled" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[11px] font-medium text-slate-500", children: [
            "TGID: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: admin.telegram_id })
          ] })
        ] })
      ] }),
      isSuperAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-1 sm:justify-end", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "sr-only", htmlFor: `admin-role-${admin.id}`, children: [
          "Role for ",
          displayName
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "select",
          {
            id: `admin-role-${admin.id}`,
            value: admin.role || "admin",
            disabled: String(admin.telegram_id) === String(currentUserId),
            onChange: (event) => onChangeRole(admin, event.target.value),
            className: "h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50",
            children: ADMIN_ROLE_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: option.label }, option.value))
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => onEditPassword(admin),
            "aria-label": `Change dashboard password for ${displayName}`,
            title: "Change Dashboard Password",
            className: "rounded-lg p-1.5 text-slate-400 transition hover:bg-purple-50 hover:text-purple-600",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { "aria-hidden": "true", className: "h-4 w-4" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => onEditBank(admin),
            "aria-label": `Edit bank information for ${displayName}`,
            title: "Edit Bank Information",
            className: "rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { "aria-hidden": "true", className: "h-4 w-4" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => onEditApiKeys(admin),
            "aria-label": `Edit API keys for ${displayName}`,
            title: "Edit API Keys",
            className: "rounded-lg p-1.5 text-slate-400 transition hover:bg-teal-50 hover:text-teal-600",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { "aria-hidden": "true", className: "h-4 w-4" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => onEditFees(admin),
            "aria-label": `Edit fee settings for ${displayName}`,
            title: "Edit Fee Settings",
            className: "inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2 py-1.5 text-[10px] font-semibold text-orange-700 transition hover:bg-orange-100",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { "aria-hidden": "true", className: "h-3.5 w-3.5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Fees" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => onToggleActive(admin),
            title: admin.is_active ? "Deactivate" : "Activate",
            "aria-label": `${admin.is_active ? "Deactivate" : "Activate"} ${displayName}`,
            className: `rounded-lg p-1.5 transition ${admin.is_active ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"}`,
            children: admin.is_active ? /* @__PURE__ */ jsxRuntimeExports.jsx(PowerOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Power, { className: "h-4 w-4" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => onDelete(admin),
            title: "Remove administrator",
            "aria-label": `Remove administrator ${displayName}`,
            className: "rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { "aria-hidden": "true", className: "h-4 w-4" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-2 sm:grid-cols-2 xl:grid-cols-3", children: ["People & access", "Payments & configuration", "Approvals & wallets", "Governance"].map((group) => {
      const permissions = PERMISSION_KEYS.filter(({ key }) => {
        var _a2;
        return ((_a2 = PERMISSION_DEFINITIONS.find((definition) => definition.key === key)) == null ? void 0 : _a2.group) === group;
      });
      if (!permissions.length) return null;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-slate-100 bg-slate-50/70 p-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400", children: group }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1", children: permissions.map(({ key, label, color }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          PermissionBadge,
          {
            active: admin[key],
            label,
            color,
            interactive: false
          },
          key
        )) })
      ] }, group);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-[11px] text-slate-500", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-3.5 w-3.5 text-slate-400" }),
        permissionCount,
        " enabled"
      ] }),
      admin.settlement_currency && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-3.5 w-3.5 text-slate-400" }),
        "Settlement: ",
        admin.settlement_currency
      ] })
    ] })
  ] }) });
}
function FeeSettingsModal({
  admin,
  onClose,
  onSaved,
  onError
}) {
  const [baseFee, setBaseFee] = reactExports.useState(String(admin.service_fee_percent ?? 0));
  const [collectionFee, setCollectionFee] = reactExports.useState(String(admin.collection_fee_percent ?? 0));
  const [withdrawalFeePercent, setWithdrawalFeePercent] = reactExports.useState(String(admin.withdrawal_fee_percent ?? 0));
  const [withdrawalFees, setWithdrawalFees] = reactExports.useState({
    PHP: String(admin.withdrawal_fee_php ?? 15),
    KRW: String(admin.withdrawal_fee_krw ?? 1500),
    USDT: String(admin.withdrawal_fee_usdt ?? 1),
    CNY: String(admin.withdrawal_fee_cny ?? 10),
    USD: String(admin.withdrawal_fee_usd ?? 1)
  });
  const [saving, setSaving] = reactExports.useState(false);
  const updateWithdrawalFee = (currency, value) => {
    setWithdrawalFees((current) => ({ ...current, [currency]: value }));
  };
  const save = async () => {
    const collectionValue = Number(collectionFee);
    const withdrawalPercentValue = Number(withdrawalFeePercent);
    const baseValue = Number(baseFee);
    const parsedWithdrawals = Object.fromEntries(
      Object.entries(withdrawalFees).map(([currency, value]) => [currency, Number(value)])
    );
    const values = [baseValue, collectionValue, withdrawalPercentValue, ...Object.values(parsedWithdrawals)];
    if (values.some((value) => !Number.isFinite(value) || value < 0) || [baseValue, collectionValue, withdrawalPercentValue].some((value) => value > 100)) {
      onError("Percentage fees must be between 0 and 100. Withdrawal fees must be non-negative.");
      return;
    }
    setSaving(true);
    try {
      const response = await authenticatedFetch(`/api/v1/admin-users/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_fee_percent: baseValue,
          collection_fee_percent: collectionValue,
          withdrawal_fee_percent: withdrawalPercentValue,
          withdrawal_fee_php: parsedWithdrawals.PHP,
          withdrawal_fee_krw: parsedWithdrawals.KRW,
          withdrawal_fee_usdt: parsedWithdrawals.USDT,
          withdrawal_fee_cny: parsedWithdrawals.CNY,
          withdrawal_fee_usd: parsedWithdrawals.USD
        })
      });
      if (!response.ok) throw new Error(await response.text());
      onSaved(await response.json());
      onClose();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to save fee settings");
    } finally {
      setSaving(false);
    }
  };
  const withdrawalFields = [
    ["PHP", "PHP fee"],
    ["KRW", "KRW fee"],
    ["USDT", "USDT fee"],
    ["CNY", "CNY fee"],
    ["USD", "USD fee"]
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4", role: "dialog", "aria-modal": "true", "aria-labelledby": "fee-settings-title", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "w-full max-w-2xl border-slate-200 bg-white shadow-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between border-b border-slate-100", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { id: "fee-settings-title", className: "text-slate-900", children: "Fee Settings" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: admin.name || admin.telegram_username || admin.telegram_id })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "icon", onClick: onClose, "aria-label": "Close fee settings", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-6 p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-slate-500", children: "Upline service surcharge (%)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: "0", max: "100", step: "0.01", value: baseFee, onChange: (event) => setBaseFee(event.target.value), className: "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-slate-400", children: "Applied to eligible payments from this user’s downline. Set 0% to disable the surcharge." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-slate-500", children: "Collection fee (%)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: "0", max: "100", step: "0.01", value: collectionFee, onChange: (event) => setCollectionFee(event.target.value), className: "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-slate-500", children: "Withdrawal fee (%)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: "0", max: "100", step: "0.01", value: withdrawalFeePercent, onChange: (event) => setWithdrawalFeePercent(event.target.value), className: "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500", children: "Fixed withdrawal fees" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-xs text-slate-400", children: "These are fixed amounts in the withdrawal currency, not percentages." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-3", children: withdrawalFields.map(([currency, label]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-slate-600", children: label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "number",
              min: "0",
              step: "0.01",
              value: withdrawalFees[currency],
              onChange: (event) => updateWithdrawalFee(currency, event.target.value),
              className: "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            }
          )
        ] }, currency)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: onClose, children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", disabled: saving, onClick: save, children: saving ? "Saving…" : "Save fee settings" })
      ] })
    ] })
  ] }) });
}
function UserManagementTab({
  isSuperAdmin,
  canManageTeam,
  onError
}) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [search, setSearch] = reactExports.useState("");
  const [userFilter, setUserFilter] = reactExports.useState("all");
  const [selectedUser, setSelectedUser] = reactExports.useState(null);
  const [details, setDetails] = reactExports.useState(null);
  const [detailsLoading, setDetailsLoading] = reactExports.useState(false);
  const fetchUsers = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch("/api/v1/team/members?include_inactive=true");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setUsers((data.members || []).map((member) => ({
        admin_id: Number(member.id),
        id: String(member.telegram_id || member.id),
        email: member.email || "—",
        name: member.name,
        role: member.role || "user",
        created_at: member.joined_at || null,
        last_login: null,
        telegram_id: member.telegram_id,
        organization_name: member.organization_name,
        service_fee_percent: member.service_fee_percent || 0,
        added_by: member.added_by,
        is_active: member.is_active,
        vip_gold: Boolean(member.vip_gold)
      })));
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [onError]);
  reactExports.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  const handleVipGoldChange = async (member) => {
    if (!canManageTeam || !member.telegram_id) return;
    try {
      const res = await authenticatedFetch(`/api/v1/team/members/${encodeURIComponent(member.telegram_id)}/vip-gold`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vip_gold: !member.vip_gold })
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchUsers();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to update VIP Gold status");
    }
  };
  const handleUserStatusChange = async (member) => {
    if (!canManageTeam || !member.admin_id) return;
    try {
      const res = await authenticatedFetch(`/api/v1/admin-users/${member.admin_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !member.is_active })
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchUsers();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to update user status");
    }
  };
  const handleUserRoleChange = async (member, role) => {
    if (!canManageTeam || !member.admin_id || !role || String(member.telegram_id) === String(currentUser == null ? void 0 : currentUser.id)) return;
    try {
      const res = await authenticatedFetch(`/api/v1/admin-users/${member.admin_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchUsers();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to update user role");
    }
  };
  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [user.name, user.email, user.id, user.telegram_id, user.organization_name, user.role].some((value) => String(value || "").toLowerCase().includes(query));
    const matchesFilter = userFilter === "all" || userFilter === "active" && user.is_active || userFilter === "inactive" && !user.is_active || userFilter === "admins" && ["admin", "co_admin", "super_admin"].includes(user.role) || userFilter === "vip" && user.vip_gold;
    return matchesSearch && matchesFilter;
  });
  const activeUserCount = users.filter((user) => user.is_active).length;
  const inactiveUserCount = users.length - activeUserCount;
  const adminUserCount = users.filter((user) => ["admin", "co_admin", "super_admin"].includes(user.role)).length;
  const vipUserCount = users.filter((user) => user.vip_gold).length;
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "motion-skeleton h-14 rounded-xl bg-card border border-border" }, i)) });
  }
  if (users.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-card border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-col items-center justify-center py-14 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-14 w-14 rounded-2xl bg-muted/40 flex items-center justify-center mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-7 w-7 text-muted-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-semibold text-sm", children: "No users yet" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mt-1", children: "Users will appear here once they log in." })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "search",
            value: search,
            onChange: (event) => setSearch(event.target.value),
            placeholder: "Search by name, email, Telegram ID, store, or role",
            "aria-label": "Search users",
            className: "h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#FF6B00] focus:bg-white focus:ring-4 focus:ring-[#FF6B00]/5 lg:max-w-md"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          [
            ["all", `All ${users.length}`],
            ["active", `Active ${activeUserCount}`],
            ["inactive", `Inactive ${inactiveUserCount}`],
            ["admins", `Admins ${adminUserCount}`],
            ["vip", `VIP ${vipUserCount}`]
          ].map(([value, label]) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setUserFilter(value),
              className: `rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${userFilter === value ? "border-[#FF6B00] bg-orange-50 text-[#D95700]" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`,
              children: label
            },
            value
          )),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => void fetchUsers(), disabled: loading, className: "gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-3.5 w-3.5 ${loading ? "animate-spin" : ""}` }),
            "Refresh"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center justify-between text-xs text-slate-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          filteredUsers.length,
          " matching users"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          activeUserCount,
          " active of ",
          users.length,
          " total"
        ] })
      ] })
    ] }),
    selectedUser && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-slate-200 bg-white shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-start justify-between gap-4 space-y-0 border-b border-slate-100 pb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base text-slate-900", children: selectedUser.name || selectedUser.email }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-slate-500", children: [
            selectedUser.email,
            " · ",
            selectedUser.role
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => {
          setSelectedUser(null);
          setDetails(null);
        }, children: "Close" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-5 p-4", children: detailsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "motion-skeleton h-24 rounded-xl bg-slate-100" }) : details ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4", children: details.wallets.map((wallet) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-semibold uppercase tracking-widest text-slate-500", children: [
            wallet.currency,
            " balance"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-lg font-semibold text-slate-900", children: wallet.balance.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[11px] text-slate-500", children: [
            "Available ",
            wallet.available_balance.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ] })
        ] }, wallet.id)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-x-auto rounded-xl border border-slate-200", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-2 sm:px-3 py-3 whitespace-nowrap", children: "Date" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-2 sm:px-3 py-3 whitespace-nowrap", children: "Type" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-2 sm:px-3 py-3 whitespace-nowrap text-right", children: "Amount" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-2 sm:px-3 py-3 whitespace-nowrap", children: "Status" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "hidden sm:table-cell px-2 sm:px-3 py-3 whitespace-nowrap", children: "Reference" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-100", children: details.activity.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "whitespace-nowrap px-2 sm:px-3 py-3 text-slate-500 text-xs", children: formatDate(item.created_at) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-2 sm:px-3 py-3 font-medium text-slate-700 whitespace-nowrap text-xs", children: item.type }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-2 sm:px-3 py-3 font-semibold text-slate-900 text-right text-xs", children: [
                item.amount.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                " ",
                item.currency || ""
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-2 sm:px-3 py-3 text-slate-600 text-xs", children: item.status || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "hidden sm:table-cell max-w-[150px] truncate px-2 sm:px-3 py-3 font-mono text-slate-500 text-xs", children: item.reference_id || "—" })
            ] }, `${item.kind}-${item.id}-${index}`)) })
          ] }),
          details.activity.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "p-6 text-center text-sm text-slate-500", children: "No activity recorded." })
        ] })
      ] }) : null })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "User" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-right", children: "Created" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-right", children: "Last Login" })
    ] }),
    filteredUsers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-slate-200 bg-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-12 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "mx-auto h-8 w-8 text-slate-300" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm font-semibold text-slate-700", children: "No matching users" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Try a different search term or filter." })
    ] }) }) : filteredUsers.map((user) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: `motion-interactive border-slate-200 hover:border-slate-300 ${user.is_active === false ? "bg-slate-50/70 opacity-80" : "bg-white"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${user.role === "admin" ? "bg-blue-500/15 border border-blue-500/25" : "bg-muted/50 border border-border/40"}`, children: user.role === "admin" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-4 w-4 text-blue-400" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-4 w-4 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-sm text-foreground truncate", children: user.name || user.email }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[10px] capitalize", children: user.role.replace("_", " ") }),
            user.is_active === false && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "border-red-200 text-[10px] text-red-600", children: "Inactive" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-3 w-3 text-muted-foreground shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-muted-foreground truncate", children: user.email })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400", children: [
            user.telegram_id && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "Telegram: ",
              user.telegram_id
            ] }),
            user.organization_name && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "Store: ",
              user.organization_name
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            title: user.vip_gold ? "Remove VIP Gold" : "Assign VIP Gold",
            onClick: () => handleVipGoldChange(user),
            className: `inline-flex h-7 items-center gap-1 rounded-full border px-2 text-[10px] font-semibold transition-colors ${user.vip_gold ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-600"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: `h-3 w-3 ${user.vip_gold ? "fill-amber-400 text-amber-600" : ""}` }),
              user.vip_gold ? "VIP Gold" : "VIP"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            "aria-label": `Role for ${user.name || user.email}`,
            value: user.role,
            onChange: (event) => handleUserRoleChange(user, event.target.value),
            disabled: !isSuperAdmin || String(user.telegram_id) === String(currentUser == null ? void 0 : currentUser.id),
            className: "h-7 rounded-full border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-600 disabled:opacity-60",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "user", children: "User" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "admin", children: "Admin" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "co_admin", children: "Co-admin" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "agent", children: "Agent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "super_admin", children: "Super admin" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => handleUserStatusChange(user),
            disabled: !isSuperAdmin,
            className: `inline-flex h-7 items-center rounded-full border px-2 text-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${user.is_active ? "border-emerald-200 text-emerald-700 hover:border-red-300 hover:text-red-600" : "border-red-200 text-red-600 hover:border-emerald-300 hover:text-emerald-700"}`,
            children: user.is_active ? "Deactivate" : "Activate"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden sm:flex flex-col items-end gap-0.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-[11px] text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }),
            formatDate(user.created_at)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
            "Last: ",
            formatDate(user.last_login)
          ] })
        ] })
      ] })
    ] }) }) }, user.id))
  ] });
}
function AuditLogsTab({ onError }) {
  const [logs, setLogs] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [actionFilter, setActionFilter] = reactExports.useState("");
  const [adminIdFilter, setAdminIdFilter] = reactExports.useState("");
  const [targetTypeFilter, setTargetTypeFilter] = reactExports.useState("");
  const [targetIdFilter, setTargetIdFilter] = reactExports.useState("");
  const [purgeDays, setPurgeDays] = reactExports.useState("90");
  const [purging, setPurging] = reactExports.useState(false);
  const fetchLogs = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter) params.set("action", actionFilter);
      if (adminIdFilter) params.set("admin_id", adminIdFilter);
      if (targetTypeFilter) params.set("target_type", targetTypeFilter);
      if (targetIdFilter) params.set("target_id", targetIdFilter);
      params.set("limit", "25");
      const res = await authenticatedFetch(`/api/v1/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setLogs(data.items || []);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [actionFilter, adminIdFilter, onError, targetIdFilter, targetTypeFilter]);
  reactExports.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set("action", actionFilter);
      if (adminIdFilter) params.set("admin_id", adminIdFilter);
      if (targetTypeFilter) params.set("target_type", targetTypeFilter);
      if (targetIdFilter) params.set("target_id", targetIdFilter);
      const url = `/api/v1/audit-logs/export?${params.toString()}`;
      const response = await client.get(url);
      if (!response.ok) {
        const detail = typeof response.data === "string" ? response.data : "Failed to export audit logs";
        throw new Error(detail);
      }
      const blob = new Blob([String(response.data || "")], { type: "text/csv;charset=utf-8" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "audit_logs.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to export audit logs");
    }
  };
  const handlePurge = async () => {
    const days = Number.parseInt(purgeDays, 10);
    if (Number.isNaN(days) || days < 0) {
      onError("Retention days must be a valid number greater than or equal to 0.");
      return;
    }
    const confirmed = window.confirm(`Delete audit records older than ${days} day${days === 1 ? "" : "s"}? This action cannot be undone.`);
    if (!confirmed) return;
    try {
      setPurging(true);
      const res = await authenticatedFetch(`/api/v1/audit-logs/purge?days=${days}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to purge audit logs");
      }
      await fetchLogs();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to purge audit logs");
    } finally {
      setPurging(false);
    }
  };
  const summaryStats = [
    {
      label: "Visible Logs",
      value: String(logs.length),
      hint: "Current filtered result"
    },
    {
      label: "Distinct Admins",
      value: String(new Set(logs.map((log) => log.admin_id)).size),
      hint: "Active operators"
    },
    {
      label: "Top Action",
      value: (() => {
        const counts = logs.reduce((acc, log) => {
          acc[log.action] = (acc[log.action] ?? 0) + 1;
          return acc;
        }, {});
        const [topAction] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? ["—", 0];
        return topAction;
      })(),
      hint: "Most frequent action"
    },
    {
      label: "Last Activity",
      value: logs[0] ? new Date(logs[0].created_at).toLocaleString() : "—",
      hint: "Newest result"
    }
  ];
  const adminBreakdown = Object.entries(
    logs.reduce((acc, log) => {
      const key = log.admin_name || log.admin_id || "Unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const recentActivity = [...logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-card border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col xl:flex-row xl:items-end gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground block mb-1.5", children: "Action" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            value: actionFilter,
            onChange: (e) => setActionFilter(e.target.value),
            placeholder: "filter by action",
            className: "w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00]/60"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground block mb-1.5", children: "Admin ID" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            value: adminIdFilter,
            onChange: (e) => setAdminIdFilter(e.target.value),
            placeholder: "filter by admin id",
            className: "w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00]/60"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground block mb-1.5", children: "Target Type" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            value: targetTypeFilter,
            onChange: (e) => setTargetTypeFilter(e.target.value),
            placeholder: "e.g. admin_user",
            className: "w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00]/60"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground block mb-1.5", children: "Target ID" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            value: targetIdFilter,
            onChange: (e) => setTargetIdFilter(e.target.value),
            placeholder: "filter by target id",
            className: "w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00]/60"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-[150px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground block mb-1.5", children: "Purge Days" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "number",
            min: "0",
            value: purgeDays,
            onChange: (e) => setPurgeDays(e.target.value),
            className: "w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00]/60"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: handlePurge, disabled: purging, className: "h-11 px-4 rounded-xl border-red-500/40 text-red-300 hover:bg-red-500/10", children: purging ? "Purging..." : "Purge Old Logs" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleExport, className: "bg-[#FF6B00] hover:bg-[#E66000] text-white h-11 px-4 rounded-xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4 mr-2" }),
        " Export CSV"
      ] })
    ] }) }) }),
    !loading && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 md:grid-cols-2 xl:grid-cols-4", children: summaryStats.map((stat) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground", children: stat.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xl font-semibold text-foreground break-words", children: stat.value }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] text-muted-foreground", children: stat.hint })
      ] }, stat.label)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 xl:grid-cols-[1.3fr_0.7fr]", children: [
        adminBreakdown.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-card border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-semibold text-foreground", children: "Top Activity by Admin" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: adminBreakdown.map(([admin, count], idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FF6B00]/10 text-[10px] font-bold text-[#FF6B00]", children: idx + 1 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm text-foreground", children: admin })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium text-muted-foreground", children: [
              count,
              " actions"
            ] })
          ] }, admin)) }) })
        ] }),
        recentActivity.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-card border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-semibold text-foreground", children: "Recent Activity" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: recentActivity.map((log) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-muted/40 px-3 py-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-foreground truncate", children: log.admin_name || log.admin_id }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground whitespace-nowrap", children: new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-[#FF6B00] font-medium", children: log.action }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] text-muted-foreground line-clamp-2", children: log.details || log.target_type || "Audit entry" })
          ] }, log.id)) }) })
        ] })
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "motion-skeleton h-20 rounded-xl bg-card border border-border" }, i)) }) : logs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-card border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-col items-center justify-center py-14 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-14 w-14 rounded-2xl bg-muted/40 flex items-center justify-center mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-7 w-7 text-muted-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-semibold text-sm", children: "No audit logs found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mt-1", children: "Matching audit entries will appear here." })
    ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-xl border border-border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "min-w-full text-left text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/40 text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-semibold", children: "Time" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-semibold", children: "Admin" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-semibold", children: "Action" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-semibold", children: "Target" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-semibold", children: "Details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-semibold", children: "IP" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: logs.map((log) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border/80 align-top", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground whitespace-nowrap", children: new Date(log.created_at).toLocaleString() }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-foreground", children: log.admin_name || log.admin_id }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: log.admin_id })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center rounded-md bg-[#FF6B00]/10 border border-[#FF6B00]/20 px-2 py-1 text-[11px] font-medium text-[#FF6B00]", children: log.action }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-foreground font-medium", children: log.target_type || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: log.target_id || "—" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground max-w-md", children: log.details || JSON.stringify(log.payload || {}) || "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground whitespace-nowrap", children: log.ip_address || "—" })
      ] }, log.id)) })
    ] }) }) })
  ] });
}
function RequestCard({
  req,
  canApproveTopups,
  actionId,
  onAction
}) {
  const isPending = req.status === "pending";
  const isProcessing = actionId === req.id;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: `border transition-colors duration-150 ${isPending ? "bg-card border-border hover:border-teal-500/30" : "bg-background/40 border-border/30"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${req.status === "approved" ? "bg-emerald-500/15 border-emerald-500/25" : req.status === "rejected" ? "bg-red-500/10 border-red-500/20" : "bg-teal-500/10 border-teal-500/20"}`, children: req.status === "approved" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4 text-emerald-400" }) : req.status === "rejected" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4 text-red-400" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4 text-amber-400" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold text-sm text-foreground", children: [
            "$",
            req.amount_usdt.toFixed(2),
            " USDT"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: `text-[9px] px-1.5 py-0 h-4 border ${req.status === "approved" ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400" : req.status === "rejected" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`, children: req.status.toUpperCase() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[9px] px-1.5 py-0 h-4", children: req.network })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-muted-foreground font-mono truncate mt-0.5", title: req.tx_hash, children: [
          "TX: ",
          req.tx_hash
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mt-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-muted-foreground", children: [
            "User: ",
            req.user_id
          ] }),
          req.created_at && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground", children: formatDate(req.created_at) })
        ] })
      ] })
    ] }),
    isPending && canApproveTopups && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-row items-center gap-1.5 shrink-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          size: "sm",
          disabled: !!actionId,
          onClick: () => onAction(req.id, "approve"),
          className: "h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white",
          children: isProcessing ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-3 rounded-full border-2 border-white border-t-transparent motion-safe:animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-3.5 w-3.5 mr-1" }),
            "Approve"
          ] })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          size: "sm",
          disabled: !!actionId,
          onClick: () => onAction(req.id, "reject"),
          className: "h-7 px-2.5 text-xs bg-muted hover:bg-red-600/80 text-muted-foreground hover:text-white",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3.5 w-3.5 mr-1" }),
            "Reject"
          ]
        }
      )
    ] }),
    !isPending && req.reviewed_by && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right shrink-0 text-[10px] text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
        "By: ",
        req.reviewed_by
      ] }),
      req.reviewed_at && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: formatDate(req.reviewed_at) })
    ] })
  ] }) }) });
}
function CryptoRequestsTab({
  canApproveTopups,
  onError
}) {
  const [requests, setRequests] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [actionId, setActionId] = reactExports.useState(null);
  const fetchRequests = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch("/api/v1/wallet/crypto-topup-requests");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRequests(data.items || []);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to load crypto requests");
    } finally {
      setLoading(false);
    }
  }, [onError]);
  reactExports.useEffect(() => {
    fetchRequests();
    const id = setInterval(fetchRequests, 3e4);
    return () => clearInterval(id);
  }, [fetchRequests]);
  const handleAction = async (id, action) => {
    if (!canApproveTopups) return;
    setActionId(id);
    try {
      const res = await authenticatedFetch(`/api/v1/wallet/crypto-topup-requests/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Action failed");
      }
      await fetchRequests();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActionId(null);
    }
  };
  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "motion-skeleton h-20 rounded-xl bg-card border border-border" }, i)) });
  }
  if (requests.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-card border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-col items-center justify-center py-14 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-14 w-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bitcoin, { className: "h-7 w-7 text-teal-500" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-semibold text-sm", children: "No crypto top-up requests" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mt-1", children: "Requests submitted by users will appear here." })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    !canApproveTopups && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 text-amber-400 shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-300/80", children: "You have view-only access. Wallet management permission is required to approve or reject requests." })
    ] }),
    pending.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-semibold uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }),
        "Pending (",
        pending.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: pending.map((req) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        RequestCard,
        {
          req,
          canApproveTopups,
          actionId,
          onAction: handleAction
        },
        req.id
      )) })
    ] }),
    reviewed.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2", children: [
        "Reviewed (",
        reviewed.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: reviewed.slice(0, 20).map((req) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        RequestCard,
        {
          req,
          canApproveTopups,
          actionId,
          onAction: handleAction
        },
        req.id
      )) })
    ] })
  ] });
}
function WalletControlTab({ onError }) {
  const [wallets, setWallets] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [adjusting, setAdjusting] = reactExports.useState(null);
  const [adjustAmount, setAdjustAmount] = reactExports.useState({});
  const [adjustNote, setAdjustNote] = reactExports.useState({});
  const [freezing, setFreezing] = reactExports.useState(null);
  const [searchInput, setSearchInput] = reactExports.useState("");
  const [search, setSearch] = reactExports.useState("");
  const [currencyFilter, setCurrencyFilter] = reactExports.useState("all");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const fetchWallets = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      setWallets(await walletApi.listAdminWallets());
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to load wallets");
    } finally {
      setLoading(false);
    }
  }, [onError]);
  reactExports.useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);
  const filteredWallets = wallets.filter((wallet) => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch = !normalizedSearch || [
      wallet.name,
      wallet.email,
      wallet.telegram_username,
      wallet.user_id
    ].some((value) => value == null ? void 0 : value.toLowerCase().includes(normalizedSearch));
    const matchesCurrency = currencyFilter === "all" || wallet.currency === currencyFilter;
    const matchesStatus = statusFilter === "all" || statusFilter === "frozen" && wallet.is_frozen || statusFilter === "active" && !wallet.is_frozen;
    return matchesSearch && matchesCurrency && matchesStatus;
  });
  const handleAdjust = async (wallet, isCredit) => {
    var _a;
    const rawAmount = Number(adjustAmount[wallet.wallet_id] || 0);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      onError("Enter a valid positive amount");
      return;
    }
    if (!((_a = adjustNote[wallet.wallet_id]) == null ? void 0 : _a.trim())) {
      onError("A note is required for every wallet adjustment");
      return;
    }
    setAdjusting(String(wallet.wallet_id));
    try {
      await walletApi.adjustAdminWallet({
        user_id: wallet.user_id,
        currency: wallet.currency,
        amount: isCredit ? rawAmount : -rawAmount,
        note: adjustNote[wallet.wallet_id] || ""
      });
      setAdjustAmount((prev) => ({ ...prev, [wallet.wallet_id]: "" }));
      setAdjustNote((prev) => ({ ...prev, [wallet.wallet_id]: "" }));
      await fetchWallets();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Adjustment failed");
    } finally {
      setAdjusting(null);
    }
  };
  const handleFreezeToggle = async (wallet) => {
    const key = String(wallet.wallet_id);
    setFreezing(key);
    try {
      if (wallet.is_frozen) {
        await walletApi.unfreezeAdminWallet(wallet.user_id, wallet.currency);
      } else {
        const reason = window.prompt(`Reason for freezing this ${wallet.currency} wallet (optional):`, "Frozen by super admin");
        if (reason === null) return;
        await walletApi.freezeAdminWallet({
          user_id: wallet.user_id,
          currency: wallet.currency,
          reason: reason.trim() || void 0
        });
      }
      await fetchWallets();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to update wallet freeze status");
    } finally {
      setFreezing(null);
    }
  };
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", "aria-busy": "true", "aria-label": "Loading wallets", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "motion-skeleton h-24 rounded-xl bg-card border border-border" }, i)) });
  if (!wallets.length) return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-card border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-14 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-7 w-7 text-muted-foreground mx-auto mb-3" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-semibold text-sm", children: "No active user wallets yet" })
  ] }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 lg:flex-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "sr-only", htmlFor: "wallet-control-search", children: "Search wallets" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            id: "wallet-control-search",
            type: "search",
            value: searchInput,
            onChange: (e) => setSearchInput(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter") setSearch(searchInput);
            },
            placeholder: "Search name, email, username, or user ID",
            className: "min-w-0 flex-1 rounded-lg border border-border/60 bg-muted/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", onClick: () => setSearch(searchInput), className: "gap-2 bg-emerald-600 text-white hover:bg-emerald-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4" }),
          "Search"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "sr-only", htmlFor: "wallet-currency-filter", children: "Filter by currency" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { id: "wallet-currency-filter", value: currencyFilter, onChange: (e) => setCurrencyFilter(e.target.value), className: "rounded-lg border border-border/60 bg-muted/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All currencies" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "PHP", children: "PHP" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "USDT", children: "USDT" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "CNY", children: "CNY" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "KRW", children: "KRW" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "sr-only", htmlFor: "wallet-status-filter", children: "Filter by status" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { id: "wallet-status-filter", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "rounded-lg border border-border/60 bg-muted/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All statuses" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "active", children: "Active" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "frozen", children: "Frozen" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-xs", children: [
      filteredWallets.length,
      " of ",
      wallets.length,
      " wallet balances across PHP, USDT, CNY, and KRW — use Credit/Debit to adjust balances."
    ] }),
    filteredWallets.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-card border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-14 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-7 w-7 text-muted-foreground mx-auto mb-3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-semibold text-sm", children: "No wallets match these filters" })
    ] }) }) : filteredWallets.map((wallet) => {
      const key = String(wallet.wallet_id);
      const symbol = wallet.currency === "PHP" ? "₱" : wallet.currency === "USDT" ? "₮" : wallet.currency === "CNY" ? "¥" : "₩";
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-card border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-4 w-4 text-emerald-400" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-semibold text-sm truncate", children: wallet.name || wallet.telegram_username || wallet.user_id }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs truncate", children: wallet.email || (wallet.telegram_username ? `@${wallet.telegram_username}` : wallet.user_id) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[11px] truncate", children: wallet.user_id })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right shrink-0", children: [
            wallet.is_frozen && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-red-500/10 text-red-300 border border-red-500/20 text-[10px] py-1 px-2", children: "Frozen" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-emerald-400 font-semibold text-lg", children: [
              symbol,
              wallet.balance.toLocaleString(void 0, { minimumFractionDigits: 2 })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[10px]", children: wallet.currency })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "sr-only", htmlFor: `wallet-amount-${key}`, children: [
              "Adjustment amount in ",
              wallet.currency
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { id: `wallet-amount-${key}`, type: "number", min: "0.01", step: "0.01", placeholder: `Amount (${wallet.currency})`, value: adjustAmount[key] || "", onChange: (e) => setAdjustAmount((prev) => ({ ...prev, [key]: e.target.value })), className: "flex-1 bg-muted/60 border border-border/60 text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "sr-only", htmlFor: `wallet-note-${key}`, children: "Adjustment note" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { id: `wallet-note-${key}`, type: "text", placeholder: "Note (required)", value: adjustNote[key] || "", onChange: (e) => setAdjustNote((prev) => ({ ...prev, [key]: e.target.value })), className: "flex-1 bg-muted/60 border border-border/60 text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", "aria-label": `Credit ${wallet.user_id} ${wallet.currency} wallet`, onClick: () => handleAdjust(wallet, true), disabled: adjusting === key || freezing === key, className: "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3", children: adjusting === key ? "..." : "+ Credit" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", "aria-label": `Debit ${wallet.user_id} ${wallet.currency} wallet`, onClick: () => handleAdjust(wallet, false), disabled: adjusting === key || freezing === key, className: "flex-1 bg-red-700 hover:bg-red-800 text-white text-xs px-3", children: adjusting === key ? "..." : "− Debit" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", "aria-label": `${wallet.is_frozen ? "Unfreeze" : "Freeze"} ${wallet.user_id} ${wallet.currency} wallet`, onClick: () => handleFreezeToggle(wallet), disabled: adjusting === key || freezing === key, className: `flex-1 text-xs px-3 ${wallet.is_frozen ? "bg-amber-600 hover:bg-amber-700" : "bg-slate-700 hover:bg-slate-800"} text-white`, children: freezing === key ? "..." : wallet.is_frozen ? "Unfreeze" : "Freeze" })
          ] })
        ] })
      ] }) }, key);
    })
  ] });
}
function PasswordChangeModal({
  admin,
  onClose,
  onSave
}) {
  const [password, setPassword] = reactExports.useState("");
  const [confirmPassword, setConfirmPassword] = reactExports.useState("");
  const [saving, setSaving] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const handleSave = async () => {
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await onSave(password);
      onClose();
    } catch (e) {
      setError(e.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4", role: "presentation", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl", role: "dialog", "aria-modal": "true", "aria-labelledby": "change-password-title", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { id: "change-password-title", className: "text-foreground font-semibold flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "h-4 w-4 text-purple-400" }),
        "Change Dashboard Password"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClose, "aria-label": "Close change password dialog", className: "text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-xs", children: [
      "Admin: ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-foreground", children: admin.name || admin.telegram_username || admin.telegram_id })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-3.5 w-3.5 shrink-0 mt-0.5" }),
      error
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "new-admin-password", className: "text-xs text-muted-foreground mb-1 block font-semibold uppercase tracking-widest", children: "New Password" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            id: "new-admin-password",
            type: "password",
            value: password,
            onChange: (e) => {
              setPassword(e.target.value);
              setError("");
            },
            placeholder: "At least 8 characters",
            className: "w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-colors"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "confirm-admin-password", className: "text-xs text-muted-foreground mb-1 block font-semibold uppercase tracking-widest", children: "Confirm Password" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            id: "confirm-admin-password",
            type: "password",
            value: confirmPassword,
            onChange: (e) => {
              setConfirmPassword(e.target.value);
              setError("");
            },
            placeholder: "Re-enter new password",
            className: "w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-colors"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: onClose, className: "flex-1", children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSave, disabled: saving || !password.trim(), className: "flex-1 bg-purple-600 hover:bg-purple-700", children: saving ? "Updating..." : "Update Password" })
    ] })
  ] }) });
}
function BankInfoModal({
  admin,
  onClose,
  onSave
}) {
  const [bankName, setBankName] = reactExports.useState(admin.bank_name || "");
  const [accNum, setAccNum] = reactExports.useState(admin.bank_account_number || "");
  const [accName, setAccName] = reactExports.useState(admin.bank_account_name || "");
  const [bankAddress, setBankAddress] = reactExports.useState(admin.bank_address || "");
  const [usdtWalletAddress, setUsdtWalletAddress] = reactExports.useState(admin.usdt_wallet_address || "");
  const [settlementType, setSettlementType] = reactExports.useState(admin.settlement_type || "");
  const [settlementCurrency, setSettlementCurrency] = reactExports.useState(admin.settlement_currency || "PHP");
  const [saving, setSaving] = reactExports.useState(false);
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        bank_name: bankName,
        bank_account_number: accNum,
        bank_account_name: accName,
        bank_address: bankAddress,
        usdt_wallet_address: usdtWalletAddress.trim() || null,
        settlement_type: settlementType,
        settlement_currency: settlementCurrency
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-foreground font-semibold flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "h-4 w-4 text-blue-400" }),
        "Edit Bank Information"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClose, "aria-label": "Close bank information dialog", className: "motion-interactive text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { "aria-hidden": "true", className: "h-5 w-5" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Bank Name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: bankName,
            onChange: (e) => setBankName(e.target.value),
            placeholder: "e.g. BDO, GCash, Maya",
            className: "w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Account Number" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: accNum,
            onChange: (e) => setAccNum(e.target.value),
            placeholder: "001234567890",
            className: "w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Account Name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: accName,
            onChange: (e) => setAccName(e.target.value),
            placeholder: "Juan Dela Cruz",
            className: "w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Settlement Type" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: settlementType,
            onChange: (e) => setSettlementType(e.target.value),
            placeholder: "e.g. Bank transfer",
            className: "w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Settlement Currency" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: settlementCurrency,
            onChange: (e) => setSettlementCurrency(e.target.value.toUpperCase()),
            placeholder: "PHP",
            className: "w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Bank Address" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: bankAddress,
            onChange: (e) => setBankAddress(e.target.value),
            placeholder: "Bank branch address",
            className: "w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: onClose, className: "flex-1", children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSave, disabled: saving, className: "flex-1 bg-blue-600 hover:bg-blue-700", children: saving ? "Saving..." : "Save Changes" })
    ] })
  ] }) });
}
function ApiKeysModal({
  admin,
  onClose
}) {
  const [keys, setKeys] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [newSvc, setNewSvc] = reactExports.useState("swiftpay");
  const [newKey, setNewKey] = reactExports.useState("");
  const [newVal, setNewVal] = reactExports.useState("");
  const [saving, setSaving] = reactExports.useState(false);
  const fetchKeys = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch(`/api/v1/admin/merchant/${admin.telegram_id}/api-keys`);
      if (!res.ok) throw new Error(await res.text());
      setKeys(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [admin.telegram_id]);
  reactExports.useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);
  const handleUpsert = async () => {
    if (!newKey || !newVal) return;
    setSaving(true);
    try {
      const res = await authenticatedFetch(`/api/v1/admin/merchant/${admin.telegram_id}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_name: newSvc,
          config_key: newKey,
          config_value: newVal,
          is_active: true
        })
      });
      if (!res.ok) throw new Error(await res.text());
      setNewKey("");
      setNewVal("");
      await fetchKeys();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (id) => {
    if (!confirm("Delete this API key?")) return;
    try {
      const res = await authenticatedFetch(`/api/v1/admin/api-keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      await fetchKeys();
    } catch (e) {
      setError(e.message);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between shrink-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-foreground font-semibold flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "h-4 w-4 text-teal-400" }),
          "API Keys: ",
          admin.name || admin.telegram_username
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-[10px]", children: [
          "Merchant ID: ",
          admin.telegram_id
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClose, "aria-label": "Close API keys dialog", className: "motion-interactive text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { "aria-hidden": "true", className: "h-5 w-5" }) })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 text-xs bg-red-500/10 p-2 rounded-lg shrink-0", children: error }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center py-8 text-muted-foreground text-sm", children: "Loading keys..." }) : keys.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl", children: "No API keys found." }) : keys.map((k) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 p-3 bg-muted/40 border border-border rounded-xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-foreground", children: k.service_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] py-0 h-4", children: k.config_key })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-mono text-muted-foreground truncate", children: k.config_value })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => handleDelete(k.id), "aria-label": `Delete ${k.service_name} ${k.config_key} API key`, className: "motion-interactive text-muted-foreground hover:text-red-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { "aria-hidden": "true", className: "h-4 w-4" }) })
    ] }, k.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 pt-4 border-t border-border space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-widest text-muted-foreground", children: "Add / Update Key" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            placeholder: "Service (e.g. swiftpay)",
            value: newSvc,
            onChange: (e) => setNewSvc(e.target.value),
            className: "bg-muted/60 border border-border rounded-lg px-3 py-1.5 text-xs"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            placeholder: "Config Key",
            value: newKey,
            onChange: (e) => setNewKey(e.target.value),
            className: "bg-muted/60 border border-border rounded-lg px-3 py-1.5 text-xs"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            placeholder: "Config Value (Access Key)",
            value: newVal,
            onChange: (e) => setNewVal(e.target.value),
            className: "flex-1 bg-muted/60 border border-border rounded-lg px-3 py-1.5 text-xs"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleUpsert, disabled: saving || !newKey || !newVal, size: "sm", className: "bg-teal-600 hover:bg-teal-700", children: saving ? "..." : "Save Key" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClose, className: "motion-interactive w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground shrink-0", children: "Close" })
  ] }) });
}
function BitGoWalletTab({ onError }) {
  const [config, setConfig] = reactExports.useState({ enabled: false, configured: false, has_access_token: false, access_token: "", base_url: "https://app.bitgo.com", wallet_id: "", coin: "trx", usdt_contract: "" });
  const [addresses, setAddresses] = reactExports.useState([]);
  const [saving, setSaving] = reactExports.useState(false);
  const [busy, setBusy] = reactExports.useState(false);
  const [savedAt, setSavedAt] = reactExports.useState(null);
  const [egressIp, setEgressIp] = reactExports.useState("");
  const load = reactExports.useCallback(async () => {
    try {
      const [configResponse, addressesResponse] = await Promise.all([authenticatedFetch("/api/v1/tatum/config"), authenticatedFetch("/api/v1/tatum/addresses")]);
      if (!configResponse.ok || !addressesResponse.ok) throw new Error("Unable to load BitGo settings");
      const nextConfig = await configResponse.json();
      const nextAddresses = await addressesResponse.json();
      setConfig((current) => ({ ...current, ...nextConfig }));
      setAddresses(nextAddresses.addresses || []);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to load BitGo settings");
    }
  }, [onError]);
  reactExports.useEffect(() => {
    load();
  }, [load]);
  const save = async () => {
    const baseUrl = config.base_url.trim().replace(/\/+$/, "");
    if (!/^https?:\/\/\S+$/i.test(baseUrl)) {
      onError("BitGo base URL must start with http:// or https://.");
      return;
    }
    if (!config.wallet_id.trim()) {
      onError("BitGo wallet ID is required.");
      return;
    }
    if (!config.usdt_contract.trim()) {
      onError("USDT contract address is required.");
      return;
    }
    if (config.enabled && !config.has_access_token && !config.access_token.trim()) {
      onError("Enter a BitGo access token before enabling the integration.");
      return;
    }
    setSaving(true);
    try {
      const response = await authenticatedFetch("/api/v1/tatum/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, base_url: baseUrl, wallet_id: config.wallet_id.trim(), usdt_contract: config.usdt_contract.trim() })
      });
      if (!response.ok) throw new Error(await response.text());
      const nextConfig = await response.json();
      setConfig((current) => ({ ...current, ...nextConfig }));
      setSavedAt(/* @__PURE__ */ new Date());
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to save BitGo settings");
    } finally {
      setSaving(false);
    }
  };
  const runAction = async (path, label) => {
    setBusy(true);
    try {
      const response = await authenticatedFetch(path, { method: "POST" });
      if (!response.ok) throw new Error(await response.text());
      await load();
      window.alert(`${label} completed.`);
    } catch (error) {
      onError(error instanceof Error ? error.message : `${label} failed`);
    } finally {
      setBusy(false);
    }
  };
  const checkEgressIp = async () => {
    setBusy(true);
    try {
      const response = await authenticatedFetch("/api/v1/admin/diagnostics/egress-ip");
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ip) throw new Error(payload.detail || "Unable to determine production egress IP");
      setEgressIp(payload.ip);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Unable to determine production egress IP");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-slate-900", children: "BitGo USDT wallet integration" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 max-w-2xl text-sm leading-5 text-slate-500", children: "Create one TRC20 deposit address per user and monitor incoming transfers. Store only the BitGo access token and wallet ID; never enter a seed phrase or private key." }),
        savedAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs font-medium text-slate-400", children: [
          "Last saved ",
          savedAt.toLocaleTimeString()
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: `w-fit ${config.configured && config.enabled ? "bg-emerald-100 text-emerald-700" : config.configured ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`, children: config.configured && config.enabled ? "ACTIVE" : config.configured ? "DISABLED" : "NOT CONFIGURED" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5 text-sm font-semibold text-slate-700", children: [
        "BitGo access token",
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "password", autoComplete: "new-password", value: config.access_token, placeholder: config.has_access_token ? "Configured; leave blank to keep it" : "Paste access token", onChange: (event) => setConfig((current) => ({ ...current, access_token: event.target.value })), className: "h-11 w-full rounded-xl border border-slate-200 px-3 font-normal" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs font-normal text-slate-400", children: "The existing token is never displayed." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5 text-sm font-semibold text-slate-700", children: [
        "BitGo wallet ID",
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: config.wallet_id, onChange: (event) => setConfig((current) => ({ ...current, wallet_id: event.target.value })), placeholder: "Wallet ID", className: "h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs font-normal" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5 text-sm font-semibold text-slate-700", children: [
        "BitGo base URL",
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: config.base_url, onChange: (event) => setConfig((current) => ({ ...current, base_url: event.target.value })), className: "h-10 w-full rounded-xl border border-slate-200 px-3 font-normal" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1.5 text-sm font-semibold text-slate-700", children: [
        "USDT contract",
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: config.usdt_contract, onChange: (event) => setConfig((current) => ({ ...current, usdt_contract: event.target.value })), className: "h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs font-normal" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 md:col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: config.enabled, onChange: (event) => setConfig((current) => ({ ...current, enabled: event.target.checked })), className: "h-4 w-4 accent-orange-600" }),
        " Enable BitGo address assignment and monitoring"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 md:col-span-2 sm:flex-row sm:flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: save, disabled: saving, className: "min-h-11 bg-[#FF6B00] text-white hover:bg-[#E66000]", children: saving ? "Saving..." : "Save BitGo settings" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", disabled: busy || !config.configured, onClick: () => runAction("/api/v1/tatum/addresses/assign-missing", "Address assignment"), className: "min-h-11", children: "Assign missing addresses" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", disabled: busy || !config.configured, onClick: () => runAction("/api/v1/tatum/monitor", "Transfer monitoring"), className: "min-h-11", children: "Scan transfers now" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", disabled: busy, onClick: checkEgressIp, className: "min-h-11", children: "Check production IP" })
      ] }),
      egressIp && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 md:col-span-2", children: [
        "Whitelist this production IPv4 in BitGo: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "ml-1 font-bold", children: egressIp })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-semibold text-slate-900", children: "Assigned TRC20 addresses" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 overflow-x-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full min-w-[620px] text-left text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3", children: "User" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3", children: "Address" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3", children: "Index" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3", children: "Last scan" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: addresses.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-slate-100", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 font-medium text-slate-700", children: item.user_id }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 font-mono text-xs text-slate-600", children: item.address }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-slate-500", children: item.derivation_index }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-slate-500", children: item.last_scanned_at ? new Date(item.last_scanned_at).toLocaleString() : "Never" })
          ] }, item.address)) })
        ] }),
        addresses.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-8 text-center text-sm text-slate-400", children: "No addresses assigned yet." })
      ] })
    ] })
  ] });
}
function AdminManagement() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const { isSuperAdmin, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = requestedTab === "tatum" ? "bitgo" : requestedTab || "admins";
  const setActiveTab = (tab) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", tab);
    setSearchParams(nextParams, { replace: true });
  };
  const canManagePayments = Boolean((_a = user == null ? void 0 : user.permissions) == null ? void 0 : _a.can_manage_payments);
  const canManageDisbursements = Boolean((_b = user == null ? void 0 : user.permissions) == null ? void 0 : _b.can_manage_disbursements);
  const canViewReports = Boolean((_c = user == null ? void 0 : user.permissions) == null ? void 0 : _c.can_view_reports);
  const canManageWallet = Boolean((_d = user == null ? void 0 : user.permissions) == null ? void 0 : _d.can_manage_wallet);
  Boolean((_e = user == null ? void 0 : user.permissions) == null ? void 0 : _e.can_manage_transactions);
  const canManageBot = Boolean((_f = user == null ? void 0 : user.permissions) == null ? void 0 : _f.can_manage_bot);
  const canApproveTopups = Boolean((_g = user == null ? void 0 : user.permissions) == null ? void 0 : _g.can_approve_topups);
  const canManageTeam = Boolean((_h = user == null ? void 0 : user.permissions) == null ? void 0 : _h.can_manage_team);
  const canAccessAdminUsers = isSuperAdmin && canManageTeam;
  const canAccessUserManagement = isSuperAdmin;
  const canAccessCryptoRequests = isSuperAdmin && canApproveTopups;
  const canAccessWalletControl = isSuperAdmin && canManageWallet;
  const canAccessOperations = isSuperAdmin && (canManagePayments || canManageDisbursements || canApproveTopups || canViewReports || canManageBot);
  const canAccessTossApprovals = isSuperAdmin && canManageWallet;
  const canAccessPaymentChannels = isSuperAdmin && (canManagePayments || canManageDisbursements);
  const canAccessWalletSettings = isSuperAdmin && canManageWallet;
  const canAccessBitgo = isSuperAdmin && canManageWallet;
  const canAccessCheckoutDesign = isSuperAdmin && canManagePayments;
  const canAccessPlatformSettings = isSuperAdmin && (canManagePayments || canManageWallet);
  const canAccessGovernance = isSuperAdmin;
  const [admins, setAdmins] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [adminSearch, setAdminSearch] = reactExports.useState("");
  const [adminFilter, setAdminFilter] = reactExports.useState("all");
  const [form, setForm] = reactExports.useState(defaultForm);
  const [showAdd, setShowAdd] = reactExports.useState(false);
  const [saving, setSaving] = reactExports.useState(false);
  const [maintenanceMode, setMaintenanceMode] = reactExports.useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = reactExports.useState(true);
  const [maintenanceUpdating, setMaintenanceUpdating] = reactExports.useState(false);
  const [additionalFeePercent, setAdditionalFeePercent] = reactExports.useState("0");
  const [systemFeePercent, setSystemFeePercent] = reactExports.useState("0.4");
  const [totalFeePercent, setTotalFeePercent] = reactExports.useState("0.5");
  const [vipGoldFeePercent, setVipGoldFeePercent] = reactExports.useState("0.4");
  const [feeLoading, setFeeLoading] = reactExports.useState(true);
  const [feeSaving, setFeeSaving] = reactExports.useState(false);
  const [editingBankAdmin, setEditingBankAdmin] = reactExports.useState(null);
  const [editingApiKeysAdmin, setEditingApiKeysAdmin] = reactExports.useState(null);
  const [editingPasswordAdmin, setEditingPasswordAdmin] = reactExports.useState(null);
  const [editingFeesAdmin, setEditingFeesAdmin] = reactExports.useState(null);
  const fetchAdmins = reactExports.useCallback(async () => {
    if (!canAccessAdminUsers) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await authenticatedFetch("/api/v1/admin-users");
      if (!res.ok) throw new Error(await res.text());
      setAdmins(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }, [canAccessAdminUsers]);
  const fetchMaintenanceMode = reactExports.useCallback(async () => {
    try {
      setMaintenanceLoading(true);
      const res = await authenticatedFetch("/api/v1/app-settings/maintenance");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMaintenanceMode(!!data.maintenance_mode);
    } catch {
    } finally {
      setMaintenanceLoading(false);
    }
  }, []);
  const fetchCollectionFee = reactExports.useCallback(async () => {
    try {
      setFeeLoading(true);
      const res = await authenticatedFetch("/api/v1/app-settings/collection-fee");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSystemFeePercent(String(data.system_fee_percent ?? 0.4));
      setAdditionalFeePercent(String(data.additional_fee_percent ?? 0));
      setTotalFeePercent(String(data.total_fee_percent ?? 0.5));
      setVipGoldFeePercent(String(data.vip_gold_fee_percent ?? data.system_fee_percent ?? 0.4));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load collection fee");
    } finally {
      setFeeLoading(false);
    }
  }, []);
  const handleToggleMaintenance = async () => {
    if (!isSuperAdmin || maintenanceUpdating) return;
    setMaintenanceUpdating(true);
    try {
      const res = await authenticatedFetch("/api/v1/app-settings/maintenance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !maintenanceMode })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMaintenanceMode(!!data.maintenance_mode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update maintenance mode");
    } finally {
      setMaintenanceUpdating(false);
    }
  };
  reactExports.useEffect(() => {
    if (canAccessAdminUsers) {
      void fetchAdmins();
    }
    fetchMaintenanceMode();
    if (isSuperAdmin) void fetchCollectionFee();
    const id = canAccessAdminUsers ? setInterval(() => void fetchAdmins(), 3e4) : void 0;
    return () => {
      if (id !== void 0) clearInterval(id);
    };
  }, [canAccessAdminUsers, fetchAdmins, fetchMaintenanceMode, fetchCollectionFee, isSuperAdmin]);
  const handleAdd = async () => {
    if (!form.email.trim() || !form.password.trim() || !form.name.trim()) {
      setError("Email, password, and full name are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await authenticatedFetch("/api/v1/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_id: form.telegram_id || void 0,
          telegram_username: form.telegram_username || void 0,
          email: form.email.trim(),
          password: form.password,
          name: form.name.trim(),
          role: form.role
        })
      });
      if (!res.ok) throw new Error(await res.text());
      setForm(defaultForm);
      setShowAdd(false);
      await fetchAdmins();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add admin");
    } finally {
      setSaving(false);
    }
  };
  const handleToggleActive = async (admin) => {
    if (!isSuperAdmin) return;
    try {
      const res = await authenticatedFetch(`/api/v1/admin-users/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !admin.is_active })
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchAdmins();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update admin");
    }
  };
  const handleChangeRole = async (admin, role) => {
    if (!isSuperAdmin) return;
    try {
      const res = await authenticatedFetch(`/api/v1/admin-users/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchAdmins();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update admin role");
    }
  };
  const handleSavedFees = (updated) => {
    setAdmins((current) => current.map((admin) => admin.id === updated.id ? updated : admin));
  };
  const handleDelete = async (admin) => {
    if (!isSuperAdmin) return;
    if (!confirm(`Deactivate @${admin.telegram_username || admin.telegram_id}? Their wallet and history will be preserved.`)) return;
    try {
      const res = await authenticatedFetch(`/api/v1/admin-users/${admin.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      await fetchAdmins();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete admin");
    }
  };
  const handleSaveBank = async (data) => {
    if (!editingBankAdmin) return;
    try {
      const res = await authenticatedFetch(`/api/v1/admin-users/${editingBankAdmin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchAdmins();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save bank information");
      throw e;
    }
  };
  const handleSavePassword = async (password) => {
    if (!editingPasswordAdmin) return;
    const res = await authenticatedFetch(`/api/v1/admin-users/${editingPasswordAdmin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || "Failed to update password.");
    }
    await fetchAdmins();
  };
  const activeAdmins = admins.filter((a) => a.is_active);
  const inactiveAdmins = admins.filter((a) => !a.is_active);
  const superAdminCount = admins.filter((a) => a.is_super_admin).length;
  const normalizedAdminSearch = adminSearch.trim().toLowerCase();
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch = !normalizedAdminSearch || [
      admin.name,
      admin.telegram_username,
      admin.telegram_id,
      admin.bank_name
    ].some((value) => String(value || "").toLowerCase().includes(normalizedAdminSearch));
    const matchesFilter = adminFilter === "all" || adminFilter === "active" && admin.is_active || adminFilter === "inactive" && !admin.is_active || adminFilter === "super" && admin.is_super_admin;
    return matchesSearch && matchesFilter;
  });
  const filteredActiveAdmins = filteredAdmins.filter((admin) => admin.is_active);
  const filteredInactiveAdmins = filteredAdmins.filter((admin) => !admin.is_active);
  const tabs = buildAdminTabs({
    canAccessAdminUsers,
    canAccessUserManagement,
    canAccessCryptoRequests,
    canAccessWalletControl,
    canAccessOperations,
    canAccessTossApprovals,
    canAccessPaymentChannels,
    canAccessWalletSettings,
    canAccessBitgo,
    canAccessCheckoutDesign,
    canAccessPlatformSettings,
    canManageTeam,
    canAccessGovernance,
    isSuperAdmin
  }, admins.length);
  const selectedTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : ((_i = tabs[0]) == null ? void 0 : _i.id) || "admins";
  const selectedTabMeta = tabs.find((tab) => tab.id === selectedTab);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Layout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full min-h-screen bg-slate-50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-4 pb-8 pt-5 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5 md:flex-row md:items-center md:justify-between md:rounded-2xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1 flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-[0.16em] text-[#C2410C]", children: "Control center" }),
              isSuperAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700", children: "Super Admin" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold tracking-tight text-slate-900 sm:text-2xl", children: "Admin Management" })
          ] }),
          selectedTab === "admins" && canAccessAdminUsers && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => setShowAdd(!showAdd),
              className: `gap-2 h-10 whitespace-nowrap rounded-xl text-sm font-semibold transition-all ${showAdd ? "bg-slate-200 text-slate-900 hover:bg-slate-300" : "bg-[#FF6B00] text-white hover:bg-[#E66000] shadow-lg shadow-orange-900/20"}`,
              children: [
                showAdd ? /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
                showAdd ? "Cancel" : "Add Admin"
              ]
            }
          )
        ] }),
        error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mt-0.5 h-5 w-5 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 font-medium", children: error }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setError(""), className: "shrink-0 hover:opacity-70", "aria-label": "Dismiss error", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pb-8 pt-0 sm:px-6 lg:flex-row lg:items-start lg:gap-8 lg:px-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AdminSidebar,
          {
            tabs,
            active: selectedTab,
            onChange: (id) => {
              setActiveTab(id);
              setShowAdd(false);
              setError("");
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 w-full space-y-6", children: [
          selectedTabMeta && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-500", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(selectedTabMeta.icon, { className: `h-3.5 w-3.5 ${selectedTabMeta.iconClassName || ""}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold uppercase tracking-[0.14em] text-slate-400", children: selectedTabMeta.group || "Administration" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: "•" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-slate-700", children: selectedTabMeta.label })
          ] }) }),
          canAccessAdminUsers && selectedTab === "admins" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 xl:grid-cols-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              AdminSummaryCard,
              {
                label: "Admins",
                value: admins.length,
                description: "Total",
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-5 w-5" }),
                tone: "orange"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              AdminSummaryCard,
              {
                label: "Active",
                value: activeAdmins.length,
                description: `${inactiveAdmins.length} inactive`,
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Power, { className: "h-5 w-5" }),
                tone: "emerald"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              AdminSummaryCard,
              {
                label: "Super",
                value: superAdminCount,
                description: "Full access",
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-5 w-5" }),
                tone: "indigo"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              AdminSummaryCard,
              {
                label: "Status",
                value: maintenanceMode ? "Paused" : "Live",
                description: maintenanceMode ? "Maintenance" : "Operational",
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-5 w-5" }),
                tone: maintenanceMode ? "slate" : "emerald"
              }
            )
          ] }),
          canAccessPlatformSettings && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border border-slate-200 bg-white shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-4 sm:p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex h-10 w-10 items-center justify-center rounded-xl border ${maintenanceMode ? "border-amber-200 bg-amber-100 text-amber-600" : "border-slate-200 bg-slate-100 text-slate-500"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-900", children: "Maintenance mode" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: maintenanceMode ? "Platform is paused for admins only." : "Public access is enabled." })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                onClick: handleToggleMaintenance,
                disabled: maintenanceLoading || maintenanceUpdating,
                className: `h-9 rounded-lg px-3 text-xs font-semibold ${maintenanceMode ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}`,
                children: maintenanceUpdating ? "Updating..." : maintenanceMode ? "Resume" : "Enable"
              }
            )
          ] }) }) }),
          selectedTab === "admins" && canAccessAdminUsers && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            showAdd && canAccessAdminUsers && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-white border-slate-200 shadow-xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-300 overflow-hidden", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-4 pt-6 px-6 border-b border-slate-50 bg-slate-50/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-slate-900 text-[15px] font-semibold flex items-center gap-2 uppercase tracking-tight", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "h-5 w-5 text-[#FF6B00]" }),
                "Create New Administrator"
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 space-y-6", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { htmlFor: "admin-telegram-id", className: "text-[11px] font-semibold text-slate-400 uppercase tracking-widest block", children: [
                      "Telegram ID ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: "(optional)" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        id: "admin-telegram-id",
                        type: "text",
                        placeholder: "e.g. 123456789",
                        value: form.telegram_id,
                        onChange: (e) => setForm((f) => ({ ...f, telegram_id: e.target.value })),
                        className: "w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/5 transition-all"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "admin-telegram-username", className: "text-[11px] font-semibold text-slate-400 uppercase tracking-widest block", children: "Telegram Username" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        id: "admin-telegram-username",
                        type: "text",
                        placeholder: "@username",
                        value: form.telegram_username,
                        onChange: (e) => setForm((f) => ({ ...f, telegram_username: e.target.value })),
                        className: "w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/5 transition-all"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "admin-email", className: "text-[11px] font-semibold text-slate-400 uppercase tracking-widest block", children: "Email" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        id: "admin-email",
                        type: "email",
                        placeholder: "admin@example.com",
                        value: form.email,
                        onChange: (e) => setForm((f) => ({ ...f, email: e.target.value })),
                        className: "w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/5 transition-all"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { htmlFor: "admin-password", className: "text-[11px] font-semibold text-slate-400 uppercase tracking-widest block", children: [
                      "Password ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        id: "admin-password",
                        type: "password",
                        placeholder: "Initial password",
                        value: form.password,
                        onChange: (e) => setForm((f) => ({ ...f, password: e.target.value })),
                        className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-300 transition-all focus:border-[#FF6B00] focus:outline-none focus:ring-4 focus:ring-[#FF6B00]/5"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { htmlFor: "admin-full-name", className: "text-[11px] font-semibold text-slate-400 uppercase tracking-widest block", children: [
                      "Full Name ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        id: "admin-full-name",
                        type: "text",
                        placeholder: "Full name",
                        value: form.name,
                        onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })),
                        className: "w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/5 transition-all"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "admin-role", className: "text-[11px] font-semibold text-slate-400 uppercase tracking-widest block", children: "Role" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "select",
                    {
                      id: "admin-role",
                      value: form.role,
                      onChange: (event) => setForm((current) => ({ ...current, role: event.target.value })),
                      className: "h-11 w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:border-[#FF6B00] focus:outline-none focus:ring-4 focus:ring-[#FF6B00]/5",
                      children: ADMIN_ROLE_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: option.label }, option.value))
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: "Permissions are assigned by role and cannot be edited individually." }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: PERMISSION_DEFINITIONS.map(({ key, label, color }) => {
                    var _a2;
                    return /* @__PURE__ */ jsxRuntimeExports.jsx(
                      PermissionBadge,
                      {
                        active: ((_a2 = ROLE_PERMISSION_PRESETS[form.role]) == null ? void 0 : _a2.has(key)) ?? false,
                        label,
                        color,
                        interactive: false
                      },
                      key
                    );
                  }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 pt-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      onClick: handleAdd,
                      disabled: saving || !form.email.trim() || !form.password.trim() || !form.name.trim(),
                      className: "bg-[#FF6B00] hover:bg-[#E66000] text-white font-semibold h-11 px-8 rounded-xl shadow-lg shadow-orange-900/20 disabled:opacity-50 transition-all",
                      children: saving ? "Creating..." : "Create Admin"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "ghost",
                      type: "button",
                      onClick: () => {
                        setShowAdd(false);
                        setForm(defaultForm);
                      },
                      className: "text-slate-400 hover:text-slate-900 font-semibold px-6 h-11 rounded-xl transition-all",
                      children: "Dismiss"
                    }
                  )
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border border-slate-200 bg-white shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    value: adminSearch,
                    onChange: (event) => setAdminSearch(event.target.value),
                    placeholder: "Search by name, Telegram ID, username, or bank",
                    "aria-label": "Search administrator accounts",
                    className: "h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#FF6B00] focus:bg-white focus:ring-4 focus:ring-[#FF6B00]/5"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                [
                  ["all", `All ${admins.length}`],
                  ["active", `Active ${activeAdmins.length}`],
                  ["inactive", `Inactive ${inactiveAdmins.length}`],
                  ["super", `Super ${admins.filter((admin) => admin.is_super_admin).length}`]
                ].map(([value, label]) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setAdminFilter(value),
                    "aria-pressed": adminFilter === value,
                    className: `rounded-full border px-3 py-1.5 text-xs font-semibold transition ${adminFilter === value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`,
                    children: label
                  },
                  value
                )),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", size: "icon", onClick: () => fetchAdmins(), disabled: loading, "aria-label": "Refresh administrators", title: "Refresh administrators", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-4 w-4 ${loading ? "animate-spin" : ""}` }) })
              ] })
            ] }) }),
            loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-4", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "motion-skeleton h-32 rounded-2xl bg-white border border-slate-200" }, i)) }) : filteredAdmins.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-white border-slate-200 py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-col items-center justify-center text-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-10 w-10 text-slate-300" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-900 font-semibold text-lg tracking-tight", children: admins.length === 0 ? "No Administrators Configured" : "No Administrators Found" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 text-sm mt-2 max-w-xs font-medium", children: admins.length === 0 ? "Add your first administrator to grant access to the management dashboard." : "Try a different search term or filter." }),
              admins.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setShowAdd(true), variant: "outline", className: "mt-8 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50", children: "Add your first admin" })
            ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4", children: [
              filteredActiveAdmins.map((admin) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                AdminCard,
                {
                  admin,
                  isSuperAdmin,
                  currentUserId: user == null ? void 0 : user.id,
                  onToggleActive: handleToggleActive,
                  onChangeRole: handleChangeRole,
                  onDelete: handleDelete,
                  onEditBank: setEditingBankAdmin,
                  onEditApiKeys: setEditingApiKeysAdmin,
                  onEditPassword: setEditingPasswordAdmin,
                  onEditFees: setEditingFeesAdmin
                },
                admin.id
              )),
              filteredInactiveAdmins.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-6 space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 px-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-slate-400 font-semibold uppercase tracking-[0.2em] whitespace-nowrap", children: "Inactive Accounts" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-slate-100" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-4", children: filteredInactiveAdmins.map((admin) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  AdminCard,
                  {
                    admin,
                    isSuperAdmin,
                    currentUserId: user == null ? void 0 : user.id,
                    onToggleActive: handleToggleActive,
                    onChangeRole: handleChangeRole,
                    onDelete: handleDelete,
                    onEditBank: setEditingBankAdmin,
                    onEditApiKeys: setEditingApiKeysAdmin,
                    onEditPassword: setEditingPasswordAdmin,
                    onEditFees: setEditingFeesAdmin
                  },
                  admin.id
                )) })
              ] })
            ] })
          ] }),
          selectedTab === "users" && canAccessUserManagement && /* @__PURE__ */ jsxRuntimeExports.jsx(UserManagementTab, { isSuperAdmin, canManageTeam, onError: setError }),
          selectedTab === "audit-logs" && canAccessGovernance && /* @__PURE__ */ jsxRuntimeExports.jsx(AuditLogsTab, { onError: setError }),
          selectedTab === "test-data-cleanup" && isSuperAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(TestDataCleanupTab, {}),
          selectedTab === "crypto" && canAccessCryptoRequests && /* @__PURE__ */ jsxRuntimeExports.jsx(CryptoRequestsTab, { canApproveTopups, onError: setError }),
          selectedTab === "wallet-control" && canAccessWalletControl && /* @__PURE__ */ jsxRuntimeExports.jsx(WalletControlTab, { onError: setError }),
          selectedTab === "operations" && canAccessOperations && /* @__PURE__ */ jsxRuntimeExports.jsx(AdminOperationsTab, {}),
          selectedTab === "toss-approvals" && canAccessTossApprovals && /* @__PURE__ */ jsxRuntimeExports.jsx(TossAccountApprovalsPanel, {}),
          selectedTab === "payment-channels" && canAccessPaymentChannels && /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentChannelsTab, { onError: setError }),
          selectedTab === "wallet-settings" && canAccessWalletSettings && /* @__PURE__ */ jsxRuntimeExports.jsx(WalletSettingsTab, { onError: setError }),
          selectedTab === "bitgo" && canAccessBitgo && /* @__PURE__ */ jsxRuntimeExports.jsx(BitGoWalletTab, { onError: setError }),
          selectedTab === "checkout-design" && canAccessCheckoutDesign && /* @__PURE__ */ jsxRuntimeExports.jsx(CheckoutDesignTab, { onError: setError }),
          selectedTab === "platform-settings" && canAccessPlatformSettings && /* @__PURE__ */ jsxRuntimeExports.jsx(PlatformSettingsTab, { onError: setError }),
          selectedTab === "team-invitations" && canManageTeam && /* @__PURE__ */ jsxRuntimeExports.jsx(TeamInvitationsTab, {}),
          selectedTab === "team-members" && canManageTeam && /* @__PURE__ */ jsxRuntimeExports.jsx(TeamMembersTab, {})
        ] })
      ] })
    ] }),
    editingBankAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(
      BankInfoModal,
      {
        admin: editingBankAdmin,
        onClose: () => setEditingBankAdmin(null),
        onSave: handleSaveBank
      }
    ),
    editingApiKeysAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(
      ApiKeysModal,
      {
        admin: editingApiKeysAdmin,
        onClose: () => setEditingApiKeysAdmin(null)
      }
    ),
    editingPasswordAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(
      PasswordChangeModal,
      {
        admin: editingPasswordAdmin,
        onClose: () => setEditingPasswordAdmin(null),
        onSave: handleSavePassword
      }
    ),
    editingFeesAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(
      FeeSettingsModal,
      {
        admin: editingFeesAdmin,
        onClose: () => setEditingFeesAdmin(null),
        onSaved: handleSavedFees,
        onError: setError
      }
    )
  ] });
}
export {
  AdminManagement as default
};
