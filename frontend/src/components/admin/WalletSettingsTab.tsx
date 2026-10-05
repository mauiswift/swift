import React, { useState } from 'react';
import { adminApiService } from '@/lib/admin-api-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function WalletSettingsTab() {
  const [settings, setSettings] = useState({
    depositCurrencies: 'PHP, USDT, KRW',
    maxDepositAmount: '1000000',
    minDepositAmount: '100',
    depositFeePercent: '2.5',
    withdrawalFeePercent: '2.0',
    settlementFeePercent: '1.0',
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await adminApiService.updateWalletSettings({
        depositCurrencies: settings.depositCurrencies.split(',').map((c) => c.trim()),
        maxDepositAmount: parseFloat(settings.maxDepositAmount),
        minDepositAmount: parseFloat(settings.minDepositAmount),
        depositFeePercent: parseFloat(settings.depositFeePercent),
        withdrawalFeePercent: parseFloat(settings.withdrawalFeePercent),
        settlementFeePercent: parseFloat(settings.settlementFeePercent),
      });

      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to save settings');
      }
      toast.success('Wallet settings saved successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Wallet Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Accepted Deposit Currencies (comma-separated)
            </label>
            <Input
              value={settings.depositCurrencies}
              onChange={(e) => setSettings({ ...settings, depositCurrencies: e.target.value })}
              placeholder="PHP, USDT, KRW"
            />
            <p className="mt-1 text-xs text-slate-500">e.g., PHP, USDT, KRW</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Min Deposit Amount
              </label>
              <Input
                type="number"
                value={settings.minDepositAmount}
                onChange={(e) =>
                  setSettings({ ...settings, minDepositAmount: e.target.value })
                }
                className="font-numeric"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Max Deposit Amount
              </label>
              <Input
                type="number"
                value={settings.maxDepositAmount}
                onChange={(e) =>
                  setSettings({ ...settings, maxDepositAmount: e.target.value })
                }
                className="font-numeric"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="mb-4 font-semibold text-slate-900">Fee Configuration</h3>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Deposit Fee (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.depositFeePercent}
                  onChange={(e) =>
                    setSettings({ ...settings, depositFeePercent: e.target.value })
                  }
                  className="font-numeric"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Withdrawal Fee (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.withdrawalFeePercent}
                  onChange={(e) =>
                    setSettings({ ...settings, withdrawalFeePercent: e.target.value })
                  }
                  className="font-numeric"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Settlement Fee (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.settlementFeePercent}
                  onChange={(e) =>
                    setSettings({ ...settings, settlementFeePercent: e.target.value })
                  }
                  className="font-numeric"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-700 gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
