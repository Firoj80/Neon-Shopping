'use client';

import React, { useEffect } from 'react';
import { AdInitializer } from './ad-initializer'; // Import the initializer

/**
 * AdComponent: Renders the AdInitializer to handle AdMob setup and banner display.
 * This component itself doesn't render a visible ad container,
 * as the banner is positioned fixed at the bottom by the plugin.
 */
export const AdComponent: React.FC = () => {
  // AdInitializer handles the actual AdMob logic
  return <AdInitializer />;
};
