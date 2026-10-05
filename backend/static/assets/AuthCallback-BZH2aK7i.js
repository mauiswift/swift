import { j as jsxRuntimeExports } from "./query-vendor-DbSHy-Pt.js";
import { a as reactExports, N as Navigate } from "./router-vendor-BtBWUifS.js";
function AuthCallback() {
  reactExports.useEffect(() => {
    window.location.replace("/login");
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/login", replace: true });
}
export {
  AuthCallback as default
};
