"use client";

import { Inter } from 'next/font/google';
// Removed Metadata export as it conflicts with "use client" for now
// import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import './globals.css';
import { Providers } from './providers'; // Providers includes AppProvider
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context'; // Import AuthProvider
import ClientOnly from '@/components/client-only'; // Import ClientOnly
import { ThemeWatcher } from '@/context/theme-watcher';
import Script from 'next/script';


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
        <Providers> {/* AppProvider is inside Providers */}
          <AuthProvider> {/* AuthProvider wraps ThemeWatcher and AppLayout */}
            <ThemeWatcher>
              <ClientOnly> {/* ClientOnly ensures AppLayout renders client-side */}
                <AppLayout>
                  {children}
                </AppLayout>
              </ClientOnly>
              <Toaster />
            </ThemeWatcher>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
