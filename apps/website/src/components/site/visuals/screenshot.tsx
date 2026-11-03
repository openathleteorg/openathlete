import { cn } from '@/utils/shadcn';
import Image, { type StaticImageData } from 'next/image';

/**
 * A product screenshot in a light frame with a hint of window chrome.
 * Screens are captured at 2x, 1440 wide.
 */
export function Screenshot({
  src,
  alt,
  className,
  priority,
  chrome = true,
  sizes = '(min-width: 1280px) 1100px, 100vw',
}: {
  src: StaticImageData | string;
  alt: string;
  className?: string;
  priority?: boolean;
  chrome?: boolean;
  sizes?: string;
}) {
  return (
    <figure className={cn('shot', className)}>
      {chrome && (
        <div className="flex h-8 items-center gap-1.5 border-b border-border bg-paper px-3.5">
          <span className="size-2.5 rounded-full bg-[#e7e9f1]" />
          <span className="size-2.5 rounded-full bg-[#e7e9f1]" />
          <span className="size-2.5 rounded-full bg-[#e7e9f1]" />
          <span className="mx-auto font-mono text-[0.68rem] text-muted-foreground">
            app.openathlete.org
          </span>
          <span className="w-10" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        priority={priority}
        sizes={sizes}
        placeholder={typeof src === 'string' ? 'empty' : 'blur'}
        className="block h-auto w-full"
      />
    </figure>
  );
}

/** A phone-shaped frame for the mobile screenshots (390 wide at 2x). */
export function PhoneShot({
  src,
  alt,
  className,
  priority,
}: {
  src: StaticImageData | string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <figure
      className={cn(
        'relative rounded-[2.6rem] bg-ink p-[9px] shadow-[0_40px_80px_-30px_rgb(5_12_52/0.55),0_0_0_1px_rgb(255_255_255/0.08)_inset]',
        className,
      )}
    >
      <div className="overflow-hidden rounded-[2.05rem] bg-white">
        <Image
          src={src}
          alt={alt}
          priority={priority}
          sizes="320px"
          placeholder={typeof src === 'string' ? 'empty' : 'blur'}
          className="block h-auto w-full"
        />
      </div>
      <span className="absolute top-[18px] left-1/2 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-ink" />
    </figure>
  );
}
