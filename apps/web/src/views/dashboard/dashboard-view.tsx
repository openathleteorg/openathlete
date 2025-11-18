import { useSpaceContext } from '@/contexts/space';
import { Navigate } from 'react-router-dom';

export function DashboardView() {
  const { space } = useSpaceContext();

  if (space === 'COACH') {
    return <Navigate to="/dashboard/coach" replace />;
  }

  return <Navigate to="/dashboard/calendar" replace />;
}
