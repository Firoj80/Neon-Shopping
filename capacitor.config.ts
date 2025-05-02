import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.firoj.neonshopping', // Use the requested package name
  appName: 'Neon Shopping List', // Use the updated app name
  webDir: 'out', // Directory where Next.js exports static files
  server: {
    androidScheme: 'https',
    // If using live reload during development:
    // url: 'http://YOUR_LOCAL_IP:9002', // Replace with your local IP and Next.js port
    // cleartext: true,
  },
  // Add plugins configuration if needed, e.g., for AdMob
  plugins: {
    // Example: Configure AdMob plugin if installed
    // AdMob: {
    //   appId: 'ca-app-pub-YOUR_ADMOB_APP_ID', // Replace with your actual AdMob App ID
    //   adSize: 'SMART_BANNER',
    //   position: 'BOTTOM_CENTER',
    //   testing: true, // Set to false for production builds
    //   margin: 0,
    //   bannerAdId: {
    //     android: 'ca-app-pub-YOUR_ANDROID_BANNER_ID', // Replace with your Android Banner ID
    //     // ios: 'ca-app-pub-YOUR_IOS_BANNER_ID' // Add iOS ID if needed
    //   },
    //   interstitialAdId: {
    //      android: 'ca-app-pub-YOUR_ANDROID_INTERSTITIAL_ID', // Replace with your Android Interstitial ID
    //     // ios: 'ca-app-pub-YOUR_IOS_INTERSTITIAL_ID' // Add iOS ID if needed
    //   },
    //   // Add other ad types (rewarded, etc.) if needed
    // },
  },
};

export default config;
