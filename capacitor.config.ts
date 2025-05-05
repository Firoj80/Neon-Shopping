import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.firoj.neonshopping', // Keep your package name
  appName: 'Neon Shopping', // Updated App Name
  webDir: 'out', // Ensure this matches your Next.js export directory
  bundledWebRuntime: false,
  plugins: {
    AdMob: {
      appId: {
        android: 'ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy', // Replace with your AdMob App ID
        // ios: 'ca-app-pub-xxxxxxxxxxxxxxxx~zzzzzzzzzz' // Add iOS ID if needed
      },
      initializeForTesting: true, // Keep true for testing, set to false for production
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
    //     description: 'Required for network access',
    //   },
    // ],
  },
};

export default config;
