
import React from 'react';

export default function AppAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout is now simpler, just passing children through.
  // Settings-specific logic will be handled within the Settings page itself.
  return <>{children}</>;
}

    