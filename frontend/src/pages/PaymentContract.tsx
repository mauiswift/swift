import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, Copy, FileText, Printer, ShieldCheck } from 'lucide-react';
import Layout from '@/components/Layout';
import LoadingSkeleton from '@/design-system/components/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { client } from '@/lib/api';
import { fmtCurrency, normalizePublicCurrency } from '@/lib/format';
import { getTransactionStatus, isSuccessfulTransaction, type TransactionRecord } from '@/lib/transactions';
import { toast } from 'sonner';

const COMPANY_NAME = 'DRL TECHS COMPUTER SOFTWARE TRADING';
const MERCHANT_SIGNATORY = 'Den Russell Camus Leonardo';

const SERVICE_PACKAGES = [
  {
    minimumPhp: 0,
    maximumPhp: 49999.99,
    packageName: 'IT Services Starter',
    workDays: 3,
    serviceType: 'Small business setup or targeted technical fix',
    delivery: 'Remote discovery, configuration or correction of one agreed system component, and a short verification cycle.',
    deliverables: 'Written requirements summary, configured feature or fix, basic test checklist, and electronic handover notes.',
    acceptance: 'The agreed feature or correction is demonstrated against the documented requirements and the customer receives the handover notes.',
    support: 'Three calendar days for clarification, minor configuration adjustments, and correction of defects in the delivered scope.',
    exclusions: 'New modules outside the agreed task, extensive data migration, third-party subscription fees, hardware, and on-site work.',
  },
  {
    minimumPhp: 50000,
    maximumPhp: 99999.99,
    packageName: 'IT Services Professional',
    workDays: 7,
    serviceType: 'Business workflow, payment, or customer-facing system implementation',
    delivery: 'Requirements workshop, solution design, implementation of the agreed workflow, test execution, and deployment assistance.',
    deliverables: 'Solution outline, configured or developed workflow, validation results, deployment checklist, and administrator handover.',
    acceptance: 'The customer reviews the delivered workflow using the agreed test scenarios and confirms that the documented acceptance criteria are met.',
    support: 'Seven calendar days for defect correction, operational questions, and minor adjustments directly related to the delivered scope.',
    exclusions: 'Material scope expansion, recurring hosting or software charges, major data cleansing, hardware procurement, and work requiring a separate statement of work.',
  },
  {
    minimumPhp: 100000.01,
    maximumPhp: Number.POSITIVE_INFINITY,
    packageName: 'IT Services Enterprise',
    workDays: 14,
    serviceType: 'Multi-component platform, integration, or automation project',
    delivery: 'Technical planning, architecture review, implementation across the agreed components, integration testing, security-minded configuration review, and operational handover.',
    deliverables: 'Project plan, solution architecture summary, configured or developed components, test and deployment records, operating guide, and handover session.',
    acceptance: 'The customer reviews the agreed acceptance checklist and confirms that the integrated solution performs the documented priority workflows in the agreed environment.',
    support: 'Fourteen calendar days for defect correction, deployment assistance, monitoring guidance, and minor adjustments directly related to the delivered scope.',
    exclusions: 'Unlimited revisions, 24/7 managed operations, third-party fees, infrastructure outside the agreed environment, regulated certifications, and major features not listed in the project plan.',
  },
] as const;

