import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { client } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation, type TranslationKey } from '@/lib/i18n';

interface TransferDetails {
  sender_name?: string | null;
  sender_bank?: string | null;
  sender_account_number?: string | null;
  receiver_bank?: string | null;
  receiver_account_name?: string | null;
  receiver_account_number?: string | null;
  institution_reference_no?: string | null;
  channel_reference_no?: string | null;
  provider_status?: string | null;
}

interface PaymentTransferDetailsProps {
  paymentId: string;
  hasSwiftpayDetails?: boolean;
  storedDetails?: TransferDetails;
}

const detailRows: Array<[keyof TransferDetails, TranslationKey]> = [
  ['sender_name', 'approval_sender'],
  ['sender_bank', 'approval_sender_bank'],
  ['sender_account_number', 'approval_account_used'],
  ['receiver_bank', 'approval_receiving_bank'],
  ['receiver_account_name', 'approval_receiving_name'],
  ['receiver_account_number', 'approval_account_received'],
  ['institution_reference_no', 'approval_institution_reference'],
  ['channel_reference_no', 'approval_channel_reference'],
  ['provider_status', 'approval_provider_status'],
];

export default function PaymentTransferDetails({
  paymentId,
  hasSwiftpayDetails = false,
  storedDetails,
}: PaymentTransferDetailsProps) {
  const { language } = useLanguage();
  const [details, setDetails] = useState<TransferDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(true);

  const fetchDetails = useCallback(async () => {
    setExpanded(true);
    setLoading(true);
    setError('');
    try {
      const response = await client.get(`/api/v1/admin/payment-approvals/${paymentId}/details`);
      if (!response.ok || !response.data?.success) {
        throw new Error(response.data?.detail || getTranslation(language, 'approval_error_transfer_details'));
      }
      setDetails(response.data.data || {});
      setError(response.data.provider_lookup_error || '');
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : getTranslation(language, 'approval_error_transfer_details'));
    } finally {
      setLoading(false);
    }
  }, [paymentId, language]);

  useEffect(() => {
    void fetchDetails();
  }, [fetchDetails]);

  const visibleDetails = details || storedDetails;
  const rows = detailRows.filter(([key]) => visibleDetails?.[key]);

  if (!hasSwiftpayDetails && rows.length === 0) return null;

  return (
    <div className="border-t border-slate-100 pt-3">
      <button
        type="button"
        onClick={() => (expanded ? setExpanded(false) : void fetchDetails())}
        className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-900"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={13} />}
        {expanded
          ? getTranslation(language, 'approval_hide_transfer_details')
          : hasSwiftpayDetails
          ? getTranslation(language, 'approval_fetch_transfer_details')
          : getTranslation(language, 'approval_view_transfer_details')}
      </button>
      {expanded && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          {loading ? (
            <p className="text-xs text-slate-500">{getTranslation(language, 'approval_fetching_details')}</p>
          ) : (
            <>
              {rows.length > 0 ? (
                <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {rows.map(([key, label]) => (
                    <div key={key} className="min-w-0">
                      <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{getTranslation(language, label)}</dt>
                      <dd className="mt-0.5 break-all text-xs font-medium text-slate-800">{visibleDetails?.[key]}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-xs text-slate-500">{getTranslation(language, 'approval_no_transfer_details')}</p>
              )}
              {error && <p className="mt-2 text-xs text-amber-700">{error}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
