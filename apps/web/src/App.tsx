import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';

import { Toaster } from './components/ui/sonner';
import { AuthConsumer, AuthProvider } from './contexts/auth';
import { ChatbotProvider } from './contexts/chatbot';
import router from './routes/sections';

const queryClient = new QueryClient();

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ChatbotProvider>
          <AuthConsumer>
            <RouterProvider router={router} />
            <Toaster />
          </AuthConsumer>
        </ChatbotProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
