import React, { useEffect, useRef, useCallback } from 'react';
import { TelegramWidgetUser } from '@/lib/auth';

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

  return <div ref={containerRef} className="flex justify-center" />;
}
