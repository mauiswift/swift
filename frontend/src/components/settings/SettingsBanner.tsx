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
    <div className="bg-amber-50 border border-amber-100 rounded-md p-4 flex items-start gap-3 mb-5">
      <Info size={16} className="text-amber-600 mt-[2px] flex-shrink-0" />
      <div className="flex-1">
        <p className="font-semibold text-sm text-slate-900 m-0">What's new in SwiftPay:</p>
        <p className="text-sm text-slate-700 mt-1 mb-2">
          We've upgraded sign-in for stronger security, and you can now manage team users and set up approval workflows
          directly in Merchant Portal.
        </p>
        <div className="flex gap-5">
          <a href="#" className="text-sm font-semibold text-amber-600 no-underline">
            Learn More →
          </a>
          <button
            onClick={close}
            className="text-sm font-semibold text-amber-600 bg-transparent border-0 p-0"
          >
            Close
          </button>
        </div>
      </div>
      <button onClick={close} className="bg-transparent border-0 p-1 text-slate-600">
        <X size={16} />
      </button>
    </div>
  );
}
