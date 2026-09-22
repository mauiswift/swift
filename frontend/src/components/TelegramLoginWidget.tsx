import React, { useEffect, useRef, useCallback } from 'react';
import { TelegramWidgetUser } from '@/lib/auth';
import { Send } from 'lucide-react';

interface TelegramLoginWidgetProps {
  botName: string;
  onAuth: (user: TelegramWidgetUser) => void;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: string;
  showUserPhoto?: boolean;
}

declare global {
  interface Window {
    onTelegramAuth: (user: any) => void;
  }
}

export default function TelegramLoginWidget({
  botName,
  onAuth,
  buttonSize = 'large',
  cornerRadius = 12,
  requestAccess = 'write',
  showUserPhoto = true,
}: TelegramLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize the auth callback to prevent unnecessary re-renders
  const memoizedOnAuth = useCallback(
    (user: any) => {
      onAuth(user as TelegramWidgetUser);
    },
    [onAuth]
  );

  useEffect(() => {
    // Define global callback for Telegram script
    window.onTelegramAuth = memoizedOnAuth;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-radius', cornerRadius.toString());
    script.setAttribute('data-request-access', requestAccess);
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.async = true;

    const container = containerRef.current;
    if (container) {
      container.appendChild(script);
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
      delete (window as any).onTelegramAuth;
    };
  }, [botName, memoizedOnAuth, buttonSize, cornerRadius, requestAccess])

  return (
    <div
      className="relative inline-flex h-11 w-11 items-center justify-center"
      title="Continue with Telegram"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none flex h-11 w-11 items-center justify-center rounded-full bg-[#3B82F6] text-white shadow-sm shadow-blue-200 transition-transform hover:scale-105"
      >
        <Send size={20} fill="currentColor" strokeWidth={1.8} />
      </span>
      <div
        ref={containerRef}
        aria-label="Continue with Telegram"
        className="absolute inset-0 z-10 overflow-hidden opacity-0"
      />
    </div>
  );
}
