import { j as jsxRuntimeExports } from "./query-vendor-C00BCiYd.js";
import { f as useNavigate, a as reactExports } from "./router-vendor-ugVG8BWW.js";
import { u as useAuth, f as useCollectionCurrency, g as client, L as Layout, b as ue } from "./index-CbMbBdjh.js";
import { c as copyTextToClipboard } from "./clipboard-B4pReMJK.js";
import { z as LoaderCircle, v as ChevronLeft, av as Save, L as Link2, au as Copy, aw as ExternalLink, ax as Trash2, ab as ShoppingBag } from "./utils-vendor-DtbvWOtt.js";
import "./ui-vendor-D6MKKEiL.js";
const PERMANENT_LINK_CURRENCIES = ["PHP", "KRW", "CNY", "USDT"];
function buildPermanentPaymentLink(origin, slug, currency) {
  const normalizedCurrency = currency.trim().toUpperCase();
  if (!PERMANENT_LINK_CURRENCIES.includes(
    normalizedCurrency
  )) {
    throw new Error(`Unsupported permanent link currency: ${currency}`);
  }
  const baseOrigin = ["localhost", "127.0.0.1"].includes(new URL(origin).hostname) ? origin.replace(/\/$/, "") : `${new URL(origin).protocol}//kr.swiftpay.site`;
  return `${baseOrigin}/pay/${encodeURIComponent(
    slug
  )}-${normalizedCurrency}`;
}
function StoreProfile() {
  var _a, _b;
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const canManageProfile = Boolean(
    isSuperAdmin || ((_a = user == null ? void 0 : user.permissions) == null ? void 0 : _a.can_manage_payments) || ((_b = user == null ? void 0 : user.permissions) == null ? void 0 : _b.can_manage_team)
  );
  const { collectionCurrency: sharedCollectionCurrency, enabledCurrencies, setCollectionCurrency: setSharedCollectionCurrency } = useCollectionCurrency();
  const publicPayPrefix = typeof window !== "undefined" ? `${window.location.host}/pay/` : "swiftpay.site/pay/";
  const [loading, setLoading] = reactExports.useState(true);
  const [saving, setSaving] = reactExports.useState(false);
  const [shopName, setShopName] = reactExports.useState("");
  const [savedShopName, setSavedShopName] = reactExports.useState("");
  const [logoUrl, setLogoUrl] = reactExports.useState("");
  const [savedLogoUrl, setSavedLogoUrl] = reactExports.useState("");
  const [slug, setSlug] = reactExports.useState("");
  const [savedSlug, setSavedSlug] = reactExports.useState("");
  const [storeSlug, setStoreSlug] = reactExports.useState("3");
  const [collectionCurrency, setCollectionCurrency] = reactExports.useState(sharedCollectionCurrency || "PHP");
  const [savedCollectionCurrency, setSavedCollectionCurrency] = reactExports.useState(sharedCollectionCurrency || "PHP");
  const [permanentLinks, setPermanentLinks] = reactExports.useState([]);
  reactExports.useEffect(() => {
    setCollectionCurrency(sharedCollectionCurrency || "PHP");
    setSavedCollectionCurrency(sharedCollectionCurrency || "PHP");
  }, [sharedCollectionCurrency]);
  reactExports.useEffect(() => {
    if (["KRW", "PHP", "CNY"].includes(collectionCurrency)) {
      setStoreSlug("3");
    }
  }, [collectionCurrency]);
  const fetchConfig = reactExports.useCallback(async () => {
    try {
      const res = await client.get("/api/v1/merchant/api-config");
      if (res.data) {
        const nextCurrency = String(res.data.collection_currency || sharedCollectionCurrency || "PHP").toUpperCase();
        setShopName(res.data.store_name || (user == null ? void 0 : user.organization_name) || "");
        setSavedShopName(res.data.store_name || (user == null ? void 0 : user.organization_name) || "");
        setLogoUrl(res.data.store_logo_url || "");
        setSavedLogoUrl(res.data.store_logo_url || "");
        setSlug(res.data.permanent_link_slug || "");
        setSavedSlug(res.data.permanent_link_slug || "");
        setStoreSlug(res.data.store_slug || "3");
        setCollectionCurrency(nextCurrency);
        setSavedCollectionCurrency(nextCurrency);
        setSharedCollectionCurrency(nextCurrency);
      }
    } catch (err) {
      console.error("Failed to fetch store profile:", err);
    } finally {
      setLoading(false);
    }
  }, [user, setSharedCollectionCurrency, sharedCollectionCurrency]);
  reactExports.useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);
  reactExports.useEffect(() => {
    client.get("/api/v1/payments/open-amount-links").then((res) => {
      var _a2;
      if (res.ok && Array.isArray((_a2 = res.data) == null ? void 0 : _a2.links)) {
        setPermanentLinks(res.data.links);
      }
    }).catch((err) => console.error("Failed to fetch permanent payment links:", err));
  }, []);
  const saveSettings = async (updates, successMessage) => {
    var _a2, _b2, _c;
    if (!canManageProfile) return;
    setSaving(true);
    try {
      const res = await client.patch("/api/v1/merchant/api-config", updates);
      if (res.ok) {
        if ("store_name" in updates) setSavedShopName(updates.store_name || "");
        if ("permanent_link_slug" in updates) setSavedSlug(updates.permanent_link_slug || "");
        if ("store_logo_url" in updates) setSavedLogoUrl(updates.store_logo_url || "");
        if ("collection_currency" in updates) {
          const savedCurrency = String(((_a2 = res.data) == null ? void 0 : _a2.collection_currency) || updates.collection_currency || "PHP").toUpperCase();
          setCollectionCurrency(savedCurrency);
          setSavedCollectionCurrency(savedCurrency);
          setSharedCollectionCurrency(savedCurrency);
        }
        ue.success(successMessage);
      } else {
        const errorMsg = ((_b2 = res.data) == null ? void 0 : _b2.detail) || ((_c = res.data) == null ? void 0 : _c.message) || "Failed to update store profile";
        ue.error(errorMsg);
        console.error("Save failed:", res.data);
      }
    } catch (err) {
      ue.error("An error occurred. Check your network or the logo URL length.");
      console.error("Save exception:", err);
    } finally {
      setSaving(false);
    }
  };
  const handleSave = () => saveSettings({
    store_name: shopName,
    store_logo_url: logoUrl,
    permanent_link_slug: slug,
    store_slug: storeSlug,
    collection_currency: collectionCurrency
  }, "Store profile updated");
  const saveStoreSettings = () => saveSettings({
    store_name: shopName,
    store_slug: storeSlug,
    collection_currency: collectionCurrency
  }, "Store settings updated");
  const savePermanentLink = () => saveSettings({ permanent_link_slug: slug }, "Permanent payment link updated");
  const saveLogoUrl = () => saveSettings({ store_logo_url: logoUrl }, "Store logo updated");
  const handleLogoUpload = async (e) => {
    var _a2, _b2, _c;
    if (!canManageProfile) return;
    const file = (_a2 = e.target.files) == null ? void 0 : _a2[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("logo", file);
    setSaving(true);
    try {
      const res = await client.post("/api/v1/merchant/api-config/upload-logo", formData);
      if (res.ok && ((_b2 = res.data) == null ? void 0 : _b2.logo_url)) {
        setLogoUrl(res.data.logo_url);
        setSavedLogoUrl(res.data.logo_url);
        ue.success("Logo uploaded successfully");
      } else {
        ue.error(((_c = res.data) == null ? void 0 : _c.detail) || "Failed to upload logo");
      }
    } catch (err) {
      ue.error("Upload failed");
    } finally {
      setSaving(false);
    }
  };
  const publicLinkSlug = slug;
  const publicPayUrl = publicLinkSlug ? buildPermanentPaymentLink(window.location.origin, publicLinkSlug, savedCollectionCurrency) : "";
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "animate-spin text-slate-400", size: 32 }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter mx-auto w-full max-w-6xl pb-20", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[12px] text-slate-400 mb-8 font-medium", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cursor-pointer hover:text-slate-600 transition-colors", onClick: () => navigate("/settings"), children: "Settings" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: "/" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600 font-semibold", children: "Store profile" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-3 sm:gap-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => navigate("/settings"),
            type: "button",
            "aria-label": "Back to settings",
            title: "Back to settings",
            className: "app-touch-target rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 20 })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl", children: "Store profile" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: handleSave,
          disabled: saving || !canManageProfile,
          "data-guide-target": "store-profile-save",
          className: "app-touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-6 text-sm font-semibold text-white shadow-lg shadow-[#FF6B00]/20 transition-all hover:bg-[#E66000] disabled:opacity-50 sm:w-auto sm:px-8",
          children: [
            saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 18, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { size: 18 }),
            "Save Changes"
          ]
        }
      )
    ] }),
    !canManageProfile && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "note", className: "mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600", children: "You have read-only access to this shared store profile. Ask an organization manager to make changes." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-start", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-panel p-5 sm:p-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-8 max-w-2xl text-sm leading-relaxed text-slate-500", children: "Manage the shared merchant name, collection currency, permanent payment link, and store logo." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: "Shop name" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  value: shopName,
                  onChange: (e) => setShopName(e.target.value),
                  placeholder: "e.g. Acme Corp",
                  disabled: !canManageProfile,
                  className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-slate-100 pt-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[14px] font-semibold text-slate-900 block mb-2", children: "Collection currency" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] text-slate-500 mb-3", children: "This currency is used for new store collections." }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "select",
                  {
                    value: collectionCurrency,
                    onChange: (e) => setCollectionCurrency(e.target.value),
                    disabled: !canManageProfile,
                    className: "w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all appearance-none cursor-pointer",
                    children: enabledCurrencies.map((currency) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: currency, children: currency }, currency))
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDownIcon, { className: "absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none", size: 18 })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end border-t border-slate-100 pt-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: saveStoreSettings,
                disabled: saving || !canManageProfile || shopName === savedShopName && collectionCurrency === savedCollectionCurrency,
                className: "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-4 text-sm font-semibold text-white hover:bg-[#E66000] disabled:cursor-not-allowed disabled:opacity-50",
                children: [
                  saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 16, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { size: 16 }),
                  "Save store settings"
                ]
              }
            ) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-panel p-5 sm:p-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6B00]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { size: 20 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[18px] font-semibold text-slate-900 m-0", children: "Permanent Payment Link" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-8 max-w-2xl text-sm leading-relaxed text-slate-500", children: "Create an open-amount payment link for your store. Customers can enter the amount they want to pay at checkout." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8 max-w-xl", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: "Store Slug" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 text-[14px] font-medium text-slate-400", children: publicPayPrefix }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    value: slug,
                    onChange: (e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")),
                    placeholder: "my-store",
                    disabled: !canManageProfile,
                    className: "min-w-0 flex-1 basis-40 bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: savePermanentLink,
                  disabled: saving || !canManageProfile || slug === savedSlug,
                  className: "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-4 text-sm font-semibold text-white hover:bg-[#E66000] disabled:cursor-not-allowed disabled:opacity-50",
                  children: [
                    saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 15, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { size: 15 }),
                    "Save link"
                  ]
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: (permanentLinks.length ? permanentLinks : publicPayUrl ? [{ currency: savedCollectionCurrency, url: publicPayUrl }] : []).map((link) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-1", children: [
                  link.currency,
                  " permanent link"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-mono text-[13px] text-slate-700", children: link.url }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-[11px] text-slate-600", children: "Dedicated to this user · Customer enters the amount" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center gap-1 sm:gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    "aria-label": `Copy ${link.currency} permanent payment link`,
                    title: `Copy ${link.currency} permanent payment link`,
                    onClick: async () => {
                      const copied = await copyTextToClipboard(link.url);
                      if (copied) ue.success(`${link.currency} URL copied`);
                      else ue.error("Unable to copy URL");
                    },
                    className: "p-2 text-slate-500 hover:text-[#FF6B00] transition-colors",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 18 })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: link.url, target: "_blank", rel: "noopener", className: "p-2 text-slate-500 hover:text-blue-500 transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { size: 18 }) })
              ] })
            ] }, link.currency)) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-10 lg:sticky lg:top-24", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] font-semibold text-slate-500 mb-8 uppercase tracking-widest", children: "Store logo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-slate-100 rounded-2xl p-8 bg-slate-50 relative group shadow-sm flex flex-col items-center justify-center min-h-[240px]", children: logoUrl ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full aspect-square flex items-center justify-center bg-white rounded-xl shadow-inner overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: logoUrl, alt: "Store logo", className: "max-w-[140px] max-h-[140px] object-contain" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 w-full flex items-center justify-between gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[12px] text-slate-400 truncate font-medium max-w-[160px]", children: logoUrl.split("/").pop() }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setLogoUrl(""),
                  disabled: !canManageProfile || saving,
                  className: "p-2.5 text-slate-400 hover:text-rose-500 transition-all border border-white bg-white rounded-xl shadow-sm hover:shadow-md",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 18 })
                }
              )
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { size: 32, className: "text-slate-200" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] font-semibold text-slate-400", children: "No logo uploaded" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: "Upload Logo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "file",
                  accept: "image/*",
                  onChange: handleLogoUpload,
                  disabled: !canManageProfile || saving,
                  className: "hidden",
                  id: "logo-upload"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "label",
                {
                  htmlFor: "logo-upload",
                  className: `flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[14px] text-slate-500 transition-all flex items-center gap-2 ${canManageProfile && !saving ? "cursor-pointer hover:border-[#FF6B00]" : "cursor-not-allowed opacity-50"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { size: 18 }),
                    saving ? "Uploading..." : "Choose image..."
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: "Logo URL (Alternative)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: logoUrl,
                onChange: (e) => setLogoUrl(e.target.value),
                placeholder: "https://example.com/logo.png",
                disabled: !canManageProfile,
                className: "w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-400 mt-2", children: "Recommended: Square image, transparent background." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: saveLogoUrl,
                disabled: saving || !canManageProfile || logoUrl === savedLogoUrl,
                className: "mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-4 text-sm font-semibold text-white hover:bg-[#E66000] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto",
                children: [
                  saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 15, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { size: 15 }),
                  "Save logo URL"
                ]
              }
            )
          ] })
        ] })
      ] })
    ] })
  ] }) });
}
function ChevronDownIcon({ className, size }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M6 9l6 6 6-6" }) });
}
export {
  StoreProfile as default
};
