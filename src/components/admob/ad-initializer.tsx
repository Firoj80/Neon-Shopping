
"use client"; // Ensure this runs client-side

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
// Import specific types if needed, but avoid importing the main AdMob object directly if it causes issues
// import type { AdOptions, AdLoadInfo, BannerAdOptions, BannerAdSize, BannerAdPosition, InterstitialAdOptions } from '@capacitor-community/admob';

// Placeholder type for the AdMob object if the plugin is installed globally or attached to window
declare global {
    interface Window {
        AdMob?: any; // Use 'any' for now, refine if possible based on the actual plugin structure
    }
}


// AdMob configuration (Replace with your actual IDs - Use environment variables ideally)
const ADMOB_APP_ID_ANDROID = 'ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy'; // Your AdMob App ID
const BANNER_AD_UNIT_ID_ANDROID = 'ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz'; // Your AdMob Banner Ad Unit ID
const INTERSTITIAL_AD_UNIT_ID_ANDROID = 'ca-app-pub-xxxxxxxxxxxxxxxx/wwwwwwwwww'; // Your AdMob Interstitial Ad Unit ID

let isAdMobInitialized = false; // Prevent multiple initializations
let isInterstitialPrepared = false; // Track if interstitial is ready

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

    const initialize = async () => {
      // Access AdMob through the window object if it's attached there by the plugin
       const AdMob = window.AdMob;

      if (!AdMob) {
          console.error("AdMob plugin not found. Please ensure '@capacitor-community/admob' is correctly installed and synced.");
          return;
      }

      if (isAdMobInitialized) return; // Don't initialize multiple times

      try {
        console.log("Attempting AdMob initialization...");
        // Initialize AdMob using settings from capacitor.config.ts or directly
        await AdMob.initialize({
          // requestTrackingAuthorization: true, // Optional: Request tracking authorization (iOS)
          // testingDevices: ['YOUR_TEST_DEVICE_ID'], // Add test device IDs during development
          initializeForTesting: process.env.NODE_ENV !== 'production', // Use test ads in development
        });
        isAdMobInitialized = true;
        console.log('AdMob initialized successfully.');

        // Define BannerAdSize and BannerAdPosition using the AdMob object if available
        const BannerAdSize = AdMob.BannerAdSize || {}; // Provide fallback empty object
        const BannerAdPosition = AdMob.BannerAdPosition || {};

        // Show Banner Ad
        const bannerOptions /*: BannerAdOptions */ = { // Temporarily comment out type
          adId: BANNER_AD_UNIT_ID_ANDROID, // Use your actual banner ID
          adSize: BannerAdSize.ADAPTIVE_BANNER || 'ADAPTIVE_BANNER', // Use fallback string if needed
          position: BannerAdPosition.BOTTOM_CENTER || 'BOTTOM_CENTER', // Use fallback string if needed
          margin: 0,
          isTesting: process.env.NODE_ENV !== 'production', // Or false for production
          // npa: true, // Optional: Non-personalized ads
        };
        await AdMob.showBanner(bannerOptions);
        console.log('Banner Ad requested.');

        // Prepare Interstitial Ad
        await prepareInterstitialAd(); // Call the preparation function

      } catch (error) {
        console.error('Error initializing AdMob or handling ads:', error);
        isAdMobInitialized = false; // Reset flag on error
      }
    };

    // Delay slightly to potentially allow plugin to attach to window
    const timer = setTimeout(initialize, 300);


    // Optional cleanup function
    return () => {
        clearTimeout(timer);
       const AdMob = window.AdMob;
       if (Capacitor.isNativePlatform() && AdMob && AdMob.hideBanner) {
           AdMob.hideBanner().catch((err: any) => console.error("Error hiding banner:", err));
       }
    };

  }, [isClient]); // Rerun if isClient changes

  // This component doesn't render anything visible itself
  return null;
}

// Function to prepare the interstitial ad (exported for use elsewhere)
export const prepareInterstitialAd = async () => {
    const AdMob = window.AdMob;
    if (!AdMob) {
        console.warn("AdMob plugin not found for prepareInterstitialAd.");
        return;
    }

  // Check platform and if AdMob plugin is initialized
  if (!isAdMobInitialized || !Capacitor.isNativePlatform()) {
    console.log("AdMob not initialized or not on native platform. Cannot prepare interstitial.");
    return;
  }

  if (isInterstitialPrepared) {
     console.log("Interstitial already prepared.");
    return; // Don't prepare again if already ready
  }

  try {
    const options /*: InterstitialAdOptions */ = { // Temporarily comment out type
      adId: INTERSTITIAL_AD_UNIT_ID_ANDROID, // Use your actual interstitial ID
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

// Function to show the prepared interstitial ad (exported for use elsewhere)
export const showPreparedInterstitialAd = async () => {
    const AdMob = window.AdMob;
     if (!AdMob) {
        console.warn("AdMob plugin not found for showPreparedInterstitialAd.");
        return;
    }
    // Check platform and if AdMob is initialized and interstitial is ready
  if (!isAdMobInitialized || !isInterstitialPrepared || !Capacitor.isNativePlatform()) {
    console.log("Cannot show Interstitial Ad: AdMob not initialized, ad not prepared, or not on native platform.");
    return;
  }

  try {
    console.log("Attempting to show Interstitial Ad...");
    await AdMob.showInterstitial();
    console.log("Interstitial Ad shown successfully.");
    // Reset prepared state and prepare the next one
    isInterstitialPrepared = false;
    await prepareInterstitialAd(); // Prepare the next one immediately

  } catch (error) {
    console.error("Error showing Interstitial Ad:", error);
    isInterstitialPrepared = false; // Reset flag on error
     // Attempt to prepare next one even if showing failed
     await prepareInterstitialAd();
  }
};
