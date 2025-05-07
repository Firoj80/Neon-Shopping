import React from 'react';

export default function AppAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout remains simple, passing children through.
  // List-specific layout (like Tabs) or page-specific layouts handle their own structure.
  return <>{children}</>;
}
