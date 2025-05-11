
// src/app/layout.tsx
"use client";

import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers'; // Providers includes AppProvider
import { AppLayout } from '@/components/layout/app-layout'; // Corrected import path
import { Toaster } from "@/components/ui/toaster";
// Removed AuthProvider as per recent simplification requests
import ClientOnly from '@/components/client-only'; 
// Removed SidebarProvider as it's handled within AppLayout or not used directly
import { ThemeWatcher } from '@/components/theme-watcher'; // Corrected import path
import { cn } from '@/lib/utils';
import { AdInitializer } from '@/components/admob/ad-initializer'; // Import AdInitializer

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

// Metadata can be exported from server components, but RootLayout is client.
// If you need dynamic metadata, consider moving it to a server component parent if possible,
// or manage document.title directly in client components for simplicity if static export is not a concern.
// For now, static metadata is removed from this client component to avoid build errors.
// export const metadata: Metadata = {
//   title: 'Neon Shopping',
//   description: 'Track your expenses and manage shopping lists with a neon cyberpunk aesthetic.',
//   icons: [{ rel: 'icon', url: '/favicon.ico' }],
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Standard meta tags, links, etc. can go here */}
        <title>Neon Shopping</title>
        <meta name="description" content="Track your expenses and manage shopping lists with a neon cyberpunk aesthetic." />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={cn(
          inter.variable,
          'font-sans antialiased min-h-screen flex flex-col bg-background',
        )}
      >
        <Providers> {/* Providers includes AppProvider */}
          <ThemeWatcher>
            <ClientOnly> {/* Ensures AppLayout and its children only render client-side */}
                <AppLayout>
                  {/* Adjust main content padding to prevent overlap with fixed banner */}
                  <div className="flex-grow pb-[50px]"> {/* 50px is a typical banner height */}
                    {children}
                  </div>
                </AppLayout>
              <AdInitializer /> {/* Place AdInitializer here so it's part of the layout but can control its own fixed positioning */}
            </ClientOnly>
          </ThemeWatcher>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

