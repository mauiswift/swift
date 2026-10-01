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
import { Search, Shield, AlertCircle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
}

export function UsersTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users] = useState<User[]>([
    {
      id: '1',
      email: 'admin@swift.com',
      name: 'John Admin',
      role: 'Super Admin',
      status: 'active',
      lastLogin: '2026-10-02T16:45:00Z',
      createdAt: '2025-01-15T10:00:00Z',
    },
    {
      id: '2',
      email: 'finance@swift.com',
      name: 'Jane Finance',
      role: 'Finance Officer',
      status: 'active',
      lastLogin: '2026-10-02T14:20:00Z',
      createdAt: '2025-06-20T14:30:00Z',
    },
    {
      id: '3',
      email: 'ops@swift.com',
      name: 'Bob Operations',
      role: 'Operations',
      status: 'active',
      lastLogin: '2026-10-02T10:15:00Z',
      createdAt: '2025-08-10T09:00:00Z',
    },
  ]);

  const filteredUsers = users.filter(
    (user) =>
      !searchQuery ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200">
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                    User
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                    Role
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                    Status
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                    Last Login
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                    Joined
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <TableCell className="px-6 py-4">
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 capitalize">
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-slate-600">
                      {new Date(user.lastLogin).toLocaleString()}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString()}
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
