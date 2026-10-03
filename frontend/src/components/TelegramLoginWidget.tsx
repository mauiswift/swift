import React, { useEffect, useRef } from 'react';
import { TelegramWidgetUser } from '@/lib/auth';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TelegramLoginWidgetProps {
  botName: string;
  onAuth: (user: TelegramWidgetUser) => void;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: string;
  showUserPhoto?: boolean;
  uiSize?: 'sm' | 'md';
  className?: string;
  iconClassName?: string;
  title?: string;
  ariaLabel?: string;
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
  uiSize = 'md',
  className,
  iconClassName,
  title,
  ariaLabel,
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
    script.setAttribute('data-userpic', showUserPhoto ? 'true' : 'false');
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
  }, [botName, buttonSize, cornerRadius, requestAccess, showUserPhoto]);

  const resolvedLabel = ariaLabel ?? title ?? 'Continue with Telegram';
  const sizeClassName = uiSize === 'sm' ? 'h-10 w-10' : 'h-11 w-11';

  return (
    <div
      className={cn('group relative inline-flex items-center justify-center', sizeClassName, className)}
      title={title ?? 'Continue with Telegram'}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none flex h-full w-full items-center justify-center rounded-full border border-[#111111] bg-transparent text-[#111111] shadow-sm transition-transform group-hover:scale-105 group-active:scale-[0.98]',
          iconClassName,
        )}
      >
        <Send size={20} fill="none" stroke="currentColor" strokeWidth={2.2} />
      </span>
      <div
        ref={containerRef}
        aria-label={resolvedLabel}
        className="absolute inset-0 z-10 overflow-hidden opacity-0"
      />
    </div>
  );
}
