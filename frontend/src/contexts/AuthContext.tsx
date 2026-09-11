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
import { hasDashboardAccess, UserPermissions } from '@/lib/permissions';

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
  loginWithGoogle: (credential: string, cfTurnstileToken?: string | null) => Promise<void>;
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
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch('/api/v1/public/merchant/platform/branding', {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setPlatformBranding({ name: data.store_name, logoUrl: data.store_logo_url });
      }
    } catch (err) {
      console.error('Failed to fetch platform branding:', err);
    } finally {
      window.clearTimeout(timeoutId);
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

  const refetchBrandingAndAuth = useCallback(async () => {
    await Promise.all([fetchPlatformBranding(), checkAuthStatus()]);
  }, [fetchPlatformBranding, checkAuthStatus]);

  // Initialize auth on mount only
  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      await Promise.allSettled([fetchPlatformBranding(), checkAuthStatus()]);
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

  const loginWithGoogle = useCallback(
    async (credential: string, cfTurnstileToken?: string | null) => {
      try {
        setError(null);
        await authApi.loginWithGoogle(credential, cfTurnstileToken);
        await checkAuthStatus();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Google login failed');
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

  const isAdmin = hasDashboardAccess(user?.permissions);

  const isSuperAdmin = user?.permissions?.is_super_admin ?? false;

  const value: AuthContextType = useMemo(
    () => ({
      user,
      platformBranding,
      loading,
      error,
      login,
      loginWithTelegram,
      loginWithGoogle,
      changePassword,
      logout,
      refetch: refetchBrandingAndAuth,
      isAdmin,
      isSuperAdmin,
      permissions: user?.permissions ?? null,
      brand: {
        name: 'SwiftPay',
        logo: '/logo.svg',
        primaryColor: '#0B63FF',
      },
    }),
    [user, platformBranding, loading, error, login, loginWithTelegram, loginWithGoogle, changePassword, logout, refetchBrandingAndAuth, isAdmin, isSuperAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
