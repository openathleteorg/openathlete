'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';

type Provider = 'GARMIN' | 'STRAVA' | 'SUUNTO' | 'POLAR';

interface ProviderLogoProps {
  provider: Provider;
  className?: string;
}

export function ProviderLogo({
  provider,
  className = 'h-12 w-auto',
}: ProviderLogoProps) {
  const { resolvedTheme } = useTheme();

  const logos: Record<Provider, { light: string; dark?: string }> = {
    GARMIN: {
      light: '/providers/garmin.svg',
      dark: '/providers/garmin_dark.svg',
    },
    STRAVA: {
      light: '/providers/strava.svg',
    },
    SUUNTO: {
      light: '/providers/suunto.svg',
      dark: '/providers/suunto_dark.svg',
    },
    POLAR: {
      light: '/providers/polar.svg',
      dark: '/providers/polar_dark.svg',
    },
  };

  const logo = logos[provider];
  const src = resolvedTheme === 'dark' && logo.dark ? logo.dark : logo.light;
  const alt =
    provider.charAt(0) + provider.slice(1).toLowerCase().replace('_', ' ');

  return (
    <Image
      src={src}
      alt={alt}
      width={120}
      height={40}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
