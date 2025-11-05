import { OPENATHLETE_LOGO, OPENATHLETE_WHITE_LOGO } from '@/assets/brand';
import { useTheme } from 'next-themes';

export function BrandLogo({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  return (
    <img
      src={resolvedTheme === 'dark' ? OPENATHLETE_WHITE_LOGO : OPENATHLETE_LOGO}
      alt="OpenAthlete"
      className={className || 'h-6 w-auto'}
      decoding="async"
      loading="eager"
    />
  );
}
