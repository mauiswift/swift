import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { walletApi, AdminWalletEntry } from '../api/wallet';
import { client } from '@/lib/api';
import { PERMISSION_DEFINITIONS } from '@/lib/permissions';
import { ROLE_PERMISSION_PRESETS } from '@/lib/adminRolePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TeamInvitationsTab, TeamMembersTab } from '@/components/TeamManagement';
import TestDataCleanupTab from '@/components/admin/TestDataCleanupTab';
import { TossAccountApprovalsPanel } from '@/pages/TossAccountApprovals';
import { toast } from 'sonner';
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
  ChevronRight,
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
  Upload,
  Search,
  Palette,
  Landmark,
  Loader2,
  Save,
  Settings2,
  Pencil,
} from 'lucide-react';

const authenticatedFetch = client.fetch;

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: number;
  telegram_id: string;
  telegram_username: string | null;
  name: string | null;
  is_active: boolean;
  is_super_admin: boolean;
  role: string;
  can_manage_payments: boolean;
  can_manage_disbursements: boolean;
  can_view_reports: boolean;
  can_manage_wallet: boolean;
  can_manage_transactions: boolean;
  can_manage_bot: boolean;
  can_approve_topups: boolean;
  can_manage_team: boolean;
  can_credit_wallet?: boolean;
  can_debit_wallet?: boolean;
  can_freeze_wallet?: boolean;
  can_unfreeze_wallet?: boolean;
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
  withdrawal_fee_percent?: number;
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

type AdminTab = 'admins' | 'users' | 'crypto' | 'wallet-control' | 'payment-channels' | 'wallet-settings' | 'bitgo' | 'checkout-design' | 'platform-settings' | 'operations' | 'toss-approvals' | 'team-invitations' | 'team-members' | 'audit-logs' | 'test-data-cleanup';

