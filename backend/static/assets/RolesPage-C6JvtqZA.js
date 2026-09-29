import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { a as reactExports } from "./router-vendor-C2eKMart.js";
import { u as useAuth, g as client, L as Layout, e as Button, p as Card, v as CardContent, I as PERMISSION_DEFINITIONS } from "./index-PXRdWIAr.js";
import { B as Badge } from "./badge-Osp_isCm.js";
import { k as Shield, R as RefreshCw, p as CircleAlert, X, o as CircleCheckBig, O as Crown, l as User, bc as Tag, d as ShieldCheck } from "./utils-vendor-DoKCqRlq.js";
import "./ui-vendor-DsSOT9J9.js";
const PERMISSION_KEYS = PERMISSION_DEFINITIONS;
const BADGE_COLORS = {
  amber: "bg-amber-500/15 border-amber-500/25 text-amber-400",
  blue: "bg-blue-500/15 border-blue-500/25 text-blue-400",
  emerald: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
  yellow: "bg-yellow-500/15 border-yellow-500/25 text-yellow-400",
  indigo: "bg-indigo-500/15 border-indigo-500/25 text-indigo-400",
  cyan: "bg-cyan-500/15 border-cyan-500/25 text-cyan-400",
  slate: "bg-slate-500/15 border-slate-500/25 text-muted-foreground",
  teal: "bg-teal-500/15 border-teal-500/25 text-teal-400"
};
const ROLE_ICONS = {
  super_admin: /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-4 w-4 text-amber-400" }),
  manager: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-4 w-4 text-blue-400" }),
  cashier: /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-4 w-4 text-emerald-400" }),
  reporter: /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "h-4 w-4 text-yellow-400" })
};
const permissionKeys = [
  "is_super_admin",
  ...PERMISSION_KEYS.map(({ key }) => key)
];
function normalizeRole(role) {
  const permissions = permissionKeys.reduce((result, key) => {
    var _a;
    result[key] = Boolean(role[key] ?? ((_a = role.permissions) == null ? void 0 : _a[key]));
    return result;
  }, {});
  return {
    id: role.id,
    name: role.name,
    description: role.description || "Custom permission template",
    color: role.color || "blue",
    is_system: Boolean(role.is_system),
    permissions
  };
}
const emptyPermissions = () => Object.fromEntries(PERMISSION_DEFINITIONS.map(({ key }) => [key, false]));
function PermissionBadge({ active, label, color }) {
  const colorCls = BADGE_COLORS[color] || BADGE_COLORS["blue"];
  if (active) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium ${colorCls}`, children: label });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium bg-muted/40 border-border/30 text-muted-foreground line-through", children: label });
}
function RolesPage() {
  const { isSuperAdmin } = useAuth();
  const [roles, setRoles] = reactExports.useState([]);
  const [admins, setAdmins] = reactExports.useState([]);
  const [rolesLoading, setRolesLoading] = reactExports.useState(true);
  const [adminsLoading, setAdminsLoading] = reactExports.useState(true);
  const [applying, setApplying] = reactExports.useState(null);
  const [editingRoleId, setEditingRoleId] = reactExports.useState(null);
  const [roleForm, setRoleForm] = reactExports.useState({
    name: "",
    description: "",
    color: "blue",
    is_super_admin: false,
    permissions: emptyPermissions()
  });
  const [savingRole, setSavingRole] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const [success, setSuccess] = reactExports.useState("");
  const fetchRoles = reactExports.useCallback(async () => {
    setRolesLoading(true);
    try {
      const res = await client.fetch("/api/v1/roles");
      if (!res.ok) throw new Error(await res.text());
      const payload = await res.json();
      if (!Array.isArray(payload)) throw new Error("Invalid roles response");
      setRoles(payload.map(normalizeRole));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load roles");
    } finally {
      setRolesLoading(false);
    }
  }, []);
  const fetchAdmins = reactExports.useCallback(async () => {
    setAdminsLoading(true);
    try {
      const res = await client.fetch("/api/v1/admin-users");
      if (!res.ok) throw new Error(await res.text());
      setAdmins(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admins");
    } finally {
      setAdminsLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    fetchRoles();
    fetchAdmins();
  }, [fetchRoles, fetchAdmins]);
  const applyRole = async (role, admin) => {
    const key = `${role.id}-${admin.id}`;
    setApplying(key);
    setError("");
    setSuccess("");
    try {
      const res = await client.fetch(`/api/v1/roles/${role.id}/apply/${admin.id}`, {
        method: "POST"
      });
      if (!res.ok) throw new Error(await res.text());
      setSuccess(`Applied "${role.name}" to ${admin.name || admin.telegram_username || `ID: ${admin.telegram_id}`}`);
      await fetchAdmins();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to apply role");
    } finally {
      setApplying(null);
    }
  };
  const resetRoleForm = () => {
    setEditingRoleId(null);
    setRoleForm({
      name: "",
      description: "",
      color: "blue",
      is_super_admin: false,
      permissions: emptyPermissions()
    });
  };
  const editRole = (role) => {
    setEditingRoleId(role.id);
    setRoleForm({
      name: role.name,
      description: role.description,
      color: role.color,
      is_super_admin: role.permissions.is_super_admin,
      permissions: Object.fromEntries(
        PERMISSION_DEFINITIONS.map(({ key }) => [key, Boolean(role.permissions[key])])
      )
    });
    setError("");
    setSuccess("");
  };
  const saveRole = async () => {
    if (!roleForm.name.trim()) {
      setError("Role name is required.");
      return;
    }
    setSavingRole(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        name: roleForm.name.trim(),
        description: roleForm.description.trim() || null,
        color: roleForm.color,
        is_super_admin: roleForm.is_super_admin,
        ...roleForm.permissions
      };
      const res = await client.fetch(
        editingRoleId === null ? "/api/v1/roles" : `/api/v1/roles/${editingRoleId}`,
        {
          method: editingRoleId === null ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      if (!res.ok) throw new Error(await res.text());
      await fetchRoles();
      setSuccess(editingRoleId === null ? "Role created." : "Role updated.");
      resetRoleForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save role");
    } finally {
      setSavingRole(false);
    }
  };
  const activeAdmins = admins.filter((a) => a.is_active);
  const isLoading = rolesLoading || adminsLoading;
  const handleRefresh = reactExports.useCallback(() => {
    fetchRoles();
    fetchAdmins();
  }, [fetchRoles, fetchAdmins]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-4xl mx-auto w-full min-w-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-5 w-5 text-blue-400" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-semibold text-foreground truncate", children: "Role Management" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mt-0.5 truncate", children: rolesLoading ? "Loading…" : `${roles.length} role preset${roles.length !== 1 ? "s" : ""} available` })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: handleRefresh,
          variant: "ghost",
          size: "sm",
          disabled: isLoading,
          className: "text-muted-foreground hover:text-foreground gap-1.5 text-xs shrink-0",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-3.5 w-3.5 ${isLoading ? "motion-safe:animate-spin" : ""}`, "aria-hidden": "true" }),
            "Refresh"
          ]
        }
      )
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "alert", className: "flex items-start gap-2.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": "Dismiss error", onClick: () => setError(""), className: "motion-interactive ml-auto shrink-0 hover:opacity-70", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
    ] }),
    success && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "status", "aria-live": "polite", className: "flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg px-4 py-3 mb-4 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4 shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: success }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": "Dismiss success message", onClick: () => setSuccess(""), className: "motion-interactive ml-auto shrink-0 hover:opacity-70", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2.5 bg-blue-500/8 border border-blue-500/20 rounded-lg px-4 py-3 mb-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-4 w-4 text-blue-400 shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground leading-relaxed", children: "Role presets are permission templates fetched from the server. Applying a preset to an admin instantly updates all their permissions to match the role. You can still fine-tune individual permissions afterward in the Admin Management page. Owner access is organization-scoped; platform super-admin access only applies within the platform organization. Approval and wallet-control permissions do not grant access by themselves." })
    ] }),
    isSuperAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "mb-5 border-slate-200 bg-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-slate-900", children: editingRoleId === null ? "Create custom role" : "Edit custom role" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Configure access by capability. System roles remain locked." })
        ] }),
        editingRoleId !== null && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: resetRoleForm, children: "Cancel" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid gap-3 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-semibold text-slate-700", children: [
          "Role name",
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: roleForm.name,
              onChange: (event) => setRoleForm((current) => ({ ...current, name: event.target.value })),
              className: "mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900",
              placeholder: "e.g. Finance reviewer"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-semibold text-slate-700", children: [
          "Description",
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: roleForm.description,
              onChange: (event) => setRoleForm((current) => ({ ...current, description: event.target.value })),
              className: "mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900",
              placeholder: "What this role can do"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            checked: roleForm.is_super_admin,
            onChange: (event) => setRoleForm((current) => ({ ...current, is_super_admin: event.target.checked })),
            className: "h-4 w-4 accent-amber-600"
          }
        ),
        "Super admin access (platform organization only)"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 grid gap-4 md:grid-cols-2", children: Array.from(new Set(PERMISSION_DEFINITIONS.map(({ group }) => group))).map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-slate-200 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold uppercase tracking-wider text-slate-500", children: group }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 space-y-2", children: PERMISSION_DEFINITIONS.filter((permission) => permission.group === group).map((permission) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-slate-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: roleForm.permissions[permission.key],
              onChange: (event) => setRoleForm((current) => ({
                ...current,
                permissions: { ...current.permissions, [permission.key]: event.target.checked }
              })),
              className: "mt-0.5 h-4 w-4 accent-[#FF6B00]"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs font-semibold text-slate-800", children: permission.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-[11px] text-slate-500", children: permission.description })
          ] })
        ] }, permission.key)) })
      ] }, group)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", onClick: saveRole, disabled: savingRole, className: "bg-[#FF6B00] text-white hover:bg-[#E66000]", children: savingRole ? "Saving..." : editingRoleId === null ? "Create role" : "Save changes" }) })
    ] }) }),
    rolesLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", "aria-busy": "true", "aria-label": "Loading roles", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "motion-skeleton h-36 rounded-xl bg-card border border-border" }, i)) }),
    !rolesLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: roles.map((role) => {
      const colorCls = BADGE_COLORS[role.color] || BADGE_COLORS["blue"];
      const icon = ROLE_ICONS[role.name] ?? /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-4 w-4 text-blue-400" });
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-card border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-9 w-9 rounded-xl flex items-center justify-center border ${colorCls}`, children: icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-sm text-foreground", children: role.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: `text-[9px] px-1.5 py-0 h-4 border ${colorCls}`, children: role.is_system ? "SYSTEM" : "CUSTOM" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground mt-0.5", children: role.description })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1.5 mb-4", children: [
          role.name === "owner" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "span",
            {
              title: "Organization-scoped by default; grants platform super-admin access only when assigned within the platform organization.",
              className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border bg-blue-500/15 border-blue-500/30 text-blue-400 text-[10px] font-medium",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-2.5 w-2.5" }),
                " Owner (scope-aware)"
              ]
            }
          ) : role.permissions.is_super_admin && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border bg-amber-500/15 border-amber-500/30 text-amber-400 text-[10px] font-medium", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-2.5 w-2.5" }),
            " Super Admin"
          ] }),
          PERMISSION_KEYS.map(({ key, label, color }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            PermissionBadge,
            {
              active: role.permissions[key],
              label,
              color
            },
            key
          ))
        ] }),
        isSuperAdmin && !role.is_system && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: () => editRole(role), children: "Edit permissions" }),
        isSuperAdmin && (adminsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "motion-skeleton h-8 rounded-lg bg-muted/40", "aria-label": "Loading administrators" }) : activeAdmins.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2", children: "Apply to admin" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: activeAdmins.map((admin) => {
            const key = `${role.id}-${admin.id}`;
            const isApplying = applying === key;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                "aria-label": `Apply ${role.name} role to ${admin.name || admin.telegram_username || `ID ${admin.telegram_id}`}`,
                onClick: () => applyRole(role, admin),
                disabled: !!applying,
                className: "motion-interactive flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/60 border border-border text-xs text-foreground hover:bg-muted hover:text-foreground disabled:opacity-50",
                children: [
                  isApplying ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-3 rounded-full border-2 border-slate-400 border-t-transparent motion-safe:animate-spin", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-3 w-3 text-muted-foreground" }),
                  admin.name || admin.telegram_username || `ID: ${admin.telegram_id}`
                ]
              },
              admin.id
            );
          }) })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground italic", children: "No active admins to apply this role to." }))
      ] }) }, role.id);
    }) })
  ] }) });
}
export {
  RolesPage as default
};
