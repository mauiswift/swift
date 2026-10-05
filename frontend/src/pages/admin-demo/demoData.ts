export interface DemoAccount {
  id: string;
  role: string;
  email: string;
  password: string;
  name: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { id: 'super-admin', role: 'Super Admin', email: 'a.reyes@swiftpay.ph', password: 'SwiftPay@2026!', name: 'Andres Reyes' },
  { id: 'sub-admin', role: 'Sub-Admin', email: 'm.concepcion@swiftpay.ph', password: 'SubAdmin@2026!', name: 'Maria Concepcion' },
  { id: 'merchant-admin', role: 'Merchant Admin', email: 'p.lim@lazada.com.ph', password: 'Merchant@2026!', name: 'Patrick Lim' },
  { id: 'agent', role: 'Agent', email: 'a.villanueva@swiftpay.ph', password: 'Agent@2026!', name: 'Ana Villanueva' },
];

export interface DemoOrder {
  id: string;
  merchant: string;
  customer: string;
  email: string;
  method: string;
  amount: number;
  currency: 'PHP';
  type: 'Payment' | 'Payment link' | 'OTC';
  status: 'Paid' | 'Pending' | 'Failed' | 'Expired';
  createdAt: string;
  updatedAt: string;
  risk: 'Low' | 'Review';
}

const merchants = ['Lazada PH', 'Northstar Retail', 'Mabuhay Travel', 'Harbor Eats', 'Cebu Pacific Store', 'Isla Essentials'];
const customers = [
  ['Sofia Santos', 'sofia.santos@gmail.com'],
  ['Miguel Garcia', 'miguel.garcia@gmail.com'],
  ['Isabella Cruz', 'isabella.cruz@gmail.com'],
  ['Gabriel Reyes', 'gabriel.reyes@gmail.com'],
  ['Camila Mendoza', 'camila.mendoza@gmail.com'],
  ['Rafael Flores', 'rafael.flores@gmail.com'],
  ['Amara Bautista', 'amara.bautista@gmail.com'],
  ['Luis Navarro', 'luis.navarro@gmail.com'],
];
const methods = ['GCash', 'Maya', 'QR Ph', 'Visa', 'BPI Online', '7-Eleven'];
const statuses: DemoOrder['status'][] = ['Paid', 'Paid', 'Paid', 'Pending', 'Paid', 'Failed', 'Expired'];
const types: DemoOrder['type'][] = ['Payment', 'Payment link', 'OTC'];

export const createDemoOrders = (): DemoOrder[] => Array.from({ length: 52 }, (_, index) => {
  const customer = customers[(index * 3 + 1) % customers.length];
  const day = (index % 7) + 1;
  const hour = 8 + ((index * 5) % 12);
  const minute = (index * 13) % 60;
  const date = new Date(2026, 9, 5 - (index % 7), hour, minute);
  const timestamp = date.toISOString();

  return {
    id: `SWP-${String(20261001 + index).slice(2)}`,
    merchant: merchants[(index * 5 + 2) % merchants.length],
    customer: customer[0],
    email: customer[1],
    method: methods[(index * 5 + 1) % methods.length],
    amount: 249 + ((index * 1739) % 48351),
    currency: 'PHP',
    type: types[index % types.length],
    status: statuses[(index * 3) % statuses.length],
    createdAt: timestamp,
    updatedAt: new Date(date.getTime() + (index % 9) * 60_000).toISOString(),
    risk: index % 13 === 0 ? 'Review' : 'Low',
  };
});

export const demoVolume = [
  { day: 'Mon', payments: 152_000, disbursements: 48_000 },
  { day: 'Tue', payments: 198_000, disbursements: 61_000 },
  { day: 'Wed', payments: 174_000, disbursements: 52_000 },
  { day: 'Thu', payments: 246_000, disbursements: 77_000 },
  { day: 'Fri', payments: 221_000, disbursements: 64_000 },
  { day: 'Sat', payments: 289_000, disbursements: 91_000 },
  { day: 'Sun', payments: 264_000, disbursements: 83_000 },
];

export const demoPaymentMethods = [
  { name: 'GCash', value: 38, color: '#30c78b' },
  { name: 'Maya', value: 24, color: '#8bd7b5' },
  { name: 'QR Ph', value: 18, color: '#6ba2f7' },
  { name: 'Cards', value: 12, color: '#a78bfa' },
  { name: 'Other', value: 8, color: '#52627a' },
];

export const formatPeso = (amount: number) => `₱${amount.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;

export const formatDemoDate = (value: string) => new Date(value).toLocaleString('en-PH', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
