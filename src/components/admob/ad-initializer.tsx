
"use client"; // Ensure this runs client-side

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
// Use the community plugin import
import type { AdMobPlugin } from '@capacitor-community/admob'; // Import the type
// Dynamically import AdMob only when needed and on native platforms
let AdMob: AdMobPlugin | null = null;

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

  // Ensure code runs only on the client after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Dynamically load the AdMob plugin instance *only* on native platforms
  useEffect(() => {
    const loadAdMobPlugin = async () => {
      if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('AdMob') && !AdMob) {
        try {
          const { AdMob: AdMobPluginInstance } = await import('@capacitor-community/admob');
          AdMob = AdMobPluginInstance; // Assign the loaded plugin instance
          console.log("AdMob plugin loaded successfully.");
          initializeAdMob(); // Initialize right after loading
        } catch (error) {
          console.error("Error loading AdMob plugin:", error);
        }
      } else if (isClient && !Capacitor.isNativePlatform()) {
          console.log("Not on native platform, AdMob plugin will not be loaded.");
      } else if (isClient && !Capacitor.isPluginAvailable('AdMob')) {
          console.warn("AdMob plugin is not available.");
      }
    };

    if (isClient) { // Ensure we run this check only on the client
      loadAdMobPlugin();
    }
  }, [isClient]); // Depend on isClient state


  const initializeAdMob = async () => {
      // Redundant check, but good for safety: Ensure AdMob plugin is loaded and we're native
    if (!AdMob || !Capacitor.isNativePlatform() || isAdMobInitialized) {
      if(isAdMobInitialized) console.log("AdMob already initialized.");
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
      const bannerOptions = {
          adId: BANNER_AD_UNIT_ID_ANDROID, // Use your actual banner ID
          adSize: AdMob.BannerAdSize.ADAPTIVE_BANNER,
          position: AdMob.BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: process.env.NODE_ENV !== 'production',
          // npa: true, // Optional: Non-personalized ads
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


  // Cleanup banner on component unmount
  useEffect(() => {
    return () => {
        // Ensure checks before cleanup as well
      if (Capacitor.isNativePlatform() && AdMob) {
         AdMob.hideBanner().catch(err => console.error("Error hiding banner on cleanup:", err));
         // You might want to keep removeBanner if you don't want it persisting
         // AdMob.removeBanner().catch(err => console.error("Error removing banner on cleanup:", err));
      }
    };
  }, []); // Empty dependency array means this runs only on unmount

  // This component doesn't render anything visible itself
  return null;
}


// --- Interstitial Ad Functions ---

// Function to prepare the interstitial ad
export const prepareInterstitialAd = async () => {
  // Stricter checks: Ensure plugin is loaded, initialized, and we are on native
  if (!AdMob || !isAdMobInitialized || !Capacitor.isNativePlatform()) {
    console.log("AdMob not loaded, initialized, or not on native platform. Cannot prepare interstitial.");
    return;
  }

  if (isInterstitialPrepared) {
    console.log("Interstitial already prepared.");
    return; // Don't prepare again if already ready
  }

  try {
    const options = {
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
  // Stricter checks before showing
  if (!AdMob || !isAdMobInitialized || !Capacitor.isNativePlatform()) {
    console.log("Cannot show Interstitial Ad: AdMob not loaded, initialized, or not on native platform.");
    return; // Exit if checks fail
  }

   // If not prepared, try preparing first (optional, depending on your flow)
   if (!isInterstitialPrepared) {
       console.log("Interstitial not prepared, attempting to prepare now...");
       await prepareInterstitialAd();
       // Add a small delay to allow preparation (might not be necessary)
       await new Promise(resolve => setTimeout(resolve, 500)); // Wait 0.5 second
        // Re-check if preparation was successful
        if (!isInterstitialPrepared) {
             console.log("Interstitial preparation failed. Cannot show ad.");
             return;
        }
   }

  try {
    console.log("Attempting to show Interstitial Ad...");
    await AdMob.showInterstitial();
    console.log("Interstitial Ad shown successfully.");
    isInterstitialPrepared = false; // Ad shown, needs to be prepared again
    // Prepare the next one immediately after showing (good practice)
    await prepareInterstitialAd();

  } catch (error) {
    console.error("Error showing Interstitial Ad:", error);
    isInterstitialPrepared = false; // Reset flag on error
    // Attempt to prepare the next one even if showing failed
    await prepareInterstitialAd();
  }
};

// Helper function to get the AdMob plugin instance (can be used cautiously)
// It's generally safer to rely on the AdMob instance loaded in the AdInitializer
export const getAdMobPluginInstance = (): AdMobPlugin | null => {
    if (Capacitor.isNativePlatform() && AdMob) {
        return AdMob;
    }
    return null;
};
    