'use client';

import { type SiteEvent, track } from '@/utils/analytics';
import Link from 'next/link';
import type { ComponentProps } from 'react';

type TrackedLinkProps = Omit<ComponentProps<'a'>, 'href'> & {
  href: string;
  event: SiteEvent;
  properties?: Record<string, unknown>;
};

/**
 * A link that reports its click to PostHog. External links open in the same
 * tab for the app (the visitor is signing up) and in a new one otherwise.
 */
export function TrackedLink({
  href,
  event,
  properties,
  onClick,
  ...props
}: TrackedLinkProps) {
  const external = /^https?:\/\//.test(href);
  const toApp = external && new URL(href).hostname === 'app.openathlete.org';
  const handleClick: ComponentProps<'a'>['onClick'] = (e) => {
    track(event, { href, ...properties });
    onClick?.(e);
  };

  if (!external) {
    return <Link href={href} onClick={handleClick} {...props} />;
  }
  return (
    <a
      href={href}
      onClick={handleClick}
      {...(toApp ? {} : { target: '_blank', rel: 'noopener' })}
      {...props}
    />
  );
}
