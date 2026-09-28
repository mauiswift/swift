import { StatusBadge } from '@/components/StatusBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getTransactionStatus,
  getTransactionStatusLabel,
  isAwaitingApproval,
  type TransactionRecord,
} from '@/lib/transactions';

interface PaymentStatusBadgeProps {
  transaction: Pick<TransactionRecord, 'status' | 'approval_status' | 'paid_at' | 'payment_status'>;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export function PaymentStatusBadge({
  transaction,
  size = 'sm',
  showDot = false,
  className,
}: PaymentStatusBadgeProps) {
  const { language } = useLanguage();
  const localizedLanguage = language === 'zh' ? 'zh' : language === 'en' ? 'en' : 'ko';
  const status = getTransactionStatus(transaction);
  const awaitingApproval = isAwaitingApproval(transaction);
  const approvalRejected = transaction.approval_status?.trim().toLowerCase() === 'rejected';

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className || ''}`}>
      <StatusBadge
        status={status}
        label={getTransactionStatusLabel(status, localizedLanguage)}
        size={size}
        showDot={showDot}
      />
      {awaitingApproval && (
        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
          {localizedLanguage === 'ko' ? '승인 대기' : 'Awaiting approval'}
        </span>
      )}
      {approvalRejected && (
        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-800">
          {localizedLanguage === 'ko' ? '검토 거부됨' : 'Review rejected'}
        </span>
      )}
    </span>
  );
}
