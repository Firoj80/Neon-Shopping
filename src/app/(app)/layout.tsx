import React from 'react';

export default function AppAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout can be used for elements common to the main app sections
  // like /list, /stats, /settings. For now, it just passes children through.
  return <>{children}</>;
}
