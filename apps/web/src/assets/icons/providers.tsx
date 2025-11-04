import stravaLogo from '@/assets/providers/strava.svg';
import garminLogo from '@/assets/providers/garmin.svg';
import suuntoLogo from '@/assets/providers/suunto.svg';
import corosLogo from '@/assets/providers/coros.png';

export function StravaLogo({ className }: { className?: string }) {
  return (
    <img
      src={stravaLogo}
      alt="Strava"
      className={className || 'h-6 w-auto'}
    />
  );
}

export function GarminLogo({ className }: { className?: string }) {
  return (
    <img
      src={garminLogo}
      alt="Garmin"
      className={className || 'h-6 w-auto'}
    />
  );
}

export function SuuntoLogo({ className }: { className?: string }) {
  return (
    <img
      src={suuntoLogo}
      alt="Suunto"
      className={className || 'h-6 w-auto'}
    />
  );
}

export function CorosLogo({ className }: { className?: string }) {
  return (
    <img
      src={corosLogo}
      alt="Coros"
      className={className || 'h-6 w-auto'}
      style={{ objectFit: 'contain' }}
    />
  );
}

