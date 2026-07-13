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
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { APP_NAME } from '@/lib/brand';

interface QRCodeData {
  id: number;
  external_id: string;
  amount: number;
  description: string;
  qr_code_url: string; // This will store the content if not a full URL
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
  }, [qrcodes, searchTerm, dateRange]);

  const handleCreate = async () => {
    if (!title || !referenceId || (qrType === 'fixed' && !amount)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setFormLoading(true);
    try {
      const res = await client.apiCall.invoke({
        url: '/api/v1/xend/create-qr-code',
        method: 'POST',
        data: {
          amount: parseFloat(amount) || 0,
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
    if (content.startsWith('http')) return content;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(content)}`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">QR Codes</h1>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 gap-6">
              <TabsTrigger
                value="single"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 py-2 text-sm font-medium"
              >
                Single QR Codes
              </TabsTrigger>
              <TabsTrigger
                value="batch"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 py-2 text-sm font-medium"
              >
                Batch QR Codes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Reference ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-card border-border text-slate-600">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'MM/dd/yyyy')} - {format(dateRange.to, 'MM/dd/yyyy')}
                    </>
                  ) : (
                    format(dateRange.from, 'MM/dd/yyyy')
                  )
                ) : (
                  'Select date range'
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

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">0 selected</span>
            <Button variant="outline" size="sm" className="bg-card border-border text-slate-400" disabled>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {/* Create Button Card */}
          <Card
            className="border-2 border-dashed border-border bg-card/70 hover:bg-muted/40 cursor-pointer transition-colors flex flex-col items-center justify-center p-6 min-h-[220px]"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="h-8 w-8 text-blue-600 mb-2" />
            <p className="text-xs font-bold text-blue-600 text-center">Create Single<br />QR Code</p>
          </Card>

          {/* QR Cards */}
          {loading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <Card key={i} className="bg-card border-border p-4 flex flex-col items-center gap-3 animate-pulse min-h-[220px]">
                <div className="h-24 w-24 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-4 w-12 bg-muted rounded-full" />
                <div className="h-2 w-16 bg-muted rounded" />
              </Card>
            ))
          ) : (
            filteredQRCodes.map((qr) => (
              <Card key={qr.id} className="bg-card border-border p-4 flex flex-col items-center text-center gap-2 min-h-[220px] group hover:shadow-md transition-shadow relative">
                <div className="h-24 w-24 mb-2">
                   <img
                     src={getQRImageUrl(qr.qr_code_url)}
                     alt="QR Code"
                     className="w-full h-full object-contain"
                   />
                </div>
                <div className="space-y-1 w-full overflow-hidden">
                  <p className="text-[10px] text-slate-400 font-mono truncate">{qr.external_id || `#${qr.id}`}</p>
                  <p className="text-[10px] font-bold text-foreground truncate">{qr.description || 'Clock Shop'}</p>
                  <div className="pt-1">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200 text-[10px] px-2 py-0 h-4">
                      Fixed
                    </Badge>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">
                    {format(new Date(qr.created_at), 'MMMM dd, yyyy')}
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Create Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white border-none rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Create QR Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">Title / Description *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 255))}
                  placeholder="Blossom Cafe Manila"
                  className="bg-muted/20 border-border h-11"
                />
                <p className="text-right text-[10px] text-slate-400">{title.length}/255</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">Reference ID *</Label>
                <Input
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value.slice(0, 255))}
                  placeholder="Your reference number"
                  className="bg-muted/20 border-border h-11"
                />
                <p className="text-right text-[10px] text-slate-400">{referenceId.length}/255</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  QR Type * <Info className="h-3 w-3 text-slate-400" />
                </Label>
                <Select value={qrType} onValueChange={setQrType}>
                  <SelectTrigger className="h-11 bg-muted/20 border-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed payment value - Dynamic QR</SelectItem>
                    <SelectItem value="open">Open amount - Static QR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {qrType === 'fixed' && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500">Amount *</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="h-11 bg-muted/20 border-border pl-10 font-bold"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">PHP</span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="sm:justify-center gap-3 mt-4">
              <Button
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="h-11 px-8 rounded-lg font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={formLoading || !title || !referenceId || (qrType === 'fixed' && !amount)}
                className="h-11 px-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
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
