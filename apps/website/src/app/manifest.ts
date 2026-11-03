import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OpenAthlete',
    short_name: 'OpenAthlete',
    description:
      'Open-source training platform for endurance athletes and coaches: plan, sync your watch, follow training load.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#050c34',
    icons: [
      { src: '/favicon.png', sizes: '64x64', type: 'image/png' },
      { src: '/logo_dark.png', sizes: '256x256', type: 'image/png' },
    ],
    categories: ['sports', 'health', 'fitness'],
    lang: 'en',
    dir: 'ltr',
  };
}
