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

// Simple client object for API calls
export const client = {
	fetch: (url: string, options?: RequestInit) => fetch(url, options),
};
