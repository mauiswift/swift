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
  telegram_username?: string;
  currency: string;
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
  user_id: string;
  currency: string;
  amount: number;
  note: string;
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

function assertApiSuccess(
  response: { ok: boolean; data?: { detail?: unknown; message?: unknown } | null },
  operationName: string,
) {
  if (!response.ok) {
    const detail = response.data?.detail ?? response.data?.message ?? 'HTTP request failed';
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

  async listAdminWallets(): Promise<AdminWalletEntry[]> {
    return handleApiCall(async () => {
      const response = await client.apiCall.invoke({
        url: '/api/v1/wallet/admin/wallets',
        method: 'GET',
        data: {},
      });
      assertApiSuccess(response, 'list wallets');
      return response.data.items || [];
    }, 'list wallets');
  },

  async adjustAdminWallet(request: AdminWalletAdjustRequest): Promise<WalletActionResponse> {
    return handleApiCall(async () => {
      const response = await client.apiCall.invoke({
        url: '/api/v1/wallet/admin/wallets/adjust',
        method: 'POST',
        data: request,
      });
      assertApiSuccess(response, 'adjust wallet');
      return response.data;
    }, 'adjust wallet');
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
