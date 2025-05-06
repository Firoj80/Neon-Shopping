"use client"; // Ensure this runs client-side

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
// Comment out the direct import causing build issues
// import { AdMob, AdOptions, AdLoadInfo, BannerAdOptions, BannerAdSize, BannerAdPosition, InterstitialAdOptions } from '@capacitor-community/admob';

// --- Configuration ---
// IMPORTANT: Replace with your actual AdMob IDs.
// Consider using environment variables for production.
// TODO: Replace with actual AdMob IDs
const ADMOB_APP_ID_ANDROID = 'ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy'; // Your AdMob App ID
const BANNER_AD_UNIT_ID_ANDROID = 'ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz'; // Your AdMob Banner Ad Unit ID
const INTERSTITIAL_AD_UNIT_ID_ANDROID = 'ca-app-pub-xxxxxxxxxxxxxxxx/wwwwwwwwww'; // Your AdMob Interstitial Ad Unit ID

// --- State Flags ---
let isAdMobInitialized = false; // Prevent multiple initializations
let isInterstitialPrepared = false; // Track if interstitial is ready

// Define types locally for AdMob functions if the import is commented out
// This provides some basic type safety within this file
type AdMobPlugin = {
    initialize(options: {
      requestTrackingAuthorization?: boolean;
      testingDevices?: string[];
      initializeForTesting?: boolean;
    }): Promise<void>;
    showBanner(options: BannerAdOptions): Promise<void>;
    hideBanner(): Promise<void>;
    prepareInterstitial(options: InterstitialAdOptions): Promise<AdLoadInfo>;
    showInterstitial(): Promise<void>;
    // Add other methods if you use them
};
type BannerAdOptions = {
    adId: string;
    adSize: BannerAdSize;
    position: BannerAdPosition;
    margin?: number;
    isTesting?: boolean;
    npa?: boolean; // Non-personalized ads
};
type InterstitialAdOptions = {
    adId: string;
    isTesting?: boolean;
    npa?: boolean;
};
type AdLoadInfo = {
    adUnitId: string;
};
enum BannerAdSize { // Define enums used
    ADAPTIVE_BANNER = 'ADAPTIVE_BANNER',
    // Add other sizes if needed
}
enum BannerAdPosition { // Define enums used
    BOTTOM_CENTER = 'BOTTOM_CENTER',
    // Add other positions if needed
}


// --- Ad Initialization Component ---
// This component should be mounted once in your app layout (e.g., in AppLayout.tsx)
export function AdInitializer() {
  const [isClient, setIsClient] = useState(false);

  // Ensure code runs only on the client after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only proceed if on client and on a native platform
    if (!isClient || !Capacitor.isNativePlatform()) {
      if (isClient && !Capacitor.isNativePlatform()) {
        console.log("Not on native platform, skipping AdMob.");
      }
      return;
    }

    // Dynamically check if AdMob plugin is available and get it
    const getAdMobPlugin = async (): Promise<AdMobPlugin | null> => {
        if (Capacitor.isPluginAvailable('AdMob')) {
            // Dynamically import the AdMob plugin only when needed and available
            const { AdMob } = await import('@capacitor-community/admob');
            return AdMob as AdMobPlugin; // Cast to our defined type
        }
        return null;
    };


    const initialize = async () => {
      if (isAdMobInitialized) return; // Don't initialize multiple times

      const AdMob = await getAdMobPlugin(); // Get the plugin instance
      if (!AdMob) {
          console.warn("AdMob plugin not available or failed to load.");
          return;
      }


      try {
        console.log("Attempting AdMob initialization...");
        // Initialize AdMob using settings from capacitor.config.ts or explicitly here
        await AdMob.initialize({
          // requestTrackingAuthorization: true, // Optional for iOS
          // testingDevices: ['YOUR_TEST_DEVICE_ID'], // Add test device IDs
          initializeForTesting: process.env.NODE_ENV !== 'production', // Use test ads in dev
        });
        isAdMobInitialized = true;
        console.log('AdMob initialized successfully.');

        // Show Banner Ad
        const bannerOptions: BannerAdOptions = {
            adId: BANNER_AD_UNIT_ID_ANDROID, // Use your actual banner ID
            adSize: BannerAdSize.ADAPTIVE_BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
            margin: 0,
            isTesting: process.env.NODE_ENV !== 'production',
        };
        await AdMob.showBanner(bannerOptions);
        console.log('Banner Ad requested successfully.');

        // Prepare Interstitial Ad (prepare it early)
        await prepareInterstitialAd();

      } catch (error) {
        console.error('Error initializing AdMob or handling ads:', error);
        isAdMobInitialized = false; // Reset flag on error
      }
    };

    initialize();

    // Optional cleanup function when the component unmounts
    return () => {
      if (Capacitor.isNativePlatform()) {
           // Get the plugin instance again for cleanup if needed
           getAdMobPlugin().then(AdMob => {
               if (AdMob) {
                  AdMob.hideBanner().catch(err => console.error("Error hiding banner on cleanup:", err));
               }
           });
      }
    };

  }, [isClient]); // Rerun initialization logic if isClient changes

  // This component doesn't render anything visible itself
  return null;
}


