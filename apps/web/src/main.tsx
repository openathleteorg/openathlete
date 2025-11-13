import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import './theme/index.css';
import { loadAnalyticsScripts } from './utils/analytics';

loadAnalyticsScripts();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
