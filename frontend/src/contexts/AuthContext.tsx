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
  usdt_wallet_address?: string;
  settlement_type?: string;
  settlement_currency?: string;
  store_name?: string;
  store_logo_url?: string;
  permanent_link_slug?: string;
  must_change_password?: boolean;
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
  changePassword: (newPassword: string, confirmPassword: string) => Promise<void>;
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
      console.error('Auth check error:', err);
      setUser(null);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize auth on mount only
  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      await fetchPlatformBranding();
      if (isMounted) {
        await checkAuthStatus();
      }
    };
    
    initialize();
    
    return () => {
      isMounted = false;
    };
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

  const changePassword = useCallback(async (newPassword: string, confirmPassword: string) => {
    try {
      setError(null);
      const result = await authApi.changePassword(newPassword, confirmPassword);
      if (result.user) {
        setUser(result.user);
      }
      if (result.token) {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password update failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setError(null);
      await authApi.logout();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    }
  }, []);

  const isAdmin = user?.role === 'admin' || Boolean(
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
  );

  const isSuperAdmin = user?.permissions?.is_super_admin ?? false;

  const value: AuthContextType = useMemo(
    () => ({
      user,
      platformBranding,
      loading,
      error,
      login,
      loginWithTelegram,
      changePassword,
      logout,
      refetch: checkAuthStatus,
      isAdmin,
      isSuperAdmin,
      permissions: user?.permissions ?? null,
      brand: {
        name: 'SwiftPay',
        logo: '/logo.svg',
        primaryColor: '#0B63FF',
      },
    }),
    [user, platformBranding, loading, error, login, loginWithTelegram, changePassword, logout, checkAuthStatus, isAdmin, isSuperAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
