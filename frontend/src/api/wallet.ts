import { client } from '../lib/api';

export interface WalletBalance {
  wallet_id?: number;
  balance: number;
  available_balance: number;
  pending_balance: number;
  currency: string;
  is_frozen?: boolean;
  freeze_reason?: string | null;
}

export interface AdminWalletEntry {
  user_id: string;
  name?: string | null;
  telegram_username?: string;
  balance: number;
  wallet_id: number;
  is_frozen: boolean;
  freeze_reason?: string | null;
}

export interface ReconciliationMismatchItem {
  user_id: string;
  wallet_id: number;
  currency: string;
  recorded_balance: number;
  computed_balance: number;
  difference: number;
  is_frozen: boolean;
  freeze_reason?: string | null;
}

export interface ReconciliationSummary {
  total_wallets: number;
  wallets_with_mismatch: number;
  total_difference: number;
  average_difference: number;
  largest_difference: number;
  mismatches: ReconciliationMismatchItem[];
}

export interface WalletActionResponse {
  success: boolean;
  message: string;
  balance: number;
  transaction_id: number;
}

export interface AdminWalletAdjustRequest {
  amount: number;
  note?: string;
}

export interface WalletAdjustment {
  id: number;
  user_id: string;
  name?: string | null;
  telegram_username?: string | null;
  currency: string;
  amount: number;
  balance_after: number;
  note?: string | null;
  transaction_type: string;
  created_at?: string | null;
}

