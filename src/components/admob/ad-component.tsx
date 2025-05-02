
"use client";

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the AdInitializer component only on the client-side
const AdInitializer = dynamic(() =>
  import('./ad-initializer').then(mod => mod.AdInitializer), // Ensure you import the component correctly
  { ssr: false } // Disable Server-Side Rendering for this component
);

const AdComponent: React.FC = () => {
  // This component simply renders the AdInitializer, which handles the actual AdMob logic.
  // The dynamic import ensures it only runs client-side.
  return <AdInitializer />;
};

export default AdComponent;
