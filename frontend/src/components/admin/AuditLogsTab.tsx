import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Download } from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  status: 'success' | 'failed';
  ipAddress: string;
  details: string;
}

export function AuditLogsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [logs] = useState<AuditLog[]>([
    {
      id: '1',
      timestamp: '2026-10-02T16:45:00Z',
      user: 'john@swift.com',
      action: 'APPROVE_CRYPTO',
      resource: 'CRYPTO-20261002-001',
      status: 'success',
      ipAddress: '192.168.1.100',
      details: 'Approved 100 USDT for Online Mart',
    },
    {
      id: '2',
      timestamp: '2026-10-02T16:30:00Z',
      user: 'jane@swift.com',
      action: 'ADJUST_WALLET',
      resource: 'Wallet:1',
      status: 'success',
      ipAddress: '192.168.1.105',
      details: 'Credited ABC Electronics wallet 10000 PHP',
    },
    {
      id: '3',
      timestamp: '2026-10-02T16:15:00Z',
      user: 'bob@swift.com',
      action: 'FAILED_LOGIN_ATTEMPT',
      resource: 'User:unknown',
      status: 'failed',
      ipAddress: '203.0.113.45',
      details: 'Invalid credentials provided',
    },
    {
      id: '4',
      timestamp: '2026-10-02T15:50:00Z',
      user: 'john@swift.com',
      action: 'VIEW_TRANSACTION',
      resource: 'TXN-20261001-001',
      status: 'success',
      ipAddress: '192.168.1.100',
      details: 'Viewed transaction details',
    },
    {
      id: '5',
      timestamp: '2026-10-02T15:30:00Z',
      user: 'jane@swift.com',
      action: 'UPDATE_SETTINGS',
      resource: 'PlatformSettings',
      status: 'success',
      ipAddress: '192.168.1.105',
      details: 'Updated fee configuration',
    },
  ]);

  const filteredLogs = logs.filter(
    (log) =>
      !searchQuery ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    toast.success('Audit logs exported to CSV');
  };

  const getActionColor = (action: string) => {
    if (action.includes('FAILED')) return 'text-red-600';
    if (action.includes('APPROVE') || action.includes('ADJUST')) return 'text-blue-600';
    return 'text-slate-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by user, action, or resource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Logs ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200">
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                    Timestamp
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                    User
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                    Action
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                    Resource
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                    Status
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                    IP Address
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <TableCell className="px-6 py-4 text-sm text-slate-600">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <p className="font-medium text-slate-900 text-sm">{log.user}</p>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <p className={`text-sm font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{log.details}</p>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="inline-block rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {log.resource}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          log.status === 'success'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {log.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 font-mono text-xs text-slate-600">
                      {log.ipAddress}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
