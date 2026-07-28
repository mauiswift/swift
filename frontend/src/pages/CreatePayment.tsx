import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
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
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import SiteContainer from '@/components/SiteContainer';
import { APP_NAME } from '@/lib/brand';

// Expanded set of UI values; we'll normalize some to API channel names when sending
type PaymentMethodValue =
  | 'visa' | 'mastercard' | 'gcash' | 'maya' | 'grabpay'
  | 'card' | 'alipay' | 'wechat' | 'qrph' | 'va' | 'usdt';

type PaymentMethodOption = {
  value: PaymentMethodValue;
  label: string;
  logo: string;
};

const METHOD_OPTIONS: { value: PaymentMethodValue; label: string; logo: string }[] = [
  { value: 'visa', label: 'Visa', logo: '/logos/visa.svg' },
  { value: 'mastercard', label: 'Mastercard', logo: '/logos/mastercard.svg' },

  // canonical channels
  { value: 'card', label: 'Card (All Cards)', logo: '/logos/card.svg' },
  { value: 'gcash', label: 'GCash', logo: '/logos/gcash.svg' },
  { value: 'maya', label: 'Maya', logo: '/logos/maya.svg' },
  { value: 'grabpay', label: 'GrabPay', logo: '/logos/grab.svg' },
  { value: 'alipay', label: 'Alipay', logo: '/logos/alipay.svg' },
  { value: 'wechat', label: 'WeChat Pay', logo: '/logos/wechat.svg' },
  { value: 'qrph', label: 'QR PH', logo: '/logos/qrph.svg' },
  { value: 'va', label: 'Virtual Account', logo: '/logos/va.svg' },
  { value: 'usdt', label: 'USDT', logo: '/logos/tether.svg' },
];

