import { j as jsxRuntimeExports } from "./query-vendor-C00BCiYd.js";
import { l as useParams, f as useNavigate, a as reactExports } from "./router-vendor-ugVG8BWW.js";
import { g as client, L as Layout, e as Button, Z as getTransactionStatus, aQ as isSuccessfulTransaction, a1 as normalizePublicCurrency, h as fmtCurrency, b as ue } from "./index-CbMbBdjh.js";
import { L as LoadingSkeleton } from "./LoadingSkeleton-DEQaxaN_.js";
import { aL as FileText, az as ArrowLeft, bn as Printer, d as ShieldCheck, J as CircleCheck, aP as Clock3, au as Copy } from "./utils-vendor-DtbvWOtt.js";
import "./ui-vendor-D6MKKEiL.js";
const COMPANY_NAME = "SwiftPay";
const MERCHANT_SIGNATORY = "Authorized Representative";
const SERVICE_PACKAGES = [
  {
    minimumPhp: 0,
    maximumPhp: 49999.99,
    packageName: "IT Services Starter",
    workDays: 3,
    serviceType: "Small business setup or targeted technical fix",
    delivery: "Remote discovery, configuration or correction of one agreed system component, and a short verification cycle.",
    deliverables: "Written requirements summary, configured feature or fix, basic test checklist, and electronic handover notes.",
    acceptance: "The agreed feature or correction is demonstrated against the documented requirements and the customer receives the handover notes.",
    support: "Three calendar days for clarification, minor configuration adjustments, and correction of defects in the delivered scope.",
    exclusions: "New modules outside the agreed task, extensive data migration, third-party subscription fees, hardware, and on-site work."
  },
  {
    minimumPhp: 5e4,
    maximumPhp: 99999.99,
    packageName: "IT Services Professional",
    workDays: 7,
    serviceType: "Business workflow, payment, or customer-facing system implementation",
    delivery: "Requirements workshop, solution design, implementation of the agreed workflow, test execution, and deployment assistance.",
    deliverables: "Solution outline, configured or developed workflow, validation results, deployment checklist, and administrator handover.",
    acceptance: "The customer reviews the delivered workflow using the agreed test scenarios and confirms that the documented acceptance criteria are met.",
    support: "Seven calendar days for defect correction, operational questions, and minor adjustments directly related to the delivered scope.",
    exclusions: "Material scope expansion, recurring hosting or software charges, major data cleansing, hardware procurement, and work requiring a separate statement of work."
  },
  {
    minimumPhp: 100000.01,
    maximumPhp: Number.POSITIVE_INFINITY,
    packageName: "IT Services Enterprise",
    workDays: 14,
    serviceType: "Multi-component platform, integration, or automation project",
    delivery: "Technical planning, architecture review, implementation across the agreed components, integration testing, security-minded configuration review, and operational handover.",
    deliverables: "Project plan, solution architecture summary, configured or developed components, test and deployment records, operating guide, and handover session.",
    acceptance: "The customer reviews the agreed acceptance checklist and confirms that the integrated solution performs the documented priority workflows in the agreed environment.",
    support: "Fourteen calendar days for defect correction, deployment assistance, monitoring guidance, and minor adjustments directly related to the delivered scope.",
    exclusions: "Unlimited revisions, 24/7 managed operations, third-party fees, infrastructure outside the agreed environment, regulated certifications, and major features not listed in the project plan."
  }
];
function PaymentContract() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [copied, setCopied] = reactExports.useState(false);
  const load = reactExports.useCallback(async () => {
    var _a;
    if (!id) {
      setError("Transaction ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await client.get(`/api/v1/entities/transactions/${encodeURIComponent(id)}`);
      if (!response.ok || !response.data) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.detail) || "Unable to load payment contract.");
      }
      setTransaction(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load payment contract.");
    } finally {
      setLoading(false);
    }
  }, [id]);
  reactExports.useEffect(() => {
    void load();
  }, [load]);
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSkeleton, { variant: "page" }) });
  if (error || !transaction) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-xl py-20 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "mx-auto h-10 w-10 text-slate-300" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-4 text-lg font-semibold text-slate-900", children: "Unable to generate contract" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: error || "Transaction not found." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "mt-6", onClick: () => navigate("/payments"), children: "Back to payments" })
    ] }) });
  }
  const contractStatus = getTransactionStatus(transaction);
  const successful = isSuccessfulTransaction(contractStatus);
  const contractNumber = `SP-${String(transaction.id).padStart(8, "0")}`;
  const currency = normalizePublicCurrency(transaction.currency);
  const phpEquivalent = currency === "PHP" ? Number(transaction.amount || 0) : Number(transaction.processing_amount || 0);
  const servicePackage = SERVICE_PACKAGES.find((packageTier) => phpEquivalent >= packageTier.minimumPhp && phpEquivalent <= packageTier.maximumPhp) || SERVICE_PACKAGES[0];
  const contractDate = transaction.paid_at || transaction.updated_at || transaction.created_at;
  const formattedDate = contractDate ? new Date(contractDate).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" }) : "—";
  const generatedAt = (/* @__PURE__ */ new Date()).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
  const statusLabel = successful && contractStatus !== "pending" ? "Completed" : "Review required";
  const copyContractNumber = async () => {
    try {
      await navigator.clipboard.writeText(contractNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      ue.error("Unable to copy contract number");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Layout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        @page {
          size: A4;
          margin: 14mm;
        }
        @media print {
          html, body {
            background: #fff !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .contract-document {
            width: 100%;
            color: #0f172a;
            overflow: visible !important;
          }
          .contract-document footer,
          .contract-document .contract-summary,
          .contract-document .contract-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .contract-document .contract-section {
            break-inside: auto;
            page-break-inside: auto;
          }
          .contract-document .contract-section > h2 {
            break-after: avoid;
            page-break-after: avoid;
          }
          .contract-document header {
            break-after: avoid;
            page-break-after: avoid;
          }
          .contract-document .contract-terms { break-before: auto; }
          .contract-document {
            font-size: 10.5pt;
          }
          .app-shell,
          .app-main,
          .app-content {
            display: block !important;
            min-height: 0 !important;
            height: auto !important;
            max-width: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
          }
          .contract-document h2 {
            color: #334155 !important;
          }
        }
      ` }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter mx-auto max-w-4xl print:max-w-none", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center justify-between gap-3 print:hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", onClick: () => navigate(`/payments/${encodeURIComponent(String(transaction.id))}`), className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 16 }),
          " Back to payment"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => window.print(), className: "gap-2 bg-slate-900 text-white hover:bg-slate-800", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { size: 16 }),
          " Print / Save PDF"
        ] })
      ] }),
      !successful && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 print:hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 17 }),
        "This payment is not marked successful. The contract is shown for review only."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "contract-document overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:overflow-visible print:rounded-none print:border-0 print:shadow-none", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "border-b border-slate-200 bg-slate-950 px-8 py-8 text-white sm:px-12 print:px-10 print:py-7", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 13 }),
              " Secure Platform"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight sm:text-3xl", children: "IT Services Payment Agreement" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-300", children: "Payment record, service scope, and electronic customer acknowledgement" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-left sm:text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-widest text-slate-400", children: "Contract status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `mt-1 flex items-center gap-1.5 text-sm font-semibold sm:justify-end ${successful && contractStatus !== "pending" ? "text-emerald-300" : "text-amber-300"}`, children: [
              successful && contractStatus !== "pending" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 15 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Clock3, { size: 15 }),
              " ",
              statusLabel
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8 px-8 py-8 sm:px-12 print:space-y-6 print:px-10 print:py-7", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "contract-summary grid gap-5 border-b border-slate-100 pb-7 sm:grid-cols-3 print:gap-4 print:pb-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400", children: "Contract number" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => void copyContractNumber(), className: "mt-1.5 inline-flex items-center gap-1.5 text-left text-sm font-semibold text-slate-800 hover:text-blue-700 print:pointer-events-none", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: contractNumber }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 13, className: "text-slate-400 print:hidden" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: copied ? "Copied" : "Copy contract number" })
              ] }),
              copied && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] font-medium text-emerald-600 print:hidden", children: "Copied" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Merchant", value: COMPANY_NAME }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Payment date", value: formattedDate }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Transaction ID", value: transaction.external_id || String(transaction.id), mono: true }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Payment method", value: transaction.transaction_type || "Payment" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Currency", value: currency }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Approved at", value: transaction.approved_at ? new Date(transaction.approved_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Record generated", value: generatedAt })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "contract-section", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xs font-bold uppercase tracking-[0.16em] text-slate-400", children: "1. Engagement summary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm leading-6 text-slate-600", children: "This agreement records the payment identified above and the corresponding IT service package selected for administrative reference. The service description is based on the payment tier and should be read together with any quotation, proposal, invoice, or written project instructions issued to the customer." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "contract-card mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-900", children: transaction.description || "Payment for goods or services" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm text-slate-500", children: [
                    "Customer: ",
                    transaction.customer_name || "Not provided"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400", children: "Amount paid" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-semibold text-slate-900", children: fmtCurrency(transaction.amount, currency) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Selected package", value: servicePackage.packageName }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Estimated schedule", value: `${servicePackage.workDays} calendar days` }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "PHP tier value", value: fmtCurrency(phpEquivalent, "PHP") })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "contract-section", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xs font-bold uppercase tracking-[0.16em] text-slate-400", children: "2. IT service scope and delivery plan" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "contract-card mt-4 grid gap-4 rounded-xl border border-blue-200 bg-blue-50 p-5 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Service package", value: servicePackage.packageName }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "PHP value used for tier", value: fmtCurrency(phpEquivalent, "PHP") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Estimated work days", value: `${servicePackage.workDays} calendar days` }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Service type", value: servicePackage.serviceType }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Delivery approach", value: servicePackage.delivery }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sm:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Deliverables", value: servicePackage.deliverables }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sm:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Acceptance criteria", value: servicePackage.acceptance }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sm:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Support terms", value: servicePackage.support }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sm:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Scope exclusions", value: servicePackage.exclusions }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "contract-section", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xs font-bold uppercase tracking-[0.16em] text-slate-400", children: "3. Customer responsibilities and acceptance" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid gap-4 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 p-5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400", children: "Customer provides" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm leading-6 text-slate-600", children: "Accurate requirements, timely decisions, access credentials where required, relevant content or data, and a suitable environment for testing or deployment." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 p-5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400", children: "Acceptance process" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm leading-6 text-slate-600", children: servicePackage.acceptance })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "contract-section", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xs font-bold uppercase tracking-[0.16em] text-slate-400", children: "4. Customer acknowledgement" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950", children: [
              "I confirm that I am voluntarily authorizing this payment to ",
              COMPANY_NAME,
              " for the IT service scope described in this agreement. I understand that the service may be in progress or scheduled for delivery, and that the payment record does not by itself confirm completion or acceptance of every deliverable. I acknowledge that the payment details provided are accurate and agree to the applicable payment compliance requirements."
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "contract-section contract-terms", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xs font-bold uppercase tracking-[0.16em] text-slate-400", children: "5. Commercial and recordkeeping terms" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-3 text-sm leading-6 text-slate-600", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "The customer confirms that the payment described in this agreement is authorized by them and is being made voluntarily for the service scope identified above." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "The service package, schedule, and deliverables above describe the expected scope at the time of payment. The estimated work days are business planning estimates and may be adjusted by written agreement when requirements, approvals, access, or third-party dependencies change." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Work begins after the customer provides the required information, access, approvals, and content. Any material change in requirements may require a revised quotation or separate statement of work before additional work is started." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Acceptance of the completed service is based on the agreed requirements and acceptance criteria. A payment confirmation is evidence of the transaction only and is not a warranty that all work has been completed, accepted, or delivered without outstanding dependencies." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "The transaction record, payment status, and timestamps shown in this document are generated from the SwiftPay system and should be retained with any supporting payment evidence." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "This document records the payment and acknowledgement electronically. It does not replace a separate invoice, quotation, statement of work, service agreement, receipt, or legally required tax document. If those documents conflict, the parties should resolve the conflict in writing before work proceeds." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "The customer is solely responsible for the legality, source, authorization, and intended use of the payment and for any fraud, deception, unauthorized activity, or other unlawful conduct in which the customer is involved. To the extent permitted by applicable law, DRL TECHS. COMPUTER SOFTWARE TRADING is not responsible or liable for such conduct or for losses arising from the customer's fraudulent or unlawful activity." })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "contract-section grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Customer name", value: transaction.customer_name || "Not provided" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Customer email", value: transaction.customer_email || "Not provided" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Sender name", value: transaction.sender_name || "Not provided" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Detail, { label: "Sender bank", value: transaction.sender_bank || "Not provided" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "contract-section grid gap-8 border-t border-slate-200 pt-8 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SignatureBlock, { label: "Customer acknowledgement", name: transaction.customer_name || "Customer" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              SignatureBlock,
              {
                label: "Merchant signatory",
                name: MERCHANT_SIGNATORY,
                subtitle: `Owner, ${COMPANY_NAME}`,
                signatureImage: "/images/owner-signature.jpg"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { className: "contract-section border-t border-slate-100 pt-6 text-xs leading-5 text-slate-500", children: [
            "Generated electronically by SwiftPay on ",
            generatedAt,
            ". This document is provided for administrative and legal recordkeeping and should be retained with the corresponding transaction and payment evidence."
          ] })
        ] })
      ] })
    ] })
  ] });
}
function Detail({ label, value, mono = false }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `mt-1.5 text-sm font-semibold text-slate-800 ${mono ? "break-all font-mono" : ""}`, children: value })
  ] });
}
function SignatureBlock({
  label,
  name,
  subtitle = "Electronic record / no handwritten signature required",
  signatureImage
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-28 rounded-xl border border-slate-200 p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400", children: label }),
    signatureImage && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 flex h-16 items-end border-b border-slate-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: signatureImage, alt: `${name} signature`, className: "mb-1 h-14 max-w-full object-contain object-left mix-blend-multiply" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${signatureImage ? "pt-2" : "mt-10 border-t border-slate-300 pt-2"}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-800", children: name }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: subtitle })
    ] })
  ] });
}
export {
  PaymentContract as default
};
