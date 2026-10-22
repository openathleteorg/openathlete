import { SyncPanel } from '@/components/dashboard/sync-panel';
import { LoadingScreen } from '@/components/loading-screen';
import { useUserRoles } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { Navigate } from 'react-router-dom';

export function SyncPage() {
  const roles = useUserRoles();
  if (!roles) return <LoadingScreen />;
  if (!roles.includes('ATHLETE'))
    return <Navigate to={getPath(['dashboard'])} replace />;
  return (
    <>
      <title>{m.sync_panel_title()}</title>
      <div className="w-full max-w-4xl p-4 md:p-8">
        <SyncPanel />
      </div>
    </>
  );
}
