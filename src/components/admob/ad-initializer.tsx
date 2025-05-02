
"use client"; // Ensure this runs client-side

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob, AdOptions, AdLoadInfo, BannerAdOptions, BannerAdSize, BannerAdPosition, InterstitialAdOptions } from '@capacitor-community/admob';

// AdMob configuration (Replace with your actual IDs - Use environment variables ideally)
const ADMOB_APP_ID_ANDROID = 'ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy'; // Replace with your Android App ID
const BANNER_AD_UNIT_ID_ANDROID = 'ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz'; // Replace with your Android Banner ID
const INTERSTITIAL_AD_UNIT_ID_ANDROID = 'ca-app-pub-xxxxxxxxxxxxxxxx/wwwwwwwwww'; // Replace with your Android Interstitial ID

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
        // console.log("Not on native platform, skipping AdMob.");
      }
      return;
    }

    const initialize = async () => {
      if (isAdMobInitialized) return; // Don't initialize multiple times

      try {
        console.log("Attempting AdMob initialization...");
        // Initialize AdMob
        await AdMob.initialize({
          // requestTrackingAuthorization: true, // Optional: Request tracking authorization (iOS)
          // testingDevices: ['YOUR_TEST_DEVICE_ID'], // Add test device IDs during development
          initializeForTesting: process.env.NODE_ENV !== 'production', // Use test ads in development
        });
        isAdMobInitialized = true;
        console.log('AdMob initialized successfully.');

        // Show Banner Ad
        const bannerOptions: BannerAdOptions = {
          adId: BANNER_AD_UNIT_ID_ANDROID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: process.env.NODE_ENV !== 'production',
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

    initialize();

    // Cleanup function (optional, AdMob doesn't usually require explicit cleanup)
    // return () => {
    //   AdMob.hideBanner(); // Example cleanup if needed
    // };

  }, [isClient]); // Rerun if isClient changes

  // This component doesn't render anything visible itself
  return null;
}

// Function to prepare the interstitial ad (exported for use elsewhere)
export const prepareInterstitialAd = async () => {
  // Check platform and if AdMob plugin is initialized
  if (!isAdMobInitialized || !Capacitor.isNativePlatform()) {
    console.log("AdMob not initialized or not on native platform. Cannot prepare interstitial.");
    return;
  }

  if (isInterstitialPrepared) {
    // console.log("Interstitial already prepared.");
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

// Function to show the prepared interstitial ad (exported for use elsewhere)
export const showInterstitialAd = async () => {
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
