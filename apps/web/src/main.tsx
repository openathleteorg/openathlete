// sort-imports-ignore
// Must stay first: the locale cookie is migrated before anything reads it
import './utils/adopt-locale-cookie';

import { getLocale } from '@/paraglide/runtime';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import './theme/index.css';
import { initAnalytics } from './utils/analytics';
import { isCapacitor } from './utils/capacitor';
import { initChunkLoadRecovery } from './utils/chunk-recovery';
import { initErrorMonitoring } from './utils/error-monitoring';
import { initPwa } from './utils/pwa';
import { captureSignupAttribution } from './utils/signup-attribution';
import { initStatusBar } from './utils/status-bar';

if (isCapacitor()) {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no',
    );
  }
}

document.documentElement.lang = getLocale();

// Before a redirect drops the query of the first page
captureSignupAttribution();
initErrorMonitoring();
initAnalytics();
initStatusBar();
initChunkLoadRecovery();
initPwa();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
