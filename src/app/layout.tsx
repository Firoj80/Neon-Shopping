
"use client";

import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import './globals.css';
import { Providers } from './providers'; // Providers includes AppProvider
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from "@/components/ui/toaster";
import ClientOnly from '@/components/client-only'; // Import ClientOnly
// Removed SidebarProvider import as it's no longer exported or needed here
import { ThemeWatcher } from '@/context/theme-watcher';
import { AuthProvider } from '@/context/auth-context';


const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

// Metadata is now handled in a separate metadata.ts file or within page.tsx if dynamic
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
        <ClientOnly>
          <Providers>
            <AuthProvider>
              <ThemeWatcher>
                <AppLayout>{children}</AppLayout>
              </ThemeWatcher>
            </AuthProvider>
            <Toaster />
          </Providers>
        </ClientOnly>
      </body>
    </html>
  );
}

