if (window.SWIFTPAY_LOG) window.SWIFTPAY_LOG('loading_dependencies');
if (window.XEND_LOG) window.XEND_LOG('loading_dependencies');

import './lib/api';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

if (window.SWIFTPAY_LOG) window.SWIFTPAY_LOG('mounting_application');
if (window.XEND_LOG) window.XEND_LOG('mounting_application');

// Global error handler for dynamic import failures
window.addEventListener('error', (event) => {
  if (event.error instanceof TypeError && event.error.message.includes('Failed to fetch')) {
    console.error('NETWORK_ERROR: Failed to fetch dynamic module:', event.error);
    if (window.SWIFTPAY_FATAL) {
      window.SWIFTPAY_FATAL('CHUNK_LOAD_ERROR', event.error);
    }
    if (window.XEND_FATAL) {
      window.XEND_FATAL('CHUNK_LOAD_ERROR', event.error);
    }
  }
});

function clearCurtain() {
  const curtain = document.getElementById('boot-console');
  if (curtain) {
    curtain.style.opacity = '0';
    setTimeout(() => curtain.remove(), 600);
  }
}

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('DOM_ROOT_MISSING');

  const root = createRoot(rootElement);
  root.render(<App />);

  if (window.SWIFTPAY_LOG) window.SWIFTPAY_LOG('system_ready');
  if (window.XEND_LOG) window.XEND_LOG('system_ready');

  // Short delay to allow first paint
  setTimeout(clearCurtain, 1200);

} catch (error) {
  if (window.SWIFTPAY_FATAL) {
      window.SWIFTPAY_FATAL('REACT_MOUNT_FAILED', error as Error);
  }
  if (window.XEND_FATAL) {
      window.XEND_FATAL('REACT_MOUNT_FAILED', error as Error);
  }
}
