import React, { useState } from 'react';
import { adminApiService } from '@/lib/admin-api-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Play, RefreshCw, Database, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function OperationsTab() {
  const [processing, setProcessing] = useState(false);

  const operations = [
    {
      id: 'settle',
      name: 'Run Settlement Batch',
      description: 'Initiate daily settlement processing',
      icon: Play,
      color: 'blue',
    },
    {
      id: 'reconcile',
      name: 'Reconcile Balances',
      description: 'Verify and reconcile all wallet balances',
      icon: RefreshCw,
      color: 'green',
    },
    {
      id: 'cleanup',
      name: 'Database Cleanup',
      description: 'Run maintenance and optimization tasks',
      icon: Database,
      color: 'purple',
    },
  ];

  const handleRun = async (opId: string) => {
    try {
      setProcessing(true);
      let response;
      if (opId === 'settle') {
        response = await adminApiService.runSettlementBatch();
      } else if (opId === 'reconcile') {
        response = await adminApiService.reconcileBalances();
      } else if (opId === 'cleanup') {
        response = await adminApiService.runDatabaseCleanup();
      }

      if (!response || !response.ok) {
        throw new Error(response?.data?.message || 'Operation failed');
      }
      toast.success(`Operation started: ${operations.find((op) => op.id === opId)?.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-semibold text-amber-900">
              Use caution when running operations
            </p>
            <p className="text-sm text-amber-800">
              Some operations may impact system performance or merchant settlements
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {operations.map((op) => {
          const Icon = op.icon;
          const colorClasses = {
            blue: 'bg-blue-50 border-blue-200 text-blue-700',
            green: 'bg-green-50 border-green-200 text-green-700',
            purple: 'bg-purple-50 border-purple-200 text-purple-700',
          };

          return (
            <Card key={op.id} className={`border-2 ${colorClasses[op.color as keyof typeof colorClasses]}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Icon className="mt-1 h-6 w-6" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{op.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">{op.description}</p>
                    <Button
                      onClick={() => handleRun(op.id)}
                      disabled={processing}
                      className="mt-4 gap-2"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Run Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
