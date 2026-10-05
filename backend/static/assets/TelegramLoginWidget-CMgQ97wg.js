import { j as jsxRuntimeExports } from "./query-vendor-C49KnSO9.js";
import { a as reactExports } from "./router-vendor-N0qZPfHZ.js";
import { d as cn } from "./index-DVjJBirV.js";
import { S as Send } from "./utils-vendor-Bm5lXE_Q.js";
function TelegramLoginWidget({
  botName,
  onAuth,
  buttonSize = "large",
  cornerRadius = 12,
  requestAccess = "write",
  showUserPhoto = true,
  uiSize = "md",
  className,
  iconClassName,
  title,
  ariaLabel
}) {
  const containerRef = reactExports.useRef(null);
  const onAuthRef = reactExports.useRef(onAuth);
  onAuthRef.current = onAuth;
  reactExports.useEffect(() => {
    const handleTelegramAuth = (user) => onAuthRef.current(user);
    window.onTelegramAuth = handleTelegramAuth;
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", buttonSize);
    script.setAttribute("data-radius", cornerRadius.toString());
    script.setAttribute("data-request-access", requestAccess);
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-userpic", showUserPhoto ? "true" : "false");
    script.async = true;
    const container = containerRef.current;
    if (container) {
      container.appendChild(script);
    }
    return () => {
      if (container) {
        container.innerHTML = "";
      }
      if (window.onTelegramAuth === handleTelegramAuth) {
        delete window.onTelegramAuth;
      }
    };
  }, [botName, buttonSize, cornerRadius, requestAccess, showUserPhoto]);
  const resolvedLabel = ariaLabel ?? title ?? "Continue with Telegram";
  const sizeClassName = uiSize === "sm" ? "h-10 w-10" : "h-11 w-11";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: cn("group relative inline-flex items-center justify-center", sizeClassName, className),
      title: title ?? "Continue with Telegram",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            "aria-hidden": "true",
            className: cn(
              "pointer-events-none flex h-full w-full items-center justify-center rounded-full border border-[#111111] bg-transparent text-[#111111] shadow-sm transition-transform group-hover:scale-105 group-active:scale-[0.98]",
              iconClassName
            ),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 20, fill: "none", stroke: "currentColor", strokeWidth: 2.2 })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            ref: containerRef,
            "aria-label": resolvedLabel,
            className: "absolute inset-0 z-10 overflow-hidden opacity-0"
          }
        )
      ]
    }
  );
}
export {
  TelegramLoginWidget as T
};