// Error handling wrapper for API calls
async function handleApiCall<T>(fn: () => Promise<T>, operationName: string): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`Wallet API Error - ${operationName}:`, error);
    throw new Error(`Failed to ${operationName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function assertApiSuccess(response: { ok: boolean; data?: any }, operationName: string) {
  if (!response.ok) {
    const detail = response.data?.detail || response.data?.message || `HTTP request failed`;
    throw new Error(`Failed to ${operationName}: ${detail}`);
  }
}

export const walletApi = {
  async getBalance(currency: string = 'PHP'): Promise<WalletBalance> {
    return handleApiCall(async () => {
      const response = await client.apiCall.invoke({
        url: `/api/v1/wallet/balance?currency=${currency}`,
        method: 'GET',
        data: {},
      });
      assertApiSuccess(response, 'get wallet balance');
      return response.data;
    }, 'get wallet balance');
  },

  // Admin endpoints for PHP wallets
  async listPhpWallets(): Promise<AdminWalletEntry[]> {
    return handleApiCall(async () => {
      const response = await client.apiCall.invoke({
        url: '/api/v1/wallet/admin/php-wallets',
        method: 'GET',
        data: {},
      });
      assertApiSuccess(response, 'list PHP wallets');
      return response.data.items || [];
    }, 'list PHP wallets');
  },

  async adjustPhpWallet(
    userId: string,
    amount: number,
    note?: string
  ): Promise<WalletActionResponse> {
    return handleApiCall(async () => {
      const response = await client.apiCall.invoke({
        url: `/api/v1/wallet/admin/php-wallets/${encodeURIComponent(userId)}/adjust`,
        method: 'POST',
        data: { amount, note },
      });
      assertApiSuccess(response, 'adjust PHP wallet');
      return response.data;
    }, 'adjust PHP wallet');
  },

    async listKrwWallets(): Promise<AdminWalletEntry[]> {
      return handleApiCall(async () => {
        const response = await client.apiCall.invoke({ url: '/api/v1/wallet/admin/krw-wallets', method: 'GET', data: {} });
        assertApiSuccess(response, 'list KRW wallets');
        return response.data.items || [];
      }, 'list KRW wallets');
    },

    async adjustKrwWallet(userId: string, amount: number, note?: string): Promise<WalletActionResponse> {
      return handleApiCall(async () => {
        const response = await client.apiCall.invoke({
          url: `/api/v1/wallet/admin/krw-wallets/${encodeURIComponent(userId)}/adjust`,
          method: 'POST',
          data: { amount, note           },

          async listCnyWallets(): Promise<AdminWalletEntry[]> {
            return handleApiCall(async () => {
              const response = await client.apiCall.invoke({ url: '/api/v1/wallet/admin/cny-wallets', method: 'GET', data: {} });
              assertApiSuccess(response, 'list CNY wallets');
              return response.data.items || [];
            }, 'list CNY wallets');
          },

          async adjustCnyWallet(userId: string, amount: number, note?: string): Promise<WalletActionResponse> {
            return handleApiCall(async () => {
              const response = await client.apiCall.invoke({
                url: `/api/v1/wallet/admin/cny-wallets/${encodeURIComponent(userId)}/adjust`,
                method: 'POST',
                data: { amount, note },
              });
              assertApiSuccess(response, 'adjust CNY wallet');
              return response.data;
            }, 'adjust CNY wallet');
          },

          async listUsdtWallets(): Promise<AdminWalletEntry[]> {
            return handleApiCall(async () => {
              const response = await client.apiCall.invoke({ url: '/api/v1/wallet/admin/usdt-wallets', method: 'GET', data: {} });
              assertApiSuccess(response, 'list USDT wallets');
              return response.data.items || [];
            }, 'list USDT wallets');
          },

          async adjustUsdtWallet(userId: string, amount: number, note?: string): Promise<WalletActionResponse> {
            return handleApiCall(async () => {
              const response = await client.apiCall.invoke({
                url: `/api/v1/wallet/admin/usdt-wallets/${encodeURIComponent(userId)}/adjust`,
                method: 'POST',
                data: { amount, note },
              });
              assertApiSuccess(response, 'adjust USDT wallet');
              return response.data;
            }, 'adjust USDT wallet');
          },

          async listAdjustments(currency?: string): Promise<WalletAdjustment[]> {
            return handleApiCall(async () => {
              const query = currency ? `?currency=${encodeURIComponent(currency)}` : '';
              const response = await client.apiCall.invoke({ url: `/api/v1/wallet/admin/adjustments${query}`, method: 'GET', data: {} });
              assertApiSuccess(response, 'list wallet adjustments');
              return response.data.items || [];
            }, 'list wallet adjustments');
          },

          async bulkAdjustWallets(userIds: string[], currency: string, amount: number, note?: string): Promise<{ success: boolean; count: number }> {
            return handleApiCall(async () => {
              const response = await client.apiCall.invoke({
                url: '/api/v1/wallet/admin/bulk-adjust',
                method: 'POST',
                data: { user_ids: userIds, currency, amount, note },
              });
              assertApiSuccess(response, 'bulk adjust wallets');
              return response.data;
            }, 'bulk adjust wallets');
          },

          getAdjustmentsExportUrl(currency?: string): string {
            const query = currency ? `?currency=${encodeURIComponent(currency)}` : '';
            return `/api/v1/wallet/admin/adjustments/export${query}`;
          },
        });
        assertApiSuccess(response, 'adjust KRW wallet');
        return response.data;
      }, 'adjust KRW wallet');
    },

  // Admin endpoints for USD wallets
  async listUsdWallets(): Promise<AdminWalletEntry[]> {
    return handleApiCall(async () => {
      const response = await client.apiCall.invoke({
        url: '/api/v1/wallet/admin/usd-wallets',
        method: 'GET',
        data: {},
      });
      assertApiSuccess(response, 'list USD wallets');
      return response.data.items || [];
    }, 'list USD wallets');
  },

  async getReconciliationSummary(): Promise<ReconciliationSummary> {
    return handleApiCall(async () => {
      const response = await client.apiCall.invoke({
        url: '/api/v1/admin/wallets/reconcile-summary',
        method: 'GET',
        data: {},
      });
      assertApiSuccess(response, 'get wallet reconciliation summary');
      return response.data;
    }, 'get wallet reconciliation summary');
  },

  async adjustUsdWallet(
    userId: string,
    amount: number,
    note?: string
  ): Promise<WalletActionResponse> {
    return handleApiCall(async () => {
      const response = await client.apiCall.invoke({
        url: `/api/v1/wallet/admin/usd-wallets/${encodeURIComponent(userId)}/adjust`,
        method: 'POST',
        data: { amount, note },
      });
      assertApiSuccess(response, 'adjust USD wallet');
      return response.data;
    }, 'adjust USD wallet');
  },

  async transfer(
    recipient_user_id: string,
    amount: number,
    currency: string = 'PHP',
    note?: string,
    pin?: string,
  ): Promise<WalletActionResponse> {
    return handleApiCall(async () => {
      const response = await client.apiCall.invoke({
        url: '/api/v1/wallet/send-money',
        method: 'POST',
        data: { recipient: recipient_user_id, amount, currency, note, pin },
      });
      assertApiSuccess(response, 'transfer funds');
      return response.data;
    }, 'transfer funds');
  },
};
