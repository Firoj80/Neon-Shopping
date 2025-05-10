// src/app/layout.tsx
"use client"; 

import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers'; 
import { AppLayout } from '@/components/layout/app-layout'; 
import { Toaster } from "@/components/ui/toaster";
// AuthProvider removed
import ClientOnly from '@/components/client-only'; 
import { SidebarProvider } from '@/components/ui/sidebar'; 
import { ThemeWatcher } from '@/context/theme-watcher';
import { cn } from '@/lib/utils';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

// Metadata should be defined in a server component if needed, or as static export
// export const metadata: Metadata = {
// title: 'Neon Shopping',
// description: 'Track your expenses and manage shopping lists with a neon cyberpunk aesthetic.',
// icons: [{ rel: 'icon', url: '/favicon.ico' }],
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
        <Providers> {/* Providers now only includes AppProvider (and QueryClientProvider) */}
            <SidebarProvider> {/* Keep SidebarProvider if AppLayout relies on it */}
              <ThemeWatcher>
                <ClientOnly>
                  <AppLayout>
                    {children}
                  </AppLayout>
                </ClientOnly>
                <Toaster />
              </ThemeWatcher>
            </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
