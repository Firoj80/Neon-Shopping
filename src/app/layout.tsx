"use client"; // Keep this as layout uses hooks

import { Inter } from 'next/font/google';
// Removed Metadata export as it conflicts with "use client" for now
// import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import './globals.css';
import { Providers } from './providers'; // Providers includes AppProvider
import { AppLayout } from '@/components/layout/app-layout'; // Corrected import path
import { Toaster } from "@/components/ui/toaster";
// AuthProvider is now inside Providers
// import { AuthProvider } from '@/context/auth-context';
// ClientOnly component wrapper removed, useClientOnly hook is used inside AppLayoutContent
// import ClientOnly from '@/components/client-only';
import { ThemeWatcher } from '@/context/theme-watcher';


const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

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
      <body
        className={cn(
          inter.variable,
          'font-sans antialiased min-h-screen flex flex-col bg-background',
        )}
      >
        <Providers> {/* Providers now includes AuthProvider */}
           <ThemeWatcher>
             {/* ClientOnly component wrapper removed here */}
                <AppLayout>
                  {children}
                </AppLayout>
                <Toaster />
           </ThemeWatcher>
        </Providers>
      </body>
    </html>
  );
}
