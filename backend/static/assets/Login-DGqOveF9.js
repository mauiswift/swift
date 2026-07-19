import{j as e}from"./query-vendor-DLxABwYU.js";import{a as n,N as re,L as Y}from"./router-vendor-coK7R6KM.js";import{u as ne,S as W}from"./index-DQX7S_js.js";import{l as ae}from"./validation-B9meO0FC.js";import"./ui-vendor-D-CB_FRu.js";import"./utils-vendor-D5VMNu4D.js";import"./form-vendor-D4Tzyxf4.js";var oe=n.forwardRef(({as:o="div",...p},u)=>e.jsx(o,{...p,ref:u}));const ie="https://challenges.cloudflare.com/turnstile/v0/api.js",se="cf-turnstile-script",J="onloadTurnstileCallback",X=o=>!!document.getElementById(o),le=({render:o="explicit",onLoadCallbackName:p=J,scriptOptions:{nonce:u="",defer:t=!0,async:m=!0,id:x="",appendTo:C,onError:g,crossOrigin:h=""}={}})=>{let f=x||"cf-turnstile-script";if(X(f))return;let c=document.createElement("script");c.id=f,c.src=`${ie}?onload=${p}&render=${o}`,!document.querySelector(`script[src="${c.src}"]`)&&(c.defer=!!t,c.async=!!m,u&&c.setAttribute("nonce",u),h&&(c.crossOrigin=h),g&&(c.onerror=g,delete window[p]),(C==="body"?document.body:document.getElementsByTagName("head")[0]).appendChild(c))},S={normal:{width:300,height:65},compact:{width:150,height:140},invisible:{width:0,height:0,overflow:"hidden"},flexible:{minWidth:300,width:"100%",height:65},interactionOnly:{width:"fit-content",height:"auto",display:"flex"}};function ce(o){if(o!=="invisible"&&o!=="interactionOnly")return o}function de(o=se){let[p,u]=n.useState(!1);return n.useEffect(()=>{let t=()=>{X(o)&&u(!0)},m=new MutationObserver(t);return m.observe(document,{childList:!0,subtree:!0}),t(),()=>{m.disconnect()}},[o]),p}let F="unloaded",Q;const ue=new Promise((o,p)=>{Q={resolve:o,reject:p},F==="ready"&&o(void 0)}),G=(o=J)=>(F==="unloaded"&&(F="loading",window[o]=()=>{Q.resolve(),F="ready",delete window[o]}),ue),_=n.forwardRef((o,p)=>{let{scriptOptions:u,options:t={},siteKey:m,onWidgetLoad:x,onSuccess:C,onExpire:g,onError:h,onBeforeInteractive:f,onAfterInteractive:c,onUnsupported:T,onTimeout:w,onLoadScript:R,id:y,style:Z,as:V="div",injectScript:P=!0,rerenderOnCallbackChange:d=!1,...B}=o,s=t.size,b=n.useCallback(()=>s===void 0?{}:t.execution==="execute"?S.invisible:t.appearance==="interaction-only"?S.interactionOnly:S[s],[t.execution,s,t.appearance]),[z,v]=n.useState(b()),k=n.useRef(null),[N,D]=n.useState(!1),i=n.useRef(void 0),M=n.useRef(!1),q=y||"cf-turnstile",j=n.useRef({onSuccess:C,onError:h,onExpire:g,onBeforeInteractive:f,onAfterInteractive:c,onUnsupported:T,onTimeout:w});n.useEffect(()=>{d||(j.current={onSuccess:C,onError:h,onExpire:g,onBeforeInteractive:f,onAfterInteractive:c,onUnsupported:T,onTimeout:w})});let U=(u==null?void 0:u.id)||"cf-turnstile-script",A=de(U),I=(u==null?void 0:u.onLoadCallbackName)||"onloadTurnstileCallback",ee=t.appearance||"always",O=n.useMemo(()=>({sitekey:m,action:t.action,cData:t.cData,theme:t.theme||"auto",language:t.language||"auto",tabindex:t.tabIndex,"response-field":t.responseField,"response-field-name":t.responseFieldName,size:ce(s),retry:t.retry||"auto","retry-interval":t.retryInterval||8e3,"refresh-expired":t.refreshExpired||"auto","refresh-timeout":t.refreshTimeout||"auto",execution:t.execution||"render",appearance:t.appearance||"always","feedback-enabled":t.feedbackEnabled??!0,callback:r=>{var a,l;M.current=!0,d?C==null||C(r):(l=(a=j.current).onSuccess)==null||l.call(a,r)},"error-callback":d?h:(...r)=>{var a,l;return(l=(a=j.current).onError)==null?void 0:l.call(a,...r)},"expired-callback":d?g:(...r)=>{var a,l;return(l=(a=j.current).onExpire)==null?void 0:l.call(a,...r)},"before-interactive-callback":d?f:(...r)=>{var a,l;return(l=(a=j.current).onBeforeInteractive)==null?void 0:l.call(a,...r)},"after-interactive-callback":d?c:(...r)=>{var a,l;return(l=(a=j.current).onAfterInteractive)==null?void 0:l.call(a,...r)},"unsupported-callback":d?T:(...r)=>{var a,l;return(l=(a=j.current).onUnsupported)==null?void 0:l.call(a,...r)},"timeout-callback":d?w:(...r)=>{var a,l;return(l=(a=j.current).onTimeout)==null?void 0:l.call(a,...r)}}),[t.action,t.appearance,t.cData,t.execution,t.language,t.refreshExpired,t.responseField,t.responseFieldName,t.retry,t.retryInterval,t.tabIndex,t.theme,t.feedbackEnabled,t.refreshTimeout,m,s,d,d?C:null,d?h:null,d?g:null,d?f:null,d?c:null,d?T:null,d?w:null]),E=n.useCallback(()=>typeof window<"u"&&!!window.turnstile,[]);return n.useEffect(function(){P&&!N&&(G(I),le({onLoadCallbackName:I,scriptOptions:{...u,id:U}}))},[P,N,u,U,I]),n.useEffect(function(){F!=="ready"&&G(I).then(()=>D(!0)).catch(console.error)},[I]),n.useEffect(function(){if(!k.current||!N)return;let r=!1;return(async()=>r||!k.current||(i.current=window.turnstile.render(k.current,O),i.current&&(x==null||x(i.current))))(),()=>{r=!0,i.current&&(window.turnstile.remove(i.current),M.current=!1)}},[q,N,O]),n.useImperativeHandle(p,()=>{let{turnstile:r}=window;return{getResponse(){if(!(r!=null&&r.getResponse)||!i.current||!E()){console.warn("Turnstile has not been loaded");return}return r.getResponse(i.current)},async getResponsePromise(a=3e4,l=100){return new Promise((te,K)=>{let L,$=async()=>{if(M.current&&window.turnstile&&i.current)try{let H=window.turnstile.getResponse(i.current);return L&&clearTimeout(L),H?te(H):K(Error("No response received"))}catch(H){return L&&clearTimeout(L),console.warn("Failed to get response",H),K(Error("Failed to get response"))}L||(L=setTimeout(()=>{L&&clearTimeout(L),K(Error("Timeout"))},a)),await new Promise(H=>setTimeout(H,l)),await $()};$()})},reset(){if(!(r!=null&&r.reset)||!i.current||!E()){console.warn("Turnstile has not been loaded");return}t.execution==="execute"&&v(S.invisible);try{M.current=!1,r.reset(i.current)}catch(a){console.warn(`Failed to reset Turnstile widget ${i.current}`,a)}},remove(){if(!(r!=null&&r.remove)||!i.current||!E()){console.warn("Turnstile has not been loaded");return}v(S.invisible),M.current=!1,r.remove(i.current),i.current=null},render(){if(!(r!=null&&r.render)||!k.current||!E()||i.current){console.warn("Turnstile has not been loaded or container not found");return}let a=r.render(k.current,O);return i.current=a,i.current&&(x==null||x(i.current)),t.execution!=="execute"&&v(s?S[s]:{}),a},execute(){if(t.execution!=="execute"){console.warn('Execution mode is not set to "execute"');return}if(!(r!=null&&r.execute)||!k.current||!i.current||!E()){console.warn("Turnstile has not been loaded or container not found");return}r.execute(k.current),v(s?S[s]:{})},isExpired(){return!(r!=null&&r.isExpired)||!i.current||!E()?(console.warn("Turnstile has not been loaded"),!1):r.isExpired(i.current)}}},[i,t.execution,s,O,k,E,N,x]),n.useEffect(()=>{if(N||!A)return;if(window.turnstile){D(!0);return}let r=setInterval(()=>{window.turnstile&&(D(!0),clearInterval(r))},50);return()=>{clearInterval(r)}},[N,A]),n.useEffect(()=>{v(b())},[t.execution,s,ee]),n.useEffect(()=>{!A||typeof R!="function"||R()},[A]),e.jsx(oe,{ref:k,as:V,id:q,style:{...z,...Z},...B})});_.displayName="Turnstile";function fe({height:o=28}){return e.jsxs("svg",{height:o,viewBox:"0 0 212 47",fill:"none",xmlns:"http://www.w3.org/2000/svg",style:{width:"auto"},children:[e.jsx("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M26.2678 10.7427C26.2678 12.226 25.0611 13.4284 23.5725 13.4284C22.084 13.4284 20.8773 12.226 20.8773 10.7427C20.8773 9.25946 22.084 8.05704 23.5725 8.05704C25.0611 8.05704 26.2678 9.25946 26.2678 10.7427ZM26.2678 35.809C26.2678 37.2923 25.0611 38.4947 23.5725 38.4947C22.084 38.4947 20.8773 37.2923 20.8773 35.809C20.8773 34.3258 22.084 33.1234 23.5725 33.1234C25.0611 33.1234 26.2678 34.3258 26.2678 35.809ZM16.3852 33.1234C17.8738 33.1234 19.0805 31.9209 19.0805 30.4377C19.0805 28.9544 17.8738 27.752 16.3852 27.752C14.8967 27.752 13.69 28.9544 13.69 30.4377C13.69 31.9209 14.8967 33.1234 16.3852 33.1234ZM19.0805 16.1141C19.0805 17.5973 17.8738 18.7997 16.3852 18.7997C14.8967 18.7997 13.69 17.5973 13.69 16.1141C13.69 14.6308 14.8967 13.4284 16.3852 13.4284C17.8738 13.4284 19.0805 14.6308 19.0805 16.1141ZM30.7598 33.1234C32.2484 33.1234 33.4551 31.9209 33.4551 30.4377C33.4551 28.9544 32.2484 27.752 30.7598 27.752C29.2713 27.752 28.0646 28.9544 28.0646 30.4377C28.0646 31.9209 29.2713 33.1234 30.7598 33.1234ZM26.2678 23.2759C26.2678 24.7591 25.0611 25.9615 23.5725 25.9615C22.084 25.9615 20.8773 24.7591 20.8773 23.2759C20.8773 21.7926 22.084 20.5902 23.5725 20.5902C25.0611 20.5902 26.2678 21.7926 26.2678 23.2759ZM30.7598 18.7997C32.2484 18.7997 33.4551 17.5973 33.4551 16.1141C33.4551 14.6308 32.2484 13.4284 30.7598 13.4284C29.2713 13.4284 28.0646 14.6308 28.0646 16.1141C28.0646 17.5973 29.2713 18.7997 30.7598 18.7997Z",fill:"#191919"}),e.jsx("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M117.861 20.6876V34.1379H113.27V20.6876H110.906V17.2055H113.27V16.1131C113.27 13.8828 113.807 12.119 114.88 10.8217C115.954 9.52448 117.416 8.87585 119.266 8.87585C120.727 8.87585 122.201 9.22861 123.685 9.93413L122.76 13.3821C122.418 13.2 122.012 13.0464 121.544 12.9212C121.076 12.796 120.647 12.7334 120.259 12.7334C118.66 12.7334 117.861 13.8031 117.861 15.9424V17.2055H122.246V20.6876H117.861ZM108.029 9.21723V13.7576H103.438V9.21723H108.029ZM62.5661 34.411C63.7538 34.411 64.89 34.2802 65.9749 34.0184C67.0598 33.7567 68.0191 33.3414 68.8527 32.7724C69.6864 32.2034 70.3487 31.4581 70.8398 30.5364C71.3308 29.6146 71.5764 28.5052 71.5764 27.2079C71.5764 26.0928 71.3936 25.154 71.0282 24.3915C70.6628 23.6291 70.1432 22.9748 69.4694 22.4286C68.7956 21.8824 67.9734 21.4272 67.0027 21.0631C66.032 20.699 64.9528 20.3576 63.7652 20.039C62.8516 19.8114 62.0465 19.5952 61.3499 19.3903C60.6533 19.1855 60.0766 18.9579 59.6198 18.7076C59.163 18.4572 58.8147 18.1671 58.5749 17.8371C58.335 17.5071 58.2151 17.0917 58.2151 16.591C58.2151 15.7262 58.5349 15.0548 59.1744 14.5769C59.8139 14.099 60.7846 13.86 62.0865 13.86C62.8173 13.86 63.5368 13.951 64.2448 14.1331C64.9528 14.3152 65.6095 14.5371 66.2147 14.7988C66.82 15.0605 67.3339 15.3279 67.7564 15.601C68.179 15.8741 68.4702 16.0903 68.63 16.2496L70.7199 12.4262C69.6464 11.6979 68.3902 11.0664 66.9513 10.5315C65.5124 9.99672 63.9365 9.7293 62.2235 9.7293C60.9902 9.7293 59.8368 9.8943 58.7633 10.2243C57.6898 10.5543 56.7477 11.0379 55.9369 11.6752C55.1261 12.3124 54.4923 13.109 54.0355 14.0648C53.5787 15.0207 53.3503 16.1131 53.3503 17.3421C53.3503 18.2752 53.493 19.0774 53.7785 19.7488C54.064 20.4202 54.4923 21.0119 55.0633 21.524C55.6342 22.036 56.348 22.4798 57.2045 22.8553C58.061 23.2309 59.0716 23.5779 60.2364 23.8965C61.1957 24.1696 62.0636 24.42 62.8402 24.6476C63.6167 24.8752 64.2791 25.1255 64.8272 25.3986C65.3754 25.6717 65.7979 25.9903 66.0948 26.3545C66.3917 26.7186 66.5402 27.1624 66.5402 27.6859C66.5402 29.3472 65.2383 30.1779 62.6346 30.1779C61.6982 30.1779 60.7846 30.0641 59.8939 29.8365C59.0031 29.609 58.1923 29.3302 57.4614 29.0002C56.7306 28.6702 56.0968 28.3402 55.56 28.0102C55.0233 27.6802 54.6521 27.4128 54.4466 27.2079L52.3568 31.2703C53.7728 32.2717 55.3716 33.0455 57.1531 33.5917C58.9346 34.1379 60.7389 34.411 62.5661 34.411ZM83.9098 34.1379L86.9589 26.2862L90.0422 34.1379H93.8108L101.314 16.2496H96.9627L91.6182 29.8365L89.4598 24.0331L92.5774 16.2838H88.8774L86.9589 21.78L85.0746 16.2838H81.3746L84.5265 24.0331L82.3338 29.8365L76.9894 16.2496H72.6727L80.1412 34.1379H83.9098ZM108.029 34.1379V16.2496H103.438V34.1379H108.029ZM130.537 34.4452C131.519 34.4452 132.456 34.3086 133.346 34.0355C134.237 33.7624 134.991 33.4893 135.607 33.2162L134.682 29.5976C134.408 29.7114 134.043 29.8479 133.586 30.0072C133.129 30.1665 132.661 30.2462 132.181 30.2462C131.702 30.2462 131.296 30.1153 130.965 29.8536C130.634 29.5919 130.469 29.1424 130.469 28.5052V19.7659H134.237V16.2496H130.469V10.4462H125.878V16.2496H123.514V19.7659H125.878V30.0414C125.878 30.8379 126.003 31.515 126.255 32.0726C126.506 32.6302 126.843 33.0853 127.265 33.4381C127.688 33.7909 128.179 34.0469 128.738 34.2062C129.298 34.3655 129.898 34.4452 130.537 34.4452ZM144.736 26.0131V34.1379H140.008V9.89999H150.32C151.439 9.89999 152.473 10.1333 153.421 10.5998C154.369 11.0664 155.185 11.6809 155.87 12.4433C156.556 13.2057 157.092 14.0705 157.481 15.0378C157.869 16.005 158.063 16.9779 158.063 17.9565C158.063 18.9807 157.88 19.9764 157.515 20.9436C157.149 21.9109 156.636 22.77 155.973 23.521C155.311 24.2721 154.511 24.8752 153.575 25.3303C152.639 25.7855 151.611 26.0131 150.492 26.0131H144.736ZM150.218 21.8824H144.736V14.0307H150.012C150.423 14.0307 150.829 14.116 151.228 14.2867C151.628 14.4574 151.976 14.7134 152.273 15.0548C152.57 15.3962 152.81 15.8115 152.993 16.3009C153.175 16.7902 153.267 17.3421 153.267 17.9565C153.267 19.1628 152.975 20.1186 152.393 20.8241C151.811 21.5296 151.085 21.8824 150.218 21.8824ZM169.471 33.66C168.329 34.2062 167.108 34.4793 165.806 34.4793C164.938 34.4793 164.127 34.3371 163.373 34.0526C162.62 33.7681 161.969 33.3698 161.42 32.8577C160.872 32.3457 160.444 31.7483 160.136 31.0655C159.827 30.3827 159.673 29.6317 159.673 28.8124C159.673 27.9703 159.862 27.1909 160.238 26.474C160.615 25.7571 161.141 25.1483 161.814 24.6476C162.488 24.1469 163.293 23.7543 164.23 23.4698C165.166 23.1853 166.194 23.0431 167.313 23.0431C168.112 23.0431 168.895 23.1114 169.66 23.2479C170.425 23.3845 171.104 23.5779 171.698 23.8283V22.8041C171.698 21.6207 171.361 20.7103 170.688 20.0731C170.014 19.4359 169.015 19.1172 167.69 19.1172C166.731 19.1172 165.794 19.2879 164.881 19.6293C163.967 19.9707 163.031 20.4714 162.071 21.1314L160.667 18.2296C162.974 16.7048 165.463 15.9424 168.135 15.9424C170.716 15.9424 172.72 16.574 174.148 17.8371C175.575 19.1002 176.289 20.9265 176.289 23.3162V28.8807C176.289 29.3586 176.375 29.7 176.546 29.9048C176.717 30.1096 176.997 30.2234 177.385 30.2462V34.1379C176.609 34.2972 175.935 34.3769 175.364 34.3769C174.496 34.3769 173.828 34.1834 173.36 33.7965C172.892 33.4096 172.6 32.8976 172.486 32.2603L172.384 31.2703C171.584 32.3172 170.613 33.1138 169.471 33.66ZM167.108 31.1338C166.24 31.1338 165.509 30.8778 164.915 30.3657C164.321 29.8536 164.024 29.2107 164.024 28.4369C164.024 27.6176 164.401 26.9405 165.155 26.4057C165.908 25.8709 166.879 25.6034 168.067 25.6034C168.661 25.6034 169.277 25.666 169.917 25.7912C170.556 25.9164 171.15 26.0814 171.698 26.2862V28.3345C171.698 28.8124 171.447 29.2448 170.945 29.6317C170.556 30.0869 170.014 30.451 169.317 30.7241C168.621 30.9972 167.884 31.1338 167.108 31.1338ZM187.149 40.7607C186.099 41.5572 184.797 41.9555 183.244 41.9555C182.878 41.9555 182.507 41.9271 182.13 41.8702C181.753 41.8133 181.36 41.7165 180.948 41.58V37.62C181.337 37.7338 181.714 37.8191 182.079 37.876C182.444 37.9329 182.753 37.9614 183.004 37.9614C183.301 37.9614 183.575 37.9045 183.826 37.7907C184.077 37.6769 184.306 37.4778 184.511 37.1933C184.717 36.9088 184.923 36.5162 185.128 36.0155C185.334 35.5148 185.551 34.889 185.779 34.1379L178.687 16.2496H183.415L188.28 30.1779L192.597 16.2496H196.913L189.376 37.6883C188.942 38.94 188.2 39.9641 187.149 40.7607Z",fill:"#191919"})]})}function ke(){const{user:o,login:p,loading:u,error:t}=ne(),[m,x]=n.useState("email"),[C,g]=n.useState(!1),[h,f]=n.useState(null),[c,T]=n.useState(""),[w,R]=n.useState(""),[y,Z]=n.useState(null),V="0x4AAAAAAD1UWg_mrK9TYmUm",P=n.useRef(null);n.useEffect(()=>{m==="password"&&setTimeout(()=>{var s;return(s=P.current)==null?void 0:s.focus()},40)},[m]);const d=s=>{s.preventDefault(),f(null);const b=c.trim();if(!b||!b.includes("@")){f("Please enter a valid email address.");return}x("password")},B=async s=>{var z;s.preventDefault();const b=ae.safeParse({email:c,password:w});if(!b.success){f(((z=b.error.issues[0])==null?void 0:z.message)||"Please check your input.");return}g(!0),f(null);try{if(V&&!y){f("Please complete the verification."),g(!1);return}await p(b.data.email,b.data.password,y??void 0)}catch(v){f(v instanceof Error?v.message:"Login failed. Please try again.")}finally{g(!1)}};return o?e.jsx(re,{to:"/dashboard",replace:!0}):e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Red+Hat+Text:wght@400;500;600;700&family=Red+Hat+Display:wght@500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; }
        .ak-root {
          min-height: 100vh;
          background: #f0f0ee;
          display: flex;
          flex-direction: column;
          font-family: "RedHatText", "Red Hat Text", "RedHatDisplay", ui-sans-serif, system-ui, -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .ak-body {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px;
        }
        .ak-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 8px 32px rgba(0,0,0,.07);
          width: 100%;
          max-width: 720px;
          padding: 48px 56px 52px;
        }
        /* Logo top-left */
        .ak-logo {
          margin-bottom: 44px;
        }
        /* Centered content */
        .ak-content { max-width: 340px; margin: 0 auto; }
        .ak-step {
          animation: akIn 0.2s cubic-bezier(.16,1,.3,1) both;
        }
        @keyframes akIn {
          from { opacity: 0; transform: translateY(7px); }
          to   { opacity: 1; transform: none; }
        }
        .ak-title {
          font-size: 1.45rem;
          font-weight: 700;
          color: #1a1a1a;
          text-align: center;
          margin-bottom: 16px;
          letter-spacing: -0.015em;
        }
        /* Email + "Not you?" row (step 2) */
        .ak-identity {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .ak-identity-email {
          font-size: 0.9rem;
          color: #4f6ef7;
          font-weight: 500;
        }
        .ak-identity-change {
          background: none; border: none; cursor: pointer;
          font-size: 0.875rem; color: #6b6b6b;
          font-weight: 500; padding: 0; font-family: inherit;
          transition: color .15s;
        }
        .ak-identity-change:hover { color: #1a1a1a; }
        /* Subtitle (step 1) */
        .ak-subtitle {
          font-size: 0.875rem;
          color: #6b6b6b;
          text-align: center;
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .ak-subtitle .ak-login-word {
          color: #c2410c;
          font-weight: 600;
        }
        /* Form */
        .ak-form { display: flex; flex-direction: column; }
        .ak-field { margin-bottom: 20px; }
        .ak-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #1a1a1a;
          margin-bottom: 6px;
        }
        .ak-req { color: #e53e3e; margin-left: 2px; }
        .ak-input {
          width: 100%;
          border: 1px solid #d4d4d4;
          border-radius: 6px;
          padding: 10px 13px;
          font-size: 0.9375rem;
          color: #1a1a1a;
          background: #fff;
          outline: none;
          font-family: inherit;
          transition: border-color .15s, box-shadow .15s;
        }
        .ak-input:focus {
          border-color: #a0a0a0;
          box-shadow: 0 0 0 3px rgba(0,0,0,.07);
        }
        .ak-input::placeholder { color: #b8b8b8; }
        /* Error */
        .ak-error {
          font-size: 0.8125rem;
          color: #c0392b;
          background: #fff5f5;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 14px;
          text-align: center;
        }
        /* Primary button */
        .ak-btn {
          width: 100%;
          background: #1a1a1a;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 13px;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          letter-spacing: 0.01em;
          transition: background .15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .ak-btn:hover:not(:disabled) { background: #2c2c2c; }
        .ak-btn:disabled { opacity: .5; cursor: not-allowed; }
        .ak-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: akSpin .6s linear infinite;
        }
        @keyframes akSpin { to { transform: rotate(360deg); } }
        /* Forgot password */
        .ak-forgot {
          display: block;
          text-align: center;
          margin-top: 22px;
          font-size: 0.875rem;
          color: #4f6ef7;
          font-weight: 500;
          text-decoration: none;
          transition: color .15s;
        }
        .ak-forgot:hover { color: #3b5bdb; text-decoration: underline; }
        /* Turnstile */
        .ak-turnstile {
          display: flex; flex-direction: column;
          align-items: center; gap: 6px; margin-bottom: 16px;
        }
        .ak-turnstile p { font-size: 0.8125rem; color: #9a9a9a; }
        /* Footer */
        .ak-footer {
          padding: 20px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 36px;
          flex-wrap: wrap;
        }
        .ak-footer-link {
          font-size: 0.8125rem;
          color: #9a9a9a;
          text-decoration: none;
          transition: color .15s;
          font-family: "RedHatText", "Red Hat Text", ui-sans-serif, system-ui, sans-serif;
        }
        .ak-footer-link:hover { color: #535353; }

        @media (max-width: 640px) {
          .ak-card { padding: 32px 24px 36px; border-radius: 8px; }
          .ak-logo { margin-bottom: 28px; }
        }
      `}),e.jsxs("div",{className:"ak-root",children:[e.jsx("div",{className:"ak-body",children:e.jsxs("div",{className:"ak-card",children:[e.jsx("div",{className:"ak-logo",children:e.jsx(fe,{height:26})}),e.jsxs("div",{className:"ak-content",children:[m==="email"&&e.jsxs("div",{className:"ak-step",children:[e.jsx("h1",{className:"ak-title",children:"Welcome to SwiftPay"}),e.jsxs("p",{className:"ak-subtitle",children:[e.jsx("span",{className:"ak-login-word",children:"Login"})," to continue to SwiftPay."]}),!y&&e.jsxs("div",{className:"ak-turnstile",children:[e.jsx("p",{children:"Please verify you are human"}),e.jsx(_,{siteKey:V,onSuccess:Z,options:{theme:"light"}})]}),e.jsxs("form",{onSubmit:d,className:"ak-form",children:[e.jsxs("div",{className:"ak-field",children:[e.jsxs("label",{htmlFor:"ak-email",className:"ak-label",children:["Email ",e.jsx("span",{className:"ak-req",children:"*"})]}),e.jsx("input",{id:"ak-email",type:"email",autoComplete:"email",autoFocus:!0,value:c,onChange:s=>{T(s.target.value),f(null)},placeholder:"Email",className:"ak-input"})]}),h&&e.jsx("div",{className:"ak-error",children:h}),t&&e.jsx("div",{className:"ak-error",children:t}),e.jsx("button",{type:"submit",className:"ak-btn",disabled:!c.trim()||!y,children:"Log in"})]}),e.jsx("a",{href:W,target:"_blank",rel:"noopener noreferrer",className:"ak-forgot",children:"Forgot password?"})]}),m==="password"&&e.jsxs("div",{className:"ak-step",children:[e.jsx("h1",{className:"ak-title",children:"Welcome to SwiftPay"}),e.jsxs("div",{className:"ak-identity",children:[e.jsx("span",{className:"ak-identity-email",children:c}),e.jsx("button",{type:"button",className:"ak-identity-change",onClick:()=>{x("email"),f(null),R("")},children:"Not you?"})]}),!y&&e.jsxs("div",{className:"ak-turnstile",children:[e.jsx("p",{children:"Please verify you are human"}),e.jsx(_,{siteKey:V,onSuccess:Z,options:{theme:"light"}})]}),e.jsxs("form",{onSubmit:B,className:"ak-form",children:[e.jsxs("div",{className:"ak-field",children:[e.jsxs("label",{htmlFor:"ak-password",className:"ak-label",children:["Password ",e.jsx("span",{className:"ak-req",children:"*"})]}),e.jsx("input",{id:"ak-password",type:"password",ref:P,autoComplete:"current-password",value:w,onChange:s=>{R(s.target.value),f(null)},placeholder:"••••••••••••",className:"ak-input"})]}),(h||t)&&e.jsx("div",{className:"ak-error",children:h||t}),u&&!C&&e.jsx("p",{style:{fontSize:"0.8125rem",color:"#9a9a9a",textAlign:"center",marginBottom:12},children:"Checking session…"}),e.jsx("button",{type:"submit",disabled:C||!w||!y,className:"ak-btn",children:C?e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"ak-spinner"})," Signing in…"]}):"Continue"})]}),e.jsx("a",{href:W,target:"_blank",rel:"noopener noreferrer",className:"ak-forgot",children:"Forgot password?"})]})]})]})}),e.jsxs("footer",{className:"ak-footer",children:[e.jsx(Y,{to:"/terms",className:"ak-footer-link",children:"Terms of use"}),e.jsx(Y,{to:"/privacy",className:"ak-footer-link",children:"Privacy policy"}),e.jsx("a",{href:W,target:"_blank",rel:"noopener noreferrer",className:"ak-footer-link",children:"Contact us"})]})]})]})}export{ke as default};
