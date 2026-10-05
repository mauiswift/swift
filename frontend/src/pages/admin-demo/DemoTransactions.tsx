import { useMemo, useState, type FormEvent } from 'react';
import { Check, ChevronDown, Copy, FilePlus2, Search, ShieldCheck, X } from 'lucide-react';
import type { DemoOrder } from './demoData';
import { formatDemoDate, formatPeso } from './demoData';

const paymentMethods = ['GCash', 'Maya', 'QR Ph', 'Visa', 'BPI Online', '7-Eleven'];
type SortKey = keyof DemoOrder;

const columns: { key: SortKey; label: string }[] = [
  { key: 'id', label: 'Order ID' },
  { key: 'merchant', label: 'Merchant' },
  { key: 'customer', label: 'Customer' },
  { key: 'method', label: 'Payment method' },
  { key: 'amount', label: 'Amount' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created' },
  { key: 'updatedAt', label: 'Updated' },
  { key: 'risk', label: 'Risk' },
];

function StatusBadge({ status }: { status: DemoOrder['status'] }) {
  const style = status === 'Paid' ? 'bg-emerald-300/10 text-emerald-300' : status === 'Pending' ? 'bg-amber-300/10 text-amber-200' : 'bg-rose-300/10 text-rose-300';
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${style}`}>{status}</span>;
}

function CreateOrderModal({ onClose, onCreate }: { onClose: () => void; onCreate: (order: Omit<DemoOrder, 'id' | 'createdAt' | 'updatedAt'>) => void }) {
  const [customer, setCustomer] = useState('');
  const [email, setEmail] = useState('');
  const [merchant, setMerchant] = useState('Lazada PH');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(paymentMethods[0]);
  const [error, setError] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!customer.trim() || !email.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a customer, a valid email, and an amount greater than zero.');
      return;
    }
    onCreate({
      merchant,
      customer: customer.trim(),
      email: email.trim(),
      method,
      amount: parsedAmount,
      currency: 'PHP',
      type: 'Payment',
      status: 'Pending',
      risk: 'Low',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="create-demo-order-title" className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1b16] p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">New payment</p><h2 id="create-demo-order-title" className="mt-1 text-lg font-semibold text-white">Create order</h2><p className="mt-1 text-xs text-slate-400">Creates a local sample order only.</p></div>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X size={17} /></button>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block text-xs font-medium text-slate-300">Merchant
            <select value={merchant} onChange={(event) => setMerchant(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08120f] px-3 text-sm text-white outline-none focus:border-emerald-300/50">
              {['Lazada PH', 'Northstar Retail', 'Mabuhay Travel', 'Harbor Eats', 'Cebu Pacific Store', 'Isla Essentials'].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-300">Customer name
              <input value={customer} onChange={(event) => setCustomer(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08120f] px-3 text-sm text-white outline-none focus:border-emerald-300/50" placeholder="Juan dela Cruz" />
            </label>
            <label className="block text-xs font-medium text-slate-300">Customer email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08120f] px-3 text-sm text-white outline-none focus:border-emerald-300/50" placeholder="juan@example.ph" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-300">Amount (PHP)
              <input type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08120f] px-3 text-sm text-white outline-none focus:border-emerald-300/50" placeholder="1500.00" />
            </label>
            <label className="block text-xs font-medium text-slate-300">Payment method
              <select value={method} onChange={(event) => setMethod(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08120f] px-3 text-sm text-white outline-none focus:border-emerald-300/50">
                {paymentMethods.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>
          {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-white/[0.07] pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5">Cancel</button>
            <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-xs font-bold text-[#07120f] hover:bg-emerald-300"><FilePlus2 size={15} /> Create sample order</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function OrderDrawer({ order, onClose }: { order: DemoOrder; onClose: () => void }) {
  const [showSignature, setShowSignature] = useState(false);
  const [signatureCopyError, setSignatureCopyError] = useState('');
  const signature = `sha256=${Array.from({ length: 32 }, (_, index) => ((order.id.charCodeAt(index % order.id.length) * (index + 17)) % 16).toString(16)).join('')}`;
  const copySignature = () => {
    if (!navigator.clipboard) {
      setSignatureCopyError('Clipboard access is unavailable. Select and copy the signature value instead.');
      return;
    }
    void navigator.clipboard.writeText(signature).then(
      () => setSignatureCopyError(''),
      () => setSignatureCopyError('Clipboard access is unavailable. Select and copy the signature value instead.'),
    );
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/60" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside role="dialog" aria-modal="true" aria-labelledby="order-drawer-title" className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-white/10 bg-[#0b1712] shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/[0.07] p-5 sm:p-6">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Order detail · demo</p><h2 id="order-drawer-title" className="mt-1 font-mono text-lg font-semibold text-white">{order.id}</h2></div>
          <button type="button" aria-label="Close details" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X size={17} /></button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
          <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div><p className="text-xs text-slate-400">Order amount</p><p className="mt-1 text-2xl font-semibold text-white">{formatPeso(order.amount)}</p><p className="mt-1 text-xs text-slate-500">{order.currency} · {order.method}</p></div>
            <StatusBadge status={order.status} />
          </div>
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Order information</h3>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl border border-white/[0.06] p-4">
              {[['Merchant', order.merchant], ['Customer', order.customer], ['Email', order.email], ['Type', order.type], ['Created', formatDemoDate(order.createdAt)], ['Last updated', formatDemoDate(order.updatedAt)]].map(([label, value]) => <div key={label}><dt className="text-[10px] text-slate-500">{label}</dt><dd className="mt-1 break-words text-xs font-medium text-slate-200">{value}</dd></div>)}
            </dl>
          </section>
          <section>
            <div className="flex items-center justify-between gap-3">
              <div><h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">HMAC signature</h3><p className="mt-1 text-[10px] text-slate-500">Illustrative signature · not cryptographically verified</p></div>
              <ShieldCheck size={16} className="text-emerald-300" />
            </div>
            <div className="mt-3 rounded-xl border border-emerald-300/10 bg-emerald-300/[0.035] p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300"><Check size={13} /> Sample signature present</span>
                <button type="button" onClick={() => setShowSignature((visible) => !visible)} className="text-[10px] font-semibold text-slate-400 hover:text-white">{showSignature ? 'Hide value' : 'View value'}</button>
              </div>
              {showSignature && <div className="mt-3 flex gap-2 rounded-lg border border-white/[0.06] bg-[#07110d] p-2.5"><code className="min-w-0 flex-1 break-all text-[10px] leading-5 text-slate-300">{signature}</code><button type="button" onClick={copySignature} aria-label="Copy sample signature" className="h-fit rounded p-1 text-slate-500 hover:text-white"><Copy size={13} /></button></div>}
              {signatureCopyError && <p role="alert" className="mt-2 text-[10px] text-rose-300">{signatureCopyError}</p>}
            </div>
          </section>
          <section>
            <div className="flex items-center justify-between"><h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Webhook event log</h3><span className="rounded-full bg-white/[0.05] px-2 py-1 text-[9px] text-slate-500">Sample events</span></div>
            <ol className="mt-3 space-y-0 border-l border-white/10 pl-4">
              {[
                ['order.created', order.createdAt, 'Order registered in demo environment'],
                ...(order.status === 'Paid' ? [['payment.succeeded', order.updatedAt, 'Payment marked successful (sample)']] : [['payment.pending', order.updatedAt, `Payment status: ${order.status.toLowerCase()} (sample)`]]),
                ['webhook.delivered', order.updatedAt, 'Event delivery simulated'],
              ].map(([event, time, description]) => <li key={event} className="relative pb-4 last:pb-0"><span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[#0b1712] bg-emerald-300" /><p className="font-mono text-[10px] font-medium text-emerald-200">{event}</p><p className="mt-1 text-[10px] text-slate-400">{description}</p><p className="mt-1 text-[9px] text-slate-600">{formatDemoDate(time)}</p></li>)}
            </ol>
          </section>
        </div>
      </aside>
    </div>
  );
}

export default function DemoTransactions({
  orders,
  onCreateOrder,
}: {
  orders: DemoOrder[];
  onCreateOrder: (order: Omit<DemoOrder, 'id' | 'createdAt' | 'updatedAt'>) => void;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [methodFilter, setMethodFilter] = useState('All methods');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDescending, setSortDescending] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DemoOrder | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredOrders = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch = !needle || [order.id, order.merchant, order.customer, order.email, order.method].some((value) => value.toLowerCase().includes(needle));
      return matchesSearch && (statusFilter === 'All statuses' || order.status === statusFilter) && (methodFilter === 'All methods' || order.method === methodFilter);
    }).sort((first, second) => {
      const left = first[sortKey];
      const right = second[sortKey];
      const comparison = typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right));
      return sortDescending ? -comparison : comparison;
    });
  }, [orders, search, statusFilter, methodFilter, sortKey, sortDescending]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDescending((descending) => !descending);
    else { setSortKey(key); setSortDescending(false); }
  };

  const createOrder = (order: Omit<DemoOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    onCreateOrder(order);
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-[0.19em] text-emerald-300">Operations / Payments</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Transactions</h1><p className="mt-1 text-sm text-slate-400">Review and manage Philippine payment activity.</p></div>
        <button type="button" onClick={() => setShowCreateModal(true)} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-emerald-400 px-4 text-xs font-bold text-[#07120f] transition hover:bg-emerald-300 sm:self-auto"><FilePlus2 size={15} /> Create order</button>
      </header>

      <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1b16]">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, merchant, customer..." className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#08120f] pl-9 pr-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/40" />
          </label>
          <div className="flex gap-2">
            <label className="relative flex-1 lg:flex-none"><span className="sr-only">Filter status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 w-full appearance-none rounded-lg border border-white/[0.08] bg-[#08120f] px-3 pr-8 text-xs text-slate-300 outline-none lg:w-36"><option>All statuses</option>{['Paid', 'Pending', 'Failed', 'Expired'].map((status) => <option key={status}>{status}</option>)}</select><ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" /></label>
            <label className="relative flex-1 lg:flex-none"><span className="sr-only">Filter payment method</span><select value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)} className="h-10 w-full appearance-none rounded-lg border border-white/[0.08] bg-[#08120f] px-3 pr-8 text-xs text-slate-300 outline-none lg:w-40"><option>All methods</option>{paymentMethods.map((method) => <option key={method}>{method}</option>)}</select><ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" /></label>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-[10px] text-slate-500 sm:px-5">
          <span>Showing <strong className="font-semibold text-slate-300">{filteredOrders.length}</strong> of {orders.length} sample orders</span>
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Demo data</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1330px] text-left text-[11px]">
            <thead className="border-y border-white/[0.05] bg-white/[0.02] text-[9px] uppercase tracking-wider text-slate-500">
              <tr>{columns.map((column) => (
                <th key={column.key} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">
                  <button type="button" onClick={() => handleSort(column.key)} className="inline-flex items-center gap-1 hover:text-slate-200">{column.label}{sortKey === column.key && <span className="text-emerald-300">{sortDescending ? '↓' : '↑'}</span>}</button>
                </th>
              ))}</tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} onClick={() => setSelectedOrder(order)} className="cursor-pointer border-b border-white/[0.045] transition hover:bg-white/[0.025]">
                  <td className="whitespace-nowrap px-4 py-3.5 font-mono font-medium text-emerald-200">{order.id}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-300">{order.merchant}</td>
                  <td className="px-4 py-3.5"><span className="block whitespace-nowrap text-slate-300">{order.customer}</span><span className="mt-1 block whitespace-nowrap text-[9px] text-slate-600">{order.email}</span></td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-300">{order.method}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-medium text-white">{formatPeso(order.amount)}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-400">{order.type}</td>
                  <td className="whitespace-nowrap px-4 py-3.5"><StatusBadge status={order.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-400">{formatDemoDate(order.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-400">{formatDemoDate(order.updatedAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3.5"><span className={`rounded-full px-2 py-1 text-[9px] ${order.risk === 'Low' ? 'bg-emerald-300/10 text-emerald-300' : 'bg-amber-300/10 text-amber-200'}`}>{order.risk}</span></td>
                </tr>
              ))}
              {!filteredOrders.length && <tr><td colSpan={10} className="px-4 py-16 text-center text-sm text-slate-500">No sample orders match the selected filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-white/[0.05] px-4 py-3 text-[10px] text-slate-500">
          <span>Sample workspace · 52 initial orders</span><span>Sort any column · select an order for details</span>
        </div>
      </section>
      {selectedOrder && <OrderDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      {showCreateModal && <CreateOrderModal onClose={() => setShowCreateModal(false)} onCreate={createOrder} />}
    </div>
  );
}
