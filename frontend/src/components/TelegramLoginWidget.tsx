import React, { useEffect, useRef } from 'react';
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
    onTelegramAuth?: (user: TelegramWidgetUser) => void;
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
  const onAuthRef = useRef(onAuth);
  onAuthRef.current = onAuth;

  useEffect(() => {
    const handleTelegramAuth = (user: TelegramWidgetUser) => onAuthRef.current(user);
    window.onTelegramAuth = handleTelegramAuth;

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
      if (window.onTelegramAuth === handleTelegramAuth) {
        delete window.onTelegramAuth;
      }
    };
  }, [botName, buttonSize, cornerRadius, requestAccess])

  return (
    <div
      ref={containerRef}
      aria-label="Continue with Telegram"
      className="inline-flex min-h-10 max-w-full items-center justify-center"
      title="Continue with Telegram"
    />
  );
}
