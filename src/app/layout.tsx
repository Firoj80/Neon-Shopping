import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers'; // Providers includes AppProvider
import { AppLayout } from '@/components/layout/app-layout'; // Corrected import path
import { Toaster } from "@/components/ui/toaster";
import ClientOnly from '@/components/client-only'; // Import ClientOnly
import { SidebarProvider } from '@/components/ui/sidebar';
import { ThemeWatcher } from '@/context/theme-watcher';
import { cn } from '@/lib/utils';


const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

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
            <ClientOnly> {/* Ensures client-side only rendering for components using browser APIs */}
              <SidebarProvider> {/* SidebarProvider for sidebar state */}
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
