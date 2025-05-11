"use client"; // Root layout often needs to be client for providers

import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from "@/components/ui/toaster";
import ClientOnly from '@/components/client-only';
import { ThemeWatcher } from '@/context/theme-watcher';
import { cn } from '@/lib/utils';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

// Metadata should ideally be in a server component if possible,
// or defined statically if this remains a client component.
// For simplicity in rebuild, static definition is fine.
// export const metadata: Metadata = {
// title: 'Neon Shopping',
// description: 'Track your expenses and manage shopping lists with a neon cyberpunk aesthetic.',
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
          <ThemeWatcher>
            <ClientOnly> {/* Ensures client-side rendering for components using browser APIs */}
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
