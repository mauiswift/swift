import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import { client } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Camera, Upload, QrCode, Loader2, CheckCircle, AlertCircle,
  ScanLine, X, RefreshCw, Send, ShieldCheck, Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';

// ---------- EMVCo / QRPH TLV parser ----------
// Follows EMVCo QR Code Specification for Payment Systems v1.0 and BSP QRPH implementation.
interface QRPHData {
  merchantName: string;
  merchantCity: string;
  amount: string;
  currency: string;
  referenceNumber: string;
  raw: string;
  isQRPH: boolean;  // true if the QR data could be parsed as a valid QRPH/EMVCo payload
}

function parseTLV(data: string): Map<string, string> {
  const result = new Map<string, string>();
  let i = 0;
  while (i + 4 <= data.length) {
    const id = data.substring(i, i + 2);
    const lenStr = data.substring(i + 2, i + 4);
    const len = parseInt(lenStr, 10);
    if (isNaN(len) || i + 4 + len > data.length) break;
    const value = data.substring(i + 4, i + 4 + len);
    result.set(id, value);
    i += 4 + len;
  }
  return result;
}

function parseQRPH(raw: string): QRPHData | null {
  try {
    const tlv = parseTLV(raw);
    // EMVCo tag reference (per QRPH / BSP spec):
    // ID 53 = Transaction Currency (numeric ISO 4217; 608 = PHP)
    // ID 54 = Transaction Amount (optional; merchant may omit for open amount)
    // ID 58 = Country Code ("PH" for Philippines)
    // ID 59 = Merchant Name
    // ID 60 = Merchant City
    // ID 62 = Additional Data Field; sub-tags:
    //   05 = Reference Label (most common reference number field)
    //   01 = Bill Number (alternative reference used by some issuers)
    const merchantName = tlv.get('59') || '';
    const merchantCity = tlv.get('60') || '';
    const amount = tlv.get('54') || '';
    const currency = tlv.get('53') === '608' ? 'PHP' : (tlv.get('53') || '');

    // Parse reference number from Additional Data Field (tag 62).
    // Sub-tag 05 (Reference Label) is checked first; sub-tag 01 (Bill Number) is a fallback
    // used by some Philippine banks and e-wallets.
    let referenceNumber = '';
    const additionalData = tlv.get('62') || '';
    if (additionalData) {
      const subTlv = parseTLV(additionalData);
      referenceNumber = subTlv.get('05') || subTlv.get('01') || '';
    }

    // Consider it a valid QRPH if it contains at least one definitive EMVCo indicator:
    // country code 'PH' (tag 58) or currency code '608' (PHP, tag 53).
    // Merchant name alone is not sufficient as non-QRPH QR codes may also contain text.
    const isQRPH = tlv.get('58') === 'PH' || tlv.get('53') === '608';

    return { merchantName, merchantCity, amount, currency, referenceNumber, raw, isQRPH };
  } catch {
    return null;
  }
}