export default function PaymentContract() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<TransactionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setError('Transaction ID is missing.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await client.get(`/api/v1/entities/transactions/${encodeURIComponent(id)}`);
      if (!response.ok || !response.data) {
        throw new Error(response.data?.detail || 'Unable to load payment contract.');
      }
      setTransaction(response.data as TransactionRecord);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load payment contract.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <Layout><LoadingSkeleton variant="page" /></Layout>;

  if (error || !transaction) {
    return (
      <Layout>
        <div className="mx-auto max-w-xl py-20 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-300" />
          <h1 className="mt-4 text-lg font-semibold text-slate-900">Unable to generate contract</h1>
          <p className="mt-2 text-sm text-slate-500">{error || 'Transaction not found.'}</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/payments')}>Back to payments</Button>
        </div>
      </Layout>
    );
  }

  const contractStatus = getTransactionStatus(transaction);
  const successful = isSuccessfulTransaction(contractStatus);
  const contractNumber = `SP-${String(transaction.id).padStart(8, '0')}`;
  const currency = normalizePublicCurrency(transaction.currency);
  const phpEquivalent = currency === 'PHP'
    ? Number(transaction.amount || 0)
    : Number((transaction as TransactionRecord & { processing_amount?: number }).processing_amount || 0);
  const servicePackage = SERVICE_PACKAGES.find(packageTier => phpEquivalent >= packageTier.minimumPhp && phpEquivalent <= packageTier.maximumPhp) || SERVICE_PACKAGES[0];
  const contractDate = transaction.paid_at || transaction.updated_at || transaction.created_at;
  const formattedDate = contractDate ? new Date(contractDate).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }) : '—';
  const generatedAt = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
  const statusLabel = successful && contractStatus !== 'pending' ? 'Completed' : 'Review required';
  const copyContractNumber = async () => {
    try {
      await navigator.clipboard.writeText(contractNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Unable to copy contract number');
    }
  };

  return (
    <Layout>
      <style>{`
        @page {
          size: A4;
          margin: 14mm;
        }
        @media print {
          html, body {
            background: #fff !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .contract-document {
            width: 100%;
            color: #0f172a;
          }
          .contract-document section,
          .contract-document footer {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .contract-document header {
            break-after: avoid;
            page-break-after: avoid;
          }
          .contract-document .contract-terms {
            break-before: auto;
          }
        }
      `}</style>
      <div className="page-enter mx-auto max-w-4xl print:max-w-none">
        <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
          <Button variant="ghost" onClick={() => navigate(`/payments/${encodeURIComponent(String(transaction.id))}`)} className="gap-2">
            <ArrowLeft size={16} /> Back to payment
          </Button>
          <Button onClick={() => window.print()} className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
            <Printer size={16} /> Print / Save PDF
          </Button>
        </div>

        {!successful && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 print:hidden">
            <ShieldCheck size={17} />
            This payment is not marked successful. The contract is shown for review only.
          </div>
        )}

        <article className="contract-document overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <header className="border-b border-slate-200 bg-slate-950 px-8 py-8 text-white sm:px-12 print:px-10 print:py-7">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                  <ShieldCheck size={13} /> Secure Platform
                </div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Payment Completion Agreement</h1>
                <p className="mt-2 text-sm text-slate-300">Electronic payment record and customer acknowledgement</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-left sm:text-right">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Contract status</p>
                <p className={`mt-1 flex items-center gap-1.5 text-sm font-semibold sm:justify-end ${successful && contractStatus !== 'pending' ? 'text-emerald-300' : 'text-amber-300'}`}>
                {successful && contractStatus !== 'pending' ? <CheckCircle2 size={15} /> : <Clock3 size={15} />} {statusLabel}
                </p>
              </div>
            </div>
          </header>

          <div className="space-y-8 px-8 py-8 sm:px-12 print:space-y-6 print:px-10 print:py-7">
            <section className="grid gap-5 border-b border-slate-100 pb-7 sm:grid-cols-3 print:gap-4 print:pb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Contract number</p>
                <button type="button" onClick={() => void copyContractNumber()} className="mt-1.5 inline-flex items-center gap-1.5 text-left text-sm font-semibold text-slate-800 hover:text-blue-700 print:pointer-events-none">
                  <span className="font-mono">{contractNumber}</span>
                  <Copy size={13} className="text-slate-400 print:hidden" />
                  <span className="sr-only">{copied ? 'Copied' : 'Copy contract number'}</span>
                </button>
                {copied && <p className="mt-1 text-[10px] font-medium text-emerald-600 print:hidden">Copied</p>}
              </div>
              <Detail label="Merchant" value={COMPANY_NAME} />
              <Detail label="Payment date" value={formattedDate} />
              <Detail label="Transaction ID" value={transaction.external_id || String(transaction.id)} mono />
              <Detail label="Payment method" value={transaction.transaction_type || 'Payment'} />
              <Detail label="Currency" value={currency} />
              <Detail label="Approval status" value={transaction.approval_status || 'Recorded'} />
              <Detail label="Approved at" value={transaction.approved_at ? new Date(transaction.approved_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'} />
            </section>

            <section className="contract-section">
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">1. Payment details</h2>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{transaction.title || transaction.description || 'Payment for goods or services'}</p>
                    {transaction.customer_name && <p className="mt-1 text-sm text-slate-500">Customer: {transaction.customer_name}</p>}
                  </div>
                  <p className="text-2xl font-semibold text-slate-900">{fmtCurrency(transaction.amount, currency)}</p>
                </div>
              </div>
            </section>

            <section className="contract-section">
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">2. IT service scope</h2>
              <div className="mt-4 grid gap-4 rounded-xl border border-blue-200 bg-blue-50 p-5 sm:grid-cols-2">
                <Detail label="Service package" value={servicePackage.packageName} />
                <Detail label="PHP value used for tier" value={fmtCurrency(phpEquivalent, 'PHP')} />
                <Detail label="Estimated work days" value={`${servicePackage.workDays} calendar days`} />
                <Detail label="Service type" value={servicePackage.serviceType} />
                <Detail label="Delivery approach" value={servicePackage.delivery} />
                <div className="sm:col-span-2"><Detail label="Deliverables" value={servicePackage.deliverables} /></div>
                <div className="sm:col-span-2"><Detail label="Acceptance criteria" value={servicePackage.acceptance} /></div>
                <div className="sm:col-span-2"><Detail label="Support terms" value={servicePackage.support} /></div>
                <div className="sm:col-span-2"><Detail label="Scope exclusions" value={servicePackage.exclusions} /></div>
              </div>
            </section>

            <section className="contract-section">
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">3. Customer acknowledgement</h2>
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
                I confirm that I have already received the goods or services purchased from {COMPANY_NAME}, and that I am voluntarily making this payment. I acknowledge that the payment details provided are accurate and agree to the applicable payment compliance requirements.
              </div>
            </section>

            <section className="contract-section contract-terms">
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">4. Payment terms</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <p>The customer confirms that the payment described in this agreement is authorized by them and is being made voluntarily for the goods or services received.</p>
                <p>The service package, schedule, and deliverables above describe the expected scope at the time of payment. The estimated work days are business planning estimates and may be adjusted by written agreement when requirements, approvals, access, or third-party dependencies change.</p>
                <p>Work begins after the customer provides the required information, access, approvals, and content. Any material change in requirements may require a revised quotation or separate statement of work before additional work is started.</p>
                <p>The transaction record, payment status, and timestamps shown in this document are generated from the SwiftPay system and should be retained with any supporting payment evidence.</p>
                <p>This document records the payment and acknowledgement electronically. It does not replace any separate invoice, order form, service agreement, or legally required tax document.</p>
                <p>The customer is solely responsible for the legality, source, authorization, and intended use of the payment and for any fraud, deception, unauthorized activity, or other unlawful conduct in which the customer is involved. To the extent permitted by applicable law, DRL TECHS. COMPUTER SOFTWARE TRADING is not responsible or liable for such conduct or for losses arising from the customer&apos;s fraudulent or unlawful activity.</p>
              </div>
            </section>

            <section className="contract-section grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-2">
              <Detail label="Customer name" value={transaction.customer_name || 'Not provided'} />
              <Detail label="Customer email" value={transaction.customer_email || 'Not provided'} />
              <Detail label="Sender name" value={transaction.sender_name || 'Not provided'} />
              <Detail label="Sender bank" value={transaction.sender_bank || 'Not provided'} />
            </section>

            <section className="contract-section grid gap-8 border-t border-slate-200 pt-8 sm:grid-cols-2">
              <SignatureBlock label="Customer acknowledgement" name={transaction.customer_name || 'Customer'} />
              <SignatureBlock
                label="Merchant signatory"
                name={MERCHANT_SIGNATORY}
                subtitle={`Owner, ${COMPANY_NAME}`}
                signatureImage="/images/owner-signature.jpg"
              />
            </section>

            <footer className="contract-section border-t border-slate-100 pt-6 text-xs leading-5 text-slate-500">
              Generated electronically by SwiftPay on {generatedAt}. This document is provided for administrative and legal recordkeeping and should be retained with the corresponding transaction and payment evidence.
            </footer>
          </div>
        </article>
      </div>
    </Layout>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className={`mt-1.5 text-sm font-semibold text-slate-800 ${mono ? 'break-all font-mono' : ''}`}>{value}</p>
    </div>
  );
}

function SignatureBlock({
  label,
  name,
  subtitle = 'Electronic record / no handwritten signature required',
  signatureImage,
}: {
  label: string;
  name: string;
  subtitle?: string;
  signatureImage?: string;
}) {
  return (
    <div className="min-h-28 rounded-xl border border-slate-200 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      {signatureImage && (
        <div className="mt-3 flex h-16 items-end border-b border-slate-300">
          <img src={signatureImage} alt={`${name} signature`} className="mb-1 h-14 max-w-full object-contain object-left mix-blend-multiply" />
        </div>
      )}
      <div className={`${signatureImage ? 'pt-2' : 'mt-10 border-t border-slate-300 pt-2'}`}>
        <p className="text-sm font-semibold text-slate-800">{name}</p>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}
