import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.openathlete',
  appName: 'OpenAthlete',
  webDir: 'dist',
  server: {
    // Use https scheme for native apps
    androidScheme: 'https',
    iosScheme: 'https',
    // Uncomment for local development with live reload
    // url: 'http://localhost:5173',
    // cleartext: true,
  },
  // Configure deep linking for OAuth callbacks
  // OAuth callbacks will redirect to: openathlete://auth/callback/:provider
  // Make sure your OAuth providers (Strava, etc.) are configured with this URL
  app: {
    // Custom URL scheme for deep linking
    // This will be used for OAuth callbacks
    // Format: {appId}://{path}
    // Example: org.openathlete://auth/callback/strava
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
