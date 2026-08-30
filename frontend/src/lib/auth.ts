const TOKEN_KEYS = ['auth_token', 'token'] as const;

export interface TelegramWidgetUser {
  id: number;
  auth_date: number;
  hash: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export const getStoredToken = () => {
  for (const key of TOKEN_KEYS) {
    const value = localStorage.getItem(key);
    if (value) {
      if (key !== 'auth_token') {
        localStorage.setItem('auth_token', value);
      }
      return value;
    }
  }
  return null;
};

export const setStoredToken = (token: string) => {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('token', token);
};

export const clearStoredToken = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('token');
};

export const authApi = {
  async getCurrentUser() {
    try {
      const token = getStoredToken();
      if (!token) return null;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/v1/auth/me', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + token,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data) {
        return {
          id: data.id || '',
          email: data.email || '',
          name: data.name || data.email || '',
          role: data.role || 'user',
          organization_id: data.organization_id ?? undefined,
          organization_name: data.organization_name ?? undefined,
          permissions: data.permissions ?? undefined,
          bank_name: data.bank_name ?? undefined,
          bank_account_number: data.bank_account_number ?? undefined,
          bank_account_name: data.bank_account_name ?? undefined,
          bank_address: data.bank_address ?? undefined,
          usdt_wallet_address: data.usdt_wallet_address ?? undefined,
          settlement_type: data.settlement_type ?? undefined,
          settlement_currency: data.settlement_currency ?? undefined,
          store_name: data.store_name ?? undefined,
          store_logo_url: data.store_logo_url ?? undefined,
          permanent_link_slug: data.permanent_link_slug ?? undefined,
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  async login(email: string, password: string, cfTurnstileToken?: string) {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        ...(cfTurnstileToken ? { cf_turnstile_token: cfTurnstileToken } : {}),
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.detail || 'Email login failed');
    }

    const data = await response.json();
    const token = data?.access_token || data?.token || data?.data?.token || data?.data?.access_token;
    if (!token) {
      throw new Error('Email login failed: missing token');
    }

    setStoredToken(token);
  },

  async loginWithTelegram(user: TelegramWidgetUser, cfTurnstileToken?: string | null) {
    const response = await fetch('/api/v1/auth/telegram-login-widget', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...user,
        ...(cfTurnstileToken ? { cf_turnstile_token: cfTurnstileToken } : {}),
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.detail || 'Telegram login failed');
    }

    const data = await response.json();
    const token = data?.token || data?.access_token || data?.data?.token || data?.data?.access_token;
    if (!token) {
      throw new Error('Telegram login failed: missing token');
    }

    setStoredToken(token);
  },

  async logout() {
    clearStoredToken();
  },
};