// --- Interstitial Ad Functions ---

// Function to prepare the interstitial ad
export const prepareInterstitialAd = async () => {
    const getAdMobPlugin = async (): Promise<AdMobPlugin | null> => {
        if (Capacitor.isPluginAvailable('AdMob')) {
            const { AdMob } = await import('@capacitor-community/admob');
            return AdMob as AdMobPlugin;
        }
        return null;
    };

  if (!isAdMobInitialized || !Capacitor.isNativePlatform()) {
    console.log("AdMob not initialized or not on native platform. Cannot prepare interstitial.");
    return;
  }

    const AdMob = await getAdMobPlugin();
    if (!AdMob) {
      console.warn("AdMob plugin not available during interstitial prepare.");
      return;
    }

  if (isInterstitialPrepared) {
    console.log("Interstitial already prepared.");
    return; // Don't prepare again if already ready
  }

  try {
    const options: InterstitialAdOptions = {
      adId: INTERSTITIAL_AD_UNIT_ID_ANDROID,
      isTesting: process.env.NODE_ENV !== 'production',
      // npa: true,
    };
    console.log("Preparing Interstitial Ad...");
    await AdMob.prepareInterstitial(options);
    isInterstitialPrepared = true;
    console.log('Interstitial Ad prepared successfully.');
  } catch (error) {
    console.error('Error preparing Interstitial Ad:', error);
    isInterstitialPrepared = false; // Reset flag on error
  }
};

// Function to show the prepared interstitial ad
export const showPreparedInterstitialAd = async () => {
    const getAdMobPlugin = async (): Promise<AdMobPlugin | null> => {
        if (Capacitor.isPluginAvailable('AdMob')) {
            const { AdMob } = await import('@capacitor-community/admob');
            return AdMob as AdMobPlugin;
        }
        return null;
    };

  if (!isAdMobInitialized || !isInterstitialPrepared || !Capacitor.isNativePlatform()) {
    console.log("Cannot show Interstitial Ad: AdMob not initialized, ad not prepared, or not on native platform.");
    // Optionally try preparing again if not prepared
    if (isAdMobInitialized && !isInterstitialPrepared && Capacitor.isNativePlatform()) {
        console.log("Interstitial not prepared, attempting to prepare now...");
        await prepareInterstitialAd();
        // If preparation was successful, try showing again (add a small delay)
        if (isInterstitialPrepared) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
             // Re-check flags before showing
             if (!isAdMobInitialized || !isInterstitialPrepared || !Capacitor.isNativePlatform()) return;
        } else {
            return; // Preparation failed
        }
    } else {
        return; // Exit if AdMob not init or not native
    }
  }

  const AdMob = await getAdMobPlugin();
  if (!AdMob) {
    console.warn("AdMob plugin not available during interstitial show.");
    return;
  }

  try {
    console.log("Attempting to show Interstitial Ad...");
    await AdMob.showInterstitial();
    console.log("Interstitial Ad shown successfully.");
    isInterstitialPrepared = false; // Ad shown, needs to be prepared again
    // Prepare the next one immediately after showing
    await prepareInterstitialAd();

  } catch (error) {
    console.error("Error showing Interstitial Ad:", error);
    isInterstitialPrepared = false; // Reset flag on error
    // Attempt to prepare the next one even if showing failed
    await prepareInterstitialAd();
  }
};
