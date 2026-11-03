import { cn } from '@/utils/shadcn';
import Image from 'next/image';

/** The app's mark followed by the wordmark, set in the site font. */
export function Logo({
  tone = 'dark',
  className,
}: {
  tone?: 'dark' | 'light';
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Image
        src={tone === 'dark' ? '/logo-mark.svg' : '/logo-mark-white.svg'}
        alt=""
        width={31}
        height={22}
        priority
        unoptimized
      />
      <span
        className={cn(
          'text-[1.05rem] font-semibold tracking-[-0.03em]',
          tone === 'dark' ? 'text-ink' : 'text-white',
        )}
      >
        OpenAthlete
      </span>
    </span>
  );
}
