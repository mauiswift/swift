import './lib/api';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/dashboard-enhancements.css';

// Global error handler for dynamic import failures
window.addEventListener('error', (event) => {
  if (event.error instanceof TypeError && event.error.message.includes('Failed to fetch')) {
    console.error('NETWORK_ERROR: Failed to fetch dynamic module:', event.error);
  }
});

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('DOM_ROOT_MISSING');

  const root = createRoot(rootElement);
  root.render(<App />);

} catch (error) {
  console.error('REACT_MOUNT_FAILED', error);
}
