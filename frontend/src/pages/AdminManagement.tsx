import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { walletApi, AdminWalletEntry } from '../api/wallet';
import { client } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TeamInvitationsTab, TeamMembersTab } from '@/components/TeamManagement';
import {
  ShieldCheck,
  Plus,
  Crown,
  User,
  Users,
  Check,
  X,
  Trash2,
  Power,
  PowerOff,
  UserPlus,
  AlertCircle,
  Shield,
  ChevronDown,
  Clock,
  Mail,
  Tag,
  KeyRound,
  Bitcoin,
  CheckCircle,
  XCircle,
  WrenchIcon,
  Wallet as WalletIcon,
  DollarSign,
  RefreshCw,
  FileText,
  Download,
  Search,
  Palette,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: number;
  telegram_id: string;
  telegram_username: string | null;
  name: string | null;
  is_active: boolean;
  is_super_admin: boolean;
  can_manage_payments: boolean;
  can_manage_disbursements: boolean;
  can_view_reports: boolean;
  can_manage_wallet: boolean;
  can_manage_transactions: boolean;
  can_manage_bot: boolean;
  can_approve_topups: boolean;
  can_manage_team: boolean;
  added_by: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  bank_address?: string | null;
  usdt_wallet_address?: string | null;
  settlement_type?: string | null;
  settlement_currency?: string | null;
  service_fee_percent?: number;
  exchange_rate_fee_percent?: number;
  collection_fee_percent?: number;
  withdrawal_fee_php?: number;
  withdrawal_fee_krw?: number;
  withdrawal_fee_usdt?: number;
  withdrawal_fee_cny?: number;
  withdrawal_fee_usd?: number;
}

interface RegisteredUser {
  admin_id?: number;
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string | null;
  joined_at?: string | null;
  last_login: string | null;
  telegram_id?: string;
  organization_name?: string | null;
  service_fee_percent?: number;
  added_by?: string | null;
  is_active?: boolean;
  vip_gold?: boolean;
}

interface UserActivityDetails {
  user: RegisteredUser;
  wallets: Array<{
    id: number;
    currency: string;
    balance: number;
    available_balance: number;
    pending_balance: number;
    is_frozen: boolean;
  }>;
  activity: Array<{
    id: number;
    kind: string;
    type: string;
    amount: number;
    currency: string | null;
    status: string | null;
    description: string | null;
    reference_id: string | null;
    created_at: string | null;
  }>;
}

interface CryptoTopupRequest {
  id: number;
  user_id: string;
  amount_usdt: number;
  tx_hash: string;
  network: string;
  status: string;
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string | null;
}

type AdminTab = 'admins' | 'users' | 'crypto' | 'wallet-control' | 'payment-channels' | 'wallet-settings' | 'tatum' | 'checkout-design' | 'team-invitations' | 'team-members' | 'audit-logs';

type ChannelConfig = Record<string, { checkout: string[]; withdrawal: string[]; disbursement: string[]; checkout_institutions?: string[] }>;
const channelOptions = [
  { id: 'gcash', label: 'GCash' },
  { id: 'maya', label: 'Maya' },
  { id: 'bank_transfer', label: 'Bank transfer' },
  { id: 'qr_code', label: 'QR code' },
  { id: 'alipay', label: 'Alipay' },
  { id: 'wechat', label: 'WeChat Pay' },
  { id: 'card', label: 'Card' },
];
const phpInstitutionOptions = [
  { id: 'GCASH', label: 'GCash' }, { id: 'MAYA', label: 'Maya' }, { id: 'BDO', label: 'BDO' },
  { id: 'BPI', label: 'BPI' }, { id: 'LANDBANK', label: 'LandBank' }, { id: 'METROBANK', label: 'Metrobank' },
  { id: 'UNIONBANK', label: 'UnionBank' }, { id: 'RCBC', label: 'RCBC' }, { id: 'PSBANK', label: 'PSBank' },
  { id: 'SECBANK', label: 'Security Bank' }, { id: 'AUB', label: 'Asia United Bank' }, { id: 'EASTWEST', label: 'EastWest Bank' },
  { id: 'DBP', label: 'DBP' }, { id: 'KB', label: 'KB Kookmin Bank' }, { id: 'SHINHAN', label: 'Shinhan Bank' },
  { id: 'HANA', label: 'Hana Bank' }, { id: 'WOORI', label: 'Woori Bank' }, { id: 'NH', label: 'NH NongHyup Bank' },
  { id: 'IBK', label: 'IBK' }, { id: 'KDB', label: 'KDB Bank' }, { id: 'SC', label: 'SC First Bank' },
  { id: 'KAKAO', label: 'Kakao Bank' }, { id: 'TOSS', label: 'Toss Bank' },
];

function PaymentChannelsTab({ onError }: { onError: (message: string) => void }) {
  const [config, setConfig] = useState<ChannelConfig>({});
  const [currency, setCurrency] = useState('PHP');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/app-settings/payment-channels');
      if (!response.ok) throw new Error(await response.text());
      setConfig((await response.json()).channels || {});
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to load payment channels');
    }
  }, [onError]);

  useEffect(() => { load(); }, [load]);

  const toggle = (flow: keyof ChannelConfig[string], channel: string) => {
    setConfig(current => {
      const currentCurrency = current[currency] || { checkout: [], withdrawal: [], disbursement: [] };
      const enabledChannels = currentCurrency[flow] || [];
      const enabled = enabledChannels.includes(channel);
      return {
        ...current,
        [currency]: {
          ...currentCurrency,
          [flow]: enabled ? enabledChannels.filter(value => value !== channel) : [...enabledChannels, channel],
        },
      };
    });
  };

  const toggleInstitution = (institution: string) => {
    setConfig(current => {
      const currentCurrency = current.PHP || { checkout: [], withdrawal: [], disbursement: [] };
      const enabled = currentCurrency.checkout_institutions ?? phpInstitutionOptions.map(option => option.id);
      return {
        ...current,
        PHP: {
          ...currentCurrency,
          checkout_institutions: enabled.includes(institution)
            ? enabled.filter(value => value !== institution)
            : [...enabled, institution],
        },
      };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/v1/app-settings/payment-channels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: config }),
      });
      if (!response.ok) throw new Error(await response.text());
      setConfig((await response.json()).channels || config);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to save payment channels');
    } finally {
      setSaving(false);
    }
  };

  const current = config[currency] || { checkout: [], withdrawal: [], disbursement: [] };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Payment Channels</h2>
          <p className="mt-1 text-sm text-slate-500">Choose which channels appear for each currency and flow.</p>
        </div>
        <Button onClick={save} disabled={saving} className="bg-[#FF6B00] text-white hover:bg-[#E66000]">{saving ? 'Saving...' : 'Save changes'}</Button>
      </div>
      <div className="mt-6 flex gap-2 border-b border-slate-200" role="group" aria-label="Payment channel currency">
        {['PHP', 'CNY', 'KRW'].map(value => (
          <button key={value} type="button" aria-pressed={currency === value} onClick={() => setCurrency(value)} className={`motion-interactive border-b-2 px-4 py-2 text-sm font-semibold ${currency === value ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-slate-400'}`}>{value}</button>
        ))}
      </div>
      <div className="mt-6 overflow-x-auto">
        <div className="min-w-full sm:min-w-0">
          <div className="grid grid-cols-[1fr_repeat(3,minmax(80px,100px))] gap-2 sm:gap-3 border-b border-slate-100 pb-3 text-xs font-semibold uppercase tracking-wider text-slate-400"><span>Channel</span><span className="text-center">Checkout</span><span className="text-center">Withdrawal</span><span className="text-center">Disbursement</span></div>
          {channelOptions.map(channel => (
            <div key={channel.id} className="grid grid-cols-[1fr_repeat(3,minmax(80px,100px))] gap-2 sm:gap-3 items-center border-b border-slate-100 py-3 text-xs sm:text-sm text-slate-700">
              <span className="font-medium truncate">{channel.label}</span>
              {(['checkout', 'withdrawal', 'disbursement'] as const).map(flow => {
                const enabled = current[flow].includes(channel.id);
                return <button key={flow} type="button" onClick={() => toggle(flow, channel.id)} aria-label={`${channel.label} ${flow}`} aria-pressed={enabled} className={`motion-interactive w-fit mx-auto rounded-full px-2 py-1 text-xs font-semibold ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{enabled ? 'On' : 'Off'}</button>;
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-semibold text-slate-900">PHP checkout banks</h3>
        <p className="mt-1 text-sm text-slate-500">Turn individual SwiftPay institutions on or off for the public checkout page.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {phpInstitutionOptions.map(institution => {
            const enabled = (config.PHP?.checkout_institutions || phpInstitutionOptions.map(option => option.id)).includes(institution.id);
            return <button key={institution.id} type="button" onClick={() => toggleInstitution(institution.id)} aria-pressed={enabled} className={`motion-interactive flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-medium ${enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}><span>{institution.label}</span><span>{enabled ? 'On' : 'Off'}</span></button>;
          })}
        </div>
      </div>
    </div>
  );
}

type WalletLimitValues = {
  max_incoming: number;
  minimum_balance: number;
  minimum_deposit: number;
  max_withdrawal_daily: number;
  max_withdrawal_monthly: number;
};

type DepositAccount = {
  value: string;
  label: string;
  account_number: string;
  account_name: string;
  currency: string;
  swift_code?: string;
  receiving_currency?: string;
  bank_code?: string;
  branch_code?: string;
  bank_address?: string;
  minimum_amount?: number;
};

function CheckoutDesignTab({ onError }: { onError: (message: string) => void }) {
  const [design, setDesign] = useState({ display_name: '', primary_color: '#071B3A', accent_color: '#1475D1', page_background: '#F9FAFB', heading_color: '#0F172A', body_text_color: '#475569', card_radius: 24, payment_layout: 'grid', payment_alignment: 'left', show_powered_by: true });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    fetch('/api/v1/app-settings/checkout-design').then(async response => {
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setDesign(current => ({ ...current, ...(data.design || {}) }));
    }).catch(error => onError(error instanceof Error ? error.message : 'Failed to load checkout design'));
  }, [onError]);
  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/v1/app-settings/checkout-design', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ design }) });
      if (!response.ok) throw new Error(await response.text());
      setDesign((await response.json()).design);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to save checkout design');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div><h2 className="text-lg font-semibold text-slate-900">Checkout Design</h2><p className="mt-1 text-sm text-slate-500">Customize the public checkout appearance.</p></div>
        <Button onClick={save} disabled={saving} className="bg-[#FF6B00] text-white hover:bg-[#E66000]">{saving ? 'Saving...' : 'Save changes'}</Button>
      </div>
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 sm:p-6">
        <label className="md:col-span-2 text-sm font-semibold text-slate-700">Checkout display name<input value={design.display_name} maxLength={80} onChange={event => setDesign(current => ({ ...current, display_name: event.target.value }))} placeholder="Leave blank to use the merchant name" className="mt-1.5 h-10 w-full rounded-lg border px-3 font-normal text-slate-900" /></label>
        {(['primary_color', 'accent_color', 'page_background'] as const).map(key => (
          <label key={key} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-semibold capitalize text-slate-700">
            {key.replace('_', ' ')}
            <span className="flex items-center gap-2"><input type="color" value={design[key]} onChange={event => setDesign(current => ({ ...current, [key]: event.target.value }))} className="h-9 w-12" /><input value={design[key]} onChange={event => setDesign(current => ({ ...current, [key]: event.target.value }))} className="h-9 w-24 rounded-lg border px-2 font-mono text-xs uppercase" /></span>
          </label>
        ))}
        {(['heading_color', 'body_text_color'] as const).map(key => (
          <label key={key} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-semibold capitalize text-slate-700">{key.replace('_', ' ')}<input type="color" value={design[key]} onChange={event => setDesign(current => ({ ...current, [key]: event.target.value }))} className="h-9 w-12" /></label>
        ))}
        <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700">Card radius<input type="number" min="8" max="48" value={design.card_radius} onChange={event => setDesign(current => ({ ...current, card_radius: Number(event.target.value) || 8 }))} className="h-9 w-20 rounded-lg border px-2" /></label>
        <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700">Payment channel layout<select value={design.payment_layout} onChange={event => setDesign(current => ({ ...current, payment_layout: event.target.value }))} className="h-9 rounded-lg border px-2 font-normal"><option value="grid">Grid cards</option><option value="list">List rows</option></select></label>
        <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700">Channel alignment<select value={design.payment_alignment} onChange={event => setDesign(current => ({ ...current, payment_alignment: event.target.value }))} className="h-9 rounded-lg border px-2 font-normal"><option value="left">Left</option><option value="center">Center</option></select></label>
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 md:col-span-2"><input type="checkbox" checked={design.show_powered_by} onChange={event => setDesign(current => ({ ...current, show_powered_by: event.target.checked }))} /> Show “Powered by SwiftPay”</label>
        <div className="border p-5 md:col-span-2" style={{ backgroundColor: design.page_background, borderColor: design.accent_color, borderRadius: design.card_radius }}><div className="rounded-xl p-4 text-white" style={{ backgroundColor: design.primary_color }}>Checkout preview<button type="button" className="ml-3 rounded-lg px-3 py-1 text-sm" style={{ backgroundColor: design.accent_color }}>Pay Now</button></div></div>
      </section>
    </div>
  );
}

