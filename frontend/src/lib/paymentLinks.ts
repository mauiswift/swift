export type PaymentLink = {
  code: string;
  amount: number;
  title: string;
  status: 'Active' | 'Inactive';
  created: string;
  validUntil: string;
  description: string;
  orderNo: string;
  payor: string;
  paymentUrl?: string;
};

const STORAGE_KEY = 'swiftpay_payment_links';

const defaultLinks: PaymentLink[] = [
  {
    code: 'E3Z4',
    amount: 100.0,
    title: 'try',
    status: 'Active',
    created: 'Jul 19 2026, 2:49 pm',
    validUntil: 'Jul 21 2026, 11:59 pm',
    description: '-',
    orderNo: '-',
    payor: '-',
  },
  {
    code: 'E3H6',
    amount: 100.0,
    title: 'TEST',
    status: 'Inactive',
    created: 'Jul 16 2026, 10:30 pm',
    validUntil: 'Jul 21 2026, 11:59 pm',
    description: '-',
    orderNo: '-',
    payor: '-',
  },
];

function parseLinks(value: string | null): PaymentLink[] {
  if (!value) {
    return defaultLinks;
  }

  try {
    const parsed = JSON.parse(value) as PaymentLink[];
    if (!Array.isArray(parsed)) {
      return defaultLinks;
    }

    return parsed.map((link) => ({
      ...defaultLinks[0],
      ...link,
    }));
  } catch {
    return defaultLinks;
  }
}

export function getAllPaymentLinks(): PaymentLink[] {
  if (typeof window === 'undefined') {
    return defaultLinks;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  return parseLinks(stored);
}

export function getPaymentLink(code: string) {
  if (typeof window === 'undefined') {
    return defaultLinks.find((link) => link.code === code);
  }

  const links = getAllPaymentLinks();
  return links.find((link) => link.code === code) ?? null;
}

export function savePaymentLinks(links: PaymentLink[]) {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

export function updatePaymentLink(code: string, patch: Partial<PaymentLink>) {
  const links = getAllPaymentLinks();
  const updatedLinks = links.map((link) =>
    link.code === code ? { ...link, ...patch } : link
  );
  savePaymentLinks(updatedLinks);
  return updatedLinks.find((link) => link.code === code) ?? null;
}

export function togglePaymentLinkStatus(code: string) {
  const link = getPaymentLink(code);
  if (!link) {
    return null;
  }

  const updated = updatePaymentLink(code, {
    status: link.status === 'Active' ? 'Inactive' : 'Active',
  });
  return updated;
}

function generateUniqueCode(existingCodes: string[]) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  do {
    code = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  } while (existingCodes.includes(code));

  return code;
}

export function createPaymentLink(payload: {
  amount: number;
  title: string;
  validUntil: string;
  description?: string;
  orderNo?: string;
  payor?: string;
  paymentUrl?: string;
}) {
  const existingLinks = getAllPaymentLinks();
  const code = generateUniqueCode(existingLinks.map((link) => link.code));

  const now = new Date();
  const created = now.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const link: PaymentLink = {
    code,
    amount: payload.amount,
    title: payload.title,
    status: 'Active',
    created,
    validUntil: payload.validUntil,
    description: payload.description?.trim() || '-',
    orderNo: payload.orderNo?.trim() || '-',
    payor: payload.payor?.trim() || '-',
    paymentUrl: payload.paymentUrl,
  };

  savePaymentLinks([link, ...existingLinks]);
  return link;
}
