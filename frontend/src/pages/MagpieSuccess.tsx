import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Bot, ShieldCheck, Download, Home } from 'lucide-react';
import { APP_NAME } from '@/lib/brand';

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export default function MagpieSuccess() {
  const query = useQuery();
  const session = query.get('session_id') || query.get('checkout_id') || query.get('external_id') || '';
  const paymentUrl = query.get('payment_url') || query.get('checkout_url') || '';
  const amount = query.get('amount') || '';

  return (
    <div className="min-h-screen bg-[#080E1A] text-white selection:bg-blue-500/30 flex flex-col items-center justify-center p-6">
      {/* Brand Logo */}
      <div className="mb-12 animate-logo-entrance">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-600/40">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight">{APP_NAME} <span className="text-blue-400 font-medium">Verified</span></span>
        </div>
      </div>

      <Card className="max-w-xl w-full border-white/[0.08] bg-white/[0.03] backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-black/50 overflow-hidden animate-fade-in-up">
        <div className="h-2 w-full bg-gradient-to-r from-emerald-500 to-blue-500" />

        <CardHeader className="pt-10 pb-8 text-center">
          <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-white mb-2">Payment Successful</CardTitle>
          <CardDescription className="text-slate-400 text-base">Your transaction has been processed and verified.</CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-10">
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
            <div className="flex justify-between items-center py-1">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Status</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                <ShieldCheck className="h-4 w-4" />
                Verified
              </div>
            </div>

            {amount && (
              <div className="flex justify-between items-center py-1 border-t border-white/[0.05] pt-4">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Amount Paid</span>
                <span className="text-lg font-black text-white">₱ {parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {session && (
              <div className="flex justify-between items-center py-1 border-t border-white/[0.05] pt-4">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Reference</span>
                <code className="text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">{session}</code>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="px-8 pb-10 flex flex-col gap-4">
          <div className="flex gap-3 w-full">
            <Button className="flex-1 h-12 rounded-2xl bg-white text-[#080E1A] hover:bg-slate-200 font-bold shadow-lg shadow-white/5">
              <Download className="h-4 w-4 mr-2" /> Save Receipt
            </Button>
            <Button asChild variant="outline" className="flex-1 h-12 rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">
              <Link to="/home">
                <Home className="h-4 w-4 mr-2" /> Home
              </Link>
            </Button>
          </div>
          <p className="text-[10px] text-center text-slate-600 uppercase tracking-widest mt-2">
            Securely processed by {APP_NAME} Financial Services
          </p>
        </CardFooter>
      </Card>

      <div className="mt-12 text-slate-600 text-xs flex gap-6 font-medium uppercase tracking-[0.2em]">
        <Link to="/policies" className="hover:text-blue-400 transition-colors">Support</Link>
        <Link to="/policies" className="hover:text-blue-400 transition-colors">Privacy</Link>
        <Link to="/policies" className="hover:text-blue-400 transition-colors">Terms</Link>
      </div>
    </div>
  );
}
