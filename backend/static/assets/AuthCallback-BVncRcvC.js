import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { a as reactExports, N as Navigate } from "./router-vendor-C2eKMart.js";
function AuthCallback() {
  reactExports.useEffect(() => {
    window.location.replace("/login");
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/login", replace: true });
}
export {
  AuthCallback as default
};
