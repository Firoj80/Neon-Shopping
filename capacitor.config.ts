
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.firoj.neonshopping',
  appName: 'Neon Shopping List',
  webDir: 'out', // Ensure this matches your Next.js export directory
  bundledWebRuntime: false,
  // Add AdMob plugin configuration
  plugins: {
    AdMob: {
      appId: {
        // Replace with your actual AdMob App IDs
        // It's strongly recommended to use environment variables for these
        android: 'ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy', // TODO: Replace with actual ID
        // ios: 'ca-app-pub-xxxxxxxxxxxxxxxx~zzzzzzzzzz' // Add iOS ID if needed
      },
       // Optional: Configure other global settings if needed
       // sameAppKey: true, // Example setting
       // testingDevices: ['YOUR_TEST_DEVICE_ID'], // Add your test device ID here
       initializeForTesting: true, // Use test ads during development
    },
  },
   // Server configuration for local development (optional but helpful)
   server: {
     androidScheme: 'http', // Use http for local development
     // url: 'http://192.168.0.1:3000', // Replace with your local IP if needed for device testing
     cleartext: true, // Allow cleartext traffic for local development (disable for production)
   },
   // Ensure necessary Android permissions if not automatically added by plugin
   android: {
    // Example: If plugin requires internet permission
    // permissions: [
    //   {
    //     name: 'android.permission.INTERNET',
    //     description: 'Required for network access (AdMob)',
    //   },
    // ],
  },
};

export default config;
