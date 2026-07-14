import { getStoredToken, clearStoredToken } from './auth';

const originalFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
	const token = getStoredToken();

	const headers = new Headers(init?.headers || {});
	if (token && !headers.has('Authorization')) {
		headers.set('Authorization', `Bearer ${token}`);
	}

	const response = await originalFetch(input, {
		...init,
		headers,
	});

	// If we get a 401 Unauthorized and we had a token, it likely expired.
	// Clear it and redirect to login to prevent infinite error loops.
	if (response.status === 401 && token) {
		console.warn('Token expired or invalid, clearing session');
		clearStoredToken();

		// Only redirect if we are not already on the login page
		const path = window.location.pathname;
		if (path !== '/login' && path !== '/register') {
			window.location.href = '/login?expired=1';
		}
	}

	return response;
};

// Helper to parse response body safely (JSON if possible)
async function parseResponseBody(res: Response) {
	const text = await res.text();
	if (!text) return null;
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

// Simple client object for API calls (adds get/post helpers)
export const client = {
	fetch: (url: string, options?: RequestInit) => fetch(url, options),

	async get(url: string, options?: RequestInit) {
		const res = await fetch(url, { method: 'GET', ...options });
		const data = await parseResponseBody(res);
		return { data, status: res.status, ok: res.ok, headers: res.headers };
	},

	async post(url: string, body?: any, options?: RequestInit) {
		const headers = new Headers(options?.headers || {});
		if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
		const res = await fetch(url, {
			method: 'POST',
			body: body != null ? JSON.stringify(body) : undefined,
			...options,
			headers,
		});
		const data = await parseResponseBody(res);
		return { data, status: res.status, ok: res.ok, headers: res.headers };
	},

	// convenience wrapper if you prefer to call invoke-like (optional)
	async invoke(url: string, options?: RequestInit) {
		const method = (options?.method || 'GET').toUpperCase();
		if (method === 'GET') return this.get(url, options);
		return this.post(url, (options as any)?.body || undefined, options);
	},
};
