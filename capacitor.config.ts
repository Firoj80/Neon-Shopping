
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.firoj.neonshopping',
  appName: 'Neon Shopping List',
  webDir: 'out', // Ensure this matches your Next.js export directory
  bundledWebRuntime: false,
  // Server configuration (optional, adjust if needed for local development with Capacitor)
  // server: {
  //   androidScheme: 'https',
  //   url: 'http://192.168.0.101:3000', // Replace with your local IP if needed for live reload
  //   cleartext: true,
  // },
  plugins: {
    // Configuration for the AdMob plugin
    AdMob: {
      appId: {
         // IMPORTANT: Replace with your actual AdMob App ID
         // You can find this in your AdMob account
         android: 'ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy', // Example placeholder
         // ios: 'YOUR_IOS_ADMOB_APP_ID' // Add if targeting iOS
      },
      // Optional: Configure test ad settings
      initializeForTesting: true, // Use test ads during development
      // Optional: Configure other settings like tracking authorization (iOS)
      // requestTrackingAuthorization: true,
    },
    // Other plugin configurations...
  },
};

export default config;
