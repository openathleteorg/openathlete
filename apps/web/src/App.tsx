import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';

import { ConsentBanner } from './components/consent';
import { ServerSelection } from './components/mobile/server-selection';
import { StatusBarThemeSync } from './components/status-bar-theme-sync';
import { Toaster } from './components/ui/sonner';
import { AuthConsumer, AuthProvider } from './contexts/auth';
import { ChatbotProvider } from './contexts/chatbot';
import router from './routes/sections';
import { isCapacitor } from './utils/capacitor';
import {
  hasSelectedServer,
  onOpenServerSelection,
} from './utils/mobile-server';
import { queryClient } from './utils/query-client';

function AppContent() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ChatbotProvider>
          <AuthConsumer>
            <RouterProvider router={router} />
            <Toaster />
            <ConsentBanner />
          </AuthConsumer>
        </ChatbotProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

function App() {
  const [selectingServer, setSelectingServer] = useState(
    isCapacitor() && !hasSelectedServer(),
  );
  useEffect(() => onOpenServerSelection(() => setSelectingServer(true)), []);

  return (
    <PostHogProvider client={posthog}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <StatusBarThemeSync />
        {selectingServer ? (
          <ServerSelection
            onCancel={
              hasSelectedServer() ? () => setSelectingServer(false) : undefined
            }
          />
        ) : (
          <AppContent />
        )}
      </ThemeProvider>
    </PostHogProvider>
  );
}

export default App;
