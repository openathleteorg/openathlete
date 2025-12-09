import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import './theme/index.css';
import { loadAnalyticsScripts } from './utils/analytics';
import { isCapacitor } from './utils/capacitor';
import { initChunkLoadRecovery } from './utils/chunk-recovery';
import { initErrorMonitoring } from './utils/error-monitoring';
import { initStatusBar } from './utils/status-bar';

if (isCapacitor()) {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
    );
  }
}

initErrorMonitoring();
loadAnalyticsScripts();
initStatusBar();
initChunkLoadRecovery();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
