import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import './theme/index.css';
import { loadAnalyticsScripts } from './utils/analytics';
import { initChunkLoadRecovery } from './utils/chunk-recovery';
import { initStatusBar } from './utils/status-bar';

loadAnalyticsScripts();
initStatusBar();
initChunkLoadRecovery();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
