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
    <div
      style={{
        background: '#fdf1e7',
        border: '1px solid #f6ddc4',
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 20,
      }}
    >
      <Info size={16} style={{ color: '#e8823a', marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: 13.5, color: '#111', margin: 0 }}>What's new in SwiftPay:</p>
        <p style={{ fontSize: 13, color: '#333', margin: '2px 0 8px' }}>
          We've upgraded sign-in for stronger security, and you can now manage team users and set up approval workflows
          directly in Merchant Portal.
        </p>
        <div style={{ display: 'flex', gap: 20 }}>
          <a href="#" style={{ fontSize: 12.5, fontWeight: 600, color: '#c2530f', textDecoration: 'none' }}>
            Learn More →
          </a>
          <button
            onClick={close}
            style={{ fontSize: 12.5, fontWeight: 600, color: '#c2530f', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Close
          </button>
        </div>
      </div>
      <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333', padding: 2 }}>
        <X size={16} />
      </button>
    </div>
  );
}