function WalletSettingsTab({ onError }: { onError: (message: string) => void }) {
  const currencies = ['PHP', 'CNY', 'KRW', 'USDT'];
  const depositCurrencies = ['PHP', 'CNY', 'KRW', 'USD', 'USDT'];
  const receivingCurrencies = ['PHP', 'KRW', 'CNY', 'HKD', 'USD', 'USDT'];
  const [currency, setCurrency] = useState('PHP');
  const [limits, setLimits] = useState<Record<string, WalletLimitValues>>({});
  const [depositRules, setDepositRules] = useState({
    bank_deposit_currencies: ['PHP', 'KRW'],
    topup_currencies: ['PHP', 'USDT', 'KRW'],
    receipt_max_size_mb: 10,
    first_usdt_topup_amount: 600,
    first_usdt_topup_rule_enabled: true,
  });
  const [depositAccounts, setDepositAccounts] = useState<DepositAccount[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/app-settings/wallet-limits');
      if (!response.ok) throw new Error(await response.text());
      setLimits((await response.json()).limits || {});
      const rulesResponse = await fetch('/api/v1/app-settings/deposit-rules');
      if (!rulesResponse.ok) throw new Error(await rulesResponse.text());
      setDepositRules((await rulesResponse.json()).rules || depositRules);
      const accountsResponse = await fetch('/api/v1/app-settings/deposit-accounts');
      if (!accountsResponse.ok) throw new Error(await accountsResponse.text());
      setDepositAccounts((await accountsResponse.json()).accounts || []);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to load wallet settings');
    }

  }, [onError]);

  useEffect(() => { load(); }, [load]);

  const current = limits[currency] || {
    max_incoming: 0,
    minimum_balance: 0,
    minimum_deposit: 0,
    max_withdrawal_daily: 0,
    max_withdrawal_monthly: 0,
  };

  const update = (key: keyof WalletLimitValues, value: string) => {
    const parsed = value === '' ? 0 : Number(value);
    setLimits(previous => ({
      ...previous,
      [currency]: { ...current, [key]: Number.isFinite(parsed) ? parsed : 0 },
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/v1/app-settings/wallet-limits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limits }),
      });
      if (!response.ok) throw new Error(await response.text());
      setLimits((await response.json()).limits || limits);
      const rulesResponse = await fetch('/api/v1/app-settings/deposit-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: depositRules }),
      });
      if (!rulesResponse.ok) throw new Error(await rulesResponse.text());
      setDepositRules((await rulesResponse.json()).rules || depositRules);
      const accountsResponse = await fetch('/api/v1/app-settings/deposit-accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts: depositAccounts }),
      });
      if (!accountsResponse.ok) throw new Error(await accountsResponse.text());
      setDepositAccounts((await accountsResponse.json()).accounts || depositAccounts);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to save wallet settings');
    } finally {
      setSaving(false);
    }
  };

  const fields: Array<{ key: keyof WalletLimitValues; label: string; help: string }> = [
    { key: 'max_incoming', label: 'Maximum incoming amount', help: 'Maximum amount accepted in one incoming transaction.' },
    { key: 'minimum_balance', label: 'Minimum maintaining balance', help: 'Wallet balance must remain at or above this amount after withdrawal.' },
    { key: 'minimum_deposit', label: 'Minimum deposit', help: 'Smallest amount accepted for a deposit or top-up.' },
    { key: 'max_withdrawal_daily', label: 'Maximum withdrawal per day', help: 'Total withdrawal amount allowed from 00:00 UTC each day.' },
    { key: 'max_withdrawal_monthly', label: 'Maximum withdrawal per month', help: 'Total withdrawal amount allowed from the first day of each month.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">Wallet Settings</h2>
          <p className="mt-1 text-sm text-slate-500">Super-admin controls for wallet limits and configured receiving accounts.</p>
        </div>
        <Button onClick={save} disabled={saving} className="w-full shrink-0 bg-[#FF6B00] text-white hover:bg-[#E66000] sm:w-auto">{saving ? 'Saving...' : 'Save changes'}</Button>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Currency wallet limits</h3>
            <p className="text-sm text-slate-500">Configure limits independently for each supported wallet currency.</p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{currency} limits</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 sm:grid-cols-4" role="group" aria-label="Wallet settings currency">
          {currencies.map(value => (
            <button key={value} type="button" aria-pressed={currency === value} onClick={() => setCurrency(value)} className={`motion-interactive rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${currency === value ? 'bg-white text-[#FF6B00] shadow-sm' : 'text-slate-500 hover:bg-white/70 hover:text-slate-700'}`}>{value}</button>
          ))}
        </div>
        <div className="mt-5 grid items-start gap-x-6 gap-y-5 md:grid-cols-2">
          {fields.map(field => (
            <div key={field.key} className="min-w-0 space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">{field.label} ({currency})</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={current[field.key] || ''}
                onChange={event => update(field.key, event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 focus:border-[#FF6B00] focus:outline-none focus:ring-4 focus:ring-[#FF6B00]/5"
              />
              <p className="min-h-8 text-xs leading-4 text-slate-400">{field.help}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900">Bank deposit information</h3>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500">
              Add the receiving accounts that users should see when making a bank deposit. For KRW, one normal account is assigned randomly to each customer session. You can also configure high-value accounts with a minimum collection amount (for example, 400,000 KRW); one eligible account is then assigned randomly for that deposit. These details are also used in Telegram deposit instructions.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full shrink-0 gap-2 sm:w-auto"
            onClick={() => setDepositAccounts(items => [...items, {
              value: `account-${items.length + 1}`,
              label: '',
              account_number: '',
              account_name: '',
              currency: 'PHP',
              swift_code: '',
              receiving_currency: '',
              bank_code: '',
              branch_code: '',
              bank_address: '',
              minimum_amount: undefined,
            }])}
          >
            <Plus className="h-4 w-4" />
            Add account
          </Button>
        </div>
        <div className="mt-5 space-y-3">
          {depositAccounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
              <WalletIcon className="mx-auto h-7 w-7 text-slate-400" />
              <p className="mt-2 text-sm font-semibold text-slate-700">No receiving accounts configured</p>
              <p className="mt-1 text-xs text-slate-500">Add an account so users know where to send their deposits.</p>
            </div>
          ) : depositAccounts.map((account, index) => (
            <div key={`${account.value}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-xs font-bold text-[#FF6B00]">{index + 1}</span>
                  <span className="truncate text-sm font-semibold text-slate-800">{account.label || 'New receiving account'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDepositAccounts(items => items.filter((_, itemIndex) => itemIndex !== index))}
                  className="motion-interactive inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  aria-label={`Remove ${account.label || 'receiving account'}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
              <div className="grid items-start gap-3 md:grid-cols-2 lg:grid-cols-4">
                <label className="min-w-0 space-y-1.5 text-xs font-semibold text-slate-600">
                  <span className="block">Account label</span>
                  <input value={account.label} placeholder="e.g. Netbank PHP" onChange={event => setDepositAccounts(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 focus:border-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/10" />
                </label>
                <label className="min-w-0 space-y-1.5 text-xs font-semibold text-slate-600">
                  <span className="block">Currency</span>
                  <select value={account.currency} onChange={event => setDepositAccounts(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, currency: event.target.value } : item))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 focus:border-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/10">
                    {depositCurrencies.map(value => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
                <label className="min-w-0 space-y-1.5 text-xs font-semibold text-slate-600">
                  <span className="block">Bank or provider</span>
                  <input value={account.value} placeholder="e.g. netbank" onChange={event => setDepositAccounts(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 focus:border-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/10" />
                </label>
                <label className="min-w-0 space-y-1.5 text-xs font-semibold text-slate-600">
                  <span className="block">Account number</span>
                  <input value={account.account_number} placeholder="Enter account number" onChange={event => setDepositAccounts(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, account_number: event.target.value } : item))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 focus:border-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/10" />
                </label>
                <label className="min-w-0 space-y-1.5 text-xs font-semibold text-slate-600">
                  <span className="block">SWIFT/BIC (optional)</span>
                  <input value={account.swift_code || ''} placeholder="e.g. ABCDKRSE" onChange={event => setDepositAccounts(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, swift_code: event.target.value } : item))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 focus:border-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/10" />
                </label>
                <label className="min-w-0 space-y-1.5 text-xs font-semibold text-slate-600">
                  <span className="block">Receiving currency (optional)</span>
                  <select value={account.receiving_currency || ''} onChange={event => setDepositAccounts(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, receiving_currency: event.target.value } : item))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900">
                    <option value="">Same as collection</option>
                    {receivingCurrencies.map(value => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
                <label className="min-w-0 space-y-1.5 text-xs font-semibold text-slate-600">
                  <span className="block">Minimum collection amount (optional)</span>
                  <input type="number" min="0" value={account.minimum_amount ?? ''} onChange={event => setDepositAccounts(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, minimum_amount: event.target.value ? Number(event.target.value) : undefined } : item))} placeholder="e.g. 400000 KRW" className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" />
                </label>
                <label className="min-w-0 space-y-1.5 text-xs font-semibold text-slate-600">
                  <span className="block">Bank code (optional)</span>
                  <input value={account.bank_code || ''} onChange={event => setDepositAccounts(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, bank_code: event.target.value } : item))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" />
                </label>
                <label className="min-w-0 space-y-1.5 text-xs font-semibold text-slate-600">
                  <span className="block">Branch code (optional)</span>
                  <input value={account.branch_code || ''} onChange={event => setDepositAccounts(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, branch_code: event.target.value } : item))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900" />
                </label>
                <label className="min-w-0 space-y-1.5 text-xs font-semibold text-slate-600 md:col-span-2 lg:col-span-4">
                  <span className="block">Bank address (optional)</span>
                  <input value={account.bank_address || ''} onChange={event => setDepositAccounts(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, bank_address: event.target.value } : item))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900" />
                </label>
                <label className="min-w-0 space-y-1.5 text-xs font-semibold text-slate-600 md:col-span-2 lg:col-span-4">
                  <span className="block">Account holder name</span>
                  <input value={account.account_name} placeholder="Enter the registered account holder name" onChange={event => setDepositAccounts(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, account_name: event.target.value } : item))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 focus:border-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/10" />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Deposit rules</h3>
          <p className="mt-1 text-sm text-slate-500">Configure accepted deposit currencies and onboarding rules.</p>
        </div>
        <div className="mt-5 grid items-start gap-x-6 gap-y-5 md:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            Bank deposit currencies
            <input
              value={depositRules.bank_deposit_currencies.join(', ')}
              onChange={event => setDepositRules(current => ({ ...current, bank_deposit_currencies: event.target.value.split(',').map(value => value.trim().toUpperCase()).filter(Boolean) }))}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal"
              placeholder="PHP, KRW"
            />
          </label>
          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            Top-up currencies
            <input
              value={depositRules.topup_currencies.join(', ')}
              onChange={event => setDepositRules(current => ({ ...current, topup_currencies: event.target.value.split(',').map(value => value.trim().toUpperCase()).filter(Boolean) }))}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal"
              placeholder="PHP, USDT, KRW"
            />
          </label>
          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            Maximum receipt size (MB)
            <input type="number" min="0" step="0.1" value={depositRules.receipt_max_size_mb} onChange={event => setDepositRules(current => ({ ...current, receipt_max_size_mb: Number(event.target.value) || 0 }))} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal" />
          </label>
          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            First USDT top-up amount
            <input type="number" min="0" step="0.01" value={depositRules.first_usdt_topup_amount} onChange={event => setDepositRules(current => ({ ...current, first_usdt_topup_amount: Number(event.target.value) || 0 }))} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal" />
          </label>
          <label className="flex min-h-10 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 md:col-span-2">
            <input type="checkbox" className="h-4 w-4 accent-[#FF6B00]" checked={depositRules.first_usdt_topup_rule_enabled} onChange={event => setDepositRules(current => ({ ...current, first_usdt_topup_rule_enabled: event.target.checked }))} />
            Enforce first USDT top-up amount rule
          </label>
        </div>
      </section>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PERMISSION_KEYS: { key: keyof AdminUser; label: string; color: string }[] = [
  { key: 'can_manage_payments', label: 'Payments', color: 'blue' },
  { key: 'can_manage_disbursements', label: 'Disbursements', color: 'emerald' },
  { key: 'can_view_reports', label: 'Reports', color: 'yellow' },
  { key: 'can_manage_wallet', label: 'Wallet', color: 'indigo' },
  { key: 'can_manage_transactions', label: 'Transactions', color: 'cyan' },
  { key: 'can_manage_bot', label: 'Bot Settings', color: 'slate' },
  { key: 'can_approve_topups', label: 'Approve Topups', color: 'teal' },
  { key: 'can_manage_team', label: 'Manage Team', color: 'orange' },
];

const defaultForm = {
  telegram_id: '',
  telegram_username: '',
  email: '',
  password: '',
  name: '',
  is_super_admin: false,
  can_manage_payments: true,
  can_manage_disbursements: true,
  can_view_reports: true,
  can_manage_wallet: true,
  can_manage_transactions: true,
  can_manage_bot: false,
  can_approve_topups: false,
  can_manage_team: false,
};

// ── Shared sub-components ─────────────────────────────────────────────────────


function PermissionBadge({
  active,
  label,
  color,
  onClick,
  interactive,
}: {
  active: boolean;
  label: string;
  color: string;
  onClick?: () => void;
  interactive: boolean;
}) {
  const activeStyles: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      aria-pressed={interactive ? active : undefined}
      className={`motion-interactive inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold shadow-sm
        ${active
          ? activeStyles[color] || 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-slate-50 border-slate-100 text-slate-400'
        }
        ${interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-current' : 'bg-slate-300'}`} />
      {label}
    </button>
  );
}

function AdminSidebar({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; icon: React.ReactNode; count?: number; description?: string; group?: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav aria-label="Administration sections" className="flex flex-col gap-1 w-full lg:w-72 shrink-0">
      <div className="hidden lg:flex flex-col gap-1">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <React.Fragment key={tab.id}>
              {tab.group && (tabs.findIndex(item => item.id === tab.id) === 0 || tabs[tabs.findIndex(item => item.id === tab.id) - 1]?.group !== tab.group) && (
                <p className="mb-1 mt-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 first:mt-0">{tab.group}</p>
              )}
              <button
                type="button"
                onClick={() => onChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={tab.description ? `${tab.label}: ${tab.description}` : tab.label}
                className={`motion-interactive flex items-start gap-3 rounded-xl border p-3 text-left group ${
                  isActive ? 'bg-slate-900/40 border-[#FF6B00]/30 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-900/20'
                }`}
              >
                <div className={`mt-0.5 rounded-lg p-2 transition-colors ${isActive ? 'bg-[#FF6B00] text-white' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'}`}>
                  {tab.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[13px] font-semibold ${isActive ? 'text-[#FF6B00]' : 'text-slate-300 group-hover:text-white'}`}>{tab.label}</span>
                    {tab.count !== undefined && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isActive ? 'bg-[#FF6B00] text-white' : 'bg-slate-800 text-slate-500'}`}>{tab.count}</span>}
                  </div>
                  {tab.description && <p className={`mt-1 line-clamp-2 text-[11px] font-medium leading-relaxed ${isActive ? 'text-[#FF6B00]/70' : 'text-slate-500'}`}>{tab.description}</p>}
                </div>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile: 2-column grid */}
      <div className="lg:hidden grid grid-cols-2 gap-2 bg-slate-900/20 border border-white/5 rounded-2xl p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-current={active === tab.id ? 'page' : undefined}
            aria-label={tab.label}
            className={`motion-interactive flex flex-col items-center justify-center gap-2 p-3 rounded-xl text-center border ${
              active === tab.id
                ? 'bg-slate-900 border-[#FF6B00]/30 text-[#FF6B00]'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className={`p-2 rounded-lg ${active === tab.id ? 'bg-[#FF6B00] text-white' : 'bg-slate-800 text-slate-500'}`}>
              {tab.icon}
            </div>
            <span className="text-[11px] font-semibold truncate w-full">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function formatDate(dt: string | null): string {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Admin Users Tab ───────────────────────────────────────────────────────────

function AdminCard({
  admin,
  isSuperAdmin,
  onToggleActive,
  onTogglePermission,
  onDelete,
  onEditBank,
  onEditApiKeys,
  onEditPassword,
  onEditFees,
}: {
  admin: AdminUser;
  isSuperAdmin: boolean;
  onToggleActive: (a: AdminUser) => void;
  onTogglePermission: (a: AdminUser, key: keyof AdminUser) => void;
  onDelete: (a: AdminUser) => void;
  onEditBank: (a: AdminUser) => void;
  onEditApiKeys: (a: AdminUser) => void;
  onEditPassword: (a: AdminUser) => void;
  onEditFees: (a: AdminUser) => void;
}) {
  return (
    <Card className={`border-slate-200 transition-all duration-300 hover:shadow-md ${
      admin.is_active
        ? 'bg-white opacity-100'
        : 'bg-slate-50/50 opacity-75'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
              admin.is_super_admin
                ? 'bg-amber-100 border-amber-200 text-amber-600'
                : 'bg-blue-100 border-blue-200 text-blue-600'
            }`}>
              {admin.is_super_admin
                ? <Crown className="h-6 w-6" />
                : <User className="h-6 w-6" />
              }
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-900 truncate">
                  {admin.name || admin.telegram_username || `Merchant ID: ${admin.telegram_id}`}
                </span>
                {admin.telegram_username && (
                  <span className="text-blue-500 text-xs font-semibold">@{admin.telegram_username}</span>
                )}
                <div className="flex items-center gap-1.5 ml-1">
                  {admin.is_super_admin && (
                    <Badge className="bg-amber-100 border-amber-200 text-amber-700 text-[9px] font-semibold uppercase tracking-widest px-2 h-5">
                      SUPER
                    </Badge>
                  )}
                  <Badge className={`text-[9px] font-semibold uppercase tracking-widest px-2 h-5 border ${
                    admin.is_active
                      ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                      : 'bg-slate-200 border-slate-300 text-slate-500'
                  }`}>
                    {admin.is_active ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
              </div>
              <p className="text-[12px] text-slate-500 mt-1 font-medium">TGID: <span className="font-mono">{admin.telegram_id}</span></p>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEditPassword(admin)}
                aria-label={`Change dashboard password for ${admin.name || admin.telegram_username || admin.telegram_id}`}
                title="Change Dashboard Password"
                className="p-2 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all"
              >
                <KeyRound aria-hidden="true" className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={() => onEditBank(admin)}
                aria-label={`Edit bank information for ${admin.name || admin.telegram_username || admin.telegram_id}`}
                title="Edit Bank Information"
                className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                <Tag aria-hidden="true" className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={() => onEditApiKeys(admin)}
                aria-label={`Edit API keys for ${admin.name || admin.telegram_username || admin.telegram_id}`}
                title="Edit API Keys"
                className="p-2 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all"
              >
                <KeyRound aria-hidden="true" className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={() => onEditFees(admin)}
                aria-label={`Edit fee settings for ${admin.name || admin.telegram_username || admin.telegram_id}`}
                title="Edit Fee Settings"
                className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-2.5 py-2 text-xs font-semibold text-orange-700 transition-all hover:bg-orange-100"
              >
                <DollarSign aria-hidden="true" className="h-4.5 w-4.5" />
                <span>Fees</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleActive(admin)}
                title={admin.is_active ? 'Deactivate' : 'Activate'}
                aria-label={`${admin.is_active ? 'Deactivate' : 'Activate'} ${admin.name || admin.telegram_username || admin.telegram_id}`}
                className={`p-2 rounded-xl transition-all ${
                  admin.is_active
                    ? 'text-amber-500 hover:bg-amber-50'
                    : 'text-emerald-500 hover:bg-emerald-50'
                }`}
              >
                {admin.is_active ? <PowerOff className="h-4.5 w-4.5" /> : <Power className="h-4.5 w-4.5" />}
              </button>
              <button
                type="button"
                onClick={() => onDelete(admin)}
                title="Remove administrator"
                aria-label={`Remove administrator ${admin.name || admin.telegram_username || admin.telegram_id}`}
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
              >
                <Trash2 aria-hidden="true" className="h-4.5 w-4.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {PERMISSION_KEYS.map(({ key, label, color }) => (
            <PermissionBadge
              key={key}
              active={admin[key] as boolean}
              label={label}
              color={color}
              onClick={() => onTogglePermission(admin, key)}
              interactive={isSuperAdmin}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FeeSettingsModal({
  admin,
  onClose,
  onSaved,
  onError,
}: {
  admin: AdminUser;
  onClose: () => void;
  onSaved: (updated: AdminUser) => void;
  onError: (message: string) => void;
}) {
  const [baseFee, setBaseFee] = useState(String(admin.service_fee_percent ?? 0));
  const [exchangeRateFee, setExchangeRateFee] = useState(String(admin.exchange_rate_fee_percent ?? 0));
  const [collectionFee, setCollectionFee] = useState(String(admin.collection_fee_percent ?? 0));
  const [withdrawalFees, setWithdrawalFees] = useState({
    PHP: String(admin.withdrawal_fee_php ?? 15),
    KRW: String(admin.withdrawal_fee_krw ?? 1500),
    USDT: String(admin.withdrawal_fee_usdt ?? 1),
    CNY: String(admin.withdrawal_fee_cny ?? 10),
    USD: String(admin.withdrawal_fee_usd ?? 1),
  });
  const [saving, setSaving] = useState(false);

  const updateWithdrawalFee = (currency: keyof typeof withdrawalFees, value: string) => {
    setWithdrawalFees(current => ({ ...current, [currency]: value }));
  };

  const save = async () => {
    const exchangeValue = Number(exchangeRateFee);
    const collectionValue = Number(collectionFee);
    const baseValue = Number(baseFee);
    const parsedWithdrawals = Object.fromEntries(
      Object.entries(withdrawalFees).map(([currency, value]) => [currency, Number(value)]),
    );
    const values = [baseValue, exchangeValue, collectionValue, ...Object.values(parsedWithdrawals)];
    if (values.some(value => !Number.isFinite(value) || value < 0) || baseValue > 100 || exchangeValue > 100 || collectionValue > 100) {
      onError('Percentage fees must be between 0 and 100. Withdrawal fees must be non-negative.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/v1/admin-users/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_fee_percent: baseValue,
          exchange_rate_fee_percent: exchangeValue,
          collection_fee_percent: collectionValue,
          withdrawal_fee_php: parsedWithdrawals.PHP,
          withdrawal_fee_krw: parsedWithdrawals.KRW,
          withdrawal_fee_usdt: parsedWithdrawals.USDT,
          withdrawal_fee_cny: parsedWithdrawals.CNY,
          withdrawal_fee_usd: parsedWithdrawals.USD,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      onSaved(await response.json());
      onClose();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to save fee settings');
    } finally {
      setSaving(false);
    }
  };

  const withdrawalFields = [
    ['PHP', 'PHP fee'],
    ['KRW', 'KRW fee'],
    ['USDT', 'USDT fee'],
    ['CNY', 'CNY fee'],
    ['USD', 'USD fee'],
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="fee-settings-title">
      <Card className="w-full max-w-2xl border-slate-200 bg-white shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
          <div>
            <CardTitle id="fee-settings-title" className="text-slate-900">Fee Settings</CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              {admin.name || admin.telegram_username || admin.telegram_id}
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close fee settings">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Base fee for downline (%)</span>
              <input type="number" min="0" max="100" step="0.01" value={baseFee} onChange={event => setBaseFee(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              <span className="block text-xs text-slate-400">The super-admin-assigned base used for this user’s direct invite tree.</span>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Exchange-rate fee (%)</span>
              <input type="number" min="0" step="0.01" value={exchangeRateFee} onChange={event => setExchangeRateFee(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Collection fee (%)</span>
              <input type="number" min="0" step="0.01" value={collectionFee} onChange={event => setCollectionFee(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            </label>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Fixed withdrawal fees</h3>
            <p className="mb-3 text-xs text-slate-400">These are fixed amounts in the withdrawal currency, not percentages.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {withdrawalFields.map(([currency, label]) => (
                <label key={currency} className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">{label}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={withdrawalFees[currency]}
                    onChange={event => updateWithdrawalFee(currency, event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save fee settings'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── User Management Tab ───────────────────────────────────────────────────────

function UserManagementTab({
  isSuperAdmin,
  onError,
}: {
  isSuperAdmin: boolean;
  onError: (msg: string) => void;
}) {
  const { user } = useAuth();
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [details, setDetails] = useState<UserActivityDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/team/members?include_inactive=true');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setUsers((data.members || []).map((member: RegisteredUser) => ({
        admin_id: Number(member.id),
        id: String(member.telegram_id || member.id),
        email: member.email || '—',
        name: member.name,
        role: member.role || 'user',
        created_at: member.joined_at || null,
        last_login: null,
        telegram_id: member.telegram_id,
        organization_name: member.organization_name,
        service_fee_percent: member.service_fee_percent || 0,
        added_by: member.added_by,
        is_active: member.is_active,
        vip_gold: Boolean(member.vip_gold),
      })));
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleViewActivity = async (user: RegisteredUser) => {
    setSelectedUser(user);
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/v1/users/${encodeURIComponent(user.id)}/activity`);
      if (!res.ok) throw new Error(await res.text());
      setDetails(await res.json());
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Failed to load user activity');
      setDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleVipGoldChange = async (member: RegisteredUser) => {
    if (!isSuperAdmin || !member.telegram_id) return;
    try {
      const res = await fetch(`/api/v1/team/members/${encodeURIComponent(member.telegram_id)}/vip-gold`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vip_gold: !member.vip_gold }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchUsers();
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Failed to update VIP Gold status');
    }
  };

  const handleUserStatusChange = async (member: RegisteredUser) => {
    if (!isSuperAdmin || !member.admin_id) return;
    try {
      const res = await fetch(`/api/v1/admin-users/${member.admin_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !member.is_active }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchUsers();
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Failed to update user status');
    }
  };

  const handleUserRoleChange = async (member: RegisteredUser, role: string) => {
    if (!isSuperAdmin || !member.admin_id || !role) return;
    try {
      const res = await fetch(`/api/v1/admin-users/${member.admin_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchUsers();
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Failed to update user role');
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();
    return !query || [user.name, user.email, user.id].some(value => String(value || '').toLowerCase().includes(query));
  });

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="motion-skeleton h-14 rounded-xl bg-card border border-border" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex flex-col items-center justify-center py-14 text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
            <Users className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-foreground font-semibold text-sm">No users yet</p>
          <p className="text-muted-foreground text-xs mt-1">Users will appear here once they log in.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, email, ID, or role"
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/5 sm:max-w-md"
        />
        <span className="text-xs font-medium text-slate-500">{filteredUsers.length} of {users.length} users</span>
      </div>

      {selectedUser && (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 border-b border-slate-100 pb-4">
            <div>
              <CardTitle className="text-base text-slate-900">{selectedUser.name || selectedUser.email}</CardTitle>
              <p className="mt-1 text-xs text-slate-500">{selectedUser.email} · {selectedUser.role}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(null); setDetails(null); }}>Close</Button>
          </CardHeader>
          <CardContent className="space-y-5 p-4">
            {detailsLoading ? (
              <div className="motion-skeleton h-24 rounded-xl bg-slate-100" />
            ) : details ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {details.wallets.map(wallet => (
                    <div key={wallet.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{wallet.currency} balance</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="mt-1 text-[11px] text-slate-500">Available {wallet.available_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  ))}
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                      <tr><th className="px-2 sm:px-3 py-3 whitespace-nowrap">Date</th><th className="px-2 sm:px-3 py-3 whitespace-nowrap">Type</th><th className="px-2 sm:px-3 py-3 whitespace-nowrap text-right">Amount</th><th className="px-2 sm:px-3 py-3 whitespace-nowrap">Status</th><th className="hidden sm:table-cell px-2 sm:px-3 py-3 whitespace-nowrap">Reference</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {details.activity.map((item, index) => (
                        <tr key={`${item.kind}-${item.id}-${index}`}>
                          <td className="whitespace-nowrap px-2 sm:px-3 py-3 text-slate-500 text-xs">{formatDate(item.created_at)}</td>
                          <td className="px-2 sm:px-3 py-3 font-medium text-slate-700 whitespace-nowrap text-xs">{item.type}</td>
                          <td className="px-2 sm:px-3 py-3 font-semibold text-slate-900 text-right text-xs">{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {item.currency || ''}</td>
                          <td className="px-2 sm:px-3 py-3 text-slate-600 text-xs">{item.status || '—'}</td>
                          <td className="hidden sm:table-cell max-w-[150px] truncate px-2 sm:px-3 py-3 font-mono text-slate-500 text-xs">{item.reference_id || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {details.activity.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No activity recorded.</p>}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Header row */}
      <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span>User</span>
        <span className="text-right">Created</span>
        <span className="text-right">Last Login</span>
      </div>
      {filteredUsers.map((user) => (
        <Card key={user.id} className="motion-interactive bg-card border-border hover:border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              {/* Identity */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                  user.role === 'admin'
                    ? 'bg-blue-500/15 border border-blue-500/25'
                    : 'bg-muted/50 border border-border/40'
                }`}>
                  {user.role === 'admin'
                    ? <ShieldCheck className="h-4 w-4 text-blue-400" />
                    : <User className="h-4 w-4 text-muted-foreground" />
                  }
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground truncate">
                      {user.name || user.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground truncate">{user.email}</span>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  title={user.vip_gold ? 'Remove VIP Gold' : 'Assign VIP Gold'}
                  onClick={() => handleVipGoldChange(user)}
                  className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-[10px] font-semibold transition-colors ${user.vip_gold ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-600'}`}
                >
                  <Crown className={`h-3 w-3 ${user.vip_gold ? 'fill-amber-400 text-amber-600' : ''}`} />
                  {user.vip_gold ? 'VIP Gold' : 'VIP'}
                </button>
                <select
                  aria-label={`Role for ${user.name || user.email}`}
                  value={user.role}
                  onChange={event => handleUserRoleChange(user, event.target.value)}
                  disabled={!isSuperAdmin || user.role === 'super_admin'}
                  className="h-7 rounded-full border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-600 disabled:opacity-60"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="co_admin">Co-admin</option>
                  <option value="agent">Agent</option>
                  {user.role === 'super_admin' && <option value="super_admin">Super admin</option>}
                </select>
                <button
                  type="button"
                  onClick={() => handleUserStatusChange(user)}
                  disabled={!isSuperAdmin}
                  className={`inline-flex h-7 items-center rounded-full border px-2 text-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${user.is_active ? 'border-emerald-200 text-emerald-700 hover:border-red-300 hover:text-red-600' : 'border-red-200 text-red-600 hover:border-emerald-300 hover:text-emerald-700'}`}
                >
                  {user.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <div className="hidden sm:flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(user.created_at)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Last: {formatDate(user.last_login)}
                  </div>
                </div>

              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface AuditLogEntry {
  id: number;
  admin_id: string;
  admin_name: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: string | null;
  payload: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

function AuditLogsTab({ onError }: { onError: (msg: string) => void }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [adminIdFilter, setAdminIdFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [targetIdFilter, setTargetIdFilter] = useState('');
  const [purgeDays, setPurgeDays] = useState('90');
  const [purging, setPurging] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter) params.set('action', actionFilter);
      if (adminIdFilter) params.set('admin_id', adminIdFilter);
      if (targetTypeFilter) params.set('target_type', targetTypeFilter);
      if (targetIdFilter) params.set('target_id', targetIdFilter);
      params.set('limit', '25');

      const res = await fetch(`/api/v1/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setLogs(data.items || []);
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, adminIdFilter, onError, targetIdFilter, targetTypeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set('action', actionFilter);
      if (adminIdFilter) params.set('admin_id', adminIdFilter);
      if (targetTypeFilter) params.set('target_type', targetTypeFilter);
      if (targetIdFilter) params.set('target_id', targetIdFilter);

      const url = `/api/v1/audit-logs/export?${params.toString()}`;
      const response = await client.get(url);
      if (!response.ok) {
        const detail = typeof response.data === 'string' ? response.data : 'Failed to export audit logs';
        throw new Error(detail);
      }
      const blob = new Blob([String(response.data || '')], { type: 'text/csv;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'audit_logs.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Failed to export audit logs');
    }
  };

  const handlePurge = async () => {
    const days = Number.parseInt(purgeDays, 10);
    if (Number.isNaN(days) || days < 0) {
      onError('Retention days must be a valid number greater than or equal to 0.');
      return;
    }

    const confirmed = window.confirm(`Delete audit records older than ${days} day${days === 1 ? '' : 's'}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setPurging(true);
      const res = await fetch(`/api/v1/audit-logs/purge?days=${days}`, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to purge audit logs');
      }
      await fetchLogs();
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Failed to purge audit logs');
    } finally {
      setPurging(false);
    }
  };

  const summaryStats = [
    {
      label: 'Visible Logs',
      value: String(logs.length),
      hint: 'Current filtered result',
    },
    {
      label: 'Distinct Admins',
      value: String(new Set(logs.map((log) => log.admin_id)).size),
      hint: 'Active operators',
    },
    {
      label: 'Top Action',
      value: (() => {
        const counts = logs.reduce<Record<string, number>>((acc, log) => {
          acc[log.action] = (acc[log.action] ?? 0) + 1;
          return acc;
        }, {});
        const [topAction] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? ['—', 0];
        return topAction;
      })(),
      hint: 'Most frequent action',
    },
    {
      label: 'Last Activity',
      value: logs[0] ? new Date(logs[0].created_at).toLocaleString() : '—',
      hint: 'Newest result',
    },
  ];

  const adminBreakdown = Object.entries(
    logs.reduce<Record<string, number>>((acc, log) => {
      const key = log.admin_name || log.admin_id || 'Unknown';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const recentActivity = [...logs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col xl:flex-row xl:items-end gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Action</label>
              <input
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                placeholder="filter by action"
                className="w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00]/60"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Admin ID</label>
              <input
                value={adminIdFilter}
                onChange={(e) => setAdminIdFilter(e.target.value)}
                placeholder="filter by admin id"
                className="w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00]/60"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Target Type</label>
              <input
                value={targetTypeFilter}
                onChange={(e) => setTargetTypeFilter(e.target.value)}
                placeholder="e.g. admin_user"
                className="w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00]/60"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Target ID</label>
              <input
                value={targetIdFilter}
                onChange={(e) => setTargetIdFilter(e.target.value)}
                placeholder="filter by target id"
                className="w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00]/60"
              />
            </div>
            <div className="w-[150px]">
              <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Purge Days</label>
              <input
                type="number"
                min="0"
                value={purgeDays}
                onChange={(e) => setPurgeDays(e.target.value)}
                className="w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00]/60"
              />
            </div>
            <Button variant="outline" onClick={handlePurge} disabled={purging} className="h-11 px-4 rounded-xl border-red-500/40 text-red-300 hover:bg-red-500/10">
              {purging ? 'Purging...' : 'Purge Old Logs'}
            </Button>
            <Button onClick={handleExport} className="bg-[#FF6B00] hover:bg-[#E66000] text-white h-11 px-4 rounded-xl">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {!loading && (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {summaryStats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                <p className="mt-3 text-xl font-semibold text-foreground break-words">{stat.value}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{stat.hint}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            {adminBreakdown.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">Top Activity by Admin</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {adminBreakdown.map(([admin, count], idx) => (
                      <div key={admin} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FF6B00]/10 text-[10px] font-bold text-[#FF6B00]">
                            {idx + 1}
                          </span>
                          <span className="truncate text-sm text-foreground">{admin}</span>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">{count} actions</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {recentActivity.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {recentActivity.map((log) => (
                      <div key={log.id} className="rounded-lg bg-muted/40 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{log.admin_name || log.admin_id}</span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="mt-1 text-xs text-[#FF6B00] font-medium">{log.action}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{log.details || log.target_type || 'Audit entry'}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="motion-skeleton h-20 rounded-xl bg-card border border-border" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-foreground font-semibold text-sm">No audit logs found</p>
            <p className="text-muted-foreground text-xs mt-1">Matching audit entries will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Admin</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Target</th>
                  <th className="px-4 py-3 font-semibold">Details</th>
                  <th className="px-4 py-3 font-semibold">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-border/80 align-top">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{log.admin_name || log.admin_id}</div>
                      <div className="text-[11px] text-muted-foreground">{log.admin_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-[#FF6B00]/10 border border-[#FF6B00]/20 px-2 py-1 text-[11px] font-medium text-[#FF6B00]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="text-foreground font-medium">{log.target_type || '—'}</div>
                      <div className="text-muted-foreground">{log.target_id || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-md">
                      {log.details || JSON.stringify(log.payload || {}) || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {log.ip_address || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Crypto Requests Tab ───────────────────────────────────────────────────────

function RequestCard({
  req,
  canApproveTopups,
  actionId,
  onAction,
}: {
  req: CryptoTopupRequest;
  canApproveTopups: boolean;
  actionId: number | null;
  onAction: (id: number, action: 'approve' | 'reject') => void;
}) {
  const isPending = req.status === 'pending';
  const isProcessing = actionId === req.id;
  return (
    <Card className={`border transition-colors duration-150 ${
      isPending
        ? 'bg-card border-border hover:border-teal-500/30'
        : 'bg-background/40 border-border/30'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
              req.status === 'approved'
                ? 'bg-emerald-500/15 border-emerald-500/25'
                : req.status === 'rejected'
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-teal-500/10 border-teal-500/20'
            }`}>
              {req.status === 'approved'
                ? <CheckCircle className="h-4 w-4 text-emerald-400" />
                : req.status === 'rejected'
                ? <XCircle className="h-4 w-4 text-red-400" />
                : <Clock className="h-4 w-4 text-amber-400" />
              }
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-foreground">${req.amount_usdt.toFixed(2)} USDT</span>
                <Badge className={`text-[9px] px-1.5 py-0 h-4 border ${
                  req.status === 'approved'
                    ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
                    : req.status === 'rejected'
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                  {req.status.toUpperCase()}
                </Badge>
                <Badge className="bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[9px] px-1.5 py-0 h-4">
                  {req.network}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5" title={req.tx_hash}>
                TX: {req.tx_hash}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] text-muted-foreground">User: {req.user_id}</span>
                {req.created_at && (
                  <span className="text-[10px] text-muted-foreground">{formatDate(req.created_at)}</span>
                )}
              </div>
            </div>
          </div>

          {isPending && canApproveTopups && (
            <div className="flex flex-row items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                disabled={!!actionId}
                onClick={() => onAction(req.id, 'approve')}
                className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isProcessing
                  ? <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent motion-safe:animate-spin" />
                  : <><CheckCircle className="h-3.5 w-3.5 mr-1" />Approve</>}
              </Button>
              <Button
                size="sm"
                disabled={!!actionId}
                onClick={() => onAction(req.id, 'reject')}
                className="h-7 px-2.5 text-xs bg-muted hover:bg-red-600/80 text-muted-foreground hover:text-white"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />Reject
              </Button>
            </div>
          )}

          {!isPending && req.reviewed_by && (
            <div className="text-right shrink-0 text-[10px] text-muted-foreground">
              <p>By: {req.reviewed_by}</p>
              {req.reviewed_at && <p>{formatDate(req.reviewed_at)}</p>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CryptoRequestsTab({
  canApproveTopups,
  onError,
}: {
  canApproveTopups: boolean;
  onError: (msg: string) => void;
}) {
  const [requests, setRequests] = useState<CryptoTopupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/wallet/crypto-topup-requests');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRequests(data.items || []);
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Failed to load crypto requests');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    fetchRequests();
    const id = setInterval(fetchRequests, 30000);
    return () => clearInterval(id);
  }, [fetchRequests]);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    if (!canApproveTopups) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/v1/wallet/crypto-topup-requests/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Action failed');
      }
      await fetchRequests();
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const reviewed = requests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="motion-skeleton h-20 rounded-xl bg-card border border-border" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex flex-col items-center justify-center py-14 text-center">
          <div className="h-14 w-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-3">
            <Bitcoin className="h-7 w-7 text-teal-500" />
          </div>
          <p className="text-foreground font-semibold text-sm">No crypto top-up requests</p>
          <p className="text-muted-foreground text-xs mt-1">Requests submitted by users will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!canApproveTopups && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/80">You have view-only access. Wallet management permission is required to approve or reject requests.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            Pending ({pending.length})
          </p>
          <div className="space-y-2">
            {pending.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                canApproveTopups={canApproveTopups}
                actionId={actionId}
                onAction={handleAction}
              />
            ))}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Reviewed ({reviewed.length})
          </p>
          <div className="space-y-2">
            {reviewed.slice(0, 20).map(req => (
              <RequestCard
                key={req.id}
                req={req}
                canApproveTopups={canApproveTopups}
                actionId={actionId}
                onAction={handleAction}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Wallet Control (Super Admin Only) ────────────────────────────────────────

function WalletControlTab({ onError }: { onError: (msg: string) => void }) {
  const [wallets, setWallets] = useState<AdminWalletEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<Record<string, string>>({});
  const [adjustNote, setAdjustNote] = useState<Record<string, string>>({});
  const [freezing, setFreezing] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true);
      setWallets(await walletApi.listAdminWallets());
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Failed to load wallets');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  const filteredWallets = wallets.filter(wallet => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch = !normalizedSearch || [
      wallet.name,
      wallet.email,
      wallet.telegram_username,
      wallet.user_id,
    ].some(value => value?.toLowerCase().includes(normalizedSearch));
    const matchesCurrency = currencyFilter === 'all' || wallet.currency === currencyFilter;
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'frozen' && wallet.is_frozen)
      || (statusFilter === 'active' && !wallet.is_frozen);
    return matchesSearch && matchesCurrency && matchesStatus;
  });

  const handleAdjust = async (wallet: AdminWalletEntry, isCredit: boolean) => {
    const rawAmount = Number(adjustAmount[wallet.wallet_id] || 0);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      onError('Enter a valid positive amount');
      return;
    }
    if (!adjustNote[wallet.wallet_id]?.trim()) {
      onError('A note is required for every wallet adjustment');
      return;
    }
    setAdjusting(String(wallet.wallet_id));
    try {
      await walletApi.adjustAdminWallet({
        user_id: wallet.user_id,
        currency: wallet.currency,
        amount: isCredit ? rawAmount : -rawAmount,
        note: adjustNote[wallet.wallet_id] || '',
      });
      setAdjustAmount(prev => ({ ...prev, [wallet.wallet_id]: '' }));
      setAdjustNote(prev => ({ ...prev, [wallet.wallet_id]: '' }));
      await fetchWallets();
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Adjustment failed');
    } finally {
      setAdjusting(null);
    }
  };

  const handleFreezeToggle = async (wallet: AdminWalletEntry) => {
    const key = String(wallet.wallet_id);
    setFreezing(key);
    try {
      if (wallet.is_frozen) {
        await walletApi.unfreezeAdminWallet(wallet.user_id, wallet.currency);
      } else {
        const reason = window.prompt(`Reason for freezing this ${wallet.currency} wallet (optional):`, 'Frozen by super admin');
        if (reason === null) return;
        await walletApi.freezeAdminWallet({
          user_id: wallet.user_id,
          currency: wallet.currency,
          reason: reason.trim() || undefined,
        });
      }
      await fetchWallets();
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Failed to update wallet freeze status');
    } finally {
      setFreezing(null);
    }
  };

  if (loading) return <div className="space-y-2" aria-busy="true" aria-label="Loading wallets">{[1, 2, 3].map(i => <div key={i} className="motion-skeleton h-24 rounded-xl bg-card border border-border" />)}</div>;
  if (!wallets.length) return <Card className="bg-card border-border"><CardContent className="py-14 text-center"><WalletIcon className="h-7 w-7 text-muted-foreground mx-auto mb-3" /><p className="text-foreground font-semibold text-sm">No active user wallets yet</p></CardContent></Card>;

  return <div className="space-y-3">
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex flex-col gap-2 lg:flex-row">
        <div className="flex flex-1 gap-2">
          <label className="sr-only" htmlFor="wallet-control-search">Search wallets</label>
          <input
            id="wallet-control-search"
            type="search"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') setSearch(searchInput); }}
            placeholder="Search name, email, username, or user ID"
            className="min-w-0 flex-1 rounded-lg border border-border/60 bg-muted/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          <Button type="button" onClick={() => setSearch(searchInput)} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="wallet-currency-filter">Filter by currency</label>
          <select id="wallet-currency-filter" value={currencyFilter} onChange={e => setCurrencyFilter(e.target.value)} className="rounded-lg border border-border/60 bg-muted/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
            <option value="all">All currencies</option>
            <option value="PHP">PHP</option>
            <option value="USDT">USDT</option>
            <option value="CNY">CNY</option>
            <option value="KRW">KRW</option>
          </select>
          <label className="sr-only" htmlFor="wallet-status-filter">Filter by status</label>
          <select id="wallet-status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-border/60 bg-muted/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="frozen">Frozen</option>
          </select>
        </div>
      </div>
    </div>
    <p className="text-muted-foreground text-xs">{filteredWallets.length} of {wallets.length} wallet balances across PHP, USDT, CNY, and KRW — use Credit/Debit to adjust balances.</p>
    {filteredWallets.length === 0 ? (
      <Card className="bg-card border-border"><CardContent className="py-14 text-center"><Search className="h-7 w-7 text-muted-foreground mx-auto mb-3" /><p className="text-foreground font-semibold text-sm">No wallets match these filters</p></CardContent></Card>
    ) : filteredWallets.map(wallet => {
      const key = String(wallet.wallet_id);
      const symbol = wallet.currency === 'PHP' ? '₱' : wallet.currency === 'USDT' ? '₮' : wallet.currency === 'CNY' ? '¥' : '₩';
      return <Card key={key} className="bg-card border-border"><CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0"><div className="h-9 w-9 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shrink-0"><WalletIcon className="h-4 w-4 text-emerald-400" /></div><div className="min-w-0"><p className="text-foreground font-semibold text-sm truncate">{wallet.name || wallet.telegram_username || wallet.user_id}</p><p className="text-muted-foreground text-xs truncate">{wallet.email || (wallet.telegram_username ? `@${wallet.telegram_username}` : wallet.user_id)}</p><p className="text-muted-foreground text-[11px] truncate">{wallet.user_id}</p></div></div>
          <div className="text-right shrink-0">{wallet.is_frozen && <Badge className="bg-red-500/10 text-red-300 border border-red-500/20 text-[10px] py-1 px-2">Frozen</Badge>}<p className="text-emerald-400 font-semibold text-lg">{symbol}{wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p><p className="text-muted-foreground text-[10px]">{wallet.currency}</p></div>
        </div>
        <div className="flex flex-col gap-2"><div className="flex gap-2"><label className="sr-only" htmlFor={`wallet-amount-${key}`}>Adjustment amount in {wallet.currency}</label><input id={`wallet-amount-${key}`} type="number" min="0.01" step="0.01" placeholder={`Amount (${wallet.currency})`} value={adjustAmount[key] || ''} onChange={e => setAdjustAmount(prev => ({ ...prev, [key]: e.target.value }))} className="flex-1 bg-muted/60 border border-border/60 text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40" /><label className="sr-only" htmlFor={`wallet-note-${key}`}>Adjustment note</label><input id={`wallet-note-${key}`} type="text" placeholder="Note (required)" value={adjustNote[key] || ''} onChange={e => setAdjustNote(prev => ({ ...prev, [key]: e.target.value }))} className="flex-1 bg-muted/60 border border-border/60 text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40" /></div><div className="flex gap-2"><Button size="sm" aria-label={`Credit ${wallet.user_id} ${wallet.currency} wallet`} onClick={() => handleAdjust(wallet, true)} disabled={adjusting === key || freezing === key} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3">{adjusting === key ? '...' : '+ Credit'}</Button><Button size="sm" aria-label={`Debit ${wallet.user_id} ${wallet.currency} wallet`} onClick={() => handleAdjust(wallet, false)} disabled={adjusting === key || freezing === key} className="flex-1 bg-red-700 hover:bg-red-800 text-white text-xs px-3">{adjusting === key ? '...' : '− Debit'}</Button><Button size="sm" aria-label={`${wallet.is_frozen ? 'Unfreeze' : 'Freeze'} ${wallet.user_id} ${wallet.currency} wallet`} onClick={() => handleFreezeToggle(wallet)} disabled={adjusting === key || freezing === key} className={`flex-1 text-xs px-3 ${wallet.is_frozen ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-700 hover:bg-slate-800'} text-white`}>{freezing === key ? '...' : wallet.is_frozen ? 'Unfreeze' : 'Freeze'}</Button></div></div>
      </CardContent></Card>;
    })}
  </div>;
}

// ── Password Change Modal ───────────────────────────────────────────────────

function PasswordChangeModal({
  admin,
  onClose,
  onSave,
}: {
  admin: AdminUser;
  onClose: () => void;
  onSave: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!password.trim()) {
      setError('Password is required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await onSave(password);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="presentation">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="change-password-title">
        <div className="flex items-center justify-between">
          <h2 id="change-password-title" className="text-foreground font-semibold flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-purple-400" />
            Change Dashboard Password
          </h2>
          <button type="button" onClick={onClose} aria-label="Close change password dialog" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-muted-foreground text-xs">
          Admin: <span className="font-semibold text-foreground">{admin.name || admin.telegram_username || admin.telegram_id}</span>
        </p>
        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            {error}
          </div>
        )}
        <div className="space-y-3">
          <div>
            <label htmlFor="new-admin-password" className="text-xs text-muted-foreground mb-1 block font-semibold uppercase tracking-widest">New Password</label>
            <input
              id="new-admin-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="At least 8 characters"
              className="w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="confirm-admin-password" className="text-xs text-muted-foreground mb-1 block font-semibold uppercase tracking-widest">Confirm Password</label>
            <input
              id="confirm-admin-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
              placeholder="Re-enter new password"
              className="w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !password.trim()} className="flex-1 bg-purple-600 hover:bg-purple-700">
            {saving ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Bank Info & API Key Modals ───────────────────────────────────────────────

function BankInfoModal({
  admin,
  onClose,
  onSave,
}: {
  admin: AdminUser;
  onClose: () => void;
  onSave: (data: Partial<AdminUser>) => Promise<void>;
}) {
  const [bankName, setBankName] = useState(admin.bank_name || '');
  const [accNum, setAccNum] = useState(admin.bank_account_number || '');
  const [accName, setAccName] = useState(admin.bank_account_name || '');
  const [bankAddress, setBankAddress] = useState(admin.bank_address || '');
  const [usdtWalletAddress, setUsdtWalletAddress] = useState(admin.usdt_wallet_address || '');
  const [settlementType, setSettlementType] = useState(admin.settlement_type || '');
  const [settlementCurrency, setSettlementCurrency] = useState(admin.settlement_currency || 'PHP');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        bank_name: bankName,
        bank_account_number: accNum,
        bank_account_name: accName,
        bank_address: bankAddress,
        usdt_wallet_address: usdtWalletAddress.trim() || null,
        settlement_type: settlementType,
        settlement_currency: settlementCurrency,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground font-semibold flex items-center gap-2">
            <Tag className="h-4 w-4 text-blue-400" />
            Edit Bank Information
          </h2>
          <button type="button" onClick={onClose} aria-label="Close bank information dialog" className="motion-interactive text-muted-foreground hover:text-foreground">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Bank Name</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. BDO, GCash, Maya"
              className="w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Account Number</label>
            <input
              type="text"
              value={accNum}
              onChange={(e) => setAccNum(e.target.value)}
              placeholder="001234567890"
              className="w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Account Name</label>
            <input
              type="text"
              value={accName}
              onChange={(e) => setAccName(e.target.value)}
              placeholder="Juan Dela Cruz"
              className="w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Settlement Type</label>
            <input
              type="text"
              value={settlementType}
              onChange={(e) => setSettlementType(e.target.value)}
              placeholder="e.g. Bank transfer"
              className="w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Settlement Currency</label>
            <input
              type="text"
              value={settlementCurrency}
              onChange={(e) => setSettlementCurrency(e.target.value.toUpperCase())}
              placeholder="PHP"
              className="w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Bank Address</label>
            <input
              type="text"
              value={bankAddress}
              onChange={(e) => setBankAddress(e.target.value)}
              placeholder="Bank branch address"
              className="w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ApiKey {
  id: number;
  service_name: string;
  config_key: string;
  config_value: string;
  is_active: boolean;
}

function ApiKeysModal({
  admin,
  onClose,
}: {
  admin: AdminUser;
  onClose: () => void;
}) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newSvc, setNewSvc] = useState('swiftpay');
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/admin/merchant/${admin.telegram_id}/api-keys`);
      if (!res.ok) throw new Error(await res.text());
      setKeys(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [admin.telegram_id]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleUpsert = async () => {
    if (!newKey || !newVal) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/merchant/${admin.telegram_id}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: newSvc,
          config_key: newKey,
          config_value: newVal,
          is_active: true,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setNewKey('');
      setNewVal('');
      await fetchKeys();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this API key?')) return;
    try {
      const res = await fetch(`/api/v1/admin/api-keys/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      await fetchKeys();
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-foreground font-semibold flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-teal-400" />
              API Keys: {admin.name || admin.telegram_username}
            </h2>
            <p className="text-muted-foreground text-[10px]">Merchant ID: {admin.telegram_id}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close API keys dialog" className="motion-interactive text-muted-foreground hover:text-foreground">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {error && <p className="text-red-400 text-xs bg-red-500/10 p-2 rounded-lg shrink-0">{error}</p>}

        {/* Existing Keys */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Loading keys...</p>
          ) : keys.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">No API keys found.</p>
          ) : (
            keys.map(k => (
              <div key={k.id} className="flex items-center justify-between gap-3 p-3 bg-muted/40 border border-border rounded-xl">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{k.service_name}</span>
                    <Badge variant="outline" className="text-[9px] py-0 h-4">{k.config_key}</Badge>
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground truncate">{k.config_value}</p>
                </div>
                <button type="button" onClick={() => handleDelete(k.id)} aria-label={`Delete ${k.service_name} ${k.config_key} API key`} className="motion-interactive text-muted-foreground hover:text-red-400">
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add New Key */}
        <div className="shrink-0 pt-4 border-t border-border space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Add / Update Key</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Service (e.g. swiftpay)"
              value={newSvc}
              onChange={e => setNewSvc(e.target.value)}
              className="bg-muted/60 border border-border rounded-lg px-3 py-1.5 text-xs"
            />
            <input
              placeholder="Config Key"
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              className="bg-muted/60 border border-border rounded-lg px-3 py-1.5 text-xs"
            />
          </div>
          <div className="flex gap-2">
            <input
              placeholder="Config Value (Access Key)"
              value={newVal}
              onChange={e => setNewVal(e.target.value)}
              className="flex-1 bg-muted/60 border border-border rounded-lg px-3 py-1.5 text-xs"
            />
            <Button onClick={handleUpsert} disabled={saving || !newKey || !newVal} size="sm" className="bg-teal-600 hover:bg-teal-700">
              {saving ? '...' : 'Save Key'}
            </Button>
          </div>
        </div>

        <button type="button" onClick={onClose} className="motion-interactive w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground shrink-0">
          Close
        </button>
      </div>
    </div>
  );
}

type TatumAddress = { user_id: string; address: string; derivation_index: number; last_scanned_at: string | null };

function TatumWalletTab({ onError }: { onError: (message: string) => void }) {
  const [config, setConfig] = useState({ enabled: false, configured: false, has_api_key: false, api_key: '', base_url: 'https://api.tatum.io', tron_xpub: '', webhook_secret: '' });
  const [addresses, setAddresses] = useState<TatumAddress[]>([]);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [configResponse, addressesResponse] = await Promise.all([fetch('/api/v1/tatum/config'), fetch('/api/v1/tatum/addresses')]);
      if (!configResponse.ok || !addressesResponse.ok) throw new Error('Unable to load Tatum settings');
      const nextConfig = await configResponse.json();
      const nextAddresses = await addressesResponse.json();
      setConfig(current => ({ ...current, ...nextConfig }));
      setAddresses(nextAddresses.addresses || []);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to load Tatum settings');
    }
  }, [onError]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/v1/tatum/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
      if (!response.ok) throw new Error(await response.text());
      const nextConfig = await response.json();
      setConfig(current => ({ ...current, ...nextConfig }));
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to save Tatum settings');
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (path: string, label: string) => {
    setBusy(true);
    try {
      const response = await fetch(path, { method: 'POST' });
      if (!response.ok) throw new Error(await response.text());
      await load();
      window.alert(`${label} completed.`);
    } catch (error) {
      onError(error instanceof Error ? error.message : `${label} failed`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h2 className="text-lg font-semibold text-slate-900">Tatum USDT wallet integration</h2><p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500">Derive one TRC20 deposit address per approved user and monitor incoming and outgoing transfers. Store only the xpub here; never enter a seed phrase or private key.</p></div><Badge className={config.configured && config.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>{config.configured && config.enabled ? 'ACTIVE' : 'NOT CONFIGURED'}</Badge></div>
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 md:grid-cols-2">
        <label className="space-y-1.5 text-sm font-semibold text-slate-700">Tatum API key<input type="password" value={config.api_key} placeholder={config.has_api_key ? 'Configured; leave blank to keep it' : 'Paste API key'} onChange={event => setConfig(current => ({ ...current, api_key: event.target.value }))} className="h-10 w-full rounded-xl border border-slate-200 px-3 font-normal" /></label>
        <label className="space-y-1.5 text-sm font-semibold text-slate-700">TRON extended public key (xpub)<input value={config.tron_xpub} onChange={event => setConfig(current => ({ ...current, tron_xpub: event.target.value }))} placeholder="xpub..." className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs font-normal" /></label>
        <label className="space-y-1.5 text-sm font-semibold text-slate-700">Tatum base URL<input value={config.base_url} onChange={event => setConfig(current => ({ ...current, base_url: event.target.value }))} className="h-10 w-full rounded-xl border border-slate-200 px-3 font-normal" /></label>
        <label className="space-y-1.5 text-sm font-semibold text-slate-700">Webhook secret (optional)<input type="password" value={config.webhook_secret} onChange={event => setConfig(current => ({ ...current, webhook_secret: event.target.value }))} className="h-10 w-full rounded-xl border border-slate-200 px-3 font-normal" /></label>
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 md:col-span-2"><input type="checkbox" checked={config.enabled} onChange={event => setConfig(current => ({ ...current, enabled: event.target.checked }))} className="h-4 w-4" /> Enable Tatum address assignment and monitoring</label>
        <div className="flex flex-wrap gap-3 md:col-span-2"><Button onClick={save} disabled={saving} className="bg-[#FF6B00] text-white hover:bg-[#E66000]">{saving ? 'Saving...' : 'Save Tatum settings'}</Button><Button type="button" variant="outline" disabled={busy || !config.configured} onClick={() => runAction('/api/v1/tatum/addresses/assign-missing', 'Address assignment')}>Assign missing addresses</Button><Button type="button" variant="outline" disabled={busy || !config.configured} onClick={() => runAction('/api/v1/tatum/monitor', 'Transfer monitoring')}>Scan transfers now</Button></div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h3 className="text-base font-semibold text-slate-900">Assigned TRC20 addresses</h3><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400"><tr><th className="pb-3">User</th><th className="pb-3">Address</th><th className="pb-3">Index</th><th className="pb-3">Last scan</th></tr></thead><tbody>{addresses.map(item => <tr key={item.address} className="border-b border-slate-100"><td className="py-3 font-medium text-slate-700">{item.user_id}</td><td className="py-3 font-mono text-xs text-slate-600">{item.address}</td><td className="py-3 text-slate-500">{item.derivation_index}</td><td className="py-3 text-slate-500">{item.last_scanned_at ? new Date(item.last_scanned_at).toLocaleString() : 'Never'}</td></tr>)}</tbody></table>{addresses.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No addresses assigned yet.</p>}</div></section>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminManagement() {
  const { isSuperAdmin, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as AdminTab) || 'admins';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const canApproveTopups = isSuperAdmin;
  const canManageTeam = isSuperAdmin || Boolean(user?.permissions?.can_manage_team);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [maintenanceUpdating, setMaintenanceUpdating] = useState(false);
  const [additionalFeePercent, setAdditionalFeePercent] = useState('0');
  const [systemFeePercent, setSystemFeePercent] = useState('0.4');
  const [totalFeePercent, setTotalFeePercent] = useState('0.5');
  const [vipGoldFeePercent, setVipGoldFeePercent] = useState('0.4');
  const [feeLoading, setFeeLoading] = useState(true);
  const [feeSaving, setFeeSaving] = useState(false);

  const [editingBankAdmin, setEditingBankAdmin] = useState<AdminUser | null>(null);
  const [editingApiKeysAdmin, setEditingApiKeysAdmin] = useState<AdminUser | null>(null);
  const [editingPasswordAdmin, setEditingPasswordAdmin] = useState<AdminUser | null>(null);
  const [editingFeesAdmin, setEditingFeesAdmin] = useState<AdminUser | null>(null);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/admin-users');
      if (!res.ok) throw new Error(await res.text());
      setAdmins(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMaintenanceMode = useCallback(async () => {
    try {
      setMaintenanceLoading(true);
      const res = await fetch('/api/v1/app-settings/maintenance');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMaintenanceMode(!!data.maintenance_mode);
    } catch {
      // silently ignore
    } finally {
      setMaintenanceLoading(false);
    }
  }, []);

  const fetchCollectionFee = useCallback(async () => {
    try {
      setFeeLoading(true);
      const res = await fetch('/api/v1/app-settings/collection-fee');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSystemFeePercent(String(data.system_fee_percent ?? 0.4));
      setAdditionalFeePercent(String(data.additional_fee_percent ?? 0));
      setTotalFeePercent(String(data.total_fee_percent ?? 0.5));
      setVipGoldFeePercent(String(data.vip_gold_fee_percent ?? data.system_fee_percent ?? 0.4));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load collection fee');
    } finally {
      setFeeLoading(false);
    }
  }, []);

  const handleToggleMaintenance = async () => {
    if (!isSuperAdmin || maintenanceUpdating) return;
    setMaintenanceUpdating(true);
    try {
      const res = await fetch('/api/v1/app-settings/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !maintenanceMode }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMaintenanceMode(!!data.maintenance_mode);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update maintenance mode');
    } finally {
      setMaintenanceUpdating(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchMaintenanceMode();
    fetchCollectionFee();
    const id = setInterval(fetchAdmins, 30000);
    return () => clearInterval(id);
  }, [fetchAdmins, fetchMaintenanceMode, fetchCollectionFee]);

  const handleSaveCollectionFee = async () => {
    const value = Number(additionalFeePercent);
    const systemValue = Number(systemFeePercent);
    const vipValue = Number(vipGoldFeePercent);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setError('Additional collection fee must be between 0 and 100 percent.');
      return;
    }
    if (!Number.isFinite(systemValue) || systemValue < 0 || systemValue > 100) {
      setError('System collection fee must be between 0 and 100 percent.');
      return;
    }
    if (!Number.isFinite(vipValue) || vipValue < 0 || vipValue > 100) {
      setError('VIP Gold collection fee must be between 0 and 100 percent.');
      return;
    }
    setFeeSaving(true);
    try {
      const res = await fetch('/api/v1/app-settings/collection-fee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_fee_percent: systemValue, additional_fee_percent: value, vip_gold_fee_percent: vipValue }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSystemFeePercent(String(data.system_fee_percent));
      setAdditionalFeePercent(String(data.additional_fee_percent));
      setTotalFeePercent(String(data.total_fee_percent));
      setVipGoldFeePercent(String(data.vip_gold_fee_percent));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save collection fee');
    } finally {
      setFeeSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!form.email.trim() || !form.password.trim() || !form.name.trim()) {
      setError('Email, password, and full name are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      setForm(defaultForm);
      setShowAdd(false);
      await fetchAdmins();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add admin');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (admin: AdminUser) => {
    if (!isSuperAdmin) return;
    try {
      const res = await fetch(`/api/v1/admin-users/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !admin.is_active }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchAdmins();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update admin');
    }
  };

  const handleTogglePermission = async (admin: AdminUser, key: keyof AdminUser) => {
    if (!isSuperAdmin) return;
    try {
      const res = await fetch(`/api/v1/admin-users/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: !admin[key] }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchAdmins();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update permission');
    }
  };

  const handleSavedFees = (updated: AdminUser) => {
    setAdmins(current => current.map(admin => admin.id === updated.id ? updated : admin));
  };

  const handleDelete = async (admin: AdminUser) => {
    if (!isSuperAdmin) return;
    if (!confirm(`Deactivate @${admin.telegram_username || admin.telegram_id}? Their wallet and history will be preserved.`)) return;
    try {
      const res = await fetch(`/api/v1/admin-users/${admin.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      await fetchAdmins();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete admin');
    }
  };

  const handleSaveBank = async (data: Partial<AdminUser>) => {
    if (!editingBankAdmin) return;
    try {
      const res = await fetch(`/api/v1/admin-users/${editingBankAdmin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchAdmins();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save bank information');
      throw e;
    }
  };

  const handleSavePassword = async (password: string) => {
    if (!editingPasswordAdmin) return;
    const res = await fetch(`/api/v1/admin-users/${editingPasswordAdmin.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Failed to update password.');
    }
    await fetchAdmins();
  };

  const activeAdmins = admins.filter((a) => a.is_active);
  const inactiveAdmins = admins.filter((a) => !a.is_active);

  const tabs = [
    {
      id: 'admins',
      label: 'Admin Users',
      icon: <ShieldCheck className="h-4 w-4" />,
      count: admins.length,
      group: 'Access & users',
      description: 'Manage dashboard administrators and their specific permissions.'
    },
    {
      id: 'users',
      label: 'User Management',
      icon: <Users className="h-4 w-4" />,
      group: 'Access & users',
      description: 'View and manage roles for all registered platform users.'
    },
    ...(isSuperAdmin ? [{
      id: 'crypto',
      label: 'Crypto Requests',
      icon: <Bitcoin className="h-4 w-4" />,
      group: 'Approvals & controls',
      description: 'Review and approve USDT top-up requests from users.'
    }] : []),
    ...(isSuperAdmin ? [{
      id: 'wallet-control',
      label: 'Wallet Control',
      icon: <WalletIcon className="h-4 w-4 text-blue-400" />,
      group: 'Approvals & controls',
      description: 'Credit or debit any active user wallet in PHP, USDT, CNY, or KRW.'
    }] : []),
    ...(isSuperAdmin ? [{
      id: 'payment-channels',
      label: 'Payment Channels',
      icon: <Power className="h-4 w-4" />,
      group: 'Payments & wallet',
      description: 'Control checkout, withdrawal, and disbursement channels by currency.'
    }] : []),
    ...(isSuperAdmin ? [{
      id: 'wallet-settings',
      label: 'Wallet Settings',
      icon: <WrenchIcon className="h-4 w-4" />,
      group: 'Payments & wallet',
      description: 'Set incoming, deposit, balance, and withdrawal limits for all user wallets.'
    }] : []),
    ...(isSuperAdmin ? [{
      id: 'tatum',
      label: 'Tatum USDT',
      icon: <Bitcoin className="h-4 w-4" />,
      group: 'Payments & wallet',
      description: 'Configure unique TRC20 address assignment and scan incoming and outgoing transfers.'
    }] : []),
    ...(isSuperAdmin ? [{
      id: 'checkout-design',
      label: 'Checkout Design',
      icon: <Palette className="h-4 w-4" />,
      group: 'Payments & wallet',
      description: 'Customize the public checkout appearance.'
    }] : []),
    ...(canManageTeam ? [{
      id: 'team-invitations',
      label: 'Team Invitations',
      icon: <Mail className="h-4 w-4" />,
      group: 'Team',
      description: 'Manage pending team invites and organization access.'
    }] : []),
    ...(isSuperAdmin ? [{
      id: 'team-members',
      label: 'Team Members',
      icon: <Users className="h-4 w-4" />,
      group: 'Team',
      description: 'Manage existing team members within your organization.'
    }] : []),
    ...(isSuperAdmin ? [{
      id: 'audit-logs',
      label: 'Audit Logs',
      icon: <FileText className="h-4 w-4" />,
      group: 'System',
      description: 'Review administrative activity and export audit history.'
    }] : []),
  ];

  return (
    <Layout>
      <div className="w-full bg-gradient-to-b from-slate-50 to-white min-h-screen">
        {/* Page Header */}
        <div className="border-b border-slate-200 bg-white sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#FF6B00] to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-orange-900/20">
                  <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                    Admin Management
                  </h1>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">
                    {admins.length} administrators · {activeAdmins.length} active
                  </p>
                </div>
              </div>
              {activeTab === 'admins' && isSuperAdmin && (
                <Button
                  onClick={() => setShowAdd(!showAdd)}
                  className={`gap-2 text-sm font-semibold h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl whitespace-nowrap transition-all ${
                    showAdd
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                      : 'bg-[#FF6B00] hover:bg-[#E66000] text-white shadow-lg shadow-orange-900/20'
                  }`}
                >
                  {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  <span className="hidden sm:inline">{showAdd ? 'Cancel' : 'Add Admin'}</span>
                  <span className="sm:hidden">{showAdd ? '✕' : '+'}</span>
                </Button>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mt-4 flex items-start gap-3 bg-red-500/10 border border-red-500/25 text-red-700 rounded-lg px-4 py-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span className="font-medium flex-1">{error}</span>
                <button type="button" onClick={() => setError('')} className="motion-interactive shrink-0 hover:opacity-70" aria-label="Dismiss error">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Vertical Navigation Sidebar */}
          <AdminSidebar
            tabs={tabs}
            active={activeTab}
            onChange={(id) => {
              setActiveTab(id);
              setShowAdd(false);
              setError('');
            }}
          />

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 w-full space-y-6">
            {/* Maintenance Mode Toggle (super admin only) */}
            {isSuperAdmin && activeTab === 'admins' && (
              <Card className={`overflow-hidden border transition-all duration-300 ${maintenanceMode ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-6 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
                        maintenanceMode
                          ? 'bg-amber-100 border-amber-200 text-amber-600'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}>
                        <WrenchIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-900">System Maintenance Mode</span>
                          {!maintenanceLoading && (
                            <Badge className={`px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase border ${
                              maintenanceMode
                                ? 'bg-amber-100 border-amber-200 text-amber-700'
                                : 'bg-emerald-100 border-emerald-200 text-emerald-700'
                            }`}>
                              {maintenanceMode ? 'ACTIVE' : 'OFFLINE'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[13px] text-slate-500 mt-1 font-medium leading-relaxed max-w-lg">
                          {maintenanceMode
                            ? 'The platform is currently locked. Only administrators can access the system.'
                            : 'All systems operational. Enable maintenance to block public access during updates.'}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleToggleMaintenance}
                      disabled={maintenanceLoading || maintenanceUpdating}
                      className={`gap-2 text-[12px] font-semibold h-10 px-5 rounded-xl transition-all ${
                        maintenanceMode
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20'
                          : 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-900/20'
                      }`}
                    >
                      {maintenanceUpdating ? (
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent motion-safe:animate-spin" />
                      ) : maintenanceMode ? (
                        <><Power className="h-4 w-4" />Resume Operations</>
                      ) : (
                        <><WrenchIcon className="h-4 w-4" />Enable Maintenance</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isSuperAdmin && activeTab === 'admins' && (
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Collection fee</h2>
                      <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-500">
                        Set the base collection commission charged by SwiftPay. Admin-specific commission surcharges are added to this rate.
                      </p>
                    </div>
                    <div className="flex items-end gap-3">
                      <label className="block">
                        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-slate-400">Additional fee (%)</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={additionalFeePercent}
                          disabled={feeLoading || feeSaving}
                          onChange={event => setAdditionalFeePercent(event.target.value)}
                          className="h-10 w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/5"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-slate-400">System fee (%)</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={systemFeePercent}
                          disabled={feeLoading || feeSaving}
                          onChange={event => setSystemFeePercent(event.target.value)}
                          className="h-10 w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/5"
                        />
                      </label>
                      <Button onClick={handleSaveCollectionFee} disabled={feeLoading || feeSaving} className="h-10 bg-[#FF6B00] px-4 text-sm text-white hover:bg-[#E66000]">
                        {feeSaving ? 'Saving...' : 'Save fee'}
                      </Button>
                    </div>
                  </div>
                  <p className="mt-4 text-xs font-semibold text-slate-500">
                    Total collection fee: <span className="text-slate-900">{Number(totalFeePercent).toFixed(2)}%</span>
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-slate-400">VIP Gold processing fee (%)</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={vipGoldFeePercent}
                        disabled={feeLoading || feeSaving}
                        onChange={event => setVipGoldFeePercent(event.target.value)}
                        className="h-10 w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/5"
                      />
                    </label>
                    <p className="pt-5 text-xs text-slate-500">Applied to users with the VIP Gold badge.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Admin Users Tab ── */}
            {activeTab === 'admins' && (
              <div className="space-y-6">
                {/* Add Admin Form */}
                {showAdd && isSuperAdmin && (
                  <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
                    <CardHeader className="pb-4 pt-6 px-6 border-b border-slate-50 bg-slate-50/50">
                      <CardTitle className="text-slate-900 text-[15px] font-semibold flex items-center gap-2 uppercase tracking-tight">
                        <UserPlus className="h-5 w-5 text-[#FF6B00]" />
                        Create New Administrator
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
                        <div className="space-y-1.5">
                          <label htmlFor="admin-telegram-id" className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">Telegram ID <span className="text-slate-300">(optional)</span></label>
                          <input
                            id="admin-telegram-id"
                            type="text"
                            placeholder="e.g. 123456789"
                            value={form.telegram_id}
                            onChange={e => setForm(f => ({ ...f, telegram_id: e.target.value }))}
                            className="w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/5 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="admin-telegram-username" className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">Telegram Username</label>
                          <input
                            id="admin-telegram-username"
                            type="text"
                            placeholder="@username"
                            value={form.telegram_username}
                            onChange={e => setForm(f => ({ ...f, telegram_username: e.target.value }))}
                            className="w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/5 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="admin-email" className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">Email</label>
                          <input
                            id="admin-email"
                            type="email"
                            placeholder="admin@example.com"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            className="w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/5 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="admin-password" className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">Password <span className="text-red-500">*</span></label>
                          <input
                            id="admin-password"
                            type="password"
                            placeholder="Initial password"
                            value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-300 transition-all focus:border-[#FF6B00] focus:outline-none focus:ring-4 focus:ring-[#FF6B00]/5"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="admin-full-name" className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">Full Name <span className="text-red-500">*</span></label>
                          <input
                            id="admin-full-name"
                            type="text"
                            placeholder="Full name"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/5 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">Permission Level</label>
                      <div className="flex flex-wrap gap-x-6 gap-y-4">
                        <div className="flex items-center gap-3 cursor-pointer select-none group">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={form.is_super_admin}
                            aria-label="Super Administrator"
                            onClick={() => setForm(f => ({ ...f, is_super_admin: !f.is_super_admin }))}
                            className={`w-10 h-6 rounded-full relative transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 ${form.is_super_admin ? 'bg-amber-500 shadow-lg shadow-amber-500/20' : 'bg-slate-200'}`}
                          >
                            <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300 ${form.is_super_admin ? 'left-5' : 'left-1'}`} />
                          </button>
                          <span className={`text-[13px] font-semibold transition-colors ${form.is_super_admin ? 'text-amber-600' : 'text-slate-500 group-hover:text-slate-700'}`}>Super Administrator</span>
                        </div>
                        <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                        <div className="flex flex-wrap gap-x-6 gap-y-3">
                          {PERMISSION_KEYS.map(({ key, label }) => (
                            <label key={key} className="flex items-center gap-2.5 cursor-pointer select-none group">
                              <div className="relative flex items-center justify-center">
                                <input
                                  id={`admin-permission-${key}`}
                                  type="checkbox"
                                  checked={form[key as keyof typeof form] as boolean}
                                  onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                                  className="peer h-5 w-5 rounded-lg border-slate-200 bg-white text-[#FF6B00] focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
                                />
                              </div>
                              <span className="text-[13px] font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={handleAdd}
                      disabled={saving || !form.email.trim() || !form.password.trim() || !form.name.trim()}
                      className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-semibold h-11 px-8 rounded-xl shadow-lg shadow-orange-900/20 disabled:opacity-50 transition-all"
                    >
                      {saving ? 'Creating...' : 'Create Admin'}
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => { setShowAdd(false); setForm(defaultForm); }}
                      className="text-slate-400 hover:text-slate-900 font-semibold px-6 h-11 rounded-xl transition-all"
                    >
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

              {/* Admins List */}
              {loading ? (
                  <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="motion-skeleton h-32 rounded-2xl bg-white border border-slate-200" />
                    ))}
                  </div>
                ) : admins.length === 0 ? (
                  <Card className="bg-white border-slate-200 py-20">
                    <CardContent className="flex flex-col items-center justify-center text-center">
                      <div className="h-20 w-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6">
                        <ShieldCheck className="h-10 w-10 text-slate-300" />
                      </div>
                      <p className="text-slate-900 font-semibold text-lg tracking-tight">No Administrators Configured</p>
                      <p className="text-slate-500 text-sm mt-2 max-w-xs font-medium">Add your first administrator to grant access to the management dashboard.</p>
                      <Button
                        onClick={() => setShowAdd(true)}
                        variant="outline"
                        className="mt-8 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                      >
                        Add your first admin
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {activeAdmins.map(admin => (
                      <AdminCard
                        key={admin.id}
                        admin={admin}
                        isSuperAdmin={isSuperAdmin}
                        onToggleActive={handleToggleActive}
                        onTogglePermission={handleTogglePermission}
                        onDelete={handleDelete}
                        onEditBank={setEditingBankAdmin}
                        onEditApiKeys={setEditingApiKeysAdmin}
                        onEditPassword={setEditingPasswordAdmin}
                        onEditFees={setEditingFeesAdmin}
                      />
                    ))}

                    {inactiveAdmins.length > 0 && (
                      <div className="pt-6 space-y-4">
                        <div className="flex items-center gap-4 px-2">
                          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-[0.2em] whitespace-nowrap">Inactive Accounts</span>
                          <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {inactiveAdmins.map(admin => (
                            <AdminCard
                              key={admin.id}
                              admin={admin}
                              isSuperAdmin={isSuperAdmin}
                              onToggleActive={handleToggleActive}
                              onTogglePermission={handleTogglePermission}
                              onDelete={handleDelete}
                              onEditBank={setEditingBankAdmin}
                              onEditApiKeys={setEditingApiKeysAdmin}
                              onEditPassword={setEditingPasswordAdmin}
                              onEditFees={setEditingFeesAdmin}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── User Management Tab ── */}
            {activeTab === 'users' && (
              <UserManagementTab isSuperAdmin={isSuperAdmin} onError={setError} />
            )}

            {activeTab === 'audit-logs' && isSuperAdmin && (
              <AuditLogsTab onError={setError} />
            )}

            {/* ── Crypto Requests Tab ── */}
            {activeTab === 'crypto' && isSuperAdmin && (
              <CryptoRequestsTab canApproveTopups={canApproveTopups} onError={setError} />
            )}

            {/* ── Unified Wallet Control Tab ── */}
            {activeTab === 'wallet-control' && isSuperAdmin && (
              <WalletControlTab onError={setError} />
            )}
            {activeTab === 'payment-channels' && isSuperAdmin && (
              <PaymentChannelsTab onError={setError} />
            )}
            {activeTab === 'wallet-settings' && isSuperAdmin && (
              <WalletSettingsTab onError={setError} />
            )}
            {activeTab === 'tatum' && isSuperAdmin && (
              <TatumWalletTab onError={setError} />
            )}
            {activeTab === 'checkout-design' && isSuperAdmin && (
              <CheckoutDesignTab onError={setError} />
            )}

            {/* ── Team Invitations Tab ── */}
            {activeTab === 'team-invitations' && canManageTeam && (
              <TeamInvitationsTab />
            )}

            {/* ── Team Members Tab ── */}
            {activeTab === 'team-members' && isSuperAdmin && (
              <TeamMembersTab />
            )}
          </div>
        </div>
      </div>

      {editingBankAdmin && (
        <BankInfoModal
          admin={editingBankAdmin}
          onClose={() => setEditingBankAdmin(null)}
          onSave={handleSaveBank}
        />
      )}

      {editingApiKeysAdmin && (
        <ApiKeysModal
          admin={editingApiKeysAdmin}
          onClose={() => setEditingApiKeysAdmin(null)}
        />
      )}

      {editingPasswordAdmin && (
        <PasswordChangeModal
          admin={editingPasswordAdmin}
          onClose={() => setEditingPasswordAdmin(null)}
          onSave={handleSavePassword}
        />
      )}

      {editingFeesAdmin && (
        <FeeSettingsModal
          admin={editingFeesAdmin}
          onClose={() => setEditingFeesAdmin(null)}
          onSaved={handleSavedFees}
          onError={setError}
        />
      )}
    </Layout>
  );
}
