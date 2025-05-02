
"use client"; // Ensure this runs client-side

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

// Use dynamic import for the AdMob plugin to avoid SSR issues
// We assume the plugin installs a global AdMob object when running in Capacitor
declare global {
    interface Window {
        AdMob?: any; // Use 'any' for simplicity, replace with actual plugin type if available
    }
}

// AdMob configuration (Replace with your actual IDs)
const ADMOB_APP_ID_ANDROID = 'ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy'; // Replace with your Android App ID
const BANNER_AD_UNIT_ID_ANDROID = 'ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz'; // Replace with your Android Banner ID
const INTERSTITIAL_AD_UNIT_ID_ANDROID = 'ca-app-pub-xxxxxxxxxxxxxxxx/wwwwwwwwww'; // Replace with your Android Interstitial ID

export function AdInitializer() {
  const [isAdMobInitialized, setIsAdMobInitialized] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure code runs only on the client after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);


  useEffect(() => {
    // Only proceed if on client and AdMob plugin seems available
    if (!isClient || typeof window === 'undefined' || typeof window.AdMob === 'undefined') {
      if (isClient && Capacitor.isNativePlatform()) {
        // Log if native but AdMob plugin is missing (potential build issue)
        console.warn("AdMob plugin not found. Ensure it's installed and synced correctly in Capacitor.");
      }
      return;
    }

    // Check if running on a native platform (Android/iOS)
    if (!Capacitor.isNativePlatform()) {
       console.log("Not running on native platform, skipping AdMob initialization.");
      return;
    }

    const initialize = async () => {
      try {
        console.log("Attempting AdMob initialization...");
         // Use optional chaining just in case
        await window.AdMob?.initialize({
            appId: ADMOB_APP_ID_ANDROID, // Use the appropriate App ID for the platform
            // Publisher ID is often not needed for initialization with newer plugins
        });
        console.log('AdMob initialized successfully.');

        // Show Banner Ad
        await window.AdMob?.showBanner({
          adId: BANNER_AD_UNIT_ID_ANDROID,
          position: window.AdMob?.AD_POSITION.BOTTOM_CENTER,
          // isTesting: process.env.NODE_ENV !== 'production', // Use test ads during development
          isTesting: true, // Force test ads for now
          npa: "DISABLED", // Adjust Non-Personalized Ads setting as needed
        });
        console.log('Banner Ad requested.');

        // Prepare Interstitial Ad (Load it but don't show yet)
        await window.AdMob?.prepareInterstitial({
          adId: INTERSTITIAL_AD_UNIT_ID_ANDROID,
           // isTesting: process.env.NODE_ENV !== 'production',
           isTesting: true, // Force test ads
          autoShow: false,
        });
        console.log('Interstitial Ad prepared.');

        setIsAdMobInitialized(true); // Mark as initialized

      } catch (error) {
        console.error('Error initializing AdMob or showing ads:', error);
        setIsAdMobInitialized(false); // Ensure state reflects failure
      }
    };

    // Only initialize once
    if (!isAdMobInitialized) {
      initialize();
    }

    // No cleanup needed usually for AdMob initialize/showBanner
    // If the plugin provided destroy methods, you could add them here.

  }, [isClient, isAdMobInitialized]); // Rerun if isClient changes or if initialization fails and needs retry

  // This component doesn't render anything visible itself
  return null;
}

// Function to show interstitial ad (exported for use elsewhere)
export const showInterstitialAd = async () => {
    // Check platform and if AdMob plugin exists
    if (typeof window !== 'undefined' && typeof window.AdMob !== 'undefined' && Capacitor.isNativePlatform()) {
        try {
             console.log("Attempting to show Interstitial Ad...");
            // Prepare might be needed again if not loaded, but usually prepare once is enough
            // await window.AdMob?.prepareInterstitial({ adId: INTERSTITIAL_AD_UNIT_ID_ANDROID, isTesting: true, autoShow: false });
            await window.AdMob?.showInterstitial();
            console.log("Interstitial Ad shown (or attempted).");
            // Reload/prepare the next interstitial after showing one
            await window.AdMob?.prepareInterstitial({
                adId: INTERSTITIAL_AD_UNIT_ID_ANDROID,
                isTesting: true,
                autoShow: false,
            });
             console.log("Next Interstitial Ad prepared.");
        } catch (error) {
            console.error("Error showing Interstitial Ad:", error);
             // Attempt to prepare next one even if showing failed
             try {
                await window.AdMob?.prepareInterstitial({
                    adId: INTERSTITIAL_AD_UNIT_ID_ANDROID,
                    isTesting: true,
                    autoShow: false,
                });
                console.log("Next Interstitial Ad prepared after error.");
             } catch (prepareError) {
                 console.error("Error preparing next Interstitial Ad after previous error:", prepareError);
             }
        }
    } else {
        console.log("Interstitial Ad not shown: Not on native platform or AdMob not available.");
    }
};

