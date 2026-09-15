import { UserAPI } from '@/api/user';
import { useAuthContext } from '@/contexts/auth';
import { setLocale } from '@/paraglide/runtime';
import { useCallback } from 'react';

export function useLanguageSync() {
  const { authenticated } = useAuthContext();

  const syncLanguage = useCallback(
    async (lang: 'en' | 'fr' | 'it' | 'es') => {
      // Sync with backend if authenticated
      if (authenticated) {
        try {
          const language = lang.toUpperCase() as 'FR' | 'EN' | 'IT' | 'ES';
          await UserAPI.updateLanguage(language);
        } catch (error) {
          console.error('Failed to sync language with backend:', error);
        }
      }

      // Paraglide reloads the page, so persist the preference first.
      setLocale(lang);
    },
    [authenticated],
  );

  return { syncLanguage };
}
