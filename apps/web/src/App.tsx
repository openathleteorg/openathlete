import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { RouterProvider } from 'react-router-dom';

import { ConsentBanner } from './components/consent';
import { StatusBarThemeSync } from './components/status-bar-theme-sync';
import { Toaster } from './components/ui/sonner';
import { AuthConsumer, AuthProvider } from './contexts/auth';
import { ChatbotProvider } from './contexts/chatbot';
import router from './routes/sections';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - cache is kept for 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: false, // Don't refetch on mount if data is fresh
      refetchOnReconnect: true, // Refetch when network reconnects
    },
  },
});

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
  return (
    <PostHogProvider client={posthog}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <StatusBarThemeSync />
        <AppContent />
      </ThemeProvider>
    </PostHogProvider>
  );
}

export default App;
