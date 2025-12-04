'use client';

import { ParaglideProvider } from '@/components/paraglide/ParaglideProvider';
import { queryClient } from '@/lib/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';

interface ProvidersProps {
  children: React.ReactNode;
  locale?: string;
}

export function Providers({ children, locale }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ParaglideProvider initialLocale={locale}>{children}</ParaglideProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
