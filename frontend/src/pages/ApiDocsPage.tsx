import { useState, useRef, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Book,
  ChevronRight,
  Code2,
  Copy,
  Check,
  Search,
  Shield,
  Zap,
  CreditCard,
  Wallet,
  Users,
  FileText,
  Webhook,
  AlertCircle,
  Key,
  ArrowRight,
  Globe,
} from 'lucide-react';

// ─── types ──────────────────────────────────────────────────────────────────

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface Param {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}

interface Endpoint {
  method: Method;
  path: string;
  summary: string;
  description?: string;
  auth: 'none' | 'jwt' | 'api_key';
  scopes?: string[];
  queryParams?: Param[];
  bodyParams?: Param[];
  responseExample?: string;
  requestExample?: string;
}

interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
  endpoints?: Endpoint[];
  content?: React.ReactNode;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function methodColor(m: Method) {
  return {
    GET:    'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    POST:   'bg-blue-500/15 text-blue-600 border-blue-500/30',
    PUT:    'bg-amber-500/15 text-amber-600 border-amber-500/30',
    PATCH:  'bg-purple-500/15 text-purple-600 border-purple-500/30',
    DELETE: 'bg-red-500/15 text-red-600 border-red-500/30',
  }[m];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-white/[0.08] hover:bg-white/[0.14] text-slate-400 hover:text-white transition-all"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function CodeBlock({ code, lang = 'json' }: { code: string; lang?: string }) {
  return (
    <div className="relative rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-700/60 bg-slate-800/60">
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{lang}</span>
      </div>
      <CopyButton text={code} />
      <pre className="p-4 text-xs text-slate-300 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MethodBadge({ method }: { method: Method }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border tracking-wider ${methodColor(method)}`}>
      {method}
    </span>
  );
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/60 rounded-xl overflow-hidden bg-card hover:border-border transition-all duration-150">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <MethodBadge method={ep.method} />
        <code className="text-sm font-mono text-foreground flex-1 min-w-0 truncate">{ep.path}</code>
        <span className="text-sm text-muted-foreground hidden md:block">{ep.summary}</span>
        <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-border/60 px-4 py-4 space-y-4 bg-muted/20">
          {ep.description && (
            <p className="text-sm text-muted-foreground">{ep.description}</p>
          )}

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground">Auth:</span>
            {ep.auth === 'none' && <Badge variant="outline" className="text-xs">Public</Badge>}
            {ep.auth === 'jwt'  && <Badge variant="outline" className="text-xs border-blue-500/40 text-blue-600">JWT Bearer</Badge>}
            {ep.auth === 'api_key' && <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-600">API Key</Badge>}
            {ep.scopes?.map(s => (
              <Badge key={s} variant="outline" className="text-[10px] font-mono">{s}</Badge>
            ))}
          </div>

          {ep.queryParams && ep.queryParams.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Query Parameters</p>
              <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
                {ep.queryParams.map(p => (
                  <div key={p.name} className="flex items-start gap-3 px-3 py-2 bg-card text-xs">
                    <code className="font-mono text-blue-500 shrink-0 w-36">{p.name}</code>
                    <span className="text-muted-foreground shrink-0 w-16">{p.type}</span>
                    {p.required && <span className="text-red-500 shrink-0">required</span>}
                    <span className="text-muted-foreground">{p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ep.bodyParams && ep.bodyParams.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Request Body</p>
              <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
                {ep.bodyParams.map(p => (
                  <div key={p.name} className="flex items-start gap-3 px-3 py-2 bg-card text-xs">
                    <code className="font-mono text-blue-500 shrink-0 w-36">{p.name}</code>
                    <span className="text-muted-foreground shrink-0 w-16">{p.type}</span>
                    {p.required && <span className="text-red-500 shrink-0">required</span>}
                    <span className="text-muted-foreground">{p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ep.requestExample && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Request Example</p>
              <CodeBlock code={ep.requestExample} lang="json" />
            </div>
          )}

          {ep.responseExample && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Response Example</p>
              <CodeBlock code={ep.responseExample} lang="json" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── section data ─────────────────────────────────────────────────────────────

const BASE_URL = '/api/v1';

const PAYMENTS_ENDPOINTS: Endpoint[] = [
  {
    method: 'POST', path: `${BASE_URL}/magpie/checkout/sessions`,
    summary: 'Create checkout session',
    description: 'Creates a Magpie Checkout Session. This is the recommended way to initiate a hosted payment flow.',
    auth: 'api_key', scopes: ['payments:write'],
    bodyParams: [
      { name: 'amount', type: 'number', description: 'Total amount in PHP' },
      { name: 'line_items', type: 'array', description: 'List of items. If amount is not provided, total is calculated from these (item amounts in cents).' },
      { name: 'payment_methods', type: 'array', description: 'List of supported methods (e.g. visa, mastercard, gcash, maya)' },
      { name: 'success_url', type: 'string', required: true, description: 'Where to redirect after payment success' },
      { name: 'cancel_url', type: 'string', description: 'Where to redirect if payment is cancelled' },
      { name: 'external_id', type: 'string', description: 'Your unique reference ID' },
    ],
    requestExample: `{
  "amount": 500.00,
  "description": "Premium Subscription",
  "payment_methods": ["visa", "mastercard", "gcash"],
  "success_url": "https://swiftpay.site/success",
  "line_items": [
    { "name": "Premium Month", "amount": 50000, "quantity": 1 }
  ]
}`,
    responseExample: `{
  "success": true,
  "data": {
    "session_id": "cs_test_a1b2c3",
    "payment_url": "https://checkout.magpie.im/cs_test_a1b2c3",
    "external_id": "magpie-session-7d8e9f",
    "transaction_id": 1045
  }
}`,
  },
  {
    method: 'POST', path: `${BASE_URL}/xend/invoice`,
    summary: 'Create invoice',
    description: 'Creates a hosted checkout invoice and returns a payment URL. The customer is redirected to the checkout page.',
    auth: 'api_key', scopes: ['payments:write'],
    bodyParams: [
      { name: 'amount', type: 'number', required: true, description: 'Amount in PHP (e.g. 500.00)' },
      { name: 'description', type: 'string', required: true, description: 'Invoice description shown to payer' },
      { name: 'customer_name', type: 'string', description: 'Customer full name' },
      { name: 'customer_email', type: 'string', description: 'Customer email address' },
      { name: 'external_id', type: 'string', description: 'Your unique reference ID. Auto-generated if omitted.' },
    ],
    requestExample: `{
  "amount": 500.00,
  "description": "Order #1042",
  "customer_name": "Juan dela Cruz",
  "customer_email": "juan@example.com",
  "external_id": "order-1042"
}`,
    responseExample: `{
  "success": true,
  "invoice_id": "inv_abc123",
  "invoice_url": "https://swiftpay.site/pay/inv_abc123",
  "external_id": "order-1042",
  "status": "pending"
}`,
  },
  {
    method: 'POST', path: `${BASE_URL}/xend/payment-link`,
    summary: 'Create payment link',
    description: 'Creates a reusable payment link that can be shared with customers.',
    auth: 'api_key', scopes: ['payments:write'],
    bodyParams: [
      { name: 'amount', type: 'number', required: true, description: 'Amount in PHP' },
      { name: 'description', type: 'string', required: true, description: 'Payment description' },
    ],
    requestExample: `{
  "amount": 1500.00,
  "description": "Monthly subscription"
}`,
    responseExample: `{
  "success": true,
  "payment_link_id": "lnk_xyz789",
  "payment_link_url": "https://swiftpay.site/lnk_xyz789",
  "external_id": "magpie-link-a3f9c01b4d2e"
}`,
  },
  {
    method: 'POST', path: `${BASE_URL}/xend/qr`,
    summary: 'Create QR payment (QRPh)',
    description: 'Generates a QRPh-compliant QR code for InstaPay/PESONet payments.',
    auth: 'api_key', scopes: ['payments:write'],
    bodyParams: [
      { name: 'amount', type: 'number', required: true, description: 'Amount in PHP' },
      { name: 'description', type: 'string', required: true, description: 'Payment description' },
      { name: 'external_id', type: 'string', description: 'Your reference ID' },
    ],
    requestExample: `{
  "amount": 250.00,
  "description": "Table 5 order",
  "external_id": "pos-table5-001"
}`,
    responseExample: `{
  "success": true,
  "qr_id": "qr_def456",
  "qr_content": "00020101...",
  "external_id": "pos-table5-001"
}`,
  },
  {
    method: 'POST', path: `${BASE_URL}/xend/ewallet`,
    summary: 'Create e-wallet charge',
    description: 'Initiates a charge against GCash, Maya, or other supported e-wallets.',
    auth: 'api_key', scopes: ['payments:write'],
    bodyParams: [
      { name: 'amount', type: 'number', required: true, description: 'Amount in PHP' },
      { name: 'channel_code', type: 'string', required: true, description: 'E-wallet code: GCASH, PAYMAYA, GRABPAY, SHOPEEPAY' },
      { name: 'mobile_number', type: 'string', description: 'Customer mobile number (required by some wallets)' },
    ],
    requestExample: `{
  "amount": 199.00,
  "channel_code": "GCASH",
  "mobile_number": "+639171234567"
}`,
    responseExample: `{
  "success": true,
  "checkout_id": "ewallet_gh012",
  "checkout_url": "https://gcash.pay/...",
  "external_id": "magpie-ewallet-b5c1d02e3f4a"
}`,
  },
  {
    method: 'GET', path: `${BASE_URL}/xend/status/{checkout_id}`,
    summary: 'Get payment status',
    description: 'Retrieves the current status of a payment by its checkout ID.',
    auth: 'api_key', scopes: ['payments:read'],
    responseExample: `{
  "success": true,
  "status": "PAID",
  "raw": {
    "checkout_id": "inv_abc123",
    "amount": 500.00,
    "currency": "PHP",
    "paid_at": "2026-07-01T10:30:00Z"
  }
}`,
  },
  {
    method: 'POST', path: `${BASE_URL}/xend/refund`,
    summary: 'Create refund',
    description: 'Issues a full or partial refund for a completed payment.',
    auth: 'api_key', scopes: ['payments:write'],
    bodyParams: [
      { name: 'invoice_id', type: 'string', required: true, description: 'The invoice/payment ID to refund' },
      { name: 'amount', type: 'number', required: true, description: 'Refund amount in PHP' },
    ],
    requestExample: `{
  "invoice_id": "inv_abc123",
  "amount": 500.00
}`,
    responseExample: `{
  "success": true,
  "refund_id": "ref_001",
  "status": "pending"
}`,
  },
];

const WALLET_ENDPOINTS: Endpoint[] = [
  {
    method: 'GET', path: `${BASE_URL}/wallet/balance`,
    summary: 'Get wallet balance',
    description: 'Returns the authenticated user\'s current PHP wallet balance.',
    auth: 'jwt',
    responseExample: `{
  "balance": 12500.00,
  "currency": "PHP",
  "wallet_id": 42
}`,
  },
  {
    method: 'GET', path: `${BASE_URL}/wallet/balances`,
    summary: 'Get all balances',
    description: 'Returns all wallet balances and estimated net worth.',
    auth: 'jwt',
    responseExample: `{
  "wallets": [
    { "currency": "PHP", "balance": 12500.00 },
    { "currency": "USDT", "balance": 50.00 }
  ],
  "net_worth_php": 14300.00
}`,
  },
  {
    method: 'POST', path: `${BASE_URL}/wallet/send-money`,
    summary: 'Send money (internal)',
    description: 'Transfers PHP balance to another registered user. Requires PIN.',
    auth: 'jwt',
    bodyParams: [
      { name: 'recipient', type: 'string', required: true, description: 'Recipient Telegram username or ID' },
      { name: 'amount', type: 'number', required: true, description: 'Amount in PHP' },
      { name: 'note', type: 'string', description: 'Transfer note' },
      { name: 'pin', type: 'string', required: true, description: 'User PIN for authorization' },
    ],
    requestExample: `{
  "recipient": "@juandelacruz",
  "amount": 500.00,
  "note": "Lunch share",
  "pin": "1234"
}`,
    responseExample: `{
  "success": true,
  "new_balance": 12000.00,
  "transaction_id": 1091
}`,
  },
  {
    method: 'POST', path: `${BASE_URL}/wallet/withdraw-request`,
    summary: 'Submit withdrawal request',
    description: 'Submits a PHP bank withdrawal or USDT TRC-20 withdrawal for admin approval.',
    auth: 'jwt',
    bodyParams: [
      { name: 'request_type', type: 'string', required: true, description: '"php_bank" or "usdt_trc20"' },
      { name: 'amount', type: 'number', required: true, description: 'Withdrawal amount' },
      { name: 'bank_name', type: 'string', description: 'Bank name (php_bank only)' },
      { name: 'account_number', type: 'string', description: 'Account number (php_bank only)' },
      { name: 'account_name', type: 'string', description: 'Account name (php_bank only)' },
      { name: 'usdt_address', type: 'string', description: 'TRC-20 wallet address (usdt_trc20 only)' },
    ],
    requestExample: `{
  "request_type": "php_bank",
  "amount": 5000.00,
  "bank_name": "BDO",
  "account_number": "001234567890",
  "account_name": "Juan dela Cruz"
}`,
    responseExample: `{
  "success": true,
  "request_id": 78,
  "status": "pending"
}`,
  },
  {
    method: 'GET', path: `${BASE_URL}/wallet/transactions`,
    summary: 'Wallet transaction history',
    auth: 'jwt',
    queryParams: [
      { name: 'skip', type: 'integer', description: 'Pagination offset (default 0)' },
      { name: 'limit', type: 'integer', description: 'Page size (default 20, max 100)' },
    ],
    responseExample: `{
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
}`,
  },
];

const DISBURSEMENTS_ENDPOINTS: Endpoint[] = [
  {
    method: 'GET', path: `${BASE_URL}/entities/disbursements`,
    summary: 'List disbursements',
    auth: 'api_key', scopes: ['disbursements:read'],
    queryParams: [
      { name: 'skip', type: 'integer', description: 'Offset for pagination' },
      { name: 'limit', type: 'integer', description: 'Number of results (max 100)' },
    ],
    responseExample: `{
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
}`,
  },
  {
    method: 'POST', path: `${BASE_URL}/entities/disbursements`,
    summary: 'Create disbursement',
    description: 'Creates a bank payout. PHP balance is deducted immediately and held until approval.',
    auth: 'api_key', scopes: ['disbursements:write'],
    bodyParams: [
      { name: 'amount', type: 'number', required: true, description: 'Payout amount in PHP' },
      { name: 'bank_code', type: 'string', required: true, description: 'Bank code (e.g. BDO, BPI, UNIONBANK)' },
      { name: 'account_number', type: 'string', required: true, description: 'Beneficiary account number' },
      { name: 'account_name', type: 'string', required: true, description: 'Beneficiary full name' },
      { name: 'description', type: 'string', description: 'Payout description' },
      { name: 'external_id', type: 'string', description: 'Your reference ID' },
    ],
    requestExample: `{
  "amount": 2500.00,
  "bank_code": "BDO",
  "account_number": "001234567890",
  "account_name": "Maria Santos",
  "description": "Freelance payment June",
  "external_id": "invoice-2043"
}`,
    responseExample: `{
  "id": 11,
  "status": "pending",
  "amount": 2500.00,
  "external_id": "invoice-2043",
  "created_at": "2026-07-01T11:00:00Z"
}`,
  },
  {
    method: 'GET', path: `${BASE_URL}/entities/disbursements/{id}`,
    summary: 'Get disbursement',
    auth: 'api_key', scopes: ['disbursements:read'],
    responseExample: `{
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
}`,
  },
];

const TRANSACTIONS_ENDPOINTS: Endpoint[] = [
  {
    method: 'GET', path: `${BASE_URL}/entities/transactions`,
    summary: 'List transactions',
    auth: 'api_key', scopes: ['payments:read'],
    queryParams: [
      { name: 'skip', type: 'integer', description: 'Pagination offset' },
      { name: 'limit', type: 'integer', description: 'Page size (max 100)' },
      { name: 'sort', type: 'string', description: 'Sort field, e.g. "-created_at"' },
    ],
    responseExample: `{
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
}`,
  },
  {
    method: 'GET', path: `${BASE_URL}/entities/transactions/{id}`,
    summary: 'Get transaction',
    auth: 'api_key', scopes: ['payments:read'],
    responseExample: `{
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
}`,
  },
];

const CUSTOMERS_ENDPOINTS: Endpoint[] = [
  {
    method: 'GET', path: `${BASE_URL}/entities/customers`,
    summary: 'List customers',
    auth: 'api_key', scopes: ['customers:read'],
    queryParams: [
      { name: 'skip', type: 'integer', description: 'Pagination offset' },
      { name: 'limit', type: 'integer', description: 'Page size (max 100)' },
    ],
    responseExample: `{
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
}`,
  },
  {
    method: 'POST', path: `${BASE_URL}/entities/customers`,
    summary: 'Create customer',
    auth: 'api_key', scopes: ['customers:write'],
    bodyParams: [
      { name: 'name', type: 'string', required: true, description: 'Customer full name' },
      { name: 'email', type: 'string', description: 'Customer email' },
      { name: 'phone', type: 'string', description: 'Customer phone number' },
      { name: 'notes', type: 'string', description: 'Internal notes' },
    ],
    requestExample: `{
  "name": "Juan dela Cruz",
  "email": "juan@example.com",
  "phone": "+639171234567"
}`,
    responseExample: `{
  "id": 6,
  "name": "Juan dela Cruz",
  "email": "juan@example.com",
  "phone": "+639171234567",
  "total_payments": 0,
  "total_amount": 0.00,
  "created_at": "2026-07-01T12:00:00Z"
}`,
  },
  {
    method: 'PUT', path: `${BASE_URL}/entities/customers/{id}`,
    summary: 'Update customer',
    auth: 'api_key', scopes: ['customers:write'],
    bodyParams: [
      { name: 'name', type: 'string', description: 'Customer full name' },
      { name: 'email', type: 'string', description: 'Customer email' },
      { name: 'phone', type: 'string', description: 'Customer phone number' },
      { name: 'notes', type: 'string', description: 'Internal notes' },
    ],
  },
  {
    method: 'DELETE', path: `${BASE_URL}/entities/customers/{id}`,
    summary: 'Delete customer',
    auth: 'api_key', scopes: ['customers:write'],
    responseExample: `{ "deleted": true }`,
  },
];

const WEBHOOK_EVENTS = [
  {
    event: 'invoice.paid',
    description: 'Fired when an invoice is successfully paid.',
    example: `{
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
}`,
  },
  {
    event: 'invoice.expired',
    description: 'Fired when an invoice expires without payment.',
    example: `{
  "event": "invoice.expired",
  "data": {
    "id": "inv_abc123",
    "external_id": "order-1042",
    "amount": 500.00,
    "status": "expired",
    "expired_at": "2026-07-01T11:00:00Z"
  }
}`,
  },
  {
    event: 'disbursement.completed',
    description: 'Fired when a payout is successfully sent to the bank.',
    example: `{
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
}`,
  },
  {
    event: 'disbursement.failed',
    description: 'Fired when a payout fails (e.g. invalid account number).',
    example: `{
  "event": "disbursement.failed",
  "data": {
    "id": 12,
    "external_id": "invoice-2044",
    "amount": 1000.00,
    "status": "failed",
    "failure_reason": "Invalid account number",
    "failed_at": "2026-07-01T12:00:00Z"
  }
}`,
  },
];

// ─── nav sections ─────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  { id: 'introduction',    label: 'Introduction',    icon: <Book className="h-3.5 w-3.5" /> },
  { id: 'authentication',  label: 'Authentication',  icon: <Shield className="h-3.5 w-3.5" /> },
  { id: 'quickstart',      label: 'Quick Start',     icon: <Zap className="h-3.5 w-3.5" /> },
  { id: 'payments',        label: 'Payments',        icon: <CreditCard className="h-3.5 w-3.5" /> },
  { id: 'wallet',          label: 'Wallet',          icon: <Wallet className="h-3.5 w-3.5" /> },
  { id: 'disbursements',   label: 'Disbursements',   icon: <ArrowRight className="h-3.5 w-3.5" /> },
  { id: 'transactions',    label: 'Transactions',    icon: <FileText className="h-3.5 w-3.5" /> },
  { id: 'customers',       label: 'Customers',       icon: <Users className="h-3.5 w-3.5" /> },
  { id: 'webhooks',        label: 'Webhooks',        icon: <Webhook className="h-3.5 w-3.5" /> },
  { id: 'errors',          label: 'Errors',          icon: <AlertCircle className="h-3.5 w-3.5" /> },
];

// ─── main component ───────────────────────────────────────────────────────────

export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState('introduction');
  const [search, setSearch] = useState('');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const filterEndpoints = (endpoints: Endpoint[]) => {
    if (!search.trim()) return endpoints;
    const q = search.toLowerCase();
    return endpoints.filter(
      (e) =>
        e.path.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.method.toLowerCase().includes(q)
    );
  };

  return (
    <Layout>
      <div className="flex min-h-screen bg-background">

        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border/60 sticky top-0 h-screen overflow-y-auto py-6">
          <div className="px-4 mb-5">
            <div className="flex items-center gap-2 mb-1">
              <Code2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-semibold text-foreground">API Reference</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">v1.0 · REST · JSON</span>
          </div>
          <nav className="px-2 space-y-0.5">
            {NAV_SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeSection === s.id
                    ? 'bg-blue-500/10 text-blue-600'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto px-4 pt-6">
            <div className="p-3 rounded-xl bg-muted/60 border border-border/60">
              <p className="text-[10px] font-semibold text-foreground mb-1">Base URL</p>
              <code className="text-[10px] text-blue-500 font-mono break-all">/api/v1</code>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 px-4 md:px-8 py-8 space-y-16 max-w-4xl">

          {/* Page header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <Code2 className="h-6 w-6 text-blue-500" />
                API Documentation
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Complete reference for the SwiftPay Payment API
              </p>
            </div>
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search endpoints..."
                className="pl-8 h-8 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Introduction */}
          <div id="introduction" ref={(el) => { sectionRefs.current['introduction'] = el; }} className="scroll-mt-4">
            <SectionHeader icon={<Book className="h-4 w-4" />} title="Introduction" />
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                The SwiftPay API allows you to accept payments, send disbursements, manage customers, and query transaction history.
                All endpoints follow REST conventions — requests and responses use JSON, and standard HTTP status codes are returned.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: 'Base URL', value: '/api/v1', icon: <Globe className="h-4 w-4 text-blue-500" /> },
                  { label: 'Protocol', value: 'HTTPS · REST', icon: <Shield className="h-4 w-4 text-emerald-500" /> },
                  { label: 'Format', value: 'JSON', icon: <Code2 className="h-4 w-4 text-amber-500" /> },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                    {item.icon}
                    <div>
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      <code className="text-xs font-mono font-medium text-foreground">{item.value}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Authentication */}
          <div id="authentication" ref={(el) => { sectionRefs.current['authentication'] = el; }} className="scroll-mt-4">
            <SectionHeader icon={<Shield className="h-4 w-4" />} title="Authentication" />
            <div className="space-y-5 mt-4">
              <p className="text-sm text-muted-foreground">
                The API supports two authentication methods depending on the context.
              </p>

              <div className="space-y-3">
                <AuthMethod
                  title="API Key (recommended for server-side)"
                  badge="X-API-Key header"
                  description="Use your secret API key for server-to-server requests. Generate keys in Developer Experience → API Keys. Scope your key to the minimum required permissions."
                  code={`curl https://swiftpay.site/api/v1/entities/transactions \\
  -H "X-API-Key: sk_live_your_key_here"`}
                />
                <AuthMethod
                  title="JWT Bearer Token"
                  badge="Authorization header"
                  description="Used by the dashboard frontend. Obtain a token via the Telegram Login Widget (/api/v1/auth/telegram-login-widget) and pass it as a Bearer token."
                  code={`curl https://swiftpay.site/api/v1/wallet/balance \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."`}
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">API Key Scopes</p>
                <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/40">
                  {[
                    ['payments:read',        'Read payment transactions and invoices'],
                    ['payments:write',       'Create invoices, payment links, QR codes, e-wallet charges'],
                    ['customers:read',       'List and view customers'],
                    ['customers:write',      'Create, update, and delete customers'],
                    ['disbursements:read',   'List and view disbursements'],
                    ['disbursements:write',  'Create disbursements'],
                    ['wallet:read',          'View wallet balances and transactions'],
                    ['wallet:write',         'Submit withdrawal requests'],
                    ['webhooks:read',        'View webhook configuration'],
                    ['webhooks:manage',      'Create and update webhook URLs'],
                  ].map(([scope, desc]) => (
                    <div key={scope} className="flex items-start gap-4 px-4 py-2.5 bg-card text-xs">
                      <code className="font-mono text-blue-500 shrink-0 w-44">{scope}</code>
                      <span className="text-muted-foreground">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Start */}
          <div id="quickstart" ref={(el) => { sectionRefs.current['quickstart'] = el; }} className="scroll-mt-4">
            <SectionHeader icon={<Zap className="h-4 w-4" />} title="Quick Start" />
            <div className="space-y-5 mt-4">
              <p className="text-sm text-muted-foreground">Accept your first payment in 3 steps.</p>

              <div className="space-y-4">
                <Step number={1} title="Get your API key">
                  <p className="text-sm text-muted-foreground">Go to <strong>Developer Experience → API Keys</strong> and create a key with <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">payments:write</code> scope.</p>
                </Step>

                <Step number={2} title="Create an invoice">
                  <CodeBlock lang="bash" code={`curl -X POST https://swiftpay.site/api/v1/xend/invoice \\
  -H "X-API-Key: sk_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 500.00,
    "description": "Order #1042",
    "customer_name": "Juan dela Cruz",
    "customer_email": "juan@example.com",
    "external_id": "order-1042"
  }'`} />
                </Step>

                <Step number={3} title="Redirect customer to payment URL">
                  <p className="text-sm text-muted-foreground mb-2">The response contains a <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">invoice_url</code>. Redirect your customer there to complete payment.</p>
                  <CodeBlock lang="json" code={`{
  "success": true,
  "invoice_id": "inv_abc123",
  "invoice_url": "https://swiftpay.site/pay/inv_abc123",
  "external_id": "order-1042",
  "status": "pending"
}`} />
                </Step>
              </div>
            </div>
          </div>

          {/* Payments */}
          <div id="payments" ref={(el) => { sectionRefs.current['payments'] = el; }} className="scroll-mt-4">
            <SectionHeader icon={<CreditCard className="h-4 w-4" />} title="Payments" badge={`${filterEndpoints(PAYMENTS_ENDPOINTS).length} endpoints`} />
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              Accept payments via invoice, payment link, QR code (QRPh), e-wallet, or card.
            </p>
            <div className="space-y-2">
              {filterEndpoints(PAYMENTS_ENDPOINTS).map((ep) => <EndpointCard key={ep.path + ep.method} ep={ep} />)}
            </div>
          </div>

          {/* Wallet */}
          <div id="wallet" ref={(el) => { sectionRefs.current['wallet'] = el; }} className="scroll-mt-4">
            <SectionHeader icon={<Wallet className="h-4 w-4" />} title="Wallet" badge={`${filterEndpoints(WALLET_ENDPOINTS).length} endpoints`} />
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              Manage PHP and USDT balances, send internal transfers, and submit withdrawal requests.
            </p>
            <div className="space-y-2">
              {filterEndpoints(WALLET_ENDPOINTS).map((ep) => <EndpointCard key={ep.path + ep.method} ep={ep} />)}
            </div>
          </div>

          {/* Disbursements */}
          <div id="disbursements" ref={(el) => { sectionRefs.current['disbursements'] = el; }} className="scroll-mt-4">
            <SectionHeader icon={<ArrowRight className="h-4 w-4" />} title="Disbursements" badge={`${filterEndpoints(DISBURSEMENTS_ENDPOINTS).length} endpoints`} />
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              Send bank payouts to any Philippine bank. Funds are held on creation and released on admin approval.
            </p>
            <div className="space-y-2">
              {filterEndpoints(DISBURSEMENTS_ENDPOINTS).map((ep) => <EndpointCard key={ep.path + ep.method} ep={ep} />)}
            </div>
          </div>

          {/* Transactions */}
          <div id="transactions" ref={(el) => { sectionRefs.current['transactions'] = el; }} className="scroll-mt-4">
            <SectionHeader icon={<FileText className="h-4 w-4" />} title="Transactions" badge={`${filterEndpoints(TRANSACTIONS_ENDPOINTS).length} endpoints`} />
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              Query payment transactions with filtering and pagination.
            </p>
            <div className="space-y-2">
              {filterEndpoints(TRANSACTIONS_ENDPOINTS).map((ep) => <EndpointCard key={ep.path + ep.method} ep={ep} />)}
            </div>
          </div>

          {/* Customers */}
          <div id="customers" ref={(el) => { sectionRefs.current['customers'] = el; }} className="scroll-mt-4">
            <SectionHeader icon={<Users className="h-4 w-4" />} title="Customers" badge={`${filterEndpoints(CUSTOMERS_ENDPOINTS).length} endpoints`} />
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              Manage your customer directory. Customers are automatically linked to payments by email.
            </p>
            <div className="space-y-2">
              {filterEndpoints(CUSTOMERS_ENDPOINTS).map((ep) => <EndpointCard key={ep.path + ep.method} ep={ep} />)}
            </div>
          </div>

          {/* Webhooks */}
          <div id="webhooks" ref={(el) => { sectionRefs.current['webhooks'] = el; }} className="scroll-mt-4">
            <SectionHeader icon={<Webhook className="h-4 w-4" />} title="Webhooks" />
            <div className="space-y-5 mt-4">
              <p className="text-sm text-muted-foreground">
                Webhooks notify your server when events occur (e.g. payment received, payout completed).
                Configure your endpoint URL in <strong>Developer Experience → Webhooks</strong>.
              </p>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex gap-3">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Verify webhook signatures</p>
                  <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
                    All webhook requests include an <code className="font-mono">X-Callback-Token</code> header. Always validate this against your <code className="font-mono">SWIFTPAY_WEBHOOK_TOKEN</code> environment variable before processing.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Webhook Events</p>
                <div className="space-y-3">
                  {WEBHOOK_EVENTS.map((ev) => (
                    <div key={ev.event} className="rounded-xl border border-border/60 overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border/60">
                        <code className="text-xs font-mono font-semibold text-foreground">{ev.event}</code>
                        <span className="text-xs text-muted-foreground">— {ev.description}</span>
                      </div>
                      <div className="p-3">
                        <CodeBlock code={ev.example} lang="json" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Handling a webhook (Node.js example)</p>
                <CodeBlock lang="javascript" code={`app.post('/webhook', (req, res) => {
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
});`} />
              </div>
            </div>
          </div>

          {/* Errors */}
          <div id="errors" ref={(el) => { sectionRefs.current['errors'] = el; }} className="scroll-mt-4">
            <SectionHeader icon={<AlertCircle className="h-4 w-4" />} title="Errors" />
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                The API uses standard HTTP status codes. Error responses always contain a <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">detail</code> field with a human-readable message.
              </p>

              <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/40">
                {[
                  ['200', 'OK',                   'Request succeeded.'],
                  ['201', 'Created',              'Resource created successfully.'],
                  ['400', 'Bad Request',          'Invalid request body or parameters.'],
                  ['401', 'Unauthorized',         'Missing or invalid API key / JWT token.'],
                  ['403', 'Forbidden',            'Authenticated but insufficient permissions or wrong scope.'],
                  ['404', 'Not Found',            'Resource does not exist.'],
                  ['409', 'Conflict',             'Duplicate external_id or resource already exists.'],
                  ['422', 'Unprocessable Entity', 'Validation error — check request body fields.'],
                  ['429', 'Too Many Requests',    'Rate limit exceeded. Retry after the Retry-After header value.'],
                  ['500', 'Internal Server Error','Unexpected server error. Contact support if persistent.'],
                ].map(([code, title, desc]) => (
                  <div key={code} className="flex items-start gap-4 px-4 py-2.5 bg-card text-xs">
                    <code className={`font-mono font-semibold shrink-0 w-10 ${
                      code.startsWith('2') ? 'text-emerald-600' :
                      code.startsWith('4') ? 'text-amber-600' : 'text-red-600'
                    }`}>{code}</code>
                    <span className="font-medium text-foreground shrink-0 w-44">{title}</span>
                    <span className="text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Error response format</p>
                <CodeBlock lang="json" code={`{
  "detail": "Insufficient balance for this operation",
  "code": "INSUFFICIENT_BALANCE"
}`} />
              </div>
            </div>
          </div>

        </main>
      </div>
    </Layout>
  );
}

// ─── small helpers ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, badge }: { icon: React.ReactNode; title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
      <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">{icon}</span>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {badge && <Badge variant="outline" className="text-[10px] ml-1">{badge}</Badge>}
    </div>
  );
}

function AuthMethod({
  title, badge, description, code,
}: { title: string; badge: string; description: string; code: string }) {
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border/60">
        <Key className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{title}</span>
        <Badge variant="outline" className="ml-auto text-[10px] font-mono">{badge}</Badge>
      </div>
      <div className="px-4 pt-3 pb-1">
        <p className="text-xs text-muted-foreground mb-3">{description}</p>
        <CodeBlock code={code} lang="bash" />
      </div>
      <div className="h-3" />
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="h-7 w-7 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-600 text-xs font-semibold flex items-center justify-center shrink-0">
          {number}
        </div>
        <div className="w-px flex-1 bg-border/60 mt-2" />
      </div>
      <div className="pb-6 flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground mb-2">{title}</p>
        {children}
      </div>
    </div>
  );
}
