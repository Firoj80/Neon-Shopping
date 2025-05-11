"use client"; // Ensure this runs client-side

import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core'; // This import is correct

// Dynamically import AdMob to avoid issues during SSR or if plugin is not available
// AdMob types are defined below in AdMobPlugin interface for clarity

// --- Configuration ---
// IMPORTANT: Replace with your actual AdMob IDs.
// It's highly recommended to use environment variables for these.
// These are placeholders and MUST be replaced.
const ADMOB_APP_ID_ANDROID = process.env.NEXT_PUBLIC_ADMOB_APP_ID_ANDROID || 'ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy'; // REPLACE
const BANNER_AD_UNIT_ID_ANDROID = process.env.NEXT_PUBLIC_BANNER_AD_UNIT_ID_ANDROID || 'ca-app-pub-xxxxxxxxxxxxxxxx/wwwwwwwwww'; // REPLACE
const INTERSTITIAL_AD_UNIT_ID_ANDROID = process.env.NEXT_PUBLIC_INTERSTITIAL_AD_UNIT_ID_ANDROID || 'ca-app-pub-xxxxxxxxxxxxxxxx/vvvvvvvvvv'; // REPLACE


// --- AdMob Plugin Interface (for type safety) ---
interface BannerAdOptions {
  adId: string;
  adSize?: BannerAdSize;
  position?: BannerAdPosition;
  margin?: number | { top?: number; bottom?: number };
  isTesting?: boolean;
  npa?: boolean; // Non-Personalized Ads
}

enum BannerAdSize {
  BANNER = 'BANNER',
  LARGE_BANNER = 'LARGE_BANNER',
  MEDIUM_RECTANGLE = 'MEDIUM_RECTANGLE',
  FULL_BANNER = 'FULL_BANNER',
  LEADERBOARD = 'LEADERBOARD',
  SMART_BANNER = 'SMART_BANNER',
  ADAPTIVE_BANNER = 'ADAPTIVE_BANNER',
}

enum BannerAdPosition {
  TOP_CENTER = 'TOP_CENTER',
  CENTER = 'CENTER',
  BOTTOM_CENTER = 'BOTTOM_CENTER',
}

interface InterstitialAdOptions {
  adId: string;
  isTesting?: boolean;
  npa?: boolean;
}

interface AdMobPlugin {
  initialize: (options: {
    requestTrackingAuthorization?: boolean;
    testingDevices?: string[];
    initializeForTesting?: boolean;
  }) => Promise<void>;
  showBanner: (options: BannerAdOptions) => Promise<void>;
  hideBanner: () => Promise<void>;
  prepareInterstitial: (options: InterstitialAdOptions) => Promise<void>;
  showInterstitial: () => Promise<void>;
  // Add other methods if needed
}

let admobPluginInstance: AdMobPlugin | null = null;
let isAdMobSDKInitialized = false;
let isInterstitialAdPrepared = false;

// Helper function to safely get the AdMob plugin
const getAdMobPlugin = async (): Promise<AdMobPlugin | null> => {
    if (admobPluginInstance) return admobPluginInstance;
    if (Capacitor.isPluginAvailable('AdMob')) {
        try {
            const { AdMob } = await import('@capacitor-community/admob');
            admobPluginInstance = AdMob as AdMobPlugin; // Cast to our defined interface
            return admobPluginInstance;
        } catch (error) {
            console.error("Failed to dynamically import @capacitor-community/admob:", error);
            return null;
        }
    }
    console.warn("AdMob plugin not available on this platform or during SSR.");
    return null;
};


