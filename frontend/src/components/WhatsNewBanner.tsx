import { useState } from 'react';
import { Info, X, ArrowRight } from 'lucide-react';

const DISMISS_KEY = 'global_whatsnew_dismissed';

export default function WhatsNewBanner() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');

  if (dismissed) return null;

  const close = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="bg-[#FFF5F1] border border-[#FFDCCB] rounded-2xl p-6 flex items-start gap-6 mb-10 relative shadow-sm">
      <div className="w-12 h-12 rounded-full bg-white border border-[#FFDCCB] flex items-center justify-center flex-shrink-0 shadow-sm">
        <Info size={22} className="text-[#FF6B00]" />
      </div>

      <div className="flex-1">
        <h3 className="text-[18px] font-semibold text-slate-900 m-0">What's new in SwiftPay:</h3>
        <p className="text-[15px] text-slate-600 mt-2 mb-4 leading-relaxed font-medium">
          We've upgraded sign-in for stronger security, and you can now manage team users and set up approval workflows directly in Merchant Portal.
        </p>
        <div className="flex items-center gap-8">
          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#FF6B00] hover:underline"
          >
            Learn More
            <ArrowRight size={16} />
          </a>
          <button
            onClick={close}
            className="text-[14px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <button
        onClick={close}
        className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all"
        aria-label="Close"
      >
        <X size={20} />
      </button>
    </div>
  );
}
