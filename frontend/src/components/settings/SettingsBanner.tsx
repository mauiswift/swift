import { useState } from 'react';
import { Info, X } from 'lucide-react';

const DISMISS_KEY = 'settings_whatsnew_dismissed';

export default function SettingsBanner() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');

  if (dismissed) return null;

  const close = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 flex items-start gap-4 mb-8 shadow-lg shadow-blue-500/20 relative overflow-hidden group">
      {/* Decorative background elements */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700" />

      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/20 shadow-inner">
        <Info size={24} className="text-white" />
      </div>

      <div className="flex-1 relative z-10">
        <h3 className="text-lg font-semibold text-white m-0 tracking-tight">What's new in SwiftPay</h3>
        <p className="text-sm text-blue-50/90 mt-1.5 mb-4 max-w-2xl leading-relaxed">
          We've upgraded sign-in for stronger security, and you can now manage team users and set up approval workflows
          directly in Merchant Portal.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors shadow-sm"
          >
            Learn More
          </a>
          <button
            onClick={close}
            className="text-sm font-semibold text-white/80 hover:text-white transition-colors px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      </div>

      <button
        onClick={close}
        className="absolute top-4 right-4 p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
        aria-label="Close"
      >
        <X size={20} />
      </button>
    </div>
  );
}
