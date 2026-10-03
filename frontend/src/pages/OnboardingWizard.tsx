import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, ChevronLeft, ChevronRight, FileUp, ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

type StepId = 1 | 2 | 3 | 4 | 5;

type Director = {
  name: string;
  nationality: string;
  dateOfBirth: string;
  idType: string;
  idNumber: string;
  ownershipPercent: string;
};

type DocumentBucket = 'business' | 'directors' | 'proof_of_address' | 'banking';

type WizardState = {
  businessLegalName: string;
  tradingName: string;
  businessType: string;
  industry: string;
  registrationNumber: string;
  taxId: string;
  website: string;
  addressLine1: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  expectedMonthlyVolume: string;
  avgTicketSize: string;
  settlementCurrency: 'PHP' | 'USD' | 'USDT';
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  directors: Director[];
  documents: Record<DocumentBucket, File[]>;
  bankProvider: 'maya' | 'security_bank';
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
  acknowledge: boolean;
};

const initialDirector: Director = {
  name: '',
  nationality: 'PH',
  dateOfBirth: '',
  idType: 'Passport',
  idNumber: '',
  ownershipPercent: '',
};

const INITIAL_STATE: WizardState = {
  businessLegalName: '',
  tradingName: '',
  businessType: 'Corporation',
  industry: '',
  registrationNumber: '',
  taxId: '',
  website: '',
  addressLine1: '',
  city: '',
  province: '',
  postalCode: '',
  country: 'Philippines',
  expectedMonthlyVolume: '',
  avgTicketSize: '',
  settlementCurrency: 'PHP',
  primaryContactName: '',
  primaryContactEmail: '',
  primaryContactPhone: '',
  directors: [{ ...initialDirector }],
  documents: { business: [], directors: [], proof_of_address: [], banking: [] },
  bankProvider: 'maya',
  bankAccountName: '',
  bankAccountNumber: '',
  bankBranch: '',
  acknowledge: false,
};

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-200">
          {label}{required ? <span className="ml-1 text-amber-300">*</span> : null}
        </Label>
        {hint ? <span className="text-[11px] text-slate-400">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function DropZone({
  title,
  description,
  files,
  onFiles,
}: {
  title: string;
  description: string;
  files: File[];
  onFiles: (files: File[]) => void;
}) {
  return (
    <div
      className="group rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition-colors hover:bg-slate-950"
      onDragOver={(e) => { e.preventDefault(); }}
      onDrop={(e) => {
        e.preventDefault();
        const next = Array.from(e.dataTransfer.files || []);
        if (next.length) onFiles([...files, ...next]);
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-200 ring-1 ring-slate-800">
          <FileUp className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-slate-100">
          Upload
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const next = Array.from(e.target.files || []);
              if (next.length) onFiles([...files, ...next]);
              e.currentTarget.value = '';
            }}
          />
        </label>
        <span className="text-xs text-slate-400">{files.length} file(s)</span>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.slice(0, 4).map((file, idx) => (
            <div key={`${file.name}-${idx}`} className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/70 px-3 py-2 ring-1 ring-slate-800">
              <span className="truncate text-xs font-medium text-slate-200">{file.name}</span>
              <button
                type="button"
                className="text-[11px] font-semibold text-rose-300 hover:text-rose-200"
                onClick={() => onFiles(files.filter((_f, i) => i !== idx))}
              >
                Remove
              </button>
            </div>
          ))}
          {files.length > 4 && <p className="text-[11px] text-slate-500">+ {files.length - 4} more</p>}
        </div>
      )}
    </div>
  );
}

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepId>(1);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canContinue = useMemo(() => {
    if (step === 1) {
      return Boolean(
        state.businessLegalName.trim()
        && state.tradingName.trim()
        && state.primaryContactName.trim()
        && state.primaryContactEmail.trim()
        && state.primaryContactPhone.trim()
        && state.addressLine1.trim()
        && state.city.trim()
        && state.province.trim()
      );
    }
    if (step === 2) {
      return state.directors.every((d) => d.name.trim() && d.idNumber.trim());
    }
    if (step === 3) {
      return true;
    }
    if (step === 4) {
      return Boolean(state.bankAccountName.trim() && state.bankAccountNumber.trim());
    }
    return state.acknowledge;
  }, [state, step]);

  const set = <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const next = () => setStep((s) => (Math.min(5, s + 1) as StepId));
  const prev = () => setStep((s) => (Math.max(1, s - 1) as StepId));

  const submit = async () => {
    setSubmitting(true);
    try {
      // Demo-friendly submit: this repo’s backend may not accept the full KYB payload.
      // We still provide a complete review + "submit" flow for product demos.
      await new Promise((r) => setTimeout(r, 700));
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[28px] border border-slate-800 bg-slate-950/60 p-8 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">KYB/KYC submitted</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight">Application received</h1>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  This demo wizard captures KYB/KYC data, documents, and bank details. In a production deployment, these payloads are validated and stored server-side.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button onClick={() => navigate('/login')} className="rounded-xl bg-white text-slate-950 hover:bg-slate-100">Back to login</Button>
                  <Button variant="outline" onClick={() => { setSubmitted(false); setStep(1); setState(INITIAL_STATE); }} className="rounded-xl border-slate-700 text-slate-100 hover:bg-slate-900">
                    Start new
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-[28px] border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-950/60 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">SwiftPay Philippines</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">KYB/KYC onboarding wizard</h1>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Guided verification for BSP-ready merchant onboarding. Upload docs, link settlement accounts, and submit for review.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"><ShieldCheck className="mr-1 h-3.5 w-3.5" />PCI-DSS 4.0</Badge>
              <Badge className="border border-sky-500/30 bg-sky-500/10 text-sky-200">BSP compliance</Badge>
              <Badge className="border border-slate-700 bg-slate-900 text-slate-200">Dark fintech theme</Badge>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Step {step} / {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-900 ring-1 ring-slate-800">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <Link to="/register" className="font-semibold text-slate-200 hover:text-white">Simple registration</Link>
            <span className="text-slate-700">·</span>
            <Link to="/login" className="font-semibold text-slate-200 hover:text-white">Sign in</Link>
          </div>
        </header>

        <main className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="lg:col-span-8 rounded-[28px] border border-slate-800 bg-slate-950/60 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Step 1</p>
                  <h2 className="mt-1 text-lg font-semibold">Business info (16 fields)</h2>
                  <p className="mt-1 text-sm text-slate-300">Capture legal entity, trading profile, and settlement preferences.</p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Business legal name" required>
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.businessLegalName} onChange={(e) => set('businessLegalName', e.target.value)} />
                  </Field>
                  <Field label="Trading / store name" required>
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.tradingName} onChange={(e) => set('tradingName', e.target.value)} />
                  </Field>
                  <Field label="Business type" required>
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.businessType} onChange={(e) => set('businessType', e.target.value)} />
                  </Field>
                  <Field label="Industry" required>
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.industry} onChange={(e) => set('industry', e.target.value)} placeholder="e.g. Retail, F&B, Logistics" />
                  </Field>
                  <Field label="Registration number" hint="SEC/DTI" required>
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.registrationNumber} onChange={(e) => set('registrationNumber', e.target.value)} />
                  </Field>
                  <Field label="Tax ID (TIN)" required>
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.taxId} onChange={(e) => set('taxId', e.target.value)} />
                  </Field>
                  <Field label="Website" hint="Optional">
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.website} onChange={(e) => set('website', e.target.value)} placeholder="https://…" />
                  </Field>
                  <Field label="Settlement currency" required>
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.settlementCurrency} onChange={(e) => set('settlementCurrency', e.target.value as any)} />
                  </Field>
                  <Field label="Expected monthly volume" hint="PHP" required>
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.expectedMonthlyVolume} onChange={(e) => set('expectedMonthlyVolume', e.target.value)} placeholder="e.g. 1500000" />
                  </Field>
                  <Field label="Average ticket size" hint="PHP" required>
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.avgTicketSize} onChange={(e) => set('avgTicketSize', e.target.value)} placeholder="e.g. 850" />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Address line 1" required>
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} />
                  </Field>
                  <Field label="City" required>
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.city} onChange={(e) => set('city', e.target.value)} />
                  </Field>
                  <Field label="Province" required>
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.province} onChange={(e) => set('province', e.target.value)} />
                  </Field>
                  <Field label="Postal code">
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.postalCode} onChange={(e) => set('postalCode', e.target.value)} />
                  </Field>
                  <Field label="Country" required>
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.country} onChange={(e) => set('country', e.target.value)} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Primary contact name" required>
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.primaryContactName} onChange={(e) => set('primaryContactName', e.target.value)} />
                  </Field>
                  <Field label="Primary contact email" required>
                    <Input type="email" className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.primaryContactEmail} onChange={(e) => set('primaryContactEmail', e.target.value)} />
                  </Field>
                  <Field label="Primary contact phone" required>
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.primaryContactPhone} onChange={(e) => set('primaryContactPhone', e.target.value)} placeholder="+63…" />
                  </Field>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Step 2</p>
                  <h2 className="mt-1 text-lg font-semibold">Directors / beneficial owners</h2>
                  <p className="mt-1 text-sm text-slate-300">Add directors with dynamic rows and ownership information.</p>
                </div>

                <div className="space-y-4">
                  {state.directors.map((director, index) => (
                    <div key={index} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">Director #{index + 1}</p>
                        {state.directors.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-9 rounded-xl text-rose-200 hover:bg-rose-500/10 hover:text-rose-100"
                            onClick={() => set('directors', state.directors.filter((_d, i) => i !== index))}
                          >
                            Remove
                          </Button>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <Field label="Full name" required>
                          <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={director.name} onChange={(e) => {
                            const next = [...state.directors];
                            next[index] = { ...next[index], name: e.target.value };
                            set('directors', next);
                          }} />
                        </Field>
                        <Field label="Nationality" required>
                          <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={director.nationality} onChange={(e) => {
                            const next = [...state.directors];
                            next[index] = { ...next[index], nationality: e.target.value };
                            set('directors', next);
                          }} />
                        </Field>
                        <Field label="Date of birth" required>
                          <Input type="date" className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={director.dateOfBirth} onChange={(e) => {
                            const next = [...state.directors];
                            next[index] = { ...next[index], dateOfBirth: e.target.value };
                            set('directors', next);
                          }} />
                        </Field>
                        <Field label="ID type" required>
                          <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={director.idType} onChange={(e) => {
                            const next = [...state.directors];
                            next[index] = { ...next[index], idType: e.target.value };
                            set('directors', next);
                          }} />
                        </Field>
                        <Field label="ID number" required>
                          <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={director.idNumber} onChange={(e) => {
                            const next = [...state.directors];
                            next[index] = { ...next[index], idNumber: e.target.value };
                            set('directors', next);
                          }} />
                        </Field>
                        <Field label="Ownership %" hint="Optional">
                          <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={director.ownershipPercent} onChange={(e) => {
                            const next = [...state.directors];
                            next[index] = { ...next[index], ownershipPercent: e.target.value };
                            set('directors', next);
                          }} placeholder="e.g. 25" />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-slate-700 text-slate-100 hover:bg-slate-900"
                  onClick={() => set('directors', [...state.directors, { ...initialDirector }])}
                >
                  Add director
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Step 3</p>
                  <h2 className="mt-1 text-lg font-semibold">Documents</h2>
                  <p className="mt-1 text-sm text-slate-300">Drag-drop uploads for KYB/KYC review.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <DropZone
                    title="Business registration"
                    description="SEC / DTI certificate, articles of incorporation, business permits"
                    files={state.documents.business}
                    onFiles={(files) => set('documents', { ...state.documents, business: files })}
                  />
                  <DropZone
                    title="Directors / IDs"
                    description="Government-issued IDs, selfie/face match where applicable"
                    files={state.documents.directors}
                    onFiles={(files) => set('documents', { ...state.documents, directors: files })}
                  />
                  <DropZone
                    title="Proof of address"
                    description="Utility bill / lease contract (last 3 months)"
                    files={state.documents.proof_of_address}
                    onFiles={(files) => set('documents', { ...state.documents, proof_of_address: files })}
                  />
                  <DropZone
                    title="Banking documents"
                    description="Bank statement / settlement account proof"
                    files={state.documents.banking}
                    onFiles={(files) => set('documents', { ...state.documents, banking: files })}
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Step 4</p>
                  <h2 className="mt-1 text-lg font-semibold">Settlement account linking</h2>
                  <p className="mt-1 text-sm text-slate-300">Link Maya Business or Security Bank for PHP settlements.</p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Provider" required>
                    <Input
                      className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800"
                      value={state.bankProvider === 'maya' ? 'Maya Business' : 'Security Bank'}
                      onChange={(e) => set('bankProvider', e.target.value.toLowerCase().includes('security') ? 'security_bank' : 'maya')}
                    />
                  </Field>
                  <Field label="Account name" required>
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.bankAccountName} onChange={(e) => set('bankAccountName', e.target.value)} />
                  </Field>
                  <Field label="Account number" required>
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.bankAccountNumber} onChange={(e) => set('bankAccountNumber', e.target.value)} />
                  </Field>
                  <Field label="Branch" hint="Optional">
                    <Input className="h-11 rounded-xl bg-slate-950 text-white ring-1 ring-slate-800" value={state.bankBranch} onChange={(e) => set('bankBranch', e.target.value)} />
                  </Field>
                </div>

                <Field label="Settlement notes" hint="Optional">
                  <Textarea className="min-h-[120px] rounded-2xl bg-slate-950 text-white ring-1 ring-slate-800" placeholder="e.g. preferred cut-off, payout schedule" />
                </Field>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Step 5</p>
                  <h2 className="mt-1 text-lg font-semibold">Review & submit</h2>
                  <p className="mt-1 text-sm text-slate-300">Confirm details and submit for compliance review.</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{state.tradingName || '—'}</p>
                        <p className="truncate text-xs text-slate-400">{state.businessLegalName || '—'}</p>
                      </div>
                    </div>
                    <Badge className="border border-slate-700 bg-slate-900 text-slate-200">{state.settlementCurrency}</Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-200 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Contact</p>
                      <p className="mt-1 font-semibold">{state.primaryContactName || '—'}</p>
                      <p className="mt-1 text-xs text-slate-400">{state.primaryContactEmail || '—'} · {state.primaryContactPhone || '—'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Address</p>
                      <p className="mt-1 text-xs text-slate-300">{state.addressLine1 || '—'}</p>
                      <p className="mt-1 text-xs text-slate-400">{state.city || '—'}, {state.province || '—'} {state.postalCode || ''}</p>
                    </div>
                    <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Directors</p>
                      <p className="mt-1 text-xs text-slate-300">{state.directors.length} director(s)</p>
                      <p className="mt-1 text-xs text-slate-400">IDs required for all directors.</p>
                    </div>
                    <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Documents</p>
                      <p className="mt-1 text-xs text-slate-300">
                        {Object.values(state.documents).reduce((sum, list) => sum + list.length, 0)} file(s) uploaded
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Attach additional docs if needed.</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Settlement bank</p>
                    <p className="mt-1 text-xs text-slate-300">
                      {(state.bankProvider === 'maya' ? 'Maya Business' : 'Security Bank')} · {state.bankAccountName || '—'} · {state.bankAccountNumber || '—'}
                    </p>
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <input
                    type="checkbox"
                    checked={state.acknowledge}
                    onChange={(e) => set('acknowledge', e.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <span className="text-sm text-slate-300">
                    I confirm the information provided is accurate and authorize SwiftPay Philippines to perform KYB/KYC checks for BSP compliance.
                  </span>
                </label>
              </div>
            )}
          </section>

          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-[28px] border border-slate-800 bg-slate-950/60 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Guidance</p>
              <p className="mt-2 text-sm font-semibold text-white">BSP-ready onboarding</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li className="leading-6">- Upload clear scans (no screenshots) for faster review.</li>
                <li className="leading-6">- Directors must match business registration records.</li>
                <li className="leading-6">- Settlement accounts must be under the legal entity name.</li>
              </ul>
            </div>

            <div className="rounded-[28px] border border-slate-800 bg-slate-950/60 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Navigation</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-slate-700 text-slate-100 hover:bg-slate-900"
                  onClick={prev}
                  disabled={step === 1}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                {step < 5 ? (
                  <Button
                    type="button"
                    className={cn('h-11 rounded-xl bg-white text-slate-950 hover:bg-slate-100', !canContinue && 'opacity-60')}
                    onClick={next}
                    disabled={!canContinue}
                  >
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className={cn('h-11 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400', !canContinue && 'opacity-60')}
                    onClick={() => void submit()}
                    disabled={!canContinue || submitting}
                  >
                    {submitting ? 'Submitting…' : 'Submit'}
                  </Button>
                )}
              </div>

              <p className="mt-4 text-xs text-slate-500">
                For a simpler flow, use <Link to="/register" className="font-semibold text-slate-300 hover:text-white">/register</Link>.
              </p>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

