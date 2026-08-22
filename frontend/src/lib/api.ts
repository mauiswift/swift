import { getStoredToken, clearStoredToken } from './auth';

export function buildAuthHeaders(headers?: HeadersInit): Headers {
  const nextHeaders = new Headers(headers || {});
  const token = getStoredToken();
  if (token && !nextHeaders.has('Authorization')) {
    nextHeaders.set('Authorization', 'Bearer ' + token);
  }
  return nextHeaders;
}

export async function parseApiResponse(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const originalFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const headers = buildAuthHeaders(init?.headers);
  const response = await originalFetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401 && getStoredToken()) {
    clearStoredToken();
    const path = window.location.pathname;
    if (path !== '/login' && path !== '/register') {
      window.location.href = '/login?expired=1';
    }
  }

  return response;
};

export const client = {
  fetch: (url: string, options?: RequestInit) => fetch(url, { ...options, headers: buildAuthHeaders(options?.headers) }),

  async get(url: string, options?: RequestInit) {
    const res = await fetch(url, { method: 'GET', ...options, headers: buildAuthHeaders(options?.headers) });
    const data = await parseApiResponse(res);
    return { data, status: res.status, ok: res.ok, headers: res.headers };
  },

  async post(url: string, body?: any, options?: RequestInit) {
    const headers = buildAuthHeaders(options?.headers);
    if (!headers.has('Content-Type') && !(body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    const res = await fetch(url, {
      method: 'POST',
      body: body instanceof FormData ? body : body != null ? JSON.stringify(body) : undefined,
      ...options,
      headers,
    });
    const data = await parseApiResponse(res);
    return { data, status: res.status, ok: res.ok, headers: res.headers };
  },

  async request(url: string, method: string, body?: any, options?: RequestInit) {
    const headers = buildAuthHeaders(options?.headers);
    if (!headers.has('Content-Type') && body !== undefined && !(body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    const res = await fetch(url, {
      ...options,
      method,
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    });
    const data = await parseApiResponse(res);
    return { data, status: res.status, ok: res.ok, headers: res.headers };
  },

  async patch(url: string, body?: any, options?: RequestInit) {
    const headers = buildAuthHeaders(options?.headers);
    if (!headers.has('Content-Type') && !(body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    const res = await fetch(url, {
      method: 'PATCH',
      body: body instanceof FormData ? body : body != null ? JSON.stringify(body) : undefined,
      ...options,
      headers,
    });
    const data = await parseApiResponse(res);
    return { data, status: res.status, ok: res.ok, headers: res.headers };
  },

  async invoke(url: string, options?: RequestInit) {
    const method = (options?.method || 'GET').toUpperCase();
    if (method === 'GET') return this.get(url, options);
    return this.request(url, method, (options as any)?.body, options);
  },

  apiCall: {
    async invoke({ url, method, data }: { url: string; method: string; data?: any }) {
      const headers = buildAuthHeaders();
      if (method.toUpperCase() === 'GET') {
        return client.get(url, { headers });
      }
      return client.request(url, method.toUpperCase(), data, { headers });
    },
  },

  entities: {
    transactions: {
      async query({ query, sort, limit, skip }: { query?: any; sort?: string; limit?: number; skip?: number }) {
        const params = new URLSearchParams();
        if (query) params.set('query', JSON.stringify(query));
        if (sort) params.set('sort', sort);
        if (limit !== undefined) params.set('limit', String(limit));
        if (skip !== undefined) params.set('skip', String(skip));
        return client.get(`/api/v1/entities/transactions?${params.toString()}`);
      },
    },
  },
};
