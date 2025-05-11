
"use client";

import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers'; // Providers includes AppProvider
import { AppLayout } from '@/components/layout/app-layout'; 
import { Toaster } from "@/components/ui/toaster";
// import { AuthProvider } from '@/context/auth-context'; // AuthProvider removed
import ClientOnly from '@/components/client-only'; 
// import { SidebarProvider } from '@/components/ui/sidebar'; // SidebarProvider removed
import { ThemeWatcher } from '@/context/theme-watcher';
import { cn } from '@/lib/utils';


const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

// Metadata is static or moved to a server component if dynamic parts are needed
// export const metadata: Metadata = {
//   title: 'Neon Shopping',
//   description: 'Track your expenses and manage shopping lists with a neon cyberpunk aesthetic.',
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
        <Providers>
          {/* SidebarProvider removed as its functionality is integrated into AppLayout or managed differently */}
          <ThemeWatcher>
            <ClientOnly>
              <AppLayout>
                {children}
              </AppLayout>
            </ClientOnly>
            <Toaster />
          </ThemeWatcher>
        </Providers>
      </body>
    </html>
  );
}

