import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentEvents } from '@/hooks/usePaymentEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, QrCode, LinkIcon, Plus, Loader2, CheckCircle, Copy, ExternalLink, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';

const tabConfig = {
  invoice: { icon: <FileText className="h-4 w-4" />, label: 'Invoice', color: 'text-blue-400' },
  qr_code: { icon: <QrCode className="h-4 w-4" />, label: 'QR Code', color: 'text-purple-400' },
  payment_link: { icon: <LinkIcon className="h-4 w-4" />, label: 'Payment Link', color: 'text-cyan-400' },
  checkout_session: { icon: <CreditCard className="h-4 w-4" />, label: 'Checkout Session', color: 'text-emerald-400' },
};

export default function PaymentsHub() {
  const { user, permissions, isSuperAdmin } = useAuth();
  const [tab, setTab] = useState('invoice');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('payment_api_key') || '');
  const [successUrl, setSuccessUrl] = useState('');
  const [cancelUrl, setCancelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const paymentEventsOptions = useMemo(
    () => ({ enabled: !!user }),
    [user]
  );
  usePaymentEvents(paymentEventsOptions);
  const canAccessPayments = Boolean(isSuperAdmin || permissions?.can_manage_payments);

  useEffect(() => {
    if (apiKey.trim()) {
      localStorage.setItem('payment_api_key', apiKey.trim());
    }
  }, [apiKey]);

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCustomerName('');
    setCustomerEmail('');
    setSuccessUrl('');
    setCancelUrl('');
    setResult(null);
  };

  const buildPayload = () => {
    const value = parseFloat(amount);

    if (tab === 'invoice') {
      return {
        endpoint: '/api/v1/magpie/create-invoice',
        payload: { amount: value, description, customer_name: customerName, customer_email: customerEmail },
      };
    }

    if (tab === 'qr_code') {
      return {
        endpoint: '/api/v1/magpie/create-qr-code',
        payload: { amount: value, description },
      };
    }

    if (tab === 'payment_link') {
      return {
        endpoint: '/api/v1/magpie/create-payment-link',
        payload: { amount: value, description, customer_name: customerName, customer_email: customerEmail },
      };
    }

    return {
      endpoint: '/api/v1/magpie/checkout/sessions',
      payload: {
        amount: value,
        payment_method_types: ['card', 'gcash', 'maya'],
        line_items: [{ name: description || 'Payment', amount: Math.round(value * 100), quantity: 1 }],
        mode: 'payment',
        success_url: successUrl || `${window.location.origin}/magpie-success`,
        cancel_url: cancelUrl || `${window.location.origin}/`,
        currency: 'php',
        customer_email: customerEmail,
        description,
      },
    };
  };

  const handleCreate = async () => {
    if (!canAccessPayments) {
      toast.error('You do not have permission to create payments.');
      return;
    }

    const value = parseFloat(amount);
    if (Number.isNaN(value) || value <= 0) {
      toast.error('Enter a valid amount greater than zero.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { endpoint, payload } = buildPayload();
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
      if (!res.ok) {
        toast.error(data?.detail || data?.message || `Error ${res.status}`);
        return;
      }

      if (!data?.success) {
        toast.error(data?.message || 'Payment creation failed.');
        return;
      }

      setResult(data.data || data);
      toast.success(data.message || 'Payment created successfully!');
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Failed to create payment.');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleShare = async (url?: string, title?: string, text?: string) => {
    try {
      const shareUrl = url || (result && (result.payment_url || result.checkout_url || result.invoice_url || result.payment_link_url)) as string;
      const shareTitle = title || `${window.location.hostname} - Payment`;
      const shareText = text || description || 'Complete payment';
      if (!shareUrl) {
        toast.error('No URL available to share');
        return;
      }
      if ((navigator as any).share) {
        await (navigator as any).share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Checkout link copied to clipboard');
    } catch (e) {
      toast.error('Unable to share link');
    }
  };

  if (!canAccessPayments) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto rounded-3xl border border-red-200 bg-red-50/80 p-10 text-center shadow-sm">
          <h1 className="text-3xl font-semibold text-red-700">Payments Access Restricted</h1>
          <p className="mt-4 text-sm text-red-600">You need payment management permission to use the Payments Hub.</p>
        </div>
      </Layout>
    );
  }

  const activeTab = tabConfig[tab];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payments Hub</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Create invoices, payment links, QR codes, or checkout sessions for your customers in one place.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted p-4 text-sm text-slate-400">
            Active mode: <span className="font-semibold text-foreground">{activeTab.label}</span>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(value) => { setTab(value); setResult(null); }}>
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 rounded-3xl border border-border bg-muted p-2">
            {Object.entries(tabConfig).map(([key, cfg]) => (
              <TabsTrigger key={key} value={key} className="flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground">
                <span className={cfg.color}>{cfg.icon}</span>
                {cfg.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Create {activeTab.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="text-muted-foreground">Amount (PHP)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="100.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-2 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {(tab === 'invoice' || tab === 'qr_code' || tab === 'payment_link') ? (
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <Textarea
                      placeholder="Payment description..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-2 bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none"
                      rows={3}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Session description</Label>
                      <Textarea
                        placeholder="Checkout session description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-2 bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Success URL</Label>
                      <Input
                        placeholder="https://swiftpay.site/magpie-success"
                        value={successUrl}
                        onChange={(e) => setSuccessUrl(e.target.value)}
                        className="mt-2 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-2">If empty, defaults to <code>{`${window.location.origin}/magpie-success`}</code>.</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Cancel URL</Label>
                      <Input
                        placeholder="https://swiftpay.site/cancel"
                        value={cancelUrl}
                        onChange={(e) => setCancelUrl(e.target.value)}
                        className="mt-2 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-2">If empty, this defaults to your app root.</p>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground">Magpie / SwiftPay API Key (optional)</Label>
                  <Input
                    placeholder="swiftpay_live_..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="mt-2 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-2">Optional key for direct Magpie auth. Leave blank to use the session token.</p>
                </div>

                {(tab === 'invoice' || tab === 'payment_link') && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">Customer Name</Label>
                      <Input
                        placeholder="John Doe"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="mt-2 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Customer Email</Label>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="mt-2 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button onClick={handleCreate} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : <><Plus className="h-4 w-4 mr-2" />Create payment</>}
                  </Button>
                  <Button variant="secondary" onClick={resetForm} disabled={loading} className="border-muted text-foreground">
                    Reset form
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border overflow-hidden flex flex-col shadow-2xl shadow-black/20">
              <CardHeader className="bg-muted/30 border-b border-border/50">
                <CardTitle className="text-foreground flex items-center justify-between">
                  <span>Checkout Preview</span>
                  {result && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      Active Link
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-6">
                {!result ? (
                  <div className="text-center py-24 flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[2.5rem] bg-muted/10 opacity-60">
                    <div className="h-20 w-20 bg-muted/40 rounded-full flex items-center justify-center mb-6">
                      <CreditCard className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-semibold text-lg tracking-tight">Awaiting Creation</p>
                    <p className="text-sm text-slate-500 mt-2 max-w-[240px]">Configure your payment on the left to generate a professional checkout experience.</p>
                  </div>
                ) : (
                  <div className="space-y-8 animate-fade-in-scale">
                    {/* Branded "Mini Checkout" look */}
                    <div className="rounded-[2.5rem] border border-white/[0.1] bg-slate-950 p-8 shadow-2xl overflow-hidden relative group transition-all hover:border-blue-500/30">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[80px] -mr-24 -mt-24 group-hover:bg-blue-600/20 transition-all duration-700" />

                      <div className="flex items-center gap-3 mb-8">
                        <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-sm font-black tracking-widest text-white uppercase">{APP_NAME} <span className="text-blue-400 font-medium ml-1">Pay</span></span>
                      </div>

                      <div className="space-y-6 relative z-10">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold mb-2">Total Amount Due</p>
                          <p className="text-4xl font-black tracking-tighter text-white">₱ {parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                        </div>

                        <div className="rounded-3xl bg-white/[0.03] border border-white/[0.05] p-5 space-y-4 backdrop-blur-sm shadow-inner">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-medium">Recipient</span>
                            <span className="text-slate-100 font-bold tracking-tight">{user?.name || 'SwiftPay Philippines'}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs pt-3 border-t border-white/[0.05]">
                            <span className="text-slate-500 font-medium">Type</span>
                            <span className="text-slate-100 font-bold tracking-tight capitalize">{activeTab.label}</span>
                          </div>
                        </div>

                        {/* Primary Action */}
                        {(result.payment_url || result.checkout_url || result.invoice_url || result.payment_link_url) && (
                          <div className="pt-2 flex gap-3">
                            <Button asChild size="lg" className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-lg shadow-xl shadow-blue-600/20 transition-all hover:shadow-blue-600/40">
                              <a href={(result.payment_url || result.checkout_url || result.invoice_url || result.payment_link_url) as string} target="_blank" rel="noopener noreferrer">
                                Complete Payment <ArrowRight className="h-5 w-5 ml-3" />
                              </a>
                            </Button>
                            <Button variant="outline" size="sm" className="h-14 px-4 rounded-2xl" onClick={() => handleShare()}>
                              <ExternalLink className="h-4 w-4 mr-2" /> Share
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Transaction Metadata</p>
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/50" />
                      </div>
                      <div className="grid gap-3">
                        {Object.entries(result).map(([key, value]) => {
                          if (!value || key === 'success' || key === 'message') return null;
                          const stringValue = String(value);
                          const isUrl = stringValue.startsWith('http');
                          return (
                            <div key={key} className="group relative">
                              <div className="flex items-center space-x-2 bg-muted/30 hover:bg-muted/50 p-3 rounded-2xl border border-border/40 hover:border-blue-500/30 transition-all duration-300">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mb-1 truncate">{key.replace(/_/g, ' ')}</p>
                                  {isUrl ? (
                                    <a href={stringValue} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-blue-400 hover:text-blue-300 font-medium underline-offset-4 hover:underline">
                                      {stringValue}
                                    </a>
                                  ) : (
                                    <p className="truncate text-xs font-mono text-foreground font-medium">{stringValue}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all" onClick={() => copyText(stringValue)}>
                                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                                  </Button>
                                  {isUrl && (
                                    <div className="flex items-center gap-2">
                                      <a href={stringValue} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all">
                                        <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                                      </a>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all" onClick={() => handleShare(stringValue)}>
                                        <ExternalLink className="h-3.5 w-3.5 text-slate-400 rotate-45" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </Tabs>
      </div>
    </Layout>
  );
}
