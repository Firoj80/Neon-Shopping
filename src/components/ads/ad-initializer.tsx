"use client";

import { useEffect } from 'react';
// import { useAdMob } from '@/hooks/useAdmob'; // Temporarily commented out

/**
 * A client component responsible for initializing AdMob when the app loads.
 * It doesn't render anything itself.
 */
export function AdInitializer() {
  // const { initialize } = useAdMob(); // Temporarily commented out

  useEffect(() => {
    // console.log("AdInitializer mounting..."); // Debug log
    // try {
    //   initialize();
    //   console.log("AdMob initialization called."); // Debug log
    // } catch (error) {
    //   console.error("Error during AdMob initialization in component:", error);
    // }
     // Temporarily commented out initialization logic
  }, [/* initialize */]); // Temporarily remove dependency

  return null; // This component does not render anything visible
}
