import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.firoj.neonshopping', // Your app's bundle ID
  appName: 'Neon Shopping',      // Your app's name
  webDir: 'out',                  // Folder containing your Next.js static export
  bundledWebRuntime: false,       // Recommended for Next.js
  // Server configuration is optional for local development
  // server: {
  //   url: 'http://192.168.0.103:3000', // Example: Your local IP if testing on device
  //   cleartext: true,                // Allow cleartext traffic (for local development only)
  // },
  plugins: {
    AdMob: {
      appId: {
        // Replace with your actual AdMob App ID for Android
        android: "ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy", 
        // ios: "ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy" // Add your iOS App ID if needed
      },
      // It's good practice to use test IDs during development
      // initializeForTesting: true, // This is now handled in the AdInitializer component based on NODE_ENV
    },
    // You can add other Capacitor plugins here
    // Example:
    // SplashScreen: {
    //   launchShowDuration: 3000,
    //   launchAutoHide: true,
    //   backgroundColor: "#000000", // Your app's background color
    //   androidSplashResourceName: "splash",
    //   showSpinner: true,
    //   splashFullScreen: true,
    //   splashImmersive: true,
    // },
    // Keyboard: {
    //   resize: 'body', // Or 'native', 'ionic'
    //   style: 'dark', // Or 'light'
    //   resizeOnFullScreen: true,
    // },
  },
};

export default config;
