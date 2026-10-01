import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Power } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentChannel {
  id: string;
  name: string;
  currency: string;
  type: 'bank' | 'crypto' | 'digital';
  enabled: boolean;
  processingFeePercent: number;
  minAmount: number;
  maxAmount: number;
  countries: string[];
  lastUpdated: string;
}

export function PaymentChannelsTab() {
  const [channels, setChannels] = useState<PaymentChannel[]>([
    {
      id: 'bdo',
      name: 'BDO Bank Transfer',
      currency: 'PHP',
      type: 'bank',
      enabled: true,
      processingFeePercent: 2.5,
      minAmount: 100,
      maxAmount: 500000,
      countries: ['PH'],
      lastUpdated: '2026-10-02T10:00:00Z',
    },
    {
      id: 'metrobank',
      name: 'Metrobank Transfer',
      currency: 'PHP',
      type: 'bank',
      enabled: true,
      processingFeePercent: 2.5,
      minAmount: 100,
      maxAmount: 500000,
      countries: ['PH'],
      lastUpdated: '2026-10-02T10:00:00Z',
    },
    {
      id: 'usdt',
      name: 'USDT (ERC-20)',
      currency: 'USDT',
      type: 'crypto',
      enabled: true,
      processingFeePercent: 1.0,
      minAmount: 10,
      maxAmount: 100000,
      countries: ['Global'],
      lastUpdated: '2026-10-02T10:00:00Z',
    },
    {
      id: 'cc',
      name: 'Credit Card',
      currency: 'PHP',
      type: 'digital',
      enabled: false,
      processingFeePercent: 3.5,
      minAmount: 100,
      maxAmount: 100000,
      countries: ['PH', 'Global'],
      lastUpdated: '2026-10-01T15:30:00Z',
    },
    {
      id: 'gcash',
      name: 'GCash',
      currency: 'PHP',
      type: 'digital',
      enabled: true,
      processingFeePercent: 2.0,
      minAmount: 100,
      maxAmount: 50000,
      countries: ['PH'],
      lastUpdated: '2026-10-02T10:00:00Z',
    },
  ]);

  const handleToggle = (id: string) => {
    setChannels(
      channels.map((ch) =>
        ch.id === id ? { ...ch, enabled: !ch.enabled } : ch
      )
    );
    const channel = channels.find((ch) => ch.id === id);
    toast.success(`${channel?.name} ${channel?.enabled ? 'disabled' : 'enabled'}`);
  };

  const typeColors = {
    bank: 'bg-blue-50 text-blue-700 border-blue-200',
    crypto: 'bg-purple-50 text-purple-700 border-purple-200',
    digital: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Active Channels</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {channels.filter((ch) => ch.enabled).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Total Channels</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{channels.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Avg Fee</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {(channels.reduce((sum, ch) => sum + ch.processingFeePercent, 0) / channels.length).toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {channels.map((channel) => (
          <Card key={channel.id} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{channel.name}</CardTitle>
                  <p className="mt-1 text-xs text-slate-500">{channel.currency}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold border ${typeColors[channel.type]}`}
                >
                  {channel.type}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Processing Fee:</span>
                  <span className="font-medium text-slate-900">
                    {channel.processingFeePercent}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Min Amount:</span>
                  <span className="font-medium text-slate-900">{channel.minAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Max Amount:</span>
                  <span className="font-medium text-slate-900">
                    {channel.maxAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Available In:</span>
                  <span className="font-medium text-slate-900">
                    {channel.countries.join(', ')}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {channel.enabled ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">Active</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-500">Inactive</span>
                    </>
                  )}
                </div>
                <Button
                  onClick={() => handleToggle(channel.id)}
                  variant={channel.enabled ? 'destructive' : 'default'}
                  size="sm"
                  className="gap-2"
                >
                  <Power className="h-3 w-3" />
                  {channel.enabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
