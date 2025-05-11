// src/app/layout.tsx
"use client"; // This remains a client component due to AuthProvider and other client-side logic

import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers'; // Providers includes AppProvider
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '../context/auth-context'; // Changed to relative path
import ClientOnly from '@/components/client-only';
// Removed SidebarProvider import
import { ThemeWatcher } from '@/context/theme-watcher';
import { cn } from '@/lib/utils';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

// Metadata should be in a server component or removed from client component RootLayout
// export const metadata: Metadata = {
//   title: 'Neon Shopping',
//   description: 'Track your expenses and manage shopping lists with a neon cyberpunk aesthetic.',
//   icons: [{ rel: 'icon', url: '/favicon.ico' }],
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
          inter.variable, // Use the Inter font variable
          'font-sans antialiased min-h-screen flex flex-col bg-background',
        )}
      >
        <Providers> {/* Providers includes AppProvider */}
          <AuthProvider>
            {/* Removed SidebarProvider wrapper */}
            <ThemeWatcher>
              <ClientOnly>
                <AppLayout>
                  {children}
                </AppLayout>
              </ClientOnly>
              <Toaster />
            </ThemeWatcher>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