export function AdInitializer() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      if (isClient && Capacitor.getPlatform() !== 'android') {
        console.log("AdMob: Not on Android platform, skipping AdMob initialization.");
      } else if (isClient && !Capacitor.isNativePlatform()){
        console.log("AdMob: Not on a native platform, skipping AdMob initialization.");
      }
      return;
    }

    const initializeAndShowAds = async () => {
      const AdMob = await getAdMobPlugin();
      if (!AdMob) return;

      if (isAdMobSDKInitialized) {
        console.log("AdMob: SDK already initialized. Attempting to re-show banner.");
        try {
            const bannerOptions: BannerAdOptions = {
              adId: BANNER_AD_UNIT_ID_ANDROID,
              adSize: BannerAdSize.ADAPTIVE_BANNER,
              position: BannerAdPosition.BOTTOM_CENTER,
              margin: 0,
              isTesting: process.env.NODE_ENV !== 'production',
            };
            await AdMob.showBanner(bannerOptions);
        } catch(e) {
            console.error("AdMob: Error re-showing banner:", e);
        }
        return;
      }

      try {
        console.log("AdMob: Attempting SDK initialization...");
        await AdMob.initialize({
          initializeForTesting: process.env.NODE_ENV !== 'production',
        });
        isAdMobSDKInitialized = true;
        console.log('AdMob: SDK initialized successfully.');

        // Show Banner Ad
        const bannerOptions: BannerAdOptions = {
          adId: BANNER_AD_UNIT_ID_ANDROID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: process.env.NODE_ENV !== 'production',
        };
        await AdMob.showBanner(bannerOptions);
        console.log('AdMob: Banner Ad requested.');

        // Prepare Interstitial Ad
        await prepareInterstitialAdInternal();

      } catch (error) {
        console.error('AdMob: Error initializing SDK or showing banner ad:', error);
        isAdMobSDKInitialized = false;
      }
    };

    initializeAndShowAds();

    return () => {
      if (isClient && Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android' && isAdMobSDKInitialized && admobPluginInstance) {
        console.log("AdMob: Hiding banner on component unmount/cleanup.");
        admobPluginInstance.hideBanner().catch((err: any) => console.error("AdMob: Error hiding banner during cleanup:", err));
      }
    };
  }, [isClient]);

  // This component is for initialization and does not render UI itself.
  // The banner ad will be positioned fixed at the bottom by the AdMob plugin.
  // The fixed div container ensures space is reserved if needed and helps with debugging.
  return <div id="admob-banner-container" className="fixed bottom-0 left-0 right-0 h-[0px] z-50 pointer-events-none bg-transparent"></div>;
}


// Internal function to prepare interstitial ad
async function prepareInterstitialAdInternal() {
  const AdMob = await getAdMobPlugin();
  if (!AdMob || !isAdMobSDKInitialized || Capacitor.getPlatform() !== 'android') {
    console.log("AdMob: SDK not initialized, not on Android, or plugin not available. Cannot prepare interstitial.");
    return;
  }

  if (isInterstitialAdPrepared) {
    console.log("AdMob: Interstitial already prepared.");
    return;
  }

  try {
    const options: InterstitialAdOptions = {
      adId: INTERSTITIAL_AD_UNIT_ID_ANDROID,
      isTesting: process.env.NODE_ENV !== 'production',
    };
    console.log("AdMob: Preparing Interstitial Ad...");
    await AdMob.prepareInterstitial(options);
    isInterstitialAdPrepared = true;
    console.log('AdMob: Interstitial Ad prepared successfully.');
  } catch (error) {
    console.error('AdMob: Error preparing Interstitial Ad:', error);
    isInterstitialAdPrepared = false;
  }
}

// Exported function to show the prepared interstitial ad
export const showPreparedInterstitialAd = async () => {
  const AdMob = await getAdMobPlugin();
  if (!AdMob || !isAdMobSDKInitialized || !isInterstitialAdPrepared || Capacitor.getPlatform() !== 'android') {
    console.log("AdMob: Cannot show Interstitial Ad: SDK not initialized, ad not prepared, not on Android, or plugin not available.");
    if (!isInterstitialAdPrepared && isAdMobSDKInitialized && Capacitor.getPlatform() === 'android') {
        // Attempt to prepare it if it wasn't ready
        console.log("AdMob: Interstitial was not prepared, attempting to prepare now...");
        await prepareInterstitialAdInternal();
    }
    return;
  }

  try {
    console.log("AdMob: Attempting to show Interstitial Ad...");
    await AdMob.showInterstitial();
    console.log("AdMob: Interstitial Ad shown successfully.");
    isInterstitialAdPrepared = false; // Ad shown, needs to be prepared again
    await prepareInterstitialAdInternal(); // Prepare the next one
  } catch (error) {
    console.error("AdMob: Error showing Interstitial Ad:", error);
    isInterstitialAdPrepared = false;
    await prepareInterstitialAdInternal(); // Attempt to prepare next one even if showing failed
  }
};
