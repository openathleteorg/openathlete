import { useAuthContext } from '@/contexts/auth';
import { getPath } from '@/routes/paths';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Props = {
  children: React.ReactNode;
};

export default function GuestGuard({ children }: Props) {
  const navigate = useNavigate();

  const { authenticated } = useAuthContext();

  const [checked, setChecked] = useState(false);

  const check = useCallback(() => {
    if (authenticated) {
      navigate(getPath(['dashboard']));
    } else {
      setChecked(true);
    }
  }, [authenticated, navigate]);

  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) {
    return null;
  }

  return <>{children}</>;
}
