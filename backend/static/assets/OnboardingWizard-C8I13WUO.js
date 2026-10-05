import { j as jsxRuntimeExports } from "./query-vendor-C00BCiYd.js";
import { f as useNavigate, a as reactExports, L as Link } from "./router-vendor-ugVG8BWW.js";
import { e as Button, w as Badge, I as Input, T as Textarea, d as cn, k as Label } from "./index-CCyidPsK.js";
import { J as CircleCheck, d as ShieldCheck, Y as Building2, v as ChevronLeft, u as ChevronRight, aN as FileUp } from "./utils-vendor-DtbvWOtt.js";
import "./ui-vendor-D6MKKEiL.js";
const initialDirector = {
  name: "",
  nationality: "PH",
  dateOfBirth: "",
  idType: "Passport",
  idNumber: "",
  ownershipPercent: ""
};
const INITIAL_STATE = {
  businessLegalName: "",
  tradingName: "",
  businessType: "Corporation",
  industry: "",
  registrationNumber: "",
  taxId: "",
  website: "",
  addressLine1: "",
  city: "",
  province: "",
  postalCode: "",
  country: "Philippines",
  expectedMonthlyVolume: "",
  avgTicketSize: "",
  settlementCurrency: "PHP",
  primaryContactName: "",
  primaryContactEmail: "",
  primaryContactPhone: "",
  directors: [{ ...initialDirector }],
  documents: { business: [], directors: [], proof_of_address: [], banking: [] },
  bankProvider: "maya",
  bankAccountName: "",
  bankAccountNumber: "",
  bankBranch: "",
  acknowledge: false
};
function Field({
  label,
  hint,
  required,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-xs font-semibold uppercase tracking-wider text-slate-200", children: [
        label,
        required ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 text-amber-300", children: "*" }) : null
      ] }),
      hint ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-slate-400", children: hint }) : null
    ] }),
    children
  ] });
}
function DropZone({
  title,
  description,
  files,
  onFiles
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "group rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition-colors hover:bg-slate-950",
      onDragOver: (e) => {
        e.preventDefault();
      },
      onDrop: (e) => {
        e.preventDefault();
        const next = Array.from(e.dataTransfer.files || []);
        if (next.length) onFiles([...files, ...next]);
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-white", children: title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-5 text-slate-400", children: description })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-200 ring-1 ring-slate-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileUp, { className: "h-5 w-5" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-slate-100", children: [
            "Upload",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "file",
                multiple: true,
                className: "hidden",
                onChange: (e) => {
                  const next = Array.from(e.target.files || []);
                  if (next.length) onFiles([...files, ...next]);
                  e.currentTarget.value = "";
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-slate-400", children: [
            files.length,
            " file(s)"
          ] })
        ] }),
        files.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-2", children: [
          files.slice(0, 4).map((file, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-xl bg-slate-900/70 px-3 py-2 ring-1 ring-slate-800", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-xs font-medium text-slate-200", children: file.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "text-[11px] font-semibold text-rose-300 hover:text-rose-200",
                onClick: () => onFiles(files.filter((_f, i) => i !== idx)),
                children: "Remove"
              }
            )
          ] }, `${file.name}-${idx}`)),
          files.length > 4 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-slate-500", children: [
            "+ ",
            files.length - 4,
            " more"
          ] })
        ] })
      ]
    }
  );
}
function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = reactExports.useState(1);
  const [state, setState] = reactExports.useState(INITIAL_STATE);
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [submitted, setSubmitted] = reactExports.useState(false);
  const canContinue = reactExports.useMemo(() => {
    if (step === 1) {
      return Boolean(
        state.businessLegalName.trim() && state.tradingName.trim() && state.primaryContactName.trim() && state.primaryContactEmail.trim() && state.primaryContactPhone.trim() && state.addressLine1.trim() && state.city.trim() && state.province.trim()
      );
    }
    if (step === 2) {
      return state.directors.every((d) => d.name.trim() && d.idNumber.trim());
    }
    if (step === 3) {
      return true;
    }
    if (step === 4) {
      return Boolean(state.bankAccountName.trim() && state.bankAccountNumber.trim());
    }
    return state.acknowledge;
  }, [state, step]);
  const set = (key, value) => {
    setState((prev2) => ({ ...prev2, [key]: value }));
  };
  const totalSteps = 5;
  const progress = step / totalSteps * 100;
  const next = () => setStep((s) => Math.min(5, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));
  const submit = async () => {
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };
  if (submitted) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-slate-950 px-4 py-10 text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-3xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-[28px] border border-slate-800 bg-slate-950/60 p-8 shadow-[0_24px_60px_rgba(0,0,0,0.35)]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-6 w-6" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-slate-400", children: "KYB/KYC submitted" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-2 text-2xl font-semibold tracking-tight", children: "Application received" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm leading-7 text-slate-300", children: "This demo wizard captures KYB/KYC data, documents, and bank details. In a production deployment, these payloads are validated and stored server-side." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => navigate("/login"), className: "rounded-xl bg-white text-slate-950 hover:bg-slate-100", children: "Back to login" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => {
            setSubmitted(false);
            setStep(1);
            setState(INITIAL_STATE);
          }, className: "rounded-xl border-slate-700 text-slate-100 hover:bg-slate-900", children: "Start new" })
        ] })
      ] })
    ] }) }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-slate-950 px-4 py-10 text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "rounded-[28px] border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-950/60 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400", children: "SwiftPay Philippines" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-2 text-2xl font-semibold tracking-tight", children: "KYB/KYC onboarding wizard" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm leading-7 text-slate-300", children: "Guided verification for BSP-ready merchant onboarding. Upload docs, link settlement accounts, and submit for review." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "mr-1 h-3.5 w-3.5" }),
            "PCI-DSS 4.0"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "border border-sky-500/30 bg-sky-500/10 text-sky-200", children: "BSP compliance" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "border border-slate-700 bg-slate-900 text-slate-200", children: "Dark fintech theme" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-[11px] text-slate-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Step ",
            step,
            " / ",
            totalSteps
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            Math.round(progress),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-900 ring-1 ring-slate-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full rounded-full bg-emerald-500 transition-all", style: { width: `${progress}%` } }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-400", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/register", className: "font-semibold text-slate-200 hover:text-white", children: "Simple registration" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-700", children: "·" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: "font-semibold text-slate-200 hover:text-white", children: "Sign in" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "grid grid-cols-1 gap-6 lg:grid-cols-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "lg:col-span-8 rounded-[28px] border border-slate-800 bg-slate-950/60 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.25)]", children: [
        step === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400", children: "Step 1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-1 text-lg font-semibold", children: "Business info (16 fields)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-300", children: "Capture legal entity, trading profile, and settlement preferences." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-5 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Business legal name", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.businessLegalName, onChange: (e) => set("businessLegalName", e.target.value) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Trading / store name", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.tradingName, onChange: (e) => set("tradingName", e.target.value) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Business type", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.businessType, onChange: (e) => set("businessType", e.target.value) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Industry", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.industry, onChange: (e) => set("industry", e.target.value), placeholder: "e.g. Retail, F&B, Logistics" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Registration number", hint: "SEC/DTI", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.registrationNumber, onChange: (e) => set("registrationNumber", e.target.value) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Tax ID (TIN)", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.taxId, onChange: (e) => set("taxId", e.target.value) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Website", hint: "Optional", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.website, onChange: (e) => set("website", e.target.value), placeholder: "https://…" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Settlement currency", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.settlementCurrency, onChange: (e) => set("settlementCurrency", e.target.value) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Expected monthly volume", hint: "PHP", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.expectedMonthlyVolume, onChange: (e) => set("expectedMonthlyVolume", e.target.value), placeholder: "e.g. 1500000" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Average ticket size", hint: "PHP", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.avgTicketSize, onChange: (e) => set("avgTicketSize", e.target.value), placeholder: "e.g. 850" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-5 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Address line 1", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.addressLine1, onChange: (e) => set("addressLine1", e.target.value) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "City", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.city, onChange: (e) => set("city", e.target.value) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Province", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.province, onChange: (e) => set("province", e.target.value) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Postal code", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.postalCode, onChange: (e) => set("postalCode", e.target.value) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Country", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.country, onChange: (e) => set("country", e.target.value) }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-5 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Primary contact name", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.primaryContactName, onChange: (e) => set("primaryContactName", e.target.value) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Primary contact email", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "email", className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.primaryContactEmail, onChange: (e) => set("primaryContactEmail", e.target.value) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Primary contact phone", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.primaryContactPhone, onChange: (e) => set("primaryContactPhone", e.target.value), placeholder: "+63…" }) })
          ] })
        ] }),
        step === 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400", children: "Step 2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-1 text-lg font-semibold", children: "Directors / beneficial owners" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-300", children: "Add directors with dynamic rows and ownership information." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: state.directors.map((director, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-800 bg-slate-950 p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-semibold text-white", children: [
                "Director #",
                index + 1
              ] }),
              state.directors.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  className: "h-9 rounded-xl text-rose-200 hover:bg-rose-500/10 hover:text-rose-100",
                  onClick: () => set("directors", state.directors.filter((_d, i) => i !== index)),
                  children: "Remove"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Full name", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: director.name, onChange: (e) => {
                const next2 = [...state.directors];
                next2[index] = { ...next2[index], name: e.target.value };
                set("directors", next2);
              } }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Nationality", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: director.nationality, onChange: (e) => {
                const next2 = [...state.directors];
                next2[index] = { ...next2[index], nationality: e.target.value };
                set("directors", next2);
              } }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Date of birth", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: director.dateOfBirth, onChange: (e) => {
                const next2 = [...state.directors];
                next2[index] = { ...next2[index], dateOfBirth: e.target.value };
                set("directors", next2);
              } }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "ID type", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: director.idType, onChange: (e) => {
                const next2 = [...state.directors];
                next2[index] = { ...next2[index], idType: e.target.value };
                set("directors", next2);
              } }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "ID number", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: director.idNumber, onChange: (e) => {
                const next2 = [...state.directors];
                next2[index] = { ...next2[index], idNumber: e.target.value };
                set("directors", next2);
              } }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Ownership %", hint: "Optional", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: director.ownershipPercent, onChange: (e) => {
                const next2 = [...state.directors];
                next2[index] = { ...next2[index], ownershipPercent: e.target.value };
                set("directors", next2);
              }, placeholder: "e.g. 25" }) })
            ] })
          ] }, index)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              className: "rounded-xl border-slate-700 text-slate-100 hover:bg-slate-900",
              onClick: () => set("directors", [...state.directors, { ...initialDirector }]),
              children: "Add director"
            }
          )
        ] }),
        step === 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400", children: "Step 3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-1 text-lg font-semibold", children: "Documents" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-300", children: "Drag-drop uploads for KYB/KYC review." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              DropZone,
              {
                title: "Business registration",
                description: "SEC / DTI certificate, articles of incorporation, business permits",
                files: state.documents.business,
                onFiles: (files) => set("documents", { ...state.documents, business: files })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              DropZone,
              {
                title: "Directors / IDs",
                description: "Government-issued IDs, selfie/face match where applicable",
                files: state.documents.directors,
                onFiles: (files) => set("documents", { ...state.documents, directors: files })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              DropZone,
              {
                title: "Proof of address",
                description: "Utility bill / lease contract (last 3 months)",
                files: state.documents.proof_of_address,
                onFiles: (files) => set("documents", { ...state.documents, proof_of_address: files })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              DropZone,
              {
                title: "Banking documents",
                description: "Bank statement / settlement account proof",
                files: state.documents.banking,
                onFiles: (files) => set("documents", { ...state.documents, banking: files })
              }
            )
          ] })
        ] }),
        step === 4 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400", children: "Step 4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-1 text-lg font-semibold", children: "Settlement account linking" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-300", children: "Link Maya Business or Security Bank for PHP settlements." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-5 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Provider", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800",
                value: state.bankProvider === "maya" ? "Maya Business" : "Security Bank",
                onChange: (e) => set("bankProvider", e.target.value.toLowerCase().includes("security") ? "security_bank" : "maya")
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Account name", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.bankAccountName, onChange: (e) => set("bankAccountName", e.target.value) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Account number", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.bankAccountNumber, onChange: (e) => set("bankAccountNumber", e.target.value) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Branch", hint: "Optional", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800", value: state.bankBranch, onChange: (e) => set("bankBranch", e.target.value) }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Settlement notes", hint: "Optional", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { className: "min-h-[120px] rounded-2xl bg-slate-950 text-white ring-1 ring-slate-800", placeholder: "e.g. preferred cut-off, payout schedule" }) })
        ] }),
        step === 5 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400", children: "Step 5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-1 text-lg font-semibold", children: "Review & submit" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-300", children: "Confirm details and submit for compliance review." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-800 bg-slate-950 p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-5 w-5" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-semibold text-white", children: state.tradingName || "—" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-xs text-slate-400", children: state.businessLegalName || "—" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "border border-slate-700 bg-slate-900 text-slate-200", children: state.settlementCurrency })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid grid-cols-1 gap-3 text-sm text-slate-200 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wider text-slate-400", children: "Contact" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-semibold", children: state.primaryContactName || "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-slate-400", children: [
                  state.primaryContactEmail || "—",
                  " · ",
                  state.primaryContactPhone || "—"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wider text-slate-400", children: "Address" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-300", children: state.addressLine1 || "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-slate-400", children: [
                  state.city || "—",
                  ", ",
                  state.province || "—",
                  " ",
                  state.postalCode || ""
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wider text-slate-400", children: "Directors" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-slate-300", children: [
                  state.directors.length,
                  " director(s)"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-400", children: "IDs required for all directors." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wider text-slate-400", children: "Documents" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-slate-300", children: [
                  Object.values(state.documents).reduce((sum, list) => sum + list.length, 0),
                  " file(s) uploaded"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-400", children: "Attach additional docs if needed." })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wider text-slate-400", children: "Settlement bank" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-slate-300", children: [
                state.bankProvider === "maya" ? "Maya Business" : "Security Bank",
                " · ",
                state.bankAccountName || "—",
                " · ",
                state.bankAccountNumber || "—"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: state.acknowledge,
                onChange: (e) => set("acknowledge", e.target.checked),
                className: "mt-1 h-4 w-4"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-300", children: "I confirm the information provided is accurate and authorize SwiftPay Philippines to perform KYB/KYC checks for BSP compliance." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "lg:col-span-4 space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-[28px] border border-slate-800 bg-slate-950/60 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.25)]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400", children: "Guidance" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm font-semibold text-white", children: "BSP-ready onboarding" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "mt-3 space-y-2 text-sm text-slate-300", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "leading-6", children: "- Upload clear scans (no screenshots) for faster review." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "leading-6", children: "- Directors must match business registration records." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "leading-6", children: "- Settlement accounts must be under the legal entity name." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-[28px] border border-slate-800 bg-slate-950/60 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.25)]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400", children: "Navigation" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                className: "h-11 rounded-xl border-slate-700 text-slate-100 hover:bg-slate-900",
                onClick: prev,
                disabled: step === 1,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "mr-2 h-4 w-4" }),
                  "Back"
                ]
              }
            ),
            step < 5 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                className: cn("h-11 rounded-xl bg-white text-slate-950 hover:bg-slate-100", !canContinue && "opacity-60"),
                onClick: next,
                disabled: !canContinue,
                children: [
                  "Continue",
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "ml-2 h-4 w-4" })
                ]
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                className: cn("h-11 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400", !canContinue && "opacity-60"),
                onClick: () => void submit(),
                disabled: !canContinue || submitting,
                children: submitting ? "Submitting…" : "Submit"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-4 text-xs text-slate-500", children: [
            "For a simpler flow, use ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/register", className: "font-semibold text-slate-300 hover:text-white", children: "/register" }),
            "."
          ] })
        ] })
      ] })
    ] })
  ] }) });
}
export {
  OnboardingWizard as default
};
