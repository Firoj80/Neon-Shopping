
import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google'; // Using Mono for a more cyberpunk feel
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster";
import { Providers } from './providers'; // Combined providers
import { AppLayout } from '@/components/layout/app-layout';
import { SidebarProvider } from '@/components/ui/sidebar'; // Import SidebarProvider
// Removed ThemeWatcher import: import { ThemeWatcher } from '@/context/theme-watcher';
import { AdInitializer } from '@/components/admob/ad-initializer'; // Import AdInitializer
import ClientOnly from '@/components/client-only'; // Import ClientOnly


const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Neon Shopping', // Updated App Name
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
            geistMono.variable,
            'font-mono antialiased min-h-screen flex flex-col bg-background', // Ensure background covers full height
            )}
        >
          <Providers>
             {/* Removed ThemeWatcher wrapper */}
               <SidebarProvider>
                  <AppLayout>
                      {children}
                  </AppLayout>
               </SidebarProvider>
                {/* Initialize AdMob once at the root level */}
                <ClientOnly>
                    <AdInitializer />
                </ClientOnly>
            <Toaster />
          </Providers>
         </body>
     </html>
  );
}
