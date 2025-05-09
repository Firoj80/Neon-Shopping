
"use client"; // Keep this as layout uses hooks

import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import './globals.css';
import { Providers } from './providers'; // Providers includes AppProvider
import { AppLayout } from '@/components/layout/app-layout'; // Corrected import path
import { Toaster } from "@/components/ui/toaster";
// Removed AuthProvider import as it's now part of Providers
import ClientOnly from '@/components/client-only'; // Import ClientOnly
import { ThemeWatcher } from '@/context/theme-watcher'; // Re-add ThemeWatcher

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

// Removed Metadata export as it conflicts with "use client"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          'font-sans antialiased min-h-screen flex flex-col bg-background',
        )}
      >
        <Providers> {/* Providers now includes AuthProvider */}
           <ThemeWatcher>
             <ClientOnly> {/* Wrap AppLayout and Toaster */}
                <AppLayout>
                  {children}
                </AppLayout>
                <Toaster />
             </ClientOnly>
           </ThemeWatcher>
        </Providers>
      </body>
    </html>
  );
}
