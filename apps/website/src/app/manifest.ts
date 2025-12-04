import { SITE_URL } from '@/config';
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OpenAthlete — AI-assisted endurance coaching platform',
    short_name: 'OpenAthlete',
    description:
      'OpenAthlete is the intelligent coaching platform that helps coaches and athletes plan, analyze and prevent fatigue through AI.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/favicon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/favicon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['sports', 'health', 'fitness'],
    lang: 'en',
    dir: 'ltr',
    orientation: 'portrait-primary',
    scope: SITE_URL,
  };
}
