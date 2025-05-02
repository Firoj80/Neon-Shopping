"use client";

import { useState, useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
// import { AdMob, AdOptions, InterstitialAdPluginEvents } from '@capacitor-community/admob'; // Temporarily commented out

// Replace with your actual Ad Unit IDs from AdMob
const AD_UNIT_IDS = {
  // TODO: Replace with actual IDs from AdMob dashboard
  android_banner: 'ca-app-pub-3940256099942544/6300978111', // Test ID
  android_interstitial: 'ca-app-pub-3940256099942544/1033173712', // Test ID
  ios_banner: 'ca-app-pub-3940256099942544/2934735716', // Test ID
  ios_interstitial: 'ca-app-pub-3940256099942544/4411468910', // Test ID
};

// Determine Ad Unit ID based on platform
const getAdUnitId = (type: 'banner' | 'interstitial'): string | null => {
  const platform = Capacitor.getPlatform();
  if (platform === 'android') {
    return AD_UNIT_IDS[`android_${type}`];
  }
  if (platform === 'ios') {
    return AD_UNIT_IDS[`ios_${type}`];
  }
  return null; // Not on a supported native platform
};

export const useAdMob = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInterstitialLoading, setIsInterstitialLoading] = useState(false);
  const [isInterstitialReady, setIsInterstitialReady] = useState(false);

  // --- Initialization ---
  const initialize = useCallback(async () => {
    // if (!Capacitor.isNativePlatform() || isInitialized) {
    //   // console.log("AdMob: Not native or already initialized.");
    //   return;
    // }
    // console.log("AdMob: Attempting initialization...");
    // try {
    //   await AdMob.initialize({
    //     requestTrackingAuthorization: false, // Set true for iOS if needed
    //     testingDevices: [], // Add test device IDs if needed
    //     initializeForTesting: process.env.NODE_ENV !== 'production', // Use test ads in dev
    //   });
    //   setIsInitialized(true);
    //   console.log("AdMob: Initialized successfully.");
    //   // Automatically show banner after initialization
    //   showBanner();
    //   // Preload interstitial after initialization
    //   prepareInterstitial();
    // } catch (error) {
    //   console.error('AdMob: Initialization failed:', error);
    // }
  }, [/* isInitialized */]); // Temporarily remove dependency

  // --- Banner Ads ---
  const showBanner = useCallback(async () => {
    // if (!Capacitor.isNativePlatform() || !isInitialized) {
    //     // console.log("AdMob: Banner cannot be shown (not native or not initialized).");
    //     return;
    // }
    // const bannerId = getAdUnitId('banner');
    // if (!bannerId) {
    //     console.error("AdMob: Banner ID not found for this platform.");
    //     return;
    // }

    // const options: AdOptions = {
    //   adId: bannerId,
    //   isTesting: process.env.NODE_ENV !== 'production',
    //   // position: 'BOTTOM_CENTER', // Default position
    //   margin: 0,
    // };
    // console.log("AdMob: Attempting to show banner...");
    // try {
    //   await AdMob.showBanner(options);
    //   console.log('AdMob: Banner ad displayed.');
    // } catch (error) {
    //   console.error('AdMob: Failed to show banner:', error);
    // }
  }, [/* isInitialized */]); // Temporarily remove dependency

  const hideBanner = useCallback(async () => {
    // if (!Capacitor.isNativePlatform() || !isInitialized) return;
    // try {
    //   await AdMob.hideBanner();
    //   console.log('AdMob: Banner hidden.');
    // } catch (error) {
    //   console.error('AdMob: Failed to hide banner:', error);
    // }
  }, [/* isInitialized */]); // Temporarily remove dependency

  const resumeBanner = useCallback(async () => {
    // if (!Capacitor.isNativePlatform() || !isInitialized) return;
    // try {
    //   await AdMob.resumeBanner();
    //    console.log('AdMob: Banner resumed.');
    // } catch (error) {
    //   console.error('AdMob: Failed to resume banner:', error);
    // }
  }, [/* isInitialized */]); // Temporarily remove dependency

  const removeBanner = useCallback(async () => {
    // if (!Capacitor.isNativePlatform() || !isInitialized) return;
    // try {
    //   await AdMob.removeBanner();
    //    console.log('AdMob: Banner removed.');
    // } catch (error) {
    //   console.error('AdMob: Failed to remove banner:', error);
    // }
  }, [/* isInitialized */]); // Temporarily remove dependency


  // --- Interstitial Ads ---
  const prepareInterstitial = useCallback(async () => {
    // if (!Capacitor.isNativePlatform() || !isInitialized || isInterstitialLoading || isInterstitialReady) {
    //     // console.log("AdMob: Interstitial prepare skipped (not native, not initialized, loading, or ready).");
    //     return;
    // }
    // const interstitialId = getAdUnitId('interstitial');
    // if (!interstitialId) {
    //     console.error("AdMob: Interstitial ID not found for this platform.");
    //     return;
    // }

    // const options: AdOptions = {
    //   adId: interstitialId,
    //   isTesting: process.env.NODE_ENV !== 'production',
    // };
    // console.log("AdMob: Preparing interstitial...");
    // setIsInterstitialLoading(true);
    // try {
    //   await AdMob.prepareInterstitial(options);
    //   // Listener below will set isInterstitialReady to true
    //   console.log('AdMob: Interstitial preparation requested.');
    // } catch (error) {
    //   console.error('AdMob: Failed to prepare interstitial:', error);
    //   setIsInterstitialLoading(false); // Reset loading state on error
    // }
  }, [/* isInitialized, isInterstitialLoading, isInterstitialReady */]); // Temporarily remove dependency

  const showInterstitialAd = useCallback(async () => {
    // if (!Capacitor.isNativePlatform() || !isInitialized || !isInterstitialReady) {
    //   console.log("AdMob: Interstitial cannot be shown (not native, not initialized, or not ready).");
    //   // Optionally try to prepare again if not ready
    //   if (isInitialized && !isInterstitialReady && !isInterstitialLoading) {
    //       console.log("AdMob: Interstitial not ready, attempting to prepare again.");
    //       prepareInterstitial();
    //   }
    //   return;
    // }
    // console.log("AdMob: Attempting to show interstitial...");
    // try {
    //   await AdMob.showInterstitial();
    //   console.log('AdMob: Interstitial ad displayed.');
    //   setIsInterstitialReady(false); // Reset readiness after showing
    //   // Preload the next one
    //   prepareInterstitial();
    // } catch (error) {
    //   console.error('AdMob: Failed to show interstitial:', error);
    //   setIsInterstitialReady(false); // Reset readiness on error
    //   // Optionally try to prepare again after an error
    //   // prepareInterstitial();
    // }
  }, [/* isInitialized, isInterstitialReady, prepareInterstitial, isInterstitialLoading */]); // Temporarily remove dependency

   // --- Event Listeners for Interstitial ---
