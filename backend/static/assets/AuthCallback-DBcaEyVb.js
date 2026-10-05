import { j as jsxRuntimeExports } from "./query-vendor-C49KnSO9.js";
import { a as reactExports, N as Navigate } from "./router-vendor-N0qZPfHZ.js";
function AuthCallback() {
  reactExports.useEffect(() => {
    window.location.replace("/login");
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/login", replace: true });
}
export {
  AuthCallback as default
};
