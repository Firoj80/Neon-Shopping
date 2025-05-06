
"use client"; // Ensure this runs client-side

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
// Use the community plugin import
import { AdMob, AdOptions, AdLoadInfo, BannerAdOptions, BannerAdSize, BannerAdPosition, InterstitialAdOptions } from '@capacitor-community/admob';
import type { AdMobPlugin } from '@capacitor-community/admob'; // Import the type

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

// --- Ad Initialization Component ---
export function AdInitializer() {
  const [isClient, setIsClient] = useState(false);
  const [admobPlugin, setAdmobPlugin] = useState<AdMobPlugin | null>(null);

  // Dynamically load the AdMob plugin
  useEffect(() => {
    const loadAdMobPlugin = async () => {
      if (Capacitor.isPluginAvailable('AdMob')) {
        // Use the specific import path required by Next.js dynamic import
        const { AdMob } = await import('@capacitor-community/admob');
        setAdmobPlugin(AdMob as AdMobPlugin);
      } else {
        console.warn('AdMob plugin is not available.');
      }
    };

    if (isClient && Capacitor.isNativePlatform()) {
      loadAdMobPlugin();
    }
  }, [isClient]);

  // Ensure code runs only on the client after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only proceed if on client, on a native platform, and the plugin is loaded
    if (!isClient || !Capacitor.isNativePlatform() || !admobPlugin) {
      if (isClient && !Capacitor.isNativePlatform()) {
        console.log("Not on native platform, skipping AdMob.");
      }
      if (isClient && Capacitor.isNativePlatform() && !admobPlugin && Capacitor.isPluginAvailable('AdMob')) {
          console.log("AdMob plugin available but not loaded yet...");
      }
      return;
    }

    const initialize = async () => {
      if (isAdMobInitialized) return; // Don't initialize multiple times

      try {
        console.log("Attempting AdMob initialization...");
        // Initialize AdMob using settings from capacitor.config.ts or explicitly here
        await admobPlugin.initialize({
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
            // npa: true, // Optional: Non-personalized ads
        };
        await admobPlugin.showBanner(bannerOptions);
        console.log('Banner Ad requested successfully.');

        // Prepare Interstitial Ad (prepare it early)
        await prepareInterstitialAd(admobPlugin);

      } catch (error) {
        console.error('Error initializing AdMob or handling ads:', error);
        isAdMobInitialized = false; // Reset flag on error
      }
    };

    initialize();

    // Optional cleanup function when the component unmounts
    return () => {
      if (Capacitor.isNativePlatform() && admobPlugin) {
         admobPlugin.hideBanner().catch(err => console.error("Error hiding banner on cleanup:", err));
         // Avoid removing the banner if it's meant to be persistent
         // admobPlugin.removeBanner().catch(err => console.error("Error removing banner on cleanup:", err));
      }
    };

  }, [isClient, admobPlugin]); // Rerun initialization logic if isClient or admobPlugin changes

  // This component doesn't render anything visible itself
  return null;
}


// --- Interstitial Ad Functions ---

// Function to prepare the interstitial ad
// Pass the loaded plugin instance
export const prepareInterstitialAd = async (plugin: AdMobPlugin | null) => {

  if (!isAdMobInitialized || !Capacitor.isNativePlatform() || !plugin) {
    console.log("AdMob not initialized, not on native platform, or plugin not loaded. Cannot prepare interstitial.");
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
    await plugin.prepareInterstitial(options);
    isInterstitialPrepared = true;
    console.log('Interstitial Ad prepared successfully.');
  } catch (error) {
    console.error('Error preparing Interstitial Ad:', error);
    isInterstitialPrepared = false; // Reset flag on error
  }
};

// Function to show the prepared interstitial ad
// Pass the loaded plugin instance
export const showPreparedInterstitialAd = async (plugin: AdMobPlugin | null) => {

  if (!isAdMobInitialized || !Capacitor.isNativePlatform() || !plugin) {
    console.log("Cannot show Interstitial Ad: AdMob not initialized, not on native platform, or plugin not loaded.");
    return; // Exit if AdMob not init or not native or plugin not loaded
  }

   // If not prepared, try preparing first
   if (!isInterstitialPrepared) {
       console.log("Interstitial not prepared, attempting to prepare now...");
       await prepareInterstitialAd(plugin);
       // Add a small delay to allow preparation
       await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        // Re-check if preparation was successful
        if (!isInterstitialPrepared) {
             console.log("Interstitial preparation failed. Cannot show ad.");
             return;
        }
   }

  try {
    console.log("Attempting to show Interstitial Ad...");
    await plugin.showInterstitial();
    console.log("Interstitial Ad shown successfully.");
    isInterstitialPrepared = false; // Ad shown, needs to be prepared again
    // Prepare the next one immediately after showing
    await prepareInterstitialAd(plugin);

  } catch (error) {
    console.error("Error showing Interstitial Ad:", error);
    isInterstitialPrepared = false; // Reset flag on error
    // Attempt to prepare the next one even if showing failed
    await prepareInterstitialAd(plugin);
  }
};

// Helper function to get the AdMob plugin instance (optional, can also manage via state)
export const getAdMobPlugin = async (): Promise<AdMobPlugin | null> => {
    if (Capacitor.isPluginAvailable('AdMob')) {
        // Ensure the dynamic import uses the correct package name
        const { AdMob } = await import('@capacitor-community/admob');
        return AdMob as AdMobPlugin;
    }
    return null;
};
