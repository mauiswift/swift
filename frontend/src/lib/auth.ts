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

const base64UrlToBytes = (value: string) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
};

const bytesToBase64Url = (value: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(value)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const preparePublicKeyOptions = (options: Record<string, unknown>) => {
  const next = { ...options } as unknown as PublicKeyCredentialCreationOptions & PublicKeyCredentialRequestOptions;
  if (typeof next.challenge === 'string') next.challenge = base64UrlToBytes(next.challenge);
  if (typeof next.user?.id === 'string') next.user.id = base64UrlToBytes(next.user.id);
  if (Array.isArray(next.excludeCredentials)) {
    next.excludeCredentials = next.excludeCredentials.map((item) => ({
      ...item,
      id: typeof item.id === 'string' ? base64UrlToBytes(item.id) : item.id,
    }));
  }
  if (Array.isArray(next.allowCredentials)) {
    next.allowCredentials = next.allowCredentials.map((item) => ({
      ...item,
      id: typeof item.id === 'string' ? base64UrlToBytes(item.id) : item.id,
    }));
  }
  return next;
};

const serializeCredential = (credential: PublicKeyCredential) => {
  const response = credential.response;
  const serializedResponse: Record<string, string | null> = {
    clientDataJSON: bytesToBase64Url(response.clientDataJSON),
  };

  if (response instanceof AuthenticatorAttestationResponse) {
    serializedResponse.attestationObject = bytesToBase64Url(response.attestationObject);
  } else if (response instanceof AuthenticatorAssertionResponse) {
    serializedResponse.authenticatorData = bytesToBase64Url(response.authenticatorData);
    serializedResponse.signature = bytesToBase64Url(response.signature);
    serializedResponse.userHandle = response.userHandle
      ? bytesToBase64Url(response.userHandle)
      : null;
  } else {
    throw new Error('Unsupported passkey credential response.');
  }

  return {
    id: credential.id,
    rawId: bytesToBase64Url(credential.rawId),
    type: credential.type,
    response: serializedResponse,
  };
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
          must_change_password: Boolean(data.must_change_password ?? false),
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
    return data;
  },

  async changePassword(newPassword: string, confirmPassword: string) {
    const token = getStoredToken();
    if (!token) {
      throw new Error('You are not logged in.');
    }

    const response = await fetch('/api/v1/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.detail || 'Password update failed');
    }

    const data = await response.json();
    const nextToken = data?.access_token || data?.token || data?.data?.token || data?.data?.access_token;
    if (nextToken) {
      setStoredToken(nextToken);
    }
    return data;
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

  async loginWithGoogle(credential: string, cfTurnstileToken?: string | null) {
    const response = await fetch('/api/v1/auth/google-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential,
        ...(cfTurnstileToken ? { cf_turnstile_token: cfTurnstileToken } : {}),
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.detail || 'Google login failed');
    }

    const data = await response.json();
    const token = data?.token || data?.access_token || data?.data?.token || data?.data?.access_token;
    if (!token) throw new Error('Google login failed: missing token');
    setStoredToken(token);
  },

  async loginWithPasskey() {
    if (!window.PublicKeyCredential || !navigator.credentials) {
      throw new Error('Passkeys are not supported by this browser.');
    }
    const optionsResponse = await fetch('/api/v1/auth/passkey/authentication-options');
    if (!optionsResponse.ok) throw new Error('Passkey login is not available.');
    const options = await optionsResponse.json();
    const credential = await navigator.credentials.get({ publicKey: preparePublicKeyOptions(options) });
    if (!(credential instanceof PublicKeyCredential)) throw new Error('No passkey was selected.');
    const response = await fetch('/api/v1/auth/passkey/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: serializeCredential(credential) }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.detail || 'Passkey login failed');
    }
    const data = await response.json();
    setStoredToken(data.access_token || data.token);
  },

  async registerPasskey() {
    if (!window.PublicKeyCredential || !navigator.credentials) {
      throw new Error('Passkeys are not supported by this browser.');
    }
    const optionsResponse = await fetch('/api/v1/auth/passkey/registration-options', {
      headers: { Authorization: 'Bearer ' + (getStoredToken() || '') },
    });
    if (!optionsResponse.ok) throw new Error('Unable to start passkey registration.');
    const options = await optionsResponse.json();
    const credential = await navigator.credentials.create({ publicKey: preparePublicKeyOptions(options) });
    if (!(credential instanceof PublicKeyCredential)) throw new Error('No passkey was created.');
    const response = await fetch('/api/v1/auth/passkey/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (getStoredToken() || ''),
      },
      body: JSON.stringify({ credential: serializeCredential(credential) }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.detail || 'Passkey registration failed');
    }
  },

  async logout() {
    clearStoredToken();
  },
};
