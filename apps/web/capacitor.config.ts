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
    // End of local development configuration
  },
  plugins: {
    SafeArea: {
      statusBarStyle: undefined,
      navigationBarStyle: undefined,
      detectViewportFitCoverChanges: true,
      initialViewportFitCover: true,
    },
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
    FirebaseAuthentication: {
      providers: ['google.com', 'apple.com'],
    },
  },
  android: {
    // Every plugin but @capgo/native-purchases: the Android app sells
    // nothing, and that plugin would add Google Play Billing and its
    // permission. Add new plugins here too.
    includePlugins: [
      '@capacitor-community/safe-area',
      '@capacitor-firebase/authentication',
      '@capacitor/browser',
      '@capacitor/push-notifications',
      '@capacitor/status-bar',
      'capacitor-voice-recorder',
    ],
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
