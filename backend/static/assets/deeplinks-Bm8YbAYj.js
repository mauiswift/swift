function isAndroid() {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
}
function isIOS() {
  return typeof navigator !== "undefined" && /iPad|iPhone|iPod/i.test(navigator.userAgent);
}
function toAndroidIntentUrl(url, packageName) {
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.replace(":", "");
    const host = parsed.host;
    const pathAndQuery = `${parsed.pathname}${parsed.search || ""}${parsed.hash || ""}`;
    return `intent://${host}${pathAndQuery}#Intent;scheme=${scheme};package=${packageName};end`;
  } catch {
    return null;
  }
}
function openViaHiddenIframe(url) {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = url;
  document.body.appendChild(iframe);
  window.setTimeout(() => {
    try {
      document.body.removeChild(iframe);
    } catch {
    }
  }, 1e3);
}
function openMobileDeepLink({
  url,
  timeoutMs = 1500,
  onFallback,
  androidPackage
}) {
  let appOpened = false;
  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      appOpened = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);
  if (isAndroid() && androidPackage) {
    const intentUrl = toAndroidIntentUrl(url, androidPackage);
    window.location.assign(intentUrl || url);
  } else if (isIOS()) {
    openViaHiddenIframe(url);
  } else {
    window.location.assign(url);
  }
  window.setTimeout(() => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    if (!appOpened) onFallback == null ? void 0 : onFallback();
  }, timeoutMs);
}
export {
  openMobileDeepLink as o
};
