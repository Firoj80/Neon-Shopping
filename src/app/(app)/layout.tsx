import React from 'react';

// This layout now simply passes children through.
// AppLayout handles the main structure and conditional rendering based on auth.
export default function AppAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
