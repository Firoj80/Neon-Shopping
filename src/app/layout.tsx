import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers'; 
import { AppLayout } from '@/components/layout/app-layout'; 
import { Toaster } from "@/components/ui/toaster";
import ClientOnly from '@/components/client-only';
import { SidebarProvider } from '@/components/ui/sidebar'; 
import { ThemeWatcher } from '@/context/theme-watcher';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/context/auth-context';


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
        <Providers> {/* AppProvider & AuthProvider are wrapped inside Providers */}
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
