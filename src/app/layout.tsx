"use client";

import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';
import { Providers } from './providers'; // Providers includes AppProvider
import { AppLayout } from '@/components/layout/app-layout'; // Ensure this path is correct
import { Toaster } from "@/components/ui/toaster";
import ClientOnly from '@/components/client-only'; // Import ClientOnly
import { SidebarProvider } from '@/components/ui/sidebar';
import { ThemeWatcher } from '@/context/theme-watcher';
// Removed AuthProvider as per recent simplification requests

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
            {/* AuthProvider removed */}
            <SidebarProvider>
              <ThemeWatcher>
                <AppLayout>{children}</AppLayout>
              </ThemeWatcher>
            </SidebarProvider>
            <Toaster />
          </Providers>
        </ClientOnly>
      </body>
    </html>
  );
}
