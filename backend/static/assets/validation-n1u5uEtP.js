import { a as reactExports } from "./router-vendor-C2eKMart.js";
import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { o as objectType, s as stringType, r as recordType, u as unknownType, b as booleanType } from "./form-vendor-pzQc3cjw.js";
var c = reactExports.forwardRef(({ as: e = `div`, ...t }, n) => jsxRuntimeExports.jsx(e, { ...t, ref: n }));
const l = `https://challenges.cloudflare.com/turnstile/v0/api.js`, u = `cf-turnstile-script`, f = `onloadTurnstileCallback`, p = (e) => !!document.getElementById(e), m = ({ render: e = `explicit`, onLoadCallbackName: t = f, scriptOptions: { nonce: n = ``, defer: r = true, async: i = true, id: a = ``, appendTo: o, onError: s, crossOrigin: c2 = `` } = {} }) => {
  let u2 = a || `cf-turnstile-script`;
  if (p(u2)) return;
  let d = document.createElement(`script`);
  d.id = u2, d.src = `${l}?onload=${t}&render=${e}`, !document.querySelector(`script[src="${d.src}"]`) && (d.defer = !!r, d.async = !!i, n && d.setAttribute(`nonce`, n), c2 && (d.crossOrigin = c2), s && (d.onerror = s, delete window[t]), (o === `body` ? document.body : document.getElementsByTagName(`head`)[0]).appendChild(d));
}, h = { normal: { width: 300, height: 65 }, compact: { width: 150, height: 140 }, invisible: { width: 0, height: 0, overflow: `hidden` }, flexible: { minWidth: 300, width: `100%`, height: 65 }, interactionOnly: { width: `fit-content`, height: `auto`, display: `flex` } };
function g(e) {
  if (e !== `invisible` && e !== `interactionOnly`) return e;
}
function _(e = u) {
  let [t, r] = reactExports.useState(false);
  return reactExports.useEffect(() => {
    let t2 = () => {
      p(e) && r(true);
    }, n = new MutationObserver(t2);
    return n.observe(document, { childList: true, subtree: true }), t2(), () => {
      n.disconnect();
    };
  }, [e]), t;
}
let v = `unloaded`, y;
const b = new Promise((e, t) => {
  y = { resolve: e, reject: t }, v === `ready` && e(void 0);
}), x = (e = f) => (v === `unloaded` && (v = `loading`, window[e] = () => {
  y.resolve(), v = `ready`, delete window[e];
}), b), S = reactExports.forwardRef((e, l2) => {
  let { scriptOptions: u2, options: d = {}, siteKey: f2, onWidgetLoad: p2, onSuccess: y2, onExpire: b2, onError: S2, onBeforeInteractive: C, onAfterInteractive: w, onUnsupported: T, onTimeout: E, onLoadScript: D, id: O, style: k, as: A = `div`, injectScript: j = true, rerenderOnCallbackChange: M = false, ...N } = e, P = d.size, F = reactExports.useCallback(() => P === void 0 ? {} : d.execution === `execute` ? h.invisible : d.appearance === `interaction-only` ? h.interactionOnly : h[P], [d.execution, P, d.appearance]), [I, L] = reactExports.useState(F()), R = reactExports.useRef(null), [z, B] = reactExports.useState(false), V = reactExports.useRef(void 0), H = reactExports.useRef(false), U = O || `cf-turnstile`, W = reactExports.useRef({ onSuccess: y2, onError: S2, onExpire: b2, onBeforeInteractive: C, onAfterInteractive: w, onUnsupported: T, onTimeout: E });
  reactExports.useEffect(() => {
    M || (W.current = { onSuccess: y2, onError: S2, onExpire: b2, onBeforeInteractive: C, onAfterInteractive: w, onUnsupported: T, onTimeout: E });
  });
  let G = (u2 == null ? void 0 : u2.id) || `cf-turnstile-script`, K = _(G), q = (u2 == null ? void 0 : u2.onLoadCallbackName) || `onloadTurnstileCallback`, J = d.appearance || `always`, Y = reactExports.useMemo(() => ({ sitekey: f2, action: d.action, cData: d.cData, theme: d.theme || `auto`, language: d.language || `auto`, tabindex: d.tabIndex, "response-field": d.responseField, "response-field-name": d.responseFieldName, size: g(P), retry: d.retry || `auto`, "retry-interval": d.retryInterval || 8e3, "refresh-expired": d.refreshExpired || `auto`, "refresh-timeout": d.refreshTimeout || `auto`, execution: d.execution || `render`, appearance: d.appearance || `always`, "feedback-enabled": d.feedbackEnabled ?? true, callback: (e2) => {
    var _a, _b;
    H.current = true, M ? y2 == null ? void 0 : y2(e2) : (_b = (_a = W.current).onSuccess) == null ? void 0 : _b.call(_a, e2);
  }, "error-callback": M ? S2 : (...e2) => {
    var _a, _b;
    return (_b = (_a = W.current).onError) == null ? void 0 : _b.call(_a, ...e2);
  }, "expired-callback": M ? b2 : (...e2) => {
    var _a, _b;
    return (_b = (_a = W.current).onExpire) == null ? void 0 : _b.call(_a, ...e2);
  }, "before-interactive-callback": M ? C : (...e2) => {
    var _a, _b;
    return (_b = (_a = W.current).onBeforeInteractive) == null ? void 0 : _b.call(_a, ...e2);
  }, "after-interactive-callback": M ? w : (...e2) => {
    var _a, _b;
    return (_b = (_a = W.current).onAfterInteractive) == null ? void 0 : _b.call(_a, ...e2);
  }, "unsupported-callback": M ? T : (...e2) => {
    var _a, _b;
    return (_b = (_a = W.current).onUnsupported) == null ? void 0 : _b.call(_a, ...e2);
  }, "timeout-callback": M ? E : (...e2) => {
    var _a, _b;
    return (_b = (_a = W.current).onTimeout) == null ? void 0 : _b.call(_a, ...e2);
  } }), [d.action, d.appearance, d.cData, d.execution, d.language, d.refreshExpired, d.responseField, d.responseFieldName, d.retry, d.retryInterval, d.tabIndex, d.theme, d.feedbackEnabled, d.refreshTimeout, f2, P, M, M ? y2 : null, M ? S2 : null, M ? b2 : null, M ? C : null, M ? w : null, M ? T : null, M ? E : null]), X = reactExports.useCallback(() => typeof window < `u` && !!window.turnstile, []);
  return reactExports.useEffect(function() {
    j && !z && (x(q), m({ onLoadCallbackName: q, scriptOptions: { ...u2, id: G } }));
  }, [j, z, u2, G, q]), reactExports.useEffect(function() {
    v !== `ready` && x(q).then(() => B(true)).catch(console.error);
  }, [q]), reactExports.useEffect(function() {
    if (!R.current || !z) return;
    let e2 = false;
    return (async () => {
      e2 || !R.current || (V.current = window.turnstile.render(R.current, Y), V.current && (p2 == null ? void 0 : p2(V.current)));
    })(), () => {
      e2 = true, V.current && (window.turnstile.remove(V.current), H.current = false);
    };
  }, [U, z, Y]), reactExports.useImperativeHandle(l2, () => {
    let { turnstile: e2 } = window;
    return { getResponse() {
      if (!(e2 == null ? void 0 : e2.getResponse) || !V.current || !X()) {
        console.warn(`Turnstile has not been loaded`);
        return;
      }
      return e2.getResponse(V.current);
    }, async getResponsePromise(e3 = 3e4, t = 100) {
      return new Promise((n, r) => {
        let i, a = async () => {
          if (H.current && window.turnstile && V.current) try {
            let e4 = window.turnstile.getResponse(V.current);
            return i && clearTimeout(i), e4 ? n(e4) : r(Error(`No response received`));
          } catch (e4) {
            return i && clearTimeout(i), console.warn(`Failed to get response`, e4), r(Error(`Failed to get response`));
          }
          i || (i = setTimeout(() => {
            i && clearTimeout(i), r(Error(`Timeout`));
          }, e3)), await new Promise((e4) => setTimeout(e4, t)), await a();
        };
        a();
      });
    }, reset() {
      if (!(e2 == null ? void 0 : e2.reset) || !V.current || !X()) {
        console.warn(`Turnstile has not been loaded`);
        return;
      }
      d.execution === `execute` && L(h.invisible);
      try {
        H.current = false, e2.reset(V.current);
      } catch (e3) {
        console.warn(`Failed to reset Turnstile widget ${V.current}`, e3);
      }
    }, remove() {
      if (!(e2 == null ? void 0 : e2.remove) || !V.current || !X()) {
        console.warn(`Turnstile has not been loaded`);
        return;
      }
      L(h.invisible), H.current = false, e2.remove(V.current), V.current = null;
    }, render() {
      if (!(e2 == null ? void 0 : e2.render) || !R.current || !X() || V.current) {
        console.warn(`Turnstile has not been loaded or container not found`);
        return;
      }
      let t = e2.render(R.current, Y);
      return V.current = t, V.current && (p2 == null ? void 0 : p2(V.current)), d.execution !== `execute` && L(P ? h[P] : {}), t;
    }, execute() {
      if (d.execution !== `execute`) {
        console.warn(`Execution mode is not set to "execute"`);
        return;
      }
      if (!(e2 == null ? void 0 : e2.execute) || !R.current || !V.current || !X()) {
        console.warn(`Turnstile has not been loaded or container not found`);
        return;
      }
      e2.execute(R.current), L(P ? h[P] : {});
    }, isExpired() {
      return !(e2 == null ? void 0 : e2.isExpired) || !V.current || !X() ? (console.warn(`Turnstile has not been loaded`), false) : e2.isExpired(V.current);
    } };
  }, [V, d.execution, P, Y, R, X, z, p2]), reactExports.useEffect(() => {
    if (z || !K) return;
    if (window.turnstile) {
      B(true);
      return;
    }
    let e2 = setInterval(() => {
      window.turnstile && (B(true), clearInterval(e2));
    }, 50);
    return () => {
      clearInterval(e2);
    };
  }, [z, K]), reactExports.useEffect(() => {
    L(F());
  }, [d.execution, P, J]), reactExports.useEffect(() => {
    !K || typeof D != `function` || D();
  }, [K]), jsxRuntimeExports.jsx(c, { ref: R, as: A, id: U, style: { ...I, ...k }, ...N });
});
S.displayName = `Turnstile`;
const koreanPhoneRegex = /^(?:\+?82|0)0?1[016789]\d{7,8}$/;
const validatePhoneNumber = (phone) => {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return koreanPhoneRegex.test(cleaned);
};
const registerSchema = objectType({
  full_name: stringType().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters").transform((val) => val.trim()),
  email: stringType().email("Please enter a valid email address").max(150, "Email must be less than 150 characters").transform((val) => val.trim().toLowerCase()),
  phone: stringType().refine(
    validatePhoneNumber,
    {
      message: "유효한 한국 휴대폰 번호를 입력하세요 (예: 01012345678 또는 +821012345678)"
    }
  ),
  business_name: stringType().min(1, "Company name is required").max(150, "Business name must be less than 150 characters").transform((val) => val.trim()),
  official_store_name: stringType().min(1, "Official store name is required").max(150, "Official store name must be less than 150 characters").transform((val) => val.trim()),
  address: stringType().max(255, "Address must be less than 255 characters").optional().transform((val) => (val == null ? void 0 : val.trim()) || null).nullable(),
  nda_accepted: booleanType().refine((value) => value === true, {
    message: "You must accept the NDA before submitting your registration."
  }),
  telegram_user_id: stringType().optional(),
  telegram_username: stringType().optional(),
  google_credential: stringType().optional(),
  telegram_auth: recordType(unknownType()).nullable().optional()
});
const loginSchema = objectType({
  email: stringType().min(1, "Email is required").email("Please enter a valid email address").transform((val) => val.trim().toLowerCase()),
  password: stringType().min(1, "Password is required").min(6, "Password must be at least 6 characters")
});
export {
  S,
  loginSchema as l,
  registerSchema as r
};
