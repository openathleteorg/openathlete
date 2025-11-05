import corosLogo from '@/assets/providers/coros.png';
import corosDarkLogo from '@/assets/providers/coros_dark.png';
import garminLogo from '@/assets/providers/garmin.svg';
import garminDarkLogo from '@/assets/providers/garmin_dark.svg';
import stravaLogo from '@/assets/providers/strava.svg';
import suuntoLogo from '@/assets/providers/suunto.svg';
import suuntoDarkLogo from '@/assets/providers/suunto_dark.svg';
import { useTheme } from 'next-themes';

export function StravaLogo({ className }: { className?: string }) {
  return (
    <img src={stravaLogo} alt="Strava" className={className || 'h-6 w-auto'} />
  );
}

export function GarminLogo({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();

  if (resolvedTheme === 'dark') {
    return (
      <img
        src={garminDarkLogo}
        alt="Garmin"
        className={className || 'h-6 w-auto'}
      />
    );
  }
  return (
    <img src={garminLogo} alt="Garmin" className={className || 'h-6 w-auto'} />
  );
}

export function SuuntoLogo({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();

  if (resolvedTheme === 'dark') {
    return (
      <img
        src={suuntoDarkLogo}
        alt="Suunto"
        className={className || 'h-6 w-auto'}
      />
    );
  }
  return (
    <img src={suuntoLogo} alt="Suunto" className={className || 'h-6 w-auto'} />
  );
}

export function CorosLogo({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();

  if (resolvedTheme === 'dark') {
    return (
      <img
        src={corosDarkLogo}
        alt="Coros"
        className={className || 'h-6 w-auto'}
        style={{ objectFit: 'contain' }}
      />
    );
  }
  return (
    <img
      src={corosLogo}
      alt="Coros"
      className={className || 'h-6 w-auto'}
      style={{ objectFit: 'contain' }}
    />
  );
}
