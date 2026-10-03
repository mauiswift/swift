import React, { useState } from 'react';
import { adminApiService } from '@/lib/admin-api-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export function PlatformSettingsTab() {
  const [settings, setSettings] = useState({
    collectionCurrencies: 'PHP, USDT, KRW',
    systemFeePercent: '0.4',
    additionalFeePercent: '0',
    totalFeePercent: '0.5',
    vipGoldFeePercent: '0.3',
    maintenanceMode: false,
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await adminApiService.updatePlatformSettings({
        collectionCurrencies: settings.collectionCurrencies.split(',').map((c) => c.trim()),
        systemFeePercent: parseFloat(settings.systemFeePercent),
        additionalFeePercent: parseFloat(settings.additionalFeePercent),
        totalFeePercent: parseFloat(settings.totalFeePercent),
        vipGoldFeePercent: parseFloat(settings.vipGoldFeePercent),
        maintenanceMode: settings.maintenanceMode,
      });

      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to save settings');
      }
      toast.success('Platform settings saved');
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
          <CardTitle>System Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Collection Currencies (comma-separated)
            </label>
            <Input
              value={settings.collectionCurrencies}
              onChange={(e) =>
                setSettings({ ...settings, collectionCurrencies: e.target.value })
              }
            />
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="mb-4 font-semibold text-slate-900">Fee Structure</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  System Fee (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.systemFeePercent}
                  onChange={(e) =>
                    setSettings({ ...settings, systemFeePercent: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Additional Fee (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.additionalFeePercent}
                  onChange={(e) =>
                    setSettings({ ...settings, additionalFeePercent: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Total Fee (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.totalFeePercent}
                  onChange={(e) =>
                    setSettings({ ...settings, totalFeePercent: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  VIP Gold Fee (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.vipGoldFeePercent}
                  onChange={(e) =>
                    setSettings({ ...settings, vipGoldFeePercent: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-4 border border-amber-200">
              <input
                type="checkbox"
                id="maintenance"
                checked={settings.maintenanceMode}
                onChange={(e) =>
                  setSettings({ ...settings, maintenanceMode: e.target.checked })
                }
                className="h-4 w-4"
              />
              <label htmlFor="maintenance" className="flex-1 text-sm font-medium text-amber-900">
                Maintenance Mode (pauses public access)
              </label>
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
