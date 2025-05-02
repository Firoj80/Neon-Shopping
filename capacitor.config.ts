
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.firoj.neonshopping',
  appName: 'Neon Shopping List',
  webDir: 'out', // Ensure this matches your Next.js export directory
  bundledWebRuntime: false,
  // Remove AdMob config for now to avoid potential issues
  plugins: {
    // AdMob: { // Removed AdMob plugin config
    //   appId: {
    //     android: 'ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy', // TODO: Replace with actual ID
    //   },
    //    initializeForTesting: true, // Use test ads during development
    // },
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
    //     description: 'Required for network access',
    //   },
    // ],
  },
};

export default config;
