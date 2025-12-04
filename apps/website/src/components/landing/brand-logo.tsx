'use client';

import { OPENATHLETE_LOGO, OPENATHLETE_WHITE_LOGO } from '@/assets/brand';
import { useTheme } from 'next-themes';
import Image from 'next/image';

export function BrandLogo({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  return (
    <Image
      src={resolvedTheme === 'dark' ? OPENATHLETE_WHITE_LOGO : OPENATHLETE_LOGO}
      alt="OpenAthlete"
      className={className || 'h-6 w-auto'}
      width={120}
      height={30}
      priority
    />
  );
}
