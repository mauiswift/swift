type OpenDeepLinkOptions = {
  /**
   * Custom scheme deep link such as `supertoss://toss/pay?...`.
   */
  url: string;
  /**
   * How long to wait for the page to become hidden (app switch) before calling `onFallback`.
   * Defaults to 1500ms.
   */
  timeoutMs?: number;
  /**
   * Called when we fail to detect the app opening (best-effort).
   */
  onFallback?: () => void;
  /**
   * Android Intent target package (used to build an `intent://` URL for Android/WebView).
   */
  androidPackage?: string;
};

function isAndroid() {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
}

function isIOS() {
  return typeof navigator !== 'undefined' && /iPad|iPhone|iPod/i.test(navigator.userAgent);
}

function toAndroidIntentUrl(url: string, packageName: string) {
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.replace(':', '');
    const host = parsed.host;
    const pathAndQuery = `${parsed.pathname}${parsed.search || ''}${parsed.hash || ''}`;
    return `intent://${host}${pathAndQuery}#Intent;scheme=${scheme};package=${packageName};end`;
  } catch {
    return null;
  }
}

function openViaHiddenIframe(url: string) {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  window.setTimeout(() => {
    try {
      document.body.removeChild(iframe);
    } catch {
      // ignore
    }
  }, 1000);
}

/**
 * Best-effort deep link opener that works more reliably inside Android/iOS WebViews.
 *
 * Notes:
 * - We detect "success" by observing `document.visibilityState === 'hidden'` (app switch).
 * - For Android, we can build an `intent://` URL (more reliable in WebView than plain scheme).
 * - For iOS, the common pattern is a hidden iframe.
 */
export function openMobileDeepLink({
  url,
  timeoutMs = 1500,
  onFallback,
  androidPackage,
}: OpenDeepLinkOptions) {
  let appOpened = false;

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      appOpened = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  if (isAndroid() && androidPackage) {
    const intentUrl = toAndroidIntentUrl(url, androidPackage);
    window.location.assign(intentUrl || url);
  } else if (isIOS()) {
    openViaHiddenIframe(url);
  } else {
    window.location.assign(url);
  }

  window.setTimeout(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (!appOpened) onFallback?.();
  }, timeoutMs);
}

