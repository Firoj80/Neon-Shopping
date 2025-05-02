"use client"; // Ensure this runs client-side

import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

// Placeholder types for the AdMob plugin - Replace with actual types if available
interface AdMobPlugin {
  initialize: (options: { appId?: string; publisherId?: string; isTesting?: boolean }) => Promise<void>;
  showBanner: (options: AdOptions) => Promise<void>;
  prepareInterstitial: (options: AdOptions) => Promise<void>;
  showInterstitial: () => Promise<void>;
  AD_POSITION: {
    BOTTOM_CENTER: string;
    // Add other positions if needed
  };
  // Add other methods/properties if the plugin provides them
}

interface AdOptions {
  adId: string;
  position?: string;
  isTesting?: boolean;
  autoShow?: boolean;
   npa?: "ENABLED" | "DISABLED"; // Non-Personalized Ads setting
  // Add other options as per the plugin's API
}


// Use declare global to augment the window object
declare global {
    interface Window {
        AdMob?: AdMobPlugin; // Use the specific type if available, otherwise 'any'
    }
}


// AdMob configuration (Replace with your actual IDs)
// It's highly recommended to use environment variables for these in a real app
const ADMOB_APP_ID_ANDROID = 'ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy'; // Replace with your Android App ID
const BANNER_AD_UNIT_ID_ANDROID = 'ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz'; // Replace with your Android Banner ID
const INTERSTITIAL_AD_UNIT_ID_ANDROID = 'ca-app-pub-xxxxxxxxxxxxxxxx/wwwwwwwwww'; // Replace with your Android Interstitial ID


/**
 * This component handles AdMob initialization and banner display.
 * It should be rendered once in your main layout.
 */
const AdComponent: React.FC = () => {
  const [isAdMobInitialized, setIsAdMobInitialized] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure code runs only on the client after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only proceed if on client and AdMob plugin seems available
    if (!isClient || typeof window === 'undefined') {
      return;
    }

    // Check if running on a native platform (Android/iOS) using Capacitor
    if (!Capacitor.isNativePlatform()) {
        console.log("Not running on native platform, skipping AdMob initialization.");
        return;
    }

    // Check if the AdMob plugin exists on the window object
    if (typeof window.AdMob === 'undefined') {
       if (Capacitor.isNativePlatform()) {
           console.warn("AdMob plugin not found on window. Ensure it's installed, synced, and properly initialized in the native project.");
       }
      return;
    }


    const initialize = async () => {
      try {
        console.log("Attempting AdMob initialization...");

        // Initialize AdMob using the plugin's API
        // Note: Initialization options might vary based on the specific plugin used
        await window.AdMob!.initialize({
            // appId: ADMOB_APP_ID_ANDROID, // Some plugins might use appId here
            // publisherId: ADMOB_APP_ID_ANDROID, // Or publisherId
             isTesting: process.env.NODE_ENV !== 'production', // Recommended for development
            // isTesting: true, // Force test ads
        });
        console.log('AdMob initialized successfully.');


        // Show Banner Ad
         await window.AdMob!.showBanner({
           adId: BANNER_AD_UNIT_ID_ANDROID, // Use the correct banner ID
           position: window.AdMob!.AD_POSITION.BOTTOM_CENTER,
           isTesting: process.env.NODE_ENV !== 'production',
           // isTesting: true, // Force test ads
           npa: "DISABLED", // Adjust Non-Personalized Ads setting as needed
         });
        console.log('Banner Ad requested.');

         // Prepare Interstitial Ad (Load it but don't show yet)
         // Ensure this ID is correct and matches the one used in showInterstitialAd function
         await window.AdMob!.prepareInterstitial({
           adId: INTERSTITIAL_AD_UNIT_ID_ANDROID,
           isTesting: process.env.NODE_ENV !== 'production',
           // isTesting: true, // Force test ads
           autoShow: false,
         });
         console.log('Interstitial Ad prepared.');


        setIsAdMobInitialized(true); // Mark as initialized


      } catch (error) {
        console.error('Error initializing AdMob or handling ads:', error);
        setIsAdMobInitialized(false); // Ensure state reflects failure
      }
    };

    // Only initialize once
    if (!isAdMobInitialized) {
      initialize();
    }

     // Cleanup function (optional, depends on plugin behavior)
     return () => {
         // If the plugin provides a cleanup method (e.g., hideBanner, destroy), call it here
         // Example: window.AdMob?.hideBanner?.();
         console.log("AdComponent unmounted. Potential AdMob cleanup needed?");
     };


  }, [isClient, isAdMobInitialized]); // Rerun if isClient changes or if initialization fails

  // This component doesn't render anything visible itself.
  // AdMob ads are typically overlaid by the native plugin.
  return null;
};

export default AdComponent;