import { OPENATHLETE_LOGO } from '@/assets/brand';

export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src={OPENATHLETE_LOGO}
      alt="OpenAthlete"
      className={className || 'h-6 w-auto'}
      decoding="async"
      loading="eager"
    />
  );
}
