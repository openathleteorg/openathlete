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

/**
 * An iPhone 15 Pro around a phone screenshot. Captures are 393×852 with the
 * app's safe areas applied (59 px top, 34 px bottom), so the status bar, the
 * Dynamic Island and the home indicator drawn here sit over empty insets,
 * never over content. Every size is a share of the width: the frame holds
 * its proportions at any size.
 */
export function PhoneShot({
  src,
  alt,
  className,
  priority,
  sizes = '320px',
}: {
  src: StaticImageData | string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    // cqw resolves against the nearest container: the figure is that
    // container, so only its children may size themselves in cqw
    <figure className={cn('relative [container-type:inline-size]', className)}>
      {/* Titanium edge, then the black bezel */}
      <div className="rounded-[17cqw] bg-gradient-to-b from-[#3a3f55] via-[#1b1f33] to-[#3a3f55] p-[0.9cqw] shadow-[0_40px_80px_-30px_rgb(5_12_52/0.55)]">
        <div className="rounded-[16.2cqw] bg-[#05060d] p-[3.6cqw]">
          <div className="relative isolate aspect-[393/852] overflow-hidden rounded-[12.6cqw] bg-white [transform:translateZ(0)]">
            <Image
              src={src}
              alt={alt}
              priority={priority}
              sizes={sizes}
              placeholder={typeof src === 'string' ? 'empty' : 'blur'}
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
            {/* Status bar, over the 59 px top inset. Opaque on purpose: a
              backdrop filter escapes the rounded clip once the frame is
              rotated, and shows square corners over the bezel */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 flex h-[6.93%] items-center justify-between bg-white px-[8.5cqw] pt-[1.2cqw] text-[#050c34]"
            >
              <span className="w-[22cqw] text-center text-[4.3cqw] leading-none font-semibold tracking-tight">
                9:41
              </span>
              <span className="flex w-[22cqw] items-center justify-center gap-[1.4cqw]">
                <svg
                  viewBox="0 0 18 12"
                  className="h-[3cqw] w-auto"
                  fill="currentColor"
                >
                  <rect x="0" y="8" width="3" height="4" rx="1" />
                  <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
                  <rect x="10" y="3" width="3" height="9" rx="1" />
                  <rect x="15" y="0" width="3" height="12" rx="1" />
                </svg>
                <svg
                  viewBox="0 0 16 12"
                  className="h-[3cqw] w-auto"
                  fill="currentColor"
                >
                  <path d="M8 2.6c2.2 0 4.2.85 5.7 2.25l1.25-1.3A9.9 9.9 0 0 0 8 .8 9.9 9.9 0 0 0 1.05 3.55l1.25 1.3A8.1 8.1 0 0 1 8 2.6Zm0 3.6c1.2 0 2.3.45 3.15 1.2l1.25-1.3A6.4 6.4 0 0 0 8 4.4c-1.7 0-3.25.65-4.4 1.7l1.25 1.3A4.6 4.6 0 0 1 8 6.2Zm0 3.6c.45 0 .85.15 1.2.4L8 11.5 6.8 10.2c.35-.25.75-.4 1.2-.4Z" />
                </svg>
                <svg
                  viewBox="0 0 27 13"
                  className="h-[3.1cqw] w-auto"
                  fill="none"
                >
                  <rect
                    x="0.5"
                    y="0.5"
                    width="23"
                    height="12"
                    rx="3.5"
                    stroke="currentColor"
                    opacity="0.4"
                  />
                  <rect
                    x="2"
                    y="2"
                    width="17"
                    height="9"
                    rx="2"
                    fill="currentColor"
                  />
                  <path
                    d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z"
                    fill="currentColor"
                    opacity="0.4"
                  />
                </svg>
              </span>
            </div>
            {/* Dynamic Island */}
            <span
              aria-hidden
              className="absolute top-[1.29%] left-1/2 h-[4.34%] w-[32%] -translate-x-1/2 rounded-full bg-[#05060d]"
            />
            {/* Home indicator, inside the 34 px bottom inset */}
            <span
              aria-hidden
              className="absolute bottom-[0.94%] left-1/2 h-[0.6%] w-[34%] -translate-x-1/2 rounded-full bg-[#050c34]/85"
            />
          </div>
        </div>
      </div>
    </figure>
  );
}
