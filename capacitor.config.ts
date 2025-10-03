import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.3198181e976d4dad989f284fb4a95d0a',
  appName: 'speak-build-apk',
  webDir: 'dist',
  server: {
    url: 'https://3198181e-976d-4dad-989f-284fb4a95d0a.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
