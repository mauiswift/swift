import React from 'react';
import { APP_NAME } from '@/lib/brand';

interface LoadingProps {
  fullScreen?: boolean;
  text?: string;
}

export default function Loading({ fullScreen = true, text = 'Loading' }: LoadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? 'min-h-screen w-full bg-slate-50' : 'p-12 w-full'}`}>
      <div className="relative">
        {/* Animated Logo Container */}
        <div className="h-20 w-20 rounded-3xl bg-blue-600 flex items-center justify-center relative overflow-hidden shadow-2xl shadow-blue-600/30 animate-pulse-gentle scale-animation">
          <img src="/logo.svg" alt={APP_NAME} className="h-12 w-12 invert brightness-0" />
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
        </div>

        {/* Spinning Ring */}
        <div className="absolute -inset-4 rounded-full border-[3px] border-blue-600/10 border-t-blue-600 animate-spin" />
      </div>

      <div className="mt-8 text-center space-y-2">
        <h2 className="text-xl font-black tracking-tight text-foreground">{APP_NAME}</h2>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 animate-pulse">{text}</p>
      </div>
    </div>
  );
}
