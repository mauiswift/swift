import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileCheck, ShieldCheck, Award, Sparkles, Archive, Globe } from 'lucide-react';
import { APP_NAME, COMPANY_NAME } from '@/lib/brand';

const certificates = [
  {
    title: 'NPC Certificate of Registration',
    issuer: 'National Privacy Commission',
    number: 'PIC-004-273-2027',
    issuedOn: 'April 14, 2025',
    expiresOn: 'April 14, 2027',
    description:
      'Registered under the Data Privacy Act of 2012 to handle personal data in accordance with Philippine privacy law.',
    badge: 'Data Privacy',
  },
  {
    title: 'SEC Certificate of Incorporation',
    issuer: 'Securities and Exchange Commission',
    number: 'CS20190000454',
    issuedOn: 'February 23, 2019',
    expiresOn: 'No Expiry',
    description:
      'Official SEC registration for the operating entity, authorizing corporate operations under Philippine corporate law.',
    badge: 'Corporate Registration',
  },
  {
    title: 'BIR Certificate of Registration',
    issuer: 'Bureau of Internal Revenue',
    number: 'TIN 010-429-507-00000',
    issuedOn: 'November 15, 2019',
    expiresOn: 'Active',
    description:
      'Tax registration for the operating entity as a domestic corporation, enabling compliant transaction reporting and tax filings.',
    badge: 'Tax Compliance',
  },
];

export default function Compliance() {
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto pb-24">
      <div className="mb-8 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-lg overflow-hidden animate-fade-in-up">
          <div className="relative overflow-hidden px-8 py-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.35),_transparent_40%)]" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-3xl bg-slate-800/90 grid place-items-center text-blue-300 shadow-xl shadow-blue-500/10">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-sky-300/80">Compliance & certification</p>
                  <h1 className="text-3xl font-semibold">{COMPANY_NAME} Credentials</h1>
                </div>
              </div>
              <p className="max-w-2xl text-slate-200 leading-7">
                This page captures the current compliance credentials for {COMPANY_NAME}. Each certificate is presented with verified registration details and the operational status required for regulated payment services in the Philippines.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-slate-800/70 text-sky-200 border border-slate-700">NPC</Badge>
                <Badge className="bg-slate-800/70 text-sky-200 border border-slate-700">SEC</Badge>
                <Badge className="bg-slate-800/70 text-sky-200 border border-slate-700">BIR</Badge>
              </div>
            </div>
          </div>
        </div>

        <Card className="rounded-[2rem] border border-slate-200 shadow-sm bg-white animate-fade-in-up animate-stagger-1">
          <CardHeader className="pb-4 px-6 pt-6">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-sky-500" />
              Compliance snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Document status</p>
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <div className="rounded-full bg-emerald-500/10 text-emerald-700 px-3 py-1 text-xs font-semibold">Active</div>
                <div className="rounded-full bg-slate-100 text-slate-600 px-3 py-1 text-xs">Updated April 2026</div>
              </div>
            </div>
            <div className="grid gap-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-muted-foreground">Registered Entity</p>
                <p className="mt-1 font-semibold text-foreground">{COMPANY_NAME}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-muted-foreground">Primary Jurisdiction</p>
                <p className="mt-1 font-semibold text-foreground">Republic of the Philippines</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <Button variant="outline" className="w-full justify-center gap-2">
                <Archive className="h-4 w-4" /> Download compliance brief
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {certificates.map((certificate, index) => (
          <Card
            key={certificate.number}
            className={`rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-hidden animate-fade-in-up animate-stagger-${index + 1}`}
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.45),_transparent_32%)]" />
              <div className="relative z-10 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-3xl bg-white/10 grid place-items-center text-sky-200">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-sky-200/80">{certificate.badge}</p>
                    <h2 className="text-xl font-semibold">{certificate.title}</h2>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-slate-200">{certificate.description}</p>
              </div>
            </div>

            <CardContent className="space-y-4 px-6 py-6">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-[0.24em]">Issuer</p>
                  <p className="text-sm font-semibold text-foreground">{certificate.issuer}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-[0.24em]">Registration number</p>
                  <p className="text-sm font-semibold text-foreground">{certificate.number}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-3">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Issued</p>
                    <p className="text-sm font-semibold text-foreground mt-1">{certificate.issuedOn}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-3">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Effective until</p>
                    <p className="text-sm font-semibold text-foreground mt-1">{certificate.expiresOn}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Sparkles className="h-3.5 w-3.5" /> Verified
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  <Globe className="h-3.5 w-3.5" /> Philippines
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
