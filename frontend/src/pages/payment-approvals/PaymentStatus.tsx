import { CheckCircle2, Clock3, CreditCard, XCircle } from 'lucide-react';
import { getApprovalPaymentStatus, type ApprovalPaymentStatusRecord } from '@/lib/paymentApprovalStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';

interface PaymentStatusProps {
  payment: ApprovalPaymentStatusRecord;
  compact?: boolean;
}

function getPaymentState(payment: ApprovalPaymentStatusRecord, translate: ReturnType<typeof useTranslation>) {
  const status = getApprovalPaymentStatus(payment);
  if (['failed', 'cancelled', 'canceled', 'expired', 'rejected'].includes(status)) {
    return {
      label: translate('approval_status_failed'),
      className: 'border-red-200 bg-red-50 text-red-700',
      Icon: XCircle,
    };
  }
  if (['paid', 'completed', 'complete', 'success', 'successful', 'succeeded', 'successfully_paid', 'executed', 'settled'].includes(status)) {
    return {
      label: translate('paid'),
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      Icon: CheckCircle2,
    };
  }
  if (status === 'processing') {
    return {
      label: translate('approval_status_processing'),
      className: 'border-blue-200 bg-blue-50 text-blue-700',
      Icon: CreditCard,
    };
  }
  if (['pending', 'created', 'unpaid', 'awaiting_payment'].includes(status)) {
    return {
      label: translate('pending'),
      className: 'border-amber-200 bg-amber-50 text-amber-700',
      Icon: Clock3,
    };
  }
  return {
    label: status.replace(/[_-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()),
    className: 'border-slate-200 bg-slate-50 text-slate-600',
    Icon: CreditCard,
  };
}

export default function PaymentStatus({ payment, compact = false }: PaymentStatusProps) {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const state = getPaymentState(payment, t);

  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? 'items-center' : 'items-start'}`}>
      <span
        title={`${t('approval_payment_status')}: ${state.label}`}
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${state.className}`}
      >
        <state.Icon aria-hidden="true" className="h-3 w-3" />
        <span className={compact ? 'sr-only' : 'text-[9px] font-medium uppercase tracking-wide opacity-70'}>
          {t('approval_payment_status')}
        </span>
        {state.label}
      </span>
    </div>
  );
}
