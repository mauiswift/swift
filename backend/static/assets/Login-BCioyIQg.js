import{j as e}from"./query-vendor-Ee9vmuSY.js";import{u as X,e as Z,a as o,N as $,L as b}from"./router-vendor-CLWKjhGT.js";import{S as ee,l as ae}from"./validation-Bt88K1ee.js";import{u as te,a as ie,b as oe,S as re,c as ne,B as se}from"./index-BVAj61jH.js";import{T as le}from"./TelegramLoginWidget-CwP0d4PU.js";import{d as ce,ai as de}from"./utils-vendor-CIEtxE91.js";import"./form-vendor-s6rWhZD7.js";import"./ui-vendor-DcolUwNM.js";function G({height:p=28}){return e.jsx(se,{src:"/swiftpay-logo-black.svg",className:p===48?"h-12":"h-7"})}function ye(){const{user:p,login:B,loginWithTelegram:R,loginWithGoogle:v,loading:pe,error:g,platformBranding:k}=te(),{t:i,language:W}=ie(),n=W==="ko",f=X(),j=Z(),[u,N]=o.useState("email"),[F,y]=o.useState(!1),[m,r]=o.useState(null),[x,U]=o.useState(""),[S,_]=o.useState(""),[l,w]=o.useState(null),[q,E]=o.useState(!1),[z,P]=o.useState(!1),C="0x4AAAAAAD1UWg_mrK9TYmUm",D=void 0,[L,K]=o.useState(""),T=o.useRef(null),c=o.useRef(null),I=void 0,[h,Y]=o.useState(""),O=!l,V=a=>{E(!1),w(a)};if(o.useEffect(()=>{var a;(a=f.state)!=null&&a.sessionExpired&&(oe.error(n?"비활성 상태가 지속되어 세션이 만료되었습니다. 다시 로그인하세요.":"Your session expired due to inactivity. Please log in again."),j(f.pathname,{replace:!0,state:null}))},[n,f.pathname,f.state,j]),o.useEffect(()=>{u==="password"&&setTimeout(()=>{var a;return(a=T.current)==null?void 0:a.focus()},40)},[u]),o.useEffect(()=>{let a=!1;return fetch("/api/v1/auth/google-config").then(async t=>{if(!t.ok)throw new Error("Google login is not configured");return t.json()}).then(t=>{!a&&(t!=null&&t.client_id)&&Y(String(t.client_id).trim())}).catch(()=>{}),()=>{a=!0}},[I]),o.useEffect(()=>{var d;if(!h||!c.current)return;const a=()=>{var A;!((A=window.google)!=null&&A.accounts.id)||!c.current||(c.current.replaceChildren(),window.google.accounts.id.initialize({client_id:h,callback:({credential:Q})=>{r(null),v(Q,l)}}),window.google.accounts.id.renderButton(c.current,{type:"icon",theme:"outline",size:"large",shape:"circle"}))};if((d=window.google)!=null&&d.accounts.id){a();return}const t=document.querySelector('script[src="https://accounts.google.com/gsi/client"]'),s=t||document.createElement("script");return t||(s.src="https://accounts.google.com/gsi/client",s.async=!0,s.defer=!0,document.head.appendChild(s)),s.addEventListener("load",a,{once:!0}),()=>s.removeEventListener("load",a)},[h,v,l]),o.useEffect(()=>{let a=!1;return fetch("/api/v1/auth/telegram-login-config").then(async t=>{if(!t.ok)throw new Error("Telegram login is not configured");return t.json()}).then(t=>{!a&&(t!=null&&t.bot_username)&&K(String(t.bot_username).replace(/^@/,"").trim())}).catch(()=>{}),()=>{a=!0}},[D]),p)return e.jsx($,{to:p.must_change_password?"/change-password":"/dashboard",replace:!0});const M=a=>{a.preventDefault(),r(null);const t=x.trim();if(!t||!t.includes("@")){r(i("enter_valid_email"));return}N("password")},H=async()=>{P(!0),r(null);try{await ne.loginWithPasskey(),window.location.assign("/dashboard")}catch(a){r(a instanceof Error?a.message:n?"패스키 로그인에 실패했습니다.":"Passkey login failed")}finally{P(!1)}},J=async a=>{var s;a.preventDefault();const t=ae.safeParse({email:x,password:S});if(!t.success){r(((s=t.error.issues[0])==null?void 0:s.message)||i("please_check_input"));return}y(!0),r(null);try{if(C&&!l){r(i("complete_verification")),y(!1);return}await B(t.data.email,t.data.password,l??void 0)}catch(d){r(d instanceof Error?d.message:i("login_failed"))}finally{y(!1)}};return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
        :root {
          --auth-bg: #f9f9f9;
          --auth-card: #ffffff;
          --text-100: #1a1a1a;
          --text-200: #666666;
          --border-color: #e2e2e2;
          --link-color: #5b6ea3;
        }

        .ak-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 50% 0%, rgba(91, 110, 163, 0.12), transparent 38%),
            var(--auth-bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: clamp(16px, 4vw, 48px);
          font-family: "DM Sans", sans-serif;
        }

        .ak-card {
          background-color: var(--auth-card);
          width: 100%;
          max-width: 520px;
          padding: clamp(28px, 5vw, 52px) clamp(20px, 6vw, 64px);
          border: 1px solid rgba(226, 226, 226, 0.9);
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .ak-main {
          width: 100%;
          max-width: 380px;
          margin: 0 auto;
          text-align: center;
        }

        .ak-login-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .ak-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-100);
          margin-bottom: 24px;
          letter-spacing: -0.01em;
          line-height: 1.1;
        }

        .ak-subtitle {
          font-size: 1rem;
          color: var(--text-200);
          margin: 28px auto 30px;
          max-width: 340px;
          line-height: 1.5;
        }

        .ak-form-item {
          margin-bottom: 18px;
          text-align: left;
        }

        .ak-label {
          display: block;
          font-size: 15px;
          font-weight: 700;
          color: var(--text-100);
          margin-bottom: 8px;
        }

        .ak-label .req {
          color: #ef4444;
          margin-left: 4px;
        }

        .ak-input {
          width: 100%;
          border: 1px solid var(--border-color);
          padding: 12px 14px;
          min-height: 52px;
          font-size: 15px;
          border-radius: 10px;
          outline: none;
          transition: border-color 0.2s;
          color: var(--text-100);
          background: #fff;
        }

        .ak-input::placeholder {
          font-style: italic;
          color: #999;
        }

        .ak-input:focus {
          border-color: var(--text-100);
          box-shadow: 0 0 0 3px rgba(91, 110, 163, 0.14);
        }

        .ak-btn-primary {
          width: 100%;
          background-color: #1a1a1a;
          color: #ffffff;
          border: none;
          padding: 16px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 10px;
          cursor: pointer;
          transition: background-color 0.15s;
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 52px;
        }

        .ak-btn-secondary {
          width: 100%;
          margin-top: 12px;
          background: #ffffff;
          color: #1a1a1a;
          border: 1px solid var(--border-color);
          padding: 14px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: border-color 0.15s, background-color 0.15s, transform 0.15s;
        }

        .ak-passkey-icon {
          display: inline-flex;
          width: 28px;
          height: 28px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #f1f3f6;
          color: #1a1a1a;
        }

        .ak-login-methods {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 16px;
        }

        .ak-login-methods .ak-btn-secondary {
          margin-top: 0;
          width: auto;
          flex: 1 1 0;
          min-height: 52px;
        }

        .ak-google-login,
        .ak-telegram-login {
          display: flex;
          min-width: 0;
          height: 52px;
          align-items: center;
          justify-content: center;
          flex: 1 1 0;
          gap: 8px;
          padding: 4px 10px;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          background: #fff;
          color: #1a1a1a;
          transition: border-color 0.15s, background-color 0.15s, transform 0.15s;
        }

        .ak-google-login > div {
          display: flex;
          align-items: center;
          justify-content: center;
          filter: grayscale(1);
        }

        .ak-telegram-login {
          margin: 0;
        }

        .ak-method-label {
          display: inline;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .ak-btn-secondary:hover,
        .ak-google-login:hover,
        .ak-telegram-login:hover {
          border-color: #aeb8d5;
          background: #f8f9fc;
          transform: translateY(-1px);
        }

        .ak-btn-secondary:focus-visible,
        .ak-google-login:focus-within,
        .ak-telegram-login:focus-within,
        .ak-btn-primary:focus-visible,
        .ak-forgot:focus-visible,
        .ak-identity-btn:focus-visible {
          outline: 3px solid rgba(91, 110, 163, 0.3);
          outline-offset: 2px;
        }

        .ak-btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ak-btn-primary:hover {
          background-color: #000;
        }

        .ak-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ak-forgot {
          display: inline-block;
          margin-top: 36px;
          font-size: 15px;
          color: var(--link-color);
          font-weight: 500;
          text-decoration: none;
        }

        .ak-forgot:hover {
          text-decoration: underline;
        }

        .ak-telegram-widget {
          display: flex;
          min-height: 44px;
          width: 100%;
          align-items: center;
          justify-content: center;
        }

        .ak-error-box {
          font-size: 14px;
          color: #b30745;
          background-color: #fff5f5;
          border: 1px solid #feb3ce;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 24px;
          font-weight: 600;
          text-align: left;
        }

        .ak-identity-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 32px;
          background: #f8f9fc;
          padding: 8px 12px;
          border-radius: 6px;
        }

        .ak-identity-text {
          font-size: 15px;
          color: #363f72;
          font-weight: 700;
        }

        .ak-identity-btn {
          background: none;
          border: none;
          color: var(--text-200);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .ak-footer {
          margin-top: 60px;
          display: flex;
          justify-content: center;
          gap: 40px;
        }

        .ak-footer-item {
          font-size: 13px;
          color: #94a3b8;
          text-decoration: none;
          font-weight: 500;
        }

        .ak-footer-item:hover {
          color: #64748b;
        }

        .ak-load-spin {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .ak-verification-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(15, 23, 42, 0.72);
          backdrop-filter: blur(8px);
        }

        .ak-verification-dialog {
          width: 100%;
          max-width: 420px;
          padding: 32px 28px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3);
          text-align: center;
        }

        .ak-verification-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          border-radius: 14px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .ak-verification-dialog h2 {
          margin: 0;
          color: #111827;
          font-size: 20px;
          font-weight: 750;
        }

        .ak-verification-dialog p {
          margin: 10px auto 22px;
          max-width: 320px;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
        }

        .ak-verification-widget {
          display: flex;
          min-height: 66px;
          align-items: center;
          justify-content: center;
        }

        .ak-verification-error {
          margin-top: 16px;
          color: #b91c1c;
          font-size: 13px;
          font-weight: 600;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .ak-card {
            padding: 28px 18px 24px;
            border-radius: 20px;
          }
          .ak-main {
            margin-top: 0;
          }
          .ak-login-methods {
            gap: 8px;
            flex-wrap: wrap;
          }
          .ak-login-methods .ak-btn-secondary {
            width: 52px;
            height: 52px;
            flex: 0 0 52px;
            padding: 0;
            border-radius: 999px;
          }
          .ak-google-login,
          .ak-telegram-login {
            width: 52px;
            flex: 0 0 52px;
            border-radius: 999px;
          }
          .ak-telegram-login {
            width: 52px;
            flex: 0 0 52px;
            border-radius: 999px;
          }
          .ak-method-label {
            display: none;
          }
        }
      `}),e.jsxs("div",{className:"ak-page",children:[O&&e.jsx("div",{className:"ak-verification-backdrop",role:"presentation",children:e.jsxs("section",{className:"ak-verification-dialog",role:"dialog","aria-modal":"true","aria-labelledby":"turnstile-title","aria-describedby":"turnstile-description",children:[e.jsx("div",{className:"ak-verification-icon","aria-hidden":"true",children:e.jsx(ce,{size:24})}),e.jsx("h2",{id:"turnstile-title",children:n?"보안 인증을 기다려 주세요":"Please Wait for Security Validation"}),e.jsx("p",{id:"turnstile-description",children:n?"계속하려면 아래 보안 확인을 완료하세요.":"Complete the security check below to continue."}),e.jsx("div",{className:"ak-verification-widget",children:e.jsx(ee,{siteKey:C,onSuccess:V,onExpire:()=>w(null),onError:()=>{w(null),E(!0)},options:{theme:"light",action:"login"}})}),q&&e.jsx("p",{className:"ak-verification-error",role:"alert",children:n?"인증을 완료할 수 없습니다. 다시 시도하세요.":"Verification could not be completed. Please try again."})]})}),e.jsx("div",{className:"ak-card",children:e.jsxs("div",{className:"ak-main",children:[u==="email"&&e.jsxs("div",{className:"ak-step",children:[e.jsx("div",{className:"ak-login-logo","aria-label":"SwiftPay",children:e.jsx(G,{height:48})}),e.jsx("p",{className:"ak-subtitle",children:i("login_to_continue").replace("{brand}",(k==null?void 0:k.name)||"SwiftPay")}),e.jsxs("form",{onSubmit:M,children:[e.jsxs("div",{className:"ak-form-item",children:[e.jsxs("label",{htmlFor:"ak-email",className:"ak-label",children:[i("email_label"),e.jsx("span",{className:"req",children:"*"})]}),e.jsx("input",{id:"ak-email",type:"email",autoComplete:"email",autoFocus:!0,value:x,onChange:a=>{U(a.target.value),r(null)},placeholder:i("email_placeholder"),className:"ak-input"})]}),m&&e.jsx("div",{className:"ak-error-box",children:m}),g&&e.jsx("div",{className:"ak-error-box",children:g}),e.jsx("button",{type:"submit",className:"ak-btn-primary",children:i("login_button")})]}),e.jsxs("div",{className:"ak-login-methods","aria-label":n?"다른 로그인 방법":"Other sign-in methods",children:[h&&e.jsxs("div",{className:"ak-google-login","aria-label":"Continue with Google",title:"Continue with Google",children:[e.jsx("div",{ref:c}),e.jsx("span",{className:"ak-method-label",children:"Google"})]}),e.jsxs("button",{type:"button",className:"ak-btn-secondary",onClick:H,disabled:z,"aria-label":n?"패스키로 로그인":"Sign in with passkey",title:n?"패스키로 로그인":"Sign in with passkey",children:[e.jsx("span",{className:"ak-passkey-icon","aria-hidden":"true",children:e.jsx(de,{size:19,strokeWidth:2})}),e.jsx("span",{className:"ak-method-label",children:z?n?"패스키를 기다리는 중…":"Waiting for passkey…":n?"패스키로 로그인":"Sign in with passkey"})]}),L&&e.jsxs("div",{className:"ak-telegram-login",title:i("sign_in_with_telegram"),children:[e.jsx(le,{botName:L,onAuth:async a=>{r(null),await R(a,l)}}),e.jsx("span",{className:"ak-method-label",children:"Telegram"})]})]}),e.jsx(b,{to:"/forgot-password",className:"ak-forgot",children:i("forgot_password")})]}),u==="password"&&e.jsxs("div",{className:"ak-step",children:[e.jsx("div",{className:"ak-login-logo","aria-label":"SwiftPay",children:e.jsx(G,{height:48})}),e.jsxs("div",{className:"ak-identity-row",children:[e.jsx("span",{className:"ak-identity-text",children:x}),e.jsx("button",{type:"button",className:"ak-identity-btn",onClick:()=>{N("email"),r(null),_("")},children:i("change")})]}),e.jsxs("form",{onSubmit:J,children:[e.jsxs("div",{className:"ak-form-item",children:[e.jsxs("label",{htmlFor:"ak-password",className:"ak-label",children:[i("password_label"),e.jsx("span",{className:"req",children:"*"})]}),e.jsx("input",{id:"ak-password",type:"password",ref:T,autoComplete:"current-password",value:S,onChange:a=>{_(a.target.value),r(null)},placeholder:i("password_placeholder"),className:"ak-input"})]}),(m||g)&&e.jsx("div",{className:"ak-error-box",children:m||g}),e.jsx("button",{type:"submit",className:"ak-btn-primary",children:F?e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"ak-load-spin"})," ",i("signing_in")]}):i("login_button")})]}),e.jsx(b,{to:"/forgot-password",className:"ak-forgot",children:i("forgot_password")})]})]})}),e.jsxs("footer",{className:"ak-footer",children:[e.jsx(b,{to:"/terms-of-service",className:"ak-footer-item",children:i("terms_of_use")}),e.jsx(b,{to:"/privacy-policy",className:"ak-footer-item",children:i("privacy_policy")}),e.jsx("a",{href:re,target:"_blank",rel:"noopener noreferrer",className:"ak-footer-item",children:i("contact_us")})]})]})]})}export{ye as default};
