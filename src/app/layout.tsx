"use client"; // This must be a client component because of AppLayout's client-side logic

import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
// Removed usePathname import, no longer needed here
// Removed individual icon imports, handled in AppLayout
import { cn } from '@/lib/utils';
import './globals.css';
import { Providers } from './providers'; // Import Providers
import { AppLayout } from '@/components/layout/app-layout';
// Removed SidebarProvider import
import { Toaster } from "@/components/ui/toaster";
// Removed AuthProvider import
import ClientOnly from '@/components/client-only'; // Import ClientOnly


const inter = Inter({ // Keep font setup
  variable: '--font-inter',
  subsets: ['latin'],
});

// Metadata must be defined in a server component or outside the client component
// We'll keep the component as client due to AppLayout, metadata might need adjustment
// if strict separation is required, but this works for now.
/*
export const metadata: Metadata = {
  title: 'Neon Shopping',
  description: 'Track your expenses and manage shopping lists with a neon cyberpunk aesthetic.',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
};
*/

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable, // Use the correct font variable
          'font-sans antialiased min-h-screen flex flex-col bg-background', // Use font-sans
        )}
      >
        <Providers> {/* Providers includes AppProvider */}
           {/* Removed SidebarProvider wrap */}
                <AppLayout>
                  {children}
                </AppLayout>
              <Toaster />
           {/* Removed SidebarProvider wrap */}
        </Providers>
      </body>
    </html>
  );
}
