import { CheckCircle2, Clock3, CreditCard, XCircle } from 'lucide-react';

export interface ApprovalPaymentStatusRecord {
  status: string;
  approval_status?: string | null;
  payment_received?: boolean;
}

interface PaymentStatusProps {
  payment: ApprovalPaymentStatusRecord;
  compact?: boolean;
}

function getPaymentState(payment: ApprovalPaymentStatusRecord) {
  if (payment.payment_received) {
    return {
      label: 'Payment received',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      Icon: CheckCircle2,
    };
  }

  const status = String(payment.status || '').trim().toLowerCase();
  if (['failed', 'cancelled', 'canceled', 'expired'].includes(status)) {
    return {
      label: status.charAt(0).toUpperCase() + status.slice(1),
      className: 'border-red-200 bg-red-50 text-red-700',
      Icon: XCircle,
    };
  }
  if (status === 'processing') {
    return {
      label: 'Processing',
      className: 'border-blue-200 bg-blue-50 text-blue-700',
      Icon: CreditCard,
    };
  }
  if (['pending', 'created', 'unpaid', 'awaiting_payment'].includes(status)) {
    return {
      label: 'Awaiting payment',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
      Icon: Clock3,
    };
  }
  return {
    label: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown',
    className: 'border-slate-200 bg-slate-50 text-slate-600',
    Icon: CreditCard,
  };
}

function getApprovalState(approvalStatus?: string | null) {
  const status = String(approvalStatus || 'pending').trim().toLowerCase();
  if (status === 'approved') {
    return {
      label: 'Approved',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      Icon: CheckCircle2,
    };
  }
  if (status === 'rejected') {
    return {
      label: 'Rejected',
      className: 'border-red-200 bg-red-50 text-red-700',
      Icon: XCircle,
    };
  }
  return {
    label: 'Awaiting approval',
    className: 'border-violet-200 bg-violet-50 text-violet-700',
    Icon: Clock3,
  };
}

export default function PaymentStatus({ payment, compact = false }: PaymentStatusProps) {
  const states = [
    { category: 'Payment', state: getPaymentState(payment) },
    { category: 'Review', state: getApprovalState(payment.approval_status) },
  ];

  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? 'items-center' : 'items-start'}`}>
      {states.map(({ category, state }) => (
        <span
          key={category}
          title={`${category}: ${state.label}`}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${state.className}`}
        >
          <state.Icon aria-hidden="true" className="h-3 w-3" />
          <span className={compact ? 'sr-only' : 'text-[9px] font-medium uppercase tracking-wide opacity-70'}>
            {category}
          </span>
          {state.label}
        </span>
      ))}
    </div>
  );
}
