/** Connected services, with their logo files in public/providers. */
export const PROVIDERS = [
  { slug: 'garmin', name: 'Garmin', logo: '/providers/garmin.svg', width: 476 },
  { slug: 'coros', name: 'COROS', logo: '/providers/coros.png', width: 527 },
  { slug: 'suunto', name: 'Suunto', logo: '/providers/suunto.svg', width: 398 },
  { slug: 'polar', name: 'Polar', logo: '/providers/polar.svg', width: 776 },
  { slug: 'strava', name: 'Strava', logo: '/providers/strava.svg', width: 608 },
] as const;

export type ProviderSlug = (typeof PROVIDERS)[number]['slug'];
