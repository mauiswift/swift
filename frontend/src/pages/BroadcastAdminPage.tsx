import { useCallback, useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Edit2, Check, X, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';

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

const KOREAN_PRESET_COPY: Record<string, { name: string; title: string; message: string }> = {
  'maintenance-window': {
    name: '예정된 점검',
    title: '예정된 시스템 점검',
    message: '시스템 안정성과 보안을 개선하기 위해 예정된 점검을 진행합니다.\n\n점검 중 일부 서비스를 일시적으로 이용할 수 없거나 평소보다 느릴 수 있습니다.\n\n예정 시간: [날짜/시간]\n\n이용에 불편을 드려 죄송하며 양해해 주셔서 감사합니다.',
  },
  'maintenance-complete': {
    name: '점검 완료',
    title: '시스템 점검 완료',
    message: '예정된 시스템 점검이 성공적으로 완료되었습니다.\n\n모든 서비스가 정상적으로 운영되고 있습니다.\n\n기다려 주시고 협조해 주셔서 감사합니다.',
  },
  'service-disruption': {
    name: '서비스 장애',
    title: '서비스 일시 중단 안내',
    message: '현재 일부 기능에 영향을 주는 서비스 장애가 발생했습니다.\n\n담당 팀이 원인을 확인하고 최대한 빠르게 정상화하고 있습니다.\n\n거래가 완료되지 않으면 잠시 후 다시 시도하거나 고객센터에 문의해 주세요.',
  },
  'incident-update': {
    name: '장애 진행 안내',
    title: '서비스 장애 진행 안내',
    message: '일부 사용자에게 영향을 주는 서비스 문제를 계속 확인하고 있습니다.\n\n정상 운영을 위해 복구 작업을 진행 중이며, 진행 상황이 확인되는 즉시 다시 안내드리겠습니다.',
  },
  'general-update': {
    name: '일반 안내',
    title: '서비스 업데이트 안내',
    message: '모든 사용자의 서비스 이용 경험을 개선하기 위한 업데이트를 진행합니다.\n\n이 기간 동안 짧은 중단이나 처리 지연이 발생할 수 있습니다.\n\n기다려 주셔서 감사합니다.',
  },
  'feature-launch': {
    name: '새 기능 안내',
    title: '새 기능을 이용할 수 있습니다',
    message: '이용 경험을 개선하기 위한 새 기능이 출시되었습니다.\n\n업데이트된 기능을 이용해 더 편리한 업무 흐름을 경험해 보세요.\n\n관심과 의견을 보내주셔서 감사합니다.',
  },
  'security-notice': {
    name: '보안 안내',
    title: '중요 보안 안내',
    message: '계정 또는 서비스 활동과 관련된 중요한 보안 안내입니다.\n\n로그인 정보를 안전하게 관리하고 개인정보나 결제 정보를 요구하는 의심스러운 요청에 주의해 주세요.\n\n의심스러운 활동이 발견되면 즉시 고객센터에 문의해 주세요.',
  },
  'security-clearance': {
    name: '보안 업데이트',
    title: '보안 업데이트 완료',
    message: '플랫폼 전반의 안전성과 보호 기능을 개선하는 보안 업데이트가 완료되었습니다.\n\n추가 조치는 필요하지 않지만 계정 보안 설정을 확인하고 인증 정보를 안전하게 관리해 주세요.',
  },
};

export default function BroadcastAdminPage() {
  const { collectionCurrency } = useCollectionCurrency();
  const isKorean = collectionCurrency === 'KRW';
  const ui = isKorean ? {
    title: '공지 메시지', description: '모든 사용자 페이지에 표시되는 긴급 안내를 작성합니다', quickPresets: '빠른 템플릿', edit: '공지 수정', create: '새 공지 작성', cancel: '취소',
    titleLabel: '제목', messageLabel: '메시지', titlePlaceholder: '예: 시스템 점검 예정', messagePlaceholder: '공지 메시지를 입력하세요 (여러 줄 지원)...', type: '유형', priority: '우선순위', currency: '통화 채널', expires: '만료 시간 (선택)', allCurrencies: '모든 통화', low: '낮음', medium: '보통', high: '긴급 (로그인마다 표시)', save: '저장 중...', update: '업데이트', createButton: '작성', broadcasts: '공지', active: '활성', inactive: '비활성', expired: '만료', noBroadcasts: '공지가 없습니다', editAction: '수정', deactivate: '비활성화', delete: '삭제',
  } : {
    title: 'Broadcast Messages', description: 'Create urgent notices that appear on all user pages', quickPresets: 'Quick Presets', edit: 'Edit Broadcast', create: 'Create New Broadcast', cancel: 'Cancel',
    titleLabel: 'Title', messageLabel: 'Message', titlePlaceholder: 'e.g., System Maintenance Scheduled', messagePlaceholder: 'Enter the broadcast message (supports multiple lines)...', type: 'Type', priority: 'Priority', currency: 'Currency channel', expires: 'Expires At (optional)', allCurrencies: 'All currencies', low: 'Low', medium: 'Medium', high: 'Critical (reappears at login)', save: 'Saving...', update: 'Update', createButton: 'Create', broadcasts: 'Broadcasts', active: 'Active', inactive: 'Inactive', expired: 'Expired', noBroadcasts: 'No broadcasts found', editAction: 'Edit', deactivate: 'Deactivate', delete: 'Delete',
  };
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
    const localized = isKorean ? KOREAN_PRESET_COPY[defaultPreset.id] : defaultPreset;
    setTitle(localized.title);
    setMessage(localized.message);
    setType(defaultPreset.type);
    setPriority(String(defaultPreset.priority));
    setIsActive(true);
    setExpiresAt('');
  }, [isKorean]);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'error' | 'success'>('info');
  const [priority, setPriority] = useState('1');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [currency, setCurrency] = useState('ALL');

  const fetchBroadcasts = useCallback(async () => {
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
  }, [filter]);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

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
    const localized = isKorean ? KOREAN_PRESET_COPY[preset.id] : preset;
    setTitle(localized.title);
    setMessage(localized.message);
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
          <h1 className="text-3xl font-semibold text-foreground">{ui.title}</h1>
          <p className="text-muted-foreground text-sm mt-2">{ui.description}</p>
        </div>

        {/* Create/Edit Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {editing ? ui.edit : ui.create}
            </h2>
            {editing && (
              <button
                onClick={resetForm}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <X className="h-4 w-4" /> {ui.cancel}
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold text-slate-700">{ui.quickPresets}</Label>
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
                    {isKorean ? { maintenance: '점검', incident: '장애', updates: '업데이트', security: '보안' }[category.id] : category.label}
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
                    {isKorean ? KOREAN_PRESET_COPY[preset.id]?.name : preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold text-slate-700">{ui.titleLabel}</Label>
              <Input
                placeholder={ui.titlePlaceholder}
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="mt-1 bg-slate-50 border-slate-200"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-slate-700">{ui.messageLabel}</Label>
              <Textarea
                placeholder={ui.messagePlaceholder}
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
                className="mt-1 bg-slate-50 border-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-semibold text-slate-700">{ui.type}</Label>
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
                <Label className="text-sm font-semibold text-slate-700">{ui.priority}</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="mt-1 bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{ui.low}</SelectItem>
                    <SelectItem value="2">{ui.medium}</SelectItem>
                    <SelectItem value="3">{ui.high}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700">{ui.currency}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="mt-1 bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{ui.allCurrencies}</SelectItem>
                    <SelectItem value="PHP">PHP</SelectItem>
                    <SelectItem value="CNY">CNY</SelectItem>
                    <SelectItem value="KRW">KRW</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700">{ui.expires}</Label>
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
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{ui.save}</>
                ) : (
                  editing ? (
                    <>{ui.update}</>
                  ) : (
                    <><Plus className="h-4 w-4 mr-2" />{ui.createButton}</>
                  )
                )}
              </Button>
              {editing && (
                <Button variant="outline" onClick={resetForm}>
                  {ui.cancel}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* List of Broadcasts */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{ui.broadcasts} ({broadcasts.length})</h2>
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
                  {{ all: ui.broadcasts, active: ui.active, inactive: ui.inactive, expired: ui.expired }[f as keyof typeof ui]}
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
              <p>{ui.noBroadcasts}</p>
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
                          {broadcast.is_active ? ui.active : ui.inactive}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          broadcast.priority === 3
                            ? 'bg-red-100 text-red-700'
                            : broadcast.priority === 2
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {([ui.low, ui.medium, ui.high][broadcast.priority - 1])} {ui.priority}
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
                        title={ui.editAction}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {broadcast.is_active && (
                        <button
                          onClick={() => handleDeactivate(broadcast.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-amber-600"
                          title={ui.deactivate}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(broadcast.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                        title={ui.delete}
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
