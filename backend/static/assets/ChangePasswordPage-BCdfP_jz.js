import { j as jsxRuntimeExports } from "./query-vendor-C00BCiYd.js";
import { f as useNavigate, a as reactExports, N as Navigate } from "./router-vendor-ugVG8BWW.js";
import { d as cn, u as useAuth, I as Input, e as Button } from "./index-BZw-Kh4U.js";
import "./ui-vendor-D6MKKEiL.js";
import "./utils-vendor-DtbvWOtt.js";
function FormField({
  label,
  error,
  helperText,
  required,
  children,
  className,
  labelClassName
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("flex flex-col gap-2", className), children: [
    label && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: cn("text-sm font-semibold text-slate-700", labelClassName), children: [
      label,
      required && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 text-red-600 font-semibold", children: "*" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative", children }),
    error ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-red-600 font-medium flex items-center gap-1", children: [
      "⚠ ",
      error
    ] }) : helperText ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: helperText }) : null
  ] });
}
function Alert({
  type,
  title,
  message,
  action,
  onClose,
  className
}) {
  const typeClasses = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    error: "bg-red-50 border-red-200 text-red-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    info: "bg-blue-50 border-blue-200 text-blue-900"
  };
  const icons = {
    success: "✓",
    error: "!",
    warning: "⚠",
    info: "ℹ"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: cn(
        "rounded-lg border p-4 flex gap-4 items-start",
        typeClasses[type],
        className
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 text-lg font-semibold mt-0.5", children: icons[type] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          title && /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold mb-1", children: title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm opacity-90", children: message }),
          action && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3", children: action })
        ] }),
        onClose && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: onClose,
            className: "flex-shrink-0 text-lg opacity-60 hover:opacity-100 transition-opacity",
            children: "×"
          }
        )
      ]
    }
  );
}
const SPACING = {
  // Responsive padding pattern
  responsive: {
    contentPadding: "p-3 sm:p-4 md:p-6"
  }
};
function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, loading, changePassword, logout } = useAuth();
  const [newPassword, setNewPassword] = reactExports.useState("");
  const [confirmPassword, setConfirmPassword] = reactExports.useState("");
  const [error, setError] = reactExports.useState(null);
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [pageError, setPageError] = reactExports.useState(null);
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-600 text-lg font-medium", children: "Loading your account..." })
    ] }) });
  }
  if (!user) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/login", replace: true });
  }
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setPageError(null);
    if (!newPassword.trim() || newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      setSubmitting(true);
      await changePassword(newPassword, confirmPassword);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unable to update your password.";
      console.error("Password change error:", errorMsg);
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50 ${SPACING.responsive.contentPadding}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-wider text-blue-600", children: "🔒 Security" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-3 text-2xl font-bold text-slate-900", children: "Change your password" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-600 leading-relaxed", children: "For your protection, this page appears after every successful login until the password has been changed successfully." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: SPACING.responsive.contentPadding, children: [
      pageError && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Alert,
        {
          type: "error",
          title: "System Error",
          message: pageError,
          onClose: () => setPageError(null),
          className: "mb-4"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormField,
          {
            label: "New Password",
            required: true,
            error: error || void 0,
            helperText: "At least 8 characters for security",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "password",
                value: newPassword,
                onChange: (e) => setNewPassword(e.target.value),
                placeholder: "Enter your new password",
                disabled: submitting,
                autoComplete: "new-password"
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormField,
          {
            label: "Confirm Password",
            required: true,
            error: error ? error : void 0,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "password",
                value: confirmPassword,
                onChange: (e) => setConfirmPassword(e.target.value),
                placeholder: "Re-enter your new password",
                disabled: submitting,
                autoComplete: "new-password"
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "submit",
            variant: "primary",
            size: "lg",
            disabled: submitting || !newPassword || !confirmPassword,
            className: "w-full whitespace-normal text-center leading-tight py-3",
            children: submitting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Updating password..." })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Update password and continue" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 pt-6 border-t border-slate-200 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => {
            logout().then(() => navigate("/login", { replace: true }));
          },
          className: "text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded px-2 py-1",
          children: "Log out instead"
        }
      ) })
    ] })
  ] }) });
}
export {
  ChangePasswordPage as default
};
