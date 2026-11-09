import { cn } from '@/utils/shadcn';
import Image from 'next/image';

import { PROVIDERS } from '../providers';

/** The five services in a row, all drawn at the same cap height. */
export function ProviderLogos({
  className,
  height = 22,
  tone = 'mono',
}: {
  className?: string;
  height?: number;
  tone?: 'mono' | 'color';
}) {
  return (
    <ul
      className={cn('flex flex-wrap items-center gap-x-10 gap-y-6', className)}
    >
      {PROVIDERS.map((provider) => (
        <li key={provider.slug}>
          <Image
            src={provider.logo}
            alt={provider.name}
            width={Math.round((provider.width / 128) * height)}
            height={height}
            unoptimized
            className={cn(
              'w-auto transition duration-300',
              tone === 'mono' &&
                'opacity-60 grayscale hover:opacity-100 hover:grayscale-0',
            )}
            style={{ height }}
          />
        </li>
      ))}
    </ul>
  );
}
