import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useCollectionCurrency } from '@/contexts/CollectionCurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';

export interface BroadcastMessage {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: number;
  is_active: boolean;
  show_on_all_pages: boolean;
  created_by: string;
  created_at?: string;
  updated_at?: string;
  expires_at?: string | null;
}

const DISMISSED_BROADCASTS_KEY = 'swiftpay.dismissed-broadcasts';

function isCriticalBroadcast(broadcast: BroadcastMessage): boolean {
  return broadcast.priority >= 3;
}

function broadcastVersion(broadcast: BroadcastMessage): string {
  return `${broadcast.id}:${broadcast.updated_at || broadcast.created_at || ''}`;
}

function readDismissedBroadcasts(): Set<string> {
  try {
    const stored = window.localStorage.getItem(DISMISSED_BROADCASTS_KEY);
    const values = stored ? JSON.parse(stored) : [];
    return new Set(Array.isArray(values) ? values.filter((value): value is string => typeof value === 'string') : []);
  } catch {
    return new Set();
  }
}

interface BroadcastBannerProps {
  dismissible?: boolean;
  autoHideDuration?: number;
}

export default function BroadcastBanner({ dismissible = true, autoHideDuration }: BroadcastBannerProps) {
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => readDismissedBroadcasts());
  const { collectionCurrency } = useCollectionCurrency();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);

  const fetchBroadcasts = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/broadcast?currency=${encodeURIComponent(collectionCurrency)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBroadcasts(Array.isArray(data.items) ? data.items : []);
      }
    } catch (err) {
      console.error('Failed to fetch broadcasts:', err);
    } finally {
      setLoading(false);
    }
  }, [collectionCurrency]);

  useEffect(() => {
    void fetchBroadcasts();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchBroadcasts();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchBroadcasts]);

  const handleDismiss = (id: number) => {
    const broadcast = broadcasts.find(item => item.id === id);
    if (!broadcast) return;

    const version = broadcastVersion(broadcast);
    setDismissed(prev => {
      const next = new Set(prev).add(version);
      if (!isCriticalBroadcast(broadcast)) {
        try {
          window.localStorage.setItem(DISMISSED_BROADCASTS_KEY, JSON.stringify([...next]));
        } catch {
          // A storage failure should not prevent the current dismissal.
        }
      }
      return next;
    });
  };

  // Filter out dismissed messages
  const visibleBroadcasts = broadcasts.filter(b => !dismissed.has(broadcastVersion(b)));

  if (loading || visibleBroadcasts.length === 0) {
    return null;
  }

  // Sort by priority (highest first)
  const sortedBroadcasts = [...visibleBroadcasts].sort((a, b) => b.priority - a.priority);

  const typeConfig: Record<BroadcastMessage['type'], { bg: string; border: string; text: string; icon: React.ReactNode }> = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-900 dark:text-blue-100',
      icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-900 dark:text-amber-100',
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-950',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-900 dark:text-red-100',
      icon: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-900 dark:text-emerald-100',
      icon: <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
    },
  };

  return (
    <div className="space-y-2 px-4 py-3">
      {sortedBroadcasts.map(broadcast => {
        const config = typeConfig[broadcast.type] || typeConfig.info;
        return (
          <div key={broadcast.id} className={`flex items-start gap-3 rounded-lg border ${config.bg} ${config.border} p-4`}>
            <div className="shrink-0 mt-0.5">{config.icon}</div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-sm ${config.text}`}>{broadcast.title}</h3>
              <p className={`text-sm mt-1 ${config.text} opacity-90 whitespace-pre-wrap`}>{broadcast.message}</p>
            </div>
            {dismissible && (
              <button
                onClick={() => handleDismiss(broadcast.id)}
                className={`shrink-0 p-1 rounded hover:bg-black/10 transition-colors ${config.text}`}
                aria-label={language === 'ko' ? '메시지 닫기' : language === 'zh' ? '关闭消息' : 'Dismiss message'}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
