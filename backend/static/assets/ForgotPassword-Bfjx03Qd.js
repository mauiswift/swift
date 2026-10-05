import { j as jsxRuntimeExports } from "./query-vendor-C00BCiYd.js";
import { a as reactExports, L as Link } from "./router-vendor-ugVG8BWW.js";
function ForgotPassword() {
  const [email, setEmail] = reactExports.useState("");
  const [message, setMessage] = reactExports.useState("");
  const [error, setError] = reactExports.useState("");
  const [submitting, setSubmitting] = reactExports.useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error((data == null ? void 0 : data.detail) || "Unable to request a password reset.");
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request a password reset.");
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex min-h-screen items-center justify-center bg-slate-50 px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "w-full max-w-md rounded-xl bg-white p-8 shadow", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-slate-900", children: "Forgot password?" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-600", children: "Enter your account email and we will send a reset link." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "mt-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "w-full rounded border p-3", type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@example.com" }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-600", children: error }),
      message && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-green-700", children: message }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "w-full rounded bg-slate-900 p-3 font-medium text-white disabled:opacity-50", disabled: submitting, children: submitting ? "Sending…" : "Send reset link" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { className: "mt-5 block text-center text-sm text-slate-600 underline", to: "/login", children: "Back to sign in" })
  ] }) });
}
export {
  ForgotPassword as default
};
