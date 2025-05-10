import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers'; 
import { AppLayout } from '@/components/layout/AppLayout'; // Ensure this path is correct
import { Toaster } from "@/components/ui/toaster";
import ClientOnly from '@/components/client-only';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ThemeWatcher } from '@/context/theme-watcher';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// Metadata should be defined in a server component or at the page level if layout is client component
// For now, keeping it here, but if 'use client' is added to this file, it needs to move.
export const metadata: Metadata = {
  title: 'Neon Shopping',
  description: 'Track your expenses and manage shopping lists with a neon cyberpunk aesthetic.',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          'font-sans antialiased min-h-screen flex flex-col bg-background'
        )}
      >
        <Providers> {/* AppProvider is wrapped inside Providers */}
          <ThemeWatcher>
            <ClientOnly>
              <SidebarProvider>
                <AppLayout>
                  {children}
                </AppLayout>
              </SidebarProvider>
            </ClientOnly>
          </ThemeWatcher>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