type ChannelConfig = Record<string, { checkout: string[]; withdrawal: string[]; disbursement: string[]; checkout_institutions?: string[] }>;
const channelOptions = [
  { id: 'gcash', label: 'GCash' },
  { id: 'maya', label: 'Maya' },
  { id: 'bank_transfer', label: 'Bank transfer' },
  { id: 'virtual_account', label: 'SwiftPay Virtual Account' },
  { id: 'qr_code', label: 'QR code' },
  { id: 'alipay', label: 'Alipay' },
  { id: 'wechat', label: 'WeChat Pay' },
  { id: 'card', label: 'Card' },
];
const phpInstitutionOptions = [
  { id: 'GCASH', label: 'GCash' }, { id: 'MAYA', label: 'Maya' }, { id: 'ALIPAY', label: 'Alipay' }, { id: 'BDO', label: 'BDO' },
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
      const response = await authenticatedFetch('/api/v1/app-settings/payment-channels');
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
      const response = await authenticatedFetch('/api/v1/app-settings/payment-channels', {
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

const createDepositAccount = (number: number): DepositAccount => ({
  value: `account-${number}`,
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
});

const isTossDepositAccount = (account: DepositAccount) => (
  account.currency.toUpperCase() === 'KRW'
  && /toss|토스/i.test(`${account.value} ${account.label}`)
);

function PlatformSettingsTab({ onError }: { onError: (message: string) => void }) {
  const [currencies, setCurrencies] = useState<string[]>(['PHP', 'CNY', 'KRW', 'USDT']);
  const [conversionFee, setConversionFee] = useState('1');
  const [saving, setSaving] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const restoreInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      client.get('/api/v1/app-settings/collection-currencies'),
      client.get('/api/v1/app-settings/conversion-fee'),
    ]).then(([currencyResponse, feeResponse]) => {
      if (currencyResponse.ok && Array.isArray(currencyResponse.data?.currencies)) setCurrencies(currencyResponse.data.currencies);
      if (feeResponse.ok && feeResponse.data?.fee_percent != null) setConversionFee(String(feeResponse.data.fee_percent));
    }).catch(error => onError(error instanceof Error ? error.message : 'Unable to load platform settings'));
  }, [onError]);

  const updateCurrencies = async (currency: string) => {
    const next = currencies.includes(currency) ? currencies.filter(item => item !== currency) : [...currencies, currency];
    if (!next.length) return onError('Keep at least one collection currency enabled');
    setSaving(true);
    try {
      const response = await client.request('/api/v1/app-settings/collection-currencies', 'PUT', { currencies: next });
      if (!response.ok) throw new Error(response.data?.detail || 'Unable to update collection currencies');
      setCurrencies(response.data.currencies);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unable to update collection currencies');
    } finally {
      setSaving(false);
    }
  };

  const saveFee = async () => {
    const fee = Number(conversionFee);
    if (!Number.isFinite(fee) || fee < 0 || fee > 100) return onError('Conversion fee must be between 0 and 100%');
    setSaving(true);
    try {
      const response = await client.request('/api/v1/app-settings/conversion-fee', 'PUT', { fee_percent: fee });
      if (!response.ok) throw new Error(response.data?.detail || 'Unable to update conversion fee');
      setConversionFee(String(response.data.fee_percent));
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unable to update conversion fee');
    } finally {
      setSaving(false);
    }
  };

  const downloadBackup = async () => {
    setBackupBusy(true);
    try {
      const response = await client.fetch('/api/v1/admin/backups/download');
      if (!response.ok) throw new Error('Unable to create backup');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `swiftpay-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unable to create backup');
    } finally {
      setBackupBusy(false);
    }
  };

  const restoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !window.confirm('This will replace the current data with the backup. Continue?')) return;
    setBackupBusy(true);
    try {
      const formData = new FormData();
      formData.append('backup', file);
      const response = await client.fetch('/api/v1/admin/backups/restore', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Unable to restore backup');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unable to restore backup');
    } finally {
      setBackupBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white">
        <CardHeader><CardTitle className="text-base text-slate-900">Collection currencies</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-slate-500">Control which currencies merchants can select for collection.</p>
          <div className="flex flex-wrap gap-2">
            {['PHP', 'CNY', 'KRW', 'USDT'].map(currency => (
              <button key={currency} type="button" disabled={saving} onClick={() => updateCurrencies(currency)} aria-pressed={currencies.includes(currency)} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${currencies.includes(currency) ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                {currency} {currencies.includes(currency) ? 'Enabled' : 'Disabled'}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="border-slate-200 bg-white">
        <CardHeader><CardTitle className="text-base text-slate-900">Conversion fee</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm font-semibold text-slate-700">Wallet conversion fee (%)
            <input type="number" min="0" max="100" step="0.01" value={conversionFee} onChange={event => setConversionFee(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 font-normal text-slate-900" />
          </label>
          <Button type="button" onClick={saveFee} disabled={saving} className="bg-[#FF6B00] text-white hover:bg-[#E66000]">Save fee</Button>
        </CardContent>
      </Card>
      <Card className="border-amber-200 bg-amber-50/60">
        <CardHeader><CardTitle className="text-base text-slate-900">Data backup and restore</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={downloadBackup} disabled={backupBusy} className="gap-2 bg-[#FF6B00] text-white hover:bg-[#E66000]"><Download className="h-4 w-4" />Download backup</Button>
          <input ref={restoreInputRef} type="file" accept="application/json,.json" onChange={restoreBackup} className="hidden" />
          <Button type="button" variant="outline" onClick={() => restoreInputRef.current?.click()} disabled={backupBusy} className="gap-2"><Upload className="h-4 w-4" />Restore backup</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminOperationsTab() {
  const navigate = useNavigate();
  const operations = [
    ['Payment approvals', '/payment-approvals'],
    ['Bank deposits', '/bank-deposits'],
    ['Top-up requests', '/topup-requests'],
    ['Withdrawals', '/withdrawals'],
    ['USDT send requests', '/withdrawals/usdt-send-requests'],
    ['TOSS Bank applications', '?tab=toss-approvals'],
    ['KYB registrations', '/kyb-registrations'],
    ['KYC verifications', '/kyc-verifications'],
    ['Broadcasts', '/broadcasts'],
    ['Bot messages', '/bot-messages'],
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {operations.map(([label, path]) => (
        <button key={path} type="button" onClick={() => path.startsWith('?') ? navigate(`/admin-management${path}`) : navigate(path)} className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-orange-200 hover:bg-orange-50/30">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
        </button>
      ))}
    </div>
  );
}

function CheckoutDesignTab({ onError }: { onError: (message: string) => void }) {
  const [design, setDesign] = useState({ display_name: '', primary_color: '#071B3A', accent_color: '#1475D1', page_background: '#F9FAFB', heading_color: '#0F172A', body_text_color: '#475569', card_radius: 24, payment_layout: 'grid', payment_alignment: 'left', show_powered_by: true });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    authenticatedFetch('/api/v1/app-settings/checkout-design').then(async response => {
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setDesign(current => ({ ...current, ...(data.design || {}) }));
    }).catch(error => onError(error instanceof Error ? error.message : 'Failed to load checkout design'));
  }, [onError]);
  const save = async () => {
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/v1/app-settings/checkout-design', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ design }) });
      if (!response.ok) throw new Error(await response.text());
      setDesign((await response.json()).design);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to save checkout design');
    } finally {
      setSaving(false);
    }
  };

    function PlatformSettingsTab({ onError }: { onError: (message: string) => void }) {
      const [currencies, setCurrencies] = useState<string[]>(['PHP', 'CNY', 'KRW', 'USDT']);
      const [conversionFee, setConversionFee] = useState('1');
      const [saving, setSaving] = useState(false);
      const [backupBusy, setBackupBusy] = useState(false);
      const restoreInputRef = React.useRef<HTMLInputElement>(null);

      useEffect(() => {
        Promise.all([
          client.get('/api/v1/app-settings/collection-currencies'),
          client.get('/api/v1/app-settings/conversion-fee'),
        ]).then(([currencyResponse, feeResponse]) => {
          if (currencyResponse.ok && Array.isArray(currencyResponse.data?.currencies)) {
            setCurrencies(currencyResponse.data.currencies);
          }
          if (feeResponse.ok && feeResponse.data?.fee_percent != null) {
            setConversionFee(String(feeResponse.data.fee_percent));
          }
        }).catch(error => onError(error instanceof Error ? error.message : 'Unable to load platform settings'));
      }, [onError]);

      const toggleCurrency = async (currency: string) => {
        const next = currencies.includes(currency)
          ? currencies.filter(item => item !== currency)
          : [...currencies, currency];
        if (!next.length) {
          onError('Keep at least one collection currency enabled');
          return;
        }
        setSaving(true);
        try {
          const response = await client.request('/api/v1/app-settings/collection-currencies', 'PUT', { currencies: next });
          if (!response.ok) throw new Error(response.data?.detail || 'Unable to update collection currencies');
          setCurrencies(response.data.currencies);
        } catch (error) {
          onError(error instanceof Error ? error.message : 'Unable to update collection currencies');
        } finally {
          setSaving(false);
        }
      };

      const saveConversionFee = async () => {
        const fee = Number(conversionFee);
        if (!Number.isFinite(fee) || fee < 0 || fee > 100) {
          onError('Conversion fee must be between 0 and 100%');
          return;
        }
        setSaving(true);
        try {
          const response = await client.request('/api/v1/app-settings/conversion-fee', 'PUT', { fee_percent: fee });
          if (!response.ok) throw new Error(response.data?.detail || 'Unable to update conversion fee');
          setConversionFee(String(response.data.fee_percent));
        } catch (error) {
          onError(error instanceof Error ? error.message : 'Unable to update conversion fee');
        } finally {
          setSaving(false);
        }
      };

      const downloadBackup = async () => {
        setBackupBusy(true);
        try {
          const response = await client.fetch('/api/v1/admin/backups/download');
          if (!response.ok) throw new Error('Unable to create backup');
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `swiftpay-backup-${new Date().toISOString().slice(0, 10)}.json`;
          link.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          onError(error instanceof Error ? error.message : 'Unable to create backup');
        } finally {
          setBackupBusy(false);
        }
      };

      const restoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file || !window.confirm('This will replace the current data with the backup. Continue?')) return;
        setBackupBusy(true);
        try {
          const formData = new FormData();
          formData.append('backup', file);
          const response = await client.fetch('/api/v1/admin/backups/restore', { method: 'POST', body: formData });
          if (!response.ok) throw new Error('Unable to restore backup');
        } catch (error) {
          onError(error instanceof Error ? error.message : 'Unable to restore backup');
        } finally {
          setBackupBusy(false);
        }
      };

      return (
        <div className="space-y-4">
          <Card className="border-slate-200 bg-white">
            <CardHeader><CardTitle className="text-base text-slate-900">Collection currencies</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-slate-500">Control which currencies merchants can select for collection.</p>
              <div className="flex flex-wrap gap-2">
                {['PHP', 'CNY', 'KRW', 'USDT'].map(currency => (
                  <button key={currency} type="button" disabled={saving} onClick={() => toggleCurrency(currency)} aria-pressed={currencies.includes(currency)} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${currencies.includes(currency) ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                    {currency} {currencies.includes(currency) ? 'Enabled' : 'Disabled'}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardHeader><CardTitle className="text-base text-slate-900">Conversion fee</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1 text-sm font-semibold text-slate-700">Wallet conversion fee (%)
                <input type="number" min="0" max="100" step="0.01" value={conversionFee} onChange={event => setConversionFee(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 font-normal text-slate-900" />
              </label>
              <Button type="button" onClick={saveConversionFee} disabled={saving} className="bg-[#FF6B00] text-white hover:bg-[#E66000]">Save fee</Button>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/60">
            <CardHeader><CardTitle className="text-base text-slate-900">Data backup and restore</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" onClick={downloadBackup} disabled={backupBusy} className="gap-2 bg-[#FF6B00] text-white hover:bg-[#E66000]"><Download className="h-4 w-4" />Download backup</Button>
              <input ref={restoreInputRef} type="file" accept="application/json,.json" onChange={restoreBackup} className="hidden" />
              <Button type="button" variant="outline" onClick={() => restoreInputRef.current?.click()} disabled={backupBusy} className="gap-2"><Upload className="h-4 w-4" />Restore backup</Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    function AdminOperationsTab() {
      const navigate = useNavigate();
      const operations = [
        ['Payment approvals', '/payment-approvals', 'Review desktop and mobile payment approvals.'],
        ['Bank deposits', '/bank-deposits', 'Review incoming bank deposit requests.'],
        ['Top-up requests', '/topup-requests', 'Approve or reject wallet top-up requests.'],
        ['Withdrawals', '/withdrawals', 'Review and process withdrawal requests.'],
        ['USDT send requests', '/withdrawals/usdt-send-requests', 'Review outgoing USDT transfer requests.'],
        ['TOSS Bank applications', '?tab=toss-approvals', 'Approve or reject TOSS Bank virtual account applications.'],
        ['KYB registrations', '/kyb-registrations', 'Review business verification registrations.'],
        ['KYC verifications', '/kyc-verifications', 'Review identity verification submissions.'],
        ['Broadcasts', '/broadcasts', 'Send platform-wide operational messages.'],
        ['Bot messages', '/bot-messages', 'Manage automated bot messages.'],
      ];
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {operations.map(([label, path, description]) => (
            <button key={path} type="button" onClick={() => path.startsWith('?') ? navigate(`/admin-management${path}`) : navigate(path)} className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-orange-200 hover:bg-orange-50/30">
              <p className="text-sm font-semibold text-slate-900">{label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
            </button>
          ))}
        </div>
      );
    }
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
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [limits, setLimits] = useState<Record<string, WalletLimitValues>>({});
  const [depositRules, setDepositRules] = useState({
    bank_deposit_currencies: ['PHP', 'KRW'],
    topup_currencies: ['PHP', 'USDT', 'KRW'],
    receipt_max_size_mb: 10,
    first_usdt_topup_amount: 600,
    first_usdt_topup_rule_enabled: true,
  });
  const [depositAccounts, setDepositAccounts] = useState<DepositAccount[]>([]);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccountIndex, setEditingAccountIndex] = useState<number | null>(null);
  const [accountDraft, setAccountDraft] = useState<DepositAccount>(() => createDepositAccount(1));
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const responses = await Promise.all([
        authenticatedFetch('/api/v1/app-settings/wallet-limits'),
        authenticatedFetch('/api/v1/app-settings/deposit-rules'),
        authenticatedFetch('/api/v1/app-settings/deposit-accounts'),
      ]);
      const failedResponse = responses.find(response => !response.ok);
      if (failedResponse) throw new Error(await failedResponse.text());
      const [limitsData, rulesData, accountsData] = await Promise.all(responses.map(response => response.json()));
      setLimits(limitsData.limits || {});
      setDepositRules(current => ({ ...current, ...(rulesData.rules || {}) }));
      setDepositAccounts(accountsData.accounts || []);
      setLoaded(true);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to load wallet settings');
    } finally {
      setLoading(false);
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
      const response = await authenticatedFetch('/api/v1/app-settings/wallet-limits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limits }),
      });
      if (!response.ok) throw new Error(await response.text());
      setLimits((await response.json()).limits || limits);
      const rulesResponse = await authenticatedFetch('/api/v1/app-settings/deposit-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: depositRules }),
      });
      if (!rulesResponse.ok) throw new Error(await rulesResponse.text());
      setDepositRules((await rulesResponse.json()).rules || depositRules);
      const accountsResponse = await authenticatedFetch('/api/v1/app-settings/deposit-accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts: depositAccounts }),
      });
      if (!accountsResponse.ok) throw new Error(await accountsResponse.text());
      setDepositAccounts((await accountsResponse.json()).accounts || depositAccounts);
      toast.success('Wallet settings saved');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to save wallet settings');
    } finally {
      setSaving(false);
    }
  };

  const updateAccount = (index: number, updates: Partial<DepositAccount>) => {
    setDepositAccounts(accounts => accounts.map((account, itemIndex) => (
      itemIndex === index ? { ...account, ...updates } : account
    )));
  };

  const openNewAccount = () => {
    setEditingAccountIndex(null);
    setAccountDraft(createDepositAccount(depositAccounts.length + 1));
    setAccountDialogOpen(true);
  };

  const openNewTossDepositAccount = () => {
    setEditingAccountIndex(null);
    setAccountDraft({
      ...createDepositAccount(depositAccounts.length + 1),
      value: 'Toss Bank',
      label: 'Toss Bank',
      currency: 'KRW',
    });
    setAccountDialogOpen(true);
  };

  const openEditAccount = (index: number) => {
    setEditingAccountIndex(index);
    setAccountDraft({ ...depositAccounts[index] });
    setAccountDialogOpen(true);
  };

  const saveAccountDraft = () => {
    if (editingAccountIndex === null) {
      setDepositAccounts(accounts => [...accounts, accountDraft]);
    } else {
      updateAccount(editingAccountIndex, accountDraft);
    }
    setAccountDialogOpen(false);
  };

  const tossDepositAccounts = depositAccounts
    .map((account, index) => ({ account, index }))
    .filter(({ account }) => isTossDepositAccount(account));
  const otherDepositAccounts = depositAccounts
    .map((account, index) => ({ account, index }))
    .filter(({ account }) => !isTossDepositAccount(account));

  const fields: Array<{ key: keyof WalletLimitValues; label: string; help: string }> = [
    { key: 'max_incoming', label: 'Maximum incoming amount', help: 'Maximum amount accepted in one incoming transaction.' },
    { key: 'minimum_balance', label: 'Minimum maintaining balance', help: 'Wallet balance must remain at or above this amount after withdrawal.' },
    { key: 'minimum_deposit', label: 'Minimum deposit', help: 'Smallest amount accepted for a deposit or top-up.' },
    { key: 'max_withdrawal_daily', label: 'Maximum withdrawal per day', help: 'Total withdrawal amount allowed from 00:00 UTC each day.' },
    { key: 'max_withdrawal_monthly', label: 'Maximum withdrawal per month', help: 'Total withdrawal amount allowed from the first day of each month.' },
  ];
  const visibleFields = fields.filter(field => !(currency === 'PHP' && field.key === 'minimum_balance'));

  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-lg">
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400 ring-1 ring-orange-400/25">
              <WalletIcon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300">Platform controls</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Wallet settings</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Configure transaction limits, accepted deposit currencies, and the receiving accounts shown to customers.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200">{currencies.length} wallet currencies</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200">{depositAccounts.length} receiving accounts</span>
            <Button onClick={save} disabled={loading || !loaded || saving} className="w-full gap-2 bg-[#FF6B00] text-white hover:bg-[#E66000] sm:w-auto">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save all settings'}
            </Button>
          </div>
        </div>
        <nav aria-label="Wallet settings sections" className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-3 sm:px-7">
          {[
            { href: '#wallet-limits', label: 'Wallet limits', icon: <Settings2 className="h-3.5 w-3.5" /> },
            { href: '#deposit-accounts', label: 'Receiving accounts', icon: <Landmark className="h-3.5 w-3.5" /> },
            { href: '#deposit-rules', label: 'Deposit rules', icon: <DollarSign className="h-3.5 w-3.5" /> },
          ].map(section => (
            <a key={section.href} href={section.href} className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
              {section.icon}{section.label}
            </a>
          ))}
        </nav>
      </header>
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#FF6B00]" />
          <p className="mt-3 text-sm font-medium text-slate-600">Loading wallet configuration…</p>
        </div>
      ) : !loaded ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-800">Wallet configuration could not be loaded.</p>
          <p className="mt-1 text-xs text-red-700">Settings are unavailable, so saving is disabled to protect existing values.</p>
          <Button type="button" variant="outline" onClick={load} className="mt-4 gap-2 border-red-300 text-red-800 hover:bg-red-100">
            <RefreshCw className="h-4 w-4" />
            Retry loading
          </Button>
        </div>
      ) : (
        <>
      <section id="wallet-limits" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00]"><Settings2 className="h-5 w-5" /></span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Wallet limits</h3>
              <p className="mt-1 text-sm text-slate-500">Configure balance and transaction limits independently for each wallet currency.</p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600">{currency} configuration</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Wallet settings currency">
          {currencies.map(value => (
            <button key={value} type="button" aria-pressed={currency === value} onClick={() => setCurrency(value)} className={`motion-interactive min-w-20 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${currency === value ? 'border-orange-200 bg-orange-50 text-[#C2410C] shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}>{value}</button>
          ))}
        </div>
        <div className="mt-5 grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleFields.map(field => (
            <label key={field.key} className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-colors focus-within:border-orange-300 focus-within:bg-white">
              <span className="text-sm font-semibold text-slate-800">{field.label}</span>
              <span className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{field.help}</span>
              <span className="mt-3 flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-[#FF6B00] focus-within:ring-4 focus-within:ring-[#FF6B00]/5">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={current[field.key] || ''}
                  onChange={event => update(field.key, event.target.value)}
                  className="h-10 min-w-0 flex-1 rounded-lg bg-transparent px-3 text-sm font-bold text-slate-900 outline-none"
                />
                <span className="pr-3 text-xs font-bold text-slate-400">{currency}</span>
              </span>
            </label>
          ))}
        </div>
        {currency === 'PHP' && (
          <p className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            PHP wallets have no minimum maintaining balance; withdrawals can use the full available balance.
          </p>
        )}
      </section>
      <section id="deposit-accounts" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <Landmark className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">Wallet deposit destinations</p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900">Bank deposit settings</h3>
              <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500">
                Manage the accounts customers see when they deposit funds into their wallet.
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            {tossDepositAccounts.length + otherDepositAccounts.length} accounts configured
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <WalletIcon className="h-4 w-4" />
              <p className="text-xs font-bold uppercase tracking-wide">Wallet deposits</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">This page controls deposit accounts</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">Toss deposits show one randomly selected account for each deposit session. Other accounts follow their currency and minimum-amount rules.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-600">
              <RefreshCw className="h-4 w-4" />
              <p className="text-xs font-bold uppercase tracking-wide">Payment checkout</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">Managed separately</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">KRW payment-link checkout uses the active TOSS pool under Admin Management → TOSS Bank approvals, not the deposit accounts below.</p>
          </div>
        </div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-orange-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 via-white to-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#C2410C]">
                <Landmark className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">Toss Bank · KRW deposit pool</h4>
                  <Badge variant="secondary" className="border border-orange-200 bg-white text-[10px] text-[#C2410C]">Wallet deposits only</Badge>
                </div>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
                  One account is randomly selected per deposit session. The full pool is never shown to the customer, and the previous account is avoided when possible.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full shrink-0 gap-2 border-orange-200 bg-white text-[#C2410C] hover:bg-orange-50 sm:w-auto"
              onClick={openNewTossDepositAccount}
            >
              <Plus className="h-4 w-4" />
              Add Toss account
            </Button>
          </div>
          <div className="space-y-2 p-3 sm:p-4">
            {tossDepositAccounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/40 px-4 py-8 text-center">
                <Landmark className="mx-auto h-7 w-7 text-orange-300" />
                <p className="mt-2 text-sm font-semibold text-slate-700">No Toss deposit accounts yet</p>
                <p className="mt-1 text-xs text-slate-500">Add a KRW account to enable Toss wallet deposits.</p>
              </div>
            ) : (
              tossDepositAccounts.map(({ account, index }) => (
                <div key={`${account.value}-${index}`} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-orange-200 hover:bg-orange-50/30 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Landmark className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{account.account_number || 'Account number not set'}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{account.account_name || 'Account holder not set'} <span className="px-1 text-slate-300">·</span> KRW</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-100 pt-2 sm:justify-end sm:border-0 sm:pt-0">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">In deposit rotation</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditAccount(index)}
                        className="motion-interactive inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label={`Edit ${account.account_number || 'Toss deposit account'}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDepositAccounts(items => items.filter((_, itemIndex) => itemIndex !== index))}
                        className="motion-interactive inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        aria-label={`Remove ${account.account_number || 'Toss deposit account'}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
                ))
            )}
          </div>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Other receiving accounts</h4>
              <p className="mt-1 text-xs text-slate-500">Shown in Wallet → Deposit, subject to currency and minimum amount.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full shrink-0 gap-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-100 sm:w-auto"
              onClick={openNewAccount}
            >
              <Plus className="h-4 w-4" />
              Add other account
            </Button>
          </div>
          {otherDepositAccounts.length === 0 ? (
            <div className="bg-white px-4 py-8 text-center">
              <WalletIcon className="mx-auto h-7 w-7 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">No other accounts configured</p>
              <p className="mt-1 text-xs text-slate-500">Use this section for non-Toss wallet deposit destinations.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-slate-50">
                  <TableHead className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-slate-500">Account</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-slate-500">Bank details</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-slate-500">Currencies</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-slate-500">Minimum</TableHead>
                  <TableHead className="min-w-48 text-xs font-bold uppercase tracking-wide text-slate-500">Shown to customers in</TableHead>
                  <TableHead className="w-24 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherDepositAccounts.map(({ account, index }) => (
                  <TableRow key={`${account.value}-${index}`} className="align-top">
                    <TableCell className="min-w-40">
                      <p className="font-semibold text-slate-900">{account.label || 'Untitled account'}</p>
                      <p className="mt-1 text-xs text-slate-500">{account.value || 'No provider set'}</p>
                    </TableCell>
                    <TableCell className="min-w-48">
                      <p className="font-medium text-slate-800">{account.account_number || 'No account number'}</p>
                      <p className="mt-1 text-xs text-slate-500">{account.account_name || 'Account holder not set'}</p>
                      {(account.bank_code || account.branch_code || account.swift_code) && (
                        <p className="mt-1 text-xs text-slate-400">
                          {[account.bank_code && `Bank ${account.bank_code}`, account.branch_code && `Branch ${account.branch_code}`, account.swift_code && `SWIFT ${account.swift_code}`].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="secondary">{account.currency}</Badge>
                      {account.receiving_currency && account.receiving_currency !== account.currency && (
                        <p className="mt-1 text-xs text-slate-500">Receives as {account.receiving_currency}</p>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-700">
                      {account.minimum_amount ? `${account.minimum_amount.toLocaleString()} ${account.currency}` : 'None'}
                    </TableCell>
                    <TableCell className="min-w-48 text-xs leading-5 text-slate-600">
                      <p>Wallet &gt; Deposit</p>
                      <p className="text-slate-400">Telegram fallback, where applicable</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditAccount(index)}
                          className="motion-interactive inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                          aria-label={`Edit ${account.label || 'receiving account'}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDepositAccounts(items => items.filter((_, itemIndex) => itemIndex !== index))}
                          className="motion-interactive inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          aria-label={`Remove ${account.label || 'receiving account'}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Minimum amounts can be used to select a non-Toss destination for eligible high-value wallet deposits.
        </p>
      </section>
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-200 bg-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">{editingAccountIndex === null ? 'Add receiving account' : 'Edit receiving account'}</DialogTitle>
            <DialogDescription>
              These details appear in Wallet &gt; Deposit and may be used as the Telegram deposit fallback.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Account label
              <input value={accountDraft.label} placeholder="e.g. Netbank PHP" onChange={event => setAccountDraft(draft => ({ ...draft, label: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Currency
              <select value={accountDraft.currency} onChange={event => setAccountDraft(draft => ({ ...draft, currency: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900">
                {depositCurrencies.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Bank or provider
              <input value={accountDraft.value} placeholder="e.g. netbank" onChange={event => setAccountDraft(draft => ({ ...draft, value: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Account number
              <input value={accountDraft.account_number} placeholder="Enter account number" onChange={event => setAccountDraft(draft => ({ ...draft, account_number: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Account holder name
              <input value={accountDraft.account_name} placeholder="Registered account holder" onChange={event => setAccountDraft(draft => ({ ...draft, account_name: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Receiving currency (optional)
              <select value={accountDraft.receiving_currency || ''} onChange={event => setAccountDraft(draft => ({ ...draft, receiving_currency: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900">
                <option value="">Same as collection</option>
                {receivingCurrencies.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Minimum collection amount (optional)
              <input type="number" min="0" step="0.01" value={accountDraft.minimum_amount ?? ''} onChange={event => setAccountDraft(draft => ({ ...draft, minimum_amount: event.target.value ? Number(event.target.value) : undefined }))} placeholder={`Amount in ${accountDraft.currency}`} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Bank code (optional)
              <input value={accountDraft.bank_code || ''} onChange={event => setAccountDraft(draft => ({ ...draft, bank_code: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Branch code (optional)
              <input value={accountDraft.branch_code || ''} onChange={event => setAccountDraft(draft => ({ ...draft, branch_code: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              SWIFT/BIC (optional)
              <input value={accountDraft.swift_code || ''} placeholder="e.g. ABCDKRSE" onChange={event => setAccountDraft(draft => ({ ...draft, swift_code: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600 sm:col-span-2">
              Bank address (optional)
              <input value={accountDraft.bank_address || ''} onChange={event => setAccountDraft(draft => ({ ...draft, bank_address: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAccountDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={saveAccountDraft} className="bg-[#FF6B00] text-white hover:bg-[#E66000]">
              {editingAccountIndex === null ? 'Add account' : 'Save account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <section id="deposit-rules" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><DollarSign className="h-5 w-5" /></span>
          <div>
            <h3 className="text-base font-bold text-slate-900">Deposit rules</h3>
            <p className="mt-1 text-sm text-slate-500">Control accepted currencies, receipt uploads, and first-time USDT funding.</p>
          </div>
        </div>
        <div className="mt-5 grid items-start gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            Bank deposit currencies
            <input
              value={depositRules.bank_deposit_currencies.join(', ')}
              onChange={event => setDepositRules(current => ({ ...current, bank_deposit_currencies: event.target.value.split(',').map(value => value.trim().toUpperCase()).filter(Boolean) }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 focus:border-[#FF6B00] focus:outline-none focus:ring-4 focus:ring-[#FF6B00]/5"
              placeholder="PHP, KRW"
            />
            <span className="block text-xs font-normal text-slate-400">Separate currency codes with commas.</span>
          </label>
          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            Top-up currencies
            <input
              value={depositRules.topup_currencies.join(', ')}
              onChange={event => setDepositRules(current => ({ ...current, topup_currencies: event.target.value.split(',').map(value => value.trim().toUpperCase()).filter(Boolean) }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 focus:border-[#FF6B00] focus:outline-none focus:ring-4 focus:ring-[#FF6B00]/5"
              placeholder="PHP, USDT, KRW"
            />
            <span className="block text-xs font-normal text-slate-400">Separate currency codes with commas.</span>
          </label>
          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            Maximum receipt size (MB)
            <span className="flex h-11 items-center rounded-xl border border-slate-200 bg-white focus-within:border-[#FF6B00] focus-within:ring-4 focus-within:ring-[#FF6B00]/5">
              <input type="number" min="0" step="0.1" value={depositRules.receipt_max_size_mb} onChange={event => setDepositRules(current => ({ ...current, receipt_max_size_mb: Number(event.target.value) || 0 }))} className="h-full min-w-0 flex-1 rounded-xl bg-transparent px-3 text-sm font-normal text-slate-900 outline-none" />
              <span className="pr-3 text-xs font-semibold text-slate-400">MB</span>
            </span>
          </label>
          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            First USDT top-up amount
            <span className="flex h-11 items-center rounded-xl border border-slate-200 bg-white focus-within:border-[#FF6B00] focus-within:ring-4 focus-within:ring-[#FF6B00]/5">
              <input type="number" min="0" step="0.01" value={depositRules.first_usdt_topup_amount} onChange={event => setDepositRules(current => ({ ...current, first_usdt_topup_amount: Number(event.target.value) || 0 }))} className="h-full min-w-0 flex-1 rounded-xl bg-transparent px-3 text-sm font-normal text-slate-900 outline-none" />
              <span className="pr-3 text-xs font-semibold text-slate-400">USDT</span>
            </span>
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 md:col-span-2">
            <input type="checkbox" className="h-4 w-4 accent-[#FF6B00]" checked={depositRules.first_usdt_topup_rule_enabled} onChange={event => setDepositRules(current => ({ ...current, first_usdt_topup_rule_enabled: event.target.checked }))} />
            Enforce the first USDT top-up amount rule
          </label>
        </div>
      </section>
        </>
      )}
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PERMISSION_KEYS: { key: keyof AdminUser; label: string; color: string }[] = PERMISSION_DEFINITIONS;

const defaultForm = {
  telegram_id: '',
  telegram_username: '',
  email: '',
  password: '',
  name: '',
  role: 'admin',
};

const ADMIN_ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'operator', label: 'Operator' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'developer', label: 'Developer' },
  { value: 'approver', label: 'Approver' },
  { value: 'super_admin', label: 'Invited super admin' },
] as const;

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
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  return (
    <span
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
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
    </span>
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
  const activeTab = tabs.find((tab) => tab.id === active);
  const groupedTabs = tabs.reduce<Array<{ id: string; label: string; items: typeof tabs }>>((groups, tab) => {
    const label = tab.group || 'General';
    const groupId = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
    const group = groups.find((item) => item.label === label);
    if (group) {
      group.items.push(tab);
    } else {
      groups.push({ id: groupId, label, items: [tab] });
    }
    return groups;
  }, []);

  return (
    <nav aria-label="Administration sections" className="w-full shrink-0 lg:sticky lg:top-24 lg:w-72">
      <div className="hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:flex lg:max-h-[calc(100vh-7rem)] lg:flex-col lg:gap-1 lg:overflow-y-auto">
        {groupedTabs.map((group) => (
          <section key={group.id} aria-labelledby={`admin-group-${group.id}`}>
            <h2 id={`admin-group-${group.id}`} className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 first:mt-0">
              {group.label}
            </h2>
            <div className="space-y-1">
              {group.items.map((tab) => {
                const isActive = active === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChange(tab.id)}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={tab.description ? `${tab.label}: ${tab.description}` : tab.label}
                    className={`motion-interactive group relative flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                      isActive ? 'border-orange-200 bg-orange-50 shadow-sm' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isActive && <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-[#FF6B00]" aria-hidden="true" />}
                    <div className={`rounded-lg p-2 transition-colors ${isActive ? 'bg-[#FF6B00] text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'}`}>
                      {tab.icon}
                    </div>
                    <span className={`min-w-0 flex-1 truncate text-[13px] font-semibold ${isActive ? 'text-[#C2410C]' : 'text-slate-700 group-hover:text-slate-900'}`}>{tab.label}</span>
                    {tab.count !== undefined && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isActive ? 'bg-[#FF6B00] text-white' : 'bg-slate-100 text-slate-500'}`}>{tab.count}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Mobile: compact section selector */}
      <div className="lg:hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <label htmlFor="admin-section-select" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Administration section
        </label>
        <div className="relative">
          <select
            id="admin-section-select"
            value={active}
            onChange={(event) => onChange(event.target.value)}
            className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-10 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10"
          >
            {groupedTabs.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {group.items.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        </div>
        {activeTab?.description && (
          <p className="mt-2 px-1 text-xs leading-5 text-slate-500">
            {activeTab.description}
          </p>
        )}
      </div>
    </nav>
  );
}

function AdminSummaryCard({
  label,
  value,
  description,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  tone: 'orange' | 'emerald' | 'indigo' | 'slate';
}) {
  const tones = {
    orange: 'bg-orange-50 text-orange-600 ring-orange-100',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  };

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 truncate text-xs font-medium text-slate-500">{description}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-4 ${tones[tone]}`}>
          {icon}
        </div>
      </CardContent>
    </Card>
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
  currentUserId,
  onToggleActive,
  onChangeRole,
  onDelete,
  onEditBank,
  onEditApiKeys,
  onEditPassword,
  onEditFees,
}: {
  admin: AdminUser;
  isSuperAdmin: boolean;
  currentUserId?: string | number;
  onToggleActive: (a: AdminUser) => void;
  onChangeRole: (a: AdminUser, role: string) => void;
  onDelete: (a: AdminUser) => void;
  onEditBank: (a: AdminUser) => void;
  onEditApiKeys: (a: AdminUser) => void;
  onEditPassword: (a: AdminUser) => void;
  onEditFees: (a: AdminUser) => void;
}) {
  const permissionCount = PERMISSION_KEYS.filter(({ key }) => Boolean(admin[key])).length;
  const displayName = admin.name || admin.telegram_username || `Merchant ID: ${admin.telegram_id}`;
  const roleLabel = ADMIN_ROLE_OPTIONS.find(option => option.value === admin.role)?.label || admin.role || 'Admin';

  return (
    <Card className={`border-slate-200 transition-all duration-300 hover:shadow-md ${
      admin.is_active
        ? 'bg-white opacity-100'
        : 'bg-slate-50/50 opacity-75'
    }`}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 mb-5 sm:flex-row sm:items-start sm:justify-between">
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
                  {displayName}
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
                  <Badge className="border-slate-200 bg-slate-50 text-slate-600 text-[9px] font-semibold uppercase tracking-widest px-2 h-5">
                    {roleLabel}
                  </Badge>
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
            <div className="flex flex-wrap items-center gap-1 shrink-0 sm:justify-end">
              <label className="sr-only" htmlFor={`admin-role-${admin.id}`}>Role for {displayName}</label>
              <select
                id={`admin-role-${admin.id}`}
                value={admin.role || 'admin'}
                disabled={String(admin.telegram_id) === String(currentUserId)}
                onChange={event => onChangeRole(admin, event.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ADMIN_ROLE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <button
                type="button"
                onClick={() => onEditPassword(admin)}
                aria-label={`Change dashboard password for ${displayName}`}
                title="Change Dashboard Password"
                className="p-2 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all"
              >
                <KeyRound aria-hidden="true" className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={() => onEditBank(admin)}
                aria-label={`Edit bank information for ${displayName}`}
                title="Edit Bank Information"
                className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                <Tag aria-hidden="true" className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={() => onEditApiKeys(admin)}
                aria-label={`Edit API keys for ${displayName}`}
                title="Edit API Keys"
                className="p-2 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all"
              >
                <KeyRound aria-hidden="true" className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={() => onEditFees(admin)}
                aria-label={`Edit fee settings for ${displayName}`}
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
                aria-label={`${admin.is_active ? 'Deactivate' : 'Activate'} ${displayName}`}
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
                aria-label={`Remove administrator ${displayName}`}
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
              >
                <Trash2 aria-hidden="true" className="h-4.5 w-4.5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(['People & access', 'Payments & configuration', 'Approvals & wallets', 'Governance'] as const).map(group => {
            const permissions = PERMISSION_KEYS.filter(({ key }) => (
              PERMISSION_DEFINITIONS.find(definition => definition.key === key)?.group === group
            ));
            if (!permissions.length) return null;
            return (
              <div key={group} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{group}</p>
                <div className="flex flex-wrap gap-1.5">
                  {permissions.map(({ key, label, color }) => (
                    <PermissionBadge
                      key={key}
                      active={admin[key] as boolean}
                      label={label}
                      color={color}
                      interactive={false}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-slate-400" />{permissionCount} permissions enabled</span>
          {admin.settlement_currency && <span className="inline-flex items-center gap-1.5"><WalletIcon className="h-3.5 w-3.5 text-slate-400" />Settlement: {admin.settlement_currency}</span>}
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
  const [withdrawalFeePercent, setWithdrawalFeePercent] = useState(String(admin.withdrawal_fee_percent ?? 0));
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
    const withdrawalPercentValue = Number(withdrawalFeePercent);
    const baseValue = Number(baseFee);
    const parsedWithdrawals = Object.fromEntries(
      Object.entries(withdrawalFees).map(([currency, value]) => [currency, Number(value)]),
    );
    const values = [baseValue, exchangeValue, collectionValue, withdrawalPercentValue, ...Object.values(parsedWithdrawals)];
    if (values.some(value => !Number.isFinite(value) || value < 0) || [baseValue, exchangeValue, collectionValue, withdrawalPercentValue].some(value => value > 100)) {
      onError('Percentage fees must be between 0 and 100. Withdrawal fees must be non-negative.');
      return;
    }

    setSaving(true);
    try {
      const response = await authenticatedFetch(`/api/v1/admin-users/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_fee_percent: baseValue,
          exchange_rate_fee_percent: exchangeValue,
          collection_fee_percent: collectionValue,
          withdrawal_fee_percent: withdrawalPercentValue,
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
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Upline service surcharge (%)</span>
              <input type="number" min="0" max="100" step="0.01" value={baseFee} onChange={event => setBaseFee(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              <span className="block text-xs text-slate-400">Applied to eligible payments from this user’s downline. Set 0% to disable the surcharge.</span>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Exchange-rate fee (%)</span>
              <input type="number" min="0" max="100" step="0.01" value={exchangeRateFee} onChange={event => setExchangeRateFee(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Collection fee (%)</span>
              <input type="number" min="0" max="100" step="0.01" value={collectionFee} onChange={event => setCollectionFee(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Withdrawal fee (%)</span>
              <input type="number" min="0" max="100" step="0.01" value={withdrawalFeePercent} onChange={event => setWithdrawalFeePercent(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
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
  canManageTeam,
  onError,
}: {
  isSuperAdmin: boolean;
  canManageTeam: boolean;
  onError: (msg: string) => void;
}) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'inactive' | 'admins' | 'vip'>('all');
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [details, setDetails] = useState<UserActivityDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch('/api/v1/team/members?include_inactive=true');
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
      const res = await authenticatedFetch(`/api/v1/users/${encodeURIComponent(user.id)}/activity`);
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
    if (!canManageTeam || !member.telegram_id) return;
    try {
      const res = await authenticatedFetch(`/api/v1/team/members/${encodeURIComponent(member.telegram_id)}/vip-gold`, {
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
    if (!canManageTeam || !member.admin_id) return;
    try {
      const res = await authenticatedFetch(`/api/v1/admin-users/${member.admin_id}`, {
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
    if (!canManageTeam || !member.admin_id || !role || String(member.telegram_id) === String(currentUser?.id)) return;
    try {
      const res = await authenticatedFetch(`/api/v1/admin-users/${member.admin_id}`, {
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
    const matchesSearch = !query || [user.name, user.email, user.id, user.telegram_id, user.organization_name, user.role]
      .some(value => String(value || '').toLowerCase().includes(query));
    const matchesFilter = userFilter === 'all'
      || (userFilter === 'active' && user.is_active)
      || (userFilter === 'inactive' && !user.is_active)
      || (userFilter === 'admins' && ['admin', 'co_admin', 'super_admin'].includes(user.role))
      || (userFilter === 'vip' && user.vip_gold);
    return matchesSearch && matchesFilter;
  });
  const activeUserCount = users.filter(user => user.is_active).length;
  const inactiveUserCount = users.length - activeUserCount;
  const adminUserCount = users.filter(user => ['admin', 'co_admin', 'super_admin'].includes(user.role)).length;
  const vipUserCount = users.filter(user => user.vip_gold).length;

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
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, Telegram ID, store, or role"
            aria-label="Search users"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#FF6B00] focus:bg-white focus:ring-4 focus:ring-[#FF6B00]/5 lg:max-w-md"
          />
          <div className="flex flex-wrap items-center gap-2">
            {([
              ['all', `All ${users.length}`],
              ['active', `Active ${activeUserCount}`],
              ['inactive', `Inactive ${inactiveUserCount}`],
              ['admins', `Admins ${adminUserCount}`],
              ['vip', `VIP ${vipUserCount}`],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setUserFilter(value)}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  userFilter === value
                    ? 'border-[#FF6B00] bg-orange-50 text-[#D95700]'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => void fetchUsers()} disabled={loading} className="gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>{filteredUsers.length} matching users</span>
          <span>{activeUserCount} active of {users.length} total</span>
        </div>
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
      {filteredUsers.length === 0 ? (
        <Card className="border-slate-200 bg-white">
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">No matching users</p>
            <p className="mt-1 text-xs text-slate-500">Try a different search term or filter.</p>
          </CardContent>
        </Card>
      ) : filteredUsers.map((user) => (
        <Card key={user.id} className={`motion-interactive border-slate-200 hover:border-slate-300 ${user.is_active === false ? 'bg-slate-50/70 opacity-80' : 'bg-white'}`}>
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
                    <Badge variant="outline" className="text-[10px] capitalize">{user.role.replace('_', ' ')}</Badge>
                    {user.is_active === false && <Badge variant="outline" className="border-red-200 text-[10px] text-red-600">Inactive</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground truncate">{user.email}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">
                    {user.telegram_id && <span>Telegram: {user.telegram_id}</span>}
                    {user.organization_name && <span>Store: {user.organization_name}</span>}
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
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
                  disabled={!isSuperAdmin || String(user.telegram_id) === String(currentUser?.id)}
                  className="h-7 rounded-full border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-600 disabled:opacity-60"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="co_admin">Co-admin</option>
                  <option value="agent">Agent</option>
                  <option value="super_admin">Super admin</option>
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

      const res = await authenticatedFetch(`/api/v1/audit-logs?${params.toString()}`);
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
      const res = await authenticatedFetch(`/api/v1/audit-logs/purge?days=${days}`, { method: 'DELETE' });
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
      const res = await authenticatedFetch('/api/v1/wallet/crypto-topup-requests');
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
      const res = await authenticatedFetch(`/api/v1/wallet/crypto-topup-requests/${id}/${action}`, {
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
      const res = await authenticatedFetch(`/api/v1/admin/merchant/${admin.telegram_id}/api-keys`);
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
      const res = await authenticatedFetch(`/api/v1/admin/merchant/${admin.telegram_id}/api-keys`, {
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
      const res = await authenticatedFetch(`/api/v1/admin/api-keys/${id}`, { method: 'DELETE' });
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

type BitGoAddress = { user_id: string; address: string; derivation_index: number; last_scanned_at: string | null };

function BitGoWalletTab({ onError }: { onError: (message: string) => void }) {
  const [config, setConfig] = useState({ enabled: false, configured: false, has_access_token: false, access_token: '', base_url: 'https://app.bitgo.com', wallet_id: '', coin: 'trx', usdt_contract: '' });
  const [addresses, setAddresses] = useState<BitGoAddress[]>([]);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [egressIp, setEgressIp] = useState('');

  const load = useCallback(async () => {
    try {
      const [configResponse, addressesResponse] = await Promise.all([authenticatedFetch('/api/v1/tatum/config'), authenticatedFetch('/api/v1/tatum/addresses')]);
      if (!configResponse.ok || !addressesResponse.ok) throw new Error('Unable to load BitGo settings');
      const nextConfig = await configResponse.json();
      const nextAddresses = await addressesResponse.json();
      setConfig(current => ({ ...current, ...nextConfig }));
      setAddresses(nextAddresses.addresses || []);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to load BitGo settings');
    }
  }, [onError]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const baseUrl = config.base_url.trim().replace(/\/+$/, '');
    if (!/^https?:\/\/\S+$/i.test(baseUrl)) {
      onError('BitGo base URL must start with http:// or https://.');
      return;
    }
    if (!config.wallet_id.trim()) {
      onError('BitGo wallet ID is required.');
      return;
    }
    if (!config.usdt_contract.trim()) {
      onError('USDT contract address is required.');
      return;
    }
    if (config.enabled && !config.has_access_token && !config.access_token.trim()) {
      onError('Enter a BitGo access token before enabling the integration.');
      return;
    }
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/v1/tatum/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, base_url: baseUrl, wallet_id: config.wallet_id.trim(), usdt_contract: config.usdt_contract.trim() }),
      });
      if (!response.ok) throw new Error(await response.text());
      const nextConfig = await response.json();
      setConfig(current => ({ ...current, ...nextConfig }));
      setSavedAt(new Date());
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to save BitGo settings');
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (path: string, label: string) => {
    setBusy(true);
    try {
      const response = await authenticatedFetch(path, { method: 'POST' });
      if (!response.ok) throw new Error(await response.text());
      await load();
      window.alert(`${label} completed.`);
    } catch (error) {
      onError(error instanceof Error ? error.message : `${label} failed`);
    } finally {
      setBusy(false);
    }
  };

  const checkEgressIp = async () => {
    setBusy(true);
    try {
      const response = await authenticatedFetch('/api/v1/admin/diagnostics/egress-ip');
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ip) throw new Error(payload.detail || 'Unable to determine production egress IP');
      setEgressIp(payload.ip);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unable to determine production egress IP');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">BitGo USDT wallet integration</h2>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500">Create one TRC20 deposit address per user and monitor incoming transfers. Store only the BitGo access token and wallet ID; never enter a seed phrase or private key.</p>
          {savedAt && <p className="mt-2 text-xs font-medium text-slate-400">Last saved {savedAt.toLocaleTimeString()}</p>}
        </div>
        <Badge className={`w-fit ${config.configured && config.enabled ? 'bg-emerald-100 text-emerald-700' : config.configured ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
          {config.configured && config.enabled ? 'ACTIVE' : config.configured ? 'DISABLED' : 'NOT CONFIGURED'}
        </Badge>
      </div>
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 md:grid-cols-2">
        <label className="space-y-1.5 text-sm font-semibold text-slate-700">BitGo access token<input type="password" autoComplete="new-password" value={config.access_token} placeholder={config.has_access_token ? 'Configured; leave blank to keep it' : 'Paste access token'} onChange={event => setConfig(current => ({ ...current, access_token: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 font-normal" /><span className="block text-xs font-normal text-slate-400">The existing token is never displayed.</span></label>
        <label className="space-y-1.5 text-sm font-semibold text-slate-700">BitGo wallet ID<input value={config.wallet_id} onChange={event => setConfig(current => ({ ...current, wallet_id: event.target.value }))} placeholder="Wallet ID" className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs font-normal" /></label>
        <label className="space-y-1.5 text-sm font-semibold text-slate-700">BitGo base URL<input value={config.base_url} onChange={event => setConfig(current => ({ ...current, base_url: event.target.value }))} className="h-10 w-full rounded-xl border border-slate-200 px-3 font-normal" /></label>
        <label className="space-y-1.5 text-sm font-semibold text-slate-700">USDT contract<input value={config.usdt_contract} onChange={event => setConfig(current => ({ ...current, usdt_contract: event.target.value }))} className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs font-normal" /></label>
        <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 md:col-span-2"><input type="checkbox" checked={config.enabled} onChange={event => setConfig(current => ({ ...current, enabled: event.target.checked }))} className="h-4 w-4 accent-orange-600" /> Enable BitGo address assignment and monitoring</label>
        <div className="flex flex-col gap-2 md:col-span-2 sm:flex-row sm:flex-wrap"><Button onClick={save} disabled={saving} className="min-h-11 bg-[#FF6B00] text-white hover:bg-[#E66000]">{saving ? 'Saving...' : 'Save BitGo settings'}</Button><Button type="button" variant="outline" disabled={busy || !config.configured} onClick={() => runAction('/api/v1/tatum/addresses/assign-missing', 'Address assignment')} className="min-h-11">Assign missing addresses</Button><Button type="button" variant="outline" disabled={busy || !config.configured} onClick={() => runAction('/api/v1/tatum/monitor', 'Transfer monitoring')} className="min-h-11">Scan transfers now</Button><Button type="button" variant="outline" disabled={busy} onClick={checkEgressIp} className="min-h-11">Check production IP</Button></div>
        {egressIp && <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 md:col-span-2">Whitelist this production IPv4 in BitGo: <code className="ml-1 font-bold">{egressIp}</code></div>}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h3 className="text-base font-semibold text-slate-900">Assigned TRC20 addresses</h3><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400"><tr><th className="pb-3">User</th><th className="pb-3">Address</th><th className="pb-3">Index</th><th className="pb-3">Last scan</th></tr></thead><tbody>{addresses.map(item => <tr key={item.address} className="border-b border-slate-100"><td className="py-3 font-medium text-slate-700">{item.user_id}</td><td className="py-3 font-mono text-xs text-slate-600">{item.address}</td><td className="py-3 text-slate-500">{item.derivation_index}</td><td className="py-3 text-slate-500">{item.last_scanned_at ? new Date(item.last_scanned_at).toLocaleString() : 'Never'}</td></tr>)}</tbody></table>{addresses.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No addresses assigned yet.</p>}</div></section>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminManagement() {
  const { isSuperAdmin, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = (requestedTab === 'tatum' ? 'bitgo' : requestedTab || 'admins') as AdminTab;

  const setActiveTab = (tab: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tab);
    setSearchParams(nextParams, { replace: true });
  };

  const canManagePayments = Boolean(user?.permissions?.can_manage_payments);
  const canManageDisbursements = Boolean(user?.permissions?.can_manage_disbursements);
  const canViewReports = Boolean(user?.permissions?.can_view_reports);
  const canManageWallet = Boolean(user?.permissions?.can_manage_wallet);
  const canManageTransactions = Boolean(user?.permissions?.can_manage_transactions);
  const canManageBot = Boolean(user?.permissions?.can_manage_bot);
  const canApproveTopups = Boolean(user?.permissions?.can_approve_topups);
  const canManageTeam = Boolean(user?.permissions?.can_manage_team);
  const canAccessAdminUsers = isSuperAdmin && canManageTeam;
  const canAccessUserManagement = isSuperAdmin;
  const canAccessCryptoRequests = isSuperAdmin && canApproveTopups;
  const canAccessWalletControl = isSuperAdmin && canManageWallet;
  const canAccessOperations = isSuperAdmin && (canManagePayments || canManageDisbursements || canApproveTopups || canViewReports || canManageBot);
  const canAccessTossApprovals = isSuperAdmin && canManageWallet;
  const canAccessPaymentChannels = isSuperAdmin && (canManagePayments || canManageDisbursements);
  const canAccessWalletSettings = isSuperAdmin && canManageWallet;
  const canAccessBitgo = isSuperAdmin && canManageWallet;
  const canAccessCheckoutDesign = isSuperAdmin && canManagePayments;
  const canAccessPlatformSettings = isSuperAdmin && (canManagePayments || canManageWallet);
  const canAccessApprovalsAndWallets = canAccessCryptoRequests || canAccessWalletControl || canAccessOperations || canAccessTossApprovals;
  const canAccessPaymentsAndConfiguration = canAccessPaymentChannels || canAccessWalletSettings || canAccessBitgo || canAccessCheckoutDesign || canAccessPlatformSettings;
  const canAccessGovernance = isSuperAdmin;
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminFilter, setAdminFilter] = useState<'all' | 'active' | 'inactive' | 'super'>('all');
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
    if (!canAccessAdminUsers) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await authenticatedFetch('/api/v1/admin-users');
      if (!res.ok) throw new Error(await res.text());
      setAdmins(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, [canAccessAdminUsers]);

  const fetchMaintenanceMode = useCallback(async () => {
    try {
      setMaintenanceLoading(true);
      const res = await authenticatedFetch('/api/v1/app-settings/maintenance');
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
      const res = await authenticatedFetch('/api/v1/app-settings/collection-fee');
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
      const res = await authenticatedFetch('/api/v1/app-settings/maintenance', {
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
    if (canAccessAdminUsers) {
      void fetchAdmins();
    }
    fetchMaintenanceMode();
    if (isSuperAdmin) void fetchCollectionFee();
    const id = canAccessAdminUsers ? setInterval(() => void fetchAdmins(), 30000) : undefined;
    return () => {
      if (id !== undefined) clearInterval(id);
    };
  }, [canAccessAdminUsers, fetchAdmins, fetchMaintenanceMode, fetchCollectionFee, isSuperAdmin]);

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
      const res = await authenticatedFetch('/api/v1/app-settings/collection-fee', {
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
      const res = await authenticatedFetch('/api/v1/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: form.telegram_id || undefined,
          telegram_username: form.telegram_username || undefined,
          email: form.email.trim(),
          password: form.password,
          name: form.name.trim(),
          role: form.role,
        }),
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
      const res = await authenticatedFetch(`/api/v1/admin-users/${admin.id}`, {
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

  const handleChangeRole = async (admin: AdminUser, role: string) => {
    if (!isSuperAdmin) return;
    try {
      const res = await authenticatedFetch(`/api/v1/admin-users/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchAdmins();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update admin role');
    }
  };

  const handleSavedFees = (updated: AdminUser) => {
    setAdmins(current => current.map(admin => admin.id === updated.id ? updated : admin));
  };

  const handleDelete = async (admin: AdminUser) => {
    if (!isSuperAdmin) return;
    if (!confirm(`Deactivate @${admin.telegram_username || admin.telegram_id}? Their wallet and history will be preserved.`)) return;
    try {
      const res = await authenticatedFetch(`/api/v1/admin-users/${admin.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      await fetchAdmins();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete admin');
    }
  };

  const handleSaveBank = async (data: Partial<AdminUser>) => {
    if (!editingBankAdmin) return;
    try {
      const res = await authenticatedFetch(`/api/v1/admin-users/${editingBankAdmin.id}`, {
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
    const res = await authenticatedFetch(`/api/v1/admin-users/${editingPasswordAdmin.id}`, {
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
  const superAdminCount = admins.filter((a) => a.is_super_admin).length;
  const normalizedAdminSearch = adminSearch.trim().toLowerCase();
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch = !normalizedAdminSearch || [
      admin.name,
      admin.telegram_username,
      admin.telegram_id,
      admin.bank_name,
    ].some(value => String(value || '').toLowerCase().includes(normalizedAdminSearch));
    const matchesFilter = adminFilter === 'all'
      || (adminFilter === 'active' && admin.is_active)
      || (adminFilter === 'inactive' && !admin.is_active)
      || (adminFilter === 'super' && admin.is_super_admin);
    return matchesSearch && matchesFilter;
  });
  const filteredActiveAdmins = filteredAdmins.filter((admin) => admin.is_active);
  const filteredInactiveAdmins = filteredAdmins.filter((admin) => !admin.is_active);

  const tabs = [
    ...(canAccessAdminUsers ? [{
      id: 'admins',
      label: 'Admin Users',
      icon: <ShieldCheck className="h-4 w-4" />,
      count: admins.length,
      group: 'People & access',
      description: 'Manage dashboard administrators and their specific permissions.'
    }] : []),
    ...(canAccessUserManagement ? [{
      id: 'users',
      label: 'User Management',
      icon: <Users className="h-4 w-4" />,
      group: 'People & access',
      description: 'View and manage roles for all registered platform users.'
    }] : []),
    ...(canAccessCryptoRequests ? [{
      id: 'crypto',
      label: 'Crypto Requests',
      icon: <Bitcoin className="h-4 w-4" />,
      group: 'Approvals & wallets',
      description: 'Review and approve USDT top-up requests from users.'
    }] : []),
    ...(canAccessWalletControl ? [{
      id: 'wallet-control',
      label: 'Wallet Control',
      icon: <WalletIcon className="h-4 w-4 text-blue-400" />,
      group: 'Approvals & wallets',
      description: 'Credit or debit any active user wallet in PHP, USDT, CNY, or KRW.'
    }] : []),
    ...(canAccessOperations ? [{
      id: 'operations',
      label: 'Operational workflows',
      icon: <RefreshCw className="h-4 w-4" />,
      group: 'Approvals & wallets',
      description: 'Open payment, deposit, withdrawal, verification, broadcast, and bot operations.'
    }] : []),
    ...(canAccessTossApprovals ? [{
      id: 'toss-approvals',
      label: 'TOSS Bank approvals',
      icon: <CheckCircle className="h-4 w-4" />,
      group: 'Approvals & wallets',
      description: 'Review and approve TOSS Bank virtual account applications.'
    }] : []),
    ...(canAccessPaymentChannels ? [{
      id: 'payment-channels',
      label: 'Payment Channels',
      icon: <Power className="h-4 w-4" />,
      group: 'Payments & configuration',
      description: 'Control checkout, withdrawal, and disbursement channels by currency.'
    }] : []),
    ...(canAccessWalletSettings ? [{
      id: 'wallet-settings',
      label: 'Wallet Settings',
      icon: <WrenchIcon className="h-4 w-4" />,
      group: 'Payments & configuration',
      description: 'Set incoming, deposit, balance, and withdrawal limits for all user wallets.'
    }] : []),
    ...(canAccessBitgo ? [{
      id: 'bitgo',
      label: 'BitGo USDT',
      icon: <Bitcoin className="h-4 w-4" />,
      group: 'Payments & configuration',
      description: 'Configure unique TRC20 address assignment and scan incoming and outgoing transfers.'
    }] : []),
    ...(canAccessCheckoutDesign ? [{
      id: 'checkout-design',
      label: 'Checkout Design',
      icon: <Palette className="h-4 w-4" />,
      group: 'Payments & configuration',
      description: 'Customize the public checkout appearance.'
    }] : []),
    ...(canAccessPlatformSettings ? [{
      id: 'platform-settings',
      label: 'Platform settings',
      icon: <WrenchIcon className="h-4 w-4" />,
      group: 'Payments & configuration',
      description: 'Manage collection currencies, conversion fees, and database backups.'
    }] : []),
    ...(canManageTeam ? [{
      id: 'team-invitations',
      label: 'Team Invitations',
      icon: <Mail className="h-4 w-4" />,
      group: 'Teams',
      description: 'Manage pending team invites and organization access.'
    }] : []),
    ...(canManageTeam ? [{
      id: 'team-members',
      label: 'Team Members',
      icon: <Users className="h-4 w-4" />,
      group: 'Teams',
      description: 'Manage existing team members within your organization.'
    }] : []),
    ...(canAccessGovernance ? [{
      id: 'audit-logs',
      label: 'Audit Logs',
      icon: <FileText className="h-4 w-4" />,
      group: 'Governance',
      description: 'Review administrative activity and export audit history.'
    }] : []),
    ...(isSuperAdmin ? [{
      id: 'test-data-cleanup',
      label: 'Test data cleanup',
      icon: <Trash2 className="h-4 w-4" />,
      group: 'Governance',
      description: 'Review and permanently clear payment transactions and disbursements for test-mode merchants.'
    }] : []),
  ];
  const selectedTab = tabs.some(tab => tab.id === activeTab) ? activeTab : tabs[0]?.id || 'admins';
  const selectedTabMeta = tabs.find(tab => tab.id === selectedTab);

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
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C2410C]">Control center</span>
                    {isSuperAdmin && (
                      <Badge className="border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        Super Admin
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                    Admin Management
                  </h1>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">
                    Manage access, platform controls, and operational configuration from one place.
                  </p>
                </div>
              </div>
              {selectedTab === 'admins' && canAccessAdminUsers && (
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

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pb-8 pt-4 sm:px-6 lg:flex-row lg:items-start lg:gap-8 lg:px-8">
          {/* Vertical Navigation Sidebar */}
          <AdminSidebar
            tabs={tabs}
            active={selectedTab}
            onChange={(id) => {
              setActiveTab(id);
              setShowAdd(false);
              setError('');
            }}
          />

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 w-full space-y-6">
            {selectedTabMeta && (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-orange-50 p-2 text-[#C2410C]">
                    {selectedTabMeta.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        {selectedTabMeta.group || 'Administration'}
                      </p>
                      <span className="text-slate-300" aria-hidden="true">/</span>
                      <h2 className="text-sm font-bold text-slate-900">{selectedTabMeta.label}</h2>
                    </div>
                    {selectedTabMeta.description && (
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">{selectedTabMeta.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {canAccessAdminUsers && selectedTab === 'admins' && (
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <AdminSummaryCard
                  label="Administrators"
                  value={admins.length}
                  description="Total accounts"
                  icon={<Users className="h-5 w-5" />}
                  tone="orange"
                />
                <AdminSummaryCard
                  label="Active access"
                  value={activeAdmins.length}
                  description={`${inactiveAdmins.length} inactive`}
                  icon={<Power className="h-5 w-5" />}
                  tone="emerald"
                />
                <AdminSummaryCard
                  label="Super admins"
                  value={superAdminCount}
                  description="Full platform access"
                  icon={<Crown className="h-5 w-5" />}
                  tone="indigo"
                />
                <AdminSummaryCard
                  label="Security"
                  value={maintenanceMode ? 'Paused' : 'Operational'}
                  description={maintenanceMode ? 'Maintenance mode enabled' : 'Public services available'}
                  icon={<ShieldCheck className="h-5 w-5" />}
                  tone={maintenanceMode ? 'slate' : 'emerald'}
                />
              </div>
            )}

            {canAccessAdminUsers && selectedTab === 'admins' && (
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Quick controls</h2>
                      <p className="mt-1 text-sm text-slate-500">Jump directly to the areas that affect daily platform operations.</p>
                    </div>
                    <span className="text-xs font-medium text-slate-400">Super admin only</span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                      { id: 'operations', label: 'Operational workflows', detail: 'Payments, deposits, withdrawals, and verifications', icon: <RefreshCw className="h-4 w-4" /> },
                      { id: 'wallet-settings', label: 'Wallet settings', detail: 'Limits, deposits, and receiving accounts', icon: <WalletIcon className="h-4 w-4" /> },
                      { id: 'payment-channels', label: 'Payment channels', detail: 'Enable or disable checkout and payout methods', icon: <Power className="h-4 w-4" /> },
                      { id: 'bitgo', label: 'BitGo USDT', detail: 'Address assignment and transfer monitoring', icon: <Bitcoin className="h-4 w-4" /> },
                      { id: 'platform-settings', label: 'Platform settings', detail: 'Currencies, fees, and backup tools', icon: <WrenchIcon className="h-4 w-4" /> },
                      { id: 'audit-logs', label: 'Audit logs', detail: 'Review administrative activity', icon: <FileText className="h-4 w-4" /> },
                    ].filter(action => tabs.some(tab => tab.id === action.id)).map(action => (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(action.id);
                          setShowAdd(false);
                          setError('');
                        }}
                        className="motion-interactive flex min-h-[76px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-orange-200 hover:bg-orange-50"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#C2410C] shadow-sm">{action.icon}</span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-800">{action.label}</span>
                          <span className="mt-0.5 block text-xs leading-5 text-slate-500">{action.detail}</span>
                        </span>
                        <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Maintenance Mode Toggle (super admin only) */}
            {canAccessPlatformSettings && (
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

            {canAccessPlatformSettings && selectedTab === 'admins' && (
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
            {selectedTab === 'admins' && canAccessAdminUsers && (
              <div className="space-y-6">
                {/* Add Admin Form */}
                {showAdd && canAccessAdminUsers && (
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
                        <label htmlFor="admin-role" className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">Role</label>
                        <select
                          id="admin-role"
                          value={form.role}
                          onChange={event => setForm(current => ({ ...current, role: event.target.value }))}
                          className="h-11 w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:border-[#FF6B00] focus:outline-none focus:ring-4 focus:ring-[#FF6B00]/5"
                        >
                          {ADMIN_ROLE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        <p className="text-xs text-slate-500">Permissions are assigned by role and cannot be edited individually.</p>
                        <div className="flex flex-wrap gap-2">
                          {PERMISSION_DEFINITIONS.map(({ key, label, color }) => (
                            <PermissionBadge
                              key={key}
                              active={ROLE_PERMISSION_PRESETS[form.role]?.has(key) ?? false}
                              label={label}
                              color={color}
                              interactive={false}
                            />
                          ))}
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

            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={adminSearch}
                    onChange={event => setAdminSearch(event.target.value)}
                    placeholder="Search by name, Telegram ID, username, or bank"
                    aria-label="Search administrator accounts"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#FF6B00] focus:bg-white focus:ring-4 focus:ring-[#FF6B00]/5"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {([
                    ['all', `All ${admins.length}`],
                    ['active', `Active ${activeAdmins.length}`],
                    ['inactive', `Inactive ${inactiveAdmins.length}`],
                    ['super', `Super ${admins.filter(admin => admin.is_super_admin).length}`],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAdminFilter(value)}
                      aria-pressed={adminFilter === value}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        adminFilter === value
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <Button type="button" variant="outline" size="icon" onClick={() => fetchAdmins()} disabled={loading} aria-label="Refresh administrators" title="Refresh administrators">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>

              {/* Admins List */}
              {loading ? (
                  <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="motion-skeleton h-32 rounded-2xl bg-white border border-slate-200" />
                    ))}
                  </div>
                ) : filteredAdmins.length === 0 ? (
                  <Card className="bg-white border-slate-200 py-20">
                    <CardContent className="flex flex-col items-center justify-center text-center">
                      <div className="h-20 w-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6">
                        <ShieldCheck className="h-10 w-10 text-slate-300" />
                      </div>
                      <p className="text-slate-900 font-semibold text-lg tracking-tight">{admins.length === 0 ? 'No Administrators Configured' : 'No Administrators Found'}</p>
                      <p className="text-slate-500 text-sm mt-2 max-w-xs font-medium">{admins.length === 0 ? 'Add your first administrator to grant access to the management dashboard.' : 'Try a different search term or filter.'}</p>
                      {admins.length === 0 && <Button onClick={() => setShowAdd(true)} variant="outline" className="mt-8 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50">Add your first admin</Button>}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredActiveAdmins.map(admin => (
                      <AdminCard
                        key={admin.id}
                        admin={admin}
                        isSuperAdmin={isSuperAdmin}
                        currentUserId={user?.id}
                        onToggleActive={handleToggleActive}
                        onChangeRole={handleChangeRole}
                        onDelete={handleDelete}
                        onEditBank={setEditingBankAdmin}
                        onEditApiKeys={setEditingApiKeysAdmin}
                        onEditPassword={setEditingPasswordAdmin}
                        onEditFees={setEditingFeesAdmin}
                      />
                    ))}

                    {filteredInactiveAdmins.length > 0 && (
                      <div className="pt-6 space-y-4">
                        <div className="flex items-center gap-4 px-2">
                          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-[0.2em] whitespace-nowrap">Inactive Accounts</span>
                          <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {filteredInactiveAdmins.map(admin => (
                            <AdminCard
                              key={admin.id}
                              admin={admin}
                              isSuperAdmin={isSuperAdmin}
                              currentUserId={user?.id}
                              onToggleActive={handleToggleActive}
                              onChangeRole={handleChangeRole}
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
            {selectedTab === 'users' && canAccessUserManagement && (
              <UserManagementTab isSuperAdmin={isSuperAdmin} canManageTeam={canManageTeam} onError={setError} />
            )}

            {selectedTab === 'audit-logs' && canAccessGovernance && (
              <AuditLogsTab onError={setError} />
            )}
            {selectedTab === 'test-data-cleanup' && isSuperAdmin && (
              <TestDataCleanupTab />
            )}

            {/* ── Crypto Requests Tab ── */}
            {selectedTab === 'crypto' && canAccessCryptoRequests && (
              <CryptoRequestsTab canApproveTopups={canApproveTopups} onError={setError} />
            )}

            {/* ── Unified Wallet Control Tab ── */}
            {selectedTab === 'wallet-control' && canAccessWalletControl && (
              <WalletControlTab onError={setError} />
            )}
            {selectedTab === 'operations' && canAccessOperations && (
              <AdminOperationsTab />
            )}
            {selectedTab === 'toss-approvals' && canAccessTossApprovals && (
              <TossAccountApprovalsPanel />
            )}
            {selectedTab === 'payment-channels' && canAccessPaymentChannels && (
              <PaymentChannelsTab onError={setError} />
            )}
            {selectedTab === 'wallet-settings' && canAccessWalletSettings && (
              <WalletSettingsTab onError={setError} />
            )}
            {selectedTab === 'bitgo' && canAccessBitgo && (
              <BitGoWalletTab onError={setError} />
            )}
            {selectedTab === 'checkout-design' && canAccessCheckoutDesign && (
              <CheckoutDesignTab onError={setError} />
            )}
            {selectedTab === 'platform-settings' && canAccessPlatformSettings && (
              <PlatformSettingsTab onError={setError} />
            )}

            {/* ── Team Invitations Tab ── */}
            {selectedTab === 'team-invitations' && canManageTeam && (
              <TeamInvitationsTab />
            )}

            {/* ── Team Members Tab ── */}
            {selectedTab === 'team-members' && canManageTeam && (
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
