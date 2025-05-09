"use client"; // This layout needs to be a client component if it uses hooks or context

import React from 'react';
// Removed AuthProvider from here, it's higher up in RootLayout
// AppLayout will handle conditional rendering based on auth status

export default function AppAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout now simply passes children through.
  // AppLayout inside RootLayout handles the main structure and auth checks.
  return <>{children}</>;
}
