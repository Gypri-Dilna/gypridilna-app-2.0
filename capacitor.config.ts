import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cz.gypri.dilna',
  appName: 'Gypri Dílna',
  webDir: 'dist',
  server: {
    url: 'https://access.gypridilna.cz',
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      'access.gypridilna.cz',
      '*.access.gypridilna.cz',
      'accounts.google.com',
      '*.accounts.google.com',
      '*.google.com',
      '*.googleusercontent.com',
      '*.gstatic.com',
      '*.googleapis.com'
    ]
  }
};

export default config;
