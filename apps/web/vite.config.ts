import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
    }),
    react(),
    tailwindcss(),
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
  // Base path: use absolute path for web production, relative for Capacitor
  // For Capacitor builds, override this with --base=./ in the build command
  base: process.env.CAPACITOR === 'true' ? './' : '/',
  server: {
    host: true,
    port: 5173,
  },
});
