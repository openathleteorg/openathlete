import { useAuthContext } from '@/contexts/auth';
import { getPath } from '@/routes/paths';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { LoadingScreen } from './loading-screen';

/**
 * Component that redirects to dashboard if authenticated, otherwise to login
 * Used for the root path "/" in Capacitor apps
 */
export function HomeRedirect() {
  const navigate = useNavigate();
  const { authenticated, loading } = useAuthContext();

  useEffect(() => {
    if (loading) {
      // Wait for auth to initialize
      return;
    }

    if (authenticated) {
      navigate(getPath(['dashboard']), { replace: true });
    } else {
      navigate(getPath(['auth', 'login']), { replace: true });
    }
  }, [authenticated, loading, navigate]);

  // Show loading while checking auth state
  return <LoadingScreen />;
}
