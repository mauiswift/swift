import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Copy, ExternalLink, Plus, RefreshCw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import { usePaymentEvents } from '@/hooks/usePaymentEvents';
import { client } from '@/lib/api';
import { fmtCurrency } from '@/lib/format';
import {
  formatTransactionDate,
  getTransactionStatus,
  getTransactionStatusLabel,
  getTransactionTypeLabel,
  type TransactionRecord,
} from '@/lib/transactions';
import { StatusPill } from './StatusPill';

type SortKey = 'external_id' | 'customer' | 'type' | 'method' | 'amount' | 'currency' | 'status' | 'created_at' | 'paid_at' | 'approval';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = ['paid', 'pending', 'processing', 'failed', 'rejected', 'expired', 'cancelled'];
const TYPE_OPTIONS = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'qr_code', label: 'QR payment' },
  { value: 'payment_link', label: 'Payment link' },
];

const COLUMNS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'external_id', label: 'Order ID' },
  { key: 'customer', label: 'Customer' },
  { key: 'type', label: 'Type' },
  { key: 'method', label: 'Method' },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'currency', label: 'Currency' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created' },
  { key: 'paid_at', label: 'Paid' },
  { key: 'approval', label: 'Approval' },
];

function sortValue(tx: TransactionRecord, key: SortKey): string | number {
  switch (key) {
    case 'external_id': return (tx.external_id || '').toLowerCase();
    case 'customer': return (tx.customer_name || tx.customer_email || '').toLowerCase();
    case 'type': return (tx.transaction_type || '').toLowerCase();
    case 'method': return (tx.payment_method || '').toLowerCase();
    case 'amount': return Number(tx.amount) || 0;
    case 'currency': return (tx.currency || '').toLowerCase();
    case 'status': return getTransactionStatus(tx);
    case 'created_at': return tx.created_at ? Date.parse(tx.created_at) || 0 : 0;
    case 'paid_at': return tx.paid_at ? Date.parse(tx.paid_at) || 0 : 0;
    case 'approval': return (tx.approval_status || '').toLowerCase();
  }
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/[0.05] py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-all text-right text-slate-200">{value || '—'}</dd>
    </div>
  );
}

