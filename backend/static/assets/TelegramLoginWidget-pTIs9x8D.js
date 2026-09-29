import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { a as reactExports } from "./router-vendor-C2eKMart.js";
import { S as Send } from "./utils-vendor-HFbfdctU.js";
function TelegramLoginWidget({
  botName,
  onAuth,
  buttonSize = "large",
  cornerRadius = 12,
  requestAccess = "write",
  showUserPhoto = true
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
  }, [botName, buttonSize, cornerRadius, requestAccess]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "relative inline-flex h-11 w-11 items-center justify-center",
      title: "Continue with Telegram",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            "aria-hidden": "true",
            className: "pointer-events-none flex h-11 w-11 items-center justify-center rounded-full border border-[#111111] bg-transparent text-[#111111] shadow-sm transition-transform hover:scale-105",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 20, fill: "none", stroke: "currentColor", strokeWidth: 2.2 })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            ref: containerRef,
            "aria-label": "Continue with Telegram",
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
