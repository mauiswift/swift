import { g as client } from "./index-CaW3oxHR.js";
async function handleApiCall(fn, operationName) {
  try {
    return await fn();
  } catch (error) {
    console.error(`Wallet API Error - ${operationName}:`, error);
    throw new Error(`Failed to ${operationName}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
function assertApiSuccess(response, operationName) {
  var _a, _b;
  if (!response.ok) {
    const detail = ((_a = response.data) == null ? void 0 : _a.detail) ?? ((_b = response.data) == null ? void 0 : _b.message) ?? "HTTP request failed";
    throw new Error(`Failed to ${operationName}: ${detail}`);
  }
}
const walletApi = {
  async getBalance(currency = "PHP") {
    return handleApiCall(async () => {
      const response = await client.apiCall.invoke({
        url: `/api/v1/wallet/balance?currency=${currency}`,
        method: "GET",
        data: {}
      });
      assertApiSuccess(response, "get wallet balance");
      return response.data;
    }, "get wallet balance");
  },
  async listAdminWallets() {
    return handleApiCall(async () => {
      const response = await client.apiCall.invoke({
        url: "/api/v1/wallet/admin/wallets",
        method: "GET",
        data: {}
      });
      assertApiSuccess(response, "list wallets");
      return response.data.items || [];
    }, "list wallets");
  },
  async adjustAdminWallet(request) {
    return handleApiCall(async () => {
      const response = await client.apiCall.invoke({
        url: "/api/v1/wallet/admin/wallets/adjust",
        method: "POST",
        data: request
      });
      assertApiSuccess(response, "adjust wallet");
      return response.data;
    }, "adjust wallet");
  },
  async freezeAdminWallet(request) {
    return handleApiCall(async () => {
      const response = await client.apiCall.invoke({
        url: "/api/v1/admin/wallets/freeze",
        method: "POST",
        data: request
      });
      assertApiSuccess(response, "freeze wallet");
    }, "freeze wallet");
  },
  async unfreezeAdminWallet(userId, currency) {
    return handleApiCall(async () => {
      const response = await client.apiCall.invoke({
        url: `/api/v1/admin/wallets/unfreeze?user_id=${encodeURIComponent(userId)}&currency=${encodeURIComponent(currency)}`,
        method: "POST",
        data: {}
      });
      assertApiSuccess(response, "unfreeze wallet");
    }, "unfreeze wallet");
  },
  async getReconciliationSummary() {
    return handleApiCall(async () => {
      const response = await client.apiCall.invoke({
        url: "/api/v1/admin/wallets/reconcile-summary",
        method: "GET",
        data: {}
      });
      assertApiSuccess(response, "get wallet reconciliation summary");
      return response.data;
    }, "get wallet reconciliation summary");
  },
  async transfer(recipient_user_id, amount, currency = "PHP", note, pin) {
    return handleApiCall(async () => {
      const response = await client.apiCall.invoke({
        url: "/api/v1/wallet/send-money",
        method: "POST",
        data: { recipient: recipient_user_id, amount, currency, note, pin }
      });
      assertApiSuccess(response, "transfer funds");
      return response.data;
    }, "transfer funds");
  }
};
export {
  walletApi as w
};
