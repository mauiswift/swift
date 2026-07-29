import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { authApi, TelegramWidgetUser } from '../lib/auth';

interface UserPermissions {
  is_super_admin: boolean;
  can_manage_payments: boolean;
  can_manage_disbursements: boolean;
  can_view_reports: boolean;
  can_manage_wallet: boolean;
  can_manage_transactions: boolean;
  can_manage_bot: boolean;
  can_approve_topups: boolean;
  can_manage_team: boolean;
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  organization_id?: string;
  organization_name?: string;
  permissions?: UserPermissions;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  bank_address?: string;
  settlement_type?: string;
  settlement_currency?: string;
  store_name?: string;
  store_logo_url?: string;
  permanent_link_slug?: string;
}

interface AuthContextType {
  user: User | null;
  platformBranding: {
    name: string;
    logoUrl?: string;
  } | null;
  loading: boolean;
  error: string | null;
  login: (email?: string, password?: string, cfTurnstileToken?: string) => Promise<void>;
  loginWithTelegram: (user: TelegramWidgetUser, cfTurnstileToken?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  permissions: UserPermissions | null;
  brand: {
    name: string;
    logo: string;
    primaryColor: string;
  };
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [platformBranding, setPlatformBranding] = useState<{ name: string; logoUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlatformBranding = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/public/merchant/platform/branding');
      if (res.ok) {
        const data = await res.json();
        setPlatformBranding({ name: data.store_name, logoUrl: data.store_logo_url });
      }
    } catch (err) {
      console.error('Failed to fetch platform branding:', err);
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
      setError(null);
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email?: string, password?: string, cfTurnstileToken?: string) => {
      try {
        setError(null);

        if (!email || !password) {
          window.location.href = '/login';
          return;
        }

        await authApi.login(email, password, cfTurnstileToken);
        await checkAuthStatus();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
      }
    },
    [checkAuthStatus]
  );

  const loginWithTelegram = useCallback(
    async (telegramUser: TelegramWidgetUser, cfTurnstileToken?: string | null) => {
      try {
        setError(null);
        await authApi.loginWithTelegram(telegramUser, cfTurnstileToken);
        await checkAuthStatus();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Telegram login failed');
      }
    },
    [checkAuthStatus]
  );

  const logout = useCallback(async () => {
    try {
      setError(null);
      await authApi.logout();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    }
  }, []);

  useEffect(() => {
    fetchPlatformBranding();
    checkAuthStatus();
  }, [checkAuthStatus, fetchPlatformBranding]);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      platformBranding,
      loading,
      error,
      login,
      loginWithTelegram,
      logout,
      refetch: checkAuthStatus,
      isAdmin: user?.role === 'admin' || Boolean(
        user?.permissions && (
          user.permissions.is_super_admin ||
          user.permissions.can_manage_payments ||
          user.permissions.can_manage_disbursements ||
          user.permissions.can_view_reports ||
          user.permissions.can_manage_wallet ||
          user.permissions.can_manage_transactions ||
          user.permissions.can_manage_bot ||
          user.permissions.can_approve_topups ||
          user.permissions.can_manage_team
        )
      ),
      isSuperAdmin: user?.permissions?.is_super_admin ?? false,
      permissions: user?.permissions ?? null,
      brand: {
        name: 'SwiftPay',
        logo: '/logo.svg',
        primaryColor: '#0B63FF',
      },
    }),
    [user, loading, error, login, loginWithTelegram, logout, checkAuthStatus]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
