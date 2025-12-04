'use client';

import corosLogo from '@/assets/providers/coros.png';
import corosDarkLogo from '@/assets/providers/coros_dark.png';
import garminLogo from '@/assets/providers/garmin.svg';
import garminDarkLogo from '@/assets/providers/garmin_dark.svg';
import polarLogo from '@/assets/providers/polar.svg';
import polarDarkLogo from '@/assets/providers/polar_dark.svg';
import stravaLogo from '@/assets/providers/strava.svg';
import suuntoLogo from '@/assets/providers/suunto.svg';
import suuntoDarkLogo from '@/assets/providers/suunto_dark.svg';
import Image from 'next/image';
import { useTheme } from 'next-themes';

export function StravaLogo({ className }: { className?: string }) {
  return (
    <Image
      src={stravaLogo}
      alt="Strava"
      className={className || 'h-6 w-auto'}
      width={100}
      height={24}
      style={{ width: 'auto', height: '100%' }}
    />
  );
}

export function GarminLogo({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === 'dark' ? garminDarkLogo : garminLogo;

  return (
    <Image
      src={logo}
      alt="Garmin"
      className={className || 'h-6 w-auto'}
      width={100}
      height={24}
      style={{ width: 'auto', height: '100%' }}
    />
  );
}

export function SuuntoLogo({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === 'dark' ? suuntoDarkLogo : suuntoLogo;

  return (
    <Image
      src={logo}
      alt="Suunto"
      className={className || 'h-6 w-auto'}
      width={100}
      height={24}
      style={{ width: 'auto', height: '100%' }}
    />
  );
}

export function CorosLogo({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === 'dark' ? corosDarkLogo : corosLogo;

  return (
    <Image
      src={logo}
      alt="Coros"
      className={className || 'h-6 w-auto'}
      width={100}
      height={40}
      style={{ width: 'auto', height: '100%', objectFit: 'contain' }}
    />
  );
}

export function PolarLogo({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();

  if (resolvedTheme === 'dark') {
    return (
      <img
        src={polarDarkLogo}
        alt="Polar"
        className={className || 'h-6 w-auto'}
      />
    );
  }
  return (
    <img src={polarLogo} alt="Polar" className={className || 'h-6 w-auto'} />
  );
}

