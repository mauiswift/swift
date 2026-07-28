import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { client } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  QrCode,
  Search,
  Download,
  Plus,
  Calendar as CalendarIcon,
  X,
  Loader2,
  CheckCircle,
  Zap,
  Copy,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { APP_NAME } from '@/lib/brand';

interface QRCodeData {
  id: number;
  external_id: string;
  amount: number;
  description: string;
  qr_code_url: string;
  created_at: string;
  status: string;
}

export default function QRCodesPage() {
  const { user } = useAuth();
  const [qrcodes, setQrcodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('single');

  // Form state
  const [formLoading, setFormLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [qrType, setQrType] = useState('fixed');
  const [amount, setAmount] = useState('');

  const fetchQRCodes = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await client.entities.transactions.query({
        query: { transaction_type: 'qr_code' },
        sort: '-created_at',
      });
      setQrcodes(res.data?.items || []);
    } catch (err) {
      console.error('Failed to fetch QR codes:', err);
      toast.error('Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchQRCodes();
  }, [fetchQRCodes]);

  const filteredQRCodes = useMemo(() => {
    return qrcodes.filter((qr) => {
      const matchesSearch = qr.external_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          qr.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const date = new Date(qr.created_at);
      const matchesDate = (!dateRange.from || date >= dateRange.from) &&
                         (!dateRange.to || date <= dateRange.to);

      return matchesSearch && matchesDate;
    });
  }, [qrcodes, searchTerm, dateRange.from?.getTime?.(), dateRange.to?.getTime?.()]);

  const handleCreate = async () => {
    if (!title || !referenceId || (qrType === 'fixed' && !amount)) {
      toast.error('Please fill in all required fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (qrType === 'fixed' && (isNaN(numAmount) || numAmount <= 0)) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    setFormLoading(true);
    try {
      const res = await client.apiCall.invoke({
        url: '/api/v1/xend/create-qr-code',
        method: 'POST',
        data: {
          amount: numAmount || 0,
          description: title,
          external_id: referenceId,
          merchant_name: APP_NAME,
          payment_methods: ['qrph'],
        },
      });

      if (res.data?.success) {
        toast.success('QR Code created successfully!');
        setIsModalOpen(false);
        // Reset form
        setTitle('');
        setReferenceId('');
        setAmount('');
        setQrType('fixed');
        fetchQRCodes();
      } else {
        toast.error(res.data?.message || 'Failed to create QR code');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create QR code');
    } finally {
      setFormLoading(false);
    }
  };

  const getQRImageUrl = (content: string) => {
    if (!content) return '';
    if (content.startsWith('http') || content.startsWith('data:')) return content;
    if (content.trim().startsWith('<svg')) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(content)}`;
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(content)}`;
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
              <QrCode className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">QR Codes</h1>
              <p className="text-slate-500 font-medium text-sm">Create and manage payment QR codes for instant transactions</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-transparent border-b border-slate-200 rounded-none h-auto p-0 gap-8">
            <TabsTrigger
              value="single"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 py-3 text-sm font-semibold data-[state=active]:text-blue-600 data-[state=active]:shadow-none text-slate-600 hover:text-slate-900 transition-colors"
            >
              Single QR Codes
            </TabsTrigger>
            <TabsTrigger
              value="batch"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 py-3 text-sm font-semibold data-[state=active]:text-blue-600 data-[state=active]:shadow-none text-slate-600 hover:text-slate-900 transition-colors"
            >
              Batch QR Codes
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by Reference ID or Description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-11 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-11 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd')}
                    </>
                  ) : (
                    format(dateRange.from, 'MMM dd, yyyy')
                  )
                ) : (
                  'Date Range'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            className="h-11 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
            disabled
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Grid */}
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {/* Create Button Card */}
            <Card
              className="border-2 border-dashed border-blue-300/50 bg-gradient-to-br from-blue-50/50 to-purple-50/30 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group"
              onClick={() => setIsModalOpen(true)}
            >
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-sm font-semibold text-foreground">Create QR Code</p>
                <p className="text-xs text-slate-500 mt-1">Add new payment QR</p>
              </div>
            </Card>

            {/* QR Cards */}
            {loading ? (
              <div className="col-span-full">
                <LoadingSpinner message="Loading QR codes" />
              </div>
            ) : filteredQRCodes.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <QrCode className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No QR codes found</h3>
                <p className="text-slate-500 mb-6">Create your first QR code to get started</p>
                <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  <Plus className="h-4 w-4 mr-2" />
                  Create QR Code
                </Button>
              </div>
            ) : (
              filteredQRCodes.map((qr) => (
                <Card
                  key={qr.id}
                  className="bg-white border border-slate-200/60 p-5 flex flex-col items-center text-center gap-3 group hover:shadow-lg hover:border-slate-300/80 transition-all"
                >
                  {/* QR Image */}
                  <div className="h-28 w-28 rounded-lg bg-slate-50 border border-slate-200/50 flex items-center justify-center p-2 group-hover:shadow-md transition-shadow overflow-hidden">
                    <img
                      src={getQRImageUrl(qr.qr_code_url)}
                      alt="QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Details */}
                  <div className="space-y-2 w-full overflow-hidden">
                    <p className="text-xs font-semibold text-slate-900 truncate">{qr.description || 'Unnamed QR'}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{qr.external_id || `#${qr.id}`}</p>

                    {/* Badge */}
                    <div className="pt-1 flex justify-center">
                      {qr.amount && qr.amount > 0 ? (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs font-semibold px-2.5 py-1 hover:bg-blue-100">
                          <Zap className="h-3 w-3 mr-1" />
                          Fixed: ₱{qr.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </Badge>
                      ) : (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs font-semibold px-2.5 py-1 hover:bg-purple-100">
                          Open Amount
                        </Badge>
                      )}
                    </div>

                    {/* Date */}
                    <p className="text-[10px] text-slate-400 mt-2">
                      {format(new Date(qr.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>

                  {/* Copy Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full h-8 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(qr.external_id);
                      toast.success('Reference ID copied!');
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1.5" />
                    Copy ID
                  </Button>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Create Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[450px] bg-white border border-slate-200/80 rounded-2xl shadow-xl p-0 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
              <DialogTitle className="text-2xl font-semibold text-white flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <QrCode className="h-6 w-6" />
                </div>
                Create QR Code
              </DialogTitle>
              <p className="text-blue-100 text-sm mt-1 font-medium">Set up a new payment QR code</p>
            </div>

            {/* Form Content */}
            <div className="space-y-6 p-8">
              {/* Title / Description */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Title / Description <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 255))}
                  placeholder="e.g. Blossom Cafe - Main Branch"
                  className="h-11 bg-white border border-slate-200 rounded-lg px-4 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-sm"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Describe this QR code for reference</p>
                  <span className="text-right text-[11px] text-slate-400 font-medium">{title.length}/255</span>
                </div>
              </div>

              {/* Reference ID */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Reference ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value.slice(0, 255))}
                  placeholder="e.g. QR-CAFE-001"
                  className="h-11 bg-white border border-slate-200 rounded-lg px-4 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-sm"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Unique identifier for this QR</p>
                  <span className="text-right text-[11px] text-slate-400 font-medium">{referenceId.length}/255</span>
                </div>
              </div>

              {/* QR Type */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  QR Type <span className="text-red-500">*</span>
                </Label>
                <Select value={qrType} onValueChange={setQrType}>
                  <SelectTrigger className="h-11 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border border-slate-200">
                    <SelectItem value="fixed" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        Fixed Payment Value - Dynamic QR
                      </div>
                    </SelectItem>
                    <SelectItem value="open" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-purple-600" />
                        Open Amount - Static QR
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  {qrType === 'fixed'
                    ? 'Customer scans to pay a fixed amount'
                    : 'Customer enters amount after scanning'}
                </p>
              </div>

              {/* Amount (Conditional) */}
              {qrType === 'fixed' && (
                <div className="space-y-3 p-4 rounded-lg bg-blue-50/50 border border-blue-200/50">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Payment Amount <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">₱</span>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || parseFloat(val) >= 0) {
                          setAmount(val);
                        }
                      }}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="h-11 bg-white border border-slate-200 rounded-lg pl-8 pr-4 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-sm font-semibold"
                    />
                  </div>
                  <p className="text-xs text-slate-500">Amount customers will pay when scanning</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <DialogFooter className="bg-slate-50/80 border-t border-slate-200 px-8 py-4 flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="h-11 px-6 rounded-lg font-semibold text-slate-700 hover:bg-slate-200/50 transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={formLoading || !title || !referenceId || (qrType === 'fixed' && !amount)}
                className="h-11 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Create QR Code</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

function Info({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-full w-full"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    </div>
  );
}
