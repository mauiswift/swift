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
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────

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
}

interface RegisteredUser {
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

type AdminTab = 'admins' | 'users' | 'crypto' | 'wallet-control' | 'payment-channels' | 'wallet-settings' | 'team-invitations' | 'team-members' | 'audit-logs';

// ... existing component declarations remain unchanged ...

export default function AdminManagement() {
  const { isSuperAdmin, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as AdminTab) || 'admins';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const canApproveTopups = isSuperAdmin;
  // Only the original/platform super admin has can_manage_team. Newly-created
  // super admins remain super admins but must not see admin-user or wallet-control
  // management, matching the backend authorization policy.
  const canManagePlatformAdmin = isSuperAdmin && Boolean(user?.permissions?.can_manage_team);
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

  const fetchAdmins = useCallback(async () => {
    if (!canManagePlatformAdmin) return;
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
  }, [canManagePlatformAdmin]);

  useEffect(() => {
    if (!canManagePlatformAdmin && (activeTab === 'admins' || activeTab === 'wallet-control')) {
      setActiveTab('users');
    }
  }, [activeTab, canManagePlatformAdmin]);

  useEffect(() => {
    if (!canManagePlatformAdmin) {
      setAdmins([]);
      setLoading(false);
      return;
    }
    fetchAdmins();
    const id = setInterval(fetchAdmins, 30000);
    return () => clearInterval(id);
  }, [canManagePlatformAdmin, fetchAdmins]);

  // ... existing handlers and rendering remain unchanged ...
}
