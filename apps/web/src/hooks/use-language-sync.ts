import { UserAPI } from '@/api/user';
import { useAuthContext } from '@/contexts/auth';
import { setLocale } from '@/paraglide/runtime';
import { useCallback } from 'react';

export function useLanguageSync() {
  const { authenticated } = useAuthContext();

  const syncLanguage = useCallback(
    async (lang: 'en' | 'fr') => {
      // Update locale in frontend
      setLocale(lang);

      // Sync with backend if authenticated
      if (authenticated) {
        try {
          const language = lang.toUpperCase() as 'FR' | 'EN';
          await UserAPI.updateLanguage(language);
        } catch (error) {
          console.error('Failed to sync language with backend:', error);
        }
      }
    },
    [authenticated],
  );

  return { syncLanguage };
}
