import { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  BookOpen,
  Bug,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  Copy,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Terminal,
  Trash2,
  Webhook,
  Wifi,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';

// ─── types ────────────────────────────────────────────────────────────────────

interface ApiConfig {
  id: number;
  config_key: string;
  config_value: string;
  service_name: string;
  is_active?: boolean;
  updated_at?: string | null;
}

interface WebhookInfo {
  webhook_url: string;
  is_registered: boolean;
  pending_update_count: number;
  last_error_message: string;
  message: string;
  token_configured: boolean;
}

interface LiveEvent {
  id: string;
  event_type: string;
  transaction_type?: string;
  new_status?: string;
  old_status?: string;
  amount?: number;
  description?: string;
  external_id?: string;
  timestamp: number;
}

interface PingResult {
  id: number;
  status: 'ok' | 'error' | 'loading';
  code?: number;
  ms?: number;
}

// ─── constants ────────────────────────────────────────────────────────────────

const AVAILABLE_SCOPES = [
  { key: 'payments:read',       label: 'Payments Read',       color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  { key: 'payments:write',      label: 'Payments Write',      color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  { key: 'customers:read',      label: 'Customers Read',      color: 'bg-violet-500/10 text-violet-600 border-violet-500/30' },
  { key: 'customers:write',     label: 'Customers Write',     color: 'bg-violet-500/10 text-violet-600 border-violet-500/30' },
  { key: 'disbursements:read',  label: 'Disbursements Read',  color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  { key: 'disbursements:write', label: 'Disbursements Write', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  { key: 'wallet:read',         label: 'Wallet Read',         color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  { key: 'wallet:write',        label: 'Wallet Write',        color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  { key: 'webhooks:read',       label: 'Webhooks Read',       color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30' },
  { key: 'webhooks:manage',     label: 'Webhooks Manage',     color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30' },
] as const;

const SCOPE_TAGS: Record<string, string> = {
  'payments:read': 'pr', 'payments:write': 'pw',
  'customers:read': 'cr', 'customers:write': 'cw',
  'disbursements:read': 'dr', 'disbursements:write': 'dw',
  'wallet:read': 'wr', 'wallet:write': 'ww',
  'webhooks:read': 'hr', 'webhooks:manage': 'hm',
};

const SCOPE_PRESETS = [
  { label: 'Read-only',   scopes: ['payments:read', 'customers:read', 'wallet:read', 'webhooks:read'] },
  { label: 'Integration', scopes: ['payments:read', 'payments:write', 'customers:read', 'webhooks:manage'] },
  { label: 'Full Access', scopes: AVAILABLE_SCOPES.map((s) => s.key) as string[] },
];

const EVENT_TYPES = [
  { value: 'invoice',       label: 'Invoice',         icon: '🧾' },
  { value: 'payment_link',  label: 'Payment Link',    icon: '🔗' },
  { value: 'qr_code',       label: 'QR Code',         icon: '📱' },
  { value: 'qrph_payment',  label: 'QRPh Payment',    icon: '🇵🇭' },
  { value: 'alipay_qr',     label: 'Alipay QR',       icon: '🟦' },
  { value: 'wechat_qr',     label: 'WeChat QR',       icon: '💚' },
];

const EVENT_STATUSES = [
  { value: 'paid',       label: 'Paid',       color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' },
  { value: 'pending',    label: 'Pending',    color: 'text-amber-600 bg-amber-500/10 border-amber-500/30' },
  { value: 'failed',     label: 'Failed',     color: 'text-red-600 bg-red-500/10 border-red-500/30' },
  { value: 'cancelled',  label: 'Cancelled',  color: 'text-slate-500 bg-slate-500/10 border-slate-500/30' },
  { value: 'expired',    label: 'Expired',    color: 'text-orange-600 bg-orange-500/10 border-orange-500/30' },
];

const SECRET_RE = /(secret|token|api[_-]?key|private|password)/i;

// ─── helpers ──────────────────────────────────────────────────────────────────

async function apiFetch(url: string, options?: RequestInit) {
  const authToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

function maskValue(key: string, value: string) {
  if (!value || !SECRET_RE.test(key)) return value;
  if (value.length <= 8) return '*'.repeat(value.length);
  return `${value.slice(0, 6)}${'*'.repeat(Math.max(4, value.length - 10))}${value.slice(-4)}`;
}

function CopyBtn({ text, size = 'sm' }: { text: string; size?: 'sm' | 'xs' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied');
  };
  if (size === 'xs') {
    return (
      <button onClick={copy} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      </button>
    );
  }
  return (
    <Button size="sm" variant="outline" onClick={copy} className="gap-1.5 h-7 px-2">
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

function ScopeTag({ scope }: { scope: string }) {
  const def = AVAILABLE_SCOPES.find((s) => s.key === scope);
  if (!def) return <Badge variant="outline" className="text-[10px] font-mono">{scope}</Badge>;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium ${def.color}`}>
      {def.label}
    </span>
  );
}

function ConfirmDelete({ onConfirm, onCancel, label }: { onConfirm: () => void; onCancel: () => void; label: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-500/10"><AlertCircle className="h-5 w-5 text-red-500" /></div>
          <div>
            <p className="font-semibold text-foreground text-sm">Delete config?</p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-mono text-foreground">{label}</span> will be permanently removed.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button size="sm" variant="destructive" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
}

function statusColor(status: string) {
  const s = status?.toLowerCase();
  if (['paid', 'completed', 'success'].includes(s)) return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30';
  if (['pending', 'processing'].includes(s)) return 'text-amber-600 bg-amber-500/10 border-amber-500/30';
  if (['failed', 'error'].includes(s)) return 'text-red-600 bg-red-500/10 border-red-500/30';
  if (['cancelled', 'canceled', 'expired'].includes(s)) return 'text-slate-500 bg-slate-500/10 border-slate-500/30';
  return 'text-muted-foreground bg-muted/60 border-border';
}

// ─── main component ───────────────────────────────────────────────────────────

export default function DeveloperExperience() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<ApiConfig | null>(null);
  const [simResult, setSimResult] = useState<'success' | 'error' | null>(null);

  // API key create form
  const [keyName, setKeyName] = useState('');
  const [serviceName, setServiceName] = useState('swiftpay');
  const [configKey, setConfigKey] = useState('');
  const [configValue, setConfigValue] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['payments:read', 'payments:write', 'webhooks:read']);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Callback form
  const [cbKey, setCbKey] = useState('');
  const [cbValue, setCbValue] = useState('');
  const [cbService, setCbService] = useState('swiftpay');
  const [showCbForm, setShowCbForm] = useState(false);
  const [savingCb, setSavingCb] = useState(false);
  const [editingCb, setEditingCb] = useState<ApiConfig | null>(null);
  const [editCbValue, setEditCbValue] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [pingResults, setPingResults] = useState<Map<number, PingResult>>(new Map());

  // Event simulator
  const [eventType, setEventType] = useState('invoice');
  const [eventStatus, setEventStatus] = useState('paid');
  const [eventAmount, setEventAmount] = useState('500');
  const [eventDescription, setEventDescription] = useState('Developer test event');

  // Live event stream
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [streamConnected, setStreamConnected] = useState(false);
  const [streamPaused, setStreamPaused] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulator' | 'stream' | 'snippets'>('simulator');
  const sseRef = useRef<EventSource | null>(null);
  const eventsEndRef = useRef<HTMLDivElement | null>(null);

  // Code snippet tab
  const [snippetLang, setSnippetLang] = useState<'curl' | 'js' | 'python'>('curl');

  // ── derived ──
  const apiKeys = useMemo(
    () => configs.filter(
      (c) => !/(callback|webhook|url)/i.test(c.config_key) &&
             !/_scopes$/i.test(c.config_key) &&
             !/_issued_at$/i.test(c.config_key)
    ),
    [configs]
  );

  const keyScopesMap = useMemo(() => {
    const map = new Map<string, string[]>();
    configs.forEach((item) => {
      if (!/_scopes$/i.test(item.config_key)) return;
      const base = item.config_key.replace(/_scopes$/i, '');
      map.set(base, item.config_value.split(',').map((v) => v.trim()).filter(Boolean));
    });
    return map;
  }, [configs]);

  const issuedAtMap = useMemo(() => {
    const map = new Map<string, string>();
    configs.forEach((item) => {
      if (!/_issued_at$/i.test(item.config_key)) return;
      const base = item.config_key.replace(/_issued_at$/i, '');
      map.set(base, item.config_value);
    });
    return map;
  }, [configs]);

  const callbackConfigs = useMemo(
    () => configs.filter((c) => /(callback|webhook|url)/i.test(c.config_key)),
    [configs]
  );

  // group callbacks by service_name
  const callbacksByService = useMemo(() => {
    const map = new Map<string, ApiConfig[]>();
    callbackConfigs.forEach((c) => {
      const group = map.get(c.service_name) || [];
      group.push(c);
      map.set(c.service_name, group);
    });
    return map;
  }, [callbackConfigs]);

  const activeKeyCount = apiKeys.filter((k) => k.is_active).length;

  // ── fetch ──
  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/v1/entities/api_configs?limit=200&sort=-updated_at&reveal=true');
      setConfigs((data?.items || []) as ApiConfig[]);
    } catch { toast.error('Failed to load configs'); }
    finally { setLoading(false); }
  };

  const fetchWebhookInfo = async () => {
    try {
      const data = await apiFetch('/api/v1/telegram/webhook-info');
      setWebhookInfo(data as WebhookInfo);
    } catch { setWebhookInfo(null); }
  };

  useEffect(() => {
    fetchConfigs();
    fetchWebhookInfo();
  }, []);

  // ── SSE stream ──
  const connectStream = () => {
    if (sseRef.current) { sseRef.current.close(); }
    const es = new EventSource('/api/v1/events/stream');
    sseRef.current = es;
    es.onopen = () => setStreamConnected(true);
    es.onerror = () => setStreamConnected(false);
    es.onmessage = (e) => {
      if (streamPaused) return;
      try {
        const payload = JSON.parse(e.data);
        const event: LiveEvent = {
          id: crypto.randomUUID(),
          event_type: payload.event_type || 'event',
          transaction_type: payload.transaction_type,
          new_status: payload.new_status,
          old_status: payload.old_status,
          amount: payload.amount,
          description: payload.description,
          external_id: payload.external_id,
          timestamp: payload.timestamp || Date.now() / 1000,
        };
        setLiveEvents((prev) => [event, ...prev].slice(0, 50));
      } catch { /* ignore malformed */ }
    };
  };

  const disconnectStream = () => {
    sseRef.current?.close();
    sseRef.current = null;
    setStreamConnected(false);
  };

  useEffect(() => () => { sseRef.current?.close(); }, []);

  // ── key generation ──
  const generateKey = () => {
    if (selectedScopes.length === 0) { toast.error('Select at least one scope'); return; }
    const bytes = new Uint8Array(24);
    window.crypto.getRandomValues(bytes);
    const random = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    const scopeTag = selectedScopes.map((s) => SCOPE_TAGS[s] || 'x').sort().join('');
    const ts = new Date().toISOString()
      .replace(/-/g, '')
      .replace(/:/g, '')
      .replace(/\./g, '')
      .replace(/T/g, '')
      .replace(/Z/g, '')
      .slice(0, 14);
    const prefix = (keyName.trim() || serviceName.trim() || 'swiftpay').toLowerCase().replace(/\s+/g, '_');
    setConfigKey(`payment_api_key_${scopeTag}_${ts}`);
    setConfigValue(`${prefix}_live_${scopeTag}_${random}`);
    toast.success('Key generated — copy it before saving');
  };

  const toggleScope = (scope: string) =>
    setSelectedScopes((prev) => prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]);

  // ── create API key ──
  const createConfig = async () => {
    if (!serviceName.trim() || !configKey.trim() || !configValue.trim()) {
      toast.error('Service, key, and value are required'); return;
    }
    try {
      setSaving(true);
      const isApiKey = /payment_api_key/i.test(configKey.trim());
      if (isApiKey) {
        if (selectedScopes.length === 0) { toast.error('Select at least one scope'); return; }
        await apiFetch('/api/v1/entities/api_configs/batch', {
          method: 'POST',
          body: JSON.stringify({
            items: [
              { service_name: serviceName.trim(), config_key: configKey.trim(), config_value: configValue.trim(), is_active: isActive },
              { service_name: serviceName.trim(), config_key: `${configKey.trim()}_scopes`, config_value: selectedScopes.slice().sort().join(','), is_active: true },
              { service_name: serviceName.trim(), config_key: `${configKey.trim()}_issued_at`, config_value: new Date().toISOString(), is_active: true },
            ],
          }),
        });
      } else {
        await apiFetch('/api/v1/entities/api_configs', {
          method: 'POST',
          body: JSON.stringify({ service_name: serviceName.trim(), config_key: configKey.trim(), config_value: configValue.trim(), is_active: isActive }),
        });
      }
      toast.success('Config saved');
      setConfigKey(''); setConfigValue(''); setKeyName('');
      setShowCreateForm(false);
      await fetchConfigs();
    } catch (err: any) { toast.error(err?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  // ── save callback URL ──
  const saveCallback = async () => {
    if (!cbKey.trim() || !cbValue.trim()) { toast.error('Key and URL are required'); return; }
    try {
      setSavingCb(true);
      await apiFetch('/api/v1/entities/api_configs', {
        method: 'POST',
        body: JSON.stringify({ service_name: cbService.trim() || 'swiftpay', config_key: cbKey.trim(), config_value: cbValue.trim(), is_active: true }),
      });
      toast.success('Callback URL saved');
      setCbKey(''); setCbValue('');
      setShowCbForm(false);
      await fetchConfigs();
    } catch (err: any) { toast.error(err?.message || 'Failed to save'); }
    finally { setSavingCb(false); }
  };

  // ── edit callback URL ──
  const saveEditCallback = async () => {
    if (!editingCb || !editCbValue.trim()) return;
    try {
      setSavingEdit(true);
      await apiFetch(`/api/v1/entities/api_configs/${editingCb.id}`, {
        method: 'PUT',
        body: JSON.stringify({ config_value: editCbValue.trim() }),
      });
      toast.success('URL updated');
      setEditingCb(null); setEditCbValue('');
      await fetchConfigs();
    } catch (err: any) { toast.error(err?.message || 'Failed to update'); }
    finally { setSavingEdit(false); }
  };

  // ── ping URL ──
  const pingUrl = async (item: ApiConfig) => {
    setPingResults((prev) => new Map(prev).set(item.id, { id: item.id, status: 'loading' }));
    const start = Date.now();
    try {
      const res = await fetch(item.config_value, { method: 'GET', mode: 'no-cors', signal: AbortSignal.timeout(5000) });
      const ms = Date.now() - start;
      // no-cors always returns opaque, treat as ok if no error thrown
      setPingResults((prev) => new Map(prev).set(item.id, { id: item.id, status: 'ok', ms }));
    } catch {
      setPingResults((prev) => new Map(prev).set(item.id, { id: item.id, status: 'error', ms: Date.now() - start }));
    }
  };

  // ── delete ──
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/v1/entities/api_configs/${deleteTarget.id}`, { method: 'DELETE' });
      const related = configs.filter(
        (c) => c.config_key === `${deleteTarget.config_key}_scopes` ||
               c.config_key === `${deleteTarget.config_key}_issued_at`
      );
      await Promise.all(related.map((r) => apiFetch(`/api/v1/entities/api_configs/${r.id}`, { method: 'DELETE' }).catch(() => {})));
      toast.success('Deleted');
      setDeleteTarget(null);
      await fetchConfigs();
    } catch { toast.error('Failed to delete'); }
  };

  // ── simulate ──
  const simulateEvent = async () => {
    const amount = Number(eventAmount || '0');
    if (!amount || amount <= 0) { toast.error('Amount must be greater than zero'); return; }
    try {
      setSimulating(true);
      setSimResult(null);
      await apiFetch('/api/v1/events/simulate', {
        method: 'POST',
        body: JSON.stringify({ transaction_type: eventType, status: eventStatus, amount, description: eventDescription || undefined }),
      });
      setSimResult('success');
      toast.success('Event dispatched');
    } catch {
      setSimResult('error');
      toast.error('Dispatch failed');
    } finally { setSimulating(false); }
  };

  const toggleReveal = (id: number) => {
    setRevealedKeys((prev) => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  };

  // ── code snippets ──
  const snippets: Record<string, string> = {
    curl: `# Create an invoice
curl -X POST /api/v1/xend/invoice \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 500,
    "description": "Order #1042",
    "customer_name": "Juan dela Cruz",
    "customer_email": "juan@example.com",
    "external_id": "order-1042"
  }'

# Check payment status
curl /api/v1/xend/status/inv_abc123 \\
  -H "X-API-Key: YOUR_API_KEY"

# Create a QRPh payment
curl -X POST /api/v1/xend/qr \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 250, "description": "Table 5 order", "external_id": "t5-001"}'`,

    js: `// Install: npm install node-fetch (or use built-in fetch in Node 18+)

const API_KEY = process.env.SWIFTPAY_API_KEY;
const BASE = 'https://swiftpay.site/api/v1';

// Create an invoice
async function createInvoice(amount, description, externalId) {
  const res = await fetch(\`\${BASE}/xend/invoice\`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, description, external_id: externalId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Verify webhook
function verifyWebhook(req, secret) {
  const token = req.headers['x-callback-token'];
  return token === secret;
}

// Example usage
const invoice = await createInvoice(500, 'Order #1042', 'order-1042');
console.log(invoice.invoice_url); // redirect customer here`,

    python: `import os
import requests

API_KEY = os.environ["SWIFTPAY_API_KEY"]
BASE_URL = "https://swiftpay.site/api/v1"

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
}

def create_invoice(amount: float, description: str, external_id: str) -> dict:
    res = requests.post(
        f"{BASE_URL}/xend/invoice",
        json={
            "amount": amount,
            "description": description,
            "external_id": external_id,
        },
        headers=headers,
        timeout=30,
    )
    res.raise_for_status()
    return res.json()

def get_status(checkout_id: str) -> dict:
    res = requests.get(
        f"{BASE_URL}/xend/status/{checkout_id}",
        headers=headers,
        timeout=30,
    )
    res.raise_for_status()
    return res.json()

# Webhook verification (Flask example)
from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route("/webhook", methods=["POST"])
def webhook():
    token = request.headers.get("X-Callback-Token", "")
    if token != os.environ["SWIFTPAY_WEBHOOK_TOKEN"]:
        return jsonify({"error": "Unauthorized"}), 401
    payload = request.json
    if payload["event"] == "invoice.paid":
        fulfill_order(payload["data"]["external_id"])
    return jsonify({"received": True})`,
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Layout>
      {deleteTarget && (
        <ConfirmDelete
          label={`${deleteTarget.service_name} · ${deleteTarget.config_key}`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-6 pb-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Code2 className="h-6 w-6 text-blue-500" />
              Developer Experience
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage API keys, callback URLs, and test your integration.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/api-docs">
              <Button variant="outline" size="sm" className="gap-2">
                <BookOpen className="h-4 w-4" />
                API Docs
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => { fetchConfigs(); fetchWebhookInfo(); }} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'API Keys', value: apiKeys.length, sub: `${activeKeyCount} active`, icon: <KeyRound className="h-4 w-4 text-amber-500" />, accent: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Callback URLs', value: callbackConfigs.length, sub: `${callbacksByService.size} services`, icon: <Globe className="h-4 w-4 text-cyan-500" />, accent: 'bg-cyan-500/10 border-cyan-500/20' },
            { label: 'Webhook', value: webhookInfo?.is_registered ? 'Active' : 'Inactive', sub: webhookInfo?.token_configured ? 'token set' : 'no token', icon: <Webhook className="h-4 w-4 text-violet-500" />, accent: webhookInfo?.is_registered ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-muted/60 border-border' },
            { label: 'Pending Updates', value: webhookInfo?.pending_update_count ?? 0, sub: 'webhook queue', icon: <Bug className="h-4 w-4 text-rose-500" />, accent: 'bg-rose-500/10 border-rose-500/20' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.accent}`}>
              <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-muted-foreground">{s.label}</span></div>
              <p className="text-xl font-semibold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="keys" className="gap-1.5 text-xs"><KeyRound className="h-3.5 w-3.5" />API Keys</TabsTrigger>
            <TabsTrigger value="callbacks" className="gap-1.5 text-xs"><Globe className="h-3.5 w-3.5" />Callbacks</TabsTrigger>
            <TabsTrigger value="tools" className="gap-1.5 text-xs"><Zap className="h-3.5 w-3.5" />Test Tools</TabsTrigger>
          </TabsList>

          {/* ── API Keys ─────────────────────────────────────────────────── */}
          <TabsContent value="keys" className="space-y-4 mt-4">
            <Card className="border-border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-amber-500" />Create API Key
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setShowCreateForm((v) => !v)}>
                  <Plus className="h-3.5 w-3.5" />{showCreateForm ? 'Cancel' : 'New Key'}
                </Button>
              </CardHeader>
              {showCreateForm && (
                <CardContent className="space-y-5 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Key Name <span className="text-muted-foreground">(display label)</span></Label>
                      <Input placeholder="e.g. Production Backend" value={keyName} onChange={(e) => setKeyName(e.target.value)} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Service</Label>
                      <Input placeholder="swiftpay" value={serviceName} onChange={(e) => setServiceName(e.target.value)} className="h-9 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Scopes</Label>
                      <div className="flex gap-1.5">
                        {SCOPE_PRESETS.map((p) => (
                          <button key={p.label} type="button" onClick={() => setSelectedScopes(p.scopes)}
                            className="px-2 py-0.5 rounded text-[10px] border border-border hover:border-blue-500/50 hover:text-blue-600 text-muted-foreground transition-colors">
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                      {AVAILABLE_SCOPES.map((scope) => {
                        const active = selectedScopes.includes(scope.key);
                        return (
                          <button key={scope.key} type="button" onClick={() => toggleScope(scope.key)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${active ? scope.color : 'border-border/60 text-muted-foreground hover:border-border'}`}>
                            <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${active ? 'bg-current' : 'bg-muted-foreground/40'}`} />
                            {scope.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Button type="button" variant="outline" size="sm" className="gap-2 h-8" onClick={generateKey}>
                      <Zap className="h-3.5 w-3.5 text-amber-500" />Generate Key
                    </Button>
                    {configValue && (
                      <div>
                        <Label className="text-xs mb-1.5 block">Generated Key <span className="text-red-500 text-[10px]">— copy now, shown only once</span></Label>
                        <div className="flex gap-2">
                          <Input value={configValue} readOnly className="h-9 text-xs font-mono bg-muted/40" />
                          <CopyBtn text={configValue} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Config Key <span className="text-muted-foreground">(auto-filled)</span></Label>
                    <Input placeholder="payment_api_key_..." value={configKey} onChange={(e) => setConfigKey(e.target.value)} className="h-9 text-sm font-mono" />
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/60">
                    <div className="flex items-center gap-2">
                      <Switch checked={isActive} onCheckedChange={setIsActive} />
                      <span className="text-xs text-muted-foreground">Active on creation</span>
                    </div>
                    <Button onClick={createConfig} disabled={saving} size="sm" className="gap-2 h-8">
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                      Save Key
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
            <div className="space-y-2">
              {loading ? (
                <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : apiKeys.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-3 text-center">
                  <div className="p-3 rounded-xl bg-muted/60"><KeyRound className="h-6 w-6 text-muted-foreground" /></div>
                  <p className="text-sm text-muted-foreground">No API keys yet. Create one above.</p>
                </div>
              ) : (
                apiKeys.map((item) => {
                  const scopes = keyScopesMap.get(item.config_key) || [];
                  const issuedAt = issuedAtMap.get(item.config_key);
                  const revealed = revealedKeys.has(item.id);
                  const displayValue = revealed ? item.config_value : maskValue(item.config_key, item.config_value);
                  return (
                    <div key={item.id} className="rounded-xl border border-border/60 bg-card hover:border-border transition-all">
                      <div className="flex items-start gap-3 p-4">
                        <div className="p-2 rounded-lg bg-amber-500/10 shrink-0"><KeyRound className="h-4 w-4 text-amber-500" /></div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground">{item.service_name}</span>
                            <span className="text-muted-foreground">·</span>
                            <code className="text-xs font-mono text-muted-foreground">{item.config_key}</code>
                            <Badge variant={item.is_active ? 'default' : 'secondary'} className={`text-[10px] ml-auto ${item.is_active ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 border' : ''}`}>
                              {item.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          {scopes.length > 0 && <div className="flex flex-wrap gap-1">{scopes.map((s) => <ScopeTag key={s} scope={s} />)}</div>}
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded flex-1 min-w-0 truncate">{displayValue}</code>
                            <button onClick={() => toggleReveal(item.id)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0">
                              {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <CopyBtn text={item.config_value} size="xs" />
                          </div>
                          {issuedAt && <p className="text-[10px] text-muted-foreground">Issued {new Date(issuedAt).toLocaleString()}</p>}
                        </div>
                        <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* ── Callbacks ────────────────────────────────────────────────── */}
          <TabsContent value="callbacks" className="space-y-4 mt-4">

            {/* Webhook runtime card */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Webhook className="h-4 w-4 text-violet-500" />Telegram Webhook Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      label: 'Registration',
                      value: webhookInfo?.is_registered ? 'Registered' : 'Not registered',
                      dot: webhookInfo?.is_registered ? 'bg-emerald-500' : 'bg-slate-400',
                    },
                    {
                      label: 'Callback Token',
                      value: webhookInfo?.token_configured ? 'Configured' : 'Not configured',
                      dot: webhookInfo?.token_configured ? 'bg-emerald-500' : 'bg-amber-500',
                    },
                    {
                      label: 'Pending Updates',
                      value: webhookInfo?.pending_update_count !== undefined ? String(webhookInfo.pending_update_count) : '—',
                      dot: (webhookInfo?.pending_update_count ?? 0) > 0 ? 'bg-amber-500' : 'bg-emerald-500',
                    },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-border/60 p-3 bg-muted/20 space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${item.dot} shrink-0`} />
                        <span className="text-sm font-medium text-foreground">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {webhookInfo?.webhook_url && (
                  <div className="rounded-lg border border-border/60 p-3 bg-muted/20">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Webhook URL</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-foreground break-all flex-1">{webhookInfo.webhook_url}</code>
                      <CopyBtn text={webhookInfo.webhook_url} size="xs" />
                    </div>
                  </div>
                )}
                {webhookInfo?.last_error_message && (
                  <div className="rounded-lg border border-red-500/30 p-3 bg-red-500/10 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-red-500 font-medium uppercase tracking-wider mb-0.5">Last error</p>
                      <p className="text-xs text-red-600">{webhookInfo.last_error_message}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Callback URLs grouped by service */}
            <Card className="border-border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4 text-cyan-500" />Callback URLs
                  <Badge variant="outline" className="text-[10px] ml-1">{callbackConfigs.length}</Badge>
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setShowCbForm((v) => !v)}>
                  <Plus className="h-3.5 w-3.5" />{showCbForm ? 'Cancel' : 'Add URL'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">

                {/* Add form */}
                {showCbForm && (
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
                    <p className="text-xs font-medium text-foreground">New Callback URL</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Service</Label>
                        <Input placeholder="swiftpay" value={cbService} onChange={(e) => setCbService(e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Key</Label>
                        <Input placeholder="callback_url" value={cbKey} onChange={(e) => setCbKey(e.target.value)} className="h-8 text-sm font-mono" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">URL</Label>
                        <Input placeholder="https://swiftpay.site/webhook" value={cbValue} onChange={(e) => setCbValue(e.target.value)} className="h-8 text-sm" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowCbForm(false)}>Cancel</Button>
                      <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={saveCallback} disabled={savingCb}>
                        {savingCb ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}Save
                      </Button>
                    </div>
                  </div>
                )}

                {callbackConfigs.length === 0 ? (
                  <div className="py-10 flex flex-col items-center gap-3 text-center">
                    <div className="p-3 rounded-xl bg-muted/60"><Globe className="h-6 w-6 text-muted-foreground" /></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">No callback URLs yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Add a URL to receive webhook events from payment processors.</p>
                    </div>
                  </div>
                ) : (
                  // Grouped by service
                  Array.from(callbacksByService.entries()).map(([service, items]) => (
                    <div key={service} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-border/60" />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-2">{service}</span>
                        <div className="h-px flex-1 bg-border/60" />
                      </div>
                      {items.map((item) => {
                        const ping = pingResults.get(item.id);
                        const isEditing = editingCb?.id === item.id;
                        return (
                          <div key={item.id} className="rounded-xl border border-border/60 bg-card transition-all hover:border-border overflow-hidden">
                            <div className="flex items-start gap-3 p-3">
                              <div className="p-1.5 rounded-lg bg-cyan-500/10 shrink-0 mt-0.5">
                                <Globe className="h-3.5 w-3.5 text-cyan-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <code className="text-xs font-mono font-medium text-foreground">{item.config_key}</code>
                                  {item.updated_at && (
                                    <span className="text-[10px] text-muted-foreground ml-auto">
                                      Updated {new Date(item.updated_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                {isEditing ? (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Input value={editCbValue} onChange={(e) => setEditCbValue(e.target.value)} className="h-7 text-xs font-mono flex-1" autoFocus />
                                    <Button size="sm" className="h-7 gap-1 text-xs px-2" onClick={saveEditCallback} disabled={savingEdit}>
                                      {savingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setEditingCb(null)}><X className="h-3 w-3" /></Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <code className="text-xs font-mono text-blue-500 break-all flex-1 min-w-0 truncate">{item.config_value}</code>
                                    <CopyBtn text={item.config_value} size="xs" />
                                  </div>
                                )}
                                {ping && !isEditing && (
                                  <div className={`flex items-center gap-1.5 mt-1.5 text-[10px] ${ping.status === 'ok' ? 'text-emerald-600' : ping.status === 'error' ? 'text-red-500' : 'text-muted-foreground'}`}>
                                    {ping.status === 'loading' ? <Loader2 className="h-3 w-3 animate-spin" /> : ping.status === 'ok' ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                    {ping.status === 'loading' ? 'Pinging…' : ping.status === 'ok' ? `Reachable · ${ping.ms}ms` : `Unreachable · ${ping.ms}ms`}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => pingUrl(item)} title="Ping URL"
                                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-cyan-500 transition-colors">
                                  {ping?.status === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wifi className="h-3.5 w-3.5" />}
                                </button>
                                <button onClick={() => { setEditingCb(item); setEditCbValue(item.config_value); }} title="Edit URL"
                                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => setDeleteTarget(item)} title="Delete"
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}

                {/* Webhook verification tip */}
                {callbackConfigs.length > 0 && (
                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 p-3 flex gap-2.5 mt-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Always verify webhook signatures</p>
                      <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-0.5">
                        Check the <code className="font-mono">X-Callback-Token</code> header on every incoming request against your <code className="font-mono">SWIFTPAY_WEBHOOK_TOKEN</code> env variable before processing.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Test Tools ───────────────────────────────────────────────── */}
          <TabsContent value="tools" className="space-y-4 mt-4">

            {/* Sub-nav */}
            <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl w-fit">
              {([
                { key: 'simulator', label: 'Event Simulator', icon: <Send className="h-3.5 w-3.5" /> },
                { key: 'stream',    label: 'Live Stream',     icon: <Activity className="h-3.5 w-3.5" /> },
                { key: 'snippets',  label: 'Code Snippets',   icon: <Terminal className="h-3.5 w-3.5" /> },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === t.key
                      ? 'bg-card shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* Event Simulator */}
            {activeTab === 'simulator' && (
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Send className="h-4 w-4 text-blue-500" />Event Simulator
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Fire a test event to verify your callback URL receives and processes it correctly.
                  </p>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Event type selector */}
                  <div className="space-y-2">
                    <Label className="text-xs">Event Type</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {EVENT_TYPES.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setEventType(t.value)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                            eventType === t.value
                              ? 'border-blue-500/50 bg-blue-500/10 text-blue-600'
                              : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
                          }`}
                        >
                          <span>{t.icon}</span>{t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status selector */}
                  <div className="space-y-2">
                    <Label className="text-xs">Status</Label>
                    <div className="flex flex-wrap gap-2">
                      {EVENT_STATUSES.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => setEventStatus(s.value)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            eventStatus === s.value ? s.color : 'border-border/60 text-muted-foreground hover:border-border'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount + description */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Amount (PHP)</Label>
                      <Input type="number" min="1" value={eventAmount} onChange={(e) => setEventAmount(e.target.value)} className="h-9 text-sm" placeholder="500" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Description</Label>
                      <Input value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} className="h-9 text-sm" placeholder="Developer test event" />
                    </div>
                  </div>

                  {/* Payload preview */}
                  <div>
                    <Label className="text-xs mb-2 block">Payload Preview</Label>
                    <div className="relative rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/60 bg-slate-800/60">
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">JSON</span>
                        <CopyBtn size="xs" text={JSON.stringify({ event: `${eventType}.${eventStatus}`, data: { transaction_type: eventType, status: eventStatus, amount: Number(eventAmount) || 0, description: eventDescription } }, null, 2)} />
                      </div>
                      <pre className="p-4 text-xs text-slate-300 font-mono leading-relaxed overflow-x-auto">
{`{
  "event": "${eventType}.${eventStatus}",
  "data": {
    "transaction_type": "${eventType}",
    "status": "${eventStatus}",
    "amount": ${eventAmount || 0},
    "description": "${eventDescription}"
  }
}`}
                      </pre>
                    </div>
                  </div>

                  {/* Send button + result */}
                  <div className="flex items-center gap-3 pt-1 border-t border-border/60">
                    <Button onClick={simulateEvent} disabled={simulating} className="gap-2 h-9">
                      {simulating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Send Test Event
                    </Button>
                    {simResult === 'success' && (
                      <div className="flex items-center gap-1.5 text-emerald-600 text-sm animate-in fade-in">
                        <CheckCircle2 className="h-4 w-4" />Event dispatched — check your callback URL
                      </div>
                    )}
                    {simResult === 'error' && (
                      <div className="flex items-center gap-1.5 text-red-500 text-sm animate-in fade-in">
                        <AlertCircle className="h-4 w-4" />Dispatch failed — check your server logs
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Live Event Stream */}
            {activeTab === 'stream' && (
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Activity className="h-4 w-4 text-emerald-500" />Live Event Stream
                        <span className={`h-2 w-2 rounded-full ${streamConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Real-time payment events via Server-Sent Events. Connect to see events as they happen.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {streamConnected && (
                        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => setStreamPaused((v) => !v)}>
                          {streamPaused ? <><Play className="h-3 w-3" />Resume</> : <><Pause className="h-3 w-3" />Pause</>}
                        </Button>
                      )}
                      {!streamConnected ? (
                        <Button size="sm" className="h-7 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={connectStream}>
                          <Wifi className="h-3 w-3" />Connect
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10" onClick={disconnectStream}>
                          <WifiOff className="h-3 w-3" />Disconnect
                        </Button>
                      )}
                      {liveEvents.length > 0 && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setLiveEvents([])}>
                          <X className="h-3 w-3 mr-1" />Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {!streamConnected && liveEvents.length === 0 ? (
                    <div className="py-12 flex flex-col items-center gap-3 text-center">
                      <div className="p-4 rounded-2xl bg-muted/60">
                        <Activity className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Not connected</p>
                        <p className="text-xs text-muted-foreground mt-1">Click <strong>Connect</strong> to start receiving live events.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-96 overflow-y-auto">
                      {streamPaused && (
                        <div className="sticky top-0 z-10 flex items-center justify-center gap-2 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-600 mb-2">
                          <Pause className="h-3 w-3" />Stream paused — new events are being held
                        </div>
                      )}
                      {liveEvents.length === 0 && streamConnected && (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                          Connected — waiting for events… <span className="animate-pulse">●</span>
                        </div>
                      )}
                      {liveEvents.map((ev) => (
                        <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-card/60 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className={`px-2 py-0.5 rounded border text-[10px] font-semibold shrink-0 ${statusColor(ev.new_status || '')}`}>
                            {(ev.new_status || ev.event_type).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium text-foreground">{ev.event_type.replace('_', ' ')}</span>
                              {ev.transaction_type && (
                                <Badge variant="outline" className="text-[10px]">{ev.transaction_type}</Badge>
                              )}
                              {ev.amount && (
                                <span className="text-xs text-muted-foreground">₱{ev.amount.toLocaleString()}</span>
                              )}
                            </div>
                            {ev.external_id && (
                              <code className="text-[10px] text-muted-foreground font-mono">{ev.external_id}</code>
                            )}
                            {ev.description && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">{ev.description}</p>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(ev.timestamp * 1000).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                      <div ref={eventsEndRef} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Code Snippets */}
            {activeTab === 'snippets' && (
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-slate-500" />Code Snippets
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Ready-to-use integration examples.</p>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {/* Lang selector */}
                  <div className="flex gap-1.5">
                    {(['curl', 'js', 'python'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSnippetLang(lang)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          snippetLang === lang
                            ? 'border-blue-500/50 bg-blue-500/10 text-blue-600'
                            : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
                        }`}
                      >
                        {lang === 'curl' ? 'cURL' : lang === 'js' ? 'JavaScript' : 'Python'}
                      </button>
                    ))}
                  </div>

                  {/* Snippet block */}
                  <div className="relative rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/60 bg-slate-800/60">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                        {snippetLang === 'curl' ? 'bash' : snippetLang === 'js' ? 'javascript' : 'python'}
                      </span>
                      <CopyBtn text={snippets[snippetLang]} size="xs" />
                    </div>
                    <pre className="p-4 text-xs text-slate-300 font-mono leading-relaxed overflow-x-auto whitespace-pre">
                      {snippets[snippetLang]}
                    </pre>
                  </div>

                  <p className="text-xs text-muted-foreground pt-1">
                    Full API reference in the{' '}
                    <Link to="/api-docs" className="text-blue-500 hover:underline">API Documentation</Link> page.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