export default function LiveTransactions() {
  const { user, loading: authLoading } = useAuth();
  const { collectionCurrency } = useCollectionCurrency();
  const [items, setItems] = useState<TransactionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'created_at', dir: 'desc' });
  const [selected, setSelected] = useState<TransactionRecord | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setError('');
    try {
      const query: Record<string, string> = { currency: collectionCurrency.toUpperCase() };
      if (statusFilter !== 'all') query.status = statusFilter;
      if (typeFilter !== 'all') query.transaction_type = typeFilter;
      const res = await client.entities.transactions.query({
        query,
        sort: '-created_at',
        limit: PAGE_SIZE,
        skip: page * PAGE_SIZE,
      });
      if (!res.ok) throw new Error(res.data?.detail || 'Unable to load transactions');
      if (!Array.isArray(res.data?.items)) throw new Error('The transactions response is invalid');
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
      setTotal(Number(res.data?.total) || 0);
    } catch (err) {
      setItems([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : 'Unable to load transactions');
    } finally {
      setLoading(false);
    }
  }, [user, page, statusFilter, typeFilter, collectionCurrency]);

  const { connected } = usePaymentEvents({ enabled: !!user, onStatusChange: load, pollInterval: 10000 });

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [collectionCurrency, statusFilter, typeFilter]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? items.filter((tx) => [tx.external_id, tx.description, tx.customer_name, tx.customer_email, tx.xendit_id]
          .some((value) => value?.toLowerCase().includes(term)))
      : items;
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const left = sortValue(a, sort.key);
      const right = sortValue(b, sort.key);
      return (left < right ? -1 : left > right ? 1 : 0) * factor;
    });
  }, [items, search, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((current) => (current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  const copy = async (value?: string | null) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied');
    } catch {
      toast.error('Unable to copy');
    }
  };

  if (authLoading) return <AppLoadingScreen />;
  if (!user) return <Navigate to="/home" replace />;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const fieldClass = 'rounded-lg border border-white/[0.08] bg-[#0d1b16] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-300/40';

  return (
    <Layout connected={connected}>
      <div className="space-y-5 rounded-3xl bg-[#08120e] p-4 text-slate-100 sm:p-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.19em] text-emerald-300">Transactions / {collectionCurrency}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Transaction management</h1>
            <p className="mt-1 text-sm text-slate-400">{total} orders · live from your account</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/transactions/classic" className="text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline">Classic view</Link>
            <button type="button" onClick={() => void load()} aria-label="Refresh" className="rounded-lg border border-white/[0.08] p-2 text-slate-300 hover:text-white">
              <RefreshCw size={14} />
            </button>
            <Link to="/pay-by-link/new" className="flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-[#06140e] hover:bg-emerald-300">
              <Plus size={15} /> Create order
            </Link>
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search this page by order, customer, description…"
              aria-label="Search transactions"
              className={`${fieldClass} w-full pl-9`}
            />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status" className={fieldClass}>
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
          </select>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filter by type" className={fieldClass}>
            <option value="all">All types</option>
            {TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>

        {error && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            <span>{error}</span>
            <button type="button" onClick={() => void load()} className="font-semibold underline">Retry</button>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#0d1b16]">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-white/[0.07] text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                {COLUMNS.map((column) => (
                  <th key={column.key} className={`px-3 py-3 font-medium ${column.align === 'right' ? 'text-right' : ''}`} aria-sort={sort.key === column.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button type="button" onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-slate-200">
                      {column.label}
                      {sort.key === column.key && (sort.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {loading && <tr><td colSpan={COLUMNS.length} className="py-12 text-center text-slate-500">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={COLUMNS.length} className="py-12 text-center text-slate-500">No transactions match your filters.</td></tr>}
              {!loading && rows.map((tx) => {
                const status = getTransactionStatus(tx);
                return (
                  <tr
                    key={tx.id}
                    tabIndex={0}
                    onClick={() => setSelected(tx)}
                    onKeyDown={(event) => { if (event.key === 'Enter') setSelected(tx); }}
                    className="cursor-pointer text-slate-300 hover:bg-white/[0.03] focus:bg-white/[0.04] focus:outline-none"
                  >
                    <td className="px-3 py-3 font-mono text-xs">{tx.external_id || `#${tx.id}`}</td>
                    <td className="px-3 py-3">{tx.customer_name || tx.customer_email || '—'}</td>
                    <td className="px-3 py-3">{getTransactionTypeLabel(tx.transaction_type)}</td>
                    <td className="px-3 py-3">{tx.payment_method || '—'}</td>
                    <td className="px-3 py-3 text-right font-medium text-white">{fmtCurrency(Number(tx.amount) || 0, tx.currency || collectionCurrency)}</td>
                    <td className="px-3 py-3">{(tx.currency || collectionCurrency).toUpperCase()}</td>
                    <td className="px-3 py-3"><StatusPill status={status} label={getTransactionStatusLabel(status)} /></td>
                    <td className="px-3 py-3 text-xs text-slate-500">{formatTransactionDate(tx.created_at)}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">{formatTransactionDate(tx.paid_at)}</td>
                    <td className="px-3 py-3 text-xs capitalize">{tx.approval_status || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)} aria-label="Previous page" className="rounded-lg border border-white/[0.08] p-2 disabled:opacity-40"><ChevronLeft size={14} /></button>
            <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)} aria-label="Next page" className="rounded-lg border border-white/[0.08] p-2 disabled:opacity-40"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={() => setSelected(null)}>
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Order details"
            onClick={(event) => event.stopPropagation()}
            className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0a1611] p-6 text-slate-100"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Order</p>
                <h2 className="mt-1 break-all font-mono text-sm text-white">{selected.external_id || `#${selected.id}`}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close" className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">{fmtCurrency(Number(selected.amount) || 0, selected.currency || collectionCurrency)}</p>
            <div className="mt-2"><StatusPill status={getTransactionStatus(selected)} label={getTransactionStatusLabel(getTransactionStatus(selected))} /></div>
            <dl className="mt-6">
              <DetailRow label="Type" value={getTransactionTypeLabel(selected.transaction_type)} />
              <DetailRow label="Method" value={selected.payment_method} />
              <DetailRow label="Customer" value={selected.customer_name} />
              <DetailRow label="Email" value={selected.customer_email} />
              <DetailRow label="Description" value={selected.description} />
              <DetailRow label="Gateway reference" value={selected.xendit_id} />
              <DetailRow label="Sender" value={[selected.sender_name, selected.sender_bank].filter(Boolean).join(' · ')} />
              <DetailRow label="Created" value={formatTransactionDate(selected.created_at)} />
              <DetailRow label="Paid" value={formatTransactionDate(selected.paid_at)} />
              <DetailRow label="Approval" value={selected.approval_status} />
              <DetailRow label="Approved by" value={selected.approved_by} />
              <DetailRow label="Rejection reason" value={selected.rejection_reason} />
            </dl>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" onClick={() => void copy(selected.external_id)} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/5">
                <Copy size={13} /> Copy order ID
              </button>
              {selected.payment_url && (
                <a href={selected.payment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/5">
                  <ExternalLink size={13} /> Open payment page
                </a>
              )}
            </div>
          </aside>
        </div>
      )}
    </Layout>
  );
}