// ---------- Component ----------
export default function ScanQRPH() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const [mode, setMode] = useState<'idle' | 'camera' | 'upload'>('idle');
  const [scanning, setScanning] = useState(false);
  const [qrData, setQrData] = useState<QRPHData | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  // Clean up camera on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleQRFound = useCallback((raw: string) => {
    stopCamera();
    const parsed = parseQRPH(raw);
    if (parsed && parsed.isQRPH) {
      setQrData(parsed);
      if (parsed.amount) setAmount(parsed.amount);
      toast.success('QRPH decoded successfully!');
    } else {
      // Not a QRPH / EMVCo QR — store raw data with isQRPH=false so the UI can warn the user
      setQrData({ merchantName: '', merchantCity: '', amount: '', currency: 'PHP', referenceNumber: '', raw, isQRPH: false });
      toast.info('QR decoded. Please verify the data and enter the amount.');
    }
    setMode('idle');
  }, [stopCamera]);

  // Camera scanning loop
  const tick = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
    if (code) {
      handleQRFound(code.data);
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [handleQRFound]);

  const startCamera = useCallback(async () => {
    setMode('camera');
    setQrData(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setScanning(true);
        rafRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      toast.error('Camera access denied or not available.');
      setMode('idle');
    }
  }, [tick]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrData(null);
    setResult(null);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
      URL.revokeObjectURL(url);
      if (code) {
        handleQRFound(code.data);
      } else {
        toast.error('No QR code found in image. Please try a clearer photo.');
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast.error('Failed to load image.'); };
    img.src = url;
    // Reset input so same file can be re-selected
    e.target.value = '';
  }, [handleQRFound]);

  const handlePay = async () => {
    if (!qrData) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    setLoading(true);
    try {
      const res = await client.apiCall.invoke({
        url: '/api/v1/xend/pay-qrph',
        method: 'POST',
        data: {
          qr_data: qrData.raw,
          amount: amt,
          description: description || qrData.merchantName || 'QRPH payment',
          merchant_name: qrData.merchantName,
          reference_number: qrData.referenceNumber,
        },
      });
      if (res.data?.success) {
        setResult(res.data.data || res.data);
        toast.success(res.data.message || 'Payment sent!');
      } else {
        toast.error(res.data?.message || 'Payment failed');
      }
    } catch (err) {
      const message = (err as any)?.data?.detail || (err as Error)?.message || 'Payment failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    stopCamera();
    setMode('idle');
    setQrData(null);
    setAmount('');
    setDescription('');
    setResult(null);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            <QrCode className="h-6 w-6 text-blue-400" />
            Scan / Upload QRPH
          </h1>
          <p className="text-muted-foreground text-sm">
            Scan a merchant's QRPH code with your camera or upload an image to send payment.
          </p>
        </div>

        {/* Step 1 — Capture */}
        {!qrData && !result && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <ScanLine className="h-4 w-4 text-blue-400" />
                Step 1 — Capture QRPH
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mode !== 'camera' && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={startCamera}
                  >
                    <Camera className="h-6 w-6 text-blue-400" />
                    <span className="text-xs">Use Camera</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => { setMode('upload'); fileRef.current?.click(); }}
                  >
                    <Upload className="h-6 w-6 text-purple-400" />
                    <span className="text-xs">Upload Image</span>
                  </Button>
                </div>
              )}

              {/* Camera view */}
              {mode === 'camera' && (
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <video ref={videoRef} className="w-full max-h-72 object-cover" muted playsInline />
                  <canvas ref={canvasRef} className="hidden" />
                  {scanning && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="border-2 border-blue-400 rounded-lg w-48 h-48 opacity-60 animate-pulse" />
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => { stopCamera(); setMode('idle'); }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-foreground/70">
                    Point at a QRPH code to scan
                  </p>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 2 — Review & Pay */}
        {qrData && !result && (
          <Card className="bg-card border-border overflow-hidden rounded-[2rem] shadow-2xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
            <CardHeader className="pb-4">
              <CardTitle className="text-foreground text-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-black tracking-tight">
                  <div className="h-8 w-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-blue-400" />
                  </div>
                  Payment Details
                </div>
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground rounded-full" onClick={reset}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Rescan
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-8">
              {/* Branded Summary Card */}
              <div className="rounded-[1.5rem] bg-[#080E1A] border border-white/[0.08] p-6 space-y-4 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -mr-16 -mt-16" />

                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold">Merchant</span>
                  <p className="text-lg font-bold text-white flex items-center gap-2">
                    {qrData.merchantName || 'Generic QRPH Merchant'}
                    {qrData.isQRPH && <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold">City</span>
                    <p className="text-sm text-slate-300 font-medium">{qrData.merchantCity || 'Philippines'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold">Network</span>
                    <div className="pt-0.5">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] px-2 py-0">
                        {qrData.isQRPH ? 'QRPH Standard' : 'Generic QR'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {qrData.referenceNumber && (
                  <div className="space-y-1 pt-2 border-t border-white/[0.05]">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold">Reference</span>
                    <code className="text-xs text-blue-300 font-mono block mt-1">{qrData.referenceNumber}</code>
                  </div>
                )}
              </div>

              {/* Alert if not a QRPH */}
              {!qrData.isQRPH && (
                <div className="flex items-start gap-3 text-amber-400 text-xs bg-amber-400/5 border border-amber-400/10 rounded-2xl p-4">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">This QR code does not contain standard QRPH metadata. Please ensure you are sending the correct amount to the intended recipient.</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold pl-1">Amount to Pay (PHP)</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₱</div>
                    <Input
                      type="number" step="0.01" min="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-14 pl-8 bg-muted/50 border-border text-2xl font-black tracking-tight text-foreground placeholder:text-muted-foreground rounded-2xl focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold pl-1">Note (optional)</Label>
                  <Input
                    placeholder="What is this for?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-12 bg-muted/50 border-border text-sm text-foreground placeholder:text-muted-foreground rounded-2xl"
                  />
                </div>
              </div>

              <Button
                onClick={handlePay}
                disabled={loading || !amount}
                className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-[1.25rem] shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading
                  ? <><Loader2 className="h-5 w-5 mr-3 animate-spin" />Processing Gateway...</>
                  : <><Send className="h-5 w-5 mr-3" />Confirm & Send Payment</>}
              </Button>

              <p className="text-[10px] text-center text-slate-500 uppercase tracking-[0.2em]">
                <Lock className="h-3 w-3 inline mr-1 -mt-0.5" /> End-to-end encrypted session
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 3 — Result */}
        {result && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Payment Recorded
                </span>
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={reset}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> New Scan
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(result).map(([key, value]) => {
                if (value === null || value === undefined || key === 'success') return null;
                return (
                  <div key={key} className="space-y-0.5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{key.replace(/_/g, ' ')}</p>
                    <code className="text-sm text-foreground font-mono bg-muted px-2 py-1 rounded block break-all">
                      {String(value)}
                    </code>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
