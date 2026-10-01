import { client } from './api';

/**
 * Centralized API service for all admin dashboard operations
 * All endpoints follow the pattern: GET /api/v1/admin/{resource}
 */

export const adminApiService = {
  // ========== Dashboard ==========
  async getDashboard() {
    return client.get('/api/v1/admin/dashboard');
  },

  // ========== Merchants ==========
  async getMerchants(page = 1, limit = 20, search = '') {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    return client.get(`/api/v1/admin/merchants?${params}`);
  },

  async getMerchantDetails(merchantId: number) {
    return client.get(`/api/v1/admin/merchants/${merchantId}`);
  },

  async addMerchantTeamMember(merchantId: number, email: string, role: string) {
    return client.post(`/api/v1/admin/merchants/${merchantId}/team-members`, {
      email,
      role,
    });
  },

  // ========== Transactions ==========
  async getTransactions(page = 1, limit = 20, filters: any = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (filters.status) params.set('status', filters.status);
    if (filters.type) params.set('type', filters.type);
    if (filters.search) params.set('search', filters.search);
    return client.get(`/api/v1/admin/transactions?${params}`);
  },

  async getTransactionDetails(transactionId: string) {
    return client.get(`/api/v1/admin/transactions/${transactionId}`);
  },

  async retryTransaction(transactionId: string) {
    return client.post(`/api/v1/admin/transactions/${transactionId}/retry`);
  },

  async cancelTransaction(transactionId: string) {
    return client.post(`/api/v1/admin/transactions/${transactionId}/cancel`);
  },

  // ========== Settlements ==========
  async getSettlements(page = 1, limit = 20, filters: any = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    return client.get(`/api/v1/admin/settlements?${params}`);
  },

  async getSettlementDetails(batchId: string) {
    return client.get(`/api/v1/admin/settlements/${batchId}`);
  },

  async processSettlementBatch(batchId: string) {
    return client.post(`/api/v1/admin/settlements/${batchId}/process`);
  },

  async retrySettlementBatch(batchId: string) {
    return client.post(`/api/v1/admin/settlements/${batchId}/retry`);
  },

  async exportSettlement(batchId: string) {
    return client.get(`/api/v1/admin/settlements/${batchId}/export`);
  },

  // ========== Wallet Control ==========
  async getWallets(page = 1, limit = 20, filters: any = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (filters.currency) params.set('currency', filters.currency);
    if (filters.search) params.set('search', filters.search);
    return client.get(`/api/v1/admin/wallets?${params}`);
  },

  async getWalletDetails(walletId: number) {
    return client.get(`/api/v1/admin/wallets/${walletId}`);
  },

  async creditWallet(walletId: number, amount: number, reason: string) {
    return client.post(`/api/v1/admin/wallets/${walletId}/credit`, {
      amount,
      reason,
    });
  },

  async debitWallet(walletId: number, amount: number, reason: string) {
    return client.post(`/api/v1/admin/wallets/${walletId}/debit`, {
      amount,
      reason,
    });
  },

  async toggleWalletFreeze(walletId: number, freeze: boolean) {
    return client.post(`/api/v1/admin/wallets/${walletId}/toggle-freeze`, {
      freeze,
    });
  },

  // ========== Crypto Approvals ==========
  async getCryptoRequests(page = 1, limit = 20, filters: any = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    return client.get(`/api/v1/admin/crypto-requests?${params}`);
  },

  async getCryptoRequestDetails(requestId: number) {
    return client.get(`/api/v1/admin/crypto-requests/${requestId}`);
  },

  async approveCryptoRequest(requestId: number, notes?: string) {
    return client.post(`/api/v1/admin/crypto-requests/${requestId}/approve`, {
      notes,
    });
  },

  async rejectCryptoRequest(requestId: number, reason: string) {
    return client.post(`/api/v1/admin/crypto-requests/${requestId}/reject`, {
      reason,
    });
  },

  // ========== Payment Channels ==========
  async getPaymentChannels() {
    return client.get('/api/v1/admin/payment-channels');
  },

  async updatePaymentChannel(channelId: string, enabled: boolean, config?: any) {
    return client.patch(`/api/v1/admin/payment-channels/${channelId}`, {
      enabled,
      ...config,
    });
  },

  // ========== Wallet Settings ==========
  async getWalletSettings() {
    return client.get('/api/v1/admin/wallet-settings');
  },

  async updateWalletSettings(settings: any) {
    return client.patch('/api/v1/admin/wallet-settings', settings);
  },

  // ========== Users ==========
  async getPlatformUsers(page = 1, limit = 20, search = '') {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.set('search', search);
    return client.get(`/api/v1/admin/users?${params}`);
  },

  async getUserDetails(userId: string) {
    return client.get(`/api/v1/admin/users/${userId}`);
  },

  async updateUserRole(userId: string, role: string) {
    return client.patch(`/api/v1/admin/users/${userId}`, { role });
  },

  // ========== Platform Settings ==========
  async getPlatformSettings() {
    return client.get('/api/v1/admin/platform-settings');
  },

  async updatePlatformSettings(settings: any) {
    return client.patch('/api/v1/admin/platform-settings', settings);
  },

  // ========== Operations ==========
  async runSettlementBatch() {
    return client.post('/api/v1/admin/operations/run-settlement');
  },

  async reconcileBalances() {
    return client.post('/api/v1/admin/operations/reconcile-balances');
  },

  async runDatabaseCleanup() {
    return client.post('/api/v1/admin/operations/cleanup-database');
  },

  // ========== Audit Logs ==========
  async getAuditLogs(page = 1, limit = 20, filters: any = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (filters.user) params.set('user', filters.user);
    if (filters.action) params.set('action', filters.action);
    if (filters.search) params.set('search', filters.search);
    return client.get(`/api/v1/admin/audit-logs?${params}`);
  },

  async exportAuditLogs(filters?: any) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.set('start_date', filters.startDate);
    if (filters?.endDate) params.set('end_date', filters.endDate);
    return client.get(`/api/v1/admin/audit-logs/export?${params}`);
  },

  // ========== Team Invitations ==========
  async getTeamInvitations() {
    return client.get('/api/v1/admin/team-invitations');
  },

  async sendTeamInvitation(email: string, permissions: any) {
    return client.post('/api/v1/admin/team-invitations', {
      email,
      permissions,
    });
  },

  async cancelTeamInvitation(invitationId: string) {
    return client.post(`/api/v1/admin/team-invitations/${invitationId}/cancel`);
  },

  // ========== Team Members ==========
  async getTeamMembers() {
    return client.get('/api/v1/admin/team-members');
  },

  async updateTeamMemberPermissions(memberId: string, permissions: any) {
    return client.patch(`/api/v1/admin/team-members/${memberId}`, {
      permissions,
    });
  },

  async removeTeamMember(memberId: string) {
    return client.post(`/api/v1/admin/team-members/${memberId}/remove`);
  },
};
