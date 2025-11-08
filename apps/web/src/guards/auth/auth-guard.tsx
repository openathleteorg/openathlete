import { useGetMeQuery } from '@/api/user';
import { useAuthContext } from '@/contexts/auth';
import { getPath } from '@/routes/paths';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type Props = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { authenticated } = useAuthContext();
  const { data: user, isLoading } = useGetMeQuery();

  const [checked, setChecked] = useState(false);

  const check = useCallback(() => {
    if (!authenticated) {
      navigate(getPath(['auth', 'login']));
      return;
    }

    if (isLoading) return;

    if (user) {
      console.log(pathname);
      if (
        !user.onboardingCompleted &&
        pathname !== getPath(['dashboard', 'onboarding'])
      ) {
        navigate(getPath(['dashboard', 'onboarding']));
      }
      setChecked(true);
      return;
    }

    if (authenticated) {
      setChecked(true);
    }
  }, [authenticated, navigate, user, isLoading]);

  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, user, isLoading]);

  if (!checked) {
    return null;
  }

  return children;
}