//   useEffect(() => {
//     if (!Capacitor.isNativePlatform()) return;

//     console.log("AdMob: Setting up interstitial listeners...");

//     const loadListener = AdMob.addListener(InterstitialAdPluginEvents.Loaded, (info: any) => {
//         console.log('AdMob Interstitial: Loaded', info);
//         setIsInterstitialReady(true);
//         setIsInterstitialLoading(false);
//     });

//     const loadFailListener = AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error: any) => {
//         console.error('AdMob Interstitial: Failed To Load', error);
//         setIsInterstitialReady(false);
//         setIsInterstitialLoading(false);
//          // Optional: Retry loading after a delay
//          // setTimeout(() => prepareInterstitial(), 5000); // Retry after 5 seconds
//     });

//     const showListener = AdMob.addListener(InterstitialAdPluginEvents.Showed, (info: any) => {
//         console.log('AdMob Interstitial: Showed', info);
//     });

//      const showFailListener = AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (error: any) => {
//         console.error('AdMob Interstitial: Failed To Show', error);
//         setIsInterstitialReady(false); // Assume it's no longer ready if show fails
//         setIsInterstitialLoading(false);
//         // Optionally try prepare again
//         // prepareInterstitial();
//     });

//     const dismissListener = AdMob.addListener(InterstitialAdPluginEvents.Dismissed, (info: any) => {
//       console.log('AdMob Interstitial: Dismissed', info);
//       setIsInterstitialReady(false); // Reset readiness after dismissal
//       // Preload the next one after dismissal
//       prepareInterstitial();
//     });

//     // Cleanup listeners on component unmount
//     return () => {
//       console.log("AdMob: Removing interstitial listeners...");
//       loadListener?.remove();
//       loadFailListener?.remove();
//       showListener?.remove();
//       showFailListener?.remove();
//       dismissListener?.remove();
//     };
//   }, [prepareInterstitial]); // Re-run if prepareInterstitial changes (due to dependencies)

  return {
    initialize,
    showBanner,
    hideBanner,
    resumeBanner,
    removeBanner,
    prepareInterstitial,
    showInterstitialAd,
    isInterstitialReady,
    isInterstitialLoading,
    isInitialized,
  };
};
