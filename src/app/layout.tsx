
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';
import { Providers } from './providers';
import { AppLayout } from '@/components/layout/app-layout';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ThemeWatcher } from '@/context/theme-watcher'; // Import ThemeWatcher
import { Toaster } from "@/components/ui/toaster";
import ClientOnly from '@/components/client-only';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Neon Shopping',
  description: 'Track your expenses and manage shopping lists with a neon cyberpunk aesthetic.',
};

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
          <ThemeWatcher> {/* Wrap SidebarProvider (and thus AppLayout) with ThemeWatcher */}
            <SidebarProvider>
              <ClientOnly>
                <AppLayout>
                  {children}
                </AppLayout>
              </ClientOnly>
              <Toaster />
            </SidebarProvider>
          </ThemeWatcher>
        </Providers>
      </body>
    </html>
  );
}
