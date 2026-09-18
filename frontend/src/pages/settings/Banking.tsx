import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ChevronLeft, Loader2, Landmark, ArrowLeft, ArrowRight, CheckCircle2, Globe2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { client } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const KOREA_CHANNELS = [
  { id: 'bank_transfer', label: 'Korean bank transfer', description: 'Direct KRW transfer from a Korean bank account', tone: 'bg-blue-50 text-blue-700' },
  { id: 'kakaopay', label: 'KakaoPay', description: 'Korean mobile wallet payments', tone: 'bg-yellow-50 text-yellow-800' },
  { id: 'naverpay', label: 'Naver Pay', description: 'Naver Pay wallet payments', tone: 'bg-emerald-50 text-emerald-700' },
  { id: 'tosspay', label: 'Toss Pay', description: 'Toss Pay wallet payments', tone: 'bg-violet-50 text-violet-700' },
  { id: 'payco', label: 'PAYCO', description: 'PAYCO wallet payments', tone: 'bg-red-50 text-red-700' },
];

export default function Banking() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [channelLoading, setChannelLoading] = useState(true);
  const [channelSaving, setChannelSaving] = useState(false);
  const [channelEligible, setChannelEligible] = useState(false);
  const channelCurrency = 'KRW';
  const [paymentChannels, setPaymentChannels] = useState<Record<string, string[]>>({});
  const [tossStatus, setTossStatus] = useState('not_started');
  const [tossWizardOpen, setTossWizardOpen] = useState(false);
  const [tossStep, setTossStep] = useState(1);
  const [tossSaving, setTossSaving] = useState(false);
  const [tossForm, setTossForm] = useState({
    legal_name: user?.name || '',
    country: 'Philippines',
    business_type: 'Corporation',
    monthly_volume: 'Under 100,000 KRW',
    currencies: ['KRW'],
    purpose: 'Global collections and business payments',
    contact_email: user?.email || '',
  });
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingSignature = useRef(false);
  const [signatureData, setSignatureData] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    setChannelLoading(true);
    client.get(`/api/v1/users/${user.id}/payment-channels`)
      .then((res) => {
        if (!res.ok) throw new Error(res.data?.detail || 'Unable to load payment channels');
        setChannelEligible(Boolean(res.data?.eligible));
        setPaymentChannels(res.data?.channels || {});
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Unable to load payment channels'))
      .finally(() => setChannelLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    client.get(`/api/v1/users/${user.id}/toss-virtual-account`)
      .then((res) => {
        if (res.ok) {
          setTossStatus(res.data?.status || 'not_started');
        }
      })
      .catch(() => toast.error('Unable to load TOSS Virtual Account status'));
  }, [user?.id]);

  const submitTossApplication = async () => {
    if (!user?.id || tossForm.currencies.length === 0 || !signatureData) return;
    setTossSaving(true);
    try {
      const res = await client.post(`/api/v1/users/${user.id}/toss-virtual-account`, {
        ...tossForm,
        signature_data: signatureData,
      });
      if (!res.ok) throw new Error(res.data?.detail || 'Unable to submit application');
      setTossStatus(res.data?.status || 'pending_review');
      setTossWizardOpen(false);
      setTossStep(1);
      toast.success('TOSS Virtual Account request submitted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit application');
    } finally {
      setTossSaving(false);
    }
  };

  const startSignature = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext('2d');
    if (!context) return;
    isDrawingSignature.current = true;
    context.beginPath();
    context.moveTo(event.clientX - rect.left, event.clientY - rect.top);
    canvas.setPointerCapture(event.pointerId);
  };

  const drawSignature = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignature.current) return;
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const rect = canvas.getBoundingClientRect();
    context.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    context.stroke();
  };

  const finishSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || !isDrawingSignature.current) return;
    isDrawingSignature.current = false;
    setSignatureData(canvas.toDataURL('image/png'));
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  useEffect(() => {
    const canvas = signatureCanvasRef.current;
    if (!tossWizardOpen || tossStep !== 3 || !canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    const context = canvas.getContext('2d');
    if (context) {
      context.scale(ratio, ratio);
      context.lineWidth = 2;
      context.lineCap = 'round';
      context.strokeStyle = '#0f172a';
    }
  }, [tossWizardOpen, tossStep]);

  const togglePaymentChannel = (channel: string, checked: boolean) => {
    setPaymentChannels((current) => {
      const enabled = current[channelCurrency] || [];
      return {
        ...current,
        [channelCurrency]: checked
          ? [...new Set([...enabled, channel])]
          : enabled.filter((value) => value !== channel),
      };
    });
  };

  const savePaymentChannels = async () => {
    if (!user?.id) return;
    setChannelSaving(true);
    try {
      const res = await client.request(`/api/v1/users/${user.id}/payment-channels`, 'PUT', { channels: paymentChannels });
      if (!res.ok) throw new Error(res.data?.detail || 'Unable to update payment channels');
      setPaymentChannels(res.data?.channels || paymentChannels);
      toast.success('Payment channels updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update payment channels');
    } finally {
      setChannelSaving(false);
    }
  };

  const ROWS = [
    { label: 'Settlement type', value: user?.settlement_type },
    { label: 'Settlement currency', value: user?.settlement_currency },
    { label: 'Bank', value: user?.bank_name },
    { label: 'Account number', value: user?.bank_account_number },
    { label: 'Recipient', value: user?.bank_account_name },
    { label: 'USDT wallet', value: user?.usdt_wallet_address },
    { label: 'Address', value: user?.bank_address },
  ];

  const isConfigured = ROWS.some(row => !!row.value);
  return (
    <Layout>
      <div className="page-enter">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-8 font-medium">
          <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={() => navigate('/settings')}>Settings</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-semibold">Banking</span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-5 mb-12">
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">Banking</h1>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-10">
          <span className="inline-block text-[13px] font-semibold text-slate-900 pb-4 border-b-2 border-[#FF6B00] -mb-[2px]">
            Settlement account
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-[720px] shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <p className="text-[14px] text-slate-500 font-medium m-0">
              Review all the critical details of your settlement account.
            </p>

          </div>

          {!isConfigured ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Landmark size={32} className="text-slate-300" />
              </div>
              <h3 className="text-[16px] font-semibold text-slate-900 mb-2">Not configured</h3>
              <p className="text-[13px] text-slate-500 max-w-sm mx-auto">
                No settlement account has been configured yet. Please update the details using the button above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              {ROWS.map((row) => (
                <div
                  key={row.label}
                  className="px-10 py-6 bg-white flex items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors"
                >
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-widest">{row.label}</p>
                    <p className="text-[15px] font-semibold text-slate-900 tracking-tight">{row.value || '—'}</p>
                  </div>
                  {row.badge && (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                      {row.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-[720px] shadow-sm mt-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-lg">🇰🇷</div>
                <div>
                  <h2 className="text-[16px] font-semibold text-slate-900">Korea payment channels</h2>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">KRW checkout activation</p>
                </div>
              </div>
              <p className="text-[13px] text-slate-500 mt-3">
                Activate the Korean payment methods your business accepts. Changes apply to KRW checkout only.
              </p>
            </div>
            <Button
              onClick={savePaymentChannels}
              disabled={!channelEligible || channelLoading || channelSaving}
              className="bg-[#FF6B00] hover:bg-[#E66000] text-white"
            >
              {channelSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Save activation
            </Button>
          </div>

          {channelLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Loading channels...</div>
          ) : !channelEligible ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-800">
              Make one approved USDT deposit of at least 600 USDT to enable payment channel settings.
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-blue-900">Available for KRW</p>
                  <p className="mt-1 text-xs text-blue-700">Choose one or more payment channels.</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700 shadow-sm">KRW</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {KOREA_CHANNELS.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-4 transition-colors hover:border-slate-300">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${channel.tone}`}>{channel.id === 'bank_transfer' ? '₩' : channel.label.slice(0, 1)}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{channel.label}</p>
                        <p className="mt-1 text-[11px] leading-4 text-slate-500">{channel.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={(paymentChannels[channelCurrency] || []).includes(channel.id)}
                      onCheckedChange={(checked) => togglePaymentChannel(channel.id, checked)}
                      aria-label={`Enable ${channel.label}`}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-[720px] shadow-sm mt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Globe2 size={18} className="text-cyan-400" />
                <h2 className="text-[16px] font-semibold text-white">TOSS Virtual Account</h2>
              </div>
              <p className="text-[13px] text-slate-400 mt-1">
                Open a KRW virtual account for global collections and business payments.
              </p>
            </div>
            {tossStatus === 'pending_review' && (
              <span className="rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-semibold text-amber-300">Under review</span>
            )}
          </div>

          {tossStatus === 'pending_review' ? (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-[13px] text-emerald-100">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
              <div>
                <p className="font-semibold">Application received</p>
                <p className="mt-1 text-emerald-200/80">We will review your details and contact you by email when your KRW account is ready.</p>
              </div>
            </div>
          ) : (
            <Button onClick={() => setTossWizardOpen(true)} className="mt-6 bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              Open TOSS Virtual Account
            </Button>
          )}
        </div>

        <Dialog open={tossWizardOpen} onOpenChange={setTossWizardOpen}>
          <DialogContent className="sm:max-w-[600px] border-slate-700 bg-slate-950 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-white">Open a TOSS Virtual Account</DialogTitle>
              <p className="text-sm text-slate-400">Complete your business profile to request a KRW virtual account.</p>
              <div className="grid grid-cols-3 gap-2 pt-4">
                {['Business profile', 'Account details', 'Review & sign'].map((label, index) => {
                  const step = index + 1;
                  return (
                    <div key={label} className={`border-t-2 pt-2 ${tossStep >= step ? 'border-cyan-400' : 'border-slate-700'}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${tossStep >= step ? 'text-cyan-300' : 'text-slate-500'}`}>{step}</p>
                      <p className={`mt-1 text-xs ${tossStep >= step ? 'text-slate-200' : 'text-slate-500'}`}>{label}</p>
                    </div>
                  );
                })}
              </div>
            </DialogHeader>
            <div className="py-5 text-slate-200">
              {tossStep === 1 && (
                <div className="space-y-4">
                  <div><Label className="text-slate-300">Legal business name</Label><Input className="mt-2 border-slate-700 bg-slate-900 text-white" value={tossForm.legal_name} onChange={(e) => setTossForm({ ...tossForm, legal_name: e.target.value })} placeholder="Registered business name" /></div>
                  <div><Label className="text-slate-300">Country of registration</Label><Input className="mt-2 border-slate-700 bg-slate-900 text-white" value={tossForm.country} onChange={(e) => setTossForm({ ...tossForm, country: e.target.value })} /></div>
                  <div><Label className="text-slate-300">Business type</Label><select className="mt-2 h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white" value={tossForm.business_type} onChange={(e) => setTossForm({ ...tossForm, business_type: e.target.value })}><option>Corporation</option><option>Partnership</option><option>Sole proprietorship</option><option>Non-profit</option></select></div>
                </div>
              )}
              {tossStep === 2 && (
                <div className="space-y-5">
                  <div><Label className="text-slate-300">Expected monthly volume</Label><select className="mt-2 h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white" value={tossForm.monthly_volume} onChange={(e) => setTossForm({ ...tossForm, monthly_volume: e.target.value })}><option>Under 100,000 KRW</option><option>100,000–1,000,000 KRW</option><option>Over 1,000,000 KRW</option></select></div>
                  <div><Label className="text-slate-300">Account currency</Label><div className="mt-2 rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-3 text-sm font-semibold text-cyan-300">KRW only</div></div>
                  <div><Label className="text-slate-300">Primary account purpose</Label><Input className="mt-2 border-slate-700 bg-slate-900 text-white" value={tossForm.purpose} onChange={(e) => setTossForm({ ...tossForm, purpose: e.target.value })} /></div>
                </div>
              )}
              {tossStep === 3 && (
                <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
                  <p><strong>Business:</strong> {tossForm.legal_name || '—'}</p>
                  <p><strong>Registration:</strong> {tossForm.country} · {tossForm.business_type}</p>
                  <p><strong>Volume:</strong> {tossForm.monthly_volume}</p>
                  <p><strong>Currency:</strong> KRW</p>
                  <p><strong>Purpose:</strong> {tossForm.purpose || '—'}</p>
                  <div><label className="block pt-3"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact email</span><Input className="mt-2 bg-white" value={tossForm.contact_email} onChange={(e) => setTossForm({ ...tossForm, contact_email: e.target.value })} /></label></div>
                  <div className="pt-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Draw your signature</Label>
                      <Button type="button" variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={clearSignature}>Clear</Button>
                    </div>
                    <canvas
                      ref={signatureCanvasRef}
                      className="mt-2 h-36 w-full touch-none rounded-lg border border-slate-600 bg-white"
                      onPointerDown={startSignature}
                      onPointerMove={drawSignature}
                      onPointerUp={finishSignature}
                      onPointerCancel={finishSignature}
                      onPointerLeave={finishSignature}
                      aria-label="Signature drawing area"
                    />
                    <p className="mt-1 text-xs text-slate-500">Use your mouse or finger to sign inside the box.</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex-row justify-between sm:justify-between">
              <Button variant="ghost" className="text-slate-400 hover:bg-slate-800 hover:text-white" onClick={() => tossStep === 1 ? setTossWizardOpen(false) : setTossStep(tossStep - 1)} disabled={tossSaving}><ArrowLeft size={15} className="mr-2" />Back</Button>
              {tossStep < 3 ? <Button onClick={() => setTossStep(tossStep + 1)} disabled={tossStep === 1 && !tossForm.legal_name.trim()} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">Continue<ArrowRight size={15} className="ml-2" /></Button> : <Button onClick={submitTossApplication} disabled={tossSaving || !tossForm.contact_email.trim() || !signatureData} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">{tossSaving ? <Loader2 size={15} className="mr-2 animate-spin" /> : null}Submit request</Button>}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
