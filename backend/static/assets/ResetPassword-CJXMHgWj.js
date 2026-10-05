import { j as jsxRuntimeExports } from "./query-vendor-C49KnSO9.js";
import { j as useSearchParams, a as reactExports, L as Link } from "./router-vendor-N0qZPfHZ.js";
function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = reactExports.useState("");
  const [confirm, setConfirm] = reactExports.useState("");
  const [message, setMessage] = reactExports.useState("");
  const [error, setError] = reactExports.useState("");
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/v1/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.get("token") || "", new_password: password, confirm_password: confirm })
    });
    const data = await response.json();
    if (!response.ok) setError((data == null ? void 0 : data.detail) || "Unable to reset password.");
    else setMessage(data.message);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex min-h-screen items-center justify-center bg-slate-50 px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "w-full max-w-md rounded-xl bg-white p-8 shadow", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-slate-900", children: "Reset password" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "mt-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "w-full rounded border p-3", type: "password", required: true, minLength: 8, value: password, onChange: (e) => setPassword(e.target.value), placeholder: "New password" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "w-full rounded border p-3", type: "password", required: true, minLength: 8, value: confirm, onChange: (e) => setConfirm(e.target.value), placeholder: "Confirm new password" }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-600", children: error }),
      message && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-green-700", children: message }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "w-full rounded bg-slate-900 p-3 font-medium text-white", children: "Reset password" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { className: "mt-5 block text-center text-sm text-slate-600 underline", to: "/login", children: "Back to sign in" })
  ] }) });
}
export {
  ResetPassword as default
};
