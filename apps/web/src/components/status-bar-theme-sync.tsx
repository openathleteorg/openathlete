import { updateStatusBarStyle } from '@/utils/status-bar';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';

export function StatusBarThemeSync() {
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    if (resolvedTheme) {
      updateStatusBarStyle(resolvedTheme as 'light' | 'dark');
    }
  }, [theme, resolvedTheme]);

  return null;
}

