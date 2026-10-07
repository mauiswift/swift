import { client } from '@/lib/api';

export async function openReceiptFile(fileId: string): Promise<void> {
  const receiptWindow = window.open('', '_blank');
  if (!receiptWindow) {
    throw new Error('Popup blocked. Please allow popups and try again.');
  }

  receiptWindow.document.write('<p style="font-family: sans-serif; padding: 1rem;">Loading receipt...</p>');
  try {
    const endpoint = fileId.startsWith('private-receipt:') || fileId.startsWith('/uploads/')
      ? `/api/v1/receipts/${encodeURIComponent(fileId)}`
      : `/api/v1/telegram/file/${encodeURIComponent(fileId)}`;
    const response = await client.fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Failed to load receipt (${response.status})`);
    }

    const receiptUrl = URL.createObjectURL(await response.blob());
    receiptWindow.location.href = receiptUrl;
    setTimeout(() => URL.revokeObjectURL(receiptUrl), 60000);
  } catch (error) {
    receiptWindow.close();
    throw error;
  }
}