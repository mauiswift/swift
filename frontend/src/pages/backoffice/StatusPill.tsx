import type { TransactionStatus } from '@/lib/transactions';

const styles: Record<TransactionStatus, string> = {
  paid: 'bg-emerald-400/10 text-emerald-300 ring-emerald-300/25',
  pending: 'bg-amber-400/10 text-amber-300 ring-amber-300/25',
  processing: 'bg-sky-400/10 text-sky-300 ring-sky-300/25',
  failed: 'bg-rose-400/10 text-rose-300 ring-rose-300/25',
  rejected: 'bg-rose-400/10 text-rose-300 ring-rose-300/25',
  expired: 'bg-slate-400/10 text-slate-300 ring-slate-300/20',
  cancelled: 'bg-slate-400/10 text-slate-300 ring-slate-300/20',
  inactive: 'bg-slate-400/10 text-slate-400 ring-slate-300/20',
};

export function StatusPill({ status, label }: { status: TransactionStatus; label: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${styles[status]}`}>
      {label}
    </span>
  );
}
