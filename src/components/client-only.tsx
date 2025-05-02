
"use client"; // This component MUST be a client component

import React, { useState, useEffect } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
}

/**
 * Renders children only on the client-side after the initial mount.
 * This is useful for wrapping components that rely on browser-specific APIs
 * or have hydration mismatch issues.
 */
const ClientOnly: React.FC<ClientOnlyProps> = ({ children }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null; // Render nothing on the server or during the initial client render
  }

  return <>{children}</>; // Render children only after mounting on the client
};

export default ClientOnly;
