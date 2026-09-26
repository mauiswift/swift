import{j as e}from"./query-vendor-Ee9vmuSY.js";import{a as p}from"./router-vendor-CLWKjhGT.js";import{L as R}from"./index-BBUfLP8t.js";import{B as x}from"./badge-DCkPv8ky.js";import{I as H}from"./input-BDagVqih.js";import{b9 as b,Y as D,ba as k,a3 as B,k as f,ag as T,b as E,W as q,n as C,aG as S,aI as I,b5 as A,p as g,ab as $,u as L,$ as G,ap as U}from"./utils-vendor-uAk0JBi_.js";import"./ui-vendor-DcolUwNM.js";function W(s){return{GET:"bg-emerald-500/15 text-emerald-600 border-emerald-500/30",POST:"bg-blue-500/15 text-blue-600 border-blue-500/30",PUT:"bg-amber-500/15 text-amber-600 border-amber-500/30",PATCH:"bg-purple-500/15 text-purple-600 border-purple-500/30",DELETE:"bg-red-500/15 text-red-600 border-red-500/30"}[s]}function z({text:s}){const[n,i]=p.useState(!1),l=()=>{navigator.clipboard.writeText(s).catch(()=>{}),i(!0),setTimeout(()=>i(!1),2e3)};return e.jsx("button",{onClick:l,className:"absolute top-2.5 right-2.5 p-1.5 rounded-md bg-white/[0.08] hover:bg-white/[0.14] text-slate-400 hover:text-white transition-all",title:"Copy",children:n?e.jsx(G,{className:"h-3.5 w-3.5 text-emerald-400"}):e.jsx(U,{className:"h-3.5 w-3.5"})})}function u({code:s,lang:n="json"}){return e.jsxs("div",{className:"relative rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden",children:[e.jsx("div",{className:"flex items-center gap-2 px-4 py-2 border-b border-slate-700/60 bg-slate-800/60",children:e.jsx("span",{className:"text-[10px] font-medium text-slate-400 uppercase tracking-widest",children:n})}),e.jsx(z,{text:s}),e.jsx("pre",{className:"p-4 text-xs text-slate-300 overflow-x-auto leading-relaxed",children:e.jsx("code",{children:s})})]})}function J({method:s}){return e.jsx("span",{className:`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border tracking-wider ${W(s)}`,children:s})}function h({ep:s}){var l;const[n,i]=p.useState(!1);return e.jsxs("div",{className:"border border-border/60 rounded-xl overflow-hidden bg-card hover:border-border transition-all duration-150",children:[e.jsxs("button",{className:"w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors",onClick:()=>i(a=>!a),children:[e.jsx(J,{method:s.method}),e.jsx("code",{className:"text-sm font-mono text-foreground flex-1 min-w-0 truncate",children:s.path}),e.jsx("span",{className:"text-sm text-muted-foreground hidden md:block",children:s.summary}),e.jsx(L,{className:`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${n?"rotate-90":""}`})]}),n&&e.jsxs("div",{className:"border-t border-border/60 px-4 py-4 space-y-4 bg-muted/20",children:[s.description&&e.jsx("p",{className:"text-sm text-muted-foreground",children:s.description}),e.jsxs("div",{className:"flex flex-wrap gap-2 items-center",children:[e.jsx("span",{className:"text-xs text-muted-foreground",children:"Auth:"}),s.auth==="none"&&e.jsx(x,{variant:"outline",className:"text-xs",children:"Public"}),s.auth==="jwt"&&e.jsx(x,{variant:"outline",className:"text-xs border-blue-500/40 text-blue-600",children:"JWT Bearer"}),s.auth==="api_key"&&e.jsx(x,{variant:"outline",className:"text-xs border-amber-500/40 text-amber-600",children:"API Key"}),(l=s.scopes)==null?void 0:l.map(a=>e.jsx(x,{variant:"outline",className:"text-[10px] font-mono",children:a},a))]}),s.queryParams&&s.queryParams.length>0&&e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-semibold text-foreground mb-2",children:"Query Parameters"}),e.jsx("div",{className:"rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40",children:s.queryParams.map(a=>e.jsxs("div",{className:"flex items-start gap-3 px-3 py-2 bg-card text-xs",children:[e.jsx("code",{className:"font-mono text-blue-500 shrink-0 w-36",children:a.name}),e.jsx("span",{className:"text-muted-foreground shrink-0 w-16",children:a.type}),a.required&&e.jsx("span",{className:"text-red-500 shrink-0",children:"required"}),e.jsx("span",{className:"text-muted-foreground",children:a.description})]},a.name))})]}),s.bodyParams&&s.bodyParams.length>0&&e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-semibold text-foreground mb-2",children:"Request Body"}),e.jsx("div",{className:"rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40",children:s.bodyParams.map(a=>e.jsxs("div",{className:"flex items-start gap-3 px-3 py-2 bg-card text-xs",children:[e.jsx("code",{className:"font-mono text-blue-500 shrink-0 w-36",children:a.name}),e.jsx("span",{className:"text-muted-foreground shrink-0 w-16",children:a.type}),a.required&&e.jsx("span",{className:"text-red-500 shrink-0",children:"required"}),e.jsx("span",{className:"text-muted-foreground",children:a.description})]},a.name))})]}),s.requestExample&&e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-semibold text-foreground mb-2",children:"Request Example"}),e.jsx(u,{code:s.requestExample,lang:"json"})]}),s.responseExample&&e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-semibold text-foreground mb-2",children:"Response Example"}),e.jsx(u,{code:s.responseExample,lang:"json"})]})]})]})}const r="/api/v1",j=[{method:"POST",path:`${r}/magpie/checkout/sessions`,summary:"Create checkout session",description:"Creates a Magpie Checkout Session. This is the recommended way to initiate a hosted payment flow.",auth:"api_key",scopes:["payments:write"],bodyParams:[{name:"amount",type:"number",description:"Total amount in PHP"},{name:"line_items",type:"array",description:"List of items. If amount is not provided, total is calculated from these (item amounts in cents)."},{name:"payment_methods",type:"array",description:"List of supported methods (e.g. visa, mastercard, gcash, maya)"},{name:"success_url",type:"string",required:!0,description:"Where to redirect after payment success"},{name:"cancel_url",type:"string",description:"Where to redirect if payment is cancelled"},{name:"external_id",type:"string",description:"Your unique reference ID"}],requestExample:`{
  "amount": 500.00,
  "description": "Premium Subscription",
  "payment_methods": ["visa", "mastercard", "gcash"],
  "success_url": "https://swiftpay.site/success",
  "line_items": [
    { "name": "Premium Month", "amount": 50000, "quantity": 1 }
  ]
}`,responseExample:`{
  "success": true,
  "data": {
    "session_id": "cs_test_a1b2c3",
    "payment_url": "https://checkout.magpie.im/cs_test_a1b2c3",
    "external_id": "magpie-session-7d8e9f",
    "transaction_id": 1045
  }
}`},{method:"POST",path:`${r}/xend/invoice`,summary:"Create invoice",description:"Creates a hosted checkout invoice and returns a payment URL. The customer is redirected to the checkout page.",auth:"api_key",scopes:["payments:write"],bodyParams:[{name:"amount",type:"number",required:!0,description:"Amount in PHP (e.g. 500.00)"},{name:"description",type:"string",required:!0,description:"Invoice description shown to payer"},{name:"customer_name",type:"string",description:"Customer full name"},{name:"customer_email",type:"string",description:"Customer email address"},{name:"external_id",type:"string",description:"Your unique reference ID. Auto-generated if omitted."}],requestExample:`{
  "amount": 500.00,
  "description": "Order #1042",
  "customer_name": "Juan dela Cruz",
  "customer_email": "juan@example.com",
  "external_id": "order-1042"
}`,responseExample:`{
  "success": true,
  "invoice_id": "inv_abc123",
  "invoice_url": "https://swiftpay.site/pay/inv_abc123",
  "external_id": "order-1042",
  "status": "pending"
}`},{method:"POST",path:`${r}/xend/payment-link`,summary:"Create payment link",description:"Creates a reusable payment link that can be shared with customers.",auth:"api_key",scopes:["payments:write"],bodyParams:[{name:"amount",type:"number",required:!0,description:"Amount in PHP"},{name:"description",type:"string",required:!0,description:"Payment description"}],requestExample:`{
  "amount": 1500.00,
  "description": "Monthly subscription"
}`,responseExample:`{
  "success": true,
  "payment_link_id": "lnk_xyz789",
  "payment_link_url": "https://swiftpay.site/lnk_xyz789",
  "external_id": "magpie-link-a3f9c01b4d2e"
}`},{method:"POST",path:`${r}/xend/qr`,summary:"Create QR payment (QRPh)",description:"Generates a QRPh-compliant QR code for InstaPay/PESONet payments.",auth:"api_key",scopes:["payments:write"],bodyParams:[{name:"amount",type:"number",required:!0,description:"Amount in PHP"},{name:"description",type:"string",required:!0,description:"Payment description"},{name:"external_id",type:"string",description:"Your reference ID"}],requestExample:`{
  "amount": 250.00,
  "description": "Table 5 order",
  "external_id": "pos-table5-001"
}`,responseExample:`{
  "success": true,
  "qr_id": "qr_def456",
  "qr_content": "00020101...",
  "external_id": "pos-table5-001"
}`},{method:"POST",path:`${r}/xend/ewallet`,summary:"Create e-wallet charge",description:"Initiates a charge against GCash, Maya, or other supported e-wallets.",auth:"api_key",scopes:["payments:write"],bodyParams:[{name:"amount",type:"number",required:!0,description:"Amount in PHP"},{name:"channel_code",type:"string",required:!0,description:"E-wallet code: GCASH, PAYMAYA, GRABPAY, SHOPEEPAY"},{name:"mobile_number",type:"string",description:"Customer mobile number (required by some wallets)"}],requestExample:`{
  "amount": 199.00,
  "channel_code": "GCASH",
  "mobile_number": "+639171234567"
}`,responseExample:`{
  "success": true,
  "checkout_id": "ewallet_gh012",
  "checkout_url": "https://gcash.pay/...",
  "external_id": "magpie-ewallet-b5c1d02e3f4a"
}`},{method:"GET",path:`${r}/xend/status/{checkout_id}`,summary:"Get payment status",description:"Retrieves the current status of a payment by its checkout ID.",auth:"api_key",scopes:["payments:read"],responseExample:`{
  "success": true,
  "status": "PAID",
  "raw": {
    "checkout_id": "inv_abc123",
    "amount": 500.00,
    "currency": "PHP",
    "paid_at": "2026-07-01T10:30:00Z"
  }
}`},{method:"POST",path:`${r}/xend/refund`,summary:"Create refund",description:"Issues a full or partial refund for a completed payment.",auth:"api_key",scopes:["payments:write"],bodyParams:[{name:"invoice_id",type:"string",required:!0,description:"The invoice/payment ID to refund"},{name:"amount",type:"number",required:!0,description:"Refund amount in PHP"}],requestExample:`{
  "invoice_id": "inv_abc123",
  "amount": 500.00
}`,responseExample:`{
  "success": true,
  "refund_id": "ref_001",
  "status": "pending"
}`}],v=[{method:"GET",path:`${r}/wallet/balance`,summary:"Get wallet balance",description:"Returns the authenticated user's current PHP wallet balance.",auth:"jwt",responseExample:`{
  "balance": 12500.00,
  "currency": "PHP",
  "wallet_id": 42
}`},{method:"GET",path:`${r}/wallet/balances`,summary:"Get all balances",description:"Returns all wallet balances and estimated net worth.",auth:"jwt",responseExample:`{
  "wallets": [
    { "currency": "PHP", "balance": 12500.00 },
    { "currency": "USDT", "balance": 50.00 }
  ],
  "net_worth_php": 14300.00
}`},{method:"POST",path:`${r}/wallet/send-money`,summary:"Send money (internal)",description:"Transfers PHP balance to another registered user. Requires PIN.",auth:"jwt",bodyParams:[{name:"recipient",type:"string",required:!0,description:"Recipient Telegram username or ID"},{name:"amount",type:"number",required:!0,description:"Amount in PHP"},{name:"note",type:"string",description:"Transfer note"},{name:"pin",type:"string",required:!0,description:"User PIN for authorization"}],requestExample:`{
  "recipient": "@juandelacruz",
  "amount": 500.00,
  "note": "Lunch share",
  "pin": "1234"
}`,responseExample:`{
  "success": true,
  "new_balance": 12000.00,
  "transaction_id": 1091
}`},{method:"POST",path:`${r}/wallet/withdraw-request`,summary:"Submit withdrawal request",description:"Submits a PHP bank withdrawal or USDT TRC-20 withdrawal for admin approval.",auth:"jwt",bodyParams:[{name:"request_type",type:"string",required:!0,description:'"php_bank" or "usdt_trc20"'},{name:"amount",type:"number",required:!0,description:"Withdrawal amount"},{name:"bank_name",type:"string",description:"Bank name (php_bank only)"},{name:"account_number",type:"string",description:"Account number (php_bank only)"},{name:"account_name",type:"string",description:"Account name (php_bank only)"},{name:"usdt_address",type:"string",description:"TRC-20 wallet address (usdt_trc20 only)"}],requestExample:`{
  "request_type": "php_bank",
  "amount": 5000.00,
  "bank_name": "BDO",
  "account_number": "001234567890",
  "account_name": "Juan dela Cruz"
}`,responseExample:`{
  "success": true,
  "request_id": 78,
  "status": "pending"
}`},{method:"GET",path:`${r}/wallet/transactions`,summary:"Wallet transaction history",auth:"jwt",queryParams:[{name:"skip",type:"integer",description:"Pagination offset (default 0)"},{name:"limit",type:"integer",description:"Page size (default 20, max 100)"}],responseExample:`{
  "transactions": [
    {
      "id": 441,
      "type": "credit",
      "amount": 500.00,
      "note": "Payment received",
      "created_at": "2026-07-01T09:15:00Z"
    }
  ],
  "total": 1
}`}],N=[{method:"GET",path:`${r}/entities/disbursements`,summary:"List disbursements",auth:"api_key",scopes:["disbursements:read"],queryParams:[{name:"skip",type:"integer",description:"Offset for pagination"},{name:"limit",type:"integer",description:"Number of results (max 100)"}],responseExample:`{
  "items": [
    {
      "id": 10,
      "amount": 2500.00,
      "bank_code": "BDO",
      "account_number": "001234567890",
      "account_name": "Maria Santos",
      "status": "completed",
      "external_id": "disb-001",
      "created_at": "2026-06-30T14:00:00Z"
    }
  ],
  "total": 1
}`},{method:"POST",path:`${r}/entities/disbursements`,summary:"Create disbursement",description:"Creates a bank payout. PHP balance is deducted immediately and held until approval.",auth:"api_key",scopes:["disbursements:write"],bodyParams:[{name:"amount",type:"number",required:!0,description:"Payout amount in PHP"},{name:"bank_code",type:"string",required:!0,description:"Bank code (e.g. BDO, BPI, UNIONBANK)"},{name:"account_number",type:"string",required:!0,description:"Beneficiary account number"},{name:"account_name",type:"string",required:!0,description:"Beneficiary full name"},{name:"description",type:"string",description:"Payout description"},{name:"external_id",type:"string",description:"Your reference ID"}],requestExample:`{
  "amount": 2500.00,
  "bank_code": "BDO",
  "account_number": "001234567890",
  "account_name": "Maria Santos",
  "description": "Freelance payment June",
  "external_id": "invoice-2043"
}`,responseExample:`{
  "id": 11,
  "status": "pending",
  "amount": 2500.00,
  "external_id": "invoice-2043",
  "created_at": "2026-07-01T11:00:00Z"
}`},{method:"GET",path:`${r}/entities/disbursements/{id}`,summary:"Get disbursement",auth:"api_key",scopes:["disbursements:read"],responseExample:`{
  "id": 11,
  "amount": 2500.00,
  "bank_code": "BDO",
  "account_number": "001234567890",
  "account_name": "Maria Santos",
  "status": "completed",
  "payout_id": "magpie_payout_xxx",
  "external_id": "invoice-2043",
  "created_at": "2026-07-01T11:00:00Z",
  "updated_at": "2026-07-01T11:45:00Z"
}`}],_=[{method:"GET",path:`${r}/entities/transactions`,summary:"List transactions",auth:"api_key",scopes:["payments:read"],queryParams:[{name:"skip",type:"integer",description:"Pagination offset"},{name:"limit",type:"integer",description:"Page size (max 100)"},{name:"sort",type:"string",description:'Sort field, e.g. "-created_at"'}],responseExample:`{
  "items": [
    {
      "id": 330,
      "transaction_type": "invoice",
      "external_id": "order-1042",
      "amount": 500.00,
      "currency": "PHP",
      "status": "paid",
      "customer_name": "Juan dela Cruz",
      "payment_url": "https://swiftpay.site/pay/inv_abc123",
      "created_at": "2026-07-01T10:00:00Z"
    }
  ],
  "total": 1
}`},{method:"GET",path:`${r}/entities/transactions/{id}`,summary:"Get transaction",auth:"api_key",scopes:["payments:read"],responseExample:`{
  "id": 330,
  "transaction_type": "invoice",
  "external_id": "order-1042",
  "amount": 500.00,
  "currency": "PHP",
  "status": "paid",
  "customer_name": "Juan dela Cruz",
  "customer_email": "juan@example.com",
  "payment_url": "https://swiftpay.site/pay/inv_abc123",
  "created_at": "2026-07-01T10:00:00Z",
  "updated_at": "2026-07-01T10:30:00Z"
}`}],w=[{method:"GET",path:`${r}/entities/customers`,summary:"List customers",auth:"api_key",scopes:["customers:read"],queryParams:[{name:"skip",type:"integer",description:"Pagination offset"},{name:"limit",type:"integer",description:"Page size (max 100)"}],responseExample:`{
  "items": [
    {
      "id": 5,
      "name": "Juan dela Cruz",
      "email": "juan@example.com",
      "phone": "+639171234567",
      "total_payments": 3,
      "total_amount": 1500.00,
      "created_at": "2026-06-01T08:00:00Z"
    }
  ],
  "total": 1
}`},{method:"POST",path:`${r}/entities/customers`,summary:"Create customer",auth:"api_key",scopes:["customers:write"],bodyParams:[{name:"name",type:"string",required:!0,description:"Customer full name"},{name:"email",type:"string",description:"Customer email"},{name:"phone",type:"string",description:"Customer phone number"},{name:"notes",type:"string",description:"Internal notes"}],requestExample:`{
  "name": "Juan dela Cruz",
  "email": "juan@example.com",
  "phone": "+639171234567"
}`,responseExample:`{
  "id": 6,
  "name": "Juan dela Cruz",
  "email": "juan@example.com",
  "phone": "+639171234567",
  "total_payments": 0,
  "total_amount": 0.00,
  "created_at": "2026-07-01T12:00:00Z"
}`},{method:"PUT",path:`${r}/entities/customers/{id}`,summary:"Update customer",auth:"api_key",scopes:["customers:write"],bodyParams:[{name:"name",type:"string",description:"Customer full name"},{name:"email",type:"string",description:"Customer email"},{name:"phone",type:"string",description:"Customer phone number"},{name:"notes",type:"string",description:"Internal notes"}]},{method:"DELETE",path:`${r}/entities/customers/{id}`,summary:"Delete customer",auth:"api_key",scopes:["customers:write"],responseExample:'{ "deleted": true }'}],M=[{event:"invoice.paid",description:"Fired when an invoice is successfully paid.",example:`{
  "event": "invoice.paid",
  "data": {
    "id": "inv_abc123",
    "external_id": "order-1042",
    "amount": 500.00,
    "currency": "PHP",
    "status": "paid",
    "paid_at": "2026-07-01T10:30:00Z",
    "customer_name": "Juan dela Cruz",
    "customer_email": "juan@example.com"
  }
}`},{event:"invoice.expired",description:"Fired when an invoice expires without payment.",example:`{
  "event": "invoice.expired",
  "data": {
    "id": "inv_abc123",
    "external_id": "order-1042",
    "amount": 500.00,
    "status": "expired",
    "expired_at": "2026-07-01T11:00:00Z"
  }
}`},{event:"disbursement.completed",description:"Fired when a payout is successfully sent to the bank.",example:`{
  "event": "disbursement.completed",
  "data": {
    "id": 11,
    "external_id": "invoice-2043",
    "amount": 2500.00,
    "bank_code": "BDO",
    "account_number": "001234567890",
    "status": "completed",
    "completed_at": "2026-07-01T11:45:00Z"
  }
}`},{event:"disbursement.failed",description:"Fired when a payout fails (e.g. invalid account number).",example:`{
  "event": "disbursement.failed",
  "data": {
    "id": 12,
    "external_id": "invoice-2044",
    "amount": 1000.00,
    "status": "failed",
    "failure_reason": "Invalid account number",
    "failed_at": "2026-07-01T12:00:00Z"
  }
}`}],K=[{id:"introduction",label:"Introduction",icon:e.jsx(k,{className:"h-3.5 w-3.5"})},{id:"authentication",label:"Authentication",icon:e.jsx(f,{className:"h-3.5 w-3.5"})},{id:"quickstart",label:"Quick Start",icon:e.jsx(T,{className:"h-3.5 w-3.5"})},{id:"payments",label:"Payments",icon:e.jsx(E,{className:"h-3.5 w-3.5"})},{id:"wallet",label:"Wallet",icon:e.jsx(q,{className:"h-3.5 w-3.5"})},{id:"disbursements",label:"Disbursements",icon:e.jsx(C,{className:"h-3.5 w-3.5"})},{id:"transactions",label:"Transactions",icon:e.jsx(S,{className:"h-3.5 w-3.5"})},{id:"customers",label:"Customers",icon:e.jsx(I,{className:"h-3.5 w-3.5"})},{id:"webhooks",label:"Webhooks",icon:e.jsx(A,{className:"h-3.5 w-3.5"})},{id:"errors",label:"Errors",icon:e.jsx(g,{className:"h-3.5 w-3.5"})}];function te(){const[s,n]=p.useState("introduction"),[i,l]=p.useState(""),a=p.useRef({}),O=t=>{var o;(o=a.current[t])==null||o.scrollIntoView({behavior:"smooth",block:"start"}),n(t)};p.useEffect(()=>{const t=new IntersectionObserver(o=>{o.forEach(m=>{m.isIntersecting&&n(m.target.id)})},{rootMargin:"-30% 0px -60% 0px"});return Object.values(a.current).forEach(o=>o&&t.observe(o)),()=>t.disconnect()},[]);const d=t=>{if(!i.trim())return t;const o=i.toLowerCase();return t.filter(m=>m.path.toLowerCase().includes(o)||m.summary.toLowerCase().includes(o)||m.method.toLowerCase().includes(o))};return e.jsx(R,{children:e.jsxs("div",{className:"flex min-h-screen bg-background",children:[e.jsxs("aside",{className:"hidden lg:flex flex-col w-56 shrink-0 border-r border-border/60 sticky top-0 h-screen overflow-y-auto py-6",children:[e.jsxs("div",{className:"px-4 mb-5",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[e.jsx(b,{className:"h-4 w-4 text-blue-500"}),e.jsx("span",{className:"text-sm font-semibold text-foreground",children:"API Reference"})]}),e.jsx("span",{className:"text-[10px] text-muted-foreground font-mono",children:"v1.0 · REST · JSON"})]}),e.jsx("nav",{className:"px-2 space-y-0.5",children:K.map(t=>e.jsxs("button",{onClick:()=>O(t.id),className:`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${s===t.id?"bg-blue-500/10 text-blue-600":"text-muted-foreground hover:text-foreground hover:bg-muted/60"}`,children:[t.icon,t.label]},t.id))}),e.jsx("div",{className:"mt-auto px-4 pt-6",children:e.jsxs("div",{className:"p-3 rounded-xl bg-muted/60 border border-border/60",children:[e.jsx("p",{className:"text-[10px] font-semibold text-foreground mb-1",children:"Base URL"}),e.jsx("code",{className:"text-[10px] text-blue-500 font-mono break-all",children:"/api/v1"})]})})]}),e.jsxs("main",{className:"flex-1 min-w-0 px-4 md:px-8 py-8 space-y-16 max-w-4xl",children:[e.jsxs("div",{className:"flex items-start justify-between gap-4 flex-wrap",children:[e.jsxs("div",{children:[e.jsxs("h1",{className:"text-2xl font-semibold text-foreground flex items-center gap-2",children:[e.jsx(b,{className:"h-6 w-6 text-blue-500"}),"API Documentation"]}),e.jsx("p",{className:"text-sm text-muted-foreground mt-1",children:"Complete reference for the SwiftPay Payment API"})]}),e.jsxs("div",{className:"relative w-56",children:[e.jsx(D,{className:"absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"}),e.jsx(H,{placeholder:"Search endpoints...",className:"pl-8 h-8 text-xs",value:i,onChange:t=>l(t.target.value)})]})]}),e.jsxs("div",{id:"introduction",ref:t=>{a.current.introduction=t},className:"scroll-mt-4",children:[e.jsx(c,{icon:e.jsx(k,{className:"h-4 w-4"}),title:"Introduction"}),e.jsxs("div",{className:"space-y-4 mt-4",children:[e.jsx("p",{className:"text-sm text-muted-foreground leading-relaxed",children:"The SwiftPay API allows you to accept payments, send disbursements, manage customers, and query transaction history. All endpoints follow REST conventions — requests and responses use JSON, and standard HTTP status codes are returned."}),e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-3",children:[{label:"Base URL",value:"/api/v1",icon:e.jsx(B,{className:"h-4 w-4 text-blue-500"})},{label:"Protocol",value:"HTTPS · REST",icon:e.jsx(f,{className:"h-4 w-4 text-emerald-500"})},{label:"Format",value:"JSON",icon:e.jsx(b,{className:"h-4 w-4 text-amber-500"})}].map(t=>e.jsxs("div",{className:"flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/60",children:[t.icon,e.jsxs("div",{children:[e.jsx("p",{className:"text-[10px] text-muted-foreground",children:t.label}),e.jsx("code",{className:"text-xs font-mono font-medium text-foreground",children:t.value})]})]},t.label))})]})]}),e.jsxs("div",{id:"authentication",ref:t=>{a.current.authentication=t},className:"scroll-mt-4",children:[e.jsx(c,{icon:e.jsx(f,{className:"h-4 w-4"}),title:"Authentication"}),e.jsxs("div",{className:"space-y-5 mt-4",children:[e.jsx("p",{className:"text-sm text-muted-foreground",children:"The API supports two authentication methods depending on the context."}),e.jsxs("div",{className:"space-y-3",children:[e.jsx(P,{title:"API Key (recommended for server-side)",badge:"X-API-Key header",description:"Use your secret API key for server-to-server requests. Generate keys in Developer Experience → API Keys. Scope your key to the minimum required permissions.",code:`curl https://api.swiftpay.site/api/v1/entities/transactions \\
  -H "X-API-Key: sk_live_your_key_here"`}),e.jsx(P,{title:"JWT Bearer Token",badge:"Authorization header",description:"Used by the dashboard frontend. Obtain a token via the Telegram Login Widget (/api/v1/auth/telegram-login-widget) and pass it as a Bearer token.",code:`curl https://api.swiftpay.site/api/v1/wallet/balance \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."`})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-foreground mb-2",children:"API Key Scopes"}),e.jsx("div",{className:"rounded-xl border border-border/60 overflow-hidden divide-y divide-border/40",children:[["payments:read","Read payment transactions and invoices"],["payments:write","Create invoices, payment links, QR codes, e-wallet charges"],["customers:read","List and view customers"],["customers:write","Create, update, and delete customers"],["disbursements:read","List and view disbursements"],["disbursements:write","Create disbursements"],["wallet:read","View wallet balances and transactions"],["wallet:write","Submit withdrawal requests"],["webhooks:read","View webhook configuration"],["webhooks:manage","Create and update webhook URLs"]].map(([t,o])=>e.jsxs("div",{className:"flex items-start gap-4 px-4 py-2.5 bg-card text-xs",children:[e.jsx("code",{className:"font-mono text-blue-500 shrink-0 w-44",children:t}),e.jsx("span",{className:"text-muted-foreground",children:o})]},t))})]})]})]}),e.jsxs("div",{id:"quickstart",ref:t=>{a.current.quickstart=t},className:"scroll-mt-4",children:[e.jsx(c,{icon:e.jsx(T,{className:"h-4 w-4"}),title:"Quick Start"}),e.jsxs("div",{className:"space-y-5 mt-4",children:[e.jsx("p",{className:"text-sm text-muted-foreground",children:"Accept your first payment in 3 steps."}),e.jsxs("div",{className:"space-y-4",children:[e.jsx(y,{number:1,title:"Get your API key",children:e.jsxs("p",{className:"text-sm text-muted-foreground",children:["Go to ",e.jsx("strong",{children:"Developer Experience → API Keys"})," and create a key with ",e.jsx("code",{className:"text-xs font-mono bg-muted px-1 py-0.5 rounded",children:"payments:write"})," scope."]})}),e.jsx(y,{number:2,title:"Create an invoice",children:e.jsx(u,{lang:"bash",code:`curl -X POST https://api.swiftpay.site/api/v1/xend/invoice \\
  -H "X-API-Key: sk_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 500.00,
    "description": "Order #1042",
    "customer_name": "Juan dela Cruz",
    "customer_email": "juan@example.com",
    "external_id": "order-1042"
  }'`})}),e.jsxs(y,{number:3,title:"Redirect customer to payment URL",children:[e.jsxs("p",{className:"text-sm text-muted-foreground mb-2",children:["The response contains a ",e.jsx("code",{className:"text-xs font-mono bg-muted px-1 py-0.5 rounded",children:"invoice_url"}),". Redirect your customer there to complete payment."]}),e.jsx(u,{lang:"json",code:`{
  "success": true,
  "invoice_id": "inv_abc123",
  "invoice_url": "https://swiftpay.site/pay/inv_abc123",
  "external_id": "order-1042",
  "status": "pending"
}`})]})]})]})]}),e.jsxs("div",{id:"payments",ref:t=>{a.current.payments=t},className:"scroll-mt-4",children:[e.jsx(c,{icon:e.jsx(E,{className:"h-4 w-4"}),title:"Payments",badge:`${d(j).length} endpoints`}),e.jsx("p",{className:"text-sm text-muted-foreground mt-2 mb-4",children:"Accept payments via invoice, payment link, QR code (QRPh), e-wallet, or card."}),e.jsx("div",{className:"space-y-2",children:d(j).map(t=>e.jsx(h,{ep:t},t.path+t.method))})]}),e.jsxs("div",{id:"wallet",ref:t=>{a.current.wallet=t},className:"scroll-mt-4",children:[e.jsx(c,{icon:e.jsx(q,{className:"h-4 w-4"}),title:"Wallet",badge:`${d(v).length} endpoints`}),e.jsx("p",{className:"text-sm text-muted-foreground mt-2 mb-4",children:"Manage PHP and USDT balances, send internal transfers, and submit withdrawal requests."}),e.jsx("div",{className:"space-y-2",children:d(v).map(t=>e.jsx(h,{ep:t},t.path+t.method))})]}),e.jsxs("div",{id:"disbursements",ref:t=>{a.current.disbursements=t},className:"scroll-mt-4",children:[e.jsx(c,{icon:e.jsx(C,{className:"h-4 w-4"}),title:"Disbursements",badge:`${d(N).length} endpoints`}),e.jsx("p",{className:"text-sm text-muted-foreground mt-2 mb-4",children:"Send bank payouts to any Philippine bank. Funds are held on creation and released on admin approval."}),e.jsx("div",{className:"space-y-2",children:d(N).map(t=>e.jsx(h,{ep:t},t.path+t.method))})]}),e.jsxs("div",{id:"transactions",ref:t=>{a.current.transactions=t},className:"scroll-mt-4",children:[e.jsx(c,{icon:e.jsx(S,{className:"h-4 w-4"}),title:"Transactions",badge:`${d(_).length} endpoints`}),e.jsx("p",{className:"text-sm text-muted-foreground mt-2 mb-4",children:"Query payment transactions with filtering and pagination."}),e.jsx("div",{className:"space-y-2",children:d(_).map(t=>e.jsx(h,{ep:t},t.path+t.method))})]}),e.jsxs("div",{id:"customers",ref:t=>{a.current.customers=t},className:"scroll-mt-4",children:[e.jsx(c,{icon:e.jsx(I,{className:"h-4 w-4"}),title:"Customers",badge:`${d(w).length} endpoints`}),e.jsx("p",{className:"text-sm text-muted-foreground mt-2 mb-4",children:"Manage your customer directory. Customers are automatically linked to payments by email."}),e.jsx("div",{className:"space-y-2",children:d(w).map(t=>e.jsx(h,{ep:t},t.path+t.method))})]}),e.jsxs("div",{id:"webhooks",ref:t=>{a.current.webhooks=t},className:"scroll-mt-4",children:[e.jsx(c,{icon:e.jsx(A,{className:"h-4 w-4"}),title:"Webhooks"}),e.jsxs("div",{className:"space-y-5 mt-4",children:[e.jsxs("p",{className:"text-sm text-muted-foreground",children:["Webhooks notify your server when events occur (e.g. payment received, payout completed). Configure your endpoint URL in ",e.jsx("strong",{children:"Developer Experience → Webhooks"}),"."]}),e.jsxs("div",{className:"p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex gap-3",children:[e.jsx(g,{className:"h-4 w-4 text-amber-600 shrink-0 mt-0.5"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium text-amber-800 dark:text-amber-400",children:"Verify webhook signatures"}),e.jsxs("p",{className:"text-xs text-amber-700 dark:text-amber-500 mt-0.5",children:["All webhook requests include an ",e.jsx("code",{className:"font-mono",children:"X-Callback-Token"})," header. Always validate this against your ",e.jsx("code",{className:"font-mono",children:"SWIFTPAY_WEBHOOK_TOKEN"})," environment variable before processing."]})]})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-foreground mb-3",children:"Webhook Events"}),e.jsx("div",{className:"space-y-3",children:M.map(t=>e.jsxs("div",{className:"rounded-xl border border-border/60 overflow-hidden",children:[e.jsxs("div",{className:"flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border/60",children:[e.jsx("code",{className:"text-xs font-mono font-semibold text-foreground",children:t.event}),e.jsxs("span",{className:"text-xs text-muted-foreground",children:["— ",t.description]})]}),e.jsx("div",{className:"p-3",children:e.jsx(u,{code:t.example,lang:"json"})})]},t.event))})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-foreground mb-2",children:"Handling a webhook (Node.js example)"}),e.jsx(u,{lang:"javascript",code:`app.post('/webhook', (req, res) => {
  const token = req.headers['x-callback-token'];
  if (token !== process.env.WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { event, data } = req.body;

  if (event === 'invoice.paid') {
    // fulfil the order
    await fulfillOrder(data.external_id);
  }

  res.status(200).json({ received: true });
});`})]})]})]}),e.jsxs("div",{id:"errors",ref:t=>{a.current.errors=t},className:"scroll-mt-4",children:[e.jsx(c,{icon:e.jsx(g,{className:"h-4 w-4"}),title:"Errors"}),e.jsxs("div",{className:"space-y-4 mt-4",children:[e.jsxs("p",{className:"text-sm text-muted-foreground",children:["The API uses standard HTTP status codes. Error responses always contain a ",e.jsx("code",{className:"text-xs font-mono bg-muted px-1 py-0.5 rounded",children:"detail"})," field with a human-readable message."]}),e.jsx("div",{className:"rounded-xl border border-border/60 overflow-hidden divide-y divide-border/40",children:[["200","OK","Request succeeded."],["201","Created","Resource created successfully."],["400","Bad Request","Invalid request body or parameters."],["401","Unauthorized","Missing or invalid API key / JWT token."],["403","Forbidden","Authenticated but insufficient permissions or wrong scope."],["404","Not Found","Resource does not exist."],["409","Conflict","Duplicate external_id or resource already exists."],["422","Unprocessable Entity","Validation error — check request body fields."],["429","Too Many Requests","Rate limit exceeded. Retry after the Retry-After header value."],["500","Internal Server Error","Unexpected server error. Contact support if persistent."]].map(([t,o,m])=>e.jsxs("div",{className:"flex items-start gap-4 px-4 py-2.5 bg-card text-xs",children:[e.jsx("code",{className:`font-mono font-semibold shrink-0 w-10 ${t.startsWith("2")?"text-emerald-600":t.startsWith("4")?"text-amber-600":"text-red-600"}`,children:t}),e.jsx("span",{className:"font-medium text-foreground shrink-0 w-44",children:o}),e.jsx("span",{className:"text-muted-foreground",children:m})]},t))}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-foreground mb-2",children:"Error response format"}),e.jsx(u,{lang:"json",code:`{
  "detail": "Insufficient balance for this operation",
  "code": "INSUFFICIENT_BALANCE"
}`})]})]})]})]})]})})}function c({icon:s,title:n,badge:i}){return e.jsxs("div",{className:"flex items-center gap-2.5 pb-3 border-b border-border/60",children:[e.jsx("span",{className:"p-1.5 rounded-lg bg-blue-500/10 text-blue-500",children:s}),e.jsx("h2",{className:"text-lg font-semibold text-foreground",children:n}),i&&e.jsx(x,{variant:"outline",className:"text-[10px] ml-1",children:i})]})}function P({title:s,badge:n,description:i,code:l}){return e.jsxs("div",{className:"rounded-xl border border-border/60 overflow-hidden",children:[e.jsxs("div",{className:"flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border/60",children:[e.jsx($,{className:"h-3.5 w-3.5 text-muted-foreground"}),e.jsx("span",{className:"text-sm font-medium text-foreground",children:s}),e.jsx(x,{variant:"outline",className:"ml-auto text-[10px] font-mono",children:n})]}),e.jsxs("div",{className:"px-4 pt-3 pb-1",children:[e.jsx("p",{className:"text-xs text-muted-foreground mb-3",children:i}),e.jsx(u,{code:l,lang:"bash"})]}),e.jsx("div",{className:"h-3"})]})}function y({number:s,title:n,children:i}){return e.jsxs("div",{className:"flex gap-4",children:[e.jsxs("div",{className:"flex flex-col items-center",children:[e.jsx("div",{className:"h-7 w-7 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-600 text-xs font-semibold flex items-center justify-center shrink-0",children:s}),e.jsx("div",{className:"w-px flex-1 bg-border/60 mt-2"})]}),e.jsxs("div",{className:"pb-6 flex-1 min-w-0",children:[e.jsx("p",{className:"text-sm font-semibold text-foreground mb-2",children:n}),i]})]})}export{te as default};
