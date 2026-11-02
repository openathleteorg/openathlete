import { useSpaceContext } from '@/contexts/space';
import { useIsMobile } from '@/hooks/use-mobile';
import { Navigate } from 'react-router-dom';

export function DashboardView() {
  const { space } = useSpaceContext();
  const isMobile = useIsMobile();

  if (space === 'COACH') {
    return <Navigate to="/dashboard/coach" replace />;
  }

  return (
    <Navigate
      to={isMobile ? '/dashboard/today' : '/dashboard/calendar'}
      replace
    />
  );
}
