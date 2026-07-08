import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  CheckCircle,
  Copy,
  ChevronLeft,
  Calendar,
  Clock,
  ShieldCheck,
  Settings2,
  User,
  Info,
  FileText,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { APP_NAME } from '@/lib/brand';

const METHOD_OPTIONS = [
  { value: 'visa', label: 'Visa', logo: '/logos/visa.svg' },
  { value: 'mastercard', label: 'Mastercard', logo: '/logos/mastercard.svg' },
  { value: 'gcash', label: 'GCash', logo: '/logos/gcash.svg' },
  { value: 'maya', label: 'Maya', logo: '/logos/maya.svg' },
  { value: 'grabpay', label: 'GrabPay', logo: '/logos/grab.svg' },
] as const;

export default function CreatePayment() {
  const { user, permissions, isSuperAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Main Form State
  const [referenceId, setReferenceId] = useState(`REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
  const [paymentDetailMode, setPaymentDetailMode] = useState('total_only');
  const [amount, setAmount] = useState(searchParams.get('amount') || '');
  const [description, setDescription] = useState(searchParams.get('description') || '');
  const [enableMultiplePayments, setEnableMultiplePayments] = useState(false);

  // Optional / Advanced State
  const [customerName, setCustomerName] = useState(searchParams.get('customer_name') || '');
  const [customerEmail, setCustomerEmail] = useState(searchParams.get('customer_email') || '');
  const [shippingFee, setShippingFee] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [successUrl, setSuccessUrl] = useState('');
  const [cancelUrl, setCancelUrl] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['visa', 'mastercard', 'gcash', 'maya']);
  const [showManageMethods, setShowManageMethods] = useState(false);

  const [apiKey, setApiKey] = useState(localStorage.getItem('payment_api_key') || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const togglePaymentMethod = (method: string) => {
    setPaymentMethods(current => {
      const next = current.includes(method)
        ? current.filter(m => m !== method)
        : [...current, method];
      return next.length ? next : ['visa', 'mastercard', 'gcash', 'maya'];
    });
  };

  const canAccessPayments = Boolean(isSuperAdmin || permissions?.can_manage_payments);

  const totalAmount = useMemo(() => {
    const sub = parseFloat(amount) || 0;
    const ship = parseFloat(shippingFee) || 0;
    return sub + ship;
  }, [amount, shippingFee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAccessPayments) {
      toast.error('You do not have permission to create payments.');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const endpoint = '/api/v1/xend/create-payment-link';
      const payload = {
        amount: parseFloat(amount),
        shipping_fee: parseFloat(shippingFee),
        description,
        external_id: referenceId,
        customer_name: customerName,
        customer_email: customerEmail,
        payment_methods: paymentMethods,
        multiple_payments: enableMultiplePayments,
        expires_at: dueDate && dueTime ? `${dueDate}T${dueTime}:00Z` : undefined,
        success_url: successUrl || undefined,
        cancel_url: cancelUrl || undefined,
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
          ...(apiKey.trim() ? { 'X-API-Key': apiKey.trim() } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const responseData = data?.data ?? data;

      if (!res.ok) {
        toast.error(data?.detail || data?.message || `Error ${res.status}`);
      } else if (data?.success) {
        setResult(responseData);
        toast.success('Payment link created successfully!');
      } else {
        toast.error(data?.message || 'Failed to create payment');
      }
    } catch (err: unknown) {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (!canAccessPayments) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto rounded-2xl border border-red-200 bg-red-50/80 p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-red-700 text-headline">Access restricted</h1>
          <p className="mt-3 text-sm text-red-600">Only users with payment management permission can create payment collection requests.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-1 mb-10">
          <Link to="/" className="flex items-center text-xs font-bold text-slate-400 hover:text-blue-500 transition-colors uppercase tracking-widest mb-2">
            <ChevronLeft className="h-3 w-3 mr-1" /> Back
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Create Payment Link</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start">

          {/* LEFT COLUMN: FORM DETAILS */}
          <div className="space-y-10 animate-slide-in-up">

            {/* Order Details Card */}
            <div className="bg-card border border-border/60 rounded-[2rem] p-10 space-y-10 shadow-xl shadow-black/[0.02]">
              <div className="flex items-center justify-between border-b border-border/50 pb-6">
                <h2 className="text-xl font-black text-foreground">Order Details</h2>
                <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="ref-id" className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                    Reference ID *
                  </Label>
                  <Input
                    id="ref-id"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    placeholder="e.g. INV-2024-001"
                    className="h-14 bg-muted/20 border-border/60 rounded-2xl px-5 text-base font-bold focus:ring-blue-500/20"
                    required
                  />
                  <div className="flex items-center gap-1.5 pl-1">
                    <span className="h-1 w-1 bg-blue-500 rounded-full" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unique identifier for this transaction</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                    Payment Details *
                  </Label>
                  <RadioGroup value={paymentDetailMode} onValueChange={setPaymentDetailMode} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className={`flex items-center space-x-3 p-4 rounded-2xl border transition-all cursor-pointer ${paymentDetailMode === 'total_only' ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/20' : 'border-border/60 hover:bg-muted/30'}`} onClick={() => setPaymentDetailMode('total_only')}>
                      <RadioGroupItem value="total_only" id="r1" className="text-blue-600" />
                      <Label htmlFor="r1" className="text-xs font-bold cursor-pointer text-foreground">Fixed Total Only</Label>
                    </div>
                    <div className={`flex items-center space-x-3 p-4 rounded-2xl border transition-all cursor-pointer ${paymentDetailMode === 'items' ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/20' : 'border-border/60 hover:bg-muted/30'}`} onClick={() => setPaymentDetailMode('items')}>
                      <RadioGroupItem value="items" id="r2" className="text-blue-600" />
                      <Label htmlFor="r2" className="text-xs font-bold cursor-pointer text-foreground">Line Itemized</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                    Amount Due *
                  </Label>
                  <div className="flex gap-3">
                    <div className="w-28">
                      <Select defaultValue="php">
                        <SelectTrigger className="h-14 bg-muted/20 border-border/60 rounded-2xl font-bold px-4">
                          <SelectValue placeholder="PHP" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="php">PHP ₱</SelectItem>
                          <SelectItem value="usd">USD $</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1 h-14 bg-muted/20 border-border/60 rounded-2xl px-6 text-xl font-black tracking-tight"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-1.5 pl-1">
                    <span className="h-1 w-1 bg-red-500 rounded-full" />
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Required field</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                    Description
                  </Label>
                  <Textarea
                    placeholder="Enter payment purpose for the customer..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[140px] bg-muted/20 border-border/60 rounded-[1.5rem] px-5 py-4 resize-none text-sm leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Multiple Payments Toggle */}
            <div className="flex items-center justify-between p-8 bg-white border border-border/60 rounded-[2rem] shadow-lg shadow-black/[0.01]">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-foreground">Enable Multiple Payments</span>
                  <Info className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <p className="text-xs text-muted-foreground font-medium">Allow this link to be paid multiple times by different customers.</p>
              </div>
              <Switch checked={enableMultiplePayments} onCheckedChange={setEnableMultiplePayments} className="data-[state=checked]:bg-blue-600" />
            </div>

            {/* Accordion Sections */}
            <Accordion type="single" collapsible className="space-y-4">

              {/* Customer Details */}
              <AccordionItem value="customer" className="border border-border/60 rounded-[2rem] bg-card px-8 overflow-hidden shadow-sm transition-all hover:border-border">
                <AccordionTrigger className="hover:no-underline py-8">
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-slate-400" />
                    </div>
                    <div className="text-left space-y-0.5">
                      <span className="text-base font-black text-foreground block">Customer Details</span>
                      <span className="text-xs text-muted-foreground font-medium">Pre-fill buyer info for faster checkout.</span>
                    </div>
                    <Badge variant="outline" className="ml-4 text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-400">OPTIONAL</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-10 space-y-8 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Customer Name</Label>
                      <Input
                        placeholder="e.g. John Doe"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="h-12 bg-muted/20 border-border/60 rounded-xl"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Email Address</Label>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="h-12 bg-muted/20 border-border/60 rounded-xl"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Advanced Settings */}
              <AccordionItem value="advanced" className="border border-border/60 rounded-[2rem] bg-card px-8 overflow-hidden shadow-sm transition-all hover:border-border">
                <AccordionTrigger className="hover:no-underline py-8">
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <Settings2 className="h-6 w-6 text-slate-400" />
                    </div>
                    <div className="text-left space-y-0.5">
                      <span className="text-base font-black text-foreground block">Advanced Settings</span>
                      <span className="text-xs text-muted-foreground font-medium">Expiry, redirects, and custom methods.</span>
                    </div>
                    <Badge variant="outline" className="ml-4 text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-400">OPTIONAL</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-10 space-y-12 pt-6 border-t border-border/50">

                  {/* Due Date */}
                  <div className="space-y-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Payment Due Date and Time</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] text-muted-foreground font-bold pl-1 uppercase tracking-widest">Expiry Date</Label>
                        <div className="relative group">
                          <Input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="h-12 bg-muted/20 border-border/60 rounded-xl pl-12 group-hover:border-blue-500/30 transition-colors"
                          />
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] text-muted-foreground font-bold pl-1 uppercase tracking-widest">Expiry Time</Label>
                        <div className="relative group">
                          <Input
                            type="time"
                            value={dueTime}
                            onChange={(e) => setDueTime(e.target.value)}
                            className="h-12 bg-muted/20 border-border/60 rounded-xl pl-12 group-hover:border-blue-500/30 transition-colors"
                          />
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Accepted Payment Methods</p>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="h-8 text-[10px] font-black uppercase tracking-widest rounded-lg border-slate-200"
                        onClick={() => setShowManageMethods(prev => !prev)}
                      >
                        {showManageMethods ? 'DONE' : 'MANAGE'}
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div className={`flex flex-wrap items-center gap-4 py-4 px-6 rounded-2xl border border-border/40 transition-all duration-500 ${showManageMethods ? 'bg-muted/10' : 'bg-slate-100/80 opacity-90'}`}>
                        {METHOD_OPTIONS.map(m => {
                          const selected = paymentMethods.includes(m.value);
                          return (
                            <button
                              key={m.value}
                              type="button"
                              disabled={!showManageMethods}
                              onClick={() => togglePaymentMethod(m.value)}
                              className={`group inline-flex items-center gap-2 rounded-2xl border px-3 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 ${
                                selected ? 'border-blue-500 bg-blue-500/10' : 'border-border/50 bg-white/80 hover:bg-muted/80'
                              }`}
                            >
                              <img src={m.logo} alt={m.label} className="h-5 w-5 object-contain" />
                              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 group-hover:text-slate-900">{m.label}</span>
                              {selected && <Check className="h-4 w-4 text-blue-600" />}
                            </button>
                          );
                        })}
                      </div>
                      {!showManageMethods && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                            <span>Selected:</span>
                            {paymentMethods.map(method => (
                              <span key={method} className="rounded-full bg-slate-100 px-3 py-1">{METHOD_OPTIONS.find(m => m.value === method)?.label ?? method}</span>
                            ))}
                          </div>
                          <p className="text-xs text-slate-500">Tap MANAGE to edit accepted payment methods.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Redirect URLs */}
                  <div className="space-y-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Payment Redirect URLs</p>
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest pl-1">Successful Redirect</Label>
                        <Input
                          placeholder="https://yourstore.com/checkout/success"
                          value={successUrl}
                          onChange={(e) => setSuccessUrl(e.target.value)}
                          className="h-12 bg-muted/20 border-border/60 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest pl-1">Failure Redirect</Label>
                        <Input
                          placeholder="https://yourstore.com/checkout/failed"
                          value={cancelUrl}
                          onChange={(e) => setCancelUrl(e.target.value)}
                          className="h-12 bg-muted/20 border-border/60 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* RIGHT COLUMN: SUMMARY SECTION */}
          <div className="space-y-8 sticky top-24 animate-slide-in-right">
            <Card className="border border-border/60 bg-white shadow-2xl shadow-black/[0.03] rounded-[2.5rem] overflow-hidden">
              <div className="bg-slate-50 px-10 py-8 border-b border-border/40">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Payment Summary</CardTitle>
              </div>
              <CardContent className="px-10 py-10 space-y-10">
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                    <span className="text-foreground font-black tracking-tight">₱ {parseFloat(amount || '0').toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm gap-8">
                    <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px] shrink-0">Shipping</span>
                    <div className="relative flex-1 max-w-[140px]">
                      <Input
                        type="number"
                        value={shippingFee}
                        onChange={(e) => setShippingFee(e.target.value)}
                        className="h-10 text-right pr-12 bg-muted/20 border-border/60 rounded-xl font-black text-xs"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">PHP</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-8 border-t border-border/60">
                    <span className="text-xs font-black text-foreground uppercase tracking-widest">Total Due</span>
                    <span className="text-3xl font-black text-blue-600 tracking-tighter">₱ {totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Expiry</p>
                  </div>
                  <p className="text-xs font-black text-foreground tracking-tight">
                    {dueDate ? `${new Date(dueDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}` : 'Standard (24 Hours)'}
                    {dueTime ? ` at ${dueTime}` : ''}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !amount}
                  className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-[0.2em] rounded-3xl shadow-2xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-3" />
                      Generating Link...
                    </>
                  ) : (
                    'Generate Payment Link'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results Display */}
            {result && (
              <Card className="border-2 border-emerald-500/20 bg-emerald-500/5 rounded-[2rem] p-8 animate-fade-in-up">
                <div className="flex items-center gap-3 text-emerald-600 mb-6">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <span className="font-black text-xs uppercase tracking-widest">Link Created Successfully</span>
                </div>

                <div className="space-y-4">
                  <div className="p-5 bg-white border border-emerald-500/10 rounded-2xl shadow-inner group">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Public Checkout URL</p>
                    <div className="flex items-center gap-3">
                      <code className="text-xs font-mono text-emerald-700 break-all flex-1 font-bold">
                        {String(result.payment_url || result.checkout_url || result.invoice_url)}
                      </code>
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-emerald-600 hover:bg-emerald-500/10 rounded-xl" onClick={() => copyToClipboard(String(result.payment_url || result.checkout_url || result.invoice_url))}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <div className="px-8 text-center space-y-6">
              <div className="flex justify-center items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Bank-Grade Security
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                Infrastructure secured by AES-256 encryption. Payments settled via BSP-regulated channels.
              </p>
            </div>
          </div>

        </form>
      </div>
    </Layout>
  );
}
