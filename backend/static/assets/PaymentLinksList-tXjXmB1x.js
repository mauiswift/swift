import { j as jsxRuntimeExports } from "./query-vendor-C00BCiYd.js";
import { f as useNavigate, a as reactExports } from "./router-vendor-ugVG8BWW.js";
import { a as useLanguage, f as useCollectionCurrency, L as Layout, g as client, b as ue, h as fmtCurrency, j as useTranslation } from "./index-CbMbBdjh.js";
import { c as copyTextToClipboard } from "./clipboard-B4pReMJK.js";
import { g as getAllPaymentLinks, a as getIdentifiedPaymentLinkUrl, u as updatePaymentLink, t as togglePaymentLinkStatus } from "./paymentLinks-BlbKzDwi.js";
/* empty css                         */
import { a7 as CircleDollarSign, ap as Plus, a3 as Search, L as Link2, au as Copy, X } from "./utils-vendor-DtbvWOtt.js";
import "./ui-vendor-D6MKKEiL.js";
function PaymentLinksList() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useTranslation(language);
  const { collectionCurrency, enabledCurrencies } = useCollectionCurrency();
  const [selectedCurrency, setSelectedCurrency] = reactExports.useState(collectionCurrency.toUpperCase());
  const isKorean = language === "ko";
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [links, setLinks] = reactExports.useState([]);
  const [updatingCode, setUpdatingCode] = reactExports.useState(null);
  const getPermanentLinkUrl = (link) => getIdentifiedPaymentLinkUrl(link, window.location.origin);
  reactExports.useEffect(() => {
    setLinks(getAllPaymentLinks());
  }, []);
  reactExports.useEffect(() => {
    setSelectedCurrency(collectionCurrency.toUpperCase());
  }, [collectionCurrency]);
  const currencies = reactExports.useMemo(
    () => Array.from(/* @__PURE__ */ new Set([...enabledCurrencies, "PHP", "USD", "EUR", ...links.map((link) => link.currency.toUpperCase())])).sort(),
    [enabledCurrencies, links]
  );
  const handleStatusAction = async (link) => {
    var _a, _b, _c;
    if (updatingCode) return;
    if (link.provider === "swiftpay") {
      if (link.status !== "Active") return;
      const confirmed = window.confirm(
        isKorean ? "이 결제 링크는 비활성화 후 다시 활성화할 수 없습니다. 계속하시겠습니까?" : "This SwiftPay payment link cannot be reactivated after invalidation. Continue?"
      );
      if (!confirmed) return;
      setUpdatingCode(link.code);
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
          setLinks((current) => current.map((item) => item.code === updated2.code ? updated2 : item));
          ue.success(isKorean ? "결제 링크가 비활성화되었습니다." : "Payment link invalidated");
        }
      } catch {
        ue.error(isKorean ? "결제 링크를 비활성화할 수 없습니다." : "Unable to invalidate payment link");
      } finally {
        setUpdatingCode(null);
      }
      return;
    }
    const updated = togglePaymentLinkStatus(link.code);
    if (updated) {
      setLinks((current) => current.map((item) => item.code === updated.code ? updated : item));
      ue.success(`Link ${updated.status === "Active" ? "reactivated" : "deactivated"}`);
    }
  };
  const filteredLinks = reactExports.useMemo(() => {
    const currencyLinks = links.filter(
      (link) => selectedCurrency === "ALL" || link.currency.toUpperCase() === selectedCurrency
    );
    if (!searchTerm.trim()) {
      return currencyLinks;
    }
    const lowerTerm = searchTerm.toLowerCase();
    return currencyLinks.filter(
      (link) => [link.code, link.title, link.status, link.payor, link.orderNo].join(" ").toLowerCase().includes(lowerTerm)
    );
  }, [selectedCurrency, links, searchTerm]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "payment-workspace page-enter w-full space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight text-slate-900 m-0", children: t("payment_links") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: async () => {
              var _a, _b, _c;
              const currency = (selectedCurrency === "ALL" ? collectionCurrency : selectedCurrency) || "PHP";
              const response = await client.get(
                `/api/v1/payments/open-amount-link?currency=${encodeURIComponent(currency)}`
              );
              const url = response.ok && ((_a = response.data) == null ? void 0 : _a.url) ? new URL(response.data.url, window.location.origin).toString() : "";
              if (!url) {
                const detail = typeof ((_b = response.data) == null ? void 0 : _b.detail) === "string" ? response.data.detail : typeof ((_c = response.data) == null ? void 0 : _c.message) === "string" ? response.data.message : `Request failed (${response.status || "unknown error"})`;
                ue.error(`Unable to create your default payment link: ${detail}`);
                return;
              }
              const success = await copyTextToClipboard(url);
              if (success) {
                ue.success(`${currency} default open-amount link copied`);
              } else {
                ue.error("Unable to copy default payment link");
              }
            },
            disabled: selectedCurrency === "ALL",
            className: "h-9 inline-flex items-center gap-2 border border-slate-300 bg-white text-slate-700 rounded-lg px-4 text-[12px] font-semibold hover:bg-slate-50 disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleDollarSign, { size: 15 }),
              " ",
              t("permanent_link")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => navigate("/pay-by-link/new"),
            className: "h-9 inline-flex items-center gap-2 bg-slate-900 text-white rounded-lg px-4 text-[12px] font-semibold hover:bg-slate-700",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 16 }),
              " ",
              t("create_new")
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex flex-col sm:flex-row sm:justify-end gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          value: selectedCurrency,
          onChange: (event) => setSelectedCurrency(event.target.value),
          "aria-label": isKorean ? "통화별 필터" : "Filter by currency",
          className: "w-full sm:w-auto min-w-36 px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 outline-none focus:border-slate-400",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ALL", children: t("all_currencies") }),
            currencies.map((currency) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: currency, children: currency }, currency))
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full max-w-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            placeholder: t("search_placeholder"),
            className: "w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 lg:hidden", children: filteredLinks.length > 0 ? filteredLinks.map((l) => {
      var _a, _b, _c;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          onClick: () => navigate(`/pay-by-link/details/${l.code}`),
          className: "cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { size: 18 }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[15px] font-bold text-slate-900 truncate", children: fmtCurrency(l.amount, l.currency) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] font-medium text-slate-500 truncate", children: l.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-mono text-slate-400", children: l.code })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${l.status === "Active" ? "border-blue-100 bg-blue-50 text-blue-600" : "border-slate-100 bg-slate-50 text-slate-400"}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `h-1.5 w-1.5 rounded-full ${l.status === "Active" ? "bg-blue-500" : "bg-slate-300"}` }),
                l.status
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[12px] text-slate-500", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: l.created }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", onClick: (e) => e.stopPropagation(), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: async () => {
                      const linkUrl = getPermanentLinkUrl(l);
                      if (!linkUrl) {
                        ue.error("No permanent payment URL available for this link");
                        return;
                      }
                      const success = await copyTextToClipboard(linkUrl);
                      if (success) {
                        ue.success("Payment link copied to clipboard");
                      } else {
                        ue.error("Unable to copy payment link");
                      }
                    },
                    className: "flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 hover:text-[#FF6B00]",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 14 }),
                      " ",
                      t("copy")
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => void handleStatusAction(l),
                    disabled: updatingCode === l.code || l.provider === "swiftpay" && l.status !== "Active",
                    className: "flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 14 }),
                      " ",
                      l.provider === "swiftpay" ? t("invalidate") : l.status === "Active" ? t("deactivate") : t("activate")
                    ]
                  }
                )
              ] })
            ] }),
            l.currency === "KRW" && (l.qrCodeUrl || l.bankAccountDetails) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3", children: [
              l.qrCodeUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: l.qrCodeUrl, alt: "KRW QR code", className: "h-28 w-28 object-contain" }) }),
              l.bankAccountDetails && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 text-xs text-amber-900", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-amber-700", children: "Bank:" }),
                  " ",
                  ((_a = l.bankAccountDetails) == null ? void 0 : _a.bank_name) || "Korean Bank"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-amber-700", children: "Account:" }),
                  " ",
                  ((_b = l.bankAccountDetails) == null ? void 0 : _b.number) || "100220651025"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-amber-700", children: "Holder:" }),
                  " ",
                  ((_c = l.bankAccountDetails) == null ? void 0 : _c.account_name) || "SwiftPay Ventures Inc."
                ] })
              ] })
            ] })
          ]
        },
        l.code
      );
    }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-slate-200 bg-white p-8 text-center text-[13px] text-slate-400", children: t("no_payment_links_found") }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden lg:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left border-collapse", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50/50 border-b border-slate-100", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: t("filter_link") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center", children: t("created_on") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center", children: t("status_label") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center", children: t("actions_label") })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-50", children: filteredLinks.length > 0 ? filteredLinks.map((l) => {
        var _a, _b, _c;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "tr",
            {
              onClick: () => navigate(`/pay-by-link/details/${l.code}`),
              className: "cursor-pointer hover:bg-slate-50/30 transition-colors",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { size: 18 }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] font-semibold text-slate-900", children: fmtCurrency(l.amount, l.currency) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-slate-500", children: [
                      l.title,
                      " • ",
                      l.code
                    ] })
                  ] })
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4 text-center text-[12px] text-slate-600 font-medium", children: l.created }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold border ${l.status === "Active" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-50 text-slate-400 border-slate-100"}`, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `w-1.5 h-1.5 rounded-full ${l.status === "Active" ? "bg-blue-500" : "bg-slate-300"}` }),
                  l.status
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-4", onClick: (e) => e.stopPropagation(), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: async () => {
                        const linkUrl = getPermanentLinkUrl(l);
                        if (!linkUrl) {
                          ue.error("No permanent payment URL available for this link");
                          return;
                        }
                        const success = await copyTextToClipboard(linkUrl);
                        if (success) {
                          ue.success("Payment link copied to clipboard");
                        } else {
                          ue.error("Unable to copy payment link");
                        }
                      },
                      className: "flex items-center gap-2 text-[12px] font-semibold text-slate-600 hover:text-[#FF6B00] transition-colors",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 14 }),
                        " ",
                        t("copy")
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => void handleStatusAction(l),
                      disabled: updatingCode === l.code || l.provider === "swiftpay" && l.status !== "Active",
                      className: "flex items-center gap-2 text-[12px] font-semibold text-slate-600 hover:text-rose-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 14 }),
                        " ",
                        l.provider === "swiftpay" ? t("invalidate") : l.status === "Active" ? t("deactivate") : t("activate")
                      ]
                    }
                  )
                ] }) })
              ]
            }
          ),
          l.currency === "KRW" && (l.qrCodeUrl || l.bankAccountDetails) && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-amber-50/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 4, className: "px-8 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-amber-200 bg-white p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-4 items-center", children: [
            l.qrCodeUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: l.qrCodeUrl, alt: "KRW QR code", className: "w-[140px] h-[140px] object-contain" }) }) : null,
            l.bankAccountDetails ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-amber-900", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1", children: "Bank" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: ((_a = l.bankAccountDetails) == null ? void 0 : _a.bank_name) || "Korean Bank" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1", children: "Holder" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: ((_b = l.bankAccountDetails) == null ? void 0 : _b.account_name) || "SwiftPay Ventures Inc." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-widest text-amber-700 font-semibold mb-1", children: "Account number" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono font-semibold", children: ((_c = l.bankAccountDetails) == null ? void 0 : _c.number) || "100220651025" })
              ] })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-amber-900", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "SwiftPay QR payment" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: "Scan with a supported Korean banking app." })
            ] })
          ] }) }) }) })
        ] }, l.code);
      }) : /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 4, className: "px-8 py-10 text-center text-slate-500", children: t("no_payment_links_found_empty") }) }) })
    ] }) })
  ] }) });
}
export {
  PaymentLinksList as default
};
