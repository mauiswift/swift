import { j as jsxRuntimeExports } from "./query-vendor-C00BCiYd.js";
import { a as reactExports, N as Navigate } from "./router-vendor-ugVG8BWW.js";
function AuthCallback() {
  reactExports.useEffect(() => {
    window.location.replace("/login");
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/login", replace: true });
}
export {
  AuthCallback as default
};
