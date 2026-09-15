import { getLocale } from '@/paraglide/runtime';
import posthog from 'posthog-js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import './theme/index.css';
import { loadAnalyticsScripts } from './utils/analytics';
import { isCapacitor } from './utils/capacitor';
import { initChunkLoadRecovery } from './utils/chunk-recovery';
import { initErrorMonitoring } from './utils/error-monitoring';
import { initStatusBar } from './utils/status-bar';

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: '2026-01-30',
});

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

initErrorMonitoring();
loadAnalyticsScripts();
initStatusBar();
initChunkLoadRecovery();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
