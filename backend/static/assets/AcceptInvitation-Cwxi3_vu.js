import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { h as useSearchParams, a as reactExports, L as Link } from "./router-vendor-C2eKMart.js";
import { e as Button } from "./index-DrbT3WcF.js";
import { I as Input } from "./input-CSDd88Rr.js";
import { z as LoaderCircle, p as CircleAlert, J as CircleCheck, aI as Users, d as ShieldCheck } from "./utils-vendor-BFordG78.js";
import "./ui-vendor-DsSOT9J9.js";
function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = reactExports.useState({ status: "loading" });
  const token = searchParams.get("token");
  reactExports.useEffect(() => {
    if (!token) {
      setPage({ status: "error", message: "This invitation link is missing its token." });
      return;
    }
    let cancelled = false;
    fetch(`/api/v1/team/invitations/${encodeURIComponent(token)}`).then(async (response) => {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.detail || "This invitation is unavailable.");
      return body;
    }).then((body) => {
      if (!cancelled) setPage({ status: "ready", invitation: body.invitation });
    }).catch((error) => {
      if (!cancelled) setPage({ status: "error", message: error instanceof Error ? error.message : "This invitation is unavailable." });
    });
    return () => {
      cancelled = true;
    };
  }, [token]);
  if (page.status === "loading") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(InvitationShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mx-auto h-10 w-10 animate-spin text-primary" }) });
  }
  if (page.status === "error") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(InvitationShell, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mx-auto h-12 w-12 text-red-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-5 text-2xl font-semibold text-foreground", children: "Invitation unavailable" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-muted-foreground", children: page.message }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", children: "Return home" }) })
    ] });
  }
  const { invitation } = page;
  if (page.status === "complete") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(InvitationShell, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mx-auto h-12 w-12 text-emerald-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-5 text-2xl font-semibold text-foreground", children: "Account created" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 text-muted-foreground", children: [
        "Your team access is ready. Sign in with ",
        invitation.email,
        " and the password you created."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, className: "mt-6 w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", children: "Continue to sign in" }) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(InvitationShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mx-auto h-12 w-12 text-emerald-500" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-5 text-2xl font-semibold text-foreground", children: "Create your account" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 text-muted-foreground", children: [
      "You have been invited as ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: invitation.role }),
      invitation.organization_name ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        " to ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: invitation.organization_name })
      ] }) : null,
      "."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(InvitationForm, { token: token || "", invitation, onComplete: (value) => setPage({ status: "complete", invitation: value }) })
  ] });
}
function InvitationForm({ token, invitation, onComplete }) {
  const [password, setPassword] = reactExports.useState("");
  const [confirmPassword, setConfirmPassword] = reactExports.useState("");
  const [fullName, setFullName] = reactExports.useState("");
  const [error, setError] = reactExports.useState("");
  const [submitting, setSubmitting] = reactExports.useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/team/invitations/accept/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirm_password: confirmPassword, full_name: fullName })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.detail || "Unable to create your account.");
      onComplete(body.invitation || invitation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "mt-6 space-y-4 text-left", onSubmit: submit, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
      "Create your password to activate access for ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: invitation.email }),
      "."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: fullName, onChange: (event) => setFullName(event.target.value), placeholder: "Full name (optional)" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { required: true, minLength: 8, type: "password", value: password, onChange: (event) => setPassword(event.target.value), placeholder: "Password (at least 8 characters)" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { required: true, minLength: 8, type: "password", value: confirmPassword, onChange: (event) => setConfirmPassword(event.target.value), placeholder: "Confirm password" }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-600", children: error }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: submitting, className: "w-full", children: submitting ? "Creating account..." : "Create account" })
  ] });
}
function InvitationShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#e2e8f0,_#f8fafc_45%)] px-4 py-8 sm:px-6 sm:py-12 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-900 px-6 py-5 text-left", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-lg font-semibold text-white", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-5 w-5" }),
        " SwiftPay"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-300", children: "Secure team access" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 sm:p-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 flex justify-center text-slate-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-5 w-5" }) }),
      children
    ] })
  ] }) });
}
export {
  AcceptInvitation as default
};