// Generate a unique reference ID only once
const generateReferenceId = () => `REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

export default function CreatePayment() {
  const { user, permissions, isSuperAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Main Form State
  const [referenceId, setReferenceId] = useState('');
  const [paymentDetailMode, setPaymentDetailMode] = useState('total_only');
  const methodParam = searchParams.get('method')?.toLowerCase();
  const [amount, setAmount] = useState(searchParams.get('amount') || '');
  const [description, setDescription] = useState(searchParams.get('description') || '');
  const [enableMultiplePayments, setEnableMultiplePayments] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodValue[]>(() => {
    if (methodParam === 'alipay') return ['alipay'];
    if (methodParam === 'wechat') return ['wechat'];
    return ['visa', 'mastercard', 'gcash', 'maya'];
  });
  const [showManageMethods, setShowManageMethods] = useState(methodParam === 'alipay' || methodParam === 'wechat');

  // Optional / Advanced State
  const [customerName, setCustomerName] = useState(searchParams.get('customer_name') || '');
  const [customerEmail, setCustomerEmail] = useState(searchParams.get('customer_email') || '');
  const [shippingFee, setShippingFee] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [successUrl, setSuccessUrl] = useState('');
  const [cancelUrl, setCancelUrl] = useState('');

  const [apiKey, setApiKey] = useState(localStorage.getItem('payment_api_key') || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  // Initialize reference ID only once on mount
  useEffect(() => {
    setReferenceId(generateReferenceId());
  }, []);

  const togglePaymentMethod = (method: PaymentMethodValue) => {
    setPaymentMethods(current => {
      const next: PaymentMethodValue[] = current.includes(method)
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

  // Normalize UI selections to the API channel names the backend expects
  const uiToApiMethod = (m: PaymentMethodValue) => {
    if (m === 'visa' || m === 'mastercard') return 'card';
    // some UI values equal API values
    return m;
  };

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
        // normalize UI selections to API channel names:
        payment_methods: paymentMethods.map(uiToApiMethod),
        multiple_payments: enableMultiplePayments,
        expires_at: dueDate && dueTime ? `${dueDate}T${dueTime}:00Z` : undefined,
        success_url: successUrl || undefined,
        cancel_url: cancelUrl || undefined,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
            ...(apiKey.trim() ? { 'X-API-Key': apiKey.trim() } : {}),
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const data = await res.json();
          toast.error(data?.detail || data?.message || `Error ${res.status}`);
          setLoading(false);
          return;
        }

        const data = await res.json();
        const responseData = data?.data ?? data;

        if (data?.success) {
          setResult(responseData);
          toast.success('Payment link created successfully!');
        } else {
          toast.error(data?.message || 'Failed to create payment');
        }
        setLoading(false);
      } catch (fetchErr: unknown) {
        clearTimeout(timeoutId);
        if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
          toast.error('Request timeout. Please try again.');
        } else {
          toast.error('Failed to create payment link. Please try again.');
        }
        setLoading(false);
      }
    } catch (err: unknown) {
      toast.error('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getAbsoluteUrl = (url?: string | null) => {
    if (!url) return '';
    const s = String(url);
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    // Prepend current origin for relative paths
    try {
      const origin = window.location.origin;
      if (s.startsWith('/')) return `${origin}${s}`;
      return `${origin}/${s}`;
    } catch (e) {
      return s;
    }
  };

  const handleShare = async (url?: string | null) => {
    const absolute = getAbsoluteUrl(url);
    if (!absolute) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: APP_NAME, url: absolute });
        return;
      } catch (err) {
        // fall back to copying
      }
    }
    copyToClipboard(absolute);
    toast.success('Link copied for sharing');
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
      <SiteContainer className="py-12">
        {/* Header */}
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest mb-4 group">
            <ChevronLeft className="h-3 w-3 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">Create Payment Link</h1>
            <p className="text-slate-500 font-medium">Set up a shareable payment link to collect payments from customers</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">

          {/* LEFT COLUMN: FORM DETAILS */}
          <div className="space-y-6 animate-slide-in-up">

            {/* Order Details Card */}
            <div className="bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/60 rounded-2xl p-8 space-y-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-foreground">Order Details</h2>
                  <p className="text-xs text-slate-500 font-medium">Essential information about this payment</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>

              <div className="space-y-6">
                {/* Reference ID */}
                <div className="space-y-3">
                  <Label htmlFor="ref-id" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Reference ID <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="ref-id"
                      value={referenceId}
                      onChange={(e) => setReferenceId(e.target.value)}
                      placeholder="e.g. INV-2024-001"
                      className="h-12 bg-white border border-slate-200 rounded-xl px-4 text-base font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all flex-1"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 px-4 border-slate-200 text-slate-600 hover:bg-slate-100"
                      onClick={(e) => {
                        e.preventDefault();
                        setReferenceId(generateReferenceId());
                      }}
                      title="Generate new reference ID"
                    >
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">Unique identifier for tracking this transaction</p>
                </div>

                {/* Payment Details Mode */}
                <div className="space-y-4">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Payment Details <span className="text-red-500">*</span>
                  </Label>
                  <RadioGroup value={paymentDetailMode} onValueChange={setPaymentDetailMode} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { value: 'total_only', label: 'Fixed Total Only' },
                      { value: 'items', label: 'Line Itemized' },
                    ].map(opt => (
                      <div key={opt.value} className={`relative flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        paymentDetailMode === opt.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}>
                        <RadioGroupItem value={opt.value} id={`mode-${opt.value}`} className="text-blue-600" />
                        <Label htmlFor={`mode-${opt.value}`} className="text-sm font-semibold cursor-pointer text-foreground ml-3">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Amount Input */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Amount Due <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-3">
                    <Select defaultValue="php">
                      <SelectTrigger className="w-28 h-12 bg-white border border-slate-200 rounded-xl font-semibold px-4 focus:ring-2 focus:ring-blue-500/30">
                        <SelectValue placeholder="PHP" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="php">PHP ₱</SelectItem>
                        <SelectItem value="usd">USD $</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1 h-12 bg-white border border-slate-200 rounded-xl px-4 text-xl font-semibold tracking-tight focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                  <p className="text-xs text-red-500 font-medium">This field is required</p>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Description
                  </Label>
                  <Textarea
                    placeholder="Enter payment purpose for the customer..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[120px] bg-white border border-slate-200 rounded-xl px-4 py-3 resize-none text-sm leading-relaxed focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Multiple Payments Toggle */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-200/60 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">Enable Multiple Payments</span>
                  <Info className="h-4 w-4 text-slate-400 cursor-help" title="Allow this link to be paid multiple times by different customers" />
                </div>
                <p className="text-xs text-slate-600 font-medium">Allow this link to be paid multiple times</p>
              </div>
              <Switch checked={enableMultiplePayments} onCheckedChange={setEnableMultiplePayments} className="data-[state=checked]:bg-blue-600" />
            </div>

            {/* Accordion Sections */}
            <Accordion type="single" collapsible className="space-y-3">

              {/* Customer Details */}
              <AccordionItem value="customer" className="border border-slate-200/60 rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <AccordionTrigger className="hover:no-underline py-6 px-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4 w-full">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200/50 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="text-left space-y-0.5 flex-1">
                      <span className="text-sm font-semibold text-foreground block">Customer Details</span>
                      <span className="text-xs text-slate-500 font-medium">Pre-fill buyer information</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider border-slate-200 text-slate-500">Optional</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6 px-6 space-y-6 pt-4 border-t border-slate-200/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Customer Name</Label>
                      <Input
                        placeholder="e.g. John Doe"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="h-11 bg-white border border-slate-200 rounded-lg px-4 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Email Address</Label>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="h-11 bg-white border border-slate-200 rounded-lg px-4 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Advanced Settings */}
              <AccordionItem value="advanced" className="border border-slate-200/60 rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <AccordionTrigger className="hover:no-underline py-6 px-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4 w-full">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200/50 flex items-center justify-center flex-shrink-0">
                      <Settings2 className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="text-left space-y-0.5 flex-1">
                      <span className="text-sm font-semibold text-foreground block">Advanced Settings</span>
                      <span className="text-xs text-slate-500 font-medium">Expiry, redirects, and payment methods</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider border-slate-200 text-slate-500">Optional</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-8 px-6 space-y-10 pt-6 border-t border-slate-200/50">

                  {/* Due Date */}
                  <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Payment Due Date & Time</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Expiry Date</Label>
                        <div className="relative">
                          <Input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="h-11 bg-white border border-slate-200 rounded-lg pl-11 pr-4 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                          />
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Expiry Time</Label>
                        <div className="relative">
                          <Input
                            type="time"
                            value={dueTime}
                            onChange={(e) => setDueTime(e.target.value)}
                            className="h-11 bg-white border border-slate-200 rounded-lg pl-11 pr-4 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                          />
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Accepted Payment Methods</p>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="h-9 text-xs font-semibold uppercase tracking-wide rounded-lg border-slate-300 text-foreground hover:bg-slate-100"
                        onClick={() => setShowManageMethods(prev => !prev)}
                      >
                        {showManageMethods ? 'Done' : 'Manage'}
                      </Button>
                    </div>
                    <div className={`flex flex-wrap items-center gap-3 p-5 rounded-lg border transition-all ${showManageMethods ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                      {METHOD_OPTIONS.map((m: PaymentMethodOption) => {
                        const selected = paymentMethods.includes(m.value);
                        return (
                          <button
                            key={m.value}
                            type="button"
                            disabled={!showManageMethods}
                            onClick={() => togglePaymentMethod(m.value)}
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 transition-all text-xs font-semibold uppercase tracking-wide ${
                              selected
                                ? 'border-blue-400 bg-blue-100 text-blue-700'
                                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <img src={m.logo} alt={m.label} className="h-4 w-4 object-contain" />
                            <span>{m.label}</span>
                            {selected && <Check className="h-3.5 w-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                    {!showManageMethods && paymentMethods.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-600 font-medium">Selected methods:</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {paymentMethods.map(method => (
                            <Badge key={method} variant="secondary" className="text-xs">{METHOD_OPTIONS.find(m => m.value === method)?.label ?? method}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Redirect URLs */}
                  <div className="space-y-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Payment Redirect URLs</p>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Success Redirect URL</Label>
                        <Input
                          placeholder="https://yourstore.com/checkout/success"
                          value={successUrl}
                          onChange={(e) => setSuccessUrl(e.target.value)}
                          className="h-11 bg-white border border-slate-200 rounded-lg px-4 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Failure Redirect URL</Label>
                        <Input
                          placeholder="https://yourstore.com/checkout/failed"
                          value={cancelUrl}
                          onChange={(e) => setCancelUrl(e.target.value)}
                          className="h-11 bg-white border border-slate-200 rounded-lg px-4 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* RIGHT COLUMN: SUMMARY SECTION */}
          <div className="space-y-6 sticky top-24 animate-slide-in-right">
            {/* Summary Card */}
            <Card className="border border-slate-200 bg-gradient-to-br from-white to-blue-50/30 shadow-lg rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-white">Payment Summary</CardTitle>
              </div>
              <CardContent className="px-6 py-8 space-y-8">
                <div className="space-y-5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Subtotal</span>
                    <span className="text-foreground font-semibold text-base">₱ {parseFloat(amount || '0').toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <span className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Shipping Fee</span>
                    <div className="relative flex-shrink-0">
                      <Input
                        type="number"
                        value={shippingFee}
                        onChange={(e) => setShippingFee(e.target.value)}
                        className="h-10 w-28 text-right pr-8 bg-white border border-slate-200 rounded-lg font-semibold text-sm focus:ring-2 focus:ring-blue-500/30"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">PHP</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-5 border-t border-slate-200">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Total Due</span>
                    <span className="text-4xl font-semibold text-blue-600 tracking-tighter">₱ {totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Estimated Expiry</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {dueDate ? `${new Date(dueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Standard (24 Hours)'}
                    {dueTime ? ` · ${dueTime}` : ''}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !amount}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm uppercase tracking-wide rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <span>Generate Link</span>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results Display */}
            {result && (
              <Card className="border-2 border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50/50 rounded-2xl p-6 shadow-lg animate-fade-in-up">
                <div className="flex items-center gap-3 text-emerald-700 mb-6">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <span className="font-semibold text-sm uppercase tracking-wider">Link Created Successfully</span>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-white border border-emerald-200/60 rounded-lg shadow-sm group">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Public Checkout URL</p>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const raw = String(result.checkout_url || result.payment_url || result.invoice_url || '');
                        const absolute = getAbsoluteUrl(raw);
                        const showShare = Boolean(raw);
                        return (
                          <>
                            <code className="text-xs font-mono text-emerald-700 break-all flex-1 font-semibold">{absolute}</code>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-9 w-9 text-emerald-600 hover:bg-emerald-100 rounded-lg" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  copyToClipboard(absolute);
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              {showShare && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-9 w-9 text-emerald-600 hover:bg-emerald-100 rounded-lg" 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleShare(raw);
                                  }}
                                >
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Security Footer */}
            <div className="px-6 py-6 text-center space-y-3 bg-slate-50/80 border border-slate-200/50 rounded-lg">
              <div className="flex justify-center items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Bank-Grade Security
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                All payments encrypted with AES-256. Processed through BSP-regulated channels.
              </p>
            </div>
          </div>

        </form>
      </SiteContainer>
    </Layout>
  );
}
