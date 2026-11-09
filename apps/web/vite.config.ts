import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig } from 'vite';

import { APP_LOCALE_COOKIE } from './src/utils/locale-cookie';

// Only the hosted builds have the key: the others ship no source map
const posthogApiKey = process.env.POSTHOG_API_KEY;

// https://vite.dev/config/
export default defineConfig(async () => ({
  build: { sourcemap: posthogApiKey ? ('hidden' as const) : false },
  plugins: [
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      // Not Paraglide's default name: another site under the same parent
      // domain can set PARAGLIDE_LOCALE for every subdomain, and the first
      // cookie of that name wins over the one the app sets
      cookieName: APP_LOCALE_COOKIE,
      // The iOS app runs on capacitor://, where WKWebView keeps no cookie:
      // localStorage holds its choice. The cookie stays first for the web,
      // where the E2E tests and older visits set it
      strategy: ['cookie', 'localStorage', 'globalVariable', 'baseLocale'],
    }),
    react(),
    tailwindcss(),
    posthogApiKey &&
      (await import('@posthog/rollup-plugin')).default({
        personalApiKey: posthogApiKey,
        projectId: process.env.POSTHOG_PROJECT_ID,
        host: 'https://eu.posthog.com',
        sourcemaps: { deleteAfterUpload: true },
      }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Define global for socket.io-client
    global: 'globalThis',
  },
  // Absolute in the native apps too: they serve the build from the root, and
  // with a relative base a reload on a nested route, such as a language
  // switch, asks for /dashboard/assets/... and shows a blank screen
  base: '/',
  server: {
    host: true,
    port: 5173,
  },
}));
