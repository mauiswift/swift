import { useState } from 'react';
import { Info, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DISMISS_KEY = 'global_whatsnew_dismissed';

export default function WhatsNewBanner() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');

  if (dismissed) return null;

  const close = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="bg-[#FFF5F1] border border-[#FFDCCB] rounded-2xl p-4 flex items-start gap-3 mb-6 relative shadow-sm sm:gap-6 sm:p-6 sm:mb-10">
      <div className="w-12 h-12 rounded-full bg-white border border-[#FFDCCB] flex items-center justify-center flex-shrink-0 shadow-sm">
        <Info size={22} className="text-[#FF6B00]" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="m-0 pr-12 text-[18px] font-semibold text-slate-900 sm:pr-0">What's new in SwiftPay:</h3>
        <p className="mb-4 mt-2 text-sm font-medium leading-relaxed text-slate-600 sm:text-[15px]">
          We've upgraded sign-in for stronger security, and you can now manage team users and set up approval workflows directly in Merchant Portal.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-8">
          <Link
            to="/settings/team"
            className="inline-flex whitespace-nowrap items-center gap-1.5 text-[14px] font-semibold text-[#FF6B00] hover:underline"
          >
            Learn More
            <ArrowRight size={16} />
          </Link>
          <button
            onClick={close}
            className="whitespace-nowrap text-[14px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
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
