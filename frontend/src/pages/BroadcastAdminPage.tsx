import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Edit2, Check, X, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface BroadcastMessage {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: number;
  currency: string;
  is_active: boolean;
  created_by: string;
  created_at?: string;
  expires_at?: string | null;
}

const PRESET_TEMPLATES = {
  maintenance: [
    {
      id: 'maintenance-window',
      name: 'Scheduled Maintenance',
      title: 'Scheduled Maintenance',
      type: 'warning' as const,
      priority: 3,
      message: 'We will be performing scheduled maintenance to improve system reliability and security.\n\nDuring this window, some services may be temporarily unavailable or slower than usual.\n\nPlanned window: [DATE/TIME]\n\nThank you for your patience while we complete this work.',
    },
    {
      id: 'maintenance-complete',
      name: 'Maintenance Complete',
      title: 'Maintenance Complete',
      type: 'success' as const,
      priority: 2,
      message: 'The scheduled maintenance has been completed successfully.\n\nAll services are now operating normally.\n\nThank you for your patience and cooperation while we improved the platform.',
    },
  ],
  incident: [
    {
      id: 'service-disruption',
      name: 'Service Disruption',
      title: 'Service Interruption',
      type: 'error' as const,
      priority: 3,
      message: 'We are currently experiencing a service disruption affecting some features.\n\nOur team is actively investigating and working to restore full service as quickly as possible.\n\nIf you are unable to complete a transaction, please try again shortly or contact support for assistance.',
    },
    {
      id: 'incident-update',
      name: 'Incident Update',
      title: 'Update on Ongoing Service Issue',
      type: 'warning' as const,
      priority: 3,
      message: 'We are continuing to investigate the service issue affecting some users.\n\nOur team is working to resolve the problem and restore normal operations as quickly as possible.\n\nWe will share another update as soon as there is progress or an estimated recovery time.',
    },
  ],
  updates: [
    {
      id: 'general-update',
      name: 'General Update',
      title: 'Service Update',
      type: 'info' as const,
      priority: 2,
      message: 'We are making an update to improve the service experience for all users.\n\nPlease expect brief interruptions or delayed processing during this period.\n\nThank you for your patience and understanding.',
    },
    {
      id: 'feature-launch',
      name: 'Feature Launch',
      title: 'New Feature Available',
      type: 'success' as const,
      priority: 2,
      message: 'A new feature has been released to improve your experience.\n\nYou can now access the updated functionality and take advantage of the improved workflow.\n\nWe appreciate your feedback and continued support.',
    },
  ],
  security: [
    {
      id: 'security-notice',
      name: 'Security Notice',
      title: 'Important Security Notice',
      type: 'warning' as const,
      priority: 3,
      message: 'This is an important security notice regarding account or service activity.\n\nPlease ensure that your login details remain secure and be cautious of unexpected requests for personal or payment information.\n\nIf you see anything suspicious, contact support immediately.',
    },
    {
      id: 'security-clearance',
      name: 'Security Update',
      title: 'Security Update',
      type: 'success' as const,
      priority: 2,
      message: 'We have completed a security update to improve safety and protection across the platform.\n\nNo action is required from users, but we recommend reviewing your account security settings and keeping your credentials secure.',
    },
  ],
} as const;

const PRESET_CATEGORIES = [
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'incident', label: 'Incident' },
  { id: 'updates', label: 'Updates' },
  { id: 'security', label: 'Security' },
] as const;

