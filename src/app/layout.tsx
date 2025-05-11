// src/app/layout.tsx
"use client";

import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers'; // Providers includes AppProvider
import { AppLayout } from '@/components/layout/app-layout'; 
import { Toaster } from "@/components/ui/toaster";
import ClientOnly from '@/components/client-only'; 
// Removed SidebarProvider as it's handled within AppLayout or not used directly
import { ThemeWatcher } from '@/components/theme-watcher';
import { cn } from '@/lib/utils';
// import { AdInitializer } from '@/components/admob/ad-initializer'; // AdMob removed

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
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
                  {/* Adjust main content padding to prevent overlap with fixed banner if ads were present */}
                  <div className="flex-grow"> {/* Removed pb-[50px] as ads are removed */}
                    {children}
                  </div>
                </AppLayout>
              {/* <AdInitializer /> AdMob removed */}
            </ClientOnly>
          </ThemeWatcher>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
