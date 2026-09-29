import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { e as useNavigate, a as reactExports } from "./router-vendor-C2eKMart.js";
import { u as useAuth, g as client, b as ue, L as Layout } from "./index-DxezdLhY.js";
import { z as LoaderCircle, v as ChevronLeft, ao as KeyRound, ar as Save, d as ShieldCheck, a7 as BookOpen, as as ExternalLink, am as Download, aq as Copy, R as RefreshCw, at as Trash2, aw as CircleHelp, _ as ChevronDown } from "./utils-vendor-HFbfdctU.js";
import "./ui-vendor-DsSOT9J9.js";
const EDITABLE_FIELDS = [
  "test_callback_url",
  "test_status_page_mode",
  "test_external_status_url",
  "test_success_url",
  "test_cancel_url",
  "test_failure_url",
  "live_callback_url",
  "live_status_page_mode",
  "live_external_status_url",
  "live_success_url",
  "live_cancel_url",
  "live_failure_url"
];
function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
function ApiIntegration() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const [config, setConfig] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [saving, setSaving] = reactExports.useState(false);
  const [generating, setGenerating] = reactExports.useState(null);
  const fetchConfig = reactExports.useCallback(async () => {
    try {
      const res = await client.get("/api/v1/merchant/api-config");
      if (res.data) setConfig(res.data);
    } catch (err) {
      ue.error("Failed to fetch API configuration");
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);
  const handleSave = async () => {
    var _a;
    if (!config) return;
    const urlFields = EDITABLE_FIELDS.filter((field) => field.endsWith("_url"));
    for (const field of urlFields) {
      const value = String(config[field] || "").trim();
      if (value && !isValidUrl(value)) {
        ue.error(`${field.replace(/^(test|live)_/, "").replace(/_/g, " ")} must be a valid HTTP or HTTPS URL`);
        return;
      }
    }
    for (const mode of ["test", "live"]) {
      const statusMode = config[`${mode}_status_page_mode`];
      const externalUrl = String(config[`${mode}_external_status_url`] || "").trim();
      if (statusMode === "external" && !externalUrl) {
        ue.error(`${mode === "test" ? "Test" : "Live"} external status page URL is required`);
        return;
      }
    }
    setSaving(true);
    try {
      const payload = EDITABLE_FIELDS.reduce((result, field) => {
        result[field] = config[field];
        return result;
      }, {});
      const res = await client.patch("/api/v1/merchant/api-config", payload);
      if (res.ok) {
        ue.success("Configuration saved successfully");
      } else {
        ue.error(((_a = res.data) == null ? void 0 : _a.detail) || "Failed to save configuration");
      }
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };
  const generateSecret = async (mode) => {
    var _a, _b;
    if (!window.confirm(`Are you sure you want to generate a new ${mode} secret key? The existing one will be replaced.`)) return;
    setGenerating(mode);
    try {
      const res = await client.post("/api/v1/merchant/api-config/generate-secret", { mode });
      if ((_a = res.data) == null ? void 0 : _a.secret_key) {
        ue.success(`${mode.toUpperCase()} Secret Key generated`);
        setConfig((prev) => prev ? {
          ...prev,
          [`${mode}_secret_key`]: res.data.secret_key
        } : null);
      } else {
        throw new Error(((_b = res.data) == null ? void 0 : _b.detail) || "The server did not return a secret key");
      }
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to generate secret key");
    } finally {
      setGenerating(null);
    }
  };
  const resetSecret = async (mode) => {
    var _a, _b;
    if (!config || !(user == null ? void 0 : user.organization_id)) return;
    if (!window.confirm(`Admin: Are you sure you want to RESET the ${mode} secret key? The key will be cleared.`)) return;
    setGenerating(mode);
    try {
      if (!(user == null ? void 0 : user.organization_id)) throw new Error("Organization ID not found");
      const res = await client.post(`/api/v1/merchant/api-config/${user.organization_id}/reset-secret`, { mode });
      if ((_a = res.data) == null ? void 0 : _a.success) {
        ue.success(`${mode.toUpperCase()} Secret Key reset`);
        setConfig((prev) => prev ? {
          ...prev,
          [`${mode}_secret_key`]: void 0
        } : null);
      } else {
        throw new Error(((_b = res.data) == null ? void 0 : _b.detail) || "Failed to reset secret key");
      }
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Failed to reset secret key");
    } finally {
      setGenerating(null);
    }
  };
  const copyToClipboard = (text) => {
    if (!text) {
      ue.error("Nothing to copy");
      return;
    }
    void navigator.clipboard.writeText(text).then(() => ue.success("Copied to clipboard")).catch(() => ue.error("Unable to copy to clipboard"));
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "animate-spin text-slate-400", size: 32 }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter mx-auto w-full max-w-7xl pb-20", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[12px] text-slate-400 mb-8 font-medium", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cursor-pointer hover:text-slate-600 transition-colors", onClick: () => navigate("/settings"), children: "Settings" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: "/" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600 font-semibold", children: "API & Integration" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 flex flex-col gap-5 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-blue-50/60 p-5 shadow-sm sm:p-7 lg:flex-row lg:items-center lg:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => navigate("/settings"),
            type: "button",
            "aria-label": "Back to settings",
            title: "Back to settings",
            className: "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 20 })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { size: 14 }),
            "Developer workspace"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "m-0 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl", children: "API & Integration" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-2xl text-sm leading-6 text-slate-500", children: "Manage credentials, callbacks, and checkout behavior for your test and live environments." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: handleSave,
          disabled: saving,
          className: "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-5 text-[14px] font-semibold text-white shadow-lg shadow-[#FF6B00]/20 transition-all hover:bg-[#E66000] disabled:opacity-50 lg:shrink-0",
          children: [
            saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 18, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { size: 18 }),
            "Save Changes"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 19 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "m-0 text-sm font-semibold text-slate-900", children: "Secure integration settings" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-5 text-slate-500", children: "Keep secrets private and use test mode before switching traffic to live." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700", children: "Test mode" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700", children: "Live mode" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 sm:p-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mb-8 rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50/80 to-amber-50/40 p-5 sm:p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-5 md:flex-row md:items-center md:justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-[#FF6B00] shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { size: 19 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "m-0 text-[15px] font-semibold text-slate-900", children: "Developer resources" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 max-w-xl text-[12px] leading-relaxed text-slate-600", children: "Read the complete payment integration guide or download the API contract and ready-to-import Postman collection." })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "/api-docs", target: "_blank", rel: "noreferrer", className: "inline-flex h-9 items-center gap-2 rounded-lg bg-[#FF6B00] px-3 text-[12px] font-semibold text-white no-underline hover:bg-[#E66000]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { size: 14 }),
              " Open API docs"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "/downloads/swiftpay-api-guide.md", download: true, className: "inline-flex h-9 items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 text-[12px] font-semibold text-orange-700 no-underline hover:bg-orange-100", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 14 }),
              " Full guide"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "/downloads/swiftpay-openapi.json", download: true, className: "inline-flex h-9 items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 text-[12px] font-semibold text-orange-700 no-underline hover:bg-orange-100", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 14 }),
              " OpenAPI JSON"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "/downloads/swiftpay-postman.json", download: true, className: "inline-flex h-9 items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 text-[12px] font-semibold text-orange-700 no-underline hover:bg-orange-100", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 14 }),
              " Postman"
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto rounded-2xl border border-slate-100", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full min-w-[900px] border-collapse text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "w-[240px]" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-6 text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-center", children: "Test mode" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-6 text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-center", children: "Live mode" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-slate-50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-8 text-[13px] font-semibold text-slate-400", children: "Access key" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 justify-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[12px] font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded border border-slate-100", children: config == null ? void 0 : config.test_access_key }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": "Copy test access key", title: "Copy test access key", onClick: () => copyToClipboard((config == null ? void 0 : config.test_access_key) || ""), className: "rounded-md bg-white p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 16 }) })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 justify-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[12px] font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded border border-slate-100", children: config == null ? void 0 : config.live_access_key }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": "Copy live access key", title: "Copy live access key", onClick: () => copyToClipboard((config == null ? void 0 : config.live_access_key) || ""), className: "rounded-md bg-white p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 16 }) })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-8 text-[13px] font-semibold text-slate-400", children: "Secret key" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-8 text-center", children: (config == null ? void 0 : config.test_secret_key) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 justify-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[12px] font-mono text-slate-900 bg-[#FFF5F1] px-3 py-1.5 rounded border border-[#FFDCCB]", children: config.test_secret_key }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => generateSecret("test"), disabled: !!generating, title: "Regenerate test secret", "aria-label": "Regenerate test secret", className: "rounded-md bg-white p-1 text-slate-500 hover:bg-orange-50 hover:text-[#FF6B00] transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 16, className: generating === "test" ? "animate-spin" : "" }) }),
                  isSuperAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => resetSecret("test"), disabled: !!generating, title: "Reset test secret", "aria-label": "Reset test secret", className: "rounded-md bg-white p-1 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 16 }) })
                ] })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => generateSecret("test"),
                  disabled: !!generating,
                  className: "text-[13px] font-semibold text-slate-800 hover:text-[#FF6B00] transition-colors inline-flex items-center gap-2",
                  children: [
                    "Generate API Secret key",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleHelp, { size: 14, className: "text-slate-400" })
                  ]
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-8 text-center", children: (config == null ? void 0 : config.live_secret_key) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 justify-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[12px] font-mono text-slate-900 bg-[#FFF5F1] px-3 py-1.5 rounded border border-[#FFDCCB]", children: config.live_secret_key }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => generateSecret("live"), disabled: !!generating, title: "Regenerate live secret", "aria-label": "Regenerate live secret", className: "rounded-md bg-white p-1 text-slate-500 hover:bg-orange-50 hover:text-[#FF6B00] transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 16, className: generating === "live" ? "animate-spin" : "" }) }),
                  isSuperAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => resetSecret("live"), disabled: !!generating, title: "Reset live secret", "aria-label": "Reset live secret", className: "rounded-md bg-white p-1 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 16 }) })
                ] })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => generateSecret("live"),
                  disabled: !!generating,
                  className: "text-[13px] font-semibold text-slate-800 hover:text-[#FF6B00] transition-colors inline-flex items-center gap-2",
                  children: [
                    "Generate API Secret key",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleHelp, { size: 14, className: "text-slate-400" })
                  ]
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ApiInputRow,
              {
                label: "Callback URL",
                testValue: (config == null ? void 0 : config.test_callback_url) || "",
                liveValue: (config == null ? void 0 : config.live_callback_url) || "",
                onChange: (mode, val) => setConfig((prev) => prev ? { ...prev, [`${mode}_callback_url`]: val } : null)
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-8 text-[13px] font-semibold text-slate-400", children: "Status page handling" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "select",
                  {
                    value: (config == null ? void 0 : config.test_status_page_mode) || "swiftpay",
                    onChange: (e) => setConfig((prev) => prev ? { ...prev, test_status_page_mode: e.target.value } : null),
                    className: "w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] text-slate-600 outline-none focus:border-[#FF6B00] appearance-none cursor-pointer",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "swiftpay", children: "Swiftpay" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "external", children: "External" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none", size: 14 })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "select",
                  {
                    value: (config == null ? void 0 : config.live_status_page_mode) || "swiftpay",
                    onChange: (e) => setConfig((prev) => prev ? { ...prev, live_status_page_mode: e.target.value } : null),
                    className: "w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] text-slate-600 outline-none focus:border-[#FF6B00] appearance-none cursor-pointer",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "swiftpay", children: "Swiftpay" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "external", children: "External" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none", size: 14 })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ApiInputRow,
              {
                label: "External status page URL",
                testValue: (config == null ? void 0 : config.test_external_status_url) || "",
                liveValue: (config == null ? void 0 : config.live_external_status_url) || "",
                onChange: (mode, val) => setConfig((prev) => prev ? { ...prev, [`${mode}_external_status_url`]: val } : null),
                disabledTest: (config == null ? void 0 : config.test_status_page_mode) === "swiftpay",
                disabledLive: (config == null ? void 0 : config.live_status_page_mode) === "swiftpay"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ApiInputRow,
              {
                label: "Success URL",
                testValue: (config == null ? void 0 : config.test_success_url) || "",
                liveValue: (config == null ? void 0 : config.live_success_url) || "",
                onChange: (mode, val) => setConfig((prev) => prev ? { ...prev, [`${mode}_success_url`]: val } : null)
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ApiInputRow,
              {
                label: "Cancel URL",
                testValue: (config == null ? void 0 : config.test_cancel_url) || "",
                liveValue: (config == null ? void 0 : config.live_cancel_url) || "",
                onChange: (mode, val) => setConfig((prev) => prev ? { ...prev, [`${mode}_cancel_url`]: val } : null)
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ApiInputRow,
              {
                label: "Failure URL",
                testValue: (config == null ? void 0 : config.test_failure_url) || "",
                liveValue: (config == null ? void 0 : config.live_failure_url) || "",
                onChange: (mode, val) => setConfig((prev) => prev ? { ...prev, [`${mode}_failure_url`]: val } : null)
              }
            )
          ] })
        ] }) })
      ] })
    ] })
  ] }) });
}
function ApiInputRow({ label, testValue, liveValue, onChange, disabledTest, disabledLive }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-8 text-[13px] font-semibold text-slate-400", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        value: testValue,
        onChange: (e) => onChange("test", e.target.value),
        disabled: disabledTest,
        placeholder: "https://",
        className: `w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] text-slate-600 outline-none focus:border-[#FF6B00] transition-all ${disabledTest ? "opacity-30" : ""}`
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        value: liveValue,
        onChange: (e) => onChange("live", e.target.value),
        disabled: disabledLive,
        placeholder: "https://",
        className: `w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] text-slate-600 outline-none focus:border-[#FF6B00] transition-all ${disabledLive ? "opacity-30" : ""}`
      }
    ) })
  ] });
}
export {
  ApiIntegration as default
};
