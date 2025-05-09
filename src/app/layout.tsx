// src/app/layout.tsx
"use client"; // This layout needs to be a client component if it uses hooks or context

import { Inter } from 'next/font/google';
import type { Metadata } from 'next'; // Keep if you still define metadata (though not exported from client component)
import './globals.css';
import { Providers } from './providers'; // Providers includes AppProvider
import { AppLayout } from '@/components/layout/app-layout'; // Corrected import path
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context'; // Import AuthProvider
import ClientOnly from '@/components/client-only'; // Import ClientOnly
import { SidebarProvider } from '@/components/ui/sidebar';
import { ThemeWatcher } from '@/context/theme-watcher';
import { cn } from '@/lib/utils'; // For Inter font


const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

// Metadata can be defined here, but cannot be exported from a "use client" component.
// Next.js will still pick it up if defined in a server component further up the tree, or here if this wasn't 'use client'.
// For simplicity with 'use client', we might remove it or handle it differently if needed.
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
          inter.variable, // Apply Inter font variable
          'font-sans antialiased min-h-screen flex flex-col bg-background',
        )}
      >
        <Providers> {/* AppProvider is inside Providers */}
          <AuthProvider> {/* AuthProvider now correctly wraps ThemeWatcher and ClientOnly(AppLayout) */}
            <SidebarProvider> {/* SidebarProvider wraps AppLayout */}
                <ThemeWatcher>
                    <ClientOnly>
                        <AppLayout>
                        {children}
                        </AppLayout>
                    </ClientOnly>
                    <Toaster />
                </ThemeWatcher>
            </SidebarProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
