import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Layout from '@/components/Layout';
import SiteContainer from '@/components/SiteContainer';
import { useMutation, useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Copy, Download, Share2, QrCode, Loader2, CheckCircle,
  AlertCircle, ChevronLeft, Smartphone, Eye, RotateCcw,
} from 'lucide-react';
import { APP_NAME } from '@/lib/brand';

interface AlipayQRResponse {
  success: boolean;
  error?: string;
  payment_method?: string;
  reference_id?: string;
  charge_id?: string;
  checkout_url?: string;
  status?: string;
  amount_php?: number;
  amount_cny?: number;
  qr_code?: string;
  qr_url?: string;
}

export default function AlipayQRPage() {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('100');
  const [description, setDescription] = useState('Payment via Alipay');
  const [referenceId, setReferenceId] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<AlipayQRResponse | null>(null);

  // Generate Alipay QR
  const generateQRMutation = useMutation({
    mutationFn: async () => {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Please enter a valid amount greater than 0');
      }

      const res = await client.apiCall.invoke({
        url: '/api/v1/magpie/alipay',
        method: 'POST',
        data: {
          amount: numAmount,
          description: description || 'Alipay Payment',
          reference_id: referenceId || undefined,
          customer_name: user?.name || user?.telegram_username || 'Customer',
        },
      });

      if (!res.data?.success) {
        throw new Error(res.data?.error || 'Failed to generate QR code');
      }

      return res.data;
    },
    onSuccess: (data) => {
      setGeneratedQR(data);
      setShowSuccessModal(true);
      toast.success('✅ Alipay QR code generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate QR code');
    },
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleCopyCheckoutUrl = () => {
    if (generatedQR?.checkout_url) {
      navigator.clipboard.writeText(generatedQR.checkout_url);
      toast.success('🔗 Checkout URL copied to clipboard');
    }
  };

  const handleShare = () => {
    if (generatedQR?.checkout_url) {
      if (navigator.share) {
        navigator.share({
          title: 'Alipay Payment',
          text: `Pay ₱${amount} via Alipay - ${description}`,
          url: generatedQR.checkout_url,
        });
      } else {
        handleCopyCheckoutUrl();
      }
    }
  };

  return (
    <Layout>
      <SiteContainer className="py-8">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-xs mb-4"
          >
            <ChevronLeft className="h-3 w-3 mr-1" /> Back to Dashboard
          </Button>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
              <Smartphone className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">Alipay QR Code</h1>
              <p className="text-slate-500 font-medium">Generate a self-hosted QR code for Alipay payments</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200/80 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Create Alipay Payment</CardTitle>
                <CardDescription>
                  Generate a QR code for Alipay payment. Amount will be automatically converted from PHP to CNY.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amount */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                    Amount (PHP) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-600 font-semibold">₱</span>
                    <Input
                      type="number"
                      placeholder="100"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-8 h-11 border-slate-200 focus:border-blue-400"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Minimum: ₱50 | This will be converted to CNY for Alipay processing
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                    Description
                  </Label>
                  <Textarea
                    placeholder="e.g., Order #12345, Product purchase"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-24 border-slate-200 focus:border-blue-400 resize-none"
                  />
                  <p className="text-xs text-slate-500">
                    This will appear in the payment details
                  </p>
                </div>

                {/* Reference ID */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                    Reference ID (Optional)
                  </Label>
                  <Input
                    type="text"
                    placeholder="e.g., order-12345"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    className="h-11 border-slate-200 focus:border-blue-400"
                  />
                  <p className="text-xs text-slate-500">
                    Leave blank to auto-generate a unique ID
                  </p>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={() => generateQRMutation.mutate()}
                  disabled={generateQRMutation.isPending || !amount}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  {generateQRMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating QR Code...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate Alipay QR Code
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-slate-200/80 bg-gradient-to-br from-blue-50 to-blue-50/50">
                <CardContent className="pt-6">
                  <p className="text-2xl font-semibold text-blue-700">{parseFloat(amount) || '0'}</p>
                  <p className="text-xs text-slate-600 mt-1">PHP to pay</p>
                </CardContent>
              </Card>
              <Card className="border-slate-200/80 bg-gradient-to-br from-red-50 to-red-50/50">
                <CardContent className="pt-6">
                  <p className="text-2xl font-semibold text-red-700">
                    {((parseFloat(amount) || 0) * 0.0137).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">CNY equivalent</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar - Generated QR */}
          <div className="lg:col-span-1">
            {generatedQR ? (
              <Card className="border-slate-200/80 bg-white shadow-sm sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    QR Code Ready
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Preview */}
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center h-48">
                    {generatedQR.qr_code ? (
                      <img
                        src={generatedQR.qr_code}
                        alt="Alipay QR Code"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">QR Code Image</p>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200/50">
                    <p className="text-xs font-semibold text-blue-900 uppercase">Reference</p>
                    <p className="text-sm font-mono text-blue-700 break-all">{generatedQR.reference_id}</p>
                  </div>

                  {/* Checkout URL */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase">Checkout Link</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyCheckoutUrl}
                        className="flex-1 text-xs h-9"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShare}
                        className="flex-1 text-xs h-9"
                      >
                        <Share2 className="h-3.5 w-3.5 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200/50">
                    <p className="text-xs font-semibold text-emerald-900">Status</p>
                    <p className="text-xs text-emerald-700 capitalize mt-1">{generatedQR.status || 'pending'}</p>
                  </div>

                  {/* Generate New */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSuccessModal(false)}
                    className="w-full text-xs h-9"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Generate New
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200/80 bg-gradient-to-br from-slate-50 to-slate-50/50 sticky top-24">
                <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                  <div className="h-16 w-16 rounded-xl bg-blue-100 flex items-center justify-center">
                    <QrCode className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">No QR Code Yet</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Fill in the form and click "Generate" to create your Alipay QR code
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SiteContainer>

      {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-[450px] bg-white rounded-2xl">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-emerald-500" />
            Payment Ready!
          </DialogTitle>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 uppercase font-semibold mb-2">Share This Link</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generatedQR?.checkout_url || ''}
                  readOnly
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded font-mono"
                />
                <Button
                  size="sm"
                  onClick={handleCopyCheckoutUrl}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-600 text-center">
              ✅ Your self-hosted Alipay QR code is ready. Share the link above with customers to collect payments.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