export default function BroadcastAdminPage() {
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('active');
  const [selectedPresetCategory, setSelectedPresetCategory] = useState<(typeof PRESET_CATEGORIES)[number]['id']>(() => {
    const saved = localStorage.getItem('broadcast-preset-category');
    return PRESET_CATEGORIES.some((category) => category.id === saved)
      ? (saved as (typeof PRESET_CATEGORIES)[number]['id'])
      : 'maintenance';
  });

  useEffect(() => {
    const savedCategory = localStorage.getItem('broadcast-preset-category');
    const category = PRESET_CATEGORIES.some((item) => item.id === savedCategory)
      ? (savedCategory as (typeof PRESET_CATEGORIES)[number]['id'])
      : 'maintenance';

    setSelectedPresetCategory(category);
    const defaultPreset = PRESET_TEMPLATES[category][0];
    setTitle(defaultPreset.title);
    setMessage(defaultPreset.message);
    setType(defaultPreset.type);
    setPriority(String(defaultPreset.priority));
    setIsActive(true);
    setExpiresAt('');
  }, []);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'error' | 'success'>('info');
  const [priority, setPriority] = useState('1');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [currency, setCurrency] = useState('ALL');

  useEffect(() => {
    fetchBroadcasts();
  }, [filter]);

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/api/v1/broadcast/admin/all' : `/api/v1/broadcast/admin/all?status=${filter}`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBroadcasts(Array.isArray(data.items) ? data.items : []);
      } else {
        toast.error('Failed to load broadcasts');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setType('info');
    setPriority('1');
    setCurrency('ALL');
    setExpiresAt('');
    setIsActive(true);
    setEditing(null);
  };

  const handleSave = async () => {
    if (!title || !message) {
      toast.error('Title and message are required');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        title,
        message,
        type,
        priority: parseInt(priority),
        currency,
        expires_at: expiresAt || null,
        ...(editing && { is_active: isActive }),
      };

      const url = editing ? `/api/v1/broadcast/${editing}` : '/api/v1/broadcast';
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (res.ok) {
        toast.success(editing ? 'Broadcast updated' : 'Broadcast created');
        resetForm();
        fetchBroadcasts();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this broadcast message?')) return;

    try {
      const res = await fetch(`/api/v1/broadcast/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        toast.success('Broadcast deleted');
        fetchBroadcasts();
      } else {
        toast.error('Failed to delete');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/broadcast/${id}/deactivate`, {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        toast.success('Broadcast deactivated');
        fetchBroadcasts();
      } else {
        toast.error('Failed to deactivate');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    }
  };

  const handleEdit = (broadcast: BroadcastMessage) => {
    setEditing(broadcast.id);
    setTitle(broadcast.title);
    setMessage(broadcast.message);
    setType(broadcast.type);
    setPriority(String(broadcast.priority));
    setCurrency(broadcast.currency || 'ALL');
    setIsActive(broadcast.is_active);
    setExpiresAt(broadcast.expires_at ? new Date(broadcast.expires_at).toISOString().slice(0, 16) : '');
  };

  const applyPreset = (preset: (typeof PRESET_TEMPLATES)[keyof typeof PRESET_TEMPLATES][number]) => {
    setTitle(preset.title);
    setMessage(preset.message);
    setType(preset.type);
    setPriority(String(preset.priority));
    setIsActive(true);
    setExpiresAt('');
  };

  const handlePresetCategoryChange = (categoryId: (typeof PRESET_CATEGORIES)[number]['id']) => {
    setSelectedPresetCategory(categoryId);
    localStorage.setItem('broadcast-preset-category', categoryId);
    const defaultPreset = PRESET_TEMPLATES[categoryId][0];
    if (defaultPreset) {
      applyPreset(defaultPreset);
    }
  };

  const typeIcons: Record<string, React.ReactNode> = {
    info: <Info className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />,
  };

  const typeColors: Record<string, string> = {
    info: 'text-blue-600 bg-blue-50',
    warning: 'text-amber-600 bg-amber-50',
    error: 'text-red-600 bg-red-50',
    success: 'text-emerald-600 bg-emerald-50',
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Broadcast Messages</h1>
          <p className="text-muted-foreground text-sm mt-2">Create urgent notices that appear on all user pages</p>
        </div>

        {/* Create/Edit Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {editing ? 'Edit Broadcast' : 'Create New Broadcast'}
            </h2>
            {editing && (
              <button
                onClick={resetForm}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold text-slate-700">Quick Presets</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESET_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handlePresetCategoryChange(category.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedPresetCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {PRESET_TEMPLATES[selectedPresetCategory].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold text-slate-700">Title</Label>
              <Input
                placeholder="e.g., System Maintenance Scheduled"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="mt-1 bg-slate-50 border-slate-200"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-slate-700">Message</Label>
              <Textarea
                placeholder="Enter the broadcast message (supports multiple lines)..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
                className="mt-1 bg-slate-50 border-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-semibold text-slate-700">Type</Label>
                <Select value={type} onValueChange={v => setType(v as any)}>
                  <SelectTrigger className="mt-1 bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="mt-1 bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Low</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">High (Urgent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700">Currency channel</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="mt-1 bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All currencies</SelectItem>
                    <SelectItem value="PHP">PHP</SelectItem>
                    <SelectItem value="CNY">CNY</SelectItem>
                    <SelectItem value="KRW">KRW</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700">Expires At (optional)</Label>
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  className="mt-1 bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={creating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {creating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  editing ? (
                    <>Update</>
                  ) : (
                    <><Plus className="h-4 w-4 mr-2" />Create</>
                  )
                )}
              </Button>
              {editing && (
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* List of Broadcasts */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Broadcasts ({broadcasts.length})</h2>
            <div className="flex gap-2">
              {['all', 'active', 'inactive', 'expired'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No broadcasts found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {broadcasts.map(broadcast => (
                <div key={broadcast.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded ${typeColors[broadcast.type]}`}>
                          {typeIcons[broadcast.type]}
                        </div>
                        <h3 className="font-semibold text-foreground">{broadcast.title}</h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            broadcast.is_active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {broadcast.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          broadcast.priority === 3
                            ? 'bg-red-100 text-red-700'
                            : broadcast.priority === 2
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {['Low', 'Medium', 'High'][broadcast.priority - 1]} Priority
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                          {broadcast.currency || 'ALL'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{broadcast.message}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        Created {broadcast.created_at ? new Date(broadcast.created_at).toLocaleString() : '—'}
                        {broadcast.expires_at && ` • Expires ${new Date(broadcast.expires_at).toLocaleString()}`}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleEdit(broadcast)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-blue-600"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {broadcast.is_active && (
                        <button
                          onClick={() => handleDeactivate(broadcast.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-amber-600"
                          title="Deactivate"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(broadcast.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
